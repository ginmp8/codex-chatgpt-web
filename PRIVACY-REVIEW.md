# Codex ChatGPT Web — revisão de privacidade (6.1.13-privacy.1)

**Escopo:** ZIP `codex-chatgpt-web-main.zip` fornecido pelo usuário; inspeção estática de arquivos e fluxos de rede, navegador, autenticação, atualização, telemetria, MCP e empacotamento. Cópia resultante modificada em diretório separado; original mantido intacto. **NÃO é um parecer de segurança completo, pentest ou certificação de ausência de spyware.**

**Conclusão:** não foi identificada, nos fluxos inspecionados, uma rotina implementada para transferir conversas, credenciais ou cookies à infraestrutura do mantenedor. Os caminhos de comunicação para `chatgpt.com`/OpenAI e loopback são esperados pelo produto. Entretanto, a ausência de exfiltração não foi demonstrada em execução, o código contém dependências externas não auditadas individualmente e continua sujeito à sessão, ao SO, ao Codex e ao túnel MCP. **Não é prudente autenticar uma conta Business confidencial antes de validar o build e a rede em ambiente isolado.**

## Constatações e evidências (repositório original)

| Área | Evidência estática | Leitura correta |
| --- | --- | --- |
| Atualizações de executáveis | `launcher/electron/main.cjs` importa e inicializa `createUpdateController`, com `checkOnce()` no startup. `launcher/electron/update.cjs` acessa `https://api.github.com/repos/miuuyy/codex-chatgpt-web/releases/latest`, baixa artefatos e usa `update-worker.cjs` para substituir o aplicativo | **Risco de cadeia de suprimentos:** uma atualização futura poderia introduzir código com acesso ao perfil. Não prova exfiltração na versão analisada |
| Contato desnecessário com mantenedor | `launcher/electron/main.cjs` exigia `githubOpened` e `xOpened` antes de finalizar onboarding; `launcher/src/App.tsx` apresentava as ações | Exposição de visita ao site/rede social, não envio demonstrado de chats |
| Logs locais | `launcher/electron/logging.cjs` registra detalhes de eventos e erros. Sanitização original protege diversos tokens, mas não garante anonimização de toda string livre | **Possível exposição local** por logs ou compartilhamento de diagnósticos; nenhuma exportação automática ao mantenedor foi demonstrada |
| Diagnósticos de navegador | `src/adapters/chatgpt-web/browser-worker.ts` (`ChatGptBrowserDiagnostics`) tem persistência de checkpoints e capturas opcionais de tela/estrutura | Metadados/snapshots locais podem revelar informação sensível, especialmente se exportados ou acessados por malware |
| Métricas de utilização | `launcher/electron/limits-controller.cjs` e `limits-store.cjs` persistem hashes de identificadores de conta, modelos e horários se o usuário habilita Limits | **Armazenamento local opcional**, não evidência de coleta pelo mantenedor |
| Sessão autenticada | Perfil persistente do Electron em `launcher/electron/profile.cjs` e `browser-host.cjs` | Quem controla o usuário do sistema operacional pode acessar o perfil do aplicativo; não é um segredo que se torna invulnerável por estar na máquina local |
| HTTP local e ferramentas | `src/server.ts` oferece Responses por loopback; `docs/security-model.md` declara ausência de autenticação bearer independente no endpoint local. Full mode usa MCP com ferramentas Codex | **Risco residual de acesso de processo local** e execução de ferramentas, mesmo após o hardening; não foi demonstrada exploração |
| Túnel e chaves | `src/tunnel.ts`, `launcher/electron/tunnel-proxy.cjs`: túnel OpenAI outbound para Full mode | Um serviço externo legítimo continua necessário; chave e permissões MCP ainda têm de ser protegidas |
| Rede para mantenedor | Na análise estática de chamadas de rede do launcher/bridge, a consulta a release do mantenedor se concentra no subsistema de updater; existem links estáticos de documentação | Não há prova de que todo tráfego futuro, binários de terceiros ou comportamento real fiquem restritos a esses destinos |

**Estados de evidência:** os caminhos acima são fatos estáticos inspecionados; exploração, envio de conversas ao mantenedor, robustez de todos os controles em execução e ausência definitiva de backdoors **não foram demonstrados nem refutados**. Não atribuí intenção maliciosa ao autor.

## Alterações na cópia privada

1. **Updater:** removido o controlador da inicialização e desativado o IPC de instalação; `update.cjs` e `update-worker.cjs` excluídos do pacote; `compareVersions` extraído para o módulo sem rede `version-compare.cjs`.
2. **Instalação:** `scripts/install.sh`, `scripts/install-launcher.sh` e `scripts/install-launcher.ps1` falham explicitamente; publicação de releases original desativada. README aponta somente à revisão e compilação local. Não há binário upstream implícito.
3. **Identidade e cookies:** `appId`, produto, perfil local e partições do Electron separados (`.codex-chatgpt-web-private`, `Codex Web GPT Private`). Sobrescritas explícitas que tentam reutilizar os caminhos padrão do upstream são rejeitadas; perfis DEV também separados. `CODEX_HOME` permanece compartilhável para integração intencional com Codex e PandaCode.
4. **Coexistência:** a cópia privada recusa migrar, interromper ou desinstalar um runtime marcado como gerenciado externamente; esse runtime deve ser desligado e removido por seu proprietário antes de conectar o novo.
5. **Logging:** registros persistidos contêm apenas data, nível, nome estático do evento e `detail: {}`; exportação/releitura não levam detalhes. Stacktraces crus do processo não são gravados pelo guard de diagnóstico. **Outros componentes ou o SO podem continuar emitindo seus próprios logs**.
6. **Diagnósticos do navegador:** implementação do `ChatGptBrowserDiagnostics` convertida em no-op; checkpoints e screenshots não são gravados por essa classe. Isso reduz capacidade de depuração.
7. **Usage tracking:** controlador substituído por uma implementação desabilitada. `trackUsage:false` é enviado pelo controle do launcher; a função de coleta de identidade da sessão não deve ser chamada por esse fluxo.
8. **Saídas externas:** links do GitHub/X do mantenedor removidos do onboarding e da sidebar, handlers sociais desativados; launcher só abre URLs exatas previamente permitidas de ChatGPT/plataforma/Help Center. Popups arbitrários da página não podem abrir links no navegador do sistema; provedores de SSO ainda precisam ser validados.
9. **Autorizações:** o modo `--auto-approve-tool-calls` é rejeitado no CLI; configuração e browser-worker forçam `false`; a opção GUI também rejeita ativação. **Isso não elimina poderes do MCP: aprovações do workspace ChatGPT e do Codex continuam relevantes.**
10. **Inicialização automática:** `autoStart` padrão desativado, sem impedir opção explícita do usuário.

**Mantido intencionalmente:** o uso da interface ChatGPT autenticada, catálogo de modelos `(Web)`, streaming, seleção de Effort, Codex CLI/app-server, compilação do código, integrações MCP opt-in e outras capacidades do upstream não explicitamente removidas.

## Riscos residuais e não conformidades

- **Sem garantia sobre o sistema operacional:** outro processo executado no mesmo usuário ainda pode ler arquivos de perfil/cookies e conectar-se ao Responses local, conforme o ambiente e permissões. Defender-se disso requer isolamento de SO, contas distintas, controles de acesso, firewall e/ou autenticação efetiva no contrato do bridge.
- **Sem auditoria completa de dependências e build:** pacotes do `bun.lock`, `launcher/bun.lock`, runtime Bun/Electron e binários de túnel precisam de revisão e verificação de hashes em máquina controlada. Não executar comandos `curl | sh` ou `irm | iex` do upstream.
- **Conta ChatGPT Business:** mensagens são enviadas ao ChatGPT, não a uma API paga de inferência por este caminho de browser segundo a arquitetura do upstream; isso não garante ausência de limites, custo de serviços auxiliares nem autorização contratual. Developer Mode e políticas da organização podem vedar MCP ou automação.
- **Full harness:** pede um túnel OpenAI, chave do tunnel-client e conector com possibilidade de ações amplas. Adoção de MCP e acesso a arquivos exige revisão de permissões. Desativação de clique automático não implica que todas as chamadas são manualmente aprovadas pelo usuário.
- **Mudanças de UI e SSO:** automação por DOM não oficial pode quebrar. A política mais estrita contra `window.open` pode impedir alguns fluxos empresariais de login.
- **Solução não compilada/testada ao vivo:** não executamos login, modelo, envio real, sandbox de arquivos, teste de rede, integração PandaCode, smoke/E2E, fuzzing, build Rust/Node nem teste de dependências. O ZIP contém apenas **código-fonte candidato**.
- **Não se atribui intenção:** a presença de atualizador, logs e contadores não é por si evidência de espionagem, mas amplia superfícies que o usuário explicitamente quer reduzir.

## Verificações efetuadas nesta entrega

- Inspeção manual estática de caminhos de entrada/saída, perfis, updater, navegador, logging, MCP e persistência; contraste de código original vs cópia privada.
- Varredura estática por endpoints externos/telemetria e por `require()` relativos em módulos Electron; não abrange todo comportamento de dependências.
- `node --check launcher/electron/*.cjs`: **parse válido**; não executa aplicação.
- TypeScript compiler API (`createSourceFile`) para arquivos `.ts/.tsx` editados: **parse válido**; não faz typecheck.
- `python security/verify_privacy.py`: contrato estático de desativação/isolamento; não prova ausência de backdoor nem implementação executável.
- **Não executado:** `bun install`, `bun run verify`, `bun run app:package`, testes com servidor ou conta, CI multissistema. O Bun 1.4.0 exigido não está instalado no ambiente de auditoria. Não executei código do projeto devido à ausência de uma sandbox isolada aprovada.

## Procedimento responsável para validação antes de uso

1. Auditar o diff e os checksums do ZIP contra a fonte original e o `bun.lock` / `launcher/bun.lock`.
2. Montar ambiente temporário de usuário não privilegiado, sem secrets reais, e controle de tráfego de saída; validar dependências e scripts antes da instalação.
3. Compilar somente a cópia privada com Bun 1.4.0; rodar todos os testes offline possíveis, checar eventuais falhas por contratos intencionalmente alterados e garantir que o binário empacotado exclui `update.cjs` e `update-worker.cjs`.
4. Testar login com uma conta de **teste autorizada**, observar todo tráfego DNS/HTTP/TLS sem tentar quebrar criptografia ou capturar credenciais, e confirmar que não ocorre comunicação com domínios de maintainers/telemetria.
5. Confirmar que uso via Codex e PandaCode lista modelos `(Web)` e Effort e que ferramentas, cancelamento, SSO e rollback funcionam com permissões restritas.
6. Antes de uma conta Business, solicitar autorização do administrador do workspace, documentar limites/termos e estabelecer recuperação: sair da sessão, revogar acesso/túnel e remover o bridge da configuração Codex.

**Parecer:** `INCONCLUSIVE` para a exigência “seguro para minha conta”; `STATIC_GATES_PASSED` para os controles de privacidade implementados após execução do verificador. Este documento não é uma liberação para produção.
