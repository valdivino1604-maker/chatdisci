export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    if (request.method !== "POST") {
      return jsonResponse({
        ok: true,
        message: "Chat Disciplina Total Worker ativo. Envie POST com { message: \"sua pergunta\" }."
      }, 200, env);
    }

    try {
      const body = await request.json();
      const message = String(body.message || "").trim();
      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

      if (!message) {
        return jsonResponse({ reply: "Digite uma pergunta sobre disciplina, hábitos, foco ou sobre o livro Disciplina em 30 Dias." }, 200, env);
      }

      if (message.length > 1200) {
        return jsonResponse({ reply: "Sua pergunta ficou muito longa. Pode resumir em poucas linhas?" }, 200, env);
      }

      const systemPrompt = `
Você é a assistente oficial do livro "Disciplina em 30 Dias", de Valdivino Rodrigues Arantes Júnior.

Seu papel:
- Ajudar visitantes do site a entenderem se o livro serve para eles.
- Responder dúvidas sobre disciplina, procrastinação, hábitos, foco, rotina, produtividade, mentalidade e compra pela Hotmart.
- Ser educada, objetiva, humana e persuasiva sem exagero.
- Conduzir naturalmente para a compra quando fizer sentido.

Regras:
1. Responda em português do Brasil.
2. Não invente capítulos, preços, bônus ou promessas que não foram informados.
3. Se perguntarem preço, diga que o valor atualizado está na página oficial da Hotmart.
4. Se perguntarem algo fora do tema, redirecione educadamente para disciplina, hábitos, produtividade ou o livro.
5. Não dê diagnóstico médico, psicológico, jurídico ou financeiro.
6. Para pessoas com TDAH, ansiedade ou dificuldades emocionais, seja acolhedora e diga que o livro pode ajudar na organização e constância, mas não substitui acompanhamento profissional.
7. Use respostas curtas, claras e úteis.
8. Sempre que for adequado, finalize com uma pergunta ou convite suave.

Link principal de compra:
https://go.hotmart.com/C106276938L

Instagram oficial:
https://www.instagram.com/eng.valdivinojr
`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...history
          .filter(item => item && typeof item.content === "string" && ["user", "assistant"].includes(item.role))
          .map(item => ({ role: item.role, content: item.content.slice(0, 1000) })),
        { role: "user", content: message }
      ];

      const aiResponse = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
        messages,
        max_tokens: 450,
        temperature: 0.45
      });

      const reply = aiResponse.response || "Não consegui responder agora. Tente perguntar de outro jeito.";

      return jsonResponse({ reply }, 200, env);
    } catch (error) {
      return jsonResponse({
        reply: "Tive uma instabilidade agora. Tente novamente em alguns segundos.",
        error: String(error && error.message ? error.message : error)
      }, 500, env);
    }
  }
};

function jsonResponse(data, status = 200, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(env)
    }
  });
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
