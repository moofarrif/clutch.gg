import { Platform, ViewStyle } from 'react-native';

type ShadowPreset = 'glow' | 'appBar' | 'navBar' | 'ctaLime' | 'ctaCyan';

const webShadows: Record<ShadowPreset, string> = {
  glow: '0px 10px 30px rgba(202,253,0,0.2)',
  appBar: '0px 10px 30px rgba(0,0,0,0.5)',
  navBar: '0px -8px 24px rgba(0,244,254,0.08)',
  ctaLime: '0px 24px 48px rgba(202,253,0,0.2)',
  ctaCyan: '0px 24px 48px rgba(0,244,254,0.08)',
};

const nativeShadows: Record<ShadowPreset, ViewStyle> = {
  glow: {
    shadowColor: '#cafd00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 8,
  },
  appBar: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  navBar: {
    shadowColor: '#00f4fe',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  ctaLime: {
    shadowColor: '#cafd00',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.2,
    shadowRadius: 48,
    elevation: 12,
  },
  ctaCyan: {
    shadowColor: '#00f4fe',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.08,
    shadowRadius: 48,
    elevation: 8,
  },
};

export function shadow(preset: ShadowPreset): ViewStyle {
  if (Platform.OS === 'web') {
    return { boxShadow: webShadows[preset] } as unknown as ViewStyle;
  }
  return nativeShadows[preset];
}
