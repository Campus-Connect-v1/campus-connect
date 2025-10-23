import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';


const CustomDropdown = ({
  options,
  onSelect,
  selectedValue,
  placeholder,
  label,
  error,
}: {
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  selectedValue?: string;
  placeholder?: string;
  label?: string;
  error?: string;
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item: { label: string; value: string }) => {
    onSelect(item.value);
    setModalVisible(false);
  };

  return (
    <View className='gap-2'>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={[
          styles.dropdownButton,
          { borderColor: modalVisible ? '#80548D' : '#D1D5DB' },
        ]}
      >
        <Text
          style={[
            styles.dropdownText,
            {
              color: selectedValue ? '#ffffff' : '#ffffff',
            },
          ]}
        >
          {selectedValue
            ? options.find(o => o.value === selectedValue)?.label
            : "Select your university"}
        </Text>
        <Ionicons name='arrow-down' size={22} color='#ffffff' />
      </TouchableOpacity>

      {/* Modal for options */}
      <Modal
        transparent
        visible={modalVisible}
        animationType='fade'
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  style={styles.optionItem}
                >
                  <Text className='text-base font-[Gilroy-Medium] text-[#1C1C1C]'>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {error && (
        <Text className='text-red-500 text-sm mt-1 font-PoppinsRegular'>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 13,
    paddingHorizontal: 14,
    width: '100%',
    justifyContent: 'space-between',
    fontFamily: 'Gilroy-Regular',
  },
  dropdownText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontFamily: 'Gilroy-Regular',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    width: '100%',
    maxHeight: '60%',
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
});

export default CustomDropdown;
