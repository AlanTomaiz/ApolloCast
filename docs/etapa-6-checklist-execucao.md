# Etapa 6 - Checklist de execucao

## Objetivo

Implementar selecao de arquivo de video local via dialog nativo.

## Ordem de implementacao

1. Main process
- adicionar handler IPC `pickVideoFile`
- validar cancelamento e retorno normalizado

2. Preload
- expor `pickVideoFile()` em `window.render`

3. Tipagem global
- adicionar tipo `SelectedVideoFile`
- tipar assinatura de `pickVideoFile`

4. Contexto
- criar `selectVideoFile()`
- persistir em estado com `setMediaSelection`
- definir erro pt-BR em falha

5. UI principal
- adicionar botao de selecao de arquivo
- mostrar nome do arquivo selecionado

## Criticos para nao quebrar

- nao alterar fluxo de discovery
- nao alterar fluxo de conexao ja funcional
- manter mensagens de erro em pt-BR

## Validacao final

- yarn lint
- fluxo manual: conectar device -> escolher arquivo -> ver arquivo na tela
