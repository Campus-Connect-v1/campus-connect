import Colors from "@/src/constants/Colors"
import {
  getGroupMembers,
  getStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  type GroupMember,
  type StudyGroup,
} from "@/src/services/studyGroups"
import { useAuthStore } from "@/src/store/authStore"
import { Font } from "@/src/theme/typography"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?"
}

function Row({ icon, children }: { icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={Colors.light.primary} />
      <Text style={styles.rowText}>{children}</Text>
    </View>
  )
}

export default function StudyGroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const myId = useAuthStore((s) => s.user?.id)

  const [group, setGroup] = useState<StudyGroup | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)

  const me = members.find((m) => m.user_id === myId)
  const isMember = !!me
  const isCreator = me?.role === "creator"
  const isFull =
    group != null && members.length >= group.max_members && !isMember

  const load = useCallback(async () => {
    setLoading(true)
    const [groupRes, membersRes] = await Promise.all([
      getStudyGroup(id),
      getGroupMembers(id),
    ])
    if (groupRes.success) {
      setGroup(groupRes.data)
      setError(null)
    } else {
      setError(groupRes.error.message)
    }
    if (membersRes.success) setMembers(membersRes.data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const handleToggleMembership = async () => {
    if (working) return
    setWorking(true)
    const res = isMember ? await leaveStudyGroup(id) : await joinStudyGroup(id)
    setWorking(false)
    if (res.success) {
      await load() // refresh membership + count
    } else {
      Alert.alert(isMember ? "Couldn't leave" : "Couldn't join", res.error.message)
    }
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    )
  }

  if (error || !group) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Ionicons name="alert-circle-outline" size={44} color={Colors.light.gray} />
        <Text style={styles.errorText}>{error ?? "Study group not found"}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <Pressable style={styles.inlineBack} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.primary} />
          <Text style={styles.inlineBackText}>Groups</Text>
        </Pressable>

        <Text style={styles.title}>{group.group_name}</Text>
        {!!group.course_code && (
          <Text style={styles.course}>
            {group.course_code}
            {group.course_name ? ` · ${group.course_name}` : ""}
          </Text>
        )}

        {!!group.description && (
          <Text style={styles.description}>{group.description}</Text>
        )}

        <View style={styles.section}>
          <Row icon={group.group_type === "private" ? "lock-closed-outline" : "earth-outline"}>
            {group.group_type === "private" ? "Private group" : "Public group"}
          </Row>
          <Row icon="people-outline">
            {members.length}/{group.max_members} members
          </Row>
          <Row icon="repeat-outline">Meets {group.meeting_frequency}</Row>
          <Row icon="location-outline">{group.preferred_location_type}</Row>
        </View>

        <Text style={styles.sectionTitle}>Members</Text>
        {members.map((m) => (
          <View key={m.user_id} style={styles.memberRow}>
            {m.profile_picture_url ? (
              <Image source={m.profile_picture_url} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initials(m.first_name, m.last_name)}</Text>
              </View>
            )}
            <Text style={styles.memberName}>
              {m.first_name} {m.last_name}
            </Text>
            {m.role === "creator" && <Text style={styles.creatorTag}>Creator</Text>}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        {isCreator ? (
          <View style={[styles.actionButton, styles.actionDisabled]}>
            <Text style={styles.actionTextMuted}>You created this group</Text>
          </View>
        ) : (
          <Pressable
            style={[
              styles.actionButton,
              isMember && styles.leaveButton,
              isFull && styles.actionDisabled,
            ]}
            onPress={handleToggleMembership}
            disabled={working || isFull}
          >
            {working ? (
              <ActivityIndicator color={isMember ? Colors.light.error : "#fff"} />
            ) : (
              <Text style={[styles.actionText, isMember && styles.leaveText]}>
                {isFull ? "Group full" : isMember ? "Leave group" : "Join group"}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 20, paddingBottom: 24 },
  inlineBack: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 14,
  },
  inlineBackText: {
    fontSize: 15,
    color: Colors.light.primary,
    fontFamily: "Barlow_600SemiBold",
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, padding: 32 },
  errorText: { color: Colors.light.gray, fontFamily: "Barlow_500Medium", textAlign: "center" },
  title: { fontSize: 30, lineHeight: 36, color: Colors.light.text, fontFamily: Font.displayBold },
  course: {
    fontSize: 14,
    color: Colors.light.primary,
    fontFamily: "Barlow_500Medium",
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.light.caption,
    fontFamily: "Barlow_400Regular",
    marginTop: 12,
  },
  section: { marginTop: 20, marginBottom: 8, gap: 12 },
  sectionTitle: {
    fontSize: 16,
    color: Colors.light.text,
    fontFamily: "Barlow_600SemiBold",
    marginTop: 16,
    marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowText: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Barlow_500Medium",
    textTransform: "capitalize",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.lightGray,
  },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarText: { color: Colors.light.gray, fontFamily: "Barlow_600SemiBold", fontSize: 14 },
  memberName: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: "Barlow_500Medium",
  },
  creatorTag: {
    fontSize: 12,
    color: Colors.light.primary,
    fontFamily: "Barlow_600SemiBold",
  },
  actionBar: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  actionButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  leaveButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  actionDisabled: { backgroundColor: Colors.light.lightGray },
  actionText: { color: "#fff", fontSize: 16, fontFamily: "Barlow_600SemiBold" },
  leaveText: { color: Colors.light.error },
  actionTextMuted: { color: Colors.light.gray, fontSize: 15, fontFamily: "Barlow_500Medium" },
})
