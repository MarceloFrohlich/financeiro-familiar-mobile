import { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/lib/api';
import { DashboardData } from '@/types';
import { colors, radius, shadow, spacing } from '@/lib/colors';
import { formatarMoeda, formatarData } from '@/lib/formatters';
import { EmptyState } from '@/components/ui/EmptyState';

const W = Dimensions.get('window').width;
const CHART_W = W - 48;

const chartConfig = {
  backgroundGradientFrom: colors.white,
  backgroundGradientTo: colors.white,
  color: (opacity = 1) => `rgba(66, 120, 181, ${opacity})`,
  labelColor: () => colors.txt[200],
  strokeWidth: 2,
  propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary[300] },
};

export function DashboardScreen() {
  const { user } = useAuth();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id_familia) { setLoading(false); return; }
    setLoading(true);
    try {
      const d = await fetchApi<DashboardData>(`/dashboard?ano=${ano}&mes=${mes}`);
      setData(d);
    } catch {} finally { setLoading(false); }
  }, [ano, mes, user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const mesNome = new Date(ano, mes - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  if (!user?.id_familia) {
    return <EmptyState icon="users" title="Sem família vinculada" subtitle="Acesse 'Mais → Família' para criar ou entrar em uma família." />;
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary[300]} size="large" /></View>;

  const resumo = data?.resumo_mes;
  const evolucao = data?.evolucao_mensal ?? [];

  const chartLabels = evolucao.slice(-6).map(e => {
    const [, m] = e.mes_ano.split('/');
    return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(m) - 1] ?? m;
  });
  const entradasData = evolucao.slice(-6).map(e => Number(e.entradas));
  const saidasData = evolucao.slice(-6).map(e => Number(e.saidas));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {/* Filtro mês */}
      <View style={styles.filterRow}>
        <TouchableOpacity onPress={() => { const d = new Date(ano, mes - 2); setAno(d.getFullYear()); setMes(d.getMonth() + 1); }} style={styles.filterBtn}>
          <Text style={styles.filterBtnTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.filterLabel}>{mesNome}</Text>
        <TouchableOpacity onPress={() => { const d = new Date(ano, mes); setAno(d.getFullYear()); setMes(d.getMonth() + 1); }} style={styles.filterBtn}>
          <Text style={styles.filterBtnTxt}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Cards resumo */}
      <View style={styles.cardsGrid}>
        <SummaryCard label="Entradas" value={resumo?.total_entradas ?? 0} color={colors.success[400]} />
        <SummaryCard label="Saídas" value={resumo?.total_saidas ?? 0} color={colors.error[300]} />
        <SummaryCard label="Saldo do mês" value={resumo?.saldo_mes ?? 0} color={colors.primary[300]} />
        <SummaryCard label="Saldo acumulado" value={resumo?.saldo_acumulado ?? 0} color={colors.primary[400]} />
      </View>

      {/* Gráfico evolução */}
      {evolucao.length >= 2 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Evolução mensal</Text>
          <LineChart
            data={{ labels: chartLabels, datasets: [{ data: entradasData, color: () => colors.success[400] }, { data: saidasData, color: () => colors.error[300] }] }}
            width={CHART_W} height={180} chartConfig={chartConfig}
            withDots withInnerLines={false} withOuterLines={false} bezier
            style={{ borderRadius: radius.m, marginTop: 8 }}
          />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.success[400] }]} /><Text style={styles.legendTxt}>Entradas</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.error[300] }]} /><Text style={styles.legendTxt}>Saídas</Text></View>
          </View>
        </View>
      )}

      {/* Top categorias saída */}
      {(data?.top_categorias_saida ?? []).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.chartTitle}>Top gastos por categoria</Text>
          {(data?.top_categorias_saida ?? []).slice(0, 5).map((c, i) => (
            <View key={i} style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: c.cor || colors.gray[300] }]} />
              <Text style={styles.catName} numberOfLines={1}>{c.categoria}</Text>
              <Text style={styles.catVal}>{formatarMoeda(Number(c.valor))}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Últimas movimentações */}
      {(data?.ultimas_movimentacoes ?? []).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.chartTitle}>Últimas movimentações</Text>
          {(data?.ultimas_movimentacoes ?? []).map((m, i) => (
            <View key={i} style={styles.movRow}>
              <View style={[styles.movDot, { backgroundColor: m.cor_categoria || colors.gray[300] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.movDesc} numberOfLines={1}>{m.descricao}</Text>
                <Text style={styles.movCat}>{m.categoria} · {formatarData(m.data)}</Text>
              </View>
              <Text style={[styles.movVal, { color: m.tipo === 'entrada' ? colors.success[400] : colors.error[300] }]}>
                {m.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(Number(m.valor))}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.summaryCard, shadow.s]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{formatarMoeda(Number(value))}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray[100] },
  content: { padding: spacing.l, gap: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  filterBtn: { width: 36, height: 36, backgroundColor: colors.white, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...shadow.s },
  filterBtnTxt: { fontSize: 22, color: colors.primary[400], lineHeight: 26 },
  filterLabel: { fontSize: 15, fontWeight: '700', color: colors.primary[500], minWidth: 160, textAlign: 'center' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { flex: 1, minWidth: '45%', backgroundColor: colors.white, borderRadius: radius.l, padding: 14 },
  summaryLabel: { fontSize: 12, color: colors.txt[200], marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  chartCard: { backgroundColor: colors.white, borderRadius: radius.l, padding: 16, ...shadow.s },
  card: { backgroundColor: colors.white, borderRadius: radius.l, padding: 16, ...shadow.s, gap: 10 },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.primary[500] },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendTxt: { fontSize: 12, color: colors.txt[200] },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 13, color: colors.txt[300] },
  catVal: { fontSize: 13, fontWeight: '600', color: colors.txt[400] },
  movRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  movDot: { width: 10, height: 10, borderRadius: 5 },
  movDesc: { fontSize: 14, fontWeight: '600', color: colors.txt[400] },
  movCat: { fontSize: 12, color: colors.txt[200] },
  movVal: { fontSize: 14, fontWeight: '700' },
});
