import SequenceConfig from "../models/SequenceConfig.model.js";
import SequenceCode from "../models/SequenceCode.model.js";

function formatCode(pattern, counter, date = new Date()) {
  const yyyy = String(date.getFullYear());
  const yy = yyyy.slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const match = pattern.match(/\{seq(?::(\d+))?\}/);
  let code = pattern
    .replace(/\{YYYY\}/g, yyyy)
    .replace(/\{YY\}/g, yy)
    .replace(/\{MM\}/g, mm)
    .replace(/\{DD\}/g, dd);

  const width = match?.[1] ? Number(match[1]) : 0;
  const seqStr = width ? String(counter).padStart(width, "0") : String(counter);
  return code.replace(/\{seq(?::\d+)?\}/g, seqStr);
}

// open modal → reserve one code
export async function reserveCode(name = "PRJ") {
  // 0) block if already a spare exists
  const existing = await SequenceCode.findOne({ name, status: "reserved" });
  if (existing) return existing.toObject();

  // 1) load or create config
  let cfg = await SequenceConfig.findOne({ name });

  const listofPatterns = [
    "PRJ/{YY}-{MM}/{seq:4}",
    "VND/{YY}-{MM}/{seq:4}",
    "INV/{YY}-{MM}/{seq:4}",
    "ORD/{YY}-{MM}/{seq:4}",
  ];

  if (!cfg)
    cfg = await SequenceConfig.create({
      name,
      pattern: listofPatterns.includes(name) ? name : "GEN/{YYYY}/{MM}/{seq:5}",
      next: 1,
    });

  // 2) take pre-increment value
  const pre = await SequenceConfig.findOneAndUpdate(
    { _id: cfg._id },
    { $inc: { next: 1 } },
    { new: false }
  );
  const counter = pre.next;

  // 3) format code and save reservation
  const code = formatCode(cfg.pattern, counter);
  const doc = await SequenceCode.create({
    name: cfg.name,
    code,
    counter,
    status: "reserved",
  });
  return doc.toObject();
}

// submit → assign to this project
export async function assignReservedCode(sequenceId, projectId) {
  const seq = await SequenceCode.findOne({ _id: sequenceId });
  if (!seq) throw new Error("sequence not found");
  if (seq.status !== "reserved") throw new Error("sequence not reserved");

  seq.status = "assigned";
  seq.project = projectId;
  await seq.save();
  return seq.toObject();
}

// cancel/close modal → cancel reservation
export async function cancelReservedCode(sequenceId) {
  const seq = await SequenceCode.findOne({ _id: sequenceId });
  if (!seq) throw new Error("sequence not found");
  if (seq.status !== "reserved") throw new Error("cannot cancel non-reserved");
  seq.status = "cancelled";
  await seq.save();
  return seq.toObject();
}
