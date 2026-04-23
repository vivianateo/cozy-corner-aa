import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, CATEGORY_LABELS } from '@/constants/Colors';

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const color = COLORS.categoryColors[category] ?? COLORS.categoryColors.altro;
  const label = CATEGORY_LABELS[category] ?? category;
  const fontSize = size === 'sm' ? 11 : 13;
  const paddingH = size === 'sm' ? 8 : 10;
  const paddingV = size === 'sm' ? 3 : 5;

  return (
    <View
      style={{
        backgroundColor: color + '20',
        borderRadius: 6,
        paddingHorizontal: paddingH,
        paddingVertical: paddingV,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: '600',
          color,
          fontFamily: 'Nunito_600SemiBold',
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
