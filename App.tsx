/**
 * App.tsx - O CORAÇÃO DO APLICATIVO IFUNGI
 * 
 * ## O QUE FAZ:
 * Este é o arquivo principal que inicia todo o aplicativo. Ele funciona como:
 * - 🚀 Ponto de partida quando o app abre
 * - 🧭 Controlador de navegação entre telas  
 * - 🔐 Gerenciador de login automático
 * - 📱 Decisor de qual tela mostrar primeiro
 *
 * ## COMO FUNCIONA:
 * 1. Quando você abre o app, ele verifica se você já está logado
 * 2. Se estiver logado, verifica qual estufa você usa
 * 3. Se tiver uma estufa, vai direto para o Monitoramento
 * 4. Se não tiver, vai para a tela de Conectar Dispositivo
 * 5. Se não estiver logado, vai para o Login
 *
 * ## ESTADOS INTERNOS:
 * - `appIsReady`: boolean - Quando TRUE, o app terminou de carregar e pode mostrar conteúdo
 * - `initialRoute`: object - Define qual tela abrir primeiro
 *
 * ## FUNÇÕES PRINCIPAIS:
 * - `syncFirebaseAuth()` - Conversa com o Firebase para saber se o usuário está logado
 * - `determineInitialRoute()` - Decide pra qual tela ir baseado no login e estufa
 * - `onLayoutRootView()` - Esconde a tela de carregamento quando tudo estiver pronto
 *
 * @component
 * @example
 * ```tsx
 * <App />  // Basta isso - ele cuida de todo o resto automaticamente
 * ```
 */
import React, { useEffect, useCallback, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Importação de telas
import Splash from "./src/screens/SplashScreen/splashScreen";
import Login from "./src/screens/Login/login";
import Home from './src/screens/esp-conect/home';
import NewUser from "./src/screens/Login/Criar_Conta/criar_conta";
import QRCode from "./src/screens/ler_QRcode/qrcode";
import Monitoramento from "./src/screens/home/monitoramento";
import ConfigScreen from "./src/screens/config/config_screen";
import EstadoEstufa from "./src/screens/home/estado_estufa";
import DevModeScreen from "./src/screens/config/DevModeScreen";
import AdvancedDevModeScreen from "./src/screens/config/AdvancedDevModeScreen";

// Serviços e configurações
import { AuthService } from "./src/services/AuthService";
import { FIREBASE_AUTH } from "./src/services/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { RootStackParamList } from "./src/types/navigation";

// Configuração do navegador
const Stack = createNativeStackNavigator<RootStackParamList>();

// Previne que a splash screen seja escondida automaticamente
SplashScreen.preventAutoHideAsync();

/**
 * Componente principal do aplicativo
 * Gerencia a navegação e estado inicial do app
 */
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<{ 
    name: keyof RootStackParamList; 
    params?: any 
  }>({ name: 'Splash' });

  /**
   * Sincroniza o estado de autenticação do Firebase
   * @returns Promise<boolean> - true se usuário está autenticado
   */
  const syncFirebaseAuth = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
        console.log('App: Estado do Firebase Auth alterado:', user ? user.uid : 'null');
        unsubscribe();
        resolve(!!user);
      });
      
      // Timeout de segurança para evitar bloqueio
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 3000);
    });
  };

  /**
   * Determina a rota inicial baseado no estado de autenticação e sessão
   */
  const determineInitialRoute = useCallback(async () => {
    try {
      console.log('App: Determinando rota inicial...');
      
      // Sincronizar Firebase Auth primeiro
      const isFirebaseAuthenticated = await syncFirebaseAuth();
      console.log('App: Firebase Auth sincronizado:', isFirebaseAuthenticated);
      
      // Verificar sessão local
      const session = await AuthService.checkActiveSession();
      console.log('App: Sessão local encontrada:', session);
      
      if (session?.isLoggedIn && session.userId && isFirebaseAuthenticated) {
        console.log('App: Sessão válida e Firebase Auth sincronizado');
        
        if (session.userEstufa) {
          console.log('App: Usuário tem estufa conectada:', session.userEstufa);
          
          // Verificar se a estufa ainda existe no Firebase
          try {
            const db = getDatabase();
            const greenhouseRef = ref(db, `greenhouses/${session.userEstufa}`);
            const greenhouseSnapshot = await get(greenhouseRef);
            
            if (greenhouseSnapshot.exists()) {
              console.log('App: Estufa encontrada no Firebase, navegando para Monitoramento');
              setInitialRoute({ 
                name: 'Monitoramento', 
                params: { estufaId: session.userEstufa } 
              });
            } else {
              console.log('App: Estufa não encontrada no Firebase');
              await AuthService.leaveEstufa(session.userEstufa);
              setInitialRoute({ name: 'ConectarDispositivo' });
            }
          } catch (firebaseError) {
            console.error('App: Erro ao verificar estufa:', firebaseError);
            setInitialRoute({ name: 'ConectarDispositivo' });
          }
        } else {
          console.log('App: Usuário sem estufa, redirecionando para conexão');
          setInitialRoute({ name: 'ConectarDispositivo' });
        }
      } else {
        console.log('App: Nenhuma sessão válida ou Firebase não autenticado');
        
        // Se tem sessão local mas Firebase não autenticado, limpar sessão
        if (session?.isLoggedIn && !isFirebaseAuthenticated) {
          console.log('App: Limpando sessão inconsistente');
          await AuthService.clearActiveSession();
        }
        
        setInitialRoute({ name: 'Login' });
      }
    } catch (error) {
      console.error('App: Erro ao determinar rota inicial:', error);
      setInitialRoute({ name: 'Login' });
    }
  }, []);

  /**
   * Efeito para preparar o aplicativo durante o carregamento inicial
   */
  useEffect(() => {
    const prepareApp = async () => {
      try {
        await determineInitialRoute();
        
        // Aguardar um tempo mínimo para exibir a splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('App: Erro na preparação:', error);
        setInitialRoute({ name: 'Login' });
      } finally {
        setAppIsReady(true);
        console.log('App: Preparação concluída, rota inicial:', initialRoute);
      }
    };

    prepareApp();
  }, [determineInitialRoute]);

  /**
   * Callback chamado quando o layout da view raiz é carregado
   * Esconde a splash screen quando o app está pronto
   */
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      console.log('App: Escondendo splash screen');
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Não renderizar nada até o app estar pronto
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
          initialRouteName={initialRoute.name}
        >
        <Stack.Screen 
          name="Splash" 
          component={Splash} 
          options={{ animation: 'none' }} 
        />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen 
          name="ConectarDispositivo" 
          component={Home}
          options={{ title: 'Conectar Dispositivo' }}
        />
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
          name="ConfigScreen"
          component={ConfigScreen}
          options={{ title: 'Configurações' }}
        />
        <Stack.Screen
          name="EstadoEstufa"
          component={EstadoEstufa}
          options={{ title: 'Estado da Estufa' }}
        />
        <Stack.Screen
          name="DevModeScreen"
          component={DevModeScreen}
          options={{ title: 'Modo Dev' }}
        />
        <Stack.Screen
          name="AdvancedDevModeScreen"
          component={AdvancedDevModeScreen}
          options={{ title: 'Modo Dev Avançado' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export type { RootStackParamList };