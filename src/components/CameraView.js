import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, TextInput, View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Toast from './Toast';
import { useAuth } from '../features/auth/application/AuthDataProvider';
import { SupabaseEchoRepository } from '../features/echoes/data/SupabaseEchoRepository';

const echoRepository = new SupabaseEchoRepository();

export default function CameraView({ visible, onClose, onEchoSaved }) {
  const { session } = useAuth();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
        allowsMultipleSelection: source === 'library',
        selectionLimit: source === 'library' ? 8 : 1,
        quality: 0.85,
        mediaTypes: ['images'],
      });

      if (result.canceled || !result.assets?.[0]) return;
      const photos = result.assets.slice(0, 8);

      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (!locationPermission.granted) {
        showToast('Location permission is required.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setDraft({
        photos,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        capturedAt: new Date().toISOString(),
      });
      showToast('Memory draft ready.');
    } catch (error) {
      showToast(error.message || 'Unable to prepare memory.');
    } finally {
      setIsCapturing(false);
    }
  };

  const saveDraft = async () => {
    if (!draft || isSaving) return;
    if (!session?.access_token) {
      showToast('Sign in from Profile first.');
      return;
    }

    setIsSaving(true);
    try {
      const echoId = await echoRepository.createEcho({
        note,
        location: draft.location,
        capturedAt: draft.capturedAt,
        photos: draft.photos,
      });
      showToast('Memory saved.');
      resetDraft();
      onEchoSaved?.();
      onClose?.();

      void echoRepository
        .captionEcho(echoId)
        .then(() => onEchoSaved?.())
        .catch((error) => console.warn('Echo caption failed:', error));
    } catch (error) {
      const message =
        error.name === 'AuthSessionMissingError'
          ? 'Sign in from Profile first.'
          : error.message || 'Unable to save memory.';
      if (error.name !== 'AuthSessionMissingError') {
        console.warn('Memory save failed:', error);
      }
      showToast(message);
    } finally {
      setIsSaving(false);
    }
  };

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
            <Text style={styles.captureTitle}>{draft ? 'Review Memory' : 'New Memory'}</Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Camera Viewfinder Area */}
        <View style={styles.viewfinder}>
          {draft ? (
            <View style={styles.draftPanel}>
              <Image source={{ uri: draft.photos[0].uri }} style={styles.previewImage} />
              <View style={styles.draftContent}>
                <Text style={styles.draftLabel}>Photos and place attached</Text>
                <Text style={styles.draftTitle}>What happened here?</Text>
                <Text style={styles.draftMeta}>
                  {draft.photos.length} photo{draft.photos.length === 1 ? '' : 's'} - {draft.location.latitude.toFixed(5)}, {draft.location.longitude.toFixed(5)}
                </Text>
                {draft.photos.length > 1 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoStrip}>
                    {draft.photos.map((photo, index) => (
                      <View key={`${photo.uri}-${index}`} style={styles.photoThumbWrap}>
                        <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                        <Text style={styles.photoThumbIndex}>{index + 1}</Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : null}
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Write the detail your future self will search for..."
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  multiline
                  maxLength={180}
                  style={styles.noteInput}
                />
                <View style={styles.draftFooter}>
                  <Text style={styles.draftStatus}>
                    {session?.access_token ? 'Ready to save' : 'Sign in required to save'}
                  </Text>
                  <Text style={styles.noteCount}>{note.length}/180</Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.capturePrompt}>
                <Ionicons name="camera-outline" size={42} color="rgba(255,255,255,0.82)" />
                <Text style={styles.capturePromptTitle}>Capture a place memory</Text>
                <Text style={styles.capturePromptText}>Take a photo or choose one from your library.</Text>
                {!session?.access_token ? (
                  <View style={styles.sessionNotice}>
                    <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.72)" />
                    <Text style={styles.sessionNoticeText}>Sign in later to save this memory.</Text>
                  </View>
                ) : null}
                <View style={styles.captureActions}>
                  <Pressable
                    onPress={() => captureDraft('camera')}
                    style={[styles.primaryAction, isCapturing && styles.disabledControl]}
                    disabled={isCapturing}
                    accessibilityLabel="Take a new photo"
                    accessibilityRole="button"
                  >
                    {isCapturing ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <>
                        <Ionicons name="camera" size={20} color="#000" />
                        <Text style={styles.primaryActionText}>Take Photo</Text>
                      </>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => captureDraft('library')}
                    style={[styles.secondaryAction, isCapturing && styles.disabledControl]}
                    disabled={isCapturing}
                    accessibilityLabel="Choose photo from library"
                    accessibilityRole="button"
                  >
                    <Ionicons name="images-outline" size={20} color="#fff" />
                    <Text style={styles.secondaryActionText}>Choose Photos</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>

        {draft ? (
          <View style={styles.bottomBar}>
            <Pressable
              onPress={() => captureDraft('library')}
              style={styles.draftAction}
              disabled={isCapturing || isSaving}
              accessibilityLabel="Add more photos"
              accessibilityRole="button"
            >
              <Ionicons name="images-outline" size={22} color="#fff" />
              <Text style={styles.draftActionText}>More Photos</Text>
            </Pressable>
            <Pressable
              onPress={saveDraft}
              style={[styles.saveButton, isSaving && styles.disabledControl]}
              disabled={isCapturing || isSaving}
              accessibilityLabel="Save memory"
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.saveButtonText}>Save Memory</Text>
              )}
            </Pressable>
            <Pressable
              style={styles.draftAction}
              onPress={resetDraft}
              disabled={isSaving}
              accessibilityLabel="Discard draft"
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={22} color="#fff" />
              <Text style={styles.draftActionText}>Discard</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Memory saved success toast */}
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
  captureTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    flex: 1,
    backgroundColor: '#111215', // Camera screen background
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1a1b1e',
  },
  capturePrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  capturePromptTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
    textAlign: 'center',
  },
  capturePromptText: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  sessionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 18,
  },
  sessionNoticeText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
  },
  captureActions: {
    width: '100%',
    gap: 12,
    marginTop: 28,
  },
  primaryAction: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryActionText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryAction: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryActionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  bottomBar: {
    height: 116,
    backgroundColor: 'rgba(0,0,0,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
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
  draftAction: {
    minWidth: 76,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftActionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
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
  draftLabel: {
    color: 'rgba(255,255,255,0.54)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 5,
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
  photoStrip: {
    gap: 8,
    paddingTop: 12,
  },
  photoThumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoThumbIndex: {
    position: 'absolute',
    right: 5,
    bottom: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.62)',
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
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
  draftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  draftStatus: {
    color: 'rgba(255,255,255,0.52)',
    fontSize: 11,
    fontWeight: '700',
  },
  noteCount: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    textAlign: 'right',
  },
});
