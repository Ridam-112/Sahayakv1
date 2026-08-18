import React, { useState } from "react";
import {
  FolderLock,
  Plus,
  ShieldCheck,
  CreditCard,
  FileText,
  Landmark,
  CheckCircle2,
  Clock,
  ExternalLink,
  Upload,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  VaultDocument,
  LanguageCode,
  NavTab,
  CitizenProfile,
  ActiveVaultApplication,
  Scheme,
} from "../types";
import { INITIAL_VAULT_DOCS } from "../data/mockData";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface MyVaultProps {
  profile: CitizenProfile;
  activeApplications: ActiveVaultApplication[];
  onContinueApplication: (schemeId: string) => void;
  onExploreSchemes: () => void;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onSelectNavTab: (tab: NavTab) => void;
}

export const MyVault: React.FC<MyVaultProps> = ({
  profile,
  activeApplications,
  onContinueApplication,
  onExploreSchemes,
  currentLanguage,
  onSelectLanguage,
  onSelectNavTab,
}) => {
  const [activeTab, setActiveTab] = useState<"applications" | "documents">(
    activeApplications.length > 0 ? "applications" : "documents"
  );
  const [documents, setDocuments] = useState<VaultDocument[]>(INITIAL_VAULT_DOCS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocType, setNewDocType] = useState("Ration Card");
  const [newDocNumber, setNewDocNumber] = useState("");

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocNumber.trim()) return;

    const newDoc: VaultDocument = {
      id: `doc-${Date.now()}`,
      type: newDocType,
      title: `${newDocType} (${profile.state || "State"})`,
      issuer: "Department of Food & Supplies",
      documentNumber: newDocNumber,
      verified: true,
      updatedAt: "Just now",
      category: "identity",
    };

    setDocuments([newDoc, ...documents]);
    setShowAddModal(false);
    setNewDocNumber("");
  };

  const getDocIcon = (category: string) => {
    switch (category) {
      case "identity":
        return <CreditCard className="w-5 h-5 text-blue-700" />;
      case "banking":
        return <Landmark className="w-5 h-5 text-indigo-700" />;
      case "land":
        return <FileText className="w-5 h-5 text-emerald-700" />;
      default:
        return <FolderLock className="w-5 h-5 text-amber-700" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen justify-between bg-slate-50">
      <Header
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
      />

      <main className="max-w-md mx-auto w-full px-4 py-4 space-y-4 flex-1 pb-24">
        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Citizen Vault & Applications
          </h1>
          <p className="text-xs text-slate-500">
            Track active scheme applications and access DigiLocker DPI documents.
          </p>
        </div>

        {/* Tab Toggle: Active Applications vs Documents */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
          <button
            onClick={() => setActiveTab("applications")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "applications"
                ? "bg-white text-indigo-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Active Schemes ({activeApplications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "documents"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FolderLock className="w-3.5 h-3.5 text-amber-600" />
            <span>Doc Locker ({documents.length})</span>
          </button>
        </div>

        {/* TAB 1: ACTIVE APPLICATIONS */}
        {activeTab === "applications" && (
          <div className="space-y-3.5">
            {activeApplications.length > 0 ? (
              activeApplications.map((app) => (
                <div
                  key={app.schemeId}
                  id={`vault-app-${app.schemeId}`}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3 hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        <span>In Progress</span>
                      </span>
                      <h2 className="text-base font-bold text-slate-900 mt-1">
                        {app.schemeName}
                      </h2>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {app.schemeCode}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Application Progress</span>
                      <span className="text-indigo-600 font-bold">
                        {app.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${app.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Action Step */}
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2 text-xs text-indigo-950">
                    <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Next Action: </span>
                      <span>{app.nextStep}</span>
                    </div>
                  </div>

                  {/* Deadline & Continue Button */}
                  <div className="flex items-center justify-between pt-1">
                    {app.deadline ? (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline: {app.deadline}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Started {app.startedAt}
                      </span>
                    )}

                    <button
                      id={`btn-continue-${app.schemeId}`}
                      onClick={() => onContinueApplication(app.schemeId)}
                      className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer transition-all"
                    >
                      <span>Continue Journey</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <div className="text-4xl">🚀</div>
                <h3 className="text-base font-bold text-slate-800">
                  No active applications yet
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  When you start an application from the schemes finder, it will appear here so you can continue your step-by-step journey anytime.
                </p>
                <button
                  onClick={onExploreSchemes}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Find Schemes for Me
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOCUMENT VAULT (DIGILOCKER) */}
        {activeTab === "documents" && (
          <div className="space-y-3.5">
            {/* DigiLocker Status Card */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-2xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-950">
                    DigiLocker Connected
                  </div>
                  <div className="text-[11px] text-indigo-900/70">
                    Verified Citizen: {profile.name || "Bikash Mondal"}
                  </div>
                </div>
              </div>
              <button
                id="btn-add-document"
                onClick={() => setShowAddModal(true)}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xs cursor-pointer"
                title="Add Document"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Document List */}
            <div className="space-y-3 pt-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 text-slate-700">
                      {getDocIcon(doc.category)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900">
                        {doc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {doc.documentNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Issuer: {doc.issuer}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {doc.verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{doc.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Add Document to Vault
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Document Type
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="Ration Card">Ration Card (NFSA / State)</option>
                  <option value="Kisan Credit Card">Kisan Credit Card (KCC)</option>
                  <option value="MGNREGA Job Card">MGNREGA Job Card</option>
                  <option value="Disability Certificate">Disability Certificate (UDID)</option>
                  <option value="Income Certificate">Income Certificate</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Document / Registration Number
                </label>
                <input
                  type="text"
                  value={newDocNumber}
                  onChange={(e) => setNewDocNumber(e.target.value)}
                  placeholder="e.g. RC-991823902"
                  required
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 cursor-pointer transition-all shadow-xs"
              >
                Save to Vault
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav currentTab="my_vault" onSelectTab={onSelectNavTab} />
    </div>
  );
};

