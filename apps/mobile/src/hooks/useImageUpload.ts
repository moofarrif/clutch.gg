import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Platform } from 'react-native';
import { useAuthStore } from '../stores/auth';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Max dimensions and quality for upload
const MAX_SIZE = 800;
const COMPRESS_QUALITY = 0.7;

/**
 * Compress image client-side before uploading.
 * Reduces a 10MB photo to ~100-200KB.
 */
async function compressImage(uri: string): Promise<{ uri: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_SIZE } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.WEBP },
  );
  return { uri: result.uri, width: result.width, height: result.height };
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const pickAndUpload = async (): Promise<string | null> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para cambiar tu avatar.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;

    setUploading(true);
    try {
      // Compress client-side (~10MB → ~150KB)
      const compressed = await compressImage(result.assets[0].uri);

      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(compressed.uri);
        const blob = await response.blob();
        formData.append('file', blob, 'avatar.webp');
      } else {
        formData.append('file', {
          uri: compressed.uri,
          type: 'image/webp',
          name: 'avatar.webp',
        } as any);
      }

      const res = await fetch(`${API_URL}/api/users/me/avatar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();

      if (user) {
        setUser({ ...user, photoUrl: data.photoUrl });
      }
      // Invalidar cache del perfil para que la UI se actualice
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      return data.photoUrl;
    } catch {
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { pickAndUpload, uploading };
}
