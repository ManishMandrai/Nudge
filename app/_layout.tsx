import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
    useEffect(() => {
        const sub = Notifications.addNotificationResponseReceivedListener(response => {
            const screen = response.notification.request.content.data?.screen;
            if (screen === 'checkin') router.replace('/(tabs)/checkin');
        });
        return () => sub.remove();
    }, []);

    return (
        <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="menu"
                    options={{
                        presentation: 'transparentModal',
                        animation: 'none',
                        contentStyle: { backgroundColor: 'transparent' },
                    }}
                />
            </Stack>
        </SafeAreaProvider>
    );
}