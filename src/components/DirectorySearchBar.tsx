import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import type { DirectoryCategory } from "@/services/directoryCategoryService";

interface DirectorySearchBarProps {
  categories: DirectoryCategory[];
  onSearch: (params: {
    keyword: string;
    categoryId: string;
    city: string;
  }) => void;
}

const NZ_CITIES = [
  "Auckland",
  "Wellington",
  "Christchurch",
  "Hamilton",
  "Tauranga",
  "Dunedin",
  "Palmerston North",
  "Nelson",
  "Rotorua",
  "New Plymouth",
  "Napier",
  "Invercargill",
  "Whangarei",
  "Gisborne",
];

export function DirectorySearchBar({ categories, onSearch }: DirectorySearchBarProps) {
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [city, setCity] = useState("");

  const handleSearch = () => {
    onSearch({ keyword, categoryId, city });
  };

  const handleClear = () => {
    setKeyword("");
    setCategoryId("");
    setCity("");
    onSearch({ keyword: "", categoryId: "", city: "" });
  };

  const hasFilters = keyword || categoryId || city;

  return (
    <div className="w-full bg-card border rounded-lg p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Search businesses..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="w-full"
          />
        </div>

        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={city} onValueChange={setCity}>
          <SelectTrigger>
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Cities</SelectItem>
            {NZ_CITIES.map((cityName) => (
              <SelectItem key={cityName} value={cityName}>
                {cityName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSearch} className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          Search
        </Button>
        {hasFilters && (
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}