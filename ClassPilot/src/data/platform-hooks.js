const React = require('react');
const AsyncStorageModule = require('@react-native-async-storage/async-storage');
const AsyncStorage = AsyncStorageModule.default || AsyncStorageModule;
const LocalAuthentication = require('expo-local-authentication');
const FileSystem = require('expo-file-system/legacy');
const DocumentPicker = require('expo-document-picker');
const Sharing = require('expo-sharing');

const DB_KEY = 'classpilot-local-tables-v2';
const LEGACY_DB_KEY = 'classpilot-local-tables-v1';
const BACKUP_VERSION = 1;
const SETTINGS_PREFIX = 'classpilot-setting:';
const TABLES = ['institutes', 'classes', 'students', 'enrolments', 'sessions', 'attendance_records', 'holidays', 'fee_obligations', 'payments', 'payment_allocations', 'teaching_hours', 'correction_history'];
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
        const rawTables = await AsyncStorage.getItem(DB_KEY) || await AsyncStorage.getItem(LEGACY_DB_KEY);
        let hasEmbeddedSettings = false;
        if (rawTables) {
          const parsed = JSON.parse(rawTables);
          if (parsed && parsed.format === 'classpilot-local' && parsed.version === 2 && parsed.tables) {
            tables = { ...emptyTables(), ...parsed.tables };
            settings = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {};
            hasEmbeddedSettings = true;
          } else tables = { ...emptyTables(), ...parsed };
        }
        if (!hasEmbeddedSettings) {
          const keys = await AsyncStorage.getAllKeys();
          const savedSettings = keys.filter((key) => key.startsWith(SETTINGS_PREFIX));
          const values = await AsyncStorage.multiGet(savedSettings);
          settings = Object.fromEntries(values.map(([key, value]) => [key.slice(SETTINGS_PREFIX.length), value ? JSON.parse(value) : null]));
        }
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

function useDatabaseReady() {
  return React.useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => ready,
    () => false,
  );
}

let writeQueue = Promise.resolve();
function saveTables() {
  const snapshot = JSON.stringify({ format: 'classpilot-local', version: 2, tables, settings });
  writeQueue = writeQueue.then(() => AsyncStorage.setItem(DB_KEY, snapshot));
  return writeQueue;
}

function validateBackup(value) {
  if (!value || value.format !== 'classpilot-backup' || value.version !== BACKUP_VERSION || !value.tables || typeof value.tables !== 'object') {
    throw new Error('This file is not a supported ClassPilot backup. Your current data has not changed.');
  }
  const next = emptyTables();
  TABLES.forEach((table) => {
    const rows = value.tables[table] === undefined ? [] : value.tables[table];
    if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string')) {
      throw new Error(`The backup has invalid ${table} records. Your current data has not changed.`);
    }
    next[table] = rows;
  });
  const ids = {};
  TABLES.forEach((table) => {
    ids[table] = new Set();
    next[table].forEach((row) => {
      if (ids[table].has(row.id)) throw new Error(`The backup contains duplicate ${table} IDs. Your current data has not changed.`);
      ids[table].add(row.id);
    });
  });
  const reference = (table, id) => ids[table].has(id);
  const validCurrency = (code) => {
    try { new Intl.NumberFormat('en', { style: 'currency', currency: String(code || '').toUpperCase() }); return /^[A-Z]{3}$/.test(String(code || '').toUpperCase()); }
    catch (error) { return false; }
  };
  next.classes.forEach((row) => { if (row.institute_id && !reference('institutes', row.institute_id)) throw new Error('A class refers to a missing institute. Your current data has not changed.'); });
  next.enrolments.forEach((row) => { if (!reference('classes', row.class_id) || !reference('students', row.student_id)) throw new Error('An enrolment refers to a missing class or student. Your current data has not changed.'); });
  next.sessions.forEach((row) => { if (!reference('classes', row.class_id) || (row.original_session_id && !reference('sessions', row.original_session_id))) throw new Error('A session refers to a missing class or original session. Your current data has not changed.'); });
  next.attendance_records.forEach((row) => { if (!reference('sessions', row.session_id) || !reference('enrolments', row.enrolment_id) || !['present', 'absent', 'unmarked'].includes(row.attendance_status)) throw new Error('An attendance record is invalid. Your current data has not changed.'); });
  next.fee_obligations.forEach((row) => { if (!reference('enrolments', row.enrolment_id) || !Number.isFinite(Number(row.amount)) || Number(row.amount) <= 0 || !validCurrency(row.currency)) throw new Error('A fee obligation is invalid. Your current data has not changed.'); });
  next.payments.forEach((row) => { if (!Number.isFinite(Number(row.amount)) || Number(row.amount) <= 0 || !validCurrency(row.currency) || !['cash', 'bank transfer', 'other'].includes(row.method)) throw new Error('A payment record is invalid. Your current data has not changed.'); });
  const allocatedTotals = {};
  next.payment_allocations.forEach((row) => {
    const payment = next.payments.find((item) => item.id === row.payment_id);
    const obligation = next.fee_obligations.find((item) => item.id === row.obligation_id);
    if (!payment || !obligation || String(payment.currency).toUpperCase() !== String(obligation.currency).toUpperCase() || !Number.isFinite(Number(row.amount)) || Number(row.amount) <= 0) throw new Error('A payment allocation is invalid. Your current data has not changed.');
    allocatedTotals[row.obligation_id] = (allocatedTotals[row.obligation_id] || 0) + Number(row.amount);
  });
  next.fee_obligations.forEach((row) => { if ((allocatedTotals[row.id] || 0) > Number(row.amount)) throw new Error('A payment allocation exceeds its fee obligation. Your current data has not changed.'); });
  next.teaching_hours.forEach((row) => { if (!reference('sessions', row.session_id) || !Number.isFinite(Number(row.duration_minutes)) || Number(row.duration_minutes) <= 0) throw new Error('A teaching-hour record is invalid. Your current data has not changed.'); });
  next.holidays.forEach((row) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.date || ''))) throw new Error('A holiday date is invalid. Your current data has not changed.'); });
  if (value.settings && (typeof value.settings !== 'object' || Array.isArray(value.settings))) throw new Error('The backup settings are invalid. Your current data has not changed.');
  return { tables: next, settings: value.settings || {} };
}

async function exportBackup() {
  await load();
  await writeQueue;
  return { format: 'classpilot-backup', version: BACKUP_VERSION, createdAt: new Date().toISOString(), tables: JSON.parse(JSON.stringify(tables)), settings: JSON.parse(JSON.stringify(settings)) };
}

async function restoreBackup(raw) {
  await load();
  const next = validateBackup(typeof raw === 'string' ? JSON.parse(raw) : raw);
  const oldTables = tables;
  const oldSettings = settings;
  tables = next.tables;
  settings = next.settings;
  try {
    await AsyncStorage.setItem(DB_KEY, JSON.stringify({ format: 'classpilot-local', version: 2, tables, settings }));
    notify();
    settingListeners.forEach((set) => set.forEach((listener) => listener()));
  } catch (error) {
    tables = oldTables;
    settings = oldSettings;
    throw new Error('Restore could not be saved. Your existing data is still loaded.');
  }
}

function validateBackupFile(raw) {
  return validateBackup(typeof raw === 'string' ? JSON.parse(raw) : raw);
}

function roundCurrencyAmount(amount, currency) {
  let precision = 2;
  try { precision = new Intl.NumberFormat('en', { style: 'currency', currency: String(currency).toUpperCase() }).resolvedOptions().maximumFractionDigits; }
  catch (error) { throw new Error('Enter a supported three-letter currency code.'); }
  const factor = 10 ** precision;
  return Math.round((Number(amount) + Number.EPSILON) * factor) / factor;
}

async function recordPayment(payment, allocations) {
  await load();
  const amount = roundCurrencyAmount(Number(payment && payment.amount), payment && payment.currency);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a payment amount greater than zero.');
  if (!Array.isArray(allocations) || !allocations.length) throw new Error('Choose a fee obligation for this payment.');
  const currency = String(payment.currency || '').trim().toUpperCase();
  let allocated = 0;
  allocations.forEach((allocation) => {
    const obligation = tables.fee_obligations.find((row) => row.id === allocation.obligation_id);
    if (!obligation || String(obligation.currency || '').toUpperCase() !== currency) throw new Error('Payments can only be allocated to an obligation in the same currency.');
    const previouslyAllocated = tables.payment_allocations.filter((row) => row.obligation_id === obligation.id).reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const allocationAmount = roundCurrencyAmount(Number(allocation.amount), currency);
    if (!Number.isFinite(allocationAmount) || allocationAmount <= 0 || previouslyAllocated + allocationAmount > Number(obligation.amount)) throw new Error('This allocation exceeds the obligation’s remaining balance.');
    allocated += allocationAmount;
  });
  if (roundCurrencyAmount(allocated, currency) !== amount) throw new Error('Allocate the full payment amount to one obligation.');
  const paymentRow = { ...payment, amount, currency, id: `payments-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
  const allocationRows = allocations.map((row) => ({ ...row, amount: roundCurrencyAmount(Number(row.amount), currency), payment_id: paymentRow.id, id: `payment_allocations-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }));
  const next = { ...tables, payments: [...tables.payments, paymentRow], payment_allocations: [...tables.payment_allocations, ...allocationRows] };
  const previous = tables;
  tables = next;
  try { await saveTables(); } catch (error) { tables = previous; throw error; }
  notify();
  return paymentRow;
}

async function deletePayment(paymentId) {
  await load();
  const previous = tables;
  const payment = tables.payments.find((row) => row.id === paymentId);
  const paymentAllocations = tables.payment_allocations.filter((row) => row.payment_id === paymentId);
  tables = {
    ...tables,
    payments: tables.payments.filter((row) => row.id !== paymentId),
    payment_allocations: tables.payment_allocations.filter((row) => row.payment_id !== paymentId),
    correction_history: payment ? [...tables.correction_history, { id: `correction-${Date.now()}`, entity_type: 'payment', entity_id: paymentId, action: 'deleted', before: payment, allocations: paymentAllocations, created_at: new Date().toISOString() }] : tables.correction_history,
  };
  try { await saveTables(); } catch (error) { tables = previous; throw error; }
  notify();
}

async function updatePayment(paymentId, changes) {
  await load();
  const payment = tables.payments.find((row) => row.id === paymentId);
  if (!payment) throw new Error('Payment record not found.');
  const amount = roundCurrencyAmount(Number(changes.amount), payment.currency);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a payment amount greater than zero.');
  if (changes.date && !/^\d{4}-\d{2}-\d{2}$/.test(changes.date)) throw new Error('Enter the payment date as YYYY-MM-DD.');
  if (changes.method && !['cash', 'bank transfer', 'other'].includes(changes.method)) throw new Error('Choose cash, bank transfer, or other.');
  const paymentAllocations = tables.payment_allocations.filter((row) => row.payment_id === paymentId);
  if (paymentAllocations.length !== 1) throw new Error('This payment cannot be edited because its allocation needs review.');
  const allocation = paymentAllocations[0];
  const obligation = tables.fee_obligations.find((row) => row.id === allocation.obligation_id);
  const allocatedToOthers = tables.payment_allocations.filter((row) => row.obligation_id === allocation.obligation_id && row.payment_id !== paymentId).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  if (!obligation || amount + allocatedToOthers > Number(obligation.amount)) throw new Error('The edited amount exceeds the obligation’s remaining balance.');
  const previous = tables;
  const updated = { ...payment, date: changes.date || payment.date, method: changes.method || payment.method, amount };
  tables = {
    ...tables,
    payments: tables.payments.map((row) => row.id === paymentId ? updated : row),
    payment_allocations: tables.payment_allocations.map((row) => row.id === allocation.id ? { ...row, amount } : row),
    correction_history: [...tables.correction_history, { id: `correction-${Date.now()}`, entity_type: 'payment', entity_id: paymentId, action: 'edited', before: payment, after: updated, created_at: new Date().toISOString() }],
  };
  try { await saveTables(); } catch (error) { tables = previous; throw error; }
  notify();
  return updated;
}

async function saveWeeklyTimetable(classId, rule) {
  await load();
  const classRecord = tables.classes.find((row) => row.id === classId);
  if (!classRecord || classRecord.is_archived || (classRecord.institute_id && tables.institutes.some((row) => row.id === classRecord.institute_id && row.is_archived))) throw new Error('Restore this class and institute before changing the timetable.');
  const weekdays = Array.isArray(rule.weekly_days) ? rule.weekly_days.map(Number) : [Number(rule.weekly_day)];
  if ((rule.weekly_schedule_enabled && !weekdays.length) || weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(rule.weekly_time || '')) || !Number.isFinite(Number(rule.weekly_duration_minutes)) || Number(rule.weekly_duration_minutes) <= 0 || Number(rule.weekly_duration_minutes) > 1440) throw new Error('Choose at least one weekday, a valid start time, and duration from 1 to 1440 minutes.');
  const previous = tables;
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayKey = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const attendedSessionIds = new Set(tables.attendance_records.map((row) => row.session_id));
  let sessions = tables.sessions.filter((row) => !(row.class_id === classId && row.generated_from_timetable && row.session_status === 'scheduled' && String(row.session_date || '').slice(0, 10) >= todayKey && !attendedSessionIds.has(row.id)));
  const updatedClass = { ...classRecord, weekly_schedule_enabled: !!rule.weekly_schedule_enabled, weekly_days: weekdays, weekly_day: weekdays[0], weekly_time: String(rule.weekly_time), weekly_duration_minutes: Number(rule.weekly_duration_minutes) || 60 };
  const classes = tables.classes.map((row) => row.id === classId ? updatedClass : row);
  if (updatedClass.weekly_schedule_enabled) {
    for (let offset = 0; offset < 30; offset += 1) {
      const date = new Date(todayDate);
      date.setDate(date.getDate() + offset);
      if (updatedClass.weekly_days.indexOf(date.getDay()) === -1) continue;
      const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (tables.holidays.some((row) => row.date === day)) continue;
      if (sessions.some((row) => row.class_id === classId && String(row.session_date || '').slice(0, 10) === day && row.session_type === 'regular' && row.session_status !== 'cancelled')) continue;
      sessions.push({ id: `sessions-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, class_id: classId, session_date: day, session_time: updatedClass.weekly_time, session_type: 'regular', session_status: 'scheduled', duration_minutes: updatedClass.weekly_duration_minutes, original_session_id: null, generated_from_timetable: true });
    }
  }
  tables = { ...tables, classes, sessions };
  try { await saveTables(); } catch (error) { tables = previous; throw error; }
  notify();
}

async function addHoliday(date, name) {
  await load();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00`).getTime())) throw new Error('Enter a valid holiday date as YYYY-MM-DD.');
  if (tables.holidays.some((row) => row.date === date)) throw new Error('A holiday is already recorded for this date.');
  const previous = tables;
  const id = `holidays-${Date.now()}`;
  const holiday = { id, date, name: String(name || '').trim() };
  const sessions = tables.sessions.map((row) => row.session_status === 'scheduled' && String(row.session_date || '').slice(0, 10) === date ? { ...row, session_status: 'cancelled', cancellation_reason: 'holiday', holiday_id: id } : row);
  tables = { ...tables, holidays: [...tables.holidays, holiday], sessions };
  try { await saveTables(); } catch (error) { tables = previous; throw error; }
  notify();
  return holiday;
}

function getBackupVersion() { return BACKUP_VERSION; }

/* notify is kept separate so subscriptions update only after durable writes. */
function publishTables() {
  notify();
}

function useMutation(table, operation) {
  return {
    mutate: (payload) => load().then(() => {
      if (!TABLES.includes(table)) throw new Error(`Unknown ClassPilot table: ${table}`);
      if (operation === 'insert') {
        const row = { ...payload, id: payload.id || `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
        tables = { ...tables, [table]: [...(tables[table] || []), row] };
        return saveTables().then(() => { publishTables(); return row; });
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
        return saveTables().then(() => { publishTables(); return updated; });
      }
      if (operation === 'delete') {
        const id = payload && payload.id;
        const before = (tables[table] || []).length;
        tables = { ...tables, [table]: (tables[table] || []).filter((row) => row.id !== id) };
        if ((tables[table] || []).length === before) return null;
        return saveTables().then(() => { publishTables(); return id; });
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
    saveTables().catch((error) => console.warn('Could not save ClassPilot settings.', error));
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
  return { share: async (value) => {
    try {
      const filename = `classpilot-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const uri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(value), { encoding: FileSystem.EncodingType.UTF8 });
      if (!await Sharing.isAvailableAsync()) return { success: false, error: 'File sharing is not available on this device.' };
      await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Save ClassPilot backup' });
      return { success: true };
    } catch (error) { return { success: false, error: error.message || 'Could not create the backup file.' }; }
  } };
}

function useFilePicker() {
  return { error: null, pickFile: async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/json'], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets || !result.assets[0]) return null;
    const raw = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
    validateBackupFile(raw);
    return raw;
  } };
}

module.exports = { useQuery, useMutation, useStorage, useDatabaseReady, seedSampleRows, useBiometrics, useShare, useFilePicker, exportBackup, restoreBackup, validateBackupFile, recordPayment, updatePayment, deletePayment, saveWeeklyTimetable, addHoliday, roundCurrencyAmount, getBackupVersion };
