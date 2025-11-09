"use client";

import { useState, useEffect, useRef } from "react";
import { OperationTemplate, SparePartTemplate } from "../../types";

export default function ConfigurationPage() {
  const [operations, setOperations] = useState<OperationTemplate[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<"operations" | "spareParts">("operations");
  const [isLoading, setIsLoading] = useState(true);

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch configuration data
  useEffect(() => {
    fetchConfigData();
  }, []);

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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Konfiguracija</h1>
            <p className="mt-2 text-sm text-gray-600">
              Upravljanje šifarnicima operacija i rezervnih delova
            </p>
          </div>
        </div>
      </div>

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
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
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
          <button
            onClick={fetchConfigData}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Osveži
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {isLoading ? (
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
            />
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
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

      {/* Edit Modal */}
      {showEditModal && (
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
}: {
  items: (OperationTemplate | SparePartTemplate)[];
  type: "operations" | "spareParts";
  onEdit: (item: OperationTemplate | SparePartTemplate) => void;
  onToggle: (item: OperationTemplate | SparePartTemplate) => void;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-12 text-center">
        <p className="text-gray-500">Nema podataka</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
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
