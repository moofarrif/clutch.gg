import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from './Text';
import { colors } from '../../theme';

interface StarRatingProps {
  rating: number; // 0-5
  onRate?: (score: number) => void;
  size?: number;
}

export function StarRating({ rating, onRate, size = 24 }: StarRatingProps) {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= rating;
        const StarWrapper = onRate ? TouchableOpacity : View;
        return (
          <StarWrapper
            key={star}
            onPress={onRate ? () => onRate(star) : undefined}
            style={[styles.star, { width: size + 8, height: size + 8 }]}
          >
            <Text
              variant="bodyLarge"
              color={filled ? 'tertiaryContainer' : 'onSurfaceVariant'}
              style={{ fontSize: size }}
            >
              ★
            </Text>
          </StarWrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
