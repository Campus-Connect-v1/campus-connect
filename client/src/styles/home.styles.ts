import { StyleSheet } from "react-native";
import Colors from "../constants/Colors";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 16,
  },
  greeting: { fontSize: 20, fontWeight: "700", color: "#222", fontFamily:"Gilroy-SemiBold" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 20,
    borderColor: "#f5f5f5"
  },
  searchInput: { marginLeft: 8, flex: 1, fontSize: 14, color: Colors.light.primary, fontFamily:"Gilroy-Regular" },
  announcementContainer: { paddingHorizontal: 20, marginBottom: 26 },
  announcementCard: {
    borderRadius: 16,
    padding: 20,
    overflow: "hidden",
  },
  announcementTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    fontFamily:"Gilroy-Medium"
  },
  announcementSubtitle: { color: "#f3f4f6", fontSize: 13, lineHeight: 18, fontFamily:"Gilroy-Regular" },
  carouselSection: { marginBottom: 30 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    paddingHorizontal: 20,
    marginBottom: 10,
    fontFamily:"Gilroy-Medium"
  },

  cardImage: { flex: 1, justifyContent: "flex-end" },
  cardOverlay: { padding: 16, borderRadius: 18 },
  cardText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    fontFamily:"Gilroy-Medium"
  },
  eventsSection: { paddingHorizontal: 20, marginBottom: 28 },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  eventText: { marginLeft: 10, color: "#333", fontWeight: "500", fontFamily:"Gilroy-Regular" },
  statsContainer: { paddingHorizontal: 20 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 5,
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111", fontFamily:"Gilroy-Regular" },
  statLabel: { fontSize: 13, color: "#555", marginTop: 4, fontFamily:"Gilroy-Medium" },
});