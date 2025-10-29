

import React, { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { shareLocation, useNearbyUsers } from "@/src/services/authServices";
import { MapMarkerCallout, CustomMapMarker } from "@/src/components/ui/map-marker";


// Fetcher for SWR


export default function ConnectionsMapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "terrain" | "hybrid">("standard");
  const [isSharing, setIsSharing] = useState(false);
  const radius = 500; // meters
  const lastSharedRef = useRef<number | null>(null);

 const { nearbyUsers, isLoading, isError: error, refetchNearby: mutate } = useNearbyUsers(userLocation ? radius : 0);
  console.log("Nearby users data:", nearbyUsers);

  // useEffect(() => {
  //   (async () => {
  //     const { status } = await Location.requestForegroundPermissionsAsync();
  //     if (status !== "granted") {
  //       Alert.alert("Permission denied", "We need location access to find connections near you.");
  //       return;
  //     }

  //     const location = await Location.getCurrentPositionAsync({});
  //     const { latitude, longitude, accuracy } = location.coords;
  //     setUserLocation({ latitude, longitude });

  //     try {
  //       setIsSharing(true);
  //       await shareLocation();
  //       console.log("✅ Location shared successfully");
  //       mutate(); // trigger re-fetch of nearby users
  //     } catch (err) {
  //       console.error("❌ Error sharing location:", err);
  //     } finally {
  //       setIsSharing(false);
  //     }
  //   })();
  // }, []);

//   useEffect(() => {
//   let didShare = false;

//   (async () => {
//     if (didShare) return;
//     didShare = true;

//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== "granted") {
//       Alert.alert("Permission denied", "We need location access to find connections near you.");
//       return;
//     }

//     const location = await Location.getCurrentPositionAsync({});
//     const { latitude, longitude } = location.coords;
//     setUserLocation({ latitude, longitude });

//     try {
//       setIsSharing(true);
//       await shareLocation();
//       console.log("✅ Location shared successfully");
//       mutate(); // re-fetch nearby users
//     } catch (err: any) {
//       if (err.response?.status === 429) {
//         console.warn("🚦 Rate limited: too many location updates, will retry later.");
//       } else {
//         console.error("❌ Error sharing location:", err.message);
//       }
//     } finally {
//       setIsSharing(false);
//     }
//   })();
// }, []);

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
        <ActivityIndicator size="large" color="#007aff" />
        <Text>Getting your location...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text>Finding nearby connections...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Something went wrong fetching nearby users 😕</Text>
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
        {/* {nearbyUsers?.map((user: any, index: number) => (
          <Marker
            key={index}
            coordinate={{
              latitude: user.latitude || '5.607736227139973',
              longitude: user.longitude || '-0.06446675791529029',
            }}
            title={user.display_name}
            description={user.status_message || "Available nearby"}
          >
            <Ionicons name="person-circle" size={32} color="#007aff" />
            <Callout>
              <View style={{ width: 200 }}>
                <Text style={styles.calloutName}>{user.display_name}</Text>
                <Text style={styles.calloutDesc}>
                  {user.bio || "Same community"}
                </Text>
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => Alert.alert("Connect", `Send request to ${user.name}?`)}
                >
                  <Text style={styles.connectText}>Connect</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))} */}
        {nearbyUsers?.map((user: any, index: number) => {
  const lat = user.latitude;
  const lng = user.longitude;

  console.log(`User ${user.display_name} coordinates:`, { lat, lng });
  // const lat = user.latitude || 5.607736227139973;
  // const lng = user.longitude || -0.06446675791529029;
  

  return (
    <Marker
      key={index}
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
        <Ionicons name="locate-outline" size={24} color="#000" />
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
        <Text style={{ color: "#fff" }}>{mapType}</Text>
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
    bottom: 120,
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
    backgroundColor: "#007aff",
    borderRadius: 20,
    paddingVertical: 6,
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
  },
});
