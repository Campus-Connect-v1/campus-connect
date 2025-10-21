import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectLibrary: () => void;
  onSelectVideo: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  visible,
  onClose,
  onSelectCamera,
  onSelectLibrary,
  onSelectVideo,
}) => {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/70 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl">
              {/* Handle Bar */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Header */}
              <View className="px-4 pb-2">
                <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black text-center">
                  Create New Post
                </Text>
              </View>

              {/* Options */}
              <View className="px-4 pb-8">
                <TouchableOpacity
                  onPress={() => handleAction(onSelectCamera)}
                  className="flex-row items-center py-4 border-b border-gray-100"
                >
                  <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="camera" size={24} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                      Camera
                    </Text>
                    <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500">
                      Take a photo or video
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAction(onSelectLibrary)}
                  className="flex-row items-center py-4 border-b border-gray-100"
                >
                  <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="images" size={24} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                      Photo Library
                    </Text>
                    <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500">
                      Choose from your photos
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAction(onSelectVideo)}
                  className="flex-row items-center py-4"
                >
                  <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4">
                    <Ionicons name="videocam" size={24} color="#8b5cf6" />
                  </View>
                  <View className="flex-1">
                    <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                      Video
                    </Text>
                    <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500">
                      Record or select video
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CreatePostModal;
