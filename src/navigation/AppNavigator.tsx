import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { DashboardScreen } from '@/screens/app/DashboardScreen';
import { EntradasScreen } from '@/screens/app/EntradasScreen';
import { SaidasScreen } from '@/screens/app/SaidasScreen';
import { InvestimentosScreen } from '@/screens/app/InvestimentosScreen';
import { MaisScreen } from '@/screens/app/MaisScreen';
import { CategoriasScreen } from '@/screens/app/CategoriasScreen';
import { FamiliaScreen } from '@/screens/app/FamiliaScreen';
import { SaudeFinanceiraScreen } from '@/screens/app/SaudeFinanceiraScreen';
import { ImportarScreen } from '@/screens/app/ImportarScreen';

export type AppTabParamList = {
  Dashboard: undefined;
  Entradas: undefined;
  Saidas: undefined;
  Investimentos: undefined;
  MaisTab: undefined;
};

export type MaisStackParamList = {
  MaisHome: undefined;
  Categorias: undefined;
  Familia: undefined;
  SaudeFinanceira: undefined;
  Importar: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const MaisStack = createNativeStackNavigator<MaisStackParamList>();

function MaisNavigator() {
  return (
    <MaisStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary[500] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <MaisStack.Screen name="MaisHome" component={MaisScreen} options={{ title: 'Mais' }} />
      <MaisStack.Screen name="Categorias" component={CategoriasScreen} options={{ title: 'Categorias' }} />
      <MaisStack.Screen name="Familia" component={FamiliaScreen} options={{ title: 'Minha Família' }} />
      <MaisStack.Screen name="SaudeFinanceira" component={SaudeFinanceiraScreen} options={{ title: 'Saúde Financeira' }} />
      <MaisStack.Screen name="Importar" component={ImportarScreen} options={{ title: 'Importar Nota' }} />
    </MaisStack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary[500] },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary[300],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.gray[200] },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}
        options={{ title: 'Resumo', tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} /> }} />
      <Tab.Screen name="Entradas" component={EntradasScreen}
        options={{ title: 'Entradas', tabBarIcon: ({ color, size }) => <Feather name="arrow-up-circle" size={size} color={color} /> }} />
      <Tab.Screen name="Saidas" component={SaidasScreen}
        options={{ title: 'Saídas', tabBarIcon: ({ color, size }) => <Feather name="arrow-down-circle" size={size} color={color} /> }} />
      <Tab.Screen name="Investimentos" component={InvestimentosScreen}
        options={{ title: 'Investimentos', tabBarIcon: ({ color, size }) => <Feather name="trending-up" size={size} color={color} /> }} />
      <Tab.Screen name="MaisTab" component={MaisNavigator}
        options={{ headerShown: false, title: 'Mais', tabBarIcon: ({ color, size }) => <Feather name="menu" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
