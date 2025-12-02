/**
 * Toast Component
 * 
 * A custom toast notification component that provides a consistent notification
 * experience across the entire app. Use this instead of Alert.alert().
 * 
 * Features:
 * - Animated slide-in/slide-out transitions
 * - Auto-dismiss with configurable duration
 * - Multiple toast types: success, error, warning, info
 * - Customizable message and title
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '@/src/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Toast type configuration
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  backgroundColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const toastConfigs: Record<ToastType, ToastConfig> = {
  success: {
    backgroundColor: Colors.light.success,
    icon: 'checkmark-circle',
    iconColor: '#fff',
  },
  error: {
    backgroundColor: Colors.light.error,
    icon: 'close-circle',
    iconColor: '#fff',
  },
  warning: {
    backgroundColor: Colors.light.warning,
    icon: 'warning',
    iconColor: '#fff',
  },
  info: {
    backgroundColor: Colors.light.primary,
    icon: 'information-circle',
    iconColor: '#fff',
  },
};

interface ToastProps {
  visible: boolean;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  type,
  title,
  message,
  duration = 3000,
  onDismiss,
}) => {
  // Animation value for slide-in/slide-out effect
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation - toast comes from top of screen
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, translateY, opacity]);

  const hideToast = useCallback(() => {
    // Slide out animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [translateY, opacity, onDismiss]);

  if (!visible) return null;

  const config = toastConfigs[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: config.backgroundColor },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={config.icon} size={24} color={config.iconColor} />
        <View style={styles.textContainer}>
          {title && (
            <Text style={[styles.title, { color: config.iconColor }]}>
              {title}
            </Text>
          )}
          <Text style={[styles.message, { color: config.iconColor }]}>
            {message}
          </Text>
        </View>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={config.iconColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Toast Context for app-wide toast management
interface ToastContextValue {
  showToast: (type: ToastType, message: string, title?: string) => void;
  hideToast: () => void;
}

interface ToastState {
  visible: boolean;
  type: ToastType;
  title?: string;
  message: string;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'info',
    message: '',
  });

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string) => {
      setToast({
        visible: true,
        type,
        title,
        message,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        visible={toast.visible}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onDismiss={hideToast}
      />
    </ToastContext.Provider>
  );
};

// Custom hook for using toast
export const useToast = (): ToastContextValue => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast;
