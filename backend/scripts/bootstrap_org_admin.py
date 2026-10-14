#!/usr/bin/env python3
"""
Bootstrap script to create an initial Organization and ORG_ADMIN user.
Must be explicitly invoked by an administrator. Never executes automatically.
"""
import argparse
import getpass
from pathlib import Path
import re
import sys
from uuid import uuid4

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from email_validator import EmailNotValidError, validate_email
from sqlalchemy import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User


SLUG_REGEX = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate_slug(slug: str) -> str:
    cleaned = slug.strip().lower()
    if not cleaned or len(cleaned) > 150:
        raise ValueError("Slug must be between 1 and 150 characters.")
    if not SLUG_REGEX.match(cleaned):
        raise ValueError(
            "Slug must contain only lowercase alphanumeric characters and single hyphens (e.g. 'acme-corp')."
        )
    return cleaned


def validate_admin_email(email: str) -> str:
    cleaned = email.strip().lower()
    try:
        valid = validate_email(cleaned, check_deliverability=False)
        normalized = valid.normalized
        if len(normalized) > 255:
            raise ValueError("Email must be 255 characters or fewer.")
        return normalized
    except EmailNotValidError as e:
        raise ValueError(f"Invalid email address: {e}")


def check_preconditions(db) -> Role:
    """Verify database connectivity and existence of ORG_ADMIN role."""
    stmt = select(Role).where(Role.name == "ORG_ADMIN")
    role = db.execute(stmt).scalar_one_or_none()
    if not role:
        raise RuntimeError(
            "Required system role 'ORG_ADMIN' was not found in the database. "
            "Ensure baseline database migrations are applied."
        )
    return role


def main():
    parser = argparse.ArgumentParser(
        description="Bootstrap initial organization and administrator account."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Perform a non-destructive dry-run check of database connectivity and prerequisites.",
    )
    args = parser.parse_args()

    # Step 1: Preconditions precheck in a short-lived session
    try:
        with SessionLocal() as precheck_db:
            role = check_preconditions(precheck_db)
            role_name = role.name
            role_id = role.id
    except Exception as exc:
        print(f"Precheck failed: {type(exc).__name__}: {exc}")
        sys.exit(1)

    if args.check:
        print("=" * 60)
        print("BOOTSTRAP PRECHECK OK")
        print(f"Target Environment: {settings.APP_ENV}")
        print(f"Application Name  : {settings.APP_NAME}")
        print(f"Role Verified     : {role_name} ({role_id})")
        print("Database status   : Connected, ready for bootstrap.")
        print("=" * 60)
        return

    # Precheck session is closed. No database session held during interactive input.
    print("\n" + "=" * 60)
    print("VIBE HRM: Initial Organization & Administrator Bootstrap")
    print(f"Environment: {settings.APP_ENV}")
    print("=" * 60 + "\n")

    # 1. Organization Name
    org_name = input("Enter Organization Name: ").strip()
    if not org_name or len(org_name) > 150:
        print("Error: Organization name is required (max 150 characters).")
        sys.exit(1)

    # 2. Organization Slug
    raw_slug = input("Enter Organization Slug (e.g. 'vibe-technologies'): ").strip()
    try:
        org_slug = validate_slug(raw_slug)
    except ValueError as err:
        print(f"Error: {err}")
        sys.exit(1)

    # 3. Admin Email
    raw_email = input("Enter Administrator Email: ").strip()
    try:
        admin_email = validate_admin_email(raw_email)
    except ValueError as err:
        print(f"Error: {err}")
        sys.exit(1)

    # 4. Secure Password Prompt
    pwd = getpass.getpass("Enter Administrator Password (min 8 characters): ")
    if len(pwd) < 8:
        print("Error: Password must be at least 8 characters long.")
        sys.exit(1)

    pwd_confirm = getpass.getpass("Confirm Administrator Password: ")
    if pwd != pwd_confirm:
        print("Error: Passwords do not match.")
        sys.exit(1)

    # 5. Explicit Confirmation
    print("\nSummary of records to create:")
    print(f" - Organization Name: {org_name}")
    print(f" - Organization Slug: {org_slug}")
    print(f" - Admin Email      : {admin_email}")
    print(f" - Assigned Role    : {role_name}")
    print(" - Active Status    : True (Verified: True)")

    confirm = input("\nProceed with creation? [y/N]: ").strip().lower()
    if confirm not in ("y", "yes"):
        print("Bootstrap cancelled by user. No records created.")
        return

    # 6. Atomic Transaction on a Fresh Session
    try:
        with SessionLocal() as db:
            with db.begin():
                # Re-verify preconditions inside the transaction
                role = check_preconditions(db)

                # Re-verify slug uniqueness inside the transaction
                existing_org = db.execute(
                    select(Organization).where(Organization.slug == org_slug)
                ).scalar_one_or_none()
                if existing_org:
                    raise ValueError(f"An organization with slug '{org_slug}' already exists.")

                # Re-verify email uniqueness inside the transaction
                existing_user = db.execute(
                    select(User).where(User.email == admin_email)
                ).scalar_one_or_none()
                if existing_user:
                    raise ValueError(f"A user with email '{admin_email}' already exists.")

                org = Organization(
                    id=uuid4(),
                    name=org_name,
                    slug=org_slug,
                    email=admin_email,
                    phone=None,
                    is_active=True,
                )
                db.add(org)
                db.flush()  # assign org.id and enforce foreign key / constraints

                password_hash = get_password_hash(pwd)

                admin_user = User(
                    id=uuid4(),
                    organization_id=org.id,
                    role_id=role.id,
                    email=admin_email,
                    password_hash=password_hash,
                    is_active=True,
                    is_verified=True,
                )
                db.add(admin_user)

                # Capture values before commit/session-close to avoid DetachedInstanceError
                created_org_id = org.id
                created_org_name = org.name
                created_user_id = admin_user.id
                created_user_email = admin_user.email

        print("\n" + "=" * 60)
        print("BOOTSTRAP SUCCESSFUL")
        print(f"Organization Created : {created_org_name} (ID: {created_org_id})")
        print(f"Administrator Created: {created_user_email} (ID: {created_user_id})")
        print("=" * 60 + "\n")

    except Exception as exc:
        print(f"\nBootstrap failed: {type(exc).__name__}: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
