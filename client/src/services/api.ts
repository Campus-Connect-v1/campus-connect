import { api } from './authServices';

// Re-export the configured api instance for use throughout the app
export { api };

// Example API functions for different endpoints
export const userApi = {
  // Get user profile
  async getProfile() {
    try {
      const response = await api.get('/user/profile');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update user profile
  async updateProfile(data: any) {
    try {
      const response = await api.put('/user/profile', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

export const postsApi = {
  // Get posts
  async getPosts() {
    try {
      const response = await api.get('/posts');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Create post
  async createPost(data: any) {
    try {
      const response = await api.post('/posts', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data || error.message };
    }
  },
};

// Generic API helper function
export const apiCall = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, data?: any) => {
  try {
    const response = await api.request({
      method,
      url: endpoint,
      data,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data || error.message };
  }
};
