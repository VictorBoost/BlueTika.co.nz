import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Info } from "lucide-react";
import { getProviderTierStatus } from "@/services/commissionService";
import type { ProviderTierStatus } from "@/services/commissionService";

interface TierProgressCardProps {
  providerId: string;
}

export function TierProgressCard({ providerId }: TierProgressCardProps) {
  const [status, setStatus] = useState<ProviderTierStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTierStatus() {
      try {
        const data = await getProviderTierStatus(providerId);
        setStatus(data);
      } catch (error) {
        console.error("Error loading tier status:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTierStatus();
  }, [providerId]);

  if (loading || !status) {
    return null;
  }

  const { currentTier, sales60Day, nextTier, amountToNextTier, progressPercent, message, warningDaysLeft } = status;

  return (
    <Card className="p-6 bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{currentTier.displayName}</h3>
                {currentTier.isPromo && (
                  <Badge variant="destructive" className="text-xs px-1.5 py-0">
                    PROMO
                  </Badge>
                )}
                {/* Small tier drop warning badge - subtle and informative */}
                {warningDaysLeft !== null && warningDaysLeft <= 7 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">
                    <Info className="w-3 h-3 mr-1" />
                    Tier renewal soon
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Commission: {currentTier.currentRate}%
                {currentTier.isPromo && currentTier.standardRate !== currentTier.currentRate && (
                  <span className="ml-1 line-through opacity-60">{currentTier.standardRate}%</span>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">${sales60Day.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">60-day sales</div>
          </div>
        </div>

        {/* Progress Bar */}
        {nextTier && (
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current: {currentTier.displayName}</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                ${amountToNextTier.toFixed(0)} to {nextTier.displayName}
              </span>
            </div>
          </div>
        )}

        {/* Encouragement Message - always subtle blue/green tone */}
        <div className="p-3 rounded-md bg-accent/10 border border-accent/20">
          <p className="text-sm text-accent-foreground">{message}</p>
        </div>
      </div>
    </Card>
  );
}