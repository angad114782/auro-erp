import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  ChevronDown,
  Plus,
  Search,
  Factory,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import api from "../lib/api";
import { cn } from "./ui/utils";

interface Plant {
  _id: string;
  name: string;
}

interface PlantDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function PlantDropdown({
  value,
  onChange,
  disabled = false,
  placeholder = "Select plant...",
  className = "",
  error = false,
}: PlantDropdownProps) {
  const [open, setOpen] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [addingPlant, setAddingPlant] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const selectedPlant = plants.find((p) => p._id === value);

  // Fetch plants
  const fetchPlants = async () => {
    setLoading(true);
    try {
      const res = await api.get("/assign-plant");
      const items = res.data?.items || res.data?.data || [];
      setPlants(items);
    } catch (error) {
      console.error("Failed to fetch plants:", error);
      toast.error("Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setShowAddForm(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus add input when form is shown
  useEffect(() => {
    if (showAddForm && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [showAddForm]);

  const filteredPlants = plants.filter((plant) =>
    plant.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddPlant = async () => {
    if (!newPlantName.trim()) {
      toast.error("Plant name is required");
      return;
    }

    setAddingPlant(true);
    try {
      const res = await api.post("/assign-plant", {
        name: newPlantName.trim(),
      });

      if (res.status === 201 || res.status === 200) {
        toast.success("Plant added successfully");
        setNewPlantName("");
        setShowAddForm(false);
        setSearch("");

        // Refresh plants list
        await fetchPlants();

        // Select the newly added plant
        if (res.data?.data?._id) {
          onChange(res.data.data._id);
        }
      } else if (res.status === 409) {
        toast.error("Plant already exists");
      }
    } catch (error: any) {
      console.error("Failed to add plant:", error);
      if (error.response?.status === 409) {
        toast.error("Plant already exists");
      } else {
        toast.error("Failed to add plant");
      }
    } finally {
      setAddingPlant(false);
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className={cn(
          "w-full justify-between h-9 px-3",
          error && "border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
      >
        <div className="flex items-center gap-2 truncate">
          <Factory className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="truncate text-sm">
            {selectedPlant?.name || placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50 flex-shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </Button>

      {/* Dropdown Content */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Search Bar */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search plants..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowAddForm(false);
                }}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Plants List */}
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">
                  Loading plants...
                </span>
              </div>
            ) : (
              <>
                {/* Search Results */}
                {filteredPlants.length > 0 ? (
                  <>
                    {filteredPlants.map((plant) => (
                      <button
                        key={plant._id}
                        onClick={() => {
                          onChange(plant._id);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                          value === plant._id && "bg-blue-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border flex items-center justify-center",
                              value === plant._id
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            )}
                          >
                            {value === plant._id && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="text-left">{plant.name}</span>
                        </div>
                        {value === plant._id && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </button>
                    ))}
                  </>
                ) : search ? (
                  <div className="text-center py-4 px-3">
                    <div className="flex flex-col items-center gap-2">
                      <Factory className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        No plants found for "{search}"
                      </p>
                    </div>
                  </div>
                ) : plants.length === 0 ? (
                  <div className="text-center py-4 px-3">
                    <div className="flex flex-col items-center gap-2">
                      <Factory className="h-8 w-8 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        No plants available
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Add New Plant Form (Inline) */}
                {search && filteredPlants.length === 0 && (
                  <div className="border-t">
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Plus className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Add new plant
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          ref={addInputRef}
                          placeholder="Enter plant name"
                          value={newPlantName}
                          onChange={(e) => setNewPlantName(e.target.value)}
                          className="h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newPlantName.trim()) {
                              handleAddPlant();
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleAddPlant}
                          disabled={addingPlant || !newPlantName.trim()}
                          className="h-8 px-3 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                        >
                          {addingPlant ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Add"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Always show add option when no search */}
                {!search && (
                  <div className="border-t">
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full border border-dashed border-gray-400 flex items-center justify-center">
                        <Plus className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="text-blue-600">Add new plant</span>
                    </button>

                    {showAddForm && (
                      <div className="p-3 border-t">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Add new plant
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            ref={addInputRef}
                            placeholder="Enter plant name"
                            value={newPlantName}
                            onChange={(e) => setNewPlantName(e.target.value)}
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newPlantName.trim()) {
                                handleAddPlant();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={handleAddPlant}
                            disabled={addingPlant || !newPlantName.trim()}
                            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                          >
                            {addingPlant ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
