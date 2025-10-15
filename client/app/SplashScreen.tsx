import { styles } from "@/src/styles/splash.styles";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import './globals.css'
interface SplashScreenProps {
  onFinish: () => void;
}

// Student images from Unsplash
const studentImages = [
  "https://images.unsplash.com/photo-1685539144681-5b1386d5fd9b?q=80&w=2127&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1577036057060-d318e280b0c2?q=80&w=1964&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1694175271713-a6e2cc378980?q=80&w=1965&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1686213011642-b25f94b95b96?q=80&w=2043&auto=format&fit=crop",
];

const { width } = Dimensions.get("window");

// Onboarding content
const onboardingData = [
  {
    title: "Welcome to CampusConnect",
    subtitle: "Your Ultimate Campus Companion",
    description:
      "Connecting students, simplifying campus life, and creating meaningful experiences.",
  },
  {
    title: "Everything You Need",
    subtitle: "All in One Place",
    description:
      "Access class schedules, campus events, connect with peers, find study groups, and navigate campus resources with ease.",
    features: [
      "Class Schedules",
      "Campus Events",
      "Study Groups",
      "Resource Finder",
      "Student Connect",
    ],
  },
  {
    title: "Ready to Get Started?",
    subtitle: "Join the Campus Community",
    description:
      "Connect with peers, discover opportunities, and make the most of your campus experience.",
  },
];

export default function SplashScreenComponent({ onFinish }: SplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const scrollX = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Change background image every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(imageOpacity, {
        toValue: 0.7,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentImageIndex(
          (prevIndex) => (prevIndex + 1) % studentImages.length
        );
        imageOpacity.setValue(0.7);
        Animated.timing(imageOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Initial fade-in for content
  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 700,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = async () => {
    if (currentStep < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentStep + 1,
        animated: true,
      });
      setCurrentStep(currentStep + 1);
    } else {
      // Save onboarding completion flag
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      onFinish(); // proceed to app
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentStep - 1,
        animated: true,
      });
      setCurrentStep(currentStep - 1);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const renderOnboardingItem = ({
    item,
    index,
  }: {
    item: (typeof onboardingData)[0];
    index: number;
  }) => (
    <View style={styles.slide}>
      <Text style={styles.title}>{item.title}</Text>
      <Text  style={styles.subtitle}>{item.subtitle}</Text>
      <Text style={styles.description}>{item.description}</Text>

      {item.features && (
        <View style={styles.featuresContainer}>
          {item.features.map((feature, idx) => (
            <View key={idx} style={styles.featureItem}>
              <AntDesign name="check-circle" size={20} color="#fff" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}

      {index === onboardingData.length - 1 && (
        <TouchableOpacity style={styles.getStartedButton} onPress={handleNext}>
          <Text style={styles.getStartedButtonText}>Get Started</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 16, 8],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={index}
            style={[styles.dot, { width: dotWidth, opacity }]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: "black" }]}>
      {/* Background Image */}
      <Animated.View
        style={[styles.backgroundImage, { opacity: imageOpacity }]}
      >
        <Image
          source={{ uri: studentImages[currentImageIndex] }}
          style={styles.fullImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.85)"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={renderOnboardingItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: "transparent" }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentStep(newIndex);
          }}
          keyExtractor={(_, index) => index.toString()}
        />

        {renderDots()}

        {/* <View style={styles.buttonsContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <AntDesign name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          {currentStep < onboardingData.length - 1 && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          )}
        </View> */}
      </Animated.View>
    </View>
  );
}
