import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getShippingQuote } from "@/features/shipping/server/shipping-repository";

export async function POST(request: Request) {
  try {
    const quote = await getShippingQuote(await request.json());
    return NextResponse.json({ quote });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Demande invalide." },
        { status: 400 },
      );
    }

    console.error("Shipping estimate failed", error);
    return NextResponse.json(
      { error: "Le tarif n'est pas disponible pour le moment." },
      { status: 500 },
    );
  }
}
