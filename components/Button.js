import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  loading = false 
}) {
  const getButtonStyle = (pressed) => {
    const baseStyle = [styles.button];
    if (disabled) return [...baseStyle, styles.disabled];
    if (variant === 'danger') return [...baseStyle, styles.danger, pressed && styles.pressed];
    if (variant === 'secondary') return [...baseStyle, styles.secondary, pressed && styles.pressed];
    return [...baseStyle, pressed && styles.pressed];
  };

  const getTextStyle = () => {
    if (variant === 'secondary') return [styles.text, styles.textSecondary];
    return styles.text;
  };

  return (
    <Pressable
      style={({ pressed }) => getButtonStyle(pressed)}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  pressed: {
    opacity: 0.8,
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textSecondary: {
    color: COLORS.primary,
  },
});
