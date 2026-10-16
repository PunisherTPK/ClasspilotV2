Warning: truncated output (original token count: 33856)
Total output lines: 1312

const ComponentFunction = function() {
  // @section:imports @depends:[]
  const React = require('react');
  const { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, StatusBar, AppState, useWindowDimensions } = require('react-native');
  const { Ionicons } = require('@expo/vector-icons');
  const { createBottomTabNavigator } = require('expo-router/js-tabs');
  const { createStackNavigator } = require('expo-router/js-stack');
  const { useSafeAreaInsets } = require('react-native-safe-area-context');
  const { useQuery, useMutation, useStorage, useDatabaseReady, useBiometrics, useShare, useFilePicker, exportBackup, restoreBackup, validateBackupFile, recordPayment, updatePayment, deletePayment, saveWeeklyTimetable, addHoliday, roundCurrencyAmount } = require('../data/platform-hooks');
  var rootPreferenceState = useStorage('classpilot-preferences', { biometricLock: false });
  var rootPreferences = rootPreferenceState[0] || { biometricLock: false };
  var databaseReady = useDatabaseReady();
  var rootBiometrics = useBiometrics();
  var unlockState = React.useState(false);
  var isUnlocked = unlockState[0];
  var setIsUnlocked = unlockState[1];
  React.useEffect(function() {
    var subscription = AppState.addEventListener('change', function(state) { if ((state === 'background' || state === 'inactive') && rootPreferences.biometricLock) setIsUnlocked(false); });
    return function() { subscription.remove(); };
  }, [rootPreferences.biometricLock]);
  var unlockApp = function() { rootBiometrics.authenticate({ promptMessage: 'Unlock ClassPilot' }).then(function(result) { if (result.success) setIsUnlocked(true); else if (result.error) notify('Could not authenticate', String(result.error)); }); };
  // @end:imports

  // @section:theme @depends:[]
  var PRIMARY = '#245B73';
  var ACCENT = '#E6A84A';
  var BACKGROUND = '#F1F5F5';
  var CARD = '#FFFFFF';
  var INK = '#18313A';
  var MUTED = '#526970';
  var BORDER = '#D7E1E2';
  var SUCCESS = '#246B57';
  var DANGER = '#A3433F';
  var TAB_MENU_HEIGHT = Platform.OS === 'web' ? 56 : 49;
  var SCROLL_EXTRA_PADDING = 16;
  var FAB_SPACING = 16;
  var visualDesign = 'A calm teaching ledger with clear status rails, restrained cards, and readable records.';
  // @end:theme

  // @section:navigation-setup @depends:[]
  var Tab = createBottomTabNavigator();
  var Stack = createStackNavigator();
  // @end:navigation-setup

  // @section:ThemeContext @depends:[theme]
  var ThemeContext = React.createContext(null);
  var ThemeProvider = function(props) {
    var darkState = React.useState(false);
    return React.createElement(ThemeContext.Provider, {
      value: {
        theme: { colors: { primary: PRIMARY, accent: ACCENT, background: BACKGROUND, card: CARD, textPrimary: INK, textSecondary: MUTED } },
        darkMode: darkState[0],
        toggleDarkMode: function() { darkState[1](!darkState[0]); },
        visualDesign: visualDesign
      }
    }, props.children);
  };
  var useTheme = function() { return React.useContext(ThemeContext); };
  // @end:ThemeContext

  // @section:helpers @depends:[theme]
  var today = function() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  var notify = function(title, message) {
    if (Platform.OS === 'web') window.alert(title + ': ' + message);
    else Alert.alert(title, message);
  };
  var confirmAction = function(message, action) {
    if (Platform.OS === 'web') {
      if (window.confirm(message)) action();
    } else Alert.alert('Confirm change', message, [{ text: 'Keep', style: 'cancel' }, { text: 'Confirm', onPress: action }]);
  };
  var labelDate = function(value) {
    if (!value) return 'Date not set';
    var parts = String(value).slice(0, 10).split('-');
    if (parts.length !== 3) return String(value);
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  };
  var validISODate = function(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
    var parts = String(value).split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2], 12);
    return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2];
  };
  var formatCurrency = function(value, currency) {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'GBP' }).format(Number(value || 0)); }
    catch (error) { return (currency || '') + ' ' + String(value || 0); }
  };
  var ScreenHeader = function(props) {
    return React.createElement(View, { style: styles.header, componentId: props.id + '-header' },
      React.createElement(View, { style: styles.headerTop, componentId: props.id + '-header-row' },
        props.onBack ? React.createElement(TouchableOpacity, { style: styles.headerIcon, onPress: props.onBack, componentId: props.id + '-back' },
          React.createElement(Ionicons, { name: 'arrow-back', size: 24, color: CARD })) : null,
        React.createElement(View, { style: { flex: 1 }, componentId: props.id + '-heading-wrap' },
          React.createElement(Text, { style: styles.headerTitle, componentId: props.id + '-title' }, props.title),
          props.subtitle ? React.createElement(Text, { style: styles.headerSubtitle, componentId: props.id + '-subtitle' }, props.subtitle) : null
        )
      )
    );
  };
  var EmptyLine = function(props) {
    return React.createElement(View, { style: styles.empty, componentId: props.id + '-empty' },
      React.createElement(Ionicons, { name: props.icon || 'file-tray-outline', size: 28, color: PRIMARY }),
      React.createElement(Text, { style: styles.emptyText, componentId: props.id + '-empty-text' }, props.text)
    );
  };
  var ActionButton = function(props) {
    return React.createElement(TouchableOpacity, {
      style: [styles.button, props.secondary ? styles.buttonSecondary : null, props.style],
      onPress: props.onPress, disabled: props.disabled, componentId: props.id
    },
      props.icon ? React.createElement(Ionicons, { name: props.icon, size: 20, color: INK }) : null,
      React.createElement(Text, { style: styles.buttonText, componentId: props.id + '-label' }, props.label)
    );
  };
  // @end:helpers

  // @section:HomeScreen @depends:[ThemeContext,styles,helpers]
  var HomeScreen = function(props) {
    var insets = useSafeAreaInsets();
    var windowHeight = useWindowDimensions().height;
    var classesQuery = useQuery('classes');
    var institutesQuery = useQuery('institutes');
    var sessionsQuery = useQuery('sessions');
    var enrolmentsQuery = useQuery('enrolments');
    var attendanceQuery = useQuery('attendance_records');
    var current = today();
    var todaysSessions = sessionsQuery.data.filter(function(s) { if (!s) return false; var cls = classesQuery.data.find(function(c) { return c && c.id === s.class_id; }) || {}; var institute = institutesQuery.data.find(function(x) { return x && x.id === cls.institute_id; }) || {}; return String(s.session_date || '').slice(0, 10) === current && !cls.is_archived && !institute.is_archived; });
    var pending = todaysSessions.filter(function(s) {
      if (s.session_status === 'cancelled') return false;
      var roster = enrolmentsQuery.data.filter(function(e) { return e && e.class_id === s.class_id && e.is_active !== false; });
      return roster.some(function(e) {
        return !attendanceQuery.data.some(function(a) { return a && a.session_id === s.id && a.enrolment_id === e.id && a.attendance_status !== 'unmarked'; });
      });
    });
    var findClass = function(id) { return classesQuery.data.find(function(c) { return c && c.id === id; }) || {}; };
    return React.createElement(View, { style: styles.screen, componentId: 'home-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScrollView, {
        style: { height: windowHeight - insets.top - insets.bottom, overflow: 'auto' },
        contentContainerStyle: { paddingTop: insets.top, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING },
        componentId: 'home-scroll'
      },
        React.createElement(View, { style: styles.hero, componentId: 'home-hero' },
          React.createElement(Text, { style: styles.eyebrowLight, componentId: 'home-eyebrow' }, 'YOUR TEACHING DESK'),
          React.createElement(Text, { style: styles.heroTitle, componentId: 'home-title' }, 'Good to see you.'),
          React.createElement(Text, { style: styles.headerSubtitle, componentId: 'home-date' }, new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }))
        ),
        React.createElement(View, { style: styles.content, componentId: 'home-content' },
          React.createElement(View, { style: styles.metrics, componentId: 'home-metrics' },
            React.createElement(View, { style: styles.metric, componentId: 'home-today-metric' },
              React.createElement(Text, { style: styles.metricNumber, componentId: 'home-today-count' }, String(todaysSessions.length)),
              React.createElement(Text, { style: styles.meta, componentId: 'home-today-label' }, 'Today’s sessions')
            ),
            React.createElement(View, { style: styles.metric, componentId: 'home-pending-metric' },
              React.createElement(Text, { style: styles.metricNumber, componentId: 'home-pending-count' }, String(pending.length)),
              React.createElement(Text, { style: styles.meta, componentId: 'home-pending-label' }, 'Need attendance')
            )
          ),
          React.createElement(Text, { style: styles.sectionTitle, componentId: 'home-today-heading' }, 'Today’s classes'),
          todaysSessions.length ? todaysSessions.map(function(s, i) {
            var c = findClass(s.class_id);
            var isPending = pending.some(function(p) { return p.id === s.id; });
            return React.createElement(TouchableOpacity, {
              key: String(s.id || i), style: styles.railCard,
              onPress: function() { props.navigation.navigate('Attendance', { sessionId: s.id }); },
              componentId: 'home-session-' + i
            },
              React.createElement(View, { style: [styles.rail, { backgroundColor: s.session_status === 'cancelled' ? MUTED : isPending ? ACCENT : SUCCESS }], componentId: 'home-session-rail-' + i }),
              React.createElement(View, { style: styles.railBody, componentId: 'home-session-body-' + i },
                React.createElement(Text, { style: styles.cardTitle, componentId: 'home-session-name-' + i }, c.class_name || 'Unnamed class'),
                React.createElement(Text, { style: styles.meta, componentId: 'home-session-detail-' + i }, (s.duration_minutes || '—') + ' min · ' + (s.session_type || 'regular')),
                React.createElement(Text, { style: styles.statusText, componentId: 'home-session-status-' + i }, s.session_status === 'cancelled' ? 'Cancelled' : isPending ? 'Attendance pending' : 'Attendance complete')
              ),
              React.createElement(Ionicons, { name: 'chevron-forward', size: 20, color: MUTED })
            );
          }) : React.createElement(EmptyLine, { id: 'home-today', icon: 'calendar-outline', text: 'No sessions today. Add one from a class.' }),
          React.createElement(Text, { style: styles.sectionTitle, componentId: 'home-spaces-heading' }, 'Teaching spaces'),
          institutesQuery.data.filter(function(x) { return x && !x.is_archived; }).map(function(item, i) {
            return React.createElement(TouchableOpacity, {
              key: String(item.id || i), style: styles.listCard,
              onPress: function() { props.navigation.navigate('Classes', { instituteId: item.id }); },
              componentId: 'home-institute-' + i
            },
              React.createElement(View, { style: styles.avatar, componentId: 'home-institute-avatar-' + i },
                React.createElement(Text, { style: styles.avatarText, componentId: 'home-institute-initial-' + i }, (item.institute_name || '?').charAt(0))
              ),
              React.createElement(View, { style: { flex: 1 }, componentId: 'home-institute-info-' + i },
                React.createElement(Text, { style: styles.cardTitle, componentId: 'home-institute-name-' + i }, item.institute_name || 'Unnamed institute'),
                React.createElement(Text, { style: styles.meta, componentId: 'home-institute-count-' + i }, classesQuery.data.filter(function(c) { return c && c.institute_id === item.id && !c.is_archived; }).length + ' classes')
              ),
              React.createElement(Ionicons, { name: 'chevron-forward', size: 20, color: MUTED })
            );
          }),
          classesQuery.data.filter(function(c) { return c && !c.institute_id && !c.is_archived; }).map(function(c, i) {
            return React.createElement(TouchableOpacity, {
              key: String(c.id || i), style: styles.listCard,
              onPress: function() { props.navigation.navigate('ClassDetail', { classId: c.id }); },
              componentId: 'home-independent-' + i
            },
              React.createElement(View, { style: styles.avatar, componentId: 'home-independent-avatar-' + i },
                React.createElement(Ionicons, { name: 'book-outline', size: 22, color: PRIMARY })
              ),
              React.createElement(View, { style: { flex: 1 }, componentId: 'home-independent-info-' + i },
                React.createElement(Text, { style: styles.cardTitle, componentId: 'home-independent-name-' + i }, c.class_name || 'Unnamed class'),
                React.createElement(Text, { style: styles.meta, componentId: 'home-independent-label-' + i }, 'Independent class')
              )
            );
          }),
          !institutesQuery.data.length && !classesQuery.data.length ? React.createElement(EmptyLine, { id: 'home-spaces', text: 'Your institutes and classes will appear here.' }) : null,
          React.createElement(ActionButton, { id: 'home-add-class', label: 'Add a class', icon: 'add', onPress: function() { props.navigation.navigate('Classes'); }, style: { marginTop: 16 } })
        )
      )
    );
  };
  // @end:HomeScreen

  // @section:ClassesScreen @depends:[ThemeContext,styles,helpers]
  var ClassesScreen = function(props) {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var institutesQuery = useQuery('institutes');
    var classesQuery = useQuery('classes');
    var insertInstitute = useMutation('institutes', 'insert');
    var insertClass = useMutation('classes', 'insert');
    var updateInstitute = useMutation('institutes', 'update');
    var updateClass = useMutation('classes', 'update');
    var [mode, setMode] = React.useState('');
    var [name, setName] = React.useState('');
    var [notes, setNotes] = React.useState('');
    var [instituteId, setInstituteId] = React.useState(props.route && props.route.params ? props.route.params.instituteId || null : null);
    var activeInstitute = institutesQuery.data.find(function(x) { return x && x.id === instituteId; });
    var save = function() {
      if (!name.trim()) { notify('Name required', 'Enter a name to continue.'); return; }
      var promise = mode === 'institute'
        ? insertInstitute.mutate({ institute_name: name.trim(), notes: notes.trim(), is_archived: false })
        : insertClass.mutate({ class_name: name.trim(), institute_id: instituteId, notes: notes.trim(), is_archived: false });
      promise.then(function() {
        classesQuery.refetch();
        institutesQuery.refetch();
        setMode('');
        setName('');
        setNotes('');
      }).catch(function(e) { notify('Could not save', e.message || 'Please try again.'); });
    };
    return React.createElement(View, { style: styles.screen, componentId: 'classes-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'classes', title: activeInstitute ? activeInstitute.institute_name : 'Teaching spaces', subtitle: activeInstitute ? 'Institute classes' : 'Institutes & independent classes', onBack: activeInstitute ? function() { setInstituteId(null); } : null }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 16, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'classes-scroll' },
        !activeInstitute ? React.createElement(Text, { style: styles.sectionTitle, componentId: 'classes-institutes-heading' }, 'Institutes') : null,
        !activeInstitute && !institutesQuery.data.length ? React.createElement(EmptyLine, { id: 'classes-institutes', text: 'No institutes yet.' }) : null,
        !activeInstitute ? institutesQuery.data.filter(function(x) { return !!x; }).map(function(x, i) {
          return React.createElement(TouchableOpacity, { key: String(x.id || i), style: styles.listCard, onPress: function() { setInstituteId(x.id); }, componentId: 'classes-institute-' + i },
            React.createElement(View, { style: styles.avatar, componentId: 'classes-institute-avatar-' + i }, React.createElement(Text, { style: styles.avatarText, componentId: 'classes-institute-initial-' + i }, (x.institute_name || '?').charAt(0))),
            React.createElement(View, { style: { flex: 1 }, componentId: 'classes-institute-info-' + i },
              React.createElement(Text, { style: styles.cardTitle, componentId: 'classes-institute-name-' + i }, x.institute_name || 'Unnamed institute'),
              React.createElement(Text, { style: styles.meta, componentId: 'classes-institute-state-' + i }, x.is_archived ? 'Archived' : classesQuery.data.filter(function(c) { return c && c.institute_id === x.id; }).length + ' classes')
            ),
            React.createElement(Ionicons, { name: 'chevron-forward', size: 20, color: MUTED })
          );
        }) : null,
        activeInstitute ? React.createElement(ActionButton, {
          id: 'classes-archive-institute', secondary: true, label: activeInstitute.is_archived ? 'Restore institute' : 'Archive institute',
          onPress: function() {
            confirmAction('Keep the institute and all its history, but change its archive state?', function() {
              updateInstitute.mutate({ id: activeInstitute.id, data: { is_archived: !activeInstitute.is_archived } }).then(institutesQuery.refetch).catch(function(e) { notify('Update failed', e.message); });
            });
          }
        }) : null,
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'classes-list-heading' }, activeInstitute ? 'Classes' : 'Independent classes'),
        classesQuery.data.filter(function(c) { return c && (activeInstitute ? c.institute_id === instituteId : !c.institute_id); }).map(function(c, i) {
          return React.createElement(TouchableOpacity, { key: String(c.id || i), style: styles.listCard, onPress: function() { props.navigation.navigate('ClassDetail', { classId: c.id }); }, componentId: 'classes-row-' + i },
            React.createElement(View, { style: styles.avatar, componentId: 'classes-avatar-' + i }, React.createElement(Ionicons, { name: 'library-outline', size: 22, color: PRIMARY })),
            React.createElement(View, { style: { flex: 1 }, componentId: 'classes-info-' + i },
              React.createElement(Text, { style: styles.cardTitle, componentId: 'classes-name-' + i }, c.class_name || 'Unnamed class'),
              React.createElement(Text, { style: styles.meta, componentId: 'classes-status-' + i }, c.is_archived ? 'Archived · history retained' : 'Active class')
            ),
            React.createElement(Ionicons, { name: 'chevron-forward', size: 20, color: MUTED })
          );
        }),
        !classesQuery.data.some(function(c) { return c && (activeInstitute ? c.institute_id === instituteId : !c.institute_id); }) ? React.createElement(EmptyLine, { id: 'classes-list', text: 'No classes in this space yet.' }) : null,
        !activeInstitute ? React.createElement(ActionButton, { id: 'classes-add-institute', label: 'New institute', icon: 'add', onPress: function() { setMode('institute'); }, style: { marginTop: 16 } }) : null,
        (!activeInstitute || !activeInstitute.is_archived) ? React.createElement(ActionButton, { id: 'classes-add-class', label: activeInstitute ? 'Add class to institute' : 'New independent class', secondary: true, icon: 'add', onPress: function() { setMode('class'); }, style: { marginTop: 8 } }) : React.createElement(Text, { style: styles.meta }, 'Restore this institute before adding classes.')
      ),
      React.createElement(Modal, { visible: !!mode, transparent: true, animationType: 'fade', onRequestClose: function() { setMode(''); } },
        React.createElement(View, { style: [styles.modalOverlay, { marginTop: insets.top }], componentId: 'classes-modal-overlay' },
          React.createElement(View, { style: [styles.modalCard, { paddingBottom: insets.bottom + 20 }], componentId: 'classes-modal-card' },
            React.createElement(Text, { style: styles.sectionTitle, componentId: 'classes-modal-title' }, mode === 'institute' ? 'New institute' : 'New class'),
            React.createElement(TextInput, { style: styles.input, value: name, onChangeText: setName, placeholder: mode === 'institute' ? 'Institute name' : 'Class name', placeholderTextColor: MUTED, autoCapitalize: 'words', componentId: 'classes-name-input' }),
            React.createElement(TextInput, { style: [styles.input, styles.notesInput], value: notes, onChangeText: setNotes, placeholder: 'Notes (optional)', placeholderTextColor: MUTED, multiline: true, numberOfLines: 4, textAlignVertical: 'top', componentId: 'classes-notes-input' }),
            React.createElement(ActionButton, { id: 'classes-save', label: 'Save', onPress: save }),
            React.createElement(ActionButton, { id: 'classes-cancel', label: 'Cancel', secondary: true, onPress: function() { setMode(''); setName(''); setNotes(''); }, style: { marginTop: 8 } })
          )
        )
      )
    );
  };
  // @end:ClassesScreen

  // @section:StudentsScreen @depends:[ThemeContext,styles,helpers]
  var StudentsScreen = function(props) {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var studentsQuery = useQuery('students');
    var enrolmentsQuery = useQuery('enrolments');
    var classesQuery = useQuery('classes');
    var insertStudent = useMutation('students', 'insert');
    var [visible, setVisible] = React.useState(false);
    var [name, setName] = React.useState('');
    var [phone, setPhone] = React.useState('');
    var [guardian, setGuardian] = React.useState('');
    var [guardianPhone, setGuardianPhone] = React.useState('');
    var [notes, setNotes] = React.useState('');
    var save = function(allowSimilar) {
      if (!name.trim()) { notify('Name required', 'Enter the student’s full name.'); return; }
      var similar = studentsQuery.data.find(function(s) {
        return s && ((s.full_name || '').trim().toLowerCase() === name.trim().toLowerCase() || (phone && s.student_phone === phone));
      });
      if (similar && !allowSimilar) {
        confirmAction('A profile may already exist for ' + (similar.full_name || 'this student') + '. Create a separate profile anyway?', function() { save(true); });
        return;
      }
      insertStudent.mutate({ full_name: name.trim(), student_phone: phone, guardian_name: guardian.trim(), guardian_phone: guardianPhone, notes: notes.trim() }).then(function() {
        studentsQuery.refetch();
        setVisible(false);
        setName(''); setPhone(''); setGuardian(''); setGuardianPhone(''); setNotes('');
      }).catch(function(e) { notify('Could not save student', e.message); });
    };
    return React.createElement(View, { style: styles.screen, componentId: 'students-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'students', title: 'Students', subtitle: 'One profile, multiple classes' }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 16, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'students-scroll' },
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'students-heading' }, 'Directory'),
        studentsQuery.data.length ? studentsQuery.data.filter(function(s) { return !!s; }).map(function(s, i) {
          var count = enrolmentsQuery.data.filter(function(e) { return e && e.student_id === s.id && e.is_active !== false; }).length;
          return React.createElement(TouchableOpacity, { key: String(s.id || i), style: styles.listCard, onPress: function() { props.navigation.navigate('StudentProfile', { studentId: s.id }); }, componentId: 'students-row-' + i },
            React.createElement(View, { style: styles.avatar, componentId: 'students-avatar-' + i }, React.createElement(Text, { style: styles.avatarText, componentId: 'students-initial-' + i }, (s.full_name || '?').charAt(0))),
            React.createElement(View, { style: { flex: 1 }, componentId: 'students-info-' + i },
              React.createElement(Text, { style: styles.cardTitle, componentId: 'students-name-' + i }, s.full_name || 'Unnamed student'),
              React.createElement(Text, { style: styles.meta, componentId: 'students-detail-' + i }, count + ' active ' + (count === 1 ? 'enrolment' : 'enrolments') + (s.guardian_name ? ' · ' + s.guardian_name : ''))
            ),
            React.createElement(Ionicons, { name: 'chevron-forward', size: 20, color: MUTED })
          );
        }) : React.createElement(EmptyLine, { id: 'students-directory', icon: 'people-outline', text: 'Add a student to start your directory.' }),
        React.createElement(ActionButton, { id: 'students-add', label: 'Add student', icon: 'person-add-outline', onPress: function() { setVisible(true); }, style: { marginTop: 16 } }),
        !classesQuery.data.length ? React.createElement(Text, { style: styles.meta, componentId: 'students-class-hint' }, 'Create a class before enrolling students.') : null
      ),
      React.createElement(Modal, { visible: visible, transparent: true, animationType: 'slide', onRequestClose: function() { setVisible(false); } },
        React.createElement(View, { style: [styles.modalOverlay, { marginTop: insets.top }], componentId: 'students-modal-overlay' },
          React.createElement(View, { style: [styles.modalCard, { flex: 1, maxHeight: '85%', paddingBottom: insets.bottom + 20 }], componentId: 'students-modal-card' },
            React.createElement(ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 16 }, componentId: 'students-form-scroll' },
              React.createElement(Text, { style: styles.sectionTitle, componentId: 'students-form-title' }, 'New student'),
              React.createElement(TextInput, { style: styles.input, value: name, onChangeText: setName, placeholder: 'Full name', placeholderTextColor: MUTED, autoCapitalize: 'words', componentId: 'students-input-name' }),
              React.createElement(TextInput, { style: styles.input, value: phone, onChangeText: function(t) { setPhone(t.replace(/[^0-9+\-() ]/g, '')); }, placeholder: 'Student phone (optional)', placeholderTextColor: MUTED, keyboardType: 'phone-pad', autoCapitalize: 'none', componentId: 'students-input-phone' }),
              React.createElement(TextInput, { style: styles.input, value: guardian, onChangeText: setGuardian, placeholder: 'Guardian name (optional)', placeholderTextColor: MUTED, autoCapitalize: 'words', componentId: 'students-input-guardian' }),
              React.createElement(TextInput, { style: styles.input, value: guardianPhone, onChangeText: function(t) { setGuardianPhone(t.replace(/[^0-9+\-() ]/g, '')); }, placeholder: 'Guardian phone (optional)', placeholderTextColor: MUTED, keyboardType: 'phone-pad', autoCapitalize: 'none', componentId: 'students-input-guardian-phone' }),
              React.createElement(TextInput, { style: [styles.input, styles.notesInput], value: notes, onChangeText: setNotes, placeholder: 'Notes (optional)', placeholderTextColor: MUTED, multiline: true, numberOfLines: 4, textAlignVertical: 'top', componentId: 'students-input-notes' })
            ),
            React.createElement(ActionButton, { id: 'students-save', label: 'Save student', onPress: function() { save(false); } }),
            React.createElement(ActionButton, { id: 'students-close', label: 'Cancel', secondary: true, onPress: function() { setVisible(false); }, style: { marginTop: 8 } })
          )
        )
      )
    );
  };
  // @end:StudentsScreen

  // @section:ClassDetailScreen @depends:[ThemeContext,styles,helpers]
var ClassDetailScreen = function(props) {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var classId = props.route && props.route.params ? props.route.params.classId : null;
    var classesQuery = useQuery('classes');
    var institutesQuery = useQuery('institutes');
    var studentsQuery = useQuery('students');
    var enrolmentsQuery = useQuery('enrolments');
    var sessionsQuery = useQuery('sessions');
    var updateClass = useMutation('classes', 'update');
    var updateEnrolment = useMutation('enrolments', 'update');
    var insertSession = useMutation('sessions', 'insert');
    var updateSession = useMutation('sessions', 'update');
    var c = classesQuery.data.find(function(x) { return x && x.id === classId; }) || {};
    var institute = institutesQuery.data.find(function(x) { return x && x.id === c.institute_id; }) || {};
    var scopeArchived = !!(c.is_archived || institute.is_archived);
    var roster = enrolmentsQuery.data.filter(function(e) { return e && e.class_id === classId; });
    var sessions = sessionsQuery.data.filter(function(s) { return s && s.class_id === classId; }).sort(function(a, b) { return String(b.session_date || '').localeCompare(String(a.session_date || '')); });
    var [showSession, setShowSession] = React.useState(false);
    var [sessionDate, setSessionDate] = React.useState(today());
    var [sessionType, setSessionType] = React.useState('regular');
    var [duration, setDuration] = React.useState('60');
    var [sessionNotes, setSessionNotes] = React.useState('');
    var [originalId, setOriginalId] = React.useState(null);
    var [coverUpBillingChoice, setCoverUpBillingChoice] = React.useState('');
    var [weeklyDays, setWeeklyDays] = React.useState(Array.isArray(c.weekly_days) ? c.weekly_days : [Number(c.weekly_day == null ? new Date().getDay() : c.weekly_day)]);
    var [weeklyTime, setWeeklyTime] = React.useState(c.weekly_time || '09:00');
    var [weeklyDuration, setWeeklyDuration] = React.useState(String(c.weekly_duration_minutes || 60));
    var [weeklyEnabled, setWeeklyEnabled] = React.useState(!!c.weekly_schedule_enabled);
    var [billingType, setBillingType] = React.useState(c.billing_type || 'monthly');
    var [feeRate, setFeeRate] = React.useState(c.fee_rate_default == null ? '' : String(c.fee_rate_default));
    var [feeCurrency, setFeeCurrency] = React.useState(c.currency_default || 'GBP');
    var [billingDueDay, setBillingDueDay] = React.useState(String(c.billing_due_day || 1));
    var [weeklyMessage, setWeeklyMessage] = React.useState('');
    var createSession = function() {
      if (scopeArchived) { notify('Class archived', 'Restore this class and institute before adding sessions.'); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || isNaN(new Date(sessionDate + 'T12:00:00').getTime())) { notify('Invalid date', 'Choose a valid session date.'); return; }
      if (sessions.some(function(s) { return String(s.session_date || '').slice(0, 10) === sessionDate && s.session_type === sessionType && s.session_status !== 'cancelled'; })) {
        notify('Possible duplicate', 'A session of this type already exists on that date.'); return;
      }
      if (sessionType === 'cover_up' && !coverUpBillingChoice) { notify('Choose cover-up billing', 'Choose whether this session replaces the original charge or is billed separately.'); return; }
      insertSession.mutate({ class_id: classId, session_date: sessionDate, session_type: sessionType, session_status: 'scheduled', duration_minutes: Number(duration) || 60, original_session_id: originalId, cover_up_billing: sessionType === 'cover_up' ? coverUpBillingChoice : null, notes: sessionNotes }).then(function() {
        sessionsQuery.refetch(); setShowSession(false); setSessionNotes(''); setOriginalId(null); setCoverUpBillingChoice('');
      }).catch(function(e) { notify('Could not add session', e.message); });
    };
    var saveWeeklySchedule = function() {
      var time = String(weeklyTime || '').trim();
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) { notify('Invalid time', 'Enter the weekly start time as HH:MM using the 24-hour clock.'); return; }
      if (weeklyEnabled && !weeklyDays.length) { notify('Choose a weekday', 'Select one or more days for this weekly timetable.'); return; }
      saveWeeklyTimetable(classId, { weekly_schedule_enabled: weeklyEnabled, weekly_days: weeklyDays, weekly_time: time, weekly_duration_minutes: Number(weeklyDuration) }).then(function() {
        classesQuery.refetch(); sessionsQuery.refetch();
        setWeeklyMessage(weeklyEnabled ? 'Weekly schedule saved. ClassPilot added sessions for the next 30 days. Future dates refresh as the schedule is saved.' : 'Weekly schedule turned off. Existing and historical sessions remain available.');
      }).catch(function(e) { notify('Schedule not saved', e.message || 'Please try again.'); });
    };
    var saveBillingRule = function() {
      var rate = Number(feeRate);
      if (feeRate && (!Number.isFinite(rate) || rate <= 0)) { notify('Invalid class rate', 'Enter a rate greater than zero, or leave it blank.'); return; }
      if (feeCurrency.trim() && !/^[A-Z]{3}$/.test(feeCurrency.trim().toUpperCase())) { notify('Invalid currency', 'Enter a three-letter currency code.'); return; }
      var roundedRate = null;
      try { if (feeRate) roundedRate = roundCurrencyAmount(rate, feeCurrency.trim().toUpperCase()); } catch (error) { notify('Invalid currency', error.message); return; }
      if (!/^\d{1,2}$/.test(billingDueDay) || Number(billingDueDay) < 1 || Number(billingDueDay) > 31) { notify('Invalid due day', 'Choose a day from 1 to 31. If it is outside a month, the last day is used.'); return; }
      updateClass.mutate({ id: classId, data: { billing_type: billingType, fee_rate_default: roundedRate, currency_default: feeCurrency.trim().toUpperCase() || 'GBP', billing_due_day: Number(billingDueDay) } }).then(classesQuery.refetch).catch(function(error) { notify('Billing rule not saved', error.message); });
    };
    var weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return React.createElement(View, { style: styles.screen, componentId: 'class-detail-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'class-detail', title: c.class_name || 'Class details', subtitle: institute.institute_name || 'Independent class', onBack: function() { props.navigation.goBack(); } }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'class-detail-scroll' },
        React.createElement(View, { style: styles.summaryCard, componentId: 'class-detail-summary' },
          React.createElement(Text, { style: styles.metricNumber, componentId: 'class-detail-roster-count' }, String(roster.filter(function(e) { return e.is_active !== false; }).length)),
          React.createElement(Text, { style: styles.meta, componentId: 'class-detail-roster-label' }, 'Active students · ' + sessions.length + ' recorded sessions'),
          React.createElement(Text, { style: styles.statusText, componentId: 'class-detail-state' }, scopeArchived ? 'Archived · history preserved' : 'Active class')
        ),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'class-detail-weekly-heading' }, 'Weekly regular schedule'),
        React.createElement(View, { style: styles.summaryCard, componentId: 'class-detail-weekly-card' },
          React.createElement(Text, { style: styles.body, componentId: 'class-detail-weekly-description' }, 'Set one recurring weekly class time. ClassPilot generates dated sessions for the next 30 days; past and held sessions stay unchanged.'),
          React.createElement(TouchableOpacity, { style: [styles.choice, weeklyEnabled ? styles.choiceActive : null], onPress: function() { setWeeklyEnabled(!weeklyEnabled); }, componentId: 'class-detail-weekly-toggle' },
            React.createElement(Text, { style: styles.choiceText, componentId: 'class-detail-weekly-toggle-label' }, weeklyEnabled ? 'Weekly schedule enabled' : 'Enable weekly schedule')
          ),
          React.createElement(Text, { style: styles.fieldLabel, componentId: 'class-detail-weekly-day-label' }, 'Every week on (choose one or more days)'),
          React.createElement(View, { style: styles.choiceRow, componentId: 'class-detail-weekly-day-row' },
            weekdayNames.map(function(day, index) {
              return React.createElement(TouchableOpacity, { key: day, style: [styles.choice, weeklyDays.indexOf(index) !== -1 ? styles.choiceActive : null], onPress: function() { setWeeklyDays(function(previous) { return previous.indexOf(index) === -1 ? previous.concat([index]).sort() : previous.filter(function(value) { return value !== index; }); }); }, componentId: 'class-detail-weekly-day-' + index },
                React.createElement(Text, { style: styles.choiceText, componentId: 'class-detail-weekly-day-text-' + index }, day)
              );
            })
          ),
          React.createElement(Text, { style: styles.fieldLabel, componentId: 'class-detail-weekly-time-label' }, 'Start time (24-hour HH:MM)'),
          React.createElement(TextInput, { style: styles.input, value: weeklyTime, onChangeText: setWeeklyTime, placeholder: '09:00', placeholderTextColor: MUTED, keyboardType: 'numbers-and-punctuation', componentId: 'class-detail-weekly-time' }),
          React.createElement(Text, { style: styles.fieldLabel }, 'Scheduled duration (minutes)'),
          React.createElement(TextInput, { style: styles.input, value: weeklyDuration, onChangeText: setWeeklyDuration, placeholder: '60', placeholderTextColor: MUTED, keyboardType: 'numeric', componentId: 'class-detail-weekly-duration' }),
          React.createElement(ActionButton, { id: 'class-detail-weekly-save', label: 'Save weekly schedule', secondary: true, onPress: saveWeeklySchedule }),
          weeklyMessage ? React.createElement(Text, { style: styles.statusText, componentId: 'class-detail-weekly-message' }, weeklyMessage) : null
        ),
        React.createElement(Text, { style: styles.sectionTitle }, 'Student billing rule'),
        React.createElement(View, { style: styles.summaryCard, componentId: 'class-detail-billing-rule' },
          React.createElement(Text, { style: styles.body }, 'New obligations use this default. Existing obligations keep their saved amount and currency.'),
          ['monthly', 'custom', 'daily', 'hourly'].map(function(type, i) { return React.createElement(TouchableOpacity, { key: type, style: [styles.reportOptionButton, billingType === type ? styles.reportOptionSelected : null], onPress: function() { setBillingType(type); }, componentId: 'class-detail-billing-type-' + i }, React.createElement(Text, { style: styles.reportOptionText }, type)); }),
          React.createElement(TextInput, { style: styles.input, value: feeRate, onChangeText: setFeeRate, keyboardType: 'decimal-pad', placeholder: 'Default fee rate (optional)', placeholderTextColor: MUTED, componentId: 'class-detail-fee-rate' }),
          React.createElement(TextInput, { style: styles.input, value: feeCurrency, onChangeText: setFeeCurrency, autoCapitalize: 'characters', placeholder: 'Currency code', placeholderTextColor: MUTED, componentId: 'class-detail-fee-currency' }),
          React.createElement(TextInput, { style: styles.input, value: billingDueDay, onChangeText: setBillingDueDay, keyboardType: 'number-pad', placeholder: 'Due day of month (1–31)', placeholderTextColor: MUTED, componentId: 'class-detail-due-day' }),
          React.createElement(ActionButton, { id: 'class-detail-billing-save', label: 'Save class billing rule', secondary: true, onPress: saveBillingRule })
        ),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'class-detail-roster-heading' }, 'Roster'),
        roster.length ? roster.map(function(e, i) {
          var student = studentsQuery.data.find(function(s) { return s && s.id === e.student_id; }) || {};
          return React.createElement(View, { key: String(e.id || i), style: styles.listCard, componentId: 'class-detail-student-' + i },
            React.createElement(View, { style: styles.avatar, componentId: 'class-detail-student-avatar-' + i }, React.createElement(Text, { style: styles.avatarText, componentId: 'class-detail-student-initial-' + i }, (student.full_name || '?').charAt(0))),
            React.createElement(View, { style: { flex: 1 }, componentId: 'class-detail-student-info-' + i },
              React.createElement(Text, { style: styles.cardTitle, componentId: 'class-detail-student-name-' + i }, student.full_name || 'Student profile unavailable'),
              React.createElement(Text, { style: styles.meta, componentId: 'class-detail-student-period-' + i }, e.is_active === false ? 'Ended ' + labelDate(e.end_date) : 'Since ' + labelDate(e.start_date))
            ),
            e.is_active !== false ? React.createElement(TouchableOpacity, { style: styles.smallAction, onPress: function() {
              confirmAction('End this enrolment today? Attendance history will remain available.', function() {
                updateEnrolment.mutate({ id: e.id, data: { is_active: false, end_date: today() } }).then(enrolmentsQuery.refetch).catch(function(err) { notify('Update failed', err.message); });
              });
            }, componentId: 'class-detail-end-' + i }, React.createElement(Text, { style: styles.smallActionText, componentId: 'class-detail-end-label-' + i }, 'End')) : null
          );
        }) : React.createElement(EmptyLine, { id: 'class-detail-roster', text: 'No students enrolled yet.' }),
        !scopeArchived ? React.createElement(ActionButton, { id: 'class-detail-enrol', label: 'Enrol a student', secondary: true, icon: 'person-add-outline', onPress: function() { props.navigation.navigate('Enrolment', { classId: classId }); }, style: { marginTop: 8 } }) : null,
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'class-detail-sessions-heading' }, 'Sessions'),
        sessions.length ? sessions.map(function(s, i) {
          return React.createElement(TouchableOpacity, { key: String(s.id || i), style: styles.railCard, onPress: function() { props.navigation.navigate('Attendance', { sessionId: s.id }); }, componentId: 'class-detail-session-' + i },
            React.createElement(View, { style: [styles.rail, { backgroundColor: s.session_status === 'cancelled' ? MUTED : ACCENT }], componentId: 'class-detail-session-rail-' + i }),
            React.createElement(View, { style: styles.railBody, componentId: 'class-detail-session-body-' + i },
              React.createElement(Text, { style: styles.cardTitle, componentId: 'class-detail-session-date-' + i }, labelDate(s.session_date)),
              React.createElement(Text, { style: styles.meta, componentId: 'class-detail-session-type-' + i }, (s.session_type || 'regular') + ' · ' + (s.duration_minutes || '—') + ' min'),
              React.createElement(Text, { style: styles.statusText, componentId: 'class-detail-session-status-' + i }, s.session_status || 'scheduled')
            ),
            s.session_status !== 'cancelled' ? React.createElement(TouchableOpacity, { style: styles.smallAction, onPress: function() {
              confirmAction('Cancel this session? Its attendance history will remain, and it will not count as a held class.', function() {
                updateSession.mutate({ id: s.id, data: { session_status: 'cancelled' } }).then(sessionsQuery.refetch).catch(function(err) { notify('Update failed', err.message); });
              });
            }, componentId: 'class-detail-cancel-session-' + i }, React.createElement(Text, { style: styles.smallActionText, componentId: 'class-detail-cancel-label-' + i }, 'Cancel')) : null
          );
        }) : React.createElement(EmptyLine, { id: 'class-detail-sessions', icon: 'calendar-outline', text: 'No sessions recorded for this class.' }),
        !scopeArchived ? React.createElement(ActionButton, { id: 'class-detail-add-session', label: 'Add session', icon: 'add', onPress: function() { setShowSession(true); }, style: { marginTop: 8 } }) : null,
        React.createElement(ActionButton, { id: 'class-detail-archive', label: c.is_archived ? 'Restore class' : 'Archive class', secondary: true, onPress: function() {
          confirmAction('Change archive state? Historical sessions and enrolments will be retained.', function() {
            updateClass.mutate({ id: classId, data: { is_archived: !c.is_archived } }).then(classesQuery.refetch).catch(function(e) { notify('Update failed', e.message); });
          });
        }, style: { marginTop: 16 } })
      ),
      React.createElement(Modal, { visible: showSession, transparent: true, animationType: 'fade', onRequestClose: function() { setShowSession(false); } },
        React.createElement(View, { style: [styles.modalOverlay, { marginTop: insets.top }], componentId: 'session-modal-overlay' },
          React.createElement(View, { style: [styles.modalCard, { flex: 1, maxHeight: '85%', paddingBottom: insets.bottom + 20 }], componentId: 'session-modal-card' },
            React.createElement(ScrollView, { style: { flex: 1 }, componentId: 'session-modal-scroll' },
              React.createElement(Text, { style: styles.sectionTitle, componentId: 'session-modal-title' }, 'New session'),
              React.createElement(Text, { style: styles.fieldLabel, componentId: 'session-date-label' }, 'Date'),
              React.createElement(DatePickerInput, { value: sessionDate, onChange: setSessionDate, componentId: 'session-date-input' }),
              React.createElement(Text, { style: styles.fieldLabel, componentId: 'session-type-label' }, 'Session type'),
              React.createElement(View, { style: styles.choiceRow, componentId: 'session-type-row' },
                ['regular', 'cover_up', 'extra'].map(function(type, i) {
                  return React.createElement(TouchableOpacity, { key: type, style: [styles.choice, sessionType === type ? styles.choiceActive : null], onPress: function() { setSessionType(type); setOriginalId(null); }, componentId: 'session-type-' + i },
                    React.createElement(Text, { style: styles.choiceText, componentId: 'session-type-text-' + i }, type === 'cover_up' ? 'Cover-up' : type.charAt(0).toUpperCase() + type.slice(1))
                  );
                })
              ),
              sessionType === 'cover_up' ? React.createElement(View, { componentId: 'session-original-section' },
                React.createElement(Text, { style: styles.fieldLabel, componentId: 'session-original-label' }, 'Original cancelled session'),
                sessions.filter(function(s) { return s.session_status === 'cancelled'; }).length ? sessions.filter(function(s) { return s.session_status === 'cancelled'; }).map(function(s, i) {
                  return React.createElement(TouchableOpacity, { key: String(s.id || i), style: [styles.choice, originalId === s.id ? styles.choiceActive : null], onPress: function() { setOriginalId(s.id); }, componentId: 'session-original-' + i },
                    React.createElement(Text, { style: styles.choiceText, componentId: 'session-original-text-' + i }, labelDate(s.session_date))
                  );
                }) : React.createElement(Text, { style: styles.meta, componentId: 'session-no-original' }, 'Cancel an original session first to link its cover-up.')
              ) : null,
              sessionType === 'cover_up' ? React.createElement(View, { componentId: 'session-cover-up-billing' },
                React.createElement(Text, { style: styles.fieldLabel }, 'Student billing for this cover-up'),
                ['replacement', 'separate'].map(function(choice, i) { return React.createElement(TouchableOpacity, { key: choice, style: [styles.choice, coverUpBillingChoice === choice ? styles.choiceActive : null], onPress: function() { setCoverUpBillingChoice(choice); }, componentId: 'session-cover-up-choice-' + i }, React.createElement(Text, { style: styles.choiceText }, choice === 'replacement' ? 'Replace the original charge' : 'Bill as a separate session')); }),
                React.createElement(Text, { style: styles.meta }, 'The original cancelled session stays in history. Choosing replacement means this session does not create a second charge for that intended fee.')
              ) : null,
              React.createElement(Text, { style: styles.fieldLabel, componentId: 'session-duration-label' }, 'Duration in minutes'),
              React.createElement(TextInput, { style: styles.input, value: duration, onChangeText: function(t) { setDuration(t.replace(/[^0-9]/g, '')); }, keyboardType: 'numeric', placeholder: '60', placeholderTextColor: MUTED, componentId: 'session-duration-input' }),
              React.createElement(TextInput, { style: [styles.input, styles.notesInput], value: sessionNotes, onChangeText: setSessionNotes, multiline: true, numberOfLines: 4, textAlignVertical: 'top', placeholder: 'Session notes (optional)', placeholderTextColor: MUTED, componentId: 'session-notes-input' })
            ),
            React.createElement(ActionButton, { id: 'session-save', label: 'Save session', onPress: createSession, disabled: sessionType === 'cover_up' && (!originalId || !coverUpBillingChoice) }),
            React.createElement(ActionButton, { id: 'session-close', label: 'Cancel', secondary: true, onPress: function() { setShowSession(false); }, style: { marginTop: 8 } })
          )
        )
      )
    );
  };
// @end:ClassDetailScreen

  // @section:DatePickerInput @depends:[styles]
  var DatePickerInput = function(props) {
    var insets = useSafeAreaInsets();
    var [open, setOpen] = React.useState(false);
    var parts = (props.value || today()).split('-');
    var [year, setYear] = React.useState(Number(parts[0]));
    var [month, setMonth] = React.useState(Number(parts[1]));
    var [day, setDay] = React.useState(Number(parts[2]));
    React.useEffect(function() {
      var max = new Date(year, month, 0).getDate();
      if (day > max) setDay(max);
    }, [year, month]);
    if (Platform.OS === 'web') {
      return React.createElement('input', {
        type: 'date', value: props.value || '',
        onChange: function(e) { props.onChange(e.target.value); },
        style: { boxSizing: 'border-box', width: '100%', minHeight: 48, padding: 12, border: '1px solid ' + BORDER, borderRadius: 8, backgroundColor: CARD, color: INK, fontSize: 16, marginBottom: 12 }
      });
    }
    var years = [];
    for (var y = new Date().getFullYear() - 10; y <= new Date().getFullYear() + 20; y++) years.push(y);
    var months = Array.from({ length: 12 }, function(_, i) { return i + 1; });
    var days = Array.from({ length: new Date(year, month, 0).getDate() }, function(_, i) { return i + 1; });
    var column = function(values, selected, setter, prefix) {
      return React.createElement(ScrollView, { style: { flex: 1, height: 220 }, componentId: props.componentId + '-' + prefix + '-scroll' },
        values.map(function(v) {
          return React.createElement(TouchableOpacity, { key: String(v), style: [styles.dateOption, selected === v ? styles.choiceActive : null], onPress: function() { setter(v); }, componentId: props.componentId + '-' + prefix + '-' + v },
            React.createElement(Text, { style: styles.body, componentId: props.componentId + '-' + prefix + '-label-' + v }, String(v))
          );
        })
      );
    };
    return React.createElement(View, { componentId: props.componentId },
      React.createElement(TouchableOpacity, { style: styles.input, onPress: function() { setOpen(true); }, componentId: props.componentId + '-trigger' },
        React.createElement(Text, { style: styles.body, componentId: props.componentId + '-value' }, labelDate(props.value))
      ),
      React.createElement(Modal, { visible: open, transparent: true, animationType: 'slide', onRequestClose: function() { setOpen(false); } },
        React.createElement(View, { style: [styles.modalOverlay, { marginTop: insets.top }], componentId: props.componentId + '-overlay' },
          React.createElement(View, { style: [styles.modalCard, { paddingBottom: insets.bottom + 20 }], componentId: props.componentId + '-card' },
            React.createElement(Text, { style: styles.sectionTitle, componentId: props.componentId + '-heading' }, 'Choose date'),
            React.createElement(View, { style: styles.choiceRow, componentId: props.componentId + '-columns' },
              column(months, month, setMonth, 'month'),
              column(days, day, setDay, 'day'),
              column(years, year, setYear, 'year')
            ),
            React.createElement(ActionButton, { id: props.componentId + '-confirm', label: 'Use this date', onPress: function() {
              props.onChange(year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0')); setOpen(false);
            } }),
            React.createElement(ActionButton, { id: props.componentId + '-cancel', label: 'Cancel', secondary: true, onPress: function() { setOpen(false); }, style: { marginTop: 8 } })
          )
        )
      )
    );
  };
  // @end:DatePickerInput

  // @section:StudentProfileScreen @depends:[ThemeContext,styles,helpers]
  var StudentProfileScreen = function(props) {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var studentId = props.route && props.route.params ? props.route.params.studentId : null;
    var studentsQuery = useQuery('students');
    var enrolmentsQuery = useQuery('enrolments');
    var classesQuery = useQuery('classes');
    var student = studentsQuery.data.find(function(s) { return s && s.id === studentId; }) || {};
    var rows = enrolmentsQuery.data.filter(function(e) { return e && e.student_id === studentId; });
    return React.createElement(View, { style: styles.screen, componentId: 'student-profile-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'student-profile', title: student.full_name || 'Student profile', subtitle: 'Contact & enrolment history', onBack: function() { props.navigation.goBack(); } }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'student-profile-scroll' },
        React.createElement(View, { style: styles.summaryCard, componentId: 'student-profile-contact' },
          React.createElement(Text, { style: styles.cardTitle, componentId: 'student-profile-contact-heading' }, 'Contact'),
          React.createElement(Text, { style: styles.body, componentId: 'student-profile-phone' }, 'Student phone  ' + (student.student_phone || 'Not provided')),
          React.createElement(Text, { style: styles.body, componentId: 'student-profile-guardian' }, 'Guardian  ' + (student.guardian_name || 'Not provided')),
          React.createElement(Text, { style: styles.body, componentId: 'student-profile-guardian-phone' }, 'Guardian phone  ' + (student.guardian_phone || 'Not provided')),
          student.notes ? React.createElement(Text, { style: styles.meta, componentId: 'student-profile-notes' }, student.notes) : null
        ),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'student-profile-enrolments-heading' }, 'Enrolments'),
        rows.length ? rows.map(function(e, i) {
          var c = classesQuery.data.find(function(x) { return x && x.id === e.class_id; }) || {};
          return React.createElement(TouchableOpacity, { key: String(e.id || i), style: styles.listCard, onPress: function() { props.navigation.navigate('ClassDetail', { classId: e.class_id }); }, componentId: 'student-profile-enrolment-' + i },
            React.createElement(View, { style: { flex: 1 }, componentId: 'student-profile-enrolment-info-' + i },
              React.createElement(Text, { style: styles.cardTitle, componentId: 'student-profile-enrolment-class-' + i }, c.class_name || 'Class unavailable'),
              React.createElement(Text, { style: styles.meta, componentId: 'student-profile-enrolment-dates-' + i }, labelDate(e.start_date) + (e.end_date ? ' – ' + labelDate(e.end_date) : ' – present')),
              React.createElement(Text, { style: styles.statusText, componentId: 'student-profile-enrolment-status-' + i }, e.is_active === false ? 'Ended' : 'Active')
            )
          );
        }) : React.createElement(EmptyLine, { id: 'student-profile-enrolments', text: 'No class enrolments yet.' }),
        React.createElement(ActionButton, { id: 'student-profile-add-enrolment', label: 'Enrol in a class', icon: 'add', onPress: function() { props.navigation.navigate('Enrolment', { studentId: studentId }); }, style: { marginTop: 16 } })
      )
    );
  };
  // @end:StudentProfileScreen

  // @section:EnrolmentScreen @depends:[ThemeContext,styles,helpers,DatePickerInput]
  var EnrolmentScreen = function(props) {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var params = props.route && props.route.params ? props.route.params : {};
    var classesQuery = useQuery('classes');
    var institutesQuery = useQuery('institutes');
    var studentsQuery = useQuery('students');
    var enrolmentsQuery = useQuery('enrolments');
    var insertEnrolment = useMutation('enrolments', 'insert');
    var [classId, setClassId] = React.useState(params.classId || null);
    var [studentId, setStudentId] = React.useState(params.studentId || null);
    var [startDate, setStartDate] = React.useState(today());
    var [firstBil…3856 tokens truncated….institute_id && showDurationForm ? React.createElement(View, { style: styles.summaryCard, componentId: 'attendance-teaching-duration-form' },
          React.createElement(Text, { style: styles.cardTitle }, 'Actual institute teaching duration'),
          ['manual', 'start_end'].map(function(method, index) { return React.createElement(TouchableOpacity, { key: method, style: [styles.reportOptionButton, recordingMethod === method ? styles.reportOptionSelected : null], onPress: function() { setRecordingMethod(method); }, componentId: 'attendance-duration-method-' + index }, React.createElement(Text, { style: styles.reportOptionText }, method === 'manual' ? 'Enter total hours' : 'Enter start and end times')); }),
          recordingMethod === 'manual' ? React.createElement(TextInput, { style: styles.input, value: actualHours, onChangeText: setActualHours, keyboardType: 'decimal-pad', placeholder: 'Actual hours taught', placeholderTextColor: MUTED, componentId: 'attendance-actual-hours' }) : React.createElement(View, null,
            React.createElement(TextInput, { style: styles.input, value: startTime, onChangeText: setStartTime, placeholder: 'Start time HH:MM', placeholderTextColor: MUTED, componentId: 'attendance-actual-start' }),
            React.createElement(TextInput, { style: styles.input, value: endTime, onChangeText: setEndTime, placeholder: 'End time HH:MM', placeholderTextColor: MUTED, componentId: 'attendance-actual-end' })
          ),
          React.createElement(ActionButton, { id: 'attendance-save-hours', label: 'Save hours and mark held', onPress: function() {
            if (recordingMethod === 'start_end') {
              var timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
              if (!timePattern.test(startTime) || !timePattern.test(endTime) || endTime <= startTime) { notify('Check session times', 'Enter valid same-day times in HH:MM format, with the end after the start.'); return; }
              var toMinutes = function(time) { return Number(time.slice(0, 2)) * 60 + Number(time.slice(3)); };
              finishSession(toMinutes(endTime) - toMinutes(startTime), recordingMethod);
            } else finishSession(Number(actualHours) * 60, recordingMethod);
          } }),
          React.createElement(ActionButton, { id: 'attendance-cancel-hours', label: 'Cancel', secondary: true, onPress: function() { setShowDurationForm(false); } })
        ) : React.createElement(ActionButton, { id: 'attendance-complete', label: 'Mark session held', secondary: true, onPress: function() { confirmAction('Mark this teaching session as held? Unmarked students will remain unmarked.', function() { if (c.institute_id) setShowDurationForm(true); else finishSession(null, null); }); }, style: { marginTop: 16 } }) : null
      )
    );
  };
  // @end:AttendanceScreen

  // @section:FeesScreen @depends:[ThemeContext,styles,helpers]
  var FeesScreen = function() {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var enrolments = useQuery('enrolments').data;
    var students = useQuery('students').data;
    var classes = useQuery('classes').data;
    var institutes = useQuery('institutes').data;
    var obligations = useQuery('fee_obligations').data;
    var payments = useQuery('payments').data;
    var allocations = useQuery('payment_allocations').data;
    var insertObligation = useMutation('fee_obligations', 'insert');
    var [showForm, setShowForm] = React.useState(false);
    var [selectedEnrolment, setSelectedEnrolment] = React.useState('');
    var [feeType, setFeeType] = React.useState('monthly');
    var [period, setPeriod] = React.useState(today().slice(0, 7));
    var [quantity, setQuantity] = React.useState('');
    var [billableDates, setBillableDates] = React.useState('');
    var [amount, setAmount] = React.useState('');
    var [currency, setCurrency] = React.useState('GBP');
    var [dueDate, setDueDate] = React.useState(today());
    var [paymentTarget, setPaymentTarget] = React.useState('');
    var [paymentAmount, setPaymentAmount] = React.useState('');
    var [paymentMethod, setPaymentMethod] = React.useState('cash');
    var [editingPaymentId, setEditingPaymentId] = React.useState('');
    var [editingAmount, setEditingAmount] = React.useState('');
    var [editingDate, setEditingDate] = React.useState('');
    var [editingMethod, setEditingMethod] = React.useState('cash');
    var [monthlyBatchMonth, setMonthlyBatchMonth] = React.useState(today().slice(0, 7));
    var [generationMessage, setGenerationMessage] = React.useState('');
    var findEnrolment = function(id) { return enrolments.find(function(e) { return e.id === id; }) || {}; };
    var getPaid = function(id) { return allocations.filter(function(a) { return a.obligation_id === id; }).reduce(function(sum, a) { return sum + Number(a.amount || 0); }, 0); };
    var submitObligation = function() {
      var enrolment = findEnrolment(selectedEnrolment);
      var value = Number(amount);
      var dates = feeType === 'daily' ? billableDates.split(',').map(function(date) { return date.trim(); }).filter(Boolean) : [];
      if (dates.length !== new Set(dates).size) { notify('Duplicate billable date', 'List each billable date once.'); return; }
      var qty = feeType === 'daily' ? dates.length : feeType === 'hourly' ? Number(quantity) : 1;
      if (!enrolment.id || !Number.isFinite(value) || value <= 0 || !/^[A-Z]{3}$/.test(currency.trim().toUpperCase()) || !Number.isFinite(qty) || qty <= 0) { notify('Check fee details', 'Choose a student enrolment, valid amount, currency code, and quantity.'); return; }
      if ((feeType === 'monthly' || feeType === 'hourly') && (!/^\d{4}-\d{2}$/.test(period) || Number(period.slice(5, 7)) < 1 || Number(period.slice(5, 7)) > 12)) { notify('Invalid billing month', 'Enter the period as YYYY-MM.'); return; }
      if (feeType === 'custom' && (!/^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/.test(period) || !validISODate(period.slice(0, 10)) || !validISODate(period.slice(11)))) { notify('Invalid custom period', 'Enter valid inclusive start and end dates as YYYY-MM-DD/YYYY-MM-DD.'); return; }
      if (feeType === 'daily' && (!dates.length || dates.some(function(date) { return !validISODate(date); }))) { notify('Choose billable dates', 'Enter each valid billable date as YYYY-MM-DD, separated by commas. Daily fees use only these selected dates.'); return; }
      if (dueDate && !validISODate(dueDate)) { notify('Invalid due date', 'Enter a valid due date as YYYY-MM-DD.'); return; }
      if (feeType === 'hourly' && (!quantity || !Number.isFinite(Number(quantity)))) { notify('Enter billable hours', 'Student billable hours are entered manually and are not inferred from session duration.'); return; }
      var fixedAmount;
      try { fixedAmount = roundCurrencyAmount(feeType === 'daily' || feeType === 'hourly' ? value * qty : value, currency.trim().toUpperCase()); }
      catch (error) { notify('Invalid currency', error.message); return; }
      var feePeriod = period.trim();
      var rangeStart = feeType === 'monthly' || (feeType === 'hourly' && /^\d{4}-\d{2}$/.test(period)) ? period + '-01' : feeType === 'custom' ? period.slice(0, 10) : feeType === 'daily' ? dates.slice().sort()[0] : '';
      var rangeEnd = feeType === 'monthly' || (feeType === 'hourly' && /^\d{4}-\d{2}$/.test(period)) ? period + '-' + String(new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0).getDate()).padStart(2, '0') : feeType === 'custom' ? period.slice(11) : feeType === 'daily' ? dates.slice().sort().slice(-1)[0] : '';
      var billingStartMonth = rangeStart ? rangeStart.slice(0, 7) : period.slice(0, 7);
      if (enrolment.first_billable_period && billingStartMonth < String(enrolment.first_billable_period).slice(0, 7)) { notify('Before first billable period', 'This fee period is earlier than the first period selected for this enrolment.'); return; }
      if (feeType === 'custom' && rangeStart > rangeEnd) { notify('Invalid custom period', 'The end date must be on or after the start date.'); return; }
      var overlaps = obligations.some(function(o) { return o.enrolment_id === enrolment.id && rangeStart && o.period_start && rangeStart <= o.period_end && rangeEnd >= o.period_start; });
      if (overlaps) { notify('Overlapping fee obligation', 'This period overlaps an existing obligation for this enrolment. Change the dates or review the earlier obligation first.'); return; }
      insertObligation.mutate({ enrolment_id: enrolment.id, fee_type: feeType, period: feePeriod, period_start: rangeStart || null, period_end: rangeEnd || null, billable_dates: dates, quantity: qty, unit_rate: value, amount: fixedAmount, currency: currency.trim().toUpperCase(), due_date: dueDate || null, created_at: new Date().toISOString(), status: 'open' }).then(function() { setShowForm(false); setAmount(''); setQuantity(''); setBillableDates(''); }).catch(function(error) { notify('Could not save fee', error.message); });
    };
    var submitPayment = function(obligation) {
      var value = Number(paymentAmount);
      var remaining = Math.max(0, Number(obligation.amount) - getPaid(obligation.id));
      recordPayment({ date: today(), amount: value, currency: obligation.currency, method: paymentMethod }, [{ obligation_id: obligation.id, amount: value }]).then(function() { setPaymentTarget(''); setPaymentAmount(''); }).catch(function(error) { notify('Payment not saved', error.message || (value > remaining ? 'Payment is greater than the remaining balance.' : 'Check the payment details.')); });
    };
    var generateMonthlyFees = function() {
      if (!/^\\d{4}-\\d{2}$/.test(monthlyBatchMonth) || Number(monthlyBatchMonth.slice(5, 7)) < 1 || Number(monthlyBatchMonth.slice(5, 7)) > 12) { setGenerationMessage('Enter the month as YYYY-MM.'); return; }
      var year = Number(monthlyBatchMonth.slice(0, 4));
      var month = Number(monthlyBatchMonth.slice(5, 7));
      var lastDay = new Date(year, month, 0).getDate();
      var start = monthlyBatchMonth + '-01';
      var end = monthlyBatchMonth + '-' + String(lastDay).padStart(2, '0');
      var candidates = enrolments.filter(function(e) {
        if (!e || e.is_active === false || (e.start_date && e.start_date > end) || (e.end_date && e.end_date < start)) return false;
        var cls = classes.find(function(c) { return c.id === e.class_id; }) || {};
        var institute = institutes.find(function(i) { return i.id === cls.institute_id; }) || {};
        return !cls.is_archived && !institute.is_archived && (cls.billing_type || 'monthly') === 'monthly' && (!e.first_billable_period || String(e.first_billable_period).slice(0, 7) <= monthlyBatchMonth);
      });
      var skipped = enrolments.filter(function(e) { return e && e.is_active !== false; }).length - candidates.length;
      var due = [];
      candidates.forEach(function(e) {
        var cls = classes.find(function(c) { return c.id === e.class_id; }) || {};
        var student = students.find(function(s) { return s.id === e.student_id; }) || {};
        var rate = e.fee_rate_override != null ? Number(e.fee_rate_override) : Number(cls.fee_rate_default);
        var code = e.fee_currency_override || cls.currency_default || 'GBP';
        if (!Number.isFinite(rate) || rate <= 0 || !/^[A-Z]{3}$/.test(code) || obligations.some(function(o) { return o.enrolment_id === e.id && o.period_start && start <= o.period_end && end >= o.period_start; })) { skipped++; return; }
        var dueDay = Math.max(1, Math.min(lastDay, Number(cls.billing_due_day) || 1));
        due.push({ enrolment_id: e.id, fee_type: 'monthly', period: monthlyBatchMonth, period_start: start, period_end: end, billable_dates: [], quantity: 1, unit_rate: rate, amount: roundCurrencyAmount(rate, code), currency: code, due_date: monthlyBatchMonth + '-' + String(dueDay).padStart(2, '0'), created_at: new Date().toISOString(), status: 'open', generated_by_rule: true, description: student.full_name ? 'Monthly fee · ' + student.full_name : 'Monthly fee' });
      });
      due.reduce(function(chain, record) { return chain.then(function() { return insertObligation.mutate(record); }); }, Promise.resolve()).then(function() { setGenerationMessage(due.length + ' monthly fee' + (due.length === 1 ? '' : 's') + ' created; ' + skipped + ' skipped.'); }).catch(function(error) { setGenerationMessage('Generation stopped: ' + error.message); });
    };
    return React.createElement(View, { style: styles.screen, componentId: 'fees-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'fees', title: 'Fees & payments', subtitle: 'Fixed obligations · local records' }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 16, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'fees-scroll' },
        React.createElement(Text, { style: styles.body, componentId: 'fees-rule-note' }, 'Each fee is a fixed historical obligation. Daily billable days and hourly student billable hours are entered by you; attendance and teaching duration never calculate them.'),
        React.createElement(View, { style: styles.summaryCard, componentId: 'fees-monthly-generation' }, React.createElement(Text, { style: styles.sectionTitle }, 'Monthly fee run'), React.createElement(Text, { style: styles.meta }, 'Creates one fixed fee for each active monthly enrolment using its current class or student rate. Existing periods are skipped.'), React.createElement(TextInput, { style: styles.input, value: monthlyBatchMonth, onChangeText: setMonthlyBatchMonth, placeholder: 'YYYY-MM', placeholderTextColor: MUTED, componentId: 'fees-monthly-month' }), React.createElement(ActionButton, { id: 'fees-generate-monthly', label: 'Generate monthly fees', icon: 'add', onPress: generateMonthlyFees }), generationMessage ? React.createElement(Text, { style: styles.meta, componentId: 'fees-generation-result' }, generationMessage) : null),
        React.createElement(ActionButton, { id: 'fees-add-obligation', label: showForm ? 'Close fee form' : 'Create fee obligation', icon: showForm ? 'close' : 'add', onPress: function() { setShowForm(!showForm); } }),
        showForm ? React.createElement(View, { style: styles.summaryCard, componentId: 'fees-obligation-form' },
          React.createElement(Text, { style: styles.fieldLabel }, 'Student and class'),
          enrolments.filter(function(e) { return e && e.is_active !== false && !e.end_date; }).map(function(e, i) {
            var student = students.find(function(s) { return s.id === e.student_id; }) || {};
            var cls = classes.find(function(c) { return c.id === e.class_id; }) || {};
            return React.createElement(TouchableOpacity, { key: e.id, style: [styles.reportInstituteOption, selectedEnrolment === e.id ? styles.reportInstituteOptionSelected : null], onPress: function() { setSelectedEnrolment(e.id); setFeeType(e.billing_type_override || cls.billing_type || 'monthly'); setAmount(String(e.fee_rate_override != null ? e.fee_rate_override : cls.fee_rate_default != null ? cls.fee_rate_default : '')); setCurrency(e.fee_currency_override || cls.currency_default || 'GBP'); setPeriod(e.first_billable_period || today().slice(0, 7)); }, componentId: 'fee-enrolment-' + i }, React.createElement(Text, { style: styles.body }, (student.full_name || 'Student') + ' · ' + (cls.class_name || 'Class')));
          }),
          React.createElement(Text, { style: styles.fieldLabel }, 'Billing type'),
          ['monthly', 'custom period', 'daily', 'hourly'].map(function(type, i) { return React.createElement(TouchableOpacity, { key: type, style: [styles.reportOptionButton, feeType === type ? styles.reportOptionSelected : null], onPress: function() { setFeeType(type === 'custom period' ? 'custom' : type); }, componentId: 'fee-type-' + i }, React.createElement(Text, { style: styles.reportOptionText }, type)); }),
          React.createElement(TextInput, { style: styles.input, value: period, onChangeText: setPeriod, placeholder: feeType === 'monthly' ? 'Billing month YYYY-MM' : 'Period or billable date range', placeholderTextColor: MUTED, componentId: 'fee-period-input' }),
          feeType === 'daily' ? React.createElement(TextInput, { style: styles.input, value: billableDates, onChangeText: setBillableDates, placeholder: 'Billable dates YYYY-MM-DD, separated by commas', placeholderTextColor: MUTED, componentId: 'fee-billable-dates-input' }) : feeType === 'hourly' ? React.createElement(TextInput, { style: styles.input, value: quantity, onChangeText: setQuantity, keyboardType: 'decimal-pad', placeholder: 'Billable student hours (entered manually)', placeholderTextColor: MUTED, componentId: 'fee-quantity-input' }) : null,
          React.createElement(TextInput, { style: styles.input, value: amount, onChangeText: setAmount, keyboardType: 'decimal-pad', placeholder: feeType === 'daily' || feeType === 'hourly' ? 'Rate per day/hour' : 'Fee amount', placeholderTextColor: MUTED, componentId: 'fee-amount-input' }),
          React.createElement(TextInput, { style: styles.input, value: currency, onChangeText: setCurrency, autoCapitalize: 'characters', placeholder: 'Currency code, e.g. GBP', placeholderTextColor: MUTED, componentId: 'fee-currency-input' }),
          React.createElement(TextInput, { style: styles.input, value: dueDate, onChangeText: setDueDate, placeholder: 'Due date YYYY-MM-DD', placeholderTextColor: MUTED, componentId: 'fee-due-date-input' }),
          React.createElement(ActionButton, { id: 'fees-save-obligation', label: 'Save fixed obligation', onPress: submitObligation, style: { marginTop: 8 } })
        ) : null,
        obligations.length ? obligations.slice().sort(function(a, b) { return String(a.due_date || '').localeCompare(String(b.due_date || '')); }).map(function(o, i) {
          var enrolment = findEnrolment(o.enrolment_id);
          var student = students.find(function(s) { return s.id === enrolment.student_id; }) || {};
          var cls = classes.find(function(c) { return c.id === enrolment.class_id; }) || {};
          var paid = getPaid(o.id);
          var balance = Math.max(0, Number(o.amount) - paid);
          return React.createElement(View, { key: o.id, style: styles.listCard, componentId: 'fees-obligation-' + i },
            React.createElement(View, { style: { flex: 1 } },
              React.createElement(Text, { style: styles.cardTitle }, student.full_name || 'Student'),
              React.createElement(Text, { style: styles.meta }, (cls.class_name || 'Class') + ' · ' + o.period + ' · ' + o.fee_type),
              React.createElement(Text, { style: styles.meta }, formatCurrency(o.amount, o.currency) + ' · Paid ' + formatCurrency(paid, o.currency) + ' · Balance ' + formatCurrency(balance, o.currency)),
              React.createElement(Text, { style: styles.statusText }, balance === 0 ? 'Paid' : paid > 0 ? 'Partially paid' : o.due_date && o.due_date < today() ? 'Overdue' : 'Unpaid'),
              balance > 0 ? paymentTarget === o.id ? React.createElement(View, null,
                React.createElement(TextInput, { style: styles.input, value: paymentAmount, onChangeText: setPaymentAmount, keyboardType: 'decimal-pad', placeholder: 'Payment amount', placeholderTextColor: MUTED, componentId: 'payment-amount-' + i }),
                ['cash', 'bank transfer', 'other'].map(function(method, j) { return React.createElement(TouchableOpacity, { key: method, style: [styles.reportOptionButton, paymentMethod === method ? styles.reportOptionSelected : null], onPress: function() { setPaymentMethod(method); }, componentId: 'payment-method-' + i + '-' + j }, React.createElement(Text, { style: styles.reportOptionText }, method)); }),
                React.createElement(ActionButton, { id: 'payment-save-' + i, label: 'Save payment', onPress: function() { submitPayment(o); } })
              ) : React.createElement(ActionButton, { id: 'payment-open-' + i, label: 'Record payment', secondary: true, onPress: function() { setPaymentTarget(o.id); setPaymentAmount(''); } }) : null
            ),
            payments.filter(function(p) { return allocations.some(function(a) { return a.payment_id === p.id && a.obligation_id === o.id; }); }).map(function(p, j) { return React.createElement(View, { key: p.id + '-' + j, style: styles.paymentHistoryRow },
              React.createElement(View, { style: { flex: 1 } }, React.createElement(Text, { style: styles.meta }, labelDate(p.date) + ' · ' + p.method + ' · ' + formatCurrency(p.amount, p.currency)),
                editingPaymentId === p.id ? React.createElement(View, null,
                  React.createElement(TextInput, { style: styles.input, value: editingDate, onChangeText: setEditingDate, placeholder: 'Payment date YYYY-MM-DD', placeholderTextColor: MUTED }),
                  React.createElement(TextInput, { style: styles.input, value: editingAmount, onChangeText: setEditingAmount, keyboardType: 'decimal-pad', placeholder: 'Amount', placeholderTextColor: MUTED }),
                  ['cash', 'bank transfer', 'other'].map(function(method, k) { return React.createElement(TouchableOpacity, { key: method, style: [styles.reportOptionButton, editingMethod === method ? styles.reportOptionSelected : null], onPress: function() { setEditingMethod(method); } }, React.createElement(Text, { style: styles.reportOptionText }, method)); }),
                  React.createElement(ActionButton, { id: 'payment-edit-save-' + i + '-' + j, label: 'Save payment edit', onPress: function() { updatePayment(p.id, { date: editingDate, amount: editingAmount, method: editingMethod }).then(function() { setEditingPaymentId(''); }).catch(function(error) { notify('Could not edit payment', error.message); }); } })
                ) : null
              ),
              editingPaymentId !== p.id ? React.createElement(TouchableOpacity, { onPress: function() { setEditingPaymentId(p.id); setEditingAmount(String(p.amount)); setEditingDate(p.date || today()); setEditingMethod(p.method || 'cash'); } }, React.createElement(Text, { style: styles.statusText }, 'Edit')) : null,
              React.createElement(TouchableOpacity, { onPress: function() { confirmAction('Delete this payment? Its allocation will be removed, the balance recalculated, and the correction retained in local history.', function() { deletePayment(p.id).catch(function(error) { notify('Could not delete payment', error.message); }); }); } }, React.createElement(Text, { style: styles.errorText }, 'Delete'))
            ); })
          );
        }) : React.createElement(EmptyLine, { id: 'fees-empty', icon: 'cash-outline', text: 'No fee obligations yet. Create a fixed obligation for an enrolment.' })
      )
    );
  };
  // @end:FeesScreen

  // @section:ReportsScreen @depends:[ThemeContext,styles,helpers]
  var ReportsScreen = function() {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var institutes = useQuery('institutes').data;
    var classes = useQuery('classes').data;
    var students = useQuery('students').data;
    var enrolments = useQuery('enrolments').data;
    var sessions = useQuery('sessions').data;
    var attendance = useQuery('attendance_records').data;
    var obligations = useQuery('fee_obligations').data;
    var payments = useQuery('payments').data;
    var allocations = useQuery('payment_allocations').data;
    var teachingHours = useQuery('teaching_hours').data;
    var [selectedInstituteId, setSelectedInstituteId] = React.useState('');
    var [selectedMonth, setSelectedMonth] = React.useState(today().slice(0, 7));
    var selectedInstitute = institutes.find(function(x) { return x.id === selectedInstituteId; }) || null;
    var classIds = classes.filter(function(c) { return c && c.institute_id === selectedInstituteId; }).map(function(c) { return c.id; });
    var validMonth = /^\d{4}-\d{2}$/.test(selectedMonth);
    var monthStart = selectedMonth + '-01';
    var monthEnd = validMonth ? selectedMonth + '-' + String(new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate()).padStart(2, '0') : '';
    var filteredObligations = obligations.filter(function(o) { var e = enrolments.find(function(item) { return item.id === o.enrolment_id; }) || {}; var overlaps = o.period_start && o.period_end ? o.period_start <= monthEnd && o.period_end >= monthStart : String(o.period || '').slice(0, 7) === selectedMonth; return classIds.indexOf(e.class_id) !== -1 && overlaps; });
    var selectedSessions = validMonth ? sessions.filter(function(s) { var day = String(s.session_date || '').slice(0, 10); return classIds.indexOf(s.class_id) !== -1 && day >= monthStart && day <= monthEnd; }) : [];
    var heldSessions = selectedSessions.filter(function(s) { return s.session_status === 'held'; });
    var rows = enrolments.filter(function(e) { if (!e || classIds.indexOf(e.class_id) === -1) return false; var from = String(e.start_date || '').slice(0, 10); var to = String(e.end_date || '9999-12-31').slice(0, 10); return from <= monthEnd && to >= monthStart; }).map(function(e) {
      var person = students.find(function(s) { return s.id === e.student_id; }) || {};
      var cls = classes.find(function(c) { return c.id === e.class_id; }) || {};
      var eligible = heldSessions.filter(function(s) { var d = String(s.session_date || '').slice(0, 10); return s.class_id === e.class_id && d >= String(e.start_date || '').slice(0, 10) && d <= String(e.end_date || '9999-12-31').slice(0, 10); });
      var present = eligible.filter(function(s) { return attendance.some(function(a) { return a.session_id === s.id && a.enrolment_id === e.id && a.attendance_status === 'present'; }); }).length;
      var absent = eligible.filter(function(s) { return attendance.some(function(a) { return a.session_id === s.id && a.enrolment_id === e.id && a.attendance_status === 'absent'; }); }).length;
      var obligationsFor = filteredObligations.filter(function(o) { return o.enrolment_id === e.id; });
      var feesByCurrency = {};
      obligationsFor.forEach(function(o) { var code = o.currency || '—'; if (!feesByCurrency[code]) feesByCurrency[code] = { owed: 0, paid: 0 }; feesByCurrency[code].owed += Number(o.amount || 0); feesByCurrency[code].paid += allocations.filter(function(a) { return a.obligation_id === o.id; }).reduce(function(sum, a) { return sum + Number(a.amount || 0); }, 0); });
      return { enrolment: e, student: person, classRecord: cls, held: eligible.length, present: present, absent: absent, percent: eligible.length ? present / eligible.length * 100 : null, feesByCurrency: feesByCurrency };
    });
    var sessionIds = selectedSessions.map(function(s) { return s.id; });
    var hoursRows = teachingHours.filter(function(h) { return sessionIds.indexOf(h.session_id) !== -1; }).map(function(h) { var session = sessions.find(function(s) { return s.id === h.session_id; }) || {}; var cls = classes.find(function(c) { return c.id === session.class_id; }) || {}; return { record: h, session: session, classRecord: cls }; }).filter(function(row) { return row.session.session_status !== 'cancelled'; });
    var esc = function(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    var csvEscape = function(value) { return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"'; };
    var exportCsv = function() {
      var lines = [['Institute', selectedInstitute ? selectedInstitute.institute_name : '', 'Month', selectedMonth], [], ['Student', 'Class', 'Held sessions', 'Present', 'Absent', 'Attendance %', 'Currency', 'Fees', 'Paid', 'Balance']];
      rows.forEach(function(row) { var keys = Object.keys(row.feesByCurrency); if (!keys.length) lines.push([row.student.full_name, row.classRecord.class_name, row.held, row.present, row.absent, row.percent == null ? 'N/A' : row.percent.toFixed(1), '', '', '', '']); else keys.forEach(function(code) { var f = row.feesByCurrency[code]; lines.push([row.student.full_name, row.classRecord.class_name, row.held, row.present, row.absent, row.percent == null ? 'N/A' : row.percent.toFixed(1), code, f.owed, f.paid, Math.max(0, f.owed - f.paid)]); }); });
      lines.push([], ['Payment history'], ['Date', 'Student', 'Class', 'Method', 'Currency', 'Amount']);
      payments.forEach(function(payment) { allocations.filter(function(allocation) { return allocation.payment_id === payment.id && filteredObligations.some(function(obligation) { return obligation.id === allocation.obligation_id; }); }).forEach(function(allocation) { var obligation = filteredObligations.find(function(row) { return row.id === allocation.obligation_id; }) || {}; var e = enrolments.find(function(row) { return row.id === obligation.enrolment_id; }) || {}; var person = students.find(function(row) { return row.id === e.student_id; }) || {}; var cls = classes.find(function(row) { return row.id === e.class_id; }) || {}; lines.push([payment.date, person.full_name, cls.class_name, payment.method, payment.currency, allocation.amount]); }); });
      lines.push([], ['Teaching hours'], ['Date', 'Class', 'Session type', 'Recording method', 'Hours']);
      hoursRows.forEach(function(row) { lines.push([String(row.session.session_date || '').slice(0, 10), row.classRecord.class_name, row.session.session_type, row.record.recording_method, Number(row.record.duration_minutes || 0) / 60]); });
      return lines.map(function(line) { return line.map(csvEscape).join(','); }).join('\r\n');
    };
    var shareCsv = function() {
      var FileSystem = require('expo-file-system/legacy');
      var Sharing = require('expo-sharing');
      var uri = FileSystem.cacheDirectory + 'classpilot-report-' + selectedMonth + '.csv';
      FileSystem.writeAsStringAsync(uri, exportCsv(), { encoding: FileSystem.EncodingType.UTF8 }).then(function() { return Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: 'Export ClassPilot report' }); }).catch(function(error) { notify('Export failed', error.message); });
    };
    var sharePdf = function() {
      var Print = require('expo-print');
      var Sharing = require('expo-sharing');
      var body = rows.map(function(row) { return '<tr><td>' + esc(row.student.full_name) + '</td><td>' + esc(row.classRecord.class_name) + '</td><td>' + row.held + '</td><td>' + row.present + '</td><td>' + row.absent + '</td><td>' + (row.percent == null ? 'N/A' : row.percent.toFixed(1) + '%') + '</td></tr>'; }).join('');
      var hoursBody = hoursRows.map(function(row) { return '<tr><td>' + esc(String(row.session.session_date || '').slice(0, 10)) + '</td><td>' + esc(row.classRecord.class_name) + '</td><td>' + esc(row.session.session_type) + '</td><td>' + esc(row.record.recording_method) + '</td><td>' + (Number(row.record.duration_minutes || 0) / 60).toFixed(2) + '</td></tr>'; }).join('');
      var feeSummaryBody = Object.keys(currencySummary).sort().map(function(code) { var totals = currencySummary[code]; return '<tr><td>' + esc(code) + '</td><td>' + esc(formatCurrency(totals.owed, code)) + '</td><td>' + esc(formatCurrency(totals.paid, code)) + '</td><td>' + esc(formatCurrency(Math.max(0, totals.owed - totals.paid), code)) + '</td></tr>'; }).join('');
      var html = '<html><body><h1>ClassPilot report</h1><p>Institute: ' + esc(selectedInstitute && selectedInstitute.institute_name) + ' · Month: ' + esc(selectedMonth) + '</p><h2>Attendance</h2><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Student</th><th>Class</th><th>Held</th><th>Present</th><th>Absent</th><th>Attendance</th></tr></thead><tbody>' + body + '</tbody></table><h2>Fee totals by currency</h2><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Currency</th><th>Owed</th><th>Paid</th><th>Outstanding</th></tr></thead><tbody>' + feeSummaryBody + '</tbody></table><h2>Teaching hours</h2><p>Actual recorded duration: ' + (totalMinutes / 60).toFixed(2) + ' hours. No commission or teacher pay is calculated.</p><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Date</th><th>Class</th><th>Session type</th><th>Method</th><th>Hours</th></tr></thead><tbody>' + hoursBody + '</tbody></table></body></html>';
      Print.printToFileAsync({ html: html }).then(function(result) { return Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Export ClassPilot report' }); }).catch(function(error) { notify('PDF export failed', error.message); });
    };
    var totalMinutes = hoursRows.reduce(function(sum, row) { return sum + Number(row.record.duration_minutes || 0); }, 0);
    var currencySummary = {};
    filteredObligations.forEach(function(o) { var code = o.currency || '—'; if (!currencySummary[code]) currencySummary[code] = { owed: 0, paid: 0 }; currencySummary[code].owed += Number(o.amount || 0); currencySummary[code].paid += allocations.filter(function(a) { return a.obligation_id === o.id; }).reduce(function(sum, a) { return sum + Number(a.amount || 0); }, 0); });
    return React.createElement(View, { style: styles.screen, componentId: 'reports-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'reports', title: 'Reports', subtitle: selectedInstitute ? selectedInstitute.institute_name + ' · ' + selectedMonth : 'Attendance, fees & teaching hours' }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 12, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'reports-scroll' },
        React.createElement(Text, { style: styles.fieldLabel }, 'Institute'),
        institutes.filter(function(x) { return x && !x.is_archived; }).map(function(item, i) { return React.createElement(TouchableOpacity, { key: item.id, style: [styles.reportInstituteOption, selectedInstituteId === item.id ? styles.reportInstituteOptionSelected : null], onPress: function() { setSelectedInstituteId(item.id); }, componentId: 'reports-institute-' + i }, React.createElement(Text, { style: styles.reportInstituteText }, item.institute_name)); }),
        React.createElement(Text, { style: styles.fieldLabel }, 'Report month'),
        React.createElement(TextInput, { style: styles.reportMonthInput, value: selectedMonth, onChangeText: setSelectedMonth, placeholder: 'YYYY-MM', placeholderTextColor: MUTED, componentId: 'reports-month-input' }),
        selectedInstituteId ? React.createElement(View, null,
          React.createElement(Text, { style: styles.sectionTitle }, 'Attendance'),
          React.createElement(Text, { style: styles.reportNote }, 'Only held sessions count. Unmarked attendance remains pending; cancelled sessions are excluded. Filters: ' + selectedInstitute.institute_name + ', ' + selectedMonth + '.'),
          rows.length ? rows.map(function(row, i) { return React.createElement(View, { key: row.enrolment.id, style: styles.listCard, componentId: 'reports-student-' + i }, React.createElement(View, { style: { flex: 1 } }, React.createElement(Text, { style: styles.cardTitle }, row.student.full_name), React.createElement(Text, { style: styles.meta }, row.classRecord.class_name + ' · ' + row.held + ' held · ' + row.present + ' present · ' + row.absent + ' absent'), React.createElement(Text, { style: styles.statusText }, row.percent == null ? 'No held sessions' : row.percent.toFixed(1) + '% attendance'))); }) : React.createElement(EmptyLine, { id: 'reports-no-attendance', text: 'No enrolments in this institute for this month.' }),
          React.createElement(Text, { style: styles.sectionTitle }, 'Outstanding fees'),
          Object.keys(currencySummary).sort().map(function(code, i) { var totals = currencySummary[code]; return React.createElement(Text, { key: code, style: styles.meta, componentId: 'reports-fee-summary-' + i }, code + ' · Owed ' + formatCurrency(totals.owed, code) + ' · Paid ' + formatCurrency(totals.paid, code) + ' · Outstanding ' + formatCurrency(Math.max(0, totals.owed - totals.paid), code)); }),
          filteredObligations.map(function(o, i) { var e = enrolments.find(function(item) { return item.id === o.enrolment_id; }) || {}; var student = students.find(function(item) { return item.id === e.student_id; }) || {}; var paid = allocations.filter(function(a) { return a.obligation_id === o.id; }).reduce(function(sum, a) { return sum + Number(a.amount || 0); }, 0); var balance = Math.max(0, Number(o.amount) - paid); return balance > 0 ? React.createElement(Text, { key: o.id, style: styles.meta, componentId: 'reports-fee-' + i }, student.full_name + ' · ' + formatCurrency(balance, o.currency) + ' · ' + o.period) : null; }),
          React.createElement(Text, { style: styles.sectionTitle }, 'Institute teaching hours'),
          React.createElement(Text, { style: styles.body }, 'Recorded actual duration total: ' + (totalMinutes / 60).toFixed(2) + ' hours. Cancelled sessions contribute zero. No commission or teacher pay is calculated.'),
          hoursRows.map(function(row, i) { return React.createElement(Text, { key: row.record.id || i, style: styles.meta, componentId: 'reports-hour-' + i }, String(row.session.session_date || '').slice(0, 10) + ' · ' + row.classRecord.class_name + ' · ' + row.session.session_type + ' · ' + (Number(row.record.duration_minutes || 0) / 60).toFixed(2) + ' hours'); }),
          React.createElement(View, { style: styles.reportOptions }, React.createElement(ActionButton, { id: 'reports-export-csv', label: 'Export CSV', icon: 'download-outline', onPress: shareCsv }), React.createElement(ActionButton, { id: 'reports-export-pdf', label: 'Export attendance PDF', secondary: true, icon: 'document-outline', onPress: sharePdf }))
        ) : React.createElement(EmptyLine, { id: 'reports-select-institute', text: 'Choose an institute to generate a filtered report.' })
      )
    );
  };
// @end:ReportsScreen
  // @section:SettingsScreen @depends:[ThemeContext,styles,helpers]
  var SettingsScreen = function(props) {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var biometrics = useBiometrics();
    var sharing = useShare();
    var picker = useFilePicker();
    var holidaysQuery = useQuery('holidays');
    var deleteHoliday = useMutation('holidays', 'delete');
    var [preferences, setPreferences] = useStorage('classpilot-preferences', { biometricLock: false });
    var backupState = useStorage('classpilot-last-successful-backup', null);
    var lastBackup = backupState[0];
    var setLastBackup = backupState[1];
    var backupIsStale = !lastBackup || Date.now() - new Date(lastBackup).getTime() > 30 * 24 * 60 * 60 * 1000;
    var [message, setMessage] = React.useState('');
    var [holidayDate, setHolidayDate] = React.useState(today());
    var [holidayName, setHolidayName] = React.useState('');
    var saveHoliday = function() { addHoliday(holidayDate, holidayName).then(function() { setHolidayName(''); setMessage('Holiday saved. Scheduled sessions on that date were cancelled and retained in history.'); }).catch(function(error) { notify('Holiday not saved', error.message); }); };
    var createBackup = function() {
      exportBackup().then(function(data) { return sharing.share(data); }).then(function(result) {
        if (!result.success) { notify('Backup not completed', result.error); return; }
        setLastBackup(new Date().toISOString());
        setMessage('Backup file prepared. Store it somewhere safe; it contains student and financial data.');
      }).catch(function(error) { notify('Backup failed', error.message); });
    };
    var importBackup = function() {
      picker.pickFile().then(function(raw) {
        if (!raw) return;
        validateBackupFile(raw);
        confirmAction('Restore replaces all ClassPilot data on this device. The selected backup is valid. Continue?', function() {
          restoreBackup(raw).then(function() { setLastBackup(null); setMessage('Backup restored.'); }).catch(function(error) { notify('Restore failed', error.message); });
        });
      }).catch(function(error) { notify('Backup not restored', error.message); });
    };
    var toggleLock = function() {
      if (preferences.biometricLock) {
        biometrics.authenticate({ promptMessage: 'Turn off ClassPilot app lock' }).then(function(result) {
          if (result.success) setPreferences(function(p) { return Object.assign({}, p, { biometricLock: false }); });
          else if (result.error) notify('Could not authenticate', String(result.error));
        });
      } else if (!biometrics.isBiometricsAvailable) {
        notify('Biometrics unavailable', 'Set up biometrics on this device to enable the optional lock.');
      } else {
        biometrics.authenticate({ promptMessage: 'Enable ClassPilot app lock' }).then(function(result) {
          if (result.success) setPreferences(function(p) { return Object.assign({}, p, { biometricLock: true }); });
          else if (result.error) notify('Could not authenticate', String(result.error));
        });
      }
    };
    return React.createElement(View, { style: styles.screen, componentId: 'settings-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'settings', title: 'Settings', subtitle: 'Local data & capabilities' }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 16, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'settings-scroll' },
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'settings-security-heading' }, 'Privacy & security'),
        React.createElement(View, { style: styles.summaryCard, componentId: 'settings-security-card' },
          React.createElement(Text, { style: styles.cardTitle, componentId: 'settings-lock-title' }, 'Biometric app lock'),
          React.createElement(Text, { style: styles.body, componentId: 'settings-lock-description' }, 'Optional device authentication for opening protected records. An app lock does not encrypt the local database or backup files.'),
          React.createElement(ActionButton, { id: 'settings-lock-toggle', label: preferences.biometricLock ? 'Turn off biometric lock' : 'Enable biometric lock', secondary: true, onPress: toggleLock, style: { marginTop: 16 } })
        ),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'settings-data-heading' }, 'Backup & exports'),
        React.createElement(View, { style: styles.summaryCard, componentId: 'settings-backup-card' },
          React.createElement(Text, { style: styles.cardTitle, componentId: 'settings-backup-title' }, 'Manual full backup'),
          React.createElement(Text, { style: styles.body, componentId: 'settings-backup-description' }, lastBackup ? 'Last shared successfully: ' + labelDate(String(lastBackup).slice(0, 10)) : 'No successful backup recorded yet.'),
          backupIsStale ? React.createElement(Text, { style: styles.errorText, componentId: 'settings-backup-stale' }, lastBackup ? 'Backup reminder: your last backup is over 30 days old.' : 'Backup reminder: create your first backup.') : null,
          React.createElement(Text, { style: styles.meta, componentId: 'settings-backup-warning' }, 'Backup files are not encrypted and may contain sensitive student and financial information. Store them safely. App lock does not encrypt data.'),
          React.createElement(ActionButton, { id: 'settings-export-backup', label: 'Create backup file', icon: 'download-outline', onPress: createBackup, style: { marginTop: 12 } }),
          React.createElement(ActionButton, { id: 'settings-import-backup', label: 'Restore backup', secondary: true, icon: 'refresh-outline', onPress: importBackup, style: { marginTop: 8 } })
        ),
        React.createElement(View, { style: styles.summaryCard, componentId: 'settings-exports-card' },
          React.createElement(Text, { style: styles.cardTitle, componentId: 'settings-exports-title' }, 'PDF and CSV reports'),
          React.createElement(Text, { style: styles.body, componentId: 'settings-exports-description' }, 'Filtered report exports are available from the report screens. Exports keep totals separated by currency.')
        ),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'settings-holidays-heading' }, 'Holiday calendar'),
        React.createElement(View, { style: styles.summaryCard, componentId: 'settings-holidays-card' },
          React.createElement(Text, { style: styles.body }, 'A saved holiday cancels scheduled sessions on that date and keeps their history.'),
          React.createElement(TextInput, { style: styles.input, value: holidayDate, onChangeText: setHolidayDate, placeholder: 'Date YYYY-MM-DD', placeholderTextColor: MUTED, componentId: 'settings-holiday-date' }),
          React.createElement(TextInput, { style: styles.input, value: holidayName, onChangeText: setHolidayName, placeholder: 'Holiday name (optional)', placeholderTextColor: MUTED, componentId: 'settings-holiday-name' }),
          React.createElement(ActionButton, { id: 'settings-holiday-save', label: 'Add holiday', onPress: saveHoliday }),
          holidaysQuery.data.map(function(holiday, i) { return React.createElement(View, { key: holiday.id, style: styles.paymentHistoryRow, componentId: 'settings-holiday-' + i }, React.createElement(Text, { style: styles.body }, labelDate(holiday.date) + (holiday.name ? ' · ' + holiday.name : '')), React.createElement(TouchableOpacity, { onPress: function() { confirmAction('Remove this holiday? Sessions already cancelled for that date remain cancelled.', function() { deleteHoliday.mutate({ id: holiday.id }).catch(function(error) { notify('Could not remove holiday', error.message); }); }); } }, React.createElement(Text, { style: styles.errorText }, 'Remove'))); })
        ),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'settings-scope-heading' }, 'What works today'),
        React.createElement(View, { style: styles.summaryCard, componentId: 'settings-scope-card' },
          React.createElement(Text, { style: styles.body, componentId: 'settings-scope-text' }, 'Operational records are stored on this device. ClassPilot has no required account, hosted backend, or cloud sync. An app lock controls access but does not encrypt local records or backup files.'),
          React.createElement(Text, { style: [styles.body, { marginTop: 12 }], componentId: 'settings-future-text' }, 'Your last successful backup: ' + (lastBackup ? labelDate(String(lastBackup).slice(0, 10)) : 'Not recorded. Create manual backups regularly.'))
        ),
        picker.error ? React.createElement(Text, { style: styles.errorText, componentId: 'settings-picker-error' }, picker.error) : null,
        message ? React.createElement(Text, { style: styles.meta, componentId: 'settings-message' }, message) : null
      )
    );
  };
  // @end:SettingsScreen

  // @section:styles @depends:[theme]
  const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: BACKGROUND },
    header: { backgroundColor: PRIMARY, minHeight: 88, paddingHorizontal: 16, paddingVertical: 16, justifyContent: 'center' },
    headerTop: { flexDirection: 'row', alignItems: 'center' },
    headerIcon: { minWidth: 48, minHeight: 48, justifyContent: 'center' },
    headerTitle: { fontSize: 28, fontWeight: '700', color: CARD },
    headerSubtitle: { fontSize: 14, color: '#EDF5F5', marginTop: 4 },
    hero: { backgroundColor: PRIMARY, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },
    eyebrowLight: { fontSize: 12, fontWeight: '600', color: '#EDF5F5', letterSpacing: 1 },
    heroTitle: { fontSize: 32, fontWeight: '700', color: CARD, marginTop: 8 },
    content: { paddingHorizontal: 16, paddingTop: 16 },
    sectionTitle: { fontSize: 21, fontWeight: '600', color: INK, marginBottom: 16, marginTop: 20 },
    cardTitle: { fontSize: 17, fontWeight: '600', color: INK },
    body: { fontSize: 15, lineHeight: 24, color: INK, marginTop: 8 },
    meta: { fontSize: 13, lineHeight: 20, color: MUTED, marginTop: 4 },
    statusText: { fontSize: 13, fontWeight: '600', color: PRIMARY, marginTop: 8 },
    metrics: { flexDirection: 'row', gap: 8 },
    metric: { flex: 1, minWidth: 0, backgroundColor: CARD, borderRadius: 16, padding: 16 },
    metricNumber: { fontSize: 28, fontWeight: '700', color: INK },
    summaryCard: { backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 12 },
    railCard: { backgroundColor: CARD, borderRadius: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', marginBottom: 8, minHeight: 88, paddingRight: 16 },
    rail: { width: 4, alignSelf: 'stretch' },
    railBody: { flex: 1, padding: 16 },
    listCard: { backgroundColor: CARD, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', minHeight: 72, marginBottom: 8, gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 999, backgroundColor: '#E3EFF0', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 20, fontWeight: '600', color: PRIMARY },
    empty: { backgroundColor: CARD, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 8 },
    emptyText: { fontSize: 15, lineHeight: 24, textAlign: 'center', color: MUTED, marginTop: 12 },
    button: { backgroundColor: ACCENT, borderRadius: 8, paddingHorizontal: 16, minHeight: 48, minWidth: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    buttonSecondary: { backgroundColor: '#E3EFF0' },
    buttonText: { fontSize: 16, fontWeight: '600', color: INK },
    input: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 8, minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: INK, marginBottom: 12 },
    notesInput: { minHeight: 96 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: INK, marginBottom: 8, marginTop: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(16,37,44,0.55)', justifyContent: 'center', paddingHorizontal: 20 },
    modalCard: { backgroundColor: CARD, borderRadius: 20, padding: 20 },
    choiceRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    choice: { minHeight: 48, minWidth: 48, paddingHorizontal: 12, borderRadius: 8, backgroundColor: BACKGROUND, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    choiceActive: { backgroundColor: '#D2E7E7' },
    choiceText: { fontSize: 13, fontWeight: '600', color: INK },
    dateOption: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    selectRow: { backgroundColor: CARD, borderRadius: 12, minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    selectedRow: { backgroundColor: '#D2E7E7' },
    smallAction: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    smallActionText: { fontSize: 13, fontWeight: '600', color: PRIMARY },
    attendanceRow: { backgroundColor: CARD, borderRadius: 16, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    attendanceName: { flex: 1, paddingRight: 8 },
    attendanceActions: { flexDirection: 'row', gap: 8 },
    markButton: { minWidth: 48, minHeight: 48, borderRadius: 8, backgroundColor: BACKGROUND, alignItems: 'center', justifyContent: 'center' },
    markPresent: { backgroundColor: '#CDE7DA' },
    markAbsent: { backgroundColor: '#F5DCD8' },
    markUnmarked: { backgroundColor: '#D2E7E7' },
    markText: { fontSize: 15, fontWeight: '700', color: INK },
    errorText: { fontSize: 14, color: DANGER, marginTop: 12 },
    reportInstitutePicker: { maxHeight: 52, marginBottom: 4 },
    reportInstituteOption: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, marginRight: 8 },
    reportInstituteOptionSelected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    reportInstituteText: { fontSize: 14, fontWeight: '600', color: INK },
    reportInstituteTextSelected: { color: CARD },
    reportMonthInput: { backgroundColor: CARD, borderWidth: 1, borderColor: BORDER, borderRadius: 8, minHeight: 48, paddingHorizontal: 12, fontSize: 16, color: INK, width: 150 },
    reportOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    reportOptionButton: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    reportOptionSelected: { backgroundColor: '#D2E7E7', borderColor: PRIMARY },
    reportOptionText: { color: INK, fontSize: 13, fontWeight: '600' },
    reportNote: { fontSize: 13, lineHeight: 19, color: MUTED, marginTop: 12, marginBottom: 10 },
    reportTableCard: { backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', marginTop: 8 },
    reportTableHeader: { flexDirection: 'row', backgroundColor: ACCENT, minHeight: 46 },
    reportTableRow: { flexDirection: 'row', minHeight: 48, borderBottomWidth: 1, borderBottomColor: BORDER, alignItems: 'stretch' },
    reportHeaderCell: { fontSize: 12, fontWeight: '700', color: INK, paddingHorizontal: 6, paddingVertical: 8, textAlign: 'center', textAlignVertical: 'center', borderRightWidth: 1, borderRightColor: 'rgba(24,49,58,0.15)' },
    reportCell: { fontSize: 12, color: INK, paddingHorizontal: 6, paddingVertical: 8, textAlign: 'center', textAlignVertical: 'center', borderRightWidth: 1, borderRightColor: BORDER },
    reportNumberCell: { width: 42 },
    reportStudentCell: { width: 150, textAlign: 'left' },
    reportClassCell: { width: 150, textAlign: 'left' },
    reportDayCell: { width: 52 },
    reportFinancialCell: { width: 100 },
    reportCellInput: { minHeight: 48, backgroundColor: CARD, borderRightWidth: 1, borderRightColor: BORDER, paddingHorizontal: 5, paddingVertical: 6, color: INK, fontSize: 12, textAlign: 'center' },
    reportPresentCell: { color: SUCCESS, fontWeight: '700', backgroundColor: '#EEF7F1' },
    reportAbsentCell: { color: DANGER, fontWeight: '700', backgroundColor: '#FCF0EF' },
    reportSummary: { padding: 14, borderTopWidth: 1, borderTopColor: BORDER },
    reportCurrencySummary: { backgroundColor: BACKGROUND, borderRadius: 10, padding: 12, marginTop: 10 },
    reportCurrencyTitle: { fontSize: 15, fontWeight: '700', color: PRIMARY },
    reportNet: { fontSize: 16, fontWeight: '700', color: INK, marginTop: 8 }
    ,paymentHistoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: BORDER }
  });
  // @end:styles

  // @section:TabNavigator @depends:[HomeScreen,ClassesScreen,StudentsScreen,ReportsScreen,SettingsScreen,navigation-setup]
  var TabNavigator = function() {
    var insets = useSafeAreaInsets();
    return React.createElement(View, { style: { flex: 1, width: '100%', height: '100%', overflow: 'hidden' }, componentId: 'main-tab-shell' },
      React.createElement(Tab.Navigator, {
        screenOptions: function(options) {
          var icons = { Home: 'home-outline', Classes: 'library-outline', Students: 'people-outline', Fees: 'cash-outline', Reports: 'stats-chart-outline', Settings: 'settings-outline' };
          return {
            headerShown: false,
            tabBarActiveTintColor: PRIMARY,
            tabBarInactiveTintColor: MUTED,
            tabBarActiveBackgroundColor: CARD,
            tabBarInactiveBackgroundColor: CARD,
            tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
            tabBarItemStyle: { padding: 0 },
            tabBarStyle: { position: 'absolute', bottom: 0, height: Platform.OS === 'web' ? TAB_MENU_HEIGHT : TAB_MENU_HEIGHT + insets.bottom, paddingBottom: 0, borderTopWidth: 0, backgroundColor: CARD },
            tabBarIcon: function(p) { return React.createElement(Ionicons, { name: icons[options.route.name] || 'ellipse-outline', size: 22, color: p.color }); }
          };
        }
      },
        React.createElement(Tab.Screen, { name: 'Home', component: HomeScreen }),
    React.createElement(Tab.Screen, { name: 'Classes', component: ClassesScreen }),
        React.createElement(Tab.Screen, { name: 'Students', component: StudentsScreen }),
        React.createElement(Tab.Screen, { name: 'Fees', component: FeesScreen }),
        React.createElement(Tab.Screen, { name: 'Reports', component: ReportsScreen }),
        React.createElement(Tab.Screen, { name: 'Settings', component: SettingsScreen })
      )
    );
  };
  // @end:TabNavigator

  // @section:MainNavigator @depends:[TabNavigator,ClassDetailScreen,StudentProfileScreen,EnrolmentScreen,AttendanceScreen,navigation-setup]
var MainNavigator = function() {
    return React.createElement(Stack.Navigator, { initialRouteName: 'Main', screenOptions: { headerShown: false } },
      React.createElement(Stack.Screen, { name: 'Main', component: TabNavigator }),
      React.createElement(Stack.Screen, { name: 'ClassDetail', component: ClassDetailScreen, initialParams: { classId: null } }),
      React.createElement(Stack.Screen, { name: 'StudentProfile', component: StudentProfileScreen, initialParams: { studentId: null } }),
      React.createElement(Stack.Screen, { name: 'Enrolment', component: EnrolmentScreen, initialParams: { classId: null, studentId: null } }),
      React.createElement(Stack.Screen, { name: 'Attendance', component: AttendanceScreen, initialParams: { sessionId: null } })
    );
  };
// @end:MainNavigator

  // @section:return @depends:[ThemeProvider,MainNavigator,sample-data]
  if (!databaseReady) return React.createElement(View, { style: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BACKGROUND } }, React.createElement(Text, { style: { color: PRIMARY } }, 'Loading your local records…'));
  if (rootPreferences.biometricLock && !isUnlocked) return React.createElement(View, { style: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: BACKGROUND } },
    React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
    React.createElement(Text, { style: { fontSize: 25, fontWeight: '700', color: INK, marginBottom: 10 } }, 'ClassPilot is locked'),
    React.createElement(Text, { style: { color: MUTED, textAlign: 'center', lineHeight: 21, marginBottom: 20 } }, 'Biometric app lock restricts access on this device. It does not encrypt the local database or backup files.'),
    React.createElement(TouchableOpacity, { style: styles.button, onPress: unlockApp }, React.createElement(Text, { style: styles.buttonText }, 'Unlock with biometrics'))
  );
  return React.createElement(ThemeProvider, null,
    React.createElement(View, { style: { flex: 1, width: '100%', height: '100%' }, componentId: 'app-root' },
      React.createElement(MainNavigator)
    )
  );
  // @end:return
};
module.exports = ComponentFunction;



