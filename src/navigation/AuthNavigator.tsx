import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { CadastroScreen } from '@/screens/auth/CadastroScreen';
import { EsqueciSenhaScreen } from '@/screens/auth/EsqueciSenhaScreen';

export type AuthStackParamList = {
  Login: undefined;
  Cadastro: { convite?: string; codigo?: string };
  EsqueciSenha: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastro" component={CadastroScreen} />
      <Stack.Screen name="EsqueciSenha" component={EsqueciSenhaScreen} />
    </Stack.Navigator>
  );
}
