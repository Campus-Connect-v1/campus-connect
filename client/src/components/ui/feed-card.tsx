import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { Image, Text, TouchableOpacity, View, Alert } from "react-native";
import PostActionsModal from "./post-actions-modal";
import DropdownAlert from "./DropdownAlert";
import { likePost, unlikePost, deletePost } from "@/src/services/authServices";
import { mutate } from "swr";
import { router } from "expo-router";
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert";

interface PostSettings {
  allowComments: boolean;
}

interface Post {
  id: string;
  user: {
    fullName: string;
    username: string;
    avatar?: string;
  };
  content?: string;
  image?: string;
  timestamp: string;
  stats: {
    comments: number;
    likes: number;
  };
  settings: PostSettings;
  isLiked?: boolean;
}

interface FeedCardProps {
  post: Post;
  onComment?: (postId: string) => void;
  onLike?: (postId: string) => void;
  isOwnPost?: boolean;
  onPostDeleted?: () => void;
}

export default function FeedCard({ post, onComment, onLike, isOwnPost, onPostDeleted }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.stats.likes);
  const [showActionsModal, setShowActionsModal] = useState(false);
  
  // Use custom dropdown alert for consistent toasting
  const { alert, hideAlert, error, success } = useDropdownAlert();

  const handleLike = useCallback(async () => {
    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      if (isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
      // Revalidate feed data
      mutate("/social/posts/feed");
      onLike?.(post.id);
    } catch {
      // Revert on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      error("Error", "Failed to update like status");
    }
  }, [isLiked, likeCount, post.id, onLike, error]);

  const handleDelete = useCallback(async () => {
    // Keep Alert.alert for confirmation dialogs as it's the native approach
    // and allows for Cancel/Delete buttons
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deletePost(post.id);
              if (result.success) {
                mutate("/social/posts/feed");
                success("Success", "Post deleted successfully");
                onPostDeleted?.();
              } else {
                error("Error", "Failed to delete post");
              }
            } catch {
              error("Error", "Failed to delete post");
            } finally {
              setShowActionsModal(false);
            }
          },
        },
      ]
    );
  }, [post.id, onPostDeleted, error, success]);

  const handlePostPress = useCallback(() => {
    router.push(`/feed/post-detail?postId=${post.id}`);
  }, [post.id]);

  return (
    <View className="bg-white px-4 py-4 rounded-2xl mb-4 shadow-md border border-gray-100">
      {/* Custom DropdownAlert for error messages */}
      <DropdownAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onDismiss={hideAlert}
      />
      
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <View className="w-14 h-14 rounded-full overflow-hidden bg-gray-300 mr-3 items-center justify-center">
          {post.user.avatar ? (
            <Image source={{ uri: post.user.avatar }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-white font-bold text-lg text-center leading-[48px]">
              {post.user.fullName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-gray-900 font-[Gilroy-SemiBold] text-lg">{post.user.fullName}</Text>
          <Text className="text-gray-500 font-[Gilroy-Regular]">@{post.user.username}</Text>
        </View>

        {/* Three-dots menu */}
        <TouchableOpacity onPress={() => setShowActionsModal(true)} className="p-2">
          <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Post content - tappable to view details */}
      <TouchableOpacity onPress={handlePostPress} activeOpacity={0.9}>
        {post.content && (
          <Text className="text-gray-800 mb-3 text-[15px] leading-6 font-[Gilroy-Regular]">
            {post.content}
          </Text>
        )}

        {/* Post image */}
        {post.image && (
          <View className="mb-3 rounded-2xl overflow-hidden shadow-sm">
            <Image source={{ uri: post.image }} className="w-full h-56" resizeMode="cover" />
          </View>
        )}
      </TouchableOpacity>

      {/* Actions */}
      <View className="flex-row items-center justify-between mt-2 px-1">
        {/* Like button */}
        <TouchableOpacity onPress={handleLike} className="flex-row items-center">
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#ef4444" : "#6b7280"} />
          <Text className={`ml-2 text-sm ${isLiked ? "text-red-500" : "text-gray-500"}`}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        {/* Comment button */}
        <TouchableOpacity
          onPress={handlePostPress}
          className={`flex-row items-center ${!post.settings.allowComments ? "opacity-50" : ""}`}
          disabled={!post.settings.allowComments}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text className="ml-2 text-sm text-gray-500">{post.stats.comments}</Text>
        </TouchableOpacity>
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
    </View>
  );
}
