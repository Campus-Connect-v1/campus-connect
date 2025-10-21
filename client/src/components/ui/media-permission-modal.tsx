import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface MediaPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onAllowAccess: () => void;
  onDenyAccess: () => void;
  permissionType: 'camera' | 'photos';
}

const MediaPermissionModal: React.FC<MediaPermissionModalProps> = ({
  visible,
  onClose,
  onAllowAccess,
  onDenyAccess,
  permissionType,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
              {/* Icon */}
              <View className="items-center mb-4">
                <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center">
                  <Ionicons 
                    name={permissionType === 'camera' ? 'camera' : 'images'} 
                    size={32} 
                    color="#3b82f6" 
                  />
                </View>
              </View>

              {/* Title */}
              <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black text-center mb-2">
                Allow Access to {permissionType === 'camera' ? 'Camera' : 'Photos'}
              </Text>

              {/* Description */}
              <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-600 text-center mb-6 leading-5">
                {permissionType === 'camera' 
                  ? 'We need access to your camera to take photos and videos for your posts.'
                  : 'We need access to your photo library to select images for your posts.'
                }
              </Text>

              {/* Buttons */}
              <View className="space-y-4">
                <TouchableOpacity
                  onPress={onAllowAccess}
                  className="bg-[#002D69] rounded-full py-3 items-center mb-3"
                >
                  <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-white text-base font-semibold">
                    Allow Access
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onDenyAccess}
                  className="border border-gray-300 rounded-full py-3 items-center"
                >
                  <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-gray-700 text-base font-semibold">
                    Not Now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default MediaPermissionModal;
