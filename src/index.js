export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(env) });

    if (request.method !== "POST") {
      return jsonResponse({ ok: true, version: "disciplina-total-ia-v3", message: "Chat Disciplina Total ativo." }, 200, env);
    }

    try {
      const body = await request.json();
      const message = String(body.message || "").trim();
      const history = Array.isArray(body.history) ? body.history.slice(-8) : [];

      if (!message) {
        return jsonResponse({ reply: "Digite uma pergunta sobre disciplina, procrastinação, hábitos, foco, rotina ou sobre o livro Disciplina em 30 Dias." }, 200, env);
      }

      if (message.length > 1200) {
        return jsonResponse({ reply: "Sua pergunta ficou muito longa. Pode resumir em poucas linhas?" }, 200, env);
      }

      const intent = classifyIntent(message);
      const selectedKnowledge = selectKnowledge(message, intent);
      const systemPrompt = buildSystemPrompt(intent, selectedKnowledge);

      const messages = [
        { role: "system", content: systemPrompt },
        ...history
          .filter(item => item && typeof item.content === "string" && ["user", "assistant"].includes(item.role))
          .map(item => ({ role: item.role, content: item.content.slice(0, 900) })),
        { role: "user", content: message }
      ];

      const aiResponse = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", {
        messages,
        max_tokens: 700,
        temperature: 0.32
      });

      return jsonResponse({
        reply: aiResponse.response || "Não consegui responder agora. Tente perguntar de outro jeito.",
        intent,
        sources: selectedKnowledge.map(item => item.title)
      }, 200, env);
    } catch (error) {
      return jsonResponse({
        reply: "Tive uma instabilidade agora. Tente novamente em alguns segundos.",
        error: String(error && error.message ? error.message : error)
      }, 500, env);
    }
  }
};

const KNOWLEDGE = [
  {
    id: "autor",
    title: "Autor e apresentação",
    keywords: ["autor", "escritor", "quem escreveu", "valdivino", "criador", "engenheiro", "gestor", "empreendedor"],
    content: `O livro "Disciplina em 30 Dias" foi escrito por Valdivino Rodrigues Arantes Júnior. Na apresentação editorial da obra, ele é descrito como engenheiro civil, gestor empresarial e empreendedor, com trajetória ligada à liderança de equipes, gestão de projetos, desenvolvimento humano e alta performance. A IA não deve inventar biografia, cursos, empresas, cargos, religião, família ou dados pessoais que não estejam na obra. Quando perguntarem sobre o autor, responda com essas informações e convide o leitor a conhecer a seção "Sobre o Autor" ou o livro completo.`
  },
  {
    id: "livro",
    title: "Visão geral do livro",
    keywords: ["livro", "disciplina em 30 dias", "sinopse", "método", "metodo", "sobre o livro", "serve para mim", "comprar", "hotmart"],
    content: `"Disciplina em 30 Dias" tem o subtítulo "Do caos à constância: transforme sua rotina, seus hábitos e sua identidade em um mês". A obra apresenta disciplina como liberdade, bússola, amor-próprio, direção e construção de identidade. O livro não promete fórmula mágica; propõe uma jornada prática para sair da procrastinação, criar hábitos duradouros, proteger o foco, organizar prioridades e alinhar ações com valores pessoais. Link de compra oficial: https://go.hotmart.com/C106276938L. Instagram oficial: https://www.instagram.com/eng.valdivinojr.`
  },
  {
    id: "frontmatter",
    title: "Dedicatória e agradecimentos",
    keywords: ["dedicatória", "dedicatoria", "agradecimentos", "marliana", "henrico", "valentina", "deus", "avós", "avos"],
    content: `A dedicatória é voltada a pessoas presas em ciclos de adiamento, culpa e frustração; pessoas que sabem o que precisam fazer, mas não conseguem sair do lugar. O autor também dedica a obra à família. Nos agradecimentos, agradece a Deus, aos avós, à esposa Marliana, aos filhos Henrico e Valentina, aos professores, mentores, amigos e ao leitor. A resposta deve tratar isso com respeito e sem inventar detalhes além do texto.`
  },
  {
    id: "capitulo01",
    title: "Capítulo 1 - O Espelho da Procrastinação",
    keywords: ["procrastinação", "procrastinacao", "adiar", "adiamento", "culpa", "autossabotagem", "gatilhos", "desorganização", "desorganizacao", "exaustão", "exaustao"],
    content: `O capítulo 1 mostra que procrastinação não é falha moral, mas um sistema de gatilhos, emoções e padrões. A pessoa não adia apenas tarefas; muitas vezes adia emoções desconfortáveis, como ansiedade, tédio, medo do fracasso, perfeccionismo ou falta de clareza. O capítulo orienta o leitor a observar micro-momentos antes do "depois eu faço", mapear gatilhos, reconhecer ciclos de autossabotagem e entender os custos da desorganização. Também aborda insuficiência, voz crítica interna e exaustão emocional como linha de base que precisa ser reconhecida antes da mudança.`
  },
  {
    id: "capitulo02",
    title: "Capítulo 2 - As Três Prioridades Não-Negociáveis",
    keywords: ["prioridades", "três prioridades", "3 prioridades", "não negociáveis", "nao negociaveis", "foco", "objetivos", "metas", "dizer não", "dizer nao"],
    content: `O capítulo 2 ensina que tentar perseguir dezenas de objetivos fragmenta energia. A proposta é escolher três prioridades não-negociáveis para os próximos 30 dias. O leitor deve perguntar: "o que, se não for feito agora, continuará me sabotando?". O capítulo conecta prioridades à identidade: não apenas "eu tenho que fazer", mas "eu sou o tipo de pessoa que faz isso". Também ensina a dizer não ao secundário e a criar compromisso visceral com o essencial.`
  },
  {
    id: "capitulo03",
    title: "Capítulo 3 - A Rotina Matinal como Fundação",
    keywords: ["rotina matinal", "manhã", "manha", "acordar", "celular", "despertar", "hidratação", "hidratacao", "movimento", "prioridade do dia"],
    content: `O capítulo 3 afirma que muitas pessoas não acordam: são reativadas pelo alarme, celular, pressa e demandas externas. A rotina matinal deve começar com despertar intencional, sem pressa, antes do mundo externo invadir a mente. O livro propõe hidratação imediata, movimento leve, distância física do celular, silêncio e definição da prioridade central do dia. A manhã é tratada como fundação da disciplina e proteção da atenção.`
  },
  {
    id: "capitulo04",
    title: "Capítulo 4 - Blocos de Foco de 90 Minutos",
    keywords: ["90 minutos", "blocos de foco", "foco profundo", "produtividade", "checklist", "pausas", "concentração", "concentracao", "trabalho profundo"],
    content: `O capítulo 4 ensina a organizar o trabalho em blocos de foco profundo de aproximadamente 90 minutos, respeitando ritmos naturais de energia. Antes do bloco, o ambiente deve ser preparado: notificações desligadas, abas irrelevantes fechadas, telefone fora do alcance e tarefa prioritária definida. Após o foco intenso, recomenda pausas de 15 a 30 minutos para regenerar atenção. A checklist evita fadiga de decisão. A produtividade deve ser medida pela qualidade da entrega, não apenas por horas trabalhadas.`
  },
  {
    id: "capitulo05",
    title: "Capítulo 5 - O Fim da Escravidão Digital",
    keywords: ["digital", "redes sociais", "instagram", "scroll", "notificações", "notificacoes", "celular", "vício", "vicio", "distração", "distracao"],
    content: `O capítulo 5 mostra que redes sociais e notificações são desenhadas para capturar atenção. A estratégia não é depender apenas de força de vontade, mas criar barreiras técnicas: desativar notificações, mover ou remover aplicativos, usar bloqueadores, deixar o celular longe e criar janelas específicas para uso das redes. O tempo recuperado deve ser preenchido por atividades regenerativas: leitura, caminhada, conversa profunda, silêncio, estudo, exercício ou projetos pessoais.`
  },
  {
    id: "capitulo06",
    title: "Capítulo 6 - Movimento Progressivo: Do Zero ao Hábito",
    keywords: ["movimento", "exercício", "exercicio", "caminhada", "força", "forca", "resistência", "resistencia", "hábito físico", "habito fisico"],
    content: `O capítulo 6 ensina que o exercício não deve começar como punição ou virada brutal. A primeira etapa é caminhada simples, intencional e consistente, com foco em criar ritmo. Depois entram força básica com peso corporal e progressão de resistência. O movimento é tratado como regeneração, construção de confiança e disciplina corporal, não como castigo.`
  },
  {
    id: "capitulo07",
    title: "Capítulo 7 - Os Pilares Biológicos: Sono, Alimentação e Ansiedade",
    keywords: ["sono", "alimentação", "alimentacao", "ansiedade", "respiração", "respiracao", "biologia", "hidratação", "hidratacao", "5-4-3-2-1", "tdah"],
    content: `O capítulo 7 explica que disciplina não depende apenas de força de vontade; depende de biologia. O sono deve ter horário regular, rotina noturna e ambiente escuro, silencioso e fresco. A alimentação deve buscar energia estável, com proteínas, carboidratos complexos, gorduras saudáveis e hidratação. Para ansiedade, o livro apresenta respiração diafragmática, técnica de ancoragem sensorial 5-4-3-2-1 e relaxamento muscular progressivo. O assistente deve lembrar que o livro ajuda com organização e constância, mas não substitui acompanhamento profissional.`
  },
  {
    id: "capitulo08",
    title: "Capítulo 8 - Reescrever Sua Narrativa Pessoal",
    keywords: ["narrativa", "identidade", "crenças", "crencas", "limitantes", "reframing", "história interna", "historia interna", "eu sou", "micro ações", "micro acoes"],
    content: `O capítulo 8 ensina que a pessoa vive a partir das histórias internas que conta sobre si. Crenças como "eu sou desorganizado" ou "eu sempre desisto" precisam ser identificadas e questionadas. O livro propõe teste de verdade, recontextualização e reframing. A nova narrativa deve ser construída no presente, com identidade: "eu sou alguém que age com antecedência". Micro-ações diárias validam essa nova história.`
  },
  {
    id: "capitulo09",
    title: "Capítulo 9 - Medindo o Invisível: Diário, Mapa e Métricas",
    keywords: ["diário", "diario", "métricas", "metricas", "mapa", "medir", "monitoramento", "progresso", "registro", "autoconsciência", "autoconsciencia"],
    content: `O capítulo 9 mostra que a disciplina precisa ser observada e medida. O diário da disciplina é um espelho estruturado para registrar ações, emoções, gatilhos, vitórias e desvios. Métricas simples ajudam a enxergar progresso invisível. O objetivo não é punição, mas autoconsciência e ajuste de rota.`
  },
  {
    id: "capitulo10",
    title: "Capítulo 10 - Desafios Progressivos: Aumentar Sem Queimar",
    keywords: ["desafios", "progressão", "progressao", "aumentar", "queimar", "burnout", "sustentável", "sustentavel", "intensidade", "limites"],
    content: `O capítulo 10 ensina progressão inteligente. Aumentar tudo de uma vez gera sobrecarga e abandono. O crescimento precisa respeitar limites, energia e consistência. O leitor deve ajustar intensidade aos poucos, transformar desafios em degraus e evitar confundir disciplina com excesso.`
  },
  {
    id: "capitulo11",
    title: "Capítulo 11 - Além dos 30 Dias: Metas de 90 Dias",
    keywords: ["90 dias", "metas de 90 dias", "continuidade", "longo prazo", "revisão", "revisao", "planejamento", "próximos passos"],
    content: `O capítulo 11 mostra que os 30 dias não são o fim, mas o início. A disciplina inicial deve virar direção para metas de 90 dias. O leitor deve revisar aprendizados, transformar hábitos em sistema, definir próximos objetivos e manter consistência sem depender de motivação passageira.`
  },
  {
    id: "capitulo12",
    title: "Capítulo 12 - Seu Manifesto Pessoal de Disciplina",
    keywords: ["manifesto", "manifesto pessoal", "declaração", "declaracao", "bússola", "bussola", "identidade", "compromisso", "quem decidiu ser"],
    content: `O capítulo 12 fecha a jornada com a criação de um manifesto pessoal de disciplina. O manifesto funciona como bússola interna e declaração de identidade. O leitor define quem está se tornando, quais valores vai proteger e quais escolhas não aceita mais negociar. A disciplina vira expressão da identidade.`
  },
  {
    id: "vendas",
    title: "Compra e convite",
    keywords: ["preço", "preco", "valor", "comprar", "hotmart", "link", "desconto", "pagamento", "adquirir", "onde compro"],
    content: `Quando perguntarem preço, diga que o valor atualizado está na página oficial da Hotmart. Não invente preço, desconto, bônus ou condição. Link oficial: https://go.hotmart.com/C106276938L. A venda deve ser natural: primeiro ajude, explique o benefício e depois convide a conhecer o livro completo.`
  }
];

function normalize(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function classifyIntent(message) {
  const q = normalize(message);
  if (hasAny(q, ["comprar", "preco", "valor", "hotmart", "desconto", "pagamento"])) return "compra";
  if (hasAny(q, ["autor", "escritor", "quem escreveu", "valdivino", "criador"])) return "autor";
  if (hasAny(q, ["capitulo", "capítulo", "resuma", "resumo", "fala sobre"])) return "capitulo";
  if (hasAny(q, ["exercicio", "exercício", "pratica", "prática", "como aplicar"])) return "exercicio";
  if (hasAny(q, ["tdah", "ansiedade", "sofrimento", "depressao", "depressão"])) return "acolhimento";
  if (hasAny(q, ["procrastin", "foco", "habito", "hábito", "rotina", "celular", "sono", "disciplina"])) return "mentoria";
  return "geral";
}

function selectKnowledge(message, intent) {
  const q = normalize(message);
  const scored = KNOWLEDGE.map(item => {
    let score = 0;
    for (const keyword of item.keywords) {
      const k = normalize(keyword);
      if (q.includes(k)) score += k.length > 8 ? 4 : 2;
    }
    const chapterMatch = q.match(/(?:capitulo|capítulo)\s*(\d{1,2})/i);
    if (chapterMatch && item.id === `capitulo${chapterMatch[1].padStart(2, "0")}`) score += 20;
    if (intent === "autor" && item.id === "autor") score += 10;
    if (intent === "compra" && item.id === "vendas") score += 10;
    if (intent === "geral" && item.id === "livro") score += 4;
    return { ...item, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

  const selected = scored.slice(0, 4);
  if (!selected.find(item => item.id === "livro")) selected.push(KNOWLEDGE.find(item => item.id === "livro"));
  return selected.filter(Boolean).slice(0, 5);
}

function buildSystemPrompt(intent, selectedKnowledge) {
  const knowledgeText = selectedKnowledge.map(item => `### ${item.title}\n${item.content}`).join("\n\n");
  return `
Você é o assistente oficial do livro "Disciplina em 30 Dias", de Valdivino Rodrigues Arantes Júnior.

INTENÇÃO DETECTADA: ${intent}

TOM:
- Português do Brasil.
- Profissional, humano, acolhedor e direto.
- Firme ao falar de disciplina, mas nunca agressivo.
- Responda em 2 a 5 parágrafos curtos.
- Use listas simples quando ajudar.

REGRAS:
1. Responda com base na BASE DE CONHECIMENTO abaixo.
2. Não invente informações sobre o autor, preço, bônus, capítulos ou promessas.
3. Não copie longos trechos do livro; explique com suas palavras.
4. Se a resposta não estiver na base, diga que essa informação não aparece no conteúdo do livro.
5. Se for sobre saúde mental, TDAH ou ansiedade, seja acolhedor e diga que o livro pode ajudar com organização e constância, mas não substitui acompanhamento profissional.
6. Se for sobre compra, informe o link oficial e diga que o valor atualizado está na Hotmart.
7. Sempre que fizer sentido, convide o leitor a conhecer o capítulo correspondente ou o livro completo.

BASE DE CONHECIMENTO SELECIONADA:
${knowledgeText}

LINKS:
Compra oficial: https://go.hotmart.com/C106276938L
Instagram oficial: https://www.instagram.com/eng.valdivinojr
`;
}

function hasAny(text, terms) {
  return terms.some(term => text.includes(normalize(term)));
}

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
