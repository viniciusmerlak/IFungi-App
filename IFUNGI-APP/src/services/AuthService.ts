/**
 * Serviço de Autenticação e Gerenciamento de Sessão
 * @class AuthService
 * @static
 * @property {string} ACTIVE_SESSION_KEY - Chave para armazenamento da sessão
 * @property {string} CREDENTIALS_KEY - Chave para armazenamento de credenciais
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, update } from 'firebase/database';
import { FIREBASE_AUTH } from './FirebaseConfig';
import { signOut } from 'firebase/auth';

export class AuthService {
  private static readonly ACTIVE_SESSION_KEY = 'active_session';
  private static readonly CREDENTIALS_KEY = 'user_credentials';

  static async saveActiveSession(userId: string, estufaId?: string): Promise<void> {
    try {
      const sessionData = {
        isLoggedIn: true,
        userId: userId,
        userEstufa: estufaId || null,
        timestamp: Date.now() 
      };
      
      console.log('AuthService: Salvando sessão:', {
        ...sessionData,
        timestampReadable: new Date(sessionData.timestamp).toISOString()
      });
      
      await AsyncStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('AuthService: Erro ao salvar sessão:', error);
      throw error;
    }
  }

  static async checkActiveSession(): Promise<{
    isLoggedIn: boolean;
    userId: string | null;
    userEstufa: string | null;
    timestamp: number;
  } | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(this.ACTIVE_SESSION_KEY);
      
      if (!sessionJson) {
        console.log('AuthService: Nenhuma sessão encontrada no AsyncStorage');
        return null;
      }

      const session = JSON.parse(sessionJson);
      console.log('AuthService: Sessão recuperada:', session);
      
      // Verificar se a sessão não expirou (30 dias)
      const now = Date.now();
      const sessionAge = now - session.timestamp;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      
      if (sessionAge > thirtyDays) {
        console.log('AuthService: Sessão expirada');
        await this.clearActiveSession();
        return null;
      }

      // Verificar se o usuário ainda está autenticado no Firebase
      const auth = FIREBASE_AUTH;
      const currentUser = auth.currentUser;
      
      if (!currentUser || currentUser.uid !== session.userId) {
        console.log('AuthService: Usuário não autenticado no Firebase');
        await this.clearActiveSession();
        return null;
      }

      console.log('AuthService: Sessão válida encontrada');
      return session;
      
    } catch (error) {
      console.error('AuthService: Erro ao verificar sessão:', error);
      await this.clearActiveSession();
      return null;
    }
  }

  // Sair da estufa - CORRIGIDO
  static async leaveEstufa(estufaId: string): Promise<void> {
    try {
      console.log('AuthService: Saindo da estufa:', estufaId);
      
      // Atualizar sessão removendo a estufa
      const currentSession = await this.checkActiveSession();
      if (currentSession?.isLoggedIn) {
        const updatedSession = {
          ...currentSession,
          userEstufa: null,
          timestamp: Date.now() // Atualizar timestamp
        };
        await AsyncStorage.setItem(this.ACTIVE_SESSION_KEY, JSON.stringify(updatedSession));
        console.log('AuthService: Sessão atualizada sem estufa');
      }
      
      // Limpar conexão no Firebase
      try {
        const db = getDatabase();
        await update(ref(db, `greenhouses/${estufaId}`), {
          currentUser: null
        });
        console.log('AuthService: Conexão da estufa removida no Firebase');
      } catch (firebaseError) {
        console.error('AuthService: Erro ao remover conexão no Firebase:', firebaseError);
      }
      
    } catch (error) {
      console.error('AuthService: Erro ao sair da estufa:', error);
      throw error;
    }
  }

  // Logout completo - CORRIGIDO
  static async logout(estufaId?: string): Promise<void> {
    try {
      console.log('AuthService: Iniciando logout completo');
      
      // Se tem estufaId, limpar conexão no Firebase
      if (estufaId) {
        try {
          const db = getDatabase();
          await update(ref(db, `greenhouses/${estufaId}`), {
            currentUser: null
          });
          console.log('AuthService: Conexão da estufa removida:', estufaId);
        } catch (firebaseError) {
          console.error('AuthService: Erro ao remover conexão da estufa:', firebaseError);
        }
      }

      // Fazer logout do Firebase Auth
      try {
        await signOut(FIREBASE_AUTH);
        console.log('AuthService: Logout do Firebase realizado');
      } catch (authError) {
        console.error('AuthService: Erro no logout do Firebase:', authError);
      }

      // Limpar sessão local
      await this.clearActiveSession();
      await this.clearCredentials();
      
      console.log('AuthService: Logout completo realizado com sucesso');
      
    } catch (error) {
      console.error('AuthService: Erro no logout completo:', error);
      // Mesmo com erro, limpa a sessão local
      await this.clearActiveSession();
      throw error;
    }
  }

  // Limpar sessão ativa
  static async clearActiveSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ACTIVE_SESSION_KEY);
      console.log('AuthService: Sessão limpa do AsyncStorage');
    } catch (error) {
      console.error('AuthService: Erro ao limpar sessão:', error);
    }
  }

  // Salvar credenciais
  static async saveCredentials(email: string, password: string): Promise<void> {
    try {
      const credentials = {
        email,
        password,
        rememberMe: true,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
    }
  }

  // Recuperar credenciais
  static async getSavedCredentials(): Promise<{ email: string; password: string; rememberMe: boolean } | null> {
    try {
      const credentialsJson = await AsyncStorage.getItem(this.CREDENTIALS_KEY);
      return credentialsJson ? JSON.parse(credentialsJson) : null;
    } catch (error) {
      console.error('Erro ao recuperar credenciais:', error);
      return null;
    }
  }

  // Limpar credenciais
  static async clearCredentials(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CREDENTIALS_KEY);
    } catch (error) {
      console.error('Erro ao limpar credenciais:', error);
    }
  }
}