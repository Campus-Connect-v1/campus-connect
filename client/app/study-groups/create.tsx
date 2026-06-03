import Colors from "@/src/constants/Colors"
import { createStudyGroup } from "@/src/services/studyGroups"
import { useAuthStore } from "@/src/store/authStore"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.gray}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  )
}

export default function CreateStudyGroupScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const universityId = useAuthStore((s) => s.user?.university_id)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [courseCode, setCourseCode] = useState("")
  const [courseName, setCourseName] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = name.trim().length > 1 && !submitting

  const handleCreate = async () => {
    if (!canSubmit) return
    if (!universityId) {
      Alert.alert("Can't create group", "Your account isn't linked to a university.")
      return
    }
    setSubmitting(true)
    const res = await createStudyGroup({
      university_id: universityId,
      group_name: name.trim(),
      description: description.trim() || undefined,
      course_code: courseCode.trim() || undefined,
      course_name: courseName.trim() || undefined,
      group_type: isPrivate ? "private" : "public",
    })
    setSubmitting(false)

    if (res.success) {
      router.back()
    } else {
      Alert.alert("Couldn't create group", res.error.message || "Please try again")
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable hitSlop={8} onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New Study Group</Text>
        <Pressable
          hitSlop={8}
          onPress={handleCreate}
          disabled={!canSubmit}
          style={[styles.createButton, !canSubmit && styles.createDisabled]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.createText}>Create</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Group name" value={name} onChangeText={setName} placeholder="e.g. CS101 Study Crew" />
        <Field
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What's this group about?"
          multiline
        />
        <Field label="Course code" value={courseCode} onChangeText={setCourseCode} placeholder="e.g. CS101" />
        <Field label="Course name" value={courseName} onChangeText={setCourseName} placeholder="e.g. Intro to Computer Science" />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Private group</Text>
            <Text style={styles.hint}>Only invited members can join</Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ true: Colors.light.primary }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  cancel: { fontSize: 16, color: Colors.light.gray, fontFamily: "Barlow_500Medium" },
  title: { fontSize: 17, color: Colors.light.text, fontFamily: "Barlow_600SemiBold" },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    minWidth: 72,
    alignItems: "center",
  },
  createDisabled: { opacity: 0.4 },
  createText: { color: "#fff", fontSize: 14, fontFamily: "Barlow_600SemiBold" },
  body: { padding: 20, gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, color: Colors.light.text, fontFamily: "Barlow_600SemiBold" },
  hint: { fontSize: 13, color: Colors.light.gray, fontFamily: "Barlow_500Medium", marginTop: 2 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.inputBackground,
    fontFamily: "Barlow_400Regular",
  },
  inputMultiline: { height: 100, paddingTop: 14 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
})
