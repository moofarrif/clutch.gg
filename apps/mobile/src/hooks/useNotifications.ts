import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth';

// Configure notification handler (show even when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications().then((token) => {
      if (token) {
        setPushToken(token);
        console.log('[Push] Token obtained:', token);
        // Save token to API
        api.patch('users/me', { json: { expoPushToken: token } })
          .then(() => console.log('[Push] Token saved to backend'))
          .catch((err) => console.warn('[Push] Failed to save token:', err));
      } else {
        console.warn('[Push] No token obtained');
      }
    });

    // Listener: notification received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Could update badge count, show in-app toast, etc.
    });

    // Listener: user taps notification → navigate
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.matchId) {
        router.push(`/match/${data.matchId}`);
      } else if (data?.screen) {
        router.push(data.screen as string);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated, router]);

  return { pushToken };
}

async function registerForPushNotifications(): Promise<string | null> {
  // Push only works on physical devices
  if (!Device.isDevice) {
    console.log('[Push] Not a physical device, skipping');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  console.log('[Push] Current permission status:', existingStatus);

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('[Push] Requested permission, got:', status);
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId;
    console.log('[Push] Using projectId:', projectId);

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;
    console.log('[Push] Token:', token);

    // Android: set notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Clutch.gg',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#cafd00',
      });
    }

    return token;
  } catch (error) {
    console.error('[Push] Error getting token:', error);
    return null;
  }
}
