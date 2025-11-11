import React, { use, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Target,
  Calculator,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import api from "../lib/api";
import { useERPStore } from "../lib/data-store";

export type Id = string;

// ---- minimal view models (mapped from backend) ----
export type CompanyVM = { id: Id; companyName: string };
export type BrandVM = {
  id: Id;
  brandName: string;
  companyId: Id;
  status: "Active" | "Inactive";
};
export type CategoryVM = {
  id: Id;
  categoryName: string;
  companyId: Id;
  brandId: Id;
};
export type TypeVM = {
  id: Id;
  typeName: string;
  usageArea: "Sole" | "Upper" | "Both";
};
export type CountryVM = { id: Id; countryName: string; isoCode?: string };

// ---- local form shape (kept same as yours) ----
interface NewProject {
  color: string;
  artName?: string;
  productCode?: string;
  company: string;
  brand: string;
  collection: string;
  category: string;
  productType: string;
  country: string;
  type: string;
  targetCost: string;
  retailPrice: string;
  upperMaterial: string;
  soleType: string;
  heelHeight: string;
  description: string;
  priority: string;
  taskInc: string;
  assignPerson: string;
  targetDate: string; // red seal target date
  requirements: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

// ---------- helpers ----------
export const mapCompany = (db: any): CompanyVM => ({
  id: db._id,
  companyName: db.name,
});

export const mapBrand = (db: any): BrandVM => ({
  id: db._id,
  brandName: db.name,
  companyId: typeof db.company === "object" ? db.company._id : db.company,
  status: db.isActive ? "Active" : "Inactive",
});

export const mapCategory = (db: any): CategoryVM => ({
  id: db._id,
  categoryName: db.name,
  companyId: typeof db.company === "object" ? db.company._id : db.company,
  brandId: typeof db.brand === "object" ? db.brand._id : db.brand,
});

export const mapType = (db: any): TypeVM => ({
  id: db._id,
  typeName: db.name,
  usageArea: (db.usageArea ?? "Both") as "Sole" | "Upper" | "Both",
});

export const mapCountry = (db: any): CountryVM => ({
  id: db._id,
  countryName: db.name,
});

const dataURLtoFile = (dataUrl: string, filename: string) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
};

export function CreateProjectDialog({
  open,
  onClose,
  onCreated,
}: CreateProjectDialogProps) {
  // masters (fetched from backend)
  const [companies, setCompanies] = useState<CompanyVM[]>([]);
  const [brands, setBrands] = useState<BrandVM[]>([]);
  const [categories, setCategories] = useState<CategoryVM[]>([]);
  const [types, setTypes] = useState<TypeVM[]>([]);
  const [countries, setCountries] = useState<CountryVM[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(false);

  console.log(companies);
  console.log(brands);
  console.log(categories);
  console.log(types);
  console.log(countries);

  // form state
  const [newProject, setNewProject] = useState<NewProject>({
    color: "",
    artName: "",
    company: "",
    brand: "",
    collection: "",
    category: "",
    productType: "",
    country: "",
    type: "",
    targetCost: "",
    retailPrice: "",
    upperMaterial: "",
    soleType: "",
    heelHeight: "",
    description: "",
    priority: "",
    taskInc: "",
    assignPerson: "",
    targetDate: "",
    requirements: "",
  });

  // popovers
  const [companyOpen, setCompanyOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [taskIncOpen, setTaskIncOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  // images
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [dynamicImages, setDynamicImages] = useState<string[]>([]);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const additionalInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const dynamicInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // inline new master names
  const [addingNewCompany, setAddingNewCompany] = useState(false);
  const [addingNewType, setAddingNewType] = useState(false);
  const [addingNewBrand, setAddingNewBrand] = useState(false);
  const [addingNewCategory, setAddingNewCategory] = useState(false);
  const [addingNewCountry, setAddingNewCountry] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCountryName, setNewCountryName] = useState("");

  type AssignPersonVM = { id: string; name: string };

  const [assignPersons, setAssignPersons] = useState<AssignPersonVM[]>([]);
  const [assignPersonOpen, setAssignPersonOpen] = useState(false);
  const [addingNewAssignPerson, setAddingNewAssignPerson] = useState(false);
  const [newAssignPersonName, setNewAssignPersonName] = useState("");

  // ---- derived filters ----
  const filteredBrands = useMemo(
    () =>
      newProject.company
        ? brands.filter((b) => b.companyId === newProject.company)
        : [],
    [brands, newProject.company]
  );

  const filteredCategories = useMemo(
    () =>
      newProject.company && newProject.brand
        ? categories.filter(
            (c) =>
              c.companyId === newProject.company &&
              c.brandId === newProject.brand
          )
        : [],
    [categories, newProject.company, newProject.brand]
  );

  // ---- load masters when dialog opens ----
  const [sequenceId, setSequenceId] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        setLoadingMasters(true);

        // 1) load all masters in parallel
        const [cRes, tRes, coRes, aRes] = await Promise.all([
          api.get("/companies"),
          api.get("/types"),
          api.get("/countries"),
          api.get("/assign-persons"),
        ]);
        const comp = (cRes.data?.data || []).map(mapCompany);
        const typ = (tRes.data?.items || []).map(mapType);
        const cnt = (coRes.data?.items || []).map(mapCountry);
        const aps = (aRes.data?.items || []).map((d: any) => ({
          id: d._id,
          name: d.name,
        }));

        setCompanies(comp);
        setTypes(typ);
        setCountries(cnt);
        setAssignPersons(aps);
        useERPStore.getState().setAssignPersons(aps);

        // 2) reserve a new project code
        const seqRes = await api.post(`/sequences/PRJ/reserve`);
        const seq = seqRes.data.data;

        setSequenceId(seq._id);

        // set display productCode from reserved code
        setNewProject((p) => ({
          ...p,
          productCode: seq.code,
        }));
      } catch (e: any) {
        toast.error("Failed loading masters & sequence");
      } finally {
        setLoadingMasters(false);
      }
    })();
  }, [open]);

  // ---- when company changes, fetch its brands ----
  useEffect(() => {
    if (!newProject.company) return; // <-- important
    (async () => {
      try {
        const res = await api.get("/brands", {
          params: { company: newProject.company },
        });
        const list = (res.data?.items || res.data || []).map(mapBrand);

        setBrands(list);
      } catch (e: any) {
        if (open)
          toast.error(e?.response?.data?.message || "Failed to load brands");
      }
    })();
  }, [newProject.company, open]);

  // ---- when brand changes, fetch categories under (company, brand) ----
  useEffect(() => {
    if (!newProject.company || !newProject.brand) {
      return;
    }
    (async () => {
      try {
        const res = await api.get(
          `/companies/${newProject.company}/brands/${newProject.brand}/categories`
        );

        const arr = res.data?.items || [];
        const cat = arr.map(mapCategory);
        setCategories(cat);
      } catch {
        setCategories([]);
      }
    })();
  }, [newProject.company, newProject.brand]);

  // ---- code generator (kept same) ----
  const generateProjectCode = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    // you were scanning rdProjects; here we just produce a timestamp-based suffix
    const seq = String(now.getTime()).slice(-3);
    return `RND/${currentYear.toString().slice(-2)}-${nextYear
      .toString()
      .slice(-2)}/${month}/${seq}`;
  };

  // ---------- upload handlers ----------
  const handleCoverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image size must be less than 5MB");
    const reader = new FileReader();
    reader.onloadend = () => setCoverPhoto(reader.result as string);
    reader.readAsDataURL(file);
    toast.success("Cover photo uploaded");
  };

  const handleAdditionalImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image size must be less than 5MB");
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...additionalImages];
      newImages[index] = reader.result as string;
      setAdditionalImages(newImages);
      toast.success("Image uploaded");
    };
    reader.readAsDataURL(file);
  };

  const removeCoverPhoto = () => {
    setCoverPhoto(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages[index] = "";
    setAdditionalImages(newImages);
    if (additionalInputRefs.current[index]) {
      additionalInputRefs.current[index]!.value = "";
    }
  };

  const handleAddImageSlot = () => setDynamicImages([...dynamicImages, ""]);

  const handleDynamicImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image size must be less than 5MB");
    const reader = new FileReader();
    reader.onloadend = () => {
      const newImages = [...dynamicImages];
      newImages[index] = reader.result as string;
      setDynamicImages(newImages);
      toast.success("Image uploaded");
    };
    reader.readAsDataURL(file);
  };

  const removeDynamicImage = (index: number) => {
    const newImages = dynamicImages.filter((_, i) => i !== index);
    setDynamicImages(newImages);
    if (dynamicInputRefs.current[index])
      dynamicInputRefs.current[index]!.value = "";
  };

  // ---------- create masters (API) ----------
  const handleCreateNewCompany = async () => {
    if (!newCompanyName.trim())
      return toast.error("Please enter a company name");
    try {
      const res = await api.post("/companies", { name: newCompanyName.trim() });
      const created = res.data?.data || res.data;
      const vm = mapCompany(created);
      setCompanies((prev) => [vm, ...prev]);
      setNewProject((p) => ({ ...p, company: vm.id, brand: "", category: "" }));
      localStorage.setItem("selectedCompanyId", vm.id);

      toast.success(`Company "${vm.companyName}" created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create company");
    } finally {
      setNewCompanyName("");
      setAddingNewCompany(false);
      setCompanyOpen(false);
    }
  };

  const handleCreateNewBrand = async () => {
    if (!newBrandName.trim()) return toast.error("Please enter a brand name");
    if (!newProject.company)
      return toast.error("Please select a company first");
    try {
      // BRAND CREATE API = /api/brands with { name, company }
      // await api.post(`/companies/${companyId}/brands`, { name });

      const res = await api.post(`/companies/${newProject.company}/brands`, {
        name: newBrandName.trim(),
      });

      console.log("Created brand response:", newProject.company);

      const created = res.data?.data || res.data;
      const vm = mapBrand(created);
      setBrands((prev) => [vm, ...prev]);
      setNewProject((p) => ({ ...p, brand: vm.id }));
      toast.success(`Brand "${vm.brandName}" created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create brand");
    } finally {
      setNewBrandName("");
      setAddingNewBrand(false);
      setBrandOpen(false);
    }
  };

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim())
      return toast.error("Please enter a category name");
    if (!newProject.company) return toast.error("Select company first");
    if (!newProject.brand) return toast.error("Select brand first");

    try {
      const res = await api.post(
        `/companies/${newProject.company}/brands/${newProject.brand}/categories`,
        { name: newCategoryName.trim() }
      );

      const created = res.data?.data || res.data;
      const vm = mapCategory(created); // <---- updated

      setCategories((prev) => [vm, ...prev]);
      setNewProject((p) => ({ ...p, category: vm.id }));

      toast.success(`Category "${vm.categoryName}" created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create category");
    } finally {
      setNewCategoryName("");
      setAddingNewCategory(false);
      setCategoryOpen(false);
    }
  };

  const handleCreateNewType = async () => {
    if (!newTypeName.trim()) return toast.error("Please enter a type name");
    try {
      const res = await api.post("/types", { name: newTypeName.trim() });
      const created = res.data?.data || res.data;
      const vm = mapType(created);
      setTypes((prev) => [vm, ...prev]);
      setNewProject((p) => ({ ...p, type: vm.id }));
      toast.success(`Type "${vm.typeName}" created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create type");
    } finally {
      setNewTypeName("");
      setAddingNewType(false);
      setTypeOpen(false);
    }
  };

  const handleCreateNewCountry = async () => {
    if (!newCountryName.trim())
      return toast.error("Please enter a country name");
    try {
      const res = await api.post("/countries", { name: newCountryName.trim() });
      const created = res.data?.data || res.data;
      const vm = mapCountry(created);
      setCountries((prev) => [vm, ...prev]);
      setNewProject((p) => ({ ...p, country: vm.id }));
      toast.success(`Country "${vm.countryName}" created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create country");
    } finally {
      setNewCountryName("");
      setAddingNewCountry(false);
      setCountryOpen(false);
    }
  };

  // ---------- create assign person ----------

  const handleCreateNewAssignPerson = async () => {
    if (!newAssignPersonName.trim()) return toast.error("Enter name");
    try {
      const res = await api.post("/assign-persons", {
        name: newAssignPersonName.trim(),
      });
      const created = res.data?.data || res.data;
      const vm = { id: created._id, name: created.name };
      setAssignPersons((prev) => [vm, ...prev]);
      setNewProject((p) => ({ ...p, taskInc: vm.id }));
      toast.success("Assign person created");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    } finally {
      setAddingNewAssignPerson(false);
      setNewAssignPersonName("");
      setAssignPersonOpen(false);
    }
  };

  // ---------- project create ----------
  const handleCreateProject = async () => {
    if (
      !newProject.color ||
      !newProject.company ||
      !newProject.brand ||
      !newProject.category ||
      !newProject.type ||
      !newProject.country
    ) {
      return toast.error("Please fill all required fields (*)");
    }
    if (!sequenceId) return toast.error("Sequence not created");

    try {
      const fd = new FormData();
      // textual fields matching your project schema
      fd.append("color", newProject.color);
      fd.append("company", newProject.company);
      fd.append("brand", newProject.brand);
      fd.append("category", newProject.category);
      fd.append("type", newProject.type);
      fd.append("country", newProject.country);
      fd.append("artName", newProject.artName || "");
      // optional/renamed fields
      if (newProject.priority)
        fd.append("priority", newProject.priority.toLowerCase());
      if (newProject.description)
        fd.append("productDesc", newProject.description);
      if (newProject.productType) fd.append("gender", newProject.productType);
      if (newProject.collection) fd.append("size", newProject.collection);
      if (newProject.taskInc) fd.append("assignPerson", newProject.taskInc);
      if (newProject.targetDate)
        fd.append("redSealTargetDate", newProject.targetDate);

      // generated code (if your backend stores it differently you can ignore)
      fd.append("sequenceId", sequenceId); // add this
      // fd.append("autoCode", newProject.productCode || generateProjectCode());

      // images: field names must be coverImage, sampleImages[] (your upload.fields)
      if (coverPhoto) {
        const f = dataURLtoFile(coverPhoto, "cover.png");
        fd.append("coverImage", f);
      }
      const gallery = [
        ...additionalImages.filter(Boolean),
        ...dynamicImages.filter(Boolean),
      ];
      gallery.forEach((img, i) => {
        const f = dataURLtoFile(img, `sample-${i + 1}.png`);
        fd.append("sampleImages", f);
      });

      const res = await api.post("/projects", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const created = res.data?.data || res.data;
      onCreated && onCreated(); // <---- trigger reload
      toast.success(`R&D Project created ✓`);

      // reset form
      setNewProject({
        color: "",
        artName: "",
        company: "",
        brand: "",
        collection: "",
        category: "",
        productType: "",
        country: "",
        type: "",
        targetCost: "",
        retailPrice: "",
        upperMaterial: "",
        soleType: "",
        heelHeight: "",
        description: "",
        priority: "",
        taskInc: "",
        assignPerson: "",
        targetDate: "",
        requirements: "",
      });
      setCoverPhoto(null);
      setAdditionalImages([]);
      setDynamicImages([]);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create project");
    }
  };
  // helper: safest way to extract an array from any API response shape
  const pickArray = (payload: any) => {
    if (Array.isArray(payload?.data)) return payload.data; // { data: [...] }
    if (Array.isArray(payload?.items)) return payload.items; // { items: [...] }
    if (Array.isArray(payload)) return payload; // [...]
    return []; // fallback
  };

  useEffect(() => {
    const savedCompany = localStorage.getItem("selectedCompanyId");
    if (!savedCompany) return;

    setNewProject((p) => ({ ...p, company: savedCompany }));

    (async () => {
      try {
        const res = await api.get("/brands", {
          params: { company: savedCompany },
        });
        const arr = pickArray(res.data);
        const list = arr.map(mapBrand); // mapBrand guard करे तो और बढ़िया
        setBrands(list);
      } catch (e) {
        console.error("Failed to load brands", e);
        setBrands([]); // graceful fallback
      }
    })();
  }, []);

  // --------- UI (unchanged except sources now use API state) ---------
  return (
    <Dialog
      open={open}
      onOpenChange={async (isOpen: boolean) => {
        if (!isOpen) {
          if (sequenceId) {
            await api.post(`/sequences/${sequenceId}/cancel`).catch(() => {});
          }
          onClose();
        }
      }}
    >
      <DialogContent className="!max-w-[96vw] !w-[96vw] max-h-[95vh] overflow-hidden p-0 m-0 top-[2.5vh] translate-y-0 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 px-12 py-8 bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b-2 border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-4xl font-semibold text-gray-900 mb-2">
                  Create New R&amp;D Project
                </DialogTitle>
                <DialogDescription className="text-xl text-gray-600">
                  Initialize a comprehensive footwear design and development
                  project
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl px-8 py-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <div className="text-right">
                    <p className="text-base text-blue-600 font-semibold">
                      Auto-Generated Project Code
                    </p>
                    <p className="text-2xl font-mono font-bold text-blue-800">
                      {newProject.productCode || generateProjectCode()}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={async () => {
                  // cancel sequence here
                  if (sequenceId) {
                    await api
                      .post(`/sequences/${sequenceId}/cancel`)
                      .catch(() => {});
                  }
                  onClose();
                }}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-12 py-10 space-y-12">
            {/* Product Development */}
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Product Development Information
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-6 gap-8">
                {/* 1. Art/Colour Name */}
                <div className="space-y-4">
                  <Label
                    htmlFor="art"
                    className="text-base font-semibold text-gray-700"
                  >
                    Art *
                  </Label>
                  <Input
                    id="art"
                    value={newProject.artName}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        artName: e.target.value,
                      })
                    }
                    placeholder="e.g., Midnight Runner"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>
                <div className="space-y-4">
                  <Label
                    htmlFor="colour"
                    className="text-base font-semibold text-gray-700"
                  >
                    Colour *
                  </Label>
                  <Input
                    id="colour"
                    value={newProject.color}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        color: e.target.value,
                      })
                    }
                    placeholder="e.g., Black"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                {/* 2. Product Code (display) */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">
                    Product Code
                  </Label>
                  <Input
                    id="productCode"
                    value={newProject.productCode || generateProjectCode()}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        productCode: e.target.value,
                      })
                    }
                    placeholder="Auto-generated code"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb] font-mono font-bold"
                  />
                </div>

                {/* 3. Company */}
                <div className="space-y-4">
                  <Label
                    htmlFor="company"
                    className="text-base font-semibold text-gray-700"
                  >
                    Company *
                  </Label>
                  <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={companyOpen}
                        className="w-full h-12 justify-between"
                      >
                        {newProject.company
                          ? companies.find((c) => c.id === newProject.company)
                              ?.companyName
                          : loadingMasters
                          ? "Loading..."
                          : "Select company"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search companies..."
                          className="h-9"
                        />
                        <CommandEmpty>No company found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {companies.map((company) => (
                            <CommandItem
                              key={company.id}
                              value={company.companyName}
                              className="flex items-center justify-between"
                              onSelect={() => {
                                setNewProject((p) => ({
                                  ...p,
                                  company: company.id,
                                  brand: "",
                                  category: "",
                                }));
                                setCompanyOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1">
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    newProject.company === company.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {company.companyName}
                              </div>

                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  // Uncomment when ready:
                                  try {
                                    await api.delete(
                                      `/companies/${company.id}`
                                    );
                                    setCompanies((prev) =>
                                      prev.filter((b) => b.id !== company.id)
                                    );
                                    toast.success("Company removed");
                                  } catch (err) {
                                    toast.error("Remove company failed");
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500 opacity-60 hover:opacity-100" />
                              </button>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        {/* Inline Create Company */}
                        <div className="border-t p-2">
                          {!addingNewCompany ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-blue-600"
                              onClick={() => setAddingNewCompany(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Create New
                              Company
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter new company name..."
                                value={newCompanyName}
                                onChange={(e) =>
                                  setNewCompanyName(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleCreateNewCompany()
                                }
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewCompany}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewCompany(false);
                                    setNewCompanyName("");
                                  }}
                                  className="flex-1"
                                >
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 4. Brand */}
                <div className="space-y-4">
                  <Label
                    htmlFor="brand"
                    className="text-base font-semibold text-gray-700"
                  >
                    Brand *
                  </Label>
                  <Popover open={brandOpen} onOpenChange={setBrandOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={brandOpen}
                        disabled={!newProject.company}
                        className="w-full h-12 justify-between"
                      >
                        {newProject.brand
                          ? filteredBrands.find(
                              (b) => b.id === newProject.brand
                            )?.brandName
                          : newProject.company
                          ? "Select brand"
                          : "Select company first"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search brands..."
                          className="h-9"
                        />
                        <CommandEmpty>No brand found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {filteredBrands.map((brand) => (
                            <CommandItem
                              key={brand.id}
                              className="flex items-center justify-between"
                              onSelect={() => {
                                setNewProject((p) => ({
                                  ...p,
                                  brand: brand.id,
                                }));
                                setBrandOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1">
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    newProject.brand === brand.id
                                      ? ""
                                      : "opacity-0"
                                  }`}
                                />
                                {brand.brandName}
                              </div>

                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  // Uncomment when ready:
                                  try {
                                    await api.delete(`/brands/${brand.id}`);
                                    setBrands((prev) =>
                                      prev.filter((b) => b.id !== brand.id)
                                    );
                                    toast.success("Brand deleted");
                                  } catch (err) {
                                    toast.error("Delete failed");
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500 opacity-60 hover:opacity-100" />
                              </button>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        {/* Inline Create Brand */}
                        <div className="border-t p-2">
                          {!addingNewBrand ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-blue-600"
                              onClick={() => setAddingNewBrand(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Create New Brand
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter new brand name..."
                                value={newBrandName}
                                onChange={(e) =>
                                  setNewBrandName(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleCreateNewBrand()
                                }
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewBrand}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewBrand(false);
                                    setNewBrandName("");
                                  }}
                                  className="flex-1"
                                >
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 5. Category */}
                <div className="space-y-4">
                  <Label
                    htmlFor="category"
                    className="text-base font-semibold text-gray-700"
                  >
                    Footwear Category *
                  </Label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryOpen}
                        disabled={!newProject.brand}
                        className="w-full h-12 justify-between"
                      >
                        {newProject.category
                          ? filteredCategories.find(
                              (c) => c.id === newProject.category
                            )?.categoryName
                          : newProject.brand
                          ? "Select category"
                          : "Select brand first"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search category..." />
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {filteredCategories.map((category) => (
                            <CommandItem
                              key={category.id}
                              className="flex items-center justify-between"
                              value={category.categoryName}
                              onSelect={() => {
                                setNewProject((p) => ({
                                  ...p,
                                  category: category.id,
                                }));
                                setCategoryOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1">
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    newProject.category === category.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {category.categoryName}
                              </div>

                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  try {
                                    await api.delete(
                                      `/companies/${newProject.company}/brands/${newProject.brand}/categories/${category.id}`
                                    );
                                    setCategories((prev) =>
                                      prev.filter((x) => x.id !== category.id)
                                    );
                                    toast.success("Category deleted");
                                  } catch (err: any) {
                                    toast.error(
                                      err?.response?.data?.message ||
                                        "Failed to delete category"
                                    );
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500 opacity-60 hover:opacity-100" />
                              </button>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        {/* Inline Create Category */}
                        <div className="border-t p-2">
                          {!addingNewCategory ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-blue-600"
                              onClick={() => setAddingNewCategory(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Create New
                              Category
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter new category name..."
                                value={newCategoryName}
                                onChange={(e) =>
                                  setNewCategoryName(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleCreateNewCategory()
                                }
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewCategory}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewCategory(false);
                                    setNewCategoryName("");
                                  }}
                                  className="flex-1"
                                >
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 6. Type */}
                <div className="space-y-4">
                  <Label
                    htmlFor="type"
                    className="text-base font-semibold text-gray-700"
                  >
                    Type *
                  </Label>
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={typeOpen}
                        className="w-full h-12 justify-between"
                      >
                        {newProject.type
                          ? types.find((t) => t.id === newProject.type)
                              ?.typeName
                          : "Select type"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search types..."
                          className="h-9"
                        />
                        <CommandEmpty>No type found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {types.map((type) => (
                            <CommandItem
                              key={type.id}
                              className="flex items-center justify-between"
                              value={type.typeName}
                              onSelect={() => {
                                setNewProject((p) => ({ ...p, type: type.id }));
                                setTypeOpen(false);
                              }}
                            >
                              <div className="flex flex-1 items-center">
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    newProject.type === type.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {type.typeName} ({type.usageArea})
                              </div>

                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  try {
                                    await api.delete(`/types/${type.id}`);
                                    setTypes((prev) =>
                                      prev.filter((x) => x.id !== type.id)
                                    );
                                    toast.success("Type removed");
                                  } catch (err: any) {
                                    toast.error("Type remove failed");
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500 opacity-60 hover:opacity-100" />
                              </button>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        {/* Inline Create Type */}
                        <div className="border-t p-2">
                          {!addingNewType ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-blue-600"
                              onClick={() => setAddingNewType(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Create New Type
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter new type name..."
                                value={newTypeName}
                                onChange={(e) => setNewTypeName(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleCreateNewType()
                                }
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewType}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewType(false);
                                    setNewTypeName("");
                                  }}
                                  className="flex-1"
                                >
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 7. Country */}
                <div className="space-y-4">
                  <Label
                    htmlFor="country"
                    className="text-base font-semibold text-gray-700"
                  >
                    Country *
                  </Label>
                  <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={countryOpen}
                        className="w-full h-12 justify-between"
                      >
                        {newProject.country
                          ? countries.find((c) => c.id === newProject.country)
                              ?.countryName
                          : "Select country"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search countries..."
                          className="h-9"
                        />
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {countries.map((country) => (
                            <CommandItem
                              key={country.id}
                              value={country.countryName}
                              className="flex items-center justify-between"
                              onSelect={() => {
                                setNewProject((p) => ({
                                  ...p,
                                  country: country.id,
                                }));
                                setCountryOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1">
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    newProject.country === country.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {country.countryName}
                              </div>

                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  try {
                                    await api.delete(
                                      `/countries/${country.id}`
                                    );
                                    setCountries((prev) =>
                                      prev.filter((x) => x.id !== country.id)
                                    );
                                    toast.success("Country removed");
                                  } catch (err: any) {
                                    toast.error("Country remove failed");
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500 opacity-60 hover:opacity-100" />
                              </button>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        {/* Inline Create Country */}
                        <div className="border-t p-2">
                          {!addingNewCountry ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-blue-600"
                              onClick={() => setAddingNewCountry(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Create New
                              Country
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter new country name..."
                                value={newCountryName}
                                onChange={(e) =>
                                  setNewCountryName(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" && handleCreateNewCountry()
                                }
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewCountry}
                                  className="flex-1"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewCountry(false);
                                    setNewCountryName("");
                                  }}
                                  className="flex-1"
                                >
                                  <X className="w-4 h-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 8. Size Range */}
                <div className="space-y-4">
                  <Label
                    htmlFor="sizeRange"
                    className="text-base font-semibold text-gray-700"
                  >
                    Size Range *
                  </Label>
                  <Input
                    id="sizeRange"
                    type="text"
                    value={newProject.collection}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        collection: e.target.value,
                      })
                    }
                    placeholder="e.g., Men's: 6-12 UK"
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                {/* 9. Target Gender */}
                <div className="space-y-4">
                  <Label
                    htmlFor="gender"
                    className="text-base font-semibold text-gray-700"
                  >
                    Target Gender
                  </Label>
                  <select
                    className="h-12 w-full border rounded-md px-3"
                    value={newProject.productType}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        productType: e.target.value,
                      })
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="Men">Men's Collection</option>
                    <option value="Women">Women's Collection</option>
                    <option value="Kids">Kids Collection</option>
                    <option value="Unisex">Unisex Collection</option>
                  </select>
                </div>

                {/* 10. Priority */}
                <div className="space-y-4">
                  <Label
                    htmlFor="priority"
                    className="text-base font-semibold text-gray-700"
                  >
                    Priority *
                  </Label>
                  <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={priorityOpen}
                        className="w-full h-12 justify-between"
                      >
                        {newProject.priority || "Select priority"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandGroup>
                          {["High", "Medium", "Low"].map((priority) => (
                            <CommandItem
                              key={priority}
                              value={priority}
                              onSelect={() => {
                                setNewProject({ ...newProject, priority });
                                setPriorityOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  newProject.priority === priority
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {priority}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* spacer */}
                <div className="xl:col-span-2"></div>

                {/* Description */}
                <div className="xl:col-span-6 space-y-4">
                  <Label
                    htmlFor="description"
                    className="text-base font-semibold text-gray-700"
                  >
                    Product Design Brief & Features
                  </Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe the product design concept…"
                    rows={4}
                    className="resize-none text-base border-2 focus:border-[#0c9dcb] leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Images Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Image & Profile
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label className="text-base font-semibold text-gray-700 mb-4 block">
                    Cover Photo
                  </Label>
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Cover */}
                    <div className="flex-shrink-0">
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverPhotoUpload}
                      />
                      {coverPhoto ? (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden group">
                          <img
                            src={coverPhoto}
                            alt="Cover"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeCoverPhoto}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => coverInputRef.current?.click()}
                          className="w-32 h-32 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-center px-2">
                            <p className="text-xs font-medium text-gray-700">
                              Cover Photo
                            </p>
                            <p className="text-xs text-blue-600">Upload</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5 static slots */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <input
                          ref={(el) => {
                            if (additionalInputRefs.current)
                              additionalInputRefs.current[i] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleAdditionalImageUpload(e, i)}
                        />
                        {additionalImages[i] ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden group">
                            <img
                              src={additionalImages[i]}
                              alt={`Additional ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeAdditionalImage(i)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() =>
                              additionalInputRefs.current[i]?.click()
                            }
                            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-center group"
                          >
                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Dynamic */}
                    {dynamicImages.map((image, i) => (
                      <div key={`dyn-${i}`}>
                        <input
                          ref={(el) => {
                            if (dynamicInputRefs.current)
                              dynamicInputRefs.current[i] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleDynamicImageUpload(e, i)}
                        />
                        {image ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden group">
                            <img
                              src={image}
                              alt={`Dynamic ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeDynamicImage(i)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => dynamicInputRefs.current[i]?.click()}
                            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-center group"
                          >
                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* add slot */}
                    <div
                      onClick={handleAddImageSlot}
                      className="w-24 h-24 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/50 hover:bg-blue-100 transition-all cursor-pointer flex items-center justify-center group"
                    >
                      <Plus className="w-6 h-6 text-blue-600 group-hover:text-blue-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-10" />

            {/* Timeline */}
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Cost Structure & Development Timeline
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200"></div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="space-y-4">
                  <Label
                    htmlFor="targetDate"
                    className="text-base font-semibold text-gray-700"
                  >
                    Red Seal Target Date
                  </Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newProject.targetDate}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        targetDate: e.target.value,
                      })
                    }
                    className="h-12 text-base border-2 focus:border-[#0c9dcb]"
                    style={{ colorScheme: "light" }}
                  />
                </div>

                <div className="space-y-4">
                  <Label
                    htmlFor="taskInc"
                    className="text-base font-semibold text-gray-700"
                  >
                    Task-INC (Assigned Person)
                  </Label>
                  {/* Task-INC */}
                  <Popover
                    open={assignPersonOpen}
                    onOpenChange={setAssignPersonOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={assignPersonOpen}
                        className="w-full h-12 border-2 justify-between"
                      >
                        {newProject.taskInc
                          ? assignPersons.find(
                              (p) => p.id === newProject.taskInc
                            )?.name
                          : "Select assignee"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search person..."
                          className="h-9"
                        />
                        <CommandEmpty>No person found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {assignPersons.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.name}
                              className="flex justify-between items-center"
                              onSelect={() => {
                                setNewProject({ ...newProject, taskInc: p.id });
                                setAssignPersonOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1">
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    newProject.taskInc === p.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {p.name}
                              </div>
                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  try {
                                    await api.delete(`/assign-persons/${p.id}`);
                                    setAssignPersons((prev) =>
                                      prev.filter((x) => x.id !== p.id)
                                    );
                                    toast.success("Assign person deleted");
                                  } catch (err: any) {
                                    toast.error("Delete failed");
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500 opacity-60 hover:opacity-100" />
                              </button>
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        {/* inline add new */}
                        <div className="border-t p-2">
                          {!addingNewAssignPerson ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="w-full justify-start text-blue-600"
                              onClick={() => setAddingNewAssignPerson(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add new person
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter new person name..."
                                value={newAssignPersonName}
                                onChange={(e) =>
                                  setNewAssignPersonName(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  handleCreateNewAssignPerson()
                                }
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleCreateNewAssignPerson}
                                  className="flex-1"
                                >
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    setAddingNewAssignPerson(false);
                                    setNewAssignPersonName("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 px-12 py-8 flex justify-between items-center shadow-lg z-50">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            <div>
              <p className="text-base font-semibold text-gray-900">
                Ready to Create Your R&amp;D Project?
              </p>
              <p className="text-sm text-gray-600">
                Double-check all required fields marked with * before submission
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-3 text-base border-2 hover:bg-gray-50"
              onClick={async () => {
                // cancel sequence here
                if (sequenceId) {
                  await api
                    .post(`/sequences/${sequenceId}/cancel`)
                    .catch(() => {});
                }
                onClose();
              }}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              size="lg"
              className="px-8 py-3 text-base bg-[#0c9dcb] hover:bg-[#0c9dcb]/90"
              type="button"
            >
              <Plus className="w-5 h-5 mr-3" /> Create R&amp;D Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
