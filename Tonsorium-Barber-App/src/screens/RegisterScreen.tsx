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

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp<'Register'>>();
  const styles = createStyles(COLORS);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredShop, setPreferredShop] = useState('Barber Chamos');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Por favor completa los campos obligatorios para registrarte.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const firstName = fullName.split(' ')[0] || fullName;
      navigation.navigate('Home', { userName: firstName });
    } catch (err) {
      setError('Ocurrió un error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
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
              <Text style={styles.markLabel}>TONSORIUM · REGISTRO</Text>
            </View>
            <Text style={styles.wordmark}>Crea tu cuenta</Text>
            <Text style={styles.tagline}>
              !Mas que un corte, una experiencia¡.
            </Text>
          </View>

          <View style={styles.formSide}>
            <Text style={styles.heading}>Crea tu perfil</Text>
            <Text style={styles.subheading}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
                Inicia sesión aquí
              </Text>
            </Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Nombre completo *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Carlos Mendoza"
                  placeholderTextColor={COLORS.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Correo electrónico *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="tucorreo@ejemplo.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Teléfono de contacto</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="+57 320 6107465"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Barbería preferida</Text>
              <View style={styles.shopSelector}>
                {['Barber Chamos', 'Barberia Prado Centro', 'SurBarber'].map((shop) => (
                  <Pressable
                    key={shop}
                    style={[
                      styles.shopChip,
                      preferredShop === shop && styles.shopChipActive,
                    ]}
                    onPress={() => setPreferredShop(shop)}
                  >
                    <Text
                      style={[
                        styles.shopChipText,
                        preferredShop === shop && styles.shopChipTextActive,
                      ]}
                    >
                      {shop}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contraseña *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Text style={styles.toggleVisibility}>
                    {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar contraseña *</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor={COLORS.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submit,
                pressed && styles.submitPressed,
                loading && styles.submitDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? 'Creando cuenta...' : 'Registrarme'}
              </Text>
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
      paddingTop: 64,
      paddingBottom: 32,
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
      marginTop: 14,
      fontSize: 34,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      color: colors.textLight,
    },
    tagline: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      color: '#C9CFC4',
      maxWidth: 320,
    },

    formSide: {
      backgroundColor: colors.background,
      paddingHorizontal: 28,
      paddingTop: 28,
      paddingBottom: 48,
    },
    heading: {
      fontSize: 24,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      color: colors.textDark,
      marginBottom: 4,
    },
    subheading: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: 24,
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
      marginBottom: 20,
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
    shopSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    shopChip: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    shopChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    shopChipText: {
      fontSize: 12.5,
      color: colors.textDark,
      fontWeight: '500',
    },
    shopChipTextActive: {
      color: colors.textLight,
      fontWeight: '700',
    },
    submit: {
      backgroundColor: colors.secondary,
      borderRadius: 3,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 10,
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
  });
}
