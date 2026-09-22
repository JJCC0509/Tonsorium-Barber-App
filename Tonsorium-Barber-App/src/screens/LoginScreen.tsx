import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, Colors } from '../styles/colors';
import { NavigationProp } from '../types/navigation';

interface Credentials {
  email: string;
  password: string;
  remember: boolean;
}

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp<'Login'>>();
  const styles = createStyles(COLORS);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!email || !password) {
      setError('Completa tu correo y tu contraseña para continuar.');
      return;
    }

    const credentials: Credentials = { email, password, remember };
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log('Iniciar sesión con:', credentials);
      const nameFromEmail = email.split('@')[0];
      const capitalizedName = nameFromEmail ? nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1) : 'Usuario';
      navigation.navigate('Home', { userName: capitalizedName });
    } catch (err) {
      setError('No pudimos iniciar tu sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    navigation.navigate('Home', { userName: 'Invitado' });
  };

  const handleGoToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={styles.brandStripe} pointerEvents="none">
              <View style={[styles.stripeBar, { left: -40 }]} />
              <View style={[styles.stripeBar, { left: 10 }]} />
              <View style={[styles.stripeBar, { left: 60 }]} />
            </View>

            <View style={styles.markRow}>
              <View style={styles.markDot} />
              <Text style={styles.markLabel}>TONSORIUM · BARBER APP</Text>
            </View>
            <Text style={styles.wordmark}>Tonsorium</Text>
            <Text style={styles.tagline}>
              Reserva tu turno, guarda tu estilo favorito y lleva el control de
              tus cortes, todo desde un mismo lugar.
            </Text>
          </View>

          <View style={styles.formSide}>
            <Text style={styles.heading}>Bienvenido de nuevo</Text>
            <Text style={styles.subheading}>
              ¿Aún no tienes cuenta?{' '}
              <Text style={styles.link} onPress={handleGoToRegister}>
                Regístrate aquí
              </Text>
            </Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View
                style={[
                  styles.inputRow,
                  error && !email ? styles.inputRowError : null,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="tucorreo@ejemplo.com"
                  placeholderTextColor="#8B8375"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña</Text>
              <View
                style={[
                  styles.inputRow,
                  error && !password ? styles.inputRowError : null,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Tu contraseña"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Text style={styles.toggleVisibility}>
                    {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.rowBetween}>
              <Pressable
                style={styles.remember}
                onPress={() => setRemember((v) => !v)}
                hitSlop={8}
              >
                <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                  {remember && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Recordarme</Text>
              </Pressable>
              <Pressable hitSlop={8}>
                <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submit,
                pressed && styles.submitPressed,
                loading && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.guest} onPress={handleGuestLogin}>
              <Text style={styles.guestText}>Continuar como invitado</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    root: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1 },

    brand: {
      backgroundColor: colors.primary,
      paddingTop: 72,
      paddingBottom: 40,
      paddingHorizontal: 28,
      overflow: 'hidden',
    },
    brandStripe: {
      position: 'absolute',
      top: 0,
      right: -20,
      bottom: 0,
      width: 160,
    },
    stripeBar: {
      position: 'absolute',
      top: -60,
      bottom: -60,
      width: 22,
      backgroundColor: 'rgba(198, 154, 78, 0.66)',
      transform: [{ rotate: '20deg' }],
    },
    markRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    markDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    markLabel: {
      fontSize: 12,
      letterSpacing: 0.6,
      color: colors.accentLight,
      fontWeight: '600',
    },
    wordmark: {
      marginTop: 18,
      fontSize: 42,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      color: colors.textLight,
    },
    tagline: {
      marginTop: 12,
      fontSize: 14.5,
      lineHeight: 21,
      color: '#C9CFC4',
      maxWidth: 320,
    },

    formSide: {
      backgroundColor: colors.background,
      paddingHorizontal: 28,
      paddingTop: 32,
      paddingBottom: 48,
    },
    heading: {
      fontSize: 26,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      color: colors.textDark,
      marginBottom: 6,
    },
    subheading: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 28,
    },
    link: {
      color: colors.primary,
      fontWeight: '700',
    },
    errorBox: {
      backgroundColor: colors.errorBg,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      borderRadius: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 20,
    },
    errorText: {
      color: colors.error,
      fontSize: 13.5,
    },
    field: {
      marginBottom: 22,
    },
    label: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textDark,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1.5,
      borderBottomColor: colors.border,
      paddingBottom: 8,
    },
    inputRowError: {
      borderBottomColor: colors.error,
    },
    input: {
      flex: 1,
      fontSize: 15.5,
      color: colors.textDark,
      paddingVertical: 4,
    },
    toggleVisibility: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      paddingLeft: 12,
    },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 26,
    },
    remember: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 17,
      height: 17,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkmark: {
      color: colors.textLight,
      fontSize: 11,
      fontWeight: '700',
    },
    rememberText: {
      fontSize: 13.5,
      color: colors.textMuted,
    },
    forgot: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.primary,
    },
    submit: {
      backgroundColor: colors.secondary,
      borderRadius: 3,
      paddingVertical: 15,
      alignItems: 'center',
    },
    submitPressed: {
      backgroundColor: colors.primaryDeep,
    },
    submitDisabled: {
      opacity: 0.6,
    },
    submitText: {
      color: colors.textLight,
      fontSize: 15,
      fontWeight: '700',
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 26,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    guest: {
      borderWidth: 1.5,
      borderColor: colors.secondary,
      borderRadius: 3,
      paddingVertical: 14,
      alignItems: 'center',
    },
    guestText: {
      fontSize: 14.5,
      fontWeight: '700',
      color: colors.textDark,
    },
  });
}