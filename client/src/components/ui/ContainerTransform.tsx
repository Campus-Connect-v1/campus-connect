/**
 * ContainerTransform Animation Component
 * 
 * This component provides a Material Design-like container transform animation
 * that can be used to create smooth transitions between a source view and a
 * destination view (e.g., search bar expanding to full screen).
 * 
 * HOW IT WORKS:
 * 1. The source element (e.g., search bar) is measured to get its position/size
 * 2. When triggered, an animated overlay expands from the source bounds
 * 3. Simultaneously, the destination content fades in
 * 4. The animation uses spring physics for a natural feel
 * 
 * ANIMATION PHASES:
 * - Phase 1 (0-0.3): Container begins expanding, source content fades out
 * - Phase 2 (0.3-0.7): Container continues growing to full screen
 * - Phase 3 (0.7-1.0): Destination content fades in, container settles
 * 
 * USAGE:
 * <ContainerTransform
 *   sourceRef={searchBarRef}
 *   expanded={isSearchExpanded}
 *   onExpand={() => setSearchExpanded(true)}
 *   onCollapse={() => setSearchExpanded(false)}
 *   sourceContent={<SearchBar />}
 *   destinationContent={<FullSearchScreen />}
 * />
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  Modal,
  StatusBar,
  Platform,
  Easing,
  LayoutRectangle,
} from 'react-native';
import Colors from '@/src/constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Status bar height for proper positioning
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface ContainerTransformProps {
  /** Whether the container is in expanded state */
  expanded: boolean;
  /** Callback when expansion starts */
  onExpand: () => void;
  /** Callback when collapse completes */
  onCollapse: () => void;
  /** The source element that triggers the expansion (e.g., search bar) */
  sourceContent: React.ReactNode;
  /** The destination content to show when expanded (e.g., full search screen) */
  destinationContent: React.ReactNode;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Background color of the expanded container */
  backgroundColor?: string;
}

const ContainerTransform: React.FC<ContainerTransformProps> = ({
  expanded,
  onExpand,
  onCollapse,
  sourceContent,
  destinationContent,
  duration = 350,
  backgroundColor = Colors.light.background,
}) => {
  // Animation progress (0 = collapsed, 1 = expanded)
  const animationProgress = useRef(new Animated.Value(0)).current;
  
  // Track the source element's layout for positioning the animation
  const [sourceLayout, setSourceLayout] = useState<LayoutRectangle | null>(null);
  const sourceRef = useRef<View>(null);
  
  // Measure the source element's position on screen
  const measureSource = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.measureInWindow((x, y, width, height) => {
        setSourceLayout({ x, y, width, height });
      });
    }
  }, []);

  // Run animation when expanded state changes
  useEffect(() => {
    if (expanded && sourceLayout) {
      // EXPAND ANIMATION
      // Uses spring physics for natural feel, with slight overshoot
      Animated.spring(animationProgress, {
        toValue: 1,
        useNativeDriver: false, // Need false for layout animations
        tension: 65,           // Controls spring stiffness (higher = faster)
        friction: 10,          // Controls damping (higher = less bounce)
      }).start();
    } else if (!expanded) {
      // COLLAPSE ANIMATION
      // Slightly faster collapse with timing for cleaner exit
      Animated.timing(animationProgress, {
        toValue: 0,
        duration: duration * 0.8,
        useNativeDriver: false,
        easing: Easing.out(Easing.cubic),
      }).start(() => {
        // Reset on complete
      });
    }
  }, [expanded, sourceLayout, animationProgress, duration]);

  // Calculate animated container dimensions
  // Interpolates from source bounds to full screen
  const containerStyle = sourceLayout ? {
    // X position: from source X to 0 (left edge)
    left: animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [sourceLayout.x, 0],
    }),
    // Y position: from source Y to top (accounting for status bar)
    top: animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [sourceLayout.y, 0],
    }),
    // Width: from source width to screen width
    width: animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [sourceLayout.width, SCREEN_WIDTH],
    }),
    // Height: from source height to screen height
    height: animationProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [sourceLayout.height, SCREEN_HEIGHT],
    }),
    // Border radius: from rounded to squared
    borderRadius: animationProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [12, 8, 0],
    }),
  } : null;

  // Source content opacity: visible when collapsed, hidden when expanded
  const sourceOpacity = animationProgress.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Destination content opacity: hidden when collapsed, visible when expanded
  const destinationOpacity = animationProgress.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Scale effect for destination content (slight scale up)
  const destinationScale = animationProgress.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.95, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper}>
      {/* Source element - always rendered, triggers expansion on press */}
      <View
        ref={sourceRef}
        onLayout={measureSource}
        style={styles.sourceWrapper}
      >
        {sourceContent}
      </View>

      {/* Animated container overlay - shown during transition and when expanded */}
      {(expanded || animationProgress.__getValue() > 0) && containerStyle && (
        <Modal
          visible={expanded}
          transparent
          animationType="none"
          onRequestClose={onCollapse}
          statusBarTranslucent
        >
          <View style={styles.modalContainer}>
            {/* Animated expanding container */}
            <Animated.View
              style={[
                styles.animatedContainer,
                containerStyle,
                { backgroundColor },
              ]}
            >
              {/* Source content clone - fades out during expansion */}
              <Animated.View
                style={[
                  styles.contentLayer,
                  { opacity: sourceOpacity },
                ]}
              >
                {sourceContent}
              </Animated.View>

              {/* Destination content - fades in during expansion */}
              <Animated.View
                style={[
                  styles.destinationLayer,
                  {
                    opacity: destinationOpacity,
                    transform: [{ scale: destinationScale }],
                  },
                ]}
              >
                {destinationContent}
              </Animated.View>
            </Animated.View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    // Takes up full width of parent
  },
  sourceWrapper: {
    // Source element wrapper - allows measurement
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  animatedContainer: {
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  destinationLayer: {
    flex: 1,
  },
});

export default ContainerTransform;
