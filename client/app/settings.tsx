import Colors from "@/src/constants/Colors"
import { env } from "@/src/config/env"
import { useAuthStore } from "@/src/store/authStore"
import { Font, displayTracking } from "@/src/theme/typography"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const CREAM = "#FBF5E9"

function initials(name?: string) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}

function SettingsRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color={Colors.light.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    Alert.alert("Log out", "End this Campus Connect session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout()
          router.replace("/auth/login")
        },
      },
    ])
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color={Colors.light.primary} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.name)}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>SETTINGS</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {user?.email ?? "Campus account"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingsRow icon="person-outline" label="Name" value={user?.name ?? "Student"} />
        <SettingsRow icon="mail-outline" label="Email" value={user?.email ?? "-"} />
        <SettingsRow icon="school-outline" label="University" value={user?.university_id ?? "-"} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Ionicons name="notifications-outline" size={19} color={Colors.light.primary} />
          </View>
          <Text style={styles.rowLabel}>Push notifications</Text>
          <Switch
            value={true}
            disabled
            trackColor={{ true: Colors.light.sky, false: Colors.light.border }}
            thumbColor={Colors.light.primary}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection</Text>
        <SettingsRow icon="server-outline" label="API" value={env.apiUrl} />
        <SettingsRow icon="radio-outline" label="Realtime" value={env.socketUrl} />
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.light.error} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  backText: {
    fontSize: 15,
    color: Colors.light.primary,
    fontFamily: Font.semibold,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Colors.light.primary,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.secondary,
    borderWidth: 2,
    borderColor: "rgba(251,245,233,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: Font.display,
    fontSize: 25,
    letterSpacing: displayTracking,
    color: CREAM,
  },
  heroCopy: {
    flex: 1,
  },
  title: {
    fontFamily: Font.display,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: displayTracking,
    color: CREAM,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: "rgba(251,245,233,0.72)",
    fontFamily: Font.medium,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 19,
    color: Colors.light.text,
    fontFamily: Font.display,
    letterSpacing: displayTracking,
    marginBottom: 10,
  },
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    fontFamily: Font.semibold,
  },
  rowValue: {
    maxWidth: "48%",
    fontSize: 14,
    color: Colors.light.gray,
    fontFamily: Font.medium,
    textAlign: "right",
  },
  logoutButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(193,73,46,0.28)",
    backgroundColor: Colors.light.card,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.light.error,
    fontFamily: Font.semibold,
  },
})
