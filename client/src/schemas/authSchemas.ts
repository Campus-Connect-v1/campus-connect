import { z } from "zod";

/**
 * These mirror `server/middleware/validations.js`. When the server's Joi rules
 * change, change them here too — a client rule that is looser than the server's
 * turns a fixable inline error into an opaque 400 after a round trip.
 */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

/** Server: min 8, max 128, one lower, one upper, one digit, one of @$!%*?& */
const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use no more than 128 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number")
  .regex(/[@$!%*?&]/, "Include a special character (@ $ ! % * ? &)");

/** Server: letters and spaces only, 2-100 chars. */
const nameSchema = (field: string) =>
  z
    .string()
    .trim()
    .min(2, `${field} must be at least 2 characters`)
    .max(100, `${field} cannot exceed 100 characters`)
    .regex(/^[a-zA-Z\s]+$/, `${field} can only contain letters and spaces`);

export const signupSchema = z
  .object({
    first_name: nameSchema("First name"),
    last_name: nameSchema("Last name"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
    // Server pattern: /^uni_\d+$/. Chosen by the university picker, which
    // resolves it from the email domain via GET /university/domains.
    university_id: z.string().regex(/^uni_\d+$/, "Choose your university"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupSchema = z.infer<typeof signupSchema>;

export const otpSchema = z.object({
  otp: z.string().trim().length(6, "Enter the 6 digit code"),
});

export type OtpSchema = z.infer<typeof otpSchema>;
