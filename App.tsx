import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '@/contexts/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ToastProvider } from '@/components/ui/Toast';

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <ToastProvider>
          <RootNavigator />
          <StatusBar style="light" />
        </ToastProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
