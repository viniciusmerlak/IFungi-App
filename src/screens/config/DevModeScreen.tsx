/**
 * Tela de Modo Desenvolvedor
 * Permite simulação de valores de sensores para testes
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ref, update, getDatabase } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { FIREBASE_CONFIG } from '../../services/FirebaseConfig';
import styles from '../../styles/config/style';
import { RootStackParamList } from '../../types/navigation';
import { RouteProp } from '@react-navigation/native';

// Inicialização do Firebase
const app = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(app);

/**
 * Item de configuração do modo desenvolvedor
 */
type DevItem = {
  key: string;
  label: string;
  unit?: string;
  value: number;
  firebaseKey: string;
};

// Configurações iniciais de simulação
const initialDevConfig: DevItem[] = [
  { 
    key: 'tempSim', 
    label: 'Simular Temperatura', 
    unit: '°C', 
    value: 25, 
    firebaseKey: 'debug_mode/tempSim' 
  },
  { 
    key: 'humSim', 
    label: 'Simular Umidade', 
    unit: '%', 
    value: 80, 
    firebaseKey: 'debug_mode/humSim' 
  },
  { 
    key: 'luxSim', 
    label: 'Simular Luminosidade', 
    unit: 'LUX', 
    value: 500, 
    firebaseKey: 'debug_mode/luxSim' 
  },
  { 
    key: 'co2Sim', 
    label: 'Simular CO₂', 
    unit: 'PPM', 
    value: 400, 
    firebaseKey: 'debug_mode/co2Sim' 
  },
];

type DevModeRouteProp = RouteProp<RootStackParamList, 'DevModeScreen'>;

/**
 * Tela de Modo Desenvolvedor
 * Ativa modo de debug e permite simulação de sensores
 */
export default function DevModeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<DevModeRouteProp>();
  const estufaId = route.params?.estufaId || 'IFUNGI-001';

  // Estados da aplicação
  const [configs, setConfigs] = useState<DevItem[]>(initialDevConfig);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DevItem | null>(null);
  const [inputValue, setInputValue] = useState('');
  const modalScale = useRef(new Animated.Value(0)).current;

  /**
   * Desativa o modo debug no Firebase
   */
  const deactivateDebugMode = async () => {
    try {
      const updates: { [key: string]: boolean } = {};
      updates[`greenhouses/${estufaId}/debug_mode`] = false;
      await update(ref(database), updates);
      console.log('Debug mode desativado');
    } catch (error) {
      console.error('Erro ao desativar debug mode:', error);
    }
  };

  /**
   * Ativa modo debug no Firebase ao entrar na tela
   * Cleanup: desativa ao sair
   */
  useEffect(() => {
    const activateDebugMode = async () => {
      try {
        const updates: { [key: string]: boolean } = {};
        updates[`greenhouses/${estufaId}/debug_mode`] = true;
        await update(ref(database), updates);
        console.log('Debug mode ativado');
      } catch (error) {
        console.error('Erro ao ativar debug mode:', error);
      }
    };

    activateDebugMode();

    // Cleanup: desativar debug mode ao desmontar componente
    return () => {
      console.log('DevModeScreen: Desmontando componente, desativando debug mode');
      deactivateDebugMode();
    };
  }, [estufaId]);

  /**
   * Garante que debug_mode seja desativado ao sair da tela
   */
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Cleanup quando a tela perde o foco
        console.log('DevModeScreen: Saindo da tela, desativando debug mode');
        deactivateDebugMode();
      };
    }, [estufaId])
  );

  /**
   * Animação de abertura/fechamento do modal
   */
  const animateModal = (show: boolean) => {
    Animated.timing(modalScale, {
      toValue: show ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  };

  /**
   * Abre o modal de edição para um item
   */
  const openEditModal = (item: DevItem) => {
    setSelectedItem(item);
    setInputValue(item.value.toString());
    setModalVisible(true);
    animateModal(true);
  };

  /**
   * Fecha o modal de edição
   */
  const closeModal = () => {
    animateModal(false);
    setTimeout(() => setModalVisible(false), 250);
  };

  /**
   * Salva configuração no Firebase
   */
  const saveToFirebase = async (keyPath: string, value: number) => {
    try {
      const updates: { [key: string]: number } = {};
      updates[`greenhouses/${estufaId}/${keyPath}`] = value;
      await update(ref(database), updates);
      
      // Atualiza estado local
      const updated = configs.map((item) =>
        item.firebaseKey === keyPath ? { ...item, value: value } : item
      );
      setConfigs(updated);
      
    } catch (error) {
      console.error('Erro ao salvar no Firebase:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
    }
  };

  /**
   * Aplica edição do modal
   */
  const applyEdit = () => {
    if (!selectedItem) return;
    
    const parsed = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(parsed)) {
      Alert.alert('Erro', 'Por favor, digite um valor numérico válido');
      return;
    }

    saveToFirebase(selectedItem.firebaseKey, parsed);
    closeModal();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com botão voltar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Modo Dev</Text>
      </View>

      {/* Conteúdo principal com gradiente */}
      <LinearGradient colors={['#fda4af', '#f0abfc']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Lista de configurações de simulação */}
          {configs.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.card}
              onPress={() => openEditModal(item)}
            >
              <View style={styles.cardLabel}>
                <Text style={styles.cardLabelText}>{item.label}</Text>
              </View>
              <View style={styles.cardValueBox}>
                <Text style={styles.cardValueText}>
                  {item.value} {item.unit}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Botão para modo avançado */}
          <TouchableOpacity
            style={[styles.card, styles.advancedButton]}
            onPress={() => navigation.navigate('AdvancedDevModeScreen', { estufaId })}
          >
            <View style={styles.cardLabel}>
              <Text style={[styles.cardLabelText, { color: '#fff' }]}>Avançado</Text>
            </View>
            <View style={styles.cardValueBox}>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {/* Modal de edição de valores */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.blurContainer}>
            <Animated.View style={[styles.modalContentGlass, { transform: [{ scale: modalScale }] }]}>
              <Text style={styles.modalTitle}>{selectedItem?.label}</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={inputValue}
                onChangeText={(text) => {
                  const clean = text.replace(/[^0-9,.-]/g, '');
                  setInputValue(clean);
                }}
                placeholder="Digite o valor"
                autoFocus
              />
              <TouchableOpacity style={styles.modalButton} onPress={applyEdit}>
                <Text style={styles.modalButtonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.modalCancel}>Cancelar</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}