// Registration page
// Creates a new user with an @srmist.edu.in email and hashed password.

import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function RegisterPage(props: RegisterPageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();

  // If the user is already logged in, send them to the dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  const error = searchParams?.error;

  async function register(formData: FormData) {
    "use server";

    const raw = {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      redirect("/register?error=Invalid+email+or+password");
    }

    const { email, password } = parsed.data;

    const normalizedEmail = email.trim().toLowerCase();

    // Only allow SRMIST emails
    if (!normalizedEmail.endsWith("@srmist.edu.in")) {
      redirect("/register?error=Only+%40srmist.edu.in+emails+are+allowed");
    }

    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingError) {
      console.error("Supabase register lookup error", existingError);
      redirect("/register?error=Something+went+wrong");
    }

    if (existingUser) {
      redirect("/register?error=User+already+exists");
    }

    const hashed = await bcrypt.hash(password, 10);

    const { error: insertError } = await supabase.from("users").insert({
      email: normalizedEmail,
      password: hashed,
    });

    if (insertError) {
      console.error("Supabase register insert error", insertError);
      redirect("/register?error=Could+not+create+user");
    }

    redirect("/login?message=Account+created.+You+can+log+in+now.");
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-900 via-[#0C4B9C] to-slate-100 px-4 py-10">
        <form
          action={register}
          className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-2xl backdrop-blur"
        >
          <h1 className="text-xl font-semibold text-slate-900">
            Create account
          </h1>
          <p className="text-sm text-slate-600">
            Only <span className="font-medium">@srmist.edu.in</span> email
            addresses are allowed.
          </p>

          {error && (
            <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>
          )}

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="email"
            >
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
              placeholder="At least 6 characters"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Sign up
          </Button>

          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-[#0C4B9C] hover:underline"
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </>
  );
}
