import Colors from "@/src/constants/Colors"
import { StudyGroupCard } from "@/src/components/studyGroups/StudyGroupCard"
import { Font } from "@/src/theme/typography"
import { getStudyGroups, type StudyGroup } from "@/src/services/studyGroups"
import { useAuthStore } from "@/src/store/authStore"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const TAB_BAR_HEIGHT = 64
const FAB_NAV_GAP = 18

export default function StudyGroupsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const universityId = useAuthStore((s) => s.user?.university_id)
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "refresh") setRefreshing(true)
      else setLoading(true)

      const result = await getStudyGroups(
        universityId
          ? { university_id: universityId, is_active: true }
          : { is_active: true },
      )
      if (result.success) {
        setGroups(result.data)
        setError(null)
      } else {
        setError(result.error.message)
      }
      setLoading(false)
      setRefreshing(false)
    },
    [universityId],
  )

  useFocusEffect(
    useCallback(() => {
      void load("initial")
    }, [load]),
  )

  return (
    <View style={styles.container}>
      <View style={[styles.screenHeader, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.screenTitle}>Study Groups</Text>
        <Text style={styles.screenSubtitle}>Find classmates and working rooms</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : error && groups.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.light.gray} />
          <Text style={styles.stateTitle}>Couldn&apos;t load study groups</Text>
          <Text style={styles.stateBody}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => load("refresh")}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.group_id}
          renderItem={({ item }) => (
            <StudyGroupCard
              group={item}
              onPress={(g) =>
                router.push({
                  pathname: "/study-groups/[id]",
                  params: { id: g.group_id },
                })
              }
            />
          )}
          contentContainerStyle={
            groups.length === 0 ? styles.emptyContent : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load("refresh")}
              tintColor={Colors.light.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="book-outline" size={48} color={Colors.light.gray} />
              <Text style={styles.stateTitle}>No study groups yet</Text>
              <Text style={styles.stateBody}>Start one and invite your classmates.</Text>
            </View>
          }
        />
      )}

      <Pressable
        accessibilityLabel="Create study group"
        hitSlop={8}
        style={[
          styles.fab,
          { bottom: insets.bottom + TAB_BAR_HEIGHT + FAB_NAV_GAP },
        ]}
        onPress={() => router.push("/study-groups/create")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  screenHeader: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: Colors.light.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  screenTitle: {
    fontSize: 28,
    color: Colors.light.text,
    fontFamily: Font.display,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
    marginTop: -2,
  },
  listContent: { paddingVertical: 8, paddingBottom: 150 },
  emptyContent: { flexGrow: 1, paddingBottom: 150 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  stateTitle: {
    fontSize: 21,
    color: Colors.light.text,
    fontFamily: Font.display,
    marginTop: 8,
  },
  stateBody: {
    fontSize: 14,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontFamily: "Barlow_600SemiBold" },
  fab: {
    position: "absolute",
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
})
