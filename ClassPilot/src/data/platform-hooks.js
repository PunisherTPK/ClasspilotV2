const React = require('react');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
const LocalAuthentication = require('expo-local-authentication');

const DB_KEY = 'classpilot-local-tables-v1';
const SETTINGS_PREFIX = 'classpilot-setting:';
const TABLES = ['institutes', 'classes', 'students', 'enrolments', 'sessions', 'attendance_records'];
const emptyTables = () => Object.fromEntries(TABLES.map((table) => [table, []]));
let tables = emptyTables();
let settings = {};
let ready = false;
let loading;
const listeners = new Set();
const settingListeners = new Map();

function notify() {
  listeners.forEach((listener) => listener());
}

async function load() {
  if (ready) return;
  if (!loading) {
    loading = (async () => {
      try {
        const rawTables = await AsyncStorage.getItem(DB_KEY);
        if (rawTables) {
          const parsed = JSON.parse(rawTables);
          tables = { ...emptyTables(), ...parsed };
        }
        const keys = await AsyncStorage.getAllKeys();
        const savedSettings = keys.filter((key) => key.startsWith(SETTINGS_PREFIX));
        const values = await AsyncStorage.multiGet(savedSettings);
        settings = Object.fromEntries(values.map(([key, value]) => [key.slice(SETTINGS_PREFIX.length), value ? JSON.parse(value) : null]));
      } catch (error) {
        console.warn('Could not load saved ClassPilot data.', error);
      } finally {
        ready = true;
        notify();
        settingListeners.forEach((set) => set.forEach((listener) => listener()));
      }
    })();
  }
  return loading;
}

load();

function useQuery(table) {
  const data = React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => tables[table] || [],
    () => tables[table] || [],
  );
  return { data, refetch: () => load().then(() => tables[table] || []) };
}

function saveTables() {
  AsyncStorage.setItem(DB_KEY, JSON.stringify(tables)).catch((error) => console.warn('Could not save ClassPilot data.', error));
  notify();
}

function useMutation(table, operation) {
  return {
    mutate: (payload) => load().then(() => {
      if (!TABLES.includes(table)) throw new Error(`Unknown ClassPilot table: ${table}`);
      if (operation === 'insert') {
        const row = { ...payload, id: payload.id || `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
        tables = { ...tables, [table]: [...(tables[table] || []), row] };
        saveTables();
        return row;
      }
      if (operation === 'update') {
        const { id, data } = payload;
        let updated;
        tables = {
          ...tables,
          [table]: (tables[table] || []).map((row) => {
            if (row.id !== id) return row;
            updated = { ...row, ...data };
            return updated;
          }),
        };
        saveTables();
        return updated;
      }
      throw new Error(`Unsupported ClassPilot operation: ${operation}`);
    }),
  };
}

function normalizeDate(value) {
  const match = /^@day\((-?\d+)\)$/.exec(String(value || ''));
  if (!match) return value;
  const date = new Date();
  date.setDate(date.getDate() + Number(match[1]));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function seedSampleRows(sampleRows) {
  load().then(() => {
    let changed = false;
    const next = { ...tables };
    Object.entries(sampleRows).forEach(([table, rows]) => {
      if (!TABLES.includes(table) || (next[table] || []).length || !Array.isArray(rows)) return;
      next[table] = rows.map((row, index) => {
        const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeDate(value)]));
        return { ...normalized, id: `sample-${table}-${index + 1}` };
      });
      changed = true;
    });
    if (changed) {
      tables = next;
      saveTables();
    }
  });
}

function useStorage(key, defaultValue) {
  if (!Object.prototype.hasOwnProperty.call(settings, key)) settings = { ...settings, [key]: defaultValue };
  const subscribe = React.useCallback((listener) => {
    if (!settingListeners.has(key)) settingListeners.set(key, new Set());
    const set = settingListeners.get(key);
    set.add(listener);
    return () => set.delete(listener);
  }, [key]);
  const value = React.useSyncExternalStore(
    subscribe,
    () => (Object.prototype.hasOwnProperty.call(settings, key) ? settings[key] : defaultValue),
    () => defaultValue,
  );
  const setValue = React.useCallback((nextValue) => {
    const resolved = typeof nextValue === 'function' ? nextValue(Object.prototype.hasOwnProperty.call(settings, key) ? settings[key] : defaultValue) : nextValue;
    settings = { ...settings, [key]: resolved };
    AsyncStorage.setItem(`${SETTINGS_PREFIX}${key}`, JSON.stringify(resolved)).catch((error) => console.warn('Could not save ClassPilot settings.', error));
    settingListeners.get(key)?.forEach((listener) => listener());
  }, [key, defaultValue]);
  return [value, setValue];
}

function useBiometrics() {
  const [isBiometricsAvailable, setAvailable] = React.useState(false);
  React.useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then(async (hardware) => {
      const enrolled = hardware && await LocalAuthentication.isEnrolledAsync();
      setAvailable(Boolean(enrolled));
    }).catch(() => setAvailable(false));
  }, []);
  return {
    isBiometricsAvailable,
    authenticate: async ({ promptMessage }) => {
      try {
        const result = await LocalAuthentication.authenticateAsync({ promptMessage });
        return { success: result.success, error: result.error };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },
  };
}

function useShare() {
  return { share: async () => ({ success: false, error: 'Sharing is not configured.' }) };
}

function useFilePicker() {
  return { error: null, pickFile: async () => null };
}

module.exports = { useQuery, useMutation, useStorage, seedSampleRows, useBiometrics, useShare, useFilePicker };
