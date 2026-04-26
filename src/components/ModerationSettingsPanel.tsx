import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  getModerationSettings,
  updateModerationSetting,
  getPendingReviewCount,
  getPendingByType,
  type ContentType,
  type ModerationSettings,
} from "@/services/moderationSettingsService";
import { Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface ContentTypeConfig {
  key: ContentType;
  label: string;
  description: string;
  defaultAuto: boolean;
  locked: boolean;
  lockReason?: string;
}

const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    key: "project_listing",
    label: "New Project Listings",
    description: "Client project submissions",
    defaultAuto: true,
    locked: false,
  },
  {
    key: "profile_photo",
    label: "Profile Photos",
    description: "User profile images",
    defaultAuto: true,
    locked: false,
  },
  {
    key: "driver_licence",
    label: "NZ Driver Licence Uploads",
    description: "Provider verification documents",
    defaultAuto: false,
    locked: true,
    lockReason: "Must always be reviewed manually for compliance and legal verification",
  },
  {
    key: "police_check",
    label: "Police Check Uploads",
    description: "Domestic Helper background checks",
    defaultAuto: false,
    locked: true,
    lockReason: "Must always be reviewed manually for safety and compliance",
  },
  {
    key: "trade_certificate",
    label: "Trade Certificate Uploads",
    description: "Professional qualification documents",
    defaultAuto: false,
    locked: true,
    lockReason: "Must always be reviewed manually for professional verification",
  },
  {
    key: "project_media",
    label: "Client Project Photos & Videos",
    description: "Media attached to project listings",
    defaultAuto: true,
    locked: false,
  },
  {
    key: "chat_message",
    label: "Chat Messages",
    description: "In-platform messaging between users",
    defaultAuto: true,
    locked: false,
  },
  {
    key: "review",
    label: "Reviews",
    description: "User reviews and ratings",
    defaultAuto: true,
    locked: false,
  },
  {
    key: "bot_content",
    label: "Bot Content",
    description: "Automated content detection",
    defaultAuto: true,
    locked: false,
  },
];

export function ModerationSettingsPanel() {
  const [settings, setSettings] = useState<ModerationSettings | null>(null);
  const [pendingCounts, setPendingCounts] = useState<Record<ContentType, number>>({} as Record<ContentType, number>);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const [settingsData, total] = await Promise.all([
        getModerationSettings(),
        getPendingReviewCount(),
      ]);

      setSettings(settingsData);
      setTotalPending(total);

      // Load pending counts for each type
      const counts: Record<string, number> = {};
      await Promise.all(
        CONTENT_TYPES.map(async (type) => {
          const count = await getPendingByType(type.key);
          counts[type.key] = count;
        })
      );
      setPendingCounts(counts as Record<ContentType, number>);
    } catch (error) {
      console.error("Failed to load moderation settings:", error);
      toast({
        title: "Error",
        description: "Failed to load moderation settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(contentType: ContentType, newValue: boolean) {
    try {
      console.log(`🔄 Toggling ${contentType} to ${newValue ? "auto-approve" : "manual review"}`);
      
      const result = await updateModerationSetting(contentType, newValue);

      if (!result.success) {
        console.error("❌ Toggle failed:", result.error);
        toast({
          title: "Cannot Change Setting",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Toggle successful");
      
      setSettings((prev) => {
        if (!prev) return prev;
        return { ...prev, [contentType]: newValue };
      });

      toast({
        title: "Setting Updated",
        description: `${contentType.replace(/_/g, " ")} is now ${newValue ? "auto-approve" : "manual review"}`,
      });

      // Reload pending counts
      await loadSettings();
    } catch (error) {
      console.error("❌ Failed to update setting:", error);
      toast({
        title: "Error",
        description: "Failed to update moderation setting",
        variant: "destructive",
      });
    }
  }

  if (loading || !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Moderation Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Moderation Settings
              </CardTitle>
              <CardDescription>
                Control automatic approval vs manual review for different content types
              </CardDescription>
            </div>
            {totalPending > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {totalPending} pending review
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              When set to <strong>manual review</strong>, new submissions will be queued and require admin approval before becoming active.
              Admin and staff will be notified of items awaiting review.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {CONTENT_TYPES.map((type) => {
              const isAuto = settings[type.key];
              const pendingCount = pendingCounts[type.key] || 0;

              return (
                <div
                  key={type.key}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={type.key} className="text-base font-semibold">
                        {type.label}
                      </Label>
                      {type.locked && (
                        <Badge variant="secondary" className="text-xs">
                          Fixed
                        </Badge>
                      )}
                      {pendingCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {pendingCount} pending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                    {type.locked && type.lockReason && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        {type.lockReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        {isAuto ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Auto-approve</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-amber-600" />
                            <span className="text-amber-600">Manual review</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isAuto ? "Automatic approval" : "Requires review"}
                      </p>
                    </div>
                    <Switch
                      id={type.key}
                      checked={isAuto}
                      onCheckedChange={(checked) => handleToggle(type.key, checked)}
                      disabled={type.locked}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}