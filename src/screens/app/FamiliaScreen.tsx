import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/lib/api';
import { Familia, ConviteMembro } from '@/types';
import { colors, radius, shadow, spacing } from '@/lib/colors';
import { formatarData } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomModal } from '@/components/ui/BottomModal';
import { useToast } from '@/components/ui/Toast';

export function FamiliaScreen() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [convites, setConvites] = useState<ConviteMembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const inviteForm = useForm<{ nome: string; email: string; parentesco: string }>();
  const createForm = useForm<{ nome: string }>();
  const joinForm = useForm<{ codigo: string }>();

  const load = useCallback(async () => {
    if (!user?.id_familia) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetchApi<{ familia: Familia; convites: ConviteMembro[] }>('/familias/minha');
      setFamilia(res.familia);
      setConvites(res.convites);
    } catch {} finally { setLoading(false); }
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isAdmin = user?.perfil === 'admin';

  const handleCriarFamilia = async (data: { nome: string }) => {
    setSaving(true);
    try {
      await fetchApi('/familias', { method: 'POST', body: JSON.stringify(data) });
      await refreshUser();
      setCreateModal(false);
      addToast('Família criada!', 'success');
      load();
    } catch (err: any) { addToast(err.message || 'Erro', 'error'); }
    finally { setSaving(false); }
  };

  const handleEntrarFamilia = async (data: { codigo: string }) => {
    setSaving(true);
    try {
      await fetchApi('/familias/entrar', { method: 'POST', body: JSON.stringify({ codigo_convite: data.codigo }) });
      await refreshUser();
      setJoinModal(false);
      addToast('Entrou na família!', 'success');
      load();
    } catch (err: any) { addToast(err.message || 'Erro', 'error'); }
    finally { setSaving(false); }
  };

  const handleConvidar = async (data: { nome: string; email: string; parentesco: string }) => {
    setSaving(true);
    try {
      await fetchApi('/familias/convites', { method: 'POST', body: JSON.stringify(data) });
      addToast('Convite enviado!', 'success');
      setInviteModal(false);
      inviteForm.reset();
      load();
    } catch (err: any) { addToast(err.message || 'Erro', 'error'); }
    finally { setSaving(false); }
  };

  const handleCancelarConvite = (id: number) => {
    Alert.alert('Cancelar convite', 'Tem certeza?', [
      { text: 'Não', style: 'cancel' },
      { text: 'Sim', style: 'destructive', onPress: async () => {
        try { await fetchApi(`/familias/convites/${id}`, { method: 'DELETE' }); addToast('Convite cancelado', 'success'); load(); }
        catch (err: any) { addToast(err.message || 'Erro', 'error'); }
      }},
    ]);
  };

  const handleRemoverMembro = (id: number, nome: string) => {
    Alert.alert('Remover membro', `Remover ${nome} da família?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        try { await fetchApi(`/usuarios/${id}/familia`, { method: 'DELETE' }); addToast('Membro removido', 'success'); load(); }
        catch (err: any) { addToast(err.message || 'Erro', 'error'); }
      }},
    ]);
  };

  const handleSairFamilia = () => {
    Alert.alert('Sair da família', 'Tem certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        try { await fetchApi(`/usuarios/${user?.id_usuario}/familia`, { method: 'DELETE' }); await refreshUser(); addToast('Saiu da família', 'success'); load(); }
        catch (err: any) { addToast(err.message || 'Erro', 'error'); }
      }},
    ]);
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={colors.primary[300]} /></View>;

  if (!user?.id_familia) {
    return (
      <ScrollView contentContainerStyle={styles.noFamilyContainer}>
        <Text style={styles.emoji}>👨‍👩‍👧‍👦</Text>
        <Text style={styles.noFamilyTitle}>Você não tem família</Text>
        <Text style={styles.noFamilySubtitle}>Crie uma nova família ou entre em uma existente com um código de convite.</Text>
        <Button onPress={() => setCreateModal(true)} size="lg" style={{ marginBottom: 12 }}>Criar família</Button>
        <Button onPress={() => setJoinModal(true)} variant="secondary" size="lg">Entrar com código</Button>

        <BottomModal visible={createModal} title="Criar família" onClose={() => setCreateModal(false)}>
          <View style={styles.form}>
            <Controller control={createForm.control} name="nome" rules={{ required: 'Nome obrigatório' }}
              render={({ field: { onChange, value } }) => <Input label="Nome da família" value={value} onChangeText={onChange} placeholder="Ex: Família Silva" error={createForm.formState.errors.nome?.message} />} />
            <Button onPress={createForm.handleSubmit(handleCriarFamilia)} loading={saving}>Criar</Button>
          </View>
        </BottomModal>

        <BottomModal visible={joinModal} title="Entrar com código" onClose={() => setJoinModal(false)}>
          <View style={styles.form}>
            <Controller control={joinForm.control} name="codigo" rules={{ required: 'Código obrigatório' }}
              render={({ field: { onChange, value } }) => <Input label="Código de convite" value={value} onChangeText={onChange} placeholder="Ex: ABC123" autoCapitalize="none" error={joinForm.formState.errors.codigo?.message} />} />
            <Button onPress={joinForm.handleSubmit(handleEntrarFamilia)} loading={saving}>Entrar</Button>
          </View>
        </BottomModal>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
      {/* Info família */}
      <View style={[styles.card, shadow.s]}>
        <Text style={styles.familyName}>{familia?.nome}</Text>
        <View style={styles.codeRow}>
          <Feather name="users" size={14} color={colors.txt[200]} />
          <Text style={styles.codeLabel}>Código: </Text>
          <Text style={styles.code}>{familia?.codigo_convite}</Text>
        </View>
      </View>

      {/* Membros */}
      <Text style={styles.sectionTitle}>Membros ({familia?.usuarios?.length ?? 0})</Text>
      {(familia?.usuarios ?? []).map(m => (
        <View key={m.id_usuario} style={[styles.memberRow, shadow.s]}>
          <View style={styles.avatar}><Text style={styles.avatarTxt}>{m.nome[0].toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>{m.nome} {m.id_usuario === user?.id_usuario ? '(você)' : ''}</Text>
            <Text style={styles.memberEmail}>{m.email}</Text>
          </View>
          <View style={[styles.badge, m.perfil === 'admin' ? styles.badgeAdmin : styles.badgeMembro]}>
            <Text style={styles.badgeTxt}>{m.perfil}</Text>
          </View>
          {isAdmin && m.id_usuario !== user?.id_usuario && (
            <TouchableOpacity onPress={() => handleRemoverMembro(m.id_usuario, m.nome)} style={{ padding: 4 }}>
              <Feather name="x" size={18} color={colors.error[300]} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Convites pendentes */}
      {convites.filter(c => c.status === 'pendente').length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Convites pendentes</Text>
          {convites.filter(c => c.status === 'pendente').map(c => (
            <View key={c.id_convite} style={[styles.memberRow, shadow.s]}>
              <Feather name="mail" size={20} color={colors.gray[400]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{c.nome}</Text>
                <Text style={styles.memberEmail}>{c.email}</Text>
              </View>
              {isAdmin && <TouchableOpacity onPress={() => handleCancelarConvite(c.id_convite)} style={{ padding: 4 }}><Feather name="x" size={18} color={colors.error[300]} /></TouchableOpacity>}
            </View>
          ))}
        </>
      )}

      {/* Ações */}
      <View style={styles.actionsRow}>
        {isAdmin && <Button onPress={() => setInviteModal(true)} style={{ flex: 1 }}><Text>Convidar membro</Text></Button>}
        {!isAdmin && <Button onPress={handleSairFamilia} variant="danger" style={{ flex: 1 }}><Text>Sair da família</Text></Button>}
      </View>

      <BottomModal visible={inviteModal} title="Convidar membro" onClose={() => setInviteModal(false)}>
        <View style={styles.form}>
          <Controller control={inviteForm.control} name="nome" rules={{ required: 'Obrigatório' }}
            render={({ field: { onChange, value } }) => <Input label="Nome" value={value} onChangeText={onChange} placeholder="Nome do convidado" error={inviteForm.formState.errors.nome?.message} />} />
          <Controller control={inviteForm.control} name="email" rules={{ required: 'Obrigatório', pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' } }}
            render={({ field: { onChange, value } }) => <Input label="E-mail" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" placeholder="email@exemplo.com" error={inviteForm.formState.errors.email?.message} />} />
          <Controller control={inviteForm.control} name="parentesco" rules={{ required: 'Obrigatório' }}
            render={({ field: { onChange, value } }) => <Input label="Parentesco" value={value} onChangeText={onChange} placeholder="Ex: Cônjuge, Filho" error={inviteForm.formState.errors.parentesco?.message} />} />
          <Button onPress={inviteForm.handleSubmit(handleConvidar)} loading={saving}>Enviar convite</Button>
        </View>
      </BottomModal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray[100] },
  content: { padding: spacing.l, gap: 12, paddingBottom: 40 },
  noFamilyContainer: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emoji: { fontSize: 56, marginBottom: 8 },
  noFamilyTitle: { fontSize: 20, fontWeight: '700', color: colors.primary[500], textAlign: 'center' },
  noFamilySubtitle: { fontSize: 14, color: colors.txt[200], textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  card: { backgroundColor: colors.primary[500], borderRadius: radius.l, padding: 20 },
  familyName: { fontSize: 20, fontWeight: '700', color: colors.white, marginBottom: 8 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  codeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  code: { fontSize: 14, fontWeight: '700', color: colors.white, letterSpacing: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.txt[300], marginTop: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.l, padding: 14, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary[200], alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 16, fontWeight: '700', color: colors.primary[500] },
  memberName: { fontSize: 14, fontWeight: '600', color: colors.txt[400] },
  memberEmail: { fontSize: 12, color: colors.txt[200] },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeAdmin: { backgroundColor: colors.primary[100] },
  badgeMembro: { backgroundColor: colors.gray[100] },
  badgeTxt: { fontSize: 11, fontWeight: '600', color: colors.txt[300] },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  form: { padding: 20 },
});
