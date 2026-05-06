# Etapa 1 - Arquitetura alvo e contratos IPC (Opcao B)

## Objetivo

Definir um desenho tecnico robusto para suportar o fluxo completo:

1. abrir app
2. descobrir Chromecasts
3. listar dispositivos
4. conectar no dispositivo selecionado
5. selecionar video
6. transmitir video

Sem implementar codigo nesta etapa.

## Estado atual (resumo)

- Main process cria janela e oferece IPC basico para minimizar/fechar.
- Preload expoe scanner de discovery via bonjour.
- Contexto React guarda dispositivos descobertos e dispositivo selecionado.
- Nao existe sessao cast real, selecao de arquivo ou transmissao.

## Arquitetura alvo

### Camadas

1. Main process (orquestracao de integracoes nativas)
- Responsavel por:
  - ciclo de vida do app
  - file picker (dialog)
  - gerenciamento de sessao de cast (descoberta, conexao, load)
  - emissao de eventos de estado para renderer

2. Preload (bridge segura)
- Responsavel por:
  - expor API estritamente tipada em window.render
  - mediar requisicoes/acoes do renderer para o main
  - entregar stream de eventos assinado (subscribe/unsubscribe)

3. Renderer (UI + estado de dominio)
- Responsavel por:
  - estados de tela (idle, scanning, connecting, connected, streaming, error)
  - lista de dispositivos e selecao
  - comando de conectar/disconnect
  - escolha de arquivo e start/stop stream
  - feedback de loading/erro/retry

4. Modulo de dominio de cast (main)
- Discovery lifecycle: start/stop/cleanup
- Sessao: connect/disconnect/reconnect
- Media: load/play/pause/stop
- Validacao de pre-condicoes (ex: sem dispositivo conectado)

## Fluxo alvo ponta a ponta

1. App inicia
- Main sobe janela.
- Renderer inicia estado como idle.

2. Usuario inicia busca
- Renderer chama startDiscovery.
- Main inicia discovery.
- Eventos deviceFound e discoveryState sao enviados ao renderer.

3. Usuario visualiza e seleciona dispositivo
- Renderer atualiza lista deduplicada.
- Usuario dispara connectDevice(deviceId).

4. Conexao
- Main tenta conexao com timeout e retry controlado.
- Eventos de transicao: connecting -> connected ou failed.

5. Selecao de arquivo
- Renderer chama openVideoPicker.
- Main abre dialog nativo e retorna caminho.

6. Start streaming
- Renderer chama startCasting com deviceId e media.
- Main valida sessao conectada, prepara metadados e faz load no receiver.
- Eventos streamingState refletem progresso/erro.

## Contratos IPC propostos

### Namespace de comandos (invoke)

- app:minimize
- app:close
- cast:discovery:start
- cast:discovery:stop
- cast:devices:list
- cast:connect
- cast:disconnect
- cast:file:pick
- cast:media:start
- cast:media:stop
- cast:media:pause
- cast:media:resume
- cast:state:get

### Namespace de eventos (on/off)

- cast:event:discovery-state
- cast:event:device-found
- cast:event:device-lost
- cast:event:connection-state
- cast:event:media-state
- cast:event:error

### Tipos de payload (contrato)

Device:
- id: string (deterministico, ex: host:port)
- name: string
- host: string
- port: number
- model: string | null
- capabilities: string[]

ConnectionState:
- status: idle | connecting | connected | disconnecting | disconnected | failed
- deviceId: string | null
- reason: string | null

DiscoveryState:
- status: idle | scanning | stopped | failed
- deviceCount: number
- reason: string | null

MediaSelection:
- path: string
- name: string
- size: number
- mime: string | null
- durationMs: number | null

MediaState:
- status: idle | loading | playing | paused | stopped | failed
- positionMs: number
- durationMs: number | null
- reason: string | null

CastError:
- code: string
- message: string
- source: discovery | connection | media | ipc | validation
- recoverable: boolean

## Regras de transicao de estado

- Nao permitir start de media sem connectionState=connected.
- Nao permitir connect sem deviceId valido.
- Ao trocar dispositivo conectado, desconectar anterior antes de conectar novo.
- Ao encerrar app, parar discovery e encerrar sessao ativa.
- Em erro recoverable, permitir retry explicito na UI.

## Impactos por arquivo (planejado)

Arquivos existentes com ajuste:
- src/index.ts
  - registrar novos handlers IPC de cast e file picker
  - publicar eventos para renderer
- src/preload.js
  - expor API typed-safe para comandos e eventos
- src/@types/Window.d.ts
  - redefinir contratos de window.render
- src/services/Context/index.tsx
  - evoluir para estado de dominio (discovery/conexao/media)
- src/screen/index.tsx
  - integrar controles de discovery/conexao/arquivo/transmissao
- src/screen/List/index.tsx
  - consumir lista real e permitir selecao/conexao

Arquivos novos sugeridos (proximas etapas):
- src/main/cast/discovery.ts
- src/main/cast/session.ts
- src/main/cast/media.ts
- src/main/cast/types.ts
- src/renderer/state/castReducer.ts
- src/renderer/hooks/useCastEvents.ts

## Criterios de aceite da Etapa 1

- Arquitetura alvo definida com responsabilidades por camada.
- Contratos IPC definidos (comandos, eventos, payloads).
- Regras de transicao de estado documentadas.
- Mapa de impacto por arquivo aprovado para implementacao.
- Nenhuma alteracao funcional de codigo aplicada nesta etapa.

## Observacoes de compatibilidade

- Projeto e desktop Electron; itens Android/iOS nao se aplicam.
- Se houver adicao/substituicao de biblioteca de cast na implementacao, sera obrigatorio atualizar changelog/README na etapa de documentacao.
