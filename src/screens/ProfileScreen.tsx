import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useServiceStore } from "../state/serviceStore";
import { useSyncStore } from "../state/syncStore";
import { useTwoFactorStore } from "../state/twoFactorStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const tickets = useServiceStore((s) => s.tickets);
  const closeWorkday = useAuthStore((s) => s.closeWorkday);
  const syncToWeb = useServiceStore((s) => s.syncToWeb);

  const [syncing, setSyncing] = useState(false);
  const [showCloseWorkdayModal, setShowCloseWorkdayModal] = useState(false);
  const [isClosingWorkday, setIsClosingWorkday] = useState(false);

  const isTwoFactorEnabled = user?.twoFactorEnabled === true;
  const getBackupCodes = useTwoFactorStore((s) => s.getBackupCodes);
  const regenerateBackupCodes = useTwoFactorStore((s) => s.regenerateBackupCodes);

  const apiUrl = useSyncStore((s) => s.apiUrl);
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const setIsSyncing = useSyncStore((s) => s.setIsSyncing);
  const setLastSyncTime = useSyncStore((s) => s.setLastSyncTime);
  const testConnection = useSyncStore((s) => s.testConnection);

  const syncUsersToWeb = useAuthStore((s) => s.syncToWeb);
  const bidirectionalSyncTickets = useServiceStore((s) => s.bidirectionalSync);

  const isSuperUser = user?.role === "super_user";
  const isTechnician = user?.role === "technician";
  const workdayIsClosed = user?.workdayStatus === "closed";

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

      // Sync tickets (bidirectional - fetch and push)
      const ticketsSync = await bidirectionalSyncTickets();
      if (!ticketsSync) {
        Alert.alert("Greška", "Sinhronizacija servisa nije uspela");
        setSyncing(false);
        setIsSyncing(false);
        return;
      }

      setLastSyncTime(new Date());
      Alert.alert(
        "Uspeh",
        "Svi podaci su uspešno sinhronizovani sa web panelom!\n\n" +
        "Servisi su sinhronizovani u oba smera (preuzeto i poslato)"
      );
    } catch (error) {
      Alert.alert("Greška", "Došlo je do greške pri sinhronizaciji");
      console.error(error);
    } finally {
      setSyncing(false);
      setIsSyncing(false);
    }
  };

  const handleCloseWorkday = async () => {
    setIsClosingWorkday(true);
    try {
      // Check for active tickets
      const myActiveTickets = tickets.filter(
        (t) => t.technicianId === user?.id && t.status === "in_progress"
      );

      if (myActiveTickets.length > 0) {
        Alert.alert(
          "Imate aktivne servise",
          `Imate ${myActiveTickets.length} aktivnih servisa. Molimo završite sve servise pre zatvaranja radnog dana.`,
          [{ text: "OK" }]
        );
        setIsClosingWorkday(false);
        setShowCloseWorkdayModal(false);
        return;
      }

      // Sync all tickets to web portal
      console.log("[ProfileScreen] Syncing tickets before closing workday...");
      const syncSuccess = await syncToWeb();

      if (!syncSuccess) {
        Alert.alert(
          "Greška sinhronizacije",
          "Nije moguće sinhronizovati servise sa portalom. Proverite internet konekciju i pokušajte ponovo.",
          [{ text: "OK" }]
        );
        setIsClosingWorkday(false);
        setShowCloseWorkdayModal(false);
        return;
      }

      // Close the workday locally first
      if (!user) {
        console.error("[ProfileScreen] No user found");
        setIsClosingWorkday(false);
        setShowCloseWorkdayModal(false);
        return;
      }

      const closedAt = new Date();
      const updatedUser = {
        ...user,
        workdayStatus: "closed" as const,
        workdayClosedAt: closedAt,
      };

      // Update local state immediately
      useAuthStore.setState({ user: updatedUser });

      // Clear local ticket data
      await AsyncStorage.removeItem("service-storage");

      // Try to sync to portal (but don't fail if it doesn't work)
      try {
        await closeWorkday();
        console.log("[ProfileScreen] Workday closed on portal");
      } catch (error) {
        console.warn("[ProfileScreen] Could not sync workday closure to portal:", error);
        // Continue anyway - workday is closed locally
      }

      Alert.alert(
        "Radni dan zatvoren",
        `Radni dan je zatvoren u ${format(closedAt, "HH:mm")}. Svi servisi su sinhronizovani sa portalom i obrisani sa uređaja.`,
        [{ text: "OK", onPress: () => setShowCloseWorkdayModal(false) }]
      );
    } catch (error) {
      console.error("[ProfileScreen] Error closing workday:", error);
      Alert.alert("Greška", "Došlo je do greške prilikom zatvaranja radnog dana.", [
        { text: "OK" },
      ]);
    } finally {
      setIsClosingWorkday(false);
    }
  };

  const handleViewBackupCodes = () => {
    if (!user) return;

    const codes = getBackupCodes(user.id);
    if (codes.length === 0) {
      Alert.alert("Info", "Nemate preostalih backup kodova.");
      return;
    }

    const codesList = codes.map((code, i) => `${i + 1}. ${code}`).join("\n");
    Alert.alert(
      "Backup kodovi",
      `Preostali backup kodovi:\n\n${codesList}\n\nSvaki kod može se koristiti samo jednom.`,
      [{ text: "OK" }]
    );
  };

  const handleRegenerateBackupCodes = () => {
    if (!user) return;

    Alert.alert(
      "Regeneriši backup kodove",
      "Da li ste sigurni? Svi postojeći backup kodovi će biti zamenjeni novim.",
      [
        { text: "Otkaži", style: "cancel" },
        {
          text: "Regeneriši",
          onPress: () => {
            const newCodes = regenerateBackupCodes(user.id);
            const codesList = newCodes.map((code, i) => `${i + 1}. ${code}`).join("\n");
            Alert.alert(
              "Novi backup kodovi",
              `Sačuvajte ove kodove na sigurnom mestu:\n\n${codesList}`,
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
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
          {/* 2FA Settings */}
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                  <Ionicons name="shield-checkmark" size={20} color="#9333EA" />
                </View>
                <View>
                  <Text className="text-gray-900 text-base font-bold">
                    Dvofaktorska autentifikacija
                  </Text>
                  <Text className="text-gray-500 text-xs">
                    {isTwoFactorEnabled ? "Omogućena" : "Onemogućena"}
                  </Text>
                </View>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  isTwoFactorEnabled ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isTwoFactorEnabled ? "text-green-700" : "text-gray-600"
                  }`}
                >
                  {isTwoFactorEnabled ? "ON" : "OFF"}
                </Text>
              </View>
            </View>

            {isTwoFactorEnabled ? (
              <>
                <View className="bg-blue-50 rounded-xl p-3 mb-2">
                  <Text className="text-blue-800 text-xs leading-5">
                    <Ionicons name="information-circle" size={14} color="#3B82F6" />
                    {" "}Pri svakom logovanju ćete morati da unesete 6-cifreni kod iz vaše authenticator aplikacije.
                  </Text>
                </View>

                <View className="gap-2">
                  <Pressable
                    onPress={handleViewBackupCodes}
                    className="bg-purple-50 rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 active:opacity-70"
                  >
                    <Ionicons name="eye-outline" size={18} color="#9333EA" />
                    <Text className="text-purple-700 text-sm font-semibold">
                      Prikaži backup kodove
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleRegenerateBackupCodes}
                    className="bg-blue-50 rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 active:opacity-70"
                  >
                    <Ionicons name="refresh-outline" size={18} color="#3B82F6" />
                    <Text className="text-blue-700 text-sm font-semibold">
                      Regeneriši backup kodove
                    </Text>
                  </Pressable>
                </View>

                <View className="bg-amber-50 rounded-xl p-3 mt-2 border border-amber-200">
                  <Text className="text-amber-800 text-xs leading-5">
                    <Ionicons name="lock-closed" size={14} color="#F59E0B" />
                    {" "}Samo administrator može onemogućiti 2FA sa web portala.
                  </Text>
                </View>
              </>
            ) : (
              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-gray-600 text-xs text-center leading-5">
                  <Ionicons name="information-circle" size={14} color="#6B7280" />
                  {" "}2FA trenutno nije omogućena za vaš nalog. Kontaktirajte administratora da omogući 2FA sa web portala.
                </Text>
              </View>
            )}
          </View>

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

          {/* Close Workday Button - Only for Technicians */}
          {isTechnician && !workdayIsClosed && (
            <Pressable
              onPress={() => setShowCloseWorkdayModal(true)}
              className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-4 flex-row items-center justify-center gap-3 active:opacity-70"
            >
              <Ionicons name="moon-outline" size={24} color="#F97316" />
              <Text className="text-orange-600 text-base font-bold">
                Zatvori radni dan
              </Text>
            </Pressable>
          )}

          {/* Workday Closed Info - Only for Technicians */}
          {isTechnician && workdayIsClosed && (
            <View className="bg-gray-100 rounded-2xl p-4 border border-gray-300">
              <View className="flex-row items-start gap-3">
                <Ionicons name="lock-closed" size={20} color="#6B7280" />
                <View className="flex-1">
                  <Text className="text-gray-900 text-sm font-semibold mb-1">
                    Radni dan je zatvoren
                  </Text>
                  <Text className="text-gray-600 text-xs leading-4">
                    {user?.workdayClosedAt &&
                      `Zatvoren u ${format(
                        new Date(user.workdayClosedAt),
                        "HH:mm, dd.MM.yyyy"
                      )}. Samo administrator može ponovo otvoriti radni dan.`}
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

      {/* Close Workday Modal */}
      <Modal
        visible={showCloseWorkdayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCloseWorkdayModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-md">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-orange-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="moon" size={32} color="#F97316" />
              </View>
              <Text className="text-gray-900 text-xl font-bold mb-2">
                Zatvori radni dan
              </Text>
              <Text className="text-gray-600 text-sm text-center">
                Da li ste sigurni da želite da zatvorite radni dan? Svi servisi će
                biti sinhronizovani sa portalom i obrisani sa uređaja.
              </Text>
            </View>

            <View className="gap-3">
              <Pressable
                onPress={handleCloseWorkday}
                disabled={isClosingWorkday}
                className={`rounded-2xl px-6 py-4 flex-row items-center justify-center gap-3 ${
                  isClosingWorkday ? "bg-gray-100" : "bg-orange-500 active:opacity-70"
                }`}
              >
                {isClosingWorkday ? (
                  <>
                    <ActivityIndicator color="#F97316" />
                    <Text className="text-orange-600 text-base font-bold">
                      Zatvaranje...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white text-base font-bold">
                    Zatvori radni dan
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => setShowCloseWorkdayModal(false)}
                disabled={isClosingWorkday}
                className="bg-gray-100 rounded-2xl px-6 py-4 flex-row items-center justify-center active:opacity-70"
              >
                <Text className="text-gray-700 text-base font-bold">Otkaži</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
