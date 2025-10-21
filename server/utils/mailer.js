import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // Use 'outlook' or other services if needed
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Mail transporter failed:", error);
  } else {
    console.log("Mail transporter is ready");
  }
});

// Email templates
const emailTemplates = {
  otpVerification: (otp, name = "there") => ({
    subject: "Verify Your Email - Campus Connect",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Campus Connect</h2>
        <h3>Verify Your Email Address</h3>
        <p>Hello ${name},</p>
        <p>Thank you for registering with Campus Connect. Use the OTP below to verify your email address:</p>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0;">
          <h1 style="margin: 0; color: #2563eb; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you didn't create an account with Campus Connect, please ignore this email.</p>
        <br>
        <p>Best regards,<br>The Campus Connect Team</p>
      </div>
    `,
  }),

  passwordReset: (resetToken, name = "there") => ({
    subject: "Reset Your Password - Campus Connect",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Campus Connect</h2>
        <h3>Password Reset Request</h3>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for your Campus Connect account.</p>
        <p>Click the link below to reset your password:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}" 
             style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <br>
        <p>Best regards,<br>The Campus Connect Team</p>
      </div>
    `,
  }),

  passwordResetSuccess: (name = "there") => ({
    subject: "Password Reset Successful - Campus Connect",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Campus Connect</h2>
        <h3>Password Reset Successful</h3>
        <p>Hello ${name},</p>
        <p>Your Campus Connect password has been successfully reset.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <br>
        <p>Best regards,<br>The Campus Connect Team</p>
      </div>
    `,
  }),

  welcome: (name = "there") => ({
    subject: "Welcome to Campus Connect!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Campus Connect! 🎉</h2>
        <p>Hello ${name},</p>
        <p>Your account has been successfully created and verified. Welcome to our campus community!</p>
        <p>You can now:</p>
        <ul>
          <li>Connect with other students</li>
          <li>Join study groups</li>
          <li>Discover campus events</li>
          <li>Share your campus experiences</li>
        </ul>
        <p>Get started by exploring the app and connecting with your peers!</p>
        <br>
        <p>Best regards,<br>The Campus Connect Team</p>
      </div>
    `,
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
      emailContent = template(data.otp || data.resetToken, data.name);
    } else {
      emailContent = template;
    }

    const mailOptions = {
      from: `"Campus Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${templateType}`);
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
