import React from 'react';
import { View, Text } from 'react-native';
import { COLORS, AMENITY_LABELS, AMENITY_ICONS } from '@/constants/Colors';

interface AmenityBadgeProps {
  amenity: string;
  size?: 'sm' | 'md';
}

export function AmenityBadge({ amenity, size = 'sm' }: AmenityBadgeProps) {
  const label = AMENITY_LABELS[amenity] ?? amenity;
  const icon = AMENITY_ICONS[amenity] ?? '✓';
  const isMd = size === 'md';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(76, 175, 130, 0.12)',
        borderRadius: 8,
        paddingHorizontal: isMd ? 10 : 8,
        paddingVertical: isMd ? 5 : 3,
      }}
    >
      <Text style={{ fontSize: isMd ? 13 : 11 }}>{icon}</Text>
      <Text
        style={{
          fontSize: isMd ? 12 : 11,
          fontFamily: 'Nunito_600SemiBold',
          color: '#3A8F65',
        }}
      >
        {label}
      </Text>
    </View>
  );
}
