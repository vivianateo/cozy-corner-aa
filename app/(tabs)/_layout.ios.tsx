import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Icon sf="map" />
        <Label>Mappa</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(esplora)">
        <Icon sf="magnifyingglass" />
        <Label>Esplora</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profilo)">
        <Icon sf="person" />
        <Label>Profilo</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
