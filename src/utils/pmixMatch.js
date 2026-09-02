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

function descriptionsMatch(pmixDesc, catalogDesc) {
  const aWords = getSignificantWords(pmixDesc);
  const bWords = getSignificantWords(catalogDesc);
  if (aWords.length === 0 || bWords.length === 0) return false;

  // Containment: one description fully contains the other's significant words
  const aSet = new Set(aWords);
  const bSet = new Set(bWords);
  const shorter = aWords.length <= bWords.length ? aSet : bSet;
  const longer = aWords.length <= bWords.length ? bSet : aSet;
  let contained = 0;
  shorter.forEach(w => { if (longer.has(w)) contained++; });
  if (contained / shorter.size >= 0.8) return true;

  // Word overlap: at least 60% of the shorter description's significant words match
  return contained / shorter.size >= 0.6;
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