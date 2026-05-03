"""Create or update a user for local/dev usage.

This script is intended for internal environments where user provisioning is
handled out-of-band (no self-service sign up).
"""

import argparse
import asyncio

from sqlalchemy import select

from app.core.security import hash_password
from app.database import async_session_factory
from app.models.user import User, UserRole


async def _run(email: str, password: str, role: str, full_name: str | None) -> None:
    role_value = UserRole(role).value

    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None:
            user = User(
                email=email,
                hashed_password=hash_password(password),
                full_name=full_name,
                role=role_value,
                is_active=True,
            )
            session.add(user)
            await session.commit()
            print(f"Created user: {email} ({role_value})")
            return

        user.hashed_password = hash_password(password)
        user.role = role_value
        if full_name is not None:
            user.full_name = full_name
        user.is_active = True
        await session.commit()
        print(f"Updated user: {email} ({role_value})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or update a user.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument(
        "--role",
        default=UserRole.ADMIN.value,
        choices=[r.value for r in UserRole],
    )
    parser.add_argument("--full-name", default=None)
    args = parser.parse_args()

    asyncio.run(_run(args.email, args.password, args.role, args.full_name))


if __name__ == "__main__":
    main()

