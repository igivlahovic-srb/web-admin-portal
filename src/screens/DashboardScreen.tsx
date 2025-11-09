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

type DashboardNavigationProp = BottomTabNavigationProp<MainTabParamList, "Dashboard"> &
  NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const user = useAuthStore((s) => s.user);
  const tickets = useServiceStore((s) => s.tickets);

  const activeTickets = tickets.filter((t) => t.status === "in_progress");
  const completedTickets = tickets.filter((t) => t.status === "completed");
  const todayTickets = tickets.filter((t) => {
    const ticketDate = new Date(t.startTime);
    const today = new Date();
    return ticketDate.toDateString() === today.toDateString();
  });

  const isSuperUser = user?.role === "super_user";

  const handleStartService = () => {
    navigation.navigate("Scanner");
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Welcome Header with Gradient */}
        <LinearGradient
          colors={["#1E40AF", "#3B82F6"]}
          style={{ paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <View>
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
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
              <Ionicons
                name={isSuperUser ? "shield-checkmark" : "person"}
                size={32}
                color="#FFFFFF"
              />
            </View>
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
              {tickets.slice(0, 3).map((ticket) => (
                <View
                  key={ticket.id}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-gray-900 text-base font-semibold mb-1">
                        {ticket.deviceCode}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {ticket.technicianName}
                      </Text>
                    </View>
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
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
