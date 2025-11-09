"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, ServiceTicket } from "../../../types";
import { format } from "date-fns";

export default function ServicesPage() {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = sessionStorage.getItem("admin-user");
    if (!userData) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "super_user") {
      router.push("/");
      return;
    }

    setUser(parsedUser);
    loadTickets();
  }, [router]);

  const loadTickets = async () => {
    try {
      const ticketsRes = await fetch("/api/sync/tickets");
      const ticketsData = await ticketsRes.json();
      if (ticketsData.success && ticketsData.data?.tickets) {
        setTickets(ticketsData.data.tickets);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
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

  const filteredTickets = tickets.filter((t) => {
    if (filter === "in_progress") return t.status === "in_progress";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const activeCount = tickets.filter((t) => t.status === "in_progress").length;
  const completedCount = tickets.filter((t) => t.status === "completed").length;
  const totalOperations = tickets.reduce((sum, t) => sum + t.operations.length, 0);
  const totalParts = tickets.reduce(
    (sum, t) => sum + t.spareParts.reduce((s, p) => s + p.quantity, 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Water Service Admin
                </h1>
                <p className="text-sm text-gray-600">Istorija servisa</p>
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
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-4 text-gray-600 hover:text-gray-900 font-medium"
            >
              Početna
            </button>
            <button
              onClick={() => router.push("/dashboard/users")}
              className="px-4 py-4 text-gray-600 hover:text-gray-900 font-medium"
            >
              Korisnici
            </button>
            <button
              onClick={() => router.push("/dashboard/services")}
              className="px-4 py-4 text-blue-600 border-b-2 border-blue-600 font-semibold"
            >
              Servisi
            </button>
            <button
              onClick={() => router.push("/configuration")}
              className="px-4 py-4 text-gray-600 hover:text-gray-900 font-medium"
            >
              Konfiguracija
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Ukupno servisa</h3>
            <p className="text-4xl font-bold text-gray-900">{tickets.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">U toku</h3>
            <p className="text-4xl font-bold text-yellow-600">{activeCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Završeno</h3>
            <p className="text-4xl font-bold text-green-600">{completedCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Operacije</h3>
            <p className="text-4xl font-bold text-blue-600">{totalOperations}</p>
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Servisni nalozi
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Svi ({tickets.length})
                </button>
                <button
                  onClick={() => setFilter("in_progress")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "in_progress"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  U toku ({activeCount})
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "completed"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Završeni ({completedCount})
                </button>
              </div>
            </div>
          </div>

          {filteredTickets.length === 0 ? (
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
              <p className="text-gray-600 font-medium mb-2">Nema servisa</p>
              <p className="text-sm text-gray-500">
                Sinhronizujte podatke iz mobilne aplikacije
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Šifra aparata
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Serviser
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Datum početka
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Operacije
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Akcije
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {ticket.deviceCode}
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {ticket.technicianName}
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-sm">
                        {format(new Date(ticket.startTime), "dd.MM.yyyy HH:mm")}
                      </td>
                      <td className="py-4 px-6">
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
                      <td className="py-4 px-6 text-gray-600 text-sm">
                        {ticket.operations.length}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Detalji
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  Detalji servisa
                </h3>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
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

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Šifra aparata</p>
                    <p className="font-bold text-gray-900">
                      {selectedTicket.deviceCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    {selectedTicket.status === "completed" ? (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        Završeno
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                        U toku
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Serviser</p>
                    <p className="font-medium text-gray-900">
                      {selectedTicket.technicianName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Datum početka</p>
                    <p className="font-medium text-gray-900">
                      {format(
                        new Date(selectedTicket.startTime),
                        "dd.MM.yyyy HH:mm"
                      )}
                    </p>
                  </div>
                  {selectedTicket.endTime && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Datum završetka</p>
                      <p className="font-medium text-gray-900">
                        {format(
                          new Date(selectedTicket.endTime),
                          "dd.MM.yyyy HH:mm"
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Operations */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3">
                  Obavljene operacije ({selectedTicket.operations.length})
                </h4>
                <div className="space-y-2">
                  {selectedTicket.operations.map((op) => (
                    <div
                      key={op.id}
                      className="bg-blue-50 rounded-xl p-3 flex items-start gap-3"
                    >
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900">{op.name}</p>
                        {op.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {op.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spare Parts */}
              {selectedTicket.spareParts.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">
                    Utrošeni rezervni delovi ({selectedTicket.spareParts.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTicket.spareParts.map((part) => (
                      <div
                        key={part.id}
                        className="bg-amber-50 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                          <p className="font-medium text-gray-900">{part.name}</p>
                        </div>
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg text-sm font-semibold">
                          {part.quantity}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTicket.notes && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">Napomene</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700">{selectedTicket.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
