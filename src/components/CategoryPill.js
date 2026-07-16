import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, typography } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CategoryPill({ label, isActive, onPress }) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 250;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(isActive ? colors.ink : colors.pill, { duration }),
      transform: [{ scale: withTiming(isActive ? 1.03 : 1, { duration }) }],
    };
  }, [isActive]);

  return (
    <AnimatedPressable onPress={onPress} style={[styles.pill, animatedStyle]}>
      <Text style={[styles.text, { color: isActive ? '#fff' : colors.ink }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 10,
  },
  text: {
    ...typography.pill,
  },
});
