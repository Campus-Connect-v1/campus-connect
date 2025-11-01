import { Ionicons } from "@expo/vector-icons"
import React, { useEffect, useRef, useCallback } from "react"
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated"
import { BlurView } from "expo-blur"
import * as Haptics from "expo-haptics"
import { Image } from "expo-image"
import { useRouter } from "expo-router"

const { height } = Dimensions.get("window")

interface SearchModalProps {
  visible: boolean
  onClose: () => void
  users: Array<{
    id: string
    first_name: string
    last_name: string
    profile_picture_url?: string
    program?: string
  }>
  isLoading?: boolean
  query: string
  onQueryChange: (text: string) => void
}

const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  onClose,
  users,
  isLoading = false,
  query,
  onQueryChange,
}) => {
  const router = useRouter()
  const inputRef = useRef<TextInput>(null)
  const spinValue = useSharedValue(0)
  
  // Animation values
  const translateY = useSharedValue(height)
  const opacity = useSharedValue(0)

  // Handle modal open/close with animations
  useEffect(() => {
    if (visible) {
      // Trigger light haptic feedback when opening
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      
      // Animate modal in
      opacity.value = withTiming(1, { duration: 250 })
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
        mass: 0.5,
      })
      
      // Auto-focus keyboard after a short delay
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    } else {
      // Animate modal out
      opacity.value = withTiming(0, { duration: 200 })
      translateY.value = withSpring(height, {
        damping: 20,
        stiffness: 100,
      })
    }
  }, [visible])

  // Memoized handlers
  const handleClearQuery = useCallback(() => {
    onQueryChange("")
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [onQueryChange])

  const handleItemPressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [])

  const handleClose = useCallback(() => {
    // Trigger haptic feedback on close
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Keyboard.dismiss()
    onClose()
  }, [onClose])

  const handleUserPress = useCallback((userId: string) => {
    // Trigger haptic feedback on selection
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    handleClose()
    setTimeout(() => {
      router.push({
        pathname: '/(users)/[id]',
        params: { id: userId },
      })
    }, 100)
  }, [router, handleClose])

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const renderUserItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item.id)}
      className="flex-row items-center py-3 px-4 border-b border-gray-100/50"
      activeOpacity={0.7}
      onPressIn={handleItemPressIn}
    >
      <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3 overflow-hidden">
        {item.profile_picture_url ? (
          <Image
            source={{ uri: item.profile_picture_url }}
            style={{ width: 48, height: 48 }}
            contentFit="cover"
          />
        ) : (
          <Ionicons name="person" size={24} color="#3b82f6" />
        )}
      </View>
      <View className="flex-1">
        <Text style={{ fontFamily: 'Gilroy-SemiBold' }} className="text-base text-gray-900">
          {item.first_name} {item.last_name}
        </Text>
        {item.program && (
          <Text style={{ fontFamily: 'Gilroy-Regular' }} className="text-sm text-gray-500 mt-0.5">
            {item.program}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  ), [handleUserPress, handleItemPressIn])

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Animated frosted glass backdrop */}
        <Animated.View style={[{ flex: 1 }, backdropStyle]}>
          <BlurView 
            intensity={50} 
            tint="dark"
            style={{ flex: 1 }}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={handleClose}
              style={{ flex: 1, justifyContent: 'flex-end' }}
            >
              {/* Modal content - Prevent touches from closing modal */}
              <TouchableOpacity activeOpacity={1}>
                <Animated.View 
                  style={[
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      borderTopLeftRadius: 32,
                      borderTopRightRadius: 32,
                      maxHeight: height * 0.85,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: -4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 10,
                    },
                    modalStyle
                  ]}
                >
                  {/* Handle Bar */}
                  <View className="items-center pt-3 pb-2">
                    <View 
                      style={{
                        width: 36,
                        height: 5,
                        backgroundColor: '#d1d5db',
                        borderRadius: 3,
                      }}
                    />
                  </View>

                  {/* Header with Search Input and Cancel */}
                  <View className="px-5 pb-3">
                    <View className="flex-row items-center">
                      <View className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mr-3">
                        <Ionicons name="search" size={20} color="#6b7280" />
                        <TextInput
                          ref={inputRef}
                          placeholder="Search people, events, or groups"
                          placeholderTextColor="#9ca3af"
                          value={query}
                          onChangeText={onQueryChange}
                          className="flex-1 ml-2 text-base"
                          style={{ fontFamily: 'Gilroy-Regular', color: '#1f2937' }}
                          returnKeyType="search"
                          autoCorrect={false}
                          autoCapitalize="none"
                        />
                        {query.length > 0 && (
                          <TouchableOpacity
                            onPress={handleClearQuery}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-circle" size={20} color="#9ca3af" />
                          </TouchableOpacity>
                        )}
                      </View>
                      
                      {/* Cancel Button */}
                      <TouchableOpacity
                        onPress={handleClose}
                        activeOpacity={0.7}
                        onPressIn={handleItemPressIn}
                      >
                        <Text 
                          style={{ fontFamily: 'Gilroy-SemiBold' }} 
                          className="text-base text-blue-600"
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={{ height: 1, backgroundColor: '#f3f4f6' }} />

                  {/* Results List */}
                  {isLoading ? (
                    <View className="py-16 items-center">
                      <View className="w-10 h-10 items-center justify-center">
                        <Ionicons name="hourglass-outline" size={32} color="#3b82f6" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-gray-500 mt-4">
                        Searching...
                      </Text>
                    </View>
                  ) : users.length > 0 ? (
                    <FlatList
                      data={users}
                      keyExtractor={(item) => item.id}
                      renderItem={renderUserItem}
                      style={{ maxHeight: height * 0.6 }}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    />
                  ) : query.length > 0 ? (
                    <View className="py-16 items-center">
                      <View 
                        className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4"
                      >
                        <Ionicons name="search-outline" size={40} color="#9ca3af" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base text-gray-700">
                        No results found
                      </Text>
                      <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-2">
                        Try a different search term
                      </Text>
                    </View>
                  ) : (
                    <View className="py-16 items-center">
                      <View 
                        className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4"
                      >
                        <Ionicons name="search-outline" size={40} color="#9ca3af" />
                      </View>
                      <Text style={{fontFamily: 'Gilroy-SemiBold'}} className="text-base text-gray-700">
                        Start searching
                      </Text>
                      <Text style={{fontFamily: 'Gilroy-Regular'}} className="text-sm text-gray-500 mt-2">
                        Find people, events, or groups
                      </Text>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default SearchModal
