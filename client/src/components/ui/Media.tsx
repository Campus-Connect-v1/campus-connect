import { LinearGradient } from "expo-linear-gradient";
import { Image, type ImageProps } from "expo-image";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { radius } from "@/src/styles/theme";

export interface MediaProps extends Omit<ImageProps, "style"> {
  style?: ViewStyle | ViewStyle[];
  /**
   * Adds a bottom-up scrim. REQUIRED whenever text or controls sit on top of
   * the image — student uploads vary from blown-out to near-black, and without
   * a scrim the screen breaks on whichever one the user picked.
   *
   * This is the app's single sanctioned gradient. It is a legibility device,
   * not decoration; no other gradient ships.
   */
  scrim?: boolean | "full";
  children?: React.ReactNode;
  rounded?: keyof typeof radius | "none";
}

export function Media({ scrim, children, rounded = "md", style, ...rest }: MediaProps) {
  /**
   * Ties the loaded image to the URL it came from.
   *
   * FlatList recycles a row's views for a different post as you scroll. Without
   * this, expo-image keeps showing the PREVIOUS post's photo in that recycled
   * view until the new one finishes downloading, so a fast scroll shows the
   * wrong picture under the right caption. Changing the key clears it instead.
   *
   * An explicit recyclingKey on the caller still wins.
   */
  const source = rest.source as { uri?: string } | string | number | undefined;
  const uri =
    typeof source === "string" ? source : typeof source === "object" ? source?.uri : undefined;

  return (
    <View
      style={[
        { overflow: "hidden", borderRadius: rounded === "none" ? 0 : radius[rounded] },
        style as ViewStyle,
      ]}
    >
      <Image
        contentFit="cover"
        transition={220}
        recyclingKey={uri}
        {...rest}
        style={StyleSheet.absoluteFill}
      />
      {scrim ? (
        <LinearGradient
          colors={
            scrim === "full"
              ? ["rgba(7,18,25,0.55)", "rgba(7,18,25,0.15)", "rgba(7,18,25,0.85)"]
              : ["transparent", "rgba(7,18,25,0.10)", "rgba(7,18,25,0.82)"]
          }
          locations={scrim === "full" ? [0, 0.45, 1] : [0.35, 0.6, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {children}
    </View>
  );
}
