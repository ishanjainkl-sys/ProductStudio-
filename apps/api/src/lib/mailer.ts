import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { loadEnv } from "../config/env.js";

export interface MailDelivery {
  messageId: string;
  /** Ethereal inbox preview URL when using the free test mailer. */
  previewUrl: string | null;
}

let transporterPromise: Promise<Transporter> | null = null;
let etherealUser: string | null = null;

async function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
}

async function createTransporter(): Promise<Transporter> {
  const env = loadEnv();

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  // Free Ethereal test mailbox — no API key required for local/dev.
  const testAccount = await nodemailer.createTestAccount();
  etherealUser = testAccount.user;
  console.info(
    `[mailer] Using free Ethereal mailbox ${testAccount.user} (open preview URLs from API responses)`,
  );
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

function brandShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f6f8;font-family:Inter,Segoe UI,sans-serif;color:#111318;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:520px;background:#ffffff;border:1px solid #e8eaee;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#0f1f4d;padding:20px 24px;color:#ffffff;font-weight:700;font-size:16px;">
                ProductStudio
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;">
                <h1 style="margin:0 0 12px;font-size:22px;letter-spacing:-0.03em;">${title}</h1>
                ${bodyHtml}
                <p style="margin:24px 0 0;font-size:12px;color:#6b7280;line-height:1.5;">
                  If you did not request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOtpEmail(input: {
  to: string;
  code: string;
  purpose: "SIGNUP" | "PASSWORD_RESET";
}): Promise<MailDelivery> {
  const env = loadEnv();
  const transporter = await getTransporter();
  const isSignup = input.purpose === "SIGNUP";
  const title = isSignup ? "Verify your ProductStudio account" : "Reset your ProductStudio password";
  const intro = isSignup
    ? "Use this one-time code to finish creating your account."
    : "Use this one-time code to reset your password.";
  const appOrigin = env.CORS_ORIGIN.replace(/\/$/, "");
  // Signup uses the dedicated OTP page; password reset returns users to the login recovery flow.
  const actionUrl = isSignup
    ? `${appOrigin}/verify-otp?purpose=signup&email=${encodeURIComponent(input.to)}`
    : `${appOrigin}/login?intent=forgot&step=otp&email=${encodeURIComponent(input.to)}`;
  const actionLabel = isSignup ? "Open verification page" : "Enter code on sign-in page";

  const info = await transporter.sendMail({
    from: env.SMTP_FROM || `"ProductStudio" <${etherealUser ?? "noreply@productstudio.local"}>`,
    to: input.to,
    subject: isSignup ? `${input.code} is your ProductStudio verification code` : `${input.code} is your ProductStudio reset code`,
    text: `${intro}\n\nYour code: ${input.code}\n\nOr open: ${actionUrl}\n\nThis code expires in 10 minutes.`,
    html: brandShell(
      title,
      `<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#555c68;">${intro}</p>
       <div style="display:inline-block;padding:14px 22px;border-radius:12px;background:#eef4ff;color:#0f1f4d;font-size:28px;font-weight:700;letter-spacing:0.28em;">
         ${input.code}
       </div>
       <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">This code expires in 10 minutes.</p>
       <p style="margin:20px 0 0;">
         <a href="${actionUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#3b6ff0;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">
           ${actionLabel}
         </a>
       </p>
       <p style="margin:12px 0 0;font-size:12px;color:#6b7280;line-height:1.5;word-break:break-all;">
         Or paste this link: ${actionUrl}
       </p>`,
    ),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (env.NODE_ENV !== "production") {
    console.info(`[mailer] OTP for ${input.to}: ${input.code}`);
  }
  if (previewUrl) {
    console.info(`[mailer] OTP preview for ${input.to}: ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl: typeof previewUrl === "string" ? previewUrl : null,
  };
}
