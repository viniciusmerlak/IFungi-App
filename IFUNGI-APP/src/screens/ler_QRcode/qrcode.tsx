import { useState, useEffect } from "react";
import { Dimensions, Alert, Vibration, View, Text } from "react-native";
import { Camera, CameraView } from "expo-camera";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useNavigation } from "@react-navigation/native";

const QRScanner: React.FC = () => {
  const [hasCameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const audioPermission = await Camera.requestMicrophonePermissionsAsync();

      setCameraPermission(cameraPermission.status === "granted");
      setAudioPermission(audioPermission.status === "granted");
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    if (hasCameraPermission !== null && hasAudioPermission !== null) {
      if (!hasCameraPermission || !hasAudioPermission) {
        Alert.alert(
          "Permissões necessárias",
          "Você precisa permitir acesso à câmera e ao microfone.",
          [
            { text: "Ir para configurações", onPress: goToSettings },
            {
              text: "Cancelar",
              onPress: () => router.back(),
              style: "cancel",
            },
          ]
        );
      }
    }
  }, [hasCameraPermission, hasAudioPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate();
    
    // Navega para Home passando o dado escaneado como parâmetro
    navigation.navigate('Home', { qrData: data });
  };

  const goToSettings = () => {
    Linking.openSettings();
  };

  if (hasCameraPermission && hasAudioPermission) {
    return (
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={{ height: Dimensions.get("window").height }}
      />
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Solicitando permissões...</Text>
    </View>
  );
};

export default QRScanner;