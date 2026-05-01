import { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity,
    StyleSheet, ScrollView, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { router } from 'expo-router';


const GROQ_KEY = process.env.GROQ_API_KEY;

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
                    messages: [
                        {
                            role: 'user',
                            content: `Write ONE short warm sentence (max 20 words) for ${userName} who wants to build habits: ${habits.join(', ')}. Be human and gentle, like a friend. No greetings, just the nudge.`
                        }
                    ]
                })
            }
        );

        const data = await response.json();
        console.log('GROQ RESPONSE:', JSON.stringify(data));

        return data.choices?.[0]?.message?.content ?? "fallback";
    } catch (error) {
        console.log('GROQ ERROR:', error);
        return "Hey, take a quiet moment tonight. You're doing great.";
    }
}

async function scheduleNightlyNotification(sleepTime: string) {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const [hours, minutes] = sleepTime.split(':').map(Number);

    const randomOffset = Math.floor(Math.random() * 21) + 20;

    let notifHour = hours;
    let notifMinute = minutes - randomOffset;

    if (notifMinute < 0) {
        notifMinute += 60;
        notifHour -= 1;
    }

    if (notifHour < 0) notifHour = 23;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        console.log('Notification permission denied');
        return;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: '🌙 HabitNudge',
            body: "Your evening check-in is waiting. How did today go?",
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: notifHour,
            minute: notifMinute,
        },
    });

    console.log(`✅ Notification scheduled for ${notifHour}:${notifMinute} daily (${randomOffset} min before sleep)`);
}


export default function CheckinScreen() {
    const [habits, setHabits] = useState<string[]>([]);
    const [checked, setChecked] = useState<boolean[]>([]);
    const [userName, setUserName] = useState('');
    const [saved, setSaved] = useState(false);
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
                .catch(() => { setMessage("Hey, take a quiet moment tonight. You're doing great."); setLoadingMessage(false); });
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
        setSaved(true);
    };

    if (saved) {
        return (
            <View style={styles.container}>
                <Text style={styles.emoji}>✨</Text>
                <Text style={styles.title}>Done for tonight</Text>
                <Text style={styles.subtitle}>
                    {checked.filter(Boolean).length} of {habits.length} habits completed
                </Text>
                <Text style={styles.hint}>Sleep well, {userName} 🌙</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

            {/* AI Message Card */}
            <View style={styles.messageCard}>
                {loadingMessage ? (
                    <ActivityIndicator color="#7c7cff" />
                ) : (
                    <Text style={styles.messageText}>{message}</Text>
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

            <TouchableOpacity style={styles.progressBtn} onPress={() => router.push('/progress')}>
                <Text style={styles.progressBtnText}>📊 View progress</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save my evening</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { backgroundColor: '#0f0f1a' },
    container: {
        padding: 24,
        paddingTop: 60,
        alignItems: 'center',
    },
    messageCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#2a2a4a',
        width: '100%',
        minHeight: 80,
        justifyContent: 'center',
    },
    messageText: {
        color: '#ccccee',
        fontSize: 15,
        lineHeight: 24,
        fontStyle: 'italic',
    },
    emoji: { fontSize: 48, marginBottom: 12 },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#8888aa',
        marginBottom: 8,
        textAlign: 'center',
    },
    hint: {
        fontSize: 14,
        color: '#666688',
        marginTop: 16,
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
        backgroundColor: '#1a1a2e',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2a2a4a',
    },
    habitRowChecked: {
        borderColor: '#7c7cff',
        backgroundColor: '#1a1a3e',
    },
    checkbox: {
        width: 26,
        height: 26,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#444466',
        marginRight: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#7c7cff',
        borderColor: '#7c7cff',
    },
    checkmark: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    habitText: {
        fontSize: 16,
        color: '#aaaacc',
    },
    habitTextChecked: {
        color: '#ffffff',
    },
    saveBtn: {
        backgroundColor: '#7c7cff',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        width: '100%',
    },
    saveBtnText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '700',
    },

    progressBtn: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#2a2a4a',
        marginBottom: 12,
        width: '100%',
        alignItems: 'center',
    },
    progressBtnText: {
        color: '#7c7cff',
        fontSize: 15,
    },
});