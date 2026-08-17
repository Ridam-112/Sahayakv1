import React, { useState } from "react";
import {
  FileText,
  Printer,
  Copy,
  Check,
  Download,
  Shield,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { Scheme, CitizenProfile } from "../types";

interface ApplicationSummaryModalProps {
  scheme: Scheme;
  profile: CitizenProfile;
  onClose: () => void;
}

export const ApplicationSummaryModal: React.FC<ApplicationSummaryModalProps> = ({
  scheme,
  profile,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const summaryText = `SAHAYAK CITIZEN SCHEME APPLICATION DOSSIER
===========================================
Scheme: ${scheme.name} (${scheme.fullName})
Official Portal: ${scheme.officialUrl}
Generated On: ${new Date().toLocaleDateString("en-IN")}
Status: Pre-filled via Sahayak DPI Gateway

APPLICANT DETAILS:
- Full Name: ${profile.name || "Bikash Mondal"}
- Age: ${profile.age} Years
- State / UT: ${profile.state}
- Occupation: ${profile.occupation}
- Social Category: ${profile.socialCategory}
- Gender: ${profile.gender}
- Annual Income: ₹${profile.income}
- Cultivable Landholding: ${profile.ownsLand ? `Yes (${profile.landSizeAcres || "1.2"} Acres)` : "No"}

VERIFICATION CREDENTIALS:
- Aadhaar UID: ${profile.aadhaarNumber || "Linked in Vault"}
- Primary Bank DBT Account: ${profile.bankAccountNumber || "SBIN00481923891"}
- Land Parcel ID / Khatian: ${profile.landParcelId || "WB-BURD-412/A"}
===========================================
Please present this summary at your local Common Service Center (CSC) or upload it to the official portal.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Filled Application Summary
              </h3>
              <p className="text-[10px] text-slate-500">
                Official Sahayak DPI Dossier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Top verified badge */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-indigo-600" />
              <div>
                <div className="font-bold text-slate-900">{scheme.name}</div>
                <div className="text-[11px] text-slate-600">
                  Direct Income Support: ₹6,000/yr
                </div>
              </div>
            </div>
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-slate-900" />
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            <div className="bg-slate-50 px-3 py-2 font-bold text-slate-900 text-[11px] uppercase tracking-wider">
              Citizen Record
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="text-slate-500">Applicant Name</span>
              <span className="font-semibold text-slate-800">
                {profile.name || "Bikash Mondal"}
              </span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="text-slate-500">Age / Gender</span>
              <span className="font-semibold text-slate-800">
                {profile.age} Yrs / {profile.gender}
              </span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="text-slate-500">State / Region</span>
              <span className="font-semibold text-slate-800">{profile.state}</span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="text-slate-500">Occupation</span>
              <span className="font-semibold text-slate-800">
                {profile.occupation}
              </span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="text-slate-500">Annual Income</span>
              <span className="font-semibold text-slate-800">
                ₹{profile.income}
              </span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="text-slate-500">DBT Bank Account</span>
              <span className="font-mono text-emerald-700 font-semibold">
                {profile.bankAccountNumber || "SBIN00481923891"}
              </span>
            </div>
            <div className="p-2.5 flex justify-between">
              <span className="text-slate-500">Land Record (Patta/Khatian)</span>
              <span className="font-mono text-slate-800 font-semibold">
                {profile.landParcelId || "WB-BURD-412/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50 rounded-b-2xl">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-100 cursor-pointer transition-all shadow-2xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? "Copied" : "Copy Dossier"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-indigo-700 cursor-pointer transition-all shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
