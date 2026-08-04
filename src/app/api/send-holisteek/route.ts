import { NextResponse } from "next/server";
import { Resend } from "resend";
import { loadSectionMap } from "@/lib/newsletter/data";
import { isPageNumber, PageNumber } from "@/lib/newsletter/sections";
import { PAGE_LABELS, renderFullNewsletterHtml, renderSinglePageHtml } from "@/lib/newsletter/template";

type PageSelection = PageNumber | "all";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRecipients(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const flat = raw.flatMap((v) => String(v).split(/[,;\n]/));
  const cleaned = flat.map((v) => v.trim()).filter(Boolean);
  return Array.from(new Set(cleaned));
}

function parsePages(value: unknown): PageSelection[] | null {
  const raw = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  if (raw.length === 0) return ["all"];

  const pages: PageSelection[] = [];
  for (const item of raw) {
    if (item === "all") {
      pages.push("all");
      continue;
    }
    const num = Number(item);
    if (!isPageNumber(num)) return null;
    pages.push(num);
  }
  return pages;
}

export async function POST(request: Request) {
  const body = await request.json();

  const recipients = parseRecipients(body.to);
  if (recipients.length === 0) {
    return NextResponse.json({ error: "to is required" }, { status: 400 });
  }
  const invalidEmail = recipients.find((r) => !EMAIL_RE.test(r));
  if (invalidEmail) {
    return NextResponse.json({ error: `Correo inválido: ${invalidEmail}` }, { status: 400 });
  }

  const pages = parsePages(body.pages ?? body.page);
  if (pages === null) {
    return NextResponse.json(
      { error: 'pages debe ser una lista de 1, 2, 3 y/o "all"' },
      { status: 400 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured on the server" },
      { status: 500 }
    );
  }

  const sections = await loadSectionMap();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  // Cada página seleccionada se manda como un correo individual y separado
  // (no combinado), uno por cada destinatario.
  const jobs = recipients.flatMap((to) =>
    pages.map((page) => ({ to, page }))
  );

  const results = await Promise.all(
    jobs.map(async ({ to, page }) => {
      const html = page === "all" ? renderFullNewsletterHtml(sections) : renderSinglePageHtml(page, sections);
      const defaultSubject = page === "all" ? "Holisteek — Newsletter" : `Holisteek — ${PAGE_LABELS[page]}`;

      const { data, error } = await resend.emails.send({
        from,
        to,
        subject: body.subject || defaultSubject,
        html,
      });

      return {
        to,
        page,
        id: data?.id ?? null,
        error: error?.message ?? null,
      };
    })
  );

  const hasError = results.some((r) => r.error);

  return NextResponse.json({ results }, { status: hasError ? 207 : 200 });
}
