import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius } from '@/lib/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.gray[400]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.txt[300], marginBottom: 5 },
  input: {
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: radius.m,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.txt[400],
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.error[300] },
  error: { fontSize: 12, color: colors.error[300], marginTop: 3 },
});
