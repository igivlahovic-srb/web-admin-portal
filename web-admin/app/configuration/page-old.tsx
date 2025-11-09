"use client";

import { useState, useEffect } from "react";
import { OperationTemplate, SparePartTemplate } from "../../types";

export default function ConfigurationPage() {
  const [operations, setOperations] = useState<OperationTemplate[]>([]);
  const [spareParts, setSpareParts] = useState<SparePartTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<"operations" | "spareParts">("operations");
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Konfiguracija</h1>
            <p className="mt-2 text-sm text-gray-600">
              Upravljanje operacijama i rezervnim delovima
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
              Operacije
            </button>
            <button
              onClick={() => setActiveTab("spareParts")}
              className={`${
                activeTab === "spareParts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Rezervni delovi
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === "operations" ? (
            <OperationsTable operations={operations} onRefresh={fetchConfigData} />
          ) : (
            <SparePartsTable spareParts={spareParts} onRefresh={fetchConfigData} />
          )}
        </div>
      </div>
    </div>
  );
}

// Operations Table Component
function OperationsTable({
  operations,
  onRefresh,
}: {
  operations: OperationTemplate[];
  onRefresh: () => void;
}) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Operacije ({operations.length})
        </h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Osveži
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ItemId
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ItemCode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ItemName
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Opis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operations.map((op) => (
              <tr key={op.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {op.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                  {op.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {op.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {op.description || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      op.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {op.isActive ? "Aktivan" : "Neaktivan"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {operations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nema operacija</p>
        </div>
      )}
    </div>
  );
}

// Spare Parts Table Component
function SparePartsTable({
  spareParts,
  onRefresh,
}: {
  spareParts: SparePartTemplate[];
  onRefresh: () => void;
}) {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Rezervni delovi ({spareParts.length})
        </h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Osveži
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ItemId
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ItemCode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ItemName
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jedinica
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {spareParts.map((part) => (
              <tr key={part.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {part.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-semibold">
                  {part.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {part.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {part.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      part.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {part.isActive ? "Aktivan" : "Neaktivan"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {spareParts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nema rezervnih delova</p>
        </div>
      )}
    </div>
  );
}
