import { useState, useRef } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/lib/api';
import { ResultadoImportacao, ItemImportacao, CategoriaSaida } from '@/types';
import { colors, radius, shadow, spacing } from '@/lib/colors';
import { formatarMoeda, aplicarMascaraMoeda, parsearMoeda, dataAtualInput } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export function ImportarScreen() {
  const { addToast } = useToast();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [textoManual, setTextoManual] = useState('');
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [categorias, setCategorias] = useState<CategoriaSaida[]>([]);
  const [itens, setItens] = useState<ItemImportacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const iniciarCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para escanear QR Codes.'); return; }
    }
    setScanned(false);
    setCameraAtiva(true);
  };

  const handleBarcodeScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setCameraAtiva(false);
    await processarConteudo(data);
  };

  const processarConteudo = async (conteudo: string) => {
    setLoading(true);
    try {
      const [res, cats] = await Promise.all([
        fetchApi<ResultadoImportacao>('/importacao/processar', { method: 'POST', body: JSON.stringify({ tipo: 'qrcode', conteudo }) }),
        categorias.length ? Promise.resolve(categorias) : fetchApi<CategoriaSaida[]>('/categorias/saidas'),
      ]);
      setResultado(res);
      if (!categorias.length) setCategorias(cats as CategoriaSaida[]);
      setItens(res.itens.map(i => ({ ...i, id_categoria_saida: i.id_categoria_sugerida, data: dataAtualInput() })));
    } catch (err: any) { addToast(err.message || 'Erro ao processar', 'error'); }
    finally { setLoading(false); }
  };

  const handleSalvar = async () => {
    if (!resultado) return;
    const validos = itens.filter(i => i.valor > 0 && i.id_categoria_saida);
    if (!validos.length) { addToast('Adicione pelo menos um item com valor e categoria', 'warning'); return; }
    setSalvando(true);
    try {
      const res = await fetchApi<{ message: string }>(`/importacao/${resultado.id_importacao}/confirmar`, { method: 'POST', body: JSON.stringify({ itens: validos }) });
      addToast(res.message || 'Importado com sucesso!', 'success');
      setResultado(null); setItens([]); setTextoManual('');
    } catch (err: any) { addToast(err.message || 'Erro ao salvar', 'error'); }
    finally { setSalvando(false); }
  };

  if (cameraAtiva) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.qrFrame} />
            <Text style={styles.cameraHint}>Aponte para o QR Code da nota fiscal</Text>
          </View>
        </CameraView>
        <TouchableOpacity style={styles.cancelCameraBtn} onPress={() => setCameraAtiva(false)}>
          <Feather name="x" size={24} color={colors.white} />
          <Text style={styles.cancelCameraTxt}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <ActivityIndicator color={colors.primary[300]} size="large" />
      <Text style={{ color: colors.txt[200] }}>Processando nota fiscal...</Text>
    </View>;
  }

  if (resultado && itens.length > 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.successBanner}>
          <Feather name="check-circle" size={18} color={colors.success[400]} />
          <Text style={styles.successBannerTxt}>Nota processada — ajuste e confirme</Text>
        </View>
        <Text style={styles.totalTxt}>Total: {formatarMoeda(resultado.total)}</Text>

        {itens.map((item, i) => (
          <View key={i} style={[styles.itemCard, shadow.s]}>
            <Input label="Descrição" value={item.descricao} onChangeText={v => { const n = [...itens]; n[i] = { ...n[i], descricao: v }; setItens(n); }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemLabel}>Valor</Text>
                <View style={styles.moneyRow}>
                  <Text style={styles.moneyPrefix}>R$</Text>
                  <TextInput
                    style={styles.moneyInput}
                    value={typeof item.valor === 'number' ? item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                    onChangeText={v => { const masked = aplicarMascaraMoeda(v); const n = [...itens]; n[i] = { ...n[i], valor: parsearMoeda(masked) }; setItens(n); }}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Data" value={item.data || dataAtualInput()} onChangeText={v => { const n = [...itens]; n[i] = { ...n[i], data: v }; setItens(n); }} placeholder="AAAA-MM-DD" />
              </View>
            </View>
            <Text style={styles.itemLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {categorias.map(c => (
                  <TouchableOpacity key={c.id_categoria_saida} onPress={() => { const n = [...itens]; n[i] = { ...n[i], id_categoria_saida: c.id_categoria_saida }; setItens(n); }}
                    style={[styles.catChip, item.id_categoria_saida === c.id_categoria_saida && { backgroundColor: c.cor || colors.primary[300] }]}>
                    <Text style={[styles.catChipTxt, item.id_categoria_saida === c.id_categoria_saida && { color: colors.white }]} numberOfLines={1}>{c.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        ))}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Button variant="secondary" onPress={() => { setResultado(null); setItens([]); }} style={{ flex: 1 }}>Cancelar</Button>
          <Button onPress={handleSalvar} loading={salvando} style={{ flex: 1 }}>Salvar saídas</Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.card, shadow.s]}>
        <Feather name="camera" size={32} color={colors.primary[300]} style={{ alignSelf: 'center', marginBottom: 12 }} />
        <Text style={styles.cardTitle}>Scanner QR Code</Text>
        <Text style={styles.cardDesc}>Aponte a câmera para o QR Code da nota fiscal eletrônica</Text>
        <Button onPress={iniciarCamera} size="lg" style={{ marginTop: 12 }}>
          Abrir câmera
        </Button>
      </View>

      <View style={[styles.card, shadow.s]}>
        <Feather name="link" size={28} color={colors.primary[300]} style={{ alignSelf: 'center', marginBottom: 12 }} />
        <Text style={styles.cardTitle}>URL / Texto manual</Text>
        <Text style={styles.cardDesc}>Cole a URL do QR Code ou o conteúdo da nota</Text>
        <TextInput
          style={styles.textArea}
          value={textoManual}
          onChangeText={setTextoManual}
          placeholder="https://www.nfce.fazenda..."
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.gray[400]}
        />
        <Button onPress={() => textoManual.trim() && processarConteudo(textoManual.trim())} variant="secondary" size="lg" style={{ marginTop: 8 }} disabled={!textoManual.trim()}>
          Processar
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.gray[100] },
  content: { padding: spacing.l, gap: 16, paddingBottom: 40 },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  qrFrame: { width: 220, height: 220, borderWidth: 3, borderColor: colors.white, borderRadius: radius.l },
  cameraHint: { color: colors.white, fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: radius.m },
  cancelCameraBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30 },
  cancelCameraTxt: { color: colors.white, fontSize: 15, fontWeight: '600' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.success[100], borderRadius: radius.m, padding: 12 },
  successBannerTxt: { fontSize: 14, fontWeight: '600', color: colors.success[400] },
  totalTxt: { fontSize: 16, fontWeight: '700', color: colors.primary[500], textAlign: 'right' },
  itemCard: { backgroundColor: colors.white, borderRadius: radius.l, padding: 16 },
  itemLabel: { fontSize: 12, fontWeight: '600', color: colors.txt[300], marginBottom: 4 },
  moneyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.m, paddingHorizontal: 10, marginBottom: 12 },
  moneyPrefix: { fontSize: 13, color: colors.txt[200], marginRight: 4 },
  moneyInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: colors.txt[400] },
  catChip: { borderWidth: 1, borderColor: colors.gray[200], borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  catChipTxt: { fontSize: 12, color: colors.txt[300] },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 20 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.primary[500], textAlign: 'center', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: colors.txt[200], textAlign: 'center' },
  textArea: { borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.m, padding: 12, fontSize: 13, color: colors.txt[400], minHeight: 80, textAlignVertical: 'top' },
});
