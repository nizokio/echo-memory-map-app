import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Image, TextInput, View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Toast from './Toast';
import { SupabaseEchoRepository } from '../features/echoes/data/SupabaseEchoRepository';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const echoRepository = new SupabaseEchoRepository();

export default function CameraView({ visible, onClose, onEchoSaved }) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [flashMode, setFlashMode] = useState('off'); // off, on, auto
  const [aspectRatio, setAspectRatio] = useState('4:3');
  const [hdrEnabled, setHdrEnabled] = useState(false);
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const shutterOpacity = useSharedValue(0);
  const shutterScale = useSharedValue(1);

  // Close camera with timing
  const handleClose = () => {
    resetDraft();
    onClose?.();
  };

  const resetDraft = () => {
    setDraft(null);
    setNote('');
    setIsCapturing(false);
    setIsSaving(false);
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
  const triggerShutterAnimation = (onComplete) => {
    shutterScale.value = withTiming(0.9, { duration: 60 }, () => {
      shutterScale.value = withTiming(1, { duration: 100 });
    });

    // Flash/Shutter screen black overlay animation (ease-out snap, 150ms total)
    shutterOpacity.value = withTiming(1, { duration: 40 }, () => {
      shutterOpacity.value = withTiming(0, { duration: 120 }, () => {
        if (onComplete) runOnJS(onComplete)();
      });
    });
  };

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const captureDraft = async (source) => {
    if (isCapturing) return;

    setIsCapturing(true);
    try {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showToast(source === 'camera' ? 'Camera permission is required.' : 'Photo access is required.');
        return;
      }

      const picker =
        source === 'camera'
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync;

      const result = await picker({
        allowsEditing: false,
        quality: 0.85,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (!locationPermission.granted) {
        showToast('Location permission is required.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setDraft({
        photo: result.assets[0],
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        capturedAt: new Date().toISOString(),
      });
      showToast('Draft ready.');
    } catch (error) {
      showToast(error.message || 'Unable to prepare Echo.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCapturePress = () => {
    triggerShutterAnimation(() => captureDraft('camera'));
  };

  const handleGalleryPress = () => {
    captureDraft('library');
  };

  const saveDraft = async () => {
    if (!draft || isSaving) return;

    setIsSaving(true);
    try {
      await echoRepository.createEcho({
        note,
        location: draft.location,
        capturedAt: draft.capturedAt,
        photo: draft.photo,
      });
      showToast('Echo saved.');
      resetDraft();
      onEchoSaved?.();
      onClose?.();
    } catch (error) {
      showToast(error.message || 'Unable to save Echo.');
    } finally {
      setIsSaving(false);
    }
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
          {draft ? (
            <View style={styles.draftPanel}>
              <Image source={{ uri: draft.photo.uri }} style={styles.previewImage} />
              <View style={styles.draftContent}>
                <Text style={styles.draftTitle}>New Echo</Text>
                <Text style={styles.draftMeta}>
                  {draft.location.latitude.toFixed(5)}, {draft.location.longitude.toFixed(5)}
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="What do you want to remember?"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                  maxLength={180}
                  style={styles.noteInput}
                />
                <Text style={styles.noteCount}>{note.length}/180</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Subtle Grid Rule of Thirds Overlay */}
              <View style={styles.gridLineV1} />
              <View style={styles.gridLineV2} />
              <View style={styles.gridLineH1} />
              <View style={styles.gridLineH2} />

              {/* Focal center indicator */}
              <View style={styles.focalBox} />
            </>
          )}
        </View>

        {/* Bottom Controls / Letterbox */}
        <View style={styles.bottomBar}>
          {/* Left: Gallery Thumbnail */}
          <Pressable
            onPress={draft ? resetDraft : handleGalleryPress}
            style={styles.galleryThumb}
            accessibilityLabel={draft ? 'Retake Echo photo' : 'Choose photo from library'}
            accessibilityRole="button"
          >
            <View style={styles.galleryInner} />
          </Pressable>

          {/* Center: Shutter Button */}
          <Animated.View style={shutterBtnStyle}>
            <Pressable
              onPress={draft ? saveDraft : handleCapturePress}
              style={[
                draft ? styles.saveButton : styles.shutterOuter,
                (isCapturing || isSaving) && styles.disabledControl,
              ]}
              disabled={isCapturing || isSaving}
              accessibilityLabel={draft ? 'Save Echo' : 'Capture photo'}
              accessibilityRole="button"
            >
              {isCapturing || isSaving ? (
                <ActivityIndicator color={draft ? '#000' : '#fff'} />
              ) : draft ? (
                <Text style={styles.saveButtonText}>Save</Text>
              ) : (
                <View style={styles.shutterInner} />
              )}
            </Pressable>
          </Animated.View>

          {/* Right: Camera Flip Icon */}
          <Pressable
            style={styles.flipBtn}
            onPress={draft ? resetDraft : undefined}
            accessibilityLabel={draft ? 'Discard draft' : 'Flip camera'}
            accessibilityRole="button"
          >
            <Ionicons name={draft ? 'trash-outline' : 'camera-reverse-outline'} size={24} color="#fff" />
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
          message={toastMessage}
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
  saveButton: {
    minWidth: 96,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledControl: {
    opacity: 0.7,
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
  draftPanel: {
    flex: 1,
    padding: 18,
  },
  previewImage: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#222',
  },
  draftContent: {
    paddingTop: 16,
  },
  draftTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  draftMeta: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    marginTop: 4,
  },
  noteInput: {
    minHeight: 84,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  noteCount: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
});
