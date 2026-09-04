import Anthropic from "@anthropic-ai/sdk";
import type { LeadStatus, MessageRecord } from "./types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface QualificationResult {
  status: LeadStatus;
  tags: string[];
  score_delta: number; // quanto somar ao engagement_score do contato
  suggested_reply: string | null; // resposta sugerida (só é enviada se a automação usar reply automático)
  reasoning: string;
}

const SCHEMA_INSTRUCTIONS = `
Responda SOMENTE com um objeto JSON, sem markdown, sem texto antes ou depois, no formato:
{
  "status": "novo" | "qualificando" | "qualificado" | "descartado",
  "tags": string[],
  "score_delta": number,
  "suggested_reply": string | null,
  "reasoning": string
}
`;

/**
 * Analisa o histórico de conversa de um contato e devolve uma classificação de lead.
 * Usado pelo automation-engine quando a automação tem ai_qualify = true.
 */
export async function qualifyLead(params: {
  history: MessageRecord[];
  customInstruction: string | null;
}): Promise<QualificationResult> {
  const conversation = params.history
    .map((m) => `${m.direction === "inbound" ? "Contato" : "Marca"}: ${m.content}`)
    .join("\n");

  const systemPrompt = [
    "Você é o motor de qualificação de leads do FJJ-Connect, uma ferramenta de automação de Instagram.",
    "Sua tarefa é ler a conversa entre um contato do Instagram e a marca, e decidir o quão qualificado esse lead está para uma venda.",
    params.customInstruction
      ? `Critério específico definido pelo dono da conta: ${params.customInstruction}`
      : "Sem critério específico: use bom senso comercial (interesse explícito, urgência, poder de compra sinalizado).",
    SCHEMA_INSTRUCTIONS,
  ].join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: conversation || "(sem mensagens ainda)" }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as QualificationResult;
    return parsed;
  } catch {
    return {
      status: "novo",
      tags: [],
      score_delta: 0,
      suggested_reply: null,
      reasoning: "Falha ao interpretar a resposta da IA; mantendo status atual.",
    };
  }
}
