import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useServiceStore } from "../state/serviceStore";
import { useSyncStore } from "../state/syncStore";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const tickets = useServiceStore((s) => s.tickets);

  const [syncing, setSyncing] = useState(false);

  const apiUrl = useSyncStore((s) => s.apiUrl);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const setIsSyncing = useSyncStore((s) => s.setIsSyncing);
  const setLastSyncTime = useSyncStore((s) => s.setLastSyncTime);
  const testConnection = useSyncStore((s) => s.testConnection);

  const syncUsersToWeb = useAuthStore((s) => s.syncToWeb);
  const syncTicketsToWeb = useServiceStore((s) => s.syncToWeb);

  const isSuperUser = user?.role === "super_user";

  const myTickets = isSuperUser
    ? tickets
    : tickets.filter((t) => t.technicianId === user?.id);

  const completedTickets = myTickets.filter((t) => t.status === "completed");
  const inProgressTickets = myTickets.filter((t) => t.status === "in_progress");

  const totalOperations = myTickets.reduce(
    (sum, ticket) => sum + ticket.operations.length,
    0
  );

  const totalSpareParts = myTickets.reduce(
    (sum, ticket) => sum + ticket.spareParts.length,
    0
  );

  const handleLogout = () => {
    Alert.alert(
      "Odjava",
      "Da li ste sigurni da želite da se odjavite?",
      [
        { text: "Otkaži", style: "cancel" },
        {
          text: "Odjavi se",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  const handleQuickSync = async () => {
    if (isSyncing || syncing) return;

    setSyncing(true);
    setIsSyncing(true);

    try {
      // Test connection first
      const connectionOk = await testConnection();
      if (!connectionOk) {
        Alert.alert(
          "Greška konekcije",
          `Ne mogu da se povežem sa web panelom (${apiUrl}).\n\n` +
          "Mogući razlozi:\n" +
          "• Web panel nije pokrenut\n" +
          "• Pogrešan URL (proverite podešavanja)\n" +
          "• Koristite 'localhost' umesto IP adrese\n\n" +
          isSuperUser
            ? "Idite na Settings da proverite podešavanja."
            : "Kontaktirajte administratora da proveri podešavanja."
        );
        setSyncing(false);
        setIsSyncing(false);
        return;
      }

      // Sync users (only for super admin)
      if (isSuperUser) {
        const usersSync = await syncUsersToWeb();
        if (!usersSync) {
          Alert.alert("Greška", "Sinhronizacija korisnika nije uspela");
          setSyncing(false);
          setIsSyncing(false);
          return;
        }
      }

      // Sync tickets
      const ticketsSync = await syncTicketsToWeb();
      if (!ticketsSync) {
        Alert.alert("Greška", "Sinhronizacija servisa nije uspela");
        setSyncing(false);
        setIsSyncing(false);
        return;
      }

      setLastSyncTime(new Date());
      Alert.alert(
        "Uspeh",
        `Svi podaci su uspešno sinhronizovani sa web panelom!\n\n` +
        `Sinhronizovano servisa: ${tickets.length}`
      );
    } catch (error) {
      Alert.alert("Greška", "Došlo je do greške pri sinhronizaciji");
      console.error(error);
    } finally {
      setSyncing(false);
      setIsSyncing(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Profile Header with Gradient */}
        <LinearGradient
          colors={["#1E40AF", "#3B82F6"]}
          style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 }}
        >
          <View className="items-center">
            <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 shadow-lg">
              <Text className="text-blue-600 text-4xl font-bold">
                {user?.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">
              {user?.name}
            </Text>
            <View className="bg-white/20 px-4 py-2 rounded-full">
              <Text className="text-blue-100 text-sm font-semibold">
                {isSuperUser ? "Super Administrator" : "Serviser"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Section */}
        <View className="px-6 -mt-6">
          <View className="bg-white rounded-3xl p-6 shadow-xl">
            <Text className="text-gray-900 text-lg font-bold mb-4">
              Statistika
            </Text>
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-emerald-50 rounded-full items-center justify-center">
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                  <Text className="text-gray-700 text-base">
                    Završeni servisi
                  </Text>
                </View>
                <Text className="text-gray-900 text-2xl font-bold">
                  {completedTickets.length}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-amber-50 rounded-full items-center justify-center">
                    <Ionicons name="time" size={24} color="#F59E0B" />
                  </View>
                  <Text className="text-gray-700 text-base">U toku</Text>
                </View>
                <Text className="text-gray-900 text-2xl font-bold">
                  {inProgressTickets.length}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center">
                    <Ionicons name="build" size={24} color="#3B82F6" />
                  </View>
                  <Text className="text-gray-700 text-base">
                    Ukupno operacija
                  </Text>
                </View>
                <Text className="text-gray-900 text-2xl font-bold">
                  {totalOperations}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-purple-50 rounded-full items-center justify-center">
                    <Ionicons name="cube" size={24} color="#9333EA" />
                  </View>
                  <Text className="text-gray-700 text-base">
                    Utrošeni delovi
                  </Text>
                </View>
                <Text className="text-gray-900 text-2xl font-bold">
                  {totalSpareParts}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View className="px-6 py-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">
            Informacije
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-gray-500 text-xs font-medium mb-1">
                Korisničko ime
              </Text>
              <Text className="text-gray-900 text-base">{user?.username}</Text>
            </View>
            <View className="px-4 py-4 border-b border-gray-100">
              <Text className="text-gray-500 text-xs font-medium mb-1">
                Ime i prezime
              </Text>
              <Text className="text-gray-900 text-base">{user?.name}</Text>
            </View>
            <View className="px-4 py-4">
              <Text className="text-gray-500 text-xs font-medium mb-1">
                Uloga
              </Text>
              <Text className="text-gray-900 text-base">
                {isSuperUser ? "Super Administrator" : "Serviser"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 pb-4 gap-3">
          {/* Sync Button - Available for ALL users */}
          <Pressable
            onPress={handleQuickSync}
            disabled={syncing || isSyncing}
            className={`rounded-2xl px-6 py-4 flex-row items-center justify-center gap-3 ${
              syncing || isSyncing
                ? "bg-gray-100"
                : "bg-emerald-50 border border-emerald-200 active:opacity-70"
            }`}
          >
            {syncing || isSyncing ? (
              <>
                <ActivityIndicator color="#10B981" />
                <Text className="text-emerald-600 text-base font-bold">
                  Sinhronizacija...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#10B981" />
                <Text className="text-emerald-600 text-base font-bold">
                  Sinhronizuj podatke
                </Text>
              </>
            )}
          </Pressable>

          {/* Settings Button - Super User only */}
          {isSuperUser && (
            <Pressable
              onPress={() => navigation.navigate("Settings")}
              className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 flex-row items-center justify-center gap-3 active:opacity-70"
            >
              <Ionicons name="settings-outline" size={24} color="#3B82F6" />
              <Text className="text-blue-600 text-base font-bold">
                Podešavanja Sync-a
              </Text>
            </Pressable>
          )}

          {/* Info for Technicians */}
          {!isSuperUser && (
            <View className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
              <View className="flex-row items-start gap-3">
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <View className="flex-1">
                  <Text className="text-blue-900 text-xs font-semibold mb-1">
                    Sinhronizacija podataka
                  </Text>
                  <Text className="text-blue-800 text-xs leading-4">
                    Kliknite dugme iznad da sinhronizujete svoje servise sa web
                    admin panelom. Administrator je podesio URL.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Logout Button */}
        <View className="px-6 pb-8">
          <Pressable
            onPress={handleLogout}
            className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 flex-row items-center justify-center gap-3 active:opacity-70"
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text className="text-red-600 text-base font-bold">Odjavi se</Text>
          </Pressable>
        </View>

        {/* App Info */}
        <View className="px-6 pb-8 items-center">
          <Text className="text-gray-400 text-xs">
            La Fantana WHS v1.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
