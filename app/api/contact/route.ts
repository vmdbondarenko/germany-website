import { Resend } from "resend"
import { NextResponse } from "next/server"
import { isValidPhone } from "@/lib/validation/phone"
import { isValidEmail } from "@/lib/validation/email"

const resend = new Resend(process.env.RESEND_API_KEY)

const RECIPIENTS = ["vmdbondarenko@gmail.com", "maryna@jwdevelopment.net"]

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
      ? `Zapytanie: ${subject} — ${name}`
      : `Nowa wiadomość od ${name}`

    await resend.emails.send({
      from: "Formularz kontaktowy <kontakt@vmd-development.com>",
      to: RECIPIENTS,
      replyTo: email,
      subject: emailSubject,
      text: [
        subject ? `Zapytanie dot.: ${subject}` : "",
        `Imię i nazwisko: ${name}`,
        `Email: ${email}`,
        `Telefon: ${phone || "—"}`,
        ``,
        `Wiadomość:`,
        message || "—",
      ].filter(Boolean).join("\n"),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Resend error:", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
