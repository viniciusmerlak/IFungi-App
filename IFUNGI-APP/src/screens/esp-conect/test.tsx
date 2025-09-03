import { getDatabase, ref, get, update } from "firebase/database";
import { getAuth } from "firebase/auth";
import { Alert } from "react-native";

export const conectarEstufa = async (estufaId: string, navigation: any) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    Alert.alert("Erro", "Usuário não autenticado.");
    return;
  }

  const userId = user.uid;
  const db = getDatabase();

  const estufaRef = ref(db, `greenhouses/${estufaId}`);
  const snapshot = await get(estufaRef);

  if (!snapshot.exists()) {
    Alert.alert("Erro", "Estufa não encontrada.");
    return;
  }

  const data = snapshot.val();

  const isOwner = data.owner === userId;
  const isShared = data.sharedWith && data.sharedWith[userId];

  if (!isOwner && !isShared) {
    Alert.alert("Acesso negado", "Você não tem permissão para essa estufa.");
    return;
  }

  // Atualiza quem está conectado
  await update(ref(db, `users/${userId}`), {
    currentGreenhouse: estufaId
  });

  await update(ref(db, `greenhouses/${estufaId}`), {
    currentUser: userId
  });

  // Redireciona para tela de monitoramento
  navigation.navigate("Monitoramento", { estufaId });
};
// Removed the undefined 'Teste' export
export default conectarEstufa;