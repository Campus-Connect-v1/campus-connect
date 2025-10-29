import { Ionicons } from "@expo/vector-icons";

export const getBuildingIcon = (buildingType: string): keyof typeof Ionicons.glyphMap => {
  const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    "Academic": "school",
    "Library": "library",
    "Laboratory": "flask",
    "Administrative": "business",
    "Residential": "home",
    "Sports": "fitness",
    "Dining": "restaurant",
    "Medical": "medical",
    "default": "business"
  };
  return iconMap[buildingType] || iconMap.default;
};

export const getBuildingColor = (buildingType: string): string => {
  const colorMap: { [key: string]: string } = {
    "Academic": "#3b82f6", // Blue
    "Library": "#8b5cf6", // Purple
    "Laboratory": "#10b981", // Green
    "Administrative": "#f59e0b", // Amber
    "Residential": "#ec4899", // Pink
    "Sports": "#ef4444", // Red
    "Dining": "#f97316", // Orange
    "Medical": "#14b8a6", // Teal
    "default": "#6b7280" // Gray
  };
  return colorMap[buildingType] || colorMap.default;
};
