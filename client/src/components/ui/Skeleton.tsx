/**
 * Skeleton Components
 * 
 * Reusable skeleton loader components for creating placeholder UI
 * while content is loading. These provide visual feedback to users
 * and improve perceived performance.
 * 
 * Components:
 * - SkeletonBox: Basic animated rectangular placeholder
 * - SkeletonCircle: Circular placeholder (for avatars)
 * - PostSkeleton: Complete post placeholder
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import Colors from '@/src/constants/Colors';

// ============================================================================
// SkeletonBox - Basic rectangular skeleton with shimmer animation
// ============================================================================

interface SkeletonBoxProps {
  /** Width of the skeleton (number or percentage string) */
  width?: number | string;
  /** Height of the skeleton */
  height?: number;
  /** Border radius of the skeleton */
  borderRadius?: number;
  /** Custom style overrides */
  style?: ViewStyle;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  // Animated value for shimmer effect (pulsing opacity)
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Create a looping shimmer animation
    // Opacity oscillates between 0.3 and 0.7 creating a pulse effect
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    shimmerAnimation.start();
    
    // Cleanup animation on unmount
    return () => shimmerAnimation.stop();
  }, [shimmerOpacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
          opacity: shimmerOpacity,
        },
        style,
      ]}
    />
  );
};

// ============================================================================
// SkeletonCircle - Circular skeleton for avatars
// ============================================================================

interface SkeletonCircleProps {
  /** Diameter of the circle */
  size?: number;
  /** Custom style overrides */
  style?: ViewStyle;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 40,
  style,
}) => {
  return (
    <SkeletonBox
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

// ============================================================================
// PostSkeleton - Complete skeleton placeholder for a post
// ============================================================================

interface PostSkeletonProps {
  /** Whether to show media placeholder */
  showMedia?: boolean;
  /** Custom container style */
  style?: ViewStyle;
}

export const PostSkeleton: React.FC<PostSkeletonProps> = ({
  showMedia = false,
  style,
}) => {
  return (
    <View style={[styles.postContainer, style]}>
      {/* Post header with avatar and username */}
      <View style={styles.postHeader}>
        <SkeletonCircle size={48} />
        <View style={styles.postHeaderText}>
          <SkeletonBox width={120} height={16} style={styles.marginBottom8} />
          <SkeletonBox width={80} height={12} />
        </View>
      </View>

      {/* Post content lines */}
      <View style={styles.postContent}>
        <SkeletonBox width="100%" height={14} style={styles.marginBottom8} />
        <SkeletonBox width="95%" height={14} style={styles.marginBottom8} />
        <SkeletonBox width="70%" height={14} />
      </View>

      {/* Optional media placeholder */}
      {showMedia && (
        <SkeletonBox
          width="100%"
          height={200}
          borderRadius={12}
          style={styles.mediaPlaceholder}
        />
      )}

      {/* Post actions (like, comment, share) */}
      <View style={styles.postActions}>
        <SkeletonBox width={60} height={24} borderRadius={12} />
        <SkeletonBox width={60} height={24} borderRadius={12} />
        <SkeletonBox width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

// ============================================================================
// PostSkeletonList - Multiple post skeletons for loading states
// ============================================================================

interface PostSkeletonListProps {
  /** Number of skeleton items to show */
  count?: number;
  /** Whether to show media placeholders */
  showMedia?: boolean;
}

export const PostSkeletonList: React.FC<PostSkeletonListProps> = ({
  count = 3,
  showMedia = false,
}) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton
          key={`skeleton-${index}`}
          showMedia={showMedia && index === 0}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: Colors.light.lightGray,
  },
  marginBottom8: {
    marginBottom: 8,
  },
  postContainer: {
    backgroundColor: Colors.light.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  postContent: {
    marginBottom: 12,
  },
  mediaPlaceholder: {
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
});

export default {
  SkeletonBox,
  SkeletonCircle,
  PostSkeleton,
  PostSkeletonList,
};
