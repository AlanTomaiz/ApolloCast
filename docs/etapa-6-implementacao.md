# Etapa 6 - Implementacao (escolha de arquivo de video)

## Objetivo

Permitir selecao de arquivo de video local via dialog nativo do Electron e persistir no estado global.

## O que foi implementado

### 1) Main process

Arquivo:
- src/index.ts

Mudancas:
- Novo handler IPC `pickVideoFile`.
- Uso de `dialog.showOpenDialog` com filtro de videos:
  - mp4, mkv, webm, mov, avi
- Retorno:
  - `null` em cancelamento
  - `{ path, name }` em sucesso

### 2) Preload bridge

Arquivo:
- src/preload.js

Mudanca:
- Exposto `pickVideoFile: () => ipcRenderer.invoke('pickVideoFile')`.

### 3) Tipagem global

Arquivo:
- src/@types/Window.d.ts

Mudancas:
- Tipo `SelectedVideoFile`.
- Assinatura:
  - `pickVideoFile: () => Promise<SelectedVideoFile | null>`

### 4) Contexto

Arquivo:
- src/services/Context/index.tsx

Mudancas:
- Nova API de contexto: `selectVideoFile(): Promise<boolean>`.
- Fluxo:
  - abre picker nativo
  - trata cancelamento sem erro
  - persiste selecao via `MEDIA_SELECTED`
  - atualiza status de media para `stopped`
  - em erro, seta `MEDIA_STATUS_SET` com `failed` e mensagem pt-BR

### 5) UI

Arquivo:
- src/screen/index.tsx

Mudancas:
- Reutilizado botao estilizado `videoBTN` existente.
- Botao agora dispara `selectVideoFile()`.
- Botao fica desabilitado sem conexao ativa.
- Exibicao de arquivo selecionado:
  - `Arquivo selecionado: <nome>`
  - `Nenhum arquivo selecionado` quando vazio
- Exibicao de erro de selecao quando houver falha.

### 6) Estilos

Arquivo:
- src/index.css

Mudancas:
- Estilo do `videoBTN`.
- Estilos de feedback:
  - `.media-selection-info`
  - `.media-selection-error`

## Validacao

- Diagnostico sem erros nos arquivos alterados.
- `yarn lint` sem erros.

## Resultado da etapa

Etapa 6 concluida: usuario conectado agora consegue selecionar arquivo de video local e ver o arquivo selecionado na interface.
