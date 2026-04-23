import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius } from '@/lib/colors';
import { aplicarMascaraMoeda } from '@/lib/formatters';

interface MoneyInputProps {
  label?: string;
  value: string;
  onChangeValue: (masked: string) => void;
  error?: string;
}

export function MoneyInput({ label, value, onChangeValue, error }: MoneyInputProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, error ? styles.rowError : null]}>
        <Text style={styles.prefix}>R$</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(v) => onChangeValue(aplicarMascaraMoeda(v))}
          keyboardType="numeric"
          placeholder="0,00"
          placeholderTextColor={colors.gray[400]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.txt[300], marginBottom: 5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: radius.m,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  rowError: { borderColor: colors.error[300] },
  prefix: { fontSize: 14, fontWeight: '600', color: colors.txt[200], marginRight: 6 },
  input: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.txt[400] },
  error: { fontSize: 12, color: colors.error[300], marginTop: 3 },
});
