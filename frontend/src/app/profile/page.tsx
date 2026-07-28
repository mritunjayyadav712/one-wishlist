"use client";

import { useAuth } from "@/lib/auth/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Mail, CheckCircle2, AlertCircle, Calendar, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
        <Link href="/login">
          <Button size="sm">Go to Login</Button>
        </Link>
      </div>
    );
  }

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const displayName = user.name || user.full_name || "User";

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Account Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage and view your account information and credentials.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <Card className="border-border/70 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b flex flex-row items-center gap-4 pb-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border border-primary/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <CardTitle className="text-xl font-bold">{displayName}</CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 pt-0.5">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Full Name
              </span>
              <p className="text-base font-semibold text-foreground flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                {displayName}
              </p>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Address
              </span>
              <p className="text-base font-semibold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                {user.email}
              </p>
            </div>

            {/* Verification Status */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Verification
              </span>
              <div>
                {user.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <AlertCircle className="w-3.5 h-3.5" /> Pending Verification
                  </span>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Account Status
              </span>
              <div>
                {user.is_active ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Active Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                    <AlertCircle className="w-3.5 h-3.5" /> Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Member Since */}
            <div className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Member Since
              </span>
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {formattedDate}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
