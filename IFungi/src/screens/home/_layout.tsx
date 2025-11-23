/**
 * Layout com abas para navegação entre Monitoramento e Estado da Estufa
 * Configura a estrutura de tabs na parte inferior
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Layout principal com navegação por abas
 * Define as telas disponíveis na navegação inferior
 */
export default function Layout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#fda4af',
        tabBarInactiveTintColor: '#888',
      }}
    >
      {/* Tab de Monitoramento */}
      <Tabs.Screen 
        name="monitoramento" 
        options={{
          title: 'Monitoramento',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }} 
      />
      
      {/* Tab de Estado da Estufa */}
      <Tabs.Screen 
        name="estufa" 
        options={{
          title: 'Estado da Estufa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" size={size} color={color} />
          ),
        }} 
      />
    </Tabs>
  );
}