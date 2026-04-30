import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  SafeAreaView, KeyboardAvoidingView, Platform, Image, ScrollView, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import Logo from '../assets/img/logo.png';
import { login } from '../services/authApi';
import { apiConfig } from '../lib/api/client';

const LoginScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!user.trim() || !password.trim()) {
      Alert.alert("Required Fields", "Please enter both email and password.");
      return;
    }

  
    // Ngayon, tatanggapin na ang kahit anong character (letters, numbers, or symbols)
    if (password.length < 8) {
      Alert.alert(
        "Short Password", 
        "Password must be at least 8 characters long."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await login({ user: user.trim(), password });
      const targetPath =
        response.user.role === 'Admin'
          ? '../admin/AdminDashboard'
          : response.user.role === 'Table Manager'
            ? '../tablemanager/TableManagerDashboard'
            : '../superAdmin/Superadmin';

      router.replace({
        pathname: targetPath,
        params: {
          name: response.user.name,
          userId: response.user.id,
          email: response.user.email,
          role: response.user.role,
          branchId: response.user.branchId,
          contact: response.user.contact,
        },
      });
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
          
          <View style={styles.logoSection}>
            <Image source={Logo} style={styles.img} resizeMode="contain" />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.loginTitle}>Login</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#12551b" 
                value={user}
                onChangeText={setUser}
                autoCapitalize="none"
              />
            </View> 

            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#0c5907"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.iconStyle}>
                <MaterialCommunityIcons name={showPassword ? "eye" : "eye-off"} size={22} color="#12551b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} activeOpacity={0.8} onPress={handleLogin} disabled={isSubmitting}>
              <Text style={styles.loginButtonText}>{isSubmitting ? 'Signing In...' : 'Login'}</Text>
            </TouchableOpacity>
            <Text style={styles.apiHint}>API: {apiConfig.baseUrl || 'not configured'}</Text>
            
            <View style={styles.footer}>
              <View style={styles.divider} />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};







const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f6915' },
  logoSection: { height: 220, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  img: { width: 180, height: 180 },
  formContainer: {
    flexGrow: 1, 
    backgroundColor: '#E6912C', 
    borderTopLeftRadius: 50, borderTopRightRadius: 50,
    paddingHorizontal: 30, paddingTop: 40, paddingBottom: 40, 
    minHeight: 500,    
  },
  loginTitle: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 30 },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
    borderRadius: 25, height: 55, marginBottom: 20,
    justifyContent: 'center', paddingHorizontal: 20,
  },
  passwordWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
    borderRadius: 25, height: 55, marginBottom: 20, paddingHorizontal: 20,
  },
  input: { fontSize: 16, color: '#000' },
  iconStyle: { paddingLeft: 10 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: '#0A5C36', fontSize: 13 },
  loginButton: {
    backgroundColor: '#107b49', borderRadius: 25, height: 55,
    justifyContent: 'center', alignItems: 'center', marginBottom: 30,
  },
  loginButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  apiHint: { color: '#0A5C36', fontSize: 11, textAlign: 'center', marginTop: -18, marginBottom: 20 },
  footer: { marginTop: 'auto', alignItems: 'center' },
  divider: { width: '100%', height: 1, backgroundColor: '#fff', marginBottom: 20, opacity: 0.3 },
});

export default LoginScreen;
