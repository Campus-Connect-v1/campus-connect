import Colors from "@/src/constants/Colors"
import { getUserById, sendConnectionRequest } from "@/src/services/user"
import { Font, displayTracking } from "@/src/theme/typography"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const CREAM = "#FBF5E9"

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined
}

function BackButton({ top, onPress }: { top: number; onPress: () => void }) {
  return (
    <Pressable style={[styles.backBtn, { top }]} onPress={onPress} hitSlop={10}>
      <Ionicons name="chevron-back" size={24} color="#FBF5E9" />
    </Pressable>
  )
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [requested, setRequested] = useState(false)

  useEffect(() => {
    let active = true
    void getUserById(id).then((res) => {
      if (active) {
        if (res.success) setUser(res.data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <View style={styles.centered}>
        <BackButton top={insets.top + 8} onPress={() => router.back()} />
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <BackButton top={insets.top + 8} onPress={() => router.back()} />
        <Ionicons name="person-circle-outline" size={48} color={Colors.light.gray} />
        <Text style={styles.muted}>User not found</Text>
      </View>
    )
  }

  const first = str(user.first_name) ?? ""
  const last = str(user.last_name) ?? ""
  const name = `${first} ${last}`.trim() || "Student"
  const avatar = str(user.profile_picture_url)
  const program = str(user.program)
  const bio = str(user.bio)
  const headline = str(user.profile_headline)
  const university = str(user.university_name) ?? str(user.university_id)

  const connect = async () => {
    setRequested(true)
    const res = await sendConnectionRequest(id)
    if (!res.success) setRequested(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <BackButton top={insets.top + 8} onPress={() => router.back()} />

      <View style={[styles.hero, { paddingTop: insets.top + 52 }]}>
        {avatar ? (
          <Image source={avatar} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>
              {`${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{name}</Text>
        {!!headline && <Text style={styles.headline}>{headline}</Text>}
        <View style={styles.accentRule} />
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryBtn, requested && styles.primaryBtnDone]}
          onPress={connect}
          disabled={requested}
        >
          <Ionicons
            name={requested ? "checkmark" : "person-add-outline"}
            size={18}
            color={requested ? Colors.light.primary : CREAM}
          />
          <Text style={[styles.primaryText, requested && styles.primaryTextDone]}>
            {requested ? "Requested" : "Connect"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push({ pathname: "/chat/[peerId]", params: { peerId: id, name } })}
        >
          <Ionicons name="chatbubble-outline" size={18} color={Colors.light.primary} />
          <Text style={styles.secondaryText}>Message</Text>
        </Pressable>
      </View>

      {!!bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.body}>{bio}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        {!!program && <DetailRow icon="school-outline" label="Program" value={program} />}
        {!!str(user.year_of_study) && (
          <DetailRow icon="calendar-outline" label="Year" value={String(user.year_of_study)} />
        )}
        {!!university && <DetailRow icon="business-outline" label="University" value={university} />}
      </View>
    </ScrollView>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color={Colors.light.accent} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  backBtn: {
    position: "absolute",
    left: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
    alignItems: "center",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, backgroundColor: Colors.light.background },
  muted: { fontFamily: Font.medium, color: Colors.light.gray },
  hero: {
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: Colors.light.secondary, borderWidth: 3, borderColor: "rgba(251,245,233,0.5)" },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarText: { fontFamily: Font.display, fontSize: 36, color: CREAM, letterSpacing: displayTracking },
  name: { fontFamily: Font.display, fontSize: 30, letterSpacing: displayTracking, color: CREAM, marginTop: 12 },
  headline: { fontFamily: Font.medium, fontSize: 14, color: "rgba(251,245,233,0.75)", marginTop: 2 },
  accentRule: { height: 3, width: 40, borderRadius: 3, backgroundColor: Colors.light.sky, marginTop: 14 },
  actions: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: 18 },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  primaryBtnDone: { backgroundColor: Colors.light.lightGray },
  primaryText: { fontFamily: Font.semibold, fontSize: 15, color: CREAM },
  primaryTextDone: { color: Colors.light.primary },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  secondaryText: { fontFamily: Font.semibold, fontSize: 15, color: Colors.light.primary },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontFamily: Font.display, fontSize: 20, letterSpacing: displayTracking, color: Colors.light.text, marginBottom: 10 },
  body: { fontFamily: Font.body, fontSize: 15, lineHeight: 23, color: Colors.light.caption },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  detailLabel: { flex: 1, fontFamily: Font.medium, fontSize: 15, color: Colors.light.text },
  detailValue: { fontFamily: Font.semibold, fontSize: 15, color: Colors.light.gray, maxWidth: "55%" },
})
