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
  countries: any[];
  companies?: any[];
  brands?: any[];
  categories?: any[];
  types?: any[];

  filters: {
    country?: string;
    priority?: string;
    company?: string;
    brand?: string;
    category?: string;
    type?: string;
  };

  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;

  availableFilters?: string[];
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
      const next = { ...filters };
      delete next[key];
      onFiltersChange(next);
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key] && filters[key] !== "all"
  ).length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Priority */}
      {availableFilters.includes("priority") && (
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={filters.priority || "all"}
            onValueChange={(v) => handleFilterChange("priority", v)}
          >
            <SelectTrigger>
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

      {/* Country */}
      {availableFilters.includes("country") && countries.length > 0 && (
        <div className="space-y-2">
          <Label>Country</Label>
          <Select
            value={filters.country || "all"}
            onValueChange={(v) => handleFilterChange("country", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c._id || c.id} value={c._id || c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Company */}
      {availableFilters.includes("company") && companies.length > 0 && (
        <div className="space-y-2">
          <Label>Company</Label>
          <Select
            value={filters.company || "all"}
            onValueChange={(v) => handleFilterChange("company", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c._id || c.id} value={c._id || c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Brand */}
      {availableFilters.includes("brand") && brands.length > 0 && (
        <div className="space-y-2">
          <Label>Brand</Label>
          <Select
            value={filters.brand || "all"}
            onValueChange={(v) => handleFilterChange("brand", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b._id || b.id} value={b._id || b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category */}
      {availableFilters.includes("category") && categories.length > 0 && (
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(v) => handleFilterChange("category", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id || c.id} value={c._id || c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Type */}
      {availableFilters.includes("type") && types.length > 0 && (
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={filters.type || "all"}
            onValueChange={(v) => handleFilterChange("type", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t._id || t.id} value={t._id || t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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

  /* ===================== MOBILE / SHEET ===================== */

  return (
    <div className="flex items-center gap-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-[320px] sm:w-[400px] p-6">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>Filter Projects</SheetTitle>
            <SheetDescription>
              Apply filters to refine your project list
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || value === "all") return null;
            return (
              <Badge key={key} variant="secondary" className="text-xs">
                {key}: {value}
                <button
                  onClick={() => handleFilterChange(key, "")}
                  className="ml-1 p-0.5"
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
