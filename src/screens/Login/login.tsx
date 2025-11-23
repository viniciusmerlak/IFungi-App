/**
 * Tela de Autenticação de Usuários
 * 
 * @component
 * @description
 * Gerencia login de usuários com Firebase Authentication, suporte
 * a "Manter-me logado" e navegação pós-autenticação.
 * 
 * @features
 * - Autenticação com email/senha via Firebase Auth
 * - Credenciais salvas com AsyncStorage
 * - Validação de formato de email
 * - Detecção de teclado para ajuste de layout
 * - Loading states com feedback visual
 * 
 * @state
 * @property {string} email - Email do usuário
 * @property {string} password - Senha do usuário
 * @property {boolean} keepLoggedIn - Lembrar credenciais
 * @property {boolean} loading - Estado de carregamento
 * @property {boolean} isKeyboardVisible - Teclado visível
 * 
 * @validation
 * - Email: formato válido (regex)
 * - Password: não vazio
 * - Campos: todos obrigatórios
 * 
 * @firebase
 * @method signInWithEmailAndPassword - Autenticação
 * @error Handling
 * - auth/invalid-email → Email inválido
 * - auth/user-not-found → Usuário não existe
 * - auth/wrong-password → Senha incorreta
 * - auth/too-many-requests → Muitas tentativas
 * 
 * @storage
 * @uses AsyncStorage para credenciais
 * @key 'user_credentials' - {email, password, rememberMe, timestamp}
 * 
 * @navigation
 * - ConectarDispositivo → Após login bem-sucedido
 * - Criar_Conta → Criação de nova conta
 * 
 * @example
 * ```tsx
 * <LoginScreen />
 * ```
 */
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  Alert,
  Switch
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../App";
import { FIREBASE_AUTH } from "../../services/FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AuthService } from "../../services/AuthService";

// Configurações de dimensão da tela
const { height } = Dimensions.get('window');

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

/**
 * Tela de Autenticação de Usuário
 * Gerencia login, credenciais salvas e navegação pós-login
 */
export default function LoginScreen() {
  // Estados do formulário e configurações
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  
  // Instância de autenticação do Firebase
  const auth = FIREBASE_AUTH;
  
  // Hooks de navegação e controle de teclado
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  /**
   * Carrega credenciais salvas ao montar componente
   * Preenche automaticamente campos se "Manter-me logado" estava ativo
   */
  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        const savedCredentials = await AuthService.getSavedCredentials();
        
        if (savedCredentials) {
          setEmail(savedCredentials.email);
          setPassword(savedCredentials.password);
          setKeepLoggedIn(savedCredentials.rememberMe);
          console.log("Login: Credenciais salvas carregadas");
        }
      } catch (error) {
        console.error('Login: Erro ao recuperar credenciais:', error);
      }
    };

    checkSavedCredentials();
  }, []);

  /**
   * Configura listeners para detecção de teclado
   * Ajusta layout dinamicamente
   */
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    // Cleanup dos listeners
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  /**
   * Processa autenticação do usuário
   * Valida credenciais e gerencia sessão
   */
  const signIn = async () => {
    // Validação básica dos campos
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Erro", "Por favor, insira um email válido");
      return;
    }

    setLoading(true);
    try {
      // Autenticação com Firebase
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login: Usuário autenticado com sucesso:", response.user.uid);
      
      // Aguarda sincronização do Firebase Auth
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificação adicional de autenticação
      const currentUser = FIREBASE_AUTH.currentUser;
      if (!currentUser || currentUser.uid !== response.user.uid) {
        throw new Error("Falha na sincronização da autenticação");
      }
      
      // Salva sessão ativa
      await AuthService.saveActiveSession(response.user.uid);
      
      // Gerencia credenciais salvas baseado na preferência
      if (keepLoggedIn) {
        await AuthService.saveCredentials(email, password);
        console.log("Login: Credenciais salvas para login automático");
      } else {
        await AuthService.clearCredentials();
        console.log("Login: Credenciais limpas");
      }
      
      // Navega para tela de conexão com dispositivo
      navigation.navigate('ConectarDispositivo' as never);    
      
    } catch (error: any) {
      console.error("Login: Erro na autenticação:", error);
      let errorMessage = "Ocorreu um erro ao fazer login";
      
      // Tratamento específico de erros do Firebase
      if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas. Tente novamente mais tarde";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Erro de conexão. Verifique sua internet";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "Esta conta foi desativada";
      }
      
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Navega para tela de criação de conta
   */
  const handleCreateAccount = () => {
    navigation.navigate('Criar_Conta');
  };

  /**
   * Limpa campos do formulário
   */
  const handleClearForm = () => {
    setEmail("");
    setPassword("");
  };

  return (
    <View style={styles.fullScreen}>
      {/* Status Bar transparente */}
      <StatusBar translucent backgroundColor="transparent" />
      
      {/* Gradiente de fundo */}
      <LinearGradient
        colors={["#ec17ff", "#42ff99"]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Título (oculto quando teclado está visível) */}
      {!isKeyboardVisible && (
        <Text style={styles.title}>Login</Text>
      )}

      {/* Container do formulário */}
      <View style={styles.cardWrapper}>
        {/* Fundo do card */}
        <View style={styles.cardBackground} />
        
        {/* Card com gradiente */}
        <LinearGradient
          colors={["#ffafaf", "#b061d8"]}
          style={styles.card}
          start={{ x: 1, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          >
            {/* Campo Email */}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="rgba(97, 97, 97, 0.7)"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              editable={!loading}
            />
            
            {/* Campo Senha */}
            <TextInput
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              placeholderTextColor="rgba(97, 97, 97, 0.7)"
              style={styles.input}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={signIn}
              editable={!loading}
            />
            
            {/* Opção "Manter-me logado" */}
            <View style={styles.checkboxContainer}>
              <Switch
                value={keepLoggedIn}
                onValueChange={setKeepLoggedIn}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={keepLoggedIn ? "#f0bfff" : "#f4f3f4"}
                disabled={loading}
              />
              <Text style={styles.checkboxLabel}>Manter-me logado</Text>
            </View>
            
            {/* Botão de Login */}
            <TouchableOpacity 
              style={styles.button}
              onPress={signIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>
            
            {/* Link para criação de conta */}
            <TouchableOpacity 
              onPress={handleCreateAccount}
              style={styles.secondaryButton}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Criar conta</Text>
            </TouchableOpacity>
            
            {/* Botão para limpar formulário */}
            <TouchableOpacity 
              onPress={handleClearForm}
              style={styles.clearButton}
              disabled={loading}
            >
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </View>
  );
}

/**
 * Estilos da tela de login
 */
const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#ffafaf'
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
  },
  title: {
    position: 'absolute',
    top: height * 0.15,
    width: '100%',
    fontSize: 96,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    zIndex: 10
  },
  cardWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
  },
  cardBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    backgroundColor: '#ffafaf',
    borderTopLeftRadius: 90,
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 90,
    paddingTop: 80,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    height: 60,
    width: "95%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#f0bfff",
    width: "55%",
    height: 60,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#000',
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  secondaryButton: {
    alignSelf: "center",
    padding: 10,
    marginBottom: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textDecorationLine: "underline",
  },
  clearButton: {
    alignSelf: "center",
    padding: 5,
  },
  clearButtonText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.7,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
  },
});