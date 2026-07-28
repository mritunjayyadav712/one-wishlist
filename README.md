# OneWishlist

Production-ready scaffolding for **OneWishlist**.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI & Styling**: React 19, TailwindCSS, shadcn/ui
- **Language**: TypeScript
- **Deployment Target**: Vercel

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM & DB**: SQLAlchemy 2.0, Alembic, PostgreSQL (Neon)
- **Authentication**: JWT, Password hashing (Argon2 / Passlib / Bcrypt), HttpOnly cookies
- **Emails**: Postmark API integration for email verification and password resets
- **Deployment Target**: Railway

## Project Structure

```text
one-wishlist/
├── frontend/    # Next.js 15 client web app
└── backend/     # FastAPI REST API & Auth service
```

## Quick Start

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```
