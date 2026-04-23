import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { Feather } from '@expo/vector-icons';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing } from '@/lib/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'EsqueciSenha'>;

export function EsqueciSenhaScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      await fetchApi('/auth/forgot-senha', { method: 'POST', body: JSON.stringify(data) });
      setSuccess(true);
    } catch {
      setSuccess(true); // Mesmo em erro, não revelar se e-mail existe
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Text style={{ fontSize: 28 }}>🔑</Text>
            </View>
            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.subtitle}>Informe seu e-mail para receber o link</Text>

            {success ? (
              <View>
                <View style={styles.successBox}>
                  <Feather name="check-circle" size={20} color={colors.success[400]} style={{ marginBottom: 8 }} />
                  <Text style={styles.successText}>
                    Se o e-mail estiver cadastrado, você receberá as instruções em breve. Verifique também sua caixa de spam.
                  </Text>
                </View>
                <Button onPress={() => navigation.navigate('Login')} variant="secondary" size="lg">
                  Voltar ao login
                </Button>
              </View>
            ) : (
              <View style={{ marginTop: 20 }}>
                <Controller
                  control={control}
                  name="email"
                  rules={{ required: 'E-mail obrigatório', pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' } }}
                  render={({ field: { onChange, value } }) => (
                    <Input label="E-mail" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" placeholder="seu@email.com" error={errors.email?.message} />
                  )}
                />
                <Button onPress={handleSubmit(onSubmit)} loading={loading} size="lg">
                  Enviar link de recuperação
                </Button>
              </View>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.back}>
              <Feather name="arrow-left" size={14} color={colors.primary[300]} />
              <Text style={styles.backText}>Voltar ao login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.primary[500] },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.l },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xxl },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary[500], textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.txt[200], textAlign: 'center', marginTop: 4 },
  successBox: { backgroundColor: colors.success[100], borderRadius: radius.m, padding: 14, alignItems: 'center', marginBottom: 16 },
  successText: { fontSize: 13, color: colors.success[400], textAlign: 'center', lineHeight: 20 },
  back: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 20 },
  backText: { fontSize: 13, fontWeight: '600', color: colors.primary[300] },
});
