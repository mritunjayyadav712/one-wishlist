"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { User as UserIcon } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
          <span>🎁 OneWishlist</span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/">
                <Button variant="ghost" size="sm">
                  Home
                </Button>
              </Link>
              <Link href="/wishlist">
                <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
                  Wishlist
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
                  <UserIcon className="w-4 h-4" />
                  Profile
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
