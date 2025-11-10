import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../state/authStore";
import { useConfigStore } from "../state/configStore";
import * as Application from "expo-application";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const fetchSparePartsFromSQL = useConfigStore((s) => s.fetchSparePartsFromSQL);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Molimo unesite korisničko ime i lozinku");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError("");

    const success = await login(username.trim(), password);

    if (success) {
      // After successful login, fetch spare parts from SQL database
      console.log("[LoginScreen] Login successful, fetching spare parts from SQL...");
      try {
        await fetchSparePartsFromSQL();
        console.log("[LoginScreen] Spare parts fetched successfully");
      } catch (error) {
        console.error("[LoginScreen] Failed to fetch spare parts:", error);
        // Don't block login if spare parts fetch fails
      }
    } else {
      setError("Neispravno korisničko ime ili lozinka");
    }

    setLoading(false);
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#1E40AF", "#3B82F6", "#60A5FA"]}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="flex-1 justify-center px-6">
              {/* Logo/Title Section */}
              <View className="items-center mb-12">
                <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 shadow-lg overflow-hidden">
                  <Image
                    source={require("../../assets/icon.png")}
                    style={{ width: 80, height: 80 }}
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-white text-3xl font-bold mb-2">
                  La Fantana WHS
                </Text>
                <Text className="text-blue-100 text-base text-center font-medium">
                  Servisni Modul
                </Text>
              </View>

              {/* Login Form */}
              <View className="bg-white rounded-3xl p-6 shadow-xl">
                <Text className="text-gray-800 text-xl font-semibold mb-6 text-center">
                  Prijavite se
                </Text>

                {/* Username Input */}
                <View className="mb-4">
                  <Text className="text-gray-700 text-sm font-medium mb-2">
                    Korisničko ime
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-900 text-base"
                      placeholder="Unesite korisničko ime"
                      placeholderTextColor="#9CA3AF"
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        setError("");
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className="mb-6">
                  <Text className="text-gray-700 text-sm font-medium mb-2">
                    Lozinka
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <TextInput
                      className="flex-1 ml-3 text-gray-900 text-base"
                      placeholder="Unesite lozinku"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setError("");
                      }}
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color="#6B7280"
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Error Message */}
                {error ? (
                  <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                    <Text className="text-red-600 text-sm text-center">
                      {error}
                    </Text>
                  </View>
                ) : null}

                {/* Login Button */}
                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  className="active:opacity-80"
                >
                  <LinearGradient
                    colors={["#1E40AF", "#3B82F6"]}
                    style={{
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white text-base font-semibold">
                        Prijavite se
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Demo Credentials Info */}
              <View className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-4">
                <Text className="text-white text-xs font-medium mb-2 text-center">
                  Demo pristup:
                </Text>
                <Text className="text-blue-100 text-xs text-center">
                  Super User: admin / admin123
                </Text>
                <Text className="text-blue-100 text-xs text-center">
                  Serviser: marko / marko123
                </Text>
              </View>

              {/* Footer with Version Info */}
              <View className="mt-8 items-center">
                <Text className="text-white/60 text-xs text-center mb-1">
                  La Fantana WHS v{Application.nativeApplicationVersion || "1.0.0"}
                </Text>
                <Text className="text-white/50 text-xs text-center">
                  © 2025 La Fantana. Sva prava zadržana.
                </Text>
                <Text className="text-white/40 text-xs text-center mt-1">
                  Powered by La Fantana IT Serbia
                </Text>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
