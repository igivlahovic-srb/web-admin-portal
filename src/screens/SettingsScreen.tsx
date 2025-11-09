import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSyncStore } from "../state/syncStore";
import { useAuthStore } from "../state/authStore";
import { useServiceStore } from "../state/serviceStore";
import { format } from "date-fns";

export default function SettingsScreen() {
  const apiUrl = useSyncStore((s) => s.apiUrl);
  const autoSync = useSyncStore((s) => s.autoSync);
  const lastSyncTime = useSyncStore((s) => s.lastSyncTime);
  const isSyncing = useSyncStore((s) => s.isSyncing);

  const setApiUrl = useSyncStore((s) => s.setApiUrl);
  const setAutoSync = useSyncStore((s) => s.setAutoSync);
  const setLastSyncTime = useSyncStore((s) => s.setLastSyncTime);
  const setIsSyncing = useSyncStore((s) => s.setIsSyncing);
  const testConnection = useSyncStore((s) => s.testConnection);

  const syncUsersToWeb = useAuthStore((s) => s.syncToWeb);
  const syncTicketsToWeb = useServiceStore((s) => s.syncToWeb);

  const [urlInput, setUrlInput] = useState(apiUrl);
  const [testing, setTesting] = useState(false);

  const handleSaveUrl = () => {
    if (!urlInput.trim()) {
      Alert.alert("Greška", "URL ne može biti prazan");
      return;
    }

    setApiUrl(urlInput.trim());
    Alert.alert("Uspeh", "API URL sačuvan");
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const success = await testConnection();
    setTesting(false);

    if (success) {
      Alert.alert("Uspeh", "Konekcija sa web panelom je uspešna! ✅");
    } else {
      Alert.alert(
        "Greška",
        "Ne mogu da se povežem sa web panelom. Proverite URL i da li je server pokrenut."
      );
    }
  };

  const handleSyncNow = async () => {
    if (isSyncing) return;

    setIsSyncing(true);

    try {
      // Test connection first
      const connectionOk = await testConnection();
      if (!connectionOk) {
        Alert.alert(
          "Greška konekcije",
          "Ne mogu da se povežem sa web panelom. Proverite podešavanja."
        );
        setIsSyncing(false);
        return;
      }

      // Sync users
      const usersSync = await syncUsersToWeb();
      if (!usersSync) {
        Alert.alert("Greška", "Sinhronizacija korisnika nije uspela");
        setIsSyncing(false);
        return;
      }

      // Sync tickets
      const ticketsSync = await syncTicketsToWeb();
      if (!ticketsSync) {
        Alert.alert("Greška", "Sinhronizacija servisa nije uspela");
        setIsSyncing(false);
        return;
      }

      setLastSyncTime(new Date());
      Alert.alert(
        "Uspeh",
        "Svi podaci su uspešno sinhronizovani sa web panelom! ✅"
      );
    } catch (error) {
      Alert.alert("Greška", "Došlo je do greške pri sinhronizaciji");
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          {/* Sync Status Card */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 text-xl font-bold">
                Web Admin Sync
              </Text>
              <Ionicons name="cloud-outline" size={32} color="#3B82F6" />
            </View>

            {lastSyncTime && (
              <View className="bg-blue-50 rounded-xl p-3 mb-4">
                <Text className="text-blue-900 text-sm font-medium">
                  Poslednja sinhronizacija:
                </Text>
                <Text className="text-blue-700 text-xs mt-1">
                  {format(new Date(lastSyncTime), "dd.MM.yyyy HH:mm:ss")}
                </Text>
              </View>
            )}

            <Text className="text-gray-600 text-sm mb-4">
              Sinhronizujte podatke između mobilne aplikacije i web admin panela
            </Text>

            <Pressable
              onPress={handleSyncNow}
              disabled={isSyncing || testing}
              className={`rounded-2xl px-6 py-4 flex-row items-center justify-center ${
                isSyncing || testing ? "bg-gray-300" : "bg-blue-600"
              }`}
            >
              {isSyncing ? (
                <>
                  <ActivityIndicator color="#FFFFFF" className="mr-2" />
                  <Text className="text-white text-base font-bold">
                    Sinhronizacija u toku...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="sync" size={20} color="#FFFFFF" />
                  <Text className="text-white text-base font-bold ml-2">
                    Sinhronizuj sada
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Auto Sync Setting */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-gray-900 text-base font-bold mb-1">
                  Automatska sinhronizacija
                </Text>
                <Text className="text-gray-600 text-sm">
                  Automatski sinhronizuj podatke nakon promene
                </Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={autoSync ? "#3B82F6" : "#F3F4F6"}
              />
            </View>
          </View>

          {/* API Configuration */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <Text className="text-gray-900 text-xl font-bold mb-4">
              Podešavanja API-ja
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 text-sm font-semibold mb-2">
                Web Admin Panel URL
              </Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                placeholder="http://localhost:3000"
                placeholderTextColor="#9CA3AF"
                value={urlInput}
                onChangeText={setUrlInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text className="text-gray-500 text-xs mt-2">
                Unesite URL gde je pokrenut web admin panel
              </Text>
            </View>

            <View className="flex-row gap-2">
              <Pressable
                onPress={handleSaveUrl}
                disabled={testing || isSyncing}
                className="flex-1 bg-blue-600 rounded-xl px-4 py-3 active:opacity-80"
              >
                <Text className="text-white text-sm font-semibold text-center">
                  💾 Sačuvaj
                </Text>
              </Pressable>

              <Pressable
                onPress={handleTestConnection}
                disabled={testing || isSyncing}
                className="flex-1 bg-emerald-600 rounded-xl px-4 py-3 active:opacity-80"
              >
                {testing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-sm font-semibold text-center">
                    🔌 Testiraj
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Info Card */}
          <View className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
              <View className="flex-1">
                <Text className="text-blue-900 text-sm font-semibold mb-1">
                  Kako koristiti Web Admin Panel:
                </Text>
                <Text className="text-blue-800 text-xs leading-5">
                  1. Pokrenite web admin panel na računaru{"\n"}
                  2. Unesite URL servera (npr. http://192.168.1.100:3000){"\n"}
                  3. Testirajte konekciju{"\n"}
                  4. Kliknite &quot;Sinhronizuj sada&quot; da prebacite podatke{"\n"}
                  {"\n"}
                  💡 Za lokalno testiranje koristite IP adresu računara umesto
                  localhost
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
