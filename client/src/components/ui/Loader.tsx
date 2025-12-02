/**
 * Loader Component
 * 
 * A unified loading indicator component using Lottie animations.
 * This component should be used app-wide for consistent loading states.
 * 
 * Usage:
 * - Full screen: <Loader fullScreen />
 * - Inline: <Loader size={50} />
 * - With text: <Loader text="Loading posts..." />
 * - As overlay: <Loader overlay />
 */

import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Colors from '@/src/constants/Colors';

// Note: Using ActivityIndicator as fallback since lottie-react-native may require
// native configuration. The animation file is available at assets/animations/loading.json
// for when Lottie is fully configured in the native build.

interface LoaderProps {
  /** Size of the loader animation. Default is 100. */
  size?: number;
  /** Whether to display the loader as fullscreen. */
  fullScreen?: boolean;
  /** Whether to display as an overlay on top of content. */
  overlay?: boolean;
  /** Optional loading text to display below the animation. */
  text?: string;
  /** Custom color for the loader. */
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({
  size = 100,
  fullScreen = false,
  overlay = false,
  text,
  color = Colors.light.primary,
}) => {
  // Determine the ActivityIndicator size based on the prop
  const indicatorSize = size > 50 ? 'large' : 'small';
  
  const content = (
    <View style={styles.content}>
      <ActivityIndicator size={indicatorSize} color={color} />
      {text && (
        <Text style={[styles.text, { color: Colors.light.textSecondary }]}>
          {text}
        </Text>
      )}
    </View>
  );

  // Full screen loader - covers entire screen
  if (fullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        {content}
      </View>
    );
  }

  // Overlay loader - semi-transparent backdrop over content
  if (overlay) {
    return (
      <View style={styles.overlayContainer}>
        <View style={styles.overlayBackdrop} />
        <View style={styles.overlayContent}>
          {content}
        </View>
      </View>
    );
  }

  // Inline loader - just the animation
  return content;
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Gilroy-Medium',
    textAlign: 'center',
  },
});

export default Loader;
