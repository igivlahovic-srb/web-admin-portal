"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface BackupInfo {
  name: string;
  version: string;
  timestamp: string;
  size: number;
  date: string;
  downloadUrl: string;
}

export default function BackupPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [backupError, setBackupError] = useState("");
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Helper funkcija za formatiranje veličine fajla
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

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
    fetchBackups();
  }, [router]);

  const fetchBackups = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/backup");
      const data = await response.json();

      if (data.success) {
        setBackups(data.data.backups);
      }
    } catch (error) {
      console.error("Error fetching backups:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    setBackupError("");
    setBackupSuccess(false);

    try {
      const response = await fetch("/api/backup", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setBackupSuccess(true);
        setTimeout(() => {
          setBackupSuccess(false);
          fetchBackups(); // Auto refresh after backup
        }, 3000);
      } else {
        setBackupError(data.message || "Greška pri kreiranju backup-a");
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      setBackupError("Greška pri kreiranju backup-a");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackupForRestore) return;

    setRestoringBackup(true);
    setRestoreError("");
    setRestoreSuccess(false);

    try {
      const response = await fetch("/api/backup/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backupFile: selectedBackupForRestore,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRestoreSuccess(true);
        setSelectedBackupForRestore(null);
        alert("Backup je uspešno restore-ovan! Server će se restartovati za 5 sekundi.");
      } else {
        setRestoreError(data.message || "Greška pri restore-ovanju backup-a");
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      setRestoreError("Greška pri restore-ovanju backup-a");
    } finally {
      setRestoringBackup(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Backup Sistema
              </h1>
              <p className="text-gray-600 mt-1">
                Kompletna arhiva projekta (mobilna aplikacija, web portal, APK)
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Nazad
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Create Backup Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Kreiraj novi backup
          </h2>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Šta se backupuje:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Mobilna aplikacija (React Native + Expo)</li>
                    <li>Web admin panel (Next.js)</li>
                    <li>APK fajlovi (ako postoje)</li>
                    <li>Environment fajlovi (.env, .env.local)</li>
                    <li>Sve konfiguracione fajlove</li>
                  </ul>
                  <p className="text-sm text-blue-900 mt-2 font-semibold">
                    ⏱️ Backup proces traje 1-2 minuta. Čuva se samo poslednja 3 backup-a.
                  </p>
                </div>
              </div>
            </div>

            {backupSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-green-800 font-semibold">
                    Backup je pokrenut u pozadini! Sačekajte 1-2 minuta i refresh-ujte stranicu.
                  </p>
                </div>
              </div>
            )}

            {backupError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-800 font-semibold">{backupError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors"
            >
              {creatingBackup ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Pokrećem backup...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  Kreiraj Backup
                </>
              )}
            </button>
          </div>
        </div>

        {/* Backup List - Poslednja 3 backup-a */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Dostupni backup-ovi (poslednja 3)
            </h2>
            <button
              onClick={fetchBackups}
              disabled={refreshing}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 font-medium transition-colors flex items-center gap-2"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
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
              {refreshing ? "Učitavanje..." : "Refresh"}
            </button>
          </div>

          {backups.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-2">
                Nema dostupnih backup-ova
              </p>
              <p className="text-sm text-gray-500">
                Kliknite na dugme iznad da kreirate prvi backup
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Verzija
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Datum backup-a
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Veličina
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                        Naziv fajla
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                        Akcije
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup, index) => (
                      <tr
                        key={backup.name}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          index === 0 ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600">
                              v{backup.version}
                            </span>
                            {index === 0 && (
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                Najnoviji
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">{backup.date}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">
                            {formatFileSize(backup.size)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-600 text-sm font-mono">
                            {backup.name}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={backup.downloadUrl}
                              download
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
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
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Preuzmi
                            </a>
                            <button
                              onClick={() => setSelectedBackupForRestore(backup.name)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors"
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
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              Restore
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                {backups.length === 1 && <p>Prikazuje se 1 backup</p>}
                {backups.length > 1 && (
                  <p>Prikazuju se poslednja {backups.length} backup-a</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Restore Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-amber-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 mb-2">
                Kako restore-ovati backup:
              </p>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>Kliknite dugme &quot;Restore&quot; pored backup-a koji želite da vratite</li>
                <li>Sistem će automatski izvršiti restore kompletne instalacije</li>
                <li>Server će se restartovati nakon uspešnog restore-a</li>
                <li>
                  Backup sadrži kompletnu instalaciju: mobilnu aplikaciju, web
                  portal i APK fajlove
                </li>
                <li>
                  Za manuelni restore, preuzmite backup i pogledajte RESTORE_GUIDE.txt fajl u arhivi
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Restore Backup-a
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Da li ste sigurni da želite da vratite sistem na ovaj backup?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mt-3">
                <p className="text-sm font-mono text-gray-600">
                  {selectedBackupForRestore}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-red-800 font-semibold mb-1">
                  ⚠️ Upozorenje:
                </p>
                <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                  <li>Svi trenutni podaci će biti zamenjeni sa backup podacima</li>
                  <li>Server će se automatski restartovati</li>
                  <li>Ova akcija se ne može poništiti</li>
                </ul>
              </div>

              {restoreError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <p className="text-sm text-red-800">{restoreError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestoreBackup}
                disabled={restoringBackup}
                className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {restoringBackup ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
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
                    Restore u toku...
                  </>
                ) : (
                  "Potvrdi Restore"
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedBackupForRestore(null);
                  setRestoreError("");
                }}
                disabled={restoringBackup}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg font-semibold transition-colors"
              >
                Otkaži
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
