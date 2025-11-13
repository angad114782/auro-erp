// src/utils/status.util.js
export const PROJECT_STATUS = {
  PROTOTYPE:   "prototype",
  RED_SEAL:    "red_seal",
  GREEN_SEAL:  "green_seal",
  PO_PENDING:  "po_pending",
  PO_APPROVED: "po_approved",
  HOLD:        "hold",
  CANCELLED:   "cancelled",
  COMPLETED:   "completed",
};

const aliasTable = [
  { canon: "prototype",  aliases: ["proto"] },
  { canon: "red_seal",   aliases: ["red seal", "redseal", "rs"] },
  { canon: "green_seal", aliases: ["green seal", "greenseal", "gs"] },
  { canon: "po_pending", aliases: ["po pending", "popending", "po-pending"] },
  { canon: "po_approved",aliases: ["po approved", "poapproved", "po-appr", "po appr", "approved po"] },
  { canon: "hold",       aliases: ["on hold", "onhold", "paused"] },
  { canon: "cancelled",  aliases: ["canceled", "cancel", "cncl"] },
  { canon: "completed",  aliases: ["done", "closed", "finished"] },
];

const canonSet = new Set(Object.values(PROJECT_STATUS));

export function normalizeProjectStatus(input) {
  if (!input) return null;
  const s = String(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[_-]+/g, " ");

  if (canonSet.has(s.replace(" ", "_"))) return s.replace(" ", "_");

  for (const row of aliasTable) {
    if (row.canon === s || row.aliases.includes(s)) return row.canon;
    const collapsed = s.replace(/\s+/g, "");
    if (row.aliases.some(a => a.replace(/\s+/g, "") === collapsed)) return row.canon;
  }
  return null;
}

export function requireValidProjectStatus(input) {
  const norm = normalizeProjectStatus(input);
  if (!norm) {
    const allowed = Array.from(canonSet).join(", ");
    const err = new Error(
      `Invalid status "${input}". Allowed: ${allowed}. Aliases like "Red Seal", "PO Approved" are accepted.`
    );
    err.status = 400;
    throw err;
  }
  return norm;
}
