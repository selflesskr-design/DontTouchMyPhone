import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GuardProvider } from './src/context/GuardContext';
import { GuardScreen } from './src/screens/GuardScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <GuardProvider>
        <SafeAreaView style={styles.safe}>
          <StatusBar style="dark" />
          <GuardScreen />
        </SafeAreaView>
      </GuardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },
});
