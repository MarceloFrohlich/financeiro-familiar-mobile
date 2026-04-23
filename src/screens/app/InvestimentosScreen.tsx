import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/lib/api';
import { Investimento, CategoriaInvestimento, PaginatedResponse } from '@/types';
import { colors, radius, shadow, spacing } from '@/lib/colors';
import { formatarMoeda, formatarData, dataAtualInput, parsearMoeda, valorParaMascara } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { DateInput } from '@/components/ui/DateInput';
import { BottomModal } from '@/components/ui/BottomModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface Form {
  descricao: string; valor: string; data_investimento: string; id_categoria_investimento: string;
  tipo_rendimento: string; indice_rendimento: string; taxa_percentual: string; prazo_meses: string; observacao?: string;
}

interface ProjecaoPorPrazo {
  montante_final: number;
  rendimento_total: number;
  investimentos_incluidos: number;
}

interface DadosRendimento {
  taxas: { selic: number; cdi: number; ipca12m: number; atualizadoEm: string };
  total_investido: number;
  rendimento_anual_estimado: number;
  rendimento_mensal_estimado: number;
  projecao_por_prazo?: ProjecaoPorPrazo;
  por_categoria: { nome: string; cor: string | null; valor_investido: number; referencia: string; taxa_anual: number; rendimento_mensal_estimado: number }[];
}

export function InvestimentosScreen() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Investimento[]>([]);
  const [categorias, setCategorias] = useState<CategoriaInvestimento[]>([]);
  const [rendimento, setRendimento] = useState<DadosRendimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Investimento | null>(null);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<Form>({
    defaultValues: { descricao: '', valor: '', data_investimento: dataAtualInput(), id_categoria_investimento: '', tipo_rendimento: '', indice_rendimento: '', taxa_percentual: '', prazo_meses: '', observacao: '' },
  });
  const tipoRendimento = watch('tipo_rendimento');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, cats, rend] = await Promise.all([
        fetchApi<PaginatedResponse<Investimento>>('/investimentos?limit=50'),
        categorias.length ? Promise.resolve(categorias) : fetchApi<CategoriaInvestimento[]>('/categorias/investimentos'),
        fetchApi<DadosRendimento>('/investimentos/rendimento').catch(() => null),
      ]);
      setItems(res.data);
      if (!categorias.length) setCategorias(cats as CategoriaInvestimento[]);
      if (rend) setRendimento(rend);
    } catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => {
    setEditing(null);
    reset({ descricao: '', valor: '', data_investimento: dataAtualInput(), id_categoria_investimento: '', tipo_rendimento: '', indice_rendimento: '', taxa_percentual: '', prazo_meses: '', observacao: '' });
    setModalVisible(true);
  };

  const openEdit = (item: Investimento) => {
    setEditing(item);
    reset({ descricao: item.descricao, valor: valorParaMascara(Number(item.valor)), data_investimento: item.data_investimento.slice(0, 10), id_categoria_investimento: String(item.id_categoria_investimento), tipo_rendimento: item.tipo_rendimento || '', indice_rendimento: item.indice_rendimento || '', taxa_percentual: item.taxa_percentual ? String(item.taxa_percentual) : '', prazo_meses: item.prazo_meses ? String(item.prazo_meses) : '', observacao: item.observacao || '' });
    setModalVisible(true);
  };

  const onSubmit = async (data: Form) => {
    setSaving(true);
    try {
      const body: any = { descricao: data.descricao, valor: parsearMoeda(data.valor), data_investimento: data.data_investimento, id_categoria_investimento: parseInt(data.id_categoria_investimento), observacao: data.observacao || undefined };
      if (data.tipo_rendimento) {
        body.tipo_rendimento = data.tipo_rendimento;
        if (data.indice_rendimento) body.indice_rendimento = data.indice_rendimento;
        if (data.taxa_percentual) body.taxa_percentual = parseFloat(data.taxa_percentual);
        if (data.prazo_meses) body.prazo_meses = parseInt(data.prazo_meses);
      }
      if (editing) { await fetchApi(`/investimentos/${editing.id_investimento}`, { method: 'PATCH', body: JSON.stringify(body) }); addToast('Atualizado!', 'success'); }
      else { await fetchApi('/investimentos', { method: 'POST', body: JSON.stringify(body) }); addToast('Investimento criado!', 'success'); }
      setModalVisible(false); load();
    } catch (err: any) { addToast(err.message || 'Erro ao salvar', 'error'); }
    finally { setSaving(false); }
  };

  const onDelete = (item: Investimento) => {
    Alert.alert('Excluir', `Excluir "${item.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { try { await fetchApi(`/investimentos/${item.id_investimento}`, { method: 'DELETE' }); addToast('Excluído!', 'success'); load(); } catch (err: any) { addToast(err.message || 'Erro', 'error'); } } },
    ]);
  };

  if (!user?.id_familia) return <EmptyState icon="users" title="Sem família vinculada" subtitle="Acesse Mais → Família" />;

  const ListHeader = (
    <View style={styles.headerArea}>
      <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.85}>
        <Feather name="plus" size={18} color={colors.white} />
        <Text style={styles.addBtnTxt}>Novo Investimento</Text>
      </TouchableOpacity>

      {rendimento && (
        <>
          {/* Card 1 — Resumo do portfólio */}
          <View style={[styles.resumoCard, shadow.s]}>
            <View style={styles.resumoTopo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resumoLabel}>Total investido</Text>
                <Text style={styles.resumoTotal}>{formatarMoeda(rendimento.total_investido)}</Text>
              </View>
              <View style={styles.resumoDivider} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.resumoLabel}>Rend. anual est.</Text>
                <Text style={[styles.resumoTotal, { color: colors.success[300] }]}>{formatarMoeda(rendimento.rendimento_anual_estimado)}</Text>
              </View>
            </View>
            <Text style={styles.resumoMensal}>+{formatarMoeda(rendimento.rendimento_mensal_estimado)} / mês estimado</Text>

            {/* Taxas BCB */}
            <View style={styles.taxasRow}>
              {[
                { l: 'SELIC', v: `${rendimento.taxas.selic.toFixed(2)}% a.a.` },
                { l: 'CDI', v: `${rendimento.taxas.cdi.toFixed(2)}% a.a.` },
                { l: 'IPCA 12m', v: `${rendimento.taxas.ipca12m.toFixed(2)}%` },
              ].map(t => (
                <View key={t.l} style={styles.taxaCell}>
                  <Text style={styles.taxaLabel}>{t.l}</Text>
                  <Text style={styles.taxaValue}>{t.v}</Text>
                </View>
              ))}
            </View>

            {/* Por categoria */}
            {rendimento.por_categoria.length > 0 && (
              <View style={styles.catSection}>
                <Text style={styles.catSectionTitle}>Por categoria</Text>
                {rendimento.por_categoria.map((cat, i) => (
                  <View key={i} style={[styles.catRow, i > 0 && { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                    <View style={[styles.catDot, { backgroundColor: cat.cor || 'rgba(255,255,255,0.4)' }]} />
                    <Text style={styles.catNome} numberOfLines={1}>{cat.nome}</Text>
                    <Text style={styles.catRef}>{cat.referencia} {cat.taxa_anual.toFixed(2)}%</Text>
                    <Text style={styles.catRend}>+{formatarMoeda(cat.rendimento_mensal_estimado)}/mês</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Card 2 — Projeção ao vencimento (dados do backend, idêntico ao web) */}
          {rendimento.projecao_por_prazo && (
            <View style={[styles.projecaoCard, shadow.s]}>
              <View style={styles.projecaoIconRow}>
                <View style={styles.projecaoIconBox}>
                  <Feather name="trending-up" size={20} color={colors.success[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projecaoLabel}>Projeção ao Vencimento</Text>
                  <Text style={styles.projecaoMontante}>{formatarMoeda(rendimento.projecao_por_prazo.montante_final)}</Text>
                  <Text style={styles.projecaoRendimento}>+{formatarMoeda(rendimento.projecao_por_prazo.rendimento_total)} em rendimento</Text>
                  <Text style={styles.projecaoIncluidos}>
                    {rendimento.projecao_por_prazo.investimentos_incluidos} investimento{rendimento.projecao_por_prazo.investimentos_incluidos !== 1 ? 's' : ''} com prazo
                  </Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.id_investimento)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={[styles.list, items.length === 0 && { flex: 1 }]}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={loading
          ? <ActivityIndicator color={colors.primary[300]} style={{ marginTop: 40 }} />
          : <EmptyState icon="trending-up" title="Nenhum investimento" subtitle="Toque em + para registrar" />}
        renderItem={({ item }) => (
          <View style={[styles.row, shadow.s]}>
            <View style={[styles.rowDot, { backgroundColor: item.categoria?.cor || colors.gray[300] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.desc} numberOfLines={1}>{item.descricao}</Text>
              <Text style={styles.meta}>{item.categoria?.nome} · {formatarData(item.data_investimento)}</Text>
              {item.tipo_rendimento && (
                <Text style={styles.badge}>
                  {item.tipo_rendimento === 'pre_fixado'
                    ? `Pré-fixado ${item.taxa_percentual}% a.a.`
                    : `${item.indice_rendimento} + ${item.taxa_percentual}%`}
                </Text>
              )}
            </View>
            <Text style={styles.valor}>{formatarMoeda(Number(item.valor))}</Text>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}><Feather name="edit-2" size={15} color={colors.primary[300]} /></TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn}><Feather name="trash-2" size={15} color={colors.error[300]} /></TouchableOpacity>
          </View>
        )}
      />

      <BottomModal visible={modalVisible} title={editing ? 'Editar Investimento' : 'Novo Investimento'} onClose={() => setModalVisible(false)}>
        <View style={styles.form}>
          <Controller control={control} name="descricao" rules={{ required: 'Obrigatório' }}
            render={({ field: { onChange, value } }) => <Input label="Descrição" value={value} onChangeText={onChange} placeholder="Ex: CDB Banco X" error={errors.descricao?.message} />} />
          <Controller control={control} name="valor" rules={{ required: 'Obrigatório' }}
            render={({ field: { onChange, value } }) => <MoneyInput label="Valor" value={value} onChangeValue={onChange} error={errors.valor?.message} />} />
          <Controller control={control} name="data_investimento" rules={{ required: 'Obrigatório' }}
            render={({ field: { onChange, value } }) => <DateInput label="Data do investimento" value={value} onChange={onChange} error={errors.data_investimento?.message} />} />
          <Controller control={control} name="id_categoria_investimento" rules={{ required: 'Obrigatório' }}
            render={({ field: { onChange, value } }) => (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.pickerBox}>
                  {categorias.map(c => (
                    <TouchableOpacity key={c.id_categoria_investimento} onPress={() => onChange(String(c.id_categoria_investimento))}
                      style={[styles.catChip, value === String(c.id_categoria_investimento) && { backgroundColor: c.cor || colors.primary[300] }]}>
                      <Text style={[styles.catChipTxt, value === String(c.id_categoria_investimento) && { color: colors.white }]} numberOfLines={1}>{c.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.id_categoria_investimento && <Text style={styles.errTxt}>{errors.id_categoria_investimento.message}</Text>}
              </View>
            )} />

          <Controller control={control} name="tipo_rendimento"
            render={({ field: { onChange, value } }) => (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>Rendimento (opcional)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {[['', 'Não informado'], ['pre_fixado', 'Pré-fixado'], ['pos_fixado', 'Pós-fixado']].map(([k, l]) => (
                    <TouchableOpacity key={k} onPress={() => onChange(k)} style={[styles.catChip, value === k && { backgroundColor: colors.primary[300] }]}>
                      <Text style={[styles.catChipTxt, value === k && { color: colors.white }]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )} />

          {tipoRendimento === 'pre_fixado' && (
            <Controller control={control} name="taxa_percentual"
              render={({ field: { onChange, value } }) => <Input label="Taxa % ao ano" value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="Ex: 12.5" />} />
          )}
          {tipoRendimento === 'pos_fixado' && <>
            <Controller control={control} name="indice_rendimento"
              render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>Índice</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {['CDI', 'SELIC', 'IPCA'].map(idx => (
                      <TouchableOpacity key={idx} onPress={() => onChange(idx)} style={[styles.catChip, value === idx && { backgroundColor: colors.primary[300] }]}>
                        <Text style={[styles.catChipTxt, value === idx && { color: colors.white }]}>{idx}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )} />
            <Controller control={control} name="taxa_percentual"
              render={({ field: { onChange, value } }) => <Input label="% sobre índice" value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="Ex: 110 (para 110% CDI)" />} />
          </>}

          {tipoRendimento && (
            <Controller control={control} name="prazo_meses"
              render={({ field: { onChange, value } }) => <Input label="Prazo (meses, opcional)" value={value} onChangeText={onChange} keyboardType="numeric" placeholder="Ex: 24" />} />
          )}

          <Controller control={control} name="observacao"
            render={({ field: { onChange, value } }) => <Input label="Observação" value={value || ''} onChangeText={onChange} placeholder="Detalhes..." multiline numberOfLines={2} />} />

          <Button onPress={handleSubmit(onSubmit)} loading={saving} style={{ marginBottom: 8 }}>
            {editing ? 'Salvar' : 'Criar investimento'}
          </Button>
        </View>
      </BottomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray[100] },
  list: { padding: spacing.l, gap: 10, paddingBottom: 24 },
  headerArea: { gap: 12, marginBottom: 4 },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary[400], borderRadius: radius.l, paddingVertical: 13 },
  addBtnTxt: { fontSize: 15, fontWeight: '700', color: colors.white },

  // Card resumo (fundo escuro)
  resumoCard: { backgroundColor: colors.primary[500], borderRadius: radius.l, padding: 16, gap: 10 },
  resumoTopo: { flexDirection: 'row', alignItems: 'center' },
  resumoDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 12 },
  resumoLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 3 },
  resumoTotal: { fontSize: 18, fontWeight: '800', color: colors.white },
  resumoMensal: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

  taxasRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  taxaCell: { alignItems: 'center' },
  taxaLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  taxaValue: { fontSize: 12, fontWeight: '700', color: colors.white },

  catSection: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 10 },
  catSectionTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  catDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  catNome: { flex: 1, fontSize: 12, color: colors.white, fontWeight: '600' },
  catRef: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  catRend: { fontSize: 11, color: colors.success[300], fontWeight: '600' },

  // Card projeção ao vencimento (fundo branco, igual ao web)
  projecaoCard: { backgroundColor: colors.white, borderRadius: radius.l, padding: 16 },
  projecaoIconRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  projecaoIconBox: { width: 44, height: 44, borderRadius: radius.m, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  projecaoLabel: { fontSize: 11, fontWeight: '700', color: colors.txt[200], textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 },
  projecaoMontante: { fontSize: 20, fontWeight: '800', color: colors.success[400] },
  projecaoRendimento: { fontSize: 12, color: colors.success[400], marginTop: 2 },
  projecaoIncluidos: { fontSize: 11, color: colors.txt[200], marginTop: 2 },

  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.l, padding: 14, gap: 10 },
  rowDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  desc: { fontSize: 14, fontWeight: '600', color: colors.txt[400] },
  meta: { fontSize: 12, color: colors.txt[200], marginTop: 2 },
  badge: { fontSize: 11, color: colors.primary[300], marginTop: 2, fontWeight: '600' },
  valor: { fontSize: 15, fontWeight: '700', color: colors.primary[300] },
  iconBtn: { padding: 4 },
  form: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.txt[300], marginBottom: 6 },
  pickerBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  catChipTxt: { fontSize: 12, color: colors.txt[300] },
  errTxt: { fontSize: 12, color: colors.error[300], marginTop: 3 },
});
