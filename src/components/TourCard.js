import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { colors, typography } from '../theme';
import FavoriteButton from './FavoriteButton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function TourCard({ tour, onPress }) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    if (!reduceMotion) scale.value = withTiming(0.97, { duration: 150 });
  };
  const onPressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  return (
    <AnimatedPressable
      style={[styles.card, animStyle]}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityLabel={`${tour.title}, ${tour.days} days, from $${tour.priceFrom}`}
      accessibilityRole="button"
    >
      <View style={styles.imgBox}>
        <Image source={{ uri: tour.image }} style={styles.image} />
      </View>
      <FavoriteButton
        size={30}
        iconSize={14}
        style={styles.favMini}
      />
      <View style={styles.body}>
        <Text style={styles.title}>{tour.title}</Text>
        <Text style={styles.meta}>
          {tour.days} days · from ${tour.priceFrom}/person
        </Text>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingText}>
            {tour.rating.toFixed(1)}  ·  {tour.reviewCount} reviews
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 26,
    elevation: 8,
    backgroundColor: '#fff',
  },
  imgBox: {
    height: 130,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favMini: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  body: {
    padding: 12,
    paddingHorizontal: 14,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: {
    ...typography.tourTitle,
    color: colors.ink,
    marginBottom: 4,
  },
  meta: {
    ...typography.tourMeta,
    color: colors.muted,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  star: {
    color: colors.gold,
    fontSize: 12,
  },
  ratingText: {
    ...typography.tourMeta,
    color: colors.ink,
  },
});
