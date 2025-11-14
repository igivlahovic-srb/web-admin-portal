"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "../../../types";
import Navigation from "../../../components/Navigation";

function TwoFactorSetupContent() {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  useEffect(() => {
    const userData = sessionStorage.getItem("admin-user");
    if (!userData) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "super_user" && parsedUser.role !== "gospodar") {
      router.push("/");
      return;
    }

    setUser(parsedUser);
    if (userId) {
      loadTargetUser(userId);
    } else {
      setLoading(false);
    }
  }, [router, userId]);

  const loadTargetUser = async (id: string) => {
    try {
      const response = await fetch("/api/sync/users");
      const data = await response.json();
      if (data.success && data.data?.users) {
        const foundUser = data.data.users.find((u: User) => u.id === id);
        setTargetUser(foundUser || null);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    if (!userId) return;

    setActionLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        setSetupData(data.data);
      } else {
        alert(data.message || "Greška pri generisanju 2FA");
      }
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      alert("Greška pri postavljanju 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!userId || !verificationCode || !setupData) {
      alert("Morate uneti kod iz Authenticator aplikacije");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          token: verificationCode,
          secret: setupData.secret,
          backupCodes: setupData.backupCodes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("2FA je uspešno omogućen!");
        router.push("/dashboard/users");
      } else {
        alert(data.message || "Greška pri omogućavanju 2FA");
      }
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      alert("Greška pri omogućavanju 2FA");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!userId || !disableCode) {
      alert("Morate uneti trenutni 2FA kod");
      return;
    }

    if (!confirm("Da li ste sigurni da želite da onemogućite 2FA za ovog korisnika?")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          token: disableCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("2FA je uspešno onemogućen!");
        router.push("/dashboard/users");
      } else {
        alert(data.message || "Greška pri onemogućavanju 2FA");
      }
    } catch (error) {
      console.error("Error disabling 2FA:", error);
      alert("Greška pri onemogućavanju 2FA");
    } finally {
      setActionLoading(false);
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

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Korisnik nije pronađen</p>
          <button
            onClick={() => router.push("/dashboard/users")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Nazad na korisnike
          </button>
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
                <p className="text-sm text-gray-600">2FA Podešavanja</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.role === "super_user" ? "Administrator" : "Gospodar"}
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/users")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Nazad na korisnike
          </button>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Korisnik</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Ime</p>
              <p className="font-semibold text-gray-900">{targetUser.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Korisničko ime</p>
              <p className="font-semibold text-gray-900">{targetUser.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">2FA Status</p>
              {targetUser.twoFactorEnabled ? (
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  Omogućen
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                  Onemogućen
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Enable 2FA Section */}
        {!targetUser.twoFactorEnabled && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Omogući 2FA
            </h2>

            {!setupData ? (
              <div>
                <p className="text-gray-600 mb-6">
                  Omogućite dvofaktorsku autentifikaciju za ovog korisnika. Korisniku će biti potrebna Authenticator aplikacija (Google Authenticator, Microsoft Authenticator, itd.)
                </p>
                <button
                  onClick={handleSetup2FA}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Generiše se..." : "Generiši 2FA"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* QR Code */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Skenirajte ovaj QR kod u Authenticator aplikaciji
                  </p>
                  <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl">
                    <img src={setupData.qrCode} alt="QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    Ili unesite ručno: <code className="bg-gray-100 px-2 py-1 rounded">{setupData.secret}</code>
                  </p>
                </div>

                {/* Backup Codes */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h3 className="font-bold text-yellow-900 mb-3">Backup kodovi</h3>
                  <p className="text-sm text-yellow-800 mb-4">
                    Sačuvajte ove kodove na sigurnom mestu. Možete ih koristiti za pristup ako izgubite telefon.
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {setupData.backupCodes.map((code: string, index: number) => (
                      <div key={index} className="bg-white px-3 py-2 rounded border border-yellow-300">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unesite kod iz Authenticator aplikacije
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleEnable2FA}
                  disabled={actionLoading || !verificationCode}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Omogućava se..." : "Potvrdi i omogući 2FA"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Disable 2FA Section */}
        {targetUser.twoFactorEnabled && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Onemogući 2FA
            </h2>
            <p className="text-gray-600 mb-6">
              Da biste onemogućili dvofaktorsku autentifikaciju, morate uneti trenutni 2FA kod.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trenutni 2FA kod
                </label>
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                onClick={handleDisable2FA}
                disabled={actionLoading || !disableCode}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Onemogućava se..." : "Onemogući 2FA"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TwoFactorSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Učitavanje...</p>
        </div>
      </div>
    }>
      <TwoFactorSetupContent />
    </Suspense>
  );
}
