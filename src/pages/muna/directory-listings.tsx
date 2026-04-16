import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Star, StarOff, Trash2, ExternalLink, Shield, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  getAllDirectoryListings,
  updateDirectoryListing,
  deleteDirectoryListing,
  type ListingWithCategory,
} from "@/services/directoryService";
import { getDirectoryAnalytics } from "@/services/directoryAnalyticsService";

export default function DirectoryListingsAdmin() {
  const router = useRouter();
  const { toast } = useToast();
  const [listings, setListings] = useState<ListingWithCategory[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, { clicks: number; conversions: number; rate: number }>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", session.session.user.id)
      .single();

    if (!profile?.email?.endsWith("@bluetika.co.nz")) {
      router.push("/");
      return;
    }

    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    const { data: listingsData } = await getAllDirectoryListings();
    if (listingsData) {
      setListings(listingsData);
    }

    const { data: analyticsData } = await getDirectoryAnalytics();
    if (analyticsData) {
      const analyticsMap: Record<string, { clicks: number; conversions: number; rate: number }> = {};
      analyticsData.forEach((item) => {
        analyticsMap[item.listing_id] = {
          clicks: item.total_clicks,
          conversions: item.conversions,
          rate: item.conversion_rate,
        };
      });
      setAnalytics(analyticsMap);
    }

    setLoading(false);
  };

  const toggleFeatured = async (id: string, currentStatus: boolean) => {
    const { error } = await updateDirectoryListing(id, { featured: !currentStatus });
    if (error) {
      toast({ title: "Error", description: "Failed to update listing", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: `Listing ${!currentStatus ? "featured" : "unfeatured"}` });
    loadData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteDirectoryListing(id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete listing", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Listing deleted" });
    setDeleteTarget(null);
    loadData();
  };

  const handleBulkDelete = async () => {
    const deletePromises = Array.from(selectedIds).map((id) => deleteDirectoryListing(id));
    await Promise.all(deletePromises);
    toast({ title: "Success", description: `${selectedIds.size} listings deleted` });
    setSelectedIds(new Set());
    loadData();
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const filteredListings = listings.filter((listing) =>
    listing.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Directory Listings</h1>
            <p className="text-muted-foreground mt-1">Manage business directory listings</p>
          </div>
          <Button onClick={() => router.push("/muna")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Listings ({listings.length})</CardTitle>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by business name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedIds.size > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedIds.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredListings.length && filteredListings.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds(new Set(filteredListings.map((l) => l.id)));
                        } else {
                          setSelectedIds(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Analytics</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No listings found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredListings.map((listing) => {
                    const stats = analytics[listing.id] || { clicks: 0, conversions: 0, rate: 0 };
                    const isSilverPlus = listing.profiles?.verification_tier && 
                      ["silver", "gold", "platinum"].includes(listing.profiles.verification_tier);

                    return (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(listing.id)}
                            onCheckedChange={() => toggleSelection(listing.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{listing.business_name}</div>
                          <div className="text-sm text-muted-foreground">{listing.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {listing.directory_categories?.name || "Uncategorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>{listing.city}</TableCell>
                        <TableCell>
                          {listing.provider_id ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {listing.profiles?.full_name || "Unknown"}
                              </Badge>
                              {isSilverPlus && (
                                <Shield className="w-4 h-4 text-success" title="Silver+ Provider" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No provider</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{stats.clicks} clicks</div>
                            <div className="text-muted-foreground">
                              {stats.conversions} conversions ({stats.rate.toFixed(1)}%)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {listing.featured && (
                            <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/directory/${listing.slug}`, "_blank")}
                              title="View listing"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleFeatured(listing.id, listing.featured)}
                              title={listing.featured ? "Unfeature" : "Feature"}
                            >
                              {listing.featured ? (
                                <StarOff className="w-4 h-4" />
                              ) : (
                                <Star className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(listing.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this directory listing. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}