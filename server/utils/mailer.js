import nodemailer from "nodemailer";
import { COLORS } from "../helper/logger.js";

import dotenv from "dotenv";
dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use 'outlook' or other services if needed
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
  },
  // Without these, a host that silently drops outbound SMTP leaves the
  // connection hanging for ~90s and the caller waits the whole time. Fail
  // fast instead: registration already tolerates a failed send.
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Which transport actually sends.
//
// Render (and most hosts) block outbound SMTP on ports 25/465/587, so
// nodemailer times out at the TCP connect stage -- `command: 'CONN'`, before
// any password is offered. Brevo and Resend both go over HTTPS on 443, which
// is not blocked.
//
// Chosen by which key is present, or forced with MAIL_PROVIDER. SMTP remains
// the fallback and still works fine for local development.
//
//   brevo   — verifies a single SENDER ADDRESS, so it needs no domain.
//             300/day free.
//   resend  — requires a VERIFIED DOMAIN. Without one it only delivers to the
//             Resend account owner's own address.
//   smtp    — local development only.
const PROVIDER =
  process.env.MAIL_PROVIDER ||
  (process.env.BREVO_API_KEY
    ? "brevo"
    : process.env.RESEND_API_KEY
    ? "resend"
    : "smtp");

// "Campus Connect <noreply@example.com>" -> { name, email }
const parseFrom = (value) => {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value || "");
  return match
    ? { name: match[1].replace(/^"|"$/g, "") || "Campus Connect", email: match[2] }
    : { name: "Campus Connect", email: (value || "").trim() };
};

const MAIL_FROM =
  process.env.EMAIL_FROM ||
  (PROVIDER === "brevo"
    ? // Brevo sends from a verified address, which is usually the account's
      // own mailbox -- the same one already configured for SMTP.
      `Campus Connect <${process.env.EMAIL_USER || ""}>`
    : "Campus Connect <onboarding@resend.dev>");

const FROM = parseFrom(MAIL_FROM);

if (PROVIDER === "smtp") {
  // Only probe SMTP when it is the transport in use.
  transporter.verify((error) => {
    if (error) {
      console.error(
        COLORS[process.env.ERROR],
        "Mail transporter failed:",
        error.code === "ETIMEDOUT"
          ? "SMTP is unreachable (the host likely blocks outbound SMTP). Set BREVO_API_KEY or RESEND_API_KEY to send over HTTPS instead."
          : error
      );
    } else {
      console.log(COLORS[process.env.SUCCESS], "Mail transporter is ready");
    }
  });
} else {
  console.log(
    COLORS[process.env.SUCCESS],
    `Mail transport: ${PROVIDER} HTTPS API (from: ${FROM.name} <${FROM.email}>)`
  );
  if (!FROM.email) {
    console.warn(
      COLORS[process.env.WARNING],
      "No sender address. Set EMAIL_FROM (or EMAIL_USER) to the address verified with the provider."
    );
  }
}

// Brevo: https://api.brevo.com/v3/smtp/email
const sendViaBrevo = async ({ to, subject, html, text }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: FROM,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Brevo returned ${res.status}: ${body.message || JSON.stringify(body)}`
    );
  }
  return { messageId: body.messageId };
};

// Resend: https://api.resend.com/emails
const sendViaResend = async ({ to, subject, html, text }) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${FROM.name} <${FROM.email}>`,
      to: [to],
      subject,
      html,
      ...(text ? { text } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Resend returned ${res.status}: ${body.message || JSON.stringify(body)}`
    );
  }
  return { messageId: body.id };
};

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------
// Email HTML is not web HTML. Outlook renders through Word, Gmail strips
// <style> blocks in some clients and most of the box model is unreliable, so
// everything here is table-based with inline styles, a fixed 600px content
// column, and no external assets. The <style> block only carries dark-mode
// hints, which clients that ignore it simply fall back from.

const BRAND = "#2563eb";
const INK = "#111827";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
const PAGE_BG = "#f4f6fb";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

// Hidden preview line. Without it, clients show the first visible words of the
// body, which is usually the greeting and tells the reader nothing.
const preheader = (text) => `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${text}
  </div>
  <div style="display:none;max-height:0;overflow:hidden;">
    ${"&#8199;&#65279;&#847;".repeat(60)}
  </div>`;

const layout = ({ title, preview, body, footerNote }) => `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${title}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .cc-page { background:#0f1420 !important; }
    .cc-card { background:#161c2b !important; border-color:#242c3d !important; }
    .cc-ink  { color:#e8ecf5 !important; }
    .cc-muted{ color:#98a2b8 !important; }
    .cc-rule { border-color:#242c3d !important; }
    .cc-code { background:#101725 !important; border-color:#2d3a55 !important; }
  }
  @media only screen and (max-width:620px) {
    .cc-pad { padding-left:24px !important; padding-right:24px !important; }
    .cc-code-text { font-size:30px !important; letter-spacing:8px !important; }
  }
</style>
</head>
<body class="cc-page" style="margin:0;padding:0;background:${PAGE_BG};">
${preheader(preview)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       class="cc-page" style="background:${PAGE_BG};">
  <tr>
    <td align="center" style="padding:32px 12px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
             style="width:600px;max-width:100%;">

        <!-- wordmark -->
        <tr>
          <td align="left" style="padding:0 8px 16px;">
            <span style="font-family:${FONT};font-size:17px;font-weight:700;
                         letter-spacing:-0.3px;color:${BRAND};">Campus&nbsp;Connect</span>
          </td>
        </tr>

        <!-- card -->
        <tr>
          <td class="cc-card" style="background:#ffffff;border:1px solid ${LINE};
                     border-radius:14px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="cc-pad" style="padding:36px 40px 32px;font-family:${FONT};">
                  ${body}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td class="cc-pad" style="padding:20px 8px 0;font-family:${FONT};">
            <p class="cc-muted" style="margin:0 0 6px;font-size:12px;line-height:1.6;color:${MUTED};">
              ${footerNote}
            </p>
            <p class="cc-muted" style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">
              This message was sent automatically — please don't reply to it.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

const h1 = (text) =>
  `<h1 class="cc-ink" style="margin:0 0 14px;font-size:22px;line-height:1.3;
      font-weight:700;letter-spacing:-0.3px;color:${INK};">${text}</h1>`;

const p = (text, extra = "") =>
  `<p class="cc-ink" style="margin:0 0 16px;font-size:15px;line-height:1.65;
      color:#374151;${extra}">${text}</p>`;

// Bulletproof-ish button: a table cell with a background, which Outlook honours
// where a styled <a> alone would collapse.
const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"
         style="margin:26px 0 22px;">
    <tr>
      <td align="center" bgcolor="${BRAND}" style="border-radius:8px;">
        <a href="${href}"
           style="display:inline-block;padding:13px 30px;font-family:${FONT};
                  font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;
                  border-radius:8px;">${label}</a>
      </td>
    </tr>
  </table>`;

const rule = `<div class="cc-rule" style="border-top:1px solid ${LINE};margin:26px 0 20px;"></div>`;

const small = (text) =>
  `<p class="cc-muted" style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">${text}</p>`;

const emailTemplates = {
  otpVerification: (otp, name = "there") => ({
    subject: `${otp} is your Campus Connect verification code`,
    text:
      `Your Campus Connect verification code is ${otp}.\n\n` +
      `It expires in 10 minutes and can only be used once.\n\n` +
      `If you didn't create a Campus Connect account, you can ignore this email.`,
    html: layout({
      title: "Verify your email",
      // The code goes in the preview line so it is readable from the
      // notification without opening anything.
      preview: `${otp} is your verification code — expires in 10 minutes.`,
      body: `
        ${h1("Verify your email address")}
        ${p(`Hi ${name}, welcome to Campus Connect. Enter this code to finish setting up your account.`)}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="cc-code" align="center"
                style="background:#f5f8ff;border:1px solid #d6e2ff;border-radius:10px;
                       padding:24px 16px;margin:0;">
              <div class="cc-muted" style="font-family:${FONT};font-size:11px;
                   font-weight:600;letter-spacing:1.2px;text-transform:uppercase;
                   color:${MUTED};margin-bottom:10px;">Verification code</div>
              <div class="cc-code-text"
                   style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;
                          font-size:36px;font-weight:700;letter-spacing:11px;
                          line-height:1;color:${BRAND};text-indent:11px;">${otp}</div>
            </td>
          </tr>
        </table>

        <p class="cc-muted" style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${MUTED};">
          This code expires in <strong style="color:#374151;">10 minutes</strong> and can only be used once.
        </p>

        ${rule}
        ${small("Didn't sign up for Campus Connect? You can safely ignore this email — no account will be created without this code.")}
      `,
      footerNote: "Campus Connect — connecting students across campus.",
    }),
  }),

  passwordReset: (resetToken, name = "there") => {
    const link = `${process.env.CLIENT_URL || ""}/reset-password?token=${resetToken}`;
    return {
      subject: "Reset your Campus Connect password",
      text:
        `Hi ${name},\n\nReset your Campus Connect password here:\n${link}\n\n` +
        `This link expires in 1 hour. If you didn't request it, ignore this email — ` +
        `your password stays unchanged.`,
      html: layout({
        title: "Reset your password",
        preview: "Reset your Campus Connect password — this link expires in 1 hour.",
        body: `
          ${h1("Reset your password")}
          ${p(`Hi ${name}, we received a request to reset the password on your Campus Connect account. Choose a new one using the button below.`)}
          ${button(link, "Choose a new password")}
          <p class="cc-muted" style="margin:0 0 16px;font-size:13px;line-height:1.6;color:${MUTED};">
            This link expires in <strong style="color:#374151;">1 hour</strong>.
            If the button doesn't work, paste this into your browser:
          </p>
          <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;">
            <a href="${link}" style="color:${BRAND};text-decoration:underline;">${link}</a>
          </p>
          ${rule}
          ${small("Didn't request this? Ignore this email and your password will stay as it is.")}
        `,
        footerNote: "Campus Connect — connecting students across campus.",
      }),
    };
  },

  passwordResetSuccess: (_unused, name = "there") => ({
    subject: "Your Campus Connect password was changed",
    text:
      `Hi ${name},\n\nYour Campus Connect password was just changed.\n\n` +
      `If this wasn't you, contact support immediately.`,
    html: layout({
      title: "Password changed",
      preview: "Your Campus Connect password was just changed.",
      body: `
        ${h1("Your password was changed")}
        ${p(`Hi ${name}, the password on your Campus Connect account was just updated. You can sign in with it straight away.`)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#fff8f0;border:1px solid #ffdcb8;border-radius:10px;padding:16px 18px;">
              <p style="margin:0;font-family:${FONT};font-size:13.5px;line-height:1.6;color:#8a5200;">
                <strong>Wasn't you?</strong> Contact support immediately — someone
                else may have access to your account.
              </p>
            </td>
          </tr>
        </table>
        ${rule}
        ${small("For your security, we notify you whenever your password changes.")}
      `,
      footerNote: "Campus Connect — connecting students across campus.",
    }),
  }),

  welcome: (_unused, name = "there") => ({
    subject: "Welcome to Campus Connect",
    text:
      `Hi ${name},\n\nYour Campus Connect account is verified and ready.\n\n` +
      `Find classmates, join study groups, discover events and share what's ` +
      `happening on campus.`,
    html: layout({
      title: "Welcome to Campus Connect",
      preview: "Your account is verified and ready to use.",
      body: `
        ${h1("You're all set")}
        ${p(`Hi ${name}, your account is verified. Here's what you can do now.`)}

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="margin:4px 0 8px;">
          ${[
            ["Find your people", "Connect with students on your course and in your year."],
            ["Join study groups", "Revise together, share notes, split the work."],
            ["Discover events", "Everything happening on campus, in one place."],
            ["Share the moment", "Post what's going on and keep your circle in the loop."],
          ]
            .map(
              ([t, d]) => `
          <tr>
            <td style="padding:0 0 14px;">
              <p class="cc-ink" style="margin:0 0 2px;font-family:${FONT};font-size:14.5px;
                 font-weight:650;color:${INK};">${t}</p>
              <p class="cc-muted" style="margin:0;font-family:${FONT};font-size:13.5px;
                 line-height:1.6;color:${MUTED};">${d}</p>
            </td>
          </tr>`
            )
            .join("")}
        </table>

        ${process.env.CLIENT_URL ? button(process.env.CLIENT_URL, "Open Campus Connect") : ""}
        ${rule}
        ${small("Glad to have you here.")}
      `,
      footerNote: "Campus Connect — connecting students across campus.",
    }),
  }),
};

// Send email function
export const sendEmail = async (to, templateType, data) => {
  try {
    const template = emailTemplates[templateType];
    if (!template) {
      throw new Error(`Email template '${templateType}' not found`);
    }

    // FIX: Properly pass the data to the template function
    let emailContent;
    if (typeof template === "function") {
      // If template is a function, call it with the data properties
      // sendOTPEmail passes first_name, sendPasswordResetEmail passes name.
      // Reading only data.name meant every email greeted people as "there".
      emailContent = template(
        data.otp || data.resetToken,
        data.name || data.first_name || "there"
      );
    } else {
      emailContent = template;
    }

    // Identical templates whichever transport is in use.
    const payload = {
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    };
    const result =
      PROVIDER === "brevo"
        ? await sendViaBrevo(payload)
        : PROVIDER === "resend"
        ? await sendViaResend(payload)
        : await transporter.sendMail({
            from: `"${FROM.name}" <${process.env.EMAIL_USER}>`,
            ...payload,
          });

    console.log(
      `Email sent to ${to}: ${templateType} (via ${PROVIDER})`
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export const sendOTPEmail = async (email, otp, first_name, last_name) => {
  return await sendEmail(email, "otpVerification", { otp, first_name });
};

export const sendPasswordResetEmail = async (email, resetToken, name) => {
  return await sendEmail(email, "passwordReset", { resetToken, name });
};

export const sendPasswordResetSuccessEmail = async (email, name) => {
  return await sendEmail(email, "passwordResetSuccess", { name });
};

export const sendWelcomeEmail = async (email, name) => {
  return await sendEmail(email, "welcome", { name });
};

export default transporter;
