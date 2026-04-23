import React from 'react';
import { View } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS } from '@/constants/Colors';

interface StarRatingProps {
  rating: number;
  size?: number;
  color?: string;
}

export function StarRating({ rating, size = 14, color = COLORS.warning }: StarRatingProps) {
  const rounded = Math.round(rating);
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {stars.map((star) => (
        <Star
          key={star}
          size={size}
          color={star <= rounded ? color : COLORS.textTertiary}
          fill={star <= rounded ? color : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}
