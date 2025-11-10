import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useServiceStore } from "../state/serviceStore";
import { useAuthStore } from "../state/authStore";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { ServiceTicket } from "../types";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const tickets = useServiceStore((s) => s.tickets);
  const setCurrentTicket = useServiceStore((s) => s.setCurrentTicket);
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<"all" | "completed" | "in_progress">("all");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const isSuperUser = user?.role === "super_user";

  // Default to last 7 days
  const [dateFrom, setDateFrom] = useState(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState(new Date());

  // Temporary string states for text input
  const [dateFromStr, setDateFromStr] = useState(format(dateFrom, "yyyy-MM-dd"));
  const [dateToStr, setDateToStr] = useState(format(dateTo, "yyyy-MM-dd"));

  const applyDateFilter = () => {
    try {
      const parsedFrom = parseISO(dateFromStr);
      const parsedTo = parseISO(dateToStr);
      if (!isNaN(parsedFrom.getTime())) setDateFrom(parsedFrom);
      if (!isNaN(parsedTo.getTime())) setDateTo(parsedTo);
    } catch (error) {
      // Invalid date format, keep current dates
    }
    setShowDateFilter(false);
  };

  const setQuickFilter = (from: Date, to: Date) => {
    setDateFrom(from);
    setDateTo(to);
    setDateFromStr(format(from, "yyyy-MM-dd"));
    setDateToStr(format(to, "yyyy-MM-dd"));
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Status filter
    if (filter !== "all" && ticket.status !== filter) return false;

    // Date filter
    const ticketDate = startOfDay(new Date(ticket.startTime));
    const fromDate = startOfDay(dateFrom);
    const toDate = endOfDay(dateTo);

    return ticketDate >= fromDate && ticketDate <= toDate;
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const renderTicketCard = (ticket: ServiceTicket) => {
    const canOpen = ticket.status === "in_progress" || isSuperUser;

    return (
      <Pressable
        key={ticket.id}
        onPress={() => {
          if (canOpen) {
            setCurrentTicket(ticket);
            navigation.navigate("ServiceTicket");
          }
        }}
        disabled={!canOpen}
        className={`bg-white rounded-2xl p-4 shadow-sm mb-3 ${canOpen ? "active:opacity-70" : "opacity-60"}`}
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-blue-600 text-xs font-semibold mb-1">
              {ticket.serviceNumber}
            </Text>
            <Text className="text-gray-900 text-lg font-bold mb-1">
              {ticket.deviceCode}
            </Text>
            <Text className="text-gray-600 text-sm mb-2">
              {ticket.technicianName}
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text className="text-gray-500 text-xs">
                {format(new Date(ticket.startTime), "dd.MM.yyyy HH:mm")}
              </Text>
              {ticket.endTime && (
                <>
                  <Text className="text-gray-400 text-xs mx-1">-</Text>
                  <Text className="text-gray-500 text-xs">
                    {format(new Date(ticket.endTime), "HH:mm")}
                  </Text>
                </>
              )}
            </View>
            {ticket.endTime && ticket.durationMinutes && (
              <View className="flex-row items-center gap-1 mt-1">
                <Ionicons name="time-outline" size={14} color="#3B82F6" />
                <Text className="text-blue-600 text-xs font-semibold">
                  {ticket.durationMinutes} min
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            <View
              className={`px-3 py-1 rounded-lg ${
                ticket.status === "completed" ? "bg-emerald-50" : "bg-amber-50"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  ticket.status === "completed" ? "text-emerald-600" : "text-amber-600"
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

        {/* Operations */}
        {ticket.operations.length > 0 && (
          <View className="mb-3">
            <Text className="text-gray-700 text-xs font-semibold mb-2">
              OPERACIJE:
            </Text>
            <View className="gap-1">
              {ticket.operations.map((op) => (
                <View key={op.id} className="flex-row items-start gap-2">
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text className="flex-1 text-gray-600 text-sm">{op.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Spare Parts */}
        {ticket.spareParts.length > 0 && (
          <View className="pt-3 border-t border-gray-100">
            <Text className="text-gray-700 text-xs font-semibold mb-2">
              REZERVNI DELOVI:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ticket.spareParts.map((part) => (
                <View
                  key={part.id}
                  className="bg-gray-50 px-3 py-1 rounded-lg flex-row items-center gap-2"
                >
                  <Text className="text-gray-900 text-sm font-medium">
                    {part.quantity}x
                  </Text>
                  <Text className="text-gray-600 text-sm">{part.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

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
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter Tabs */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row gap-2 mb-3">
          <Pressable
            onPress={() => setFilter("all")}
            className={`flex-1 py-3 rounded-xl ${
              filter === "all" ? "bg-blue-600" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                filter === "all" ? "text-white" : "text-gray-600"
              }`}
            >
              Svi ({tickets.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("in_progress")}
            className={`flex-1 py-3 rounded-xl ${
              filter === "in_progress" ? "bg-amber-600" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                filter === "in_progress" ? "text-white" : "text-gray-600"
              }`}
            >
              U toku ({tickets.filter((t) => t.status === "in_progress").length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter("completed")}
            className={`flex-1 py-3 rounded-xl ${
              filter === "completed" ? "bg-emerald-600" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                filter === "completed" ? "text-white" : "text-gray-600"
              }`}
            >
              Završeno ({tickets.filter((t) => t.status === "completed").length})
            </Text>
          </Pressable>
        </View>

        {/* Date Filter */}
        <Pressable
          onPress={() => setShowDateFilter(true)}
          className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text className="text-gray-700 text-sm font-medium">
              {format(dateFrom, "dd.MM.yyyy")} - {format(dateTo, "dd.MM.yyyy")}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Date Filter Modal */}
      <Modal
        visible={showDateFilter}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDateFilter(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <Text className="text-gray-900 text-xl font-bold">
              Filter po datumu
            </Text>
            <Pressable
              onPress={() => setShowDateFilter(false)}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={28} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {/* Date From */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-semibold mb-2">
                Od datuma:
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholder="YYYY-MM-DD"
                  value={dateFromStr}
                  onChangeText={setDateFromStr}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Date To */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-semibold mb-2">
                Do datuma:
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholder="YYYY-MM-DD"
                  value={dateToStr}
                  onChangeText={setDateToStr}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Quick Filters */}
            <View className="mb-6">
              <Text className="text-gray-700 text-sm font-semibold mb-3">
                Brzi filteri:
              </Text>
              <View className="gap-2">
                <Pressable
                  onPress={() => setQuickFilter(subDays(new Date(), 7), new Date())}
                  className="bg-blue-50 rounded-xl px-4 py-3"
                >
                  <Text className="text-blue-600 text-sm font-semibold">
                    Poslednjih 7 dana
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setQuickFilter(subDays(new Date(), 30), new Date())}
                  className="bg-blue-50 rounded-xl px-4 py-3"
                >
                  <Text className="text-blue-600 text-sm font-semibold">
                    Poslednjih 30 dana
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setQuickFilter(subDays(new Date(), 90), new Date())}
                  className="bg-blue-50 rounded-xl px-4 py-3"
                >
                  <Text className="text-blue-600 text-sm font-semibold">
                    Poslednjih 90 dana
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Apply Button */}
            <Pressable
              onPress={applyDateFilter}
              className="bg-blue-600 rounded-xl py-4 items-center"
            >
              <Text className="text-white text-base font-semibold">
                Primeni filter
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Tickets List */}
      <ScrollView className="flex-1 px-6 py-4">
        {filteredTickets.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 text-lg font-semibold mb-2">
              Nema servisa
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              {filter === "all"
                ? "Još uvek nema zabeleženih servisa"
                : filter === "completed"
                ? "Nema završenih servisa"
                : "Nema servisa u toku"}
            </Text>
          </View>
        ) : (
          filteredTickets.map(renderTicketCard)
        )}
      </ScrollView>
    </View>
  );
}
