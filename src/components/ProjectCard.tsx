import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Calendar, Clock, Flag, User, Phone } from "lucide-react";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";
import { useState } from "react";
import { ReportModal } from "./ReportModal";

type Project = Tables<"projects"> & {
  category?: { name: string };
  subcategory?: { name: string };
  bid_count?: number;
  contract?: { id: string; status: string; provider_id: string } | null;
};

interface ProjectCardProps {
  project: Project;
  isOwner?: boolean;
}

export function ProjectCard({ project, isOwner }: ProjectCardProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const statusColors = {
    open: "bg-success/10 text-success border-success/20",
    in_progress: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-muted text-muted-foreground border-muted",
    cancelled: "bg-muted text-muted-foreground border-muted",
  };

  const formatDatePreference = () => {
    switch (project.date_preference) {
      case "asap_flexible":
        return "ASAP or Flexible";
      case "specific_date":
        return project.specific_date ? new Date(project.specific_date).toLocaleDateString() : "Specific Date";
      case "date_range":
        return "Date Range";
      default:
        return "Not specified";
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <>
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className={statusColors[project.status]}>
                {project.status.replace("_", " ")}
              </Badge>
              {project.is_expired && (
                <Badge variant="destructive">Expired</Badge>
              )}
              {isOwner && project.bid_count !== undefined && (
                <Badge variant="secondary">
                  {project.bid_count} {project.bid_count === 1 ? 'bid' : 'bids'}
                </Badge>
              )}
              {isOwner && project.contract && (
                <Badge variant="default" className="bg-accent">
                  Contract: {project.contract.status}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                setReportModalOpen(true);
              }}
              className="h-8 w-8 p-0"
            >
              <Flag className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <CardTitle className="text-xl line-clamp-2">{project.title}</CardTitle>
          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {project.category && (
              <Badge variant="secondary" className="text-xs">
                {project.category.name}
              </Badge>
            )}
            {project.subcategory && (
              <Badge variant="outline" className="text-xs">
                {project.subcategory.name}
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">NZD ${project.budget.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{project.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDatePreference()}</span>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{getTimeAgo(project.created_at)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href={`/project/${project.id}`}>View Details</Link>
          </Button>
        </CardFooter>
      </Card>

      <ReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        targetType="project"
        targetId={project.id}
        targetName={project.title}
      />
    </>
  );
}