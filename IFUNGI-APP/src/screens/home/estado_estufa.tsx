// src/screens/EstadoEstufa/index.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { FIREBASE_CONFIG } from '../../services/FirebaseConfig';
import styles from '../../styles/estado_estufa/style';

// ---------- Tipagens ----------
type Atuadores = {
  rele1: boolean; // PELTIER_POWER (alimentação) - INVERTIDO
  rele2: boolean; // PELTIER_TEMP  (inversão)   - INVERTIDO
  rele3: boolean; // Umidificador
  rele4: boolean; // Exaustor
  umidificador: boolean; // NOVO ATUADOR
  leds: {
    ligado: boolean;
    watts: number;
  };
};

type EstufaData = {
  atuadores: Atuadores;
  lastUpdate: number;
};

// ---------- Firebase ----------
const app = initializeApp(FIREBASE_CONFIG);
const db  = getDatabase(app);

export default function EstadoEstufa() {
  const navigation = useNavigation();
  const route      = useRoute();
  const estufaId   = route.params?.estufaId || 'IFUNGI-001';

  const [data, setData]       = useState<EstufaData | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------- Leitura em tempo real ----------
  useEffect(() => {
    const estufaRef = ref(db, `estufas/${estufaId}`);
    const unsubscribe = onValue(estufaRef, snap => {
      setData(snap.val());
      setLoading(false);
    }, err => {
      console.error('Firebase error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [estufaId]);

  // ---------- Deriva estados/cores ----------
  const climatizador = useMemo(() => {
    if (!data) return { label: '--', color: '#ccc' };

    const { rele1, rele2 } = data.atuadores;
    if (!rele1)                       return { label: 'OFF',        color: '#d3d3d3' };
    if (rele2 && rele1)               return { label: 'Aquecendo',  color: '#FFA500' };
    /* rele2=false, rele1=true */      return { label: 'Resfriando', color: '#B2F0F4' };
  }, [data]);

  const umidificador = useMemo(() => {
    if (!data) return { label: '--', color: '#ccc' };
    // Prioriza o novo atuador 'umidificador', se não existir usa o rele3 como fallback
    const umidificadorState = data.atuadores.umidificador ?? data.atuadores.rele3;
    return umidificadorState
      ? { label: 'ON',  color: '#00FF00' }
      : { label: 'OFF', color: '#d3d3d3' };
  }, [data]);

  const leds = useMemo(() => {
    if (!data) return { label: '--', color: '#ccc' };
    const { ligado, watts } = data.atuadores.leds;
    return ligado
      ? { label: `${watts ?? 0} W`, color: '#E0B0FF' }
      : { label: 'OFF',            color: '#d3d3d3' };
  }, [data]);

  const exaustor = useMemo(() => {
    if (!data) return { label: '--', color: '#ccc' };
    return data.atuadores.rele4
      ? { label: 'ON',  color: '#00CED1' }
      : { label: 'OFF', color: '#FF0000' };
  }, [data]);

  // ---------- Render ----------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Estado da estufa</Text>
      </View>

      <LinearGradient colors={['#fda4af', '#f0abfc']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          {loading && <ActivityIndicator size="large" color="#fff" />}

          {!loading && data && (
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

              {/* Abas */}
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

// ---------- Sub-componente ----------
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