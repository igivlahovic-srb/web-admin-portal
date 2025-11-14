"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  role: string;
  workdayStatus?: "open" | "closed";
  workdayClosedAt?: string;
}

interface WorkdayLog {
  id: string;
  userId: string;
  userName: string;
  adminId: string;
  adminName: string;
  reason: string;
  timestamp: string;
}

export default function WorkdayPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<WorkdayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(sessionStorage.getItem("admin-user") || "null")
      : null;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users
      const usersRes = await fetch("/api/sync/users");
      const usersData = await usersRes.json();
      if (usersData.success && usersData.data.users) {
        const technicians = usersData.data.users.filter(
          (u: User) => u.role === "technician"
        );
        setUsers(technicians);
      }

      // Fetch workday logs
      const logsRes = await fetch("/api/workday/open");
      const logsData = await logsRes.json();
      if (logsData.success && logsData.data.logs) {
        setLogs(logsData.data.logs.reverse());
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleOpenWorkday = async () => {
    if (!selectedUser || !currentUser) return;

    if (reason.length < 10) {
      setError("Razlog mora imati najmanje 10 karaktera");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/workday/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason,
          adminId: currentUser.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Radni dan za ${selectedUser.name} je uspešno otvoren.`);
        setSelectedUser(null);
        setReason("");
        fetchData();
      } else {
        setError(data.message || "Greška pri otvaranju radnog dana");
      }
    } catch (error) {
      console.error("Error opening workday:", error);
      setError("Došlo je do greške");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Učitavanje...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Molimo prijavite se</div>
      </div>
    );
  }

  const isAdmin =
    currentUser.role === "super_user" || currentUser.role === "gospodar";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">
          Nemate dozvolu za pristup ovoj stranici
        </div>
      </div>
    );
  }

  const closedUsers = users.filter((u) => u.workdayStatus === "closed");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Nazad na Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upravljanje radnim danima
          </h1>
          <p className="text-gray-600">
            Pregled i upravljanje radnim danima servisera
          </p>
        </div>

        {/* Users with Closed Workdays */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Serviseri sa zatvorenim radnim danom
          </h2>

          {closedUsers.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Nema servisera sa zatvorenim radnim danom
            </div>
          ) : (
            <div className="space-y-3">
              {closedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">
                      Zatvoren:{" "}
                      {user.workdayClosedAt
                        ? new Date(user.workdayClosedAt).toLocaleString("sr-RS")
                        : "N/A"}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Otvori radni dan
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workday Reopening History */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Istorija otvaranja radnih dana
          </h2>

          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Nema istorije otvaranja radnih dana
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-900">
                      {log.userName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString("sr-RS")}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Otvorio: {log.adminName}
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-2 rounded">
                    <span className="font-medium">Razlog:</span> {log.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for Opening Workday */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Otvori radni dan za {selectedUser.name}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razlog za otvaranje radnog dana (obavezno, min. 10 karaktera)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Unesite razlog za otvaranje radnog dana..."
                disabled={submitting}
              />
              {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleOpenWorkday}
                disabled={submitting || reason.length < 10}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {submitting ? "Otvaranje..." : "Otvori radni dan"}
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setReason("");
                  setError("");
                }}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:cursor-not-allowed transition"
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
