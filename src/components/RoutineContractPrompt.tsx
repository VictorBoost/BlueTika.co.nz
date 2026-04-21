import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CalendarIcon, Clock, Users } from "lucide-react";
import { routineContractService } from "@/services/routineContractService";
import { sendRoutineContractInvitation } from "@/services/sesEmailService";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RoutineContractPromptProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  projectId: string;
  clientId: string;
  providerId: string;
  clientName: string;
  providerName: string;
  projectTitle: string;
  userRole: "client" | "provider";
  isDomesticHelper: boolean;
}

export function RoutineContractPrompt({
  isOpen,
  onClose,
  contractId,
  projectId,
  clientId,
  providerId,
  clientName,
  providerName,
  projectTitle,
  userRole,
  isDomesticHelper
}: RoutineContractPromptProps) {
  const [frequency, setFrequency] = useState<"weekly" | "fortnightly" | "monthly" | "custom">("weekly");
  const [customDays, setCustomDays] = useState<number>(7);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherPartyName = userRole === "client" ? providerName : clientName;
  const otherPartyId = userRole === "client" ? providerId : clientId;

  const daysOfWeek = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    if (!startDate) {
      toast({
        title: "Start Date Required",
        description: "Please select a start date for the routine.",
        variant: "destructive"
      });
      return;
    }

    if (isDomesticHelper && selectedDays.length === 0) {
      toast({
        title: "Days Required",
        description: "Please select at least one day of the week.",
        variant: "destructive"
      });
      return;
    }

    if (frequency === "custom" && customDays < 1) {
      toast({
        title: "Invalid Custom Days",
        description: "Please enter a valid number of days (minimum 1).",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create routine contract
      const { data: routine, error } = await routineContractService.createRoutineContract({
        contract_id: contractId,
        client_id: clientId,
        provider_id: providerId,
        project_id: projectId,
        frequency,
        custom_days: frequency === "custom" ? customDays : undefined,
        start_date: startDate.toISOString().split("T")[0],
        selected_days: isDomesticHelper ? selectedDays : undefined,
      });

      if (error) throw error;

      // Record this party's agreement
      await routineContractService.recordAgreement(routine.id, userRole);

      // Send invitation email to other party
      const { data: otherPartyProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", otherPartyId)
        .single();

      if (otherPartyProfile) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://bluetika.co.nz";
        await sendRoutineContractInvitation(
          otherPartyProfile.email,
          otherPartyProfile.full_name || "there",
          userRole === "client" ? "provider" : "client",
          userRole === "client" ? clientName : providerName,
          projectTitle,
          routine.id,
          baseUrl
        );
      }

      toast({
        title: "Routine Setup Initiated",
        description: `We've sent an invitation to ${otherPartyName}. Once they agree, your routine will be active.`
      });

      onClose();
    } catch (error) {
      console.error("Error setting up routine:", error);
      toast({
        title: "Setup Failed",
        description: "Could not set up routine contract. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Up Routine Arrangement</DialogTitle>
          <DialogDescription>
            Would you like to set up a routine arrangement with {otherPartyName}? Perfect for regular services — saves you time and keeps things sorted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Frequency Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Frequency
            </Label>
            <RadioGroup value={frequency} onValueChange={(value: any) => setFrequency(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal cursor-pointer">Weekly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fortnightly" id="fortnightly" />
                <Label htmlFor="fortnightly" className="font-normal cursor-pointer">Fortnightly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">Custom</Label>
              </div>
            </RadioGroup>

            {frequency === "custom" && (
              <div className="ml-6 flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days between sessions</span>
              </div>
            )}
          </div>

          {/* Days of Week (Domestic Helper only) */}
          {isDomesticHelper && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Which days of the week?
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {daysOfWeek.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={() => handleDayToggle(day.value)}
                    />
                    <Label htmlFor={day.value} className="font-normal cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Date */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Start Date
            </Label>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Summary */}
          {startDate && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Summary</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {frequency.charAt(0).toUpperCase() + frequency.slice(1)} sessions</li>
                {isDomesticHelper && selectedDays.length > 0 && (
                  <li>• {selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</li>
                )}
                <li>• Starting {startDate.toLocaleDateString("en-NZ")}</li>
                <li>• 48-hour reminders before each session</li>
                <li>• Add to Google Calendar (optional)</li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Not Now
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Setting Up..." : "Set Up Routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}