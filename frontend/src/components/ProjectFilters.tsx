import React, { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Badge } from "./ui/badge";

interface ProjectFiltersProps {
  // Master data
  countries: any[];
  companies?: any[];
  brands?: any[];
  categories?: any[];
  types?: any[];

  // Current filter values
  filters: {
    country?: string;
    priority?: string;
    company?: string;
    brand?: string;
    category?: string;
    type?: string;
  };

  // Callbacks
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;

  // Optional customization
  availableFilters?: string[]; // Which filters to show
  isMobile?: boolean;
}

export function ProjectFilters({
  countries,
  companies = [],
  brands = [],
  categories = [],
  types = [],
  filters,
  onFiltersChange,
  onClearFilters,
  availableFilters = [
    "country",
    "priority",
    "company",
    "brand",
    "category",
    "type",
  ],
  isMobile = false,
}: ProjectFiltersProps) {
  const [open, setOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    if (value === "all" || !value) {
      const newFilters = { ...filters };
      delete newFilters[key];
      onFiltersChange(newFilters);
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key] && filters[key] !== "all"
  ).length;

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Priority Filter */}
      {availableFilters.includes("priority") && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Priority</Label>
          <Select
            value={filters.priority || "all"}
            onValueChange={(value) => handleFilterChange("priority", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Country Filter */}
      {availableFilters.includes("country") && countries.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Country</Label>
          <Select
            value={filters.country || "all"}
            onValueChange={(value) => handleFilterChange("country", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((country) => (
                <SelectItem
                  key={country._id || country.id}
                  value={country._id || country.id}
                >
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Company Filter */}
      {availableFilters.includes("company") && companies.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Company</Label>
          <Select
            value={filters.company || "all"}
            onValueChange={(value) => handleFilterChange("company", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem
                  key={company._id || company.id}
                  value={company._id || company.id}
                >
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Brand Filter */}
      {availableFilters.includes("brand") && brands.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Brand</Label>
          <Select
            value={filters.brand || "all"}
            onValueChange={(value) => handleFilterChange("brand", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem
                  key={brand._id || brand.id}
                  value={brand._id || brand.id}
                >
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category Filter */}
      {availableFilters.includes("category") && categories.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem
                  key={category._id || category.id}
                  value={category._id || category.id}
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Type Filter */}
      {availableFilters.includes("type") && types.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Type</Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(value) => handleFilterChange("type", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((type) => (
                <SelectItem
                  key={type._id || type.id}
                  value={type._id || type.id}
                >
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Clear Filters Button */}
      {activeFilterCount > 0 && (
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onClearFilters();
              setOpen(false);
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  // Mobile/Tablet: Use Sheet (slide-in panel)
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Filter Projects</SheetTitle>
            <SheetDescription>
              Apply filters to refine your project list
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Inline filters or popover
  return (
    <div className="flex items-center gap-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px]">
          <SheetHeader>
            <SheetTitle>Filter Projects</SheetTitle>
            <SheetDescription>
              Apply filters to refine your project list
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === "all") return null;

            let displayValue = value;

            // Get display name from master data
            if (key === "country") {
              const country = countries.find(
                (c) => c._id === value || c.id === value
              );
              displayValue = country?.name || value;
            } else if (key === "company") {
              const company = companies.find(
                (c) => c._id === value || c.id === value
              );
              displayValue = company?.name || value;
            } else if (key === "brand") {
              const brand = brands.find(
                (b) => b._id === value || b.id === value
              );
              displayValue = brand?.name || value;
            } else if (key === "category") {
              const category = categories.find(
                (c) => c._id === value || c.id === value
              );
              displayValue = category?.name || value;
            } else if (key === "type") {
              const type = types.find((t) => t._id === value || t.id === value);
              displayValue = type?.name || value;
            }

            return (
              <Badge
                key={key}
                variant="secondary"
                className="pl-2 pr-1 py-1 text-xs capitalize"
              >
                {key}: {displayValue}
                <button
                  onClick={() => handleFilterChange(key, "")}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
