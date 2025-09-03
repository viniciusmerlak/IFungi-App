import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="monitoramento" options={{ title: 'Monitoramento' }} />
      <Tabs.Screen name="estufa" options={{ title: 'Estado da Estufa' }} />
    </Tabs>
  );
}
