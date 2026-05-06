import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectTeaserCard } from "@/components/ProjectTeaserCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Search, Filter, Shield, LogIn, UserPlus } from "lucide-react";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import { authService } from "@/services/authService";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import Head from "next/head";

type Project = Tables<"projects">;
type Category = Tables<"categories">;
type Subcategory = Tables<"subcategories">;

const NZ_CITIES = [
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga",
  "Lower Hutt", "Dunedin", "Palmerston North", "Napier", "Porirua",
  "Hibiscus Coast", "New Plymouth", "Rotorua", "Whangarei", "Nelson",
  "Hastings", "Invercargill", "Upper Hutt", "Whanganui", "Gisborne"
];

const OWNER_EMAIL = "bluetikanz@gmail.com";

export default function Projects() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [projects, setProjects] = useState<(Project & { category?: any, subcategory?: any, bid_count?: number, contract?: any })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthentication();
    loadPublicProjects(); // Load projects for SEO even without auth
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        loadCurrentUser();
        loadCategories();
      }
      // Don't redirect - allow public view of project teasers
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setCheckingAuth(false);
    }
  };

  // Load projects for public SEO view
  const loadPublicProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        category:categories(name),
        subcategory:subcategories(name)
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCurrentUser();
      loadCategories();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authChecked && currentUser) {
      loadProjects();
    }
  }, [authChecked, currentUser]);

  // Reload projects when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    } else {
      loadPublicProjects();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (categoryFilter !== "all") {
      loadSubcategories(categoryFilter);
    } else {
      setSubcategories([]);
      setSubcategoryFilter("all");
    }
  }, [categoryFilter]);

  const loadCurrentUser = async () => {
    const session = await authService.getCurrentSession();
    const user = session?.user || null;
    setCurrentUser(user);
    setIsOwner(user?.email === OWNER_EMAIL);
    setAuthChecked(true);
  };

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
    
    if (isOwner) {
      // OWNER VIEW: Show ALL projects with bid counts and contract info
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          category:categories(name),
          subcategory:subcategories(name),
          bids(id),
          contract:contracts(id, status, provider_id)
        `)
        .order("created_at", { ascending: false });
      
      console.log("Owner view - all projects:", { count: data?.length, error });
      
      if (!error && data) {
        const projectsWithStats = data.map((p: any) => ({
          ...p,
          bid_count: Array.isArray(p.bids) ? p.bids.length : 0,
          contract: Array.isArray(p.contract) ? p.contract[0] : null
        }));
        setProjects(projectsWithStats);
      }
    } else {
      // CLIENT/PROVIDER VIEW: Only show open projects without accepted contracts
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          category:categories(name),
          subcategory:subcategories(name)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      
      console.log("User view - open projects:", { count: data?.length, error });
      
      if (!error && data) {
        // Filter out projects that have accepted contracts
        const { data: contractedProjects } = await supabase
          .from("contracts")
          .select("project_id")
          .neq("status", "cancelled");
        
        const contractedIds = new Set((contractedProjects || []).map((c: any) => c.project_id));
        const availableProjects = data.filter((p: any) => !contractedIds.has(p.id));
        
        console.log("Filtered projects (no contracts):", availableProjects.length);
        setProjects(availableProjects);
      }
    }
    
    setLoading(false);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
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
    
    return matchesSearch && matchesStatus && matchesCategory && matchesSubcategory && 
           matchesLocation && matchesBudget && matchesDate;
  });

  const isDomesticHelperCategory = categories.find(c => c.id === categoryFilter)?.name === "Domestic Helper";

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Browse Projects - BlueTika" 
        description="Find local projects in New Zealand. Service providers can bid on projects that match their skills." 
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Available Projects",
              "description": "Browse projects available for bidding on BlueTika",
              "url": "https://bluetika.co.nz/projects"
            })
          }}
        />
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="container py-8">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-4xl font-bold">Browse Projects</h1>
                  {isOwner && (
                    <Badge variant="default" className="bg-accent">
                      <Shield className="w-3 h-3 mr-1" />
                      Owner View
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">
                  {isOwner ? "Viewing all projects (testing/moderation mode)" : isAuthenticated ? "Find opportunities that match your skills" : "Login to view full details and bid on projects"}
                </p>
                {!isAuthenticated && (
                  <div className="mt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/login">
                        <LogIn className="h-4 w-4 mr-2" />
                        Login to Bid
                      </Link>
                    </Button>
                  </div>
                )}
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

                {isOwner && (
                  <div className="space-y-2">
                    <Label>Status (Owner Only)</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                    setStatusFilter("all");
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
                {filteredProjects.map(project => 
                  isAuthenticated 
                    ? <ProjectCard key={project.id} project={project} isOwner={isOwner} />
                    : <ProjectTeaserCard key={project.id} project={project} />
                )}
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}