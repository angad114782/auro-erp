import {
  AlertCircle,
  Calculator,
  Check,
  CheckCircle,
  ChevronDown,
  Image as ImageIcon,
  Plus,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../lib/api";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

export interface NewProject {
  autoCode?: string;
  company: string;
  brand: string;
  category: string;
  type: string;
  country: string;
  assignPerson: string;
  color: string;
  artName?: string;
  size?: string;
  gender?: string;
  priority: string;
  productDesc: string;
  redSealTargetDate: string;
  coverImage: string;
  sampleImages: string[];
}

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

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
  type CompanyType = {
    _id: string;
    name: string;
    isActive: boolean;
  };
  type BrandType = {
    _id: string;
    name: string;
    company: {
      _id: string;
      name: string;
    };
    isActive: boolean;
  };
  type CategoryType = {
    _id: string;
    name: string;
    company: {
      _id: string;
      name: string;
    };
    brand: {
      _id: string;
      name: string;
    };
    isActive: boolean;
  };
  type TypeType = CompanyType;
  type CountryType = CompanyType;
  type AssignPersonType = CompanyType;

  const [companies, setCompanies] = useState<CompanyType[]>([]);
  const [brands, setBrands] = useState<BrandType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [types, setTypes] = useState<TypeType[]>([]);
  const [countries, setCountries] = useState<CountryType[]>([]);
  const [assignPersons, setAssignPersons] = useState<AssignPersonType[]>([]);
  const [loadingMasters, setLoadingMasters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // form state
  const [newProject, setNewProject] = useState<NewProject>({
    autoCode: "",
    company: "",
    brand: "",
    category: "",
    type: "",
    country: "",
    assignPerson: "",
    color: "",
    artName: "",
    size: "",
    gender: "",
    priority: "",
    productDesc: "",
    redSealTargetDate: "",
    coverImage: "",
    sampleImages: [""],
  });

  // popovers
  const [companyOpen, setCompanyOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assignPersonOpen, setAssignPersonOpen] = useState(false);

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
  const [addingNewAssignPerson, setAddingNewAssignPerson] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCountryName, setNewCountryName] = useState("");
  const [newAssignPersonName, setNewAssignPersonName] = useState("");

  // Check screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ---- derived filters ----
  const filteredBrands = useMemo(
    () =>
      newProject.company
        ? brands.filter((b) => b.company._id === newProject.company)
        : [],
    [brands, newProject.company]
  );

  const filteredCategories = useMemo(
    () =>
      newProject.company && newProject.brand
        ? categories.filter(
            (c) =>
              c.company._id === newProject.company &&
              c.brand._id === newProject.brand
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

        const [cRes, tRes, coRes, aRes] = await Promise.all([
          api.get("/companies"),
          api.get("/types"),
          api.get("/countries"),
          api.get("/assign-persons"),
        ]);
        const comp: CompanyType[] = cRes.data?.data || [];
        const typ: TypeType[] = tRes.data?.items || [];
        const cnt: CountryType[] = coRes.data?.items || [];
        const aps: AssignPersonType[] = aRes.data?.items || [];

        setCompanies(comp);
        setTypes(typ);
        setCountries(cnt);
        setAssignPersons(aps);

        const seqRes = await api.post(`/sequences/PRJ/reserve`);
        const seq = seqRes.data.data;

        setSequenceId(seq._id);
        setNewProject((p) => ({
          ...p,
          autoCode: seq.code,
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
    if (!newProject.company) return;
    (async () => {
      try {
        const res = await api.get("/brands", {
          params: { company: newProject.company },
        });
        const list: BrandType[] = res.data?.items || res.data || [];
        setBrands(list);
      } catch (e: any) {
        setBrands([]);
        if (open)
          toast.error(e?.response?.data?.message || "Failed to load brands");
      }
    })();
  }, [newProject.company, open]);

  // ---- when brand changes, fetch categories ----
  useEffect(() => {
    if (!newProject.company || !newProject.brand) {
      return;
    }
    (async () => {
      try {
        const res = await api.get(
          `/companies/${newProject.company}/brands/${newProject.brand}/categories`
        );
        const arr: CategoryType[] = res.data?.items || [];
        setCategories(arr);
      } catch {
        setCategories([]);
      }
    })();
  }, [newProject.company, newProject.brand]);

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

  // ---------- create masters ----------
  const handleCreateNewCompany = async () => {
    if (!newCompanyName.trim())
      return toast.error("Please enter a company name");
    try {
      const res = await api.post("/companies", { name: newCompanyName.trim() });
      const createdCompanyResponse = res.data?.data || res.data;
      setCompanies((prev) => [createdCompanyResponse, ...prev]);
      setNewProject((p) => ({
        ...p,
        company: createdCompanyResponse._id,
        brand: "",
        category: "",
      }));

      toast.success(`Company ${createdCompanyResponse.company} created`);
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
      const res = await api.post(`/companies/${newProject.company}/brands`, {
        name: newBrandName.trim(),
      });
      const createdBrandResponse = res.data?.data || res.data;
      setBrands((prev) => [createdBrandResponse, ...prev]);
      setNewProject((p) => ({ ...p, brand: createdBrandResponse._id }));
      toast.success(`Brand ${createdBrandResponse.name} created`);
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
      const createdCategoryResponse = res.data?.data || res.data;
      setCategories((prev) => [createdCategoryResponse, ...prev]);
      setNewProject((p) => ({ ...p, category: createdCategoryResponse._id }));
      toast.success(`Category ${createdCategoryResponse.name} created`);
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
      const createdTypeResponse = res.data?.data || res.data;
      setTypes((prev) => [createdTypeResponse, ...prev]);
      setNewProject((p) => ({ ...p, type: createdTypeResponse._id }));
      toast.success(`Type "${createdTypeResponse.type}" created`);
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
      const createdCountryResponse = res.data?.data || res.data;
      setCountries((prev) => [createdCountryResponse, ...prev]);
      setNewProject((p) => ({ ...p, country: createdCountryResponse._id }));
      toast.success(`Country "${createdCountryResponse.country}" created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create country");
    } finally {
      setNewCountryName("");
      setAddingNewCountry(false);
      setCountryOpen(false);
    }
  };

  const handleCreateNewAssignPerson = async () => {
    if (!newAssignPersonName.trim()) return toast.error("Enter name");
    try {
      const res = await api.post("/assign-persons", {
        name: newAssignPersonName.trim(),
      });
      const createdAssignPersonResponse = res.data?.data || res.data;
      setAssignPersons((prev) => [createdAssignPersonResponse, ...prev]);
      setNewProject((p) => ({
        ...p,
        assignPerson: createdAssignPersonResponse._id,
      }));
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
      fd.append("color", newProject.color);
      fd.append("company", newProject.company);
      fd.append("brand", newProject.brand);
      fd.append("category", newProject.category);
      fd.append("type", newProject.type);
      fd.append("country", newProject.country);
      fd.append("artName", newProject.artName || "");

      if (newProject.priority)
        fd.append("priority", newProject.priority.toLowerCase());
      if (newProject.productDesc)
        fd.append("productDesc", newProject.productDesc);
      if (newProject.gender) fd.append("gender", newProject.gender);
      if (newProject.size) fd.append("size", newProject.size);
      if (newProject.assignPerson)
        fd.append("assignPerson", newProject.assignPerson);
      if (newProject.redSealTargetDate)
        fd.append("redSealTargetDate", newProject.redSealTargetDate);

      fd.append("sequenceId", sequenceId);

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
      onCreated && onCreated();
      toast.success(`R&D Project created ✓`);

      setNewProject({
        autoCode: "",
        company: "",
        brand: "",
        category: "",
        type: "",
        country: "",
        assignPerson: "",
        color: "",
        artName: "",
        size: "",
        gender: "",
        priority: "",
        productDesc: "",
        redSealTargetDate: "",
        coverImage: "",
        sampleImages: [""],
      });
      setCoverPhoto(null);
      setAdditionalImages([]);
      setDynamicImages([]);
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create project");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        className={`
        ${
          isMobile
            ? "max-w-[95vw]! w-[95vw]! max-h-[95vh] top-[2.5vh] translate-y-0"
            : "max-w-[96vw]! w-[96vw]! max-h-[95vh] top-[2.5vh] translate-y-0"
        } overflow-hidden p-0 m-0 flex flex-col
      `}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 px-4 md:px-8 lg:px-12 py-4 md:py-6 lg:py-8 bg-linear-to-r from-gray-50 via-white to-gray-50 border-b-2 border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
              <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-linear-to-br from-[#0c9dcb] to-[#26b4e0] rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Plus className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-gray-900 mb-1 md:mb-2 truncate">
                  Create New R&amp;D Project
                </DialogTitle>
                <DialogDescription className="text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 truncate">
                  Initialize a footwear design and development project
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
              <div className="bg-linear-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg md:rounded-xl px-4 py-3 md:px-6 md:py-4 lg:px-8 lg:py-6 shadow-lg">
                <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-blue-600 shrink-0" />
                  <div className="text-right min-w-0">
                    <p className="text-xs md:text-sm lg:text-base text-blue-600 font-semibold truncate">
                      Project Code
                    </p>
                    <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-mono font-bold text-blue-800 truncate">
                      {newProject.autoCode}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onClose()}
                variant="ghost"
                size="sm"
                className="h-8 w-8 md:h-10 md:w-10 p-0 hover:bg-gray-100 rounded-full shrink-0"
              >
                <X className="w-4 h-4 md:w-5 md:h-5 text-gray-500 hover:text-gray-700" />
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6 lg:py-8 xl:py-10 space-y-6 md:space-y-8 lg:space-y-10 xl:space-y-12">
            {/* Product Development */}
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
                <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <Target className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                  Product Development Information
                </h3>
                <div className="flex-1 h-px bg-linear-to-r from-gray-200 via-gray-400 to-gray-200 hidden sm:block"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
                {/* 1. Art Name */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="art"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Article Name *
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
                    className="h-10 md:h-12 text-sm md:text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                {/* 2. Colour */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="colour"
                    className="text-sm md:text-base font-semibold text-gray-700"
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
                    className="h-10 md:h-12 text-sm md:text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                {/* 3. Product Code */}
                <div className="space-y-2 md:space-y-4">
                  <Label className="text-sm md:text-base font-semibold text-gray-700">
                    Product Code
                  </Label>
                  <Input
                    id="productCode"
                    value={newProject.autoCode}
                    readOnly
                    placeholder="Auto-generated code"
                    className="h-10 md:h-12 text-sm md:text-base border-2 focus:border-[#0c9dcb] font-mono font-bold"
                  />
                </div>

                {/* 4. Company */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="company"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Company *
                  </Label>
                  <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={companyOpen}
                        className="w-full h-10 md:h-12 justify-between"
                      >
                        <span className="truncate">
                          {newProject.company
                            ? companies.find(
                                (c) => c._id === newProject.company
                              )?.name
                            : loadingMasters
                            ? "Loading..."
                            : "Select company"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search companies..."
                          className="h-9"
                        />
                        <CommandEmpty>No company found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {companies.map((company) => (
                            <CommandItem
                              key={company._id}
                              value={company.name}
                              className="flex items-center justify-between"
                              onSelect={() => {
                                setNewProject((p) => ({
                                  ...p,
                                  company: company._id,
                                  brand: "",
                                  category: "",
                                }));
                                setCompanyOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    newProject.company === company._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <span className="truncate">{company.name}</span>
                              </div>
                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded shrink-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    await api.delete(
                                      `/companies/${company._id}`
                                    );
                                    setCompanies((prev) =>
                                      prev.filter((b) => b._id !== company._id)
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
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewCompany}
                                  className="flex-1 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewCompany(false);
                                    setNewCompanyName("");
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 5. Brand */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="brand"
                    className="text-sm md:text-base font-semibold text-gray-700"
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
                        className="w-full h-10 md:h-12 justify-between"
                      >
                        <span className="truncate">
                          {newProject.brand
                            ? filteredBrands.find(
                                (b) => b._id === newProject.brand
                              )?.name
                            : newProject.company
                            ? "Select brand"
                            : "Select company first"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search brands..."
                          className="h-9"
                        />
                        <CommandEmpty>No brand found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {filteredBrands.map((brand) => (
                            <CommandItem
                              key={brand._id}
                              className="flex items-center justify-between"
                              onSelect={() => {
                                setNewProject((p) => ({
                                  ...p,
                                  brand: brand._id,
                                }));
                                setBrandOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    newProject.brand === brand._id
                                      ? ""
                                      : "opacity-0"
                                  }`}
                                />
                                <span className="truncate">{brand.name}</span>
                              </div>
                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded shrink-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    await api.delete(`/brands/${brand._id}`);
                                    setBrands((prev) =>
                                      prev.filter((b) => b._id !== brand._id)
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
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewBrand}
                                  className="flex-1 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewBrand(false);
                                    setNewBrandName("");
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 6. Category */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="category"
                    className="text-sm md:text-base font-semibold text-gray-700"
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
                        className="w-full h-10 md:h-12 justify-between"
                      >
                        <span className="truncate">
                          {newProject.category
                            ? filteredCategories.find(
                                (c) => c._id === newProject.category
                              )?.name
                            : newProject.brand
                            ? "Select category"
                            : "Select brand first"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search category..."
                          className="h-9"
                        />
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {filteredCategories.map((category) => (
                            <CommandItem
                              key={category._id}
                              className="flex items-center justify-between"
                              value={category.name}
                              onSelect={() => {
                                setNewProject((p) => ({
                                  ...p,
                                  category: category._id,
                                }));
                                setCategoryOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    newProject.category === category._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <span className="truncate">
                                  {category.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded shrink-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    await api.delete(
                                      `/companies/${newProject.company}/brands/${newProject.brand}/categories/${category._id}`
                                    );
                                    setCategories((prev) =>
                                      prev.filter((x) => x._id !== category._id)
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
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewCategory}
                                  className="flex-1 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewCategory(false);
                                    setNewCategoryName("");
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Continue with responsive grid for other fields... */}

                {/* For space, I'll show the responsive pattern for one more field */}

                {/* 7. Type */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="type"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Type *
                  </Label>
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={typeOpen}
                        className="w-full h-10 md:h-12 justify-between"
                      >
                        <span className="truncate">
                          {newProject.type
                            ? types.find((t) => t._id === newProject.type)?.name
                            : "Select type"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search types..."
                          className="h-9"
                        />
                        <CommandEmpty>No type found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {types.map((type) => (
                            <CommandItem
                              key={type._id}
                              className="flex items-center justify-between"
                              value={type.name}
                              onSelect={() => {
                                setNewProject((p) => ({
                                  ...p,
                                  type: type._id,
                                }));
                                setTypeOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    newProject.type === type._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <span className="truncate">{type.name}</span>
                              </div>
                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded shrink-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    await api.delete(`/types/${type._id}`);
                                    setTypes((prev) =>
                                      prev.filter((x) => x._id !== type._id)
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
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewType}
                                  className="flex-1 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewType(false);
                                    setNewTypeName("");
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 8. Country */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="country"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Country *
                  </Label>
                  <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={countryOpen}
                        className="w-full h-10 md:h-12 justify-between"
                      >
                        <span className="truncate">
                          {newProject.country
                            ? countries.find(
                                (c) => c._id === newProject.country
                              )?.name
                            : "Select country"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search countries..."
                          className="h-9"
                        />
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {countries.map((country) => (
                            <CommandItem
                              key={country._id}
                              value={country.name}
                              className="flex items-center justify-between"
                              onSelect={() => {
                                setNewProject((p) => ({
                                  ...p,
                                  country: country._id,
                                }));
                                setCountryOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    newProject.country === country._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <span className="truncate">{country.name}</span>
                              </div>
                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded shrink-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    await api.delete(
                                      `/countries/${country._id}`
                                    );
                                    setCountries((prev) =>
                                      prev.filter((x) => x._id !== country._id)
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
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateNewCountry}
                                  className="flex-1 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" /> Add
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAddingNewCountry(false);
                                    setNewCountryName("");
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <X className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 9. Size Range */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="sizeRange"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Size Range *
                  </Label>
                  <Input
                    id="sizeRange"
                    type="text"
                    value={newProject.size}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        size: e.target.value,
                      })
                    }
                    placeholder="e.g., Men's: 6-12 UK"
                    className="h-10 md:h-12 text-sm md:text-base border-2 focus:border-[#0c9dcb]"
                  />
                </div>

                {/* 10. Target Gender */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="gender"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Target Gender
                  </Label>
                  <select
                    className="h-10 md:h-12 w-full border rounded-md px-3 text-sm md:text-base"
                    value={newProject.gender}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        gender: e.target.value,
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

                {/* 11. Priority */}
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="priority"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Priority *
                  </Label>
                  <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={priorityOpen}
                        className="w-full h-10 md:h-12 justify-between"
                      >
                        <span className="truncate">
                          {newProject.priority || "Select priority"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
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
                              className="text-sm"
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

                {/* 12. Description (full width) */}
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-6 space-y-2 md:space-y-4">
                  <Label
                    htmlFor="description"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Product Design Brief & Features
                  </Label>
                  <Textarea
                    id="description"
                    value={newProject.productDesc}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        productDesc: e.target.value,
                      })
                    }
                    placeholder="Describe the product design concept…"
                    rows={3}
                    className="resize-none text-sm md:text-base border-2 focus:border-[#0c9dcb] leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6 md:my-8 lg:my-10" />

            {/* Images Section */}
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
                <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <ImageIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                  Image & Profile
                </h3>
                <div className="flex-1 h-px bg-linear-to-r from-gray-200 via-gray-400 to-gray-200 hidden sm:block"></div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-6">
                <div>
                  <Label className="text-sm md:text-base font-semibold text-gray-700 mb-3 md:mb-4 block">
                    Cover Photo
                  </Label>
                  <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                    {/* Cover */}
                    <div className="shrink-0">
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverPhotoUpload}
                      />
                      {coverPhoto ? (
                        <div className="relative w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-lg overflow-hidden group">
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
                              className="h-6 w-6 md:h-8 md:w-8 p-0"
                            >
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => coverInputRef.current?.click()}
                          className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2"
                        >
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                            <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
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
                          <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden group">
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
                                className="h-6 w-6 md:h-8 md:w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() =>
                              additionalInputRefs.current[i]?.click()
                            }
                            className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-center group"
                          >
                            <Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-500" />
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
                          <div className="relative w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden group">
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
                                className="h-6 w-6 md:h-8 md:w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => dynamicInputRefs.current[i]?.click()}
                            className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-blue-400 transition-all cursor-pointer flex items-center justify-center group"
                          >
                            <Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-500" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* add slot */}
                    <div
                      onClick={handleAddImageSlot}
                      className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50/50 hover:bg-blue-100 transition-all cursor-pointer flex items-center justify-center group"
                    >
                      <Plus className="w-5 h-5 md:w-6 md:h-6 text-blue-600 group-hover:text-blue-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6 md:my-8 lg:my-10" />

            {/* Timeline */}
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              <div className="flex items-center gap-3 md:gap-4 lg:gap-6">
                <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-md shrink-0">
                  <Calculator className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-900">
                  Cost Structure & Development Timeline
                </h3>
                <div className="flex-1 h-px bg-linear-to-r from-gray-200 via-gray-400 to-gray-200 hidden sm:block"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="targetDate"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Red Seal Target Date
                  </Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newProject.redSealTargetDate}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        redSealTargetDate: e.target.value,
                      })
                    }
                    className="h-10 md:h-12 text-sm md:text-base border-2 focus:border-[#0c9dcb]"
                    style={{ colorScheme: "light" }}
                  />
                </div>

                <div className="space-y-2 md:space-y-4">
                  <Label
                    htmlFor="taskInc"
                    className="text-sm md:text-base font-semibold text-gray-700"
                  >
                    Task-INC (Assigned Person)
                  </Label>
                  <Popover
                    open={assignPersonOpen}
                    onOpenChange={setAssignPersonOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={assignPersonOpen}
                        className="w-full h-10 md:h-12 border-2 justify-between"
                      >
                        <span className="truncate">
                          {newProject.assignPerson
                            ? assignPersons.find(
                                (p) => p._id === newProject.assignPerson
                              )?.name
                            : "Select assignee"}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search person..."
                          className="h-9"
                        />
                        <CommandEmpty>No person found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {assignPersons.map((p) => (
                            <CommandItem
                              key={p._id}
                              value={p.name}
                              className="flex justify-between items-center"
                              onSelect={() => {
                                setNewProject({
                                  ...newProject,
                                  assignPerson: p._id,
                                });
                                setAssignPersonOpen(false);
                              }}
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <Check
                                  className={`mr-2 h-4 w-4 shrink-0 ${
                                    newProject.assignPerson === p._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <span className="truncate">{p.name}</span>
                              </div>
                              <button
                                type="button"
                                className="p-1 hover:bg-red-50 rounded shrink-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    await api.delete(
                                      `/assign-persons/${p._id}`
                                    );
                                    setAssignPersons((prev) =>
                                      prev.filter((x) => x._id !== p._id)
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
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleCreateNewAssignPerson}
                                  className="flex-1 text-xs"
                                >
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-xs"
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
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 shadow-lg z-50">
          <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-4 md:py-6 lg:py-8 mx-auto w-full max-w-full">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-semibold text-gray-900 truncate">
                    Ready to Create Your R&amp;D Project?
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 truncate">
                    Double-check all required fields marked with * before
                    submission
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "lg"}
                  className="px-4 md:px-6 lg:px-8 py-2 md:py-3 text-sm md:text-base border-2 hover:bg-gray-50 w-full sm:w-auto min-w-[120px]"
                  onClick={() => onClose()}
                  type="button"
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleCreateProject}
                  size={isMobile ? "default" : "lg"}
                  className="px-4 md:px-6 lg:px-8 py-2 md:py-3 text-sm md:text-base bg-[#0c9dcb] hover:bg-[#0c9dcb]/90 w-full sm:w-auto min-w-[160px]"
                  type="button"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
                  <span>Create R&amp;D Project</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
