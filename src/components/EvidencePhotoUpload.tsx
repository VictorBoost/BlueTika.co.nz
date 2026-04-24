import { useState, useEffect } from "react";
import { Upload, X, AlertTriangle, CheckCircle, Clock, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  uploadPhotoToStorage,
  deletePhotoFromStorage,
  uploadEvidencePhotos,
  confirmEvidencePhotos,
  type PhotoType,
  type UploaderRole,
  type EvidencePhotoStatus
} from "@/services/evidencePhotoService";

interface EvidencePhotoUploadProps {
  contractId: string;
  photoType: PhotoType;
  uploaderRole: UploaderRole;
  currentPhotos: string[];
  currentStatus: EvidencePhotoStatus;
  otherPartyStatus: EvidencePhotoStatus;
  onUpdate: () => void;
}

export function EvidencePhotoUpload({
  contractId,
  photoType,
  uploaderRole,
  currentPhotos,
  currentStatus,
  otherPartyStatus,
  onUpdate
}: EvidencePhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(currentPhotos);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isConfirmed = currentStatus === "confirmed";
  const otherPartyName = uploaderRole === "client" ? "Service Provider" : "Client";
  const photoTypeLabel = photoType === "before" ? "Before" : "After";

  useEffect(() => {
    setPhotos(currentPhotos);
  }, [currentPhotos]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isConfirmed) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const newPhotoUrls = await Promise.all(
        files.map(file => uploadPhotoToStorage(file, contractId, photoType, uploaderRole))
      );

      const updatedPhotos = [...photos, ...newPhotoUrls];
      setPhotos(updatedPhotos);

      await uploadEvidencePhotos({
        contract_id: contractId,
        photo_type: photoType,
        uploader_role: uploaderRole,
        photo_urls: updatedPhotos
      });

      onUpdate();
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    if (isConfirmed) return;

    try {
      await deletePhotoFromStorage(photoUrl);

      const updatedPhotos = photos.filter(p => p !== photoUrl);
      setPhotos(updatedPhotos);

      await uploadEvidencePhotos({
        contract_id: contractId,
        photo_type: photoType,
        uploader_role: uploaderRole,
        photo_urls: updatedPhotos
      });

      onUpdate();
    } catch (error) {
      console.error("Error removing photo:", error);
      alert("Failed to remove photo. Please try again.");
    }
  };

  const handleConfirm = async () => {
    if (photos.length === 0) {
      alert("Please upload at least one photo before confirming.");
      return;
    }

    if (!confirm(`Are you sure you want to confirm these ${photoTypeLabel.toLowerCase()} photos? They will be permanently locked and cannot be changed.`)) {
      return;
    }

    setConfirming(true);

    try {
      await confirmEvidencePhotos(contractId, photoType, uploaderRole);
      onUpdate();
    } catch (error) {
      console.error("Error confirming photos:", error);
      alert("Failed to confirm photos. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const getStatusBadge = (status: EvidencePhotoStatus) => {
    switch (status) {
      case "not_uploaded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
            <Clock className="w-3 h-3" />
            Not Uploaded
          </span>
        );
      case "uploaded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-600">
            <AlertTriangle className="w-3 h-3" />
            Awaiting Confirmation
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-success/10 text-success">
            <CheckCircle className="w-3 h-3" />
            Confirmed
          </span>
        );
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your {photoTypeLabel} Photos</h3>
          <p className="text-sm text-muted-foreground">
            {isConfirmed ? "Photos confirmed and locked" : "Upload and confirm your photos"}
          </p>
        </div>
        {getStatusBadge(currentStatus)}
      </div>

      {!isConfirmed && (
        <Alert className="border-yellow-500/50 bg-yellow-500/5">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> Photos can be changed until you click Confirm. Once confirmed they are permanently locked for guarantee and dispute purposes. This protects both parties.
          </AlertDescription>
        </Alert>
      )}

      {photoType === "after" && uploaderRole === "provider" && (
        <Alert className="border-accent bg-accent/5 mb-4">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-sm">
            <strong>24-Hour Dispute Window:</strong> Once you confirm these 'After' photos, the client has exactly 24 hours to review and raise any disputes. After 24 hours, the payment is considered earned and will be released on Friday.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        {photos.map((photoUrl, index) => (
          <div key={index} className="relative group">
            <img
              src={photoUrl}
              alt={`${photoTypeLabel} photo ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg border"
            />
            {!isConfirmed && (
              <button
                onClick={() => handleRemovePhoto(photoUrl)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!isConfirmed && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={uploading}
            onClick={() => document.getElementById(`photo-upload-${photoType}-${uploaderRole}`)?.click()}
          >
            <Camera className="w-4 h-4 mr-2" />
            {uploading ? "Uploading..." : "Add Photos"}
          </Button>
          <input
            id={`photo-upload-${photoType}-${uploaderRole}`}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          {photos.length > 0 && (
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={confirming}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {confirming ? "Confirming..." : "Confirm & Lock Photos"}
            </Button>
          )}
        </div>
      )}

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{otherPartyName} Status:</span>
          {getStatusBadge(otherPartyStatus)}
        </div>
      </div>
    </Card>
  );
}