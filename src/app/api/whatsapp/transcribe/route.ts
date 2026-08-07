import { NextResponse } from "next/server";
import OpenAI from "openai";
import { errorMessage } from "@/lib/errorMessage";

export const runtime = "nodejs";
export const maxDuration = 60;

const TRANSCRIBE_MODEL = "whisper-1";
const DEFAULT_LANGUAGE = "es";
const MAX_FILE_BYTES = 25 * 1024 * 1024; // límite de OpenAI para audio

// POST /api/whatsapp/transcribe
// Transcribe una nota de voz de WhatsApp (.ogg / .oga, codec opus) a texto
// usando OpenAI. Acepta dos formas de envío:
//   1) multipart/form-data con el archivo en el campo "file" (o "audio").
//      Campos opcionales: "language" (default "es"), "prompt".
//   2) JSON { url, language?, prompt? } con la URL del audio — útil cuando
//      un webhook de WhatsApp (Cloud API, Evolution API, Twilio, etc.) entrega
//      un media URL en lugar del archivo en sí.
// Responde { text: string }.
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY no está configurada en .env.local." },
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  let audioFile: File;
  let language = DEFAULT_LANGUAGE;
  let prompt: string | undefined;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file") ?? form.get("audio");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Falta el archivo de audio (.ogg) en el campo 'file'." },
          { status: 400 }
        );
      }
      if (file.size === 0) {
        return NextResponse.json({ error: "El archivo de audio está vacío." }, { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "El audio supera el límite de 25MB." }, { status: 400 });
      }
      audioFile = file;

      const langField = form.get("language");
      if (typeof langField === "string" && langField.trim()) language = langField.trim();
      const promptField = form.get("prompt");
      if (typeof promptField === "string" && promptField.trim()) prompt = promptField.trim();
    } else {
      const body = await request.json().catch(() => ({}));
      const url = typeof body.url === "string" ? body.url.trim() : "";
      if (!url) {
        return NextResponse.json(
          { error: "Falta el audio: envía multipart/form-data con 'file' o JSON con 'url'." },
          { status: 400 }
        );
      }
      if (typeof body.language === "string" && body.language.trim()) language = body.language.trim();
      if (typeof body.prompt === "string" && body.prompt.trim()) prompt = body.prompt.trim();

      const res = await fetch(url);
      if (!res.ok) {
        return NextResponse.json(
          { error: `No se pudo descargar el audio (HTTP ${res.status}).` },
          { status: 502 }
        );
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.byteLength === 0) {
        return NextResponse.json({ error: "El audio descargado está vacío." }, { status: 400 });
      }
      if (buffer.byteLength > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "El audio supera el límite de 25MB." }, { status: 400 });
      }
      const fileName = url.split("/").pop()?.split("?")[0] || "audio.ogg";
      audioFile = new File([buffer], fileName, {
        type: res.headers.get("content-type") || "audio/ogg",
      });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo leer el audio recibido.", detail: errorMessage(err) },
      { status: 400 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: TRANSCRIBE_MODEL,
      language,
      prompt,
    });

    const text = transcription.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "OpenAI no devolvió texto para este audio." }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo transcribir el audio con OpenAI.", detail: errorMessage(err) },
      { status: 502 }
    );
  }
}
