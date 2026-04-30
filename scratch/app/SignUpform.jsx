import React, { useEffect, useMemo, useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; 
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import Logo from '../assets/img/logo.png';
import { getBranchChoices, mapSignUpPayload, signUp } from '../services/authApi';

  const SignUpform = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [Username, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Table Manager');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  const creatorRole = params.creatorRole || '';
  const creatorUserId = params.creatorUserId || '';
  const creatorBranchId = params.creatorBranchId || '';
  const creatorName = params.creatorName || '';

  const isCreatorFlow = Boolean(creatorRole && creatorUserId);
  const isAdminCreator = creatorRole === 'Admin';
  const isSuperAdminCreator = creatorRole === 'Super Admin';
  const isStandaloneAdminSignUp = !isCreatorFlow && role === 'Admin';

  const branchOptions = useMemo(
    () => branches.filter((item) => item.active),
    [branches]
  );
  const shouldShowBranchPicker = isSuperAdminCreator || isStandaloneAdminSignUp;
  const shouldRequireBranch =
    branchOptions.length > 0 &&
    ((isSuperAdminCreator && (role === 'Admin' || role === 'Table Manager')) || isStandaloneAdminSignUp);

  useEffect(() => {
    if (!isCreatorFlow) {
      return;
    }

    if (isAdminCreator) {
      setRole('Table Manager');
      setBranchId(String(creatorBranchId || ''));
      return;
    }

    if (!isSuperAdminCreator && !isStandaloneAdminSignUp) {
      return;
    }

    let isMounted = true;
    const loadBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const items = await getBranchChoices();
        if (isMounted) {
          setBranches(items);
        }
      } catch (error) {
        Alert.alert('Branches Error', error.message);
      } finally {
        if (isMounted) {
          setIsLoadingBranches(false);
        }
      }
    };

    loadBranches();

    return () => {
      isMounted = false;
    };
  }, [creatorBranchId, isAdminCreator, isStandaloneAdminSignUp, isCreatorFlow, isSuperAdminCreator]);

  const handleSignUp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!Username.trim() || !email.trim() || !contact.trim() || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const cleanContact = contact.trim();
    const isLocalFormat = cleanContact.startsWith('0') && cleanContact.length === 11;
    const isISDFormat = cleanContact.startsWith('+63') && cleanContact.length === 13;

    if (!isLocalFormat && !isISDFormat) {
      Alert.alert("Invalid Number", "Use 09XXXXXXXXX or +639XXXXXXXXX format.");
      return;
    }

    // 4. Password Validation
    if (password.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    if (shouldRequireBranch && !branchId) {
      Alert.alert("Branch Required", "Choose the branch for the new user account.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await signUp(mapSignUpPayload({
        username: Username.trim(),
        email: email.trim(),
        contact: cleanContact,
        password,
        role,
        branchId: isCreatorFlow ? Number(branchId || creatorBranchId || 0) || null : null,
        createdByUserId: isCreatorFlow ? Number(creatorUserId) : null,
      }));

      if (isCreatorFlow) {
        Alert.alert("Success", `${response.user.name} was created successfully.`, [
          {
            text: "OK",
            onPress: () => {
              router.back();
            }
          }
        ]);
        return;
      }

      const targetPath = role === 'Admin' ? '../admin/AdminDashboard' : '../tablemanager/TableManagerDashboard';
      Alert.alert("Success", `Welcome, ${response.user.name}!`, [
        {
          text: "OK",
          onPress: () => {
            router.replace({
              pathname: targetPath,
              params: {
                name: response.user.name,
                userId: response.user.id,
                email: response.user.email,
                role: response.user.role,
                branchId: response.user.branchId,
                contact: response.user.contact,
              }
            });
          }
        }
      ]);
    } catch (error) {
      Alert.alert("Sign Up Failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.logoSection}>
            <Image source={Logo} style={styles.img} />
          </View>

          <View style={styles.headerContainer}>
            <Text style={styles.headerSpace}>Create Account</Text>
            <Text style={styles.join}>
              {isCreatorFlow
                ? `${creatorName || creatorRole} is creating a new user account`
                : 'Join the Lucky 14 Carnival'}
            </Text>
          </View>

          <View style={styles.box}>
            
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Aloen Lacson"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={Username}
                onChangeText={setUserName}
              />
            </View>

            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.fieldLabel}>Phone No.</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="09*********"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={contact}
                onChangeText={setContact}
                keyboardType='phone-pad'
              />
            </View>

            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create Password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons 
                  name={showPassword ? "eye" : "eye-off"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <MaterialCommunityIcons 
                  name={showConfirmPassword ? "eye" : "eye-off"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={role}
                onValueChange={(itemValue) => setRole(itemValue)}
                style={styles.picker}
                dropdownIconColor="white"
                enabled={!isAdminCreator}
              >
                {(!isCreatorFlow || isSuperAdminCreator) && (
                  <Picker.Item label="Admin" value="Admin" color={Platform.OS === 'ios' ? 'white' : 'black'} />
                )}
                <Picker.Item label="Table Manager" value="Table Manager" color={Platform.OS === 'ios' ? 'white' : 'black'}/>
              </Picker>
            </View>

            {isAdminCreator ? (
              <View>
                <Text style={styles.fieldLabel}>Assigned Branch</Text>
                <View style={styles.readonlyBox}>
                  <Text style={styles.readonlyText}>This user will be assigned to your current branch.</Text>
                </View>
              </View>
            ) : null}

            {shouldShowBranchPicker ? (
              <View>
                <Text style={styles.fieldLabel}>Assign Branch</Text>
                <View style={styles.pickerWrapper}>
                  {isLoadingBranches ? (
                    <View style={styles.loadingBranchBox}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.loadingBranchText}>Loading branches...</Text>
                    </View>
                  ) : (
                    <Picker
                      selectedValue={branchId}
                      onValueChange={(itemValue) => setBranchId(itemValue)}
                      style={styles.picker}
                      dropdownIconColor="white"
                    >
                      <Picker.Item
                        label={branchOptions.length ? "Select a branch" : "No active branch available"}
                        value=""
                        color={Platform.OS === 'ios' ? 'white' : 'black'}
                      />
                      {branchOptions.map((branch) => (
                        <Picker.Item
                          key={branch.id}
                          label={branch.label}
                          value={String(branch.id)}
                          color={Platform.OS === 'ios' ? 'white' : 'black'}
                        />
                      ))}
                    </Picker>
                  )}
                </View>
              </View>
            ) : null}

            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isSubmitting}>
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Creating Account...' : isCreatorFlow ? 'Create Account' : 'Create Account & Login'}
              </Text>
            </TouchableOpacity>
            
            {!isCreatorFlow ? (
              <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/')}>
                <Text style={styles.loginText}>
                  Already have an account? <Text style={{fontWeight:'bold', color: '#fff'}}>Sign in here</Text>
                </Text>
              </TouchableOpacity>
            ) : null}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};









const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f6915' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  logoSection: { alignItems: 'center', marginTop: 20 },
  img: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff' },
  headerContainer: { alignItems: 'center', marginVertical: 15 },
  headerSpace: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  join: { fontSize: 14, color: '#ff790b', fontStyle: 'italic' },
  box: { backgroundColor: 'rgba(255, 255, 255, 0.15)', marginHorizontal: 25, padding: 20, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  fieldLabel: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  inputWrapper: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 10, height: 45, justifyContent: 'center', paddingHorizontal: 12 },
  input: { color: '#fff', fontSize: 14 },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    height: 45,
    paddingHorizontal: 12,
  },
  passwordInput: { flex: 1, color: '#fff', fontSize: 14 },
  pickerWrapper: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 10, height: 45, justifyContent: 'center', marginTop: 5 },
  picker: { color: '#fff', width: '100%' },
  readonlyBox: { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 10, minHeight: 45, justifyContent: 'center', paddingHorizontal: 12, marginTop: 5 },
  readonlyText: { color: '#fff', fontSize: 14 },
  loadingBranchBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 45 },
  loadingBranchText: { color: '#fff', marginLeft: 8, fontSize: 13 },
  button: { backgroundColor: '#ff790b', height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginLink: { marginTop: 15, alignItems: 'center' },
  loginText: { color: '#cbd5e1', fontSize: 13 }
});

export default SignUpform;
