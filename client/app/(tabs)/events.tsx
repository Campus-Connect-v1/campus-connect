import Colors from "@/src/constants/Colors"
import { EventCard } from "@/src/components/events/EventCard"
import { Font } from "@/src/theme/typography"
import { getEvents, type CampusEvent } from "@/src/services/events"
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

export default function EventsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const universityId = useAuthStore((s) => s.user?.university_id)
  const [events, setEvents] = useState<CampusEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "refresh") setRefreshing(true)
      else setLoading(true)

      const result = await getEvents(
        universityId ? { university_id: universityId } : {},
      )
      if (result.success) {
        // Soonest first.
        const sorted = [...result.data].sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        )
        setEvents(sorted)
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    )
  }

  if (error && events.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={Colors.light.gray} />
        <Text style={styles.stateTitle}>Couldn&apos;t load events</Text>
        <Text style={styles.stateBody}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => load("refresh")}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.screenHeader, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.screenTitle}>Events</Text>
        <Text style={styles.screenSubtitle}>RSVP and plan your week</Text>
      </View>
      <FlatList
        data={events}
        keyExtractor={(e) => e.event_id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={(e) =>
              router.push({ pathname: "/events/[id]", params: { id: e.event_id } })
            }
          />
        )}
        contentContainerStyle={
          events.length === 0 ? styles.emptyContent : styles.listContent
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
            <Ionicons name="calendar-outline" size={48} color={Colors.light.gray} />
            <Text style={styles.stateTitle}>No upcoming events</Text>
            <Text style={styles.stateBody}>Check back soon for campus happenings.</Text>
          </View>
        }
      />
      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 84 }]}
        onPress={() => router.push("/events/create")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
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
  listContent: {
    paddingVertical: 8,
    paddingBottom: 120,
  },
  emptyContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
    backgroundColor: Colors.light.background,
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
  retryText: {
    color: "#fff",
    fontFamily: "Barlow_600SemiBold",
  },
  fab: {
    position: "absolute",
    right: 20,
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
