/**
 * SearchScreen Component
 * 
 * A full-screen search interface that includes:
 * - Search bar with auto-focus
 * - Recent searches list
 * - Search results display
 * - Cancel/back button
 * 
 * This component is designed to be used with ContainerTransform
 * for smooth animated transitions from a search bar.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback } from 'react';
import {
  FlatList,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '@/src/constants/Colors';
import SearchBar from './SearchBar';

interface SearchScreenProps {
  /** Callback when user wants to close the search screen */
  onClose: () => void;
  /** Placeholder text for search input */
  placeholder?: string;
  /** Callback when search is performed */
  onSearch?: (query: string) => void;
  /** Initial search query */
  initialQuery?: string;
}

interface RecentSearch {
  id: string;
  query: string;
  timestamp: Date;
}

const SearchScreen: React.FC<SearchScreenProps> = ({
  onClose,
  placeholder = 'Search posts, users, topics...',
  onSearch,
  initialQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([
    { id: '1', query: 'Study groups', timestamp: new Date() },
    { id: '2', query: 'Campus events', timestamp: new Date() },
    { id: '3', query: 'Library hours', timestamp: new Date() },
  ]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const newSearch: RecentSearch = {
        id: Date.now().toString(),
        query: searchQuery.trim(),
        timestamp: new Date(),
      };
      setRecentSearches((prev) => [newSearch, ...prev.slice(0, 9)]);
      
      // Trigger search callback
      onSearch?.(searchQuery.trim());
      Keyboard.dismiss();
    }
  }, [searchQuery, onSearch]);

  // Handle clicking on a recent search
  const handleRecentSearchPress = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
    Keyboard.dismiss();
  }, [onSearch]);

  // Remove a recent search
  const handleRemoveRecentSearch = useCallback((id: string) => {
    setRecentSearches((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Clear all recent searches
  const handleClearAllRecent = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const renderRecentSearchItem = ({ item }: { item: RecentSearch }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => handleRecentSearchPress(item.query)}
    >
      <View style={styles.recentItemLeft}>
        <Ionicons name="time-outline" size={18} color={Colors.light.gray} />
        <Text style={styles.recentItemText}>{item.query}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveRecentSearch(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={18} color={Colors.light.gray} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with search bar and cancel button */}
      <View style={styles.header}>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            placeholder={placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            onSubmit={handleSearch}
            onClear={() => setSearchQuery('')}
          />
        </View>
        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Recent searches section */}
      {recentSearches.length > 0 && !searchQuery && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={handleClearAllRecent}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearchItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Empty state when no recent searches */}
      {recentSearches.length === 0 && !searchQuery && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color={Colors.light.lightGray} />
          <Text style={styles.emptyStateTitle}>Search CampusConnect</Text>
          <Text style={styles.emptyStateText}>
            Find posts, users, events, and more
          </Text>
        </View>
      )}

      {/* Search results placeholder */}
      {searchQuery.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            Searching for &ldquo;{searchQuery}&rdquo;...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

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
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchBarWrapper: {
    flex: 1,
    marginRight: 12,
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Medium',
    color: Colors.light.primary,
  },
  section: {
    flex: 1,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Gilroy-SemiBold',
    color: Colors.light.text,
  },
  clearAllText: {
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    color: Colors.light.primary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentItemText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.text,
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'Gilroy-SemiBold',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.gray,
    textAlign: 'center',
  },
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 32,
  },
  resultsText: {
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.gray,
  },
});

export default SearchScreen;
