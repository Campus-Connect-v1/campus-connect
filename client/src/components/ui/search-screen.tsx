"use client";

import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

/**
 * SearchScreen Component
 * 
 * A full-screen search interface that works with SearchBarTransition
 * for container transform animations.
 * 
 * Features:
 * - Recent searches list
 * - Search results with user/event/group support
 * - Animated list items using Reanimated for smooth entrance
 * - Skeleton loading states
 * - Empty state handling
 */

interface SearchResult {
  id: string;
  type: "user" | "event" | "group";
  title: string;
  subtitle?: string;
  image?: string;
}

interface SearchScreenProps {
  query: string;
  results: SearchResult[];
  isLoading?: boolean;
  recentSearches?: string[];
  onRecentSearchPress?: (query: string) => void;
  onClearRecent?: () => void;
  onResultPress?: (result: SearchResult) => void;
}

export default function SearchScreen({
  query,
  results,
  isLoading = false,
  recentSearches = [],
  onRecentSearchPress,
  onClearRecent,
  onResultPress,
}: SearchScreenProps) {
  // Handle result item press
  const handleResultPress = useCallback((item: SearchResult) => {
    if (onResultPress) {
      onResultPress(item);
      return;
    }
    
    // Default navigation based on type
    switch (item.type) {
      case "user":
        router.push({
          pathname: "/(users)/[id]",
          params: { id: item.id },
        });
        break;
      case "event":
        router.push(`/events/${item.id}`);
        break;
      case "group":
        router.push(`/study-groups/group-detail?groupId=${item.id}`);
        break;
    }
  }, [onResultPress]);

  // Get icon for result type - returns valid Ionicons names
  const getTypeIcon = (type: SearchResult["type"]): "person" | "calendar" | "people" | "search" => {
    switch (type) {
      case "user":
        return "person";
      case "event":
        return "calendar";
      case "group":
        return "people";
      default:
        return "search";
    }
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );

  // Render recent searches when no query
  const renderRecentSearches = () => {
    if (query.length > 0 || recentSearches.length === 0) return null;

    return (
      <View style={styles.recentContainer}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={onClearRecent}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
        {recentSearches.map((search, index) => (
          <Animated.View
            key={`recent-${index}`}
            entering={FadeIn.delay(index * 50)}
          >
            <TouchableOpacity
              style={styles.recentItem}
              onPress={() => onRecentSearchPress?.(search)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.recentText}>{search}</Text>
              <Ionicons name="arrow-forward" size={16} color="#999" />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (query.length === 0) return null;

    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={styles.emptyContainer}
      >
        <Ionicons name="search-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptySubtitle}>
          Try searching for people, events, or groups
        </Text>
      </Animated.View>
    );
  };

  // Render a search result item
  const renderResultItem = ({ item, index }: { item: SearchResult; index: number }) => (
    <Animated.View entering={FadeIn.delay(index * 30)}>
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleResultPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.resultAvatar}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons
                name={getTypeIcon(item.type)}
                size={24}
                color="#3b82f6"
              />
            </View>
          )}
        </View>
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        <View style={styles.resultType}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        renderSkeleton()
      ) : query.length === 0 ? (
        renderRecentSearches()
      ) : results.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderResultItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContainer: {
    paddingVertical: 8,
  },
  // Recent searches styles
  recentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontFamily: "Gilroy-SemiBold",
    color: "#333",
  },
  clearText: {
    fontSize: 14,
    fontFamily: "Gilroy-Medium",
    color: "#3b82f6",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  recentText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Gilroy-Regular",
    color: "#333",
  },
  // Result item styles
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: "Gilroy-SemiBold",
    color: "#333",
  },
  resultSubtitle: {
    fontSize: 14,
    fontFamily: "Gilroy-Regular",
    color: "#666",
    marginTop: 2,
  },
  resultType: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontFamily: "Gilroy-Medium",
    color: "#666",
    textTransform: "capitalize",
  },
  // Skeleton styles
  skeletonContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e7eb",
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    width: "60%",
    height: 16,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: "40%",
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Gilroy-SemiBold",
    color: "#333",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Gilroy-Regular",
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
});
