import React, { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, Text } from "react-native";
import useSWR from "swr";
import { fetcher } from "@/src/utils/fetcher";
import FeedCard from "../../src/components/ui/feed-card";
import FloatingAddButton from "@/src/components/ui/floating-add-button";
import { storage } from "@/src/utils/storage";

export default function FeedScreen() {
  const { data, error, isLoading } = useSWR("/social/posts/feed", fetcher);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserId = async () => {
      const userData = await storage.getUserData();
      setCurrentUserId(userData?.user_id || null);
    };
    loadUserId();
  }, []);

  if (isLoading) return <ActivityIndicator size="large" color="#000" />;
  if (error) return <Text>Failed to load feed.</Text>;

  // Corrected: grab data.posts instead of data directly
  const feed: any[] = Array.isArray(data?.posts) ? data.posts : [];


  // console.log("Feed data:", feed);

  return (
    <FlatList
      data={feed}
      keyExtractor={(item) => item.post_id}
      renderItem={({ item }) => (
        <FeedCard
          post={{
            id: item.post_id,
            user: {
              fullName: `${item.author?.first_name ?? ""} ${item.author?.last_name ?? ""}`,
              username: item.author?.first_name?.toLowerCase() ?? "",
              avatar: item.author?.profile_picture_url ?? "",
            },
            content: item.content,
            image: item.media_url,
            timestamp: new Date(item.created_at).toLocaleDateString(),
            stats: {
              comments: item.stats?.comment_count ?? 0,
              reposts: 0,
              likes: item.stats?.like_count ?? 0,
            },
            settings: {
              allowComments: true,
              allowReposts: true,
              allowShares: true,
            },
            isLiked: item.user_actions?.has_liked ?? false,
          }}
          isOwnPost={currentUserId === item.author?.user_id}
        />
      )}
      contentContainerStyle={{ padding: 16 }}

    />
  );
}
