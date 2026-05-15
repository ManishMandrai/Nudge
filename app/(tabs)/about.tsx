import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Linking } from 'react-native';
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

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        {/* Main content */}
        <View style={styles.content}>

          {/* App identity */}
          <Text style={styles.appIcon}>🌙</Text>
          <Text style={styles.appName}>HabitNudge</Text>
          <Text style={styles.appVersion}>Version 1.0</Text>

          <View style={styles.divider} />

          {/* Philosophy */}
          <Text style={styles.philosophy}>
            "One quiet check-in every evening.{'\n'}No guilt. No streaks. Just you."
          </Text>

          <View style={styles.divider} />

          {/* Built by */}
          <Text style={styles.builtLabel}>BUILT BY</Text>
          <Text style={styles.builtName}>Manish</Text>

          <TouchableOpacity
            style={styles.portfolioBtn}
            onPress={() => Linking.openURL('https://devmanishhh.vercel.app/')}
          >
            <Text style={styles.portfolioBtnText}>devmanishhh.vercel.app ↗</Text>
          </TouchableOpacity>

        </View>

        {/* Footer */}
        <Text style={styles.footer}>Made with 💛 for the ones who are trying</Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 44,
    paddingBottom: 40,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 4,
    marginBottom: 0,
  },
  backBtnText: { color: C.muted, fontSize: 15 },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },

  appIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
  },
  appVersion: {
    fontSize: 13,
    color: C.faint,
    marginBottom: 32,
  },

  divider: {
    width: 40,
    height: 1,
    backgroundColor: C.border,
    marginVertical: 28,
  },

  philosophy: {
    fontSize: 15,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
  },

  builtLabel: {
    fontSize: 10,
    color: C.faint,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  builtName: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 16,
  },
  portfolioBtn: {
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  portfolioBtnText: {
    color: C.accent,
    fontSize: 14,
  },

  footer: {
    fontSize: 12,
    color: C.faint,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});