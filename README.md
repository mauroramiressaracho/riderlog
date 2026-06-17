# RiderLog

**Seu diário de bordo na estrada.**

RiderLog é um app web/PWA mobile first para motociclistas que gostam de viajar. O objetivo do MVP é permitir que o piloto controle dados da moto, abastecimentos, viagens, manutenção, checklists e pontos de apoio diretamente no celular, com publicação simples no GitHub Pages.

## Funcionalidades

- Dashboard com resumo da moto, autonomia, consumo, gastos, última viagem e próxima manutenção.
- Cadastro e edição da moto.
- Controle completo de abastecimentos com cálculo de consumo e custo por km.
- Planejamento de viagem com estimativa de litros, custo, autonomia segura e paradas.
- Checklists prontos para bate-volta, viagem longa, garupa, chuva e outros cenários.
- Histórico de viagens em formato de diário de bordo.
- Controle de manutenções com alertas por quilometragem.
- SOS Estrada com buscas rápidas no Google Maps.
- Pontos salvos para consulta offline.
- Backup/exportação/importação em JSON.
- Configurações locais do app.

## Tecnologias

- React
- Vite
- TypeScript
- Tailwind CSS
- Dexie.js
- IndexedDB
- PWA com `manifest.json` e service worker
- GitHub Pages via GitHub Actions

## Persistência local

Os dados ficam salvos localmente no navegador do usuário usando IndexedDB. O app não usa backend, login ou banco online.

Importante: se o usuário limpar os dados do navegador, limpar o armazenamento do site ou remover dados do app/PWA, os dados do RiderLog também serão removidos. Use a tela **Backup** para exportar um arquivo JSON antes de limpar ou trocar de aparelho.

## Instalar dependências

```bash
npm install
```

## Rodar localmente

```bash
npm run dev
```

Depois acesse a URL exibida pelo Vite no terminal.

## Gerar build

```bash
npm run build
```

Para visualizar o build local:

```bash
npm run preview
```

## PWA

O app possui:

- `public/manifest.json` com nome, short name, descrição, cores e ícone básico.
- `public/sw.js` para cache offline básico.
- Cache dos assets gerados pelo Vite após o primeiro acesso.
- `start_url` e `scope` relativos para funcionar em subpasta.

Depois do primeiro acesso online, o service worker permite abrir o app novamente sem internet com funcionamento offline básico. Recursos externos, como Google Maps, continuam dependendo de conexão.

## GitHub Pages

O projeto já está preparado para GitHub Pages:

- `vite.config.ts` usa `base: '/riderlog/'`, correto para `https://mauroramiressaracho.github.io/riderlog/`.
- A navegação do app não depende de rotas de URL, então recarregar a página não quebra as telas.
- `.github/workflows/deploy.yml` publica o conteúdo de `dist` usando GitHub Actions.
- `public/.nojekyll` evita processamento pelo Jekyll no GitHub Pages.

### Publicar no GitHub Pages

1. Publique o repositório no GitHub.
2. Garanta que a branch principal seja `main`.
3. No GitHub, acesse **Settings > Pages**.
4. Em **Build and deployment**, selecione **GitHub Actions**.
5. Faça push para `main`.
6. O workflow `.github/workflows/deploy.yml` executará `npm ci`, `npm run build` e publicará o diretório `dist`.

## Estrutura principal

```text
src/
  app/
  components/
  db/
  pages/
  styles/
  types/
public/
  icons/
  manifest.json
  manifest.webmanifest
  sw.js
```
