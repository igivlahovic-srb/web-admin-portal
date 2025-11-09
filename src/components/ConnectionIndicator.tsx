import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useConfigStore } from "../state/configStore";

export default function ConnectionIndicator() {
  const isConnected = useConfigStore((s) => s.isConnected);
  const checkConnection = useConfigStore((s) => s.checkConnection);
  const fetchConfig = useConfigStore((s) => s.fetchConfig);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check connection on mount and every hour
  useEffect(() => {
    checkConnection();

    // Auto-sync every hour
    intervalRef.current = setInterval(() => {
      checkConnection();
      fetchConfig();
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Pulse animation for connected state
  useEffect(() => {
    if (isConnected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isConnected, pulseAnim]);

  const handleManualSync = async () => {
    await checkConnection();
    await fetchConfig();
  };

  return (
    <Pressable
      onPress={handleManualSync}
      className="absolute top-2 right-2 z-50"
      style={{ position: "absolute", top: 8, right: 8, zIndex: 1000 }}
    >
      <View className="flex-row items-center bg-white/90 rounded-full px-3 py-1.5 shadow-md">
        <Animated.View
          style={{
            transform: [{ scale: isConnected ? pulseAnim : 1 }],
          }}
        >
          <View
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </Animated.View>
        <Text className="text-xs font-medium text-gray-700 ml-2">
          {isConnected ? "Online" : "Offline"}
        </Text>
        <Ionicons
          name="sync"
          size={14}
          color="#6B7280"
          style={{ marginLeft: 4 }}
        />
      </View>
    </Pressable>
  );
}
