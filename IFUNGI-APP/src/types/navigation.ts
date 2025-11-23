/**
 * Definições de tipos para navegação
 * Centraliza a tipagem das rotas do aplicativo
 */

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Parâmetros aceitos por cada rota do aplicativo
 */
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Home: undefined;
  Criar_Conta: undefined;
  QRCode: undefined;
  ConectarDispositivo: { qrData?: string };
  Monitoramento: { estufaId: string };
  ConfigScreen: { estufaId: string };
  EstadoEstufa: { estufaId: string };
  DevModeScreen: { estufaId: string };
  AdvancedDevModeScreen: { estufaId: string };
};

/**
 * Tipo para prop de navegação
 */
export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;