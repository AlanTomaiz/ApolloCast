# Etapa 2 - Modelagem de estado de cast e midia

## Objetivo

Introduzir um modelo de estado de dominio para discovery, conexao e midia no renderer, reduzindo fragilidade de estado ad-hoc e preparando as proximas etapas.

## Implementacao realizada

### 1) Novo reducer tipado

Arquivo:
- src/renderer/state/castReducer.ts

Conteudo principal:
- Estados:
  - discovery: status, devices, reason
  - connection: status, deviceId, reason
  - media: status, filePath, fileName, reason
- Status modelados por unioes literais:
  - DiscoveryStatus
  - ConnectionStatus
  - MediaStatus
- Acoes modeladas:
  - DISCOVERY_STARTED, DISCOVERY_STOPPED, DISCOVERY_FAILED
  - DEVICE_FOUND, DEVICE_SELECTED
  - CONNECTION_STATUS_SET
  - MEDIA_SELECTED, MEDIA_CLEARED, MEDIA_STATUS_SET
- Dedupe de dispositivos por id deterministico (`host-name-type`) via `getDeviceId`.

### 2) Contexto migrado para reducer

Arquivo:
- src/services/Context/index.tsx

Ajustes:
- Troca de `useState` disperso por `useReducer(castReducer, initialCastState)`.
- Exposicao de `state` completo no contexto.
- Compatibilidade mantida:
  - `chromecasts`
  - `chromecast`
  - `setDevice`
- Novas APIs no contexto:
  - `setConnectionStatus`
  - `setMediaSelection`
  - `clearMediaSelection`
  - `setMediaStatus`
- Discovery atual continua ativo no mount, agora despachando acoes do reducer.

## Resultado tecnico da etapa

- Estado de cast/midia deixou de ser implicito e passou a ser explicito e tipado.
- A base para etapas 3-8 foi preparada sem quebrar a UI atual.
- Nenhuma mudanca ainda em ciclo de vida de discovery, sessao de conexao real ou transmissao (fica para etapas seguintes).

## Validacao

Verificacao de erros:
- src/services/Context/index.tsx: sem erros
- src/renderer/state/castReducer.ts: sem erros
- src/@types/Window.d.ts: sem erros

## Pendencias para etapas seguintes

- Etapa 3: lifecycle completo de discovery (start/stop/cleanup + erro + retry)
- Etapa 4: UI de lista conectada ao estado real
- Etapa 5: sessao real de conexao cast
- Etapa 6: seletor de arquivo via IPC
- Etapa 7: start stream
- Etapa 8: loading/erro/retry/feedback
