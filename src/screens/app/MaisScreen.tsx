import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, shadow, spacing } from '@/lib/colors';
import { AppTabParamList, MaisStackParamList } from '@/navigation/AppNavigator';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<MaisStackParamList, 'MaisHome'>,
  BottomTabNavigationProp<AppTabParamList>
>;

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  desc: string;
  onPress: () => void;
  color?: string;
}

export function MaisScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  };

  const menus: MenuItem[] = [
    { icon: 'tag', label: 'Categorias', desc: 'Gerenciar categorias de entradas, saídas e investimentos', onPress: () => navigation.navigate('Categorias') },
    { icon: 'users', label: 'Família', desc: 'Gerenciar membros, convites e código da família', onPress: () => navigation.navigate('Familia') },
    { icon: 'activity', label: 'Saúde Financeira', desc: 'Análise IA dos seus últimos 6 meses', onPress: () => navigation.navigate('SaudeFinanceira') },
    { icon: 'file-text', label: 'Importar Nota', desc: 'Importar notas fiscais por QR Code ou texto', onPress: () => navigation.navigate('Importar') },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Perfil */}
      <View style={[styles.profileCard, shadow.s]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{user?.nome?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user?.nome}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <View style={[styles.badge, user?.perfil === 'admin' ? styles.badgeAdmin : styles.badgeMembro]}>
            <Text style={styles.badgeTxt}>{user?.perfil === 'admin' ? 'Administrador' : 'Membro'}</Text>
          </View>
        </View>
      </View>

      {/* Família info */}
      {user?.familia && (
        <View style={[styles.familyBadge]}>
          <Feather name="home" size={14} color={colors.primary[300]} />
          <Text style={styles.familyTxt}>{user.familia.nome}</Text>
        </View>
      )}

      {/* Menu items */}
      <Text style={styles.sectionTitle}>Configurações</Text>
      {menus.map((item, i) => (
        <TouchableOpacity key={i} onPress={item.onPress} style={[styles.menuRow, shadow.s]} activeOpacity={0.75}>
          <View style={[styles.menuIcon, { backgroundColor: colors.primary[100] }]}>
            <Feather name={item.icon} size={20} color={colors.primary[400]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuDesc} numberOfLines={1}>{item.desc}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.gray[400]} />
        </TouchableOpacity>
      ))}

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={[styles.logoutRow, shadow.s]} activeOpacity={0.75}>
        <View style={[styles.menuIcon, { backgroundColor: colors.error[100] }]}>
          <Feather name="log-out" size={20} color={colors.error[300]} />
        </View>
        <Text style={styles.logoutTxt}>Sair da conta</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Financeiro Familiar v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray[100] },
  content: { padding: spacing.l, gap: 12, paddingBottom: 40 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.xl, padding: 16, gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primary[300], alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 22, fontWeight: '700', color: colors.white },
  profileName: { fontSize: 16, fontWeight: '700', color: colors.primary[500] },
  profileEmail: { fontSize: 12, color: colors.txt[200], marginBottom: 6 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeAdmin: { backgroundColor: colors.primary[100] },
  badgeMembro: { backgroundColor: colors.gray[100] },
  badgeTxt: { fontSize: 11, fontWeight: '600', color: colors.txt[300] },
  familyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary[100], borderRadius: radius.m, padding: 10 },
  familyTxt: { fontSize: 13, fontWeight: '600', color: colors.primary[400] },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.txt[200], textTransform: 'uppercase', letterSpacing: 0.5 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.l, padding: 14, gap: 12 },
  menuIcon: { width: 40, height: 40, borderRadius: radius.m, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '600', color: colors.txt[400] },
  menuDesc: { fontSize: 12, color: colors.txt[200], marginTop: 1 },
  logoutRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.l, padding: 14, gap: 12 },
  logoutTxt: { fontSize: 15, fontWeight: '600', color: colors.error[300] },
  version: { fontSize: 12, color: colors.txt[100], textAlign: 'center', marginTop: 8 },
});
