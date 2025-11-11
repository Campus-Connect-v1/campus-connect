import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Switch,
  Animated,
} from 'react-native';

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  hideViewCount: boolean;
  hideLikeCount: boolean;
  turnOffComments: boolean;
  onToggleViewCount: (value: boolean) => void;
  onToggleLikeCount: (value: boolean) => void;
  onToggleComments: (value: boolean) => void;
}

const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  visible,
  onClose,
  hideViewCount,
  hideLikeCount,
  turnOffComments,
  onToggleViewCount,
  onToggleLikeCount,
  onToggleComments,
}) => {
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

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
            <Animated.View 
              className="bg-white rounded-t-3xl"
              style={{ transform: [{ translateY: slideAnim }] }}
            >
              {/* Handle Bar */}
              <View className="items-center py-3">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Header */}
              <View className="px-4 pb-2 border-b border-gray-100">
                <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-lg font-semibold text-black text-center">
                  Privacy Settings
                </Text>
              </View>

              {/* Options */}
              <View className="px-4 py-4 pb-8">
                {/* Hide View Count */}
                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-1 pr-3">
                    <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                      Hide view count
                    </Text>
                    <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                      Only you will see the total number of views
                    </Text>
                  </View>
                  <Switch
                    value={hideViewCount}
                    onValueChange={onToggleViewCount}
                    trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Hide Like Count */}
                <View className="flex-row items-center justify-between py-3 border-t border-gray-100">
                  <View className="flex-1 pr-3">
                    <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                      Hide like count
                    </Text>
                    <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                      Only you will see the total number of likes
                    </Text>
                  </View>
                  <Switch
                    value={hideLikeCount}
                    onValueChange={onToggleLikeCount}
                    trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Turn Off Comments */}
                <View className="flex-row items-center justify-between py-3 border-t border-gray-100">
                  <View className="flex-1 pr-3">
                    <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base font-semibold text-black">
                      Turn off commenting
                    </Text>
                    <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-1">
                      Disable comments on this post
                    </Text>
                  </View>
                  <Switch
                    value={turnOffComments}
                    onValueChange={onToggleComments}
                    trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Done Button */}
                <TouchableOpacity
                  onPress={onClose}
                  className="mt-6 bg-blue-600 rounded-full py-3"
                >
                  <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-white text-center text-base">
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default PrivacySettingsModal;
