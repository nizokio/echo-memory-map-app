import React, { useEffect, useCallback } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, typography } from '../theme';

export default function Toast({ message, visible, onHide, duration = 1600 }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const reduceMotion = useReducedMotion();

  const hide = useCallback(() => {
    onHide?.();
  }, [onHide]);

  useEffect(() => {
    if (visible) {
      const animDuration = reduceMotion ? 0 : 350;
      opacity.value = withTiming(1, { duration: animDuration });
      translateY.value = withTiming(0, { duration: animDuration });
      // Auto hide
      opacity.value = withDelay(
        duration,
        withTiming(0, { duration: animDuration }, (finished) => {
          if (finished) runOnJS(hide)();
        })
      );
      translateY.value = withDelay(
        duration,
        withTiming(20, { duration: animDuration })
      );
    }
  }, [visible, duration, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: colors.ink,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    zIndex: 100,
  },
  text: {
    color: '#fff',
    ...typography.caption,
    fontWeight: '600',
  },
});
