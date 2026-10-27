import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { ApiError, toErrorMessage } from '../services/apiClient';
import { useCatalog } from '../hooks/useCatalog';
import { useAppointments } from '../hooks/useAppointments';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { buildDays, buildSlots, firstEnabledSlotIndex } from '../utils/schedule';
import {
  formatDate,
  formatDuration,
  formatPrice,
  formatTime,
  statusLabel,
} from '../utils/format';

export default function AppointmentsScreen() {
  const navigation = useNavigation<NavigationProp<'Appointments'>>();
  const route = useRoute<ScreenRouteProp<'Appointments'>>();
  const styles = createStyles(COLORS);

  const catalog = useCatalog();

  const [activeTab, setActiveTab] = useState<'booking' | 'my_appointments'>(
    route.params?.initialTab || 'booking'
  );
  const [listFilter, setListFilter] = useState<'upcoming' | 'history'>('upcoming');

  const { appointments: upcomingAppointments, create } = useAppointments('upcoming');
  const {
    appointments: listAppointments,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
    cancel,
  } = useAppointments(listFilter);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => buildDays()[0].key);
  const [selectedSlotIso, setSelectedSlotIso] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const days = useMemo(() => buildDays(), []);
  const slots = useMemo(() => buildSlots(selectedDayKey), [selectedDayKey]);

  const selectedService = catalog.services.find((s) => s.id === selectedServiceId) ?? null;
  const selectedBarber = catalog.barbers.find((b) => b.id === selectedBarberId) ?? null;
  const selectedSlot = slots.find((s) => s.iso === selectedSlotIso) ?? null;

  const canConfirm =
    selectedServiceId !== null && selectedBarberId !== null && selectedSlotIso !== null;

  // Preselecciona servicio y barbero en cuanto el catalogo esta disponible.
  useEffect(() => {
    if (catalog.loading) {
      return;
    }

    if (selectedServiceId === null) {
      const requested = route.params?.serviceId;
      const fromRoute = requested && catalog.services.some((s) => s.id === requested);
      const next = fromRoute ? requested : catalog.services[0]?.id;
      if (next) {
        setSelectedServiceId(next);
      }
    }

    if (selectedBarberId === null) {
      const requested = route.params?.barberId;
      const fromRoute = requested && catalog.barbers.some((b) => b.id === requested);
      const next = fromRoute ? requested : catalog.barbers[0]?.id;
      if (next) {
        setSelectedBarberId(next);
      }
    }
  }, [
    catalog.loading,
    catalog.services,
    catalog.barbers,
    route.params?.serviceId,
    route.params?.barberId,
    selectedServiceId,
    selectedBarberId,
  ]);

  // Al cambiar de dia se re-selecciona la primera franja habilitada.
  useEffect(() => {
    const index = firstEnabledSlotIndex(slots);
    setSelectedSlotIso(index >= 0 ? slots[index].iso : null);
  }, [slots]);

  const handleConfirmBooking = async () => {
    if (!canConfirm || submitting || !selectedServiceId || !selectedBarberId || !selectedSlotIso) {
      return;
    }

    setSubmitting(true);
    try {
      await create({
        service_id: selectedServiceId,
        barber_id: selectedBarberId,
        scheduled_at: selectedSlotIso,
      });
      setSuccessMessage('¡Cita reservada correctamente!');

      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('my_appointments');
        if (listFilter === 'upcoming') {
          void refetchList({ silent: true });
        }
        setListFilter('upcoming');
      }, 1500);
    } catch (err) {
      const message =
        err instanceof ApiError && err.code === 'SLOT_TAKEN'
          ? 'Ese horario ya está ocupado, elige otro.'
          : toErrorMessage(err);
      Alert.alert('No se pudo reservar', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = (id: string) => {
    Alert.alert('Cancelar cita', '¿Seguro que quieres cancelar esta cita?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await cancel(id);
            } catch (err) {
              Alert.alert('No se pudo cancelar', toErrorMessage(err));
            }
          })();
        },
      },
    ]);
  };

  const confirmedCount = upcomingAppointments.length;

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
              📋 Mis citas ({confirmedCount})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {activeTab === 'booking' ? (
          catalog.loading ? (
            <LoadingState message="Cargando catalogo..." />
          ) : catalog.error ? (
            <ErrorState
              message={catalog.error}
              onRetry={() => {
                void catalog.refetch();
              }}
            />
          ) : (
            <View style={styles.bookingForm}>
              <Text style={styles.formSectionTitle}>1. Selecciona tu servicio</Text>
              <View style={styles.serviceList}>
                {catalog.services.map((srv) => (
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
                      <Text style={styles.optionSub}>{formatDuration(srv.duration_minutes)}</Text>
                    </View>
                    <Text style={styles.optionPrice}>{formatPrice(srv.price_cop)}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.formSectionTitle}>2. Selecciona tu barbero</Text>
              <View style={styles.barberList}>
                {catalog.barbers.map((b) => (
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
                      {b.shop_name ? <Text style={styles.optionSub}>{b.shop_name}</Text> : null}
                    </View>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.formSectionTitle}>3. Elige el día</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {days.map((day) => (
                  <Pressable
                    key={day.key}
                    style={[styles.dateChip, selectedDayKey === day.key && styles.chipSelected]}
                    onPress={() => setSelectedDayKey(day.key)}
                  >
                    <Text style={[styles.chipText, selectedDayKey === day.key && styles.chipTextSelected]}>
                      {day.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={styles.formSectionTitle}>4. Elige el horario</Text>
              <View style={styles.timeGrid}>
                {slots.map((slot) => {
                  const isSelected = selectedSlotIso === slot.iso;
                  return (
                    <Pressable
                      key={slot.iso}
                      disabled={slot.disabled}
                      style={[
                        styles.timeChip,
                        isSelected && styles.chipSelected,
                        slot.disabled && styles.chipDisabled,
                      ]}
                      onPress={() => {
                        if (!slot.disabled) {
                          setSelectedSlotIso(slot.iso);
                        }
                      }}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {slot.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Resumen de la reserva</Text>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Servicio:</Text>
                  <Text style={styles.summaryVal}>{selectedService?.name ?? '—'}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Barbero:</Text>
                  <Text style={styles.summaryVal}>{selectedBarber?.name ?? '—'}</Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Fecha y Hora:</Text>
                  <Text style={styles.summaryVal}>
                    {selectedSlot
                      ? `${formatDate(selectedSlot.iso)}, ${formatTime(selectedSlot.iso)}`
                      : '—'}
                  </Text>
                </View>
                <View style={styles.summaryLine}>
                  <Text style={styles.summaryLabel}>Precio:</Text>
                  <Text style={styles.summaryVal}>
                    {selectedService ? formatPrice(selectedService.price_cop) : '—'}
                  </Text>
                </View>
              </View>

              {!!successMessage && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✓ {successMessage}</Text>
                </View>
              )}

              <Pressable
                style={[styles.confirmBtn, (!canConfirm || submitting) && styles.confirmBtnDisabled]}
                disabled={!canConfirm || submitting}
                onPress={() => {
                  void handleConfirmBooking();
                }}
              >
                <Text style={styles.confirmBtnText}>
                  {submitting ? 'Reservando...' : 'Confirmar cita'}
                </Text>
              </Pressable>
            </View>
          )
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
              <LoadingState message="Cargando tus citas..." />
            ) : listError ? (
              <ErrorState
                message={listError}
                onRetry={() => {
                  void refetchList();
                }}
              />
            ) : listAppointments.length === 0 ? (
              <EmptyState
                title="No tienes citas en esta sección"
                subtitle={
                  listFilter === 'upcoming'
                    ? '¡Reserva tu turno para mantener tu estilo al día!'
                    : 'Aún no tienes historial de citas completadas.'
                }
                actionLabel={listFilter === 'upcoming' ? 'Reservar cita ahora' : undefined}
                onAction={listFilter === 'upcoming' ? () => setActiveTab('booking') : undefined}
              />
            ) : (
              <View style={styles.appointmentsList}>
                {listAppointments.map((apt) => {
                  const isConfirmed = apt.status === 'confirmed';

                  return (
                    <View key={apt.id} style={styles.aptCard}>
                      <View style={styles.aptHeader}>
                        <View
                          style={[
                            styles.statusBadge,
                            isConfirmed && { backgroundColor: COLORS.badgeSuccess },
                            apt.status === 'completed' && { backgroundColor: COLORS.goldLight },
                            apt.status === 'cancelled' && { backgroundColor: COLORS.badgeCancel },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              isConfirmed && { color: COLORS.badgeSuccessText },
                              apt.status === 'completed' && { color: COLORS.gold },
                              apt.status === 'cancelled' && { color: COLORS.badgeCancelText },
                            ]}
                          >
                            {statusLabel(apt.status).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.aptPrice}>{formatPrice(apt.price_cop)}</Text>
                      </View>

                      <Text style={styles.aptService}>{apt.service.name}</Text>
                      <Text style={styles.aptShop}>📍 {apt.shop.name}</Text>

                      <View style={styles.aptDetailsRow}>
                        <View style={styles.aptDetailItem}>
                          <Text style={styles.aptDetailLabel}>Barbero</Text>
                          <Text style={styles.aptDetailValue}>{apt.barber.name}</Text>
                        </View>
                        <View style={styles.aptDetailItem}>
                          <Text style={styles.aptDetailLabel}>Fecha & Hora</Text>
                          <Text style={styles.aptDetailValue}>
                            {formatDate(apt.scheduled_at)} - {formatTime(apt.scheduled_at)}
                          </Text>
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

    confirmBtn: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    confirmBtnDisabled: {
      opacity: 0.5,
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
