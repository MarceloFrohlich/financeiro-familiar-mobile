import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, radius } from '@/lib/colors';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ children, variant = 'primary', size = 'md', loading, disabled, style, ...rest }: ButtonProps) {
  const bg = variant === 'primary' ? colors.primary[400]
    : variant === 'secondary' ? colors.white
    : variant === 'danger' ? colors.error[400]
    : 'transparent';

  const textColor = variant === 'secondary' ? colors.primary[400]
    : variant === 'ghost' ? colors.primary[300]
    : colors.white;

  const borderColor = variant === 'secondary' ? colors.primary[400] : 'transparent';

  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 15;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: bg, borderColor, paddingVertical: paddingV, opacity: disabled || loading ? 0.6 : 1 },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize }]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  text: {
    fontWeight: '600',
  },
});
