import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, Colors } from '../styles/colors';

const styles = createStyles(COLORS);

/** Pantalla completa mientras se carga una consulta inicial. */
export function LoadingState({ message = 'Cargando...' }: { message?: string }) {
  return (
    <View style={styles.centerBox}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

/** Pantalla completa o bloque con el error que devolvio la API. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.centerBox}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>No pudimos cargar la informacion</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Bloque vacio con accion opcional. */
export function EmptyState({
  icon = '💈',
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.message}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.retryBtn} onPress={onAction}>
          <Text style={styles.retryText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
      paddingVertical: 48,
      gap: 10,
    },
    message: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
    },
    errorIcon: {
      fontSize: 30,
    },
    errorTitle: {
      fontSize: 15.5,
      fontWeight: '700',
      color: colors.textDark,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: 10,
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 22,
      borderRadius: 6,
    },
    retryText: {
      color: colors.textLight,
      fontSize: 13.5,
      fontWeight: '700',
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: 34,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderMuted,
      gap: 6,
    },
    emptyIcon: {
      fontSize: 38,
    },
    emptyTitle: {
      fontSize: 15.5,
      fontWeight: '700',
      color: colors.textDark,
      textAlign: 'center',
    },
  });
}
