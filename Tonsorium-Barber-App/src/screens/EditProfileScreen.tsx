import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { LoadingState } from '../components/StateViews';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import { toErrorMessage } from '../services/apiClient';
import { COLORS, Colors } from '../styles/colors';
import { NavigationProp } from '../types/navigation';

export default function EditProfileScreen() {
  const navigation = useNavigation<NavigationProp<'EditProfile'>>();
  const { me, updateProfile } = useAuth();
  const { shops, loading: loadingShops, error: catalogError, refetch: reloadShops } = useCatalog();
  const styles = createStyles(COLORS);

  const [fullName, setFullName] = useState(me?.user.full_name ?? '');
  const [phone, setPhone] = useState(me?.user.phone ?? '');
  const [favoriteStyle, setFavoriteStyle] = useState(me?.user.favorite_style ?? '');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(
    me?.user.preferred_shop_id ?? null,
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Precarga los campos cuando el perfil llega (o cambia) desde el contexto.
  useEffect(() => {
    if (!me) {
      return;
    }
    setFullName(me.user.full_name);
    setPhone(me.user.phone ?? '');
    setFavoriteStyle(me.user.favorite_style ?? '');
    setSelectedShopId(me.user.preferred_shop_id);
  }, [me]);

  if (!me) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LoadingState />
      </View>
    );
  }

  const handleSave = async () => {
    setError('');

    if (fullName.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        favorite_style: favoriteStyle.trim() || null,
        preferred_shop_id: selectedShopId,
      });
      Alert.alert('Perfil actualizado', 'Tus cambios se guardaron correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSaving(false);
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

            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>← Atrás</Text>
            </Pressable>

            <View style={styles.markRow}>
              <View style={styles.markDot} />
              <Text style={styles.markLabel}>TONSORIUM · PERFIL</Text>
            </View>
            <Text style={styles.wordmark}>Editar perfil</Text>
            <Text style={styles.tagline}>Actualiza tus datos y preferencias.</Text>
          </View>

          <View style={styles.formSide}>
            <Text style={styles.heading}>Tus datos</Text>
            <Text style={styles.subheading}>
              Revisa y ajusta la información de tu cuenta.
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
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={styles.readonlyRow}>
                <Text style={styles.readonlyText}>{me.user.email}</Text>
              </View>
              <Text style={styles.hint}>El correo no se puede modificar.</Text>
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
              <Text style={styles.label}>Estilo favorito</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. Fade medio con barba"
                  placeholderTextColor={COLORS.textMuted}
                  value={favoriteStyle}
                  onChangeText={setFavoriteStyle}
                  autoCapitalize="sentences"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Barbería preferida</Text>
              {loadingShops ? (
                <Text style={styles.shopHint}>Cargando barberías...</Text>
              ) : shops.length === 0 ? (
                <View>
                  <Text style={styles.shopHint}>
                    {catalogError ?? 'No hay barberías disponibles por ahora.'}
                  </Text>
                  <Pressable onPress={reloadShops} hitSlop={6}>
                    <Text style={styles.shopRetry}>Reintentar</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.shopSelector}>
                  {shops.map((shop) => (
                    <Pressable
                      key={shop.id}
                      style={[
                        styles.shopChip,
                        selectedShopId === shop.id && styles.shopChipActive,
                      ]}
                      onPress={() =>
                        setSelectedShopId((current) => (current === shop.id ? null : shop.id))
                      }
                    >
                      <Text
                        style={[
                          styles.shopChipText,
                          selectedShopId === shop.id && styles.shopChipTextActive,
                        ]}
                      >
                        {shop.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submit,
                pressed && styles.submitPressed,
                saving && styles.submitDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.submitText}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
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
    backBtn: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 6,
      marginBottom: 18,
    },
    backBtnText: {
      color: colors.textLight,
      fontSize: 13,
      fontWeight: '700',
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
    readonlyRow: {
      borderBottomWidth: 1.5,
      borderBottomColor: colors.border,
      paddingBottom: 8,
    },
    readonlyText: {
      fontSize: 15.5,
      color: colors.textMuted,
      paddingVertical: 4,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 6,
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
    shopHint: {
      fontSize: 12.5,
      color: colors.textMuted,
      marginTop: 4,
    },
    shopRetry: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.primary,
      marginTop: 8,
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
