# Comprehensive Authentication & Security System Audit
**Project:** OneWishlist  
**Date:** July 29, 2026  
**Audit Scope:** End-to-end review of authentication workflows, token management, password security, cookie parameters, API validation, and frontend route protection.

---

## Executive Summary

The authentication system for **OneWishlist** is built with modern security fundamentals:
- **Password Security:** Uses direct `bcrypt` hashing with 12 rounds.
- **Session Management:** Persists JWT access and refresh tokens in `HttpOnly`, `SameSite=lax` cookies.
- **Verification & Reset Flow:** Utilizes a two-layer validation scheme (HMAC-SHA256 JWT signature check + single-use database consumption).
- **User Privacy:** Implements timing-safe credential verification and non-enumerating API responses.

This document details current strengths, identifies potential security enhancements (such as rate limiting and CSRF protection), and outlines architectural recommendations for production readiness.

---

## 1. System Strengths & Security Architecture

### 1.1 Password Hashing & Management
- **Implementation:** Direct invocation of the `bcrypt` library (`bcrypt.hashpw` with `bcrypt.gensalt(rounds=12)`).
- **Vulnerability Avoided:** Replaces legacy/unmaintained wrappers (`passlib`) to prevent version incompatibilities with newer `bcrypt` versions (≥4.x).
- **Storage:** Plain-text passwords are never stored or logged.

### 1.2 Cookie-Based Session Security
- **HttpOnly Flag:** Both `access_token` and `refresh_token` are written to `HttpOnly` cookies, preventing client-side JavaScript access and shielding tokens from Cross-Site Scripting (XSS) extraction.
- **Scope & Expiry:** Configured with `path="/"`, `SameSite=lax`, and configurable `COOKIE_SECURE=True` in production.
- **Token Lifecycles:**
  - `access_token`: Short-lived (30 minutes).
  - `refresh_token`: Long-lived (7 days).

### 1.3 Two-Layer Token Validation
Email verification and password reset processes employ a dual-validation mechanism:
1. **Cryptographic Validation (Layer 1):** Verifies HMAC-SHA256 signature, token `type` claim, and timestamp expiration.
2. **Database Single-Use Enforcement (Layer 2):** Atomic lookup and immediate deletion of the token record (`VerificationToken` / `PasswordResetToken`) upon consumption, preventing token reuse.

### 1.4 Protection Against User Enumeration & Timing Attacks
- **Login Timing Normalization:** `AuthService.authenticate_user()` runs a dummy `bcrypt` check even when the user record is not found in the database, matching execution time to prevent response-time timing attacks.
- **Opaque Errors:** Authentication endpoints return standardized error messages (e.g. `"Incorrect email or password."`) rather than revealing whether the email or password was invalid.

---

## 2. Risk Assessment & Vulnerability Analysis

### 2.1 Cross-Site Request Forgery (CSRF)
* **Risk Level:** Medium
* **Analysis:** Authentication cookies use `SameSite=lax`. While `SameSite=lax` blocks top-level cross-site POST requests from external domains in modern browsers, relying solely on cookies for state-changing endpoints (e.g., adding wishlist items, updating user profile) can present edge-case risks across subdomains or legacy browsers.
* **Recommendation:**
  - Implement a CSRF token header check (`X-CSRF-Token` or `X-Requested-With`) for state-modifying requests (`POST`, `PUT`, `DELETE`).
  - Ensure CORS origin configuration explicitly restricts allowed domains in production without wildcards.

### 2.2 Endpoint Rate Limiting (Brute-Force & Denial of Service)
* **Risk Level:** Medium
* **Analysis:** Endpoints such as `/auth/login`, `/auth/forgot-password`, and `/auth/register` currently accept unlimited requests per IP.
* **Impact:** Susceptible to automated credential stuffing, password guessing, or transactional email abuse via Resend quotas.
* **Recommendation:**
  - Introduce API rate limiting using `slowapi` or Redis-backed throttling.
  - Limit login attempts (e.g., max 5 failed attempts per minute per IP/account).
  - Limit forgot-password requests (e.g., max 3 requests per hour per email address).

### 2.3 CORS & Environment Variable Integrity
* **Risk Level:** Low–Medium
* **Analysis:** `CORS_ORIGINS` is configured with `allow_credentials=True`. If `CORS_ORIGINS` is set to `["*"]` or improperly wildcarded in production environments, standard browser security will be bypassed or compromised.
* **Recommendation:**
  - Add a field validator in `app/core/config.py` ensuring `CORS_ORIGINS` cannot contain wildcards when `allow_credentials=True`.
  - Enforce a check that raises an error at startup in `production` mode if `JWT_SECRET` equals default developer placeholder strings.

---

## 3. Code Organization & Refactoring Suggestions

### 3.1 Consolidate JWT Helpers (`security.py`)
Currently, `create_verification_token`, `create_password_reset_token`, `create_access_token`, and `create_refresh_token` repeat similar `jwt.encode` boilerplate.

**Suggested Improvement:** Refactor to a generic internal helper function:
```python
def _create_jwt(subject: str, token_type: str, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    payload = {"sub": str(subject), "type": token_type, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
```

### 3.2 Global Token Revocation Strategy
Currently, refresh tokens are verified via JWT signature. If an active session needs to be revoked globally (e.g., "Log Out of All Devices"), the server cannot revoke a valid stateless refresh token before its 7-day expiration without a revocation list.

**Suggested Improvement:**
- Include a `token_version` integer on the `User` model, incrementing it whenever "Log out all devices" is triggered, OR
- Track active refresh token UUIDs in Redis/DB for strict session revocation control.

---

## 4. Security Audit Summary Matrix

| Security Parameter | Current Status | Assessment | Recommended Action |
|---|---|---|---|
| **Password Hashing** | Native `bcrypt` (12 rounds) | ✅ Secure | Maintain current implementation |
| **Token Storage** | `HttpOnly`, `SameSite=lax` Cookies | ✅ Secure | Enforce `COOKIE_SECURE=True` in production |
| **One-Time Token Reuse** | Two-layer JWT + DB deletion | ✅ Secure | Maintain current single-use enforcement |
| **User Enumeration** | Timing-safe dummy hash check | ✅ Secure | Maintain generic response messages |
| **Route Protection** | Next.js Middleware Edge Guard | ✅ Secure | Keep protected route matchers up to date |
| **Rate Limiting** | Not Configured | ⚠️ Missing | Integrate `slowapi` on `/auth/*` endpoints |
| **CSRF Defense** | Dependent on `SameSite=lax` | ⚠️ Moderate | Add custom CSRF request header check |
| **Secrets Hygiene** | Environment Variable Driven | ℹ️ Good | Add startup check enforcing strong secrets in prod |

---
*Audit Document Generated for OneWishlist Project Workspace.*
