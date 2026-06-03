import Colors from "@/src/constants/Colors";
import type { CampusEvent } from "@/src/services/events";
import { Font } from "@/src/theme/typography";
import { cardShadow } from "@/src/theme/tokens";
import { dateChip, formatEventDate } from "@/src/utils/time";
import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface EventCardProps {
  event: CampusEvent;
  onPress: (event: CampusEvent) => void;
}

function EventCardBase({ event, onPress }: EventCardProps) {
  const chip = dateChip(event.start_time);
  const isVirtual = event.location_type === "virtual";
  const location = isVirtual
    ? "Online"
    : event.physical_location || "Location TBA";

  return (
    <Pressable style={styles.card} onPress={() => onPress(event)}>
      <View style={styles.dateChip}>
        <Text style={styles.month}>{chip.month}</Text>
        <Text style={styles.day}>{chip.day}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{event.event_type}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {event.event_title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={14} color={Colors.light.gray} />
          <Text style={styles.meta}>{formatEventDate(event.start_time)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons
            name={isVirtual ? "videocam-outline" : "location-outline"}
            size={14}
            color={Colors.light.gray}
          />
          <Text style={styles.meta} numberOfLines={1}>
            {location}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 14,
    ...cardShadow,
  },
  dateChip: {
    width: 54,
    height: 58,
    borderRadius: 10,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  month: {
    color: Colors.light.primary,
    fontSize: 11,
    fontFamily: Font.semibold,
    letterSpacing: 1,
  },
  day: {
    color: Colors.light.primary,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: Font.displayBold,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.lightGray,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 11,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
    textTransform: "capitalize",
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    color: Colors.light.text,
    fontFamily: Font.display,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  meta: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.gray,
    fontFamily: "Barlow_500Medium",
  },
});

export const EventCard = memo(EventCardBase);
export default EventCard;
