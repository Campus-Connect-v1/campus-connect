"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert"
import DropdownAlert from "./DropdownAlert"
import { updateProfile } from "@/src/services/authServices"

interface EditProfileModalProps {
  visible: boolean
  profile: any
  onClose: () => void
  onSave: (updatedProfile: any) => Promise<void>
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, profile, onClose, onSave }) => {
  const [formData, setFormData] = useState(profile || {})
  const [isSaving, setIsSaving] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const { success, error, alert, hideAlert } = useDropdownAlert()

  useEffect(() => {
    if (profile) {
      setFormData(profile)
      setSelectedImage(profile.profile_picture_url || null)
    }
  }, [profile, visible])

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri)
      // Update formData with new image URI
      setFormData((prev: any) => ({
        ...prev,
        profile_picture_url: result.assets[0].uri,
      }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile(formData)
      success("Profile Updated", "Your profile has been updated successfully.", 3000)
      onSave(formData)
      onClose()
    } catch {
      error("Update Failed", "Failed to update profile. Please try again.", 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="flex-1 bg-white mt-10">
          <DropdownAlert
            visible={alert.visible}
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onDismiss={hideAlert}
          />
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={{ fontFamily: "Gilroy-SemiBold" }} className="text-lg font-semibold">
              Edit Profile
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Text style={{ fontFamily: "Gilroy-SemiBold" }} className="text-blue-600 text-base">
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView className="flex-1 px-4 py-6">
            {/* Profile Picture */}
            <View className="items-center mb-6">
              <View className="relative">
                <Image
                  source={{
                    uri: selectedImage || formData?.profile_picture_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
                  }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
                <TouchableOpacity
                  onPress={handleSelectImage}
                  className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2"
                  style={{ elevation: 4, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4 }}
                >
                  <Ionicons name="pencil" size={18} color="white" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-500 text-sm mt-2">
                Tap the pencil to change photo
              </Text>
            </View>

            {/* First Name */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                First Name
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="First name"
                value={formData?.first_name || ""}
                onChangeText={(value) => updateField("first_name", value)}
              />
            </View>

            {/* Last Name */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Last Name
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Last name"
                value={formData?.last_name || ""}
                onChangeText={(value) => updateField("last_name", value)}
              />
            </View>

            {/* Profile Headline */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Profile Headline
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="e.g., Computer Science Student"
                value={formData?.profile_headline || ""}
                onChangeText={(value) => updateField("profile_headline", value)}
              />
            </View>

            {/* Bio */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Bio
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Tell us about yourself"
                value={formData?.bio || ""}
                onChangeText={(value) => updateField("bio", value)}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* Email */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Email
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-100"
                placeholder="Email"
                value={formData?.email || ""}
                editable={false}
              />
            </View>

            {/* Phone */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Phone
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Phone number"
                value={formData?.phone_number || ""}
                onChangeText={(value) => updateField("phone_number", value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Program */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Program
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="e.g., Computer Science"
                value={formData?.program || ""}
                onChangeText={(value) => updateField("program", value)}
              />
            </View>

            {/* Year of Study */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Year of Study
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="e.g., 2nd Year"
                value={formData?.year_of_study || ""}
                onChangeText={(value) => updateField("year_of_study", value)}
              />
            </View>

            {/* Graduation Year */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Graduation Year
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="e.g., 2025"
                value={formData?.graduation_year || ""}
                onChangeText={(value) => updateField("graduation_year", value)}
                keyboardType="numeric"
              />
            </View>

            {/* Gender */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Gender
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Gender"
                value={formData?.gender || ""}
                onChangeText={(value) => updateField("gender", value)}
              />
            </View>

            {/* LinkedIn URL */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                LinkedIn Profile
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData?.linkedin_url || ""}
                onChangeText={(value) => updateField("linkedin_url", value)}
                autoCapitalize="none"
              />
            </View>

            {/* Website URL */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Website
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="https://yourwebsite.com"
                value={formData?.website_url || ""}
                onChangeText={(value) => updateField("website_url", value)}
                autoCapitalize="none"
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default EditProfileModal
