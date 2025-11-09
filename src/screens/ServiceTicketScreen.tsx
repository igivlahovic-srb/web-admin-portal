import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useServiceStore } from "../state/serviceStore";
import { Operation, SparePart } from "../types";
import { LinearGradient } from "expo-linear-gradient";

// Predefined operations and spare parts
const AVAILABLE_OPERATIONS = [
  { name: "Čišćenje rezervoara", description: "Potpuno čišćenje i dezinfekcija" },
  { name: "Zamena filtera", description: "Zamena filter uloška" },
  { name: "Provera slavina", description: "Kontrola i podmazivanje slavina" },
  { name: "Provera sistema hlađenja", description: "Testiranje kompresorske jedinice" },
  { name: "Provera grejača", description: "Testiranje grejnog elementa" },
  { name: "Zamena cevi", description: "Zamena dotrajalih cevi" },
];

const AVAILABLE_SPARE_PARTS = [
  { name: "Filter uložak" },
  { name: "Slavina - hladna voda" },
  { name: "Slavina - topla voda" },
  { name: "Cev - silikonska 8mm" },
  { name: "Grejač" },
  { name: "Termostat" },
];

export default function ServiceTicketScreen() {
  const navigation = useNavigation();
  const currentTicket = useServiceStore((s) => s.currentTicket);
  const completeTicket = useServiceStore((s) => s.completeTicket);
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

  const [showOperationsModal, setShowOperationsModal] = useState(false);
  const [showSparePartsModal, setShowSparePartsModal] = useState(false);
  const [sparePartQuantity, setSparePartQuantity] = useState<{
    [key: string]: number;
  }>({});

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
    const operation: Operation = {
      id: Date.now().toString(),
      name: op.name,
      description: op.description,
    };
    addOperationToCurrentTicket(operation);
  };

  const handleAddSparePart = (part: { name: string }) => {
    const quantity = sparePartQuantity[part.name] || 1;
    const sparePart: SparePart = {
      id: Date.now().toString(),
      name: part.name,
      quantity,
    };
    addSparePartToCurrentTicket(sparePart);
    setSparePartQuantity({ ...sparePartQuantity, [part.name]: 1 });
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

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Device Info Card */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center">
              <Ionicons name="water" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-xs font-medium mb-1">
                Uređaj
              </Text>
              <Text className="text-gray-900 text-xl font-bold">
                {currentTicket.deviceCode}
              </Text>
            </View>
            <View className="px-3 py-1 bg-amber-50 rounded-lg">
              <Text className="text-amber-600 text-xs font-semibold">
                U TOKU
              </Text>
            </View>
          </View>
        </View>

        {/* Operations Section */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 text-lg font-bold">Operacije</Text>
            <Pressable
              onPress={() => setShowOperationsModal(true)}
              className="flex-row items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl active:opacity-80"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold">Dodaj</Text>
            </Pressable>
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
                  <Pressable
                    onPress={() => removeOperationFromCurrentTicket(op.id)}
                    className="w-8 h-8 items-center justify-center active:opacity-60"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </Pressable>
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
            <Pressable
              onPress={() => setShowSparePartsModal(true)}
              className="flex-row items-center gap-2 bg-emerald-600 px-4 py-2 rounded-xl active:opacity-80"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold">Dodaj</Text>
            </Pressable>
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
                  <Pressable
                    onPress={() => removeSparePartFromCurrentTicket(part.id)}
                    className="w-8 h-8 items-center justify-center active:opacity-60"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Complete Button */}
        <View className="px-6 py-6">
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
        </View>
      </ScrollView>

      {/* Operations Modal */}
      <Modal
        visible={showOperationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOperationsModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-gray-900 text-xl font-bold">
              Dodaj operaciju
            </Text>
            <Pressable
              onPress={() => setShowOperationsModal(false)}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={28} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView className="flex-1">
            <View className="p-6 gap-2">
              {AVAILABLE_OPERATIONS.map((op, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    handleAddOperation(op);
                    setShowOperationsModal(false);
                  }}
                  className="bg-gray-50 rounded-xl p-4 active:bg-gray-100"
                >
                  <Text className="text-gray-900 text-base font-semibold mb-1">
                    {op.name}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {op.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Spare Parts Modal */}
      <Modal
        visible={showSparePartsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSparePartsModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-gray-900 text-xl font-bold">
              Dodaj rezervni deo
            </Text>
            <Pressable
              onPress={() => setShowSparePartsModal(false)}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={28} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView className="flex-1">
            <View className="p-6 gap-3">
              {AVAILABLE_SPARE_PARTS.map((part, index) => (
                <View
                  key={index}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="flex-1 text-gray-900 text-base font-semibold">
                      {part.name}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-1 flex-row items-center bg-white rounded-lg px-4 py-2 border border-gray-200">
                      <Text className="text-gray-500 text-sm mr-2">
                        Količina:
                      </Text>
                      <TextInput
                        className="flex-1 text-gray-900 text-base"
                        keyboardType="number-pad"
                        value={(
                          sparePartQuantity[part.name] || 1
                        ).toString()}
                        onChangeText={(text) => {
                          const qty = parseInt(text) || 1;
                          setSparePartQuantity({
                            ...sparePartQuantity,
                            [part.name]: qty,
                          });
                        }}
                      />
                    </View>
                    <Pressable
                      onPress={() => {
                        handleAddSparePart(part);
                        setShowSparePartsModal(false);
                      }}
                      className="bg-emerald-600 px-6 py-3 rounded-lg active:opacity-80"
                    >
                      <Text className="text-white text-sm font-semibold">
                        Dodaj
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
