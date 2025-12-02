"use client";

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

/**
 * PostSkeleton Component
 * 
 * A skeleton loader placeholder that mimics the FeedCard layout.
 * Uses animated shimmer effect for visual feedback during loading.
 * 
 * Animation:
 * - Uses a repeating opacity animation to create shimmer effect
 * - Animated.loop ensures continuous animation until unmounted
 */

interface PostSkeletonProps {
  count?: number;
}

function SingleSkeleton() {
  // Animation value for shimmer effect
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Create repeating shimmer animation
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.card}>
      {/* Header skeleton - avatar and user info */}
      <View style={styles.header}>
        <Animated.View
          style={[styles.avatar, { opacity: shimmerAnim }]}
        />
        <View style={styles.headerText}>
          <Animated.View
            style={[styles.titleSkeleton, { opacity: shimmerAnim }]}
          />
          <Animated.View
            style={[styles.subtitleSkeleton, { opacity: shimmerAnim }]}
          />
        </View>
        <Animated.View
          style={[styles.menuDot, { opacity: shimmerAnim }]}
        />
      </View>

      {/* Content skeleton */}
      <View style={styles.content}>
        <Animated.View
          style={[styles.textLine, { width: "100%", opacity: shimmerAnim }]}
        />
        <Animated.View
          style={[styles.textLine, { width: "90%", opacity: shimmerAnim }]}
        />
        <Animated.View
          style={[styles.textLine, { width: "75%", opacity: shimmerAnim }]}
        />
      </View>

      {/* Image placeholder */}
      <Animated.View
        style={[styles.imageSkeleton, { opacity: shimmerAnim }]}
      />

      {/* Actions skeleton */}
      <View style={styles.actions}>
        <Animated.View
          style={[styles.actionButton, { opacity: shimmerAnim }]}
        />
        <Animated.View
          style={[styles.actionButton, { opacity: shimmerAnim }]}
        />
      </View>
    </View>
  );
}

export default function PostSkeleton({ count = 3 }: PostSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SingleSkeleton key={`skeleton-${index}`} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e5e7eb",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  titleSkeleton: {
    width: 120,
    height: 16,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 6,
  },
  subtitleSkeleton: {
    width: 80,
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
  },
  menuDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
  },
  content: {
    marginBottom: 12,
  },
  textLine: {
    height: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 8,
  },
  imageSkeleton: {
    width: "100%",
    height: 200,
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionButton: {
    width: 60,
    height: 20,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
  },
});
