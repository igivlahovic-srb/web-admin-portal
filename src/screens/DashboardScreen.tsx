import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RootStackParamList, MainTabParamList } from "../navigation/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useServiceStore } from "../state/serviceStore";
import { format } from "date-fns";
import ConnectionIndicator from "../components/ConnectionIndicator";

type DashboardNavigationProp = BottomTabNavigationProp<MainTabParamList, "Dashboard"> &
  NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const user = useAuthStore((s) => s.user);
  const allUsers = useAuthStore((s) => s.allUsers);
  const tickets = useServiceStore((s) => s.tickets);

  const activeTickets = tickets.filter((t) => t.status === "in_progress");
  const completedTickets = tickets.filter((t) => t.status === "completed");
  const todayTickets = tickets.filter((t) => {
    const ticketDate = new Date(t.startTime);
    const today = new Date();
    return ticketDate.toDateString() === today.toDateString();
  });

  // Calculate services by depot/location
  const servicesByDepot = tickets.reduce((acc, ticket) => {
    // Find the technician's depot
    const technician = allUsers.find(u => u.id === ticket.technicianId);
    const depot = technician?.depot || "Nepoznato";

    if (!acc[depot]) {
      acc[depot] = { total: 0, completed: 0, inProgress: 0 };
    }

    acc[depot].total++;
    if (ticket.status === "completed") {
      acc[depot].completed++;
    } else {
      acc[depot].inProgress++;
    }

    return acc;
  }, {} as Record<string, { total: number; completed: number; inProgress: number }>);

  const isSuperUser = user?.role === "super_user";

  const handleStartService = () => {
    navigation.navigate("Scanner");
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Connection Indicator */}
      <ConnectionIndicator />

      <ScrollView className="flex-1">
        {/* Welcome Header with Gradient */}
        <LinearGradient
          colors={["#1E40AF", "#3B82F6"]}
          style={{ paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 }}
        >
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
              <Ionicons
                name={isSuperUser ? "shield-checkmark" : "person"}
                size={32}
                color="#FFFFFF"
              />
            </View>
            <Text className="text-blue-100 text-sm font-medium mb-1">
              Dobrodošli nazad
            </Text>
            <Text className="text-white text-2xl font-bold">
              {user?.name}
            </Text>
            <Text className="text-blue-200 text-sm mt-1">
              {isSuperUser ? "Super Administrator" : "Serviser"}
            </Text>
          </View>

          {/* Quick Action Button */}
          {!isSuperUser && (
            <Pressable
              onPress={handleStartService}
              className="active:opacity-80"
            >
              <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-lg">
                <View className="flex-1">
                  <Text className="text-gray-900 text-lg font-bold mb-1">
                    Novi servis
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Skeniraj QR kod water aparata
                  </Text>
                </View>
                <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center">
                  <Ionicons name="qr-code" size={24} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>
          )}
        </LinearGradient>

        {/* Stats Cards */}
        <View className="px-6 -mt-4 mb-6">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                <Text className="text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-1 rounded-lg">
                  AKTIVNO
                </Text>
              </View>
              <Text className="text-gray-900 text-2xl font-bold mb-1">
                {activeTickets.length}
              </Text>
              <Text className="text-gray-500 text-xs">U toku</Text>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
                  DANAS
                </Text>
              </View>
              <Text className="text-gray-900 text-2xl font-bold mb-1">
                {todayTickets.length}
              </Text>
              <Text className="text-gray-500 text-xs">Servisa</Text>
            </View>

            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="stats-chart" size={20} color="#3B82F6" />
                <Text className="text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-1 rounded-lg">
                  UKUPNO
                </Text>
              </View>
              <Text className="text-gray-900 text-2xl font-bold mb-1">
                {completedTickets.length}
              </Text>
              <Text className="text-gray-500 text-xs">Završeno</Text>
            </View>
          </View>
        </View>

        {/* Services by Depot/Location - Only for Super Admin */}
        {isSuperUser && Object.keys(servicesByDepot).length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-gray-900 text-lg font-bold mb-4">
              Servisi po lokaciji
            </Text>
            <View className="gap-3">
              {Object.entries(servicesByDepot).map(([depot, stats]) => (
                <View key={depot} className="bg-white rounded-2xl p-4 shadow-sm">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                        <Ionicons name="location" size={20} color="#9333EA" />
                      </View>
                      <Text className="text-gray-900 text-base font-bold">
                        {depot}
                      </Text>
                    </View>
                    <Text className="text-gray-900 text-xl font-bold">
                      {stats.total}
                    </Text>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 bg-amber-50 rounded-xl p-3">
                      <View className="flex-row items-center gap-1 mb-1">
                        <Ionicons name="time-outline" size={14} color="#F59E0B" />
                        <Text className="text-amber-700 text-xs font-semibold">
                          U TOKU
                        </Text>
                      </View>
                      <Text className="text-amber-900 text-lg font-bold">
                        {stats.inProgress}
                      </Text>
                    </View>

                    <View className="flex-1 bg-emerald-50 rounded-xl p-3">
                      <View className="flex-row items-center gap-1 mb-1">
                        <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                        <Text className="text-emerald-700 text-xs font-semibold">
                          ZAVRŠENO
                        </Text>
                      </View>
                      <Text className="text-emerald-900 text-lg font-bold">
                        {stats.completed}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-900 text-lg font-bold">
              Nedavna aktivnost
            </Text>
            {tickets.length > 0 && (
              <Pressable onPress={() => navigation.navigate("History")}>
                <Text className="text-blue-600 text-sm font-semibold">
                  Vidi sve
                </Text>
              </Pressable>
            )}
          </View>

          {tickets.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                <Ionicons name="document-text-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 text-base font-semibold mb-1">
                Nema servisa
              </Text>
              <Text className="text-gray-500 text-sm text-center">
                {isSuperUser
                  ? "Trenutno nema zabeleženih servisa"
                  : "Započnite novi servis skeniranjem QR koda"}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {tickets.slice(0, 3).map((ticket) => {
                const canOpen = ticket.status === "in_progress" || isSuperUser;
                return (
                  <Pressable
                    key={ticket.id}
                    onPress={() => {
                      if (canOpen) {
                        const setCurrentTicket = useServiceStore.getState().setCurrentTicket;
                        setCurrentTicket(ticket);
                        navigation.navigate("ServiceTicket");
                      }
                    }}
                    disabled={!canOpen}
                    className={`bg-white rounded-2xl p-4 shadow-sm ${canOpen ? "active:opacity-70" : "opacity-60"}`}
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-blue-600 text-xs font-semibold mb-1">
                          {ticket.serviceNumber}
                        </Text>
                        <Text className="text-gray-900 text-base font-semibold mb-1">
                          {ticket.deviceCode}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          {ticket.technicianName}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`px-3 py-1 rounded-lg ${
                            ticket.status === "completed"
                              ? "bg-emerald-50"
                              : "bg-amber-50"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              ticket.status === "completed"
                                ? "text-emerald-600"
                                : "text-amber-600"
                            }`}
                          >
                            {ticket.status === "completed" ? "Završeno" : "U toku"}
                          </Text>
                        </View>
                        {canOpen && (
                          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        )}
                      </View>
                    </View>

                    <View className="flex-row items-center gap-4">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-600 text-xs">
                          {format(new Date(ticket.startTime), "dd.MM.yyyy HH:mm")}
                        </Text>
                      </View>
                      {ticket.operations.length > 0 && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="build-outline" size={14} color="#6B7280" />
                          <Text className="text-gray-600 text-xs">
                            {ticket.operations.length} operacija
                          </Text>
                        </View>
                      )}
                      {ticket.spareParts.length > 0 && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="cube-outline" size={14} color="#6B7280" />
                          <Text className="text-gray-600 text-xs">
                            {ticket.spareParts.length} delova
                          </Text>
                        </View>
                      )}
                    </View>

                    {!canOpen && (
                      <View className="mt-3 pt-3 border-t border-gray-100 flex-row items-center gap-2">
                        <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs">
                          Samo administrator može otvoriti završene servise
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
