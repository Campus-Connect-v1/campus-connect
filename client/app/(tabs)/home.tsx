import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Search, Calendar, Users } from "lucide-react-native";
import ProfileDrawer from '@/src/components/layout/profile-drawer';
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/src/styles/home.styles";
import Colors from "@/src/constants/Colors";
import { logout } from "@/src/services/authServices";
import { highlights } from "@/src/mocks/mockData";


const { width, height } = Dimensions.get("window");
export const CARD_WIDTH = width * 0.75;
export const CARD_HEIGHT = height * 0.25;
export const SPACING = 14;

export default function HomeScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);


  const user = {
    name: 'Joshua User',
    username: '@joshuser',
    avatar: 'https://plus.unsplash.com/premium_photo-1747504296823-71ded9ee2b15?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  };

  const handleNavigate = (screen: string) => {
    console.log(`Navigate to ${screen}`);
    // Add your navigation logic here
  };

  const handleLogout = () => {
    logout();
    router.replace("/auth/login")
  };

  return (
    <View style={styles.container}>
      <ProfileDrawer
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header + Search */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi, Elton 👋</Text>
          <TouchableOpacity onPress={() => setIsDrawerVisible(true)} className="ml-4">
        <Ionicons name="settings-outline" size={28} color="#003554" />
      </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search color={Colors.light.primary} size={18} />
          <TextInput
            placeholder="Search people, events, or groups"
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
        </View>

        {/* Announcements */}
        <View style={styles.announcementContainer}>
          <LinearGradient
            colors={["rgb(153,27,27)", "rgb(91,14,13)"]}
            style={styles.announcementCard}
          >
            <BlurView intensity={40} style={StyleSheet.absoluteFill} />
            <Text style={styles.announcementTitle}>
              Mid-Sem Exams Start Monday 📚
            </Text>
            <Text style={styles.announcementSubtitle}>
              Check your timetable and venue allocations in the portal.
            </Text>
          </LinearGradient>
        </View>

        {/* Campus Highlights Carousel */}
        <View style={styles.carouselSection}>
          <Text style={styles.sectionTitle}>Campus Highlights</Text>
          <Animated.FlatList
            data={highlights}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + SPACING}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * (CARD_WIDTH + SPACING),
                index * (CARD_WIDTH + SPACING),
                (index + 1) * (CARD_WIDTH + SPACING),
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: "clamp",
              });

              return (
                <Animated.View
                  style={[styless.card, { transform: [{ scale }] }]}
                >
                  <ImageBackground
                    source={{ uri: item.image }}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 18 }}
                  >
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.8)"]}
                      style={styles.cardOverlay}
                    >
                      <Text style={styles.cardText}>{item.title}</Text>
                    </LinearGradient>
                  </ImageBackground>
                </Animated.View>
              );
            }}
          />
        </View>

        {/* Upcoming Events Widget */}
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={styles.eventCard}>
            <Calendar size={18} color="#16a34a" />
            <Text style={styles.eventText}>Study Jam – Tonight at 7:00PM</Text>
          </View>
          <View style={styles.eventCard}>
            <Users size={18} color="#2563eb" />
            <Text style={styles.eventText}>Tech Innovators Meetup – Sat 3PM</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>23</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>5</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styless = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: SPACING,
    borderRadius: 18,
    overflow: "hidden",
  },
});
