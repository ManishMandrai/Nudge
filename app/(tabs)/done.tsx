import { useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, SafeAreaView, Animated
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { saveBackup } from '../../utils/backup';

const C = {
    bg: '#0c0a09',
    surface: '#1c1917',
    border: '#292524',
    accent: '#f59e0b',
    accentDark: '#0c0a09',
    text: '#fafaf9',
    muted: '#a8a29e',
    hint: '#78716c',
    faint: '#57534e',
};

export default function DoneScreen() {
    const [userName, setUserName] = useState('');
    const [completed, setCompleted] = useState(0);
    const [total, setTotal] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        loadData();
        saveBackup();
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const loadData = async () => {
        const name = await AsyncStorage.getItem('userName');
        const today = new Date().toISOString().split('T')[0];
        const raw = await AsyncStorage.getItem(`checkin_${today}`);

        if (name) setUserName(name);
        if (raw) {
            const record = JSON.parse(raw);
            const values = Object.values(record) as boolean[];
            setTotal(values.length);
            setCompleted(values.filter(Boolean).length);
        }
    };

    const getMessage = () => {
        if (completed === total) return "Perfect night. Every single one. 🔥";
        if (completed >= total * 0.7) return "Strong effort tonight. Keep going.";
        if (completed >= total * 0.4) return "Something is better than nothing.";
        return "Tomorrow is a fresh start. Rest well.";
    };

    return (
        <SafeAreaView style={styles.safe}>
            <Animated.View
                style={[
                    styles.container,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }]
                    }
                ]}
            >
                {/* Emoji */}
                <Text style={styles.emoji}>✨</Text>

                {/* Title */}
                <Text style={styles.title}>Done for tonight</Text>
                <Text style={styles.subtitle}>{getMessage()}</Text>

                {/* Score card */}
                <View style={styles.scoreCard}>
                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreNum}>{completed}</Text>
                        <Text style={styles.scoreLabel}>completed</Text>
                    </View>
                    <View style={styles.scoreDivider} />
                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreNum}>{total - completed}</Text>
                        <Text style={styles.scoreLabel}>missed</Text>
                    </View>
                    <View style={styles.scoreDivider} />
                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreNum}>{total}</Text>
                        <Text style={styles.scoreLabel}>total</Text>
                    </View>
                </View>

                {/* Sleep well message */}
                <Text style={styles.sleepText}>Sleep well, {userName} 🌙</Text>
                <Text style={styles.closeText}>You can close the app now.</Text>

                {/* Buttons */}
                <View style={styles.btnRow}>
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => router.replace('/progress')}
                    >
                        <Text style={styles.secondaryBtnText}>View progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => router.replace('/dashboard')}
                    >
                        <Text style={styles.primaryBtnText}>Go home</Text>
                    </TouchableOpacity>
                </View>

            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: C.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: C.muted,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    scoreCard: {
        flexDirection: 'row',
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 20,
        width: '100%',
        marginBottom: 40,
    },
    scoreItem: {
        flex: 1,
        alignItems: 'center',
    },
    scoreNum: {
        fontSize: 28,
        fontWeight: '700',
        color: C.accent,
    },
    scoreLabel: {
        fontSize: 11,
        color: C.hint,
        marginTop: 4,
    },
    scoreDivider: {
        width: 1,
        backgroundColor: C.border,
        marginHorizontal: 8,
    },
    sleepText: {
        fontSize: 16,
        color: C.muted,
        marginBottom: 8,
    },
    closeText: {
        fontSize: 13,
        color: C.faint,
        marginBottom: 48,
    },
    btnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    primaryBtn: {
        flex: 1,
        backgroundColor: C.accent,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
    },
    primaryBtnText: {
        color: C.accentDark,
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryBtn: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: C.border,
    },
    secondaryBtnText: {
        color: C.muted,
        fontSize: 15,
    },
});