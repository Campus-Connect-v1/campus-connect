import Colors from "@/src/constants/Colors"
import ScreenHeader from "@/src/components/ui/ScreenHeader"
import { getBuildings, type CampusBuilding } from "@/src/services/campus"
import { getCurrentPosition } from "@/src/services/geolocation"
import { useAuthStore } from "@/src/store/authStore"
import { Font } from "@/src/theme/typography"
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import MapView, { Callout, Marker, type Region } from "react-native-maps"

// A loose default region (campus unknown until data loads).
const FALLBACK_REGION: Region = {
  latitude: 37.4275,
  longitude: -122.1697,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
}

function hasCoords(b: CampusBuilding): b is CampusBuilding & {
  latitude: number
  longitude: number
} {
  return typeof b.latitude === "number" && typeof b.longitude === "number"
}

/** Region that frames all the given points with a little padding. */
function regionFor(points: { latitude: number; longitude: number }[]): Region | null {
  if (points.length === 0) return null
  const lats = points.map((p) => p.latitude)
  const lngs = points.map((p) => p.longitude)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.005),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.005),
  }
}

export default function CampusScreen() {
  const universityId = useAuthStore((s) => s.user?.university_id)
  const mapRef = useRef<MapView>(null)
  const [buildings, setBuildings] = useState<CampusBuilding[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!universityId) {
      setLoading(false)
      return
    }
    void getBuildings(universityId).then((res) => {
      if (active) {
        if (res.success) setBuildings(res.data)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [universityId])

  const types = useMemo(() => {
    const set = new Set<string>()
    buildings.forEach((b) => b.building_type && set.add(b.building_type))
    return Array.from(set)
  }, [buildings])

  const mapped = useMemo(
    () =>
      buildings
        .filter(hasCoords)
        .filter((b) => !filter || b.building_type === filter),
    [buildings, filter],
  )

  const initialRegion = useMemo(
    () => regionFor(mapped) ?? regionFor(buildings.filter(hasCoords)) ?? FALLBACK_REGION,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buildings],
  )

  // Re-frame the map when the filter narrows the set.
  const frame = useCallback(() => {
    const r = regionFor(mapped)
    if (r) mapRef.current?.animateToRegion(r, 350)
  }, [mapped])

  useEffect(() => {
    if (!loading) frame()
  }, [filter, loading, frame])

  const recenterOnMe = useCallback(async () => {
    const pos = await getCurrentPosition()
    if (pos) {
      mapRef.current?.animateToRegion(
        { latitude: pos.latitude, longitude: pos.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        350,
      )
    }
  }, [])

  const directionsTo = (b: CampusBuilding & { latitude: number; longitude: number }) =>
    Linking.openURL(
      `https://maps.google.com/?q=${b.latitude},${b.longitude}(${encodeURIComponent(b.building_name)})`,
    )

  return (
    <View style={styles.container}>
      <ScreenHeader title="Campus Map" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {mapped.map((b) => (
              <Marker
                key={b.building_id}
                coordinate={{ latitude: b.latitude, longitude: b.longitude }}
                pinColor={Colors.light.primary}
              >
                <Callout onPress={() => directionsTo(b)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{b.building_name}</Text>
                    {!!b.building_type && (
                      <Text style={styles.calloutType}>{b.building_type}</Text>
                    )}
                    <Text style={styles.calloutLink}>Tap for directions →</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* Filter chips overlay */}
          {types.length > 0 && (
            <View style={styles.filterBar} pointerEvents="box-none">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContent}
              >
                <Pressable
                  style={[styles.chip, !filter && styles.chipActive]}
                  onPress={() => setFilter(null)}
                >
                  <Text style={[styles.chipText, !filter && styles.chipTextActive]}>All</Text>
                </Pressable>
                {types.map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.chip, filter === t && styles.chipActive]}
                    onPress={() => setFilter(t)}
                  >
                    <Text style={[styles.chipText, filter === t && styles.chipTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recenter on me */}
          <Pressable style={styles.recenter} onPress={recenterOnMe}>
            <Ionicons name="locate" size={22} color={Colors.light.primary} />
          </Pressable>

          {mapped.length === 0 && (
            <View style={styles.noData} pointerEvents="none">
              <Text style={styles.noDataText}>
                No mapped buildings{filter ? ` for “${filter}”` : ""} yet.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapWrap: { flex: 1 },
  filterBar: { position: "absolute", top: 12, left: 0, right: 0 },
  filterContent: { paddingHorizontal: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontFamily: Font.semibold, fontSize: 13, color: Colors.light.gray, textTransform: "capitalize" },
  chipTextActive: { color: "#FBF5E9" },
  recenter: {
    position: "absolute",
    right: 16,
    bottom: 32,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  noData: {
    position: "absolute",
    bottom: 32,
    left: 16,
    backgroundColor: Colors.light.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  noDataText: { fontFamily: Font.medium, fontSize: 13, color: Colors.light.gray },
  callout: { maxWidth: 220, padding: 4, gap: 2 },
  calloutTitle: { fontFamily: Font.semibold, fontSize: 14, color: Colors.light.text },
  calloutType: { fontFamily: Font.medium, fontSize: 12, color: Colors.light.accent, textTransform: "capitalize" },
  calloutLink: { fontFamily: Font.medium, fontSize: 12, color: Colors.light.primary, marginTop: 2 },
})
