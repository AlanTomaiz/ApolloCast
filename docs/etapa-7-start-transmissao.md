# Etapa 7 - Start de transmissao

## Objetivo

Iniciar a transmissao do video selecionado para o dispositivo Chromecast conectado.

## Implementacao aplicada

### 1) Preload - backend da transmissao

Arquivo:
- src/preload.js

Mudancas:
- Adicionados utilitarios de streaming local:
  - servidor HTTP local para servir arquivo de video
  - suporte a Range Requests (206) para playback no Chromecast
  - deteccao de IP local para montar URL acessivel pelo receiver
- Integracao com castv2-client:
  - launch de `DefaultMediaReceiver`
  - `player.load()` com autoplay
- Controle de sessao de midia:
  - `startStreaming(filePath, fileName)`
  - `stopStreaming()`
- Cleanup de midia ao desconectar dispositivo.

### 2) Tipagem da bridge

Arquivo:
- src/@types/Window.d.ts

Mudancas:
- `startStreaming(filePath, fileName?) => Promise<void>`
- `stopStreaming() => void`

### 3) Contexto React

Arquivo:
- src/services/Context/index.tsx

Mudancas:
- Novas APIs:
  - `startStreaming(): Promise<boolean>`
  - `stopStreaming(): void`
- Regras de validacao:
  - exige conexao ativa
  - exige arquivo selecionado
- Estados de midia:
  - `loading` ao iniciar
  - `playing` em sucesso
  - `failed` com mensagem pt-BR em falha
  - `stopped` ao parar
- Cleanup no unmount chama `window.render.stopStreaming()`.

### 4) UI principal

Arquivo:
- src/screen/index.tsx

Mudancas:
- Botao `Transmitir video`.
- Botao alterna para `Parar transmissao` quando status esta `playing`.
- Estado desabilitado quando:
  - sem conexao
  - sem arquivo selecionado
  - transmissao em inicializacao (`loading`)
- Exibicao de status:
  - iniciando transmissao
  - transmitindo
  - pronto para transmitir

### 5) Estilos

Arquivo:
- src/index.css

Mudancas:
- Estilo do botao `.streamBTN`.
- Estilo de texto de status `.media-status-info`.
- Ajustes de posicionamento da informacao de arquivo selecionado.

## Validacao

- Diagnostico sem erros nos arquivos alterados.
- `yarn lint` sem erros.

## Observacoes

- A transmissao usa URL HTTP local; para funcionar no device real, o Chromecast precisa alcancar o IP local da maquina.
- Controles avancados de retry/feedback e refinamentos adicionais ficam para a etapa 8.
