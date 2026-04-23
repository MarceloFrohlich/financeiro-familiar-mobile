import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fetchApi } from '@/lib/api';
import { SaudeFinanceiraData, StatusSaudeFinanceira } from '@/types';
import { colors, radius, shadow, spacing } from '@/lib/colors';
import { formatarMoeda } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';

const STATUS_CONFIG: Record<StatusSaudeFinanceira, { cor: string; emoji: string; label: string }> = {
  ruim: { cor: colors.error[300], emoji: '😟', label: 'Ruim' },
  médio: { cor: colors.alert[400], emoji: '😐', label: 'Médio' },
  bom: { cor: colors.secondary[400], emoji: '😊', label: 'Bom' },
  excelente: { cor: colors.success[400], emoji: '🌟', label: 'Excelente' },
};

export function SaudeFinanceiraScreen() {
  const [data, setData] = useState<SaudeFinanceiraData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analisar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchApi<SaudeFinanceiraData>('/saude-financeira');
      setData(res);
    } catch (err: any) {
      if (err.status === 429) setError('Limite de análises atingido. Tente em alguns minutos.');
      else if (err.status === 503) setError('Serviço de IA temporariamente indisponível.');
      else setError(err.message || 'Erro ao gerar análise.');
    } finally { setLoading(false); }
  };

  const statusCfg = data ? STATUS_CONFIG[data.diagnostico.status] ?? STATUS_CONFIG['médio'] : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {!data && !loading && (
        <View style={styles.cta}>
          <Text style={styles.ctaEmoji}>🏥</Text>
          <Text style={styles.ctaTitle}>Análise de Saúde Financeira</Text>
          <Text style={styles.ctaDesc}>Nossa IA analisa seus últimos 6 meses e gera um diagnóstico completo com ações prioritárias.</Text>
          {error ? <View style={styles.errorBox}><Text style={styles.errorTxt}>{error}</Text></View> : null}
          <Button onPress={analisar} loading={loading} size="lg" style={{ marginTop: 8 }}>Analisar agora</Button>
        </View>
      )}

      {loading && <View style={styles.loadingBox}><ActivityIndicator color={colors.primary[300]} size="large" /><Text style={styles.loadingTxt}>Analisando seus dados...</Text></View>}

      {data && statusCfg && (
        <>
          {/* Score */}
          <View style={[styles.scoreCard, { borderColor: statusCfg.cor }]}>
            <Text style={styles.scoreEmoji}>{statusCfg.emoji}</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${data.diagnostico.score}%`, backgroundColor: statusCfg.cor }]} />
            </View>
            <Text style={[styles.scoreLabel, { color: statusCfg.cor }]}>{statusCfg.label} — {data.diagnostico.score}/100</Text>
            <Text style={styles.scoreResumo}>{data.diagnostico.resumo}</Text>
          </View>

          {/* Métricas */}
          <Text style={styles.sectionTitle}>Métricas</Text>
          <View style={styles.metricsGrid}>
            <MetricaCard label="Renda média/mês" value={formatarMoeda(data.metricas.renda_media_mensal)} />
            <MetricaCard label="Gastos média/mês" value={formatarMoeda(data.metricas.gastos_media_mensal)} />
            <MetricaCard label="Taxa de poupança" value={`${data.metricas.taxa_poupanca.toFixed(1)}%`} />
            <MetricaCard label="Comprometimento" value={`${data.metricas.comprometimento_renda.toFixed(1)}%`} />
            <MetricaCard label="Reserva emergência" value={`${data.metricas.reserva_emergencia_meses.toFixed(1)} meses`} />
            <MetricaCard label="Total investido" value={formatarMoeda(data.metricas.total_investido)} />
          </View>

          {/* Pontos positivos */}
          {data.diagnostico.pontos_positivos.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>✅ Pontos positivos</Text>
              <View style={[styles.card, { borderLeftColor: colors.success[400] }]}>
                {data.diagnostico.pontos_positivos.map((p, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: colors.success[400] }]} />
                    <Text style={styles.bulletTxt}>{p}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Atenção */}
          {data.diagnostico.pontos_de_atencao.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>⚠️ Pontos de atenção</Text>
              <View style={[styles.card, { borderLeftColor: colors.alert[400] }]}>
                {data.diagnostico.pontos_de_atencao.map((p, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: colors.alert[400] }]} />
                    <Text style={styles.bulletTxt}>{p}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Ações prioritárias */}
          {data.diagnostico.acoes_prioritarias.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🎯 Ações prioritárias</Text>
              {data.diagnostico.acoes_prioritarias.map((a, i) => (
                <View key={i} style={[styles.acaoCard, shadow.s]}>
                  <View style={styles.acaoHeader}>
                    <Text style={styles.acaoTitulo}>{a.titulo}</Text>
                    <View style={[styles.impactoBadge, { backgroundColor: a.impacto === 'alto' ? colors.error[100] : a.impacto === 'médio' ? colors.alert[100] : colors.success[100] }]}>
                      <Text style={[styles.impactoTxt, { color: a.impacto === 'alto' ? colors.error[300] : a.impacto === 'médio' ? colors.alert[400] : colors.success[400] }]}>{a.impacto}</Text>
                    </View>
                  </View>
                  <Text style={styles.acaoDesc}>{a.descricao}</Text>
                  <Text style={styles.acaoPrazo}>⏱ {a.prazo}</Text>
                </View>
              ))}
            </>
          )}

          <Button onPress={analisar} loading={loading} variant="secondary" style={{ marginTop: 8 }}>Reanalisar</Button>
        </>
      )}
    </ScrollView>
  );
}

function MetricaCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricaCard}>
      <Text style={styles.metricaLabel}>{label}</Text>
      <Text style={styles.metricaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray[100] },
  content: { padding: spacing.l, gap: 14, paddingBottom: 40 },
  cta: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  ctaEmoji: { fontSize: 56 },
  ctaTitle: { fontSize: 20, fontWeight: '700', color: colors.primary[500], textAlign: 'center' },
  ctaDesc: { fontSize: 14, color: colors.txt[200], textAlign: 'center', lineHeight: 20 },
  errorBox: { backgroundColor: colors.error[100], borderRadius: radius.m, padding: 12, width: '100%' },
  errorTxt: { fontSize: 13, color: colors.error[300], textAlign: 'center' },
  loadingBox: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  loadingTxt: { fontSize: 14, color: colors.txt[200] },
  scoreCard: { backgroundColor: colors.white, borderRadius: radius.l, padding: 20, alignItems: 'center', borderLeftWidth: 4, ...shadow.s, gap: 8 },
  scoreEmoji: { fontSize: 40 },
  scoreBar: { width: '100%', height: 10, backgroundColor: colors.gray[200], borderRadius: 5, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 5 },
  scoreLabel: { fontSize: 16, fontWeight: '700' },
  scoreResumo: { fontSize: 13, color: colors.txt[200], textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primary[500] },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricaCard: { flex: 1, minWidth: '45%', backgroundColor: colors.white, borderRadius: radius.l, padding: 14, ...shadow.s },
  metricaLabel: { fontSize: 11, color: colors.txt[200], marginBottom: 4 },
  metricaValue: { fontSize: 15, fontWeight: '700', color: colors.primary[400] },
  card: { backgroundColor: colors.white, borderRadius: radius.l, padding: 16, borderLeftWidth: 4, ...shadow.s, gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  bulletTxt: { flex: 1, fontSize: 13, color: colors.txt[300], lineHeight: 18 },
  acaoCard: { backgroundColor: colors.white, borderRadius: radius.l, padding: 16, gap: 6 },
  acaoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  acaoTitulo: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.primary[500] },
  impactoBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  impactoTxt: { fontSize: 11, fontWeight: '600' },
  acaoDesc: { fontSize: 13, color: colors.txt[300], lineHeight: 18 },
  acaoPrazo: { fontSize: 12, color: colors.txt[200] },
});
