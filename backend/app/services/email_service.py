import logging
from typing import Optional

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Thin wrapper around the Resend SDK for transactional emails.

    Dev mode
    --------
    When ``RESEND_API_KEY`` is ``"sandbox"`` (the default), emails are only
    logged to stdout — no real delivery occurs and no API call is made.

    Production
    ----------
    Set ``RESEND_API_KEY`` in your ``.env`` to your real Resend API key.
    The ``FROM_EMAIL`` must be a verified sender in your Resend account.
    """

    @classmethod
    def _from_address(cls) -> str:
        return f"{settings.FROM_EMAIL_NAME} <{settings.FROM_EMAIL}>"

    @classmethod
    def _send(
        cls,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
    ) -> bool:
        # ── Dev shortcut: log instead of sending ─────────────────────────────
        if settings.RESEND_API_KEY in ("sandbox", ""):
            logger.info(
                "[DEV EMAIL]\n  To: %s\n  Subject: %s\n  Body:\n%s",
                to_email,
                subject,
                text_body,
            )
            return True

        # ── Production: send via Resend SDK ──────────────────────────────────
        resend.api_key = settings.RESEND_API_KEY
        try:
            resend.Emails.send({
                "from": cls._from_address(),
                "to": [to_email],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            })
            return True
        except Exception as exc:
            logger.error("Resend delivery failed to %s: %s", to_email, exc)
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
        return cls._send(to_email, subject, html, text)

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
        return cls._send(to_email, subject, html, text)
