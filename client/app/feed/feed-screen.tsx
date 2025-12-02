import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FeedCard from "../../src/components/ui/feed-card";
import PostSkeleton from "../../src/components/ui/post-skeleton";
import { storage } from "@/src/utils/storage";
import { usePosts, transformPostToFeedCard, Post } from "@/src/hooks/usePosts";

// Threshold for triggering load more (30% from bottom)
const END_REACHED_THRESHOLD = 0.3;

/**
 * FeedScreen Component
 * 
 * An improved posts feed with:
 * - Paginated loading (infinite scroll)
 * - Skeleton loaders during initial load
 * - Pull-to-refresh support
 * - Error and empty-state handling
 * - Clean separation of UI and data-fetching (via usePosts hook)
 * - Optimized batched API calls via SWR Infinite
 */
export default function FeedScreen() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Use custom hook for all data-fetching logic
  const {
    posts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePosts();

  // Load current user ID on mount
  useEffect(() => {
    const loadUserId = async () => {
      const userData = await storage.getUserData();
      setCurrentUserId(userData?.user_id || null);
    };
    loadUserId();
  }, []);

  /**
   * Handle reaching the end of the list
   * Triggers loading more posts for infinite scroll
   */
  const handleEndReached = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      loadMore();
    }
  }, [isLoadingMore, hasMore, isLoading, loadMore]);

  /**
   * Render the footer component
   * Shows loading indicator when fetching more posts
   */
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#6b7280" />
        <Text style={styles.loadingText}>Loading more posts...</Text>
      </View>
    );
  }, [isLoadingMore]);

  /**
   * Render each post item
   */
  const renderItem = useCallback(
    ({ item }: { item: Post }) => {
      const { post, isOwnPost } = transformPostToFeedCard(item, currentUserId);
      return <FeedCard post={post} isOwnPost={isOwnPost} />;
    },
    [currentUserId]
  );

  /**
   * Render empty state
   */
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No posts yet</Text>
        <Text style={styles.emptySubtitle}>
          Be the first to share something with your campus!
        </Text>
      </View>
    );
  }, [isLoading]);

  // Show skeleton loader during initial load
  if (isLoading) {
    return <PostSkeleton count={3} />;
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="cloud-offline-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to load feed</Text>
        <Text style={styles.errorSubtitle}>
          Please check your connection and try again
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.post_id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      // Pull-to-refresh
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          colors={["#3b82f6"]}
          tintColor="#3b82f6"
        />
      }
      // Infinite scroll
      onEndReached={handleEndReached}
      onEndReachedThreshold={END_REACHED_THRESHOLD}
      // Footer loading indicator
      ListFooterComponent={renderFooter}
      // Empty state
      ListEmptyComponent={renderEmpty}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={7}
      initialNumToRender={5}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontFamily: "Gilroy-Regular",
    fontSize: 14,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: 18,
    color: "#333",
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: "Gilroy-Regular",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  errorTitle: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: 18,
    color: "#333",
    marginTop: 16,
  },
  errorSubtitle: {
    fontFamily: "Gilroy-Regular",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  retryText: {
    fontFamily: "Gilroy-SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
