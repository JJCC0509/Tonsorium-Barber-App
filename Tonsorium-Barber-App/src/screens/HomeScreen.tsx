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

const FEATURED_SERVICES = [
  { id: '1', title: 'Corte Premium', price: '$25000', time: '30 min', desc: 'Corte tradicional a tijera o máquina con acabado fino.' },
  { id: '2', title: 'Barba Tradicional', price: '$18000', time: '25 min', desc: 'Afeitado o perfilado con toalla caliente y bálsamo.' },
  { id: '3', title: 'Combo Especial', price: '$38000', time: '50 min', desc: 'Corte de cabello + arreglo completo de barba + lavado.' },
  { id: '4', title: 'Cejas', price: '$7000', time: '5 min', desc: 'Corte de cejas con tijeras y cera.' },
];

const BARBERS = [
  { id: 'b1', name: 'El Chamo', shop: 'Barber Chamos', rating: '4.9 ⭐', exp: '8 años exp.' },
  { id: 'b2', name: 'Javier Silva', shop: 'Barberia Prado Centro', rating: '4.8 ⭐', exp: '5 años exp.' },
  { id: 'b3', name: 'Diego Torres', shop: 'SurBarber', rating: '5.0 ⭐', exp: '10 años exp.' },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<'Home'>>();
  const route = useRoute<ScreenRouteProp<'Home'>>();
  const userName = route.params?.userName || 'Usuario';
  const styles = createStyles(COLORS);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      { }
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.markDot} />
          <Text style={styles.headerBrand}>TONSORIUM</Text>
        </View>

        <View style={styles.userRow}>
          <View>
            <Text style={styles.welcomeSubtitle}>Bienvenido de nuevo,</Text>
            <Text style={styles.userName}>¡Hola, {userName}! 👋</Text>
          </View>
          <Pressable
            style={styles.profileAvatar}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        { }
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próxima Cita</Text>
          <Pressable onPress={() => navigation.navigate('Appointments', { initialTab: 'my_appointments' })}>
            <Text style={styles.sectionLink}>Ver todas</Text>
          </Pressable>
        </View>

        <View style={styles.appointmentCard}>
          <View style={styles.appointmentBadge}>
            <Text style={styles.badgeText}>CONFIRMADA</Text>
          </View>

          <Text style={styles.appointmentShop}>Barber Chamos</Text>
          <Text style={styles.appointmentService}>Combo (Corte + Barba)</Text>

          <View style={styles.appointmentMetaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Barbero</Text>
              <Text style={styles.metaValue}>El Chamo</Text>
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Fecha & Hora</Text>
              <Text style={styles.metaValue}>Hoy, 4:30 PM</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <Pressable
              style={styles.btnSecondary}
              onPress={() => navigation.navigate('Appointments', { initialTab: 'my_appointments' })}
            >
              <Text style={styles.btnSecondaryText}>Detalles / Cancelar</Text>
            </Pressable>
          </View>
        </View>

        { }
        <Pressable
          style={({ pressed }) => [styles.heroCta, pressed && styles.heroCtaPressed]}
          onPress={() => navigation.navigate('Appointments', { initialTab: 'booking' })}
        >
          <View>
            <Text style={styles.heroTitle}>📅 Reservar Nueva Cita</Text>
            <Text style={styles.heroSub}>Elige barbero, servicio y horario disponible</Text>
          </View>
          <View style={styles.heroArrow}>
            <Text style={styles.heroArrowText}>→</Text>
          </View>
        </Pressable>

        { }
        <View style={styles.quickRow}>
          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate('Appointments', { initialTab: 'my_appointments' })}
          >
            <Text style={styles.quickIcon}>📋</Text>
            <Text style={styles.quickTitle}>Mis Citas</Text>
            <Text style={styles.quickSub}>Historial y activas</Text>
          </Pressable>

          <Pressable
            style={styles.quickCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.quickIcon}>👤</Text>
            <Text style={styles.quickTitle}>Mi Perfil</Text>
            <Text style={styles.quickSub}>Ajustes y favorito</Text>
          </Pressable>
        </View>

        { }
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Barberos Destacados</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
          {BARBERS.map((barber) => (
            <Pressable
              key={barber.id}
              style={styles.barberCard}
              onPress={() => navigation.navigate('Appointments', { initialTab: 'booking', selectedBarber: barber.name })}
            >
              <View style={styles.barberAvatar}>
                <Text style={styles.barberAvatarText}>{barber.name.charAt(0)}</Text>
              </View>
              <Text style={styles.barberName}>{barber.name}</Text>
              <Text style={styles.barberShop}>{barber.shop}</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{barber.rating}</Text>
              </View>
              <Text style={styles.barberExp}>{barber.exp}</Text>
            </Pressable>
          ))}
        </ScrollView>

        { }
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Servicios Destacados</Text>
        </View>

        <View style={styles.servicesGrid}>
          {FEATURED_SERVICES.map((item) => (
            <Pressable
              key={item.id}
              style={styles.serviceCard}
              onPress={() => navigation.navigate('Appointments', { initialTab: 'booking', selectedService: item.title })}
            >
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle}>{item.title}</Text>
                <Text style={styles.servicePrice}>{item.price}</Text>
              </View>
              <Text style={styles.serviceDesc}>{item.desc}</Text>
              <View style={styles.serviceFooter}>
                <Text style={styles.serviceTime}>⏱ {item.time}</Text>
                <Text style={styles.serviceBookText}>Seleccionar →</Text>
              </View>
            </Pressable>
          ))}
        </View>

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
      paddingTop: 54,
      paddingBottom: 22,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    markDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.accent,
    },
    headerBrand: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.accentLight,
    },
    userRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    welcomeSubtitle: {
      fontSize: 13,
      color: '#C9CFC4',
    },
    userName: {
      fontSize: 22,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      fontWeight: '700',
      color: colors.textLight,
      marginTop: 2,
    },
    profileAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.secondary,
      borderWidth: 2,
      borderColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      color: colors.textLight,
      fontSize: 18,
      fontWeight: '700',
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
      fontWeight: '700',
      color: colors.textDark,
    },
    sectionLink: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.primary,
    },

    appointmentCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    appointmentBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.badgeSuccess,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      marginBottom: 8,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.badgeSuccessText,
      letterSpacing: 0.5,
    },
    appointmentShop: {
      fontSize: 13,
      color: colors.textMuted,
      fontWeight: '600',
    },
    appointmentService: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textDark,
      marginTop: 2,
      marginBottom: 12,
    },
    appointmentMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 10,
      borderRadius: 8,
    },
    metaItem: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 11,
      color: colors.textMuted,
    },
    metaValue: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.textDark,
      marginTop: 1,
    },
    metaDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
      marginHorizontal: 12,
    },
    cardActions: {
      marginTop: 12,
      alignItems: 'flex-end',
    },
    btnSecondary: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    btnSecondaryText: {
      fontSize: 12.5,
      color: colors.textDark,
      fontWeight: '600',
    },

    heroCta: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    heroCtaPressed: {
      backgroundColor: colors.primaryDeep,
    },
    heroTitle: {
      color: colors.textLight,
      fontSize: 17,
      fontWeight: '700',
    },
    heroSub: {
      color: colors.textMuted,
      fontSize: 12.5,
      marginTop: 4,
    },
    heroArrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroArrowText: {
      color: colors.textLight,
      fontSize: 18,
      fontWeight: '700',
    },

    quickRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    quickCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    quickIcon: {
      fontSize: 22,
      marginBottom: 6,
    },
    quickTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: colors.textDark,
    },
    quickSub: {
      fontSize: 11.5,
      color: colors.textMuted,
      marginTop: 2,
    },

    horizontalList: {
      gap: 12,
      paddingBottom: 8,
      marginBottom: 16,
    },
    barberCard: {
      width: 130,
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    barberAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    barberAvatarText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textDark,
    },
    barberName: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.textDark,
      textAlign: 'center',
    },
    barberShop: {
      fontSize: 11,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 2,
    },
    ratingBadge: {
      backgroundColor: colors.goldLight,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 6,
    },
    ratingText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.gold,
    },
    barberExp: {
      fontSize: 10.5,
      color: colors.textMuted,
      marginTop: 4,
    },

    servicesGrid: {
      gap: 12,
    },
    serviceCard: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    serviceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    serviceTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textDark,
    },
    servicePrice: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.primary,
    },
    serviceDesc: {
      fontSize: 12.5,
      color: colors.textMuted,
      lineHeight: 17,
    },
    serviceFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.background,
    },
    serviceTime: {
      fontSize: 11.5,
      color: colors.textMuted,
      fontWeight: '500',
    },
    serviceBookText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
  });
}
