"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "../../../types";
import Navigation from "../../../components/Navigation";

export default function PortalUpdatePage() {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = sessionStorage.getItem("admin-user");
    if (!userData) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "super_user" && parsedUser.role !== "gospodar") {
      router.push("/dashboard");
      return;
    }

    setUser(parsedUser);
    setLoading(false);
    checkForUpdates();
  }, [router]);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/portal-update/check");
      const data = await response.json();

      if (data.success) {
        setUpdateInfo(data.data);
      } else {
        const errorMsg = data.error
          ? `Greška: ${data.message}\n\nDetalji: ${data.error}\n\nPlatforma: ${data.platform || 'N/A'}`
          : data.message || "Greška pri proveri ažuriranja";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Error checking for updates:", error);
      alert("Greška pri proveri ažuriranja: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setChecking(false);
    }
  };

  const handleUpdate = async () => {
    if (!confirm("Da li ste sigurni da želite da ažurirate portal? Moraćete da restartujete server nakon ažuriranja.")) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch("/api/portal-update/update", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        alert(data.message + "\n\nRestartujte server komandom:\nnpm run dev\n\nIli ako koristite PM2:\npm2 restart web-admin");
        await checkForUpdates();
      } else {
        alert(data.message || "Greška pri ažuriranju portala");
      }
    } catch (error) {
      console.error("Error updating portal:", error);
      alert("Greška pri ažuriranju portala");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin-user");
    router.push("/");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center p-2 shadow-md">
                <img
                  src="/lafantana-logo.svg"
                  alt="La Fantana WHS Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  La Fantana WHS Admin
                </h1>
                <p className="text-sm text-gray-600">Ažuriranje Web Portala</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.role === "super_user"
                    ? "Administrator"
                    : user.role === "gospodar"
                    ? "Gospodar"
                    : "Korisnik"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
              >
                Odjavi se
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Portal Update
              </h2>
              <p className="text-gray-600">
                Proverite i instalirajte najnovije izmene web portala
              </p>
            </div>

            <button
              onClick={checkForUpdates}
              disabled={checking}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {checking ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Proveravam...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Proveri ažuriranja
                </>
              )}
            </button>
          </div>

          {updateInfo && (
            <>
              {/* Current Version */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Trenutna verzija
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-32">
                      Commit:
                    </span>
                    <code className="px-3 py-1 bg-white rounded-lg text-sm font-mono text-gray-800 border border-gray-200">
                      {updateInfo.currentCommit}
                    </code>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-gray-600 w-32">
                      Poruka:
                    </span>
                    <p className="text-sm text-gray-800">
                      {updateInfo.currentMessage}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-32">
                      Datum:
                    </span>
                    <span className="text-sm text-gray-800">
                      {updateInfo.currentDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Update Available */}
              {updateInfo.updateAvailable ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">
                        Dostupno je novo ažuriranje!
                      </h3>
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-green-700 w-32">
                            Nova verzija:
                          </span>
                          <code className="px-3 py-1 bg-white rounded-lg text-sm font-mono text-gray-800 border border-green-300">
                            {updateInfo.remoteCommit}
                          </code>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-green-700 w-32">
                            Izmene:
                          </span>
                          <p className="text-sm text-green-800 font-medium">
                            {updateInfo.newMessage}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-green-700 w-32">
                            Datum:
                          </span>
                          <span className="text-sm text-green-800">
                            {updateInfo.newDate}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleUpdate}
                        disabled={updating}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {updating ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Ažuriram...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Instaliraj ažuriranje
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-1">
                        Portal je ažuran
                      </h3>
                      <p className="text-sm text-blue-700">
                        Koristite najnoviju verziju web portala
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Info */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-yellow-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-yellow-900 font-semibold mb-2">Važna napomena</p>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>
                    Nakon instaliranja ažuriranja, moraćete da restartujete server
                  </li>
                  <li>
                    Korisnici će biti privremeno onemogućeni tokom restarta (1-2 sekunde)
                  </li>
                  <li>
                    Preporučujemo da ažurirate portal kada nema aktivnih korisnika
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
