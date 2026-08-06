import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseAdmin, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { sectionDef, TEXT_FIELD_COLUMNS, TextFieldKey } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";

const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You write concise, on-brand marketing copy for Holisteek, a wellness/yoga/self-care newsletter.
Tone: warm, aspirational, punchy — never generic corporate fluff.
Match the language already used in the context you're given (English or Spanish); default to English if there's no context.
Reply with ONLY the requested text: no quotes around it, no explanation, no markdown, no trailing period unless natural.`;

// POST /api/newsletter/ai/generate-text
// body: { sectionId: string, field: TextFieldKey, instruction?: string }
// Genera (o mejora, si ya hay un valor) el texto de un campo puntual de una
// sección, usando como contexto los demás campos ya llenos de esa misma
// sección. No guarda nada: el resultado se muestra en el input para que el
// usuario lo revise y lo guarde (o no) con el botón "Guardar" de siempre.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const field = typeof body.field === "string" ? (body.field as TextFieldKey) : undefined;
  const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";

  const def = sectionDef(sectionId);
  const fieldDef = def?.textFields?.find((f) => f.key === field);
  if (!def || !field || !fieldDef) {
    return NextResponse.json({ error: "Sección o campo inválido." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY no está configurada en .env.local." },
      { status: 500 }
    );
  }

  let currentRow: Record<string, string | null> = {};
  try {
    const supabase = getSupabaseAdmin();
    const columns = ["image_url", "link_url", ...Object.values(TEXT_FIELD_COLUMNS)].join(", ");
    const { data } = await supabase.from(NEWSLETTER_TABLE).select(columns).eq("id", sectionId).single();
    if (data) currentRow = data as unknown as Record<string, string | null>;
  } catch {
    // Sin fila guardada todavía (o Supabase no configurado): seguimos solo
    // con los valores por defecto de la sección como contexto.
  }

  const contextLines: string[] = [];
  for (const other of def.textFields ?? []) {
    if (other.key === field) continue;
    const value = currentRow[TEXT_FIELD_COLUMNS[other.key]] || other.defaultValue;
    if (value) contextLines.push(`${other.label}: ${value}`);
  }

  const currentValue = currentRow[TEXT_FIELD_COLUMNS[field]] || "";
  const lengthHint = fieldDef.multiline
    ? "1–3 short sentences."
    : "a short phrase, no more than ~8 words.";

  const userPromptParts = [
    `Section: ${def.label}`,
    `Field to write: "${fieldDef.label}" — ${lengthHint}`,
    contextLines.length > 0 ? `Other known details for this same card:\n${contextLines.join("\n")}` : null,
    currentValue ? `Current draft to improve/rewrite: "${currentValue}"` : "There's no draft yet — write it from scratch.",
    instruction ? `Extra instruction from the editor: ${instruction}` : null,
  ].filter(Boolean);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.8,
      max_tokens: 200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPromptParts.join("\n\n") },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "OpenAI no devolvió texto." }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo generar el texto con OpenAI.", detail: errorMessage(err) },
      { status: 502 }
    );
  }
}
