"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

export default function TranscribePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setStatus("error");
      setErrorMessage("Elige un archivo .ogg primero.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setText("");
    setFileName(file.name);

    try {
      const res = await fetch("/api/whatsapp/transcribe", {
        method: "POST",
        body: formData,
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "No se pudo transcribir el audio.");
      }

      setText(body.text ?? "");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Algo salió mal.");
    }
  }

  async function handleCopy() {
    if (text) await navigator.clipboard.writeText(text);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Transcribir nota de voz de WhatsApp
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sube un archivo .ogg (o .oga) exportado desde WhatsApp y lo convertimos a texto con OpenAI.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="file" className="text-sm font-medium text-black dark:text-zinc-50">
            Archivo de audio
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".ogg,.oga,audio/ogg"
            required
            className="rounded-lg border border-black/[.08] bg-transparent p-2 text-sm text-black file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white dark:border-white/[.145] dark:text-zinc-50 dark:file:bg-white dark:file:text-black"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="language" className="text-sm font-medium text-black dark:text-zinc-50">
            Idioma (opcional)
          </label>
          <input
            id="language"
            name="language"
            type="text"
            defaultValue="es"
            placeholder="es"
            className="rounded-lg border border-black/[.08] bg-transparent p-2 text-sm text-black placeholder:text-zinc-400 dark:border-white/[.145] dark:text-zinc-50"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="self-start rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {status === "loading" ? "Transcribiendo…" : "Transcribir"}
        </button>
      </form>

      {status === "error" && (
        <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {errorMessage}
        </p>
      )}

      {status === "done" && (
        <div className="flex flex-col gap-2 rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-black dark:text-zinc-50">
              Transcripción {fileName && `de ${fileName}`}
            </h2>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-medium text-zinc-600 underline hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Copiar
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{text}</p>
        </div>
      )}
    </main>
  );
}
