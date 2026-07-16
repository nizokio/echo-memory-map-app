import React, { useState, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FavoriteButton({ size = 40, iconSize = 19, style, onToggle }) {
  const [filled, setFilled] = useState(false);
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(
    (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      const next = !filled;
      setFilled(next);
      onToggle?.(next);
    },
    [filled, onToggle]
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
        animatedStyle,
        style,
      ]}
      accessibilityLabel={filled ? 'Remove from favorites' : 'Add to favorites'}
      accessibilityRole="button"
    >
      <Ionicons
        name={filled ? 'heart' : 'heart-outline'}
        size={iconSize}
        color={filled ? colors.heart : colors.ink}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.favBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
