import { useState, useEffect } from "react";
import { 
  Dimensions, 
  Alert, 
  Vibration, 
  View, 
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Configurações de dimensão da tela
 */
const { width, height } = Dimensions.get('window');

/**
 * Componente de scanner de QR Code
 * @component
 * @returns {JSX.Element} Componente do scanner
 */
const QRScanner: React.FC = () => {
  const [hasCameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation<any>();

  /**
   * Solicita permissões de câmera ao montar o componente
   * @effect
   */
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(status === "granted");
        console.log('Permissão da câmera:', status);
      } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
        setCameraPermission(false);
      }
    };

    requestPermissions();
  }, []);

  /**
   * Processa o QR Code escaneado
   * @param {Object} param0 - Objeto com dados do QR Code
   * @param {string} param0.data - Dados do QR Code
   * @async
   */
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(Platform.OS === 'android' ? 100 : 400);
    
    console.log('QR Code escaneado:', data);
    
    // Navegar de volta para Home com os dados do QR Code
    navigation.navigate('ConectarDispositivo', { qrData: data });
  };

  /**
   * Renderização quando permissão está sendo solicitada
   */
  if (hasCameraPermission === null) {
    return (
      <LinearGradient colors={["#fda4af", "#f0abfc"]} style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.text}>Solicitando permissão da câmera...</Text>
        </View>
      </LinearGradient>
    );
  }

  /**
   * Renderização quando permissão foi negada
   */
  if (hasCameraPermission === false) {
    return (
      <LinearGradient colors={["#fda4af", "#f0abfc"]} style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.text}>Sem acesso à câmera</Text>
          <Text style={styles.subText}>É necessário permitir o acesso à câmera para escanear QR Codes</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  /**
   * Renderização principal com câmera ativa
   */
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#fda4af", "#f0abfc"]} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Escanear QR Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "pdf417"],
            }}
            style={styles.camera}
          />
          
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.helpText}>
              Aponte para o QR Code da estufa
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

/**
 * Estilos do componente QR Scanner
 * @namespace
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgb(0, 0, 0)',
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  headerText: {
    fontSize: Platform.OS === 'ios' ? 20 : 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 50,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  helpText: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 16 : 14,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRScanner;