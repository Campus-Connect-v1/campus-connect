// import axios from 'axios';
// import type {
//   AxiosError,
//   AxiosRequestConfig,
//   AxiosResponse,
//   InternalAxiosRequestConfig,
// } from 'axios';
// import { useAuthStore } from '@/store/useAuthStore';

// const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
// const TIME_OUT = 50000;

// const axiosInstance = axios.create({
//   xsrfCookieName: 'csrftoken', // Match Django setting
//   xsrfHeaderName: 'HTTP_X_CSRFTOKEN',
//   baseURL: BASE_URL,
//   timeout: TIME_OUT,
//   headers: {
//     'Content-Type': 'application/json',
//     Accept: 'application/json',
//   },
// });

// interface ApiErrorResponse {
//   statusCode: number;
//   message: string;
//   error?: string;
// }

// interface CustomAxiosRequestConfig extends AxiosRequestConfig {
//   _retry?: boolean;
// }

// // Request interceptor
// axiosInstance.interceptors.request.use(
//   async (
//     req: InternalAxiosRequestConfig
//   ): Promise<InternalAxiosRequestConfig> => {
//     try {
//       const { authStore } = useAuthStore.getState();
//       if (authStore?.token) {
//         req.headers.Authorization = `Bearer ${authStore.token}`;
//       }
//       return req;
//     } catch (error) {
//       return Promise.reject(error);
//     }
//   },
//   (error: AxiosError): Promise<AxiosError> => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor for when token expires auto refresh
// axiosInstance.interceptors.response.use(
//   (response: AxiosResponse) => response,
//   async (error: AxiosError<ApiErrorResponse>) => {
//     const originalRequest = error.config as CustomAxiosRequestConfig;

//     if (error.response?.status === 401) {
//       originalRequest._retry = true;

//       try {
//         const newToken = await refreshToken();
//         useAuthStore.getState().setAuthData({
//           token: newToken.access,
//           expires_in: newToken.expires_in,
//         });
//         return axiosInstance(originalRequest);
//       } catch (refreshError) {
//         //useAuthStore.getState().clearAuthData();
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// axiosInstance.interceptors.response.use(
//   response => response,
//   error => {
//     if (error.code === 'ECONNABORTED') {
//       error.message = 'Request timeout - please try again';
//     } else if (!error.response) {
//       error.message = 'Network error - please check your connection';
//     }
//     return Promise.reject(error);
//   }
// );

// /**
//  * Refresh the access token using the refresh token stored in the user store.
//  * Updates the user store with the new access token and expiry.
//  */
// export const refreshToken = async () => {
//   const { authStore, setAuthData, clearAuthData } = useAuthStore.getState();
//   if (!authStore?.refresh_token) throw new Error('No refresh token available');
//   try {
//     const response = await axiosInstance.post('/auth/refresh/', {
//       refresh_token: authStore.refresh_token,
//     });
//     setAuthData({
//       token: response?.data.access,
//       expires_in: response?.data.expires_in,
//     });
//     return response?.data;
//   } catch (error) {
//     console.log(error);
//     //clearAuthData();
//     throw error;
//   }
// };

// export default axiosInstance;
