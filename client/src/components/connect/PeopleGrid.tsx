import { useMemo } from "react";
import { View, useWindowDimensions } from "react-native";

import { Media, PressableScale, Text } from "@/src/components/ui";
import type { NearbyProfile } from "@/src/services/geolocation";
import { spacing } from "@/src/styles/theme";

interface Props {
  people: NearbyProfile[];
  onSelect: (person: NearbyProfile) => void;
}

const COLUMNS = 3;

/**
 * Height varies by a hash of the id rather than at random, so a tile does not
 * change shape every time the list re-renders.
 */
function heightFactor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return [1.15, 1.45, 1.3, 1.6][(hash >>> 0) % 4];
}

/**
 * Staggered photo grid: three columns of varying-height tiles, packed
 * shortest-column-first so the columns finish roughly level.
 */
export function PeopleGrid({ people, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const columnWidth = (width - spacing.lg * 2 - spacing.xs * (COLUMNS - 1)) / COLUMNS;

  const columns = useMemo(() => {
    const buckets: { items: NearbyProfile[]; height: number }[] = Array.from(
      { length: COLUMNS },
      () => ({ items: [], height: 0 })
    );

    for (const person of people) {
      const shortest = buckets.reduce((a, b) => (a.height <= b.height ? a : b));
      shortest.items.push(person);
      shortest.height += heightFactor(person.user_id);
    }
    return buckets.map((b) => b.items);
  }, [people]);

  return (
    <View style={{ flexDirection: "row", gap: spacing.xs, paddingHorizontal: spacing.lg }}>
      {columns.map((column, i) => (
        <View key={i} style={{ flex: 1, gap: spacing.xs }}>
          {column.map((person) => (
            <PressableScale
              key={person.user_id}
              accessibilityRole="button"
              accessibilityLabel={`${person.first_name} ${person.last_name}, ${Math.round(person.distance)} metres away`}
              onPress={() => onSelect(person)}
            >
              <Media
                source={person.profile_picture ?? undefined}
                scrim
                rounded="md"
                style={{ height: columnWidth * heightFactor(person.user_id) }}
                accessibilityIgnoresInvertColors
              >
                <View style={{ flex: 1, justifyContent: "flex-end", padding: spacing.xs }}>
                  <Text variant="label" onMedia numberOfLines={1}>
                    {person.first_name}
                    {person.age ? `, ${person.age}` : ""}
                  </Text>
                  <Text variant="caption" onMedia style={{ opacity: 0.85 }} numberOfLines={1}>
                    {person.program ??
                      (person.distance < 1000
                        ? `${Math.round(person.distance)} m away`
                        : `${(person.distance / 1000).toFixed(1)} km away`)}
                  </Text>
                </View>
              </Media>
            </PressableScale>
          ))}
        </View>
      ))}
    </View>
  );
}
