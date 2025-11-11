import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useServiceStore } from "../state/serviceStore";
import { useAuthStore } from "../state/authStore";
import { useConfigStore } from "../state/configStore";
import { Operation, SparePart } from "../types";
import { LinearGradient } from "expo-linear-gradient";
import ConnectionIndicator from "../components/ConnectionIndicator";

export default function ServiceTicketScreen() {
  const navigation = useNavigation();
  const currentTicket = useServiceStore((s) => s.currentTicket);
  const completeTicket = useServiceStore((s) => s.completeTicket);
  const reopenTicket = useServiceStore((s) => s.reopenTicket);
  const user = useAuthStore((s) => s.user);
  const addOperationToCurrentTicket = useServiceStore(
    (s) => s.addOperationToCurrentTicket
  );
  const addSparePartToCurrentTicket = useServiceStore(
    (s) => s.addSparePartToCurrentTicket
  );
  const removeOperationFromCurrentTicket = useServiceStore(
    (s) => s.removeOperationFromCurrentTicket
  );
  const removeSparePartFromCurrentTicket = useServiceStore(
    (s) => s.removeSparePartFromCurrentTicket
  );

  const operations = useConfigStore((s) => s.operations);
  const spareParts = useConfigStore((s) => s.spareParts);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);
  const isLoadingConfig = useConfigStore((s) => s.isLoading);

  const [showOperationsModal, setShowOperationsModal] = useState(false);
  const [showSparePartsModal, setShowSparePartsModal] = useState(false);
  const [operationSearchQuery, setOperationSearchQuery] = useState("");
  const [sparePartSearchQuery, setSparePartSearchQuery] = useState("");

  const isSuperUser = user?.role === "super_user";
  const isCompleted = currentTicket?.status === "completed";

  // Fetch config on mount if empty
  useEffect(() => {
    if (operations.length === 0 || spareParts.length === 0) {
      fetchConfig();
    }
  }, []);

  // Filter only active items for display
  const availableOperations = operations.filter((op) => op.isActive);
  const availableSpareParts = spareParts.filter((sp) => sp.isActive);

  // Search/filter operations by code or name
  const filteredOperations = availableOperations.filter(
    (op) =>
      op.code.toLowerCase().includes(operationSearchQuery.toLowerCase()) ||
      op.name.toLowerCase().includes(operationSearchQuery.toLowerCase())
  );

  // Search/filter spare parts by code or name
  const filteredSpareParts = availableSpareParts.filter(
    (sp) =>
      sp.code.toLowerCase().includes(sparePartSearchQuery.toLowerCase()) ||
      sp.name.toLowerCase().includes(sparePartSearchQuery.toLowerCase())
  );

  if (!currentTicket) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text className="text-gray-900 text-lg font-semibold mt-4">
          Nema aktivnog servisa
        </Text>
      </View>
    );
  }

  const handleAddOperation = (op: { name: string; description?: string }) => {
    // Check if operation already exists in current ticket
    const alreadyExists = currentTicket.operations.some(
      (existingOp) => existingOp.name === op.name
    );

    if (alreadyExists) {
      // Operation already added, close modal
      setShowOperationsModal(false);
      setOperationSearchQuery("");
      return;
    }

    const operation: Operation = {
      id: Date.now().toString(),
      name: op.name,
      description: op.description,
    };
    addOperationToCurrentTicket(operation);
  };

  const handleAddSparePart = (part: { name: string }) => {
    // Check if spare part already exists in current ticket
    const existingPart = currentTicket.spareParts.find(
      (existingSp) => existingSp.name === part.name
    );

    if (existingPart) {
      // Spare part already exists, just increase quantity by 1
      const updatedPart: SparePart = {
        ...existingPart,
        quantity: existingPart.quantity + 1,
      };

      // Update the existing part instead of adding new
      removeSparePartFromCurrentTicket(existingPart.id);
      addSparePartToCurrentTicket(updatedPart);
      return;
    }

    // Add new spare part with quantity of 1
    const sparePart: SparePart = {
      id: Date.now().toString(),
      name: part.name,
      quantity: 1,
    };
    addSparePartToCurrentTicket(sparePart);
  };

  const handleComplete = () => {
    Alert.alert(
      "Završi servis",
      "Da li ste sigurni da želite da završite ovaj servis?",
      [
        { text: "Otkaži", style: "cancel" },
        {
          text: "Završi",
          style: "default",
          onPress: () => {
            completeTicket(currentTicket.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleReopen = () => {
    Alert.alert(
      "Ponovo otvori servis",
      "Da li ste sigurni da želite da ponovo otvorite ovaj servis?",
      [
        { text: "Otkaži", style: "cancel" },
        {
          text: "Otvori",
          style: "default",
          onPress: () => {
            reopenTicket(currentTicket.id);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Connection Indicator */}
      <ConnectionIndicator />

      <ScrollView className="flex-1">
        {/* App Header */}
        <LinearGradient
          colors={["#1E40AF", "#3B82F6"]}
          style={{ paddingTop: 50, paddingBottom: 16, paddingHorizontal: 24 }}
        >
          <Text className="text-white text-lg font-bold">
            La Fantana WHS - Servisni Modul
          </Text>
        </LinearGradient>

        {/* Device Info Card */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center">
              <Ionicons name="water" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-xs font-medium mb-1">
                Servis No.
              </Text>
              <Text className="text-blue-600 text-base font-bold mb-2">
                {currentTicket.serviceNumber}
              </Text>
              <Text className="text-gray-500 text-xs font-medium mb-1">
                Uređaj
              </Text>
              <Text className="text-gray-900 text-xl font-bold">
                {currentTicket.deviceCode}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-lg ${isCompleted ? "bg-emerald-50" : "bg-amber-50"}`}>
              <Text className={`text-xs font-semibold ${isCompleted ? "text-emerald-600" : "text-amber-600"}`}>
                {isCompleted ? "ZAVRŠENO" : "U TOKU"}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Information Card */}
        <View className="bg-gradient-to-r from-blue-50 to-indigo-50 mx-6 mt-4 rounded-2xl p-4 border border-blue-100">
          <View className="flex-row items-center gap-3 mb-3">
            <Ionicons name="time-outline" size={20} color="#3B82F6" />
            <Text className="text-gray-900 text-base font-bold">
              Podaci o servisu
            </Text>
          </View>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-600 text-sm">Početak:</Text>
              <Text className="text-gray-900 text-sm font-semibold">
                {new Date(currentTicket.startTime).toLocaleString("sr-RS", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            {currentTicket.endTime && (
              <>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600 text-sm">Završetak:</Text>
                  <Text className="text-gray-900 text-sm font-semibold">
                    {new Date(currentTicket.endTime).toLocaleString("sr-RS", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View className="h-px bg-blue-200 my-1" />
                <View className="flex-row justify-between">
                  <Text className="text-gray-600 text-sm font-medium">Trajanje:</Text>
                  <Text className="text-blue-600 text-base font-bold">
                    {(() => {
                      const duration = currentTicket.durationMinutes ||
                        Math.round((new Date(currentTicket.endTime).getTime() -
                          new Date(currentTicket.startTime).getTime()) / 60000);
                      return duration;
                    })()}
                    <Text> min</Text>
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Operations Section */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 text-lg font-bold">Operacije</Text>
            {!isCompleted && (
              <Pressable
                onPress={() => setShowOperationsModal(true)}
                className="flex-row items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl active:opacity-80"
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text className="text-white text-sm font-semibold">Dodaj</Text>
              </Pressable>
            )}
          </View>

          {currentTicket.operations.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-gray-200 border-dashed">
              <Ionicons name="build-outline" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm mt-2">
                Nema dodanih operacija
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {currentTicket.operations.map((op) => (
                <View
                  key={op.id}
                  className="bg-white rounded-xl p-4 flex-row items-start justify-between shadow-sm"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-gray-900 text-base font-semibold mb-1">
                      {op.name}
                    </Text>
                    {op.description && (
                      <Text className="text-gray-500 text-sm">
                        {op.description}
                      </Text>
                    )}
                  </View>
                  {!isCompleted && (
                    <Pressable
                      onPress={() => removeOperationFromCurrentTicket(op.id)}
                      className="w-8 h-8 items-center justify-center active:opacity-60"
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Spare Parts Section */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 text-lg font-bold">
              Rezervni delovi
            </Text>
            {!isCompleted && (
              <Pressable
                onPress={() => setShowSparePartsModal(true)}
                className="flex-row items-center gap-2 bg-emerald-600 px-4 py-2 rounded-xl active:opacity-80"
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text className="text-white text-sm font-semibold">Dodaj</Text>
              </Pressable>
            )}
          </View>

          {currentTicket.spareParts.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-gray-200 border-dashed">
              <Ionicons name="cube-outline" size={32} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm mt-2">
                Nema utrošenih delova
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              {currentTicket.spareParts.map((part) => (
                <View
                  key={part.id}
                  className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm"
                >
                  <View className="flex-1 flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-emerald-50 rounded-lg items-center justify-center">
                      <Text className="text-emerald-600 text-base font-bold">
                        {part.quantity}
                      </Text>
                    </View>
                    <Text className="flex-1 text-gray-900 text-base font-medium">
                      {part.name}
                    </Text>
                  </View>
                  {!isCompleted && (
                    <Pressable
                      onPress={() => removeSparePartFromCurrentTicket(part.id)}
                      className="w-8 h-8 items-center justify-center active:opacity-60"
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Complete/Reopen Button */}
        <View className="px-6 py-6">
          {isCompleted ? (
            // Reopen button (only for super_user)
            isSuperUser ? (
              <Pressable
                onPress={handleReopen}
                className="active:opacity-80"
              >
                <LinearGradient
                  colors={["#F59E0B", "#D97706"]}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 18,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="refresh-circle" size={24} color="#FFFFFF" />
                  <Text className="text-white text-lg font-bold">
                    Ponovo otvori servis
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <View className="bg-gray-100 rounded-2xl p-6 items-center">
                <Ionicons name="lock-closed" size={32} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm mt-2 text-center">
                  Servis je završen. Samo administrator može ponovo otvoriti servis.
                </Text>
              </View>
            )
          ) : (
            // Complete button (only if service is in progress)
            <>
              <Pressable
                onPress={handleComplete}
                disabled={currentTicket.operations.length === 0}
                className="active:opacity-80"
              >
                <LinearGradient
                  colors={
                    currentTicket.operations.length === 0
                      ? ["#9CA3AF", "#6B7280"]
                      : ["#10B981", "#059669"]
                  }
                  style={{
                    borderRadius: 16,
                    paddingVertical: 18,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text className="text-white text-lg font-bold">
                    Završi servis
                  </Text>
                </LinearGradient>
              </Pressable>
              {currentTicket.operations.length === 0 && (
                <Text className="text-gray-500 text-sm text-center mt-2">
                  Dodajte bar jednu operaciju da završite servis
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Operations Modal */}
      <Modal
        visible={showOperationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowOperationsModal(false);
          setOperationSearchQuery("");
        }}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-gray-900 text-xl font-bold">
              Dodaj operaciju
            </Text>
            <Pressable
              onPress={() => {
                setShowOperationsModal(false);
                setOperationSearchQuery("");
              }}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={28} color="#6B7280" />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <View className="flex-row items-center bg-white rounded-lg px-4 py-3 border border-gray-300">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 text-base"
                placeholder="Pretraži po šifri ili nazivu..."
                placeholderTextColor="#9CA3AF"
                value={operationSearchQuery}
                onChangeText={setOperationSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {operationSearchQuery.length > 0 && (
                <Pressable onPress={() => setOperationSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
            <Text className="text-gray-500 text-xs mt-2">
              {filteredOperations.length} {filteredOperations.length === 1 ? "rezultat" : "rezultata"}
            </Text>
          </View>

          <ScrollView className="flex-1">
            <View className="p-6 gap-2">
              {isLoadingConfig ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="text-gray-500 text-sm mt-3">
                    Učitavam operacije...
                  </Text>
                </View>
              ) : filteredOperations.length === 0 ? (
                <View className="py-12 items-center">
                  <Ionicons name="alert-circle" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 text-sm mt-3">
                    {operationSearchQuery
                      ? "Nema rezultata pretrage"
                      : "Nema dostupnih operacija"}
                  </Text>
                </View>
              ) : (
                filteredOperations.map((op) => {
                  const isAlreadyAdded = currentTicket.operations.some(
                    (existingOp) => existingOp.name === op.name
                  );

                  return (
                    <Pressable
                      key={op.id}
                      onPress={() => {
                        handleAddOperation(op);
                        setShowOperationsModal(false);
                        setOperationSearchQuery("");
                      }}
                      disabled={isAlreadyAdded}
                      className={`rounded-xl p-4 ${
                        isAlreadyAdded
                          ? "bg-gray-100 opacity-50"
                          : "bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-blue-600 text-xs font-semibold">
                          {op.code}
                        </Text>
                        {isAlreadyAdded && (
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text className="text-emerald-600 text-xs font-semibold">
                              Dodato
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-900 text-base font-semibold mb-1">
                        {op.name}
                      </Text>
                      {op.description && (
                        <Text className="text-gray-600 text-sm">
                          {op.description}
                        </Text>
                      )}
                    </Pressable>
                  );
                })
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Spare Parts Modal */}
      <Modal
        visible={showSparePartsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowSparePartsModal(false);
          setSparePartSearchQuery("");
        }}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-gray-900 text-xl font-bold">
              Dodaj rezervni deo
            </Text>
            <Pressable
              onPress={() => {
                setShowSparePartsModal(false);
                setSparePartSearchQuery("");
              }}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={28} color="#6B7280" />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <View className="flex-row items-center bg-white rounded-lg px-4 py-3 border border-gray-300">
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 text-base"
                placeholder="Pretraži po šifri ili nazivu..."
                placeholderTextColor="#9CA3AF"
                value={sparePartSearchQuery}
                onChangeText={setSparePartSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {sparePartSearchQuery.length > 0 && (
                <Pressable onPress={() => setSparePartSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </Pressable>
              )}
            </View>
            <Text className="text-gray-500 text-xs mt-2">
              {filteredSpareParts.length} {filteredSpareParts.length === 1 ? "rezultat" : "rezultata"}
            </Text>
          </View>

          <ScrollView className="flex-1">
            <View className="p-6 gap-3">
              {isLoadingConfig ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#10B981" />
                  <Text className="text-gray-500 text-sm mt-3">
                    Učitavam delove...
                  </Text>
                </View>
              ) : filteredSpareParts.length === 0 ? (
                <View className="py-12 items-center">
                  <Ionicons name="alert-circle" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 text-sm mt-3">
                    {sparePartSearchQuery
                      ? "Nema rezultata pretrage"
                      : "Nema dostupnih delova"}
                  </Text>
                </View>
              ) : (
                filteredSpareParts.map((part) => {
                  const existingPart = currentTicket.spareParts.find(
                    (sp) => sp.name === part.name
                  );

                  return (
                    <View
                      key={part.id}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-emerald-600 text-xs font-semibold mb-1">
                            {part.code}
                          </Text>
                          <Text className="text-gray-900 text-base font-semibold">
                            {part.name}
                          </Text>
                          {existingPart && (
                            <View className="flex-row items-center gap-1 mt-1">
                              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                              <Text className="text-emerald-600 text-xs">
                                Trenutno: {existingPart.quantity} {part.unit}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Pressable
                        onPress={() => {
                          handleAddSparePart(part);
                          setShowSparePartsModal(false);
                          setSparePartSearchQuery("");
                        }}
                        className="bg-emerald-600 px-6 py-4 rounded-xl active:opacity-80 w-full"
                      >
                        <Text className="text-white text-base font-semibold text-center">
                          {existingPart ? "Dodaj još" : "Dodaj"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
