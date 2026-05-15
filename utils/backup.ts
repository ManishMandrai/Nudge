import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKUP_PATH = FileSystem.documentDirectory + 'nudge_backup.json';

export async function saveBackup() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    const data: Record<string, string> = {};
    pairs.forEach(([key, value]) => {
      if (value !== null) data[key] = value;
    });

    const backup = {
      version: 1,
      savedAt: new Date().toISOString(),
      data,
    };

    await FileSystem.writeAsStringAsync(
      BACKUP_PATH,
      JSON.stringify(backup),
      { encoding: FileSystem.EncodingType.UTF8 }
    );

    console.log('✅ Backup saved:', BACKUP_PATH);
  } catch (error) {
    console.log('Backup failed:', error);
  }
}

export async function checkBackupExists(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(BACKUP_PATH);
    return info.exists;
  } catch {
    return false;
  }
}

export async function restoreBackup(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(BACKUP_PATH);
    if (!info.exists) return false;

    const raw = await FileSystem.readAsStringAsync(BACKUP_PATH);
    const backup = JSON.parse(raw);

    if (!backup.data) return false;

    const pairs: [string, string][] = Object.entries(backup.data);
    await AsyncStorage.multiSet(pairs);

    console.log('✅ Backup restored from:', backup.savedAt);
    return true;
  } catch (error) {
    console.log('Restore failed:', error);
    return false;
  }
}

export async function getBackupInfo(): Promise<{ savedAt: string } | null> {
  try {
    const info = await FileSystem.getInfoAsync(BACKUP_PATH);
    if (!info.exists) return null;
    const raw = await FileSystem.readAsStringAsync(BACKUP_PATH);
    const backup = JSON.parse(raw);
    return { savedAt: backup.savedAt };
  } catch {
    return null;
  }
}