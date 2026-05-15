import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { checkBackupExists, restoreBackup, getBackupInfo } from '../../utils/backup';

const C = {
  bg: '#0c0a09',
  surface: '#1c1917',
  border: '#44403c',
  borderWarm: '#92400e',
  accent: '#f59e0b',
  accentDark: '#0c0a09',
  text: '#fafaf9',
  muted: '#a8a29e',
  hint: '#78716c',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
      title: '🌙 Nudge',
      body: "Your evening check-in is waiting. How did today go?",
      sound: true,
      data: { screen: 'checkin' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: notifHour,
      minute: notifMinute,
    },
  });
}

function StepDots({ current }: { current: number }) {
  return (
    <View style={styles.dotsRow}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [habits, setHabits] = useState<string[]>(['', '', '']);
  const [sleepTime, setSleepTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [nameError, setNameError] = useState('');
  const [backupExists, setBackupExists] = useState(false);
  const [backupDate, setBackupDate] = useState('');
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    checkForBackup();
  }, []);

  const checkForBackup = async () => {
    const exists = await checkBackupExists();
    setBackupExists(exists);
    if (exists) {
      const info = await getBackupInfo();
      if (info) {
        const date = new Date(info.savedAt).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        setBackupDate(date);
      }
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const success = await restoreBackup();
    if (success) {
      router.replace('/dashboard');
    } else {
      setNameError('Could not restore backup. Please set up fresh.');
      setRestoring(false);
    }
  };

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getNudgeTime = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - 30);
    return formatTime(d);
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
    if (habits.length <= 3) return;
    setHabits(habits.filter((_, i) => i !== index));
  };

  const goNext = () => {
    if (step === 0) {
      if (!name.trim()) { setNameError('What should we call you?'); return; }
      setNameError('');
      setStep(1);
    } else if (step === 1) {
      const filled = habits.filter(h => h.trim() !== '');
      if (filled.length < 1) { setNameError('Add at least one habit.'); return; }
      setNameError('');
      setStep(2);
    }
  };

  const handleFinish = async () => {
    const filledHabits = habits.filter(h => h.trim() !== '');
    await AsyncStorage.setItem('userName', name.trim());
    await AsyncStorage.setItem('habits', JSON.stringify(filledHabits));
    await AsyncStorage.setItem('sleepTime', formatTime(sleepTime));
    await AsyncStorage.setItem('onboarded', 'true');

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      router.replace('/dashboard');
      return;
    }
    await scheduleNightlyNotification(formatTime(sleepTime));
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>

          {/* Step 1 — Name */}
          {step === 0 && (
            <View style={styles.stepWrap}>
              <StepDots current={0} />
              <Text style={styles.bigEmoji}>🌙</Text>
              <Text style={styles.title}>Hey there.</Text>
              <Text style={styles.titleAccent}>What's your name?</Text>
              <Text style={styles.subtitle}>
                No account. No email.{'\n'}Just you and your evenings.
              </Text>

              {/* Backup restore card */}
              {backupExists && (
                <TouchableOpacity
                  style={styles.restoreCard}
                  onPress={handleRestore}
                  disabled={restoring}
                >
                  <Text style={styles.restoreTitle}>
                    {restoring ? '⏳ Restoring...' : '🔄 Restore previous data'}
                  </Text>
                  <Text style={styles.restoreSub}>
                    Backup found from {backupDate}
                  </Text>
                </TouchableOpacity>
              )}

              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={C.hint}
                value={name}
                onChangeText={text => { setName(text); setNameError(''); }}
                returnKeyType="done"
                onSubmitEditing={goNext}
              />

              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}

              <TouchableOpacity style={styles.primaryBtn} onPress={goNext}>
                <Text style={styles.primaryBtnText}>That's me →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2 — Habits */}
          {step === 1 && (
            <View style={styles.stepWrap}>
              <StepDots current={1} />
              <Text style={styles.bigEmoji}>✦</Text>
              <Text style={styles.title}>What do you want</Text>
              <Text style={styles.titleAccent}>to do each day?</Text>
              <Text style={styles.subtitle}>3 to 6 small things. Keep it honest.</Text>

              <View style={{ marginTop: 16 }}>
                {habits.map((habit, i) => (
                  <View key={i} style={styles.habitRow}>
                    <TextInput
                      style={styles.habitInput}
                      placeholder={`Habit ${i + 1}`}
                      placeholderTextColor={C.hint}
                      value={habit}
                      onChangeText={text => updateHabit(text, i)}
                      returnKeyType="next"
                    />
                    {habits.length > 3 && (
                      <TouchableOpacity onPress={() => removeHabit(i)} style={styles.removeBtn}>
                        <Text style={styles.removeBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {habits.length < 6 && (
                  <TouchableOpacity onPress={addHabit} style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+ Add another habit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}

              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => setStep(0)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtnSmall} onPress={goNext}>
                  <Text style={styles.primaryBtnText}>Looks good →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3 — Sleep time */}
          {step === 2 && (
            <View style={styles.stepWrap}>
              <StepDots current={2} />
              <Text style={styles.bigEmoji}>⏰</Text>
              <Text style={styles.title}>When do you</Text>
              <Text style={styles.titleAccent}>usually sleep?</Text>
              <Text style={styles.subtitle}>
                We'll nudge you 20–40 min before this.{'\n'}Every single night.
              </Text>

              <TouchableOpacity
                style={styles.timeCard}
                onPress={() => setShowPicker(true)}
              >
                <View>
                  <Text style={styles.timeBig}>{formatTime(sleepTime)}</Text>
                  <Text style={styles.timeHint}>tap to change</Text>
                </View>
                <Text style={{ fontSize: 28 }}>🌙</Text>
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

              <View style={styles.nudgePreview}>
                <Text style={styles.nudgeLabel}>Your first nudge tonight</Text>
                <Text style={styles.nudgeTime}>~{getNudgeTime(sleepTime)}</Text>
              </View>

              <View style={styles.navRow}>
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtnSmall} onPress={handleFinish}>
                  <Text style={styles.primaryBtnText}>I'm ready 🌙</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 40 },
  stepWrap: { flex: 1, paddingBottom: 40 },

  dotsRow: { flexDirection: 'row', gap: 6, marginBottom: 40 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { width: 20, borderRadius: 3, backgroundColor: C.accent },

  bigEmoji: { fontSize: 40, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: C.text, lineHeight: 36 },
  titleAccent: { fontSize: 28, fontWeight: '700', color: C.accent, lineHeight: 36, marginBottom: 12 },
  subtitle: { fontSize: 14, color: C.hint, lineHeight: 22, marginBottom: 28 },

  restoreCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderWarm,
    padding: 16,
    marginBottom: 16,
  },
  restoreTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.accent,
    marginBottom: 4,
  },
  restoreSub: {
    fontSize: 12,
    color: C.hint,
  },

  input: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    color: C.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },

  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 4,
  },

  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitInput: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    color: C.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.border,
  },
  removeBtn: { marginLeft: 8, padding: 8 },
  removeBtnText: { color: C.hint, fontSize: 14 },
  addBtn: { paddingVertical: 10 },
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
    marginBottom: 16,
  },
  timeBig: { fontSize: 36, fontWeight: '700', color: C.accent },
  timeHint: { fontSize: 11, color: C.hint, marginTop: 4 },

  nudgePreview: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 8,
  },
  nudgeLabel: { fontSize: 12, color: C.hint },
  nudgeTime: { fontSize: 20, fontWeight: '700', color: C.accent, marginTop: 4 },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
  },
  backBtn: { padding: 8 },
  backBtnText: { color: C.muted, fontSize: 15 },

  primaryBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryBtnSmall: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: C.accentDark,
    fontSize: 16,
    fontWeight: '700',
  },
});