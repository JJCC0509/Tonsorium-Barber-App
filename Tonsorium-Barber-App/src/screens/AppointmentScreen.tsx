import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
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

interface AppointmentItem {
  id: string;
  shop: string;
  barber: string;
  service: string;
  price: string;
  date: string;
  time: string;
  status: 'Confirmada' | 'Completada' | 'Cancelada';
}

const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'apt-1',
    shop: 'Barber Chamos',
    barber: 'El Chamo',
    service: 'Combo (Corte + Barba)',
    price: '$20000',
    date: '18 Oct 2026',
    time: '4:30 PM',
    status: 'Confirmada',
  },
  {
    id: 'apt-2',
    shop: 'Barberia Prado Centro',
    barber: 'Javier Silva',
    service: 'Corte Clásico',
    price: '$22000',
    date: '10 Oct 2026',
    time: '11:00 AM',
    status: 'Completada',
  },
  {
    id: 'apt-3',
    shop: 'SurBarber',
    barber: 'Diego Torres',
    service: 'Barba Tradicional',
    price: '$18000',
    date: '02 Oct 2026',
    time: '5:00 PM',
    status: 'Completada',
  },
];

const SERVICES_LIST = [
  { title: 'Corte Clásico', price: '$25000', duration: '30 min' },
  { title: 'Barba Tradicional', price: '$18000', duration: '25 min' },
  { title: 'Combo (Corte + Barba)', price: '$38000', duration: '50 min' },
  { title: 'Cejas', price: '$7000', duration: '5 min' },
];

const BARBERS_LIST = [
  { name: 'El Chamo', shop: 'Barber Chamos' },
  { name: 'Javier Silva', shop: 'Barberia Prado Centro' },
  { name: 'Diego Torres', shop: 'SurBarber' },
];

const DATES_LIST = ['Hoy', 'Mañana', 'Sábado 26', 'Domingo 27'];
const TIMES_LIST = ['10:00 AM', '11:30 AM', '2:00 PM', '4:30 PM', '6:00 PM', '7:15 PM'];

export default function AppointmentsScreen() {
  const navigation = useNavigation<NavigationProp<'Appointments'>>();
  const route = useRoute<ScreenRouteProp<'Appointments'>>();
  const styles = createStyles(COLORS);

  const [activeTab, setActiveTab] = useState<'booking' | 'my_appointments'>(
    route.params?.initialTab || 'booking'
  );

  const [listFilter, setListFilter] = useState<'upcoming' | 'history'>('upcoming');

  const [appointments, setAppointments] = useState<AppointmentItem[]>(INITIAL_APPOINTMENTS);

  const [selectedService, setSelectedService] = useState(
    route.params?.selectedService || SERVICES_LIST[2].title
  );
  const [selectedBarber, setSelectedBarber] = useState(
    route.params?.selectedBarber || BARBERS_LIST[0].name
  );
  const [selectedDate, setSelectedDate] = useState(DATES_LIST[0]);
  const [selectedTime, setSelectedTime] = useState('4:30 PM');
  const [successMessage, setSuccessMessage] = useState('');

  const handleConfirmBooking = () => {
    const matchedService = SERVICES_LIST.find((s) => s.title === selectedService) || SERVICES_LIST[0];
    const matchedBarber = BARBERS_LIST.find((b) => b.name === selectedBarber) || BARBERS_LIST[0];

    const newAppointment: AppointmentItem = {
      id: `apt-${Date.now()}`,
      shop: matchedBarber.shop,
      barber: matchedBarber.name,
      service: matchedService.title,
      price: matchedService.price,
      date: selectedDate,
      time: selectedTime,
      status: 'Confirmada',
    };

    setAppointments([newAppointment, ...appointments]);
    setSuccessMessage('¡Cita reservada correctamente!');

    setTimeout(() => {
      setSuccessMessage('');
      setActiveTab('my_appointments');
      setListFilter('upcoming');
    }, 1500);
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: 'Cancelada' } : apt))
    );
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (listFilter === 'upcoming') {
      return apt.status === 'Confirmada';
    }
    return apt.status === 'Completada' || apt.status === 'Cancelada';
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      { }
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backBtnText}>← Inicio</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Gestión de Citas</Text>
          <View style={{ width: 60 }} />
        </View>

        { }
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'booking' && styles.tabBtnActive]}
            onPress={() => setActiveTab('booking')}
          >
            <Text style={[styles.tabText, activeTab === 'booking' && styles.tabTextActive]}>
              📅 Reservar cita
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'my_appointments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('my_appointments')}
          >
            <Text style={[styles.tabText, activeTab === 'my_appointments' && styles.tabTextActive]}>
              📋 Mis citas ({appointments.filter(a => a.status === 'Confirmada').length})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {activeTab === 'booking' ? (

          <View style={styles.bookingForm}>
            <Text style={styles.formSectionTitle}>1. Selecciona tu servicio</Text>
            <View style={styles.serviceList}>
              {SERVICES_LIST.map((srv) => (
                <Pressable
                  key={srv.title}
                  style={[
                    styles.serviceOption,
                    selectedService === srv.title && styles.serviceOptionSelected,
                  ]}
                  onPress={() => setSelectedService(srv.title)}
                >
                  <View style={styles.radioDot}>
                    {selectedService === srv.title && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.optionTitle}>{srv.title}</Text>
                    <Text style={styles.optionSub}>{srv.duration}</Text>
                  </View>
                  <Text style={styles.optionPrice}>{srv.price}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.formSectionTitle}>2. Selecciona tu barbero</Text>
            <View style={styles.barberList}>
              {BARBERS_LIST.map((b) => (
                <Pressable
                  key={b.name}
                  style={[
                    styles.barberOption,
                    selectedBarber === b.name && styles.barberOptionSelected,
                  ]}
                  onPress={() => setSelectedBarber(b.name)}
                >
                  <View style={styles.radioDot}>
                    {selectedBarber === b.name && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.optionTitle}>{b.name}</Text>
                    <Text style={styles.optionSub}>{b.shop}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text style={styles.formSectionTitle}>3. Elige el día</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {DATES_LIST.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.dateChip, selectedDate === d && styles.chipSelected]}
                  onPress={() => setSelectedDate(d)}
                >
                  <Text style={[styles.chipText, selectedDate === d && styles.chipTextSelected]}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.formSectionTitle}>4. Elige el horario</Text>
            <View style={styles.timeGrid}>
              {TIMES_LIST.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.timeChip, selectedTime === t && styles.chipSelected]}
                  onPress={() => setSelectedTime(t)}
                >
                  <Text style={[styles.chipText, selectedTime === t && styles.chipTextSelected]}>
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            { }
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Resumen de la reserva</Text>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Servicio:</Text>
                <Text style={styles.summaryVal}>{selectedService}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Barbero:</Text>
                <Text style={styles.summaryVal}>{selectedBarber}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Fecha y Hora:</Text>
                <Text style={styles.summaryVal}>{selectedDate}, {selectedTime}</Text>
              </View>
            </View>

            {!!successMessage && (
              <View style={styles.successBanner}>
                <Text style={styles.successText}>✓ {successMessage}</Text>
              </View>
            )}

            <Pressable style={styles.confirmBtn} onPress={handleConfirmBooking}>
              <Text style={styles.confirmBtnText}>Confirmar cita</Text>
            </Pressable>
          </View>
        ) : (

          <View style={styles.myAppointmentsContainer}>
            { }
            <View style={styles.filterRow}>
              <Pressable
                style={[styles.filterChip, listFilter === 'upcoming' && styles.filterChipActive]}
                onPress={() => setListFilter('upcoming')}
              >
                <Text style={[styles.filterText, listFilter === 'upcoming' && styles.filterTextActive]}>
                  Próximas citas
                </Text>
              </Pressable>

              <Pressable
                style={[styles.filterChip, listFilter === 'history' && styles.filterChipActive]}
                onPress={() => setListFilter('history')}
              >
                <Text style={[styles.filterText, listFilter === 'history' && styles.filterTextActive]}>
                  Historial de citas
                </Text>
              </Pressable>
            </View>

            {filteredAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💈</Text>
                <Text style={styles.emptyTitle}>No tienes citas en esta sección</Text>
                <Text style={styles.emptySub}>
                  {listFilter === 'upcoming'
                    ? '¡Reserva tu turno para mantener tu estilo al día!'
                    : 'Aún no tienes historial de citas completadas.'}
                </Text>
                {listFilter === 'upcoming' && (
                  <Pressable style={styles.emptyBtn} onPress={() => setActiveTab('booking')}>
                    <Text style={styles.emptyBtnText}>Reservar cita ahora</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.appointmentsList}>
                {filteredAppointments.map((apt) => {
                  const isConfirmed = apt.status === 'Confirmada';
                  const isCompleted = apt.status === 'Completada';

                  return (
                    <View key={apt.id} style={styles.aptCard}>
                      <View style={styles.aptHeader}>
                        <View
                          style={[
                            styles.statusBadge,
                            isConfirmed && { backgroundColor: COLORS.badgeSuccess },
                            isCompleted && { backgroundColor: COLORS.goldLight },
                            apt.status === 'Cancelada' && { backgroundColor: COLORS.badgeCancel },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              isConfirmed && { color: COLORS.badgeSuccessText },
                              isCompleted && { color: COLORS.gold },
                              apt.status === 'Cancelada' && { color: COLORS.badgeCancelText },
                            ]}
                          >
                            {apt.status.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.aptPrice}>{apt.price}</Text>
                      </View>

                      <Text style={styles.aptService}>{apt.service}</Text>
                      <Text style={styles.aptShop}>📍 {apt.shop}</Text>

                      <View style={styles.aptDetailsRow}>
                        <View style={styles.aptDetailItem}>
                          <Text style={styles.aptDetailLabel}>Barbero</Text>
                          <Text style={styles.aptDetailValue}>{apt.barber}</Text>
                        </View>
                        <View style={styles.aptDetailItem}>
                          <Text style={styles.aptDetailLabel}>Fecha & Hora</Text>
                          <Text style={styles.aptDetailValue}>{apt.date} - {apt.time}</Text>
                        </View>
                      </View>

                      {isConfirmed && (
                        <View style={styles.aptActions}>
                          <Pressable
                            style={styles.cancelBtn}
                            onPress={() => handleCancelAppointment(apt.id)}
                          >
                            <Text style={styles.cancelBtnText}>Cancelar cita</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
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
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
    },
    headerTop: {
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: 8,
      padding: 3,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 9,
      alignItems: 'center',
      borderRadius: 6,
    },
    tabBtnActive: {
      backgroundColor: colors.background,
    },
    tabText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: colors.accentLight,
    },
    tabTextActive: {
      color: colors.textDark,
      fontWeight: '700',
    },

    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      paddingBottom: 40,
    },


    bookingForm: {
      gap: 16,
    },
    formSectionTitle: {
      fontSize: 15.5,
      fontWeight: '700',
      color: colors.textDark,
      marginTop: 4,
    },
    serviceList: {
      gap: 10,
    },
    serviceOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1.5,
      borderColor: colors.borderMuted,
    },
    serviceOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    barberList: {
      gap: 10,
    },
    barberOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1.5,
      borderColor: colors.borderMuted,
    },
    barberOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    radioDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    serviceInfo: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: colors.textDark,
    },
    optionSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    optionPrice: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.primary,
    },

    chipRow: {
      gap: 10,
    },
    dateChip: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    timeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    timeChip: {
      width: '30%',
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    chipSelected: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    chipText: {
      fontSize: 13,
      color: colors.textDark,
      fontWeight: '600',
    },
    chipTextSelected: {
      color: colors.textLight,
      fontWeight: '700',
    },

    summaryBox: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      marginTop: 8,
    },
    summaryTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textDark,
      marginBottom: 8,
    },
    summaryLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    summaryLabel: {
      fontSize: 12.5,
      color: colors.textMuted,
    },
    summaryVal: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textDark,
    },

    successBanner: {
      backgroundColor: colors.badgeSuccess,
      borderWidth: 1,
      borderColor: colors.badgeSuccessText,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    successText: {
      color: colors.badgeSuccessText,
      fontSize: 14,
      fontWeight: '700',
    },

    confirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    confirmBtnText: {
      color: colors.textLight,
      fontSize: 16,
      fontWeight: '700',
    },


    myAppointmentsContainer: {
      gap: 16,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },
    filterChip: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    filterChipActive: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textDark,
    },
    filterTextActive: {
      color: colors.textLight,
      fontWeight: '700',
    },

    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    emptyIcon: {
      fontSize: 40,
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textDark,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      maxWidth: 260,
    },
    emptyBtn: {
      marginTop: 18,
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 6,
    },
    emptyBtnText: {
      color: colors.textLight,
      fontSize: 13.5,
      fontWeight: '700',
    },

    appointmentsList: {
      gap: 14,
    },
    aptCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderMuted,
    },
    aptHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 10.5,
      fontWeight: '800',
    },
    aptPrice: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },
    aptService: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textDark,
      marginBottom: 4,
    },
    aptShop: {
      fontSize: 12.5,
      color: colors.textMuted,
      marginBottom: 12,
    },
    aptDetailsRow: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      padding: 10,
      borderRadius: 8,
    },
    aptDetailItem: {
      flex: 1,
    },
    aptDetailLabel: {
      fontSize: 11,
      color: colors.textMuted,
    },
    aptDetailValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textDark,
      marginTop: 1,
    },
    aptActions: {
      marginTop: 14,
      alignItems: 'flex-end',
    },
    cancelBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      backgroundColor: colors.errorBg,
    },
    cancelBtnText: {
      fontSize: 12.5,
      color: colors.error,
      fontWeight: '700',
    },
  });
}
