/**
 * Tela de Conexão com Estufa
 * 
 * @component
 * @description
 * Interface principal para conectar o usuário a uma estufa específica
 * via ID manual ou QR Code. Valida permissões e atualiza Firebase.
 * 
 * @features
 * - Conexão manual por ID da estufa
 * - Integração com scanner de QR Code
 * - Validação de permissões de usuário
 * - Atualização de conexão em tempo real
 * 
 * @state
 * @property {string} estufaId - ID da estufa para conexão
 * @property {boolean} isLoading - Estado de carregamento
 * 
 * @permissions
 * - Verifica se usuário tem acesso à estufa
 * - Valida em `Usuarios/${userId}/Estufas permitidas`
 * - Suporta string única ou array de estufas
 * 
 * @firebase
 * @writes `Usuarios/${userId}/currentGreenhouse`
 * @writes `greenhouses/${estufaId}/currentUser`
 * 
 * @navigation
 * - QRCode → Scanner de QR Code
 * - Monitoramento → Após conexão bem-sucedida
 * 
 * @errors
 * - "Estufa não encontrada" → ID inválido
 * - "Usuário não encontrado" → Problema no Firebase
 * - "Sem permissão" → Usuário não autorizado
 * 
 * @example
 * ```tsx
 * <ConectarEstufaScreen />
 * ```
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  View,
  ActivityIndicator
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { getDatabase, ref, get, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AuthService } from "../../services/AuthService";

/**
 * Definição dos parâmetros das rotas de navegação
 * @typedef {Object} RootStackParamList
 * @property {Object} ConectarDispositivo - Rota para conectar dispositivo
 * @property {string} [ConectarDispositivo.qrData] - Dados do QR Code opcionais
 * @property {Object} Monitoramento - Rota para monitoramento
 * @property {string} Monitoramento.estufaId - ID da estufa
 * @property {undefined} QRCode - Rota para scanner de QR Code
 */
type RootStackParamList = {
  ConectarDispositivo: { qrData?: string };
  Monitoramento: { estufaId: string };
  QRCode: undefined;
};

/**
 * Tipo para as props de rota da tela ConectarDispositivo
 */
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'ConectarDispositivo'>;

/**
 * Tela principal para conexão com estufas
 * Permite conectar via ID manual ou QR Code
 * @component
 * @returns {JSX.Element} Componente da tela de conexão
 */
const ConectarEstufaScreen: React.FC = () => {
  // Estados do componente
  const [estufaId, setEstufaId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Hooks de navegação
  const navigation = useNavigation<any>();
  const route = useRoute<HomeScreenRouteProp>();

  /**
   * Atualiza a navegação com dados do QR Code
   * @callback
   * @param {string} qrData - Dados do QR Code escaneado
   */
  const updateNavigation = useCallback((qrData: string) => {
    console.log('Home: QR Code recebido:', qrData);
    setEstufaId(qrData);
  }, []);

  /**
   * Efeito para processar dados do QR Code quando recebidos via rota
   * @effect
   */
  useEffect(() => {
    if (route.params?.qrData) {
      updateNavigation(route.params.qrData);
    }
  }, [route.params, updateNavigation]);

  /**
   * Verifica permissões do usuário para acessar a estufa
   * @async
   * @param {string} userId - ID do usuário
   * @param {string} estufaId - ID da estufa
   * @returns {Promise<{estufaSnapshot: DataSnapshot, userSnapshot: DataSnapshot}>} Snapshots da estufa e usuário
   * @throws {Error} Quando estufa não existe, usuário não encontrado ou sem permissão
   */
  const verifyPermissions = async (userId: string, estufaId: string) => {
    console.log('Home: Verificando permissões para usuário:', userId, 'estufa:', estufaId);
    const db = getDatabase();
    
    // Busca dados da estufa e usuário em paralelo
    const [estufaSnapshot, userSnapshot] = await Promise.all([
      get(ref(db, `greenhouses/${estufaId}`)),
      get(ref(db, `Usuarios/${userId}`))
    ]);

    // Validações de existência
    if (!estufaSnapshot.exists()) {
      throw new Error("Estufa não encontrada.");
    }

    if (!userSnapshot.exists()) {
      throw new Error("Usuário não encontrado no banco de dados.");
    }

    // Verifica permissões do usuário
    const userData = userSnapshot.val();
    const estufasPermitidas = userData["Estufas permitidas"];

    if (!estufasPermitidas) {
      throw new Error("Você não tem permissão para essa estufa.");
    }

    // Valida diferentes formatos de permissões
    if (typeof estufasPermitidas === 'string') {
      if (estufasPermitidas !== estufaId) {
        throw new Error("Você não tem permissão para essa estufa.");
      }
    } else if (Array.isArray(estufasPermitidas)) {
      if (!estufasPermitidas.includes(estufaId)) {
        throw new Error("Você não tem permissão para essa estufa.");
      }
    } else {
      throw new Error("Formato de permissões inválido.");
    }

    return { estufaSnapshot, userSnapshot };
  };

  /**
   * Atualiza informações de conexão no Firebase
   * @async
   * @param {string} userId - ID do usuário
   * @param {string} estufaId - ID da estufa
   */
  const updateConnectionInfo = async (userId: string, estufaId: string) => {
    console.log('Home: Atualizando informações de conexão');
    const db = getDatabase();
    
    // Atualiza usuário e estufa simultaneamente
    await Promise.all([
      update(ref(db, `Usuarios/${userId}`), {
        currentGreenhouse: estufaId,
      }),
      update(ref(db, `greenhouses/${estufaId}`), {
        currentUser: userId,
      })
    ]);
  };

  /**
   * Processa a conexão com a estufa
   * @async
   */
  const conectarEstufa = async () => {
    // Validação do ID da estufa
    if (!estufaId.trim()) {
      Alert.alert("Erro", "Digite o ID da estufa.");
      return;
    }

    console.log('Home: Iniciando conexão com estufa:', estufaId);
    setIsLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;

    // Verifica autenticação do usuário
    if (!user) {
      setIsLoading(false);
      Alert.alert("Erro", "Usuário não autenticado.");
      return;
    }

    const userId = user.uid;
    
    try {
      // Verifica permissões
      await verifyPermissions(userId, estufaId);
      
      // Atualiza conexão no Firebase
      await updateConnectionInfo(userId, estufaId);
      
      // Salva sessão local
      console.log('Home: Salvando sessão ativa');
      await AuthService.saveActiveSession(userId, estufaId);
      
      // Navega para tela de monitoramento
      console.log('Home: Navegando para Monitoramento');
      navigation.navigate("Monitoramento", { estufaId });
      
    } catch (error: any) {
      console.error('Home: Erro ao conectar estufa:', error);
      Alert.alert("Erro", error.message || "Erro ao conectar com a estufa");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler para o botão de conectar
   */
  const handleConectar = () => {
    conectarEstufa();
  };

  return (
    <LinearGradient colors={["#fda4af", "#f0abfc"]} style={styles.container}>
      <Text style={styles.title}>Conecte seu{"\n"}dispositivo</Text>

      <Text style={styles.subtitle}>Insira o código da sua estufa</Text>
      <TextInput
        style={styles.input}
        placeholder="Código da sua estufa"
        value={estufaId}
        onChangeText={setEstufaId}
        autoCapitalize="none"
        editable={!isLoading}
      />
      <Text style={styles.qrLabel}>conectar-se com QR code</Text>
      <TouchableOpacity 
        onPress={() => navigation.navigate("QRCode")} 
        disabled={isLoading}
      >
        <Ionicons name="qr-code-outline" size={70} color={isLoading ? "#ccc" : "white"} style={styles.qrIcon} />
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Conectando...</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleConectar}>
          <Text style={styles.buttonText}>Conectar-se</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

/**
 * Estilos para o componente ConectarEstufaScreen
 * @namespace
 */
const styles = StyleSheet.create({
  /**
   * Container principal
   */
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  /**
   * Título principal
   */
  title: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 150,
    textAlign: 'center',
  },
  /**
   * Subtítulo
   */
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: 'center',
  },
  /**
   * Campo de entrada para ID da estufa
   */
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 30,
    fontSize: 16,
  },
  /**
   * Label para opção de QR Code
   */
  qrLabel: {
    color: "#fff",
    marginBottom: 10,
    fontWeight: "bold",
    fontSize: 24,
    textAlign: 'center',
  },
  /**
   * Ícone do QR Code
   */
  qrIcon: {
    alignSelf: "center",
    marginBottom: 30,
  },
  /**
   * Botão de conectar
   */
  button: {
    backgroundColor: "rgba(255, 255, 255, 0)",
    paddingVertical: 24,
    paddingHorizontal: 80,
    marginTop: 40,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#000",
  },
  /**
   * Texto do botão
   */
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 24,
  },
  /**
   * Container de loading
   */
  loadingContainer: {
    marginTop: 40,
    paddingVertical: 24,
    paddingHorizontal: 80,
    alignItems: 'center',
  },
  /**
   * Texto de loading
   */
  loadingText: {
    marginTop: 10,
    color: "#000",
    fontSize: 16,
  },
});

export default ConectarEstufaScreen;