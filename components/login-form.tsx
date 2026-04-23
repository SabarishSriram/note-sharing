"use client";

// Client-side login form using next-auth Credentials provider.
// This keeps validation and sign-in logic on the client while
// the page component handles server-side redirects for logged-in users.

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormProps = {
  error?: string;
  message?: string;
};

export function LoginForm({ error, message }: LoginFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const raw = {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      setFormError("Invalid email or password.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signIn("credentials", {
        redirect: false,
        callbackUrl: "/dashboard",
        ...parsed.data,
      });

      if (!result || result.error) {
        setFormError("Invalid credentials or email domain.");
        return;
      }

      // Successful sign-in: navigate to dashboard
      router.push(result.url || "/dashboard");
      router.refresh();
    } catch (err) {
      setFormError("Something went wrong while signing in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const initialError = error ? decodeURIComponent(error) : null;
  const initialMessage = message ? decodeURIComponent(message) : null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white from-slate-900 via-[#0C4B9C] to-slate-100 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-2xl backdrop-blur"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0C4B9C]/10">
              <Image
                src="/srm%20logo.webp"
                alt="SRM Logo"
                width={32}
                height={32}
                className="rounded-full"
                priority
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0C4B9C]">
                SRM Note Share
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Welcome back
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            Use your <span className="font-medium">@srmist.edu.in</span> email
            to access SRM Note Share.
          </p>
        </div>

        {initialError && <p className="text-sm text-red-600">{initialError}</p>}
        {initialMessage && (
          <p className="text-sm text-green-600">{initialMessage}</p>
        )}
        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-800" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@srmist.edu.in"
            required
          />
        </div>

        <div className="space-y-1">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="password"
          >
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </Button>

        <p className="text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="font-medium text-[#0C4B9C] hover:underline"
          >
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}
