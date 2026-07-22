import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { GuardProvider } from './src/context/GuardContext';
import { GuardScreen } from './src/screens/GuardScreen';

export default function App() {
  return (
    <GuardProvider>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <GuardScreen />
      </SafeAreaView>
    </GuardProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
});
