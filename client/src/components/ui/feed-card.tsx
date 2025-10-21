import { icons } from "@/src/constants/icons";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import PostActionsModal from "./post-actions-modal";

interface PostSettings {
  allowComments: boolean;
  allowReposts: boolean;
  allowShares: boolean;
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
    reposts: number;
    likes: number;
  };
  settings: PostSettings;
  isLiked?: boolean;
  isReposted?: boolean;
}

interface FeedCardProps {
  post: Post;
  onComment?: (postId: string) => void;
  onRepost?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export default function FeedCard({ post, onComment, onRepost, onLike, onShare }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isReposted, setIsReposted] = useState(post.isReposted || false);
  const [likeCount, setLikeCount] = useState(post.stats.likes);
  const [repostCount, setRepostCount] = useState(post.stats.reposts);
  const [showActionsModal, setShowActionsModal] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike?.(post.id);
  };

  const handleRepost = () => {
    if (!post.settings.allowReposts) return;
    setIsReposted(!isReposted);
    setRepostCount(isReposted ? repostCount - 1 : repostCount + 1);
    onRepost?.(post.id);
  };

  const formatCount = (count: number) => {
    return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString();
  };
const repeatIcon = icons.repeat;
  return (
    <View className="bg-white px-4 py-4  rounded-xl  mb-3 border border-gray-100 ">
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
          <View className="flex-row flex-wrap items-center">
            <Text style={{fontFamily:"Gilroy-Medium"}} className="text-gray-900 font-semibold mr-1 text-lg">{post.user.fullName}</Text>
            <Text style={{fontFamily:"Gilroy-Medium"}} className="text-gray-500 text-lg">@{post.user.username}</Text>
            <Text style={{fontFamily:"Gilroy-Medium"}} className="text-gray-400 mx-1">·</Text>
            <Text style={{fontFamily:"Gilroy-Medium"}} className="text-gray-400">{post.timestamp}</Text>
          </View>
        </View>

        <TouchableOpacity className="p-2" onPress={() => setShowActionsModal(true)}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      {post.content && (
        <View className="mb-3">
          <Text style={{fontFamily:"Gilroy-Regular"}} className="text-gray-800 text-[15px] leading-5">{post.content}</Text>
        </View>
      )}

      {/* Post Image */}
      {post.image && (
        <View className="mb-3 rounded-2xl overflow-hidden">
          <Image source={{ uri: post.image }} className="w-full h-56" resizeMode="cover" />
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row justify-between mt-2 px-2">
        {/* Comments */}
        <TouchableOpacity
          onPress={() => post.settings.allowComments && onComment?.(post.id)}
          className={`flex-row items-center ${!post.settings.allowComments ? "opacity-50" : ""}`}
          disabled={!post.settings.allowComments}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={{fontFamily:"Gilroy-Medium"}} className="text-gray-500 ml-2 text-sm">{formatCount(post.stats.comments)}</Text>
        </TouchableOpacity>

        {/* Reposts */}
        <TouchableOpacity
          onPress={handleRepost}
          className={`flex-row items-center ${!post.settings.allowReposts ? "opacity-50" : ""}`}
          disabled={!post.settings.allowReposts}
        >
          <Ionicons name="repeat" size={20} color={isReposted ? "#10b981" : "#6b7280"} />
          <Text style={{fontFamily:"Gilroy-Medium"}} className={`ml-2 text-sm ${isReposted ? "text-green-500" : "text-gray-500"}`}>
            {formatCount(repostCount)}
          </Text>
        </TouchableOpacity>

        {/* Likes */}
        <TouchableOpacity onPress={handleLike} className="flex-row items-center">
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#ef4444" : "#6b7280"} />
          <Text style={{fontFamily:"Gilroy-Medium"}} className={`ml-2 text-sm ${isLiked ? "text-red-500" : "text-gray-500"}`}>
            {formatCount(likeCount)}
          </Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          onPress={() => post.settings.allowShares && onShare?.(post.id)}
          className={`flex-row items-center ${!post.settings.allowShares ? "opacity-50" : ""}`}
          disabled={!post.settings.allowShares}
        >
          <Ionicons name="share-social-outline" size={20} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => post.settings.allowShares && onShare?.(post.id)}
          className={`flex-row items-center ${!post.settings.allowShares ? "opacity-50" : ""}`}
          disabled={!post.settings.allowShares}
        >
          <Ionicons name="bookmark-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      <PostActionsModal
      visible={showActionsModal}
      onClose={() => setShowActionsModal(false)}
      isOwnPost={true} // or false based on logic
      onEdit={() => {
        setShowActionsModal(false);
        console.log('Edit Pressed');
        // your edit logic here
      }}
      onDelete={() => {
        setShowActionsModal(false);
        console.log('Delete Pressed');
        // your delete logic here
      }}
      onShare={() => {
        setShowActionsModal(false);
        console.log('Share Pressed');
        // share logic here
      }}
      onSavePost={() => {
        setShowActionsModal(false);
        console.log('Saved Post');
        // save logic here
      }}
      onHidePost={() => {
        setShowActionsModal(false);
        console.log('Hide Post');
      }}
      onReport={() => {
        setShowActionsModal(false);
        console.log('Report Pressed');
      }}
/>
    </View>
  );
}
