// Shared PMix-to-Catalog matching logic
// Normalizes item numbers / UPCs so formatting differences don't break matches.

function normalizeId(str) {
  return String(str || "").replace(/\D/g, "");
}

function idsMatch(a, b) {
  const na = normalizeId(a);
  const nb = normalizeId(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Try without leading zeros (e.g. "04201285" vs "4201285")
  const aStripped = na.replace(/^0+/, "");
  const bStripped = nb.replace(/^0+/, "");
  return aStripped && bStripped && aStripped === bStripped;
}

export function matchItemToCatalog(item, catalogItems) {
  const itemNum = (item.item_number || "").trim();
  const upc = (item.upc || "").trim();

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