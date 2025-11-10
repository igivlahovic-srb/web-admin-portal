import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../state/authStore";
import { User, UserRole } from "../types";
import { format } from "date-fns";

export default function UserManagementScreen() {
  const allUsers = useAuthStore((s) => s.allUsers);
  const addUser = useAuthStore((s) => s.addUser);
  const updateUser = useAuthStore((s) => s.updateUser);
  const deleteUser = useAuthStore((s) => s.deleteUser);
  const toggleUserActive = useAuthStore((s) => s.toggleUserActive);
  const currentUser = useAuthStore((s) => s.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User & { password: string } | null>(null);

  // Form states
  const [formCharismaId, setFormCharismaId] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("technician");
  const [formDepot, setFormDepot] = useState("");

  const resetForm = () => {
    setFormCharismaId("");
    setFormUsername("");
    setFormPassword("");
    setFormConfirmPassword("");
    setFormName("");
    setFormRole("technician");
    setFormDepot("");
  };

  const handleAddUser = () => {
    if (!formCharismaId.trim() || !formUsername.trim() || !formPassword.trim() || !formConfirmPassword.trim() || !formName.trim() || !formDepot.trim()) {
      Alert.alert("Greška", "Molimo popunite sva polja");
      return;
    }

    // Check if passwords match
    if (formPassword !== formConfirmPassword) {
      Alert.alert("Greška", "Lozinke se ne poklapaju");
      return;
    }

    // Check if username already exists
    if (allUsers.find((u) => u.username === formUsername.trim())) {
      Alert.alert("Greška", "Korisničko ime već postoji");
      return;
    }

    // Check if charismaId already exists
    if (allUsers.find((u) => u.charismaId === formCharismaId.trim())) {
      Alert.alert("Greška", "Charisma ID već postoji");
      return;
    }

    const newUser: User & { password: string } = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      charismaId: formCharismaId.trim(),
      username: formUsername.trim(),
      password: formPassword,
      name: formName.trim(),
      role: formRole,
      depot: formDepot.trim(),
      isActive: true,
      createdAt: new Date(),
    };

    addUser(newUser);
    setShowAddModal(false);
    resetForm();
    Alert.alert("Uspeh", "Korisnik je uspešno dodat");
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    if (!formCharismaId.trim() || !formName.trim() || !formDepot.trim()) {
      Alert.alert("Greška", "Sva polja moraju biti popunjena");
      return;
    }

    // Check if charismaId already exists in other users
    if (formCharismaId.trim() !== editingUser.charismaId) {
      if (allUsers.find((u) => u.charismaId === formCharismaId.trim() && u.id !== editingUser.id)) {
        Alert.alert("Greška", "Charisma ID već postoji");
        return;
      }
    }

    updateUser(editingUser.id, {
      charismaId: formCharismaId.trim(),
      name: formName.trim(),
      depot: formDepot.trim(),
      role: formRole,
    });

    // If password is changed
    if (formPassword.trim()) {
      const userWithPassword = allUsers.find((u) => u.id === editingUser.id);
      if (userWithPassword) {
        const updatedUser = { ...userWithPassword, password: formPassword };
        // Update password through full user update
        updateUser(editingUser.id, updatedUser as any);
      }
    }

    setShowEditModal(false);
    setEditingUser(null);
    resetForm();
    Alert.alert("Uspeh", "Korisnik je ažuriran");
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      Alert.alert("Greška", "Ne možete obrisati svoj nalog");
      return;
    }

    Alert.alert(
      "Potvrda brisanja",
      `Da li ste sigurni da želite da obrišete korisnika ${userName}?`,
      [
        { text: "Otkaži", style: "cancel" },
        {
          text: "Obriši",
          style: "destructive",
          onPress: () => {
            deleteUser(userId);
            Alert.alert("Uspeh", "Korisnik je obrisan");
          },
        },
      ]
    );
  };

  const handleToggleActive = (userId: string, isActive: boolean) => {
    if (userId === currentUser?.id) {
      Alert.alert("Greška", "Ne možete deaktivirati svoj nalog");
      return;
    }

    toggleUserActive(userId);
  };

  const openEditModal = (user: User & { password: string }) => {
    setEditingUser(user);
    setFormCharismaId(user.charismaId);
    setFormName(user.name);
    setFormDepot(user.depot);
    setFormRole(user.role);
    setFormPassword("");
    setShowEditModal(true);
  };

  const activeUsers = allUsers.filter((u) => u.isActive);
  const inactiveUsers = allUsers.filter((u) => !u.isActive);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header Stats */}
        <View className="bg-white px-6 py-6 border-b border-gray-200">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-blue-50 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="people" size={24} color="#3B82F6" />
              </View>
              <Text className="text-blue-900 text-2xl font-bold mb-1">
                {allUsers.length}
              </Text>
              <Text className="text-blue-600 text-xs font-medium">
                Ukupno korisnika
              </Text>
            </View>

            <View className="flex-1 bg-emerald-50 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <Text className="text-emerald-900 text-2xl font-bold mb-1">
                {activeUsers.length}
              </Text>
              <Text className="text-emerald-600 text-xs font-medium">
                Aktivnih
              </Text>
            </View>

            <View className="flex-1 bg-gray-100 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Ionicons name="ban" size={24} color="#6B7280" />
              </View>
              <Text className="text-gray-900 text-2xl font-bold mb-1">
                {inactiveUsers.length}
              </Text>
              <Text className="text-gray-600 text-xs font-medium">
                Neaktivnih
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="mt-4 bg-blue-600 rounded-2xl px-6 py-4 flex-row items-center justify-center active:opacity-80"
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text className="text-white text-base font-bold ml-2">
              Dodaj novog korisnika
            </Text>
          </Pressable>
        </View>

        {/* Users List */}
        <View className="px-6 py-6">
          {allUsers.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-900 text-base font-semibold mt-4 mb-1">
                Nema korisnika
              </Text>
              <Text className="text-gray-500 text-sm text-center">
                Dodajte prvog korisnika za početak
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {allUsers.map((user) => (
                <View
                  key={user.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm ${
                    !user.isActive ? "opacity-60" : ""
                  }`}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-gray-900 text-lg font-bold">
                          {user.name}
                        </Text>
                        {!user.isActive && (
                          <View className="bg-gray-100 px-2 py-1 rounded-lg">
                            <Text className="text-gray-600 text-xs font-semibold">
                              NEAKTIVAN
                            </Text>
                          </View>
                        )}
                        {user.id === currentUser?.id && (
                          <View className="bg-blue-50 px-2 py-1 rounded-lg">
                            <Text className="text-blue-600 text-xs font-semibold">
                              VI
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center gap-2 mb-1">
                        <Ionicons name="person-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-600 text-sm">
                          @{user.username}
                        </Text>
                        <Text className="text-gray-400 text-sm">•</Text>
                        <Ionicons name="keypad-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-600 text-sm">
                          {user.charismaId}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2 mb-2">
                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-600 text-sm">
                          {user.depot}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`px-2 py-1 rounded-lg ${
                            user.role === "gospodar"
                              ? "bg-amber-50"
                              : user.role === "super_user"
                              ? "bg-purple-50"
                              : "bg-blue-50"
                          }`}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              user.role === "gospodar"
                                ? "text-amber-600"
                                : user.role === "super_user"
                                ? "text-purple-600"
                                : "text-blue-600"
                            }`}
                          >
                            {user.role === "gospodar"
                              ? "GOSPODAR"
                              : user.role === "super_user"
                              ? "Administrator"
                              : "Serviser"}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-xs">
                          {format(new Date(user.createdAt), "dd.MM.yyyy")}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2 pt-3 border-t border-gray-100">
                    <Pressable
                      onPress={() => openEditModal(user)}
                      className="flex-1 bg-blue-50 rounded-xl px-4 py-3 flex-row items-center justify-center active:opacity-70"
                    >
                      <Ionicons name="create-outline" size={18} color="#3B82F6" />
                      <Text className="text-blue-600 text-sm font-semibold ml-2">
                        Izmeni
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        handleToggleActive(user.id, user.isActive)
                      }
                      disabled={user.id === currentUser?.id}
                      className={`flex-1 rounded-xl px-4 py-3 flex-row items-center justify-center ${
                        user.id === currentUser?.id
                          ? "bg-gray-100"
                          : user.isActive
                          ? "bg-amber-50 active:opacity-70"
                          : "bg-emerald-50 active:opacity-70"
                      }`}
                    >
                      <Ionicons
                        name={user.isActive ? "ban-outline" : "checkmark-circle-outline"}
                        size={18}
                        color={
                          user.id === currentUser?.id
                            ? "#9CA3AF"
                            : user.isActive
                            ? "#F59E0B"
                            : "#10B981"
                        }
                      />
                      <Text
                        className={`text-sm font-semibold ml-2 ${
                          user.id === currentUser?.id
                            ? "text-gray-400"
                            : user.isActive
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {user.isActive ? "Deaktiviraj" : "Aktiviraj"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDeleteUser(user.id, user.name)}
                      disabled={user.id === currentUser?.id}
                      className={`rounded-xl px-4 py-3 flex-row items-center justify-center ${
                        user.id === currentUser?.id
                          ? "bg-gray-100"
                          : "bg-red-50 active:opacity-70"
                      }`}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={
                          user.id === currentUser?.id ? "#9CA3AF" : "#EF4444"
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-gray-900 text-xl font-bold">
                Dodaj korisnika
              </Text>
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="close" size={28} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
              <View className="gap-4">
                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Charisma ID *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="npr. CH-001"
                    placeholderTextColor="#9CA3AF"
                    value={formCharismaId}
                    onChangeText={setFormCharismaId}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Korisničko ime *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="npr. milan"
                    placeholderTextColor="#9CA3AF"
                    value={formUsername}
                    onChangeText={setFormUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Lozinka *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="Unesite lozinku"
                    placeholderTextColor="#9CA3AF"
                    value={formPassword}
                    onChangeText={setFormPassword}
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Ponovi lozinku *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="Ponovite lozinku"
                    placeholderTextColor="#9CA3AF"
                    value={formConfirmPassword}
                    onChangeText={setFormConfirmPassword}
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Ime i prezime *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="npr. Milan Jovanović"
                    placeholderTextColor="#9CA3AF"
                    value={formName}
                    onChangeText={setFormName}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Depo *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="npr. Beograd, Niš, Novi Sad"
                    placeholderTextColor="#9CA3AF"
                    value={formDepot}
                    onChangeText={setFormDepot}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Uloga *
                  </Text>
                  <View className="flex-row gap-2 mb-2">
                    <Pressable
                      onPress={() => setFormRole("technician")}
                      className={`flex-1 rounded-xl px-4 py-4 border-2 ${
                        formRole === "technician"
                          ? "bg-blue-50 border-blue-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-center text-base font-semibold ${
                          formRole === "technician"
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      >
                        Serviser
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setFormRole("super_user")}
                      className={`flex-1 rounded-xl px-4 py-4 border-2 ${
                        formRole === "super_user"
                          ? "bg-purple-50 border-purple-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-center text-base font-semibold ${
                          formRole === "super_user"
                            ? "text-purple-600"
                            : "text-gray-600"
                        }`}
                      >
                        Administrator
                      </Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => setFormRole("gospodar")}
                    className={`rounded-xl px-4 py-4 border-2 ${
                      formRole === "gospodar"
                        ? "bg-amber-50 border-amber-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-center text-base font-semibold ${
                        formRole === "gospodar"
                          ? "text-amber-600"
                          : "text-gray-600"
                      }`}
                    >
                      {"GOSPODAR (pun pristup)"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleAddUser}
                className="bg-blue-600 rounded-2xl px-6 py-4 mt-6 active:opacity-80"
              >
                <Text className="text-white text-base font-bold text-center">
                  Kreiraj korisnika
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
              <Text className="text-gray-900 text-xl font-bold">
                Izmeni korisnika
              </Text>
              <Pressable
                onPress={() => setShowEditModal(false)}
                className="w-8 h-8 items-center justify-center"
              >
                <Ionicons name="close" size={28} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-6 py-6">
              <View className="gap-4">
                <View className="bg-gray-50 rounded-xl p-4 mb-2">
                  <Text className="text-gray-500 text-xs font-medium mb-1">
                    Korisničko ime
                  </Text>
                  <Text className="text-gray-900 text-base font-semibold">
                    @{editingUser?.username}
                  </Text>
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Charisma ID *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="npr. CH-001"
                    placeholderTextColor="#9CA3AF"
                    value={formCharismaId}
                    onChangeText={setFormCharismaId}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Ime i prezime *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="npr. Milan Jovanović"
                    placeholderTextColor="#9CA3AF"
                    value={formName}
                    onChangeText={setFormName}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Depo *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="npr. Beograd, Niš, Novi Sad"
                    placeholderTextColor="#9CA3AF"
                    value={formDepot}
                    onChangeText={setFormDepot}
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Nova lozinka (opciono)
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 text-base border-2 border-gray-200"
                    placeholder="Ostavite prazno ako ne menjate"
                    placeholderTextColor="#9CA3AF"
                    value={formPassword}
                    onChangeText={setFormPassword}
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text className="text-gray-700 text-sm font-semibold mb-2">
                    Uloga *
                  </Text>
                  <View className="flex-row gap-2 mb-2">
                    <Pressable
                      onPress={() => setFormRole("technician")}
                      className={`flex-1 rounded-xl px-4 py-4 border-2 ${
                        formRole === "technician"
                          ? "bg-blue-50 border-blue-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-center text-base font-semibold ${
                          formRole === "technician"
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      >
                        Serviser
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setFormRole("super_user")}
                      className={`flex-1 rounded-xl px-4 py-4 border-2 ${
                        formRole === "super_user"
                          ? "bg-purple-50 border-purple-600"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <Text
                        className={`text-center text-base font-semibold ${
                          formRole === "super_user"
                            ? "text-purple-600"
                            : "text-gray-600"
                        }`}
                      >
                        Administrator
                      </Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => setFormRole("gospodar")}
                    className={`rounded-xl px-4 py-4 border-2 ${
                      formRole === "gospodar"
                        ? "bg-amber-50 border-amber-600"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-center text-base font-semibold ${
                        formRole === "gospodar"
                          ? "text-amber-600"
                          : "text-gray-600"
                      }`}
                    >
                      {"GOSPODAR (pun pristup)"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={handleEditUser}
                className="bg-blue-600 rounded-2xl px-6 py-4 mt-6 active:opacity-80"
              >
                <Text className="text-white text-base font-bold text-center">
                  Sačuvaj izmene
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
