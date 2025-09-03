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
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import styles from '../../styles/config/style';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { FIREBASE_CONFIG } from '../../services/FirebaseConfig';
import { getAuth, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Inicialização do Firebase
const app = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(app);
const auth = getAuth();

type ConfigItem = {
  key: string;
  label: string;
  unit?: string;
  value: number;
  firebaseKey: string;
};

const initialConfig: ConfigItem[] = [
  { key: 'tempMax',  label: 'Temperatura\nMáxima',      unit: '°C',   value: 24, firebaseKey: 'setpoints/tMax' },
  { key: 'tempMin',  label: 'Temperatura\nMínima',      unit: '°C',   value: 18, firebaseKey: 'setpoints/tMin' },
  { key: 'humMin',   label: 'Umidade\nMínima',          unit: '%',    value: 85, firebaseKey: 'setpoints/uMin' },
  { key: 'humMax',   label: 'Umidade\nMáxima',          unit: '%',    value: 93, firebaseKey: 'setpoints/uMax' },
  { key: 'lux',      label: 'Luminosidade\nDesejada',   unit: 'LUX',  value: 200, firebaseKey: 'setpoints/lux' },
  { key: 'co',       label: 'Limite de CO',             unit: 'PPM',  value: 400, firebaseKey: 'setpoints/coSp' },
  { key: 'co2',      label: 'Limite de CO₂',            unit: 'PPM',  value: 400, firebaseKey: 'setpoints/co2Sp' },
  { key: 'tvocs',    label: 'Limite de TVOCs',          unit: 'PPB',  value: 100, firebaseKey: 'setpoints/tvocsSp' },
];

export default function ConfigScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const estufaId = route.params?.estufaId || 'IFUNGI-001';

  const [configs, setConfigs] = useState<ConfigItem[]>(initialConfig);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConfigItem | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const modalScale = useRef(new Animated.Value(0)).current;

  // Função para sair da estufa
  const handleLeaveEstufa = async () => {
    Alert.alert(
      'Sair da Estufa',
      'Deseja desconectar desta estufa?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sair',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                // Remover a estufa salva
                await AsyncStorage.removeItem(`estufa_${user.uid}`);
                await AsyncStorage.removeItem('last_user_id');
                
                // Limpar informações de conexão no Firebase
                const db = getDatabase();
                await update(ref(db, `Usuarios/${user.uid}`), {
                  currentGreenhouse: null,
                });
                
                await update(ref(db, `estufas/${estufaId}`), {
                  currentUser: null,
                });
              }
              
              // Navegar para a tela de conectar estufa
              navigation.reset({
                index: 0,
                routes: [{ name: 'ConectarDispositivo' }],
              });
            } catch (error) {
              console.error('Erro ao sair da estufa:', error);
              Alert.alert('Erro', 'Não foi possível sair da estufa');
            }
          }
        }
      ]
    );
  };

  // Função para sair do app
  const handleLogout = async () => {
    Alert.alert(
      'Sair do App',
      'Deseja fazer logout?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sair',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                // Limpar todas as informações salvas
                await AsyncStorage.multiRemove([
                  'email', 
                  'password', 
                  `estufa_${user.uid}`, 
                  'last_user_id'
                ]);
                
                // Limpar informações de conexão no Firebase
                const db = getDatabase();
                await update(ref(db, `Usuarios/${user.uid}`), {
                  currentGreenhouse: null,
                });
                
                await update(ref(db, `estufas/${estufaId}`), {
                  currentUser: null,
                });
                
                // Fazer logout
                await signOut(auth);
              }
              
              // Navegar para a tela de login
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível fazer logout');
            }
          }
        }
      ]
    );
  };

  // Carrega configurações do Firebase apenas uma vez na montagem
  useEffect(() => {
    const fixZeroValues = (data: any) => {
      const defaults = {
        'setpoints/tMin': 18,
        'setpoints/tMax': 24,
        'setpoints/uMin': 85,
        'setpoints/uMax': 93,
        'setpoints/lux': 200,
        'setpoints/coSp': 400,
        'setpoints/co2Sp': 400,
        'setpoints/tvocsSp': 100,
      };

      const updates = {};
      let needsUpdate = false;

      Object.entries(defaults).forEach(([key, defaultValue]) => {
        const keys = key.split('/');
        let value = data;
        
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }

        // Aplica valores padrão apenas na primeira carga se necessário
        if (isFirstLoad && (value === 0 || value === undefined || value === null)) {
          updates[`estufas/${estufaId}/${key}`] = defaultValue;
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        update(ref(database), updates);
        setIsFirstLoad(false);
      }
    };

    const estufaRef = ref(database, `estufas/${estufaId}`);
    
    const unsubscribe = onValue(estufaRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Só corrige valores na primeira carga
      if (isFirstLoad) {
        fixZeroValues(data);
      }

      const updatedConfigs = initialConfig.map(item => {
        const keys = item.firebaseKey.split('/');
        let value = data;
        
        for (const key of keys) {
          value = value?.[key];
          if (value === undefined) break;
        }

        return {
          ...item,
          value: value !== undefined ? value : item.value
        };
      });

      setConfigs(updatedConfigs);
    });

    return () => unsubscribe();
  }, [estufaId, isFirstLoad]);

  const animateModal = (show: boolean) => {
    Animated.timing(modalScale, {
      toValue: show ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  };

  const openEditModal = (item: ConfigItem) => {
    setSelectedItem(item);
    setInputValue(item.value.toString());
    setModalVisible(true);
    animateModal(true);
  };

  const closeModal = () => {
    animateModal(false);
    setTimeout(() => setModalVisible(false), 250);
  };

  const saveToFirebase = async (keyPath: string, value: number) => {
    try {
      const updates = {};
      updates[`estufas/${estufaId}/${keyPath}`] = value;
      await update(ref(database), updates);
      
      // Atualiza o estado local imediatamente para feedback visual
      const updated = configs.map((item) =>
        item.firebaseKey === keyPath ? { ...item, value: value } : item
      );
      setConfigs(updated);
      
    } catch (error) {
      console.error('Erro ao salvar no Firebase:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
    }
  };

  const applyEdit = () => {
    if (!selectedItem) return;
    
    const parsed = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(parsed)) {
      Alert.alert('Erro', 'Por favor, digite um valor numérico válido');
      return;
    }

    // Validações básicas - REMOVIDAS AS RESTRIÇÕES DESNECESSÁRIAS
    let isValid = true;
    let errorMessage = '';
    
    // Apenas validações essenciais
    if (selectedItem.key.includes('hum') && (parsed < 0 || parsed > 100)) {
      isValid = false;
      errorMessage = 'A umidade deve estar entre 0% e 100%';
    } else if (parsed < 0) {
      isValid = false;
      errorMessage = 'Os valores não podem ser negativos';
    }

    if (!isValid) {
      Alert.alert('Valor inválido', errorMessage);
      return;
    }

    saveToFirebase(selectedItem.firebaseKey, parsed);
    closeModal();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrapper}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Configuração</Text>
      </View>

      {/* Conteúdo */}
      <LinearGradient colors={['#fda4af', '#f0abfc']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
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
          
          {/* Botões de ação com estilos diferenciados */}
          <TouchableOpacity
            style={[styles.card, styles.actionCard, { backgroundColor: 'rgba(255, 193, 7, 0.3)' }]}
            onPress={handleLeaveEstufa}
          >
            <View style={styles.cardLabel}>
              <Text style={[styles.cardLabelText, { color: '#ff9800' }]}>Sair da Estufa</Text>
            </View>
            <View style={styles.cardValueBox}>
              <Ionicons name="exit-outline" size={24} color="#ff9800" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.card, styles.actionCard, { backgroundColor: 'rgba(244, 67, 54, 0.3)' }]}
            onPress={handleLogout}
          >
            <View style={styles.cardLabel}>
              <Text style={[styles.cardLabelText, { color: '#f44336' }]}>Sair do App</Text>
            </View>
            <View style={styles.cardValueBox}>
              <Ionicons name="log-out-outline" size={24} color="#f44336" />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <BlurView intensity={20} style={styles.blurContainer}>
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
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}