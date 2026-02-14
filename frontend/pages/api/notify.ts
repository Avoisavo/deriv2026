import type { NextApiRequest, NextApiResponse } from "next";
import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.TWILIO_FROM_EMAIL ?? process.env.SENDGRID_FROM ?? "noreply@example.com";
const DEFAULT_TO = process.env.SENDGRID_TO;

export interface NotifyRequestBody {
  prompt: string;
  consequences: string;
  solution: string;
  outcome: string;
  to?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SENDGRID_API_KEY) {
    return res.status(500).json({ error: "SENDGRID_API_KEY is not configured" });
  }

  let body: NotifyRequestBody;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { prompt, consequences, solution, outcome, to: toEmail } = body;
  const to = toEmail ?? DEFAULT_TO;
  if (!to || typeof to !== "string") {
    return res.status(400).json({ error: "Missing recipient: set 'to' in body or SENDGRID_TO in env" });
  }

  sgMail.setApiKey(SENDGRID_API_KEY);

  const text = [
    "Real-time AI decision",
    "",
    "Prompt: " + (prompt ?? ""),
    "",
    "Consequences:",
    consequences ?? "",
    "",
    "Solution:",
    solution ?? "",
    "",
    "Outcome:",
    outcome ?? "",
  ].join("\n");

  try {
    await sgMail.send({
      to,
      from: FROM_EMAIL,
      subject: "Real-time AI decision",
      text,
    });
    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const sg = err as { code?: number; response?: { body?: unknown } };
    console.error("SendGrid error:", err);
    if (sg.response?.body) console.error("SendGrid response:", JSON.stringify(sg.response.body, null, 2));
    const message = err instanceof Error ? err.message : "Failed to send email";
    // 403 = usually "from" sender not verified in SendGrid (Settings → Sender Authentication)
    const hint = sg.code === 403
      ? " Verify the from address in SendGrid: Settings → Sender Authentication (Single Sender or Domain)."
      : "";
    return res.status(500).json({ error: message + hint });
  }
}
