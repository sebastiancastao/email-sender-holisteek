import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const { to, subject, message } = await request.json();

  if (!to || !subject || !message) {
    return NextResponse.json(
      { error: "to, subject and message are required" },
      { status: 400 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject,
    text: message,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ id: data?.id });
}
