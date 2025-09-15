import axios from "axios";
import type { LoginSchema, SignupSchema } from "../schemas/authSchemas";

const api = axios.create({
  baseURL: "YOUR_API_ENDPOINT", // e.g. https://api.yourbackend.com
  headers: {
    "Content-Type": "application/json",
  },
});

export async function signInWithEmail(data: LoginSchema) {
  try {
    const response = await api.post("/login", data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function signUpWithEmail(data: SignupSchema) {
  try {
    const response = await api.post("/signup", {
      fullName: data.fullName,
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
