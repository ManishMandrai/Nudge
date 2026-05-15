import { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet,
    TouchableOpacity, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

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

type DayRecord = Record<string, boolean>;

export default function ProgressScreen() {
    const [habits, setHabits] = useState<string[]>([]);
    const [records, setRecords] = useState<Record<string, DayRecord>>({});
    const [days, setDays] = useState<string[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadProgress();
        }, [])
    );

    const loadProgress = async () => {
        const habitsRaw = await AsyncStorage.getItem('habits');
        if (!habitsRaw) return;
        const parsedHabits = JSON.parse(habitsRaw);
        setHabits(parsedHabits);

        const last7: string[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7.push(d.toISOString().split('T')[0]);
        }
        setDays(last7);

        const allRecords: Record<string, DayRecord> = {};
        for (const day of last7) {
            const raw = await AsyncStorage.getItem(`checkin_${day}`);
            if (raw) allRecords[day] = JSON.parse(raw);
        }
        setRecords(allRecords);
    };

    const formatDay = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
    };

    const getScore = (day: string) => {
        const record = records[day];
        if (!record) return 0;
        return Object.values(record).filter(Boolean).length;
    };

    const getTotalCompleted = () => {
        let total = 0;
        Object.values(records).forEach(record => {
            total += Object.values(record).filter(Boolean).length;
        });
        return total;
    };

    const getDaysCheckedIn = () => {
        return Object.keys(records).length;
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}



                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>⬅</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Progress</Text>
                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={() => router.push('/menu')}
                    >
                        <View style={styles.menuLine} />
                        <View style={styles.menuLine} />
                        <View style={styles.menuLine} />
                    </TouchableOpacity>
                </View>


                <Text style={styles.subtitle}>Last 7 days</Text>

                {habits.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyEmoji}>🌱</Text>
                        <Text style={styles.emptyText}>No habits yet.</Text>
                        <Text style={styles.emptySubText}>Complete your first check-in to see progress.</Text>
                    </View>
                ) : (
                    <>
                        {/* Quick stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <Text style={styles.statNum}>{getDaysCheckedIn()}</Text>
                                <Text style={styles.statLabel}>days this week</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Text style={styles.statNum}>{getTotalCompleted()}</Text>
                                <Text style={styles.statLabel}>habits done</Text>
                            </View>
                        </View>

                        {/* Table */}
                        <View style={styles.tableCard}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View>
                                    {/* Header row */}
                                    <View style={styles.row}>
                                        <View style={styles.habitLabelCell}>
                                            <Text style={styles.headerText}>HABIT</Text>
                                        </View>
                                        {days.map(day => (
                                            <View key={day} style={styles.dayCell}>
                                                <Text style={styles.dayText}>{formatDay(day)}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Divider */}
                                    <View style={styles.divider} />

                                    {/* Habit rows */}
                                    {habits.map((habit, hi) => (
                                        <View key={hi} style={styles.row}>
                                            <View style={styles.habitLabelCell}>
                                                <Text style={styles.habitLabel} numberOfLines={1}>{habit}</Text>
                                            </View>
                                            {days.map(day => {
                                                const record = records[day];
                                                const done = record ? record[habit] === true : null;
                                                return (
                                                    <View key={day} style={styles.dayCell}>
                                                        <View style={[
                                                            styles.dot,
                                                            done === true && styles.dotDone,
                                                            done === false && styles.dotMissed,
                                                            done === null && styles.dotEmpty,
                                                        ]}>
                                                            {done === true && (
                                                                <Text style={styles.dotText}>✓</Text>
                                                            )}
                                                            {done === false && (
                                                                <Text style={styles.dotMissedText}>·</Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ))}

                                    {/* Divider */}
                                    <View style={styles.divider} />

                                    {/* Score row */}
                                    <View style={styles.row}>
                                        <View style={styles.habitLabelCell}>
                                            <Text style={styles.headerText}>SCORE</Text>
                                        </View>
                                        {days.map(day => (
                                            <View key={day} style={styles.dayCell}>
                                                <Text style={styles.scoreText}>
                                                    {records[day] ? `${getScore(day)}/${habits.length}` : '—'}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </ScrollView>
                        </View>

                        {/* Legend */}
                        <View style={styles.legendRow}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: C.accent }]} />
                                <Text style={styles.legendText}>Completed</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }]} />
                                <Text style={styles.legendText}>Missed</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border }]} />
                                <Text style={styles.legendText}>No data</Text>
                            </View>
                        </View>
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    scroll: { flex: 1 },
    container: {
        padding: 24,
        paddingTop: 60,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    backBtn: { padding: 4 },
    backBtnText: { color: C.muted, fontSize: 15 },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: C.text,
    },

    subtitle: {
        fontSize: 13,
        color: C.faint,
        marginBottom: 24,
    },

    emptyWrap: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyEmoji: { fontSize: 48, marginBottom: 16 },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: C.muted,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 13,
        color: C.faint,
        textAlign: 'center',
    },

    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: C.border,
    },
    statNum: {
        fontSize: 26,
        fontWeight: '700',
        color: C.accent,
    },
    statLabel: {
        fontSize: 11,
        color: C.hint,
        marginTop: 4,
    },

    tableCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        marginBottom: 16,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    habitLabelCell: {
        width: 90,
        paddingRight: 8,
    },
    habitLabel: {
        color: C.muted,
        fontSize: 13,
    },
    headerText: {
        color: C.faint,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 1,
    },
    dayCell: {
        width: 48,
        alignItems: 'center',
    },
    dayText: {
        color: C.faint,
        fontSize: 10,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: C.border,
        marginVertical: 8,
    },
    dot: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotDone: {
        backgroundColor: C.accent,
    },
    dotMissed: {
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
    },
    dotEmpty: {
        backgroundColor: C.bg,
        borderWidth: 1,
        borderColor: C.border,
    },
    dotText: {
        color: C.accentDark,
        fontSize: 13,
        fontWeight: '700',
    },
    dotMissedText: {
        color: C.faint,
        fontSize: 20,
    },
    scoreText: {
        color: C.hint,
        fontSize: 12,
        textAlign: 'center',
    },

    legendRow: {
        flexDirection: 'row',
        gap: 16,
        justifyContent: 'center',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 3,
    },
    legendText: {
        fontSize: 11,
        color: C.faint,
    },
    menuBtn: {
        width: 40,
        height: 40,
        backgroundColor: C.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    menuLine: {
        width: 18,
        height: 1.5,
        backgroundColor: C.muted,
        borderRadius: 2,
    },
});