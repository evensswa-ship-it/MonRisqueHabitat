import { NextResponse } from "next/server";
import { sendWaitlistNotification } from "@/lib/email/mrh-emails";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type WaitlistPayload = {
  email: string;
  profession: string;
  message: string;
};

function validatePayload(body: unknown): WaitlistPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Partial<WaitlistPayload>;
  if (typeof b.email !== "string" || !isValidEmail(b.email)) return null;
  if (typeof b.profession !== "string" || b.profession.trim().length === 0) return null;
  return {
    email: b.email.trim(),
    profession: b.profession.trim(),
    message: typeof b.message === "string" ? b.message.trim() : "",
  };
}

export async function POST(request: Request) {
  const body = await request.json();
  const payload = validatePayload(body);

  if (!payload) {
    return NextResponse.json(
      { message: "Merci de compléter tous les champs obligatoires." },
      { status: 400 }
    );
  }

  try {
    await sendWaitlistNotification({
      email: payload.email,
      profession: payload.profession,
      message: payload.message,
    });

    console.info("[Waitlist] New registration", {
      email: payload.email,
      profession: payload.profession,
    });

    return NextResponse.json({ message: "Inscription enregistrée." }, { status: 201 });
  } catch (error) {
    console.error("[Waitlist] Notification failed", {
      email: payload.email,
      message: error instanceof Error ? error.message : "Erreur inconnue",
    });

    return NextResponse.json(
      { message: "Une erreur est survenue. Veuillez réessayer." },
      { status: 502 }
    );
  }
}
