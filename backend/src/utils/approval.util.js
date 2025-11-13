// utils/approval.util.js
export const CLIENT_APPROVAL = {
  PENDING:  "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const aliasTable = [
  { canon: "pending",  aliases: ["awaiting", "in review", "under review"] },
  { canon: "approved", aliases: ["approve", "ok", "accepted", "client ok", "client approved"] },
  { canon: "rejected", aliases: ["declined", "not ok", "disapproved"] },
];

const canonSet = new Set(Object.values(CLIENT_APPROVAL));

export function normalizeClientApproval(input) {
  if (!input) return null;
  const s = String(input).trim().toLowerCase().replace(/\s+/g, " ");
  if (canonSet.has(s)) return s;
  for (const row of aliasTable) {
    if (row.canon === s || row.aliases.includes(s)) return row.canon;
    const collapsed = s.replace(/\s+/g, "");
    if (row.aliases.some(a => a.replace(/\s+/g, "") === collapsed)) return row.canon;
  }
  return null;
}

export function requireValidClientApproval(input) {
  const norm = normalizeClientApproval(input);
  if (!norm) {
    const allowed = Array.from(canonSet).join(", ");
    const err = new Error(`Invalid client approval "${input}". Allowed: ${allowed}. Aliases like "Approved", "Rejected" are accepted.`);
    err.status = 400;
    throw err;
  }
  return norm;
}
