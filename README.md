# IFUNGI - Estufa Automatizada de Baixo Custo para Cogumelos


## 📋 Sobre o Projeto

O IFUNGI é um sistema de estufa automatizada de baixo custo desenvolvida para o cultivo otimizado de cogumelos. O projeto combina hardware acessível com uma aplicação mobile intuitiva para monitoramento e controle remoto das condições ambientais da estufa.

## ✨ Funcionalidades

- **Autenticação Segura**: Sistema de login com Firebase Authentication
- **Monitoramento em Tempo Real**: Acompanhamento de temperatura, umidade, luminosidade e qualidade do ar
- **Controle Remoto**: Configuração de parâmetros ideais para cultivo de cogumelos
- **Conexão por QR Code**: Vinculação fácil de dispositivos através de leitura de QR Code
- **Persistência de Dados**: Lembrar credenciais e conexões anteriores
- **Interface Intuitiva**: Design amigável com gradientes e animações suaves

## 🛠️ Tecnologias Utilizadas

### Frontend Mobile
- **React Native** com Expo
- **TypeScript** para tipagem estática
- **React Navigation** para navegação entre telas
- **Firebase** para autenticação e banco de dados em tempo real
- **Expo Linear Gradient** para elementos visuais
- **Async Storage** para persistência local de dados

### Hardware/Embarcado
- Microcontrolador ESP32
- Sensores de temperatura e umidade (DHT22)
- Sensor de qualidade do ar (MQ-135)
- Sensor de luminosidade (LDR)
- Módulo WiFi para conectividade
- Atuadores para controle de ambiente


## 🔧 Configuração e Instalação

### Pré-requisitos
- Node.js (versão 16 ou superior)
- Expo CLI (`npm install -g expo-cli`)
- Conta no Firebase
- Dispositivo móvel com Expo Go ou emulador

### Passos para Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/ifungi.git
cd ifungi
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o Firebase:
   - Crie um projeto no Firebase Console
   - Ative Authentication e Realtime Database
   - Copie as configurações para `src/services/FirebaseConfig.ts`

4. Execute o projeto:
```bash
expo start
```

5. Escaneie o QR Code com o app Expo Go ou execute em emulador


## 🌡️ Parâmetros Controlados

O sistema IFUNGI permite monitorar e ajustar:

- **Temperatura**: Ideal entre 18°C e 24°C
- **Umidade**: Mantida entre 85% e 93%
- **Luminosidade**: Controlada conforme necessidade
- **Qualidade do Ar**: Monitores de CO, CO₂ e TVOCs
- **Ventilação**: Controle de trocas gasosas

## 🤝 Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- [Vinicius Alexandre Merlak] - [vinciusmerlak@gmail.com]

## 🙏 Agradecimentos

- Agradecemos ao [IFPR]pelo apoio ao projeto
- À comunidade React Native e Expo pela documentação excelente
- Aos desenvolvedores dos pacotes e bibliotecas utilizadas

---

**IFUNGI** - Cultivo inteligente de cogumelos ao alcance de todos 🌱🍄
