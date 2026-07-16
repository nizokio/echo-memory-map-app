import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';
import FavoriteButton from './FavoriteButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 460;

export default function VerticalImageStack({
  destinations,
  currentIndex,
  onIndexChange,
  onPressCard,
  onFavoriteToggle,
}) {
  const total = destinations.length;
  const stackProgress = useSharedValue(currentIndex);

  // Sync prop changes to shared value aligning with closest absolute progress (fixes infinite loop rubber-band glitch)
  useEffect(() => {
    const currentVal = stackProgress.value;
    const currentWrapped = ((currentVal % total) + total) % total;
    let diff = currentIndex - currentWrapped;
    
    if (diff > total / 2) {
      diff -= total;
    } else if (diff < -total / 2) {
      diff += total;
    }
    
    const targetAbsolute = currentVal + diff;
    stackProgress.value = withTiming(targetAbsolute, {
      duration: 300,
    });
  }, [currentIndex, total]);

  // Shared value to hold start position during gesture drag
  const startProgress = useSharedValue(0);

  // Modern Gesture API configuration (inverted to downwards flow)
  const gesture = Gesture.Pan()
    .onStart(() => {
      startProgress.value = stackProgress.value;
    })
    .onUpdate((event) => {
      // Dragging down throws the card down (positive translationY = advance index)
      const deltaProgress = event.translationY / 250;
      stackProgress.value = startProgress.value + deltaProgress;
    })
    .onEnd((event) => {
      // Snap to nearest index based on velocity and drag position
      const velocity = event.velocityY / 250;
      const targetProgress = Math.round(stackProgress.value + velocity * 0.15);
      
      stackProgress.value = withTiming(targetProgress, {
        duration: 300,
      });

      // Wrap index safely for the JS callback
      const finalIndex = ((Math.round(targetProgress) % total) + total) % total;
      runOnJS(onIndexChange)(finalIndex);
    });

  return (
    <View style={styles.container}>
      {/* Ambient Glow */}
      <View style={styles.ambientGlow} />

      {/* Interactive Card Stack Wrapper */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={styles.stackWrapper}>
          {destinations.map((destination, index) => {
            return (
              <StackCard
                key={destination.id}
                destination={destination}
                index={index}
                total={total}
                stackProgress={stackProgress}
                isCurrent={index === currentIndex}
                onPress={() => onPressCard(destination)}
                onFavoriteToggle={onFavoriteToggle}
              />
            );
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// Single card inside the stack (Tinder/stacked deck layout)
function StackCard({
  destination,
  index,
  total,
  stackProgress,
  isCurrent,
  onPress,
  onFavoriteToggle,
}) {
  const cardStyle = useAnimatedStyle(() => {
    let diff = (index - stackProgress.value) % total;

    // Handle wrapping difference
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    let translateY = 0;
    let scale = 1;
    let opacity = 1;
    let zIndex = 10;

    if (diff < 0) {
      // Swiped away: flies downwards off-screen (diff is negative, so -diff is positive)
      translateY = -diff * 500;
      scale = 1;
      // Fade out as it flies down
      opacity = interpolate(diff, [-1, 0], [0, 1], 'clamp');
      zIndex = 20; // keep it on top while flying down
    } else {
      // Stacked behind the active card, offset upwards
      translateY = -diff * 15; // offset upwards
      scale = 1 - diff * 0.05; // slightly scaled down
      // Fade out slowly as it goes deeper in the deck
      opacity = interpolate(diff, [0, 3], [1, 0.4], 'clamp');
      zIndex = Math.round(10 - diff);
    }

    return {
      transform: [
        { translateY },
        { scale },
      ],
      opacity,
      zIndex,
    };
  });

  return (
    <Animated.View
      style={[styles.cardWrapper, cardStyle]}
      pointerEvents={isCurrent ? 'auto' : 'none'}
    >
      <Pressable onPress={onPress} style={styles.cardInner} accessibilityRole="button">
        <Animated.Image source={{ uri: destination.image }} style={styles.image} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)']}
          locations={[0.4, 1]}
          style={styles.gradient}
        />

        {/* Favorite Heart Button */}
        {isCurrent && (
          <FavoriteButton
            size={40}
            iconSize={19}
            style={styles.favBtn}
            onToggle={onFavoriteToggle}
          />
        )}

        {/* Text details only displayed on active card */}
        {isCurrent && (
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
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 500,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 15,
  },
  ambientGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.pill,
    opacity: 0.08,
    transform: [{ scale: 1.5 }],
    zIndex: -1,
  },
  stackWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
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
    zIndex: 10,
  },
  info: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
  country: {
    color: '#fff',
    opacity: 0.85,
    fontSize: 12,
    marginBottom: 2,
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    color: colors.gold,
    fontSize: 12,
  },
  ratingText: {
    color: '#fff',
    fontSize: 11,
  },
});
