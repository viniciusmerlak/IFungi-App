import React, { useEffect, useCallback, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Splash from "./src/screens/SplashScreen/splashScreen";
import Login from "./src/screens/Login/login";
import Home from './src/screens/esp-conect/home';
import NewUser from "./src/screens/Login/Criar_Conta/criar_conta";
import QRCode from "./src/screens/ler_QRcode/qrcode"; // Importe a nova tela
import Monitoramento from "./src/screens/home/monitoramento"; // Importe a nova tela de monitoramento
import vincularEstufa from "./src/screens/esp-conect/home"; // Importe a função de conectar estufa
import ConfigScreen from "./src/screens/config/config_screen";
import EstadoEstufa from "./src/screens/home/estado_estufa"; // Importe a tela de estado da estufa
// Definição de tipos para as rotas
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Criar_Conta: undefined;
  QRCode: undefined;
  ConectarDispositivo: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Simula carregamento de recursos
        await new Promise(resolve => setTimeout(resolve, 2000));
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: Platform.OS === 'ios' ? 'default' : 'fade',
        }}
        initialRouteName="Splash"
      >
        <Stack.Screen 
          name="Splash" 
          component={Splash} 
          options={{ animation: 'none' }} 
        />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen 
          name="Criar_Conta" 
          component={NewUser} 
          options={{ title: 'Criar Conta' }}
        />
        <Stack.Screen 
          name="QRCode" 
          component={QRCode}
          options={{ title: 'Escanear QR Code' }}
        />
        <Stack.Screen
        name="Monitoramento"
        component={Monitoramento}
        options={{ title: 'Monitoramento' }}
        />
        <Stack.Screen
          name="ConectarDispositivo"
          component={vincularEstufa}
          options={{ title: 'Conectar Dispositivo' }}
        />
        <Stack.Screen
          name="ConfigScreen"
          component={ConfigScreen}
          options={{ title: 'Configurações' }}
        />
        <Stack.Screen
          name="EstadoEstufa"
          component={EstadoEstufa}
          options={{ title: 'Estado da Estufa' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}