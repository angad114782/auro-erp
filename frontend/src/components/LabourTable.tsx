import { getTableColor } from "./CostTable";

interface LabourTableProps {
  labour: {
    items: {
      name: string;
      cost: number;
    }[];
    directTotal?: number;
  } | null;
}
const LabourTable = ({ labour }: LabourTableProps) => {
  if (!labour || labour.items.length === 0) return null;

  const colors = getTableColor("Labour Cost");

  return (
    <div
      className={`bg-white border-2 ${colors.border} rounded-xl p-4 md:p-6 shadow-sm`}
    >
      <h4
        className={`text-lg font-semibold ${colors.text.replace(
          "600",
          "900"
        )} mb-4`}
      >
        Labour Cost
      </h4>

      <div
        className={`${colors.bg} text-white grid grid-cols-2 font-semibold text-xs md:text-sm p-3 rounded`}
      >
        <div>Labour Item</div>
        <div className="text-right">Cost (Rs.)</div>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {labour.items.map((l, i) => (
          <div
            key={i}
            className={`grid grid-cols-2 text-xs md:text-sm p-3 border-b ${
              colors.border
            } hover:${colors.border.replace("200", "50")} transition-colors`}
          >
            <div>{l.name}</div>
            <div className="text-right font-medium">
              {Number(l.cost).toLocaleString("en-IN")}
            </div>
          </div>
        ))}
      </div>

      {labour.items.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>Direct Labour Total:</span>
            <span className={`${colors.text} font-bold`}>
              Rs.{" "}
              {labour.directTotal?.toLocaleString("en-IN") ||
                labour.items
                  .reduce((sum, item) => sum + (Number(item.cost) || 0), 0)
                  .toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabourTable;
