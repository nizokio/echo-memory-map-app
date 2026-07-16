import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../theme';

const COLLAPSED_HEIGHT = 0;
const EXPANDED_HEIGHT = 280;

export default function DayAccordion({ moment, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const animHeight = useSharedValue(defaultOpen ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT);
  const chevRotation = useSharedValue(defaultOpen ? 180 : 0);
  const reduceMotion = useReducedMotion();

  const bodyStyle = useAnimatedStyle(() => ({
    maxHeight: animHeight.value,
    overflow: 'hidden',
  }));

  const chevStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevRotation.value}deg` }],
  }));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    const dur = reduceMotion ? 0 : 450;
    animHeight.value = withTiming(next ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT, {
      duration: dur,
    });
    chevRotation.value = withTiming(next ? 180 : 0, { duration: reduceMotion ? 0 : 350 });
  };

  return (
    <View style={styles.item}>
      <Pressable style={styles.head} onPress={toggle} accessibilityRole="button">
        <Image source={{ uri: moment.image }} style={styles.thumb} />
        <View style={styles.txt}>
          <Text style={styles.label}>{moment.label}</Text>
          <Text style={styles.name}>{moment.title}</Text>
        </View>
        <Animated.View style={chevStyle}>
          <Feather name="chevron-down" size={16} color={colors.muted} />
        </Animated.View>
      </Pressable>
      <Animated.View style={[styles.body, bodyStyle]}>
        <View style={styles.bodyInner}>
          {moment.details.map((detail, idx) => (
            <View key={idx} style={styles.timeBlock}>
              <Text style={styles.time}>{detail.label}</Text>
              <Text style={styles.desc}>{detail.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  txt: {
    flex: 1,
  },
  label: {
    ...typography.label,
    color: colors.muted,
    marginBottom: 2,
  },
  name: {
    ...typography.body,
    fontWeight: '700',
    color: colors.ink,
  },
  body: {
    backgroundColor: colors.dayBodyBg,
  },
  bodyInner: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 18,
  },
  timeBlock: {
    marginTop: 12,
  },
  time: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.timeLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  desc: {
    ...typography.bodySmall,
    color: '#444',
    marginTop: 3,
    lineHeight: 20,
  },
});
