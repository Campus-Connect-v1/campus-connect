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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { userApi } from "@/src/services/api"
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
  const { success, error, alert, hideAlert } = useDropdownAlert()

  useEffect(() => {
    if (profile) {
      setFormData(profile)
    }
  }, [profile, visible])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile(formData)
      success("Profile Updated", "Your profile has been updated successfully.", 3000)
      onSave(formData)
      onClose()
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

            {/* Email */}
            <View className="mb-6">
              <Text style={{ fontFamily: "Gilroy-Regular" }} className="text-gray-600 text-sm mb-2">
                Email
              </Text>
              <TextInput
                style={{ fontFamily: "Gilroy-Regular" }}
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
                placeholder="Email"
                value={formData?.email || ""}
                onChangeText={(value) => updateField("email", value)}
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
                placeholder="Program"
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
                placeholder="Year"
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
                placeholder="Graduation year"
                value={formData?.graduation_year || ""}
                onChangeText={(value) => updateField("graduation_year", value)}
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default EditProfileModal
