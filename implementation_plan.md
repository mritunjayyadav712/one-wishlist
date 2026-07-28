# Implementation Plan - OneWishlist Initial Project Structure

This document outlines the proposed production-ready project structure for **OneWishlist**, separating the frontend (Next.js 15, React, TypeScript, TailwindCSS, shadcn/ui) and backend (FastAPI, Python, SQLAlchemy, Alembic, PostgreSQL with Postmark for transactional email and JWT HttpOnly auth).

## User Review Required

> [!IMPORTANT]
> **Key Decisions & Stack Alignment**:
> 1. **Frontend Architecture**: Next.js 15 with App Router (`src/` directory layout), TailwindCSS v4/v3, and shadcn/ui components.
> 2. **Backend Architecture**: FastAPI structured into `core`, `models`, `schemas`, `api/v1`, and `services`.
> 3. **Authentication Scope**: Auth features (Login, Register, Email Verification, Password Reset, JWT via HttpOnly cookies) scaffolding and schemas without adding wishlist domain models or logic.
> 4. **Deployment Scaffolding**: Configuration templates included for Vercel (`frontend`), Railway (`backend`), and Neon (`PostgreSQL`).

---

## Proposed Folder Structure

```text
one-wishlist/
├── .gitignore
├── README.md
├── frontend/                     # Next.js 15 Web Application (Vercel deployment)
│   ├── .env.example
│   ├── .gitignore
│   ├── components.json           # shadcn/ui configuration
│   ├── next.config.ts
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── public/
│   │   └── favicon.ico
│   └── src/
│       ├── app/                  # Next.js App Router pages & API routes/middleware
│       │   ├── (auth)/           # Route group for authentication pages
│       │   │   ├── login/
│       │   │   │   └── page.tsx
│       │   │   ├── register/
│       │   │   │   └── page.tsx
│       │   │   ├── verify-email/
│       │   │   │   └── page.tsx
│       │   │   ├── forgot-password/
│       │   │   │   └── page.tsx
│       │   │   └── reset-password/
│       │   │       └── page.tsx
│       │   ├── dashboard/        # Authenticated app space placeholder
│       │   │   └── page.tsx
│       │   ├── layout.tsx
│       │   ├── page.tsx          # Landing page placeholder
│       │   ├── globals.css
│       │   └── providers.tsx     # Context / Query / Auth providers
│       ├── components/
│       │   ├── ui/               # shadcn/ui primitives (button, input, card, toast, etc.)
│       │   ├── auth/             # Auth forms & UI components
│       │   └── layout/           # Header, Footer, Navbar components
│       ├── lib/
│       │   ├── api/              # Fetch API client configured with credentials & refresh logic
│       │   ├── auth/             # Client auth state & helper utilities
│       │   └── utils.ts          # clsx/tailwind-merge utilities for shadcn
│       └── types/
│           ├── index.ts
│           └── auth.ts           # Auth DTOs and User interfaces
│
└── backend/                      # FastAPI Python Application (Railway deployment)
    ├── .env.example
    ├── .gitignore
    ├── Dockerfile
    ├── alembic.ini               # Alembic database migration config
    ├── pyproject.toml / requirements.txt
    ├── railway.json              # Railway deployment config
    ├── alembic/
    │   ├── env.py
    │   ├── script.py.mako
    │   └── versions/             # Migration scripts
    └── app/
        ├── __init__.py
        ├── main.py               # FastAPI entry point & CORS/Middleware configuration
        ├── api/
        │   ├── __init__.py
        │   ├── deps.py           # Dependency injections (get_db, get_current_user, etc.)
        │   └── v1/
        │       ├── __init__.py
        │       ├── router.py     # Main API Router aggregating endpoints
        │       └── endpoints/
        │           ├── __init__.py
        │           ├── auth.py   # Login, Logout, Refresh, Register, Verify, Reset routes
        │           └── users.py  # User profile / me endpoints
        ├── core/
        │   ├── __init__.py
        │   ├── config.py         # Pydantic BaseSettings (DB, JWT, Postmark, CORS, Cookies)
        │   ├── database.py       # SQLAlchemy engine & SessionLocal factory
        │   └── security.py       # Password hashing (argon2/bcrypt) & JWT token creation/verification
        ├── models/
        │   ├── __init__.py
        │   ├── base.py           # Base declarative model with common columns (id, timestamps)
        │   ├── user.py           # SQLAlchemy User model
        │   └── token.py          # Refresh token / Verification / Reset token models
        ├── schemas/
        │   ├── __init__.py
        │   ├── auth.py           # Pydantic schemas (Login, Token, PasswordReset, EmailVerification)
        │   ├── common.py         # Response wrappers & error schemas
        │   └── user.py           # Pydantic schemas (UserRead, UserCreate, UserUpdate)
        └── services/
            ├── __init__.py
            ├── auth_service.py   # Auth business logic
            ├── email_service.py  # Postmark API client wrapper for sending transactional emails
            └── user_service.py   # User management CRUD logic
