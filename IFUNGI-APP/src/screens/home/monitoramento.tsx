import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getDatabase, ref, onValue, query, orderByKey, limitToLast } from "firebase/database";
import { initializeApp } from "firebase/app";
import { LinearGradient } from "expo-linear-gradient";
import { FIREBASE_CONFIG } from '../../services/FirebaseConfig';
import { LineChart } from 'react-native-chart-kit';
import styles from '../../styles/monitoramento/style';
import { format, parseISO } from 'date-fns';

// Inicialização do Firebase
const app = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(app);
const screenWidth = Dimensions.get('window').width;

type SensorData = {
  temperatura: number;
  umidade: number;
  luminosidade: number;
  co2: number;
  co: number;
  tvocs?: number;
};

type EstufaData = {
  sensores: SensorData;
  niveis: {
    agua: boolean;
  };
  lastUpdate: number;
  status: {
    online: boolean;
    ip: string;
    lastHeartbeat: number; // Adicionado para verificar o heartbeat
  };
};

type HistoricoData = {
  [timestamp: string]: {
    temperatura: number;
    umidade: number;
    luminosidade: number;
    co2: number;
    co: number;
    tvocs?: number;
    dataHora: string;
    timestamp: string;
  };
};

type MetricOption = {
  key: keyof SensorData | 'agua';
  label: string;
  unit: string;
  format: (value: number) => string;
};

export default function TelaMonitoramento() {
  const route = useRoute();
  const navigation = useNavigation();
  const estufaId = route.params?.estufaId || 'IFUNGI-001';

  const [estufaData, setEstufaData] = useState<EstufaData | null>(null);
  const [historicoData, setHistoricoData] = useState<HistoricoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const [selectedMetric, setSelectedMetric] = useState<MetricOption>({
    key: 'temperatura',
    label: 'Temperatura',
    unit: '°C',
    format: (value) => `${value?.toFixed(1) ?? '--'}°C`
  });

  // Opções de métricas para o gráfico
  const metricOptions: MetricOption[] = [
    {
      key: 'temperatura',
      label: 'Temperatura',
      unit: '°C',
      format: (value) => `${value?.toFixed(1) ?? '--'}°C`
    },
    {
      key: 'umidade',
      label: 'Umidade',
      unit: '%',
      format: (value) => `${value?.toFixed(0) ?? '--'}%`
    },
    {
      key: 'luminosidade',
      label: 'Luminosidade',
      unit: 'LUX',
      format: (value) => `${value?.toFixed(0) ?? '--'} LUX`
    },
    {
      key: 'co2',
      label: 'CO2',
      unit: 'PPM',
      format: (value) => `${value?.toFixed(0) ?? '--'} PPM`
    },
    {
      key: 'co',
      label: 'CO',
      unit: 'PPM',
      format: (value) => `${value?.toFixed(0) ?? '--'} PPM`
    }
  ];

  // Verifica se o ESP32 está online baseado no último heartbeat
  const checkOnlineStatus = (lastHeartbeat: number) => {
    if (!lastHeartbeat) return false;
    
    // Considera online se o último heartbeat foi há menos de 45 segundos
    // (dando uma margem de 15 segundos além dos 30 segundos máximos do ESP32)
    const currentTime = Date.now();
    const timeDiff = currentTime - lastHeartbeat;
    
    return timeDiff < 45000; // 45 segundos
  };

  // Atualiza dados da estufa em tempo real
  useEffect(() => {
    if (!estufaId) return;

    setLoading(true);
    const estufaRef = ref(database, `estufas/${estufaId}`);

    const unsubscribe = onValue(estufaRef, (snapshot) => {
      const data = snapshot.val();
      
      if (!data) {
        setLoading(false);
        setIsOnline(false);
        return;
      }

      const processedData = {
        ...data,
        niveis: {
          agua: data.niveis?.agua > 20
        }
      };

      setEstufaData(processedData);
      
      // Verifica o status online baseado no último heartbeat
      if (data.status?.lastHeartbeat) {
        const online = checkOnlineStatus(data.status.lastHeartbeat);
        setIsOnline(online);
      } else {
        setIsOnline(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [estufaId]);

  // Verifica periodicamente o status online (a cada 10 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (estufaData?.status?.lastHeartbeat) {
        const online = checkOnlineStatus(estufaData.status.lastHeartbeat);
        setIsOnline(online);
      }
    }, 10000); // Verifica a cada 10 segundos

    return () => clearInterval(interval);
  }, [estufaData]);

  // Busca dados históricos
  useEffect(() => {
    if (!estufaId) return;

    const historicoRef = query(
      ref(database, `historico/${estufaId}`),
      orderByKey(),
      limitToLast(50)
    );

    const unsubscribe = onValue(historicoRef, (snapshot) => {
      const data = snapshot.val();
      setHistoricoData(data);
    }, (error) => {
      console.error('Erro ao ler histórico do Firebase:', error);
    });

    return () => unsubscribe();
  }, [estufaId]);

  // Formata o status do reservatório (booleano)
  const reservatorioStatus = useMemo(() => {
    if (!estufaData) return 'Carregando...';
    return estufaData.niveis?.agua ? 'Com água' : 'Sem água';
  }, [estufaData]);

  // Prepara dados para o gráfico a partir do histórico
  const prepareChartData = useMemo(() => {
    if (!historicoData) return { labels: [], datasets: [{ data: [] }] };

    const historicoArray = Object.values(historicoData);
    
    // Filtra e ordena por timestamp
    const filteredData = historicoArray
      .filter(item => item[selectedMetric.key] !== undefined)
      .sort((a, b) => parseInt(a.timestamp) - parseInt(b.timestamp));
    
    // Limita a 15 pontos para não sobrecarregar o gráfico
    const limitedData = filteredData.slice(-15);
    
    // Prepara labels (horários)
    const labels = limitedData.map(item => {
      try {
        // Tenta usar dataHora se disponível, senão usa timestamp
        const date = item.dataHora 
          ? parseISO(item.dataHora) 
          : new Date(parseInt(item.timestamp));
        return format(date, 'HH:mm');
      } catch (error) {
        return '--:--';
      }
    });
    
    // Prepara dados
    const data = limitedData.map(item => item[selectedMetric.key]);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          strokeWidth: 2
        }
      ],
    };
  }, [historicoData, selectedMetric.key]);

  // Configurações do gráfico
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
      r: '4',
      strokeWidth: '2',
      stroke: '#fff'
    },
    propsForLabels: {
      fontSize: 10
    }
  };

  // Formata o valor de acordo com a métrica selecionada
  const formatValue = (key: keyof SensorData | 'agua', value: number) => {
    const metric = metricOptions.find(opt => opt.key === key);
    return metric ? metric.format(value) : '--';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Monitoramento</Text>
        <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>
      <LinearGradient colors={['#fda4af', '#f0abfc']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Carregando dados da estufa...</Text>
            </View>
          ) : estufaData ? (
            <>
              {/* Seletor de Métrica */}
              <View style={styles.metricSelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {metricOptions.map(option => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.metricOption,
                        selectedMetric.key === option.key && styles.metricOptionSelected
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

              {/* Gráfico */}
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>
                  {selectedMetric.label} ({selectedMetric.unit})
                </Text>
                {prepareChartData.labels.length > 0 ? (
                  <LineChart
                    data={prepareChartData}
                    width={screenWidth - 70}
                    height={210}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>Nenhum dado histórico disponível</Text>
                  </View>
                )}
              </View>

              {/* Seção Reservatório e Luz */}
              <View style={styles.doubleSection}>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>Reservatório de água</Text>
                  <Text style={styles.valueText}>
                    {reservatorioStatus}
                  </Text>
                </View>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>Luminosidade</Text>
                  <Text style={styles.valueText}>
                    {formatValue('luminosidade', estufaData.sensores?.luminosidade)}
                  </Text>
                </View>
              </View>

              {/* Seção CO2 e Umidade */}
              <View style={styles.doubleSection}>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>CO2</Text>
                  <Text style={styles.valueText}>
                    {formatValue('co2', estufaData.sensores?.co2)}
                  </Text>
                </View>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>Umidade</Text>
                  <Text style={styles.valueText}>
                    {formatValue('umidade', estufaData.sensores?.umidade)}
                  </Text>
                </View>
              </View>

              {/* Seção CO e Temperatura */}
              <View style={styles.doubleSection}>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>CO</Text>
                  <Text style={styles.valueText}>
                    {formatValue('co', estufaData.sensores?.co)}
                  </Text>
                </View>
                <View style={styles.halfSection}>
                  <Text style={styles.sectionTitle}>Temperatura</Text>
                  <Text style={styles.valueText}>
                    {formatValue('temperatura', estufaData.sensores?.temperatura)}
                  </Text>
                </View>
              </View>

              {/* Botão Configurar */}
              <TouchableOpacity 
                style={styles.configButton}
                onPress={() => navigation.navigate('ConfigScreen', { estufaId })}
              >
                <Text style={styles.configButtonText}>CONFIGURAR</Text>
              </TouchableOpacity>

              {/* Abas inferiores */}
              <View style={styles.tabContainer}>
                <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                  <Text style={styles.tabText}>Monitoramento</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.tab}
                  onPress={() => navigation.navigate('EstadoEstufa', { estufaId })}
                >
                  <Text style={styles.tabText}>Estado da estufa</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Estufa não encontrada</Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}