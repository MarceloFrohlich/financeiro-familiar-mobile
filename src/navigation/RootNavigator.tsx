import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { colors } from '@/lib/colors';

export function RootNavigator() {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary[500] }}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  return token ? <AppNavigator /> : <AuthNavigator />;
}
