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

type RootStackParamList = {
  Home: { qrData?: string };
  Monitoramento: { estufaId: string };
  QRCode: undefined;
};

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

const ConectarEstufaScreen: React.FC = () => {
  const [estufaId, setEstufaId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<import('@react-navigation/native').NavigationProp<RootStackParamList>>();
  const route = useRoute<HomeScreenRouteProp>();

  // Memoize the function to prevent unnecessary recreations
  const updateNavigation = useCallback((qrData: string) => {
    setEstufaId(qrData);
  }, []);

  useEffect(() => {
    if (route.params?.qrData) {
      updateNavigation(route.params.qrData);
    }
  }, [route.params, updateNavigation]);

  const verifyPermissions = async (userId: string, estufaId: string) => {
    const db = getDatabase();
    
    // Execute both requests in parallel
    const [estufaSnapshot, userSnapshot] = await Promise.all([
      get(ref(db, `estufas/${estufaId}`)),
      get(ref(db, `Usuarios/${userId}`))
    ]);

    if (!estufaSnapshot.exists()) {
      throw new Error("Estufa não encontrada.");
    }

    if (!userSnapshot.exists()) {
      throw new Error("Usuário não encontrado no banco de dados.");
    }

    const userData = userSnapshot.val();
    const estufasPermitidas = userData["Estufas permitidas"];

    if (!estufasPermitidas || !estufasPermitidas.includes(estufaId)) {
      throw new Error("Você não tem permissão para essa estufa.");
    }

    return { estufaSnapshot, userSnapshot };
  };

  const updateConnectionInfo = async (userId: string, estufaId: string) => {
    const db = getDatabase();
    
    // Execute both updates in parallel
    await Promise.all([
      update(ref(db, `Usuarios/${userId}`), {
        currentGreenhouse: estufaId,
      }),
      update(ref(db, `estufas/${estufaId}`), {
        currentUser: userId,
      })
    ]);
  };

  const connectToESP32 = async (userId: string) => {
    try {
      const esp32Ip = "192.168.4.1";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`http://${esp32Ip}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `userId=${userId}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return await response.json();
    } catch (error) {
      console.log("Conexão direta falhou:", error);
      return null;
    }
  };

  const conectarEstufa = async () => {
    if (!estufaId.trim()) {
      Alert.alert("Erro", "Digite o ID da estufa.");
      return;
    }

    setIsLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setIsLoading(false);
      Alert.alert("Erro", "Usuário não autenticado.");
      return;
    }

    const userId = user.uid;

    try {
      // Tentativa de conexão direta com ESP32
      const espResponse = await connectToESP32(userId);

      if (espResponse?.success) {
        await updateConnectionInfo(userId, espResponse.greenhouseId);
        navigation.navigate("Monitoramento", { estufaId: espResponse.greenhouseId });
        setIsLoading(false);
        return;
      }

      // Conexão via Firebase
      await verifyPermissions(userId, estufaId);
      await updateConnectionInfo(userId, estufaId);
      navigation.navigate("Monitoramento", { estufaId });
    } catch (error: any) {
      Alert.alert("Erro", error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleConectar}>
          <Text style={styles.buttonText}>Conectar-se</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 150,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 30,
    fontSize: 16,
  },
  qrLabel: {
    color: "#fff",
    marginBottom: 10,
    fontWeight: "bold",
    fontSize: 24,
    textAlign: 'center',
  },
  qrIcon: {
    alignSelf: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0)",
    paddingVertical: 24,
    paddingHorizontal: 80,
    marginTop: 40,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: "#000",
  },
  buttonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 24,
  },
  loadingContainer: {
    marginTop: 40,
    paddingVertical: 24,
    paddingHorizontal: 80,
  },
});

export default ConectarEstufaScreen;