import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_800ExtraBold,
  Lexend_900Black,
} from '@expo-google-fonts/lexend';

export const customFonts = {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_800ExtraBold,
  Lexend_900Black,
};

// Map weight strings to loaded font names
export const fontMap = {
  SpaceGrotesk: {
    '300': 'SpaceGrotesk_300Light',
    '400': 'SpaceGrotesk_400Regular',
    '500': 'SpaceGrotesk_500Medium',
    '600': 'SpaceGrotesk_600SemiBold',
    '700': 'SpaceGrotesk_700Bold',
    '800': 'SpaceGrotesk_700Bold',
    '900': 'SpaceGrotesk_700Bold',
  },
  Manrope: {
    '300': 'Manrope_300Light',
    '400': 'Manrope_400Regular',
    '500': 'Manrope_500Medium',
    '600': 'Manrope_600SemiBold',
    '700': 'Manrope_700Bold',
    '800': 'Manrope_800ExtraBold',
    '900': 'Manrope_800ExtraBold',
  },
  Lexend: {
    '300': 'Lexend_300Light',
    '400': 'Lexend_400Regular',
    '500': 'Lexend_500Medium',
    '600': 'Lexend_600SemiBold',
    '700': 'Lexend_700Bold',
    '800': 'Lexend_800ExtraBold',
    '900': 'Lexend_900Black',
  },
} as const;
