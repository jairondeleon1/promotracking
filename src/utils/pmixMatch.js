// Shared PMix-to-Catalog matching logic
// 1) Tries ID match (DIN / manufacturer MIN / UPC) with normalization
// 2) Falls back to description (name) matching via word overlap

function normalizeId(str) {
  return String(str || "").replace(/\D/g, "");
}

function idsMatch(a, b) {
  const na = normalizeId(a);
  const nb = normalizeId(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const aStripped = na.replace(/^0+/, "");
  const bStripped = nb.replace(/^0+/, "");
  return aStripped && bStripped && aStripped === bStripped;
}

const STOP_WORDS = new Set([
  "with", "each", "case", "pack", "ct", "ctn", "oz", "lb", "lbs",
  "and", "the", "for", "box", "ea", "size", "fz", "gr", "gm",
]);

function normalizeDesc(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function getSignificantWords(desc) {
  return normalizeDesc(desc)
    .split(" ")
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

// Split significant words into "variant" words (no digits — the actual
// product identity, e.g. "tropicana", "zero", "egg") and "pack" words
// (contain digits — sizes/counts, e.g. "5lb", "12ct", "2"). Pack words are
// ignored when comparing so pack-size differences don't block a match.
function splitVariantWords(words) {
  const variant = new Set();
  words.forEach(w => {
    if (/\d/.test(w)) return; // pack-size token, ignore
    variant.add(w);
  });
  return variant;
}

function descriptionsMatch(pmixDesc, catalogDesc) {
  const aNorm = normalizeDesc(pmixDesc);
  const bNorm = normalizeDesc(catalogDesc);
  if (!aNorm || !bNorm) return false;

  // Exact normalized match is always safe
  if (aNorm === bNorm) return true;

  const aVariant = splitVariantWords(getSignificantWords(pmixDesc));
  const bVariant = splitVariantWords(getSignificantWords(catalogDesc));
  if (aVariant.size === 0 || bVariant.size === 0) return false;

  // Require the variant (non-pack-size) word sets to be identical.
  // Extra variant words (e.g. "zero", "sugar", "hard", "boiled") on either
  // side mean a different product, so they must not match.
  if (aVariant.size !== bVariant.size) return false;
  for (const w of aVariant) if (!bVariant.has(w)) return false;
  return true;
}

export function matchItemToCatalog(item, catalogItems) {
  const itemNum = (item.item_number || "").trim();
  const upc = (item.upc || "").trim();
  const desc = item.item_description || "";

  // 1) ID match
  if (itemNum || upc) {
    const hit = catalogItems.find(c => {
      if (itemNum && (idsMatch(itemNum, c.din) || idsMatch(itemNum, c.manufacturer_min))) return true;
      if (upc && idsMatch(upc, c.upc)) return true;
      return false;
    });
    if (hit) {
      return {
        matched_promotion: hit.promotion_name || hit.promotion_category || "",
        matched_category: hit.promotion_category || "",
      };
    }
  }

  // 2) Description (name) match
  if (desc) {
    const hit = catalogItems.find(c => descriptionsMatch(desc, c.description));
    if (hit) {
      return {
        matched_promotion: hit.promotion_name || hit.promotion_category || "",
        matched_category: hit.promotion_category || "",
      };
    }
  }

  return { matched_promotion: "", matched_category: "" };
}

export function reMatchRecords(records, catalogItems) {
  return records.map(r => {
    const m = matchItemToCatalog(r, catalogItems);
    return {
      ...r,
      matched_promotion: m.matched_promotion || r.matched_promotion || "",
      matched_category: m.matched_category || r.matched_category || "",
    };
  });
}