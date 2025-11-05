import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/src/utils/fetcher";
import {
  likePost,
  unlikePost,
  addComment,
  deletePost,
} from "@/src/services/authServices";
import { storage } from "@/src/utils/storage";
import PostActionsModal from "@/src/components/ui/post-actions-modal";

interface Comment {
  comment_id: string;
  content: string;
  created_at: string;
  author: {
    user_id: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showActionsModal, setShowActionsModal] = useState(false);

  console.log("Post ID:", postId);


  const {
    data: postData,
    error: postError,
    isLoading: postLoading,
  } = useSWR(postId ? `/social/posts/${postId}` : null, fetcher);

  const {
    data: commentsData,
    isLoading: commentsLoading,
  } = useSWR(postId ? `/social/posts/${postId}/comments` : null, fetcher);

  useEffect(() => {
    const loadUserId = async () => {
      const userData = await storage.getUserData();
      setCurrentUserId(userData?.user_id || null);
    };
    loadUserId();
  }, []);

  useEffect(() => {
    if (postData?.post) {
      setIsLiked(postData.post.user_actions?.has_liked || false);
      setLikeCount(postData.post.stats?.like_count || 0);
    }
  }, [postData]);

  const handleLike = async () => {
    if (!postId) return;

    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      if (isLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
      // Revalidate data
      mutate(`/social/posts/${postId}`);
      mutate("/social/posts/feed");
    } catch {
      // Revert on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      Alert.alert("Error", "Failed to update like status");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !postId) return;

    setIsSubmitting(true);
    try {
      const result = await addComment(postId, { content: commentText.trim() });
      if (result.success) {
        setCommentText("");
        // Revalidate comments
        mutate(`/social/posts/${postId}/comments`);
        mutate(`/social/posts/${postId}`);
        mutate("/social/posts/feed");
      } else {
        Alert.alert("Error", "Failed to add comment");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;

    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const result = await deletePost(postId);
            if (result.success) {
              mutate("/social/posts/feed");
              router.back();
            } else {
              Alert.alert("Error", "Failed to delete post");
            }
          } catch (error) {
            Alert.alert("Error", "Failed to delete post");
          }
        },
      },
    ]);
  };

  if (postLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  if (postError || !postData?.post) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-4">
        <Text className="text-gray-600 text-center">Failed to load post</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-500">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const post = postData.post;
  const comments: Comment[] = commentsData?.comments || [];

  const isOwnPost = currentUserId === post.author?.user_id;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-[Gilroy-SemiBold]">Post</Text>
          <TouchableOpacity
            onPress={() => setShowActionsModal(true)}
            className="ml-auto p-2"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Post Content */}
          <View className="px-4 py-4">
            {/* Author info */}
            <View className="flex-row items-center mb-4">
              <View className="w-14 h-14 rounded-full overflow-hidden bg-gray-300 mr-3 items-center justify-center">
                {post.author?.profile_picture_url ? (
                  <Image
                    source={{ uri: post.author.profile_picture_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    {post.author?.first_name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-[Gilroy-SemiBold] text-lg">
                  {post.author?.first_name} {post.author?.last_name}
                </Text>
                <Text className="text-gray-500 font-[Gilroy-Regular] text-sm">
                  {new Date(post.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Post text */}
            {post.content && (
              <Text className="text-gray-800 mb-4 text-base leading-6 font-[Gilroy-Regular]">
                {post.content}
              </Text>
            )}

            {/* Post image */}
            {post.media_url && (
              <View className="mb-4 rounded-2xl overflow-hidden">
                <Image
                  source={{ uri: post.media_url }}
                  className="w-full h-64"
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Like and comment stats */}
            <View className="flex-row items-center py-3 border-t border-b border-gray-200">
              <TouchableOpacity
                onPress={handleLike}
                className="flex-row items-center mr-6"
              >
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={isLiked ? "#ef4444" : "#6b7280"}
                />
                <Text
                  className={`ml-2 text-base ${isLiked ? "text-red-500" : "text-gray-600"}`}
                >
                  {likeCount}
                </Text>
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Ionicons name="chatbubble-outline" size={24} color="#6b7280" />
                <Text className="ml-2 text-base text-gray-600">
                  {comments.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View className="px-4 py-2">
            <Text className="text-lg font-[Gilroy-SemiBold] mb-3">
              Comments
            </Text>

            {commentsLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : comments.length === 0 ? (
              <Text className="text-gray-500 text-center py-4">
                No comments yet. Be the first to comment!
              </Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.comment_id} className="mb-4 pb-4 border-b border-gray-100">
                  <View className="flex-row items-start">
                    <View className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 mr-3 items-center justify-center">
                      {comment.author?.profile_picture_url ? (
                        <Image
                          source={{ uri: comment.author.profile_picture_url }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className="text-white font-bold text-sm">
                          {comment.author?.first_name?.charAt(0).toUpperCase() ||
                            "?"}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-[Gilroy-SemiBold] text-sm mb-1">
                        {comment.author?.first_name} {comment.author?.last_name}
                      </Text>
                      <Text className="text-gray-800 font-[Gilroy-Regular] mb-1">
                        {comment.content}
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View className="px-4 py-3 border-t border-gray-200 bg-white">
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-gray-100 rounded-full px-4 py-3 font-[Gilroy-Regular] mr-2"
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={!commentText.trim() || isSubmitting}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                commentText.trim() && !isSubmitting
                  ? "bg-blue-500"
                  : "bg-gray-300"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={commentText.trim() ? "#fff" : "#999"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Post Actions Modal */}
        <PostActionsModal
          visible={showActionsModal}
          onClose={() => setShowActionsModal(false)}
          isOwnPost={isOwnPost}
          onEdit={() => {
            setShowActionsModal(false);
            console.log("Edit Pressed");
          }}
          onDelete={handleDelete}
          onSavePost={() => {
            setShowActionsModal(false);
            console.log("Saved Post");
          }}
          onHidePost={() => {
            setShowActionsModal(false);
            console.log("Hide Post");
          }}
          onReport={() => {
            setShowActionsModal(false);
            console.log("Report Pressed");
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
