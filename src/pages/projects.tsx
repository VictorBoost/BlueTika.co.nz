import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { projectService } from "@/services/projectService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;
type Category = Tables<"categories">;
type Subcategory = Tables<"subcategories">;

const NZ_CITIES = [
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga",
  "Lower Hutt", "Dunedin", "Palmerston North", "Napier", "Porirua",
  "Hibiscus Coast", "New Plymouth", "Rotorua", "Whangarei", "Nelson",
  "Hastings", "Invercargill", "Upper Hutt", "Whanganui", "Gisborne"
];

export default function Projects() {
  const [projects, setProjects] = useState<(Project & { bid_count: number })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "completed">("open");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    loadCategories();
    loadProjects();
  }, [statusFilter]);

  useEffect(() => {
    if (categoryFilter !== "all") {
      loadSubcategories(categoryFilter);
    } else {
      setSubcategories([]);
      setSubcategoryFilter("all");
    }
  }, [categoryFilter]);

  const loadCategories = async () => {
    const { data } = await categoryService.getAllCategories();
    if (data) {
      setCategories(data);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    const { data } = await subcategoryService.getSubcategoriesByCategory(categoryId);
    if (data) {
      setSubcategories(data);
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    const { data, error } = await projectService.getAllProjects(
      statusFilter === "all" ? undefined : statusFilter
    );
    
    if (!error && data) {
      const projectsWithBidCount = data.map((project: any) => ({
        ...project,
        bid_count: project.bids ? project.bids.length : 0
      }));
      setProjects(projectsWithBidCount);
    }
    setLoading(false);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || p.category_id === categoryFilter;
    const matchesSubcategory = subcategoryFilter === "all" || p.subcategory_id === subcategoryFilter;
    const matchesLocation = locationFilter === "all" || p.location === locationFilter;
    
    const matchesBudget = 
      (budgetMin === "" || p.budget >= parseFloat(budgetMin)) &&
      (budgetMax === "" || p.budget <= parseFloat(budgetMax));
    
    let matchesDate = true;
    if (dateFilter !== "all" && p.date_preference) {
      matchesDate = p.date_preference === dateFilter;
    }
    
    return matchesSearch && matchesCategory && matchesSubcategory && 
           matchesLocation && matchesBudget && matchesDate;
  });

  const isDomesticHelperCategory = categories.find(c => c.id === categoryFilter)?.name === "Domestic Helper";

  return (
    <>
      <SEO 
        title="Browse Projects - BlueTika" 
        description="Find local projects in New Zealand. Service providers can bid on projects that match their skills." 
      />
      
      <div className="min-h-screen flex flex-col">
        <div className="container py-8">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Browse Projects</h1>
                <p className="text-muted-foreground">Find opportunities that match your skills</p>
              </div>
              <Button asChild size="lg">
                <Link href="/post-project">
                  <Plus className="mr-2 h-5 w-5" />
                  Post a Project
                </Link>
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects by title, description, or location..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters */}
            <div className="bg-muted/50 p-6 rounded-lg border">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Filters</h3>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isDomesticHelperCategory && subcategories.length > 0 && (
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Services" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Services</SelectItem>
                        {subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {NZ_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Budget Range (NZD)</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="Min" 
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                    />
                    <Input 
                      type="number" 
                      placeholder="Max" 
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date Preference</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Date</SelectItem>
                      <SelectItem value="asap_flexible">ASAP or Flexible</SelectItem>
                      <SelectItem value="specific_date">Specific Date</SelectItem>
                      <SelectItem value="date_range">Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={(v: typeof statusFilter) => setStatusFilter(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("all");
                    setSubcategoryFilter("all");
                    setLocationFilter("all");
                    setBudgetMin("");
                    setBudgetMax("");
                    setDateFilter("all");
                    setSearchTerm("");
                  }}
                >
                  Clear Filters
                </Button>
                <div className="text-sm text-muted-foreground flex items-center ml-auto">
                  Showing {filteredProjects.length} of {projects.length} projects
                </div>
              </div>
            </div>

            {/* Project Grid */}
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-4">No projects found matching your filters</p>
                <Button asChild>
                  <Link href="/post-project">Post the first project</Link>
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}