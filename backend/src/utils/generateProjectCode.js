import { Sequence } from "../models/sequence.model.js";

function getFiscalYearRange(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1..12
  const start = m >= 4 ? y : y - 1;
  const end   = start + 1;
  const yy = (n) => String(n).slice(-2);
  return `${yy(start)}-${yy(end)}`; // "25-26"
}

export async function generateProjectCode(session = null, now = new Date()) {
  const fy  = getFiscalYearRange(now);        // "25-26"
  const mm  = String(now.getMonth() + 1).padStart(2, "0"); // "01".."12"
  const key = `RND-${fy}-${mm}`;              // counter key per FY+month

  // Atomic increment (safe under load)
  const seqDoc = await Sequence.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { new: true, upsert: true, session }
  );

  const num = String(seqDoc.value).padStart(3, "0");
  return `RND/${fy}/${mm}/${num}`;
}
