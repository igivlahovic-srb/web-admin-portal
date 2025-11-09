import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useServiceStore } from "../state/serviceStore";
import { format } from "date-fns";
import { ServiceTicket } from "../types";

export default function HistoryScreen() {
  const tickets = useServiceStore((s) => s.tickets);
  const [filter, setFilter] = useState<"all" | "completed" | "in_progress">("all");

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "all") return true;
    return ticket.status === filter;
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const renderTicketCard = (ticket: ServiceTicket) => (
    <View key={ticket.id} className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
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
        </View>
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
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Filter Tabs */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row gap-2">
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
      </View>

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
