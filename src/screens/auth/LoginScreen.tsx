import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { Feather } from '@expo/vector-icons';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, radius, spacing } from '@/lib/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface Form { email: string; senha: string }

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<Form>();

  const onSubmit = async (data: Form) => {
    setLoading(true);
    try {
      await login(data.email, data.senha);
    } catch (err: any) {
      Alert.alert('Erro ao entrar', err.message || 'Verifique suas credenciais');
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
              <Text style={{ fontSize: 32 }}>💰</Text>
            </View>
            <Text style={styles.title}>Financeiro Familiar</Text>
            <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>

            <View style={{ marginTop: 24 }}>
              <Controller
                control={control}
                name="email"
                rules={{ required: 'E-mail obrigatório', pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' } }}
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="E-mail"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    error={errors.email?.message}
                  />
                )}
              />

              <View>
                <View style={styles.passwordLabel}>
                  <Text style={styles.label}>Senha</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('EsqueciSenha')}>
                    <Text style={styles.forgotLink}>Esqueci minha senha</Text>
                  </TouchableOpacity>
                </View>
                <Controller
                  control={control}
                  name="senha"
                  rules={{ required: 'Senha obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
                  render={({ field: { onChange, value } }) => (
                    <View style={[styles.passwordRow, errors.senha ? styles.passwordRowError : null]}>
                      <View style={{ flex: 1 }}>
                        <Input
                          value={value}
                          onChangeText={onChange}
                          secureTextEntry={!showPassword}
                          autoComplete="password"
                          placeholder="Sua senha"
                          error={errors.senha?.message}
                          style={{ borderWidth: 0, marginBottom: 0, paddingHorizontal: 0 }}
                        />
                      </View>
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                        <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.gray[400]} />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>

              <Button onPress={handleSubmit(onSubmit)} loading={loading} size="lg" style={{ marginTop: 8 }}>
                Entrar
              </Button>
            </View>

            <Text style={styles.footer}>
              Não tem conta?{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('Cadastro', {})}>
                Cadastre-se
              </Text>
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
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary[500], textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.txt[200], textAlign: 'center', marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.txt[300], marginBottom: 5 },
  passwordLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  forgotLink: { fontSize: 12, fontWeight: '600', color: colors.primary[300] },
  passwordRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.gray[200], borderRadius: radius.m, paddingHorizontal: 12, backgroundColor: colors.white, marginBottom: 12 },
  passwordRowError: { borderColor: colors.error[300] },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 13, color: colors.txt[200] },
  link: { fontWeight: '700', color: colors.primary[300] },
});
