"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "../../../types";
import { format, isToday } from "date-fns";
import Navigation from "../../../components/Navigation";

interface TechnicianSession {
  user: User;
  firstLoginToday?: Date | string;
  lastActivity?: Date | string;
}

export default function ActiveTechniciansPage() {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    loadTechnicians();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadTechnicians();
    }, 30000);

    return () => clearInterval(interval);
  }, [router]);

  const loadTechnicians = async () => {
    try {
      const usersRes = await fetch("/api/sync/users");
      const usersData = await usersRes.json();

      if (usersData.success && usersData.data?.users) {
        // Filter only technicians and those with login data
        const techUsers = usersData.data.users
          .filter((u: User) => u.role === "technician")
          .map((u: User) => ({
            user: u,
            firstLoginToday: u.lastLoginAt && isToday(new Date(u.lastLoginAt))
              ? u.lastLoginAt
              : undefined,
            lastActivity: u.lastLoginAt,
          }))
          .filter((t: TechnicianSession) => t.firstLoginToday); // Only show those who logged in today

        setTechnicians(techUsers);
      }
    } catch (error) {
      console.error("Error loading technicians:", error);
    } finally {
      setLoading(false);
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
                <p className="text-sm text-gray-600">Aktivni serviseri</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {user.role === "super_user" ? "Administrator" : user.role === "gospodar" ? "Gospodar" : "Korisnik"}
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Aktivnih danas</h3>
            <p className="text-4xl font-bold text-green-600">{technicians.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Online</h3>
            <p className="text-4xl font-bold text-blue-600">
              {technicians.filter(t => t.user.isOnline).length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Offline</h3>
            <p className="text-4xl font-bold text-gray-600">
              {technicians.filter(t => !t.user.isOnline).length}
            </p>
          </div>
        </div>

        {/* Active Technicians Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Serviseri aktivni danas
              </h2>
              <button
                onClick={loadTechnicians}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Osveži
              </button>
            </div>
          </div>

          {technicians.length === 0 ? (
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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-2">Nema aktivnih servisera danas</p>
              <p className="text-sm text-gray-500">
                Serviseri će se prikazati kada se uloguju sa mobilne aplikacije
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Ime
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Charisma ID
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Depo
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Prvo logovanje danas
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Uređaj
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((tech) => (
                    <tr
                      key={tech.user.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              tech.user.isOnline
                                ? "bg-green-500 animate-pulse"
                                : "bg-gray-400"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              tech.user.isOnline
                                ? "text-green-700"
                                : "text-gray-600"
                            }`}
                          >
                            {tech.user.isOnline ? "Online" : "Offline"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-900">
                        {tech.user.name}
                      </td>
                      <td className="py-4 px-6 text-blue-600 font-medium">
                        {tech.user.charismaId}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {tech.user.depot}
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-sm">
                        {tech.firstLoginToday
                          ? format(new Date(tech.firstLoginToday), "dd.MM.yyyy HH:mm")
                          : "-"}
                      </td>
                      <td className="py-4 px-6 text-gray-700 text-sm">
                        {tech.user.lastLoginDevice || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
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
              <p className="text-sm font-medium text-blue-900 mb-1">
                Automatsko osvežavanje
              </p>
              <p className="text-sm text-blue-700">
                Ova stranica se automatski osvežava svakih 30 sekundi. Online status pokazuje da li je serviser trenutno aktivan u mobilnoj aplikaciji.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
