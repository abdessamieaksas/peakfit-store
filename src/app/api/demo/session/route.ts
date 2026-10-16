import { NextResponse } from "next/server";
import { z } from "zod";

import {
  clearDemoSession,
  createDemoSession,
  demoCredentialsConfigured,
  verifyDemoCredentials,
} from "@/lib/demo/session";

export const runtime = "nodejs";

const credentialsSchema = z.object({
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  if (!demoCredentialsConfigured()) {
    return NextResponse.json(
      { error: "La démonstration n’est pas encore configurée." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 4096) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
    input = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success || !verifyDemoCredentials(parsed.data.email, parsed.data.password)) {
    return NextResponse.json(
      { error: "Adresse e-mail ou mot de passe incorrect." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  await createDemoSession();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  await clearDemoSession();
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
