import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, TouchableWithoutFeedback, Linking
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.72;

const C = {
  bg: '#0c0a09',
  surface: '#1c1917',
  border: '#292524',
  accent: '#f59e0b',
  text: '#fafaf9',
  muted: '#a8a29e',
  hint: '#78716c',
  faint: '#57534e',
};

const MENU_ITEMS = [
  { label: 'Home', route: '/dashboard' },
  { label: 'Check-in', route: '/checkin' },
  { label: 'Progress', route: '/progress' },
  { label: 'Settings', route: '/settings' },
];

export default function MenuScreen() {
  const [userName, setUserName] = useState('');
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadName();
    openDrawer();
  }, []);

  const loadName = async () => {
    const name = await AsyncStorage.getItem('userName');
    if (name) setUserName(name);
  };

  const openDrawer = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (afterClose?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (afterClose) afterClose();
    });
  };

  const handleClose = () => closeDrawer(() => router.back());
  const handleNavigate = (route: string) => closeDrawer(() => router.replace(route as any));

  return (
    <View style={styles.root}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.drawerInner}>

            {/* Close button */}
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            {/* User greeting */}
            <View style={styles.userSection}>
              <Text style={styles.userGreeting}>Hello,</Text>
              <Text style={styles.userName}>{userName || 'friend'} 🌙</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Menu items */}
            <View style={styles.itemsSection}>
              {MENU_ITEMS.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.menuItem}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            {/* About */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/about')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuLabel}>About</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            {/* Bottom credit */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://devmanishhh.vercel.app/')}
              >
                <Text style={styles.credit}>Built with ❤️ by Manish</Text>
                <Text style={styles.creditLink}>devmanishhh.vercel.app ↗</Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: C.surface,
    borderRightWidth: 1,
    borderRightColor: C.border,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  drawerInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 8,
  },
  closeBtnText: {
    color: C.hint,
    fontSize: 16,
  },
  userSection: {
    marginBottom: 24,
    paddingTop: 4,
  },
  userGreeting: {
    fontSize: 13,
    color: C.hint,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },
  itemsSection: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  menuLabel: {
    fontSize: 16,
    color: C.muted,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 14,
    color: C.border,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  credit: {
    fontSize: 12,
    color: C.faint,
    marginBottom: 4,
  },
  creditLink: {
    fontSize: 12,
    color: C.accent,
  },
});