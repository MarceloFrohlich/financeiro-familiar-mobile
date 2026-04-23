import { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { colors, radius } from '@/lib/colors';

interface DateInputProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
}

function toDate(yyyymmdd: string): Date {
  return yyyymmdd ? new Date(yyyymmdd + 'T12:00:00') : new Date();
}

function toYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DateInput({ label, value, onChange, error }: DateInputProps) {
  const [show, setShow] = useState(false);
  const date = toDate(value);

  const displayValue = value
    ? toDate(value).toLocaleDateString('pt-BR')
    : 'Selecionar data';

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(toYYYYMMDD(selected));
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.input, error ? styles.inputError : null]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, !value && styles.placeholder]}>{displayValue}</Text>
        <Feather name="calendar" size={16} color={colors.gray[400]} />
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Android: picker nativo abre como diálogo */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleChange}
          locale="pt-BR"
        />
      )}

      {/* iOS: picker dentro de um mini bottom-sheet */}
      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={styles.iosOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShow(false)} />
            <View style={styles.iosSheet}>
              <View style={styles.iosHeader}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.iosDone}>Pronto</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="inline"
                onChange={handleChange}
                locale="pt-BR"
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.txt[300], marginBottom: 5 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: radius.m,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.error[300] },
  text: { fontSize: 15, color: colors.txt[400] },
  placeholder: { color: colors.gray[400] },
  error: { fontSize: 12, color: colors.error[300], marginTop: 3 },
  iosOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  iosSheet: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  iosHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16 },
  iosDone: { fontSize: 16, fontWeight: '600', color: colors.primary[400] },
});
