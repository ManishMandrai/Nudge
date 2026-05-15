import { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

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

const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY

async function fetchNightlyMessage(habits: string[], userName: string): Promise<string> {
    try {
        const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    max_tokens: 100,
                    messages: [{
                        role: 'user',
                        content: `Write ONE short warm sentence (max 20 words) for ${userName} who wants to build habits: ${habits.join(', ')}. Be human and gentle, like a friend. No greetings, just the nudge.`
                    }]
                })
            }
        );
        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? "Hey, take a quiet moment tonight. You're doing great.";
    } catch {
        return "Hey, take a quiet moment tonight. You're doing great.";
    }
}

export default function CheckinScreen() {
    const [habits, setHabits] = useState<string[]>([]);
    const [checked, setChecked] = useState<boolean[]>([]);
    const [userName, setUserName] = useState('');
    const [message, setMessage] = useState('');
    const [loadingMessage, setLoadingMessage] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const name = await AsyncStorage.getItem('userName');
        const habitsRaw = await AsyncStorage.getItem('habits');
        if (name) setUserName(name);
        if (habitsRaw) {
            const parsed = JSON.parse(habitsRaw);
            setHabits(parsed);
            setChecked(new Array(parsed.length).fill(false));
            fetchNightlyMessage(parsed, name ?? 'friend')
                .then(msg => { setMessage(msg); setLoadingMessage(false); })
                .catch(() => {
                    setMessage("Hey, take a quiet moment tonight. You're doing great.");
                    setLoadingMessage(false);
                });
        }
    };

    const toggle = (index: number) => {
        const updated = [...checked];
        updated[index] = !updated[index];
        setChecked(updated);
    };

    const handleSave = async () => {
        const today = new Date().toISOString().split('T')[0];
        const record = habits.reduce((acc, habit, i) => {
            acc[habit] = checked[i];
            return acc;
        }, {} as Record<string, boolean>);
        await AsyncStorage.setItem(`checkin_${today}`, JSON.stringify(record));
        router.replace('/done');
    };



    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* AI Message Card */}
                <View style={styles.messageCard}>
                    {loadingMessage ? (
                        <ActivityIndicator color={C.accent} />
                    ) : (
                        <Text style={styles.messageText}>"{message}"</Text>
                    )}
                </View>

                <Text style={styles.title}>Evening check-in</Text>
                <Text style={styles.subtitle}>How did today go, {userName}?</Text>

                <View style={styles.habitList}>
                    {habits.map((habit, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.habitRow, checked[i] && styles.habitRowChecked]}
                            onPress={() => toggle(i)}
                        >
                            <View style={[styles.checkbox, checked[i] && styles.checkboxChecked]}>
                                {checked[i] && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={[styles.habitText, checked[i] && styles.habitTextChecked]}>
                                {habit}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.progressBtn}
                    onPress={() => router.push('/progress')}
                >
                    <Text style={styles.progressBtnText}>📊 View progress</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Save my evening</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    scroll: { backgroundColor: C.bg },
    container: {
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
    },
    messageCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: C.border,
        borderLeftWidth: 3,
        borderLeftColor: C.accent,
        width: '100%',
        minHeight: 80,
        justifyContent: 'center',
    },
    messageText: {
        color: C.muted,
        fontSize: 15,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: C.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: C.hint,
        marginBottom: 8,
        textAlign: 'center',
    },
    habitList: {
        width: '100%',
        marginTop: 32,
        marginBottom: 32,
    },
    habitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: C.border,
    },
    habitRowChecked: {
        borderColor: C.accent,
        backgroundColor: '#1c1710',
    },
    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: C.border,
        marginRight: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: C.accent,
        borderColor: C.accent,
    },
    checkmark: {
        color: C.accentDark,
        fontSize: 14,
        fontWeight: '700',
    },
    habitText: {
        fontSize: 16,
        color: C.muted,
    },
    habitTextChecked: {
        color: C.text,
        fontWeight: '600',
    },
    progressBtn: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
    },
    progressBtnText: {
        color: C.muted,
        fontSize: 15,
    },
    saveBtn: {
        backgroundColor: C.accent,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        width: '100%',
    },
    saveBtnText: {
        color: C.accentDark,
        fontSize: 17,
        fontWeight: '700',
    },
});