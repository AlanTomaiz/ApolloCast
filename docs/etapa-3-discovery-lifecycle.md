# Etapa 3 - Discovery com lifecycle

## Objetivo

Implementar ciclo de vida de descoberta de dispositivos com controle explicito de inicio, parada e cleanup.

## Implementacao aplicada

### Bridge preload

Arquivo:
- src/preload.js

Mudancas:
- Criado singleton `bonjourInstance`.
- Adicionado controle de browser ativo (`discoveryBrowser`).
- Implementado `stopDiscovery()` para encerrar scan atual e limpar referencia.
- Implementado `startDiscovery(callback)`:
  - encerra scan anterior
  - inicia novo scan de `googlecast`
  - reaproveita instancia singleton de bonjour
- `scanner(callback)` mantido por compatibilidade, agora usando o mesmo lifecycle.

### Tipagem da API global

Arquivo:
- src/@types/Window.d.ts

Mudancas:
- Tipado callback de discovery com `IService`.
- Adicionadas assinaturas:
  - `startDiscovery(callback)`
  - `stopDiscovery()`
- `scanner(callback)` mantido tipado para retrocompatibilidade.

### Contexto React

Arquivo:
- src/services/Context/index.tsx

Mudancas:
- `useEffect` passou a iniciar discovery via `window.render.startDiscovery`.
- Tratamento de erro de bootstrap do discovery com dispatch `DISCOVERY_FAILED`.
- Cleanup no unmount:
  - `window.render.stopDiscovery()`
  - dispatch `DISCOVERY_STOPPED`

## Resultado tecnico

- Discovery agora possui lifecycle controlado e cleanup explicito.
- Evita scanner paralelo/acumulo entre remounts.
- Prepara base para retry e controle de status na UI nas proximas etapas.

## Validacao

Arquivos validados sem erros:
- src/preload.js
- src/services/Context/index.tsx
- src/@types/Window.d.ts

## Observacoes

- Esta etapa nao altera ainda UX de lista/conexao; isso fica para etapas 4 e 5.
- `scanner` foi mantido por compatibilidade, mas o fluxo principal agora usa `startDiscovery/stopDiscovery`.
