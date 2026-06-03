import Colors from "@/src/constants/Colors"
import { getProfile, updateProfile } from "@/src/services/user"
import { Font, displayTracking } from "@/src/theme/typography"
import { useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
  keyboardType,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  multiline?: boolean
  keyboardType?: "default" | "number-pad"
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
        keyboardType={keyboardType}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  )
}

export default function EditProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [bio, setBio] = useState("")
  const [program, setProgram] = useState("")
  const [year, setYear] = useState("")

  useEffect(() => {
    void getProfile().then((r) => {
      if (r.success) {
        setFirstName(r.data.first_name ?? "")
        setLastName(r.data.last_name ?? "")
        setBio(r.data.bio ?? "")
        setProgram(r.data.program ?? "")
        setYear(r.data.year_of_study != null ? String(r.data.year_of_study) : "")
      }
      setLoading(false)
    })
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      bio: bio.trim(),
      program: program.trim() || undefined,
      ...(year.trim() ? { year_of_study: Number(year) } : {}),
    })
    setSaving(false)
    if (res.success) {
      router.back()
    } else {
      Alert.alert("Couldn't save", res.error.message || "Please try again")
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
        <Text style={styles.title}>EDIT PROFILE</Text>
        <Pressable
          hitSlop={8}
          onPress={save}
          disabled={saving || loading}
          style={[styles.saveButton, (saving || loading) && styles.saveDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
          <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
          <Field label="Bio" value={bio} onChangeText={setBio} placeholder="A short bio" multiline />
          <Field label="Program" value={program} onChangeText={setProgram} placeholder="e.g. Computer Science" />
          <Field
            label="Year of study"
            value={year}
            onChangeText={(t) => setYear(t.replace(/[^0-9]/g, "").slice(0, 1))}
            placeholder="e.g. 2"
            keyboardType="number-pad"
          />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  cancel: { fontSize: 16, color: Colors.light.gray, fontFamily: Font.medium },
  title: { fontSize: 22, letterSpacing: displayTracking, color: Colors.light.text, fontFamily: Font.display },
  saveButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    minWidth: 64,
    alignItems: "center",
  },
  saveDisabled: { opacity: 0.4 },
  saveText: { color: "#fff", fontSize: 14, fontFamily: Font.semibold },
  body: { padding: 20, gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, color: Colors.light.text, fontFamily: Font.semibold },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
    backgroundColor: Colors.light.inputBackground,
    fontFamily: Font.body,
  },
  inputMultiline: { minHeight: 100 },
})
