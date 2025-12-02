"use client";

import React, { useCallback, useRef } from "react";
import {
  Animated,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/src/constants/Colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 50 : (StatusBar.currentHeight ?? 0);

/**
 * SearchBarTransition Component
 * 
 * A reusable component that provides a Material-style container transform animation
 * from a search bar to a full-screen search UI.
 * 
 * Animation Mechanics:
 * 1. Uses shared element transform concept - the search bar "expands" into the full screen
 * 2. The transition uses parallel animations for:
 *    - Scale: The container grows from search bar size to full screen
 *    - Opacity: Content fades in as the container expands
 *    - TranslateY: Smooth vertical positioning during expansion
 * 3. All animations use spring physics for natural feel (tension/friction)
 * 
 * Usage:
 * <SearchBarTransition
 *   isExpanded={isSearchVisible}
 *   onSearchPress={() => setIsSearchVisible(true)}
 *   onClose={() => setIsSearchVisible(false)}
 *   placeholder="Search..."
 *   renderContent={(query, setQuery) => <YourSearchResults query={query} />}
 * />
 */

interface SearchBarTransitionProps {
  isExpanded: boolean;
  onSearchPress: () => void;
  onClose: () => void;
  placeholder?: string;
  renderContent?: (query: string, setQuery: (q: string) => void) => React.ReactNode;
  onQueryChange?: (query: string) => void;
  initialQuery?: string;
  style?: object;
}

export default function SearchBarTransition({
  isExpanded,
  onSearchPress,
  onClose,
  placeholder = "Search...",
  renderContent,
  onQueryChange,
  initialQuery = "",
  style,
}: SearchBarTransitionProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const inputRef = useRef<TextInput>(null);

  // Animation values for the container transform effect
  // expandAnim controls the overall expansion (0 = collapsed, 1 = expanded)
  const expandAnim = useRef(new Animated.Value(0)).current;
  
  // fadeAnim controls the opacity of the expanded content
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // scaleAnim provides subtle scale effect for the search bar
  const scaleAnim = useRef(new Animated.Value(1)).current;

  /**
   * Handle expansion animation
   * Uses spring animation for natural, physics-based movement
   * Parallel animations ensure all transforms happen simultaneously
   */
  const handleExpand = useCallback(() => {
    onSearchPress();
    
    // Run expansion animations in parallel for smooth transform
    Animated.parallel([
      // Main expansion animation - uses spring for natural bounce
      Animated.spring(expandAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65, // Higher tension = faster animation
        friction: 10, // Lower friction = more bounce
      }),
      // Fade in content slightly delayed for staggered effect
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        delay: 100, // Delay creates layered animation feel
        useNativeDriver: true,
      }),
      // Subtle scale animation on the search bar
      Animated.spring(scaleAnim, {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start(() => {
      // Focus input after animation completes
      inputRef.current?.focus();
    });
  }, [expandAnim, fadeAnim, scaleAnim, onSearchPress]);

  /**
   * Handle collapse animation
   * Reverse of expansion with slightly faster timing
   */
  const handleCollapse = useCallback(() => {
    // Blur input before animation
    inputRef.current?.blur();
    
    Animated.parallel([
      // Collapse animation
      Animated.spring(expandAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }),
      // Fade out content
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      // Reset scale
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start(() => {
      onClose();
    });
  }, [expandAnim, fadeAnim, scaleAnim, onClose]);

  // Track if we've expanded at least once (for collapse detection)
  const hasExpandedRef = useRef(false);

  // Trigger expansion/collapse based on isExpanded prop
  React.useEffect(() => {
    if (isExpanded) {
      hasExpandedRef.current = true;
      handleExpand();
    } else if (!isExpanded && hasExpandedRef.current) {
      handleCollapse();
    }
  // Note: We intentionally omit handleExpand/handleCollapse from deps
  // to prevent unnecessary re-runs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    onQueryChange?.(text);
  }, [onQueryChange]);

  const handleClear = useCallback(() => {
    setQuery("");
    onQueryChange?.("");
    inputRef.current?.focus();
  }, [onQueryChange]);

  // Interpolated values for smooth animations
  // Container height interpolates from search bar height to full screen
  const containerHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [56, SCREEN_HEIGHT],
  });

  // Background opacity for the overlay
  const overlayOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.3, 1],
  });

  // Border radius smoothly transitions from rounded to sharp
  const borderRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  // Vertical position adjustment during expansion
  const translateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -STATUSBAR_HEIGHT],
  });

  return (
    <View style={[styles.wrapper, style]}>
      {/* Collapsed Search Bar - shown when not expanded */}
      {!isExpanded && (
        <Animated.View
          style={[
            styles.collapsedBar,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.searchBarTouchable}
            onPress={handleExpand}
            activeOpacity={0.8}
          >
            <Ionicons name="search" color={Colors.light.primary} size={20} />
            <TextInput
              placeholder={placeholder}
              placeholderTextColor="#999"
              style={styles.collapsedInput}
              editable={false}
              pointerEvents="none"
            />
            <TouchableOpacity onPress={() => {}}>
              <Ionicons name="filter" size={22} color={Colors.light.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Expanded Search Screen */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.expandedContainer,
            {
              opacity: overlayOpacity,
              height: containerHeight,
              borderRadius: borderRadius,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Search bar header in expanded state */}
          <View style={styles.expandedHeader}>
            {/* Back button */}
            <TouchableOpacity
              onPress={handleCollapse}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            {/* Search input */}
            <View style={styles.expandedSearchBar}>
              <Ionicons name="search" color={Colors.light.primary} size={20} />
              <TextInput
                ref={inputRef}
                placeholder={placeholder}
                placeholderTextColor="#999"
                style={styles.expandedInput}
                value={query}
                onChangeText={handleQueryChange}
                autoFocus
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={handleClear}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search content with fade animation */}
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            {renderContent?.(query, setQuery)}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 100,
  },
  collapsedBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: "#f5f5f5",
    borderWidth: 1,
  },
  searchBarTouchable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  collapsedInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: Colors.light.primary,
    fontFamily: "Gilroy-Regular",
  },
  expandedContainer: {
    position: "absolute",
    top: 0,
    left: -20, // Account for parent padding
    right: -20,
    backgroundColor: "#fff",
    zIndex: 1000,
    overflow: "hidden",
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: STATUSBAR_HEIGHT + 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  expandedSearchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  expandedInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    color: Colors.light.primary,
    fontFamily: "Gilroy-Regular",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
