import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import Toast from './Toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CameraView({ visible, onClose }) {
  const [toastVisible, setToastVisible] = useState(false);
  const [flashMode, setFlashMode] = useState('off'); // off, on, auto
  const [aspectRatio, setAspectRatio] = useState('4:3');
  const [hdrEnabled, setHdrEnabled] = useState(false);

  const shutterOpacity = useSharedValue(0);
  const shutterScale = useSharedValue(1);

  // Close camera with timing
  const handleClose = () => {
    onClose?.();
  };

  const toggleFlash = () => {
    if (flashMode === 'off') setFlashMode('on');
    else if (flashMode === 'on') setFlashMode('auto');
    else setFlashMode('off');
  };

  const toggleHdr = () => {
    setHdrEnabled(!hdrEnabled);
  };

  const toggleAspect = () => {
    setAspectRatio((prev) => (prev === '4:3' ? '16:9' : '4:3'));
  };

  // Timed Shutter Snap Animation
  const triggerShutter = () => {
    shutterScale.value = withTiming(0.9, { duration: 60 }, () => {
      shutterScale.value = withTiming(1, { duration: 100 });
    });

    // Flash/Shutter screen black overlay animation (ease-out snap, 150ms total)
    shutterOpacity.value = withTiming(1, { duration: 40 }, () => {
      shutterOpacity.value = withTiming(0, { duration: 120 }, () => {
        runOnJS(showSavedToast)();
      });
    });
  };

  const showSavedToast = () => {
    setToastVisible(true);
  };

  const shutterFlashStyle = useAnimatedStyle(() => ({
    opacity: shutterOpacity.value,
  }));

  const shutterBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
        {/* Top Controls letterbox */}
        <View style={styles.topBar}>
          <Pressable onPress={handleClose} style={styles.iconBtn} accessibilityLabel="Close camera" accessibilityRole="button">
            <Feather name="x" size={20} color="#fff" />
          </Pressable>

          <View style={styles.topActions}>
            <Pressable onPress={toggleFlash} style={styles.iconBtn} accessibilityLabel="Toggle flash" accessibilityRole="button">
              <Ionicons
                name={flashMode === 'on' ? 'flash' : flashMode === 'auto' ? 'flash-outline' : 'flash-off'}
                size={18}
                color={flashMode !== 'off' ? '#ff7a4d' : '#fff'}
              />
            </Pressable>

            <Pressable onPress={toggleAspect} style={styles.textBtn} accessibilityLabel="Toggle ratio" accessibilityRole="button">
              <Text style={styles.btnText}>{aspectRatio}</Text>
            </Pressable>

            <Pressable onPress={toggleHdr} style={styles.textBtn} accessibilityLabel="Toggle HDR" accessibilityRole="button">
              <Text style={[styles.btnText, hdrEnabled && styles.activeBtnText]}>HDR</Text>
            </Pressable>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Camera Viewfinder Area */}
        <View style={styles.viewfinder}>
          {/* Subtle Grid Rule of Thirds Overlay */}
          <View style={styles.gridLineV1} />
          <View style={styles.gridLineV2} />
          <View style={styles.gridLineH1} />
          <View style={styles.gridLineH2} />

          {/* Focal center indicator */}
          <View style={styles.focalBox} />
        </View>

        {/* Bottom Controls / Letterbox */}
        <View style={styles.bottomBar}>
          {/* Left: Gallery Thumbnail */}
          <View style={styles.galleryThumb}>
            <View style={styles.galleryInner} />
          </View>

          {/* Center: Shutter Button */}
          <Animated.View style={shutterBtnStyle}>
            <Pressable
              onPress={triggerShutter}
              style={styles.shutterOuter}
              accessibilityLabel="Capture photo"
              accessibilityRole="button"
            >
              <View style={styles.shutterInner} />
            </Pressable>
          </Animated.View>

          {/* Right: Camera Flip Icon */}
          <Pressable style={styles.flipBtn} accessibilityLabel="Flip camera" accessibilityRole="button">
            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Shutter Snap Flash Black Overlay */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.shutterOverlay, shutterFlashStyle]}
        />

        {/* Echo Saved Success Toast */}
        <Toast
          visible={toastVisible}
          message="Echo saved! 📸"
          duration={2000}
          onHide={() => setToastVisible(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  topBar: {
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  activeBtnText: {
    color: '#ff7a4d',
  },
  viewfinder: {
    flex: 1,
    backgroundColor: '#111215', // Camera screen background
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1a1b1e',
  },
  gridLineV1: {
    position: 'absolute',
    left: '33.3%',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  gridLineV2: {
    position: 'absolute',
    left: '66.6%',
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  gridLineH1: {
    position: 'absolute',
    top: '33.3%',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  gridLineH2: {
    position: 'absolute',
    top: '66.6%',
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  focalBox: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
  },
  bottomBar: {
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
  },
  galleryThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  galleryInner: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  flipBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOverlay: {
    backgroundColor: '#000',
    zIndex: 110,
  },
});
