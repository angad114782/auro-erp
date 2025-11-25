// hooks/useCostManagement.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  projectService,
  CostItem,
  LabourCost,
  CostSummary,
} from "../components/services/projectService";

export const useCostManagement = (projectId?: string) => {
  const [costRows, setCostRows] = useState<{
    upper: CostItem[];
    component: CostItem[];
    material: CostItem[];
    packaging: CostItem[];
    miscellaneous: CostItem[];
  }>({
    upper: [],
    component: [],
    material: [],
    packaging: [],
    miscellaneous: [],
  });

  const [labourCost, setLabourCost] = useState<LabourCost>({
    directTotal: 0,
    items: [],
  });

  const [costSummary, setCostSummary] = useState<CostSummary>({
    additionalCosts: 0,
    profitMargin: 25,
    remarks: "",
    upperTotal: 0,
    componentTotal: 0,
    materialTotal: 0,
    packagingTotal: 0,
    miscTotal: 0,
    labourTotal: 0,
    totalAllCosts: 0,
    profitAmount: 0,
    tentativeCost: 0,
    brandFinalCost: 0,
    status: "draft",
  });

  const [loading, setLoading] = useState(false);

  // Load all cost data
  const loadAllCostData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // Load cost summary
      const summaryData = await projectService.getCostSummary(projectId);
      if (summaryData) {
        setCostSummary({
          additionalCosts: Number(summaryData.additionalCosts) || 0,
          profitMargin: Number(summaryData.profitMargin) || 25,
          remarks: summaryData.remarks || "",
          upperTotal: Number(summaryData.upperTotal) || 0,
          componentTotal: Number(summaryData.componentTotal) || 0,
          materialTotal: Number(summaryData.materialTotal) || 0,
          packagingTotal: Number(summaryData.packagingTotal) || 0,
          miscTotal: Number(summaryData.miscTotal) || 0,
          labourTotal: Number(summaryData.labourTotal) || 0,
          totalAllCosts: Number(summaryData.totalAllCosts) || 0,
          profitAmount: Number(summaryData.profitAmount) || 0,
          tentativeCost: Number(summaryData.tentativeCost) || 0,
          brandFinalCost: Number(summaryData.brandFinalCost) || 0,
          status: summaryData.status || "draft",
        });
      }

      // Load cost items for all categories
      const categories = [
        "upper",
        "component",
        "material",
        "packaging",
        "miscellaneous",
      ];
      const rowPromises = categories.map((category) =>
        projectService.getCostItems(projectId, category)
      );
      const rowResults = await Promise.all(rowPromises);

      setCostRows({
        upper: rowResults[0].map((item) => ({
          _id: item._id,
          item: item.item || "",
          description: item.description || "",
          consumption: item.consumption || "",
          cost: Number(item.cost) || 0,
          department: item.department || "",
        })),
        component: rowResults[1].map((item) => ({
          _id: item._id,
          item: item.item || "",
          description: item.description || "",
          consumption: item.consumption || "",
          cost: Number(item.cost) || 0,
          department: item.department || "",
        })),
        material: rowResults[2].map((item) => ({
          _id: item._id,
          item: item.item || "",
          description: item.description || "",
          consumption: item.consumption || "",
          cost: Number(item.cost) || 0,
        })),
        packaging: rowResults[3].map((item) => ({
          _id: item._id,
          item: item.item || "",
          description: item.description || "",
          consumption: item.consumption || "",
          cost: Number(item.cost) || 0,
        })),
        miscellaneous: rowResults[4].map((item) => ({
          _id: item._id,
          item: item.item || "",
          description: item.description || "",
          consumption: item.consumption || "",
          cost: Number(item.cost) || 0,
        })),
      });

      // Load labour cost
      const labourData = await projectService.getLabourCost(projectId);
      if (labourData) {
        setLabourCost({
          directTotal: Number(labourData.directTotal) || 0,
          items: Array.isArray(labourData.items)
            ? labourData.items.map((item: any) => ({
                _id: item._id,
                name: item.name || "",
                cost: Number(item.cost) || 0,
              }))
            : [],
        });
      }
    } catch (error) {
      console.error("Failed to load cost data:", error);
      toast.error("Failed to load cost data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Update cost item
  const updateItemCost = useCallback(
    async (itemId: string, cost: number) => {
      if (!projectId) return;

      try {
        let category: string | null = null;
        for (const [cat, items] of Object.entries(costRows)) {
          if (items.find((item) => item._id === itemId)) {
            category = cat;
            break;
          }
        }

        if (!category) return;

        await projectService.updateCostItem(projectId, category, itemId, {
          cost,
        });

        setCostRows((prev) => ({
          ...prev,
          [category as string]: prev[category as keyof typeof prev].map(
            (item) => (item._id === itemId ? { ...item, cost } : item)
          ),
        }));

        await loadAllCostData();
      } catch (error) {
        console.error("Failed to update item cost:", error);
        toast.error("Failed to update item cost");
      }
    },
    [projectId, costRows, loadAllCostData]
  );

  // Add cost item
  const addCostItem = useCallback(
    async (category: string, data: Partial<CostItem>) => {
      if (!projectId) return;

      try {
        const newItem = await projectService.addCostItem(
          projectId,
          category,
          data
        );

        setCostRows((prev) => ({
          ...prev,
          [category]: [
            ...prev[category as keyof typeof prev],
            {
              _id: newItem._id,
              item: newItem.item || "",
              description: newItem.description || "",
              consumption: newItem.consumption || "",
              cost: Number(newItem.cost) || 0,
              department: newItem.department || "",
            },
          ],
        }));

        await loadAllCostData();
        toast.success(`New ${category} item added successfully!`);
      } catch (error) {
        console.error("Failed to add item:", error);
        toast.error("Failed to add item");
      }
    },
    [projectId, loadAllCostData]
  );

  // Delete cost item
  const deleteCostItem = useCallback(
    async (itemId: string) => {
      if (!projectId) return;

      try {
        let category: string | null = null;
        for (const [cat, items] of Object.entries(costRows)) {
          if (items.find((item) => item._id === itemId)) {
            category = cat;
            break;
          }
        }

        if (!category) return;

        await projectService.deleteCostItem(projectId, category, itemId);

        setCostRows((prev) => ({
          ...prev,
          [category as string]: prev[category as keyof typeof prev].filter(
            (item) => item._id !== itemId
          ),
        }));

        await loadAllCostData();
        toast.success("Item deleted successfully");
      } catch (error) {
        console.error("Failed to delete item:", error);
        toast.error("Failed to delete item");
      }
    },
    [projectId, costRows, loadAllCostData]
  );

  // Update labour cost
  const updateLabourCost = useCallback(
    async (directTotal: number) => {
      if (!projectId) return;

      try {
        await projectService.updateLabourCost(projectId, { directTotal });
        setLabourCost((prev) => ({ ...prev, directTotal }));
        await loadAllCostData();
      } catch (error) {
        console.error("Failed to update labour cost:", error);
        toast.error("Failed to update labour cost");
      }
    },
    [projectId, loadAllCostData]
  );

  // Update brand final cost
  const updateBrandFinalCost = useCallback((value: number) => {
    setCostSummary((prev) => ({ ...prev, brandFinalCost: value }));
  }, []);

  return {
    costRows,
    labourCost,
    costSummary,
    loading,
    loadAllCostData,
    updateItemCost,
    addCostItem,
    deleteCostItem,
    updateLabourCost,
    updateBrandFinalCost,
  };
};
