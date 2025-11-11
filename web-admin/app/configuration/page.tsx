"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OperationTemplate, SparePartTemplate, User } from "../../types";
import Navigation from "../../components/Navigation";

function ConfigurationContent() {
  const searchParams = useSearchParams();
  const [operations, setOperations] = useState<OperationTemplate[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<"operations" | "spareParts" | "systemSettings" | "deviceTypes">("operations");
  const [systemTab, setSystemTab] = useState<"database" | "ubuntu">("database");
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<"gospodar" | "super_user" | "technician" | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OperationTemplate | SparePartTemplate | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id: "",
    code: "",
    name: "",
    description: "",
    unit: "",
  });

  const [isLoadingSQLData, setIsLoadingSQLData] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    id: "",
    code: "",
    name: "",
    unit: "",
    status: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch configuration data
  useEffect(() => {
    // Get user role from session storage
    const userData = sessionStorage.getItem("admin-user");
    if (userData) {
      const parsedUser: User = JSON.parse(userData);
      setUserRole(parsedUser.role);
    }
    fetchConfigData();
  }, []);

  // Handle URL parameter for tab switching (e.g., ?tab=erp)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "erp") {
      setActiveTab("systemSettings");
      setSystemTab("database");
    }
  }, [searchParams]);

  // Reset filters when tab changes
  useEffect(() => {
    setFilters({
      id: "",
      code: "",
      name: "",
      unit: "",
      status: "",
    });
  }, [activeTab]);

  const fetchConfigData = async () => {
    setIsLoading(true);
    try {
      const [opsRes, partsRes] = await Promise.all([
        fetch("/api/config/operations"),
        fetch("/api/config/spare-parts"),
      ]);

      if (opsRes.ok) {
        const opsData = await opsRes.json();
        setOperations(opsData.data.operations || []);
      }

      if (partsRes.ok) {
        const partsData = await partsRes.json();
        setSpareParts(partsData.data.spareParts || []);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      alert("Greška pri učitavanju podataka");
    } finally {
      setIsLoading(false);
    }
  };

  // Add new item
  const handleAdd = async () => {
    if (!formData.code || !formData.name) {
      alert("ChItemCode i ChItemName su obavezni!");
      return;
    }

    const endpoint =
      activeTab === "operations"
        ? "/api/config/operations"
        : "/api/config/spare-parts";

    const payload =
      activeTab === "operations"
        ? {
            id: formData.id || undefined,
            code: formData.code,
            name: formData.name,
            description: formData.description,
          }
        : {
            id: formData.id || undefined,
            code: formData.code,
            name: formData.name,
            unit: formData.unit || "kom",
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert("Uspešno dodato!");
        setShowAddModal(false);
        resetForm();
        fetchConfigData();
      } else {
        alert(data.message || "Greška pri dodavanju");
      }
    } catch (error) {
      console.error("Error adding:", error);
      alert("Greška pri dodavanju");
    }
  };

  // Update item
  const handleUpdate = async () => {
    if (!selectedItem || !formData.code || !formData.name) {
      alert("ChItemCode i ChItemName su obavezni!");
      return;
    }

    const endpoint =
      activeTab === "operations"
        ? `/api/config/operations/${selectedItem.id}`
        : `/api/config/spare-parts/${selectedItem.id}`;

    const payload =
      activeTab === "operations"
        ? {
            code: formData.code,
            name: formData.name,
            description: formData.description,
            isActive: (selectedItem as OperationTemplate).isActive,
          }
        : {
            code: formData.code,
            name: formData.name,
            unit: formData.unit,
            isActive: (selectedItem as SparePartTemplate).isActive,
          };

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert("Uspešno ažurirano!");
        setShowEditModal(false);
        setSelectedItem(null);
        resetForm();
        fetchConfigData();
      } else {
        alert(data.message || "Greška pri ažuriranju");
      }
    } catch (error) {
      console.error("Error updating:", error);
      alert("Greška pri ažuriranju");
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (item: OperationTemplate | SparePartTemplate) => {
    const endpoint =
      activeTab === "operations"
        ? `/api/config/operations/${item.id}`
        : `/api/config/spare-parts/${item.id}`;

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, isActive: !item.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        fetchConfigData();
      } else {
        alert(data.message || "Greška");
      }
    } catch (error) {
      console.error("Error toggling:", error);
      alert("Greška");
    }
  };

  // Delete item
  const handleDelete = async (id: string) => {
    if (!confirm("Da li ste sigurni da želite da obrišete stavku?")) {
      return;
    }

    const endpoint =
      activeTab === "operations"
        ? `/api/config/operations/${id}`
        : `/api/config/spare-parts/${id}`;

    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const data = await response.json();

      if (data.success) {
        alert("Uspešno obrisano!");
        fetchConfigData();
      } else {
        alert(data.message || "Greška pri brisanju");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Greška pri brisanju");
    }
  };

  // Load operations or spare parts from ERP system
  const handleLoadFromSQL = async () => {
    if (activeTab !== "spareParts" && activeTab !== "operations") return;

    const isOperations = activeTab === "operations";
    const itemType = isOperations ? "operacije" : "rezervne delove";
    const itemTypeSingular = isOperations ? "operacija" : "rezervnih delova";

    if (!confirm(`Da li želite da učitate ${itemType} iz ERP-a? Ovo će dodati nove stavke u konfiguraciju.`)) {
      return;
    }

    setIsLoadingSQLData(true);

    try {
      // Fetch data from ERP
      const endpoint = isOperations ? "/api/operations" : "/api/spare-parts";
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Greška pri učitavanju iz ERP-a");
        setIsLoadingSQLData(false);
        return;
      }

      const sqlItems = isOperations ? (data.data.operations || []) : (data.data.spareParts || []);

      if (sqlItems.length === 0) {
        alert(`Nije pronađena nijedna stavka u ERP-u`);
        setIsLoadingSQLData(false);
        return;
      }

      // Check for duplicates and add new items
      const existingItems = isOperations ? operations : spareParts;
      const existingCodes = existingItems.map((item) => item.code);
      const existingIds = existingItems.map((item) => item.id);

      const newItems = sqlItems.filter(
        (item: any) => !existingIds.includes(item.id) && !existingCodes.includes(item.code)
      );

      if (newItems.length === 0) {
        alert(`Sve stavke iz ERP-a već postoje u konfiguraciji (${sqlItems.length} pronađeno)`);
        setIsLoadingSQLData(false);
        return;
      }

      // Import new items
      const importEndpoint = isOperations
        ? "/api/config/operations/import"
        : "/api/config/spare-parts/import";

      const importResponse = await fetch(importEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: newItems.map((item: any) =>
            isOperations
              ? {
                  id: item.id,
                  code: item.code,
                  name: item.name,
                  description: "",
                }
              : {
                  id: item.id,
                  code: item.code,
                  name: item.name,
                  unit: "kom",
                }
          ),
        }),
      });

      const importResult = await importResponse.json();

      if (importResult.success) {
        alert(`Uspešno učitano ${newItems.length} novih stavki iz ERP-a!\n\nUkupno u ERP-u: ${sqlItems.length}\nDodato novih: ${newItems.length}\nVeć postojalo: ${sqlItems.length - newItems.length}`);
        fetchConfigData();
      } else {
        alert(importResult.message || `Greška pri import-u ${itemTypeSingular}`);
      }
    } catch (error) {
      console.error("Error loading from ERP:", error);
      alert(`Greška pri učitavanju ${itemTypeSingular} iz ERP-a. Proverite da li je ERP sistem pravilno konfigurisan.`);
    } finally {
      setIsLoadingSQLData(false);
    }
  };

  // CSV/Excel Import - Simple parsing
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        alert("Fajl mora imati header i bar jedan red podataka");
        return;
      }

      // Parse header
      const header = lines[0].split(/[,;\t]/).map((h) => h.trim().replace(/"/g, ""));

      // Find column indices
      const idIdx = header.findIndex((h) =>
        /ChItemId/i.test(h) || /chitemid/i.test(h)
      );
      const codeIdx = header.findIndex((h) =>
        /ChItemCode/i.test(h) || /chitemcode/i.test(h)
      );
      const nameIdx = header.findIndex((h) =>
        /ChItemName/i.test(h) || /chitemname/i.test(h)
      );
      const descIdx = header.findIndex((h) => /description/i.test(h));
      const unitIdx = header.findIndex((h) => /unit/i.test(h));

      if (codeIdx === -1 || nameIdx === -1) {
        alert("Fajl mora imati ChItemCode i ChItemName kolone!");
        return;
      }

      // Parse data rows
      const items = lines.slice(1).map((line) => {
        const cols = line.split(/[,;\t]/).map((c) => c.trim().replace(/"/g, ""));
        return {
          id: idIdx >= 0 ? cols[idIdx] : "",
          code: cols[codeIdx],
          name: cols[nameIdx],
          description: descIdx >= 0 ? cols[descIdx] : "",
          unit: unitIdx >= 0 ? cols[unitIdx] : "kom",
        };
      }).filter((item) => item.code && item.name);

      if (items.length === 0) {
        alert("Nije pronađen nijedan validan red podataka");
        return;
      }

      // Check for duplicates
      const existingIds = activeTab === "operations"
        ? operations.map((op) => op.id)
        : spareParts.map((sp) => sp.id);

      const existingCodes = activeTab === "operations"
        ? operations.map((op) => op.code)
        : spareParts.map((sp) => sp.code);

      const newItems = items.filter(
        (item) => !existingIds.includes(item.id) && !existingCodes.includes(item.code)
      );

      if (newItems.length === 0) {
        alert("Sve stavke već postoje (duplikati po ID ili Code)!");
        return;
      }

      // Send to API
      const endpoint =
        activeTab === "operations"
          ? "/api/config/operations/import"
          : "/api/config/spare-parts/import";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newItems }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Uspešno import-ovano ${newItems.length} stavki!`);
        setShowImportModal(false);
        fetchConfigData();
      } else {
        alert(result.message || "Greška pri import-u");
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      alert("Greška pri čitanju fajla. Proverite format (CSV ili TSV)");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper functions
  const resetForm = () => {
    setFormData({ id: "", code: "", name: "", description: "", unit: "" });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: OperationTemplate | SparePartTemplate) => {
    setSelectedItem(item);
    setFormData({
      id: item.id,
      code: item.code,
      name: item.name,
      description: (item as OperationTemplate).description || "",
      unit: (item as SparePartTemplate).unit || "",
    });
    setShowEditModal(true);
  };

  const currentItems = activeTab === "operations" ? operations : spareParts;

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
                <p className="text-sm text-gray-600">Konfiguracija</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <Navigation />

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("operations")}
              className={`${
                activeTab === "operations"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Operacije ({operations.length})
            </button>
            <button
              onClick={() => setActiveTab("spareParts")}
              className={`${
                activeTab === "spareParts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Rezervni delovi ({spareParts.length})
            </button>
            <button
              onClick={() => setActiveTab("deviceTypes")}
              className={`${
                activeTab === "deviceTypes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Tipovi Uređaja
            </button>
            {userRole === "gospodar" && (
              <button
                onClick={() => setActiveTab("systemSettings")}
                className={`${
                  activeTab === "systemSettings"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Sistemska Podešavanja
              </button>
            )}
          </nav>
        </div>

        {/* Action Buttons - Only for operations and spareParts */}
        {(activeTab === "operations" || activeTab === "spareParts") && (
          <div className="mt-6 flex gap-3 items-center">
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Dodaj novi
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>📊</span>
              Import iz CSV/Excel
            </button>
            {(activeTab === "spareParts" || activeTab === "operations") && (
              <button
                onClick={handleLoadFromSQL}
                disabled={isLoadingSQLData}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingSQLData ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Učitavanje...</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>Učitaj iz ERP-a</span>
                  </>
                )}
              </button>
            )}
            {/* Reset filters button */}
            {(filters.id || filters.code || filters.name || filters.unit || filters.status) && (
              <button
                onClick={() => setFilters({ id: "", code: "", name: "", unit: "", status: "" })}
                className="ml-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <span>✕</span>
                Resetuj filtere
              </button>
            )}
            <button
              onClick={fetchConfigData}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Osveži
            </button>
            {/* Send to Mobile Devices - Only send current tab data */}
            <button
              onClick={async () => {
                const itemType = activeTab === "operations" ? "operacije" : "rezervne delove";
                if (confirm(`Da li želite da pošaljete ${itemType} na sve mobilne uređaje?`)) {
                  try {
                    const response = await fetch(`/api/config/sync?type=${activeTab}`, { method: "POST" });
                    const data = await response.json();
                    if (data.success) {
                      alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} uspešno poslate na sve mobilne uređaje!`);
                    } else {
                      alert("Greška: " + data.message);
                    }
                  } catch {
                    alert("Greška prilikom slanja konfiguracije");
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold transition-colors shadow-sm"
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              Pošalji na Mobilne Uređaje
            </button>
          </div>
        )}

        {/* Content */}
        <div className="mt-6">
          {activeTab === "deviceTypes" ? (
            <DeviceTypesTab />
          ) : activeTab === "systemSettings" ? (
            <SystemSettingsTab systemTab={systemTab} setSystemTab={setSystemTab} />
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <DataTable
              items={currentItems}
              type={activeTab}
              onEdit={openEditModal}
              onToggle={handleToggleActive}
              onDelete={handleDelete}
              filters={filters}
              onFilterChange={(field, value) => {
                setFilters((prev) => ({ ...prev, [field]: value }));
              }}
            />
          )}
        </div>
      </div>

      {/* Add Modal - Only for operations and spareParts */}
      {showAddModal && (activeTab === "operations" || activeTab === "spareParts") && (
        <Modal
          title={`Dodaj ${activeTab === "operations" ? "operaciju" : "rezervni deo"}`}
          onClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <ItemForm
            formData={formData}
            setFormData={setFormData}
            type={activeTab}
            onSubmit={handleAdd}
            onCancel={() => {
              setShowAddModal(false);
              resetForm();
            }}
          />
        </Modal>
      )}

      {/* Edit Modal - Only for operations and spareParts */}
      {showEditModal && (activeTab === "operations" || activeTab === "spareParts") && (
        <Modal
          title={`Izmeni ${activeTab === "operations" ? "operaciju" : "rezervni deo"}`}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
            resetForm();
          }}
        >
          <ItemForm
            formData={formData}
            setFormData={setFormData}
            type={activeTab}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedItem(null);
              resetForm();
            }}
            isEdit
          />
        </Modal>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <Modal
          title={`Import ${activeTab === "operations" ? "operacija" : "rezervnih delova"} iz CSV/Excel`}
          onClose={() => setShowImportModal(false)}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Format CSV/Excel fajla:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>ChItemId</strong> - Jedinstveni ID (opciono)</li>
                <li>• <strong>ChItemCode</strong> - Šifra (obavezno)</li>
                <li>• <strong>ChItemName</strong> - Naziv (obavezno)</li>
                {activeTab === "operations" ? (
                  <li>• <strong>Description</strong> - Opis (opciono)</li>
                ) : (
                  <li>• <strong>Unit</strong> - Jedinica mere (opciono, default: &quot;kom&quot;)</li>
                )}
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                Podržani separatori: zarez (,), tačka-zarez (;), tab
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="text-4xl">📁</div>
                <p className="text-sm text-gray-600">
                  Klikni da izabereš CSV fajl
                </p>
                <p className="text-xs text-gray-500">.csv, .txt ili .tsv format</p>
              </label>
            </div>

            <button
              onClick={() => setShowImportModal(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Zatvori
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Data Table Component
function DataTable({
  items,
  type,
  onEdit,
  onToggle,
  onDelete,
  filters,
  onFilterChange,
}: {
  items: (OperationTemplate | SparePartTemplate)[];
  type: "operations" | "spareParts";
  onEdit: (item: OperationTemplate | SparePartTemplate) => void;
  onToggle: (item: OperationTemplate | SparePartTemplate) => void;
  onDelete: (id: string) => void;
  filters: {
    id: string;
    code: string;
    name: string;
    unit: string;
    status: string;
  };
  onFilterChange: (field: string, value: string) => void;
}) {
  // Apply filters
  const filteredItems = items.filter((item) => {
    const matchesId = !filters.id || item.id.toLowerCase().includes(filters.id.toLowerCase());
    const matchesCode = !filters.code || item.code.toLowerCase().includes(filters.code.toLowerCase());
    const matchesName = !filters.name || item.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesUnit = !filters.unit || (type === "spareParts" && (item as SparePartTemplate).unit?.toLowerCase().includes(filters.unit.toLowerCase()));
    const matchesStatus = !filters.status || (
      (filters.status === "aktivan" && item.isActive) ||
      (filters.status === "neaktivan" && !item.isActive)
    );

    return matchesId && matchesCode && matchesName && (type === "operations" || matchesUnit) && matchesStatus;
  });

  if (items.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-12 text-center">
        <p className="text-gray-500">Nema podataka</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* Results counter */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm text-gray-600">
          Prikazano <span className="font-semibold text-gray-900">{filteredItems.length}</span> od <span className="font-semibold text-gray-900">{items.length}</span> rezultata
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ChItemId
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ChItemCode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ChItemName
              </th>
              {type === "operations" ? (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Opis
                </th>
              ) : (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Jedinica
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Akcije
              </th>
            </tr>
            {/* Filter Row */}
            <tr className="bg-white border-b border-gray-200">
              <th className="px-6 py-2">
                <input
                  type="text"
                  value={filters.id}
                  onChange={(e) => onFilterChange("id", e.target.value)}
                  placeholder="Filtriraj..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-2">
                <input
                  type="text"
                  value={filters.code}
                  onChange={(e) => onFilterChange("code", e.target.value)}
                  placeholder="Filtriraj..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-2">
                <input
                  type="text"
                  value={filters.name}
                  onChange={(e) => onFilterChange("name", e.target.value)}
                  placeholder="Filtriraj..."
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-2">
                {type === "spareParts" ? (
                  <input
                    type="text"
                    value={filters.unit}
                    onChange={(e) => onFilterChange("unit", e.target.value)}
                    placeholder="Filtriraj..."
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="h-7"></div>
                )}
              </th>
              <th className="px-6 py-2">
                <select
                  value={filters.status}
                  onChange={(e) => onFilterChange("status", e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Svi</option>
                  <option value="aktivan">Aktivan</option>
                  <option value="neaktivan">Neaktivan</option>
                </select>
              </th>
              <th className="px-6 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                  {item.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                  {item.code}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {type === "operations"
                    ? (item as OperationTemplate).description || "-"
                    : (item as SparePartTemplate).unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggle(item)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      item.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {item.isActive ? "Aktivan" : "Neaktivan"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Izmeni
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Obriši
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Item Form Component
function ItemForm({
  formData,
  setFormData,
  type,
  onSubmit,
  onCancel,
  isEdit = false,
}: {
  formData: {
    id: string;
    code: string;
    name: string;
    description: string;
    unit: string;
  };
  setFormData: (data: {
    id: string;
    code: string;
    name: string;
    description: string;
    unit: string;
  }) => void;
  type: "operations" | "spareParts";
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  return (
    <div className="space-y-4">
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ChItemId (opciono)
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ostavi prazno za auto-generisanje"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ChItemCode <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Šifra"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ChItemName <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Naziv"
          required
        />
      </div>

      {type === "operations" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opis
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Opis operacije"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jedinica mere
          </label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="kom, m, kg, itd."
          />
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={onSubmit}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isEdit ? "Sačuvaj" : "Dodaj"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Otkaži
        </button>
      </div>
    </div>
  );
}

// Device Types Tab Component
function DeviceTypesTab() {
  const [deviceTypes] = useState([
    { id: "1", name: "Aparati za vodu", isActive: true },
    { id: "2", name: "Aparati za kafu", isActive: true },
    { id: "3", name: "Aparati za prečišćavanje vazduha", isActive: true },
    { id: "4", name: "Aparati za reverznu osmozu (G9)", isActive: true },
  ]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Tipovi Uređaja</h3>
        <p className="text-sm text-gray-600 mt-1">
          Predefinisani tipovi uređaja za servisersku aplikaciju
        </p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deviceTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔧</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{type.name}</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      type.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {type.isActive ? "Aktivan" : "Neaktivan"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Napomena:</strong> Tipovi uređaja su predefinisani i ne mogu
            se menjati preko panela. Za izmene kontaktirajte administratora sistema.
          </p>
        </div>
      </div>
    </div>
  );
}

// Database Connection Tab Component
function DatabaseConnectionTab() {
  const [dbConfig, setDbConfig] = useState({
    server: "",
    database: "",
    username: "",
    password: "",
    port: "1433",
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [troubleshooting, setTroubleshooting] = useState<string[]>([]);

  // Load existing config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/database/config");
        const data = await response.json();
        if (data.success && data.data) {
          setDbConfig(data.data);
        }
      } catch (error) {
        console.error("Error loading config:", error);
      }
    };
    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!dbConfig.server || !dbConfig.database || !dbConfig.username || !dbConfig.password) {
      alert("Sva polja su obavezna!");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/database/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbConfig),
      });

      const data = await response.json();

      if (data.success) {
        alert("Konfiguracija uspešno sačuvana! Restartujte aplikaciju da bi promene stupile na snagu.");
      } else {
        alert(`Greška: ${data.message}`);
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Greška pri snimanju konfiguracije");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    setTroubleshooting([]);
    try {
      const response = await fetch("/api/database/test");
      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setTestResult("Konekcija uspešna! ✓");
      } else {
        setIsConnected(false);
        setTestResult(`${data.message}`);
        if (data.troubleshooting) {
          setTroubleshooting(data.troubleshooting);
        }
      }
    } catch (error) {
      setIsConnected(false);
      setTestResult("Greška pri povezivanju sa bazom");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          Povezivanje sa ERP Sistemom
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Konfigurišite konekciju sa ERP sistemom (Microsoft SQL Server)
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Server <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={dbConfig.server}
              onChange={(e) =>
                setDbConfig({ ...dbConfig, server: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="localhost ili IP adresa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ime baze <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={dbConfig.database}
              onChange={(e) =>
                setDbConfig({ ...dbConfig, database: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ime baze podataka ERP-a"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Korisničko ime <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={dbConfig.username}
                onChange={(e) =>
                  setDbConfig({ ...dbConfig, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lozinka <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={dbConfig.password}
                onChange={(e) =>
                  setDbConfig({ ...dbConfig, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port
            </label>
            <input
              type="text"
              value={dbConfig.port}
              onChange={(e) =>
                setDbConfig({ ...dbConfig, port: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1433"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isSaving ? "Snimanje..." : "Snimi konfiguraciju"}
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Testiranje..." : "Testiraj konekciju"}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-lg ${
                isConnected
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p
                className={`text-sm font-semibold mb-2 ${
                  isConnected ? "text-green-800" : "text-red-800"
                }`}
              >
                {testResult}
              </p>
              {troubleshooting.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm font-semibold text-red-900 mb-2">Troubleshooting:</p>
                  <ul className="text-sm text-red-800 space-y-1 list-none">
                    {troubleshooting.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Napomena:</strong> Nakon snimanja konfiguracije, morate restartovati aplikaciju da bi promene stupile na snagu.
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Environment Varijable:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 font-mono">
              <li>DB_SERVER={dbConfig.server || "localhost"}</li>
              <li>DB_NAME={dbConfig.database || "your_database"}</li>
              <li>DB_USER={dbConfig.username || "sa"}</li>
              <li>DB_PASSWORD=***</li>
              <li>DB_PORT={dbConfig.port || "1433"}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// System Settings Tab Component
function SystemSettingsTab({
  systemTab,
  setSystemTab
}: {
  systemTab: "database" | "ubuntu";
  setSystemTab: (tab: "database" | "ubuntu") => void;
}) {
  return (
    <div>
      {/* Sub-tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSystemTab("database")}
            className={`${
              systemTab === "database"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Povezivanje sa ERP-om
          </button>
          <button
            onClick={() => setSystemTab("ubuntu")}
            className={`${
              systemTab === "ubuntu"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Ubuntu Sistem
          </button>
        </nav>
      </div>

      {/* Content */}
      {systemTab === "database" ? (
        <DatabaseConnectionTab />
      ) : (
        <UbuntuSystemTab />
      )}
    </div>
  );
}

// Ubuntu System Tab Component
function UbuntuSystemTab() {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchSystemInfo();

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchSystemInfo = async () => {
    setIsLoading(true);
    try {
      // Add timestamp to prevent any caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/system/info?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      console.log("System info received:", data);
      if (data.success) {
        setSystemInfo(data.data);
        console.log("System info set:", data.data);
      } else {
        console.error("API returned error:", data);
      }
    } catch (error) {
      console.error("Error fetching system info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSystem = async () => {
    if (!confirm("Da li ste sigurni da želite da ažurirate sistem? Ovo može potrajati nekoliko minuta.")) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/system/update", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        alert("Sistem je uspešno ažuriran!");
        fetchSystemInfo();
      } else {
        alert(`Greška: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating system:", error);
      alert("Greška pri ažuriranju sistema");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Greška pri učitavanju informacija o sistemu</p>
        <button
          onClick={fetchSystemInfo}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Pokušaj ponovo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Clock */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Trenutno Vreme Servera</p>
            <p className="text-3xl font-bold mt-1 font-mono">
              {currentTime.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-sm opacity-75 mt-1">
              {currentTime.toLocaleDateString('sr-RS', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-5xl">🕐</div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-xs font-mono text-yellow-900">
          Debug: systemInfo loaded = {systemInfo ? 'YES' : 'NO'}
        </p>
        {systemInfo && (
          <pre className="text-xs mt-2 overflow-auto max-h-40">
            {JSON.stringify(systemInfo, null, 2)}
          </pre>
        )}
      </div>

      {/* System Information */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Informacije o Sistemu</h3>
          <button
            onClick={fetchSystemInfo}
            disabled={isLoading}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Osveži
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OS Version */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Trenutna Verzija Sistema</p>
            <p className="text-lg font-semibold text-gray-900">
              {systemInfo.osVersion}
            </p>
          </div>

          {/* Kernel Version */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Kernel Verzija</p>
            <p className="text-lg font-semibold text-gray-900">
              {systemInfo.kernelVersion}
            </p>
          </div>

          {/* Disk Space */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Prostor na Disku</p>
            <p className="text-lg font-semibold text-gray-900">
              {systemInfo.diskSpace.used} / {systemInfo.diskSpace.total}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  systemInfo.diskSpace.percentage > 80 ? "bg-red-500" : "bg-green-500"
                }`}
                style={{ width: `${systemInfo.diskSpace.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {systemInfo.diskSpace.percentage}% iskorišćeno
            </p>
          </div>

          {/* RAM Memory */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">RAM Memorija</p>
            <p className="text-lg font-semibold text-gray-900">
              {systemInfo.ramMemory.used} / {systemInfo.ramMemory.total}
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  systemInfo.ramMemory.percentage > 80 ? "bg-red-500" : "bg-blue-500"
                }`}
                style={{ width: `${systemInfo.ramMemory.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {systemInfo.ramMemory.percentage}% iskorišćeno • {systemInfo.ramMemory.available} dostupno
            </p>
          </div>

          {/* Update Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Status Ažuriranja</p>
            <p className={`text-lg font-semibold ${
              systemInfo.updateAvailable ? "text-orange-600" : "text-green-600"
            }`}>
              {systemInfo.updateAvailable ? "Ažuriranje dostupno" : "Sistem je ažuriran"}
            </p>
          </div>
        </div>
      </div>

      {/* Web Admin Git Version */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Web Admin Aplikacija</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-600 mb-1">Git Verzija</p>
            <p className="text-lg font-semibold text-gray-900 font-mono">
              {systemInfo.gitVersion}
            </p>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-600 mb-1">Branch</p>
            <p className="text-lg font-semibold text-gray-900 font-mono">
              {systemInfo.gitBranch}
            </p>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-600 mb-1">Poslednja Izmena</p>
            <p className="text-sm text-gray-900">
              {systemInfo.lastCommitDate}
            </p>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg">
            <p className="text-sm text-indigo-600 mb-1">Commit Message</p>
            <p className="text-sm text-gray-900 truncate" title={systemInfo.lastCommitMessage}>
              {systemInfo.lastCommitMessage}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Akcije</h3>

        <div className="flex gap-3">
          <button
            onClick={handleUpdateSystem}
            disabled={isUpdating}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isUpdating ? "Ažuriranje u toku..." : "Ažuriraj Sistem"}
          </button>

          <button
            onClick={fetchSystemInfo}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Osveži Informacije
          </button>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Napomena:</strong> Ažuriranje sistema može potrajati nekoliko minuta. Aplikacija će možda biti nedostupna tokom ažuriranja.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfigurationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-600">Učitavanje...</div></div>}>
      <ConfigurationContent />
    </Suspense>
  );
}

// Modal Component
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
