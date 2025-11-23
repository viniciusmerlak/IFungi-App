/**
 * IFungi - Sistema de Monitoramento de Estufas Inteligentes
 * 
 * @packageDocumentation
 * @module IFungi
 * @description Sistema completo de monitoramento e controle de estufas inteligentes
 */

// =============================================
// CONFIGURAÇÕES GLOBAIS
// =============================================

/**
 * Configurações globais do aplicativo
 * @category Configuration
 */
export interface AppConfig {
  /** Nome do aplicativo */
  name: string;
  /** Versão atual */
  version: string;
  /** Configurações do Firebase */
  firebase: FirebaseConfig;
  /** Permissões do Android */
  androidPermissions: string[];
}

/**
 * Configuração do Firebase
 * @category Firebase
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// =============================================
// SENSORES E DADOS
// =============================================

/**
 * Dados dos sensores em tempo real
 * @category Sensors
 */
export interface SensorData {
  /** Temperatura em graus Celsius */
  temperatura: number;
  /** Umidade relativa em porcentagem */
  umidade: number;
  /** Luminosidade em LUX */
  luminosidade: number;
  /** Dióxido de Carbono em PPM */
  co2: number;
  /** Monóxido de Carbono em PPM */
  co: number;
  /** Compostos Orgânicos Voláteis em PPB */
  tvocs?: number;
  /** Nível de água (0-100) */
  agua?: number;
}

/**
 * Item do histórico para gráficos
 * @category History
 */
export interface HistoricoItem {
  co: number;
  co2: number;
  dataHora: string;
  luminosidade: number;
  temperatura: number;
  timestamp: string;
  tvocs: number;
  umidade: number;
}

// =============================================
// ATUADORES E CONTROLE
// =============================================

/**
 * Estado dos atuadores da estufa
 * @category Actuators
 */
export interface Atuadores {
  /** Relé 1 - Controle do climatizador */
  rele1: boolean;
  /** Relé 2 - Modo aquecimento/resfriamento */
  rele2: boolean;
  /** Relé 3 - Umidificador */
  rele3: boolean;
  /** Relé 4 - Exaustor */
  rele4: boolean;
  /** Estado do umidificador (alternativo) */
  umidificador: boolean;
  /** Configuração dos LEDs */
  leds: {
    /** Estado de ligado/desligado */
    ligado: boolean;
    /** Consumo em watts */
    watts: number;
  };
}

/**
 * Setpoints de configuração da estufa
 * @category Configuration
 */
export interface Setpoints {
  /** Temperatura máxima em °C */
  tMax: number;
  /** Temperatura mínima em °C */
  tMin: number;
  /** Umidade mínima em % */
  uMin: number;
  /** Umidade máxima em % */
  uMax: number;
  /** Luminosidade desejada em LUX */
  lux: number;
  /** Limite de CO em PPM */
  coSp: number;
  /** Limite de CO₂ em PPM */
  co2Sp: number;
  /** Limite de TVOCs em PPB */
  tvocsSp: number;
}

// =============================================
// ESTUFA E SISTEMA
// =============================================

/**
 * Dados completos da estufa
 * @category Greenhouse
 */
export interface EstufaData {
  /** Dados dos sensores em tempo real */
  sensores: SensorData;
  /** Estado dos atuadores */
  atuadores: Atuadores;
  /** Setpoints de configuração */
  setpoints: Setpoints;
  /** Níveis e status do sistema */
  niveis: {
    /** Status do reservatório de água */
    agua: boolean;
  };
  /** Informações de status da conexão */
  status: {
    /** Status online/offline */
    online: boolean;
    /** Endereço IP do ESP32 */
    ip: string;
    /** Timestamp do último heartbeat */
    lastHeartbeat: number;
  };
  /** Timestamp da última atualização */
  lastUpdate: number;
}

// =============================================
// NAVEGAÇÃO
// =============================================

/**
 * Parâmetros de navegação do aplicativo
 * @category Navigation
 */
export interface RootStackParamList {
  /** Tela de Splash */
  Splash: undefined;
  /** Tela de Login */
  Login: undefined;
  /** Tela de criação de conta */
  Criar_Conta: undefined;
  /** Tela de conexão com dispositivo */
  ConectarDispositivo: { qrData?: string };
  /** Tela de escaneamento de QR Code */
  QRCode: undefined;
  /** Tela principal de monitoramento */
  Monitoramento: { estufaId: string };
  /** Tela de configurações */
  ConfigScreen: { estufaId: string };
  /** Tela de estado dos atuadores */
  EstadoEstufa: { estufaId: string };
  /** Tela de modo desenvolvedor */
  DevModeScreen: { estufaId: string };
  /** Tela de modo desenvolvedor avançado */
  AdvancedDevModeScreen: { estufaId: string };
}

// =============================================
// AUTENTICAÇÃO E SESSÃO
// =============================================

/**
 * Dados da sessão do usuário
 * @category Authentication
 */
export interface SessionData {
  /** ID do usuário */
  userId: string;
  /** ID da estufa conectada */
  userEstufa?: string;
  /** Status de login */
  isLoggedIn: boolean;
  /** Timestamp da sessão */
  timestamp: number;
}

/**
 * Credenciais salvas do usuário
 * @category Authentication
 */
export interface SavedCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
  timestamp: number;
}

// =============================================
// CONFIGURAÇÕES DE TELA
// =============================================

/**
 * Item de configuração para telas de edição
 * @category UI
 */
export interface ConfigItem {
  key: string;
  label: string;
  unit?: string;
  value: number;
  firebaseKey: string;
}

/**
 * Opção de seleção única (radio)
 * @category UI
 */
export interface RadioOption {
  key: string;
  label: string;
  value: boolean;
  firebaseKey: string;
}

/**
 * Métrica para gráficos de monitoramento
 * @category UI
 */
export interface MetricOption {
  key: keyof SensorData;
  label: string;
  unit: string;
  format: (value: number) => string;
  color: string;
}

// =============================================
// MODO DESENVOLVEDOR
// =============================================

/**
 * Configurações do modo desenvolvedor
 * @category Development
 */
export interface DevModeConfig {
  /** Modo de simulação ativo */
  debug_mode: boolean;
  /** Temperatura simulada */
  tempSim: number;
  /** Umidade simulada */
  humSim: number;
  /** Luminosidade simulada */
  luxSim: number;
  /** CO₂ simulado */
  co2Sim: number;
}

/**
 * Configurações avançadas do modo desenvolvedor
 * @category Development
 */
export interface AdvancedDevConfig {
  /** Modo de operação selecionado */
  operationMode: 'analogRead' | 'pwm' | 'boolean';
  /** Pino digital configurado */
  pin: number;
  /** Valor PWM (0-255) */
  pwmValue: number;
}

// =============================================
// HARDWARE ESP32
// =============================================

/**
 * Especificações do hardware ESP32
 * @category Hardware
 */
export interface ESP32Specs {
  /** Modelo do microcontrolador */
  model: string;
  /** Pinos digitais disponíveis */
  digitalPins: number;
  /** Pinos analógicos disponíveis */
  analogPins: number;
  /** Pinos com capacidade PWM */
  pwmPins: number;
  /** Protocolos de comunicação */
  protocols: string[];
}

/**
 * Configuração dos pinos do ESP32
 * @category Hardware
 */
export interface PinConfiguration {
  /** Pino do sensor de temperatura */
  temperaturePin: number;
  /** Pino do sensor de umidade */
  humidityPin: number;
  /** Pino do sensor de luminosidade */
  lightPin: number;
  /** Pino do sensor de gases */
  gasSensorPin: number;
  /** Pino do relé 1 (Climatizador) */
  rele1Pin: number;
  /** Pino do relé 2 (Modo Peltier) */
  rele2Pin: number;
  /** Pino do relé 3 (Umidificador) */
  rele3Pin: number;
  /** Pino do relé 4 (Exaustor) */
  rele4Pin: number;
  /** Pino do servo motor (Blast Door) */
  servoPin: number;
}

// =============================================
// ERROS E EXCEÇÕES
// =============================================

/**
 * Tipos de erro do sistema
 * @category Errors
 */
export interface SystemError {
  /** Código do erro */
  code: string;
  /** Mensagem descritiva */
  message: string;
  /** Timestamp do erro */
  timestamp: number;
  /** Severidade do erro */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Módulo onde ocorreu o erro */
  module: string;
}

/**
 * Erros específicos do Firebase
 * @category Errors
 */
export interface FirebaseError extends SystemError {
  /** Código específico do Firebase */
  firebaseCode: string;
  /** Ação que estava sendo executada */
  action: string;
}

// =============================================
// VERSÃO E METADADOS
// =============================================

/**
 * Versão atual da documentação de tipos
 */
export const TYPES_VERSION = '1.0.0';

/**
 * Data da última atualização
 */
export const LAST_UPDATED = '2024-01-01';

// =============================================
// EXPORTAÇÕES - FORMA CORRETA
// =============================================

/**
 * Todas as interfaces estão exportadas individualmente acima.
 * Não é necessário exportar em um objeto pois isso causa erro no TypeScript.
 * 
 * @example
 * ```typescript
 * import { SensorData, EstufaData } from './types/documentation';
 * 
 * const sensor: SensorData = {
 *   temperatura: 23.5,
 *   umidade: 85,
 *   luminosidade: 500,
 *   co2: 400,
 *   co: 50
 * };
 * ```
 */

// Remove a exportação problemática do objeto e use apenas exportações individuais