# 🍄 IFungi - Sistema de Monitoramento de Estufas Inteligentes

## 📖 Sobre o Projeto

O **IFungi** é um sistema completo de monitoramento e controle automatizado para estufas de cultivo de fungos. A solução integra tecnologias modernas para proporcionar um ambiente controlado e otimizado para o desenvolvimento de fungos, com monitoramento em tempo real e controle remoto.

**Componentes Principais:**
- **📱 Aplicativo Mobile** (React Native + TypeScript) - Interface de usuário intuitiva
- **🔌 Hardware ESP32** - Sistema embarcado com sensores e atuadores
- **☁️ Firebase Realtime Database** - Plataforma de comunicação em tempo real
- **📊 Dashboard** - Visualização completa e controle remoto

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Aplicativo    │◄──►│    Firebase      │◄──►│     ESP32       │
│ React Native    │    │  Realtime DB     │    │  + Sensores     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
    ┌────┴────┐             ┌────┴────┐             ┌────┴─────┐
    │ Usuário │             │  Cloud  │             │ circuito │
    │ Mobile  │             │ Storage │             │  Físico  │
    └─────────┘             └─────────┘             └──────────┘
```

### 🔄 Fluxo de Comunicação
1. **ESP32** coleta dados dos sensores e envia para o **Firebase**
2. **Firebase** sincroniza dados em tempo real com o **Aplicativo Mobile**
3. **Aplicativo** exibe dados e permite controle dos atuadores (modo DEV)
4. **Comandos do usuário** são enviados via Firebase para o ESP32 (setpoints e debug_mode)

## 📱 Telas do Aplicativo

### 🔐 **Tela de Login**
- Autenticação segura de usuários
- Validação de credenciais

### 📊 **Tela de Monitoramento**
- Dashboard com gráficos em tempo real
- Visualização de todos os sensores
- Histórico de dados(grafico)

### ⚙️ **Tela de Estado da Estufa**
- Controle automático de atuadores
- Status em tempo real dos dispositivos

### 🔧 **Tela de Configurações**
- Ajuste de setpoints e limites
- Secret do modo DEV (pressionando o cabeçalho 5x)

### 🛠️ **Modo Desenvolvedor**
- Controle avançado para testes
- Controle individual de cada pino
- Leitura e envio de sinal para cada pino

## 🔌 Hardware ESP32

### 🎯 **Sensores Implementados**
- **🌡️ Temperatura DHT22** - Monitoramento térmico preciso
- **💧 Umidade DHT22** - Controle de humidade relativa
- **💡 Luminosidade LDR** - Medição de intensidade luminosa (Lux)
- **🌫️ CO₂ CCS-811** - Monitoramento de dióxido de carbono
- **⚠️ CO MQ-7** - Detecção de monóxido de carbono
- **🧪 TVOCs CCS-811** - Compostos orgânicos voláteis

### ⚡ **Atuadores Controlados**
- **❄️ Pastilha Peltier** - Controle de temperatura bidirecional
- **💨 Umidificador** - Regulação de humidade
- **🌪️ Exaustor** - Ventilação e renovação de ar 
- **🚪 Servo Motor** - Controle da "Blast Door" (porta que liga o ambiente interno ao exaustor)

### 📡 **Comunicação**
- **WiFi** - Conexão com a internet
- **Firebase SDK** - Integração com a nuvem

## ☁️ Integração Firebase

### 🔥 **Realtime Database**
- Sincronização em tempo real bidirecional
- Estrutura de dados otimizada
- Escalabilidade automática

### 🔐 **Authentication**
- Gerenciamento seguro de usuários
- Múltiplos métodos de login
- Controle de permissões

### 🗄️ **Estrutura de Dados**

```json
{
  "greenhouses": {
    "IFUNGI-001": {
      "sensores": {
        "temperatura": 23.5,
        "umidade": 85,
        "luminosidade": 500,
        "co2": 400,
        "co": 50,
        "tvocs": 120,
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "atuadores": {
        "rele1": true,    // Climatizador
        "rele2": false,   // Modo aquecimento/resfriamento
        "rele3": true,    // Umidificador
        "rele4": false,   // Exaustor
        "leds": {
          "ligado": true,
          "watts": 150,
          "intensidade": 75
        },
        "servo": {
          "posicao": 90,
          "aberto": true
        }
      },
      "setpoints": {
        "tMax": 24,
        "tMin": 18,
        "uMin": 85,
        "uMax": 93,
        "lux": 200,
        "co2Max": 1000
      },
      "configuracoes": {
        "modo_auto": true,
        "notificacoes": true,
        "intervalo_leitura": 30000
      }
    }
  }
}
```

## 🚀 Instalação e Desenvolvimento

### 📋 **Pré-requisitos**
- Node.js 16+
- npm ou yarn
- Expo CLI    (caso utilize expo go instale o SDK 52!!!)
- Android Studio / Xcode (para emuladores)

### 🛠️ **Configuração do Projeto**

```bash
# Clonar o repositório
git clone https://github.com/viniciusmerlak/IFungi-App.git
cd IFUNGI-APP

# Instalar dependências
npm install

# Instalar Expo CLI globalmente (se necessário)
npm install -g expo-cli

# A API key esta hard-coded por enquanto para testes (porfavor nao delete meu BD)
```

### 🎯 **Comandos de Desenvolvimento**

```bash
# Executar em modo desenvolvimento
npm start
# ou
expo start

# Executar no emulador Android
npm run android
expo run:android

# Executar no iOS
npm run ios
expo run:ios

# Build para produção
npm run build
expo build:android
expo build:ios

# Gerar documentação
npm run docs

# Servir documentação localmente LEIA!!!!!!!!!!!!
npm run docs:serve     

# Executar testes
npm test


```
### 🎯 **Release**

Acesse a pasta na raiz do projeto APK_REALEASE_ANDROID e instale no seu dispositivo móvel ou emulador o apk "IFUNGI_SETUP.apk"

## 📁 Estrutura do Projeto

```
IFungi/
├── 📁 .expo/                          # Cache e configurações do Expo
├── 📁 android/                        # Build e configurações Android
├── 📁 APK_RELEASE_ANDROID/            # APKs gerados para distribuição
├── 📁 assets/                         # Recursos estáticos
│   ├── 📁 images/                     # Imagens e ícones
│   └── 📁 fonts/                      # Fontes customizadas
├── 📁 build/                          # Arquivos de build (gerados)
├── 📁 docs/                           # Documentação gerada
├── 📁 docs-test/                      # Documentação de teste
├── 📁 ios/                            # Build e configurações iOS
├── 📁 node_modules/                   # Dependências do projeto
├── 📁 scripts/                        # Scripts personalizados
├── 📁 src/                            # Código fonte principal
│   ├── 📁 screens/                    # Telas do aplicativo
│   │   ├── 📁 config/                 # Telas de definição de setpoints e devTools
│   │   ├── 📁 esp-conect/             # Conexão com ESP32
│   │   ├── 📁 home/                   # Tela inicial/dashboard de monitoramento e estado da estufa
│   │   ├── 📁 ler_QRcode/             # Leitor QR Code (é um componente)
│   │   ├── 📁 Login/                  # Telas de autenticação
│   │   │   └── 📁 Criar_Conta/        # Tela de criação de conta de usuário
│   │   └── 📁 SplashScreen/           # Tela de abertura
│   ├── 📁 services/                   # Serviços externos, firebase e storage local
│   ├── 📁 styles/                     # Estilos e temas das telas
│   │   ├── 📁 config/                 
│   │   ├── 📁 estado_estufa/          
│   │   └── 📁 monitoramento/          
│   └── 📁 types/                      # Definições TypeScript e Definições da documentação(muito perfeita alias)
├── 📄 .gitattributes                  # Configurações Git
├── 📄 .gitignore                      # Arquivos ignorados pelo Git
├── 📄 app.json                        # Configuração Expo
├── 📄 App.tsx                         # Componente principal
├── 📄 eas.json                        # Configuração EAS Build
├── 📄 jsdoc.config.json               # Configuração JSDoc
├── 📄 metro.config.js                 # Configuração Metro Bundler
├── 📄 package-lock.json               # Lock das dependências
├── 📄 package.json                    # Dependências e scripts
├── 📄 README.md                       # Documentação principal
├── 📄 tsconfig.json                   # Configuração TypeScript
└── 📄 typedoc.json                    # Configuração TypeDoc
```

## 🔐 Segurança

### 🛡️ **Medidas de Segurança Implementadas**

- **🔐 Autenticação Firebase** - Sistema seguro de login
- **👥 Controle de Permissões** - Acesso baseado em roles
- **📝 Validação de Dados** - Verificação de entrada e saída
- **⏱️ Timeout de Conexão** - Prevenção de sessões órfãs
- **🔒 Criptografia** - Dados sensíveis protegidos
- **📊 Auditoria** - Logs de acesso e modificações

### 🚨 **Políticas de Segurança Firebase**

```javascript
// Por enquanto ta tudo liberado
{
  "rules": {
    "greenhouses": {
      "$greenhouseId": {
        ".read": "auth != null && auth.token.greenhouses.contains($greenhouseId)",
        ".write": "auth != null && auth.token.greenhouses.contains($greenhouseId)"
      }
    }
  }
}
```

## 📈 Monitoramento e Métricas

### 📊 **Métricas Coletadas**
- Temperatura ambiente (°C)
- Umidade relativa do ar(%)
- Intensidade luminosa (aproximado LUX)
- Níveis de CO₂ (ppm)
- Presença de CO (ppm)
- Compostos orgânicos voláteis (ppb)
- Consumo energético dos leds(W)
- Status dos atuadores





### 🐛 **Reportar Bugs**
Use o template de issues do GitHub incluindo:
- Versão do aplicativo
- Passos para reproduzir
- Comportamento esperado vs atual
- Logs e screenshots

## 📄 Licença

Este projeto está licenciado sob a GPL-3.0 license - veja o arquivo [LICENSE](LICENSE) para detalhes.

##  Contato

**Desenvolvido por:** Vinicius Alexandre Merlak
**Email:** viniciusmerlak@gmail.com  
**Documentação:** clone o repositorio e instale o JSDoc e gere a documentação ```npx typedoc src/types/documentation.ts --out docs-test ``` e abra no seu navegador com ```npm run docs:serve ```

---

*Última atualização: 22/11/2025*  
*Versão: 1.0.0*
