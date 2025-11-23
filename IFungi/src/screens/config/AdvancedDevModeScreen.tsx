/**
 * AdvancedDevModeScreen.tsx - O LABORATÓRIO DO ESP32
 * 
 * O QUE FAZ:
 * Esta tela é para DESENVOLVEDORES e TESTES AVANÇADOS. Ela permite:
 * - 🔌 Controlar PINOS digitais do ESP32 manualmente
 * - 📊 Configurar leitura analógica de sensores
 * - ⚡ Controlar PWM (modulação por largura de pulso)
 * - 🔘 Simular estados booleanos (ligado/desligado)
 * - 🎛️ Ajustar valores PWM (0-255)
 *
 * ⚠️ AVISO: Esta tela é para uso técnico avançado!
 * Usar incorretamente pode afetar o funcionamento da estufa.
 *
 * COMO FUNCIONA:
 * 1. Primeiro seleciona o MODO de operação (PWM, Leitura Analógica, ou Booleano)
 * 2. Depois configura os parâmetros específicos do modo escolhido
 * 3. Os valores são enviados direto para o ESP32 via Firebase
 * 4. O ESP32 executa os comandos na hora
 *
 * PARÂMETROS QUE RECEBE:
 * @param estufaId: string - OBRIGATÓRIO. Exemplo: "IFUNGI-001"
 *   Precisa saber em qual ESP32/estufa enviar os comandos
 *
 * MODOS DE OPERAÇÃO (escolhe UM):
 * @mode Leitura Analógica - Lê valores de sensores analógicos (0-1023)
 * @mode PWM - Controla intensidade de LEDs, ventiladores, etc. (0-255)
 * @mode Estado Booleano - Simula botões liga/desliga (true/false)
 *
 * CONFIGURAÇÕES:
 * @config PIN Digital: number - Qual pino do ESP32 usar (ex: pino 5)
 * @config Valor PWM: number - Intensidade do PWM de 0 a 255
 *   - 0 = desligado, 255 = máximo, 127 = metade da potência
 *
 * EXEMPLOS PRÁTICOS:
 * 1. Para testar um LED:
 *    - Modo: PWM
 *    - PIN: 5 (onde o LED está conectado)
 *    - Valor PWM: 150 (brilho médio)
 *
 * 2. Para ler um sensor de umidade no solo:
 *    - Modo: Leitura Analógica  
 *    - PIN: A0 (pino analógico)
 *    - Lê valores de 0 (seco) a 1023 (molhado)
 *
 * 3. Para simular um botão:
 *    - Modo: Estado Booleano
 *    - PIN: 2
 *    - Estado: true (ligado) ou false (desligado)
 *
 * EXEMPLO DE USO:
 * ```tsx
 * // Só desenvolvedores devem acessar:
 * navigation.navigate('AdvancedDevModeScreen', { estufaId: 'IFUNGI-001' })
 *
 * // Na tela:
 * [PIN Digital] [5] ← define o pino
 * [Selecione Modo]
 *   [ ] Leitura Analógica
 *   [X] PWM           ← seleciona PWM
 *   [ ] Estado Booleano
 * [Valor PWM] [150] ← define intensidade
 * ```
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
  Image,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update, onValue } from 'firebase/database';
import { FIREBASE_CONFIG } from '../../services/FirebaseConfig';
import styles from '../../styles/config/style';
import { RootStackParamList } from '../../types/navigation';

// Inicialização do Firebase
const app = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(app);

/**
 * Opção de configuração do tipo rádio (seleção única)
 */
type RadioOption = {
  key: string;
  label: string;
  value: boolean;
  firebaseKey: string;
};

/**
 * Item de configuração avançada
 */
type AdvancedDevItem = {
  key: string;
  label: string;
  unit?: string;
  value: number;
  firebaseKey: string;
  type: 'number' | 'radio';
};

// Opções de modo de operação (seleção única)
const radioOptions: RadioOption[] = [
  { 
    key: 'analogRead', 
    label: 'Leitura Analógica', 
    value: false, 
    firebaseKey: 'devmode/analogRead' 
  },
  { 
    key: 'pwm', 
    label: 'PWM', 
    value: false, 
    firebaseKey: 'devmode/pwm' 
  },
  { 
    key: 'boolean', 
    label: 'Estado Booleano', 
    value: false, 
    firebaseKey: 'devmode/boolean' 
  },
];

// Configurações iniciais avançadas
const initialAdvancedConfig: AdvancedDevItem[] = [
  { 
    key: 'pin', 
    label: 'PIN Digital', 
    value: 0, 
    firebaseKey: 'devmode/pin', 
    type: 'number' 
  },
  { 
    key: 'pwmValue', 
    label: 'Valor PWM', 
    unit: '', 
    value: 0, 
    firebaseKey: 'devmode/pwmValue', 
    type: 'number' 
  },
];

type AdvancedDevModeRouteProp = RouteProp<RootStackParamList, 'AdvancedDevModeScreen'>;

/**
 * Tela de Modo Desenvolvedor Avançado
 * Oferece controles avançados para desenvolvimento e teste
 */
export default function AdvancedDevModeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<AdvancedDevModeRouteProp>();
  const estufaId = route.params?.estufaId || 'IFUNGI-001';

  // Estados da aplicação
  const [configs, setConfigs] = useState<AdvancedDevItem[]>(initialAdvancedConfig);
  const [radioConfigs, setRadioConfigs] = useState<RadioOption[]>(radioOptions);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AdvancedDevItem | null>(null);
  const [inputValue, setInputValue] = useState('');
  const modalScale = useRef(new Animated.Value(0)).current;
  const [selectedRadio, setSelectedRadio] = useState<string | null>(null);

  /**
   * Carrega configurações do Firebase quando a tela é montada
   */
  useEffect(() => {
    const estufaRef = ref(database, `greenhouses/${estufaId}`);
    
    const unsubscribe = onValue(estufaRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Atualizar configurações numéricas
      const updatedConfigs = initialAdvancedConfig.map(item => {
        const keys = item.firebaseKey.split('/');
        let value = data;
        
        // Navega pelo objeto Firebase usando as chaves
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

      // Atualizar opções de rádio
      const updatedRadioConfigs = radioOptions.map(option => {
        const keys = option.firebaseKey.split('/');
        let value = data;
        
        for (const key of keys) {
          value = value?.[key];
          if (value === undefined) break;
        }

        const boolValue = Boolean(value);
        
        // Se esta opção está ativa, definir como selecionada
        if (boolValue && selectedRadio === null) {
          setSelectedRadio(option.key);
        }

        return {
          ...option,
          value: boolValue
        };
      });

      setRadioConfigs(updatedRadioConfigs);
    });

    // Cleanup da subscription
    return () => unsubscribe();
  }, [estufaId]);

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
  const openEditModal = (item: AdvancedDevItem) => {
    // Não abrir modal para o valor PWM se o PWM não estiver selecionado
    if (item.key === 'pwmValue' && selectedRadio !== 'pwm') {
      Alert.alert('Aviso', 'Selecione a opção PWM primeiro para editar seu valor');
      return;
    }
    
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
  const saveToFirebase = async (keyPath: string, value: number | boolean) => {
    try {
      const updates: { [key: string]: number | boolean } = {};
      updates[`greenhouses/${estufaId}/${keyPath}`] = value;
      await update(ref(database), updates);
      
      // Atualizar estado local se for valor numérico
      if (typeof value === 'number') {
        const updated = configs.map((item) =>
          item.firebaseKey === keyPath ? { ...item, value: value } : item
        );
        setConfigs(updated);
      }
      
    } catch (error) {
      console.error('Erro ao salvar no Firebase:', error);
      Alert.alert('Erro', 'Não foi possível salvar a configuração');
    }
  };

  /**
   * Manipula seleção de opções de rádio (seleção única)
   */
  const handleRadioSelect = async (selectedKey: string) => {
    // Desativar todas as opções primeiro
    const updates: { [key: string]: boolean } = {};
    
    radioOptions.forEach(option => {
      updates[`greenhouses/${estufaId}/${option.firebaseKey}`] = false;
    });
    
    // Ativar apenas a opção selecionada
    const selectedOption = radioOptions.find(opt => opt.key === selectedKey);
    if (selectedOption) {
      updates[`greenhouses/${estufaId}/${selectedOption.firebaseKey}`] = true;
    }
    
    try {
      await update(ref(database), updates);
      setSelectedRadio(selectedKey);
      
      // Atualizar estado local
      const updatedRadioConfigs = radioConfigs.map(option => ({
        ...option,
        value: option.key === selectedKey
      }));
      setRadioConfigs(updatedRadioConfigs);
      
    } catch (error) {
      console.error('Erro ao salvar seleção de rádio:', error);
      Alert.alert('Erro', 'Não foi possível salvar a seleção');
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

  /**
   * Retorna texto de exibição para opção de rádio
   */
  const getRadioDisplay = (option: RadioOption) => {
    return option.value ? 'SELECIONADO' : 'NÃO SELECIONADO';
  };

  /**
   * Retorna cor para opção de rádio baseado no estado
   */
  const getRadioColor = (option: RadioOption) => {
    return option.value ? '#4CAF50' : '#F44336';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com botão voltar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Modo DEV Avançado</Text>
      </View>

      {/* Conteúdo principal com gradiente */}
      <LinearGradient colors={['#fda4af', '#f0abfc']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Imagem ilustrativa do ESP32 */}
          <View style={styles.imageContainer}>
            <Image 
              source={require('../../../assets/images/dev_mode/esp32.png')} 
              style={styles.esp32Image}
              resizeMode="contain"
            />
          </View>

          {/* Configuração de PIN Digital */}
          {configs.filter(item => item.key === 'pin').map((item) => (
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
                  {item.value}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Seletor de Modo de Operação */}
          <Text style={{ 
            color: '#fff', 
            fontSize: 16, 
            fontWeight: 'bold', 
            marginBottom: 10, 
            marginTop: 10 
          }}>
            Modo de Operação (Selecione um):
          </Text>
          
          {radioConfigs.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={styles.card}
              onPress={() => handleRadioSelect(option.key)}
            >
              <View style={styles.cardLabel}>
                <Text style={styles.cardLabelText}>{option.label}</Text>
              </View>
              <View style={[styles.cardValueBox, { backgroundColor: getRadioColor(option) }]}>
                <Text style={styles.cardValueText}>
                  {getRadioDisplay(option)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Configuração de Valor PWM (condicional) */}
          {selectedRadio === 'pwm' && configs.filter(item => item.key === 'pwmValue').map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.card, { backgroundColor: 'rgba(106, 90, 205, 0.6)' }]}
              onPress={() => openEditModal(item)}
            >
              <View style={styles.cardLabel}>
                <Text style={[styles.cardLabelText, { color: '#fff' }]}>{item.label}</Text>
              </View>
              <View style={styles.cardValueBox}>
                <Text style={styles.cardValueText}>
                  {item.value}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
              <Text style={styles.modalTitle}>
                {selectedItem?.key === 'pwmValue' ? 'Valor PWM' : selectedItem?.label}
              </Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={inputValue}
                onChangeText={(text) => {
                  const clean = text.replace(/[^0-9,.-]/g, '');
                  setInputValue(clean);
                }}
                placeholder={
                  selectedItem?.key === 'pwmValue' 
                    ? "Digite o valor PWM (0-255)" 
                    : "Digite o valor"
                }
                autoFocus
              />
              {selectedItem?.key === 'pwmValue' && (
                <Text style={{ color: '#666', fontSize: 12, marginBottom: 10 }}>
                  Valores PWM geralmente variam de 0 a 255
                </Text>
              )}
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