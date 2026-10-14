from __future__ import annotations

import json
import logging
import threading
import time
from urllib import error, request
from typing import Protocol

from fastapi import HTTPException, Request, status

from app.core.config import settings

logger = logging.getLogger("app.security.rate_limit")


class RateLimitStore(Protocol):
    def check_and_record(
        self,
        key: str,
        max_attempts: int,
        window_seconds: int,
    ) -> tuple[bool, int]:
        """
        Check if key has exceeded max_attempts in window_seconds, and record attempt.
        Returns (is_limited, retry_after_seconds).
        """
        ...

    def reset(self, key: str | None = None) -> None:
        """Reset state for a specific key or all keys."""
        ...


class InMemoryRateLimitStore:
    """
    Thread-safe sliding-window in-memory rate limiter.
    Used for local development, automated testing, and fallback when no external store is configured.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._history: dict[str, list[float]] = {}

    def check_and_record(
        self,
        key: str,
        max_attempts: int,
        window_seconds: int,
    ) -> tuple[bool, int]:
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            timestamps = self._history.get(key, [])
            # Prune timestamps outside window
            valid_timestamps = [t for t in timestamps if t > cutoff]

            if len(valid_timestamps) >= max_attempts:
                oldest_in_window = valid_timestamps[0]
                retry_after = max(1, int(oldest_in_window + window_seconds - now))
                self._history[key] = valid_timestamps
                return True, retry_after

            valid_timestamps.append(now)
            self._history[key] = valid_timestamps
            return False, 0

    def reset(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._history.clear()
            else:
                self._history.pop(key, None)


class UpstashRedisRateLimitStore:
    """
    Distributed rate-limiting store via Upstash Redis REST API.
    Does not require persistent TCP socket pools; ideal for Vercel serverless environments.
    """

    def __init__(self, rest_url: str, rest_token: str) -> None:
        self.rest_url = rest_url.rstrip("/")
        self.rest_token = rest_token
        self._fallback = InMemoryRateLimitStore()

    def check_and_record(
        self,
        key: str,
        max_attempts: int,
        window_seconds: int,
    ) -> tuple[bool, int]:
        # Upstash REST Pipeline: INCR key, then if 1, EXPIRE key window_seconds, TTL key
        redis_key = f"vibe:ratelimit:{key}"
        try:
            pipeline_url = f"{self.rest_url}/pipeline"
            payload = json.dumps([
                ["INCR", redis_key],
                ["TTL", redis_key],
            ]).encode("utf-8")

            req = request.Request(
                pipeline_url,
                data=payload,
                headers={
                    "Authorization": f"Bearer {self.rest_token}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )

            with request.urlopen(req, timeout=2.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            count = data[0].get("result", 1)
            ttl = data[1].get("result", -1)

            # If new key or no TTL set yet, set TTL
            if count == 1 or ttl < 0:
                expire_url = f"{self.rest_url}/expire/{redis_key}/{window_seconds}"
                exp_req = request.Request(
                    expire_url,
                    headers={"Authorization": f"Bearer {self.rest_token}"},
                    method="POST",
                )
                try:
                    with request.urlopen(exp_req, timeout=1.0):
                        pass
                except Exception:
                    pass
                ttl = window_seconds

            if count > max_attempts:
                return True, max(1, ttl)

            return False, 0

        except Exception as exc:
            logger.warning(
                "Upstash Redis rate-limit call failed, falling back to in-memory store: %s",
                exc,
            )
            return self._fallback.check_and_record(key, max_attempts, window_seconds)

    def reset(self, key: str | None = None) -> None:
        self._fallback.reset(key)
        if key:
            redis_key = f"vibe:ratelimit:{key}"
            del_url = f"{self.rest_url}/del/{redis_key}"
            req = request.Request(
                del_url,
                headers={"Authorization": f"Bearer {self.rest_token}"},
                method="POST",
            )
            try:
                with request.urlopen(req, timeout=1.0):
                    pass
            except Exception:
                pass


# Global singleton store
_global_rate_limit_store: RateLimitStore | None = None


def get_rate_limit_store() -> RateLimitStore:
    global _global_rate_limit_store
    if _global_rate_limit_store is None:
        if settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN:
            _global_rate_limit_store = UpstashRedisRateLimitStore(
                rest_url=settings.UPSTASH_REDIS_REST_URL,
                rest_token=settings.UPSTASH_REDIS_REST_TOKEN,
            )
        else:
            _global_rate_limit_store = InMemoryRateLimitStore()
    return _global_rate_limit_store


def get_client_ip(request: Request) -> str:
    """Extract client IP, taking into account standard proxy headers (Vercel, Cloudflare, Nginx)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # First IP in comma-separated chain is the client IP
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "127.0.0.1"


def enforce_login_rate_limit(
    request: Request,
    email: str | None = None,
    max_attempts: int | None = None,
    window_seconds: int | None = None,
) -> None:
    """
    Enforce rate limits on login attempts by client IP and target email.
    Raises HTTP 429 Too Many Requests if limits are exceeded.
    """
    store = get_rate_limit_store()
    max_att = max_attempts or settings.RATE_LIMIT_LOGIN_MAX_ATTEMPTS
    win_sec = window_seconds or settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS

    client_ip = get_client_ip(request)

    # 1. Check IP-based rate limit
    ip_key = f"login:ip:{client_ip}"
    ip_limited, ip_retry_after = store.check_and_record(
        key=ip_key,
        max_attempts=max_att,
        window_seconds=win_sec,
    )
    if ip_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts from this network. Please try again later.",
            headers={"Retry-After": str(ip_retry_after)},
        )

    # 2. Check target email-based rate limit if email provided
    if email:
        clean_email = email.lower().strip()
        email_key = f"login:email:{clean_email}"
        email_limited, email_retry_after = store.check_and_record(
            key=email_key,
            max_attempts=max_att,
            window_seconds=win_sec,
        )
        if email_limited:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts for this account. Please try again later.",
                headers={"Retry-After": str(email_retry_after)},
            )
