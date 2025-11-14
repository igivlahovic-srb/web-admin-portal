"use client";

import { useEffect, useState } from "react";

interface VersionInfo {
  currentVersion: string;
  currentCommit: string;
  latestCommit: string;
  hasUpdate: boolean;
}

export default function UpdateNotification() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Check for updates every 5 minutes
  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    try {
      const response = await fetch("/api/version");
      const data = await response.json();

      if (data.success && data.data) {
        setVersionInfo(data.data);
        if (data.data.hasUpdate) {
          setShowNotification(true);
        }
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
    }
  };

  const handleUpdate = async () => {
    if (!confirm("Da li ste sigurni da želite da ažurirate aplikaciju? Aplikacija će biti nedostupna nekoliko sekundi tokom ažuriranja.")) {
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch("/api/update", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || "Aplikacija se uspešno ažurira. Stranica će se osvežiti za nekoliko sekundi.");
        // Wait 5 seconds then reload the page
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        alert("Greška: " + data.message);
        setIsUpdating(false);
      }
    } catch (error) {
      console.error("Update initiated, server restarting:", error);
      // Server is restarting after successful update - this is expected behavior
      alert("Ažuriranje je pokrenuto! Aplikacija se restartuje. Stranica će se automatski osvežiti za 10 sekundi.");

      // Give server more time to restart
      setTimeout(() => {
        window.location.reload();
      }, 10000);
    }
  };

  if (!showNotification || !versionInfo?.hasUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-blue-600 text-white rounded-2xl shadow-2xl p-4 animate-slide-in">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Nova verzija dostupna!</h3>
            <p className="text-sm text-blue-100 mb-3">
              Dostupna je nova verzija aplikacije. Kliknite da instalirate.
            </p>
            <div className="text-xs text-blue-200 mb-3">
              Trenutna: {versionInfo.currentCommit} → Nova: {versionInfo.latestCommit}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-4 py-2 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isUpdating ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Ažuriranje...
                  </span>
                ) : (
                  "Ažuriraj sada"
                )}
              </button>

              <button
                onClick={() => setShowNotification(false)}
                disabled={isUpdating}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
              >
                Zatvori
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowNotification(false)}
            disabled={isUpdating}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
