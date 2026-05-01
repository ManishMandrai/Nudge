import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type DayRecord = Record<string, boolean>;

export default function ProgressScreen() {
  const [habits, setHabits] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const habitsRaw = await AsyncStorage.getItem('habits');
    if (!habitsRaw) return;
    const parsedHabits = JSON.parse(habitsRaw);
    setHabits(parsedHabits);

    // Get last 7 days
    const last7: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7.push(d.toISOString().split('T')[0]);
    }
    setDays(last7);

    // Load each day's record
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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>📊</Text>
      <Text style={styles.title}>Your progress</Text>
      <Text style={styles.subtitle}>Last 7 days</Text>

      {habits.length === 0 ? (
        <Text style={styles.empty}>No habits found. Set up your habits first.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableScroll}>
          <View>
            {/* Header row */}
            <View style={styles.row}>
              <View style={styles.habitLabelCell}>
                <Text style={styles.headerText}>Habit</Text>
              </View>
              {days.map(day => (
                <View key={day} style={styles.dayCell}>
                  <Text style={styles.dayText}>{formatDay(day)}</Text>
                </View>
              ))}
            </View>

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
                        {done === true && <Text style={styles.dotText}>✓</Text>}
                        {done === false && <Text style={styles.dotMissedText}>·</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            {/* Score row */}
            <View style={[styles.row, { marginTop: 8 }]}>
              <View style={styles.habitLabelCell}>
                <Text style={styles.headerText}>Score</Text>
              </View>
              {days.map(day => (
                <View key={day} style={styles.dayCell}>
                  <Text style={styles.scoreText}>
                    {records[day] ? `${getScore(day)}/${habits.length}` : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Back to check-in</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: '#0f0f1a' },
  container: {
    padding: 24,
    paddingTop: 80,
    alignItems: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8888aa',
    marginBottom: 32,
  },
  empty: {
    color: '#666688',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  tableScroll: { width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  habitLabelCell: {
    width: 100,
    paddingRight: 8,
  },
  habitLabel: {
    color: '#aaaacc',
    fontSize: 13,
  },
  headerText: {
    color: '#666688',
    fontSize: 12,
    fontWeight: '600',
  },
  dayCell: {
    width: 52,
    alignItems: 'center',
  },
  dayText: {
    color: '#666688',
    fontSize: 11,
    textAlign: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: '#7c7cff',
  },
  dotMissed: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  dotEmpty: {
    backgroundColor: '#141420',
    borderWidth: 1,
    borderColor: '#1e1e30',
  },
  dotText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  dotMissedText: {
    color: '#444466',
    fontSize: 20,
  },
  scoreText: {
    color: '#8888aa',
    fontSize: 12,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 40,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  backBtnText: {
    color: '#7c7cff',
    fontSize: 15,
  },
});