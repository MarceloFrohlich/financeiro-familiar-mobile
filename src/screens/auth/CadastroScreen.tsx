import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing } from '@/lib/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Cadastro'>;

interface Form { nome: string; email: string; senha: string; confirmar_senha: string; codigo_convite?: string }

export function CadastroScreen({ route, navigation }: Props) {
  const convite = route.params?.convite;
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, watch, formState: { errors } } = useForm<Form>();

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      const body: any = { nome: data.nome, email: data.email, senha: data.senha };
      if (convite) body.token_convite = convite;
      else if (data.codigo_convite?.trim()) body.codigo_convite = data.codigo_convite.trim();

      await fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(body) });
      await login(data.email, data.senha);
    } catch (err: any) {
      Alert.alert('Erro ao cadastrar', err.message || 'Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.bg}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Preencha os dados para se cadastrar</Text>

            <View style={{ marginTop: 20 }}>
              <Controller control={control} name="nome" rules={{ required: 'Nome obrigatório' }}
                render={({ field: { onChange, value } }) => (
                  <Input label="Nome" value={value} onChangeText={onChange} autoCapitalize="words" placeholder="Seu nome" error={errors.nome?.message} />
                )} />
              <Controller control={control} name="email" rules={{ required: 'E-mail obrigatório', pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' } }}
                render={({ field: { onChange, value } }) => (
                  <Input label="E-mail" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" placeholder="seu@email.com" error={errors.email?.message} />
                )} />
              <Controller control={control} name="senha" rules={{ required: 'Senha obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
                render={({ field: { onChange, value } }) => (
                  <Input label="Senha" value={value} onChangeText={onChange} secureTextEntry placeholder="Mínimo 6 caracteres" error={errors.senha?.message} />
                )} />
              <Controller control={control} name="confirmar_senha" rules={{ required: 'Confirmação obrigatória', validate: (v) => v === watch('senha') || 'Senhas não coincidem' }}
                render={({ field: { onChange, value } }) => (
                  <Input label="Confirmar senha" value={value} onChangeText={onChange} secureTextEntry placeholder="Repita a senha" error={errors.confirmar_senha?.message} />
                )} />

              {!convite && (
                <Controller control={control} name="codigo_convite"
                  render={({ field: { onChange, value } }) => (
                    <Input label="Código de convite (opcional)" value={value || ''} onChangeText={onChange} autoCapitalize="none" placeholder="Ex: ABC123" error={errors.codigo_convite?.message} />
                  )} />
              )}

              <Button onPress={handleSubmit(onSubmit)} loading={loading} size="lg" style={{ marginTop: 4 }}>
                Criar conta
              </Button>
            </View>

            <Text style={styles.footer}>
              Já tem conta?{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Login')}>Entrar</Text>
            </Text>
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
  title: { fontSize: 22, fontWeight: '700', color: colors.primary[500], textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.txt[200], textAlign: 'center', marginTop: 4 },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: colors.txt[200] },
  link: { fontWeight: '700', color: colors.primary[300] },
});
