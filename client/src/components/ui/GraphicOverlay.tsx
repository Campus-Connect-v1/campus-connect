import { StyleSheet, View } from "react-native";

type Pattern = "orbit" | "dots" | "rays";

interface GraphicOverlayProps {
  color: string;
  pattern?: Pattern;
  opacity?: number;
}

/**
 * Lightweight, code-native artwork for promotional cards. It gives flat colour
 * surfaces some editorial texture without another network image or a bitmap
 * that will look soft at different device densities.
 */
export function GraphicOverlay({ color, pattern = "orbit", opacity = 0.16 }: GraphicOverlayProps) {
  if (pattern === "dots") {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
        {Array.from({ length: 24 }).map((_, index) => (
          <View
            key={index}
            style={{
              position: "absolute",
              right: 12 + (index % 6) * 17,
              top: 10 + Math.floor(index / 6) * 17,
              width: 3 + ((index + 1) % 3),
              height: 3 + ((index + 1) % 3),
              borderRadius: 8,
              backgroundColor: color,
            }}
          />
        ))}
      </View>
    );
  }

  if (pattern === "rays") {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
        {[-44, -18, 8, 34, 60].map((rotation, index) => (
          <View
            key={rotation}
            style={{
              position: "absolute",
              width: 190,
              height: 2,
              right: -48,
              top: 35 + index * 25,
              backgroundColor: color,
              transform: [{ rotate: `${rotation}deg` }],
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <View
        style={{
          position: "absolute",
          width: 190,
          height: 190,
          borderRadius: 95,
          borderWidth: 2,
          borderColor: color,
          right: -72,
          top: -62,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 126,
          height: 126,
          borderRadius: 63,
          borderWidth: 2,
          borderColor: color,
          right: -40,
          top: -30,
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: color,
          right: -7,
          top: 4,
        }}
      />
    </View>
  );
}
