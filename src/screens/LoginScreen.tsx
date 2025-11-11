import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../state/authStore";
import * as Application from "expo-application";

// Conditionally import expo-updates only if available
let Updates: any = null;
try {
  Updates = require("expo-updates");
} catch (e) {
  console.log("expo-updates not available in development mode");
}

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const login = useAuthStore((s) => s.login);

  // Check for updates on mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    // Only check for updates if expo-updates is available and we're not in dev mode
    if (!Updates || __DEV__) {
      console.log("Skipping update check in development mode");
      return;
    }

    try {
      setCheckingUpdate(true);

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setUpdateAvailable(true);

        // Show alert to user
        Alert.alert(
          "Dostupno ažuriranje",
          "Nova verzija aplikacije je dostupna. Aplikacija će se automatski ažurirati.",
          [
            {
              text: "Ažuriraj sada",
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } catch (e) {
                  Alert.alert("Greška", "Nije moguće preuzeti ažuriranje. Pokušajte ponovo kasnije.");
                  setUpdateAvailable(false);
                }
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (e) {
      console.error("Error checking for updates:", e);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleLogin = async () => {
    // Don't allow login if update is checking or available
    if (checkingUpdate || updateAvailable) {
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError("Molimo unesite korisničko ime i lozinku");
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setError("");

    const success = await login(username.trim(), password);

    if (!success) {
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
              {/* Logo/Title Section - Identical to Portal */}
              <View className="items-center mb-12">
                {/* La Fantana Logo - Blue gradient square matching portal */}
                <View style={{
                  width: 160,
                  height: 160,
                  borderRadius: 16,
                  marginBottom: 24,
                  overflow: "hidden",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                }}>
                  <LinearGradient
                    colors={["#2563eb", "#4f46e5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: "100%",
                      height: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      padding: 24,
                    }}
                  >
                    <Image
                      source={require("../../assets/logo.png")}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </LinearGradient>
                </View>
                <Text className="text-white text-3xl font-bold mb-2">
                  La Fantana WHS
                </Text>
                <Text className="text-blue-100 text-base text-center font-medium">
                  Admin Panel
                </Text>

                {/* Update checking indicator */}
                {checkingUpdate && (
                  <View className="mt-4 flex-row items-center bg-white/20 px-4 py-2 rounded-full">
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-white text-sm ml-2">
                      Proveravam ažuriranja...
                    </Text>
                  </View>
                )}

                {updateAvailable && (
                  <View className="mt-4 flex-row items-center bg-green-500 px-4 py-2 rounded-full">
                    <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                    <Text className="text-white text-sm ml-2">
                      Ažuriranje u toku...
                    </Text>
                  </View>
                )}
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
                  disabled={loading || checkingUpdate || updateAvailable}
                  className="active:opacity-80"
                >
                  <LinearGradient
                    colors={
                      checkingUpdate || updateAvailable
                        ? ["#9CA3AF", "#6B7280"]
                        : ["#1E40AF", "#3B82F6"]
                    }
                    style={{
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : checkingUpdate ? (
                      <Text className="text-white text-base font-semibold">
                        Proveravam ažuriranja...
                      </Text>
                    ) : updateAvailable ? (
                      <Text className="text-white text-base font-semibold">
                        Ažuriranje u toku...
                      </Text>
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
