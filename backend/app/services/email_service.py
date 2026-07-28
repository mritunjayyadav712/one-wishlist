import logging
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Thin wrapper around the Postmark HTTP API for transactional emails.
    In development (POSTMARK_API_TOKEN="sandbox"), emails are only logged
    to stdout — no real delivery occurs.
    """

    _POSTMARK_URL = "https://api.postmarkapp.com/email"

    @classmethod
    async def _send(
        cls,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
    ) -> bool:
        # ── Dev shortcut: log instead of sending ─────────────────────────────
        if settings.POSTMARK_API_TOKEN in ("sandbox", ""):
            logger.info(
                "[DEV EMAIL]\n  To: %s\n  Subject: %s\n  Body:\n%s",
                to_email,
                subject,
                text_body,
            )
            return True

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": settings.POSTMARK_API_TOKEN,
        }
        payload = {
            "From": f"{settings.FROM_EMAIL_NAME} <{settings.FROM_EMAIL}>",
            "To": to_email,
            "Subject": subject,
            "HtmlBody": html_body,
            "TextBody": text_body,
            "MessageStream": "outbound",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(
                    cls._POSTMARK_URL, json=payload, headers=headers
                )
                response.raise_for_status()
                return True
            except Exception as exc:
                logger.error("Postmark delivery failed to %s: %s", to_email, exc)
                return False

    # ── Public helpers ────────────────────────────────────────────────────────

    @classmethod
    async def send_verification_email(cls, to_email: str, token: str) -> bool:
        link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        subject = "Verify your OneWishlist email address"
        html = (
            "<h2>Welcome to OneWishlist!</h2>"
            "<p>Click the button below to verify your email address "
            "(link expires in 24 hours):</p>"
            f'<p><a href="{link}" style="background:#7c3aed;color:#fff;'
            f'padding:10px 20px;border-radius:6px;text-decoration:none;">'
            f"Verify Email</a></p>"
            f"<p>Or paste this link into your browser:<br>{link}</p>"
        )
        text = f"Welcome to OneWishlist!\n\nVerify your email: {link}"
        return await cls._send(to_email, subject, html, text)

    @classmethod
    async def send_password_reset_email(cls, to_email: str, token: str) -> bool:
        link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        subject = "Reset your OneWishlist password"
        html = (
            "<h2>Password Reset Request</h2>"
            "<p>Click the button below to choose a new password "
            "(link expires in 1 hour):</p>"
            f'<p><a href="{link}" style="background:#7c3aed;color:#fff;'
            f'padding:10px 20px;border-radius:6px;text-decoration:none;">'
            f"Reset Password</a></p>"
            "<p>If you did not request this, you can safely ignore this email.</p>"
            f"<p>Or paste this link into your browser:<br>{link}</p>"
        )
        text = (
            f"Reset your OneWishlist password: {link}\n\n"
            "If you did not request this, please ignore this email."
        )
        return await cls._send(to_email, subject, html, text)
