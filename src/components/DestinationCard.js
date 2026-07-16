import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, typography } from '../theme';
import FavoriteButton from './FavoriteButton';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function DestinationCard({ destination, onPress, onFavoriteToggle }) {
  const imageScale = useSharedValue(1);
  const reduceMotion = useReducedMotion();

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const onPressIn = () => {
    if (!reduceMotion) imageScale.value = withSpring(1.06, { damping: 15 });
  };
  const onPressOut = () => {
    imageScale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      style={styles.card}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityLabel={`${destination.name}, ${destination.country}`}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.imageContainer, imageAnimStyle]}>
        <Image source={{ uri: destination.image }} style={styles.image} />
      </Animated.View>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        locations={[0.4, 1]}
        style={styles.gradient}
      />
      <FavoriteButton
        size={40}
        iconSize={19}
        style={styles.favBtn}
        onToggle={onFavoriteToggle}
      />
      <View style={styles.info}>
        <Text style={styles.country}>{destination.country}</Text>
        <Text style={styles.name}>{destination.name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingText}>
            {destination.rating.toFixed(1)}  ·  {destination.reviewCount} reviews
          </Text>
        </View>
      </View>
      <Pressable style={styles.seeMore} onPress={onPress}>
        <Text style={styles.seeMoreText}>See more</Text>
        <View style={styles.arrow}>
          <Feather name="arrow-right" size={14} color="#000" />
        </View>
      </Pressable>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    marginTop: 20,
    borderRadius: 28,
    overflow: 'hidden',
    height: 430,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 12,
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  favBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 5,
  },
  info: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 78,
  },
  country: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 12.5,
    marginBottom: 2,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  star: {
    color: colors.gold,
    fontSize: 13,
  },
  ratingText: {
    color: '#fff',
    fontSize: 13,
  },
  seeMore: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: colors.seeMoreBg,
    borderRadius: 24,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 8,
  },
  seeMoreText: {
    color: '#fff',
    ...typography.seeMore,
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
