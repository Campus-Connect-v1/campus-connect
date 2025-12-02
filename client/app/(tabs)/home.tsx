/**
 * Home Screen
 * 
 * The main posts feed screen with:
 * - Search bar with container transform animation
 * - Paginated posts feed with infinite scroll
 * - Pull-to-refresh support
 * - Skeleton loaders during loading
 * - Empty and error state handling
 */

import React, { useState, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import Colors from '@/src/constants/Colors';
import Post, { PostData } from '@/src/components/ui/Post';
import SearchBar from '@/src/components/ui/SearchBar';
import SearchScreen from '@/src/components/ui/SearchScreen';
import { PostSkeletonList } from '@/src/components/ui/Skeleton';
import { EmptyState, ErrorState, LoadingFooter } from '@/src/components/ui/StateComponents';
import usePosts from '@/src/hooks/usePosts';

export default function HomeScreen() {
  // Search screen visibility state
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  // Posts hook for data management
  const {
    posts,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    toggleLike,
  } = usePosts();

  // Handle search bar press - opens search screen
  const handleSearchPress = useCallback(() => {
    setIsSearchVisible(true);
  }, []);

  // Handle search screen close
  const handleSearchClose = useCallback(() => {
    setIsSearchVisible(false);
  }, []);

  // Handle like toggle on a post
  const handleLike = useCallback((postId: string, isLiked: boolean) => {
    toggleLike(postId, isLiked);
  }, [toggleLike]);

  // Handle comment button press
  const handleComment = useCallback((postId: string) => {
    // TODO: Navigate to comments screen
    console.log('Comment on post:', postId);
  }, []);

  // Handle share button press
  const handleShare = useCallback((postId: string) => {
    // TODO: Implement share functionality
    console.log('Share post:', postId);
  }, []);

  // Handle author profile press
  const handleAuthorPress = useCallback((userId: string) => {
    // TODO: Navigate to user profile
    console.log('View profile:', userId);
  }, []);

  // Handle search submission
  const handleSearch = useCallback((query: string) => {
    // TODO: Implement search functionality
    console.log('Search for:', query);
  }, []);

  // Handle end reached for infinite scroll
  const handleEndReached = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadMore();
    }
  }, [isLoadingMore, hasMore, loadMore]);

  // Render individual post item
  const renderPost = useCallback(({ item }: { item: PostData }) => (
    <Post
      post={item}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onAuthorPress={handleAuthorPress}
    />
  ), [handleLike, handleComment, handleShare, handleAuthorPress]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: PostData) => item.post_id, []);

  // List header with search bar and create post button
  const ListHeader = useCallback(() => (
    <View style={styles.header}>
      {/* Search Bar - tappable to open search screen */}
      <View style={styles.searchBarContainer}>
        <SearchBar
          placeholder="Search posts, users, topics..."
          onPress={handleSearchPress}
          editable={false}
        />
      </View>
      
      {/* Create Post Button */}
      <TouchableOpacity 
        style={styles.createPostButton}
        onPress={() => {
          // TODO: Navigate to create post screen
          console.log('Create post');
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  ), [handleSearchPress]);

  // List footer with loading indicator
  const ListFooter = useCallback(() => (
    <LoadingFooter isLoading={isLoadingMore} />
  ), [isLoadingMore]);

  // Empty state component
  const ListEmpty = useCallback(() => {
    if (isLoading) return null;
    
    return (
      <EmptyState
        icon="document-text-outline"
        title="No posts yet"
        description="Be the first to share something with your campus community!"
        actionText="Create Post"
        onAction={() => console.log('Create post')}
      />
    );
  }, [isLoading]);

  // Show error state if error and no posts
  if (error && posts.length === 0 && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ListHeader />
        <ErrorState message={error} onRetry={refresh} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading state with skeletons */}
      {isLoading ? (
        <View>
          <ListHeader />
          <PostSkeletonList count={3} showMedia />
        </View>
      ) : (
        /* Posts Feed List */
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
        />
      )}

      {/* Search Screen Modal with fade/slide animation */}
      <Modal
        visible={isSearchVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleSearchClose}
      >
        <SearchScreen
          onClose={handleSearchClose}
          onSearch={handleSearch}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  searchBarContainer: {
    flex: 1,
  },
  createPostButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
