from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import create_access_token, decode_token
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from app.schemas.common import MessageResponse
from app.schemas.user import UserRead
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter()


# ── Cookie helpers ────────────────────────────────────────────────────────────

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Write both JWT tokens into HttpOnly, Secure cookies."""
    _cookie_kwargs = dict(
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
    )
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **_cookie_kwargs,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        **_cookie_kwargs,
    )


def _clear_auth_cookies(response: Response) -> None:
    """Expire both auth cookies immediately."""
    response.delete_cookie(key="access_token", domain=settings.COOKIE_DOMAIN)
    response.delete_cookie(key="refresh_token", domain=settings.COOKIE_DOMAIN)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Creates a new user and sends an email-verification link.
    Returns 400 if the email is already registered.
    """
    if UserService.get_by_email(db, body.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    await AuthService.register_user(db, body.email, body.password, body.name)
    return MessageResponse(
        message="Account created. Please check your inbox to verify your email."
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Log in with email and password",
)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Validates credentials, then sets ``access_token`` and
    ``refresh_token`` as HttpOnly cookies.
    """
    user = AuthService.authenticate_user(db, body.email, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    access_token, refresh_token = AuthService.generate_tokens(user.id)
    _set_auth_cookies(response, access_token, refresh_token)

    return AuthResponse(message="Login successful.", user=UserRead.model_validate(user))


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out (clear auth cookies)",
)
def logout(response: Response):
    """Clears the ``access_token`` and ``refresh_token`` cookies."""
    _clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully.")


@router.post(
    "/refresh",
    response_model=MessageResponse,
    summary="Rotate the access token using the refresh token",
)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Reads the ``refresh_token`` cookie, validates it, verifies the user
    still exists and is active, then issues a new ``access_token`` cookie.
    """
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing.",
        )

    payload = decode_token(token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token.",
        )

    user_id_str: str = payload.get("sub", "")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token.",
        )

    # Guard: ensure the user still exists and is active
    try:
        import uuid
        user = UserService.get_by_id(db, uuid.UUID(user_id_str))
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token.")

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account inactive.",
        )

    new_access = create_access_token(subject=user_id_str)
    response.set_cookie(
        key="access_token",
        value=new_access,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return MessageResponse(message="Access token refreshed.")


@router.get(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify email address via signed token (link click)",
)
def verify_email_get(token: str, db: Session = Depends(get_db)):
    """
    Called when the user clicks the verification link in their inbox:

        GET /auth/verify-email?token=<signed-jwt>

    The signed JWT is validated cryptographically first (signature + type +
    expiry), then the DB row is consumed to prevent reuse.
    Returns 400 if the token is invalid, expired, or already used.
    """
    if not AuthService.verify_email(db, token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token.",
        )
    return MessageResponse(message="Email verified successfully. You can now log in.")


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify email address via signed token (API clients)",
)
def verify_email_post(body: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    API-friendly variant — accepts ``{ "token": "<signed-jwt>" }`` in the body.
    Shares the same two-layer validation as the GET endpoint.
    """
    if not AuthService.verify_email(db, body.token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token.",
        )
    return MessageResponse(message="Email verified successfully. You can now log in.")



@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password-reset email",
)
async def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Always returns 200 regardless of whether the email exists,
    to prevent user-enumeration.
    """
    await AuthService.request_password_reset(db, body.email)
    return MessageResponse(
        message="If an account with that email exists, a reset link has been sent."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Set a new password using a reset token",
)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not AuthService.reset_password(db, body.token, body.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )
    return MessageResponse(message="Password updated. You can now log in.")
