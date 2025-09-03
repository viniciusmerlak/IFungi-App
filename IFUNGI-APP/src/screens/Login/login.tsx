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
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const auth = FIREBASE_AUTH;
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Verificar se há credenciais salvas ao carregar a tela
  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('email');
        const savedPassword = await AsyncStorage.getItem('password');
        
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setKeepLoggedIn(true);
        }
      } catch (error) {
        console.error('Erro ao recuperar credenciais:', error);
      }
    };

    checkSavedCredentials();
  }, []);

  const signIn = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      console.log("Usuário logado com sucesso:", response.user);
      
      // Salvar credenciais se "Manter logado" estiver marcado
      if (keepLoggedIn) {
        await AsyncStorage.setItem('email', email);
        await AsyncStorage.setItem('password', password);
      } else {
        // Remover credenciais salvas se não estiver marcado
        await AsyncStorage.multiRemove(['email', 'password']);
      }
      
      navigation.navigate('ConectarDispositivo');
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      let errorMessage = "Ocorreu um erro ao fazer login";
      
      if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas. Tente novamente mais tarde";
      }
      
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <View style={styles.fullScreen}>
      <StatusBar translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={["#ec17ff", "#42ff99"]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {!isKeyboardVisible && (
        <Text style={styles.title}>Login</Text>
      )}

      <View style={styles.cardWrapper}>
        <View style={styles.cardBackground} />
        
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
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="rgba(97, 97, 97, 0.7)"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TextInput
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              placeholder="Senha"
              placeholderTextColor="rgba(97, 97, 97, 0.7)"
              style={styles.input}
              autoCapitalize="none"
            />
            
            <View style={styles.checkboxContainer}>
              <Switch
                value={keepLoggedIn}
                onValueChange={setKeepLoggedIn}
                trackColor={{ false: "#767577", true: "#fff" }}
                thumbColor={keepLoggedIn ? "#f0bfff" : "#f4f3f4"}
              />
              <Text style={styles.checkboxLabel}>Manter-me logado</Text>
            </View>
            
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
            
            <TouchableOpacity 
              onPress={() => navigation.navigate('Criar_Conta')}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Criar conta</Text>
            </TouchableOpacity>
            
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </View>
  );
}

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
  },
  buttonText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  secondaryButton: {
    alignSelf: "center",
    padding: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textDecorationLine: "underline",
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