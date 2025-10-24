import axios from "axios";
import type { ForgotSchema, LoginSchema, ResetPasswordSchema, SignupSchema, VerifyEmailSchema } from "../schemas/authSchemas";
import { storage } from "../utils/storage";

const api = axios.create({
  baseURL: "http://172.20.10.4:8000/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear stored auth data on unauthorized
      await storage.clearAuthData();
      
      // You can add navigation to login screen here if needed
      // For now, we'll just reject the promise
    }
    
    return Promise.reject(error);
  }
);

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
      university_id: data.university_id || "uni_1", // Default university ID
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

export async function updateProfile(data: any) {
    try {
      const response = await api.put('/user/profile', data);
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
      email: data.email,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function logout() {
  try {
    // Clear stored auth data
    await storage.clearAuthData();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Export the api instance for use in other services
export { api };

// Export a function to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = await storage.getToken();
  return !!token;
}


export async function sendConnectionRequest(userId: string) {
  try {
    const response = await api.post(`/user/connections/request`, { 
      receiver_id: userId,
      connection_note: "I'd like to connect with you.",
      shared_courses: null,
      });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

export async function cancelConnectionRequest(userId: string) {
  try {
    const response = await api.delete(`/user/connections/request`, { data: { user_id: userId } });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}
export async function getUserConnections(params?: {
  status?: "accepted" | "pending" | "declined" | "blocked";
  limit?: number;
  offset?: number;
}) {
  try {
    const response = await api.get(`/user/connections`, { params });
    return { success: true, data: response.data.connections };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// 🧭 Get connections by status
export async function getConnectionsByStatus(status: string) {
  try {
    const response = await api.get(`/user/connections/${status}`);
    return { success: true, data: response.data.connections };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}


// ✅ Respond to a connection request (accept or decline)
export async function respondToConnectionRequest(
  connectionId: string,
  action: "accept" | "decline"
) {
  try {
    const response = await api.post(`/user/connections/respond`, {
      connection_id: connectionId,
      action,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}



// post likes and omments api
export async function deletePost(postId: string) {
  try {
    const response = await api.delete(`/social/posts/${postId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// -------------------- LIKES -------------------- //

// POST /api/social/posts/:post_id/like
export async function likePost(postId: string) {
  try {
    const response = await api.post(`/social/posts/${postId}/like`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// DELETE /api/social/posts/:post_id/like
export async function unlikePost(postId: string) {
  try {
    const response = await api.delete(`/social/posts/${postId}/like`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// -------------------- COMMENTS -------------------- //

interface AddCommentData {
  content: string;
  parent_comment_id?: string;
}

// POST /api/social/posts/:post_id/comments
export async function addComment(postId: string, data: AddCommentData) {
  try {
    const response = await api.post(`/social/posts/${postId}/comments`, data);
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// GET /api/social/posts/:post_id/comments
interface GetCommentsParams {
  limit?: number;
  offset?: number;
}
export async function getComments(postId: string, params?: GetCommentsParams) {
  try {
    const response = await api.get(`/social/posts/${postId}/comments`, {
      params: params || { limit: 50, offset: 0 },
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
}