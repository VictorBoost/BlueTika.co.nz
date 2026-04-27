import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as LucideIcons from "lucide-react";

interface ProviderBadgeProps {
  achievementBadge?: any; // Achievement badges from badgeService
  verificationTier?: string | null;
  verificationStatus?: string | null;
  commissionTier?: string | null;
}

export function ProviderBadge({ achievementBadge, verificationTier, verificationStatus, commissionTier }: ProviderBadgeProps) {
  // 1. Render achievement badges if achievementBadge object is passed
  if (achievementBadge) {
    const IconComponent = (LucideIcons as any)[achievementBadge.icon || "Award"] || LucideIcons.Award;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 cursor-default">
              <IconComponent className="h-3 w-3" />
              {achievementBadge.name}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{achievementBadge.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 2. Render Verification and Commission Tiers next to the name
  if (!verificationTier && !commissionTier) {
    return null;
  }

  const tierColors: Record<string, string> = {
    Bronze: "bg-amber-700 text-white hover:bg-amber-800",
    Silver: "bg-slate-400 text-slate-900 hover:bg-slate-500",
    Gold: "bg-yellow-500 text-yellow-950 hover:bg-yellow-600",
    Platinum: "bg-purple-600 text-white hover:bg-purple-700",
  };

  const commissionTierColors: Record<string, string> = {
    bronze: "bg-amber-700 text-white hover:bg-amber-800",
    silver: "bg-slate-400 text-slate-900 hover:bg-slate-500",
    gold: "bg-yellow-500 text-yellow-950 hover:bg-yellow-600",
    platinum: "bg-purple-600 text-white hover:bg-purple-700",
  };

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {verificationTier && verificationStatus === "verified" && (
        <Badge className={tierColors[verificationTier] || "bg-primary text-primary-foreground"}>
          ✓ {verificationTier}
        </Badge>
      )}
      {commissionTier && commissionTier !== 'no_tier' && (
        <Badge className={commissionTierColors[commissionTier.toLowerCase()] || "bg-muted"}>
          {commissionTier.charAt(0).toUpperCase() + commissionTier.slice(1)}
        </Badge>
      )}
    </div>
  );
}