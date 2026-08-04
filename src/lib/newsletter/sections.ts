// Catálogo de "secciones" editables del newsletter Holisteek.
// Cada sección tiene, como máximo, una imagen y una URL (link) que se pueden
// sobrescribir desde el panel de administración (/admin/holisteek), y que se
// guardan en la tabla `newsletter_sections` de Supabase.

export type PageNumber = 1 | 2 | 3;

export type SectionKind = "image" | "link" | "image+link";

export type TextFieldKey = "title" | "description";

export interface TextFieldDef {
  key: TextFieldKey;
  label: string;
  defaultValue: string;
  multiline?: boolean;
}

export interface SectionDef {
  id: string;
  page: PageNumber;
  label: string;
  kind: SectionKind;
  defaultImageUrl?: string;
  defaultLinkUrl?: string;
  textFields?: TextFieldDef[];
}

// Bucket original donde vivían las imágenes de ejemplo. Se usa solo como
// fallback visual mientras no se suba un reemplazo desde el panel de admin.
const OLD_BUCKET =
  "https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek";

export const SECTION_DEFS: SectionDef[] = [
  // ---------- Página 1 ----------
  {
    id: "p1-logo",
    page: 1,
    label: "Página 1 — Logo (cabecera)",
    kind: "image",
    defaultImageUrl: `${OLD_BUCKET}/logo.png`,
  },
  {
    id: "p1-hero",
    page: 1,
    label: 'Página 1 — Portada / Hero (imagen de fondo + botón "Read Article")',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/hero.jpg`,
    defaultLinkUrl: "#",
  },
  {
    id: "p1-product-1",
    page: 1,
    label: 'Página 1 — Producto: "Feeling sluggish?" (Vit C)',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/vitamins.png`,
    defaultLinkUrl: "#",
  },
  {
    id: "p1-product-2",
    page: 1,
    label: 'Página 1 — Producto: "Want tighter skin?" (LED Mask)',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/ledmask.png`,
    defaultLinkUrl: "#",
  },
  {
    id: "p1-product-3",
    page: 1,
    label: 'Página 1 — Producto: "Organic Matty" (izquierda)',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/mat.png`,
    defaultLinkUrl: "#",
  },
  {
    id: "p1-product-4",
    page: 1,
    label: 'Página 1 — Producto: "Organic Matty" (derecha)',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/mat.png`,
    defaultLinkUrl: "#",
  },
  {
    id: "p1-asana",
    page: 1,
    label: 'Página 1 — Asana (fondo + botón "Discover More")',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/asana-watermark.png`,
    defaultLinkUrl: "#",
    textFields: [
      { key: "title", label: "Título", defaultValue: "ASANA" },
      {
        key: "description",
        label: "Descripción",
        multiline: true,
        defaultValue:
          'Āsana (Sanskrit: आसन) means "seat" or "posture." Traditionally, it referred to a stable, comfortable position for meditation. In modern yoga, the term includes the physical postures practiced to develop strength, flexibility, and body awareness.',
      },
    ],
  },

  // ---------- Página 2 ----------
  {
    id: "p2-logo",
    page: 2,
    label: "Página 2 — Logo (cabecera)",
    kind: "image",
    defaultImageUrl: `${OLD_BUCKET}/logo.png`,
  },
  {
    id: "p2-article-1",
    page: 2,
    label: "Página 2 — Tarjeta de artículo 1",
    kind: "image+link",
    defaultLinkUrl: "#",
  },
  {
    id: "p2-article-2",
    page: 2,
    label: "Página 2 — Tarjeta de artículo 2",
    kind: "image+link",
    defaultLinkUrl: "#",
  },
  {
    id: "p2-article-3",
    page: 2,
    label: "Página 2 — Tarjeta de artículo 3",
    kind: "image+link",
    defaultLinkUrl: "#",
  },
  {
    id: "p2-explore",
    page: 2,
    label: 'Página 2 — Botón "Explore More"',
    kind: "link",
    defaultLinkUrl: "#",
  },

  // ---------- Página 3 ----------
  {
    id: "p3-logo",
    page: 3,
    label: "Página 3 — Logo (cabecera)",
    kind: "image",
    defaultImageUrl: `${OLD_BUCKET}/logo.png`,
  },
  {
    id: "p3-partner-icon",
    page: 3,
    label: "Página 3 — Icono del partner destacado (opcional, si no se sube se muestra el ícono por defecto)",
    kind: "image",
  },
  {
    id: "p3-partner-explore",
    page: 3,
    label: 'Página 3 — Botón "Explore" del partner',
    kind: "link",
    defaultLinkUrl: "#",
  },
  {
    id: "p3-event-1",
    page: 3,
    label: "Página 3 — Evento 1 (Sunrise breathwork)",
    kind: "link",
    defaultLinkUrl: "#",
  },
  {
    id: "p3-event-2",
    page: 3,
    label: "Página 3 — Evento 2 (Sound bath under the stars)",
    kind: "link",
    defaultLinkUrl: "#",
  },
  {
    id: "p3-event-3",
    page: 3,
    label: "Página 3 — Evento 3 (Reformer + cacao morning)",
    kind: "link",
    defaultLinkUrl: "#",
  },
];

export type SectionValue = {
  imageUrl: string;
  linkUrl: string;
  title: string;
  description: string;
};
export type SectionMap = Record<string, SectionValue>;

function textFieldDefault(def: SectionDef, key: TextFieldKey): string {
  return def.textFields?.find((f) => f.key === key)?.defaultValue ?? "";
}

export function defaultSectionMap(): SectionMap {
  const map: SectionMap = {};
  for (const def of SECTION_DEFS) {
    map[def.id] = {
      imageUrl: def.defaultImageUrl ?? "",
      linkUrl: def.defaultLinkUrl ?? "#",
      title: textFieldDefault(def, "title"),
      description: textFieldDefault(def, "description"),
    };
  }
  return map;
}

export function sectionDef(id: string): SectionDef | undefined {
  return SECTION_DEFS.find((d) => d.id === id);
}

export function sectionsForPage(page: PageNumber): SectionDef[] {
  return SECTION_DEFS.filter((d) => d.page === page);
}

export function isPageNumber(value: unknown): value is PageNumber {
  return value === 1 || value === 2 || value === 3;
}
