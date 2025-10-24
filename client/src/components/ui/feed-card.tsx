import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import PostActionsModal from "./post-actions-modal";

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
}

export default function FeedCard({ post, onComment, onLike }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.stats.likes);
  const [showActionsModal, setShowActionsModal] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1); // optimistic update
    onLike?.(post.id);
  };

  return (
    <View className="bg-white px-4 py-4 rounded-2xl mb-4 shadow-md border border-gray-100">
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

      {/* Post content */}
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
          onPress={() => post.settings.allowComments && onComment?.(post.id)}
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
        isOwnPost={true} // adjust logic as needed
        onEdit={() => {
          setShowActionsModal(false);
          console.log("Edit Pressed");
        }}
        onDelete={() => {
          setShowActionsModal(false);
          console.log("Delete Pressed");
        }}
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
