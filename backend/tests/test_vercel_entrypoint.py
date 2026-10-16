import asyncio
import json
from pathlib import Path
import unittest

from fastapi import FastAPI


class VercelEntrypointRoutingTestCase(unittest.TestCase):
    """
    Regression test suite ensuring that Vercel serverless routing,
    the api/index.py FastAPI ASGI entry point, and Vercel rewrites
    behave correctly and do not produce 405 Method Not Allowed or route to index.html.
    """

    @classmethod
    def setUpClass(cls):
        # Locate project root and backend root
        cls.backend_dir = Path(__file__).resolve().parent.parent
        cls.root_dir = cls.backend_dir.parent
        cls.vercel_json_path = cls.root_dir / "vercel.json"
        cls.api_index_path = cls.root_dir / "api" / "index.py"

    def test_vercel_json_configuration(self):
        """Verify vercel.json includes backend files and routes API/health before SPA catch-all."""
        self.assertTrue(self.vercel_json_path.exists(), "vercel.json must exist in root directory")
        with open(self.vercel_json_path, "r", encoding="utf-8") as f:
            v_cfg = json.load(f)

        # 1. Verify functions includeFiles configuration
        self.assertIn("functions", v_cfg)
        self.assertIn("api/index.py", v_cfg["functions"])
        include_files = v_cfg["functions"]["api/index.py"].get("includeFiles", "")
        self.assertIn("backend/**", include_files, "api/index.py must include backend/** in bundle")

        # 2. Verify rewrites exist and are ordered correctly
        self.assertIn("rewrites", v_cfg)
        rewrites = v_cfg["rewrites"]
        self.assertGreater(len(rewrites), 1, "Must have multiple rewrite rules")

        # Find API and health rewrites
        api_destinations = [r["destination"] for r in rewrites if "/api" in r["source"]]
        health_destinations = [r["destination"] for r in rewrites if "/health" in r["source"]]

        self.assertTrue(any(d == "/api/index.py" for d in api_destinations), "API routes must rewrite to /api/index.py")
        self.assertTrue(any(d == "/api/index.py" for d in health_destinations), "Health routes must rewrite to /api/index.py")

        # Catch-all rewrite must be the last rule and rewrite to /index.html
        last_rule = rewrites[-1]
        self.assertEqual(last_rule["source"], "/(.*)")
        self.assertEqual(last_rule["destination"], "/index.html")

    def test_api_index_exports_fastapi_app(self):
        """Verify api/index.py can be imported and exports a valid FastAPI instance."""
        import sys
        if str(self.root_dir) not in sys.path:
            sys.path.insert(0, str(self.root_dir))

        import api.index  # noqa: F401
        self.assertTrue(hasattr(api.index, "app"))
        self.assertIsInstance(api.index.app, FastAPI)

    def _call_asgi(self, app, method: str, path: str, body: bytes = b"", headers: list[tuple[bytes, bytes]] | None = None):
        """Helper to invoke ASGI app directly."""
        req_headers = headers or []
        if body and not any(h[0].lower() == b"content-type" for h in req_headers):
            req_headers.append((b"content-type", b"application/json"))
        if body and not any(h[0].lower() == b"content-length" for h in req_headers):
            req_headers.append((b"content-length", str(len(body)).encode("ascii")))

        scope = {
            "type": "http",
            "http_version": "1.1",
            "method": method,
            "path": path,
            "raw_path": path.encode("ascii"),
            "query_string": b"",
            "headers": req_headers,
        }

        body_sent = False
        messages = []

        async def receive():
            nonlocal body_sent
            if not body_sent:
                body_sent = True
                return {"type": "http.request", "body": body, "more_body": False}
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message):
            messages.append(message)

        asyncio.run(app(scope, receive, send))

        status_code = None
        resp_headers = {}
        resp_body = b""
        for msg in messages:
            if msg["type"] == "http.response.start":
                status_code = msg["status"]
                resp_headers = {k.decode("latin1").lower(): v.decode("latin1") for k, v in msg.get("headers", [])}
            elif msg["type"] == "http.response.body":
                resp_body += msg.get("body", b"")

        return status_code, resp_headers, resp_body

    def test_health_endpoints_return_200_json(self):
        """Verify all health endpoints return HTTP 200 with JSON status."""
        import api.index
        app = api.index.app

        for path in ("/health", "/api/health", "/api/v1/health"):
            status_code, headers, body = self._call_asgi(app, "GET", path)
            self.assertEqual(status_code, 200, f"{path} should return 200")
            self.assertIn("application/json", headers.get("content-type", ""))
            data = json.loads(body.decode("utf-8"))
            self.assertEqual(data.get("status"), "ok")

    def test_auth_login_post_does_not_return_405_or_html(self):
        """
        Critical regression: verify POST /api/v1/auth/login and POST /v1/auth/login
        reach the real authentication route, parse JSON payload, and return 401 JSON for invalid credentials
        instead of 405 Method Not Allowed or HTML.
        """
        import api.index
        app = api.index.app

        payload = json.dumps({"email": "nonexistent@example.com", "password": "wrongpassword"}).encode("utf-8")

        for path in ("/api/v1/auth/login", "/v1/auth/login"):
            status_code, headers, body = self._call_asgi(app, "POST", path, body=payload)
            self.assertEqual(
                status_code, 401,
                f"{path} should return 401 Unauthorized for invalid credentials, not 405 Method Not Allowed"
            )
            self.assertIn("application/json", headers.get("content-type", ""))
            data = json.loads(body.decode("utf-8"))
            self.assertEqual(data.get("detail"), "Invalid email or password")

    def test_cors_preflight_on_login(self):
        """Verify OPTIONS CORS preflight from Vercel deployment returns 200 with appropriate headers."""
        import api.index
        app = api.index.app

        headers = [
            (b"origin", b"https://vibe-hrm-ruby.vercel.app"),
            (b"access-control-request-method", b"POST"),
            (b"access-control-request-headers", b"content-type,authorization"),
        ]

        status_code, resp_headers, _ = self._call_asgi(app, "OPTIONS", "/api/v1/auth/login", headers=headers)
        self.assertEqual(status_code, 200)
        self.assertEqual(resp_headers.get("access-control-allow-origin"), "https://vibe-hrm-ruby.vercel.app")
        self.assertIn("POST", resp_headers.get("access-control-allow-methods", ""))
