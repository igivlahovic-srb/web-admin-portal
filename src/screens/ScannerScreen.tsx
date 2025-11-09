import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CameraView,
  CameraType,
  useCameraPermissions,
} from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useServiceStore } from "../state/serviceStore";
import { useAuthStore } from "../state/authStore";
import { ServiceTicket } from "../types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ScannerScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const navigation = useNavigation<NavigationProp>();

  const addTicket = useServiceStore((s) => s.addTicket);
  const setCurrentTicket = useServiceStore((s) => s.setCurrentTicket);
  const tickets = useServiceStore((s) => s.tickets);
  const user = useAuthStore((s) => s.user);

  if (!permission) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-gray-900">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="camera-outline" size={80} color="#6B7280" />
          <Text className="text-white text-xl font-semibold mt-6 mb-3 text-center">
            Potreban pristup kameri
          </Text>
          <Text className="text-gray-400 text-base text-center mb-8">
            Da biste skenirali aparat, potreban je pristup kameri.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="bg-blue-600 px-8 py-4 rounded-xl active:opacity-80"
          >
            <Text className="text-white text-base font-semibold">
              Omogući pristup
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned || processing) return;

    // Check if there's already an active ticket with this device code
    const existingActiveTicket = tickets.find(
      (t) => t.deviceCode === data && t.status === "in_progress"
    );

    if (existingActiveTicket) {
      // If ticket already exists, just navigate to it
      setScanned(true);
      setProcessing(true);
      setCurrentTicket(existingActiveTicket);
      setTimeout(() => {
        setProcessing(false);
        setScanned(false);
        navigation.replace("ServiceTicket");
      }, 300);
      return;
    }

    setScanned(true);
    setProcessing(true);

    // Create new service ticket with unique ID
    const newTicket: ServiceTicket = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceCode: data,
      technicianId: user?.id || "",
      technicianName: user?.name || "",
      startTime: new Date(),
      status: "in_progress",
      operations: [],
      spareParts: [],
    };

    addTicket(newTicket);
    setCurrentTicket(newTicket);

    // Replace scanner with service ticket screen
    setTimeout(() => {
      setProcessing(false);
      setScanned(false);
      navigation.replace("ServiceTicket");
    }, 500);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const createTicketWithCode = (code: string) => {
    // Check if there's already an active ticket with this device code
    const existingActiveTicket = tickets.find(
      (t) => t.deviceCode === code && t.status === "in_progress"
    );

    if (existingActiveTicket) {
      // If ticket already exists, just navigate to it
      setCurrentTicket(existingActiveTicket);
      navigation.replace("ServiceTicket");
      return;
    }

    const newTicket: ServiceTicket = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      deviceCode: code,
      technicianId: user?.id || "",
      technicianName: user?.name || "",
      startTime: new Date(),
      status: "in_progress",
      operations: [],
      spareParts: [],
    };

    addTicket(newTicket);
    setCurrentTicket(newTicket);

    // Replace scanner with service ticket screen
    navigation.replace("ServiceTicket");
  };

  const handleManualEntry = () => {
    setShowManualEntry(true);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      Keyboard.dismiss();
      setShowManualEntry(false);
      createTicketWithCode(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "ean13",
            "ean8",
            "code128",
            "code39",
            "code93",
            "datamatrix",
            "pdf417",
          ],
        }}
      />

      {/* Overlay UI */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Header */}
        <SafeAreaView edges={["top"]}>
          <View className="px-4 py-3 flex-row items-center justify-between">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center bg-black/50 rounded-full active:opacity-70"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={toggleCameraFacing}
              className="w-10 h-10 items-center justify-center bg-black/50 rounded-full active:opacity-70"
            >
              <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Scanning Frame */}
        <View className="flex-1 items-center justify-center">
          <View className="relative">
            {/* QR Frame */}
            <View className="w-64 h-64 border-2 border-white rounded-3xl">
              {/* Corner decorations */}
              <View className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl" />
              <View className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl" />
              <View className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl" />
              <View className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl" />
            </View>

            {processing && (
              <View className="absolute inset-0 items-center justify-center bg-black/60 rounded-3xl">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-white text-base font-medium mt-3">
                  Procesiranje...
                </Text>
              </View>
            )}
          </View>

          <Text className="text-white text-lg font-medium mt-8 text-center px-8">
            Skenirajte aparat
          </Text>
          <Text className="text-gray-300 text-sm mt-2 text-center px-8">
            Podržava QR, EAN13, EAN8 i 2D kodove
          </Text>
        </View>

        {/* Bottom Actions */}
        <SafeAreaView edges={["bottom"]}>
          <View className="px-6 pb-6">
            <Pressable
              onPress={handleManualEntry}
              className="bg-white/20 backdrop-blur px-6 py-4 rounded-2xl active:opacity-70"
            >
              <Text className="text-white text-base font-semibold text-center">
                Unesi šifru ručno
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowManualEntry(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-gray-900 text-xl font-bold">
                Ručni unos šifre
              </Text>
              <Pressable
                onPress={() => {
                  setShowManualEntry(false);
                  setManualCode("");
                }}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="close" size={28} color="#6B7280" />
              </Pressable>
            </View>

            {/* Content */}
            <View className="flex-1 px-6 py-8">
              <View className="bg-blue-50 rounded-2xl p-4 flex-row items-start gap-3 mb-6">
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                <Text className="flex-1 text-blue-900 text-sm">
                  Unesite identifikacionu šifru water aparata. Ovo može biti
                  EAN kod, serijski broj ili bilo koji identifikator.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 text-sm font-semibold mb-2">
                  Šifra aparata
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border-2 border-gray-200">
                  <Ionicons name="keypad-outline" size={24} color="#6B7280" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-900 text-lg"
                    placeholder="npr. 8901234567890"
                    placeholderTextColor="#9CA3AF"
                    value={manualCode}
                    onChangeText={setManualCode}
                    autoFocus
                    autoCapitalize="characters"
                    returnKeyType="done"
                    onSubmitEditing={handleManualSubmit}
                  />
                  {manualCode.length > 0 && (
                    <Pressable
                      onPress={() => setManualCode("")}
                      className="w-8 h-8 items-center justify-center"
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  )}
                </View>
                {manualCode.length > 0 && (
                  <Text className="text-gray-500 text-xs mt-2">
                    {manualCode.length} karaktera
                  </Text>
                )}
              </View>

              <Pressable
                onPress={handleManualSubmit}
                disabled={!manualCode.trim()}
                className={`rounded-2xl px-6 py-4 ${
                  manualCode.trim()
                    ? "bg-blue-600 active:opacity-80"
                    : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-center text-base font-bold ${
                    manualCode.trim() ? "text-white" : "text-gray-400"
                  }`}
                >
                  Kreiraj servisni nalog
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
