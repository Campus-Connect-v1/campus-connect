/**
 * useAuth Hook
 * 
 * A custom hook for managing authentication state.
 * Provides access to the current authenticated user.
 * 
 * In a real app, this would integrate with Firebase Auth or similar.
 * For now, uses mock data for development.
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  profilePictureUrl: string | null;
  profileHeadline?: string;
  universityId?: string;
}

interface UseAuthReturn {
  /** Current authenticated user */
  user: User | null;
  /** Whether auth state is loading */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Sign out the user */
  signOut: () => Promise<void>;
  /** Update user data */
  updateUser: (updates: Partial<User>) => Promise<void>;
}

// Mock user for development
const MOCK_USER: User = {
  id: 'user_123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@university.edu',
  username: 'johndoe',
  profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  profileHeadline: 'Computer Science Student',
  universityId: 'uni_1',
};

const AUTH_STORAGE_KEY = 'campus_connect_auth';

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedAuth = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        
        if (storedAuth) {
          // Parse and set stored user
          const parsedUser = JSON.parse(storedAuth);
          setUser(parsedUser);
        } else {
          // Use mock user for development
          // In production, this would leave user as null
          setUser(MOCK_USER);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(MOCK_USER));
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // Fallback to mock user in development
        setUser(MOCK_USER);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Update user data
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);

    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }, [user]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    updateUser,
  };
};

export default useAuth;
