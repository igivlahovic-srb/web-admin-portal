"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "../../../types";
import { format } from "date-fns";
import Navigation from "../../../components/Navigation";

export default function UsersPage() {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();

  // Form state for adding user
  const [formData, setFormData] = useState({
    charismaId: "",
    username: "",
    password: "",
    name: "",
    role: "technician" as "gospodar" | "super_user" | "technician",
    depot: "",
  });

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
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const usersRes = await fetch("/api/sync/users");
      const usersData = await usersRes.json();
      if (usersData.success && usersData.data?.users) {
        setUsers(usersData.data.users);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin-user");
    router.push("/");
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowAddModal(false);
        setFormData({
          charismaId: "",
          username: "",
          password: "",
          name: "",
          role: "technician",
          depot: "",
        });
        await loadUsers();
        alert(data.message);
      } else {
        alert(data.message || "Greška pri dodavanju korisnika");
      }
    } catch {
      alert("Greška pri dodavanju korisnika");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    setActionLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (data.success) {
        await loadUsers();
        alert(data.message);
      } else {
        alert(data.message || "Greška pri ažuriranju korisnika");
      }
    } catch {
      alert("Greška pri ažuriranju korisnika");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;
    setActionLoading(true);

    try {
      const response = await fetch(`/api/users/${selectedUserId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        setSelectedUserId(null);
        await loadUsers();
        alert(data.message);
      } else {
        alert(data.message || "Greška pri brisanju korisnika");
      }
    } catch {
      alert("Greška pri brisanju korisnika");
    } finally {
      setActionLoading(false);
    }
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

  const filteredUsers = users.filter((u) => {
    if (filter === "active") return u.isActive;
    if (filter === "inactive") return !u.isActive;
    return true;
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;
  const technicianCount = users.filter((u) => u.role === "technician").length;
  const adminCount = users.filter((u) => u.role === "super_user" || u.role === "gospodar").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12">
                <img
                  src="/logo.png"
                  alt="La Fantana WHS Logo"
                  className="w-12 h-12"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  La Fantana WHS Admin
                </h1>
                <p className="text-sm text-gray-600">Upravljanje korisnicima</p>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Ukupno korisnika</h3>
            <p className="text-4xl font-bold text-gray-900">{users.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Aktivni</h3>
            <p className="text-4xl font-bold text-green-600">{activeCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Serviseri</h3>
            <p className="text-4xl font-bold text-blue-600">{technicianCount}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-gray-600 font-medium mb-2">Administratori</h3>
            <p className="text-4xl font-bold text-purple-600">{adminCount}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Lista korisnika
              </h2>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Dodaj korisnika
              </button>
            </div>

            <div className="flex gap-2">
              <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Svi ({users.length})
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "active"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Aktivni ({activeCount})
                </button>
                <button
                  onClick={() => setFilter("inactive")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === "inactive"
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Neaktivni ({inactiveCount})
                </button>
              </div>
            </div>

          {filteredUsers.length === 0 ? (
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
              <p className="text-gray-600 font-medium mb-2">Nema korisnika</p>
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
                      Ime
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Charisma ID
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Korisničko ime
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Depo
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Uloga
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Datum kreiranja
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-gray-600">
                      Akcije
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {u.name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          {u.charismaId}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-700">@{u.username}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {u.depot}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.role === "gospodar" ? (
                          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                            GOSPODAR
                          </span>
                        ) : u.role === "super_user" ? (
                          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            Administrator
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            Serviser
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {u.isActive ? (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Aktivan
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            Neaktivan
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-600 text-sm">
                        {format(new Date(u.createdAt), "dd.MM.yyyy")}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            disabled={actionLoading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              u.isActive
                                ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {u.isActive ? "Deaktiviraj" : "Aktiviraj"}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setShowDeleteModal(true);
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Obriši
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0"
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
              <p className="text-blue-900 font-semibold mb-1">Napomena</p>
              <p className="text-blue-800 text-sm">
                Admin sada može upravljati korisnicima direktno sa ove stranice.
                Izmene će biti sinhronizovane sa mobilnom aplikacijom.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Dodaj novog korisnika</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Charisma ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.charismaId}
                  onChange={(e) => setFormData({ ...formData, charismaId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="npr. EMP001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ime i prezime
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="npr. Marko Marković"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Korisničko ime
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="npr. mmarko"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lozinka
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unesite lozinku"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depo
                </label>
                <input
                  type="text"
                  required
                  value={formData.depot}
                  onChange={(e) => setFormData({ ...formData, depot: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="npr. Central"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uloga
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "gospodar" | "super_user" | "technician" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="technician">Serviser</option>
                  <option value="super_user">Administrator</option>
                  <option value="gospodar">GOSPODAR (pun pristup)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Dodavanje..." : "Dodaj korisnika"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Potvrda brisanja</h3>
                <p className="text-sm text-gray-600 mt-1">Ova akcija se ne može poništiti</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Da li ste sigurni da želite da obrišete ovog korisnika? Svi podaci povezani sa ovim korisnikom će biti trajno uklonjeni.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUserId(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Otkaži
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Brisanje..." : "Obriši korisnika"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
