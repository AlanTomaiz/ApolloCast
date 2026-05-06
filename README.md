# ApolloCast

Aplicativo desktop com Electron + React para descobrir dispositivos Google Cast, conectar a um receiver na rede local e transmitir um arquivo de video selecionado no computador.

## Visao geral

O projeto usa uma arquitetura classica de Electron com separacao entre:

- **Main process**: cria e controla a janela do app e expõe IPC para a interface.
- **Preload**: faz a ponte segura entre renderer e recursos Node.js/Chromecast.
- **Renderer (React)**: renderiza a UI, consome o contexto global e orquestra o fluxo de transmissao.

Atualmente, o app suporta:

- descoberta de dispositivos Google Cast com `bonjour`
- conexao e reconexao com dispositivos encontrados
- selecao de arquivo de video pelo dialog do sistema
- start automatico da transmissao ao selecionar o arquivo
- pausa, retomada, stop, seek e volume em tempo real
- metadata online do arquivo selecionado (titulo, subtitulo e capa)
- capa como background dinamico da interface quando disponivel
- loader de tela inteira durante o inicio da transmissao
- feedback de erro com acoes de retry no player e no modal de dispositivos

## Stack

- Electron 18
- Electron Forge (Webpack Plugin)
- React 18
- TypeScript
- Bonjour (mDNS/zeroconf)
- castv2-client
- React Icons

## Estrutura do projeto

```text
src/
  index.ts                        # Main process (Electron)
  preload.js                      # Bridge segura + cast/discovery/stream local
  renderer.ts                     # Entrada do React
  App.tsx                         # Root component
  index.css                       # Estilos globais
  components/
    LoadingOverlay/              # Loader compartilhado com blur do conteudo
    Player/                      # Player principal e controles da transmissao
  screen/
    index.tsx                    # Tela principal
    Header/index.tsx             # Barra superior customizada
    List/index.tsx               # Modal/lista de dispositivos e retry de conexao
  services/
    Context/index.tsx            # Estado global e orchestration do fluxo Cast
    Metadata/index.ts            # Parse do nome do arquivo + metadata online
  renderer/
    state/castReducer.ts         # Reducer e tipos de estado de discovery/conexao/media
  @types/
    Render.ts                    # Tipos de dispositivo/servico
    Window.d.ts                  # Tipagem global da API exposta em window
```

## Fluxo funcional

### 1) Main process

`src/index.ts` cria a `BrowserWindow` customizada e registra IPC para:

- fechar a aplicacao
- minimizar a janela
- aguardar a janela principal estar pronta
- abrir o seletor de arquivos de video

### 2) Preload

`src/preload.js` expõe a API `window.render` e concentra a integracao com:

- `bonjour` para discovery
- `castv2-client` para conexao e controle do receiver
- servidor HTTP local para servir o arquivo ao Chromecast

API exposta atualmente:

- `startDiscovery(callback)`
- `stopDiscovery()`
- `pickVideoFile()`
- `connectDevice(host)`
- `disconnectDevice()`
- `startStreaming(filePath, fileName?)`
- `pauseStreaming()`
- `resumeStreaming()`
- `stopStreaming()`
- `getStreamingStatus()`
- `seekStreaming(seconds)`
- `getStreamingVolume()`
- `setStreamingVolume(volumeLevel)`

### 3) Contexto global

`src/services/Context/index.tsx` centraliza o estado e as acoes de dominio:

- discovery de dispositivos
- conexao/desconexao de cast
- reinicio manual do discovery
- selecao de video
- start automatico da transmissao apos selecionar arquivo
- controle de pausa, resume, seek, stop e volume
- mensagens de erro em PT-BR

### 4) Tela principal

`src/screen/index.tsx` renderiza:

- botao de cast sempre visivel
- botao de selecionar video antes da selecao
- `Player` somente quando ha midia selecionada e o stream nao esta em loading
- `LoadingOverlay` durante o inicio da transmissao

### 5) Player

`src/components/Player/index.tsx` mostra:

- metadata do arquivo resolvida online
- capa do conteudo
- titulo corrigido
- subtitulo de temporada/episodio para series
- controle real de play/pause
- progresso real com seek
- controle real de volume
- feedback de erro com retry e reselecao de arquivo

## Metadata online

`src/services/Metadata/index.ts` faz duas etapas:

1. Parse do nome bruto do arquivo, identificando padroes como `S03E01` ou `3x01`.
2. Busca online para enriquecer a exibicao:

- series: TVMaze
- filmes: iTunes Search API

Se a busca falhar, o app usa fallback local com o nome normalizado do arquivo.

## Scripts

- `yarn start` -> ambiente de desenvolvimento
- `yarn package` -> empacota o app sem instalador
- `yarn make` -> gera artefatos de distribuicao
- `yarn publish` -> fluxo de publicacao do Forge
- `yarn lint` -> executa ESLint

## Requisitos

- Node.js LTS
- Yarn
- rede local com suporte a mDNS para discovery

## Como executar

1. Instale dependencias:

```bash
yarn
```

2. Rode em desenvolvimento:

```bash
yarn start
```

3. Gere pacote de distribuicao, se necessario:

```bash
yarn package
```

## Estado atual

O projeto ja cobre discovery, conexao, selecao de arquivo, transmissao, metadata, controles de playback, loader e retry basico. Os proximos passos naturais sao:

- revisar e expandir documentacao de build/distribuicao por plataforma
- validar fluxo ponta a ponta em rede real com Chromecast acessivel
- melhorar observabilidade do playback com eventos de estado do receiver

## Licenca

MIT
