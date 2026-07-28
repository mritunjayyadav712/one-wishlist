import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]">Loading...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
