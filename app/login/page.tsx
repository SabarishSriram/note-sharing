// Login page
// Server component wrapper that redirects logged-in users away
// and renders a client-side login form using next-auth's signIn.

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { Navbar } from "@/components/navbar";

type LoginPageSearchParams = { error?: string; message?: string };

type LoginPageProps = {
  searchParams: Promise<LoginPageSearchParams>;
};

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams;
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const error = searchParams?.error;
  const message = searchParams?.message;

  return (
    <>
      <Navbar />
      <LoginForm error={error} message={message} />
    </>
  );
}
