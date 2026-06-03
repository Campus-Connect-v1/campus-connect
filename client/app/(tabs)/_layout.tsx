import Colors from '@/src/constants/Colors';
import { Font } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import '../globals.css';

type IoniconName = keyof typeof Ionicons.glyphMap;

const TabIcon = ({
  focused,
  icon,
  label,
}: {
  focused: boolean;
  icon: IoniconName;
  label: string;
}) => {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [focused, anim]);

  const color = focused ? Colors.light.primary : Colors.light.tabIconDefault;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 72, paddingTop: 10 }}>
      <Ionicons name={focused ? (icon.replace('-outline', '') as IoniconName) : icon} size={23} color={color} />
      <Text
        style={{
          fontFamily: focused ? Font.semibold : Font.medium,
          fontSize: 11,
          letterSpacing: 0.3,
          color,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
      <Animated.View
        style={{
          height: 2,
          width: 18,
          marginTop: 5,
          borderRadius: 2,
          backgroundColor: Colors.light.primary,
          opacity: anim,
          transform: [
            {
              scaleX: anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
            },
          ],
        }}
      />
    </View>
  );
};

const TabsLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
            backgroundColor: Colors.light.background,
          borderTopWidth: 1,
          borderTopColor: Colors.light.border,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 0,
          elevation: 0,
        },
        tabBarItemStyle: { height: 64 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="home-outline" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="calendar-outline" label="Events" />
          ),
        }}
      />
      <Tabs.Screen
        name="study-groups"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="book-outline" label="Groups" />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="chatbubble-outline" label="Chat" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="person-outline" label="You" />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
