import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { resetPassword } from '../services/authApi';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States para sa visibility ng bawat field
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();
  const { username, otp } = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all password fields.");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword({
        username,
        otp,
        password,
      });

      Alert.alert("Success", "Password updated successfully!", [
        { text: "Login Now", onPress: () => router.replace('/') }
      ]);
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
          <View style={styles.formContainer}>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>Set your new secure password.</Text>

            {/* New Password Input with Eye */}
            <View style={styles.passwordWrapper}>
              <TextInput 
                style={styles.input} 
                placeholder="New Password" 
                placeholderTextColor="#12551b"
                secureTextEntry={!showPassword} 
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)} 
                style={styles.iconStyle}
              >
                <MaterialCommunityIcons 
                  name={showPassword ? "eye" : "eye-off"} 
                  size={22} 
                  color="#12551b" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Confirm New Password Input with Eye */}
            <View style={styles.passwordWrapper}>
              <TextInput 
                style={styles.input} 
                placeholder="Confirm New Password" 
                placeholderTextColor="#12551b"
                secureTextEntry={!showConfirmPassword} 
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                style={styles.iconStyle}
              >
                <MaterialCommunityIcons 
                  name={showConfirmPassword ? "eye" : "eye-off"} 
                  size={22} 
                  color="#12551b" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleComplete} disabled={isSubmitting}>
              <Text style={styles.buttonText}>{isSubmitting ? 'Updating...' : 'Reset Password'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f6915' },
  formContainer: { 
    flex: 1, 
    backgroundColor: '#E6912C', 
    marginTop: 80, 
    borderTopLeftRadius: 50, 
    borderTopRightRadius: 50, 
    padding: 30,
    minHeight: 500
  },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 25, color: '#444' },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
    borderRadius: 25,
    height: 55,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  input: { 
    flex: 1,
    fontSize: 16,
    color: '#000'
  },
  iconStyle: {
    paddingLeft: 10,
  },
  button: { 
    backgroundColor: '#107b49', 
    height: 55, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10 
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default ResetPassword;
