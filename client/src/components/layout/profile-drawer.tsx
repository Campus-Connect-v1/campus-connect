import Colors from '@/src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Animated,
  Image,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import useSWR from 'swr';
import { fetcher } from '@/src/utils/fetcher';

interface ProfileDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isVisible,
  onClose,
  user,
  onNavigate,
  onLogout,
}) => {
  const slideAnim = React.useRef(new Animated.Value(-300)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
      const { data } = useSWR<any>("/user/profile", fetcher);

      const profile = data?.user;

  React.useEffect(() => {
    if (isVisible) {
      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, overlayOpacity]);

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      onPress: () => {
        router.push('/(tabs)/profile');
      },
    },
    {
      id: 'events',
      title: 'Events',
      icon: 'calendar-outline',
      onPress: () => {
        router.push('/events/events-screen')
        onClose();
      },
    },
    {
      id: 'contributions',
      title: 'Contributions',
      icon: 'extension-puzzle-outline',
      onPress: () => {
        onNavigate('Contributions');
        onClose();
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => {
        // router.push('/(tabs)/settings');
        onClose();
      },
    },
  ];

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  const handleOverlayPress = () => {
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
      
      {/* Overlay */}
      <Animated.View
        className="flex-1 bg-black"
        style={{ opacity: overlayOpacity }}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={handleOverlayPress}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        className="absolute top-0 left-0 h-full w-72"
        style={{
          transform: [{ translateX: slideAnim }],
          backgroundColor: Colors.light.primary
        }}
      >
        {/* User Profile Section */}
        <View className="pt-16 pb-8 px-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} className="w-12 h-12 rounded-full overflow-hidden mr-3">
                <Image
                  source={{ uri: profile?.profile_picture_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <View className="flex-1">
                <Text style={{fontFamily: "Gilroy-Medium"}}  className="text-white text-lg font-semibold">
                  {profile?.first_name} {profile?.last_name}
                </Text>
                <Text style={{fontFamily: "Gilroy-Regular"}} className="text-blue-200 text-sm">
                  @{profile?.email}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="flex-1 pt-4">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="flex-row items-center px-6 py-4 active:bg-blue-800"
              onPress={item.onPress}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color="white"
                className="mr-4"
              />
              <Text style={{fontFamily: "Gilroy-Regular"}} className="text-white text-lg font-medium ml-4">
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View className="p-6 pb-8">
          <TouchableOpacity
            className="rounded-full py-4 items-center"
            style={{backgroundColor: Colors.light.border}}
            onPress={handleLogout}
          >
            <Text style={{fontFamily: "Gilroy-Medium"}} className="text-black text-lg font-semibold">
              Log out
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default ProfileDrawer;