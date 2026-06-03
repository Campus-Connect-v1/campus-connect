import Colors from "@/src/constants/Colors"
import ScreenHeader from "@/src/components/ui/ScreenHeader"
import {
  formatDistance,
  getNearbyProfiles,
  syncMyLocation,
  type NearbyProfile,
} from "@/src/services/geolocation"
import { Font } from "@/src/theme/typography"
import { Ionicons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"

const RADII = [250, 500, 1000, 2000]

function initials(f?: string, l?: string) {
  return `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase() || "?"
}

export default function NearbyScreen() {
  const router = useRouter()
  const [radius, setRadius] = useState(500)
  const [profiles, setProfiles] = useState<NearbyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [denied, setDenied] = useState(false)

  const load = useCallback(
    async (r: number, mode: "initial" | "refresh") => {
      mode === "refresh" ? setRefreshing(true) : setLoading(true)
      const synced = await syncMyLocation()
      if (!synced) {
        setDenied(true)
        setLoading(false)
        setRefreshing(false)
        return
      }
      setDenied(false)
      const res = await getNearbyProfiles(r)
      if (res.success) setProfiles(res.data)
      setLoading(false)
      setRefreshing(false)
    },
    [],
  )

  useEffect(() => {
    void load(radius, "initial")
  }, [radius, load])

  return (
    <View style={styles.container}>
      <ScreenHeader title="Nearby" />

      {/* Radius selector */}
      <View style={styles.radiusRow}>
        {RADII.map((r) => (
          <Pressable
            key={r}
            style={[styles.chip, r === radius && styles.chipActive]}
            onPress={() => setRadius(r)}
          >
            <Text style={[styles.chipText, r === radius && styles.chipTextActive]}>
              {r >= 1000 ? `${r / 1000} km` : `${r} m`}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.muted}>Finding classmates near you…</Text>
        </View>
      ) : denied ? (
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={48} color={Colors.light.gray} />
          <Text style={styles.stateTitle}>Location is off</Text>
          <Text style={styles.muted}>
            Enable location access to discover classmates around campus.
          </Text>
          <Pressable style={styles.retry} onPress={() => load(radius, "refresh")}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(p) => p.user_id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(radius, "refresh")}
              tintColor={Colors.light.primary}
            />
          }
          contentContainerStyle={profiles.length === 0 ? styles.emptyContent : undefined}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={48} color={Colors.light.gray} />
              <Text style={styles.stateTitle}>No one nearby</Text>
              <Text style={styles.muted}>Try a larger radius, or check back later.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: "/user/[id]", params: { id: item.user_id } })}
            >
              {item.profile_picture_url ? (
                <Image source={item.profile_picture_url} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>{initials(item.first_name, item.last_name)}</Text>
                </View>
              )}
              <View style={styles.rowBody}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.first_name} {item.last_name}
                </Text>
                {!!(item.profile_headline || item.program) && (
                  <Text style={styles.sub} numberOfLines={1}>
                    {item.profile_headline || item.program}
                  </Text>
                )}
              </View>
              <View style={styles.distancePill}>
                <Ionicons name="navigate" size={12} color={Colors.light.accent} />
                <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  radiusRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
  },
  chipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontFamily: Font.semibold, fontSize: 13, color: Colors.light.gray },
  chipTextActive: { color: "#FBF5E9" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, paddingHorizontal: 32 },
  emptyContent: { flexGrow: 1 },
  stateTitle: { fontFamily: Font.display, fontSize: 21, color: Colors.light.text, marginTop: 8 },
  muted: { fontFamily: Font.medium, fontSize: 14, color: Colors.light.gray, textAlign: "center" },
  retry: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontFamily: Font.semibold },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.light.lightGray },
  avatarFallback: { justifyContent: "center", alignItems: "center" },
  avatarText: { fontFamily: Font.display, fontSize: 18, color: Colors.light.primary },
  rowBody: { flex: 1 },
  name: { fontFamily: Font.semibold, fontSize: 15, color: Colors.light.text },
  sub: { fontFamily: Font.body, fontSize: 13, color: Colors.light.gray, marginTop: 1 },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.light.lightGray,
  },
  distanceText: { fontFamily: Font.semibold, fontSize: 12, color: Colors.light.accent },
})
