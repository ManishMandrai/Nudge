import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="onboarding" />
      <Tabs.Screen name="checkin" />
      <Tabs.Screen name="progress" />
    </Tabs>
  );
}