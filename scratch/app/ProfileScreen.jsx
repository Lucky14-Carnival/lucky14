import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBranchChoices, getUserById, updateUserProfile } from '../services/authApi';

const ProfileScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isViewOnly = String(params.viewOnly || '') === 'true' || String(params.viewerContext || '') === 'superadmin';

  const [name, setName] = useState(params.name || '');
  const [contact, setContact] = useState(params.contact || '');
  const [role, setRole] = useState(params.role || '');
  const [email, setEmail] = useState(params.email || '');
  const [branchId, setBranchId] = useState(params.branchId ? String(params.branchId) : '');
  const [branches, setBranches] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [active, setActive] = useState(params.active === 'false' ? false : true);

  useEffect(() => {
    if (params.name) setName(params.name);
    if (params.contact) setContact(params.contact);
    if (params.email) setEmail(params.email);
    if (params.role) setRole(params.role);
    if (params.branchId) setBranchId(String(params.branchId));
  }, [params.name, params.contact, params.email, params.role, params.branchId]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const items = await getBranchChoices();
        setBranches(items);
      } catch (error) {
        Alert.alert('Branch Error', error.message);
      }
    };

    loadBranches();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!params.userId) {
        return;
      }

      try {
        setIsLoadingProfile(true);
        const user = await getUserById(params.userId);
        setName(user.name || '');
        setContact(user.contact || '');
        setEmail(user.email || '');
        setRole(user.role || '');
        setBranchId(user.branchId ? String(user.branchId) : '');
        setActive(Boolean(user.active));
      } catch (error) {
        Alert.alert('Profile Error', error.message);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [params.userId]);

  const handleSave = async () => {
    if (contact && contact.length < 11) {
      Alert.alert('Invalid Phone', 'Please enter a valid 11-digit mobile number.');
      return;
    }
    if (!params.userId) {
      Alert.alert('Save Failed', 'Missing user account context.');
      return;
    }

    try {
      setIsLoadingProfile(true);
      const updated = await updateUserProfile(params.userId, {
        username: name.trim(),
        email: email.trim(),
        contact: contact.trim(),
        role,
        branchId: branchId ? Number(branchId) : null,
        active,
      });
      setName(updated.name || '');
      setContact(updated.contact || '');
      setEmail(updated.email || '');
      setRole(updated.role || '');
      setBranchId(updated.branchId ? String(updated.branchId) : '');
      setActive(Boolean(updated.active));
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Save Failed', error.message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        {isViewOnly ? (
          <View style={styles.headerSpacer} />
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <MaterialCommunityIcons
              name={isEditing ? 'close-circle' : 'account-edit'}
              size={28}
              color="#FFF"
            />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <MaterialCommunityIcons name="account" size={80} color="#0f6915" />
              {isEditing && (
                <TouchableOpacity style={styles.cameraIcon}>
                  <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.displayName}>{name || 'No name yet'}</Text>
            <Text style={styles.displayRole}>{role || 'No role assigned'}</Text>
            {isLoadingProfile ? <Text style={styles.loadingText}>Refreshing profile...</Text> : null}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.infoBox}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={[styles.inputWrapper, !isEditing && styles.disabledInput]}>
                <MaterialCommunityIcons name="account-outline" size={22} color="#12551b" />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  editable={isEditing && !isViewOnly}
                  placeholder="Enter full name"
                />
              </View>

              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={[styles.inputWrapper, !isEditing && styles.disabledInput]}>
                <MaterialCommunityIcons name="phone-outline" size={22} color="#12551b" />
                <TextInput
                  style={styles.input}
                  value={contact}
                  onChangeText={setContact}
                  editable={isEditing && !isViewOnly}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputWrapper, !isEditing && styles.disabledInput]}>
                <MaterialCommunityIcons name="email-outline" size={22} color="#12551b" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  editable={isEditing && !isViewOnly}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.inputLabel}>Role</Text>
              <View style={[styles.inputWrapper, !isEditing && styles.disabledInput]}>
                <MaterialCommunityIcons name="briefcase-outline" size={22} color="#12551b" />
                <TextInput
                  style={styles.input}
                  value={role}
                  onChangeText={setRole}
                  editable={isEditing && !isViewOnly}
                />
              </View>

              <Text style={styles.inputLabel}>Assigned Branch</Text>
              <View style={[styles.pickerWrapper, !isEditing && styles.disabledInput]}>
                <MaterialCommunityIcons name="map-marker-outline" size={22} color="#12551b" />
                {isEditing && !isViewOnly ? (
                  <Picker
                    selectedValue={branchId}
                    onValueChange={(itemValue) => setBranchId(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select branch" value="" />
                    {branches.map((branch) => (
                      <Picker.Item key={branch.id} label={branch.label} value={String(branch.id)} />
                    ))}
                  </Picker>
                ) : (
                  <Text style={styles.branchText}>
                    {branches.find((branch) => String(branch.id) === String(branchId))?.label || 'No branch assigned'}
                  </Text>
                )}
              </View>
            </View>

            {isEditing && !isViewOnly && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            )}

            {!isViewOnly ? (
              <TouchableOpacity style={styles.logoutButton} onPress={() => router.replace('/')}>
                <MaterialCommunityIcons name="logout" size={22} color="#FFF" />
                <Text style={styles.logoutText}>Sign Out from Device</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f6915' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    paddingBottom: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  backButton: { padding: 5 },
  headerSpacer: { width: 38, height: 38 },
  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: {
    backgroundColor: '#FFF',
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#E6912C',
    position: 'relative'
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E6912C',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF'
  },
  displayName: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 10 },
  displayRole: { fontSize: 16, color: '#ffcc80', fontWeight: '500' },
  loadingText: { fontSize: 12, color: '#FFF', marginTop: 6, opacity: 0.8 },
  formContainer: {
    flexGrow: 1,
    backgroundColor: '#E6912C',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
    marginTop: 10
  },
  infoBox: { marginBottom: 20 },
  inputLabel: { color: '#333', fontSize: 13, fontWeight: 'bold', marginBottom: 5, marginLeft: 5 },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    height: 55,
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  pickerWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 15,
    minHeight: 55,
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  disabledInput: { backgroundColor: 'rgba(255,255,255,0.7)', elevation: 0 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#000' },
  picker: { flex: 1, marginLeft: 12, color: '#000' },
  branchText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#000' },
  saveButton: {
    backgroundColor: '#0f6915',
    height: 55,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 4
  },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#d32f2f',
    height: 55,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  logoutText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});

export default ProfileScreen;
