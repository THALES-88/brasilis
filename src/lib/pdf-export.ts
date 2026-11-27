import { jsPDF } from "jspdf";
import {
  getItauEncyclopediaSearchUrl,
  getProviderLabel,
} from "./artist-entities";
import type { ArtworkRecord } from "../types/art";

export interface LoadedPdfImage {
  dataUrl: string;
  width: number;
  height: number;
  format: "JPEG" | "PNG";
}

export interface ArtworkPdfPayload {
  filename: string;
  title: string;
  movementsLabel: string;
  artistLine: string;
  inventoryLine: string;
  caption: string;
  moodLine: string;
  medium: string;
  dimensions: string;
  institution: string;
  institutionCity: string | null;
  provenance: string;
  rightsTitle: string;
  rightsNotice: string;
  allowFullDisplay: boolean;
  dominantColors: string[];
  wikidataItemUrl: string | null;
  wikidataArtistUrl: string | null;
  recordUrl: string;
  itauUrl: string;
  imageUrl: string;
}

export function toPdfSafeText(input: string): string {
  return input
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildPdfFilename(artwork: ArtworkRecord): string {
  const rawSlug = artwork.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `ficha-tecnica-${rawSlug || artwork.id}.pdf`;
}

export function hexToRgbTuple(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean.padEnd(6, "0");
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [120, 115, 105];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function buildArtworkPdfPayload(
  artwork: ArtworkRecord
): ArtworkPdfPayload {
  const dimensions =
    artwork.classification.dimensions_cm.height &&
    artwork.classification.dimensions_cm.width
      ? `${artwork.classification.dimensions_cm.height} × ${artwork.classification.dimensions_cm.width}${
          artwork.classification.dimensions_cm.depth
            ? ` × ${artwork.classification.dimensions_cm.depth}`
            : ""
        } cm`
      : "Não informadas";

  const rightsTitle =
    artwork.rights.status === "public_domain"
      ? "Domínio Público"
      : artwork.rights.status === "cc_open"
        ? `Licença Aberta (${artwork.rights.license_code ?? "CC"})`
        : "Obra Referencial (Direitos Vigentes)";

  const lifespan = artwork.artist.birth_year
    ? ` (${artwork.artist.birth_year}-${artwork.artist.death_year ?? "atual"})`
    : "";

  const artistParts = [
    `${artwork.artist.name}${lifespan}`,
    artwork.artist.origin_state ?? null,
    artwork.chronology.display_date,
  ].filter(Boolean);

  const imageUrl = artwork.rights.allow_full_display
    ? (artwork.media.full_url ?? artwork.media.thumb_url)
    : artwork.media.thumb_url;

  return {
    filename: buildPdfFilename(artwork),
    title: toPdfSafeText(artwork.title),
    movementsLabel: toPdfSafeText(
      artwork.classification.movements.join(" · ").toUpperCase()
    ),
    artistLine: toPdfSafeText(artistParts.join(" · ")),
    inventoryLine: toPdfSafeText(
      `${artwork.source.inventory_code ?? artwork.id} · ${artwork.source.institution}`
    ),
    caption: toPdfSafeText(artwork.semantic.visual_caption_pt),
    moodLine: toPdfSafeText(artwork.semantic.mood.join(" · ")),
    medium: toPdfSafeText(artwork.classification.medium),
    dimensions: toPdfSafeText(dimensions),
    institution: toPdfSafeText(artwork.source.institution),
    institutionCity: artwork.source.institution_city
      ? toPdfSafeText(artwork.source.institution_city)
      : null,
    provenance: toPdfSafeText(getProviderLabel(artwork.source.provider)),
    rightsTitle: toPdfSafeText(rightsTitle),
    rightsNotice: toPdfSafeText(artwork.rights.notice_pt),
    allowFullDisplay: artwork.rights.allow_full_display,
    dominantColors: artwork.media.dominant_colors.slice(0, 4),
    wikidataItemUrl: artwork.wikidata_qid
      ? `https://www.wikidata.org/wiki/${artwork.wikidata_qid}`
      : null,
    wikidataArtistUrl: artwork.artist.wikidata_qid
      ? `https://www.wikidata.org/wiki/${artwork.artist.wikidata_qid}`
      : null,
    recordUrl: artwork.source.record_url,
    itauUrl: getItauEncyclopediaSearchUrl(artwork.artist.name),
    imageUrl,
  };
}

export async function loadImageAsDataUrl(
  url: string
): Promise<LoadedPdfImage | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight, 1));
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#EFECE6";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve({ dataUrl, width, height, format: "JPEG" });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export function createArtworkPdfDocument(
  artwork: ArtworkRecord,
  imageData?: LoadedPdfImage | null
): jsPDF {
  const payload = buildArtworkPdfPayload(artwork);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // Editorial top strip
  doc.setFillColor(247, 246, 242);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setDrawColor(221, 216, 206);
  doc.line(margin, 24, pageWidth - margin, 24);

  doc.setFont("courier", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 19);
  doc.text("ACERVO BRASILIS · FICHA TÉCNICA", margin, 15);

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 106, 99);
  doc.text(payload.inventoryLine, pageWidth - margin, 15, { align: "right" });

  y = 31;

  // Artwork Plate
  const boxMaxW = contentWidth;
  const boxMaxH = 84;
  if (imageData && imageData.width > 0 && imageData.height > 0) {
    const ratio = imageData.width / imageData.height;
    let drawW = boxMaxW;
    let drawH = drawW / ratio;
    if (drawH > boxMaxH) {
      drawH = boxMaxH;
      drawW = drawH * ratio;
    }
    const drawX = margin + (boxMaxW - drawW) / 2;

    doc.setFillColor(239, 236, 230);
    doc.setDrawColor(221, 216, 206);
    doc.rect(margin, y, boxMaxW, drawH + 6, "FD");
    doc.addImage(imageData.dataUrl, imageData.format, drawX, y + 3, drawW, drawH);
    y += drawH + 9;
  } else {
    doc.setFillColor(239, 236, 230);
    doc.setDrawColor(221, 216, 206);
    doc.rect(margin, y, boxMaxW, 24, "FD");
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(110, 106, 99);
    doc.text(
      "Imagem referencial disponível no catálogo oficial da instituição.",
      pageWidth / 2,
      y + 13,
      { align: "center" }
    );
    y += 28;
  }

  // Rights notice under plate
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 106, 99);
  const rightsPrefix = payload.allowFullDisplay
    ? payload.rightsNotice
    : `[Miniatura referencial] ${payload.rightsNotice}`;
  const rightsLines = doc.splitTextToSize(rightsPrefix, contentWidth);
  doc.text(rightsLines, margin, y);
  y += rightsLines.length * 3.5 + 4;

  // Movement Kicker
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(139, 58, 30);
  const movementLines = doc.splitTextToSize(payload.movementsLabel, contentWidth);
  doc.text(movementLines, margin, y);
  y += movementLines.length * 3.8 + 2;

  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(17);
  doc.setTextColor(20, 20, 19);
  const titleLines = doc.splitTextToSize(payload.title, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6.5 + 1.5;

  // Artist & Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(74, 71, 66);
  const artistLines = doc.splitTextToSize(payload.artistLine, contentWidth);
  doc.text(artistLines, margin, y);
  y += artistLines.length * 4.5 + 4;

  // Divider
  doc.setDrawColor(221, 216, 206);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Visual Caption
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(110, 106, 99);
  doc.text("LEITURA VISUAL & ATMOSFERA", margin, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(45, 43, 40);
  const captionLines = doc.splitTextToSize(payload.caption, contentWidth);
  doc.text(captionLines, margin, y);
  y += captionLines.length * 4.2 + 2.5;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(110, 106, 99);
  doc.text(`Atmosfera: ${payload.moodLine}`, margin, y);
  y += 6;

  // Dominant Colors Palette
  if (payload.dominantColors.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(110, 106, 99);
    doc.text("PALETA CROMÁTICA DOMINANTE", margin, y);
    y += 3.5;

    const swatchW = 24;
    const swatchH = 6;
    const gap = 4;
    payload.dominantColors.forEach((hex, idx) => {
      const sx = margin + idx * (swatchW + gap);
      const [r, g, b] = hexToRgbTuple(hex);
      doc.setFillColor(r, g, b);
      doc.setDrawColor(200, 194, 182);
      doc.rect(sx, y, swatchW, swatchH, "FD");
      doc.setFont("courier", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(74, 71, 66);
      doc.text(hex.toUpperCase(), sx, y + swatchH + 3.5);
    });
    y += swatchH + 8;
  }

  // Ensure space for metadata + links
  if (y > pageHeight - 75) {
    doc.addPage();
    y = 20;
  }

  // Metadata Rows
  doc.setDrawColor(221, 216, 206);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4.5;

  const metaRows: Array<[string, string]> = [
    ["Técnica", payload.medium],
    ["Dimensões", payload.dimensions],
    [
      "Instituição",
      payload.institutionCity
        ? `${payload.institution} (${payload.institutionCity})`
        : payload.institution,
    ],
    ["Proveniência", payload.provenance],
    ["Direitos", payload.rightsTitle],
  ];

  for (const [label, value] of metaRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(110, 106, 99);
    doc.text(label, margin, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 19);
    const valLines = doc.splitTextToSize(value, contentWidth - 42);
    doc.text(valLines, pageWidth - margin, y, { align: "right" });
    y += Math.max(5.5, valLines.length * 4 + 2);
  }

  y += 2;

  // Reference Links Box (Museum Original + Wikidata + Itaú Cultural)
  const boxHeight =
    18 +
    (payload.wikidataItemUrl || payload.wikidataArtistUrl ? 5 : 0) +
    5;
  if (y + boxHeight > pageHeight - 16) {
    doc.addPage();
    y = 20;
  }

  doc.setFillColor(239, 236, 230);
  doc.setDrawColor(200, 194, 182);
  doc.rect(margin, y, contentWidth, boxHeight, "FD");
  let linkY = y + 5.5;

  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(139, 58, 30);
  doc.text("REFERÊNCIA NO ACERVO ORIGINAL & FONTES", margin + 4, linkY);
  linkY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 95);
  const displayUrl =
    payload.recordUrl.length > 82
      ? `${payload.recordUrl.slice(0, 79)}...`
      : payload.recordUrl;
  doc.textWithLink(`Acervo oficial: ${displayUrl}`, margin + 4, linkY, {
    url: payload.recordUrl,
  });
  linkY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.textWithLink("Enciclopédia Itaú Cultural (pesquisa do artista)", margin + 4, linkY, {
    url: payload.itauUrl,
  });
  linkY += 4.5;

  if (payload.wikidataItemUrl || payload.wikidataArtistUrl) {
    let wx = margin + 4;
    if (payload.wikidataItemUrl) {
      const label = `Wikidata Obra (${artwork.wikidata_qid})`;
      doc.textWithLink(label, wx, linkY, { url: payload.wikidataItemUrl });
      wx += doc.getTextWidth(label) + 6;
    }
    if (payload.wikidataArtistUrl) {
      const label = `Wikidata Artista (${artwork.artist.wikidata_qid})`;
      doc.textWithLink(label, wx, linkY, { url: payload.wikidataArtistUrl });
    }
  }

  // Footer
  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(110, 106, 99);
  doc.text(
    "Acervo Brasilis · Camada de descoberta semântica (Lei nº 9.610/98) · Documento gerado localmente",
    margin,
    pageHeight - 9
  );

  return doc;
}

export async function exportArtworkToPdf(
  artwork: ArtworkRecord
): Promise<string> {
  const payload = buildArtworkPdfPayload(artwork);
  const imageData = await loadImageAsDataUrl(payload.imageUrl);
  const doc = createArtworkPdfDocument(artwork, imageData);
  doc.save(payload.filename);
  return payload.filename;
}
