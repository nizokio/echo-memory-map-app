import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthDataProvider } from './src/features/auth/application/AuthDataProvider';
import { EchoDataProvider } from './src/features/echoes/application/EchoDataProvider';
import { UserDataProvider } from './src/features/users/application/UserDataProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthDataProvider>
        <UserDataProvider>
          <EchoDataProvider>
            <AppNavigator />
          </EchoDataProvider>
        </UserDataProvider>
      </AuthDataProvider>
    </SafeAreaProvider>
  );
}
