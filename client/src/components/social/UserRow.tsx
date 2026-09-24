import { router } from "expo-router";
import { type ReactNode } from "react";
import { View } from "react-native";

import { Avatar, PressableScale, Text } from "@/src/components/ui";
import { useCampusLookup } from "@/src/hooks/useCampusRing";
import { foregroundOn, radius, spacing } from "@/src/styles/theme";

export interface UserRowPerson {
  id: string;
  name: string;
  avatar?: string | null;
  detail?: string | null;
  universityId?: string | null;
}

/**
 * One person in a list: connections, followers, search results.
 *
 * The campus ring is the same one the map uses, so a person looks the same
 * wherever they appear. `trailing` carries whatever action the list is for —
 * Accept, Follow, a chevron — rather than this component knowing about any of
 * them.
 */
export function UserRow({
  person,
  trailing,
  onPress,
}: {
  person: UserRowPerson;
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  const campusOf = useCampusLookup();
  const campus = campusOf(person.universityId);
  const away = campus && !campus.isOwn;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={person.name + (away ? `, from ${campus.label}` : "")}
      onPress={
        onPress ?? (() => router.push({ pathname: "/person/[id]", params: { id: person.id } }))
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        minHeight: 68,
      }}
    >
      <Avatar
        uri={person.avatar ?? undefined}
        size={48}
        ring={Boolean(campus)}
        ringColor={campus?.color}
        ringWidth={away ? 2.5 : 1.5}
      />

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" numberOfLines={1}>
          {person.name}
        </Text>
        {person.detail ? (
          <Text variant="caption" color="textMuted" numberOfLines={1}>
            {person.detail}
          </Text>
        ) : null}

        {/* Only a visitor's campus is named. Labelling everyone's own campus
            would be noise on a list that is mostly your own campus. */}
        {away ? (
          <View
            style={{
              alignSelf: "flex-start",
              marginTop: 2,
              paddingHorizontal: spacing.xs,
              paddingVertical: 1,
              borderRadius: radius.full,
              backgroundColor: campus.color,
            }}
          >
            <Text variant="caption" style={{ color: foregroundOn(campus.color), fontSize: 10 }}>
              {campus.label}
            </Text>
          </View>
        ) : null}
      </View>

      {trailing ? <View>{trailing}</View> : null}
    </PressableScale>
  );
}
