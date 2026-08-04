import { LOGO_URL, PageNumber, SectionMap, TextFieldKey } from "./sections";

// Plantilla del newsletter Holisteek, generada dinámicamente a partir de
// `SectionMap` (imagen + URL de cada sección, cargadas desde Supabase).
// Cada página se puede renderizar sola (para enviarla por separado) o
// combinada con las demás (para el newsletter completo).

function escapeAttr(value: string): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "%27")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function img(id: string, s: SectionMap, fallback = ""): string {
  return escapeAttr(s[id]?.imageUrl || fallback);
}

function escapeHtml(value: string): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function text(id: string, field: TextFieldKey, s: SectionMap, fallback = ""): string {
  const raw = s[id]?.[field] || fallback;
  return escapeHtml(raw).replace(/\n/g, "<br>");
}

function link(id: string, s: SectionMap): string {
  return escapeAttr(s[id]?.linkUrl || "#");
}

function documentHead(s: SectionMap): string {
  const heroUrl = img("p1-hero", s);

  return `<!DOCTYPE html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Holisteek — Newsletter</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,600&family=Nunito+Sans:wght@400;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<!--[if mso]>
<style>
  table {border-collapse:collapse;}
  body, table, td, a { font-family: Arial, sans-serif !important; }
</style>
<![endif]-->
<style>
  body{margin:0;padding:0;background-color:#c9cdd4;-webkit-font-smoothing:antialiased;}
  table{border-collapse:collapse;}
  img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
  a{color:inherit;}

  .hero-bg{
    background-image:url('${heroUrl}');
    background-size:cover;
    background-position:center;
    border-radius:22px;
  }
  .page-shell{border-radius:6px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.18);}
  .om-gradient{background:linear-gradient(145deg,#b04ad6,#7a1fb0);}

  .pill{display:inline-block;font-family:'Poppins',Arial,sans-serif;font-weight:600;letter-spacing:2px;font-size:11px;color:#1c2431;border:2px solid #1c2431;border-radius:40px;padding:9px 20px;text-decoration:none;text-transform:uppercase;}
  .pill-w{color:#ffffff;border-color:#ffffff;}
  .pill-sm{font-size:10px;padding:7px 16px;}
  .prod-title{font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:20px;margin-bottom:8px;}
  .prod-body{font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:14px;color:#1c2431;margin-bottom:4px;}
  .prod-list{margin:0 0 12px;padding-left:20px;font-family:'Nunito Sans',Arial,sans-serif;font-size:14px;color:#333333;line-height:1.6;}
  .art-ab{font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:20px;color:#111111;}
  .art-label{font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:19px;color:#dc3b31;letter-spacing:.5px;margin-bottom:12px;}
  .art-frag{font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:10px;line-height:1.5;color:#555555;}
  .meta-k{font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:12px;letter-spacing:2px;color:#1c2431;margin-bottom:8px;}
  .meta-v{font-family:'Nunito Sans',Arial,sans-serif;font-size:16px;color:#2f5099;}
  .ev-day{font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:26px;color:#2f5099;line-height:1;}
  .ev-dow{font-family:'Poppins',Arial,sans-serif;font-weight:600;font-size:11px;letter-spacing:1px;color:#1c2431;}
  .ev-title{font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:19px;color:#2f5099;margin-bottom:4px;}
  .ev-sub{font-family:'Nunito Sans',Arial,sans-serif;font-size:14px;color:#555555;}
  .divider{border-bottom:1.5px solid #cdd39a;font-size:1px;line-height:1px;}

  @media(max-width:560px){
    .stack{display:block !important;width:100% !important;padding-left:0 !important;padding-right:0 !important;}
    .hero-copy{margin-left:0 !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#c9cdd4;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#c9cdd4;">
<tr>
<td align="center" style="padding:32px 12px;">
`;
}

function documentTail(): string {
  return `
</td>
</tr>
</table>

</body>
</html>`;
}

function spacer(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;"><tr><td height="40" style="font-size:1px;line-height:1px;">&nbsp;</td></tr></table>`;
}

function pageOne(s: SectionMap): string {
  const heroUrl = img("p1-hero", s);

  return `<!-- ============================ PÁGINA 1 ============================ -->
<table role="presentation" class="page-shell" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background-color:#ffffff;">

  <!-- header -->
  <tr>
    <td align="center" style="background-color:#ecf1c2;padding:20px 0 14px;">
      <img src="${escapeAttr(LOGO_URL)}" width="209" alt="Holisteek" style="display:block;width:209px;height:auto;">
    </td>
  </tr>

  <!-- hero -->
  <tr>
    <td style="background-color:#ecf1c2;padding:0 22px 34px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="hero-bg" background="${heroUrl}" bgcolor="#3f4232" valign="top" style="border-radius:22px;">
            <!--[if mso]>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#3f4232;">
            <![endif]-->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:26px 26px 0;font-family:'Poppins',Arial,sans-serif;font-weight:500;font-size:36px;color:#ffffff;">
                  Articulo
                </td>
              </tr>
              <tr>
                <td height="170" style="font-size:1px;line-height:1px;">&nbsp;</td>
              </tr>
              <tr>
                <td align="right" style="padding:0 26px 26px;">
                  <table role="presentation" width="330" cellpadding="0" cellspacing="0" border="0" class="hero-copy" style="max-width:330px;">
                    <tr>
                      <td style="font-family:'Nunito Sans',Arial,sans-serif;font-size:15px;line-height:1.45;color:#ffffff;padding-bottom:16px;">
                        Stretching scientific facts that yougis kne before times. Learn more about your body anatomy and the love language of bones
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a href="${link("p1-hero", s)}" class="pill pill-w">Read Article</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!--[if mso]>
            </td></tr></table>
            <![endif]-->
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- what you need -->
  <tr>
    <td style="background-color:#e5f3ed;padding:30px 26px 40px;">
      <div style="font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:32px;color:#1c2431;margin-bottom:26px;">What you need…</div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="stack" width="50%" valign="top" style="padding:0 13px 34px 0;">
            <div class="prod-title" style="color:#dc3b31;">${text("p1-product-1", "title", s, "Feeling sluggish?")}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td valign="top">
                <div class="prod-body">Dr Vit - Vit C<br>benefits:</div>
                <ul class="prod-list">
                  <li>better immune system</li><li>Boosts energy</li><li>better skin</li>
                </ul>
                <a href="${link("p1-product-1", s)}" class="pill pill-sm">Try it out</a>
              </td>
              <td width="90" valign="top" align="right">
                <img src="${img("p1-product-1", s)}" width="90" alt="Vit C" style="display:block;width:90px;max-width:90px;height:auto;">
              </td>
            </tr></table>
          </td>
          <td class="stack" width="50%" valign="top" style="padding:0 0 34px 13px;">
            <div class="prod-title" style="color:#2f5099;">${text("p1-product-2", "title", s, "Want tigher skin?")}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td valign="top">
                <div class="prod-body">LED Mask by Pop<br>benefits:</div>
                <ul class="prod-list">
                  <li>Anti Wrinkle</li><li>Boosts energy</li><li>better skin</li>
                </ul>
                <a href="${link("p1-product-2", s)}" class="pill pill-sm">Try it out</a>
              </td>
              <td width="80" valign="top" align="right">
                <img src="${img("p1-product-2", s)}" width="80" alt="LED Mask" style="display:block;width:80px;max-width:80px;height:auto;">
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td class="stack" width="50%" valign="top" style="padding:0 13px 0 0;">
            <div align="center" class="prod-title" style="color:#efa0c0;">${text("p1-product-3", "title", s, "Switching to organic?")}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td width="90" valign="top">
                <img src="${img("p1-product-3", s)}" width="90" alt="Organic mat" style="display:block;width:90px;max-width:90px;height:auto;">
              </td>
              <td valign="top" style="padding-left:12px;">
                <div class="prod-body">Try Organic MATTY</div>
                <ul class="prod-list">
                  <li>Natural</li><li>Grab is good</li><li>Durabilty</li>
                </ul>
                <a href="${link("p1-product-3", s)}" class="pill pill-sm">Try it out</a>
              </td>
            </tr></table>
          </td>
          <td class="stack" width="50%" valign="top" style="padding:0 0 0 13px;">
            <div align="center" class="prod-title" style="color:#efa0c0;">${text("p1-product-4", "title", s, "Switching to organic?")}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
              <td width="90" valign="top">
                <img src="${img("p1-product-4", s)}" width="90" alt="Organic mat" style="display:block;width:90px;max-width:90px;height:auto;">
              </td>
              <td valign="top" style="padding-left:12px;">
                <div class="prod-body">Try Organic MATTY</div>
                <ul class="prod-list">
                  <li>Natural</li><li>Grab is good</li><li>Durabilty</li>
                </ul>
                <a href="${link("p1-product-4", s)}" class="pill pill-sm">Try it out</a>
              </td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- asana -->
  <tr>
    <td background="${img("p1-asana", s)}" bgcolor="#faf9f5" style="background-color:#faf9f5;background-image:url('${img("p1-asana", s)}');background-repeat:no-repeat;background-position:center top;background-size:100% auto;padding:44px 22px 40px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background-color:#eef2cc;border-radius:64px;padding:34px 40px;text-align:center;">
          <div style="font-family:'Poppins',Arial,sans-serif;font-style:italic;font-weight:600;font-size:40px;color:#1c2431;margin-bottom:14px;">${text("p1-asana", "title", s, "ASANA")}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="top" align="left" style="font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:22px;color:#1c2431;line-height:1.15;width:80px;">WORD<br>OF THE<br>DAY</td>
            <td valign="top" align="left" style="font-family:'Nunito Sans',Arial,sans-serif;font-size:15px;line-height:1.5;color:#2c2c2c;padding-left:20px;">
              ${text("p1-asana", "description", s, 'Āsana (Sanskrit: आसन) means "seat" or "posture." Traditionally, it referred to a stable, comfortable position for meditation. In modern yoga, the term includes the physical postures practiced to develop strength, flexibility, and body awareness.')}
            </td>
          </tr></table>
          <div style="margin-top:22px;">
            <a href="${link("p1-asana", s)}" class="pill">Discover More</a>
          </div>
        </td></tr>
      </table>
    </td>
  </tr>
</table>`;
}

function pageTwo(s: SectionMap): string {
  const articleCard = (id: string) => {
    const imageUrl = s[id]?.imageUrl;
    const thumb = imageUrl
      ? `<div style="margin-bottom:10px;"><img src="${escapeAttr(imageUrl)}" width="100%" alt="" style="display:block;width:100%;height:auto;border-radius:8px;"></div>`
      : "";
    return `<a href="${link(id, s)}" style="display:block;text-decoration:none;color:inherit;background-color:#fdfdfb;border-radius:12px;padding:18px 14px;">
              ${thumb}
              <div class="art-ab">Abstract</div>
              <div class="art-label">ARTICLE</div>
              <div class="art-frag">This dissertation reports a study gree-of-freedom systems with pa urces of energy dissipatio</div>
            </a>`;
  };

  return `<!-- ============================ PÁGINA 2 ============================ -->
<table role="presentation" class="page-shell" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background-color:#ffffff;">

  <tr><td height="14" style="background-color:#1c2431;font-size:1px;line-height:1px;">&nbsp;</td></tr>

  <tr>
    <td align="center" style="background-color:#ecf1c2;padding:22px 0;">
      <img src="${escapeAttr(LOGO_URL)}" width="270" alt="Holisteek" style="display:block;width:270px;height:auto;">
    </td>
  </tr>

  <tr>
    <td style="background-color:#faf9f3;padding:34px 32px 60px;">
      <div style="font-family:'Poppins',Arial,sans-serif;font-weight:500;font-size:22px;color:#232323;margin-bottom:26px;">${text("p2-get-inspired", "title", s, "Get Inspired")}</div>
      <p style="margin:0;font-family:'Poppins',Arial,sans-serif;font-weight:400;font-size:22px;line-height:1.55;color:#1f1f1f;">
        ${text(
          "p2-get-inspired",
          "description",
          s,
          '"Embrace the dance of life with grace, as each breath is a step towards your true self. In the stillness of the mind, the universe reveals its secrets, guiding you with the wisdom of the Yoga Sutras.\n\nLet your heart be the compass, your spirit the light, and your practice the path. Together, they lead you to the serene shores of inner peace and boundless love.\n\nRemember, you are not just a wave in the ocean; you are the ocean in a wave, connected to all, infinite and whole. Trust the journey, for it is in the journey that the soul finds its purpose and the mind its tranquility."'
        )}
      </p>
    </td>
  </tr>

  <tr>
    <td style="background-color:#ecf1c2;padding:40px 26px 44px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="stack" width="33.33%" valign="top" style="padding:0 8px 16px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:12px;">
              ${articleCard("p2-article-1")}
            </td></tr></table>
          </td>
          <td class="stack" width="33.33%" valign="top" style="padding:0 4px 16px 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:12px;">
              ${articleCard("p2-article-2")}
            </td></tr></table>
          </td>
          <td class="stack" width="33.33%" valign="top" style="padding:0 0 16px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:12px;">
              ${articleCard("p2-article-3")}
            </td></tr></table>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px auto 0;"><tr>
        <td style="background-color:#1c2431;border-radius:40px;">
          <a href="${link("p2-explore", s)}" style="display:block;width:200px;text-align:center;color:#ffffff;text-decoration:none;font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:20px;padding:14px;">Explore More</a>
        </td>
      </tr></table>
    </td>
  </tr>
</table>`;
}

function pageThree(s: SectionMap): string {
  const partnerIconUrl = s["p3-partner"]?.imageUrl;
  const partnerIcon = partnerIconUrl
    ? `<td align="center" valign="middle" bgcolor="#1c2431" height="400" style="background-color:#1c2431;border-radius:16px;">
          <img src="${escapeAttr(partnerIconUrl)}" width="200" alt="" style="display:block;width:200px;height:auto;border-radius:16px;">
        </td>`
    : `<td align="center" valign="middle" bgcolor="#1c2431" height="400" style="background-color:#1c2431;border-radius:16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td class="om-gradient" bgcolor="#9333c9" align="center" valign="middle" width="110" height="110" style="width:110px;height:110px;border-radius:22px;font-size:60px;">🕉</td>
          </tr></table>
        </td>`;

  const eventRow = (id: string, defaults: { day: string; dow: string; title: string; sub: string }) => `<a href="${link(id, s)}" style="display:block;text-decoration:none;color:inherit;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="54" valign="top" align="center" style="padding:20px 0;">
          <div class="ev-day">${text(id, "day", s, defaults.day)}</div>
          <div class="ev-dow">${text(id, "dow", s, defaults.dow)}</div>
        </td>
        <td valign="top" style="padding:20px 0 20px 18px;">
          <div class="ev-title">${text(id, "title", s, defaults.title)}</div>
          <div class="ev-sub">${text(id, "sub", s, defaults.sub)}</div>
        </td>
      </tr></table>
    </a>`;

  return `<!-- ============================ PÁGINA 3 ============================ -->
<table role="presentation" class="page-shell" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background-color:#ecf1c2;">
  <tr>
    <td style="padding:26px 30px 40px;">

      <img src="${escapeAttr(LOGO_URL)}" width="246" alt="Holisteek" style="display:block;width:246px;height:auto;margin-bottom:16px;">

      <div style="font-family:'Poppins',Arial,sans-serif;font-weight:600;font-size:13px;letter-spacing:3px;color:#1c2431;margin-bottom:14px;">PARTNER SPOTLIGHT</div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;"><tr>
        ${partnerIcon}
      </tr></table>

      <div style="font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:34px;color:#2f5099;margin-bottom:16px;">${text("p3-partner", "title", s, "Nômade Temple, Madrid")}</div>
      <p style="margin:0 0 26px;max-width:520px;font-family:'Nunito Sans',Arial,sans-serif;font-style:italic;font-size:19px;line-height:1.45;color:#333333;">${text("p3-partner", "description", s, '"Most people come for the sound bath and stay for the community that forms after it."')}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:26px;"><tr>
        <td class="stack" width="33.33%" valign="top">
          <div class="meta-k">BEST FOR</div>
          <div class="meta-v">${text("p3-partner", "bestFor", s, "Sound healing")}</div>
        </td>
        <td class="stack" width="33.33%" valign="top">
          <div class="meta-k">LOCATION</div>
          <div class="meta-v">${text("p3-partner", "location", s, "Madrid Spain")}</div>
        </td>
        <td class="stack" width="33.33%" valign="top">
          <div class="meta-k">WHAT?</div>
          <div class="meta-v">${text("p3-partner", "category", s, "Wellness Resort")}</div>
        </td>
      </tr></table>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;"><tr>
        <td bgcolor="#1c2431" style="background-color:#1c2431;border-radius:40px;">
          <a href="${link("p3-partner", s)}" style="display:block;text-align:center;color:#ffffff;text-decoration:none;font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:19px;padding:18px;">Explore</a>
        </td>
      </tr></table>

      <div style="font-family:'Poppins',Arial,sans-serif;font-weight:700;font-size:14px;letter-spacing:3px;color:#1c2431;margin-bottom:6px;">EVENTS THIS WEEK</div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="divider">&nbsp;</td></tr>
      </table>
      ${eventRow("p3-event-1", { day: "28", dow: "MON", title: "Sunrise breathwork", sub: "Retiro Verde · 7:00 AM · 4 spots left" })}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="divider">&nbsp;</td></tr>
      </table>
      ${eventRow("p3-event-2", { day: "30", dow: "WED", title: "Sound bath under the stars", sub: "Nômade Temple · 8:30 PM · waitlist open" })}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="divider">&nbsp;</td></tr>
      </table>
      ${eventRow("p3-event-3", { day: "02", dow: "SAT", title: "Reformer + cacao morning", sub: "Studio Alma · 9:00 AM · 6 spots left" })}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="divider">&nbsp;</td></tr>
      </table>

    </td>
  </tr>
</table>`;
}

const PAGE_RENDERERS: Record<PageNumber, (s: SectionMap) => string> = {
  1: pageOne,
  2: pageTwo,
  3: pageThree,
};

export const PAGE_LABELS: Record<PageNumber, string> = {
  1: "Página 1 — Artículo, productos y Asana",
  2: "Página 2 — Get Inspired y artículos",
  3: "Página 3 — Partner spotlight y eventos",
};

/** Renderiza una o varias páginas del newsletter como un documento HTML completo. */
export function renderNewsletterHtml(pages: PageNumber[], s: SectionMap): string {
  const body = pages.map((p) => PAGE_RENDERERS[p](s)).join(`\n${spacer()}\n`);
  return `${documentHead(s)}${body}${documentTail()}`;
}

/** Atajo para renderizar una sola página (para enviarla/previsualizarla por separado). */
export function renderSinglePageHtml(page: PageNumber, s: SectionMap): string {
  return renderNewsletterHtml([page], s);
}

/** Newsletter completo (las 3 páginas), igual que el archivo estático original. */
export function renderFullNewsletterHtml(s: SectionMap): string {
  return renderNewsletterHtml([1, 2, 3], s);
}
