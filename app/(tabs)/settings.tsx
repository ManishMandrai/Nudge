import { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, ScrollView, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

const C = {
    bg: '#0c0a09',
    surface: '#1c1917',
    border: '#292524',
    borderWarm: '#92400e',
    accent: '#f59e0b',
    accentDark: '#0c0a09',
    text: '#fafaf9',
    muted: '#a8a29e',
    hint: '#78716c',
    faint: '#57534e',
    danger: '#ef4444',
};

async function scheduleNightlyNotification(sleepTime: string) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const [hours, minutes] = sleepTime.split(':').map(Number);
    const randomOffset = Math.floor(Math.random() * 21) + 20;
    let notifHour = hours;
    let notifMinute = minutes - randomOffset;
    if (notifMinute < 0) { notifMinute += 60; notifHour -= 1; }
    if (notifHour < 0) notifHour = 23;
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
}

export default function SettingsScreen() {
    const [habits, setHabits] = useState<string[]>([]);
    const [sleepTime, setSleepTime] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [saved, setSaved] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const formatTime = (date: Date) => {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const loadData = async () => {
        const habitsRaw = await AsyncStorage.getItem('habits');
        const sleepRaw = await AsyncStorage.getItem('sleepTime');
        if (habitsRaw) setHabits(JSON.parse(habitsRaw));
        if (sleepRaw) {
            const [h, m] = sleepRaw.split(':').map(Number);
            const d = new Date();
            d.setHours(h, m, 0, 0);
            setSleepTime(d);
        }
    };

    const updateHabit = (text: string, index: number) => {
        const updated = [...habits];
        updated[index] = text;
        setHabits(updated);
    };

    const addHabit = () => {
        if (habits.length < 6) setHabits([...habits, '']);
    };

    const removeHabit = (index: number) => {
        if (habits.length <= 1) return;
        setHabits(habits.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        const filled = habits.filter(h => h.trim() !== '');
        if (filled.length === 0) return Alert.alert('Hey!', 'Add at least one habit.');
        await AsyncStorage.setItem('habits', JSON.stringify(filled));
        await AsyncStorage.setItem('sleepTime', formatTime(sleepTime));
        await scheduleNightlyNotification(formatTime(sleepTime));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        Alert.alert(
            'Reset everything?',
            'This will delete all your habits, check-in history and start fresh. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.clear();
                        await Notifications.cancelAllScheduledNotificationsAsync();
                        router.replace('/onboarding');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>⬅</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 60 }} />
                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={() => router.push('/menu')}
                    >
                        <View style={styles.menuLine} />
                        <View style={styles.menuLine} />
                        <View style={styles.menuLine} />
                    </TouchableOpacity>
                </View>

                {/* Habits */}
                <Text style={styles.sectionLabel}>YOUR HABITS</Text>
                <View style={styles.card}>
                    {habits.map((habit, i) => (
                        <View key={i} style={styles.habitRow}>
                            <TextInput
                                style={styles.habitInput}
                                value={habit}
                                onChangeText={text => updateHabit(text, i)}
                                placeholder={`Habit ${i + 1}`}
                                placeholderTextColor={C.hint}
                            />
                            {habits.length > 1 && (
                                <TouchableOpacity
                                    onPress={() => removeHabit(i)}
                                    style={styles.removeBtn}
                                >
                                    <Text style={styles.removeBtnText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    {habits.length < 6 && (
                        <TouchableOpacity onPress={addHabit} style={styles.addBtn}>
                            <Text style={styles.addBtnText}>+ Add habit</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Sleep time */}
                <Text style={styles.sectionLabel}>SLEEP TIME</Text>
                <TouchableOpacity
                    style={styles.timeCard}
                    onPress={() => setShowPicker(true)}
                >
                    <View>
                        <Text style={styles.timeBig}>{formatTime(sleepTime)}</Text>
                        <Text style={styles.timeHint}>tap to change</Text>
                    </View>
                    <Text style={{ fontSize: 24 }}>🌙</Text>
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={sleepTime}
                        mode="time"
                        is24Hour={true}
                        display="clock"
                        onChange={(event, selectedDate) => {
                            setShowPicker(false);
                            if (selectedDate) setSleepTime(selectedDate);
                        }}
                    />
                )}

                {/* Save button */}
                <TouchableOpacity
                    style={[styles.saveBtn, saved && styles.saveBtnDone]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveBtnText}>
                        {saved ? 'Saved ✓' : 'Save changes'}
                    </Text>
                </TouchableOpacity>

                {/* Danger zone */}
                <Text style={[styles.sectionLabel, { marginTop: 40 }]}>DANGER ZONE</Text>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                    <Text style={styles.resetBtnText}>Reset everything</Text>
                    <Text style={styles.resetBtnSub}>Deletes all data and starts fresh</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    scroll: { flex: 1 },
    container: { padding: 24, paddingTop: 60 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 36,
    },
    backBtn: { padding: 4 },
    backBtnText: { color: C.muted, fontSize: 15 },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: C.text,
    },

    sectionLabel: {
        fontSize: 10,
        color: C.faint,
        letterSpacing: 1.5,
        marginBottom: 12,
    },

    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        marginBottom: 28,
    },
    habitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    habitInput: {
        flex: 1,
        backgroundColor: C.bg,
        borderRadius: 10,
        padding: 12,
        color: C.text,
        fontSize: 15,
        borderWidth: 1,
        borderColor: C.border,
    },
    removeBtn: { padding: 8 },
    removeBtnText: { color: C.hint, fontSize: 14 },
    addBtn: { paddingTop: 8, paddingLeft: 4 },
    addBtnText: { color: C.accent, fontSize: 14 },

    timeCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.borderWarm,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    timeBig: { fontSize: 36, fontWeight: '700', color: C.accent },
    timeHint: { fontSize: 11, color: C.hint, marginTop: 4 },

    saveBtn: {
        backgroundColor: C.accent,
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
    },
    saveBtnDone: {
        backgroundColor: '#78350f',
    },
    saveBtnText: {
        color: C.accentDark,
        fontSize: 16,
        fontWeight: '700',
    },

    resetBtn: {
        backgroundColor: C.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#7f1d1d',
        padding: 16,
    },
    resetBtnText: {
        color: C.danger,
        fontSize: 15,
        fontWeight: '600',
    },
    resetBtnSub: {
        color: C.faint,
        fontSize: 12,
        marginTop: 4,
    },
});