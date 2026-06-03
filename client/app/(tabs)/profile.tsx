import Colors from '@/src/constants/Colors';
import { getMyEvents } from '@/src/services/events';
import { getMyStudyGroups } from '@/src/services/studyGroups';
import { getProfile, type Profile } from '@/src/services/user';
import { useAuthStore } from '@/src/store/authStore';
import { Font, displayTracking } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CREAM = '#FBF5E9';

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [groupCount, setGroupCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    void getMyStudyGroups().then((r) => {
      if (active && r.success) setGroupCount(r.data.length);
    });
    void getMyEvents().then((r) => {
      if (active && r.success) setEventCount(r.data.length);
    });
    return () => {
      active = false;
    };
  }, []);

  // Re-fetch the editable profile each time the screen regains focus
  // (e.g. after saving in the edit modal).
  useFocusEffect(
    useCallback(() => {
      void getProfile().then((r) => {
        if (r.success) setProfile(r.data);
      });
    }, []),
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.name)}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Student'}</Text>
        {!!user?.email && <Text style={styles.handle}>{user.email}</Text>}
        <View style={styles.accentRule} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatTile value={groupCount != null ? String(groupCount) : '—'} label="Study Groups" />
        <View style={styles.statDivider} />
        <StatTile value={eventCount != null ? String(eventCount) : '—'} label="Events" />
        <View style={styles.statDivider} />
        <StatTile value={user?.university_id ? 'Verified' : '—'} label="Student" />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/profile/edit')}
        >
          <Ionicons name="create-outline" size={18} color={CREAM} />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/connections')}>
          <Ionicons name="people-outline" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* About */}
      <Section title="About">
        <Text style={[styles.body, !profile?.bio && styles.bodyMuted]}>
          {profile?.bio?.trim()
            ? profile.bio
            : "Tell classmates a little about yourself — tap Edit Profile to add a bio."}
        </Text>
      </Section>

      {/* Activity */}
      <Section title="Activity">
        <Row
          icon="book-outline"
          label="Study Groups joined"
          value={groupCount != null ? String(groupCount) : '—'}
        />
        <Row
          icon="calendar-outline"
          label="Events RSVP'd"
          value={eventCount != null ? String(eventCount) : '—'}
        />
        <Row
          icon="school-outline"
          label="University"
          value={user?.university_id ?? '—'}
        />
      </Section>
    </ScrollView>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.activityRow}>
      <Ionicons name={icon} size={20} color={Colors.light.accent} />
      <Text style={styles.activityLabel}>{label}</Text>
      <Text style={styles.activityValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  hero: {
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(251,245,233,0.5)',
  },
  avatarText: {
    fontFamily: Font.display,
    fontSize: 38,
    color: CREAM,
    letterSpacing: displayTracking,
  },
  name: {
    fontFamily: Font.display,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: displayTracking,
    color: CREAM,
    marginTop: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  handle: {
    fontFamily: Font.medium,
    fontSize: 14,
    color: 'rgba(251,245,233,0.7)',
    marginTop: 4,
  },
  accentRule: {
    height: 3,
    width: 40,
    borderRadius: 3,
    backgroundColor: Colors.light.sky,
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    marginHorizontal: 16,
    marginTop: -22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 16,
    shadowColor: '#1A2A33',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statTile: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: Font.display,
    fontSize: 26,
    letterSpacing: displayTracking,
    color: Colors.light.primary,
  },
  statLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: Colors.light.gray,
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: Colors.light.border,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  editText: { fontFamily: Font.semibold, fontSize: 15, color: CREAM },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionTitle: {
    fontFamily: Font.display,
    fontSize: 22,
    letterSpacing: displayTracking,
    color: Colors.light.text,
    marginBottom: 12,
  },
  body: {
    fontFamily: Font.body,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.light.caption,
  },
  bodyMuted: {
    color: Colors.light.gray,
    fontStyle: 'italic',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  activityLabel: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 15,
    color: Colors.light.text,
  },
  activityValue: {
    fontFamily: Font.semibold,
    fontSize: 15,
    color: Colors.light.gray,
  },
});

export default ProfileScreen;
