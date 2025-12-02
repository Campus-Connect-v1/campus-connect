/**
 * SearchBar Component
 * 
 * A reusable search bar component that can be used standalone or with
 * ContainerTransform for animated transitions to full search screens.
 * 
 * Features:
 * - Clean, minimal design matching app theme
 * - Configurable placeholder text
 * - Optional onPress for navigation/modal triggers
 * - Supports both controlled and uncontrolled modes
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Colors from '@/src/constants/Colors';

interface SearchBarProps {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Current search value (controlled mode) */
  value?: string;
  /** Callback when search value changes */
  onChangeText?: (text: string) => void;
  /** Callback when search bar is pressed (for navigation) */
  onPress?: () => void;
  /** Whether the input should be editable */
  editable?: boolean;
  /** Auto focus the input when mounted */
  autoFocus?: boolean;
  /** Callback when submit/search button is pressed */
  onSubmit?: () => void;
  /** Custom container style */
  style?: ViewStyle;
  /** Show clear button when text is present */
  showClearButton?: boolean;
  /** Callback when clear button is pressed */
  onClear?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onPress,
  editable = true,
  autoFocus = false,
  onSubmit,
  style,
  showClearButton = true,
  onClear,
}) => {
  // If onPress is provided, render as a touchable button
  // This is useful for triggering navigation to a search screen
  if (onPress && !editable) {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={Colors.light.gray}
          style={styles.icon}
        />
        <Text style={styles.placeholderText}>{placeholder}</Text>
      </TouchableOpacity>
    );
  }

  // Render as an actual input for search functionality
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="search-outline"
        size={20}
        color={Colors.light.gray}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.gray}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {showClearButton && value && value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText?.('');
            onClear?.();
          }}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={18} color={Colors.light.gray} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.text,
    paddingVertical: 0,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Gilroy-Regular',
    color: Colors.light.gray,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default SearchBar;
