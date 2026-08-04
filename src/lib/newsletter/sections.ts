// Catálogo de "secciones" editables del newsletter Holisteek.
// Cada sección tiene, como máximo, una imagen, una URL (link) y algunos
// campos de texto que se pueden sobrescribir desde la página principal, y
// que se guardan en la tabla `newsletter_sections` de Supabase.

export type PageNumber = 1 | 2 | 3;

export type SectionKind = "image" | "link" | "image+link" | "text";

export type TextFieldKey =
  | "title"
  | "description"
  | "bestFor"
  | "location"
  | "category"
  | "day"
  | "dow"
  | "sub"
  | "subtitle"
  | "bullet1"
  | "bullet2"
  | "bullet3"
  | "cta";

// Nombre de columna en `newsletter_sections` para cada campo de texto.
export const TEXT_FIELD_COLUMNS: Record<TextFieldKey, string> = {
  title: "title",
  description: "description",
  bestFor: "best_for",
  location: "location",
  category: "category",
  day: "day",
  dow: "dow",
  sub: "sub",
  subtitle: "subtitle",
  bullet1: "bullet1",
  bullet2: "bullet2",
  bullet3: "bullet3",
  cta: "cta",
};

export const TEXT_FIELD_KEYS = Object.keys(TEXT_FIELD_COLUMNS) as TextFieldKey[];

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
  // Si está presente, la sección muestra un campo para pegar una URL de
  // holisteek.com y autocompletar sus datos desde ahí:
  //  - "place"   -> holisteek.com/places/...      (/api/newsletter/places/autofill)
  //  - "event"   -> holisteek.com/experiences/...  (/api/newsletter/events/autofill)
  //  - "article" -> holisteek.com/guide/...        (/api/newsletter/articles/autofill)
  autofillFrom?: "place" | "event" | "article";
}

// Bucket original donde vivían las imágenes de ejemplo. Se usa solo como
// fallback visual mientras no se suba un reemplazo desde el panel de admin.
const OLD_BUCKET =
  "https://bwvnvzlmqqcdemkpecjw.supabase.co/storage/v1/object/public/holisteek";

// El logo no es editable desde el panel: es fijo en la plantilla (template.ts).
export const LOGO_URL = `${OLD_BUCKET}/logo.png`;

export const SECTION_DEFS: SectionDef[] = [
  // ---------- Página 1 ----------
  {
    id: "p1-hero",
    page: 1,
    label: 'Página 1 — Portada / Hero (imagen de fondo + botón "Read Article")',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/hero.jpg`,
    defaultLinkUrl: "#",
    autofillFrom: "article",
    textFields: [
      { key: "title", label: "Título", defaultValue: "Articulo" },
      {
        key: "description",
        label: "Descripción",
        multiline: true,
        defaultValue:
          "Stretching scientific facts that yougis kne before times. Learn more about your body anatomy and the love language of bones",
      },
      { key: "cta", label: "Texto del botón", defaultValue: "Read Article" },
    ],
  },
  {
    id: "p1-product-1",
    page: 1,
    label: 'Página 1 — Producto: "Feeling sluggish?" (Vit C)',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/vitamins.png`,
    defaultLinkUrl: "#",
    textFields: [
      { key: "title", label: "Título", defaultValue: "Feeling sluggish?" },
      { key: "subtitle", label: "Nombre del producto", defaultValue: "Dr Vit - Vit C" },
      { key: "bullet1", label: "Bullet 1", defaultValue: "better immune system" },
      { key: "bullet2", label: "Bullet 2", defaultValue: "Boosts energy" },
      { key: "bullet3", label: "Bullet 3", defaultValue: "better skin" },
      { key: "cta", label: "Texto del botón", defaultValue: "Try it out" },
    ],
  },
  {
    id: "p1-product-2",
    page: 1,
    label: 'Página 1 — Producto: "Want tighter skin?" (LED Mask)',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/ledmask.png`,
    defaultLinkUrl: "#",
    textFields: [
      { key: "title", label: "Título", defaultValue: "Want tigher skin?" },
      { key: "subtitle", label: "Nombre del producto", defaultValue: "LED Mask by Pop" },
      { key: "bullet1", label: "Bullet 1", defaultValue: "Anti Wrinkle" },
      { key: "bullet2", label: "Bullet 2", defaultValue: "Boosts energy" },
      { key: "bullet3", label: "Bullet 3", defaultValue: "better skin" },
      { key: "cta", label: "Texto del botón", defaultValue: "Try it out" },
    ],
  },
  {
    id: "p1-product-3",
    page: 1,
    label: 'Página 1 — Producto: "Organic Matty" (izquierda)',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/mat.png`,
    defaultLinkUrl: "#",
    textFields: [
      { key: "title", label: "Título", defaultValue: "Switching to organic?" },
      { key: "subtitle", label: "Nombre del producto", defaultValue: "Try Organic MATTY" },
      { key: "bullet1", label: "Bullet 1", defaultValue: "Natural" },
      { key: "bullet2", label: "Bullet 2", defaultValue: "Grab is good" },
      { key: "bullet3", label: "Bullet 3", defaultValue: "Durabilty" },
      { key: "cta", label: "Texto del botón", defaultValue: "Try it out" },
    ],
  },
  {
    id: "p1-product-4",
    page: 1,
    label: 'Página 1 — Producto: "Organic Matty" (derecha)',
    kind: "image+link",
    defaultImageUrl: `${OLD_BUCKET}/mat.png`,
    defaultLinkUrl: "#",
    textFields: [
      { key: "title", label: "Título", defaultValue: "Switching to organic?" },
      { key: "subtitle", label: "Nombre del producto", defaultValue: "Try Organic MATTY" },
      { key: "bullet1", label: "Bullet 1", defaultValue: "Natural" },
      { key: "bullet2", label: "Bullet 2", defaultValue: "Grab is good" },
      { key: "bullet3", label: "Bullet 3", defaultValue: "Durabilty" },
      { key: "cta", label: "Texto del botón", defaultValue: "Try it out" },
    ],
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
      { key: "cta", label: "Texto del botón", defaultValue: "Discover More" },
    ],
  },

  // ---------- Página 2 ----------
  {
    id: "p2-get-inspired",
    page: 2,
    label: "Página 2 — Get Inspired (título + texto)",
    kind: "text",
    textFields: [
      { key: "title", label: "Título", defaultValue: "Get Inspired" },
      {
        key: "description",
        label: "Texto",
        multiline: true,
        defaultValue:
          '"Embrace the dance of life with grace, as each breath is a step towards your true self. In the stillness of the mind, the universe reveals its secrets, guiding you with the wisdom of the Yoga Sutras.\n\nLet your heart be the compass, your spirit the light, and your practice the path. Together, they lead you to the serene shores of inner peace and boundless love.\n\nRemember, you are not just a wave in the ocean; you are the ocean in a wave, connected to all, infinite and whole. Trust the journey, for it is in the journey that the soul finds its purpose and the mind its tranquility."',
      },
    ],
  },
  {
    id: "p2-article-1",
    page: 2,
    label: "Página 2 — Tarjeta de artículo 1",
    kind: "image+link",
    defaultLinkUrl: "#",
    autofillFrom: "article",
    textFields: [
      { key: "title", label: "Título", defaultValue: "Abstract" },
      {
        key: "description",
        label: "Descripción",
        multiline: true,
        defaultValue: "This dissertation reports a study gree-of-freedom systems with pa urces of energy dissipatio",
      },
    ],
  },
  {
    id: "p2-article-2",
    page: 2,
    label: "Página 2 — Tarjeta de artículo 2",
    kind: "image+link",
    defaultLinkUrl: "#",
    autofillFrom: "article",
    textFields: [
      { key: "title", label: "Título", defaultValue: "Abstract" },
      {
        key: "description",
        label: "Descripción",
        multiline: true,
        defaultValue: "This dissertation reports a study gree-of-freedom systems with pa urces of energy dissipatio",
      },
    ],
  },
  {
    id: "p2-article-3",
    page: 2,
    label: "Página 2 — Tarjeta de artículo 3",
    kind: "image+link",
    defaultLinkUrl: "#",
    autofillFrom: "article",
    textFields: [
      { key: "title", label: "Título", defaultValue: "Abstract" },
      {
        key: "description",
        label: "Descripción",
        multiline: true,
        defaultValue: "This dissertation reports a study gree-of-freedom systems with pa urces of energy dissipatio",
      },
    ],
  },
  {
    id: "p2-explore",
    page: 2,
    label: 'Página 2 — Botón "Explore More"',
    kind: "link",
    defaultLinkUrl: "#",
    textFields: [{ key: "cta", label: "Texto del botón", defaultValue: "Explore More" }],
  },

  // ---------- Página 3 ----------
  {
    id: "p3-partner",
    page: 3,
    label: "Página 3 — Partner destacado",
    kind: "image+link",
    defaultLinkUrl: "#",
    autofillFrom: "place",
    textFields: [
      { key: "title", label: "Nombre del lugar", defaultValue: "Nômade Temple, Madrid" },
      {
        key: "description",
        label: "Descripción / cita",
        multiline: true,
        defaultValue: '"Most people come for the sound bath and stay for the community that forms after it."',
      },
      { key: "bestFor", label: "Best for", defaultValue: "Sound healing" },
      { key: "location", label: "Ubicación", defaultValue: "Madrid Spain" },
      { key: "category", label: "Categoría (What?)", defaultValue: "Wellness Resort" },
      { key: "cta", label: "Texto del botón", defaultValue: "Explore" },
    ],
  },
  {
    id: "p3-event-1",
    page: 3,
    label: "Página 3 — Evento 1",
    kind: "link",
    defaultLinkUrl: "#",
    autofillFrom: "event",
    textFields: [
      { key: "day", label: "Día (número)", defaultValue: "28" },
      { key: "dow", label: "Día de la semana", defaultValue: "MON" },
      { key: "title", label: "Nombre del evento", defaultValue: "Sunrise breathwork" },
      { key: "sub", label: "Detalle (lugar · hora · cupos)", defaultValue: "Retiro Verde · 7:00 AM · 4 spots left" },
    ],
  },
  {
    id: "p3-event-2",
    page: 3,
    label: "Página 3 — Evento 2",
    kind: "link",
    defaultLinkUrl: "#",
    autofillFrom: "event",
    textFields: [
      { key: "day", label: "Día (número)", defaultValue: "30" },
      { key: "dow", label: "Día de la semana", defaultValue: "WED" },
      { key: "title", label: "Nombre del evento", defaultValue: "Sound bath under the stars" },
      { key: "sub", label: "Detalle (lugar · hora · cupos)", defaultValue: "Nômade Temple · 8:30 PM · waitlist open" },
    ],
  },
  {
    id: "p3-event-3",
    page: 3,
    label: "Página 3 — Evento 3",
    kind: "link",
    defaultLinkUrl: "#",
    autofillFrom: "event",
    textFields: [
      { key: "day", label: "Día (número)", defaultValue: "02" },
      { key: "dow", label: "Día de la semana", defaultValue: "SAT" },
      { key: "title", label: "Nombre del evento", defaultValue: "Reformer + cacao morning" },
      { key: "sub", label: "Detalle (lugar · hora · cupos)", defaultValue: "Studio Alma · 9:00 AM · 6 spots left" },
    ],
  },
];

export type SectionValue = { imageUrl: string; linkUrl: string } & Record<TextFieldKey, string>;
export type SectionMap = Record<string, SectionValue>;

function textFieldDefault(def: SectionDef, key: TextFieldKey): string {
  return def.textFields?.find((f) => f.key === key)?.defaultValue ?? "";
}

export function defaultSectionMap(): SectionMap {
  const map: SectionMap = {};
  for (const def of SECTION_DEFS) {
    const value = {
      imageUrl: def.defaultImageUrl ?? "",
      linkUrl: def.defaultLinkUrl ?? "#",
    } as SectionValue;
    for (const key of TEXT_FIELD_KEYS) {
      value[key] = textFieldDefault(def, key);
    }
    map[def.id] = value;
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
