import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, Colors } from '../styles/colors';
import { NavigationProp, ScreenRouteProp } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { BARBERS, SERVICES, TIMES } from '../constants/catalog';
import type { AppointmentItem, AppointmentsSummary } from '../types/api';
import { ApiError } from '../services/api';
import { cancelAppointment, createAppointment, getAppointments } from '../services/appointments.api';
import { formatDate, formatPrice, formatTime, getNext7Days, nowBogotaMinutes, statusLabel } from '../utils/format';

function timeValueToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export default function AppointmentsScreen() {
  const navigation = useNavigation<NavigationProp<'Appointments'>>();
  const route = useRoute<ScreenRouteProp<'Appointments'>>();
  const styles = createStyles(COLORS);
  const { isGuest } = useAuth();

  const days = useMemo(() => getNext7Days(), []);

  const catalog = useCatalog();

  const [activeTab, setActiveTab] = useState<'booking' | 'my_appointments'>(
    route.params?.initialTab || 'booking'
  );

  useEffect(() => {
    if (route.params?.initialTab) setActiveTab(route.params.initialTab);
  }, [route.params?.initialTab]);

  const [listFilter, setListFilter] = useState<'upcoming' | 'history'>('upcoming');

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [summary, setSummary] = useState<AppointmentsSummary | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  const initialServiceId =
    SERVICES.find((s) => s.name === route.params?.selectedService)?.id ?? 's3';
  const initialBarberId =
    BARBERS.find((b) => b.name === route.params?.selectedBarber)?.id ?? 'b1';

  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [selectedBarberId, setSelectedBarberId] = useState(initialBarberId);
  const [selectedDate, setSelectedDate] = useState(days[0]?.value ?? '');
  const [selectedTime, setSelectedTime] = useState('16:30');
  const [successMessage, setSuccessMessage] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const selectedService = SERVICES.find((s) => s.id === selectedServiceId) ?? SERVICES[0];
  const selectedBarber = BARBERS.find((b) => b.id === selectedBarberId) ?? BARBERS[0];
  const selectedDay = days.find((d) => d.value === selectedDate);
  const selectedTimeSlot = TIMES.find((t) => t.value === selectedTime);

  const { todayValue, minutes: currentMinutes } = nowBogotaMinutes();
  const isToday = selectedDate === todayValue;

  const loadList = useCallback(async (filter: 'upcoming' | 'history') => {
    if (isGuest) return;
    setListLoading(true);
    setListError('');
    try {
      const res = await getAppointments({ filter });
      setAppointments(res.items);
      setSummary(res.summary);
    } catch (err) {
      if (err instanceof ApiError) {
        setListError(err.message);
      } else {
        setListError('No pudimos cargar tus citas.');
      }
    } finally {
      setListLoading(false);
    }
  }, [isGuest]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'my_appointments') void loadList(listFilter);
    }, [activeTab, listFilter, loadList]),
  );

  useEffect(() => {
    if (activeTab === 'my_appointments') void loadList(listFilter);
  }, [activeTab, listFilter, loadList]);

  const handleConfirmBooking = async () => {
    setBookingError('');
    setBookingLoading(true);
    try {
      await createAppointment({
        serviceId: selectedServiceId,
        barberId: selectedBarberId,
        date: selectedDate,
        time: selectedTime,
      });
      setSuccessMessage('¡Cita reservada correctamente!');

      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('my_appointments');
        setListFilter('upcoming');
        void loadList('upcoming');
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setBookingError(err.message);
      } else {
        setBookingError('No pudimos reservar tu cita. Intenta de nuevo.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = (id: string) => {
    Alert.alert('Cancelar cita', '¿Seguro que quieres cancelar esta cita?', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await cancelAppointment(id);
              await loadList(listFilter);
            } catch (err) {
              if (err instanceof ApiError) {
                setListError(err.message);
              } else {
                setListError('No pudimos cancelar la cita.');
              }
            }
          })();
        },
      },
    ]);
  };

  const upcomingCount = summary?.upcomingCount ?? 0;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backBtnText}>← Inicio</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Gestión de Citas</Text>
          <View style={{ width: 60 }} />
        </View>

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
              📋 Mis citas ({upcomingCount})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {isGuest ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyTitle}>Inicia sesión para reservar</Text>
            <Text style={styles.emptySub}>
              Como invitado puedes explorar, pero necesitas una cuenta para reservar y ver tus citas.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.emptyBtnText}>Iniciar sesión</Text>
            </Pressable>
          </View>
        ) : activeTab === 'booking' ? (

          <View style={styles.bookingForm}>
            <Text style={styles.formSectionTitle}>1. Selecciona tu servicio</Text>
            <View style={styles.serviceList}>
              {SERVICES.map((srv) => (
                <Pressable
                  key={srv.id}
                  style={[
                    styles.serviceOption,
                    selectedServiceId === srv.id && styles.serviceOptionSelected,
                  ]}
                  onPress={() => setSelectedServiceId(srv.id)}
                >
                  <View style={styles.radioDot}>
                    {selectedServiceId === srv.id && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.optionTitle}>{srv.name}</Text>
                    <Text style={styles.optionSub}>{srv.durationMinutes} min</Text>
                  </View>
                  <Text style={styles.optionPrice}>{formatPrice(srv.price)}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.formSectionTitle}>2. Selecciona tu barbero</Text>
            <View style={styles.barberList}>
              {BARBERS.map((b) => (
                <Pressable
                  key={b.id}
                  style={[
                    styles.barberOption,
                    selectedBarberId === b.id && styles.barberOptionSelected,
                  ]}
                  onPress={() => setSelectedBarberId(b.id)}
                >
                  <View style={styles.radioDot}>
                    {selectedBarberId === b.id && <View style={styles.radioInner} />}
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
              {days.map((d) => (
                <Pressable
                  key={d.value}
                  style={[styles.dateChip, selectedDate === d.value && styles.chipSelected]}
                  onPress={() => setSelectedDate(d.value)}
                >
                  <Text style={[styles.chipText, selectedDate === d.value && styles.chipTextSelected]}>
                    {d.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.formSectionTitle}>4. Elige el horario</Text>
            <View style={styles.timeGrid}>
              {TIMES.map((t) => {
                const past = isToday && timeValueToMinutes(t.value) <= currentMinutes;
                return (
                  <Pressable
                    key={t.value}
                    style={[
                      styles.timeChip,
                      selectedTime === t.value && styles.chipSelected,
                      past && styles.timeChipDisabled,
                    ]}
                    onPress={() => setSelectedTime(t.value)}
                    disabled={past}
                  >
                    <Text style={[styles.chipText, selectedTime === t.value && styles.chipTextSelected]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            { }
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Resumen de la reserva</Text>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Servicio:</Text>
                <Text style={styles.summaryVal}>{selectedService.name}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Barbero:</Text>
                <Text style={styles.summaryVal}>{selectedBarber.name}</Text>
              </View>
              <View style={styles.summaryLine}>
                <Text style={styles.summaryLabel}>Fecha y Hora:</Text>
                <Text style={styles.summaryVal}>{selectedDay?.label ?? selectedDate}, {selectedTimeSlot?.label ?? selectedTime}</Text>
              </View>
            </View>

              {!!successMessage && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✓ {successMessage}</Text>
                </View>
              )}

            {!!bookingError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{bookingError}</Text>
              </View>
            )}

            <Pressable
              style={[styles.confirmBtn, bookingLoading && styles.confirmBtnDisabled]}
              onPress={() => void handleConfirmBooking()}
              disabled={bookingLoading}
            >
              <Text style={styles.confirmBtnText}>{bookingLoading ? 'Reservando...' : 'Confirmar cita'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.myAppointmentsContainer}>
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

            {listLoading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Cargando tus citas...</Text>
              </View>
            ) : listError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⚠️</Text>
                <Text style={styles.emptyTitle}>No pudimos cargar tus citas</Text>
                <Text style={styles.emptySub}>{listError}</Text>
                <Pressable style={styles.emptyBtn} onPress={() => void loadList(listFilter)}>
                  <Text style={styles.emptyBtnText}>Reintentar</Text>
                </Pressable>
              </View>
            ) : appointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💈</Text>
                <Text style={styles.emptyTitle}>No tienes citas en esta sección</Text>
                <Text style={styles.emptySub}>
                  {listFilter === 'upcoming'
                    ? '¡Reserva tu turno para mantener tu estilo al día!'
                    : 'Aún no tienes historial de citas completadas.'
                }
                actionLabel={listFilter === 'upcoming' ? 'Reservar cita ahora' : undefined}
                onAction={listFilter === 'upcoming' ? () => setActiveTab('booking') : undefined}
              />
            ) : (
              <View style={styles.appointmentsList}>
                {appointments.map((apt) => {
                  const isConfirmed = apt.status === 'CONFIRMED';
                  const isCompleted = apt.status === 'COMPLETED';

                  return (
                    <View key={apt.id} style={styles.aptCard}>
                      <View style={styles.aptHeader}>
                        <View
                          style={[
                            styles.statusBadge,
                            isConfirmed && { backgroundColor: COLORS.badgeSuccess },
                            isCompleted && { backgroundColor: COLORS.goldLight },
                            apt.status === 'CANCELLED' && { backgroundColor: COLORS.badgeCancel },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              isConfirmed && { color: COLORS.badgeSuccessText },
                              isCompleted && { color: COLORS.gold },
                              apt.status === 'CANCELLED' && { color: COLORS.badgeCancelText },
                            ]}
                          >
                            {statusLabel(apt.status).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.aptPrice}>{formatPrice(apt.price)}</Text>
                      </View>

                      <Text style={styles.aptService}>{apt.serviceName}</Text>
                      <Text style={styles.aptShop}>📍 {apt.shop}</Text>

                      <View style={styles.aptDetailsRow}>
                        <View style={styles.aptDetailItem}>
                          <Text style={styles.aptDetailLabel}>Barbero</Text>
                          <Text style={styles.aptDetailValue}>{apt.barberName}</Text>
                        </View>
                        <View style={styles.aptDetailItem}>
                          <Text style={styles.aptDetailLabel}>Fecha & Hora</Text>
                          <Text style={styles.aptDetailValue}>{formatDate(apt.startAt)} - {formatTime(apt.startAt)}</Text>
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
    timeChipDisabled: {
      opacity: 0.4,
    },
    chipSelected: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    chipDisabled: {
      opacity: 0.4,
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
    errorBanner: {
      backgroundColor: colors.errorBg,
      borderWidth: 1,
      borderColor: colors.errorBorder,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      alignItems: 'center',
    },
    errorBannerText: {
      color: colors.error,
      fontSize: 13.5,
      fontWeight: '600',
      textAlign: 'center',
    },

    confirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    confirmBtnDisabled: {
      opacity: 0.6,
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
