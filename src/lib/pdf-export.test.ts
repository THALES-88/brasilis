import test from "node:test";
import assert from "node:assert/strict";
import { ARTWORKS_CATALOG } from "../data/catalog";
import {
  buildArtworkPdfPayload,
  buildPdfFilename,
  createArtworkPdfDocument,
  hexToRgbTuple,
  toPdfSafeText,
} from "./pdf-export";

test("buildPdfFilename and toPdfSafeText produce clean ASCII/Latin-1 safe strings", () => {
  const tarsila = ARTWORKS_CATALOG.find((a) => a.id === "br-modernismo-004")!;
  assert.equal(
    buildPdfFilename(tarsila),
    "ficha-tecnica-paisagem-com-mandacaru-e-casario-paulista.pdf"
  );
  assert.equal(
    toPdfSafeText("Obra — São Paulo “Modernismo”…"),
    'Obra - São Paulo "Modernismo"...'
  );
  assert.deepEqual(hexToRgbTuple("#8B3A1E"), [139, 58, 30]);
});

test("buildArtworkPdfPayload enforces rights-safe image selection and includes museum reference URL", () => {
  const publicDomainWork = ARTWORKS_CATALOG.find(
    (a) => a.id === "br-academismo-002"
  )!;
  const restrictedWork = ARTWORKS_CATALOG.find(
    (a) => a.id === "br-modernismo-004"
  )!;

  const pdPayload = buildArtworkPdfPayload(publicDomainWork);
  assert.equal(pdPayload.allowFullDisplay, true);
  assert.equal(pdPayload.recordUrl, "https://mnba.gov.br/");
  assert.equal(pdPayload.wikidataArtistUrl, "https://www.wikidata.org/wiki/Q1401969");

  const resPayload = buildArtworkPdfPayload(restrictedWork);
  assert.equal(resPayload.allowFullDisplay, false);
  assert.equal(resPayload.imageUrl, restrictedWork.media.thumb_url);
  assert.equal(resPayload.recordUrl, "https://masp.org.br/acervo");
  assert.equal(resPayload.wikidataArtistUrl, "https://www.wikidata.org/wiki/Q466627");
});

test("createArtworkPdfDocument generates valid PDF output with embedded metadata, image, and museum link", () => {
  const sample = ARTWORKS_CATALOG.find((a) => a.id === "br-academismo-002")!;
  // 1x1 valid PNG data URL to exercise image embedding path in jsPDF
  const tinyPngDataUrl =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  const doc = createArtworkPdfDocument(sample, {
    dataUrl: tinyPngDataUrl,
    width: 100,
    height: 75,
    format: "PNG",
  });

  const pdfText = doc.output();
  assert.ok(pdfText.startsWith("%PDF-"), "Expected valid PDF header");
  assert.ok(pdfText.includes("mnba.gov.br"), "Expected museum reference URL in PDF");
  assert.ok(pdfText.includes("Castagneto"), "Expected artist name in PDF");
  assert.ok(pdfText.includes("#C89B54"), "Expected dominant color HEX in PDF");

  // Also ensure fallback when imageData is null works cleanly
  const docNoImg = createArtworkPdfDocument(sample, null);
  assert.ok(docNoImg.output().startsWith("%PDF-"));
});
