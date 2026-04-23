import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { fetchApi } from '@/lib/api';
import { CategoriaEntrada, CategoriaSaida, CategoriaInvestimento } from '@/types';
import { colors, radius, shadow, spacing } from '@/lib/colors';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomModal } from '@/components/ui/BottomModal';
import { useToast } from '@/components/ui/Toast';

type Tab = 'entradas' | 'saidas' | 'investimentos';
type Categoria = CategoriaEntrada | CategoriaSaida | CategoriaInvestimento;

const PRESET_COLORS = ['#31C6A1', '#4278B5', '#284C7C', '#D7BB37', '#D95454', '#979797', '#5B67CA', '#E67E22', '#8E44AD', '#27AE60'];

interface Form { nome: string; cor: string }

function getId(tab: Tab, cat: Categoria): number {
  if (tab === 'entradas') return (cat as CategoriaEntrada).id_categoria_entrada;
  if (tab === 'saidas') return (cat as CategoriaSaida).id_categoria_saida;
  return (cat as CategoriaInvestimento).id_categoria_investimento;
}

export function CategoriasScreen() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<Tab>('entradas');
  const [data, setData] = useState<Record<Tab, Categoria[]>>({ entradas: [], saidas: [], investimentos: [] });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<Form>({ defaultValues: { nome: '', cor: PRESET_COLORS[0] } });
  const corAtual = watch('cor');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s, i] = await Promise.all([
        fetchApi<CategoriaEntrada[]>('/categorias/entradas'),
        fetchApi<CategoriaSaida[]>('/categorias/saidas'),
        fetchApi<CategoriaInvestimento[]>('/categorias/investimentos'),
      ]);
      setData({ entradas: e, saidas: s, investimentos: i });
    } catch {} finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const endpoint = tab === 'entradas' ? 'entradas' : tab === 'saidas' ? 'saidas' : 'investimentos';

  const openCreate = () => {
    setEditing(null);
    reset({ nome: '', cor: PRESET_COLORS[0] });
    setModalVisible(true);
  };

  const openEdit = (cat: Categoria) => {
    setEditing(cat);
    reset({ nome: cat.nome, cor: cat.cor || PRESET_COLORS[0] });
    setModalVisible(true);
  };

  const onSubmit = async (d: Form) => {
    setSaving(true);
    try {
      if (editing) {
        await fetchApi(`/categorias/${endpoint}/${getId(tab, editing)}`, { method: 'PATCH', body: JSON.stringify({ nome: d.nome, cor: d.cor }) });
        addToast('Categoria atualizada!', 'success');
      } else {
        await fetchApi(`/categorias/${endpoint}`, { method: 'POST', body: JSON.stringify({ nome: d.nome, cor: d.cor, icone: 'tag' }) });
        addToast('Categoria criada!', 'success');
      }
      setModalVisible(false); load();
    } catch (err: any) { addToast(err.message || 'Erro', 'error'); }
    finally { setSaving(false); }
  };

  const onDelete = (cat: Categoria) => {
    Alert.alert('Excluir', `Excluir "${cat.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try { await fetchApi(`/categorias/${endpoint}/${getId(tab, cat)}`, { method: 'DELETE' }); addToast('Excluída!', 'success'); load(); }
        catch (err: any) { addToast(err.message || 'Erro', 'error'); }
      }},
    ]);
  };

  const items = data[tab];

  return (
    <View style={styles.screen}>
      {/* Tabs */}
      <View style={styles.tabs}>
        {(['entradas', 'saidas', 'investimentos'] as Tab[]).map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && styles.tabBtnActive]}>
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>{t === 'entradas' ? 'Entradas' : t === 'saidas' ? 'Saídas' : 'Investimentos'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={[styles.list, items.length === 0 && { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma categoria</Text>}
        renderItem={({ item }) => (
          <View style={[styles.row, shadow.s]}>
            <View style={[styles.colorDot, { backgroundColor: item.cor || colors.gray[300] }]} />
            <Text style={styles.nome} numberOfLines={1}>{item.nome}</Text>
            {item.id_familia !== null && <>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}><Feather name="edit-2" size={15} color={colors.primary[300]} /></TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item)} style={styles.iconBtn}><Feather name="trash-2" size={15} color={colors.error[300]} /></TouchableOpacity>
            </>}
            {item.id_familia === null && <Text style={styles.globalBadge}>Global</Text>}
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}><Feather name="plus" size={26} color={colors.white} /></TouchableOpacity>

      <BottomModal visible={modalVisible} title={editing ? 'Editar Categoria' : 'Nova Categoria'} onClose={() => setModalVisible(false)}>
        <View style={styles.form}>
          <Controller control={control} name="nome" rules={{ required: 'Nome obrigatório' }}
            render={({ field: { onChange, value } }) => <Input label="Nome" value={value} onChangeText={onChange} placeholder="Ex: Alimentação" error={errors.nome?.message} />} />
          <Text style={styles.label}>Cor</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setValue('cor', c)} style={[styles.colorSwatch, { backgroundColor: c }, corAtual === c && styles.colorSwatchSelected]} />
            ))}
          </View>
          <Controller control={control} name="cor" render={({ field: { onChange, value } }) => (
            <View style={styles.colorInputRow}>
              <View style={[styles.colorPreview, { backgroundColor: value }]} />
              <TextInput style={styles.colorInput} value={value} onChangeText={onChange} placeholder="#RRGGBB" autoCapitalize="none" maxLength={7} />
            </View>
          )} />
          <Button onPress={handleSubmit(onSubmit)} loading={saving} style={{ marginTop: 8, marginBottom: 8 }}>
            {editing ? 'Salvar' : 'Criar categoria'}
          </Button>
        </View>
      </BottomModal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray[100] },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray[200] },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.primary[300] },
  tabTxt: { fontSize: 13, color: colors.txt[200], fontWeight: '600' },
  tabTxtActive: { color: colors.primary[300] },
  list: { padding: spacing.l, gap: 8, paddingBottom: 90 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.l, padding: 14, gap: 10 },
  colorDot: { width: 18, height: 18, borderRadius: 9, flexShrink: 0 },
  nome: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.txt[400] },
  globalBadge: { fontSize: 11, color: colors.txt[100], backgroundColor: colors.gray[100], borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  iconBtn: { padding: 4 },
  empty: { color: colors.txt[100], fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary[400], alignItems: 'center', justifyContent: 'center', ...shadow.m },
  form: { padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.txt[300], marginBottom: 8 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16 },
  colorSwatchSelected: { borderWidth: 3, borderColor: colors.primary[500] },
  colorInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  colorPreview: { width: 36, height: 36, borderRadius: 8 },
  colorInput: { flex: 1, borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.m, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.txt[400] },
});
