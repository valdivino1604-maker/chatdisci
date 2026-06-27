# Chat Disciplina Total - Cloudflare Worker

Worker pronto para criar a IA do chat do site **Disciplina Total**.

## O que faz

- Recebe perguntas do site.
- Usa Cloudflare Workers AI.
- Responde como assistente oficial do livro **Disciplina em 30 Dias**.
- Foca em disciplina, hábitos, rotina, foco, produtividade e compra pela Hotmart.

## Arquivos

```txt
src/index.js
wrangler.jsonc
package.json
```

## Como subir pelo painel da Cloudflare

1. Entre no Cloudflare.
2. Vá em **Workers & Pages**.
3. Clique em **Create Worker**.
4. Crie um Worker chamado `chat-disciplina-total`.
5. Abra o editor do Worker.
6. Copie o conteúdo de `src/index.js` e cole no editor.
7. Vá em **Settings > Bindings**.
8. Adicione um binding do tipo **Workers AI**.
9. Nome do binding: `AI`.
10. Clique em **Deploy**.

## Como subir pelo computador com Wrangler

Instale as dependências:

```bash
npm install
```

Faça login:

```bash
npx wrangler login
```

Publique:

```bash
npm run deploy
```

## Teste rápido

Troque a URL abaixo pela URL do seu Worker:

```bash
curl -X POST "https://chat-disciplina-total.SEUSUBDOMINIO.workers.dev" \
  -H "Content-Type: application/json" \
  -d '{"message":"Esse livro serve para quem procrastina?"}'
```

## Depois de publicar

Me envie a URL do Worker, por exemplo:

```txt
https://chat-disciplina-total.seuusuario.workers.dev
```

Aí eu conecto o chat do site nesse backend real.
