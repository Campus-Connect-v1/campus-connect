import { ScrollView, View } from "react-native";

import { Avatar, PressableScale, Text } from "@/src/components/ui";
import { useCampusLookup } from "@/src/hooks/useCampusRing";
import type { ApiUserCard } from "@/src/services/userServices";
import { foregroundOn, radius, spacing } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

interface Props {
  open: boolean;
  query: string | null;
  loading: boolean;
  people: ApiUserCard[];
  onSelect: (person: ApiUserCard) => void;
}

/**
 * The picker that appears while an @-token is being typed.
 *
 * Sits directly above the composer as a normal sibling rather than floating
 * over the text, so it cannot cover what is being written -- the one thing the
 * writer needs to see while choosing.
 *
 * Renders as soon as the token opens, before any result arrives, because the
 * gesture needs an answer immediately; showing nothing until the network
 * returns reads as "@ does nothing here".
 */
export function MentionSuggestions({ open, query, loading, people, onSelect }: Props) {
  const { colors } = useTheme();
  const campusOf = useCampusLookup();

  if (!open) return null;

  const empty = !loading && people.length === 0;
  const prompt =
    query && query.trim().length > 0
      ? `No one matching “${query.trim()}”`
      : "Keep typing a name to mention someone";

  return (
    <View
      style={{
        maxHeight: 220,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      {empty || loading ? (
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          <Text variant="caption" color="textMuted">
            {loading ? "Searching…" : prompt}
          </Text>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="always"
          style={{ flexGrow: 0 }}
          showsVerticalScrollIndicator={false}
        >
          {people.map((person) => {
            const name = [person.first_name, person.last_name].filter(Boolean).join(" ");
            const campus = campusOf(person.university_id);
            const away = campus ? !campus.isOwn : false;

            return (
              <PressableScale
                key={person.user_id}
                accessibilityRole="button"
                accessibilityLabel={`Mention ${name}${away && campus ? `, at ${campus.label}` : ""}`}
                onPress={() => onSelect(person)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  minHeight: 52,
                }}
              >
                <Avatar
                  uri={person.profile_picture_url ?? undefined}
                  size={32}
                  ring={Boolean(campus)}
                  ringColor={campus?.color}
                  ringWidth={away ? 2.5 : 1.5}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="label" numberOfLines={1}>
                    {name}
                  </Text>
                  {/* The handle is shown because it is what gets inserted, and
                      it is NOT unique -- two people at different universities
                      can share one. The campus badge beside it is what tells
                      them apart. */}
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    @{person.mention_handle ?? name.toLowerCase().replace(/\s+/g, ".")}
                  </Text>
                </View>
                {away && campus ? (
                  <View
                    style={{
                      paddingHorizontal: spacing.xs,
                      paddingVertical: 1,
                      borderRadius: radius.full,
                      backgroundColor: campus.color,
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{ color: foregroundOn(campus.color), fontSize: 10 }}
                    >
                      {campus.label}
                    </Text>
                  </View>
                ) : null}
              </PressableScale>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
