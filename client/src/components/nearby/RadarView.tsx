import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Avatar, PressableScale, Text } from "@/src/components/ui";
import { useCampusLookup } from "@/src/hooks/useCampusRing";
import type { NearbyProfile } from "@/src/services/geolocation";
import { culture, radius as radiusToken, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface Props {
  profiles: NearbyProfile[];
  /** Metres the outermost ring represents. */
  range: number;
  size: number;
  onSelect: (profile: NearbyProfile) => void;
}

const AVATAR = 44;

/**
 * Stable angle per person, derived from their id.
 *
 * The API returns a distance but no bearing, so the angle is not real data — it
 * exists to stop people overlapping. Deriving it from the id rather than
 * `Math.random()` keeps everyone in the same spot across re-renders and
 * refreshes; a radar where people jump around on every poll reads as broken.
 */
function angleFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((hash >>> 0) % 360) * (Math.PI / 180);
}

function PulseRing({ delay, size }: { delay: number; size: number }) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 3200, easing: Easing.out(Easing.quad) }), -1, false)
    );
  }, [delay, progress, reduced]);

  const style = useAnimatedStyle(() => ({
    opacity: (1 - progress.value) * 0.35,
    transform: [{ scale: 0.25 + progress.value * 0.75 }],
  }));

  if (reduced) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: colors.accent,
        },
        style,
      ]}
    />
  );
}

export function RadarView({ profiles, range, size, onSelect }: Props) {
  const { colors } = useTheme();
  const campusOf = useCampusLookup();
  const center = size / 2;
  // Keep avatars off the exact centre and inside the outer ring.
  const usable = center - AVATAR / 2 - spacing.xs;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {[0.34, 0.67, 1].map((fraction) => (
        <View
          key={fraction}
          pointerEvents="none"
          style={{
            position: "absolute",
            width: size * fraction,
            height: size * fraction,
            borderRadius: (size * fraction) / 2,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        />
      ))}

      <PulseRing delay={0} size={size} />
      <PulseRing delay={1600} size={size} />

      {/* You */}
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: radiusToken.full,
          backgroundColor: colors.accent,
        }}
      />

      {profiles.map((profile) => {
        // Square-root scaling: linear placement crushes everyone against the
        // outer edge, because area grows with the square of the radius.
        const ratio = Math.min(profile.distance / range, 1);
        const distanceFromCentre = Math.max(Math.sqrt(ratio), 0.18) * usable;
        const angle = angleFor(profile.user_id);
        const campus = campusOf(profile.universityId);
        const away = campus && !campus.isOwn;

        return (
          <PressableScale
            key={profile.user_id}
            accessibilityRole="button"
            accessibilityLabel={
              `${profile.first_name} ${profile.last_name}, ${Math.round(profile.distance)} metres away` +
              (away ? `, from ${campus.label}` : "")
            }
            onPress={() => onSelect(profile)}
            style={{
              position: "absolute",
              left: center + Math.cos(angle) * distanceFromCentre - AVATAR / 2,
              top: center + Math.sin(angle) * distanceFromCentre - AVATAR / 2,
              alignItems: "center",
            }}
          >
            <Avatar
              uri={profile.profile_picture ?? undefined}
              size={AVATAR}
              // The campus ring outranks the online ring: which campus someone
              // is from is the durable fact, online is a transient one and is
              // already carried by the dot below.
              ring={Boolean(campus) || profile.is_online}
              ringColor={campus?.color}
              ringWidth={away ? 2.5 : 1.5}
            />
            {profile.is_online && campus ? (
              <View
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: 10,
                  height: 10,
                  borderRadius: radiusToken.full,
                  backgroundColor: culture.lime,
                  borderWidth: 1.5,
                  borderColor: colors.background,
                }}
              />
            ) : null}
          </PressableScale>
        );
      })}

      <Text variant="micro" color="textMuted" style={{ position: "absolute", bottom: 0 }}>
        {range >= 1000 ? `${range / 1000} km` : `${range} m`}
      </Text>
    </View>
  );
}
