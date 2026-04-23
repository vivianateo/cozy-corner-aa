import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { COLORS } from '@/constants/Colors';

function SkeletonBox({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width: width as number,
        height,
        borderRadius,
        backgroundColor: COLORS.surfaceSecondary,
        opacity,
      }}
    />
  );
}

export function SkeletonPlaceCard() {
  return (
    <View
      style={{
        width: 200,
        height: 180,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 12,
        marginRight: 12,
        boxShadow: '0 2px 8px rgba(26, 23, 20, 0.08)',
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 8,
      }}
    >
      <SkeletonBox width="100%" height={90} borderRadius={10} />
      <SkeletonBox width="70%" height={14} />
      <SkeletonBox width="40%" height={10} />
      <SkeletonBox width="90%" height={10} />
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        gap: 12,
        boxShadow: '0 1px 4px rgba(26, 23, 20, 0.06)',
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <SkeletonBox width={80} height={80} borderRadius={10} />
      <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
        <SkeletonBox width="70%" height={14} />
        <SkeletonBox width="40%" height={10} />
        <SkeletonBox width="90%" height={10} />
      </View>
    </View>
  );
}
