/**
 * ConfigScreen.tsx - A SALA DE CONTROLE E CONFIGURAÇÕES
 * 
 * ## O QUE FAZ:
 * Esta tela permite você CONFIGURAR como a estufa deve funcionar:
 * - 🌡️ Definir temperaturas mínima e máxima
 * - 💧 Definir umidades mínima e máxima  
 * - 💡 Definir luminosidade ideal
 * - ⚠️ Definir limites de gases (CO, CO₂, TVOCs)
 * - 🔐 Sair da estufa ou fazer logout do app
 *
 * ## COMO FUNCIONA:
 * 1. Mostra uma lista de configurações (cada uma em um "cartão")
 * 2. Você toca em um cartão para editar o valor
 * 3. Abre uma janela para digitar o novo valor
 * 4. Quando salva, envia imediatamente para o Firebase
 * 5. A estufa automaticamente começa a seguir esses novos valores
 *
 * ## PARÂMETROS:
 * @param estufaId - O código único da estufa. Exemplo: "IFUNGI-001"
 *
 * ## CONFIGURAÇÕES EDITÁVEIS:
 * - `tempMax`: Temperatura MÁXIMA em °C (ex: 24°C)
 * - `tempMin`: Temperatura MÍNIMA em °C (ex: 18°C)  
 * - `humMin`: Umidade MÍNIMA em % (ex: 85%)
 * - `humMax`: Umidade MÁXIMA em % (ex: 93%)
 * - `lux`: Luminosidade desejada em LUX (ex: 200 LUX)
 * - `co`: Limite de CO em PPM (ex: 400 PPM)
 * - `co2`: Limite de CO₂ em PPM (ex: 400 PPM) 
 * - `tvocs`: Limite de TVOCs em PPB (ex: 100 PPB)
 *
 * ## EASTER EGG (segredo):
 * 👆 Se tocar 5 vezes rápidas no cabeçalho "Configuração", 
 *    abre o Modo Desenvolvedor (telas extras para testes)
 *
 * @component
 * @example
 * ```tsx
 * // Para abrir as configurações da estufa IFUNGI-001:
 * navigation.navigate('ConfigScreen', { estufaId: 'IFUNGI-001' })
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../../styles/config/style';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { FIREBASE_CONFIG } from '../../services/FirebaseConfig';
import { AuthService } from '../../services/AuthService';
import { RootStackParamList } from '../../types/navigation';

// Inicialização do Firebase
const app = initializeApp(FIREBASE_CONFIG);
const database = getDatabase(app);

/**
 * Item de configuração da estufa
 */
type ConfigItem = {
  key: string;
  label: string;
  unit?: string;
  value: number;
  firebaseKey: string;
};

// Configurações iniciais com valores padrão
const initialConfig: ConfigItem[] = [
  { 
    key: 'tempMax',  
    label: 'Temperatura\nMáxima',      
    unit: '°C',   
    value: 24, 
    firebaseKey: 'setpoints/tMax' 
  },
  { 
    key: 'tempMin',  
    label: 'Temperatura\nMínima',      
    unit: '°C',   
    value: 18, 
    firebaseKey: 'setpoints/tMin' 
  },
  { 
    key: 'humMin',   
    label: 'Umidade\nMínima',          
    unit: '%',    
    value: 85, 
    firebaseKey: 'setpoints/uMin' 
  },
  { 
    key: 'humMax',   
    label: 'Umidade\nMáxima',          
    unit: '%',    
    value: 93, 
    firebaseKey: 'setpoints/uMax' 
  },
  { 
    key: 'lux',      
    label: 'Luminosidade\nDesejada',   
    unit: 'LUX',  
    value: 200, 
    firebaseKey: 'setpoints/lux' 
  },
  { 
    key: 'co',       
    label: 'Limite de CO',             
    unit: 'PPM',  
    value: 400, 
    firebaseKey: 'setpoints/coSp' 
  },
  { 
    key: 'co2',      
    label: 'Limite de CO₂',            
    unit: 'PPM',  
    value: 400, 
    firebaseKey: 'setpoints/co2Sp' 
  },
  { 
    key: 'tvocs',    
    label: 'Limite de TVOCs',          
    unit: 'PPB',  
    value: 100, 
    firebaseKey: 'setpoints/tvocsSp' 
  },
];

type ConfigScreenRouteProp = RouteProp<RootStackParamList, 'ConfigScreen'>;

/**
 * Tela de Configurações
 * Gerencia setpoints da estufa e ações de usuário
 */
export default function ConfigScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<ConfigScreenRouteProp>();
  const estufaId = route.params?.estufaId || 'IFUNGI-001';

  // Estados da aplicação
  const [configs, setConfigs] = useState<ConfigItem[]>(initialConfig);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConfigItem | null>(null);
  const [inputValue, setInputValue] = useState('');
  const modalScale = useRef(new Animated.Value(0)).current;
  const [tapCount, setTapCount] = useState(0);
  
  /**
   * Manipula saída da estufa (volta para conectar dispositivo)
   */
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
              console.log('ConfigScreen: Saindo da estufa:', estufaId);
              await AuthService.leaveEstufa(estufaId);
              
              console.log('ConfigScreen: Navegando para ConectarDispositivo');
              navigation.reset({
                index: 0,
                routes: [{ name: 'ConectarDispositivo' }],
              });
            } catch (error: any) {
              console.error('ConfigScreen: Erro ao sair da estufa:', error);
              Alert.alert('Erro', 'Não foi possível sair da estufa: ' + error.message);
            }
          }
        }
      ]
    );
  };

  /**
   * Detecta toques múltiplos no header para acessar modo desenvolvedor
   */
  const handleHeaderPress = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    console.log(`ConfigScreen: Header pressionado ${newCount} vezes`);
    
    if (newCount >= 5) {
      setTapCount(0);
      console.log('ConfigScreen: Navegando para DevModeScreen');
      navigation.navigate('DevModeScreen', { estufaId });
    }
    
    // Reseta a contagem após 2 segundos
    setTimeout(() => {
      if (tapCount > 0) {
        console.log('ConfigScreen: Resetando contagem de toques');
        setTapCount(0);
      }
    }, 2000);
  };

  /**
   * Realiza logout completo do aplicativo
   */
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
              console.log('ConfigScreen: Iniciando logout completo');
              await AuthService.logout(estufaId);
              
              console.log('ConfigScreen: Navegando para Login');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error: any) {
              console.error('ConfigScreen: Erro ao fazer logout:', error);
              Alert.alert('Erro', 'Não foi possível fazer logout: ' + error.message);
            }
          }
        }
      ]
    );
  };

  /**
   * Carrega configurações do Firebase quando a tela é montada
   */
  useEffect(() => {
    const estufaRef = ref(database, `greenhouses/${estufaId}`);
    
    const unsubscribe = onValue(estufaRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Atualiza configurações baseado nos dados do Firebase
      const updatedConfigs = initialConfig.map(item => {
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
  const openEditModal = (item: ConfigItem) => {
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
   * Aplica edição do modal com validações
   */
  const applyEdit = () => {
    if (!selectedItem) return;
    
    const parsed = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(parsed)) {
      Alert.alert('Erro', 'Por favor, digite um valor numérico válido');
      return;
    }

    // Validações específicas por tipo de configuração
    let isValid = true;
    let errorMessage = '';
    
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
      {/* Header com botão voltar e Easter Egg (toques múltiplos) */}
      <TouchableOpacity 
        style={styles.header} 
        onPress={handleHeaderPress}
        activeOpacity={0.8}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Configuração</Text>
      </TouchableOpacity>

      {/* Conteúdo principal com gradiente */}
      <LinearGradient colors={['#fda4af', '#f0abfc']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Lista de configurações editáveis */}
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
          
          {/* Botão para sair da estufa */}
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
          
          {/* Botão para logout completo */}
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