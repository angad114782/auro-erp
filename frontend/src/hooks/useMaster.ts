// hooks/useMasters.ts
import { useState, useCallback } from "react";
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

      setCompanies(comp);
      setBrands(brd);
      setTypes(typ);
      setCountries(cnt);
      setAssignPersons(aps);
      setCategories([]); // Categories depend on company + brand
    } catch (error) {
      console.error("Failed to load masters:", error);
    } finally {
      setLoading(false);
    }
  }, []); // no deps -> stable

  // memoized: load brands by company (stable reference)
  const loadBrandsByCompany = useCallback(async (companyId: string) => {
    try {
      const brandList = await projectService.getBrands(companyId);
      setBrands(brandList);
    } catch (error) {
      console.error("Failed to load brands for company:", error);
      setBrands([]);
    }
  }, []);

  // memoized: load categories by company+brand (stable reference)
  const loadCategoriesByBrand = useCallback(
    async (companyId: string, brandId: string) => {
      try {
        const categoryList = await projectService.getCategories(
          companyId,
          brandId
        );
        setCategories(categoryList);
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
