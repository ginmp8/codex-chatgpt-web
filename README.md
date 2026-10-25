# Codex ChatGPT Web — Privacy Fork (6.1.13-privacy.1)

**Versão de código-fonte isolada. Não é um executável pronto nem uma garantia de segurança.**

Esta cópia deriva do projeto `miuuyy/codex-chatgpt-web` na versão base 6.1.13.
Seu objetivo é reduzir a exposição da conta e das conversas a terceiros por
meio de atualizações e registros locais. As modificações e as limitações
estão documentadas em [PRIVACY-REVIEW.md](PRIVACY-REVIEW.md).

## Proteções desta variante

- Não busca nem instala atualizações publicadas pelo mantenedor original.
- Scripts de instalação remota desativados; exige revisão e compilação local.
- Perfil, cookies e diretórios privados separados do programa original.
- Atualização de modelos do Codex ainda é mediada pelo bridge local, sem alterar o Codex.
- Não armazena métricas locais de uso por conta; logs mantêm nomes de eventos,
  mas eliminam valores textuais e o diagnóstico de navegador não grava capturas.
- Remove requisito de visitar GitHub/X do mantenedor durante onboarding.
- Desativa cliques automáticos de aprovação de ferramentas MCP.

## Compilação — somente após validação independente

Usar ambiente confiável e isolado, revisar `bun.lock`, dependências e scripts de build.
O projeto exige **Bun 1.4.0** e toolchain para Electron. Não execute instaladores
ou binários do repositório original ao instalar esta variante.

```sh
bun install --frozen-lockfile
bun run verify
bun run app:package
```

As etapas acima são **instruções**, não testes que tenham sido executados nesta entrega.
O empacotamento faz uso de dependências externas; a variante não inclui um binário pré-compilado.

### Para usar com Codex e PandaCode

O launcher utiliza o `CODEX_HOME` selecionado pelo Codex. Depois de compilar,
abrir o programa, autenticar somente pela UI do ChatGPT e instalar os modelos,
reinicie completamente os processos Codex. O PandaCode consulta `model/list` do
Codex e poderá exibir os modelos `(Web)`, porém isso não foi testado com conta real.
Full harness exige conector/túnel MCP no ChatGPT e permissões apropriadas;
**não habilite acesso amplo a arquivos ou ferramentas sem avaliar as consequências**.

### Restrições conhecidas

- A sessão do ChatGPT ainda é persistida localmente em Electron; outro programa
  com acesso ao mesmo usuário de sistema operacional pode comprometer a sessão.
- O bridge HTTP local não é uma fronteira contra outros processos locais do mesmo usuário.
- ChatGPT, provedores de SSO e o túnel MCP (se ativado) são serviços externos legítimos.
- O navegador pode ser alterado pelo ChatGPT; o projeto usa seletores não oficiais.
- Este fork não remove a exposição inerente a ações MCP autorizadas pelo ChatGPT.
- Versões posteriores deste fork exigem nova revisão. Sem atualização automática.
- O uso de automação da interface web pode contrariar regras da OpenAI e do workspace.

**Antes de autenticar uma conta Business, submeta a implementação e o ambiente
à validação de segurança da organização.**
