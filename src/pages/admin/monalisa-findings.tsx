import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Finding {
  id: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  evidence: any;
  suggested_fix: string;
  status: string;
  detected_at: string;
  related_user?: { full_name: string; email: string };
  related_contract?: { final_amount: number; status: string };
}

export default function MonaLisaFindings() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    severity: "",
    category: "",
    status: "detected",
  });

  useEffect(() => {
    fetchFindings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchFindings = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.severity) params.set("severity", filter.severity);
    if (filter.category) params.set("category", filter.category);
    if (filter.status) params.set("status", filter.status);

    const response = await fetch(`/api/monalisa-findings?${params}`);
    const data = await response.json();
    if (data.success) {
      setFindings(data.findings);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "payment_bypass": return "💰";
      case "loophole": return "🔍";
      case "error_pattern": return "⚠️";
      case "anticipated_problem": return "🔮";
      default: return "📋";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">MonaLisa Error Findings</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="">All Categories</option>
              <option value="payment_bypass">Payment Bypass</option>
              <option value="loophole">Loophole</option>
              <option value="error_pattern">Error Pattern</option>
              <option value="anticipated_problem">Anticipated Problem</option>
            </select>
            
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="border rounded px-3 py-2"
            >
              <option value="detected">Detected</option>
              <option value="investigating">Investigating</option>
              <option value="fixing">Fixing</option>
              <option value="resolved">Resolved</option>
              <option value="">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Findings List */}
        {loading ? (
          <div className="text-center py-12">Loading findings...</div>
        ) : findings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No findings found</div>
        ) : (
          <div className="space-y-4">
            {findings.map((finding) => (
              <div key={finding.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getCategoryIcon(finding.category)}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{finding.title}</h3>
                      <p className="text-gray-600 mt-1">{finding.description}</p>
                      
                      {finding.evidence && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm text-gray-500">View Evidence</summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(finding.evidence, null, 2)}
                          </pre>
                        </details>
                      )}
                      
                      {finding.suggested_fix && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <strong className="text-blue-800">Suggested Fix:</strong>
                          <p className="text-blue-700 mt-1">{finding.suggested_fix}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(finding.severity)}`}>
                      {finding.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(finding.detected_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {finding.related_user && (
                  <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                    User: {finding.related_user.full_name} ({finding.related_user.email})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}