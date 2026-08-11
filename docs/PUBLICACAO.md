# Como colocar o site no ar — passo a passo

Guia para o **dono do repositório**. Os passos 1 a 3 são cliques no GitHub que
só você pode dar; o passo 4 em diante é o que acontece sozinho depois.

Estado atual (11/08/2026, atualizado): o repositório já está **público**, a
branch **`main` existe e é a padrão**, e **Settings → Pages → Source já está em
GitHub Actions**. Ou seja, os passos 1 a 3 abaixo **já foram feitos** — ficam
registrados como referência e para o caso de precisar conferir. O que falta é o
passo 4: integrar a branch de trabalho na `main` para o deploy rodar.

---

## Passo 1 — Tornar o repositório público

**Obrigatório no plano gratuito**: GitHub Pages em repositório privado só
funciona com GitHub Pro/Team/Enterprise. Como o app é material didático para
compartilhar com a turma, público é o caminho natural.

1. Abra `https://github.com/gabrielgraciano/app-regressao`
2. Aba **Settings** (topo da página do repositório, à direita)
3. Role até o fim, seção **Danger Zone**
4. **Change repository visibility** → *Change to public* → confirme digitando
   o nome do repositório

> Se preferir manter privado: ou assine o GitHub Pro, ou publique por
> **Netlify/Vercel** — ambos servem um site público a partir de repositório
> privado no plano gratuito. Nesse caso o `deploy.yml` deixa de ser usado e a
> configuração é feita no painel do provedor (build `npm run build`, diretório
> `dist`) — e aí o `base` do Vite passa a ser `'/'`, não `'/app-regressao/'`.

## Passo 2 — Criar a branch `main` e torná-la padrão

O workflow de deploy dispara em push na `main`. Além disso, o ambiente
`github-pages` do GitHub, por padrão, só aceita deploy vindo da branch padrão.

1. Na página inicial do repositório, clique no **seletor de branches**
   (botão à esquerda, acima da lista de arquivos)
2. Digite `main` no campo de busca
3. Clique em **Create branch: main from 'claude/regression-simulation-app-pjeurb'**
4. Volte em **Settings → General**, seção **Default branch**
5. Clique no ícone de troca (⇄) → selecione **main** → **Update** → confirme

A partir daqui o fluxo normal é: agente trabalha na branch
`claude/regression-simulation-app-pjeurb` → Pull Request → merge na `main` →
deploy automático.

## Passo 3 — Ligar o GitHub Pages

1. **Settings** → menu da esquerda → **Pages**
2. Em **Build and deployment**, campo **Source**: troque de *Deploy from a
   branch* para **GitHub Actions**
3. Não há botão de salvar — a escolha vale imediatamente

Pode ser feito antes mesmo de o app existir. Sem este passo, o workflow falha
com um erro do tipo *"Get Pages site failed"* / *"Not Found"*.

## Passo 4 — Rodar o deploy

Depois que o `deploy.yml` (tarefa T7 das instruções operacionais) estiver na
`main`, o deploy roda sozinho a cada push. Para disparar na mão:

1. Aba **Actions**
2. Workflow **Deploy** na lista da esquerda
3. Botão **Run workflow** → branch `main` → **Run workflow**

## Passo 5 — Ver o site

- **Settings → Pages** mostra no topo: *"Your site is live at …"*
- Ou em **Actions**, abra a execução → o job `deploy` traz a URL clicável

Endereço final: **https://gabrielgraciano.github.io/app-regressao/**

A primeira publicação pode levar alguns minutos a mais para propagar. Se vier
a versão antiga, recarregue sem cache (`Ctrl+Shift+R` / `Cmd+Shift+R`).

---

## Quando der errado

| Sintoma | Causa | Correção |
|---|---|---|
| Workflow falha com *"Get Pages site failed"* ou *"Not Found"* | Source não está em GitHub Actions | Passo 3 |
| *"Pages is not available for private repositories"* | plano gratuito + repo privado | Passo 1 |
| *"Branch is not allowed to deploy to github-pages"* | regra de branch do ambiente | Settings → **Environments** → `github-pages` → **Deployment branches** → adicionar a branch |
| Página **em branco**, console com 404 em `/assets/…` | `base` do Vite errado | `vite.config.ts` deve ter `base: '/app-regressao/'` |
| **404** do GitHub na URL | deploy nunca concluiu | Actions → conferir se o job `deploy` ficou verde |
| CSS/JS somem só em subpágina | falta `public/.nojekyll` | criar o arquivo vazio |

## Checklist rápido

- [ ] Repositório público (ou provedor alternativo escolhido)
- [ ] Branch `main` criada e definida como padrão
- [ ] Settings → Pages → Source = **GitHub Actions**
- [ ] `vite.config.ts` com `base: '/app-regressao/'`
- [ ] `public/.nojekyll` presente
- [ ] Job `deploy` verde em Actions
- [ ] Site abre em https://gabrielgraciano.github.io/app-regressao/
