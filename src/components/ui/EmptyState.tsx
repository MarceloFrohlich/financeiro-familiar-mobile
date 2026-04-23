import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/lib/colors';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon = 'inbox', title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={48} color={colors.gray[300]} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  title: { fontSize: 16, fontWeight: '600', color: colors.txt[200], textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.txt[100], textAlign: 'center' },
});
