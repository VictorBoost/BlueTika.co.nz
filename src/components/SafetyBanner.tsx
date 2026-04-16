import { AlertTriangle } from "lucide-react";

export function SafetyBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900 mb-1">
            Platform Protection
          </h4>
          <p className="text-sm text-blue-800">
            All communication and payments must go through BlueTika. This protects your money and your BlueTika Guarantee.
          </p>
        </div>
      </div>
    </div>
  );
}