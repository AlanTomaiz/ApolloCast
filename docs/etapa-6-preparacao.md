# Etapa 6 - Preparacao (escolha de arquivo de video)

## Objetivo da etapa

Permitir que o usuario selecione um arquivo de video local usando dialog nativo do Electron e persistir essa selecao no estado global para uso na transmissao (etapa 7).

## Escopo da implementacao (quando autorizado)

1. Main process
- Expor handler IPC para abrir file picker nativo.
- Filtrar extensoes de video suportadas.
- Retornar metadados minimos do arquivo selecionado (path e nome).

2. Preload bridge
- Expor metodo `pickVideoFile()` no `window.render`.
- Encapsular chamada IPC para o renderer com tipagem segura.

3. Tipagem global
- Atualizar `src/@types/Window.d.ts` com contrato de retorno do picker.
- Definir tipo para `SelectedVideoFile`.

4. Contexto
- Criar acao de UI para abrir picker e salvar selecao via `setMediaSelection`.
- Tratar cancelamento sem erro.
- Garantir mensagens em pt-BR para falhas de selecao.

5. UI
- Adicionar controle visual para escolher arquivo.
- Exibir nome do arquivo selecionado.
- Manter compatibilidade com estado de conexao existente.

## Arquivos previstos para alteracao

- src/index.ts
- src/preload.js
- src/@types/Window.d.ts
- src/services/Context/index.tsx
- src/screen/index.tsx
- (se necessario) src/renderer/state/castReducer.ts

## Contrato proposto

Retorno de `pickVideoFile()`:

- `null` quando usuario cancela
- objeto quando seleciona:
  - `path: string`
  - `name: string`

## Criterios de aceite da etapa 6

- Usuario consegue abrir dialog nativo e selecionar video.
- Nome/caminho do arquivo ficam no estado global de midia.
- Cancelamento nao gera erro na UI.
- Mensagens de erro exibidas ao usuario em pt-BR.
- Sem regressao no fluxo de discovery/conexao ja implementado.

## Fora de escopo desta etapa

- Iniciar transmissao da midia (etapa 7).
- Controles de playback (play/pause/stop).
- Retry/feedback avancado (etapa 8).
