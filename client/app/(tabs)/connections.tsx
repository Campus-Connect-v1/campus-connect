

import React, { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { shareLocation, useNearbyUsers } from "@/src/services/authServices";
import { MapMarkerCallout, CustomMapMarker, CustomBuildingMarker, BuildingMarkerCallout } from "@/src/components/ui/map-marker";
import { useMapBuildings, Building } from "@/src/services/universityServices";
import { storage } from "@/src/utils/storage";
import { router } from "expo-router";


// Fetcher for SWR
export default function ConnectionsMapScreen() {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapType, setMapType] = useState<"standard" | "satellite" | "terrain" | "hybrid">("standard");
  const [isSharing, setIsSharing] = useState(false);
  const [universityId, setUniversityId] = useState<string | null>(null);
  const radius = 500; // meters
  const lastSharedRef = useRef<number | null>(null);

  const { nearbyUsers, isLoading, isError: error, refetchNearby: mutate } = useNearbyUsers(userLocation ? radius : 0);
  const { buildings, isLoading: buildingsLoading, isError: buildingsError } = useMapBuildings(universityId);
  
  console.log("Nearby users data:", nearbyUsers);
  console.log("Buildings data:", buildings);
  console.log("User location:", universityId);

// Fetch university ID
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
        <ActivityIndicator size="large" color="#007aff" />
        <Text>Getting your location...</Text>
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
        {nearbyUsers?.map((user: any, index: number) => {
  const lat = user.latitude;
  const lng = user.longitude;

  console.log(`User ${user.display_name} coordinates:`, { lat, lng });
  // const lat = user.latitude || 5.607736227139973;
  // const lng = user.longitude || -0.06446675791529029;
  

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



// "use client"

// import { useEffect, useState, useRef } from "react"
// import {
//   View,
//   Text,
//   ActivityIndicator,
//   Alert,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   RefreshControl,
//   Animated,
// } from "react-native"
// import MapView, { Marker, Callout, Circle } from "react-native-maps"
// import { Ionicons } from "@expo/vector-icons"
// import * as Location from "expo-location"
// import * as Haptics from "expo-haptics"
// import { shareLocation, useNearbyUsers } from "@/src/services/authServices"
// import {
//   MapMarkerCallout,
//   CustomMapMarker,
//   CustomBuildingMarker,
//   BuildingMarkerCallout,
// } from "@/src/components/ui/map-marker"
// import { useMapBuildings, type Building } from "@/src/services/universityServices"
// import { storage } from "@/src/utils/storage"
// import { router } from "expo-router"
// import { DEFAULT_UNIVERSITY_ID } from "@/src/constants/app"

// const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
//   const R = 6371000 // Earth's radius in meters
//   const dLat = ((lat2 - lat1) * Math.PI) / 180
//   const dLng = ((lng2 - lng1) * Math.PI) / 180
//   const a =
//     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//     Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
//   return R * c
// }

// const clusterMarkers = (items: any[], clusterRadius = 50) => {
//   if (items.length <= 1) return items.map((item) => ({ ...item, cluster: false, count: 1 }))

//   const clustered: any[] = []
//   const visited = new Set<number>()

//   for (let i = 0; i < items.length; i++) {
//     if (visited.has(i)) continue

//     const cluster = [items[i]]
//     visited.add(i)

//     for (let j = i + 1; j < items.length; j++) {
//       if (visited.has(j)) continue

//       const distance = calculateDistance(items[i].latitude, items[i].longitude, items[j].latitude, items[j].longitude)

//       if (distance < clusterRadius) {
//         cluster.push(items[j])
//         visited.add(j)
//       }
//     }

//     if (cluster.length > 1) {
//       const avgLat = cluster.reduce((sum: number, item: any) => sum + item.latitude, 0) / cluster.length
//       const avgLng = cluster.reduce((sum: number, item: any) => sum + item.longitude, 0) / cluster.length
//       clustered.push({
//         latitude: avgLat,
//         longitude: avgLng,
//         cluster: true,
//         count: cluster.length,
//         items: cluster,
//       })
//     } else {
//       clustered.push({ ...cluster[0], cluster: false, count: 1 })
//     }
//   }

//   return clustered
// }

// export default function ConnectionsMapScreen() {
//   const mapRef = useRef<MapView>(null)
//   const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
//   const [mapType, setMapType] = useState<"standard" | "satellite" | "terrain" | "hybrid">("standard")
//   const [isSharing, setIsSharing] = useState(false)
//   const [universityId, setUniversityId] = useState<string | null>(null)
//   const [showFilters, setShowFilters] = useState(false)
//   const [showSearch, setShowSearch] = useState(false)
//   const [searchQuery, setSearchQuery] = useState("")
//   const [showUsers, setShowUsers] = useState(true)
//   const [showBuildings, setShowBuildings] = useState(true)
//   const [refreshing, setRefreshing] = useState(false)
//   const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
//   const radius = 500 // meters
//   const lastSharedRef = useRef<number | null>(null)
//   const [clusterRadius, setClusterRadius] = useState(50)
//   const markerOpacity = useRef(new Animated.Value(0)).current
//   const filterSlideAnim = useRef(new Animated.Value(100)).current
//   const searchSlideAnim = useRef(new Animated.Value(-100)).current

//   const { nearbyUsers, isLoading, isError: error, refetchNearby: mutate } = useNearbyUsers(userLocation ? radius : 0)
//   const { buildings, isLoading: buildingsLoading, isError: buildingsError } = useMapBuildings(universityId)

//   const filteredUsers =
//     nearbyUsers?.filter((user: any) => user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())) || []
//   const filteredBuildings =
//     buildings?.filter((building: Building) =>
//       building.building_name?.toLowerCase().includes(searchQuery.toLowerCase()),
//     ) || []

//   useEffect(() => {
//     const loadUniversityId = async () => {
//       const userData = await storage.getUserData()
//       setUniversityId(userData?.university_id || DEFAULT_UNIVERSITY_ID)
//     }
//     loadUniversityId()
//   }, [])

//   useEffect(() => {
//     let hasShared = false
//     ;(async () => {
//       if (hasShared) return
//       hasShared = true

//       const { status } = await Location.requestForegroundPermissionsAsync()
//       if (status !== "granted") {
//         Alert.alert("Permission denied", "We need location access to find connections near you.")
//         return
//       }

//       const location = await Location.getCurrentPositionAsync({})
//       const { latitude, longitude } = location.coords
//       setUserLocation({ latitude, longitude })
//       setLocationAccuracy(location.coords.accuracy)

//       try {
//         if (!lastSharedRef.current || Date.now() - lastSharedRef.current > 60_000) {
//           setIsSharing(true)
//           await shareLocation()
//           lastSharedRef.current = Date.now()
//           mutate()
//         }
//       } catch (err: any) {
//         if (err.response?.status === 429) {
//           console.warn("Rate limit reached")
//         } else {
//           console.error("Error sharing location:", err.message)
//         }
//       } finally {
//         setIsSharing(false)
//       }
//     })()
//   }, [])

//   useEffect(() => {
//     Animated.timing(markerOpacity, {
//       toValue: 1,
//       duration: 300,
//       useNativeDriver: true,
//     }).start()
//   }, [nearbyUsers, buildings])

//   useEffect(() => {
//     Animated.timing(filterSlideAnim, {
//       toValue: showFilters ? 0 : 100,
//       duration: 250,
//       useNativeDriver: true,
//     }).start()
//   }, [showFilters])

//   useEffect(() => {
//     Animated.timing(searchSlideAnim, {
//       toValue: showSearch ? 0 : -100,
//       duration: 250,
//       useNativeDriver: true,
//     }).start()
//   }, [showSearch])

//   const clusteredUsers = clusterMarkers(filteredUsers, clusterRadius)
//   const clusteredBuildings = clusterMarkers(filteredBuildings, clusterRadius)

//   const handleRefresh = async () => {
//     setRefreshing(true)
//     try {
//       await mutate()
//     } finally {
//       setRefreshing(false)
//     }
//   }

//   if (!userLocation) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007aff" />
//         <Text style={styles.loadingText}>Getting your location...</Text>
//       </View>
//     )
//   }

//   if (!isLoading && nearbyUsers?.length === 0 && !showBuildings) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="people-outline" size={48} color="#ccc" />
//         <Text style={styles.emptyTitle}>No connections nearby</Text>
//         <Text style={styles.emptyDesc}>Try expanding your search or check back later</Text>
//         <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
//           <Ionicons name="refresh" size={20} color="#fff" />
//           <Text style={styles.refreshBtnText}>Refresh</Text>
//         </TouchableOpacity>
//       </View>
//     )
//   }

//   if (isLoading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007aff" />
//         <Text style={styles.loadingText}>Finding nearby connections...</Text>
//       </View>
//     )
//   }

//   if (error) {
//     return (
//       <View style={styles.center}>
//         <Ionicons name="alert-circle-outline" size={48} color="#ff3b30" />
//         <Text style={styles.errorText}>Something went wrong</Text>
//         <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
//           <Ionicons name="refresh" size={20} color="#fff" />
//           <Text style={styles.refreshBtnText}>Try again</Text>
//         </TouchableOpacity>
//       </View>
//     )
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       <MapView
//         ref={mapRef}
//         style={styles.map}
//         mapType={mapType}
//         region={{
//           latitude: userLocation.latitude,
//           longitude: userLocation.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//         showsUserLocation
//         refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
//       >
//         <Circle
//           center={{
//             latitude: userLocation.latitude,
//             longitude: userLocation.longitude,
//           }}
//           radius={radius}
//           fillColor="rgba(0, 122, 255, 0.1)"
//           strokeColor="rgba(0, 122, 255, 0.3)"
//           strokeWidth={2}
//         />

//         {showUsers &&
//           clusteredUsers?.map((item: any, index: number) => {
//             if (item.cluster) {
//               return (
//                 <Marker
//                   key={`cluster-user-${index}`}
//                   coordinate={{ latitude: item.latitude, longitude: item.longitude }}
//                   onPress={() => Haptics.selectionAsync()}
//                 >
//                   <View style={styles.clusterMarker}>
//                     <Text style={styles.clusterText}>{item.count}</Text>
//                   </View>
//                 </Marker>
//               )
//             }

//             const lat = item.latitude
//             const lng = item.longitude

//             return (
//               <Marker
//                 key={`user-${index}`}
//                 coordinate={{ latitude: lat, longitude: lng }}
//                 onPress={() => Haptics.selectionAsync()}
//               >
//                 <CustomMapMarker user={item} />
//                 <Callout tooltip>
//                   <MapMarkerCallout
//                     user={item}
//                     onConnect={(id) => Alert.alert("Connect", `Send request to ${item.display_name}?`)}
//                   />
//                 </Callout>
//               </Marker>
//             )
//           })}

//         {showBuildings &&
//           clusteredBuildings?.map((item: any, index: number) => {
//             if (item.cluster) {
//               return (
//                 <Marker
//                   key={`cluster-building-${index}`}
//                   coordinate={{ latitude: item.latitude, longitude: item.longitude }}
//                   onPress={() => Haptics.selectionAsync()}
//                 >
//                   <View style={styles.clusterMarkerBuilding}>
//                     <Text style={styles.clusterText}>{item.count}</Text>
//                   </View>
//                 </Marker>
//               )
//             }

//             return (
//               <Marker
//                 key={`building-${item.building_id}`}
//                 coordinate={{
//                   latitude: item.latitude,
//                   longitude: item.longitude,
//                 }}
//                 onPress={() => Haptics.selectionAsync()}
//               >
//                 <CustomBuildingMarker building={item} />
//                 <Callout tooltip>
//                   <BuildingMarkerCallout
//                     building={item}
//                     onViewDetails={(buildingId) => {
//                       router.push(`/university/building-details?buildingId=${buildingId}`)
//                     }}
//                   />
//                 </Callout>
//               </Marker>
//             )
//           })}
//       </MapView>

//       <Animated.View
//         style={[
//           styles.searchContainer,
//           {
//             transform: [{ translateY: searchSlideAnim }],
//           },
//         ]}
//       >
//         <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search people or buildings..."
//           placeholderTextColor="#999"
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//         />
//         <TouchableOpacity
//           onPress={() => {
//             setShowSearch(false)
//             setSearchQuery("")
//           }}
//         >
//           <Ionicons name="close" size={20} color="#999" />
//         </TouchableOpacity>
//       </Animated.View>

//       <Animated.View
//         style={[
//           styles.filterBar,
//           {
//             transform: [{ translateY: filterSlideAnim }],
//           },
//         ]}
//       >
//         <TouchableOpacity
//           style={[styles.filterBtn, showUsers && styles.filterBtnActive]}
//           onPress={() => setShowUsers(!showUsers)}
//         >
//           <Ionicons name="people" size={18} color={showUsers ? "#007aff" : "#999"} />
//           <Text style={[styles.filterBtnText, showUsers && styles.filterBtnTextActive]}>
//             People ({filteredUsers.length})
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.filterBtn, showBuildings && styles.filterBtnActive]}
//           onPress={() => setShowBuildings(!showBuildings)}
//         >
//           <Ionicons name="business" size={18} color={showBuildings ? "#007aff" : "#999"} />
//           <Text style={[styles.filterBtnText, showBuildings && styles.filterBtnTextActive]}>
//             Buildings ({filteredBuildings.length})
//           </Text>
//         </TouchableOpacity>
//       </Animated.View>

//       <View style={styles.controlsContainer}>
//         {/* Recenter button */}
//         <TouchableOpacity
//           style={styles.controlBtn}
//           onPress={() => {
//             Haptics.selectionAsync()
//             mapRef.current?.animateToRegion({
//               latitude: userLocation.latitude,
//               longitude: userLocation.longitude,
//               latitudeDelta: 0.05,
//               longitudeDelta: 0.05,
//             })
//           }}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="locate-sharp" size={22} color="#007aff" />
//         </TouchableOpacity>

//         {/* Map type switcher with icon */}
//         <TouchableOpacity
//           style={styles.controlBtn}
//           onPress={() => {
//             Haptics.selectionAsync()
//             const order = ["standard", "satellite", "terrain", "hybrid"]
//             const next = order[(order.indexOf(mapType) + 1) % order.length]
//             setMapType(next)
//           }}
//           activeOpacity={0.7}
//         >
//           <Ionicons
//             name={mapType === "satellite" ? "image" : mapType === "terrain" ? "mountain" : "map"}
//             size={22}
//             color="#007aff"
//           />
//         </TouchableOpacity>

//         {/* Search button */}
//         <TouchableOpacity
//           style={styles.controlBtn}
//           onPress={() => {
//             Haptics.selectionAsync()
//             setShowSearch(!showSearch)
//           }}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="search" size={22} color="#007aff" />
//         </TouchableOpacity>

//         {/* Filter button */}
//         <TouchableOpacity
//           style={styles.controlBtn}
//           onPress={() => {
//             Haptics.selectionAsync()
//             setShowFilters(!showFilters)
//           }}
//           activeOpacity={0.7}
//         >
//           <Ionicons name="funnel" size={22} color="#007aff" />
//         </TouchableOpacity>

//         {locationAccuracy && (
//           <View style={styles.accuracyIndicator}>
//             <Ionicons name="radio-button-on" size={8} color="#34c759" />
//             <Text style={styles.accuracyText}>{locationAccuracy.toFixed(0)}m</Text>
//           </View>
//         )}
//       </View>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   map: { flex: 1 },
//   center: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 20,
//   },
//   loadingText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: "#666",
//   },
//   emptyTitle: {
//     marginTop: 16,
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#333",
//   },
//   emptyDesc: {
//     marginTop: 8,
//     fontSize: 14,
//     color: "#999",
//     textAlign: "center",
//   },
//   errorText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: "#ff3b30",
//     fontWeight: "600",
//   },
//   refreshBtn: {
//     marginTop: 20,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#007aff",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//     gap: 8,
//   },
//   refreshBtnText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 14,
//   },
//   searchContainer: {
//     position: "absolute",
//     top: 16,
//     left: 16,
//     right: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     color: "#333",
//   },
//   filterBar: {
//     position: "absolute",
//     bottom: 80,
//     left: 16,
//     right: 16,
//     flexDirection: "row",
//     gap: 12,
//   },
//   filterBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     gap: 6,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   filterBtnActive: {
//     borderColor: "#007aff",
//     backgroundColor: "#f0f8ff",
//   },
//   filterBtnText: {
//     fontSize: 12,
//     fontWeight: "500",
//     color: "#999",
//   },
//   filterBtnTextActive: {
//     color: "#007aff",
//   },
//   controlsContainer: {
//     position: "absolute",
//     bottom: 24,
//     right: 16,
//     gap: 12,
//   },
//   controlBtn: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.15,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   accuracyIndicator: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     backgroundColor: "#fff",
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   accuracyText: {
//     fontSize: 12,
//     fontWeight: "600",
//     color: "#34c759",
//   },
//   clusterMarker: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#007aff",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 2,
//     borderColor: "#fff",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3,
//     elevation: 5,
//   },
//   clusterMarkerBuilding: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#ff9500",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 2,
//     borderColor: "#fff",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 3,
//     elevation: 5,
//   },
//   clusterText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 14,
//   },
// })
