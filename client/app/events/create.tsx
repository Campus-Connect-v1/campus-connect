import Colors from "@/src/constants/Colors"
import { createEvent, EVENT_TYPES } from "@/src/services/events"
import { useAuthStore } from "@/src/store/authStore"
import { Font, displayTracking } from "@/src/theme/typography"
import { formatEventDate } from "@/src/utils/time"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
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

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: Date
  onChange: (d: Date) => void
}) {
  const [mode, setMode] = useState<null | "date" | "time">(null)

  const open = () => setMode(Platform.OS === "ios" ? "date" : "date")

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.dateButton} onPress={open}>
        <Ionicons name="calendar-outline" size={18} color={Colors.light.accent} />
        <Text style={styles.dateText}>{formatEventDate(value)}</Text>
      </Pressable>
      {mode && (
        <DateTimePicker
          value={value}
          mode={Platform.OS === "ios" ? "datetime" : mode}
          onChange={(_, selected) => {
            if (Platform.OS === "ios") {
              if (selected) onChange(selected)
              return
            }
            // Android: pick date, then time.
            if (!selected) {
              setMode(null)
              return
            }
            if (mode === "date") {
              const next = new Date(value)
              next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
              onChange(next)
              setMode("time")
            } else {
              const next = new Date(value)
              next.setHours(selected.getHours(), selected.getMinutes())
              onChange(next)
              setMode(null)
            }
          }}
        />
      )}
      {Platform.OS === "ios" && mode && (
        <Pressable onPress={() => setMode(null)} style={styles.doneBtn}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      )}
    </View>
  )
}

export default function CreateEventScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const universityId = useAuthStore((s) => s.user?.university_id)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<string>("social")
  const now = new Date()
  const [start, setStart] = useState(new Date(now.getTime() + 60 * 60 * 1000))
  const [end, setEnd] = useState(new Date(now.getTime() + 2 * 60 * 60 * 1000))
  const [isVirtual, setIsVirtual] = useState(false)
  const [location, setLocation] = useState("")
  const [requiresRsvp, setRequiresRsvp] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = title.trim().length > 1 && !submitting

  const submit = async () => {
    if (!canSubmit) return
    if (!universityId) {
      Alert.alert("Can't create event", "Your account isn't linked to a university.")
      return
    }
    if (end <= start) {
      Alert.alert("Check the times", "The end time must be after the start time.")
      return
    }
    setSubmitting(true)
    const res = await createEvent({
      university_id: universityId,
      event_title: title.trim(),
      event_description: description.trim() || undefined,
      event_type: type,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      location_type: isVirtual ? "virtual" : "physical",
      physical_location: isVirtual ? undefined : location.trim() || undefined,
      virtual_link: isVirtual ? location.trim() || undefined : undefined,
      requires_rsvp: requiresRsvp,
    })
    setSubmitting(false)
    if (res.success) router.back()
    else Alert.alert("Couldn't create event", res.error.message || "Please try again")
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
        <Text style={styles.headerTitle}>NEW EVENT</Text>
        <Pressable
          hitSlop={8}
          onPress={submit}
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

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Spring Hackathon"
            placeholderTextColor={Colors.light.gray}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's the event about?"
            placeholderTextColor={Colors.light.gray}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {EVENT_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.chip, t === type && styles.chipActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.chipText, t === type && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <DateTimeField label="Starts" value={start} onChange={setStart} />
        <DateTimeField label="Ends" value={end} onChange={setEnd} />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Virtual event</Text>
            <Text style={styles.hint}>Online instead of on campus</Text>
          </View>
          <Switch value={isVirtual} onValueChange={setIsVirtual} trackColor={{ true: Colors.light.primary }} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{isVirtual ? "Meeting link" : "Location"}</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder={isVirtual ? "https://…" : "e.g. Engineering Quad"}
            placeholderTextColor={Colors.light.gray}
            autoCapitalize={isVirtual ? "none" : "sentences"}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Requires RSVP</Text>
            <Text style={styles.hint}>Ask attendees to respond</Text>
          </View>
          <Switch value={requiresRsvp} onValueChange={setRequiresRsvp} trackColor={{ true: Colors.light.primary }} />
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
  cancel: { fontSize: 16, color: Colors.light.gray, fontFamily: Font.medium },
  headerTitle: { fontSize: 22, letterSpacing: displayTracking, color: Colors.light.text, fontFamily: Font.display },
  createButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    minWidth: 72,
    alignItems: "center",
  },
  createDisabled: { opacity: 0.4 },
  createText: { color: "#fff", fontSize: 14, fontFamily: Font.semibold },
  body: { padding: 20, gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, color: Colors.light.text, fontFamily: Font.semibold },
  hint: { fontSize: 13, color: Colors.light.gray, fontFamily: Font.medium, marginTop: 2 },
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
  inputMultiline: { minHeight: 90 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  chipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontFamily: Font.semibold, fontSize: 13, color: Colors.light.gray, textTransform: "capitalize" },
  chipTextActive: { color: "#FBF5E9" },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    backgroundColor: Colors.light.inputBackground,
  },
  dateText: { fontFamily: Font.medium, fontSize: 15, color: Colors.light.text },
  doneBtn: { alignSelf: "flex-end", paddingVertical: 6, paddingHorizontal: 12 },
  doneText: { fontFamily: Font.semibold, fontSize: 14, color: Colors.light.primary },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
})
