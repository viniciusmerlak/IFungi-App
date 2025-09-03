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

const { height } = Dimensions.get("window");

type CriarContaScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "CriarConta"
>;

export default function CriarContaScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const auth = FIREBASE_AUTH;

    const navigation = useNavigation<CriarContaScreenNavigationProp>();
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const signUp = async () => {
        if (password !== confirmPassword) {
            Alert.alert("Erro", "As senhas não coincidem");
            return;
        }

        if (!email || !password || !name) {
            Alert.alert("Erro", "Preencha todos os campos");
            return;
        }

        setLoading(true);
        try {
            const response = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Usuário cadastrado com sucesso:", response.user);
            Alert.alert("Sucesso", "Conta criada com sucesso!");
            navigation.navigate("Login");
        } catch (error: any) {
            console.error("Erro ao cadastrar usuário:", error);
            let errorMessage = "Ocorreu um erro ao criar a conta";
            
            if (error.code === "auth/email-already-in-use") {
                errorMessage = "Este email já está em uso";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Email inválido";
            } else if (error.code === "auth/weak-password") {
                errorMessage = "A senha deve ter pelo menos 6 caracteres";
            }
            
            Alert.alert("Erro", errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.fullScreen}>
            <StatusBar translucent backgroundColor="transparent" />

            {/* Background Gradient */}
            <LinearGradient
                colors={["#ec17ff", "#42ff99"]}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {!isKeyboardVisible && (
                <Text style={styles.title}>Criar Conta</Text>
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
                    >
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Nome completo"
                            placeholderTextColor="rgba(97, 97, 97, 0.7)"
                            style={styles.input}
                            autoCapitalize="words"
                        />
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
                        <TextInput
                            secureTextEntry={true}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirmar senha"
                            placeholderTextColor="rgba(97, 97, 97, 0.7)"
                            style={styles.input}
                            autoCapitalize="none"
                        />
                        
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
                    </KeyboardAvoidingView>
                </LinearGradient>
            </View>
        </View>
    );
}

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
        zIndex: 10,
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
    },
    buttonText: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
    },
});