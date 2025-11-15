// Project workflow statuses (canonical, snake_case)
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

const statusAliases = [
  { canon: "prototype",  aliases: ["proto"] },
  { canon: "red_seal",   aliases: ["red seal", "redseal", "rs"] },
  { canon: "green_seal", aliases: ["green seal", "greenseal", "gs"] },
  { canon: "po_pending", aliases: ["po pending", "popending", "po-pending"] },
  { canon: "po_approved",aliases: ["po approved", "poapproved", "po-appr", "po appr", "approved po"] },
  { canon: "hold",       aliases: ["on hold", "onhold", "paused"] },
  { canon: "cancelled",  aliases: ["canceled", "cancel", "cncl"] },
  { canon: "completed",  aliases: ["done", "closed", "finished"] },
];

const statusSet = new Set(Object.values(PROJECT_STATUS));

export function normalizeProjectStatus(input) {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  const snake = s.replace(/\s+/g, "_");
  if (statusSet.has(snake)) return snake;

  const collapsed = s.replace(/\s+/g, "");
  for (const row of statusAliases) {
    if (row.canon === snake) return row.canon;
    if (row.aliases.some(a => a === s || a.replace(/\s+/g, "") === collapsed)) {
      return row.canon;
    }
  }
  return null;
}

export function requireValidProjectStatus(input) {
  const norm = normalizeProjectStatus(input);
  if (!norm) {
    const allowed = Array.from(statusSet).join(", ");
    const err = new Error(`Invalid status "${input}". Allowed: ${allowed}`);
    err.status = 400;
    throw err;
  }
  return norm;
}

/** -------- Client approval normalization -------- **/

// canonical client approval
export const CLIENT_APPROVAL = {
  OK:          "ok",
  UPDATE_REQ:  "update_req",
  PENDING:     "pending",
  REVIEW_REQ:  "review_req",
  REJECTED:    "rejected",
};

const approvalAliases = [
  { canon: "ok",          aliases: ["approved", "approve", "yes"] },
  { canon: "update_req",  aliases: ["update required", "update req", "need update"] },
  { canon: "pending",     aliases: ["pending review", "awaiting", "wait"] },
  { canon: "review_req",  aliases: ["review required", "review req"] },
  { canon: "rejected",    aliases: ["reject", "no"] },
];

const approvalSet = new Set(Object.values(CLIENT_APPROVAL));

export function normalizeClientApproval(input) {
  if (!input) return null;
  const s = String(input).trim().toLowerCase();
  const snake = s.replace(/\s+/g, "_");
  if (approvalSet.has(snake)) return snake;

  const collapsed = s.replace(/\s+/g, "");
  for (const row of approvalAliases) {
    if (row.canon === snake) return row.canon;
    if (row.aliases.some(a => a === s || a.replace(/\s+/g, "") === collapsed)) {
      return row.canon;
    }
  }
  return null;
}

export function requireValidClientApproval(input) {
  const norm = normalizeClientApproval(input);
  if (!norm) {
    const allowed = Array.from(approvalSet).join(", ");
    const err = new Error(`Invalid client approval "${input}". Allowed: ${allowed}`);
    err.status = 400;
    throw err;
  }
  return norm;
}
