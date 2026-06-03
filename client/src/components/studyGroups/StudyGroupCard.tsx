import Colors from "@/src/constants/Colors";
import type { StudyGroup } from "@/src/services/studyGroups";
import { Font } from "@/src/theme/typography";
import { cardShadow } from "@/src/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface StudyGroupCardProps {
  group: StudyGroup;
  onPress: (group: StudyGroup) => void;
}

function StudyGroupCardBase({ group, onPress }: StudyGroupCardProps) {
  const isPrivate = group.group_type === "private";

  return (
    <Pressable style={styles.card} onPress={() => onPress(group)}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {group.group_name}
        </Text>
        <Ionicons
          name={isPrivate ? "lock-closed" : "earth"}
          size={14}
          color={Colors.light.gray}
        />
      </View>

      {!!group.course_code && (
        <Text style={styles.course} numberOfLines={1}>
          {group.course_code}
          {group.course_name ? ` · ${group.course_name}` : ""}
        </Text>
      )}

      {!!group.description && (
        <Text style={styles.description} numberOfLines={2}>
          {group.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color={Colors.light.gray} />
          <Text style={styles.meta}>
            {group.member_count ?? 0}/{group.max_members}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="repeat-outline" size={14} color={Colors.light.gray} />
          <Text style={styles.meta}>{group.meeting_frequency}</Text>
        </View>
        {group.is_member && (
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>Joined</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 6,
    ...cardShadow,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 19,
    lineHeight: 24,
    color: Colors.light.text,
    fontFamily: Font.display,
  },
  course: {
    fontSize: 13,
    color: Colors.light.primary,
    fontFamily: "Barlow_500Medium",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.caption,
    fontFamily: "Barlow_400Regular",
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  meta: {
    fontSize: 13,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
  },
  memberBadge: {
    marginLeft: "auto",
    backgroundColor: Colors.light.success,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  memberBadgeText: {
    fontSize: 11,
    color: "#fff",
    fontFamily: "Barlow_600SemiBold",
  },
});

export const StudyGroupCard = memo(StudyGroupCardBase);
export default StudyGroupCard;
