import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, Colors } from '../styles/colors';
import { NavigationProp, ScreenRouteProp } from '../types/navigation';

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp<'Profile'>>();
  const route = useRoute<ScreenRouteProp<'Profile'>>();
  const styles = createStyles(COLORS);

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      { }
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backBtnText}>← Inicio</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.profileHeaderContent}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>U</Text>
          </View>
          <Text style={styles.userName}>Usuario</Text>
          <Text style={styles.userEmail}>[tucorreo@ejemplo.com]</Text>

          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>⭐ MIEMBRO CLUB TONSORIUM</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        { }
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Cortes hechos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>340</Text>
            <Text style={styles.statLabel}>Puntos Tonsorium</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
        </View>

        { }
        <Text style={styles.sectionTitle}>Mi Cuenta & Preferencias</Text>

        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuIcon}>💈</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Barbería Habitual</Text>
              <Text style={styles.menuSub}>Barber Chamos · Av. Principal 123</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuIcon}>✂️</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Estilo Favorito</Text>
              <Text style={styles.menuSub}>Fade Medio + Barba Perfilada</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('Appointments', { initialTab: 'my_appointments' })}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Historial de Citas</Text>
              <Text style={styles.menuSub}>Consulta cortes anteriores</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Recordatorios & Notificaciones</Text>
              <Text style={styles.menuSub}>Alertas de turnos disponibles</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </Pressable>
        </View>

        { }
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Sobre Tonsorium App</Text>
              <Text style={styles.menuSub}>Versión 1.0.0 (MVP)</Text>
            </View>
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable style={styles.menuItem}>
            <Text style={styles.menuIcon}>🛡️</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Términos y Privacidad</Text>
              <Text style={styles.menuSub}>Políticas de la plataforma</Text>
            </View>
          </Pressable>
        </View>

        { }
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>🚪 Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.primary,
      paddingTop: 50,
      paddingBottom: 24,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      alignItems: 'center',
    },
    headerNav: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    backBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 6,
    },
    backBtnText: {
      color: colors.textLight,
      fontSize: 13,
      fontWeight: '700',
    },
    headerTitle: {
      color: colors.textLight,
      fontSize: 18,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      fontWeight: '700',
    },
    profileHeaderContent: {
      alignItems: 'center',
    },
    avatarLarge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.secondary,
      borderWidth: 3,
      borderColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    avatarText: {
      color: colors.textLight,
      fontSize: 32,
      fontWeight: '700',
    },
    userName: {
      fontSize: 22,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      fontWeight: '700',
      color: colors.textLight,
    },
    userEmail: {
      fontSize: 13,
      color: '#C9CFC4',
      marginTop: 2,
    },
    membershipBadge: {
      marginTop: 10,
      backgroundColor: colors.goldLight,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accentLight,
    },
    membershipText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.gold,
      letterSpacing: 0.5,
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      paddingBottom: 40,
    },

    statsContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      marginBottom: 24,
      alignItems: 'center',
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textDark,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.border,
    },

    sectionTitle: {
      fontSize: 15,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      fontWeight: '700',
      color: colors.textDark,
      marginBottom: 10,
      marginTop: 4,
    },

    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      marginBottom: 20,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    menuIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: colors.textDark,
    },
    menuSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    menuArrow: {
      fontSize: 20,
      color: colors.textMuted,
      fontWeight: '400',
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 48,
    },

    logoutBtn: {
      backgroundColor: colors.errorBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 8,
    },
    logoutBtnText: {
      color: colors.error,
      fontSize: 15,
      fontWeight: '700',
    },
  });
}
