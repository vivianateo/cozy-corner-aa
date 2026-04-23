import React from 'react';
import { Tabs } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import type { TabBarItem } from '@/components/FloatingTabBar';

const tabs: TabBarItem[] = [
  { name: '(home)', label: 'Mappa', icon: 'map', route: '/(tabs)/(home)' as const },
  { name: '(esplora)', label: 'Esplora', icon: 'search', route: '/(tabs)/(esplora)' as const },
];

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <FloatingTabBar tabs={tabs} containerWidth={220} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="(esplora)" />
    </Tabs>
  );
}
