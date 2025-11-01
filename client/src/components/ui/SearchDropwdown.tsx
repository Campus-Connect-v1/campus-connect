
import { Ionicons } from "@expo/vector-icons"
import type React from "react"
import { useState } from "react"
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable } from "react-native"

const CustomDropdown = ({
  options,
  onSelect,
  selectedValue,
  placeholder,
  label,
  error,
  renderItem,
  isSearchDropdown = false,
}: {
  options: { label: string; value: string }[]
  onSelect: (value: string) => void
  selectedValue?: string
  placeholder?: string
  label?: string
  error?: string
  renderItem?: (item: any) => React.ReactNode
  isSearchDropdown?: boolean
}) => {
  const [modalVisible, setModalVisible] = useState(false)

  const handleSelect = (item: { label: string; value: string }) => {
    onSelect(item.value)
    setModalVisible(false)
  }

  return (
    <View className="gap-2">
      {!isSearchDropdown && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}
          style={[styles.dropdownButton, { borderColor: modalVisible ? "#80548D" : "#D1D5DB" }]}
        >
          <Text
            style={[
              styles.dropdownText,
              {
                color: selectedValue ? "#ffffff" : "#ffffff",
                fontFamily: selectedValue ? "Gilroy-SemiBold" : "Gilroy-Regular",
              },
            ]}
          >
            {selectedValue ? options.find((o) => o.value === selectedValue)?.label : placeholder || "Select an option"}
          </Text>
          <Ionicons name="arrow-down" size={22} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Modal for options */}
      <Modal
        transparent
        visible={modalVisible || isSearchDropdown}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, isSearchDropdown && styles.searchModalContent]} pointerEvents="box-none">
            {options.length > 0 ? (
              <FlatList
                data={options}
                keyExtractor={(item, index) => item.value || index.toString()}
                scrollEnabled={true}
                renderItem={({ item }) =>
                  renderItem ? (
                    <TouchableOpacity onPress={() => handleSelect(item)} style={styles.customItemContainer}>
                      {renderItem(item)}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => handleSelect(item)} style={styles.optionItem}>
                      <Text className="text-base font-[Gilroy-Medium] text-[#1C1C1C]">{item.label}</Text>
                    </TouchableOpacity>
                  )
                }
              />
            ) : (
              <View style={{ padding: 12, alignItems: "center" }}>
                <Text style={{ color: "#999" }}>No matches found</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      {error && <Text className="text-red-500 text-sm mt-1 font-PoppinsRegular">{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 13,
    paddingHorizontal: 14,
    width: "100%",
    justifyContent: "space-between",
    fontFamily: "Gilroy-Regular",
  },
  dropdownText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontFamily: "Gilroy-Regular",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    width: "100%",
    maxHeight: "60%",
  },
  searchModalContent: {
    maxHeight: "70%",
    minHeight: 100,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  customItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
})

export default CustomDropdown
