import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '@/contexts/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ToastProvider } from '@/components/ui/Toast';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error.message);
    console.error(error.stack);
    console.error(info.componentStack);
  }

  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <View style={styles.errBox}>
          <Text style={styles.errTitle}>Erro ao iniciar</Text>
          <Text style={styles.errMsg}>{err.message}</Text>
          <Text style={styles.errStack}>{err.stack}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <NavigationContainer>
          <AuthProvider>
            <ToastProvider>
              <RootNavigator />
              <StatusBar style="light" />
            </ToastProvider>
          </AuthProvider>
        </NavigationContainer>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errBox: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' },
  errTitle: { fontSize: 18, fontWeight: '700', color: '#c0392b', marginBottom: 12 },
  errMsg: { fontSize: 14, color: '#333', marginBottom: 16 },
  errStack: { fontSize: 10, color: '#666', fontFamily: 'monospace' },
});
