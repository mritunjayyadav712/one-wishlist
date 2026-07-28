"use client";

import { useAuth } from "@/lib/auth/context";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Authenticated users stay on the dedicated Welcome screen as their home page
  if (user) {
    return <WelcomeScreen user={user} />;
  }

  // Public Landing Page for unauthenticated visitors
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 max-w-3xl mx-auto">
      <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
        Production Ready Platform
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-slate-900 dark:text-slate-100">
        All your wishes in <span className="text-primary">One</span> place.
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl">
        OneWishlist simplifies registry creation, items organization, and shared gift planning with secure email authentication.
      </p>
      <div className="flex gap-4 pt-4">
        <Link href="/register">
          <Button size="lg" className="px-8">
            Get Started
          </Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline" className="px-8">
            Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
