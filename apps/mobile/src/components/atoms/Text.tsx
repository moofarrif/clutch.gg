import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { colors, textStyles, type TextVariant, type ColorToken } from '../../theme';
import { fontMap } from '../../theme/fonts';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorToken;
  italic?: boolean;
}

export function Text({
  variant = 'bodyMedium',
  color = 'onSurface',
  italic,
  style,
  ...props
}: TextProps) {
  const variantStyle = textStyles[variant];
  const family = variantStyle.fontFamily as keyof typeof fontMap;
  const weight = (variantStyle.fontWeight ?? '400') as string;
  const resolvedFont = fontMap[family]?.[weight as keyof (typeof fontMap)[typeof family]] ?? family;

  return (
    <RNText
      style={[
        variantStyle,
        { fontFamily: resolvedFont, color: colors[color] },
        italic && { fontStyle: 'italic' },
        style,
      ]}
      {...props}
    />
  );
}
