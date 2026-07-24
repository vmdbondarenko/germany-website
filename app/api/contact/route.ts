import { Resend } from "resend"
import { NextResponse } from "next/server"
import { isValidPhone } from "@/lib/validation/phone"
import { isValidEmail } from "@/lib/validation/email"

const resend = new Resend(process.env.RESEND_API_KEY)

// Recipients + sender are configurable via env so no addresses are hardcoded.
// CONTACT_RECIPIENTS is a comma-separated list; CONTACT_FROM must be a verified
// Resend sender (falls back to Resend's test sender for local dev).
const RECIPIENTS = (process.env.CONTACT_RECIPIENTS || "vmdbondarenko@gmail.com")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
const FROM = process.env.CONTACT_FROM || "Kontaktformular <onboarding@resend.dev>"

export async function POST(req: Request) {
  try {
    const { name, email, phone, message, subject } = await req.json()

    // Defense in depth: re-validate server-side too.
    if (!isValidEmail(String(email ?? ""))) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 })
    }
    // Phone is optional, so only validate when one was provided.
    if (phone && !isValidPhone(String(phone))) {
      return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 })
    }

    const emailSubject = subject
      ? `Anfrage: ${subject} — ${name}`
      : `Neue Nachricht von ${name}`

    await resend.emails.send({
      from: FROM,
      to: RECIPIENTS,
      replyTo: email,
      subject: emailSubject,
      text: [
        subject ? `Anfrage zu: ${subject}` : "",
        `Name: ${name}`,
        `E-Mail: ${email}`,
        `Telefon: ${phone || "—"}`,
        ``,
        `Nachricht:`,
        message || "—",
      ].filter(Boolean).join("\n"),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
