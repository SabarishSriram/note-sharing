// User registration API
// - Accepts JSON: { email, password }
// - Only allows @srmist.edu.in email addresses
// - Hashes password with bcryptjs and stores user in the database

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { prisma } from "../../../lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  if (!email.endsWith("@srmist.edu.in")) {
    return NextResponse.json(
      { error: "Only @srmist.edu.in email addresses are allowed" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
    },
  });

  return NextResponse.json(
    { id: user.id, email: user.email, createdAt: user.createdAt },
    { status: 201 },
  );
}
