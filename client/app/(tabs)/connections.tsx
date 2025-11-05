

import React, { useEffect, useState, useRef } from "react";
import { View, Text, Alert, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { shareLocation, useNearbyUsers } from "@/src/services/authServices";
import { MapMarkerCallout, CustomMapMarker, CustomBuildingMarker, BuildingMarkerCallout } from "@/src/components/ui/map-marker";
import { useMapBuildings, Building } from "@/src/services/universityServices";
import { storage } from "@/src/utils/storage";
import { router } from "expo-router";
import Loader from "@/src/components/ui/loader";


export default function ConnectionsMapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "terrain" | "hybrid">("standard");
  const [ setIsSharing] = useState(false);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const radius = 500; // meters
  const lastSharedRef = useRef<number | null>(null);

  const { nearbyUsers, isError: error, refetchNearby: mutate } = useNearbyUsers(userLocation ? radius : 0);
  const { buildings } = useMapBuildings(universityId);

  console.log("Nearby users:", nearbyUsers);

  useEffect(() => {
    const loadUniversityId = async () => {
      const userData = await storage.getUserData();
      setUniversityId(userData?.university_id || DEFAULT_UNIVERSITY_ID);
    };
    loadUniversityId();
  }, []);

  useEffect(() => {
  let hasShared = false;

  (async () => {
    if (hasShared) return;
    hasShared = true;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "We need location access to find connections near you.");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setUserLocation({ latitude, longitude });

    try {
      // Avoid hammering backend
      if (!lastSharedRef.current || Date.now() - lastSharedRef.current > 60_000) {
        setIsSharing(true);
        await shareLocation();
        lastSharedRef.current = Date.now();
        console.log("✅ Location shared successfully");
        mutate(); // refresh nearby users
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
        console.warn("⚠️ Server rate limit reached. Try again later.");
      } else {
        console.error("❌ Error sharing location:", err.message);
      }
    } finally {
      setIsSharing(false);
    }
  })();
}, []);

  if (!userLocation) {
    return (
      <View style={styles.center}>
        <Loader/>
        <Text className="font-[Gilroy-Medium] text-md">Getting your location...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text className="font-[Gilroy-Medium] text-md">Something went wrong fetching nearby users 😕</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={mapType}
        region={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {/* Markers for nearby users */}
        {nearbyUsers?.map((user: any, index: number) => {
          const lat = user.latitude;
          const lng = user.longitude;

  return (
    <Marker
      key={`user-${index}`}
      coordinate={{ latitude: lat, longitude: lng }}
    >
      {/* Custom marker bubble */}
      <CustomMapMarker user={user} />

      {/* Fancy animated callout */}
      <Callout tooltip>
        <MapMarkerCallout
          user={user}
          onConnect={(id) => Alert.alert("Connect", `Send request to ${user.display_name}?`)}
        />
      </Callout>
    </Marker>
  );
})}

        {/* Markers for buildings */}
        {buildings?.filter((building: Building) => building.latitude && building.longitude).map((building: Building) => {
          console.log(`Building ${building.building_name} coordinates:`, { 
            lat: building.latitude, 
            lng: building.longitude 
          });

          return (
            <Marker
              key={`building-${building.building_id}`}
              coordinate={{ 
                latitude: building.latitude, 
                longitude: building.longitude 
              }}
            >
              {/* Custom building marker */}
              <CustomBuildingMarker building={building} />

              {/* Building callout */}
              <Callout tooltip>
                <BuildingMarkerCallout
                  building={building}
                  onViewDetails={(buildingId) => {
                    router.push(`/university/building-details?buildingId=${buildingId}`);
                  }}
                />
              </Callout>
            </Marker>
          );
        })}

      </MapView>

      {/* Recenter button */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={() =>
          mapRef.current?.animateToRegion({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          })
        }
      >
        <Ionicons name="locate" size={24} color="#003554" />
      </TouchableOpacity>

      {/* Map type switch */}
      <TouchableOpacity
        style={styles.mapTypeBtn}
        onPress={() => {
          const order = ["standard", "satellite", "terrain", "hybrid"];
          const next = order[(order.indexOf(mapType) + 1) % order.length];
          setMapType(next);
        }}
      >
        <Text style={{ color: "#fff",  fontFamily: "Gilroy-Medium" }}>{mapType}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recenterBtn: {
    position: "absolute",
    bottom: 40,
    right: 24,
    backgroundColor: "#fff",
    borderRadius: 50,
    padding: 10,
    elevation: 6,
  },
  mapTypeBtn: {
    position: "absolute",
    top: 80,
    right: 24,
    backgroundColor: "#003554",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,

  },
  calloutName: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
     fontFamily: "Gilroy-Medium",
  },
  connectBtn: {
    backgroundColor: "#007aff",
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: "center",
  },
  connectText: {
    color: "#fff",
    fontWeight: "600",
     fontFamily: "Gilroy-Medium",
  },
});
