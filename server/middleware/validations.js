import Joi from "joi";

export const registerValidation = (data) => {
  const schema = Joi.object({
    first_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim()
      .pattern(/^[a-zA-Z\s]+$/)
      .messages({
        "string.pattern.base": "Name can only contain letters and spaces",
        "string.empty": "Name is required",
        "string.min": "Name must be at least 2 characters long",
        "string.max": "Name cannot exceed 100 characters",
      }),
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    last_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim()
      .pattern(/^[a-zA-Z\s]+$/)
      .messages({
        "string.pattern.base": "Name can only contain letters and spaces",
        "string.empty": "Name is required",
        "string.min": "Name must be at least 2 characters long",
        "string.max": "Name cannot exceed 100 characters",
      }),
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .required()
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password cannot exceed 128 characters",
        "string.empty": "Password is required",
      }),
    university_id: Joi.string()
      .required()
      .trim()
      .pattern(/^uni_\d+$/)
      .messages({
        "string.pattern.base": "Invalid university ID format",
        "string.empty": "University ID is required",
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

export const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

export const forgotPasswordValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

export const resetPasswordValidation = (data) => {
  const schema = Joi.object({
    token: Joi.string().required().trim().messages({
      "string.empty": "Reset token is required",
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .required()
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      )
      .messages({
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password cannot exceed 128 characters",
        "string.empty": "Password is required",
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match",
        "string.empty": "Please confirm your password",
      }),
  });

  return schema.validate(data, { abortEarly: false });
};

export const verifyOTPValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    otp: Joi.string().length(6).required().pattern(/^\d+$/).messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
      "string.empty": "OTP is required",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

export const resendOTPValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};
