"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface MobileAppInfo {
  hasApk: boolean;
  latestVersion: string;
  downloadUrl: string | null;
  fileName: string | null;
  updatedAt: string;
}

export default function MobileAppPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appInfo, setAppInfo] = useState<MobileAppInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

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
    fetchAppInfo();
  }, [router]);

  const fetchAppInfo = async () => {
    try {
      const response = await fetch("/api/mobile-app");
      const data = await response.json();

      if (data.success) {
        setAppInfo(data.data);
      }
    } catch (error) {
      console.error("Error fetching app info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".apk")) {
      setUploadError("Fajl mora biti APK format");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("apk", file);

      const response = await fetch("/api/mobile-app/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadSuccess(true);
        setTimeout(() => {
          setUploadSuccess(false);
          fetchAppInfo();
        }, 2000);
      } else {
        setUploadError(data.message || "Greška pri upload-ovanju");
      }
    } catch (error) {
      console.error("Error uploading APK:", error);
      setUploadError("Greška pri upload-ovanju fajla");
    } finally {
      setUploading(false);
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
                Mobilna aplikacija
              </h1>
              <p className="text-gray-600 mt-1">
                Upravljanje Android aplikacijom za servisere
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
        {/* Current Version Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Trenutna verzija
          </h2>

          {appInfo?.hasApk ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verzija aplikacije:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    v{appInfo.latestVersion}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-2">Naziv fajla:</p>
                <p className="text-gray-900 font-medium">{appInfo.fileName}</p>
              </div>

              {appInfo.downloadUrl && (
                <div className="border-t border-gray-200 pt-4">
                  <a
                    href={appInfo.downloadUrl}
                    download
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                  >
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Preuzmi Android APK
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600">
                Trenutno nema uploadovane Android aplikacije
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Uploadujte APK fajl ispod
              </p>
            </div>
          )}
        </div>

        {/* Upload New Version */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Upload nove verzije
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
                    Kako uploadovati novu verziju:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Izaberite APK fajl sa vašeg računara</li>
                    <li>
                      Preporučeni format imena: lafantana-v2.1.0.apk (verzija će
                      biti automatski detektovana)
                    </li>
                    <li>Stari APK fajl će biti automatski zamenjen novim</li>
                    <li>
                      Serviseri mogu preuzeti novu verziju direktno sa mobilnog
                      uređaja
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {uploadSuccess && (
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
                    APK fajl je uspešno uploadovan!
                  </p>
                </div>
              </div>
            )}

            {uploadError && (
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
                  <p className="text-red-800 font-semibold">{uploadError}</p>
                </div>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".apk"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="apk-upload"
              />
              <label
                htmlFor="apk-upload"
                className={`cursor-pointer ${uploading ? "opacity-50" : ""}`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Uploadovanje...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-400 mb-4"
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
                    <p className="text-gray-900 font-semibold mb-1">
                      Klikni ovde da izabereš APK fajl
                    </p>
                    <p className="text-sm text-gray-500">
                      ili prevuci fajl ovde
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-amber-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 mb-2">
                Važne napomene za servisere:
              </p>
              <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                <li>
                  Android uređaji moraju dozvoliti instalaciju iz nepoznatih
                  izvora
                </li>
                <li>
                  Nakon preuzimanja APK fajla, otvorite ga i pratite uputstva
                  za instalaciju
                </li>
                <li>
                  Ako već imate instaliranu aplikaciju, nova verzija će je
                  zameniti
                </li>
                <li>Svi podaci ostaju sačuvani nakon ažuriranja</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
