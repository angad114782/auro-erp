import mongoose from "mongoose";

const SequenceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

export const Sequence = mongoose.model("Sequence", SequenceSchema);

export async function getNextSequenceValue(sequenceName) {
  try {
    const sequence = await Sequence.findByIdAndUpdate(
      { _id: sequenceName },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    return sequence.sequence_value;
  } catch (error) {
    console.error("Error in getNextSequenceValue:", error);
    throw error;
  }
}

export async function getCurrentSequenceValue(sequenceName) {
  try {
    const sequence = await Sequence.findOne({ _id: sequenceName });
    return sequence ? sequence.sequence_value + 1 : 1;
  } catch (error) {
    console.error("Error in getCurrentSequenceValue:", error);
    return 1;
  }
}

export async function generateItemCode() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");

  const sequenceNumber = await getNextSequenceValue("inventoryItem");
  const paddedSequence = sequenceNumber.toString().padStart(4, "0");

  return `INV/${year}/${month}${day}/${paddedSequence}`;
}

export async function getReservedCode() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    const currentSequence = await getCurrentSequenceValue("inventoryItem");
    const paddedSequence = currentSequence.toString().padStart(4, "0");

    return `INV/${year}/${month}${day}/${paddedSequence}`;
  } catch (error) {
    console.error("Error generating reserved code:", error);
    throw error;
  }
}
