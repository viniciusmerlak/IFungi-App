/**
 * EstadoEstufa.tsx - O PAINEL DE CONTROLE DOS EQUIPAMENTOS
 * 
 * ## O QUE FAZ:
 * Mostra em tempo real o estado de CADA equipamento da estufa:
 * - ❄️🌡️ Climatizador (está aquecendo, resfriando ou desligado?)
 * - 💧 Umidificador (está ligado ou desligado?)
 * - 💡 LEDs (quantos watts estão consumindo?)
 * - 💨 Exaustor (está ventilando ou parado?)
 *
 * ## COMO FUNCIONA:
 * 1. Pega o ID da estufa (ex: "IFUNGI-001") 
 * 2. Conecta com o Firebase para receber dados em tempo real
 * 3. Mostra cada equipamento com cores diferentes
 *
 * ## PARÂMETROS:
 * @param estufaId - O código único da estufa. Exemplo: "IFUNGI-001"
 *
 * ## ESTADOS INTERNOS:
 * - `data`: EstufaData | null - Guarda todos os dados da estufa vindo do Firebase
 * - `loading`: boolean - TRUE quando está carregando, FALSE quando terminou  
 * - `error`: string | null - Se der erro, guarda a mensagem de erro
 *
 * ## FUNÇÕES PRINCIPAIS:
 * - `climatizador` - Calcula se está aquecendo/resfriando baseado nos relés 1 e 2
 * - `umidificador` - Verifica se o umidificador está ligado (rele3)
 * - `leds` - Mostra o consumo em Watts dos LEDs  
 * - `exaustor` - Verifica se o exaustor está ligado (rele4)
 *
 * @component
 * @example
 * ```tsx
 * // Para mostrar o estado da estufa IFUNGI-001:
 * <EstadoEstufa estufaId="IFUNGI-001" />
 * ```
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { FIREBASE_CONFIG } from '../../services/FirebaseConfig';
import styles from '../../styles/estado_estufa/style';

// Inicialização do Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getDatabase(app);

/**
 * Estrutura dos atuadores controláveis
 */
type Atuadores = {
  rele1: boolean;      // Controle climatizador
  rele2: boolean;      // Modo aquecimento/resfriamento  
  rele3: boolean;      // Umidificador
  rele4: boolean;      // Exaustor
  umidificador: boolean; // Umidificador (alternativo)
  leds: {
    ligado: boolean;
    watts: number;
  };
};

/**
 * Dados completos da estufa
 */
type EstufaData = {
  atuadores: Atuadores;
  lastUpdate: number;
};

// Valores padrão para os atuadores
const defaultAtuadores: Atuadores = {
  rele1: false,
  rele2: false,
  rele3: false,
  rele4: false,
  umidificador: false,
  leds: {
    ligado: false,
    watts: 0
  }
};

/**
 * Tela de Estado dos Atuadores
 * Mostra status operacional dos dispositivos de controle
 */
export default function EstadoEstufa() {
  // Tipagem das rotas disponíveis
  type RootStackParamList = {
    ConfigScreen: { estufaId: string };
    Monitoramento: { estufaId: string };
    Home: { qrData: string };
    ConectarDispositivo: undefined;
    Login: undefined;
    Criar_Conta: undefined;
  };
  
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  type RouteParams = { estufaId?: string };
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const estufaId = route.params?.estufaId ?? 'IFUNGI-001';

  // Estados da aplicação
  const [data, setData] = useState<EstufaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Monitora dados da estufa em tempo real
   */
  useEffect(() => {
    console.log('EstadoEstufa: Iniciando monitoramento da estufa:', estufaId);
    
    const estufaRef = ref(db, `greenhouses/${estufaId}`);
    const unsubscribe = onValue(estufaRef, snap => {
      const firebaseData = snap.val();
      console.log('EstadoEstufa: Dados recebidos do Firebase:', firebaseData);
      
      if (!firebaseData) {
        setError('Estufa não encontrada no banco de dados');
        setLoading(false);
        return;
      }

      // Processa dados com valores padrão para evitar undefined
      const processedData = {
        ...firebaseData,
        atuadores: {
          ...defaultAtuadores,
          ...firebaseData.atuadores,
          leds: {
            ...defaultAtuadores.leds,
            ...(firebaseData.atuadores?.leds || {})
          }
        }
      };
      
      setData(processedData);
      setLoading(false);
      setError(null);
    }, err => {
      console.error('EstadoEstufa: Erro no Firebase:', err);
      setError('Erro ao carregar dados da estufa');
      setLoading(false);
    });

    // Cleanup da subscription
    return () => {
      console.log('EstadoEstufa: Parando monitoramento');
      unsubscribe();
    };
  }, [estufaId]);

  /**
   * Determina estado e cor do climatizador
   * Baseado na combinação dos relés 1 e 2
   */
  const climatizador = useMemo(() => {
    if (!data?.atuadores) return { label: '--', color: '#ccc' };

    const { rele1, rele2 } = data.atuadores;
    const rele1State = Boolean(rele1);
    const rele2State = Boolean(rele2);
    
    console.log('EstadoEstufa: Climatizador - rele1:', rele1State, 'rele2:', rele2State);
    
    // Lógica de estados do climatizador
    if (!rele1State)                       return { label: 'OFF',        color: '#d3d3d3' };
    if (rele2State && rele1State)          return { label: 'Aquecendo',  color: '#FFA500' };
    /* rele2=false, rele1=true */          return { label: 'Resfriando', color: '#B2F0F4' };
  }, [data]);

  /**
   * Determina estado do umidificador
   * Suporta ambas as chaves (umidificador e rele3)
   */
  const umidificador = useMemo(() => {
    if (!data?.atuadores) return { label: '--', color: '#ccc' };
    
    const umidificadorState = data.atuadores.umidificador ?? data.atuadores.rele3;
    const state = Boolean(umidificadorState);
    
    console.log('EstadoEstufa: Umidificador - estado:', state);
    
    return state
      ? { label: 'ON',  color: '#00FF00' }
      : { label: 'OFF', color: '#d3d3d3' };
  }, [data]);

  /**
   * Determina estado dos LEDs com consumo
   */
  const leds = useMemo(() => {
    if (!data?.atuadores?.leds) return { label: '--', color: '#ccc' };
    
    const { ligado, watts } = data.atuadores.leds;
    const ligadoState = Boolean(ligado);
    
    console.log('EstadoEstufa: LEDs - ligado:', ligadoState, 'watts:', watts);
    
    return ligadoState
      ? { label: `${watts ?? 0} W`, color: '#E0B0FF' }
      : { label: 'OFF',            color: '#d3d3d3' };
  }, [data]);

  /**
   * Determina estado do exaustor
   */
  const exaustor = useMemo(() => {
    if (!data?.atuadores) return { label: '--', color: '#ccc' };
    
    const exaustorState = Boolean(data.atuadores.rele4);
    console.log('EstadoEstufa: Exaustor - estado:', exaustorState);
    
    return exaustorState
      ? { label: 'ON',  color: '#00CED1' }
      : { label: 'OFF', color: '#FF0000' };
  }, [data]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Estado da estufa</Text>
      </View>

      {/* Conteúdo principal */}
      <LinearGradient colors={['#fda4af', '#f0abfc']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          {/* Indicador de carregamento */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Carregando dados da estufa...</Text>
            </View>
          )}

          {/* Mensagem de erro */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.errorButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.errorButtonText}>Voltar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Conteúdo principal quando dados carregados */}
          {!loading && !error && data && (
            <>
              {/* Climatizador */}
              <Item label="Climatizador" status={climatizador} />

              {/* Umidificador */}
              <Item label="Umidificador" status={umidificador} />

              {/* LEDs */}
              <Item label="Leds" status={leds} />

              {/* Exaustor */}
              <Item label="Exaustor" status={exaustor} />

              {/* Botão Configurar */}
              <TouchableOpacity
                style={styles.configButton}
                onPress={() => navigation.navigate('ConfigScreen', { estufaId })}
              >
                <Text style={styles.configButtonText}>CONFIGURAR</Text>
              </TouchableOpacity>

              {/* Abas de navegação */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => navigation.navigate('Monitoramento', { estufaId })}
                >
                  <Text style={styles.tabText}>Monitoramento</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                  <Text style={styles.tabText}>Estado da estufa</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/**
 * Componente de item de status reutilizável
 * Exibe label e status com cor correspondente
 */
function Item({ label, status }: { label: string; status: { label: string; color: string } }) {
  return (
    <View style={styles.itemContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.statusBox, { backgroundColor: status.color }]}>
        <Text style={styles.statusText}>{status.label}</Text>
      </View>
    </View>
  );
}