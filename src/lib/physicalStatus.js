/**
 * Physical release status — turns digital discovery into an ownership lifecycle.
 * Status ladder used on PlanetMP3 release pages / Club Copy bridges.
 */

export const PHYSICAL_STATUSES = [
  { id: "digital", label: "Digital", blurb: "Listen now" },
  { id: "announced", label: "Announced", blurb: "Physical edition coming" },
  { id: "preorder", label: "Pre-order", blurb: "Reserve your copy" },
  { id: "pressing", label: "Pressing", blurb: "On the press" },
  { id: "shipping", label: "Shipping", blurb: "On the way" },
  { id: "soldout", label: "Sold out", blurb: "Edition gone" },
  { id: "archive", label: "Archive", blurb: "In the archive" },
];

const STATUS_INDEX = new Map(PHYSICAL_STATUSES.map((s, i) => [s.id, i]));

export function normalizePhysicalStatus(value) {
  if (value && typeof value === "object" && value.id) {
    return PHYSICAL_STATUSES.find((s) => s.id === value.id) || PHYSICAL_STATUSES[0];
  }
  const id = String(value || "digital").toLowerCase().replace(/\s+/g, "");
  const aliases = {
    digital: "digital",
    announced: "announced",
    clubcopyannounced: "announced",
    preorder: "preorder",
    "pre-order": "preorder",
    pressing: "pressing",
    shipping: "shipping",
    shipped: "shipping",
    soldout: "soldout",
    "sold-out": "soldout",
    archive: "archive",
    archived: "archive",
  };
  const key = aliases[id] || "digital";
  return PHYSICAL_STATUSES.find((s) => s.id === key) || PHYSICAL_STATUSES[0];
}

/**
 * Resolve physical status from a track or album-like object.
 * Accepts explicit `physicalStatus` / `clubCopyStatus`, else infers.
 */
export function physicalStatusFor(release = {}) {
  if (release.physicalStatus || release.clubCopyStatus) {
    return normalizePhysicalStatus(release.physicalStatus || release.clubCopyStatus);
  }
  if (release.clubCopyId || release.catalogNumber || release.physicalEdition) {
    if (release.soldOut || release.remaining === 0) {
      return normalizePhysicalStatus("soldout");
    }
    if (release.preorder) return normalizePhysicalStatus("preorder");
    return normalizePhysicalStatus("announced");
  }
  return normalizePhysicalStatus("digital");
}

export function physicalStatusIndex(statusId) {
  return STATUS_INDEX.get(normalizePhysicalStatus(statusId).id) ?? 0;
}

export function canBuyPhysical(status) {
  const id = normalizePhysicalStatus(status).id;
  return id === "preorder" || id === "announced" || id === "pressing" || id === "shipping";
}

/** Member price helper — Club editions discount vs retail. */
export function memberPrice(retail, { member = false, memberRetail = null } = {}) {
  const r = Number(retail);
  if (!Number.isFinite(r)) return null;
  if (!member) return Math.round(r * 100) / 100;
  if (memberRetail != null && Number.isFinite(Number(memberRetail))) {
    return Math.round(Number(memberRetail) * 100) / 100;
  }
  // Default club edition: ~20% off retail display
  return Math.round(r * 0.8 * 100) / 100;
}
