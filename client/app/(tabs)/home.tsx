import { useEffect, useRef, useState } from "react"
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
  ActivityIndicator,
  StatusBar,
} from "react-native"
import { Image } from "expo-image"
import useSWR from "swr"
import { fetcher } from "@/src/utils/fetcher"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { useRouter } from "expo-router"
import ProfileDrawer from "@/src/components/layout/profile-drawer"
import SearchModal from "@/src/components/ui/SearchModal"
import * as Haptics from "expo-haptics"
import { Ionicons } from "@expo/vector-icons"
import { styles } from "@/src/styles/home.styles"
import Colors from "@/src/constants/Colors"
import { logout } from "@/src/services/authServices"
import { highlights, announcements } from "@/src/mocks/mockData"
import AnnouncementCard from "@/src/components/ui/AnnouncementCard"

const { width, height } = Dimensions.get("window")
export const CARD_WIDTH = width * 0.75
export const CARD_HEIGHT = height * 0.25
export const SPACING = 14

export default function HomeScreen() {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const scrollX = useRef(new Animated.Value(0)).current
  const [isDrawerVisible, setIsDrawerVisible] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<string | undefined>()
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | undefined>()
  const [selectedYear, setSelectedYear] = useState<string | undefined>()
  const [selectedInterest, setSelectedInterest] = useState<string | undefined>()
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>()

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [showSearchModal, setShowSearchModal] = useState(false)

  const getSearchUrl = (params: {
    q?: string
    university_id?: string
    program?: string
    graduation_year?: string
    interest?: string
    course?: string
    limit?: number
  }) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value.toString())
    })
    return `/user/search?${query.toString()}`
  }

  const { data: searchResults, error: searchError } = useSWR<{ users: any[] }>(
    debouncedQuery || selectedProgram || selectedUniversityId
      ? getSearchUrl({
          q: debouncedQuery,
          program: selectedProgram,
          university_id: selectedUniversityId,
          graduation_year: selectedYear,
          interest: selectedInterest,
          course: selectedCourse,
          limit: 20,
        })
      : null,
    fetcher,
  )

  // Debounce input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query)
    }, 500)

    return () => clearTimeout(handler)
  }, [query])

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

    const { data: user_data } = useSWR<any>("/user/profile", fetcher);
  const { data, isLoading } = useSWR<any>("/user/stats", fetcher);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#000" />
        <Text className="mt-4 text-gray-500">Loading stats...</Text>
      </SafeAreaView>
    )
  }

  const { title, subtitle } = announcements[index]

  const user = {
    name: "Joshua User",
    username: "@joshuser",
    avatar:
      "https://plus.unsplash.com/premium_photo-1738854510296-116ebc8870e7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=436",
  }

  const handleNavigate = (screen: string) => {
    console.log(`Navigate to ${screen}`)
  }

  const handleLogout = () => {
    logout()
    router.replace("/auth/login")
  }

  return (
    <View style={styles.container}>
           <StatusBar barStyle="dark-content" />
      <ProfileDrawer
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header + Search */}
        <View style={styles.header}>


            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push("/notifications")
              }} 
              className="ml-4 flex-row items-center border border-gray-100 px-3 py-2 rounded-full bg-white shadow-sm"
              activeOpacity={0.7}
            >
           <Ionicons name="notifications-outline" size={20} color="#003554" />
          </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                setIsDrawerVisible(true)
              }} 
              className="ml-4 flex-row items-center border border-gray-100 px-3 py-2 rounded-full bg-white shadow-sm"
              activeOpacity={0.7}
            >
            <Ionicons name="menu-outline" size={20} color="#003554" />
            <Text className="font-[Gilroy-Regular] ml-1">Menu</Text>
          </TouchableOpacity>

        </View>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Hi, {user_data?.user?.first_name} {user_data?.user?.last_name} 👋</Text>
        </View>


        <TouchableOpacity 
          style={styles.searchBar}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setShowSearchModal(true)
          }}
        >
          <Ionicons name="search" color={Colors.light.primary} size={20} />
          <Text 
            style={[styles.searchInput, { color: '#999' }]}
          >
            Search people, events, or groups
          </Text>
          <Ionicons name="filter" size={22} color={Colors.light.primary} style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* Announcements */}
        <View style={styles.announcementContainer}>
          <LinearGradient colors={["rgb(153,27,27)", "rgb(91,14,13)"]} style={styles.announcementCard}>
            <BlurView intensity={40} style={StyleSheet.absoluteFill} />
            <Text style={styles.announcementTitle}>{title}</Text>
            <Text style={styles.announcementSubtitle}>{subtitle}</Text>
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
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
            renderItem={({ item, index }) => {
              const inputRange = [
                (index - 1) * (CARD_WIDTH + SPACING),
                index * (CARD_WIDTH + SPACING),
                (index + 1) * (CARD_WIDTH + SPACING),
              ]

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.9, 1, 0.9],
                extrapolate: "clamp",
              })

              return (
                <Animated.View style={[styless.card, { transform: [{ scale }] }]}>
                  <ImageBackground
                    source={{ uri: item.image }}
                    style={styles.cardImage}
                    imageStyle={{ borderRadius: 18 }}
                  >
                    <LinearGradient colors={["transparent", "rgba(0,0,0,0.8)"]} style={styles.cardOverlay}>
                      <Text style={styles.cardText}>{item.title}</Text>
                    </LinearGradient>
                  </ImageBackground>
                </Animated.View>
              )
            }}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsRow}>
            <View className="shadow-sm" style={styles.statBox}>
              <Text style={styles.statValue}>{data?.stats.connections || 0}</Text>
              <Text style={styles.statLabel}>Connection</Text>
            </View>
            <View className="shadow-sm" style={styles.statBox}>
              <Text style={styles.statValue}>{data?.stats.events || 0}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View className="shadow-sm" style={styles.statBox}>
              <Text style={styles.statValue}>{data?.stats.groups || 0}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <SearchModal
        visible={showSearchModal}
        onClose={() => {
          setShowSearchModal(false)
          setQuery("")
        }}
        users={searchResults?.users || []}
        isLoading={false}
        query={query}
        onQueryChange={setQuery}
      />
    </View>
  )
}

const styless = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: SPACING,
    borderRadius: 18,
    overflow: "hidden",
  },
})