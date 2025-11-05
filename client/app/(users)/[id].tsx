"use client"

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
 StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Svg, { Path } from "react-native-svg";
import useSWR from "swr";
import { fetcher } from "@/src/utils/fetcher";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import DropdownAlert from "@/src/components/ui/DropdownAlert";
import { useDropdownAlert } from "@/src/hooks/useDropdownAlert";
import { sendConnectionRequest, cancelConnectionRequest } from "@/src/services/authServices";


const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 300;
const PROFILE_PIC_SIZE = 110;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const UserProfileScreen: React.FC = () => {
  const { id } = useLocalSearchParams();
  const { alert, hideAlert, success, error: toast } = useDropdownAlert();
  const { data, error, isLoading } = useSWR<any>(id ? `/user/${id}` : null, fetcher);

  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">("none");
  const [isRequesting, setIsRequesting] = useState(false);

  // entrance animation (energetic / youthful)
  const rootScale = useRef(new Animated.Value(0.96)).current;
  const rootTranslateY = useRef(new Animated.Value(12)).current;
  const rootOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(rootOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(rootScale, { toValue: 1, friction: 7, useNativeDriver: true }),
        Animated.timing(rootTranslateY, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]),
      Animated.spring(rootScale, { toValue: 1.03, friction: 6, useNativeDriver: true }),
      Animated.spring(rootScale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (data?.user?.connectionStatus) setConnectionStatus(data.user.connectionStatus);
  }, [data]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-4 text-gray-500">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text>Error loading profile.</Text>
      </SafeAreaView>
    );
  }

  const user = data?.user;
  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text>User not found.</Text>
      </SafeAreaView>
    );
  }

  // helpers
  const openUrl = async (url?: string | null) => {
    if (!url) return toast("uniCLIQ", "No url provided", 2500);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else toast("uniCLIQ", "Can't open this link", 2500);
    } catch {
      toast("uniCLIQ", "Failed to open link", 2500);
    }
  };

  // follower avatar preview array (safe fallback)
  const followerAvatars: string[] = Array.isArray(user.followers_preview)
    ? user.followers_preview.map((f: any) => f.profile_picture_url).filter(Boolean)
    : [];

  // Stats safe values
  const postsCount = user.posts_count ?? 0;
  const followersCount = user.followers_count ?? 0;
  const followingCount = user.following_count ?? 0;

  // connection handlers (kept minimal — replace with your service calls)
  const handleConnectionRequest = async () => {
    setIsRequesting(true);
    try {
      // call your service here; demonstration only:
      const result = await sendConnectionRequest(user.user_id)
      success("uniCLIQ", "Connection request sent", 2000);
      setConnectionStatus("pending");
    } finally {
      setIsRequesting(false);
    }
  };
  const handleCancelRequest = async () => {
    setIsRequesting(true);
    try {
      const result = await cancelConnectionRequest(user.user_id)
      setConnectionStatus("none");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={{ flex: 1 }}>
        <DropdownAlert visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} onDismiss={hideAlert} />

        {/* Header (image + blur overlay) */}
        <View style={{ height: HEADER_HEIGHT, width }}>
          <Image
            source={{ uri: user.profile_picture_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2" }}
            style={{ width: "100%", height: HEADER_HEIGHT }}
            resizeMode="cover"
          />
          <BlurView intensity={40} style={{ position: "absolute", left: 0, right: 0, top: 0, height: HEADER_HEIGHT }} />
          {/* Top left back */}
          <View style={{ position: "absolute", top: 18, left: 14 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* White card with wave top */}
        <Animated.View
          style={{
            transform: [{ translateY: rootTranslateY }, { scale: rootScale }],
            opacity: rootOpacity,
            marginTop: -40,
            borderRadius: 20,
            backgroundColor: "#fff",
            paddingTop: 28,
            paddingHorizontal: 18,
            paddingBottom: 40,
            marginHorizontal: 14,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          {/* small wave shape sitting atop the card (visual only) */}
          <View style={{ position: "absolute", top: -36, left: 0, right: 0, alignItems: "center" }}>
            <Svg width={width - 28} height={72} viewBox={`0 0 ${width - 28} 72`}>
              <Path
                d={`
                  M0 72
                  C ${(width - 28) * 0.25} 0, ${(width - 28) * 0.75} 0, ${width - 28} 72
                  L ${width - 28} 72
                  L 0 72 Z
                `}
                fill="#fff"
              />
            </Svg>
          </View>

          {/* Profile picture */}
          <View style={{ alignItems: "center", marginTop: -62 }}>
            <View
              style={{
                width: PROFILE_PIC_SIZE,
                height: PROFILE_PIC_SIZE,
                borderRadius: PROFILE_PIC_SIZE / 2,
                overflow: "hidden",
                borderWidth: 4,
                borderColor: "#fff",
                shadowColor: "#000",
                shadowOpacity: 0.12,
                elevation: 6,
              }}
            >
              <Image
                source={{ uri: user.profile_picture_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2" }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Name + Headline + Follow button */}
          <View style={{ marginTop: 12, alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Gilroy-SemiBold", fontSize: 20, color: "#0f172a" }}>
                {user.first_name} {user.last_name}
              </Text>
              <Text style={{ fontFamily: "Gilroy-Regular", color: "#475569", marginTop: 4 }}>{user.profile_headline}</Text>
            </View>

            <AnimatedTouchable
              onPress={connectionStatus === "pending" ? handleCancelRequest : handleConnectionRequest}
              activeOpacity={0.9}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 18,
                borderRadius: 28,
                backgroundColor: connectionStatus === "pending" ? "#111827" : "#ef4444",
                alignSelf: "center",
                marginLeft: 12,
                transform: [{ scale: rootScale.interpolate({ inputRange: [0.96, 1], outputRange: [0.98, 1.02] }) }],
                shadowColor: "#ef4444",
                shadowOpacity: connectionStatus === "pending" ? 0 : 0.18,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Text style={{ color: "#fff", fontFamily: "Gilroy-SemiBold", fontSize: 14 }}>
                {isRequesting ? "..." : connectionStatus === "pending" ? "Cancel" : "Follow"}
              </Text>
            </AnimatedTouchable>
          </View>

          {/* Floating Stats pills with avatars preview */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 18 }}>
            {/* Post */}
            <View style={styles.pillStyle}>
              <Text style={styles.pillNumber}>{postsCount}</Text>
              <Text style={styles.infoPillLabel}>posts</Text>
            </View>

            {/* Followers with avatar stack */}
            <View style={[styles.pillStyle, { flexDirection: "row", alignItems: "center" }]}>
              <View style={{ marginRight: 8 }}>
                <Text style={styles.pillNumber}>{followersCount}</Text>
                <Text style={styles.infoPillLabel}>followers</Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                {followerAvatars.slice(0, 4).map((uri, i) => (
                  <View
                    key={i}
                    style={{
                      marginLeft: i === 0 ? 0 : -10,
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: "#fff",
                      backgroundColor: "#e6e6e6",
                      elevation: 3,
                    }}
                  >
                    <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                  </View>
                ))}
              </View>
            </View>

            {/* Following */}
            <View style={styles.pillStyle}>
              <Text style={styles.pillNumber}>{followingCount}</Text>
              <Text style={styles.infoPillLabel}>following</Text>
            </View>
          </View>

          {/* Social links as chips */}
          <View style={{ marginTop: 18 }}>
            <Text style={{ fontFamily: "Gilroy-SemiBold", color: "#0f172a", marginBottom: 8 }}>Social</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => openUrl(user.linkedin_url)} style={styles.chipStyle}>
                <Image source={require("../../assets/icons/linkedin.png")} style={{ width: 25, height: 25}} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openUrl(user.website_url)} style={styles.chipStyle}>
                <Image source={require("../../assets/icons/globalization.png")} style={{ width: 25, height: 25 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* About & personal info */}
          <View style={{ marginTop: 20 }}>
            {user.bio ? (
              <>
                <Text style={{ fontFamily: "Gilroy-SemiBold", color: "#0f172a", marginBottom: 8 }}>About</Text>
                <Text style={{ fontFamily: "Gilroy-Regular", color: "#475569", lineHeight: 20 }}>{user.bio}</Text>
              </>
            ) : null}

            <View style={{ marginTop: 18 }}>
              <Text style={{ fontFamily: "Gilroy-SemiBold", color: "#0f172a", marginBottom: 8 }}>Info</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                <InfoPill label="Program" value={user.program || "-"} />
                <InfoPill label="Year" value={user.year_of_study || "-"} />
                <InfoPill label="Grad🎓" value={user.graduation_year || "-"} />
                <InfoPill label="Email" value={user.email || "-"} />
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserProfileScreen;

/* ---------- small helper styles/components ---------- */
const styles = StyleSheet.create({
  pillStyle: {
    backgroundColor: "#fff",
  borderRadius: 14,
  paddingVertical: 10,
  paddingHorizontal: 12,
  width: (width - 80) / 3,
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 6,
  },
  pillNumber: { fontFamily: "Gilroy-SemiBold", fontSize: 16, color: "#0f172a" },
  chipStyle :{
  flexDirection: "row",
  alignItems: "center",
  paddingVertical: 10,
  paddingHorizontal: 12,
  backgroundColor: "#f1f5f9",
  borderRadius: 16,
  shadowColor: "#000",
  shadowOpacity: 0.03,
  shadowRadius: 8,
  elevation: 2,
},
infoPill: {
    minWidth: 120,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginRight: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  infoPillLabel: {
    fontFamily: "Gilroy-Regular",
    color: "#64748b",
    fontSize: 12,
  },
  infoPillValue: {
    fontFamily: "Gilroy-SemiBold",
    color: "#0f172a",
    marginTop: 4,
  },
});





const InfoPill = ({ label, value }: { label: string; value: string | number }) => (
  <View style={{ minWidth: 120, padding: 10, borderRadius: 10, backgroundColor: "#fff", marginRight: 12, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 }}>
    <Text style={{ fontFamily: "Gilroy-Regular", color: "#64748b", fontSize: 12 }}>{label}</Text>
    <Text style={{ fontFamily: "Gilroy-SemiBold", color: "#0f172a", marginTop: 4 }}>{value}</Text>
  </View>
);
