import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import MapWebView from '../components/MapWebView';
import { colors, typography } from '../theme';
import { useEchoes } from '../features/echoes/application/EchoDataProvider';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const placeholders = [
  "Where was the café with the orange cat?",
  "Show every sunset",
  "Where did I leave my keys?",
  "Find the quiet forest library"
];

const formatCapturedDate = (value) => {
  if (!value) return 'Saved memory';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
};

export default function MapScreen({ navigation, onLeaveMemory }) {
  const insets = useSafeAreaInsets();
  const { echoes } = useEchoes();
  const [selectedPin, setSelectedPin] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Cycling placeholder text with opacity crossfade
  const [displayText, setDisplayText] = useState(placeholders[0]);
  const placeholderOpacity = useSharedValue(1);

  const switchText = useCallback((currentText) => {
    const nextIdx = (placeholders.indexOf(currentText) + 1) % placeholders.length;
    setDisplayText(placeholders[nextIdx]);
    placeholderOpacity.value = withTiming(1, { duration: 200 });
  }, [placeholderOpacity]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out, then change text and fade back in
      placeholderOpacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(switchText)(displayText);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [displayText, placeholderOpacity, switchText]);

  // Animated styles for cycling placeholder
  const placeholderStyle = useAnimatedStyle(() => ({
    opacity: placeholderOpacity.value,
  }));

  // Reanimated shared values for tap feedbacks
  const fabScale = useSharedValue(1);
  const locScale = useSharedValue(1);
  const sheetY = useSharedValue(220); // starts hidden below screen

  // FAB animations
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));
  const handleFABPressIn = () => {
    fabScale.value = withTiming(0.95, { duration: 80 });
  };
  const handleFABPressOut = () => {
    fabScale.value = withTiming(1, { duration: 120 });
  };

  // Recenter button animations
  const locStyle = useAnimatedStyle(() => ({
    transform: [{ scale: locScale.value }],
  }));
  const handleLocPressIn = () => {
    locScale.value = withTiming(0.92, { duration: 80 });
  };
  const handleLocPressOut = () => {
    locScale.value = withTiming(1, { duration: 120 });
  };

  // Bottom sheet transition style
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const handlePinTap = useCallback((pin) => {
    setSelectedPin(pin);
    // Slide up bottom sheet smoothly (220ms ease-out)
    sheetY.value = withTiming(0, { duration: 220 });
  }, [sheetY]);

  const handleCloseSheet = useCallback(() => {
    // Slide down bottom sheet (180ms ease-out)
    sheetY.value = withTiming(220, { duration: 180 }, () => {
      runOnJS(setSelectedPin)(null);
    });
  }, [sheetY]);

  const handleRecenter = useCallback(() => {
    setRecenterTrigger((prev) => prev + 1);
  }, []);

  return (
    <View style={styles.container}>
      {/* Full-bleed Map component */}
      <MapWebView echoes={echoes} onPinTap={handlePinTap} recenterTrigger={recenterTrigger} />

      {/* Floating Search Bar (Top) */}
      <View style={[styles.searchOuter, { paddingTop: insets.top + 10 }]}>
        <View style={[
          styles.searchContainer,
          searchFocused && styles.searchContainerFocused
        ]}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              selectionColor="#ff7a4d"
              placeholder=""
            />
            {searchText.length === 0 && (
              <Animated.View pointerEvents="none" style={[styles.animatedPlaceholder, placeholderStyle]}>
                <Text style={styles.placeholderText}>{displayText}</Text>
              </Animated.View>
            )}
          </View>
          
          <Pressable style={styles.micButton} accessibilityLabel="Voice search" accessibilityRole="button">
            <Feather name="mic" size={15} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>
      </View>

      {/* Location Recenter Button (Bottom-Right, floated above tab bar) */}
      <Animated.View style={[styles.recenterBtnWrapper, locStyle]}>
        <Pressable
          style={styles.recenterBtn}
          onPressIn={handleLocPressIn}
          onPressOut={handleLocPressOut}
          onPress={handleRecenter}
          accessibilityLabel="Recenter location"
          accessibilityRole="button"
        >
          <Ionicons name="navigate-outline" size={20} color="#fff" style={styles.recenterIcon} />
        </Pressable>
      </Animated.View>

      {/* Primary FAB "Leave a Memory" (Bottom-Center) */}
      <Animated.View style={[styles.fabWrapper, fabStyle]}>
        <Pressable
          style={styles.fab}
          onPressIn={handleFABPressIn}
          onPressOut={handleFABPressOut}
          onPress={onLeaveMemory}
          accessibilityLabel="Leave a memory"
          accessibilityRole="button"
        >
          <Feather name="plus" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.fabText}>LEAVE MEMORY</Text>
        </Pressable>
      </Animated.View>

      {/* Slide-Up Pin Detail Sheet */}
      <Animated.View style={[styles.sheetOuter, sheetStyle]}>
        <View style={styles.sheetInner}>
          <View style={styles.sheetHeader}>
            <View style={styles.locIndicator}>
              <Ionicons name="location" size={14} color="#ff7a4d" />
              <Text style={styles.sheetLocText}>{selectedPin?.location}</Text>
            </View>
            <Pressable onPress={handleCloseSheet} style={styles.closeBtn} accessibilityLabel="Close info" accessibilityRole="button">
              <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>
          
          <Text style={styles.sheetTitle}>{selectedPin?.title}</Text>
          <Text style={styles.sheetDetails}>{formatCapturedDate(selectedPin?.capturedAt)}</Text>
          
          <Pressable
            style={styles.openDetailsBtn}
            onPress={() => {
              handleCloseSheet();
              const echo = echoes.find((item) => item.id === selectedPin?.id);
              if (echo) navigation.navigate('Detail', { echo });
            }}
            accessibilityRole="button"
          >
            <Text style={styles.openDetailsBtnText}>Open Memory details</Text>
            <Feather name="arrow-right" size={14} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1012',
    position: 'relative',
  },
  searchOuter: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 0,
    zIndex: 30,
  },
  searchContainer: {
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(20, 22, 26, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  searchContainerFocused: {
    borderColor: '#ff7a4d',
    backgroundColor: 'rgba(20, 22, 26, 0.95)',
  },
  searchIcon: {
    marginRight: 10,
  },
  inputWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    padding: 0,
    height: '100%',
  },
  animatedPlaceholder: {
    position: 'absolute',
    left: 0,
    right: 10,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  micButton: {
    padding: 6,
    borderRadius: 15,
    marginLeft: 6,
  },
  recenterBtnWrapper: {
    position: 'absolute',
    right: 20,
    bottom: 140, // Floated nicely above bottom navigation
    zIndex: 20,
  },
  recenterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(20, 22, 26, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recenterIcon: {
    transform: [{ rotate: '45deg' }],
  },
  fabWrapper: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -70 }], // (140 width / 2) to center it
    bottom: 140,
    width: 140,
    zIndex: 20,
  },
  fab: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff7a4d', // primary solid accent color
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff7a4d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  fabText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sheetOuter: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 140,
    zIndex: 40,
  },
  sheetInner: {
    backgroundColor: 'rgba(20, 22, 26, 0.96)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sheetLocText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sheetDetails: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginBottom: 16,
  },
  openDetailsBtn: {
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  openDetailsBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
