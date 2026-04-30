import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const router = useRouter();
  const { username, email } = useLocalSearchParams();

  const handleVerify = () => {
    if (otp.length < 4) {
      Alert.alert("Error", "Please enter the 4-digit code.");
      return;
    }

    router.push({
      pathname: '/reset-password',
      params: { username, email, otp },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>Enter the code sent to:{"\n"}{email}</Text>
        
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="0000"
            keyboardType="number-pad"
            maxLength={4}
            onChangeText={setOtp}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerify}>
          <Text style={styles.buttonText}>Verify & Proceed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f6915' },
  formContainer: { flex: 1, backgroundColor: '#E6912C', marginTop: 80, borderTopLeftRadius: 50, borderTopRightRadius: 50, padding: 30 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 16, textAlign: 'center', marginVertical: 20, color: '#444' },
  inputWrapper: { backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 25, height: 60, justifyContent: 'center', marginBottom: 30 },
  input: { fontSize: 28, textAlign: 'center', letterSpacing: 10, fontWeight: 'bold' },
  button: { backgroundColor: '#107b49', height: 55, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default VerifyOTP;
