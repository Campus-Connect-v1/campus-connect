// "use client"

// import { Ionicons } from "@expo/vector-icons"
// import { router } from "expo-router"
// import { useState, useEffect, useRef } from "react"
// import {
//   ScrollView,
//   StatusBar,
//   Text,
//   TouchableOpacity,
//   View,
//   ActivityIndicator,
//   Animated,
//   FlatList,
// } from "react-native"
// import { SafeAreaView } from "react-native-safe-area-context"
// import { getUserConnections, respondToConnectionRequest } from "@/src/services/authServices"
// import { useDropdownAlert } from "@/src/hooks/useDropdownAlert"
// import DropdownAlert from "@/src/components/ui/DropdownAlert"
// import { BlurView } from "expo-blur"
// import { Image } from "expo-image"
// import Colors from "@/src/constants/Colors"

// type ConnectionStatus = "accepted" | "pending" | "declined"

// interface Connection {
//   connection_id: string
//   user_id: string
//   first_name: string
//   last_name: string
//   profile_picture_url?: string
//   program?: string
//   year_of_study?: string
//   status: ConnectionStatus
// }

// const ConnectionScreen = () => {
//   const [activeTab, setActiveTab] = useState<ConnectionStatus>("accepted")
//   const [connections, setConnections] = useState<Connection[]>([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [respondingTo, setRespondingTo] = useState<string | null>(null)

//   const { alert, hideAlert, success, error: toast } = useDropdownAlert()

//   const fadeAnim = useRef(new Animated.Value(0)).current
//   const slideAnim = useRef(new Animated.Value(50)).current

//   useEffect(() => {
//     const fetchConnections = async () => {
//       setIsLoading(true)
//       try {
//         const result = await getUserConnections()
//         console.log("Fetched connections:", result)

//         if (result?.success && result?.data) {
//           const tabConnections = Array.isArray(result.data[activeTab])
//             ? result.data[activeTab]
//             : []
//           setConnections(tabConnections.filter(Boolean)) // remove null/undefined
//         } else {
//           setConnections([])
//           toast("uniCLIQ", "Failed to load connections", 3000)
//         }
//       } catch (err) {
//         console.error("Error fetching connections:", err)
//         setConnections([])
//         toast("uniCLIQ", "Something went wrong", 3000)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchConnections()
//   }, [activeTab])

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
//       Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
//     ]).start()
//   }, [])

//   const handleRespondToRequest = async (connectionId: string, action: "accept" | "decline") => {
//     setRespondingTo(connectionId)
//     const result = await respondToConnectionRequest(connectionId, action)
//     if (result.success) {
//       success("uniCLIQ", `Connection ${action}ed successfully`, 3000)
//       setConnections(prev => prev.filter(c => c.connection_id !== connectionId))
//     } else {
//       toast("uniCLIQ", `Failed to ${action} connection`, 3000)
//     }
//     setRespondingTo(null)
//   }

//   const handleViewProfile = (userId: string) => {
//     router.push(`/user/${userId}`)
//   }

//   const tabs = [
//     { label: "Connected", value: "accepted" },
//     { label: "Pending", value: "pending" },
//     { label: "Declined", value: "declined" },
//   ] as const

//   const renderConnectionCard = ({ item }: { item: Connection }) => {
//     if (!item) return null // guard against undefined items

//     return (
//       <Animated.View
//         style={{
//           opacity: fadeAnim,
//           transform: [{ translateY: slideAnim }],
//         }}
//         className="mb-4"
//       >
//         <BlurView intensity={85} style={{ borderRadius: 20 }} className="overflow-hidden">
//           <View className="px-6 py-6 bg-white/40 border border-white/60">
//             <View className="flex-row items-center justify-between mb-4">
//               <TouchableOpacity onPress={() => handleViewProfile(item.user_id)} className="flex-row items-center flex-1">
//                 <View className="w-16 h-16 rounded-full bg-blue-500 items-center justify-center mr-4 overflow-hidden">
//                   {item.profile_picture_url ? (
//                     <Image source={{ uri: item.profile_picture_url }} className="w-full h-full" contentFit="cover" />
//                   ) : (
//                     <Text className="text-white text-lg font-semibold">
//                       {item.first_name?.[0] ?? "?"}
//                       {item.last_name?.[0] ?? ""}
//                     </Text>
//                   )}
//                 </View>

//                 <View className="flex-1">
//                   <Text className="text-black text-lg font-bold">{item.first_name} {item.last_name}</Text>
//                   <Text className="text-gray-600 text-sm mt-1">{item.program || "Program not specified"}</Text>
//                   {item.year_of_study && (
//                     <Text className="text-gray-500 text-xs mt-1">Year {item.year_of_study}</Text>
//                   )}
//                 </View>
//               </TouchableOpacity>

//               <Ionicons name="chevron-forward" size={24} color="#3b82f6" />
//             </View>

//             {activeTab === "pending" && (
//               <View className="flex-row gap-3 mt-4">
//                 <TouchableOpacity
//                   onPress={() => handleRespondToRequest(item.connection_id, "accept")}
//                   disabled={respondingTo === item.connection_id}
//                   className="flex-1 py-3 rounded-xl"
//                   style={{
//                     backgroundColor: "#3b82f6",
//                     opacity: respondingTo === item.connection_id ? 0.6 : 1,
//                   }}
//                 >
//                   <Text className="text-white text-center font-semibold">
//                     {respondingTo === item.connection_id ? "..." : "Accept"}
//                   </Text>
//                 </TouchableOpacity>

//                 <TouchableOpacity
//                   onPress={() => handleRespondToRequest(item.connection_id, "decline")}
//                   disabled={respondingTo === item.connection_id}
//                   className="flex-1 py-3 rounded-xl"
//                   style={{
//                     backgroundColor: "#ef4444",
//                     opacity: respondingTo === item.connection_id ? 0.6 : 1,
//                   }}
//                 >
//                   <Text className="text-white text-center font-semibold">
//                     {respondingTo === item.connection_id ? "..." : "Decline"}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>
//         </BlurView>
//       </Animated.View>
//     )
//   }

//   return (
//     <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 via-white to-white">
//       <StatusBar barStyle="dark-content" />
//       <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
//         <DropdownAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onDismiss={hideAlert} />
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="chevron-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text className="text-lg font-semibold flex-1 ml-4">Connections</Text>
//       </View>

//       <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }} className="px-4 py-4 border-b border-gray-100">
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
//           {tabs.map(tab => (
//             <TouchableOpacity
//               key={tab.value}
//               onPress={() => setActiveTab(tab.value)}
//               style={{
//                 paddingVertical: 10,
//                 paddingHorizontal: 20,
//                 borderRadius: 20,
//                 backgroundColor: activeTab === tab.value ? Colors.light.primary : "#f3f4f6",
//               }}
//             >
//               <Text style={{ color: activeTab === tab.value ? "#fff" : "#6b7280", fontWeight: "600" }}>
//                 {tab.label}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       </Animated.View>

//       {isLoading ? (
//         <View className="flex-1 items-center justify-center">
//           <ActivityIndicator size="large" color="#3b82f6" />
//           <Text className="mt-4 text-gray-500">Loading connections...</Text>
//         </View>
//       ) : connections.length === 0 ? (
//         <View className="flex-1 items-center justify-center px-4">
//           <Ionicons name="people-outline" size={64} color="#d1d5db" />
//           <Text className="text-lg text-gray-600 mt-4 text-center">No {activeTab} connections yet</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={connections}
//           renderItem={renderConnectionCard}
//           keyExtractor={(item, index) => item?.connection_id ?? `conn-${index}`}
//           contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
//         />
//       )}
//     </SafeAreaView>
//   )
// }

// export default ConnectionScreen




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
  const radius = 1000000; // meters
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
