// hooks/useMasters.ts
import { useState, useCallback, useEffect } from "react";
import {
  MasterItem,
  projectService,
} from "../components/services/projectService";

export const useMasters = () => {
  const [companies, setCompanies] = useState<MasterItem[]>([]);
  const [brands, setBrands] = useState<MasterItem[]>([]);
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [types, setTypes] = useState<MasterItem[]>([]);
  const [countries, setCountries] = useState<MasterItem[]>([]);
  const [assignPersons, setAssignPersons] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all masters when hook is initialized
  useEffect(() => {
    loadAllMasters();
  }, []);

  // memoized: load everything once (stable reference)
  const loadAllMasters = useCallback(async () => {
    setLoading(true);
    try {
      const [comp, brd, typ, cnt, aps] = await Promise.all([
        projectService.getCompanies(),
        projectService.getBrands(),
        projectService.getTypes(),
        projectService.getCountries(),
        projectService.getAssignPersons(),
      ]);

      setCompanies(comp || []);
      setBrands(brd || []);
      setTypes(typ || []);
      setCountries(cnt || []);
      setAssignPersons(aps || []);
      setCategories([]); // Categories depend on company + brand
      console.log("All masters loaded:", {
        companies: comp?.length || 0,
        brands: brd?.length || 0,
        types: typ?.length || 0,
        countries: cnt?.length || 0,
        assignPersons: aps?.length || 0,
      });
    } catch (error) {
      console.error("Failed to load masters:", error);
      // Set empty arrays on error
      setCompanies([]);
      setBrands([]);
      setTypes([]);
      setCountries([]);
      setAssignPersons([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // memoized: load brands by company (stable reference)
  const loadBrandsByCompany = useCallback(async (companyId: string) => {
    try {
      if (!companyId) {
        setBrands([]);
        return;
      }

      console.log("Loading brands for company:", companyId);
      const brandList = await projectService.getBrands(companyId);
      console.log("Brands loaded:", brandList?.length || 0);
      setBrands(brandList || []);
    } catch (error) {
      console.error("Failed to load brands for company:", error);
      setBrands([]);
    }
  }, []);

  // memoized: load categories by company+brand (stable reference)
  const loadCategoriesByBrand = useCallback(
    async (companyId: string, brandId: string) => {
      try {
        if (!companyId || !brandId) {
          setCategories([]);
          return;
        }

        console.log(
          "Loading categories for company:",
          companyId,
          "brand:",
          brandId
        );
        const categoryList = await projectService.getCategories(
          companyId,
          brandId
        );
        console.log("Categories loaded:", categoryList?.length || 0);
        setCategories(categoryList || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategories([]);
      }
    },
    []
  );

  return {
    companies,
    brands,
    categories,
    types,
    countries,
    assignPersons,
    loading,
    loadAllMasters,
    loadBrandsByCompany,
    loadCategoriesByBrand,
    setCompanies,
    setBrands,
    setCategories,
    setTypes,
    setCountries,
    setAssignPersons,
  };
};
