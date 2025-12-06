interface SummaryTableProps {
  summary: {
    upperTotal: number;
    componentTotal: number;
    materialTotal: number;
    packagingTotal: number;
    miscTotal: number;
    labourTotal: number;
    additionalCosts: number;
    profitMargin: number;
    profitAmount: number;
    tentativeCost: number;
  } | null;
}

const SummaryTable = ({ summary }: SummaryTableProps) => {
  if (!summary) return null;

  const rows = [
    ["Upper", summary.upperTotal],
    ["Component", summary.componentTotal],
    ["Material", summary.materialTotal],
    ["Packaging", summary.packagingTotal],
    ["Misc", summary.miscTotal],
    ["Labour", summary.labourTotal],
    ["Additional Costs", summary.additionalCosts],
    [`Profit (${summary.profitMargin || 0}%)`, summary.profitAmount],
    ["TENTATIVE COST", summary.tentativeCost],
  ];

  return (
    <div className="bg-white border rounded-xl p-4 md:p-6 shadow-sm">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Summary</h4>

      {rows.map(([label, value], idx) => (
        <div
          key={idx}
          className={`flex justify-between text-xs md:text-sm py-2 border-b border-gray-200 ${
            label === "TENTATIVE COST" ? "font-bold text-green-700" : ""
          }`}
        >
          <span>{label}</span>
          <span>Rs. {Number(value || 0).toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
};

export default SummaryTable;
