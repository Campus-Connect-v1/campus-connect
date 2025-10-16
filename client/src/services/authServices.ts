import axios from "axios";
import type { ForgotSchema, LoginSchema, ResetPasswordSchema, SignupSchema, VerifyEmailSchema } from "../schemas/authSchemas";

const api = axios.create({
  baseURL: "http://localhost:8000/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

export async function signInWithEmail(data: LoginSchema) {
  try {
    const response = await api.post("/auth/login", data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function signUpWithEmail(data: SignupSchema) {
  try {
    const response = await api.post("/auth/register", {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      password: data.password,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// This is called from GoogleLoginButton after getting an accessToken
export async function signInWithGoogle(accessToken: string) {
  try {
    const response = await api.post("/google-login", { accessToken });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}


export async function forgotPassword(data: ForgotSchema) {
  try {
    const response = await api.post("/auth/forgot-password", {
      email: data.email,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}
export async function resetPassword(data: ResetPasswordSchema) {
  try {
    const response = await api.post("/auth/reset-password", {
      password: data.password,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function resendOtp(data: VerifyEmailSchema) {
  try {
    const response = await api.post("/auth/resend-otp", {
      email: data.email,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}
export async function verifyOtp(data: any) {
  try {
    const response = await api.post("/auth/verify-otp", {
      otp: data.otp,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}



