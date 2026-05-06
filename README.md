# ApolloCast

Aplicativo desktop com Electron + React para descobrir dispositivos Google Cast na rede local e preparar o fluxo de transmissao.

## Visao geral

O projeto usa uma arquitetura classica de Electron com separacao entre:

- **Main process**: cria e controla a janela do app.
- **Preload**: expoe uma API segura para a interface via `contextBridge`.
- **Renderer (React)**: renderiza a UI e consome a API exposta no preload.

Atualmente, o app:

- Inicia uma janela customizada (sem frame nativo).
- Permite minimizar e fechar pela barra superior customizada.
- Faz descoberta de dispositivos Google Cast com `bonjour`.
- Mantem os dispositivos encontrados em contexto React.

## Stack

- Electron 18
- Electron Forge (Webpack Plugin)
- React 18
- TypeScript
- Bonjour (mDNS/zeroconf)
- React Icons

## Estrutura do projeto

```text
src/
  index.ts                  # Main process (Electron)
  preload.js                # Bridge segura para o renderer
  renderer.ts               # Entrada do React
  App.tsx                   # Import do app renderer
  index.css                 # Estilos globais
  screen/
    index.tsx               # Tela principal
    Header/index.tsx        # Barra superior customizada (acoes janela)
    List/index.tsx          # Lista/modal de dispositivos (ainda nao integrada)
  services/
    Context/index.tsx       # Estado global (dispositivos e dispositivo ativo)
  @types/
    Render.ts               # Tipos de dispositivo/servico
    Window.d.ts             # Tipagem global da API exposta em window
```

## Como funciona

### 1) Main process (`src/index.ts`)

- Cria `BrowserWindow` com:
  - `frame: false`
  - `transparent: true`
  - `resizable: false`
  - `contextIsolation: true`
  - `nodeIntegration: false`
- Registra handlers IPC:
  - `closeApp` -> encerra o app.
  - `minimize` -> minimiza a janela.

### 2) Preload (`src/preload.js`)

A API `window.render` e exposta com:

- `close()` -> chama `ipcRenderer.invoke('closeApp')`
- `minimize()` -> chama `ipcRenderer.invoke('minimize')`
- `scanner(callback)` -> inicia `bonjour().find({ type: 'googlecast' }, callback)`

### 3) Renderer (`src/renderer.ts`)

- Renderiza o React com `APIProvider` (contexto global).
- Exibe a tela principal `Screen`.

### 4) Contexto de dispositivos (`src/services/Context/index.tsx`)

No `useEffect` inicial:

- Chama `window.render.scanner(...)`
- Para cada servico encontrado, mapeia para:
  - `host` (primeiro endereco)
  - `name` (`txt.fn`)
  - `type` (`txt.md`)
- Adiciona ao array `chromecasts`.

Tambem expoe:

- `chromecasts`: lista de dispositivos descobertos.
- `chromecast`: dispositivo selecionado.
- `setDevice(device)`: define o dispositivo ativo.

## Scripts

No `package.json`:

- `yarn start` -> ambiente de desenvolvimento (Electron Forge).
- `yarn package` -> empacota app sem instalador.
- `yarn make` -> gera artefatos de distribuicao (Squirrel/ZIP/DEB/RPM).
- `yarn publish` -> fluxo de publicacao do Forge.
- `yarn lint` -> executa ESLint em `.ts` e `.tsx`.

Voce tambem pode usar `npm run <script>` se preferir npm.

## Requisitos

- Node.js (recomendado: LTS)
- Yarn (opcional, mas ha `yarn.lock` no repositorio)

## Como executar

1. Instale dependencias:

```bash
yarn
```

2. Rode em desenvolvimento:

```bash
yarn start
```

3. (Opcional) Gere pacote de distribuicao:

```bash
yarn make
```

## Estado atual e proximos passos

O projeto ja possui a base de descoberta de dispositivos e controle da janela, mas alguns pontos ainda podem evoluir:

- Integrar de fato o componente de lista/modal (`screen/List`) na tela principal.
- Evitar duplicidade de dispositivos durante o scan (deduplicacao por host/nome).
- Tratar ciclo de vida do scanner (start/stop/cleanup).
- Ajustar tipagens de `window.render.scanner` para refletir callback corretamente.
- Revisar detalhes visuais/variaveis CSS (`--grey` vs `--gray`).

## Licenca

MIT
