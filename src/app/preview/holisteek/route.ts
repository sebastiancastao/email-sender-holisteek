import { NextRequest, NextResponse } from "next/server";
import { loadSectionMap } from "@/lib/newsletter/data";
import { isPageNumber } from "@/lib/newsletter/sections";
import { renderFullNewsletterHtml, renderSinglePageHtml } from "@/lib/newsletter/template";

// GET /preview/holisteek           -> newsletter completo (3 páginas)
// GET /preview/holisteek?page=1|2|3 -> solo esa página
export async function GET(request: NextRequest) {
  const pageParam = request.nextUrl.searchParams.get("page");
  const page = pageParam ? Number(pageParam) : null;

  const sections = await loadSectionMap();

  const html = isPageNumber(page)
    ? renderSinglePageHtml(page, sections)
    : renderFullNewsletterHtml(sections);

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
