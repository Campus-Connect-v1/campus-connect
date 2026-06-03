import Colors from '@/src/constants/Colors';
import { useAuthStore } from '@/src/store/authStore';
import { Font, displayTracking } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Animated,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProfileDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  user: { name: string; username: string; avatar: string };
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
}

const MENU: MenuItem[] = [
  { id: 'profile', title: 'Profile', icon: 'person-outline', route: '/(tabs)/profile' },
  { id: 'classmates', title: 'Classmates', icon: 'people-outline', route: '/connections' },
  { id: 'nearby', title: 'Nearby', icon: 'navigate-outline', route: '/nearby' },
  { id: 'campus', title: 'Campus Map', icon: 'map-outline', route: '/campus' },
  { id: 'events', title: 'Events', icon: 'calendar-outline', route: '/(tabs)/events' },
  { id: 'groups', title: 'Study Groups', icon: 'book-outline', route: '/(tabs)/study-groups' },
  { id: 'settings', title: 'Settings', icon: 'settings-outline', route: '/settings' },
];

const CREAM = '#FBF5E9';

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isVisible, onClose, user }) => {
  const slideAnim = React.useRef(new Animated.Value(-320)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;

  const storeUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const name = storeUser?.name ?? user?.name ?? 'Student';
  const email = storeUser?.email ?? user?.username ?? '';
  const avatar = user?.avatar;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isVisible ? 0 : -320,
        duration: isVisible ? 300 : 240,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isVisible ? 0.45 : 0,
        duration: isVisible ? 300 : 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isVisible, slideAnim, overlayOpacity]);

  const go = (item: MenuItem) => {
    onClose();
    if (item.route) router.push(item.route as never);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace('/auth/login');
  };

  return (
    <Modal visible={isVisible} transparent animationType="none" onRequestClose={onClose}>
      <StatusBar backgroundColor="rgba(0,0,0,0.45)" barStyle="light-content" />

      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Brand */}
        <Text style={styles.brand}>CAMPUS{'\n'}CONNECT</Text>
        <View style={styles.accentRule} />

        {/* User */}
        <View style={styles.userRow}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initials(name)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {!!email && (
              <Text style={styles.email} numberOfLines={1}>{email}</Text>
            )}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {MENU.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => go(item)}>
              <Ionicons name={item.icon} size={22} color={CREAM} />
              <Text style={styles.menuText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color="rgba(251,245,233,0.35)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.light.primary} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: 300,
    backgroundColor: Colors.light.primary,
    paddingTop: 72,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brand: {
    fontFamily: Font.display,
    fontSize: 38,
    lineHeight: 38,
    letterSpacing: displayTracking,
    color: CREAM,
  },
  accentRule: {
    height: 3,
    width: 44,
    borderRadius: 3,
    backgroundColor: Colors.light.sky,
    marginTop: 14,
    marginBottom: 28,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(251,245,233,0.18)',
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.light.secondary },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: Font.display, fontSize: 20, color: CREAM, letterSpacing: displayTracking },
  name: { fontFamily: Font.semibold, fontSize: 17, color: CREAM },
  email: { fontFamily: Font.body, fontSize: 13, color: 'rgba(251,245,233,0.6)', marginTop: 2 },
  menu: { flex: 1, paddingTop: 20, gap: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 15,
  },
  menuText: { flex: 1, fontFamily: Font.medium, fontSize: 16, color: CREAM },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: CREAM,
    borderRadius: 999,
    paddingVertical: 15,
  },
  logoutText: { fontFamily: Font.semibold, fontSize: 16, color: Colors.light.primary },
});

export default ProfileDrawer;
