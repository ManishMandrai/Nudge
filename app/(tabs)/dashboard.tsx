import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

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
};

const QUOTES = [
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
  { text: "You don't rise to the level of your goals, you fall to the level of your systems.", author: "James Clear" },
  { text: "An investment in yourself pays the best interest.", author: "Benjamin Franklin" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "The hard days are what make you stronger.", author: "Aly Raisman" },
  { text: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Little by little, a little becomes a lot.", author: "Tanzanian Proverb" },
  { text: "Show up every day. That's the whole game.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Consistency is the true foundation of trust.", author: "Roy T. Bennett" },
  { text: "It's not about perfect. It's about effort.", author: "Jillian Michaels" },
  { text: "Be the person your future self will thank.", author: "Unknown" },
  { text: "Every expert was once a beginner.", author: "Unknown" },
  { text: "You are one decision away from a completely different life.", author: "Unknown" },
];

function getTodayQuote() {
  const day = new Date().getDay() + new Date().getDate();
  return QUOTES[day % QUOTES.length];
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

export default function DashboardScreen() {
  const [userName, setUserName] = useState('');
  const [habits, setHabits] = useState<string[]>([]);
  const [totalDays, setTotalDays] = useState(0);
  const [weekDays, setWeekDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [weekCount, setWeekCount] = useState(0);
  const [bestHabit, setBestHabit] = useState('');
  const [hasData, setHasData] = useState(false);
  const [checkedToday, setCheckedToday] = useState(false);
  const quote = getTodayQuote();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const name = await AsyncStorage.getItem('userName');
    const habitsRaw = await AsyncStorage.getItem('habits');
    if (name) setUserName(name);
    if (habitsRaw) setHabits(JSON.parse(habitsRaw));

    const last7 = getLast7Days();
    const today = last7[6];

    let total = 0;
    let weekDone: boolean[] = [];
    let habitScores: Record<string, number> = {};
    let foundData = false;

    for (let i = 0; i < last7.length; i++) {
      const raw = await AsyncStorage.getItem(`checkin_${last7[i]}`);
      if (raw) {
        foundData = true;
        total++;
        weekDone.push(true);
        const record = JSON.parse(raw);
        Object.entries(record).forEach(([habit, done]) => {
          if (done) habitScores[habit] = (habitScores[habit] || 0) + 1;
        });
      } else {
        weekDone.push(false);
      }
    }

    // check all time total
    let allTotal = 0;
    const allKeys = await AsyncStorage.getAllKeys();
    const checkinKeys = allKeys.filter(k => k.startsWith('checkin_'));
    allTotal = checkinKeys.length;

    const todayRaw = await AsyncStorage.getItem(`checkin_${today}`);
    setCheckedToday(!!todayRaw);
    setTotalDays(allTotal);
    setWeekDays(weekDone);
    setWeekCount(weekDone.filter(Boolean).length);
    setHasData(foundData);

    const best = Object.entries(habitScores).sort((a, b) => b[1] - a[1])[0];
    setBestHabit(best ? best[0] : '');
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
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{userName || 'friend'} 🌙</Text>
            <Text style={styles.date}>{formatDate()}</Text>
          </View>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push('/menu')}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>

        {/* Week dots */}
        <Text style={styles.sectionLabel}>THIS WEEK</Text>
        <View style={styles.dotsRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <View key={i} style={styles.dotWrap}>
              <View style={[styles.dot, weekDays[i] && styles.dotDone]} />
              <Text style={styles.dotLabel}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{totalDays}</Text>
            <Text style={styles.statLabel}>days in</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{weekCount}/7</Text>
            <Text style={styles.statLabel}>this week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { fontSize: bestHabit.length > 5 ? 14 : 22 }]}>
              {bestHabit || '—'}
            </Text>
            <Text style={styles.statLabel}>best habit</Text>
          </View>
        </View>

        {/* Hint if less than 7 days */}
        {!hasData || totalDays < 7 ? (
          <Text style={styles.hintText}>
            {totalDays === 0
              ? 'Complete your first check-in tonight to start tracking.'
              : `${7 - totalDays} more days until your full stats appear.`}
          </Text>
        ) : null}

        {/* Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        </View>

        {/* Check-in button */}
        <TouchableOpacity
          style={[styles.checkinCard, checkedToday && styles.checkinCardDone]}
          onPress={() => router.push('/checkin')}
        >
          <View>
            <Text style={[styles.checkinTitle, checkedToday && styles.checkinTitleDone]}>
              {checkedToday ? 'Done for tonight ✓' : "Tonight's check-in"}
            </Text>
            <Text style={[styles.checkinSub, checkedToday && styles.checkinSubDone]}>
              {checkedToday ? 'Tap to review' : 'Takes 30 seconds'}
            </Text>
          </View>
          <Text style={[styles.checkinArrow, checkedToday && { color: C.muted }]}>→</Text>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  greeting: { fontSize: 13, color: C.hint },
  name: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 2 },
  date: { fontSize: 12, color: C.faint, marginTop: 2 },

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

  sectionLabel: {
    fontSize: 10,
    color: C.faint,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dotWrap: { alignItems: 'center', gap: 6 },
  dot: {
    width: 32,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  dotDone: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  dotLabel: { fontSize: 10, color: C.faint },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '700',
    color: C.accent,
  },
  statLabel: {
    fontSize: 10,
    color: C.hint,
    marginTop: 4,
  },

  hintText: {
    fontSize: 12,
    color: C.faint,
    marginBottom: 20,
    fontStyle: 'italic',
  },

  quoteCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  quoteText: {
    fontSize: 13,
    color: C.muted,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 11,
    color: C.faint,
    marginTop: 10,
  },

  checkinCard: {
    backgroundColor: C.accent,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkinCardDone: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  checkinTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.accentDark,
  },
  checkinTitleDone: {
    color: C.muted,
  },
  checkinSub: {
    fontSize: 12,
    color: '#78350f',
    marginTop: 3,
  },
  checkinSubDone: {
    color: C.faint,
  },
  checkinArrow: {
    fontSize: 22,
    color: C.accentDark,
    fontWeight: '700',
  },
});