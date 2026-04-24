import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'clutch_onboarding_seen';
const TOOLTIP_PREFIX = 'clutch_tooltip_';
const isWeb = Platform.OS === 'web';

async function getValue(key: string): Promise<string | null> {
  if (isWeb) return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setValue(key: string, value: string): Promise<void> {
  if (isWeb) { localStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    getValue(ONBOARDING_KEY).then((val) => {
      setHasSeenOnboarding(val === 'true');
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    await setValue(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  }, []);

  return { hasSeenOnboarding, completeOnboarding };
}

export function useTooltip(key: string) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    getValue(`${TOOLTIP_PREFIX}${key}`).then((val) => {
      setSeen(val === 'true');
    });
  }, [key]);

  const dismiss = useCallback(async () => {
    await setValue(`${TOOLTIP_PREFIX}${key}`, 'true');
    setSeen(true);
  }, [key]);

  return { visible: seen === false, dismiss };
}
