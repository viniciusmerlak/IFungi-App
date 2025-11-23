/**
 * Tela de Criação de Conta
 * Permite que novos usuários se cadastrem no sistema
 * Integrado com Firebase Authentication
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../../App";
import { FIREBASE_AUTH } from "../../../services/FirebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

// Configurações de dimensão da tela
const { height } = Dimensions.get("window");

type CriarContaScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "Criar_Conta"
>;

/**
 * Tela de Cadastro de Novo Usuário
 * Valida dados e cria conta no Firebase Authentication
 */
export default function CriarContaScreen() {
    // Estados do formulário
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Instância de autenticação do Firebase
    const auth = FIREBASE_AUTH;

    // Hooks de navegação e controle de teclado
    const navigation = useNavigation<CriarContaScreenNavigationProp>();
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    /**
     * Configura listeners para detectar quando teclado está visível
     * Ajusta layout dinamicamente
     */
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => setKeyboardVisible(false)
        );

        // Cleanup dos listeners
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    /**
     * Valida e processa criação de conta
     * Realiza cadastro no Firebase Authentication
     */
    const signUp = async () => {
        // Validação de campos obrigatórios
        if (password !== confirmPassword) {
            Alert.alert("Erro", "As senhas não coincidem");
            return;
        }

        if (!email || !password || !name) {
            Alert.alert("Erro", "Preencha todos os campos");
            return;
        }

        // Validação de email básica
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Erro", "Por favor, insira um email válido");
            return;
        }

        // Validação de força da senha
        if (password.length < 6) {
            Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
            return;
        }

        setLoading(true);
        try {
            // Cria usuário no Firebase Authentication
            const response = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Criação de conta: Usuário cadastrado com sucesso:", response.user.uid);
            
            Alert.alert(
                "Sucesso", 
                "Conta criada com sucesso!",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.navigate("Login")
                    }
                ]
            );
            
        } catch (error: any) {
            console.error("Criação de conta: Erro ao cadastrar usuário:", error);
            let errorMessage = "Ocorreu um erro ao criar a conta";
            
            // Tratamento específico de erros do Firebase
            if (error.code === "auth/email-already-in-use") {
                errorMessage = "Este email já está em uso";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Email inválido";
            } else if (error.code === "auth/weak-password") {
                errorMessage = "A senha deve ter pelo menos 6 caracteres";
            } else if (error.code === "auth/network-request-failed") {
                errorMessage = "Erro de conexão. Verifique sua internet";
            }
            
            Alert.alert("Erro", errorMessage);
        } finally {
            setLoading(false);
        }
    }

    /**
     * Navega de volta para tela de login
     */
    const handleBackToLogin = () => {
        navigation.navigate("Login");
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
                <Text style={styles.title}>Criar Conta</Text>
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
                    >
                        {/* Campo Nome Completo */}
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Nome completo"
                            placeholderTextColor="rgba(97, 97, 97, 0.7)"
                            style={styles.input}
                            autoCapitalize="words"
                            returnKeyType="next"
                            editable={!loading}
                        />
                        
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
                            returnKeyType="next"
                            editable={!loading}
                        />
                        
                        {/* Campo Confirmar Senha */}
                        <TextInput
                            secureTextEntry={true}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirmar senha"
                            placeholderTextColor="rgba(97, 97, 97, 0.7)"
                            style={styles.input}
                            autoCapitalize="none"
                            returnKeyType="done"
                            onSubmitEditing={signUp}
                            editable={!loading}
                        />
                        
                        {/* Botão de Criação de Conta */}
                        {loading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : (
                            <TouchableOpacity
                                style={styles.button}
                                onPress={signUp}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>Criar Conta</Text>
                            </TouchableOpacity>
                        )}
                        
                        {/* Link para voltar ao Login */}
                        <TouchableOpacity 
                            onPress={handleBackToLogin}
                            style={styles.backButton}
                            disabled={loading}
                        >
                            <Text style={styles.backButtonText}>
                                Já tem uma conta? Fazer login
                            </Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </LinearGradient>
            </View>
        </View>
    );
}

/**
 * Estilos da tela de criação de conta
 */
const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        backgroundColor: "#ffafaf",
    },
    backgroundGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.5,
    },
    title: {
        position: "absolute",
        top: height * 0.15,
        width: "100%",
        fontSize: 48,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
        zIndex: 10
    },
    cardWrapper: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.65,
    },
    cardBackground: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.65,
        backgroundColor: "#ffafaf",
        borderTopLeftRadius: 90,
    },
    card: {
        flex: 1,
        borderTopLeftRadius: 90,
        paddingTop: 80,
        paddingHorizontal: 24,
        overflow: "hidden",
    },
    keyboardAvoidingView: {
        flex: 1,
        justifyContent: "center",
    },
    input: {
        backgroundColor: "#fff",
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 20,
        fontSize: 16,
        height: 66,
        width: "95%",
        alignSelf: "center",
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    button: {
        backgroundColor: "#f0bfff",
        width: "55%",
        height: 76,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: "#000",
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
        marginBottom: 20,
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
    backButton: {
        alignSelf: "center",
        padding: 10,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        textDecorationLine: "underline",
    },
});