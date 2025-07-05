import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={() => null}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="capture" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
