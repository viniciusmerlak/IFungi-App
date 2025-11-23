/**
 * Monitoramento.tsx - O DASHBOARD COM GRÁFICOS E DADOS
 * 
 * O QUE FAZ:
 * Esta é a tela PRINCIPAL do app. Ela mostra:
 * - 📊 Gráficos em tempo real de temperatura, umidade, etc.
 * - 📡 Status se a estufa está ONLINE ou OFFLINE  
 * - 💧 Nível da água no reservatório
 * - 🌡️ Valores atuais de todos os sensores
 * - ⏰ Histórico das últimas horas/dias
 *
 * COMO FUNCIONA:
 * 1. Mostra um gráfico grande de UMA métrica por vez (temperatura, umidade, etc.)
 * 2. Você pode trocar a métrica tocando nos botões acima do gráfico
 * 3. Tem um sistema de "batimento cardíaco" que verifica a cada 5 segundos se a estufa responde
 * 4. Se não responder por 25 segundos, mostra OFFLINE em vermelho
 *
 * PARÂMETROS QUE RECEBE:
 * @param estufaId: string - OBRIGATÓRIO. Exemplo: "IFUNGI-001"
 *   Sem esse parâmetro, a tela não sabe qual estufa monitorar
 *
 * ESTADOS INTERNOS:
 * @state estufaId: string | null - Guarda qual estufa estamos monitorando
 * @state estufaData: EstufaData | null - Dados atuais dos sensores
 * @state historico: HistoricoItem[] - Dados passados para o gráfico
 * @state selectedMetric: MetricOption - Qual métrica mostrar no gráfico
 * @state isOnline: boolean - TRUE se estufa está respondendo, FALSE se offline
 *
 * MÉTRICAS DISPONÍVEIS NO GRÁFICO:
 * - Temperatura: mostra em °C (ex: 23.5°C)
 * - Umidade: mostra em % (ex: 85%)  
 * - Luminosidade: mostra em LUX (ex: 500 LUX)
 * - CO₂: mostra em PPM (ex: 400 PPM)
 * - CO: mostra em PPM (ex: 50 PPM)
 *
 * SISTEMA DE HEARTBEAT (batimento cardíaco):
 * - A cada 5 segundos verifica: "estufa, você está aí?"
 * - Se não responder em 25 segundos → OFFLINE (vermelho)
 * - Nos primeiros 10 segundos não marca como offline (tempo de tolerância)
 *
 * EXEMPLO DE USO:
 * ```tsx
 * // Na navegação:
 * navigation.navigate('Monitoramento', { estufaId: 'IFUNGI-001' })
 *
 * // No gráfico aparecerá algo como:
 * Temperatura: 23.5°C
 * [ gráfico mostrando variação de 22°C a 25°C nas últimas horas ]
 * ```
 */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect, RouteProp } from "@react-navigation/native";
import { getDatabase, ref, onValue, query, orderByKey, limitToLast } from "firebase/database";
import { initializeApp } from "firebase/app";
import { LinearGradient } from "expo-linear-gradient";
import { FIREBASE_CONFIG } from '../../services/FirebaseConfig';
import { LineChart } from 'react-native-chart-kit';
import styles from '../../styles/monitoramento/style';
import { format, parseISO, differenceInHours, differenceInDays } from 'date-fns';
import { AuthService } from '../../services/AuthService';
import { RootStackParamList } from '../../types/navigation';

// Inicialização do Firebase e configurações de tela
const app = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(app);
const screenWidth = Dimensions.get('window').width;

/**
 * Interface para dados dos sensores em tempo real
 */
type SensorData = {
  temperatura: number;
  umidade: number;
  luminosidade: number;
  co2: number;
  co: number;
  tvocs?: number;
  agua?: number;
};

/**
 * Interface completa dos dados da estufa
 */
type EstufaData = {
  sensores: SensorData;
  niveis: {
    agua: boolean;
  };
  lastUpdate: number;
  status: {
    online: boolean;
    ip: string;
    lastHeartbeat: number;
  };
};

/**
 * Item do histórico para gráficos temporais
 */
type HistoricoItem = {
  co: number;
  co2: number;
  dataHora: string;
  luminosidade: number;
  temperatura: number;
  timestamp: string;
  tvocs: number;
  umidade: number;
};

/**
 * Configuração de métrica para seleção no gráfico
 */
type MetricOption = {
  key: keyof SensorData;
  label: string;
  unit: string;
  format: (value: number) => string;
  color: string;
};

// Constantes para monitoramento de conectividade
const HEARTBEAT_TIMEOUT = 25000; // 25 segundos para considerar offline
const CHECK_INTERVAL = 5000; // Verifica status a cada 5 segundos
const INITIAL_GRACE_PERIOD = 10000; // 10 segundos de tolerância inicial

type MonitoramentoRouteProp = RouteProp<RootStackParamList, 'Monitoramento'>;

/**
 * Tela Principal de Monitoramento
 * Exibe dados em tempo real, gráficos históricos e status da estufa
 */
export default function TelaMonitoramento() {
  // Hooks de navegação e rota
  const route = useRoute<MonitoramentoRouteProp>();
  const navigation = useNavigation<any>();
  
  // Estados principais
  const [estufaId, setEstufaId] = useState<string | null>(null);
  const [estufaData, setEstufaData] = useState<EstufaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  
  // Referências para controle de estado persistente
  const lastHeartbeatRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef<boolean>(true);

  /**
   * Configurações das métricas disponíveis para monitoramento
   */
  const metricOptions: MetricOption[] = [
    {
      key: 'temperatura',
      label: 'Temperatura',
      unit: '°C',
      format: (value) => `${value?.toFixed(1) ?? '--'}°C`,
      color: '#FF6B6B'
    },
    {
      key: 'umidade',
      label: 'Umidade',
      unit: '%',
      format: (value) => `${value?.toFixed(0) ?? '--'}%`,
      color: '#4ECDC4'
    },
    {
      key: 'luminosidade',
      label: 'Luminosidade',
      unit: 'LUX',
      format: (value) => `${value?.toFixed(0) ?? '--'} LUX`,
      color: '#FFD166'
    },
    {
      key: 'co2',
      label: 'CO2',
      unit: 'PPM',
      format: (value) => `${value?.toFixed(0) ?? '--'} PPM`,
      color: '#06D6A0'
    },
    {
      key: 'co',
      label: 'CO',
      unit: 'PPM',
      format: (value) => `${value?.toFixed(0) ?? '--'} PPM`,
      color: '#118AB2'
    }
  ];

  // Estado para métrica selecionada no gráfico
  const [selectedMetric, setSelectedMetric] = useState<MetricOption>(metricOptions[0]);

  /**
   * Verifica o status de conectividade baseado no último heartbeat
   * Utiliza sistema de grace period para evitar flickering inicial
   */
  const checkHeartbeatStatus = () => {
    const currentTime = Date.now();
    const timeSinceLastHeartbeat = currentTime - lastHeartbeatRef.current;
    
    // Grace period: mantém online durante os primeiros segundos
    if (initialLoadRef.current && timeSinceLastHeartbeat < INITIAL_GRACE_PERIOD) {
      console.log(`Heartbeat: Grace period ativo (${timeSinceLastHeartbeat}ms)`);
      setIsOnline(true);
      return;
    }
    
    // Finaliza grace period após tempo configurado
    if (initialLoadRef.current && timeSinceLastHeartbeat >= INITIAL_GRACE_PERIOD) {
      initialLoadRef.current = false;
      console.log('Heartbeat: Grace period finalizado - verificações normais iniciadas');
    }
    
    // Determina status baseado no timeout
    const shouldBeOnline = timeSinceLastHeartbeat < HEARTBEAT_TIMEOUT;
    
    console.log(`Heartbeat: ${timeSinceLastHeartbeat}ms desde último, Online: ${shouldBeOnline}`);
    
    // Atualiza estado apenas se houver mudança
    if (isOnline !== shouldBeOnline) {
      setIsOnline(shouldBeOnline);
      console.log(`Heartbeat: Status alterado para ${shouldBeOnline ? 'ONLINE' : 'OFFLINE'}`);
    }
  };

  /**
   * Inicia o monitoramento periódico do heartbeat
   * Configura interval para verificações regulares
   */
  const startHeartbeatMonitoring = () => {
    // Limpa intervalo anterior se existir
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    // Reinicia grace period para nova conexão
    initialLoadRef.current = true;
    
    // Configura verificação periódica
    heartbeatIntervalRef.current = setInterval(checkHeartbeatStatus, CHECK_INTERVAL);
    console.log(`Heartbeat: Monitoramento iniciado (check: ${CHECK_INTERVAL}ms, timeout: ${HEARTBEAT_TIMEOUT}ms)`);
  };

  /**
   * Para o monitoramento do heartbeat
   * Cleanup para evitar memory leaks
   */
  const stopHeartbeatMonitoring = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
      console.log('Heartbeat: Monitoramento parado');
    }
  };

  /**
   * Atualiza o timestamp do último heartbeat recebido
   * @param lastHeartbeat - Timestamp do último heartbeat
   */
  const updateHeartbeat = (lastHeartbeat: number) => {
    if (lastHeartbeat && lastHeartbeat > lastHeartbeatRef.current) {
      const oldTime = lastHeartbeatRef.current;
      lastHeartbeatRef.current = lastHeartbeat;
      
      const timeDiff = lastHeartbeat - oldTime;
      console.log(`Heartbeat: Atualizado para ${new Date(lastHeartbeat).toLocaleTimeString()} (diff: ${timeDiff}ms)`);
      
      // Verificação imediata após atualização
      checkHeartbeatStatus();
    }
  };

  /**
   * Força verificação manual do status
   * Útil para testes e debug
   */
  const forceStatusCheck = () => {
    console.log('Heartbeat: Verificação manual solicitada');
    checkHeartbeatStatus();
  };

  /**
   * Carrega histórico de dados do Firebase
   * @param estufaId - ID da estufa para carregar histórico
   */
  const loadHistoricoFromFirebase = (estufaId: string) => {
    const historicoRef = ref(database, `historico/${estufaId}`);
    const historicoQuery = query(historicoRef, orderByKey(), limitToLast(50));

    const unsubscribe = onValue(historicoQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Converte objeto Firebase em array
        const historicoArray: HistoricoItem[] = Object.keys(data).map(key => {
          return {
            ...data[key],
            timestamp: key // Mantém timestamp como identificador
          };
        });
        
        // Ordena por data (mais antigo primeiro para gráfico)
        historicoArray.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
        
        setHistorico(historicoArray);
        console.log(`Histórico: ${historicoArray.length} registros carregados`);
      } else {
        setHistorico([]);
        console.log('Histórico: Nenhum dado encontrado');
      }
    }, (error) => {
      console.error('Histórico: Erro ao carregar:', error);
    });

    return unsubscribe;
  };

  /**
   * Efeito para carregar estufa quando a tela ganha foco
   * Prioriza parâmetros da rota, fallback para sessão
   */
  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.estufaId) {
        setEstufaId(route.params.estufaId);
        setError(null);
        console.log(`Monitoramento: Estufa from route: ${route.params.estufaId}`);
      } else {
        AuthService.checkActiveSession().then(session => {
          if (session?.userEstufa) {
            setEstufaId(session.userEstufa);
            setError(null);
            console.log(`Monitoramento: Estufa from session: ${session.userEstufa}`);
          } else {
            setError("Nenhuma estufa conectada. Por favor, conecte-se a uma estufa.");
            setLoading(false);
            console.log('Monitoramento: Nenhuma estufa encontrada na sessão');
          }
        }).catch(error => {
          console.error('Monitoramento: Erro ao buscar sessão:', error);
          setError("Erro ao carregar sessão.");
          setLoading(false);
        });
      }
    }, [route.params])
  );

  /**
   * Monitora dados em tempo real da estufa no Firebase
   * Atualiza estado e heartbeat quando dados mudam
   */
  useEffect(() => {
    if (!estufaId) return;

    setLoading(true);
    const estufaRef = ref(database, `greenhouses/${estufaId}`);

    const unsubscribeEstufa = onValue(estufaRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        setError("Estufa não encontrada no banco de dados");
        setLoading(false);
        setIsOnline(false);
        return;
      }

      // Processa dados com valores padrão
      const processedData: EstufaData = {
        ...data,
        niveis: {
          agua: data.niveis?.agua > 20 // Converte para booleano
        }
      };

      setEstufaData(processedData);
      
      // Atualiza heartbeat dos dados recebidos
      if (data.status?.lastHeartbeat) {
        updateHeartbeat(data.status.lastHeartbeat);
      } else {
        // Fallback para timestamp de atualização
        const updateTime = data.lastUpdate || Date.now();
        console.log('Heartbeat: Usando lastUpdate como fallback');
        updateHeartbeat(updateTime);
      }

      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('Monitoramento: Erro ao ler dados da estufa:', error);
      setError("Erro ao carregar dados da estufa");
      setLoading(false);
      setIsOnline(false);
    });

    return () => unsubscribeEstufa();
  }, [estufaId]);

  /**
   * Carrega histórico quando estufa é alterada
   */
  useEffect(() => {
    if (!estufaId) return;

    const unsubscribeHistorico = loadHistoricoFromFirebase(estufaId);
    
    return () => {
      if (unsubscribeHistorico) {
        unsubscribeHistorico();
      }
    };
  }, [estufaId]);

  /**
   * Gerencia ciclo de vida do monitoramento de heartbeat
   * Inicia/para baseado na estufa atual
   */
  useEffect(() => {
    if (estufaId) {
      // Inicializa com timestamp atual
      lastHeartbeatRef.current = Date.now();
      setIsOnline(true);
      startHeartbeatMonitoring();
      
      console.log(`Monitoramento: Iniciado para estufa ${estufaId}`);
    } else {
      stopHeartbeatMonitoring();
      setIsOnline(false);
    }

    return () => {
      stopHeartbeatMonitoring();
    };
  }, [estufaId]);

  /**
   * Cleanup global ao desmontar componente
   */
  useEffect(() => {
    return () => {
      stopHeartbeatMonitoring();
    };
  }, []);

  /**
   * Formata horários de forma inteligente baseado no período
   * @param timestamps - Array de timestamps para formatar
   * @returns Array de labels formatados
   */
  const formatSmartTime = (timestamps: string[]) => {
    if (timestamps.length < 2) return timestamps.map(t => format(parseISO(t), 'HH:mm'));
    
    const first = parseISO(timestamps[0]);
    const last = parseISO(timestamps[timestamps.length - 1]);
    
    const hoursDiff = differenceInHours(last, first);
    const daysDiff = differenceInDays(last, first);
    
    // Escolhe formato baseado no período abrangido
    if (daysDiff > 7) {
      return timestamps.map(t => format(parseISO(t), 'dd/MM'));
    } else if (daysDiff > 1) {
      return timestamps.map(t => format(parseISO(t), 'EEE HH:mm'));
    } else if (hoursDiff > 12) {
      return timestamps.map(t => format(parseISO(t), 'HH:mm'));
    } else {
      return timestamps.map(t => format(parseISO(t), 'HH:mm:ss'));
    }
  };

  /**
   * Filtra histórico para a métrica selecionada
   * Remove entradas com valores inválidos
   */
  const filteredHistorico = useMemo(() => {
    if (historico.length === 0) return [];

    const filtered = historico.filter(item => {
      const value = item[selectedMetric.key as keyof HistoricoItem];
      return value != null && !isNaN(Number(value));
    });

    console.log(`Gráfico: ${filtered.length} registros filtrados para ${selectedMetric.label}`);
    return filtered;
  }, [historico, selectedMetric.key]);

  /**
   * Calcula range de valores para o eixo Y do gráfico
   * Inclui valores mínimo, máximo e atual
   */
  const chartRange = useMemo(() => {
    if (filteredHistorico.length === 0) {
      return { min: 0, max: 0, current: 0, actualMin: 0, actualMax: 0 };
    }

    const values = filteredHistorico.map(item => {
      const value = item[selectedMetric.key as keyof HistoricoItem];
      return Number(value) || 0;
    }).filter(v => !isNaN(v));

    if (values.length === 0) {
      return { min: 0, max: 0, current: 0, actualMin: 0, actualMax: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const current = values[values.length - 1];

    // Adiciona margem de 10% para melhor visualização
    const range = max - min;
    const margin = range * 0.1;

    return {
      min: min - margin,
      max: max + margin,
      current: current,
      actualMin: min,
      actualMax: max
    };
  }, [filteredHistorico, selectedMetric.key]);

  /**
   * Gera labels para o eixo Y do gráfico
   * @returns Array de labels formatados
   */
  const generateYAxisLabels = () => {
    if (filteredHistorico.length === 0) {
      return ['', '', '', '', ''];
    }

    const { min, max } = chartRange;
    const range = max - min;
    const steps = 4; // 5 pontos incluindo topo e base
    
    const labels = [];
    for (let i = steps; i >= 0; i--) {
      const value = min + (range * i) / steps;
      
      // Formata baseado no tipo de métrica
      let formattedValue;
      if (selectedMetric.key === 'temperatura') {
        formattedValue = `${value.toFixed(1)}°C`;
      } else if (selectedMetric.key === 'umidade') {
        formattedValue = `${Math.round(value)}%`;
      } else if (selectedMetric.key === 'luminosidade') {
        formattedValue = `${Math.round(value)}LUX`;
      } else {
        formattedValue = `${Math.round(value)}PPM`;
      }
      
      labels.push(formattedValue);
    }
    
    return labels;
  };

  /**
   * Prepara dados para o componente LineChart
   * Inclui labels, datasets e configuração de largura
   */
  const chartData = useMemo(() => {
    if (filteredHistorico.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }],
        totalWidth: screenWidth
      };
    }

    const pointWidth = 60; 
    const totalWidth = Math.max(screenWidth, filteredHistorico.length * pointWidth);

    const labels = formatSmartTime(filteredHistorico.map(item => item.dataHora));
    const data = filteredHistorico.map(item => {
      const value = item[selectedMetric.key as keyof HistoricoItem];
      return Number(value);
    });

    console.log(`Gráfico: ${data.length} pontos para ${selectedMetric.label}`);

    return {
      labels: labels,
      datasets: [
        {
          data: data,
          color: () => selectedMetric.color,
          strokeWidth: 2,
        }
      ],
      totalWidth: totalWidth
    };
  }, [filteredHistorico, selectedMetric.color]);

  /**
   * Configuração de estilo para o LineChart
   */
  const chartConfig = {
    backgroundGradientFrom: 'rgba(253, 164, 223, 0.95)',
    backgroundGradientTo: 'rgba(252, 109, 109, 0.8)',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: '#fff'
    },
    propsForLabels: {
      fontSize: 8
    }
  };

  /**
   * Obtém valor do sensor com fallback para zero
   * @param key - Chave do sensor
   * @returns Valor numérico do sensor
   */
  const getSensorValue = (key: keyof SensorData): number => {
    const value = estufaData?.sensores?.[key];
    return value !== undefined && value !== null ? value : 0;
  };

  /**
   * Formata valor do sensor conforme configuração da métrica
   * @param key - Chave do sensor
   * @param value - Valor a ser formatado
   * @returns String formatada
   */
  const formatValue = (key: keyof SensorData, value: number) => {
    const metric = metricOptions.find(opt => opt.key === key);
    return metric ? metric.format(value) : '--';
  };

  /**
   * Status do reservatório de água
   */
  const reservatorioStatus = useMemo(() => {
    if (!estufaData) return 'Carregando...';
    return estufaData.niveis?.agua ? 'Com água' : 'Sem água';
  }, [estufaData]);

  /**
   * Navega para tela de configurações
   */
  const handleNavigateToConfig = () => {
    if (estufaId) {
      navigation.navigate('ConfigScreen', { estufaId });
    } else {
      Alert.alert('Erro', 'ID da estufa não disponível');
    }
  };

  /**
   * Navega para tela de estado da estufa
   */
  const handleNavigateToEstadoEstufa = () => {
    if (estufaId) {
      navigation.navigate('EstadoEstufa', { estufaId });
    } else {
      Alert.alert('Erro', 'ID da estufa não disponível');
    }
  };

  /**
   * Volta para tela de conexão (fallback para erro)
   */
  const handleVoltarParaConectar = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'ConectarDispositivo' }],
    });
  };

  /**
   * Renderização de estado de erro
   */
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Monitoramento</Text>
        </View>
        <LinearGradient colors={['#fda4af', '#f0abfc']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={handleVoltarParaConectar}
            >
              <Text style={styles.errorButtonText}>Conectar Estufa</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  /**
   * Renderização principal da tela
   */
  return (
    <SafeAreaView style={styles.container}>
      {/* Header com status de conectividade */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Monitoramento</Text>
        <View style={styles.statusContainer}>
          <View>
            <Text style={styles.heartbeatText}>
              Estado da estufa
            </Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.statusText}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
          <TouchableOpacity onPress={forceStatusCheck} style={styles.heartbeatContainer}>
            {/* Ícone de atualização pode ser adicionado aqui */}
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Conteúdo principal com gradiente */}
      <LinearGradient colors={['#fda4af', '#f0abfc']} style={styles.gradient}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Carregando dados da estufa...</Text>
              {estufaId && (
                <Text style={styles.loadingSubText}>Estufa: {estufaId}</Text>
              )}
            </View>
          ) : estufaData ? (
            <>
              {/* Seletor de Métricas */}
              <View style={styles.metricSelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  {metricOptions.map(option => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.metricOption,
                        selectedMetric.key === option.key && styles.metricOptionSelected,
                        { borderColor: option.color }
                      ]}
                      onPress={() => setSelectedMetric(option)}
                    >
                      <Text style={[
                        styles.metricOptionText,
                        selectedMetric.key === option.key && styles.metricOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Container do Gráfico */}
              <View style={styles.chartContainer}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>
                    {selectedMetric.label} ({selectedMetric.unit})
                  </Text>
                  <Text style={styles.currentValue}>
                    Atual: {formatValue(selectedMetric.key, getSensorValue(selectedMetric.key))}
                  </Text>
                </View>
                
                {filteredHistorico.length > 0 ? (
                  <View style={styles.chartWrapper}>
                    <View style={styles.chartWithYAxis}>
                      {/* Eixo Y com valores */}
                      <View style={styles.yAxisContainer}>
                        {generateYAxisLabels().map((label, index) => (
                          <Text key={index} style={styles.yAxisLabel}>
                            {label}
                          </Text>
                        ))}
                      </View>

                      {/* Gráfico com scroll horizontal */}
                      <View style={styles.chartScrollContainer}>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={true}
                          contentContainerStyle={{
                            width: chartData.totalWidth,
                            paddingRight: 20
                          }}
                        >
                          <LineChart
                            data={chartData}
                            width={chartData.totalWidth}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                            fromZero={selectedMetric.key === 'umidade'}
                            withVerticalLines={filteredHistorico.length <= 20}
                            withHorizontalLines={true}
                            withVerticalLabels={true}
                            withHorizontalLabels={false}
                            segments={4}
                            getDotColor={() => '#ffffff'}
                          />
                        </ScrollView>
                      </View>
                    </View>

                    {/* Informações do range */}
                    <View style={styles.rangeInfoContainer}>
                      <View style={styles.rangeItem}>
                        <Text style={styles.rangeLabel}>Mín:</Text>
                        <Text style={styles.rangeValue}>
                          {selectedMetric.format(chartRange.actualMin)}
                        </Text>
                      </View>
                      <View style={styles.rangeItem}>
                        <Text style={styles.rangeLabel}>Máx:</Text>
                        <Text style={styles.rangeValue}>
                          {selectedMetric.format(chartRange.actualMax)}
                        </Text>
                      </View>
                      <View style={styles.rangeItem}>
                        <Text style={styles.rangeLabel}>Atual:</Text>
                        <Text style={[styles.rangeValue, { color: selectedMetric.color }]}>
                          {selectedMetric.format(chartRange.current)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.chartHint}>
                      ← Arraste para ver histórico completo → ({filteredHistorico.length} pontos)
                    </Text>
                  </View>
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>Aguardando dados de {selectedMetric.label.toLowerCase()}...</Text>
                    <Text style={styles.noDataSubText}>Carregando histórico do Firebase</Text>
                  </View>
                )}
              </View>

              {/* Cards de Informações dos Sensores */}
              <View style={styles.doubleSection}>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>Reservatório</Text>
                  <Text style={[
                    styles.valueText,
                    { color: estufaData.niveis?.agua ? '#4CAF50' : '#F44336' }
                  ]}>
                    {reservatorioStatus}
                  </Text>
                </View>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>Luminosidade</Text>
                  <Text style={styles.valueText}>
                    {formatValue('luminosidade', getSensorValue('luminosidade'))}
                  </Text>
                </View>
              </View>

              <View style={styles.doubleSection}>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>CO2</Text>
                  <Text style={styles.valueText}>
                    {formatValue('co2', getSensorValue('co2'))}
                  </Text>
                </View>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>Umidade</Text>
                  <Text style={styles.valueText}>
                    {formatValue('umidade', getSensorValue('umidade'))}
                  </Text>
                </View>
              </View>

              <View style={styles.doubleSection}>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>CO</Text>
                  <Text style={styles.valueText}>
                    {formatValue('co', getSensorValue('co'))}
                  </Text>
                </View>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>Temperatura</Text>
                  <Text style={styles.valueText}>
                    {formatValue('temperatura', getSensorValue('temperatura'))}
                  </Text>
                </View>
              </View>

              {/* Botão de Configuração */}
              <TouchableOpacity 
                style={styles.configButton}
                onPress={handleNavigateToConfig}
              >
                <Text style={styles.configButtonText}>CONFIGURAR</Text>
              </TouchableOpacity>

              {/* Abas de Navegação Inferior */}
              <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                  <Text style={styles.tabText}>Monitoramento</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tab}
                  onPress={handleNavigateToEstadoEstufa}
                >
                  <Text style={styles.tabText}>Estado da estufa</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Estufa não encontrada</Text>
              {estufaId && (
                <Text style={styles.loadingSubText}>ID: {estufaId}</Text>
              )}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}