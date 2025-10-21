import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface PostActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onShare?: () => void;
  onSavePost?: () => void;
  onHidePost?: () => void;
  isOwnPost?: boolean;
}

const PostActionsModal: React.FC<PostActionsModalProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  onReport,
  onShare,
  onSavePost,
  onHidePost,
  isOwnPost = false,
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

              {/* Modal Content */}
              <View className="px-4 pb-8">
                {isOwnPost ? (
                  // Actions for user's own posts
                  <>
                    <TouchableOpacity
                      onPress={() => handleAction(onEdit || (() => {}))}
                      className="flex-row items-center py-4 border-b border-gray-100"
                    >
                      <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="create-outline" size={20} color="#3b82f6" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                        Edit Post
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAction(onShare || (() => {}))}
                      className="flex-row items-center py-4 border-b border-gray-100"
                    >
                      <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="share-outline" size={20} color="#10b981" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                        Share Post
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAction(onDelete || (() => {}))}
                      className="flex-row items-center py-4"
                    >
                      <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-red-500">
                        Delete Post
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Actions for other users' posts
                  <>
                    <TouchableOpacity
                      onPress={() => handleAction(onSavePost || (() => {}))}
                      className="flex-row items-center py-4 border-b border-gray-100"
                    >
                      <View className="w-10 h-10 bg-yellow-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="bookmark-outline" size={20} color="#f59e0b" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                        Save Post
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAction(onShare || (() => {}))}
                      className="flex-row items-center py-4 border-b border-gray-100"
                    >
                      <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="share-outline" size={20} color="#10b981" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                        Share Post
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAction(onHidePost || (() => {}))}
                      className="flex-row items-center py-4 border-b border-gray-100"
                    >
                      <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="eye-off-outline" size={20} color="#6b7280" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                        Hide Post
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAction(onReport || (() => {}))}
                      className="flex-row items-center py-4"
                    >
                      <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                        <Ionicons name="flag-outline" size={20} color="#ef4444" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-red-500">
                        Report Post
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default PostActionsModal;
