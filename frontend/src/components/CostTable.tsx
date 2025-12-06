export const getTableColor = (tableName: string) => {
  const tableColors: Record<
    string,
    { bg: string; border: string; text: string }
  > = {
    "Upper Cost": {
      bg: "bg-blue-600",
      border: "border-blue-200",
      text: "text-blue-600",
    },
    "Component Cost": {
      bg: "bg-indigo-600",
      border: "border-indigo-200",
      text: "text-indigo-600",
    },
    "Material Cost": {
      bg: "bg-amber-600",
      border: "border-amber-200",
      text: "text-amber-600",
    },
    "Packaging Cost": {
      bg: "bg-emerald-600",
      border: "border-emerald-200",
      text: "text-emerald-600",
    },
    "Miscellaneous Cost": {
      bg: "bg-rose-600",
      border: "border-rose-200",
      text: "text-rose-600",
    },
    "Labour Cost": {
      bg: "bg-sky-600",
      border: "border-sky-200",
      text: "text-sky-600",
    },
  };

  return (
    tableColors[tableName] || {
      bg: "bg-gray-600",
      border: "border-gray-200",
      text: "text-gray-600",
    }
  );
};

interface CostTableRow {
  title: string;
  rows: {
    item: string;
    description: string;
    consumption: string;
    cost: number;
  }[];
}

const CostTable = ({ title, rows }: CostTableRow) => {
  if (!rows || rows.length === 0) return null;

  const colors = getTableColor(title);

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
        {title}
      </h4>

      <div
        className={`${colors.bg} text-white grid grid-cols-4 font-semibold text-xs md:text-sm p-3 rounded`}
      >
        <div>Item</div>
        <div>Description</div>
        <div>Consumption</div>
        <div className="text-right">Cost (Rs.)</div>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`grid grid-cols-4 text-xs md:text-sm p-3 border-b ${
              colors.border
            } hover:${colors.border.replace("200", "50")} transition-colors`}
          >
            <div className="font-medium">{r.item}</div>
            <div>{r.description}</div>
            <div>{r.consumption}</div>
            <div className="text-right font-medium">
              {Number(r.cost).toLocaleString("en-IN")}
            </div>
          </div>
        ))}
      </div>

      {rows.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>Total {title}:</span>
            <span className={`${colors.text} font-bold`}>
              Rs.{" "}
              {rows
                .reduce((sum, row) => sum + (Number(row.cost) || 0), 0)
                .toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostTable;
