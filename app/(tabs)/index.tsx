import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EntryPoint() {
    useEffect(() => {
        checkOnboarded();
    }, []);

    
    const checkOnboarded = async () => {
        const onboarded = await AsyncStorage.getItem('onboarded');
        if (onboarded === 'true') {
            router.replace('/dashboard');
        } else {
            router.replace('/onboarding');
        }
    };
    return (
        <View style={{ flex: 1, backgroundColor: '#0f0f1a', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#7c7cff" />
        </View>
    );
}