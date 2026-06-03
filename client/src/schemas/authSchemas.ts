import { z } from "zod";

// Only university emails (.edu or .ac domains) are valid on Campus Connect —
// enforced on BOTH login and signup. Shared so the rule stays in one place.
export const universityEmail = z
  .string()
  .email("Invalid email address")
  .refine(
    (val) =>
      val.endsWith(".edu") || val.includes(".edu.") || val.includes(".ac."),
    {
      message: "Use your university email (.edu or .ac domains)",
    },
  );

export const loginSchema = z.object({
  email: universityEmail,
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type LoginSchema = z.infer<typeof loginSchema>;


const nameField = (label: string) =>
  z
    .string()
    .min(2, `${label} must be at least 2 characters long`)
    .max(100, `${label} cannot exceed 100 characters`)
    .regex(/^[a-zA-Z\s]+$/, `${label} can only contain letters and spaces`);

// Mirrors server-side Joi rules in middleware/validations.js so the client
// rejects the same input the API would (8+ chars, mixed case, digit, symbol).
export const signupSchema = z
  .object({
    first_name: nameField("First name"),
    last_name: nameField("Last name"),
    email: universityEmail,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(128, "Password cannot exceed 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must include an uppercase letter, a lowercase letter, a number, and a special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupSchema = z.infer<typeof signupSchema>;


