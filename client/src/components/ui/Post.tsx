/**
 * Post Component
 * 
 * A reusable post card component that displays a single post with:
 * - Author info (avatar, name, username)
 * - Post content
 * - Media (if any)
 * - Interaction buttons (like, comment, share)
 * - Post statistics
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '@/src/constants/Colors';

export interface PostAuthor {
  user_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  profile_headline?: string;
}

export interface PostStats {
  like_count: number;
  comment_count: number;
}

export interface PostUserActions {
  has_liked: boolean;
}

export interface PostData {
  post_id: string;
  content: string;
  media_url?: string | null;
  media_type: 'text' | 'image' | 'video';
  visibility: string;
  created_at: string;
  expires_at?: string | null;
  author: PostAuthor;
  stats: PostStats;
  user_actions: PostUserActions;
}

interface PostProps {
  post: PostData;
  onLike?: (postId: string, isLiked: boolean) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onAuthorPress?: (userId: string) => void;
}

// Format relative time from date string
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// Format numbers with K/M suffixes
const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const Post: React.FC<PostProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onAuthorPress,
}) => {
  const { author, content, media_url, media_type, stats, user_actions, created_at } = post;

  const handleLikePress = () => {
    onLike?.(post.post_id, user_actions.has_liked);
  };

  const handleCommentPress = () => {
    onComment?.(post.post_id);
  };

  const handleSharePress = () => {
    onShare?.(post.post_id);
  };

  const handleAuthorPress = () => {
    onAuthorPress?.(author.user_id);
  };

  return (
    <View style={styles.container}>
      {/* Post Header - Author Info */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAuthorPress} style={styles.authorSection}>
          <Image
            source={{
              uri: author.profile_picture_url || 'https://via.placeholder.com/48',
            }}
            style={styles.avatar}
          />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {author.first_name} {author.last_name}
            </Text>
            {author.profile_headline && (
              <Text style={styles.authorHeadline} numberOfLines={1}>
                {author.profile_headline}
              </Text>
            )}
            <Text style={styles.timestamp}>{formatRelativeTime(created_at)}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.light.gray} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <Text style={styles.content}>{content}</Text>

      {/* Post Media */}
      {media_url && media_type === 'image' && (
        <Image
          source={{ uri: media_url }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      )}

      {/* Post Stats */}
      {(stats.like_count > 0 || stats.comment_count > 0) && (
        <View style={styles.statsRow}>
          {stats.like_count > 0 && (
            <Text style={styles.statsText}>
              {formatCount(stats.like_count)} {stats.like_count === 1 ? 'like' : 'likes'}
            </Text>
          )}
          {stats.comment_count > 0 && (
            <Text style={styles.statsText}>
              {formatCount(stats.comment_count)} {stats.comment_count === 1 ? 'comment' : 'comments'}
            </Text>
          )}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Post Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLikePress}
        >
          <Ionicons
            name={user_actions.has_liked ? 'heart' : 'heart-outline'}
            size={22}
            color={user_actions.has_liked ? Colors.light.like : Colors.light.gray}
          />
          <Text
            style={[
              styles.actionText,
              user_actions.has_liked && styles.actionTextActive,
            ]}
          >
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleCommentPress}>
          <Ionicons name="chatbubble-outline" size={20} color={Colors.light.gray} />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSharePress}>
          <Ionicons name="share-outline" size={22} color={Colors.light.gray} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    paddingTop: 16,
    borderBottomWidth: 8,
    borderBottomColor: Colors.light.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontFamily: 'Gilroy-SemiBold',
    color: Colors.light.username,
  },
  authorHeadline: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.caption,
    marginTop: 1,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.timestamp,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    fontSize: 15,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.text,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  mediaImage: {
    width: '100%',
    height: 250,
    backgroundColor: Colors.light.lightGray,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  statsText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.gray,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    color: Colors.light.gray,
  },
  actionTextActive: {
    color: Colors.light.like,
  },
});

export default Post;
