import type React from "react"
import { View, TextInput, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface SearchBarProps {
  value: string
  onChangeText: (text: string) => void
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color="#94a3b8" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Search conversations..."
        placeholderTextColor="#cbd5e1"
        value={value}
        onChangeText={onChangeText}
      />
      {value && (
        <Ionicons
          name="close-circle"
          size={18}
          color="#cbd5e1"
          onPress={() => onChangeText("")}
          style={styles.clearIcon}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: "Gilroy-Regular",
    fontSize: 14,
    color: "#0f172a",
  },
  clearIcon: {
    marginLeft: 8,
  },
})

export default SearchBar
