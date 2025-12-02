/**
 * State Components
 * 
 * Reusable components for displaying various application states:
 * - EmptyState: When there's no content to display
 * - ErrorState: When an error occurred
 * - LoadingFooter: Loading indicator at bottom of lists
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Colors from '@/src/constants/Colors';

// ============================================================================
// EmptyState - Displayed when there's no content
// ============================================================================

interface EmptyStateProps {
  /** Icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button text */
  actionText?: string;
  /** Action button callback */
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-text-outline',
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={Colors.light.lightGray} />
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionText && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// ErrorState - Displayed when an error occurred
// ============================================================================

interface ErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Retry button callback */
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong',
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={64} color={Colors.light.error} />
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.description}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// LoadingFooter - Loading indicator for infinite scroll
// ============================================================================

interface LoadingFooterProps {
  /** Whether loading is in progress */
  isLoading: boolean;
}

export const LoadingFooter: React.FC<LoadingFooterProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <View style={styles.loadingFooter}>
      <ActivityIndicator size="small" color={Colors.light.primary} />
      <Text style={styles.loadingText}>Loading more...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Gilroy-SemiBold',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    color: '#fff',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    color: '#fff',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.gray,
  },
});

export default {
  EmptyState,
  ErrorState,
  LoadingFooter,
};
