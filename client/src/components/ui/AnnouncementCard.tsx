import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const AnnouncementCard = ({ title, subtitle }:any) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [displayed, setDisplayed] = useState({ title, subtitle });

  useEffect(() => {
    if (title !== displayed.title || subtitle !== displayed.subtitle) {
      // Step 1: fade out old content
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // Step 2: swap content
        setDisplayed({ title, subtitle });
        // Step 3: fade in new content
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [title, subtitle]);

  return (
    <View style={styles.announcementContainer}>
      <LinearGradient
        colors={["rgb(153,27,27)", "rgb(91,14,13)"]}
        style={styles.announcementCard}
      >
        <BlurView intensity={40} style={StyleSheet.absoluteFill} />
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.announcementTitle}>{displayed.title}</Text>
          <Text style={styles.announcementSubtitle}>{displayed.subtitle}</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  announcementContainer: {
    margin: 12,
  },
  announcementCard: {
    padding: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  announcementSubtitle: {
    fontSize: 14,
    color: "#f3f3f3",
    marginTop: 4,
  },
});

export default AnnouncementCard;
