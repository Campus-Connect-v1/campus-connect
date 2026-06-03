import Colors from "@/src/constants/Colors"
import {
  getEvent,
  rsvpToEvent,
  type CampusEvent,
  type RsvpStatus,
} from "@/src/services/events"
import { Font, displayTracking } from "@/src/theme/typography"
import { dateChip, formatEventDate } from "@/src/utils/time"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const RSVP_OPTIONS: { status: RsvpStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: "going", label: "Going", icon: "checkmark-circle" },
  { status: "interested", label: "Interested", icon: "star" },
  { status: "not_going", label: "Can't go", icon: "close-circle" },
]

function Row({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={Colors.light.primary} />
      <Text style={styles.rowText}>{children}</Text>
    </View>
  )
}

function formatType(type: string) {
  return type.replace(/_/g, " ")
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [event, setEvent] = useState<CampusEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rsvp, setRsvp] = useState<RsvpStatus | null>(null)
  const [savingRsvp, setSavingRsvp] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getEvent(id)
    if (res.success) {
      setEvent(res.data)
      setRsvp(res.data.user_rsvp_status ?? null)
      setError(null)
    } else {
      setError(res.error.message)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const handleRsvp = async (status: RsvpStatus) => {
    const previous = rsvp
    setRsvp(status) // optimistic
    setSavingRsvp(true)
    const res = await rsvpToEvent(id, status)
    setSavingRsvp(false)
    if (!res.success) {
      setRsvp(previous)
      Alert.alert("RSVP failed", res.error.message || "Please try again")
    }
  }

  const openVirtualLink = async () => {
    if (!event?.virtual_link) return
    const supported = await Linking.canOpenURL(event.virtual_link)
    if (!supported) {
      Alert.alert("Link unavailable", "This event link could not be opened.")
      return
    }
    await Linking.openURL(event.virtual_link)
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    )
  }

  if (error || !event) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Ionicons name="alert-circle-outline" size={44} color={Colors.light.gray} />
        <Text style={styles.errorText}>{error ?? "Event not found"}</Text>
      </View>
    )
  }

  const isVirtual = event.location_type === "virtual"
  const chip = dateChip(event.start_time)
  const host =
    event.first_name || event.last_name
      ? `${event.first_name ?? ""} ${event.last_name ?? ""}`.trim()
      : "Campus Connect"
  const attendeeCount = event.attendee_count ?? event.going_count

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 48 },
      ]}
    >
      <View style={styles.hero}>
        <Pressable style={styles.inlineBack} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.background} />
          <Text style={styles.inlineBackText}>Events</Text>
        </Pressable>

        <View style={styles.heroTop}>
          <View style={styles.dateChip}>
            <Text style={styles.month}>{chip.month}</Text>
            <Text style={styles.day}>{chip.day}</Text>
          </View>
          <View style={styles.heroMeta}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{formatType(event.event_type)}</Text>
            </View>
            <Text style={styles.hostText} numberOfLines={1}>
              Hosted by {host}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{event.event_title}</Text>
        {!!event.university_name && (
          <Text style={styles.university} numberOfLines={1}>
            {event.university_name}
          </Text>
        )}
      </View>

      <View style={styles.quickFacts}>
        <View style={styles.fact}>
          <Ionicons name="time-outline" size={18} color={Colors.light.accent} />
          <Text style={styles.factLabel}>Starts</Text>
          <Text style={styles.factValue}>{formatEventDate(event.start_time)}</Text>
        </View>
        <View style={styles.factDivider} />
        <View style={styles.fact}>
          <Ionicons
            name={isVirtual ? "videocam-outline" : "location-outline"}
            size={18}
            color={Colors.light.accent}
          />
          <Text style={styles.factLabel}>{isVirtual ? "Format" : "Location"}</Text>
          <Text style={styles.factValue} numberOfLines={2}>
            {isVirtual ? "Online" : event.physical_location || "Location TBA"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Row icon="calendar-outline">Ends {formatEventDate(event.end_time)}</Row>
        {isVirtual ? (
          <Pressable onPress={openVirtualLink} disabled={!event.virtual_link}>
            <Row icon="open-outline">
              {event.virtual_link ? "Open event link" : "Event link TBA"}
            </Row>
          </Pressable>
        ) : (
          <Row icon="navigate-outline">{event.physical_location || "Location TBA"}</Row>
        )}
        {attendeeCount != null && (
          <Row icon="people-outline">{attendeeCount} attending</Row>
        )}
        {event.max_attendees != null && (
          <Row icon="person-add-outline">Capacity: {event.max_attendees}</Row>
        )}
      </View>

      {!!event.event_description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{event.event_description}</Text>
        </View>
      )}

      {event.requires_rsvp ? (
        <View style={styles.rsvpSection}>
          <View style={styles.rsvpHeader}>
            <Text style={styles.sectionTitle}>Your RSVP</Text>
            {savingRsvp && <ActivityIndicator size="small" color={Colors.light.primary} />}
          </View>
          <View style={styles.rsvpRow}>
            {RSVP_OPTIONS.map((opt) => {
              const active = rsvp === opt.status
              return (
                <Pressable
                  key={opt.status}
                  style={[styles.rsvpButton, active && styles.rsvpButtonActive]}
                  onPress={() => handleRsvp(opt.status)}
                  disabled={savingRsvp}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={active ? Colors.light.background : Colors.light.primary}
                  />
                  <Text style={[styles.rsvpText, active && styles.rsvpTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : (
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.light.accent} />
          <Text style={styles.noticeText}>This event does not require an RSVP.</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  hero: {
    backgroundColor: Colors.light.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  inlineBack: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 18,
  },
  inlineBackText: {
    fontSize: 15,
    color: Colors.light.background,
    fontFamily: Font.semibold,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, padding: 32 },
  errorText: { color: Colors.light.gray, fontFamily: Font.medium, textAlign: "center" },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  dateChip: {
    width: 62,
    height: 68,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    justifyContent: "center",
    alignItems: "center",
  },
  month: {
    color: Colors.light.primary,
    fontSize: 12,
    fontFamily: Font.semibold,
    letterSpacing: 1,
  },
  day: {
    color: Colors.light.primary,
    fontSize: 30,
    lineHeight: 34,
    fontFamily: Font.displayBold,
    letterSpacing: displayTracking,
  },
  heroMeta: {
    flex: 1,
    gap: 8,
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(251,245,233,0.16)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeText: {
    fontSize: 12,
    color: Colors.light.background,
    fontFamily: Font.semibold,
    textTransform: "capitalize",
  },
  hostText: {
    fontSize: 14,
    color: "rgba(251,245,233,0.78)",
    fontFamily: Font.medium,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    color: Colors.light.background,
    fontFamily: Font.displayBold,
    letterSpacing: displayTracking,
  },
  university: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(251,245,233,0.72)",
    fontFamily: Font.medium,
  },
  quickFacts: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 14,
    marginBottom: 24,
  },
  fact: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  factLabel: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.light.gray,
    fontFamily: Font.medium,
  },
  factValue: {
    marginTop: 2,
    fontSize: 14,
    color: Colors.light.text,
    fontFamily: Font.semibold,
    textAlign: "center",
  },
  factDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
  },
  section: { marginBottom: 24, gap: 12 },
  sectionTitle: {
    fontSize: 18,
    color: Colors.light.text,
    fontFamily: Font.semibold,
    marginBottom: 4,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: Font.medium,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.light.caption,
    fontFamily: Font.body,
  },
  rsvpSection: { marginTop: 4, marginBottom: 8 },
  rsvpHeader: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rsvpRow: { gap: 10 },
  rsvpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.card,
  },
  rsvpButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  rsvpText: {
    fontSize: 15,
    color: Colors.light.primary,
    fontFamily: Font.semibold,
  },
  rsvpTextActive: {
    color: Colors.light.background,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    marginTop: 4,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.caption,
    fontFamily: Font.medium,
  },
})
