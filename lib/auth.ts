// NextAuth v4 configuration for App Router using Credentials Provider
// - Email/password login for @srmist.edu.in emails only
// - Uses Prisma to look up users and bcryptjs to verify passwords
// - Exposes `auth()` helper for server components via getServerSession

import NextAuth, { type NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { supabase } from "@/lib/supabase";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const normalizedEmail = email.trim().toLowerCase();

        // Only allow SRMIST emails
        if (!normalizedEmail.endsWith("@srmist.edu.in")) {
          throw new Error("Only @srmist.edu.in email addresses are allowed.");
        }

        const { data: user, error } = await supabase
          .from("users")
          .select("id, email, password")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (error) {
          console.error("Supabase auth user lookup error", error);
          return null;
        }
        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          password,
          user.password as string,
        );
        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};

// Helper used in server components / route handlers
export function auth() {
  return getServerSession(authOptions);
}

// Default NextAuth handler (used only in the route handler file)
export default NextAuth(authOptions);
