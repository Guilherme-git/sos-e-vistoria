# CLAUDE.md - App SOS Vistoria (React Native)

## Visão Geral do Projeto

Este projeto é uma **migração e unificação** de dois aplicativos Flutter para React Native:

1. **App Guincho** (Tow Truck Driver) - Motoristas de guincho/reboque
2. **App Vistoria** (Inspector) - Vistoriadores técnicos

O aplicativo React Native está sendo construído para substituir ambas as aplicações Flutter, mantendo todas as funcionalidades e melhorando a experiência do usuário.

### Stack Tecnológico

- **Framework**: React Native + Expo
- **Linguagem**: TypeScript
- **State Management**: Context API (AuthContext, CallsContext, InspectionContext)
- **Roteamento**: Expo Router (file-based routing)
- **UI**: React Native Paper + componentes customizados
- **HTTP Client**: TanStack Query (React Query)
- **Banco Local**: Drizzle ORM + SQLite
- **Backend**: Node.js + Express + Prisma ORM + MySQL 8.0

---

## Configuração do Ambiente de Desenvolvimento

### Requisitos

- **Node.js**: v20+ (obrigatório para React Native 0.81+)
- **npm**: v9+
- **Android Studio**: Para emulador Android
- **WSL2** (se estiver no Windows): Recomendado para desenvolvimento

### 1. Instalação de Dependências

```bash
# Clonar o repositório
cd /mnt/c/Users/Growth/Documents/Utiliza/app_sos_vistoria

# Instalar dependências
npm install

# Tempo estimado: 3-5 minutos
# Pacotes instalados: ~1065 pacotes
```

### 2. Problema: Node.js 18 vs Node.js 20+

**Sintoma:**
```
TypeError: configs.toReversed is not a function
```

**Causa:**
O método `.toReversed()` foi introduzido no ECMAScript 2023 e só está disponível no Node.js 20+. O projeto usa React Native 0.81 e Expo 54, que requerem Node.js 20.19.4+.

**Solução A - Atualizar Node.js (Recomendado):**
```bash
# Usando nvm
nvm install 20
nvm use 20

# Verificar versão
node --version  # deve ser v20.x.x
```

**Solução B - Polyfill para Node.js 18 (Temporário):**

Se não puder atualizar o Node.js imediatamente, adicione este polyfill no `metro.config.js`:

```javascript
// Polyfill para Node.js 18 (toReversed não existe antes do Node 20)
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return this.slice().reverse();
  };
}

const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
module.exports = config;
```

⚠️ **Importante:** Este polyfill é uma solução temporária. Atualize para Node.js 20+ o quanto antes.

### 3. Configuração do Android SDK no WSL (Windows)

Se você está usando WSL2 no Windows com Android Studio instalado no Windows, siga estes passos:

#### 3.1. Verificar Localização do Android SDK

O Android SDK geralmente está em:
```
C:\Users\{SEU_USUARIO}\AppData\Local\Android\Sdk
```

No WSL, esse caminho é:
```
/mnt/c/Users/{SEU_USUARIO}/AppData/Local/Android/Sdk
```

#### 3.2. Configurar Variáveis de Ambiente

Adicione ao `~/.bashrc` (ou `~/.zshrc` se usar Zsh):

```bash
# Android SDK Configuration (WSL)
export ANDROID_HOME=/mnt/c/Users/Growth/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Android SDK Aliases (WSL -> Windows executables)
alias adb='adb.exe'
alias emulator='emulator.exe'
alias avdmanager='avdmanager.bat'
alias sdkmanager='sdkmanager.bat'
```

Recarregar configurações:
```bash
source ~/.bashrc
```

#### 3.3. Criar Wrappers para Executáveis do Windows

**Problema:** O Expo CLI tenta executar `adb` mas no Windows o executável é `adb.exe`. Além disso, o `adb.exe` não entende caminhos do WSL (ex: `/home/user/...`).

**Solução:** Criar scripts wrapper que:
1. Convertem caminhos WSL para Windows
2. Chamam os executáveis `.exe` corretos

**Wrapper 1: ~/.local/bin/adb**
```bash
#!/bin/bash
DIR="$HOME/.local/bin"

# Converter argumentos de caminhos WSL para Windows
args=()
for arg in "$@"; do
  if [[ "$arg" == /home/* ]] || [[ "$arg" == /tmp/* ]] || [[ "$arg" == /mnt/* ]]; then
    # Converter caminho WSL para Windows
    win_path=$(wslpath -w "$arg" 2>/dev/null || echo "$arg")
    args+=("$win_path")
  else
    args+=("$arg")
  fi
done

# Executar adb.exe com os argumentos convertidos
/mnt/c/Users/Growth/AppData/Local/Android/Sdk/platform-tools/adb.exe "${args[@]}"
```

**Wrapper 2: /mnt/c/Users/Growth/AppData/Local/Android/Sdk/platform-tools/adb**

Este wrapper é necessário porque o Expo usa o caminho completo do `ANDROID_HOME`:

```bash
#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Converter argumentos de caminhos WSL para Windows
args=()
for arg in "$@"; do
  if [[ "$arg" == /home/* ]] || [[ "$arg" == /tmp/* ]] || [[ "$arg" == /mnt/* ]]; then
    win_path=$(wslpath -w "$arg" 2>/dev/null || echo "$arg")
    args+=("$win_path")
  else
    args+=("$arg")
  fi
done

"$DIR/adb.exe" "${args[@]}"
```

**Criar os wrappers:**
```bash
# Wrapper no ~/.local/bin (já deve estar no PATH)
mkdir -p ~/.local/bin
cat > ~/.local/bin/adb << 'EOF'
#!/bin/bash
args=()
for arg in "$@"; do
  if [[ "$arg" == /home/* ]] || [[ "$arg" == /tmp/* ]] || [[ "$arg" == /mnt/* ]]; then
    win_path=$(wslpath -w "$arg" 2>/dev/null || echo "$arg")
    args+=("$win_path")
  else
    args+=("$arg")
  fi
done
/mnt/c/Users/Growth/AppData/Local/Android/Sdk/platform-tools/adb.exe "${args[@]}"
EOF
chmod +x ~/.local/bin/adb

# Wrapper no platform-tools
cat > /mnt/c/Users/Growth/AppData/Local/Android/Sdk/platform-tools/adb << 'EOF'
#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
args=()
for arg in "$@"; do
  if [[ "$arg" == /home/* ]] || [[ "$arg" == /tmp/* ]] || [[ "$arg" == /mnt/* ]]; then
    win_path=$(wslpath -w "$arg" 2>/dev/null || echo "$arg")
    args+=("$win_path")
  else
    args+=("$arg")
  fi
done
"$DIR/adb.exe" "${args[@]}"
EOF
chmod +x /mnt/c/Users/Growth/AppData/Local/Android/Sdk/platform-tools/adb

# Wrapper para emulator
cat > ~/.local/bin/emulator << 'EOF'
#!/bin/bash
/mnt/c/Users/Growth/AppData/Local/Android/Sdk/emulator/emulator.exe "$@"
EOF
chmod +x ~/.local/bin/emulator
```

#### 3.4. Testar Configuração

```bash
# Verificar se adb funciona
adb version
# Android Debug Bridge version 1.0.41

# Verificar dispositivos conectados
adb devices
# List of devices attached
# emulator-5554	device

# Listar emuladores disponíveis
emulator -list-avds
```

### 4. Configurar e Rodar o Emulador Android

#### 4.1. Criar AVD (Android Virtual Device) - Se ainda não tiver

**Opção A: Via Android Studio (Recomendado)**
1. Abra Android Studio no Windows
2. Tools → Device Manager
3. Create Device
4. Selecione um dispositivo (ex: Pixel 5)
5. Selecione uma System Image (ex: Android 13 - API 33)
6. Finalize a configuração

**Opção B: Via Linha de Comando**
```bash
# Listar system images disponíveis
sdkmanager --list | grep system-images

# Baixar uma system image (se necessário)
sdkmanager "system-images;android-33;google_apis;x86_64"

# Criar AVD
avdmanager create avd -n MeuEmulador -k "system-images;android-33;google_apis;x86_64"
```

#### 4.2. Iniciar o Emulador

**Opção A: Via Android Studio**
- Tools → Device Manager → ▶️ Play no emulador desejado

**Opção B: Via Linha de Comando (WSL)**
```bash
# Listar emuladores
emulator -list-avds

# Iniciar emulador em background
emulator -avd Emulador &

# Verificar se está rodando
adb devices
# emulator-5554	device
```

### 5. Rodar o Aplicativo no Emulador

```bash
# 1. Certifique-se que o emulador está rodando
adb devices

# 2. Inicie o Metro Bundler
npm start

# 3. Quando o Metro estiver pronto, pressione 'a' para Android
# Ou use:
npm start -- --android

# 4. O Expo Go será instalado automaticamente no emulador
# Tempo de primeira instalação: ~30 segundos
# Tempo de build inicial: ~2-3 minutos

# 5. O app abrirá automaticamente no emulador
```

### 6. Problemas Comuns e Soluções

#### Erro: `configs.toReversed is not a function`
**Causa:** Node.js 18 não suporta `.toReversed()`
**Solução:** Adicionar polyfill no `metro.config.js` ou atualizar para Node.js 20+

#### Erro: `spawn adb ENOENT`
**Causa:** Expo não encontra o executável `adb`
**Solução:** Criar wrapper scripts conforme seção 3.3

#### Erro: `adb.exe: failed to stat /home/user/... No such file or directory`
**Causa:** `adb.exe` (Windows) não entende caminhos WSL
**Solução:** Usar wrapper que converte caminhos WSL para Windows

#### Erro: `Port 8081 is already in use`
**Causa:** Metro Bundler já está rodando
**Solução:**
```bash
# Matar processo na porta 8081
lsof -ti:8081 | xargs kill -9

# Ou
npx expo start --clear
```

#### Erro: `Emulador offline`
**Causa:** Emulador ainda está inicializando
**Solução:** Aguardar 30-60 segundos e verificar novamente com `adb devices`

#### Erro: `ANDROID_HOME not set`
**Causa:** Variável de ambiente não configurada
**Solução:** Adicionar `export ANDROID_HOME=...` no `~/.bashrc` e executar `source ~/.bashrc`

### 7. Scripts Úteis

```bash
# Ver logs do app em tempo real
adb logcat | grep -i "expo\|react"

# Limpar cache do Metro
npm start -- --clear

# Resetar porta do Metro
npx expo start --port 8082

# Reinstalar o app
adb uninstall host.exp.exponent
npm start -- --android

# Verificar uso de memória do emulador
adb shell dumpsys meminfo host.exp.exponent
```

### 8. Checklist de Configuração

Use este checklist para validar que tudo está configurado:

- [ ] Node.js 20+ instalado (`node --version`)
- [ ] Dependências instaladas (`npm install` executado com sucesso)
- [ ] Polyfill adicionado ao `metro.config.js` (se Node.js 18)
- [ ] `ANDROID_HOME` configurado no `~/.bashrc`
- [ ] Wrapper scripts criados para `adb` e `emulator`
- [ ] `adb devices` funciona e mostra emulador conectado
- [ ] `npm start` inicia o Metro Bundler sem erros
- [ ] Emulador Android está rodando e online
- [ ] Expo Go instalado no emulador
- [ ] App abre no emulador ao pressionar `a`

### 9. Estrutura de Ambiente (WSL + Windows)

```
Windows (C:\)
│
├── Users/Growth/
│   └── AppData/Local/Android/Sdk/     ← Android SDK
│       ├── platform-tools/
│       │   ├── adb.exe
│       │   └── adb                     ← Wrapper script
│       ├── emulator/
│       │   └── emulator.exe
│       └── cmdline-tools/
│
└── Users/Growth/Documents/Utiliza/
    └── app_sos_vistoria/               ← Projeto montado no WSL

WSL (Linux)
│
├── /home/guilherme/
│   ├── .bashrc                         ← Variáveis de ambiente
│   ├── .local/bin/
│   │   ├── adb                         ← Wrapper script
│   │   └── emulator                    ← Wrapper script
│   └── .expo/
│       └── android-apk-cache/
│           └── Expo-Go-54.0.6.apk      ← Expo Go APK
│
└── /mnt/c/Users/Growth/Documents/Utiliza/
    └── app_sos_vistoria/               ← Projeto (mount point)
```

### 10. Comandos de Desenvolvimento Diário

```bash
# 1. Iniciar emulador (se não estiver rodando)
emulator -avd Emulador &

# 2. Iniciar Metro Bundler
npm start

# 3. Abrir no emulador (pressionar 'a')
# Ou alternativamente:
npm run android

# 4. Ver logs
adb logcat -s ReactNativeJS:V

# 5. Recarregar app (no emulador)
# Pressione 'r' no terminal do Metro
# Ou 'RR' (duplo R) para force reload
```

---

## Arquitetura da API

### Base URLs

**Importante:** Este projeto possui uma **API unificada** que serve tanto o Guincheiro quanto o Vistoriador.

**Desenvolvimento:**
- Local: `http://10.0.2.2:3004` (Android Emulator)
- Local: `http://localhost:3004` (iOS Simulator)
- Código-fonte: `/var/www/utiliza/api_app_sos_vistoria`

**Produção (quando implantado):**
- API: `https://utiliza24h.com.br/api`
- AI Validator: `https://ia.growthsolutions.com.br/api/v1`
- Bucket S3: `https://growth-application-bucket.s3.sa-east-1.amazonaws.com`

### Autenticação

**Método:** JWT (Bearer Token)

```typescript
// Header
Authorization: Bearer {apiToken}

// Token Payload
{
  "id": "user-id",
  "email": "user@example.com",
  "type": "biker" | "towing_driver",
  "iat": 1702587600,
  "exp": 1703192400
}
```

**Fluxo de Autenticação:**

```
1. Verificar CPF/CNPJ
2. Enviar token por SMS/Email
3. Verificar token recebido
4. Login com credenciais
5. Receber JWT + User object
6. Armazenar token localmente
```

---

## Funcionalidades por Perfil de Usuário

### 🚛 Guincheiro (Tow Truck Driver)

#### Autenticação
- Login multi-etapa: CNPJ → Token (SMS/Email) → Registro de Motorista → Login
- Campos: CNPJ, CPF, Nome, Telefone, Senha

#### Dashboard
- **Aba 1: Lista de Chamados Finalizados**
  - Visualizar histórico de serviços
  - Status, cliente, endereço, data/hora

- **Aba 2: Perfil do Usuário**
  - Foto de perfil
  - Dados pessoais
  - Status (disponível/em serviço)
  - Empresa de guincho vinculada

#### Chamado Ativo
- **Aba Informações:**
  - Timeline visual de status
  - Dados do cliente (nome, telefone, CPF/CNPJ)
  - Dados do veículo (placa, marca, modelo, cor)
  - Endereços de coleta e entrega
  - Mapa de localização
  - Botões: WhatsApp, Telefone, Navegação

- **Aba Vistoria:**
  - **Check-in (Coleta):**
    - 4 fotos obrigatórias: Frente, Esquerda, Traseira, Direita
    - Fotos adicionais (dinâmicas)
    - Fotos de pertences do cliente
    - Assinatura digital do responsável
    - Observações

  - **Check-out (Entrega):**
    - Mesma estrutura do Check-in
    - Verificação de danos durante transporte

#### Status do Chamado (Guincho)
```typescript
enum CallStatus {
  waitingArrrivalToCheckin,      // Aguardando chegada no local de coleta
  inChecking,                    // Em vistoria (Check-in)
  waitingArrrivalToCheckout,     // Aguardando chegada no destino
  inCheckout,                    // Em vistoria (Check-out)
  waitingInShed,                 // Aguardando na garagem
  finished,                      // Concluído
  cancelled                      // Cancelado
}
```

#### Tipos de Serviço
- `towing` - Reboque completo
- `battery` - Bateria
- `tire_change` - Troca de pneu
- `locksmith` - Chaveiro
- `empty_tank` - Tanque vazio
- `other` - Outros

#### Rastreamento GPS
- Localização em tempo real via MQTT
- Atualização a cada 7 metros OU 2 segundos
- Serviço em background (foreground service no Android)
- Publicação: `towing-driver/{userId}/call/{callId}/call-trip/{tripId}/geolocation`

#### Endpoints Principais (Guincho)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/verify-cnpj` | Verificar CNPJ da empresa |
| POST | `/auth/send-auth-token` | Enviar token por SMS/Email |
| POST | `/auth/verify-auth-token` | Verificar token |
| POST | `/auth/login` | Login com CPF e senha |
| GET | `/call/{status}` | Listar chamados por status |
| PUT | `/call/{encryptedKey}/accept` | Aceitar chamado |
| PATCH | `/call/{callId}/status` | Atualizar status |
| POST | `/call/{callId}/inspection` | Enviar vistoria (FormData) |

---

### 🏍️ Vistoriador (Inspector/Biker)

#### Autenticação
- Login em 2 passos: CPF → Validação → Senha/Token
- Campos: CPF, Senha

#### Dashboard
- **Aba 1: Home**
  - Informações do usuário
  - Chamados disponíveis
  - Status (disponível/ocupado/indisponível)

- **Aba 2: Pagamentos**
  - Lista de faturas (pendentes/pagas)
  - Chaves PIX cadastradas
  - Comprovantes

- **Aba 3: Perfil**
  - Dados pessoais
  - Configurações

#### Vistoria (Expertise)
- **Seção 1: Informações do Chamado**
  - Endereço completo
  - Coordenadas GPS
  - Dados do associado/veículo
  - Observações

- **Seção 2: Vistoria Principal (Primary Expertise)**
  - **9 Imagens Obrigatórias:**
    1. CNH (Carteira de Habilitação) - Frente
    2. CRLV (Registro do Veículo) - Frente
    3. Placa do Veículo
    4. Veículo - Vista Frontal
    5. Veículo - Vista Lateral Esquerda
    6. Veículo - Vista Traseira
    7. Veículo - Vista Lateral Direita
    8. Via Pública (estrada/rua)
    9. Placa de Sinalização

  - **Áudio:** Relatório verbal (comentários)
  - **Vídeo:** Gravação de vídeo
  - **Validação com IA:** Em tempo real para cada imagem
    - PASS → Aceita imagem ✓
    - FAIL (1ª tentativa) → Tirar outra
    - FAIL (2ª tentativa) → Permite enviar mesmo assim

- **Seção 3: Vistoria Secundária (Secondary Expertise)**
  - Formulário complementar
  - Imagens adicionais
  - Informações de testemunhas

#### Status do Chamado (Vistoria)
```typescript
enum CallStatus {
  waiting_arrival,                // Aguardando chegada ao local
  in_primary_expertise_step,      // Em vistoria principal
  in_secondary_expertise_step,    // Em vistoria secundária
  approved,                       // Concluído e aprovado
  cancelled                       // Cancelado
}
```

#### Sistema de Chamados
- Recebimento via MQTT em tempo real
- Prazo de aceitação: 30 segundos
- Múltiplas solicitações para vistoriadores próximos
- Primeiro que aceita fica com o chamado

#### Rastreamento GPS
- Atualização a cada 10 metros OU 10 segundos
- Serviço em background
- Notificação persistente de localização ativa
- Publicação: `biker/{userId}/geolocation`

#### Endpoints Principais (Vistoria)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/verify-cpf` | Verificar CPF |
| POST | `/auth/login` | Login com CPF e senha |
| POST | `/auth/logout` | Logout |
| PATCH | `/calls/{callId}/status` | Atualizar status do chamado |
| POST | `/calls/{callId}/expertises/batch` | Enviar vistoria principal (SSE) |
| POST | `/calls/{callId}/expertises` | Enviar vistoria secundária |
| GET | `/bikers/{bikerId}/bills` | Listar pagamentos |
| GET | `/bikers/{bikerId}/pix-key` | Obter chave PIX |
| POST | `/bikers/{bikerId}/pix-key` | Cadastrar chave PIX |

---

## Modelos de Dados

### User (Usuário)

**Guincheiro:**
```typescript
interface TowingDriver {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  email?: string;
  profileImagePath?: string;
  status: 'available' | 'in_service' | 'banned';
  apiToken: string;
  towingProvider: {
    id: string;
    fantasyName: string;
    cnpj: string;
  };
}
```

**Vistoriador:**
```typescript
interface Biker {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnh: string;
  status: 'available' | 'busy' | 'not_available' | 'inactive';
  apiToken: string;
  firebaseToken?: string;
}
```

### Call (Chamado)

```typescript
interface Call {
  id: string;

  // Atribuições
  bikerId?: string;                    // Para vistoria
  towingDriverId?: string;              // Para guincho

  // Localização
  address: string;
  latitude: number;
  longitude: number;
  uf?: string;
  city?: string;

  // Status
  status: CallStatus;                   // Vistoria
  towingStatus?: CallTowingStatus;      // Guincho

  // Dados do associado/veículo
  associateCarInfo: {
    associate: {
      name: string;
      cpf: string;
      phone: string;
    };
    vehicle: {
      plate: string;
      brand: string;
      model: string;
      year: string;
      color: string;
      category: string;
    };
  };

  // Viagens (para guincho)
  trips?: Trip[];

  // Tipo de serviço (para guincho)
  serviceType?: ServiceType;

  // Observações
  observation?: string;

  // Timestamps
  createdAt: Date;
  bikerAcceptedAt?: Date;
  bikerArrivedAt?: Date;
  bikerFinishedAt?: Date;
  towingDriverAcceptedAt?: Date;
  towingDriverFinishedAt?: Date;
}
```

### Trip (Viagem - Guincho)

```typescript
interface Trip {
  id: string;
  type: 'towingCollect' | 'towingDelivery';
  status: 'pending' | 'in_progress' | 'finished' | 'cancelled';

  destination: {
    address: string;
    latitude: number;
    longitude: number;
  };

  observation?: string;
  startedAt?: Date;
  arrivedAt?: Date;
  finishedAt?: Date;
}
```

### Inspection (Vistoria - Guincho)

```typescript
interface Inspection {
  id: string;
  callId: string;
  type: 'checkin' | 'checkout';

  vehiclePhotos: VehiclePhoto[];        // 4 obrigatórias + dinâmicas
  belongings: BelongsPhoto[];           // Pertences (opcional)
  signature: File;                      // Assinatura (obrigatória)
  destinationType: 'workshop' | 'residence' | 'other';
  observation?: string;

  location: {
    latitude: number;
    longitude: number;
  };

  createdAt: Date;
}

interface VehiclePhoto {
  fileType: 'vehicle_front_side_image' |
            'vehicle_left_side_image' |
            'vehicle_rear_side_image' |
            'vehicle_right_side_image' |
            'dynamic_image';
  file: File;
}
```

### Expertise (Vistoria - Vistoriador)

```typescript
interface PrimaryExpertise {
  expertisePersonType: 'biker' | 'passenger' | 'third_party' | 'associate';
  name: string;
  cpf: string;
  phone: string;

  vehicle: {
    brand: string;
    model: string;
    year: string;
    plate: string;
    color: string;
    category: string;
  };

  images: PrimaryExpertiseImage[];      // 9 obrigatórias
  audio?: File;
  video?: File;

  hasAnyErrorAfterValidation?: boolean;
}

interface PrimaryExpertiseImage {
  fileType: 'cnh_front_image' |
            'crlv_front_image' |
            'vehicle_plate_image' |
            'vehicle_front_side_image' |
            'vehicle_left_side_image' |
            'vehicle_rear_side_image' |
            'vehicle_right_side_image' |
            'vehicle_street_image' |
            'sign_board_image';
  file: File;
  isApproved?: boolean;
}

interface SecondaryExpertise {
  description?: string;
  images: SecondaryExpertiseImage[];
  witnessReport?: WitnessReport;
}
```

### Payment (Pagamento)

```typescript
interface Payment {
  callId: string;
  associateCarPlate: string;
  callIdEncrypted: string;
  status: 'pending' | 'paid' | 'overdue';
  value: string;
  dueDate: string;
  paymentVoucherImageUrl?: string;
}

interface Pix {
  keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  key: string;
  holderName: string;
}
```

---

## Comunicação em Tempo Real

### MQTT

**Broker:** AWS IoT Core
- Host: `ady4g3wrobmle-ats.iot.sa-east-1.amazonaws.com`
- Porta: 8883 (SSL/TLS)
- Certificados X.509 necessários

**Tópicos:**

#### Guincho
```
# Publicação
towing-driver/{userId}/call/{callId}/call-trip/{tripId}/geolocation
{
  "latitude": -23.5505,
  "longitude": -46.6333,
  "current_call_status": "inChecking",
  "current_trip_type": "towingCollect",
  "current_trip_id": "trip-id"
}

# Subscrição
(Recebe novos chamados via deep link ou notificação push)
```

#### Vistoria
```
# Publicação
biker/{userId}/geolocation
{
  "latitude": -23.5505,
  "longitude": -46.6333
}

# Subscrição
call/{callId}/biker/{userId}/call-cancelation
call/{callId}/biker/{userId}/main-expertise-validation-errors
biker/{userId}/geolocation-update
```

### Socket.IO (Alternativa)

**Eventos:**
```typescript
// Entrar em rooms
socket.emit('join', 'call:123');
socket.emit('join', 'biker:456');

// Atualizar localização
socket.emit('biker:location:update', {
  bikerId: '456',
  latitude: -23.5505,
  longitude: -46.6333
});

// Receber atualizações
socket.on('biker:location:updated', (data) => {});
socket.on('call:status:updated', (data) => {});
socket.on('call:new', (call) => {});
```

### Firebase Cloud Messaging

**Uso:**
- Notificações de novos chamados
- Alertas de validação de vistoria
- Lembretes de pagamento
- Atualizações de status

---

## Fluxos Completos

### Fluxo Guincheiro

```
1. Login (CNPJ → Token → Registro → Login)
   ↓
2. Dashboard (aguardando chamado)
   ↓
3. Recebe Deep Link com encrypted_key
   ↓
4. Aceita chamado
   PUT /call/{encryptedKey}/accept + location
   ↓
5. Status → waitingArrrivalToCheckin
   Inicia Background Service (MQTT)
   ↓
6. Chega no local de coleta
   ↓
7. Status → inChecking
   ↓
8. Realiza Check-in
   - 4 fotos (Frente, Esquerda, Traseira, Direita)
   - Fotos de pertences
   - Assinatura
   POST /call/{callId}/inspection (FormData)
   ↓
9. Status → waitingArrrivalToCheckout
   ↓
10. Chega no destino
    ↓
11. Status → inCheckout
    ↓
12. Realiza Check-out
    POST /call/{callId}/inspection (FormData)
    ↓
13. Status → finished
    Limpa chamado local
    Para Background Service
```

### Fluxo Vistoriador

```
1. Login (CPF → Senha)
   ↓
2. Dashboard (status: available)
   ↓
3. Recebe solicitação via MQTT/Push (30s para aceitar)
   ↓
4. Aceita chamado
   PATCH /calls/{callId}/status → biker_accepted
   ↓
5. Status → busy
   Navega para /expertise
   Inicia rastreamento GPS
   ↓
6. Chega no local
   Status → biker_arrived
   ↓
7. Preenche informações do veículo
   ↓
8. Vistoria Principal
   - Captura 9 imagens obrigatórias
   - Cada imagem validada com IA
   - Grava áudio (relatório)
   - Grava vídeo
   POST /calls/{callId}/expertises/batch (Server-Sent Events)
   ↓
9. Validação Server-Side
   Sistema processa imagens
   Publica eventos MQTT
   ↓
10. Vistoria Secundária (se necessário)
    POST /calls/{callId}/expertises
    ↓
11. Status → approved
    Status do vistoriador → available
    ↓
12. Retorna ao Dashboard
    Limpa dados de chamado
```

---

## Padrões de Código

### Arquitetura
- **Clean Architecture** - Separação de responsabilidades
- **Repository Pattern** - Abstração de dados
- **Context API** - State management global
- **Custom Hooks** - Lógica reutilizável

### Estrutura de Pastas (React Native)
```
/app                    # Rotas (Expo Router)
  /active-call.tsx
  /camera.tsx
  /dashboard.tsx
  /inspector-call.tsx
  /login-guincheiro.tsx
  /login-vistoriador.tsx
  /signature.tsx

/components             # Componentes reutilizáveis
  /AppButton.tsx
  /AppDialog.tsx
  /AppDropdown.tsx
  /AppTextField.tsx
  /BottomNav.tsx

/contexts               # Contextos globais
  /AuthContext.tsx
  /CallsContext.tsx
  /InspectionContext.tsx

/lib                    # Bibliotecas e utils
  /masks.ts
  /query-client.ts

/server                 # Backend (se aplicável)
  /index.ts
  /routes.ts
  /storage.ts

/shared                 # Schemas compartilhados
  /schema.ts
```

### Convenções de Nomenclatura
- Componentes: PascalCase (`AppButton.tsx`)
- Funções/Variáveis: camelCase (`handleSubmit`)
- Constantes: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Tipos/Interfaces: PascalCase (`interface User {}`)
- Arquivos de tela: kebab-case (`login-guincheiro.tsx`)

### TypeScript
- Sempre tipar props de componentes
- Usar `interface` para objetos públicos
- Usar `type` para unions e aliases
- Evitar `any` - usar `unknown` se necessário

---

## Dependências Principais

### React Native / Expo
```json
{
  "expo": "^52.0.25",
  "react": "18.3.1",
  "react-native": "0.76.5",
  "expo-router": "~4.0.16"
}
```

### UI
```json
{
  "react-native-paper": "^5.12.5",
  "@react-native-community/slider": "4.5.5",
  "react-native-reanimated": "~3.16.4"
}
```

### Data & State
```json
{
  "@tanstack/react-query": "^5.62.11",
  "drizzle-orm": "^0.39.3",
  "expo-sqlite": "~15.0.4"
}
```

### Camera & Media
```json
{
  "expo-camera": "~16.0.10",
  "expo-image-picker": "~16.0.5",
  "react-native-signature-canvas": "^4.7.4"
}
```

### Location
```json
{
  "expo-location": "~18.0.7"
}
```

### HTTP
```json
{
  "axios": "^1.7.9"
}
```

---

## Configurações Importantes

### Permissões (app.json)

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Precisamos acessar a câmera para tirar fotos da vistoria",
        "NSMicrophoneUsageDescription": "Precisamos acessar o microfone para gravar áudios",
        "NSPhotoLibraryUsageDescription": "Precisamos acessar a galeria para selecionar fotos",
        "NSLocationWhenInUseUsageDescription": "Precisamos da sua localização para rastrear o chamado"
      }
    },
    "android": {
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "FOREGROUND_SERVICE"
      ]
    }
  }
}
```

### Variáveis de Ambiente (.env)

```bash
# ==================================
# API CONFIGURATION
# ==================================

# API unificada para Guincho e Vistoria
# Para Android Emulator use 10.0.2.2 (mapeia para localhost do PC)
# Para iOS Simulator use localhost
# Para dispositivo físico use o IP da máquina na rede local
API_BASE_URL=http://10.0.2.2:3004

# Ambiente
NODE_ENV=development

# ==================================
# EXTERNAL SERVICES (se necessário)
# ==================================

# AI Validator (se usado)
# AI_VALIDATOR_URL=https://ia.growthsolutions.com.br/api/v1

# S3 Bucket (se usado)
# S3_BUCKET_URL=https://growth-application-bucket.s3.sa-east-1.amazonaws.com

# ==================================
# MQTT (se necessário)
# ==================================

# MQTT_HOST=ady4g3wrobmle-ats.iot.sa-east-1.amazonaws.com
# MQTT_PORT=8883
```

**Importante:**
- A API está rodando localmente na porta **3004**
- Use `http://10.0.2.2:3004` para Android Emulator
- Use `http://localhost:3004` para iOS Simulator
- Para testar em dispositivo físico, use o IP da máquina na rede local (ex: `http://192.168.1.10:3004`)

---

## Implementação de Autenticação (Concluída)

### Estrutura de Arquivos

```
/lib/api.ts                      # Serviço de API com axios
/contexts/AuthContext.tsx        # Gerenciamento de autenticação
/app/login-guincheiro.tsx        # Tela de login do guincheiro
/app/login-vistoriador.tsx       # Tela de login do vistoriador
/app/dashboard.tsx               # Dashboard do guincheiro
/app/inspector-dashboard.tsx     # Dashboard do vistoriador
/app/index.tsx                   # Tela inicial com seleção de perfil
```

### Fluxo de Autenticação Implementado

#### 1. Login do Guincheiro (2 passos)

**Endpoint:** `POST /api/guincho/auth/login`

**Request:**
```json
{
  "cpf": "12345678900",
  "password": "senha123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "platform_type": "assistance",
    "user": {
      "id": "542",
      "name": "João Motorista Guincho",
      "cpf": "12345678900",
      "email": "joao.guincho@example.com",
      "phone": "11987654321",
      "status": "available",
      "profile_image_path": null,
      "towing_provider": {
        "id": "321",
        "fantasy_name": "CHAVEIRO GLOBO",
        "cnpj": "00.132.777/0001-00"
      }
    }
  }
}
```

**Fluxo:**
1. Usuário abre o app → Tela de seleção de perfil
2. Seleciona "Guincheiro" → Vai para `/login-guincheiro`
3. **Passo 1:** Insere CPF → Valida formato
4. **Passo 2:** Insere senha → Faz login na API
5. API retorna: `token`, `platform_type`, `user`
6. App salva no AsyncStorage:
   - `auth_token` → JWT
   - `user_data` → Dados do usuário
   - `platform_type` → "assistance" ou "inspection"
7. Redireciona para `/dashboard`

#### 2. Redirecionamento Automático

Ao abrir o app novamente:
```typescript
// app/index.tsx
useEffect(() => {
  if (!isLoading && isAuthenticated && platformType) {
    const targetRoute = platformType === 'assistance'
      ? '/dashboard'           // Guincheiro
      : '/inspector-dashboard'; // Vistoriador
    router.replace(targetRoute);
  }
}, [isLoading, isAuthenticated, platformType]);
```

#### 3. Logout e Limpeza de Dados

**Endpoint:** `POST /api/guincho/auth/logout`

**Fluxo:**
```typescript
const logout = async () => {
  try {
    // 1. Chamar API de logout
    await guincheiroAuth.logout();
  } catch (error) {
    // Continuar mesmo se der erro na API
  } finally {
    // 2. Limpar todos os dados locais
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('platform_type');
    await AsyncStorage.removeItem('calls'); // Limpar chamados

    // 3. Limpar estados
    setUser(null);
    setToken(null);
    setPlatformType(null);
  }
};
```

### Tratamento de Erros

#### Mensagens Amigáveis (sem detalhes técnicos)

```typescript
// lib/api.ts - Interceptor de resposta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido - limpar autenticação
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    }
    // Suprimir logs técnicos do axios
    error.isAxiosError = false;
    return Promise.reject(error);
  }
);
```

```typescript
// app/login-guincheiro.tsx - Tratamento no login
try {
  await loginGuincheiro(cpf, password);
  router.replace('/dashboard');
} catch (error: any) {
  let message = 'Erro ao fazer login. Tente novamente.';

  if (error.response) {
    const status = error.response.status;
    const apiError = error.response.data?.error;

    if (status === 401 || status === 403) {
      message = apiError || 'CPF ou senha inválidos.';
    } else if (status >= 500) {
      message = 'Erro no servidor. Tente novamente mais tarde.';
    } else {
      message = apiError || 'Erro ao fazer login. Verifique seus dados.';
    }
  } else if (error.request) {
    message = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }

  setErrorMessage(message);
  setShowErrorDialog(true);
}
```

#### Supressão de Logs Técnicos

```typescript
// app/_layout.tsx - Filtro global de console.error
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  // Ignorar erros do axios
  if (message.includes('axios') || message.includes('AxiosError')) {
    return;
  }
  originalConsoleError(...args);
};
```

### Proteção de Rotas

```typescript
// app/dashboard.tsx
export default function DashboardScreen() {
  const { user, logout, isAuthenticated } = useAuth();

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/');
    }
  }, [isAuthenticated, user]);

  // Não renderizar se não estiver autenticado
  if (!isAuthenticated || !user) {
    return null;
  }

  // ... resto do componente
}
```

### Estrutura do AuthContext

```typescript
interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  role: UserRole | null;
  platformType: 'assistance' | 'inspection' | null;
  loginGuincheiro: (cpf: string, password: string) => Promise<void>;
  loginVistoriador: (cpf: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Dados Salvos no AsyncStorage

| Chave | Tipo | Descrição |
|-------|------|-----------|
| `auth_token` | string | JWT do usuário |
| `user_data` | JSON | Dados completos do usuário (TowingDriver ou Biker) |
| `platform_type` | string | "assistance" (guincho) ou "inspection" (vistoria) |
| `calls` | JSON | Chamados do guincheiro (limpo ao logout) |

### Hot Reload vs Restart

**Não precisa reiniciar:**
- ✅ Alterações em telas (`.tsx`)
- ✅ Alterações em componentes
- ✅ Alterações em contextos
- ✅ Alterações em libs/utils

**Precisa reiniciar (`Ctrl+C` → `npx expo start --clear`):**
- ❌ `app/_layout.tsx` (arquivo raiz)
- ❌ `app.json`
- ❌ `metro.config.js`
- ❌ `.env`
- ❌ Instalação de novos pacotes

### Problemas Conhecidos e Soluções

#### 1. Erro: "right operand of 'in' is not an object"

**Causa:** Tentando usar operador `in` com `user` quando está `null`

**Solução:**
```typescript
// ❌ Errado
{'profile_image_path' in user && user.profile_image_path}

// ✅ Correto
{user && 'profile_image_path' in user && user.profile_image_path}
```

#### 2. Erro: "The action 'REPLACE' with payload was not handled"

**Causa:** Tentar redirecionar durante o render ao invés de usar `useEffect`

**Solução:**
```typescript
// ❌ Errado
if (!isAuthenticated) {
  router.replace('/');
  return null;
}

// ✅ Correto
useEffect(() => {
  if (!isAuthenticated) {
    router.replace('/');
  }
}, [isAuthenticated]);

if (!isAuthenticated) {
  return null;
}
```

#### 3. Cache do Metro não recarrega

**Solução:**
```bash
# Parar Metro (Ctrl+C)
npx expo start --clear
```

---

## Como Testar o Login

### 1. Preparar Ambiente

```bash
# Terminal 1 - API
cd /var/www/utiliza/api_app_sos_vistoria
npm run dev
# API rodando em http://localhost:3004

# Terminal 2 - App React Native
cd /mnt/c/Users/Growth/Documents/Utiliza/app_sos_vistoria
npx expo start --clear
# Pressionar 'a' para Android
```

### 2. Criar Usuário de Teste (se necessário)

```sql
-- No banco de dados MySQL
INSERT INTO towing_drivers (
  towing_provider_id,
  cpf,
  name,
  phone,
  email,
  password,
  status
) VALUES (
  321,  -- ID da empresa de guincho
  '12345678900',
  'João Motorista Teste',
  '11987654321',
  'joao.teste@example.com',
  '$2a$10$...',  -- Hash bcrypt de 'senha123'
  'available'
);
```

**Gerar hash bcrypt para senha:**
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('senha123', 10);
console.log(hash);
```

### 3. Fluxo de Teste - Login Guincheiro

1. **Abrir app** → Tela de seleção aparece
2. **Selecionar "Guincheiro"** → Vai para tela de login
3. **Inserir CPF:** `123.456.789-00` (com ou sem máscara)
4. **Clicar "Continuar"** → Vai para passo 2
5. **Inserir senha:** `senha123`
6. **Clicar "Entrar"**
   - ✅ Sucesso: Vai para dashboard
   - ❌ Erro: Mostra dialog com mensagem amigável
7. **Verificar dados no dashboard:**
   - Nome do motorista
   - CPF formatado
   - Telefone
   - Nome da empresa

### 4. Fluxo de Teste - Logout e Redirecionamento

1. **No dashboard** → Ir para aba "Perfil"
2. **Clicar "Sair da conta"** → Dialog de confirmação aparece
3. **Confirmar logout**
   - ✅ Volta para tela de seleção
   - ✅ Dados limpos (token, user, platform_type, calls)
4. **Fechar app completamente**
5. **Abrir app novamente**
   - ✅ Deve mostrar tela de seleção (não está logado)
6. **Fazer login novamente**
7. **Fechar app completamente**
8. **Abrir app novamente**
   - ✅ Deve ir direto para o dashboard (logado automaticamente)

### 5. Testar Erros

#### CPF Inválido
- Inserir: `111.111.111-11`
- ✅ Deve mostrar: "CPF inválido"

#### Senha Incorreta
- Inserir CPF correto + senha errada
- ✅ Deve mostrar dialog: "CPF ou senha inválidos"

#### API Offline
- Parar a API (`Ctrl+C` no terminal da API)
- Tentar fazer login
- ✅ Deve mostrar dialog: "Não foi possível conectar ao servidor. Verifique sua conexão com a internet."

#### Usuário Banido
- Alterar status no banco para `'banned'`
- Tentar fazer login
- ✅ Deve mostrar dialog: "Motorista bloqueado. Entre em contato com o administrador."

### 6. Verificar AsyncStorage (Debug)

**No Chrome DevTools:**
```javascript
// Pressionar Shift+M no Metro → Abre DevTools

// Ver dados salvos
AsyncStorage.getAllKeys().then(console.log);
AsyncStorage.getItem('auth_token').then(console.log);
AsyncStorage.getItem('user_data').then(data => console.log(JSON.parse(data)));
AsyncStorage.getItem('platform_type').then(console.log);

// Limpar dados manualmente (para teste)
AsyncStorage.clear().then(() => console.log('Tudo limpo!'));
```

---

## Próximos Passos

### Fase 1: Estrutura Base ✅ CONCLUÍDA
- [x] Configurar Expo + TypeScript
- [x] Criar estrutura de pastas
- [x] Configurar Contexts
- [x] Criar componentes base

### Fase 2: Autenticação ✅ CONCLUÍDA
- [x] Criar serviço de API (`lib/api.ts`)
- [x] Atualizar AuthContext para usar JWT
- [x] Implementar login Guincheiro com API
- [x] Armazenar token JWT, dados do usuário e platform_type
- [x] Atualizar tela de login do Guincheiro (2 passos: CPF → Senha)
- [x] Atualizar Dashboard Guincheiro para usar dados reais da API
- [x] Atualizar Dashboard Vistoriador para usar dados reais da API
- [x] Tela de seleção de perfil (Guincheiro/Vistoriador)
- [x] Redirecionamento automático baseado em platform_type
- [x] Limpeza automática de dados ao fazer logout
- [x] Tratamento de erros com AppDialog
- [x] Suprimir logs técnicos do axios
- [ ] Implementar login Vistoriador (aguardando endpoint da API)

### Fase 3: Dashboard ✅ CONCLUÍDA
- [x] Dashboard Guincheiro (2 abas: Chamados + Perfil)
- [x] Dashboard Vistoriador (3 abas: Home + Pagamentos + Perfil)
- [x] Listagem de chamados (mockup)
- [x] Perfil do usuário com dados reais da API
- [x] Proteção de rotas (redireciona se não autenticado)
- [ ] Integrar lista de chamados com API real
- [ ] Integrar lista de pagamentos com API real

### Fase 4: Chamados (Guincho)
- [ ] Tela de chamado ativo
- [ ] Timeline de status
- [ ] Botões de contato (WhatsApp, Telefone)
- [ ] Mapa de navegação
- [ ] Formulário de vistoria (Check-in/Check-out)
- [ ] Upload de fotos e assinatura

### Fase 5: Chamados (Vistoria)
- [ ] Tela de expertise
- [ ] Formulário de vistoria principal
- [ ] Captura de 9 imagens obrigatórias
- [ ] Validação com IA em tempo real
- [ ] Gravação de áudio e vídeo
- [ ] Upload com Server-Sent Events
- [ ] Formulário de vistoria secundária

### Fase 6: Rastreamento
- [ ] Implementar MQTT
- [ ] Rastreamento GPS em tempo real
- [ ] Background service
- [ ] Notificações de localização

### Fase 7: Pagamentos (Vistoria)
- [ ] Lista de faturas
- [ ] Cadastro de chave PIX
- [ ] Upload de comprovante

### Fase 8: Testes e Deploy
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Build Android (APK/AAB)
- [ ] Build iOS (IPA)
- [ ] Publicar na Google Play
- [ ] Publicar na App Store

---

## Notas Importantes

### Diferenças Flutter vs React Native

| Aspecto | Flutter | React Native |
|---------|---------|--------------|
| Navegação | GetX Navigator | Expo Router |
| State | GetX (Rx) | Context API + React Query |
| HTTP | Dio | Axios + React Query |
| Storage | SharedPreferences | expo-sqlite + Drizzle |
| Camera | camera plugin | expo-camera |
| Notificações | firebase_messaging | expo-notifications |

### Boas Práticas

1. **Sempre validar entrada do usuário**
2. **Usar React Query para cache de dados**
3. **Implementar error boundaries**
4. **Logs para debugging (não em produção)**
5. **Compressão de imagens antes do upload**
6. **Timeout em requisições HTTP**
7. **Retry automático para falhas de rede**
8. **Feedback visual para uploads longos**
9. **Offline-first quando possível**
10. **Seguir guidelines de UI do Material Design**

### Segurança

- ✅ JWT para autenticação
- ✅ HTTPS em todas as requisições
- ✅ Validação de permissões
- ✅ Ofuscação de IDs (Hashids)
- ✅ Criptografia de dados sensíveis
- ⚠️ Não armazenar senhas localmente
- ⚠️ Validar certificados SSL/TLS (MQTT)

---

## Referências

### Projetos Originais (Flutter)
- **Guincho:** `/mnt/c/Users/Growth/Documents/Utiliza/tow_truck_driver_app`
- **Vistoria:** `/mnt/c/Users/Growth/Documents/Utiliza/utiliza-inspector-app`

### Backend
- **API:** `/var/www/utiliza/api_app_sos_vistoria`

### Documentação Externa
- [Expo Docs](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Prisma](https://www.prisma.io/docs/)

---

## Implementação de Rastreamento GPS e Modal de Chamado (Concluída) ✅

### Visão Geral

Esta seção documenta a implementação completa do sistema de rastreamento de localização em tempo real e do modal de notificação de chamados no estilo Uber para o app Guincheiro.

### 1. Rastreamento de Localização (GPS)

#### 1.1. Arquitetura

**Custom Hook:** `useLocationTracking.ts`
- Gerencia estado de localização com Socket.IO WebSocket
- Envia atualizações de localização a cada 10 segundos
- Precisão alta (5-10 metros) usando `Location.Accuracy.High`
- Reconexão automática em caso de falha
- Tratamento completo de permissões e GPS

**Tecnologias:**
- `expo-location` - Obter coordenadas GPS
- `socket.io-client` - Comunicação em tempo real com servidor
- `react-native` - Listeners de AppState para detectar quando app volta ao foco

#### 1.2. Fluxo de Rastreamento

```
1. Hook inicializado quando usuário faz login
   ↓
2. Verificar permissão de localização
   - Se negada → Mostrar modal de permissão
   ↓
3. Verificar se GPS está ativado
   - Se desativado → Mostrar modal GPS desativado
   ↓
4. Conectar ao WebSocket (Socket.IO)
   - URL: http://192.168.0.5:3004
   - Evento: 'driver:location:update'
   ↓
5. Obter localização atual (getCurrentPositionAsync)
   - Accuracy: High (5-10m)
   ↓
6. Enviar para servidor via WebSocket
   {
     token: "jwt-token",
     latitude: -16.688916,
     longitude: -49.266110
   }
   ↓
7. Aguardar 10 segundos
   ↓
8. Repetir passos 5-7 (loop infinito enquanto app ativo)
```

#### 1.3. Estados de Localização

```typescript
export type LocationStatus =
  | 'disconnected'      // Desconectado do servidor
  | 'connecting'        // Conectando ao WebSocket
  | 'connected'         // Conectado e enviando localização
  | 'error'             // Erro genérico
  | 'permission_denied' // Permissão negada

export interface LocationTrackingState {
  status: LocationStatus;
  lastUpdate: Date | null;          // Última atualização enviada
  error: string | null;              // Mensagem de erro
  needsPermission: boolean;          // Precisa pedir permissão
  needsGpsEnabled: boolean;          // GPS desativado
}
```

#### 1.4. Funções Principais

**`startLocationTracking()`**
- Verifica permissões de localização
- Solicita permissão se necessário
- Verifica se GPS está habilitado
- Inicia loop de envio de localização a cada 10 segundos

**`sendLocationToServer()`**
- Envia coordenadas via Socket.IO
- Recebe confirmação do servidor
- Atualiza estado `lastUpdate`

**`requestPermission()`**
- Verifica status de permissão
- Se `canAskAgain === false` → Abre configurações do sistema
- Se `canAskAgain === true` → Solicita permissão novamente

**`openLocationSettings()`**
- Abre configurações do sistema para ativar GPS

**`cleanup()`**
- Limpa intervalos
- Desconecta WebSocket
- Reseta todos os estados
- Chamado ao desmontar componente ou fazer logout

#### 1.5. Modais de Permissão e GPS

**Modal de Permissão Negada:**
```typescript
<AppDialog
  visible={needsPermission}
  title="Permissão de Localização"
  message="Para usar o app, precisamos da sua localização em tempo real..."
  onClose={() => {}}  // Não pode fechar sem dar permissão
  actions={[
    {
      label: 'Abrir Configurações',
      onPress: requestPermission,
      mode: 'contained'
    }
  ]}
/>
```

**Modal de GPS Desativado:**
```typescript
<AppDialog
  visible={needsGpsEnabled}
  title="GPS Desativado"
  message="Por favor, ative o GPS do seu dispositivo..."
  actions={[
    {
      label: 'Abrir Configurações',
      onPress: openLocationSettings,
      mode: 'contained'
    }
  ]}
/>
```

#### 1.6. Integração no Dashboard

```typescript
// app/dashboard.tsx
const {
  status,
  lastUpdate,
  error,
  needsPermission,
  needsGpsEnabled,
  requestPermission,
  openLocationSettings,
} = useLocationTracking(token, true);

// Renderizar indicador de status
{status === 'connected' && (
  <View style={styles.locationIndicator}>
    <MaterialIcons name="location-on" size={16} color={Colors.success} />
    <Text>Localização ativa</Text>
  </View>
)}
```

#### 1.7. Variação Normal de GPS

**Importante:** Mesmo com o dispositivo parado, é normal a localização variar ligeiramente devido a:
- Precisão do GPS (~5-10 metros)
- Interferência de prédios/árvores
- Movimento de satélites GPS
- Condições atmosféricas

Variações de até 50 metros são normais mesmo parado.

#### 1.8. Endpoints WebSocket

**Servidor:** `http://192.168.0.5:3004`

**Eventos Emitidos:**
```typescript
socket.emit('driver:location:update', {
  token: string,
  latitude: number,
  longitude: number
}, (response) => {
  if (response.success) {
    console.log('✅ Localização salva');
  }
});
```

**Eventos Recebidos:**
```typescript
socket.on('driver:location:updated', (data) => {
  // Confirmação de atualização
  console.log('Localização atualizada no servidor');
});

socket.on('connect', () => {
  console.log('✅ WebSocket conectado');
});

socket.on('disconnect', () => {
  console.log('❌ WebSocket desconectado');
});
```

#### 1.9. Recebimento de Chamados em Tempo Real

**WebSocket Room:** `towing_drivers`

Quando o guincheiro está conectado e com GPS ativo, ele automaticamente entra no room `towing_drivers` para receber notificações de novos chamados.

**Fluxo:**
```
1. WebSocket conecta
   ↓
2. Entra no room: socket.emit('join', 'towing_drivers')
   ↓
3. Servidor envia evento quando há novo chamado
   Event: 'call:new'
   ↓
4. App recebe os dados e mostra modal
```

**Payload do Evento `call:new`:**
```typescript
interface IncomingCall {
  call_id: string;                      // ID do chamado
  address: string;                      // Endereço do serviço
  observation?: string;                 // Observações
  service_type: string;                 // "towing", "battery", etc.
  location: {
    latitude: number;
    longitude: number;
  };
  total_drivers: number;                // Total de guincheiros notificados
  drivers: Array<{
    id: string;
    name: string;
    distance_km: number;                // Distância em km
    provider: {
      id: string;
      name: string;
      cnpj: string;
    };
  }>;
  timestamp: string;                    // ISO timestamp
}
```

**Exemplo de Payload:**
```json
{
  "call_id": "43614",
  "address": "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
  "observation": "Veículo com pneu furado, necessita guincho urgente",
  "service_type": "towing",
  "location": {
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "total_drivers": 1,
  "drivers": [
    {
      "id": "542",
      "name": "Guilherme Matos Ataides",
      "distance_km": 807.86,
      "provider": {
        "id": "321",
        "name": "CHAVEIRO GLOBO",
        "cnpj": "00.132.777/0001-00"
      }
    }
  ],
  "timestamp": "2026-02-16T03:45:48.736Z"
}
```

**Implementação no Hook:**
```typescript
// useLocationTracking.ts
socket.on('connect', () => {
  // Entrar no room de guincheiros
  socket.emit('join', 'towing_drivers');
  console.log('📡 Entrou no room: towing_drivers');
});

// Escutar novos chamados
socket.on('call:new', (callData: IncomingCall) => {
  console.log('🚨 Novo chamado recebido:', callData);
  if (onNewCall) {
    onNewCall(callData);
  }
});
```

**Tradução de Tipos de Serviço:**

O campo `service_type` do WebSocket é mapeado para labels em PT-BR através do arquivo `lib/serviceTypes.ts`:

```typescript
// Exemplos de tradução
'towing' → 'Guincho'
'battery_charge_light' → 'Carga de Bateria Leve'
'tire_change' → 'Troca de Pneu'
'locksmith' → 'Chaveiro'
'empty_tank' → 'Tanque Vazio'
```

Total de **26 tipos de serviço** mapeados:
- 🚛 Guincho: 8 tipos
- 🔋 Bateria: 6 tipos
- 🛞 Pneu: 4 tipos
- 🔑 Chaveiro: 4 tipos
- ⛽ Combustível: 2 tipos
- 🔧 Outros: 2 tipos

**Uso no Dashboard:**
```typescript
// app/dashboard.tsx
import { getServiceTypeLabel } from '@/lib/serviceTypes';

const handleNewCall = useCallback((call: IncomingCall) => {
  console.log('🚨 Processando novo chamado:', call);

  // Converter dados do WebSocket para formato do modal
  const callData = {
    id: call.call_id,
    pickupAddress: call.address,
    serviceType: getServiceTypeLabel(call.service_type), // Traduzir para PT-BR
  };

  setIncomingCallData(callData);
  setShowIncomingCall(true);
}, []);

const locationState = useLocationTracking(
  token,
  isAuthenticated && isScreenFocused,
  handleNewCall  // Callback para novos chamados
);
```

**Importante:**
- O modal aparece automaticamente quando recebe o evento `call:new`
- Por enquanto, mostra apenas o endereço do serviço (`address`)
- O timer de 60 segundos dá tempo para o motorista aceitar ou rejeitar
- Campos opcionais (distância, tempo estimado, placa) só aparecem se disponíveis

---

### 1.10. Som de Notificação

**Arquivo de Áudio:** `toque-notificacao.mp3` (raiz do projeto)

Quando o guincheiro recebe um novo chamado via WebSocket, o app toca um som de notificação sincronizado com a aparição do modal.

#### 1.10.1. Tecnologia

**Biblioteca:** `expo-audio` (v16.0.8)

⚠️ **Importante:** O projeto migrou de `expo-av` para `expo-audio` porque:
- `expo-av` está **deprecated** no SDK 54
- `expo-audio` é o substituto oficial da Expo
- API mais simples e moderna

#### 1.10.2. Hook Customizado

**Arquivo:** `lib/useNotificationSound.ts`

```typescript
import { useAudioPlayer, AudioSource } from 'expo-audio';

export function useNotificationSound() {
  // Caminho do arquivo de som (na raiz do projeto)
  const audioSource: AudioSource = require('../toque-notificacao.mp3');

  const player = useAudioPlayer(audioSource, {
    shouldPlay: false,
  });

  /**
   * Toca o som de notificação 1 vez
   */
  const playNotificationSound = () => {
    try {
      player.seekTo(0); // Voltar ao início
      player.play();
      console.log('🔊 Tocando notificação');
    } catch (error) {
      console.error('❌ Erro ao tocar som:', error);
    }
  };

  return { playNotificationSound };
}
```

#### 1.10.3. Integração no Dashboard

```typescript
// app/dashboard.tsx
import { useNotificationSound } from '@/lib/useNotificationSound';

export default function DashboardScreen() {
  // Som de notificação
  const { playNotificationSound } = useNotificationSound();

  // Handler para quando receber um novo chamado via WebSocket
  const handleNewCall = useCallback((call: IncomingCall) => {
    console.log('🚨 Processando novo chamado:', call);

    // Tocar som de notificação (1 vez)
    playNotificationSound();

    // Converter dados e mostrar modal
    const callData = {
      id: call.call_id,
      pickupAddress: call.address,
      serviceType: getServiceTypeLabel(call.service_type),
    };

    setIncomingCallData(callData);
    setShowIncomingCall(true);
  }, [playNotificationSound]);

  // ...
}
```

#### 1.10.4. Fluxo de Execução

```
1. WebSocket recebe evento 'call:new'
   ↓
2. handleNewCall() é chamado
   ↓
3. playNotificationSound() executa (SIMULTÂNEO com passo 4)
   ├─ player.seekTo(0)
   └─ player.play()
   ↓
4. Modal aparece (setShowIncomingCall(true))
   ↓
5. Usuário ouve: 🔊 DING + vê o modal 📱
```

#### 1.10.5. Características do Som

**Especificações do Arquivo:**
- **Nome:** `toque-notificacao.mp3`
- **Localização:** Raiz do projeto
- **Formato:** MP3
- **Duração recomendada:** 0.5 - 1.5 segundos
- **Estilo:** Som curto e agradável (tipo "ding" ou "ping")

**Comportamento:**
- ✅ Toca **1 vez** quando recebe chamado
- ✅ Sincronizado com aparição do modal
- ✅ Não precisa de permissões especiais
- ✅ Funciona em background (se app estiver aberto)

#### 1.10.6. API do expo-audio vs expo-av

**Migração de expo-av para expo-audio:**

| expo-av (deprecated) | expo-audio (novo) |
|----------------------|-------------------|
| `Audio.setAudioModeAsync()` | Não necessário |
| `Audio.Sound.createAsync()` | `useAudioPlayer(source)` |
| `sound.replayAsync()` | `player.play()` + `player.seekTo(0)` |
| `sound.unloadAsync()` | Automático (cleanup do hook) |
| Complexo, muitas linhas | Simples, poucas linhas |

**Vantagens do expo-audio:**
- API mais simples e intuitiva
- Hook React nativo (`useAudioPlayer`)
- Melhor performance
- Suporte oficial da Expo
- Cleanup automático

#### 1.10.7. Troubleshooting

**Erro: "Cannot find module"**
```
ERROR  ❌ Erro ao carregar som: [Error: Cannot find module '@/assets/sounds/toque-notificacao.mp3']
```

**Solução:**
- Verificar que o arquivo `toque-notificacao.mp3` está na **raiz do projeto**
- Usar caminho relativo: `require('../toque-notificacao.mp3')`
- Reiniciar o Metro Bundler

**Warning: "expo-av has been deprecated"**
```
WARN  [expo-av]: Expo AV has been deprecated and will be removed in SDK 54.
```

**Solução:**
- Usar `expo-audio` ao invés de `expo-av`
- Desinstalar expo-av: `npm uninstall expo-av`
- Instalar expo-audio: `npm install expo-audio`

**Som não toca:**
- Verificar se o arquivo MP3 está correto
- Verificar volume do dispositivo
- Verificar se há erros no console
- Testar em dispositivo físico (emulador pode ter problemas de áudio)

#### 1.10.8. Exemplo de Teste

```typescript
// Para testar o som diretamente no console
const { playNotificationSound } = useNotificationSound();
playNotificationSound(); // 🔊 Deve tocar o som
```

---

### 2. Modal de Chamado Estilo Uber

#### 2.1. Design Pattern: Bottom Sheet

**Componente:** `IncomingCallModal.tsx`

Inspirado no padrão de design do Uber:
- Modal de baixo para cima (bottom sheet)
- Timer circular de 60 segundos
- Animações suaves com Reanimated
- Feedback tátil (vibração)
- Sem som (apenas haptics)
- Não fecha automaticamente quando timer chega a zero

#### 2.2. Estrutura do Modal

```typescript
interface CallData {
  id: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: string;           // Endereço de origem
  deliveryAddress?: string;        // Endereço de destino (opcional)
  distance: string;                // "8.5 km"
  estimatedTime: string;           // "15 min"
  serviceType: string;             // "Reboque", "Chaveiro", etc.
  vehiclePlate?: string;           // "ABC-1234"
}
```

#### 2.3. Timer Circular SVG

**Componente:** `TimerRing`

**Características:**
- SVG circular com `Circle` do `react-native-svg`
- Tamanho: 72x72px
- Stroke width: 4px
- Animação de preenchimento circular
- Cores dinâmicas:
  - **60-11 segundos:** Azul (`Colors.primary`)
  - **10-1 segundos:** Vermelho (`Colors.error`) + vibração
  - **Background:** Cinza claro (`Colors.greyLight`)

**Cálculo do Progresso:**
```typescript
const progress = timeLeft / total;  // 0 a 1
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = circumference * (1 - progress);
```

**Código SVG:**
```typescript
<Svg width={72} height={72} style={{ transform: [{ rotate: '-90deg' }] }}>
  {/* Background ring */}
  <Circle
    cx={36}
    cy={36}
    r={34}
    stroke={Colors.greyLight}
    strokeWidth={4}
    fill="none"
  />

  {/* Progress ring */}
  <Circle
    cx={36}
    cy={36}
    r={34}
    stroke={isUrgent ? Colors.error : Colors.primary}
    strokeWidth={4}
    fill="none"
    strokeDasharray={circumference}
    strokeDashoffset={strokeDashoffset}
    strokeLinecap="round"
  />
</Svg>
```

#### 2.4. Estados do Timer

```typescript
const [timeLeft, setTimeLeft] = useState(60);  // Começa em 60 segundos

const isUrgent = timeLeft <= 10;  // Últimos 10 segundos = urgente

useEffect(() => {
  if (visible) {
    setTimeLeft(timeout);  // Reset para 60

    // Vibração inicial (dupla)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200
    );

    // Countdown
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;  // Para no zero, NÃO fecha modal
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }
}, [visible]);

// Vibração nos últimos 10 segundos
useEffect(() => {
  if (timeLeft <= 10 && timeLeft > 0) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}, [timeLeft]);
```

#### 2.5. Seções do Modal

**1. Header**
- Ícone de tipo de serviço (caminhão)
- Título: "Novo Chamado"
- Tipo de serviço: "Reboque", "Chaveiro", etc.
- Timer circular

**2. Stats Bar (Informações Rápidas)**
- Distância: "8.5 km"
- Tempo estimado: "15 min"
- Placa do veículo: "ABC-1234" (opcional)

**3. Route Section (Rota)**
- **Origem:** Endereço de coleta
- **Destino:** Endereço de entrega (se houver)
- Linha conectora entre origem e destino
- Ícones coloridos (azul = origem, vermelho = destino)

**4. Actions (Botões)**
- **Rejeitar:** Botão circular com "X"
- **Aceitar:** Botão principal verde com texto "Aceitar Chamado"

#### 2.6. Animações

**Entrada do Modal:**
```typescript
<Animated.View
  entering={SlideInDown.springify().damping(18).stiffness(140)}
  style={styles.sheet}
>
  {/* Conteúdo */}
</Animated.View>
```

**Entrada das Seções:**
```typescript
// Stats Bar - delay 150ms
<Animated.View entering={FadeIn.delay(150).duration(300)}>

// Route Section - delay 250ms
<Animated.View entering={FadeInUp.delay(250).duration(300)}>

// Actions - delay 350ms
<Animated.View entering={FadeInUp.delay(350).duration(300)}>
```

**Botão Aceitar (Pulse):**
```typescript
const pulseScale = useSharedValue(1);

const acceptPulse = useAnimatedStyle(() => ({
  transform: [{ scale: pulseScale.value }]
}));

<Pressable
  onPressIn={() => {
    pulseScale.value = withSpring(0.95, { damping: 12 });
  }}
  onPressOut={() => {
    pulseScale.value = withSpring(1, { damping: 12 });
  }}
  onPress={() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept();
  }}
>
  <Animated.View style={[styles.acceptBtn, acceptPulse]}>
    <MaterialIcons name="check" size={24} color={Colors.white} />
    <Text style={styles.acceptText}>Aceitar Chamado</Text>
  </Animated.View>
</Pressable>
```

#### 2.7. Feedback Háptico

**Tipos de vibração:**
```typescript
// Ao abrir modal
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  // 2x

// A cada segundo nos últimos 5 segundos
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Ao clicar em "Rejeitar"
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Ao clicar em "Aceitar"
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

#### 2.8. Estilos e Cores

**Paleta de Cores:**
```typescript
Colors.surface        // Branco - fundo do modal
Colors.primary        // Azul - timer normal, origem
Colors.error          // Vermelho - timer urgente, destino
Colors.greyLight      // Cinza claro - timer background
Colors.textPrimary    // Preto - títulos
Colors.textSecondary  // Cinza - subtítulos
Colors.textTertiary   // Cinza claro - labels
Colors.divider        // Cinza - linhas divisórias
Colors.background     // Cinza muito claro - stats bar
```

**Espaçamento:**
```typescript
paddingHorizontal: 24px    // Margens laterais
paddingTop: 20px           // Espaço acima dos botões
paddingBottom: 8px         // Espaço abaixo dos botões
marginBottom: 20px         // Entre seções
gap: 12px                  // Entre botões
```

**Botões:**
```typescript
// Rejeitar
width: 60px
height: 60px
borderRadius: 30px

// Aceitar
height: 60px
borderRadius: 16px
paddingHorizontal: 24px
flex: 1
```

#### 2.9. Simulação de Chamado (Para Testes)

**Código de simulação no Dashboard:**
```typescript
// SIMULAÇÃO: Mostrar chamado após 1 segundo (REMOVER EM PRODUÇÃO)
useEffect(() => {
  if (user && tab === 'calls') {
    const simulationTimer = setTimeout(() => {
      const fakeCall = {
        id: 'SIMULATED-' + Date.now(),
        clientName: 'João Silva',
        clientPhone: '(62) 98765-4321',
        pickupAddress: 'Av. Goiás, 1234 - Setor Central, Goiânia - GO',
        deliveryAddress: 'Rua 10, 567 - Setor Oeste, Goiânia - GO',
        distance: '8.5 km',
        estimatedTime: '15 min',
        serviceType: 'Reboque',
        vehiclePlate: 'ABC-1234',
      };
      setIncomingCallData(fakeCall);
      setShowIncomingCall(true);
    }, 1000);

    return () => clearTimeout(simulationTimer);
  }
}, [user, tab]);
```

**⚠️ IMPORTANTE:** Remover esta simulação em produção! Em produção, o chamado deve vir via:
- WebSocket (tempo real)
- Push notification (se app em background)
- Deep link (se app fechado)

#### 2.10. Handlers de Ação

```typescript
const handleAcceptCall = () => {
  console.log('✅ Chamado aceito:', incomingCallData?.id);

  // TODO: Enviar aceitação para API
  // PUT /call/{encryptedKey}/accept

  setShowIncomingCall(false);
  setIncomingCallData(null);

  // TODO: Navegar para tela de chamado ativo
  // router.push('/active-call');
};

const handleRejectCall = () => {
  console.log('❌ Chamado rejeitado:', incomingCallData?.id);

  // TODO: Enviar rejeição para API (se necessário)

  setShowIncomingCall(false);
  setIncomingCallData(null);
};
```

#### 2.11. Uso no Dashboard

```typescript
import IncomingCallModal from '@/components/IncomingCallModal';

const [showIncomingCall, setShowIncomingCall] = useState(false);
const [incomingCallData, setIncomingCallData] = useState<any>(null);

return (
  <>
    {/* Dashboard content */}

    {/* Modal de chamado */}
    <IncomingCallModal
      visible={showIncomingCall}
      callData={incomingCallData}
      onAccept={handleAcceptCall}
      onReject={handleRejectCall}
      timeout={60}
    />
  </>
);
```

#### 2.12. Problemas Resolvidos

**1. Timer invisível (cores brancas)**

**Problema:**
```typescript
// ❌ ANTES: Timer branco em fundo branco
stroke="rgba(255,255,255,0.15)"   // Background
stroke={isUrgent ? '#FF6B6B' : Colors.white}  // Progress
color: Colors.white                // Texto
```

**Solução:**
```typescript
// ✅ DEPOIS: Cores visíveis
stroke={Colors.greyLight}          // Background cinza
stroke={isUrgent ? Colors.error : Colors.primary}  // Azul/vermelho
color: Colors.primary              // Texto azul
```

**2. Espaçamento insuficiente nos botões**

**Problema:**
- Pouco espaço entre botões e fim da tela
- Botão "Aceitar" muito pequeno

**Solução:**
```typescript
// Aumentado paddingTop de 8 para 20
paddingTop: 20px

// Aumentado altura de 56 para 60
height: 60px

// Adicionado padding horizontal
paddingHorizontal: 24px
```

---

### 3. Arquivos Modificados

#### 3.1. `/lib/useLocationTracking.ts`
**Novo arquivo** - Custom hook de rastreamento
- Gerenciamento de estado de localização
- Integração com Socket.IO WebSocket
- Tratamento de permissões e GPS
- Loop de atualização a cada 10 segundos
- Precisão alta (5-10m)

#### 3.2. `/components/IncomingCallModal.tsx`
**Novo arquivo** - Modal de chamado estilo Uber
- Bottom sheet pattern
- Timer circular SVG
- Animações com Reanimated
- Feedback háptico
- RoutePoint component para origem/destino
- TimerRing component para countdown

#### 3.3. `/app/dashboard.tsx`
**Modificado** - Dashboard do guincheiro
- Integração do `useLocationTracking`
- Modais de permissão e GPS
- IncomingCallModal
- Simulação de chamado (temporária)
- Handlers de aceitar/rejeitar

#### 3.4. `/.env`
**Modificado** - Configuração da API
```bash
API_BASE_URL=http://192.168.0.5:3004
```
Usado para testar em dispositivo físico na rede local.

#### 3.5. `/lib/useNotificationSound.ts`
**Novo arquivo** - Custom hook para som de notificação
- Usa `expo-audio` (substituto do expo-av deprecated)
- Hook `useAudioPlayer` para gerenciar áudio
- Toca som 1 vez quando recebe chamado
- API simplificada e moderna
- Arquivo de som: `toque-notificacao.mp3` (raiz do projeto)

#### 3.6. `/lib/serviceTypes.ts`
**Novo arquivo** - Mapeamento de tipos de serviço
- 26 tipos de serviço mapeados
- Função `getServiceTypeLabel()` para tradução PT-BR
- Função `getServiceTypeIcon()` para ícones por categoria
- Categorias: Guincho, Bateria, Pneu, Chaveiro, Combustível, Outros

#### 3.7. `/toque-notificacao.mp3`
**Novo arquivo** - Arquivo de áudio de notificação
- Localização: Raiz do projeto
- Formato: MP3
- Tocado quando recebe novo chamado via WebSocket
- Sincronizado com aparição do modal

---

### 4. Dependências Adicionadas

```json
{
  "socket.io-client": "^4.8.3",         // WebSocket
  "react-native-svg": "15.12.1",        // Timer SVG
  "react-native-reanimated": "~4.1.1",  // Animações
  "expo-haptics": "~15.0.8",            // Vibração
  "expo-location": "~19.0.8",           // GPS
  "expo-audio": "^16.0.8"               // Som de notificação (substituto do expo-av)
}
```

---

### 5. Testes Realizados

#### 5.1. Rastreamento GPS

✅ **Teste 1: Permissão Negada**
- App solicita permissão
- Usuário nega
- Modal de permissão aparece
- Botão abre configurações do sistema

✅ **Teste 2: GPS Desativado**
- GPS desligado nas configurações
- Modal de GPS aparece
- Botão abre configurações do sistema

✅ **Teste 3: Conexão WebSocket**
- WebSocket conecta com sucesso
- Logs mostram conexão estabelecida
- Status muda para "connected"

✅ **Teste 4: Envio de Localização**
- Localização enviada a cada 10 segundos
- Servidor recebe e confirma
- LastUpdate atualizado
- Variação normal de GPS (~5-10m)

✅ **Teste 5: Reconexão Automática**
- Servidor desligado
- Status muda para "disconnected"
- Servidor religado
- WebSocket reconecta automaticamente

#### 5.2. Modal de Chamado

✅ **Teste 1: Aparição e Animações**
- Modal sobe de baixo para cima
- Todas as seções animam na ordem correta
- Timer aparece imediatamente

✅ **Teste 2: Timer**
- Conta de 60 até 0
- Cores mudam de azul para vermelho aos 10 segundos
- Vibração a cada segundo nos últimos 10 segundos
- Para no zero sem fechar modal

✅ **Teste 3: Botões**
- Botão rejeitar vibra e fecha modal
- Botão aceitar vibra (sucesso) e fecha modal
- Animação de pulse no botão aceitar funciona

✅ **Teste 4: Responsividade**
- Adapta-se a diferentes tamanhos de tela
- Safe area insets funcionam corretamente
- Espaçamentos adequados

---

### 6. Próximas Etapas

#### 6.1. Rastreamento GPS
- [ ] Implementar rastreamento em background (foreground service)
- [ ] Adicionar notificação persistente "Localização ativa"
- [ ] Otimizar consumo de bateria
- [ ] Implementar fallback para rede (se GPS indisponível)
- [ ] Adicionar logs de debug desabilitáveis

#### 6.2. Modal de Chamado
- [ ] Integrar com API real (receber chamados via WebSocket)
- [ ] Implementar aceitação de chamado (PUT /call/{key}/accept)
- [ ] Implementar rejeição de chamado (se necessário)
- [ ] Adicionar deep link para abrir app com chamado
- [ ] Implementar push notification quando app em background
- [ ] Remover simulação de chamado
- [ ] Adicionar tratamento de erro se aceitação falhar
- [ ] Navegar para tela de chamado ativo ao aceitar

#### 6.3. Tela de Chamado Ativo
- [ ] Criar tela `/app/active-call.tsx`
- [ ] Mostrar informações completas do chamado
- [ ] Integrar mapa com rota
- [ ] Botões de contato (WhatsApp, Telefone, Navegação)
- [ ] Timeline de status
- [ ] Vistoria (Check-in/Check-out)

---

### 7. Lições Aprendidas

#### 7.1. GPS e Localização
- GPS varia naturalmente mesmo parado (~5-10m é normal)
- Accuracy.High consome mais bateria, mas é necessário
- Sempre verificar GPS ativado, não só permissão
- AppState listener é essencial para detectar volta do app

#### 7.2. WebSocket
- Socket.IO reconecta automaticamente
- Sempre limpar conexão no cleanup
- Callback no emit garante confirmação de recebimento
- Timeout necessário para evitar travamentos

#### 7.3. Animações
- react-native-reanimated é mais performático que Animated
- Delays sequenciais criam efeito "cascata" agradável
- Feedback háptico melhora muito a experiência
- withSpring é mais natural que withTiming para botões

#### 7.4. Design
- Cores devem contrastar com o fundo (óbvio mas importante!)
- Bottom sheet é mais intuitivo que modal centralizado
- Timer visual é melhor que só texto
- Vibração é mais universal que som (acessibilidade)

#### 7.5. Debug
- Console.log estratégicos ajudam muito
- Testar em dispositivo real sempre que possível
- Emulador não simula rotas GPS corretamente
- Chrome DevTools útil para inspecionar WebSocket

---

## Changelog

### 2026-02-16

**Integração WebSocket para Recebimento de Chamados:**
- ✅ Implementado listener `call:new` no WebSocket
- ✅ Entrada automática no room `towing_drivers` ao conectar
- ✅ Interface `IncomingCall` para tipagem dos dados do WebSocket
- ✅ Callback `onNewCall` no hook `useLocationTracking`
- ✅ Removida simulação de chamado do dashboard
- ✅ Modal agora aparece apenas ao receber evento real do WebSocket
- ✅ Campos opcionais no modal (distance, estimatedTime, vehiclePlate)
- ✅ Renderização condicional da statsBar baseada em dados disponíveis
- ✅ Por enquanto exibindo apenas o endereço (`address`) no modal
- ✅ Documentação completa da integração WebSocket
- ✅ Exemplos de payload do evento `call:new`

**Ajustes no Timer do Modal:**
- ✅ Aumentado timeout de 15 para 60 segundos
- ✅ Threshold de urgência ajustado de 5 para 10 segundos
- ✅ Vibração nos últimos 10 segundos (ao invés de 5)
- ✅ Documentação atualizada com novos valores

**Tradução de Tipos de Serviço:**
- ✅ Criado arquivo `lib/serviceTypes.ts` com mapeamento completo
- ✅ Função `getServiceTypeLabel()` para traduzir service_type
- ✅ Função `getServiceTypeIcon()` para ícones por categoria
- ✅ 26 tipos de serviço mapeados (Guincho, Bateria, Pneu, Chaveiro, Combustível, Outros)
- ✅ Modal agora exibe tipo de serviço em português
- ✅ Documentação completa com exemplos

**Som de Notificação:**
- ✅ Migrado de `expo-av` (deprecated) para `expo-audio` (oficial SDK 54)
- ✅ Criado hook `useNotificationSound` com API moderna
- ✅ Hook `useAudioPlayer` do expo-audio para gerenciar áudio
- ✅ Som toca **1 vez** quando recebe chamado (sincronizado com modal)
- ✅ Arquivo de som: `toque-notificacao.mp3` (raiz do projeto)
- ✅ Carregamento automático via hook React
- ✅ Cleanup automático ao desmontar componente
- ✅ API simplificada: `player.play()` + `player.seekTo(0)`
- ✅ Documentação completa com troubleshooting
- ✅ Comparação expo-av vs expo-audio documentada

### 2026-02-15

**Rastreamento GPS e Modal de Chamado:**
- ✅ Implementado custom hook `useLocationTracking`
- ✅ Integração com Socket.IO para localização em tempo real
- ✅ Precisão GPS alta (5-10 metros)
- ✅ Envio de localização a cada 10 segundos
- ✅ Modais de permissão e GPS desativado
- ✅ Componente `IncomingCallModal` estilo Uber
- ✅ Timer circular SVG com animação
- ✅ Feedback háptico (vibração)
- ✅ Animações suaves com Reanimated
- ✅ RoutePoint component para origem/destino
- ✅ Correção de cores do timer (visibilidade)
- ✅ Ajuste de espaçamentos e tamanhos de botões
- ✅ Documentação completa da implementação

**Autenticação:**
- ✅ Implementado login de guincheiro com integração completa à API
- ✅ Criado serviço de API com axios (`lib/api.ts`)
- ✅ Implementado salvamento de `platform_type` para redirecionamento automático
- ✅ Corrigidos erros de logout e proteção de rotas
- ✅ Implementada limpeza automática de dados ao fazer logout
- ✅ Adicionado tratamento de erros com mensagens amigáveis (AppDialog)
- ✅ Suprimidos logs técnicos do axios no console
- ✅ Atualizado fluxo de login para 2 passos (CPF → Senha)
- ✅ Documentado todo o processo de autenticação

### 2026-02-14
- ✅ Configuração inicial do ambiente de desenvolvimento
- ✅ Resolução de problemas com Node.js 18 vs 20
- ✅ Configuração do Android SDK no WSL
- ✅ Criação de wrappers para ADB
- ✅ Estrutura base do projeto

---

**Última atualização:** 2026-02-16
