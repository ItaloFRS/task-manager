# Quadro (front-end Angular)

Interface estilo Trello para a Task Manager API: quadros, colunas (A fazer, Em andamento, Concluído),
cartões com arrastar e soltar, painel de edição e tela de usuários.

## Antes de rodar

1. **MongoDB ligado** (`docker start mongo`) e a **API Java rodando** em `http://localhost:8080`.
2. Copie `KanbanService.java` e `KanbanController.java` para o projeto Java (veja a pasta `backend/`)
   e reinicie a API. Sem eles, criar, editar e arrastar cartões e excluir quadros não funcionam.
3. Tenha o **Node.js 20.19+ (ou 22.12+)** instalado: `node -v`.

## Rodar

```
npm install
npm start
```

Abra `http://localhost:4200`.

O `npm start` usa o `proxy.conf.json`, que encaminha `/api` para `http://localhost:8080`.
Por isso não precisa configurar CORS no Java. Se a API estiver em outra porta, altere o `target` nesse arquivo.

## Telas

| Rota | O que faz | Banco |
|---|---|---|
| `/boards` | Lista, cria e exclui quadros | MongoDB |
| `/boards/:id` | Quadro com colunas, cartões, arrastar e soltar | MongoDB |
| `/users` | Lista e cadastra usuários | Relacional (JPA) |

Dica: rode `POST /api/mongo/seed` no Swagger para ter dados de exemplo.

## Estrutura

```
src/app/
  core/            modelos, serviço de API, utilitários
  pages/           boards-page, board-page, users-page
  components/      card-drawer (painel lateral de edição)
```

## Build de produção

```
npm run build
```

Os arquivos saem em `dist/quadro/browser`.
