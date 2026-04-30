import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  SafeAreaView, KeyboardAvoidingView, Platform, Image, ScrollView, Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Logo from '../assets/img/logo.png';
import { requestPasswordReset } from '../services/authApi';

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username.trim() || !email.trim()) {
      Alert.alert("Error", "Please enter your username and email.");
      return;
    }

    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      await requestPasswordReset({
        username: username.trim(),
        email: email.trim(),
      });

      router.push({
        pathname: '/verify-otp',
        params: { username: username.trim(), email: email.trim() }
      });
    } catch (error) {
      Alert.alert("Reset Failed", error.message);
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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          
          <View style={styles.logoSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
            </TouchableOpacity>
            <Image source={Logo} style={styles.img} resizeMode="contain" />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Forgot Password?</Text>

            <Text style={styles.subtitle}>Enter the username and email registered in the backend.</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#12551b"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#12551b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset} disabled={isSubmitting}>
              <Text style={styles.resetButtonText}>
                {isSubmitting ? "Sending..." : "Send OTP"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.footerLink} onPress={() => router.back()}>
              <Text style={styles.footerText}>
                Remember your password? <Text style={styles.backToLogin}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ... keep styles the same (update maxLength and placeholder in the component above)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f6915' },
  logoSection: { height: 180, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  backButton: { position: 'absolute', top: 20, left: 20, padding: 10 },
  img: { width: 90, height: 90 },
  formContainer: {
    flexGrow: 1, 
    backgroundColor: '#E6912C', 
    borderTopLeftRadius: 50, borderTopRightRadius: 50,  
    paddingHorizontal: 30, paddingTop: 30,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 25,
    marginBottom: 20,
    padding: 5,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  activeTab: { backgroundColor: '#107b49' },
  tabText: { color: '#333', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  subtitle: { fontSize: 14, color: '#444', textAlign: 'center', marginBottom: 20 },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
    borderRadius: 25, height: 55, marginBottom: 25, justifyContent: 'center', paddingHorizontal: 20,
  },
  input: { fontSize: 16, color: '#000' },
  resetButton: { backgroundColor: '#107b49', borderRadius: 25, height: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  resetButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  footerLink: { alignItems: 'center', marginTop: 10 },
  footerText: { color: '#FFFFFF', fontSize: 14 },
  backToLogin: { color: '#0A5C36', fontWeight: 'bold' },
});

export default ForgotPassword;
