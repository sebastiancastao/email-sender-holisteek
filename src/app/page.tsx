"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SectionDef, TEXT_FIELD_COLUMNS, TEXT_FIELD_KEYS, TextFieldKey } from "@/lib/newsletter/sections";

// ============================================================================
// Tipos
// ============================================================================

type Section = SectionDef & {
  imageUrl: string;
  linkUrl: string;
} & Partial<Record<TextFieldKey, string>>;

type RowStatus = "idle" | "saving" | "saved" | "error";
type SendStatus = "idle" | "sending" | "sent" | "error";

type SendResult = {
  to: string;
  page: number | "all";
  id: string | null;
  error: string | null;
};

const PAGE_TITLES: Record<number, string> = {
  1: "Página 1",
  2: "Página 2",
  3: "Página 3",
};

const PAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Newsletter completo (3 páginas)" },
  { value: "1", label: "Página 1" },
  { value: "2", label: "Página 2" },
  { value: "3", label: "Página 3" },
];

function pageDisplayName(page: number | "all") {
  return page === "all" ? "Newsletter completo" : `Página ${page}`;
}

const AUTOFILL_CONFIG: Record<
  "place" | "event" | "article",
  {
    endpoint: string;
    placeholder: string;
    helpText: string;
    buildBody: (sectionId: string, url: string) => Record<string, string>;
  }
> = {
  place: {
    endpoint: "/api/newsletter/places/autofill",
    placeholder: "https://www.holisteek.com/places/...",
    helpText:
      'Trae imagen, nombre, ubicación y categoría automáticamente. La descripción y el "Best for" se completan a mano abajo.',
    buildBody: (_sectionId, url) => ({ url }),
  },
  event: {
    endpoint: "/api/newsletter/events/autofill",
    placeholder: "https://www.holisteek.com/experiences/...",
    helpText: "Trae fecha, nombre y lugar automáticamente.",
    buildBody: (sectionId, url) => ({ sectionId, url }),
  },
  article: {
    endpoint: "/api/newsletter/articles/autofill",
    placeholder: "https://www.holisteek.com/guide/...",
    helpText: "Trae imagen, título y descripción automáticamente.",
    buildBody: (sectionId, url) => ({ sectionId, url }),
  },
};

const AUTOFILL_SOURCE_LABEL: Record<"place" | "event" | "article", string> = {
  place: "holisteek.com/places",
  event: "holisteek.com/experiences",
  article: "holisteek.com/guide",
};

// A partir de una fila de `newsletter_sections` (image_url, link_url, title,
// description, best_for, location, category) arma el Partial<Section> que
// se aplica al estado local, con fallback a los valores actuales.
function sectionUpdateFromRow(
  row: Record<string, unknown> | undefined,
  fallback: Section
): Partial<Section> {
  const updated: Partial<Section> = {
    imageUrl: (row?.image_url as string) ?? fallback.imageUrl,
    linkUrl: (row?.link_url as string) ?? fallback.linkUrl,
  };
  for (const key of TEXT_FIELD_KEYS) {
    updated[key] = (row?.[TEXT_FIELD_COLUMNS[key]] as string) ?? fallback[key];
  }
  return updated;
}

// ============================================================================
// Envío
// ============================================================================

function SendPanel() {
  const [status, setStatus] = useState<SendStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [results, setResults] = useState<SendResult[] | null>(null);
  const [checkedPages, setCheckedPages] = useState<Record<string, boolean>>({ all: true });

  function togglePage(value: string) {
    setCheckedPages((prev) => ({ ...prev, [value]: !prev[value] }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    setResults(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const to = String(formData.get("to") ?? "")
      .split(/[,;\n]/)
      .map((v) => v.trim())
      .filter(Boolean);

    const pages = Object.entries(checkedPages)
      .filter(([, checked]) => checked)
      .map(([value]) => (value === "all" ? "all" : Number(value)));

    if (to.length === 0) {
      setStatus("error");
      setErrorMessage("Escribe al menos un correo destinatario.");
      return;
    }
    if (pages.length === 0) {
      setStatus("error");
      setErrorMessage("Elige al menos una página (o el newsletter completo) para enviar.");
      return;
    }

    try {
      const res = await fetch("/api/send-holisteek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, pages }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok && res.status !== 207) {
        throw new Error(body.error ?? "Failed to send email");
      }

      setResults(body.results ?? null);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section id="enviar" className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
      <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">Enviar</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Cada página marcada se envía como un correo individual y separado, a uno o varios destinatarios.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="holisteek-to" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Para (uno o varios correos, separados por coma o salto de línea)
          </label>
          <textarea
            id="holisteek-to"
            name="to"
            required
            rows={2}
            placeholder={"uno@example.com\notro@example.com"}
            className="resize-none rounded-lg border border-black/[.08] bg-transparent px-3 py-2 text-sm text-black outline-none focus:border-black/30 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/30"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-5">
          {PAGE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={!!checkedPages[opt.value]}
                onChange={() => togglePage(opt.value)}
                className="h-4 w-4 rounded border-black/[.2] dark:border-white/[.3]"
              />
              {opt.label}
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="flex h-11 w-full items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc] sm:w-auto"
        >
          {status === "sending" ? "Enviando..." : "Enviar Holisteek"}
        </button>

        {status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        {results && (
          <div className="flex flex-col gap-1 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
            {results.map((r, i) => (
              <p key={i} className={r.error ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
                {pageDisplayName(r.page)} → {r.to}: {r.error ? r.error : "enviado"}
              </p>
            ))}
          </div>
        )}
      </form>
    </section>
  );
}

// ============================================================================
// Contenido: sección individual (imagen + URL + texto)
// ============================================================================

function SectionRow({
  section,
  onSaved,
}: {
  section: Section;
  onSaved: (updated: Partial<Section>) => void;
}) {
  const [status, setStatus] = useState<RowStatus>("idle");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fieldsNonce, setFieldsNonce] = useState(0);

  const [autofillUrl, setAutofillUrl] = useState("");
  const [autofillStatus, setAutofillStatus] = useState<RowStatus>("idle");
  const [autofillError, setAutofillError] = useState("");

  const hasImage = section.kind === "image" || section.kind === "image+link";
  const hasLink = section.kind === "link" || section.kind === "image+link";

  async function saveSection(formData: FormData) {
    setStatus("saving");
    setError("");

    try {
      const res = await fetch(`/api/newsletter/sections/${section.id}`, {
        method: "PATCH",
        body: formData,
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "No se pudo guardar la sección");
      }

      setStatus("saved");
      setPreviewUrl(null);
      onSaved(sectionUpdateFromRow(body.section, section));
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Algo salió mal");
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    saveSection(new FormData(form)).then(() => {
      const fileInput = form.elements.namedItem("image") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    });
  }

  async function handleAutofill() {
    if (!section.autofillFrom || !autofillUrl.trim()) return;
    const config = AUTOFILL_CONFIG[section.autofillFrom];

    setAutofillStatus("saving");
    setAutofillError("");

    try {
      const res = await fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config.buildBody(section.id, autofillUrl.trim())),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error ?? "No se pudo autocompletar desde esa URL");
      }

      onSaved(sectionUpdateFromRow(body.section, section));
      setAutofillStatus("saved");
      setFieldsNonce((n) => n + 1);
    } catch (err) {
      setAutofillStatus("error");
      setAutofillError(err instanceof Error ? err.message : "Algo salió mal");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-black/[.08] p-4 dark:border-white/[.145] sm:flex-row sm:items-start sm:gap-5"
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-black dark:text-zinc-50">{section.label}</p>

        {section.autofillFrom && (
          <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-dashed border-black/[.15] p-3 dark:border-white/[.2]">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Autocompletar desde {AUTOFILL_SOURCE_LABEL[section.autofillFrom]}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={autofillUrl}
                onChange={(e) => setAutofillUrl(e.target.value)}
                placeholder={AUTOFILL_CONFIG[section.autofillFrom].placeholder}
                className="flex-1 rounded-lg border border-black/[.08] bg-transparent px-3 py-1.5 text-sm text-black outline-none focus:border-black/30 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/30"
              />
              <button
                type="button"
                onClick={handleAutofill}
                disabled={autofillStatus === "saving" || !autofillUrl.trim()}
                className="rounded-full border border-black/[.2] px-4 py-1.5 text-xs font-medium text-black transition-colors hover:bg-black/[.05] disabled:opacity-50 dark:border-white/[.3] dark:text-zinc-50 dark:hover:bg-white/[.08]"
              >
                {autofillStatus === "saving" ? "Buscando..." : "Autocompletar"}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {AUTOFILL_CONFIG[section.autofillFrom].helpText}
            </p>
            {autofillStatus === "error" && (
              <p className="text-xs text-red-600 dark:text-red-400">{autofillError}</p>
            )}
            {autofillStatus === "saved" && (
              <p className="text-xs text-green-600 dark:text-green-400">Datos actualizados desde esa URL.</p>
            )}
          </div>
        )}

        {hasImage && (
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/[.08] bg-zinc-100 dark:border-white/[.145] dark:bg-zinc-900">
              {previewUrl || section.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl ?? section.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-zinc-400">sin imagen</span>
              )}
            </div>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-200 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-800 hover:file:bg-zinc-300 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-200"
            />
          </div>
        )}

        {/* key remonta estos campos cuando "Autocompletar" cambia varios a la vez,
            porque son inputs no controlados (defaultValue). */}
        <div key={fieldsNonce} style={{ display: "contents" }}>
          {(section.textFields ?? []).map((field) => (
            <div key={field.key} className="mt-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {field.label}
              </label>
              {field.multiline ? (
                <textarea
                  name={field.key}
                  rows={3}
                  defaultValue={section[field.key]}
                  className="resize-none rounded-lg border border-black/[.08] bg-transparent px-3 py-1.5 text-sm text-black outline-none focus:border-black/30 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/30"
                />
              ) : (
                <input
                  type="text"
                  name={field.key}
                  defaultValue={section[field.key]}
                  className="rounded-lg border border-black/[.08] bg-transparent px-3 py-1.5 text-sm text-black outline-none focus:border-black/30 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/30"
                />
              )}
            </div>
          ))}

          {hasLink && (
            <div className="mt-2 flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                URL de destino
              </label>
              <input
                type="url"
                name="linkUrl"
                defaultValue={section.linkUrl}
                placeholder="https://..."
                className="rounded-lg border border-black/[.08] bg-transparent px-3 py-1.5 text-sm text-black outline-none focus:border-black/30 dark:border-white/[.145] dark:text-zinc-50 dark:focus:border-white/30"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          {status === "saving" ? "Guardando..." : "Guardar"}
        </button>
        {status === "saved" && (
          <span className="text-xs text-green-600 dark:text-green-400">Guardado</span>
        )}
        {status === "error" && (
          <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
        )}
      </div>
    </form>
  );
}

// ============================================================================
// Página principal: todo junto (enviar + editar contenido)
// ============================================================================

export default function Home() {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [sectionsError, setSectionsError] = useState("");

  function loadSections() {
    fetch("/api/newsletter/sections")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "No se pudieron cargar las secciones");
        setSections(body.sections);
      })
      .catch((err) => setSectionsError(err instanceof Error ? err.message : "Algo salió mal"));
  }

  useEffect(() => {
    loadSections();
  }, []);

  const sectionsByPage = useMemo(() => {
    const map = new Map<number, Section[]>();
    for (const s of sections ?? []) {
      const arr = map.get(s.page) ?? [];
      arr.push(s);
      map.set(s.page, arr);
    }
    return map;
  }, [sections]);

  function updateSection(id: string, updated: Partial<Section>) {
    setSections((prev) =>
      prev ? prev.map((s) => (s.id === id ? { ...s, ...updated } : s)) : prev
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Holisteek — Newsletter
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sube imágenes, arma cada página y envíala, todo desde aquí.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a href="#enviar" className="underline underline-offset-2">
            Ir a enviar
          </a>
          {[1, 2, 3].map((p) => (
            <a key={p} href={`#pagina-${p}`} className="underline underline-offset-2">
              Ir a página {p}
            </a>
          ))}
          <a href="/preview/holisteek" target="_blank" className="underline underline-offset-2">
            Ver newsletter completo
          </a>
        </div>
      </header>

      <SendPanel />

      {sectionsError && (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {sectionsError}
        </p>
      )}

      {!sections && !sectionsError && (
        <p className="text-sm text-zinc-500">Cargando secciones…</p>
      )}

      {sections &&
        [1, 2, 3].map((page) => (
          <section key={page} id={`pagina-${page}`} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                {PAGE_TITLES[page]}
              </h2>
              <a
                href={`/preview/holisteek?page=${page}`}
                target="_blank"
                className="text-xs underline underline-offset-2 text-zinc-500 dark:text-zinc-400"
              >
                Ver página {page}
              </a>
            </div>

            {(sectionsByPage.get(page) ?? []).map((section) => (
              <SectionRow
                key={section.id}
                section={section}
                onSaved={(updated) => updateSection(section.id, updated)}
              />
            ))}
          </section>
        ))}
    </div>
  );
}
