import Joi from "joi";

// Validation middleware generator
const createValidationMiddleware = (schema) => {
  return (req, res, next) => {
    let dataToValidate;

    if (req.method === "GET") {
      dataToValidate = req.query;
    } else {
      dataToValidate = req.body;
    }

    // For param validations, use req.params
    const { error } = schema.validate(dataToValidate, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.details.map((detail) => ({
          field: detail.path[0],
          message: detail.message,
        })),
      });
    }

    next();
  };
};

// Auth validations (direct exports)
export const registerValidation = (data) =>
  Joi.object({
    first_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim()
      .pattern(/^[a-zA-Z\s]+$/)
      .messages({
        "string.pattern.base": "Name can only contain letters and spaces",
        "string.empty": "First name is required",
        "string.min": "First name must be at least 2 characters long",
        "string.max": "First name cannot exceed 100 characters",
      }),
    last_name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim()
      .pattern(/^[a-zA-Z\s]+$/)
      .messages({
        "string.pattern.base": "Name can only contain letters and spaces",
        "string.empty": "Last name is required",
        "string.min": "Last name must be at least 2 characters long",
        "string.max": "Last name cannot exceed 100 characters",
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
  }).validate(data, { abortEarly: false });

export const loginValidation = (data) =>
  Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
    }),
  }).validate(data, { abortEarly: false });

export const forgotPasswordValidation = (data) =>
  Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
  }).validate(data, { abortEarly: false });

export const resetPasswordValidation = (data) =>
  Joi.object({
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
  }).validate(data, { abortEarly: false });

export const verifyOTPValidation = (data) =>
  Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
    otp: Joi.string().length(6).required().pattern(/^\d+$/).messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.base": "OTP must contain only numbers",
      "string.empty": "OTP is required",
    }),
  }).validate(data, { abortEarly: false });

export const resendOTPValidation = (data) =>
  Joi.object({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
    }),
  }).validate(data, { abortEarly: false });

// User validation middleware (direct exports)
export const updateProfileValidation = createValidationMiddleware(
  Joi.object({
    first_name: Joi.string().min(1).max(100).optional().messages({
      "string.min": "First name must be at least 1 character",
      "string.max": "First name cannot exceed 100 characters",
    }),
    last_name: Joi.string().min(1).max(100).optional().messages({
      "string.min": "Last name must be at least 1 character",
      "string.max": "Last name cannot exceed 100 characters",
    }),
    profile_picture_url: Joi.string().uri().optional().messages({
      "string.uri": "Profile picture must be a valid URL",
    }),
    phone_number: Joi.string()
      .pattern(/^\+?[\d\s-()]{10,}$/)
      .optional()
      .messages({
        "string.pattern.base": "Phone number must be valid",
      }),
    program: Joi.string().max(100).optional().messages({
      "string.max": "Program must be less than 100 characters",
    }),
    graduation_year: Joi.number()
      .integer()
      .min(2000)
      .max(2030)
      .optional()
      .messages({
        "number.min": "Graduation year must be after 2000",
        "number.max": "Graduation year must be before 2030",
      }),
    bio: Joi.string().max(1000).optional().messages({
      "string.max": "Bio must be less than 1000 characters",
    }),
    profile_headline: Joi.string().max(255).optional().messages({
      "string.max": "Headline must be less than 255 characters",
    }),
    linkedin_url: Joi.string().uri().optional().messages({
      "string.uri": "LinkedIn URL must be valid",
    }),
    website_url: Joi.string().uri().optional().messages({
      "string.uri": "Website URL must be valid",
    }),
    date_of_birth: Joi.date().max("now").optional().messages({
      "date.max": "Date of birth cannot be in the future",
    }),
    show_location_preference: Joi.string()
      .valid("friends", "university", "none")
      .optional()
      .messages({
        "any.only": "Invalid location preference",
      }),
    show_status_preference: Joi.string()
      .valid("friends", "university", "none")
      .optional()
      .messages({
        "any.only": "Invalid status preference",
      }),
    timezone: Joi.string().max(50).optional().messages({
      "string.max": "Timezone must be less than 50 characters",
    }),
    notification_email: Joi.boolean().optional(),
    notification_push: Joi.boolean().optional(),
    privacy_profile: Joi.string()
      .valid("public", "university", "friends", "private")
      .optional()
      .messages({
        "any.only": "Invalid privacy setting",
      }),
  })
);

export const interestValidation = createValidationMiddleware(
  Joi.object({
    interest_type: Joi.string()
      .valid("academic", "hobby", "career", "sports", "arts")
      .required()
      .messages({
        "any.only": "Invalid interest type",
        "string.empty": "Interest type is required",
      }),
    interest_name: Joi.string().min(1).max(100).required().messages({
      "string.min": "Interest name must be at least 1 character",
      "string.max": "Interest name cannot exceed 100 characters",
      "string.empty": "Interest name is required",
    }),
    skill_level: Joi.string()
      .valid("beginner", "intermediate", "advanced", "expert")
      .optional()
      .messages({
        "any.only": "Invalid skill level",
      }),
  })
);

export const courseValidation = createValidationMiddleware(
  Joi.object({
    course_code: Joi.string().min(1).max(50).required().messages({
      "string.min": "Course code must be at least 1 character",
      "string.max": "Course code cannot exceed 50 characters",
      "string.empty": "Course code is required",
    }),
    course_name: Joi.string().min(1).max(255).required().messages({
      "string.min": "Course name must be at least 1 character",
      "string.max": "Course name cannot exceed 255 characters",
      "string.empty": "Course name is required",
    }),
    department_id: Joi.string().max(50).optional().messages({
      "string.max": "Department ID must be less than 50 characters",
    }),
    semester: Joi.string().max(50).optional().messages({
      "string.max": "Semester must be less than 50 characters",
    }),
    academic_year: Joi.number()
      .integer()
      .min(2000)
      .max(2030)
      .optional()
      .messages({
        "number.min": "Academic year must be after 2000",
        "number.max": "Academic year must be before 2030",
      }),
    is_current: Joi.boolean().optional(),
  })
);

export const searchValidation = createValidationMiddleware(
  Joi.object({
    q: Joi.string().max(100).optional().messages({
      "string.max": "Search query too long",
    }),
    university_id: Joi.string().max(50).optional().messages({
      "string.max": "Invalid university ID",
    }),
    program: Joi.string().max(100).optional().messages({
      "string.max": "Program name too long",
    }),
    graduation_year: Joi.number()
      .integer()
      .min(2000)
      .max(2030)
      .optional()
      .messages({
        "number.min": "Invalid graduation year",
        "number.max": "Invalid graduation year",
      }),
    interest: Joi.string().max(100).optional().messages({
      "string.max": "Interest name too long",
    }),
    course: Joi.string().max(255).optional().messages({
      "string.max": "Course name too long",
    }),
    limit: Joi.number().integer().min(1).max(100).optional().messages({
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100",
    }),
  })
);

export const recommendationsValidation = createValidationMiddleware(
  Joi.object({
    limit: Joi.number().integer().min(1).max(50).optional().messages({
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 50",
    }),
  })
);

export const userIdParamValidation = createValidationMiddleware(
  Joi.object({
    userId: Joi.string().min(1).max(50).required().messages({
      "string.min": "Invalid user ID",
      "string.max": "Invalid user ID",
      "string.empty": "User ID is required",
    }),
  })
);

export const interestIdParamValidation = createValidationMiddleware(
  Joi.object({
    interestId: Joi.string().min(1).max(50).required().messages({
      "string.min": "Invalid interest ID",
      "string.max": "Invalid interest ID",
      "string.empty": "Interest ID is required",
    }),
  })
);

export const courseIdParamValidation = createValidationMiddleware(
  Joi.object({
    courseId: Joi.string().min(1).max(50).required().messages({
      "string.min": "Invalid course ID",
      "string.max": "Invalid course ID",
      "string.empty": "Course ID is required",
    }),
  })
);
