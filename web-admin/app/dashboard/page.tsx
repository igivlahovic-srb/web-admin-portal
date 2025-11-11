"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, ServiceTicket } from "../../types";
import { format } from "date-fns";
import UpdateNotification from "../../components/UpdateNotification";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";

export default function DashboardPage() {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
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
    loadData();
  }, [router]);

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      // Fetch users
      const usersRes = await fetch("/api/sync/users");
      const usersData = await usersRes.json();
      if (usersData.success && usersData.data?.users) {
        setUsers(usersData.data.users);
      }

      // Fetch tickets
      const ticketsRes = await fetch("/api/sync/tickets");
      const ticketsData = await ticketsRes.json();
      if (ticketsData.success && ticketsData.data?.tickets) {
        setTickets(ticketsData.data.tickets);
      }
    } catch (error) {
      console.error("Error loading data:", error);
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

  const activeTickets = tickets.filter((t) => t.status === "in_progress");
  const completedTickets = tickets.filter((t) => t.status === "completed");
  const activeUsers = users.filter((u) => u.isActive);

  const todayTickets = tickets.filter((t) => {
    const ticketDate = new Date(t.startTime);
    const today = new Date();
    return (
      ticketDate.getDate() === today.getDate() &&
      ticketDate.getMonth() === today.getMonth() &&
      ticketDate.getFullYear() === today.getFullYear()
    );
  });

  // Calculate services by depot/location
  const servicesByDepot = tickets.reduce((acc, ticket) => {
    // Find the technician's depot
    const technician = users.find(u => u.id === ticket.technicianId);
    const depot = technician?.depot || "Nepoznato";

    if (!acc[depot]) {
      acc[depot] = { total: 0, completed: 0, inProgress: 0 };
    }

    acc[depot].total++;
    if (ticket.status === "completed") {
      acc[depot].completed++;
    } else {
      acc[depot].inProgress++;
    }

    return acc;
  }, {} as Record<string, { total: number; completed: number; inProgress: number }>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Update Notification */}
      <UpdateNotification />

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
                <p className="text-sm text-gray-600">Kontrolna tabla</p>
              </div>
            </div>

            {/* Live Clock */}
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-900">
                    {currentTime.toLocaleTimeString("sr-RS", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    {currentTime.toLocaleDateString("sr-RS", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Aktivni servisi</h3>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {activeTickets.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Današnji servisi</h3>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {todayTickets.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Završeni servisi</h3>
              <div className="p-2 bg-green-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-green-600"
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
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {completedTickets.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 font-medium">Aktivni serviseri</h3>
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg
                  className="w-5 h-5 text-purple-600"
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
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {activeUsers.filter((u) => u.role === "technician").length}
            </p>
          </div>
        </div>

        {/* Services by Depot/Location */}
        {Object.keys(servicesByDepot).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Servisi po lokaciji
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(servicesByDepot).map(([depot, stats]) => (
                <div key={depot} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{depot}</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-yellow-50 rounded-xl p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <svg
                          className="w-4 h-4 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-yellow-700 text-xs font-semibold">
                          U TOKU
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-900">
                        {stats.inProgress}
                      </p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <svg
                          className="w-4 h-4 text-green-600"
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
                        <span className="text-green-700 text-xs font-semibold">
                          ZAVRŠENO
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        {stats.completed}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Services */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Nedavni servisi
          </h2>

          {tickets.length === 0 ? (
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-2">Nema servisnih naloga</p>
              <p className="text-sm text-gray-500">
                Sinhronizujte podatke iz mobilne aplikacije da vidite servise
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Servis No.
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Šifra aparata
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Serviser
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Datum
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">
                      Operacije
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.slice(0, 10).map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-blue-600 font-semibold text-sm">
                        {ticket.serviceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {ticket.deviceCode}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {ticket.technicianName}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {format(new Date(ticket.startTime), "dd.MM.yyyy HH:mm")}
                      </td>
                      <td className="py-3 px-4">
                        {ticket.status === "completed" ? (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Završeno
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                            U toku
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {ticket.operations.length} operacija
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
