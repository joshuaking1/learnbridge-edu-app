// src/app/login/page.tsx
import { SignInForm } from "@/components/auth/SignInForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <SignInForm />
    </main>
  );
}
