import { NextResponse } from "next/server";
import { getSupabaseAdmin, NEWSLETTER_TABLE } from "@/lib/supabaseAdmin";
import { sectionDef, TEXT_FIELD_COLUMNS } from "@/lib/newsletter/sections";
import { errorMessage } from "@/lib/errorMessage";

const ALLOWED_HOSTS = new Set(["holisteek.com", "www.holisteek.com"]);
const SELECT_COLUMNS = ["id", "image_url", "link_url", ...Object.values(TEXT_FIELD_COLUMNS)].join(", ");

interface EventData {
  name?: string;
  dateInit?: string;
  hourOpen?: string;
  city?: string;
  address?: string;
  spots?: string;
}

// Las páginas de holisteek.com/experiences/... no traen JSON-LD; los datos
// del evento viajan embebidos (una vez escapados) dentro de los <script>
// self.__next_f.push([...]) que usa el App Router de Next.js para hidratar
// la página. No es una API pública ni estable, pero es lo único disponible.
function extractEventData(html: string): EventData {
  const anchor = html.match(/\\"experience\\":\{/);
  const data: EventData = {};

  if (anchor?.index !== undefined) {
    const raw = html.slice(anchor.index, anchor.index + 2000);
    const unescaped = raw.replace(/\\"/g, '"').replace(/\\\\/g, "\\");

    data.name = unescaped.match(/"name":"([^"]*)"/)?.[1];
    data.dateInit = unescaped.match(/"dateInit":"([^"]*)"/)?.[1];
    data.hourOpen = unescaped.match(/"hourOpen":"([^"]*)"/)?.[1];
    data.city = unescaped.match(/"city":"([^"]*)"/)?.[1];
    data.address = unescaped.match(/"address":"([^"]*)"/)?.[1];
  }

  if (!data.name) {
    data.name = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1];
  }

  data.spots = html.match(/Space Available<\/span><span[^>]*>(\d+)<\/span>/)?.[1];

  return data;
}

function formatDayAndDow(iso: string): { day: string; dow: string } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const day = String(d.getUTCDate()).padStart(2, "0");
  const dow = d
    .toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
    .toUpperCase();

  return { day, dow };
}

// POST /api/newsletter/events/autofill
// body: { sectionId: "p3-event-1" | "p3-event-2" | "p3-event-3", url: "https://www.holisteek.com/experiences/<slug>" }
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const eventUrl = typeof body.url === "string" ? body.url.trim() : "";

  const def = sectionDef(sectionId);
  if (!def || def.autofillFrom !== "event") {
    return NextResponse.json({ error: "sectionId inválido para autocompletar un evento." }, { status: 400 });
  }

  if (!eventUrl) {
    return NextResponse.json({ error: "Falta la URL del evento." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(eventUrl);
  } catch {
    return NextResponse.json({ error: "La URL no es válida." }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.hostname) || !parsedUrl.pathname.startsWith("/experiences/")) {
    return NextResponse.json(
      { error: "Solo se admiten URLs de holisteek.com/experiences/..." },
      { status: 400 }
    );
  }

  let html: string;
  try {
    const res = await fetch(parsedUrl.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HolisteekNewsletterBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `holisteek.com respondió con estado ${res.status} para esa URL.` },
        { status: 502 }
      );
    }
    html = await res.text();
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo abrir esa URL.", detail: errorMessage(err) },
      { status: 502 }
    );
  }

  const event = extractEventData(html);
  if (!event.name && !event.dateInit) {
    return NextResponse.json(
      { error: "No se encontró información del evento en esa página." },
      { status: 422 }
    );
  }

  const dayDow = event.dateInit ? formatDayAndDow(event.dateInit) : null;

  const subParts = [
    event.city,
    event.hourOpen,
    event.spots ? `${event.spots} spots available` : null,
  ].filter((p): p is string => Boolean(p));

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json(
      {
        error: "Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.",
        detail: errorMessage(err),
      },
      { status: 500 }
    );
  }

  const update: Record<string, string> = { link_url: eventUrl };
  if (event.name) update.title = event.name;
  if (dayDow) {
    update.day = dayDow.day;
    update.dow = dayDow.dow;
  }
  if (subParts.length > 0) update.sub = subParts.join(" · ");

  const { data, error } = await supabase
    .from(NEWSLETTER_TABLE)
    .upsert(
      { id: sectionId, page: def.page, label: def.label, ...update, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ section: data });
}
