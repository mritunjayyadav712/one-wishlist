"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email token...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing email verification token");
      return;
    }

    apiClient("/auth/verify-email", {
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setStatus("success");
        setMessage("Your email address has been successfully verified!");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Failed to verify email address");
      });
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
        <CardFooter className="justify-center">
          {status !== "loading" && (
            <Link href="/login">
              <Button>Proceed to Sign In</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
