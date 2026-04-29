import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Edit, Trash2, Save } from "lucide-react";

interface DirectoryCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  created_at: string;
}

export default function DirectoryCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<DirectoryCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<DirectoryCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    display_order: 0,
  });

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const response = await fetch("/api/auth/verify-admin", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.status === 401) {
        router.push("/muna/login");
        return;
      }

      if (response.status === 403 || !data.isAdmin) {
        router.push("/muna");
        return;
      }

      loadCategories();
    } catch (error) {
      console.error("Access check failed:", error);
      router.push("/muna");
    }
  }

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from("directory_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading categories",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      display_order: categories.length,
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(category: DirectoryCategory) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      display_order: category.display_order,
    });
    setIsDialogOpen(true);
  }

  async function handleSave() {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("directory_categories")
          .update(formData)
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast({ title: "Category updated successfully" });
      } else {
        const { error } = await supabase
          .from("directory_categories")
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Category created successfully" });
      }

      setIsDialogOpen(false);
      loadCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase
        .from("directory_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Category deleted successfully" });
      loadCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <>
        <SEO title="Directory Categories" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Directory Categories" />
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.push("/muna")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Control Centre
            </Button>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Directory Categories</h1>
              <p className="text-muted-foreground mt-2">Manage service provider directory categories</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Create Category"}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? "Update category details" : "Add a new directory category"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Plumbers"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                      placeholder="e.g., plumbers"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this category"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    />
                  </div>

                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {editingCategory ? "Update" : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Categories</CardTitle>
              <CardDescription>{categories.length} categories</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                      <TableCell>{category.display_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}