import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-6 px-4 bg-slate-50 border-t border-slate-200 text-center">
      <div className="max-w-md mx-auto space-y-2.5">
        <div className="text-xs text-slate-600">
          <span className="font-bold text-slate-900">Sahayak</span>{" "}
          <span>© 2024 Sahayak Civic Trust. An Official DPI Initiative.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
          <a
            href="#accessibility"
            onClick={(e) => e.preventDefault()}
            className="hover:underline hover:text-slate-900 transition-colors"
          >
            Accessibility
          </a>
          <a
            href="#privacy"
            onClick={(e) => e.preventDefault()}
            className="hover:underline hover:text-slate-900 transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#terms"
            onClick={(e) => e.preventDefault()}
            className="hover:underline hover:text-slate-900 transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="#support"
            onClick={(e) => e.preventDefault()}
            className="hover:underline hover:text-slate-900 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  );
};
