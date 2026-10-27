import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ErrorState } from './src/components/StateViews';
import { COLORS } from './src/styles/colors';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import AppointmentsScreen from './src/screens/AppointmentScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Se muestra mientras se valida el token guardado contra `GET /me`. */
function BootScreen() {
  return (
    <View style={styles.boot}>
      <StatusBar style="light" />
      <ActivityIndicator size="large" color={COLORS.accentLight} />
    </View>
  );
}

/**
 * Hay sesion guardada pero el servidor no respondio (sin conexion o backend
 * dormido). No se cierra la sesion: se le ofrece reintentar o entrar con otra
 * cuenta.
 */
function RestoreFailedScreen() {
  const { retryRestore, signOut } = useAuth();

  return (
    <View style={styles.restoreFailed}>
      <StatusBar style="dark" />
      <ErrorState
        message="No pudimos conectar con el servidor para restaurar tu sesión. Revisa tu conexión a internet e intenta de nuevo."
        onRetry={() => {
          void retryRestore();
        }}
      />
      <Pressable
        style={styles.restoreFailedLink}
        onPress={() => {
          void signOut();
        }}
      >
        <Text style={styles.restoreFailedLinkText}>Entrar con otra cuenta</Text>
      </Pressable>
    </View>
  );
}

function RootNavigator() {
  const { status } = useAuth();

  if (status === 'restoring') {
    return <BootScreen />;
  }

  if (status === 'restoreFailed') {
    return <RestoreFailedScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {status === 'signedIn' ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Appointments" component={AppointmentsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreFailed: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  restoreFailedLink: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  restoreFailedLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textGreen,
    textDecorationLine: 'underline',
  },
});
