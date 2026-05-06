# Etapa 6 - Preparacao (escolha de arquivo de video)

## Objetivo da etapa

Permitir que o usuario selecione um arquivo de video local usando dialog nativo do Electron e persistir essa selecao no estado global para uso na transmissao (etapa 7).

## Escopo da implementacao (quando autorizado)

1. Main process
- Expor handler IPC para abrir file picker nativo.
- Filtrar extensoes de video suportadas.
- Retornar metadados minimos do arquivo selecionado (path e nome).

Detalhe tecnico proposto:
- Handler: `ipcMain.handle('pickVideoFile', ...)`
- Uso de `dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [...] })`
- Extensoes alvo iniciais: `mp4`, `mkv`, `webm`, `mov`, `avi`.

2. Preload bridge
- Expor metodo `pickVideoFile()` no `window.render`.
- Encapsular chamada IPC para o renderer com tipagem segura.

Detalhe tecnico proposto:
- `pickVideoFile: () => ipcRenderer.invoke('pickVideoFile')`

3. Tipagem global
- Atualizar `src/@types/Window.d.ts` com contrato de retorno do picker.
- Definir tipo para `SelectedVideoFile`.

Detalhe tecnico proposto:
- Tipo:
  - `path: string`
  - `name: string`
- Assinatura:
  - `pickVideoFile: () => Promise<SelectedVideoFile | null>`

4. Contexto
- Criar acao de UI para abrir picker e salvar selecao via `setMediaSelection`.
- Tratar cancelamento sem erro.
- Garantir mensagens em pt-BR para falhas de selecao.

Detalhe tecnico proposto:
- Expor no contexto:
  - `selectVideoFile: () => Promise<boolean>`
- Comportamento:
  - retorna `false` em cancelamento
  - retorna `true` em selecao valida
  - em erro, atualiza `media.reason` com mensagem pt-BR

5. UI
- Adicionar controle visual para escolher arquivo.
- Exibir nome do arquivo selecionado.
- Manter compatibilidade com estado de conexao existente.

Detalhe tecnico proposto:
- Botao visivel apenas quando `state.connection.status === 'connected'`.
- Exibir selecao atual abaixo do botao:
  - `Arquivo selecionado: <nome>`
- Em ausencia de arquivo:
  - `Nenhum arquivo selecionado`.

## Arquivos previstos para alteracao

- src/index.ts
- src/preload.js
- src/@types/Window.d.ts
- src/services/Context/index.tsx
- src/screen/index.tsx
- (se necessario) src/renderer/state/castReducer.ts

Estado atual confirmado:
- readiness do main ja implementado em `waitForMainWindowLoaded`.
- discovery/conexao ja estabilizados e com logs pt-BR.
- etapa 6 nao exige mudanca em discovery.

## Contrato proposto

Retorno de `pickVideoFile()`:

- `null` quando usuario cancela
- objeto quando seleciona:
  - `path: string`
  - `name: string`

Exemplo de retorno:

```ts
{ path: 'C:/Videos/filme.mp4', name: 'filme.mp4' }
```

## Criterios de aceite da etapa 6

- Usuario consegue abrir dialog nativo e selecionar video.
- Nome/caminho do arquivo ficam no estado global de midia.
- Cancelamento nao gera erro na UI.
- Mensagens de erro exibidas ao usuario em pt-BR.
- Sem regressao no fluxo de discovery/conexao ja implementado.

Checklist de validacao (manual):
- Conecta em device no modal.
- Botao de selecionar arquivo aparece apos conexao.
- Dialog abre no sistema operacional.
- Cancelar dialog nao gera erro visual.
- Selecionar arquivo atualiza nome na UI.
- `yarn lint` sem erros.

## Fora de escopo desta etapa

- Iniciar transmissao da midia (etapa 7).
- Controles de playback (play/pause/stop).
- Retry/feedback avancado (etapa 8).

## Pronto para execucao

A etapa esta preparada e pode ser implementada imediatamente apos sua autorizacao.
