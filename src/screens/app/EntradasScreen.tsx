import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/lib/api';
import { Entrada, CategoriaEntrada, PaginatedResponse } from '@/types';
import { colors, radius, shadow, spacing } from '@/lib/colors';
import { formatarMoeda, formatarData, dataAtualInput, parsearMoeda, valorParaMascara } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { DateInput } from '@/components/ui/DateInput';
import { BottomModal } from '@/components/ui/BottomModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface Form { descricao: string; valor: string; data_entrada: string; id_categoria_entrada: string; observacao?: string }

export function EntradasScreen() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState<Entrada[]>([]);
  const [categorias, setCategorias] = useState<CategoriaEntrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Entrada | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<Form>({
    defaultValues: { descricao: '', valor: '', data_entrada: dataAtualInput(), id_categoria_entrada: '', observacao: '' },
  });

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const [res, cats] = await Promise.all([
        fetchApi<PaginatedResponse<Entrada>>(`/entradas?page=${p}&limit=20`),
        categorias.length ? Promise.resolve(categorias) : fetchApi<CategoriaEntrada[]>('/categorias/entradas'),
      ]);
      setItems(res.data);
      setTotalPages(res.totalPages);
      setPage(p);
      if (!categorias.length) setCategorias(cats as CategoriaEntrada[]);
    } catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => {
    setEditing(null);
    reset({ descricao: '', valor: '', data_entrada: dataAtualInput(), id_categoria_entrada: '', observacao: '' });
    setModalVisible(true);
  };

  const openEdit = (item: Entrada) => {
    setEditing(item);
    reset({
      descricao: item.descricao,
      valor: valorParaMascara(Number(item.valor)),
      data_entrada: item.data_entrada.slice(0, 10),
      id_categoria_entrada: String(item.id_categoria_entrada),
      observacao: item.observacao || '',
    });
    setModalVisible(true);
  };

  const onSubmit = async (data: Form) => {
    setSaving(true);
    try {
      const body = { descricao: data.descricao, valor: parsearMoeda(data.valor), data_entrada: data.data_entrada, id_categoria_entrada: parseInt(data.id_categoria_entrada), observacao: data.observacao || undefined };
      if (editing) {
        await fetchApi(`/entradas/${editing.id_entrada}`, { method: 'PATCH', body: JSON.stringify(body) });
        addToast('Entrada atualizada!', 'success');
      } else {
        await fetchApi('/entradas', { method: 'POST', body: JSON.stringify(body) });
        addToast('Entrada criada!', 'success');
      }
      setModalVisible(false);
      load();
    } catch (err: any) {
      addToast(err.message || 'Erro ao salvar', 'error');
    } finally { setSaving(false); }
  };

  const onDelete = (item: Entrada) => {
    Alert.alert('Excluir', `Excluir "${item.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try { await fetchApi(`/entradas/${item.id_entrada}`, { method: 'DELETE' }); addToast('Excluído!', 'success'); load(); }
        catch (err: any) { addToast(err.message || 'Erro ao excluir', 'error'); }
      }},
    ]);
  };

  if (!user?.id_familia) return <EmptyState icon="users" title="Sem família vinculada" subtitle="Acesse Mais → Família" />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={i => String(i.id_entrada)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(1)} />}
        contentContainerStyle={[styles.list, items.length === 0 && { flex: 1 }]}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary[300]} style={{ marginTop: 40 }} /> : <EmptyState icon="arrow-up-circle" title="Nenhuma entrada" subtitle="Toque em + para registrar" />}
        ListFooterComponent={totalPages > 1 ? (
          <View style={styles.pagination}>
            <TouchableOpacity onPress={() => load(page - 1)} disabled={page <= 1} style={[styles.pageBtn, page <= 1 && { opacity: 0.3 }]}>
              <Feather name="chevron-left" size={18} color={colors.primary[400]} />
            </TouchableOpacity>
            <Text style={styles.pageLabel}>{page} / {totalPages}</Text>
            <TouchableOpacity onPress={() => load(page + 1)} disabled={page >= totalPages} style={[styles.pageBtn, page >= totalPages && { opacity: 0.3 }]}>
              <Feather name="chevron-right" size={18} color={colors.primary[400]} />
            </TouchableOpacity>
          </View>
        ) : null}
        renderItem={({ item }) => (
          <View style={[styles.row, shadow.s]}>
            <View style={[styles.catDot, { backgroundColor: item.categoria?.cor || colors.gray[300] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.desc} numberOfLines={1}>{item.descricao}</Text>
              <Text style={styles.meta}>{item.categoria?.nome} · {formatarData(item.data_entrada)}</Text>
            </View>
            <Text style={styles.valor}>{formatarMoeda(Number(item.valor))}</Text>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}><Feather name="edit-2" size={15} color={colors.primary[300]} /></TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn}><Feather name="trash-2" size={15} color={colors.error[300]} /></TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Feather name="plus" size={26} color={colors.white} />
      </TouchableOpacity>

      <BottomModal visible={modalVisible} title={editing ? 'Editar Entrada' : 'Nova Entrada'} onClose={() => setModalVisible(false)}>
        <View style={styles.form}>
          <Controller control={control} name="descricao" rules={{ required: 'Descrição obrigatória' }}
            render={({ field: { onChange, value } }) => <Input label="Descrição" value={value} onChangeText={onChange} placeholder="Ex: Salário" error={errors.descricao?.message} />} />
          <Controller control={control} name="valor" rules={{ required: 'Valor obrigatório' }}
            render={({ field: { onChange, value } }) => <MoneyInput label="Valor" value={value} onChangeValue={onChange} error={errors.valor?.message} />} />
          <Controller control={control} name="data_entrada" rules={{ required: 'Data obrigatória' }}
            render={({ field: { onChange, value } }) => <DateInput label="Data" value={value} onChange={onChange} error={errors.data_entrada?.message} />} />
          <Controller control={control} name="id_categoria_entrada" rules={{ required: 'Categoria obrigatória' }}
            render={({ field: { onChange, value } }) => (
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.pickerBox}>
                  {categorias.map(c => (
                    <TouchableOpacity key={c.id_categoria_entrada} onPress={() => onChange(String(c.id_categoria_entrada))}
                      style={[styles.catChip, value === String(c.id_categoria_entrada) && { backgroundColor: c.cor || colors.primary[300] }]}>
                      <Text style={[styles.catChipTxt, value === String(c.id_categoria_entrada) && { color: colors.white }]} numberOfLines={1}>{c.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.id_categoria_entrada && <Text style={styles.errTxt}>{errors.id_categoria_entrada.message}</Text>}
              </View>
            )} />
          <Controller control={control} name="observacao"
            render={({ field: { onChange, value } }) => <Input label="Observação (opcional)" value={value || ''} onChangeText={onChange} placeholder="Detalhes..." multiline numberOfLines={2} />} />
          <Button onPress={handleSubmit(onSubmit)} loading={saving} style={{ marginBottom: 8 }}>
            {editing ? 'Salvar alterações' : 'Criar entrada'}
          </Button>
        </View>
      </BottomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray[100] },
  list: { padding: spacing.l, gap: 10, paddingBottom: 90 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.l, padding: 14, gap: 10 },
  catDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  desc: { fontSize: 14, fontWeight: '600', color: colors.txt[400] },
  meta: { fontSize: 12, color: colors.txt[200], marginTop: 2 },
  valor: { fontSize: 15, fontWeight: '700', color: colors.success[400] },
  iconBtn: { padding: 4 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary[400], alignItems: 'center', justifyContent: 'center', ...shadow.m },
  form: { padding: 20, gap: 0 },
  label: { fontSize: 13, fontWeight: '600', color: colors.txt[300], marginBottom: 6 },
  pickerBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  catChipTxt: { fontSize: 12, color: colors.txt[300] },
  errTxt: { fontSize: 12, color: colors.error[300], marginTop: 3 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 12 },
  pageBtn: { padding: 8 },
  pageLabel: { fontSize: 14, color: colors.txt[200] },
});
