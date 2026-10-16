const ComponentFunction = function() {
  // @section:imports @depends:[]
  const React = require('react');
  const { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, StatusBar, useWindowDimensions } = require('react-native');
  const { Ionicons } = require('@expo/vector-icons');
  const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
  const { createStackNavigator } = require('@react-navigation/stack');
  const { useSafeAreaInsets } = require('react-native-safe-area-context');
  const { useQuery, useMutation, useStorage, seedSampleRows, useBiometrics, useShare, useFilePicker } = require('../data/platform-hooks');
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

  // @section:sample-data @depends:[]
  var SAMPLE_ROWS = {
    institutes: [
      { institute_name: 'Northbridge Learning Centre', notes: 'After-school programmes', is_archived: false },
      { institute_name: 'Harbour Arts Academy', notes: 'Weekend workshops', is_archived: false }
    ],
    classes: [
      { institute_id: 'sample-institutes-1', class_name: 'Year 8 Mathematics', notes: 'Tuesday and Thursday group', is_archived: false },
      { institute_id: 'sample-institutes-1', class_name: 'GCSE English Literature', notes: 'Small-group revision', is_archived: false },
      { institute_id: 'sample-institutes-2', class_name: 'Creative Writing Studio', notes: 'Saturday mornings', is_archived: false },
      { institute_id: null, class_name: 'A-Level Physics Tutoring', notes: 'Independent class', is_archived: false }
    ],
    students: [
      { full_name: 'Amira Patel', student_phone: '', guardian_name: 'Nisha Patel', guardian_phone: '07123 456789', notes: 'Prefers written examples' },
      { full_name: 'Leo Bennett', student_phone: '07234 567890', guardian_name: 'Morgan Bennett', guardian_phone: '', notes: '' },
      { full_name: 'Sofia Chen', student_phone: '', guardian_name: 'Daniel Chen', guardian_phone: '07345 678901', notes: 'Enjoys group exercises' },
      { full_name: 'Noah Williams', student_phone: '07456 789012', guardian_name: '', guardian_phone: '', notes: '' }
    ],
    enrolments: [
      { student_id: 'sample-students-1', class_id: 'sample-classes-1', start_date: '@day(-30)', end_date: null, is_active: true },
      { student_id: 'sample-students-2', class_id: 'sample-classes-1', start_date: '@day(-24)', end_date: null, is_active: true },
      { student_id: 'sample-students-3', class_id: 'sample-classes-2', start_date: '@day(-15)', end_date: null, is_active: true },
      { student_id: 'sample-students-4', class_id: 'sample-classes-4', start_date: '@day(-10)', end_date: null, is_active: true }
    ],
    sessions: [
      { class_id: 'sample-classes-1', session_date: '@day(0)', session_type: 'regular', session_status: 'scheduled', duration_minutes: 60, original_session_id: null, notes: 'Algebra and equations' },
      { class_id: 'sample-classes-2', session_date: '@day(0)', session_type: 'regular', session_status: 'scheduled', duration_minutes: 75, original_session_id: null, notes: 'Poetry analysis' },
      { class_id: 'sample-classes-4', session_date: '@day(1)', session_type: 'extra', session_status: 'scheduled', duration_minutes: 90, original_session_id: null, notes: 'Exam preparation' },
      { class_id: 'sample-classes-3', session_date: '@day(-2)', session_type: 'regular', session_status: 'cancelled', duration_minutes: 60, original_session_id: null, notes: 'School holiday' }
    ],
    attendance_records: []
  };
  // @end:sample-data

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
    var todaysSessions = sessionsQuery.data.filter(function(s) { return s && String(s.session_date || '').slice(0, 10) === current; });
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
        React.createElement(ActionButton, { id: 'classes-add-class', label: activeInstitute ? 'Add class to institute' : 'New independent class', secondary: true, icon: 'add', onPress: function() { setMode('class'); }, style: { marginTop: 8 } })
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
        return s && ((s.full_name || '').trim().toLowerCase() === name.trim().toLowerCase() || (phone && s.student_phone === phone) || (guardianPhone && s.guardian_phone === guardianPhone));
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
    var roster = enrolmentsQuery.data.filter(function(e) { return e && e.class_id === classId; });
    var sessions = sessionsQuery.data.filter(function(s) { return s && s.class_id === classId; }).sort(function(a, b) { return String(b.session_date || '').localeCompare(String(a.session_date || '')); });
    var [showSession, setShowSession] = React.useState(false);
    var [sessionDate, setSessionDate] = React.useState(today());
    var [sessionType, setSessionType] = React.useState('regular');
    var [duration, setDuration] = React.useState('60');
    var [sessionNotes, setSessionNotes] = React.useState('');
    var [originalId, setOriginalId] = React.useState(null);
    var [weeklyDay, setWeeklyDay] = React.useState(String(new Date().getDay()));
    var [weeklyTime, setWeeklyTime] = React.useState('09:00');
    var [weeklyEnabled, setWeeklyEnabled] = React.useState(!!c.weekly_schedule_enabled);
    var [weeklyMessage, setWeeklyMessage] = React.useState('');
    var createSession = function() {
      if (c.is_archived) { notify('Class archived', 'Restore this class before adding sessions.'); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate) || isNaN(new Date(sessionDate + 'T12:00:00').getTime())) { notify('Invalid date', 'Choose a valid session date.'); return; }
      if (sessions.some(function(s) { return String(s.session_date || '').slice(0, 10) === sessionDate && s.session_type === sessionType && s.session_status !== 'cancelled'; })) {
        notify('Possible duplicate', 'A session of this type already exists on that date.'); return;
      }
      insertSession.mutate({ class_id: classId, session_date: sessionDate, session_type: sessionType, session_status: 'scheduled', duration_minutes: Number(duration) || 60, original_session_id: originalId, notes: sessionNotes }).then(function() {
        sessionsQuery.refetch(); setShowSession(false); setSessionNotes(''); setOriginalId(null);
      }).catch(function(e) { notify('Could not add session', e.message); });
    };
    var saveWeeklySchedule = function() {
      var time = String(weeklyTime || '').trim();
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) { notify('Invalid time', 'Enter the weekly start time as HH:MM using the 24-hour clock.'); return; }
      updateClass.mutate({ id: classId, data: { weekly_schedule_enabled: weeklyEnabled, weekly_day: Number(weeklyDay), weekly_time: time } }).then(function() {
        classesQuery.refetch();
        setWeeklyMessage(weeklyEnabled ? 'Weekly schedule saved. Add dated sessions as they are confirmed; this setting does not create unlimited future sessions.' : 'Weekly schedule turned off.');
      }).catch(function(e) { notify('Schedule not saved', e.message || 'Please try again.'); });
    };
    var weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return React.createElement(View, { style: styles.screen, componentId: 'class-detail-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'class-detail', title: c.class_name || 'Class details', subtitle: institute.institute_name || 'Independent class', onBack: function() { props.navigation.goBack(); } }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'class-detail-scroll' },
        React.createElement(View, { style: styles.summaryCard, componentId: 'class-detail-summary' },
          React.createElement(Text, { style: styles.metricNumber, componentId: 'class-detail-roster-count' }, String(roster.filter(function(e) { return e.is_active !== false; }).length)),
          React.createElement(Text, { style: styles.meta, componentId: 'class-detail-roster-label' }, 'Active students · ' + sessions.length + ' recorded sessions'),
          React.createElement(Text, { style: styles.statusText, componentId: 'class-detail-state' }, c.is_archived ? 'Archived · history preserved' : 'Active class')
        ),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'class-detail-weekly-heading' }, 'Weekly regular schedule'),
        React.createElement(View, { style: styles.summaryCard, componentId: 'class-detail-weekly-card' },
          React.createElement(Text, { style: styles.body, componentId: 'class-detail-weekly-description' }, 'Set the recurring weekday and start time for this regular class. This records the timetable rule; dated sessions are still added individually so future records are not generated without limit.'),
          React.createElement(TouchableOpacity, { style: [styles.choice, weeklyEnabled ? styles.choiceActive : null], onPress: function() { setWeeklyEnabled(!weeklyEnabled); }, componentId: 'class-detail-weekly-toggle' },
            React.createElement(Text, { style: styles.choiceText, componentId: 'class-detail-weekly-toggle-label' }, weeklyEnabled ? 'Weekly schedule enabled' : 'Enable weekly schedule')
          ),
          React.createElement(Text, { style: styles.fieldLabel, componentId: 'class-detail-weekly-day-label' }, 'Every week on'),
          React.createElement(View, { style: styles.choiceRow, componentId: 'class-detail-weekly-day-row' },
            weekdayNames.map(function(day, index) {
              return React.createElement(TouchableOpacity, { key: day, style: [styles.choice, Number(weeklyDay) === index ? styles.choiceActive : null], onPress: function() { setWeeklyDay(String(index)); }, componentId: 'class-detail-weekly-day-' + index },
                React.createElement(Text, { style: styles.choiceText, componentId: 'class-detail-weekly-day-text-' + index }, day)
              );
            })
          ),
          React.createElement(Text, { style: styles.fieldLabel, componentId: 'class-detail-weekly-time-label' }, 'Start time (24-hour HH:MM)'),
          React.createElement(TextInput, { style: styles.input, value: weeklyTime, onChangeText: setWeeklyTime, placeholder: '09:00', placeholderTextColor: MUTED, keyboardType: 'numbers-and-punctuation', componentId: 'class-detail-weekly-time' }),
          React.createElement(ActionButton, { id: 'class-detail-weekly-save', label: 'Save weekly schedule', secondary: true, onPress: saveWeeklySchedule }),
          weeklyMessage ? React.createElement(Text, { style: styles.statusText, componentId: 'class-detail-weekly-message' }, weeklyMessage) : null
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
        !c.is_archived ? React.createElement(ActionButton, { id: 'class-detail-enrol', label: 'Enrol a student', secondary: true, icon: 'person-add-outline', onPress: function() { props.navigation.navigate('Enrolment', { classId: classId }); }, style: { marginTop: 8 } }) : null,
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
        !c.is_archived ? React.createElement(ActionButton, { id: 'class-detail-add-session', label: 'Add session', icon: 'add', onPress: function() { setShowSession(true); }, style: { marginTop: 8 } }) : null,
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
              React.createElement(Text, { style: styles.fieldLabel, componentId: 'session-duration-label' }, 'Duration in minutes'),
              React.createElement(TextInput, { style: styles.input, value: duration, onChangeText: function(t) { setDuration(t.replace(/[^0-9]/g, '')); }, keyboardType: 'numeric', placeholder: '60', placeholderTextColor: MUTED, componentId: 'session-duration-input' }),
              React.createElement(TextInput, { style: [styles.input, styles.notesInput], value: sessionNotes, onChangeText: setSessionNotes, multiline: true, numberOfLines: 4, textAlignVertical: 'top', placeholder: 'Session notes (optional)', placeholderTextColor: MUTED, componentId: 'session-notes-input' })
            ),
            React.createElement(ActionButton, { id: 'session-save', label: 'Save session', onPress: createSession, disabled: sessionType === 'cover_up' && !originalId }),
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
    var studentsQuery = useQuery('students');
    var enrolmentsQuery = useQuery('enrolments');
    var insertEnrolment = useMutation('enrolments', 'insert');
    var [classId, setClassId] = React.useState(params.classId || null);
    var [studentId, setStudentId] = React.useState(params.studentId || null);
    var [startDate, setStartDate] = React.useState(today());
    var save = function() {
      if (!classId || !studentId) { notify('Choose both', 'Select a class and a student.'); return; }
      if (enrolmentsQuery.data.some(function(e) { return e && e.class_id === classId && e.student_id === studentId && e.is_active !== false; })) {
        notify('Already enrolled', 'This student is already active in that class.'); return;
      }
      insertEnrolment.mutate({ class_id: classId, student_id: studentId, start_date: startDate, end_date: null, is_active: true }).then(function() {
        enrolmentsQuery.refetch(); notify('Enrolled', 'The student is now on the class roster.'); props.navigation.goBack();
      }).catch(function(e) { notify('Could not enrol', e.message); });
    };
    return React.createElement(View, { style: styles.screen, componentId: 'enrolment-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'enrolment', title: 'New enrolment', subtitle: 'Keep each class history separate', onBack: function() { props.navigation.goBack(); } }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'enrolment-scroll' },
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'enrolment-student-heading' }, 'Student'),
        studentsQuery.data.length ? studentsQuery.data.filter(function(s) { return !!s; }).map(function(s, i) {
          return React.createElement(TouchableOpacity, { key: String(s.id || i), style: [styles.selectRow, studentId === s.id ? styles.selectedRow : null], onPress: function() { setStudentId(s.id); }, componentId: 'enrolment-student-' + i },
            React.createElement(Text, { style: styles.cardTitle, componentId: 'enrolment-student-name-' + i }, s.full_name || 'Unnamed student'),
            studentId === s.id ? React.createElement(Ionicons, { name: 'checkmark-circle', size: 24, color: PRIMARY }) : null
          );
        }) : React.createElement(EmptyLine, { id: 'enrolment-students', text: 'Add a student in the directory first.' }),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'enrolment-class-heading' }, 'Class'),
        classesQuery.data.filter(function(c) { return c && !c.is_archived; }).length ? classesQuery.data.filter(function(c) { return c && !c.is_archived; }).map(function(c, i) {
          return React.createElement(TouchableOpacity, { key: String(c.id || i), style: [styles.selectRow, classId === c.id ? styles.selectedRow : null], onPress: function() { setClassId(c.id); }, componentId: 'enrolment-class-' + i },
            React.createElement(Text, { style: styles.cardTitle, componentId: 'enrolment-class-name-' + i }, c.class_name || 'Unnamed class'),
            classId === c.id ? React.createElement(Ionicons, { name: 'checkmark-circle', size: 24, color: PRIMARY }) : null
          );
        }) : React.createElement(EmptyLine, { id: 'enrolment-classes', text: 'Create an active class first.' }),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'enrolment-date-heading' }, 'Start date'),
        React.createElement(DatePickerInput, { value: startDate, onChange: setStartDate, componentId: 'enrolment-start-date' }),
        React.createElement(ActionButton, { id: 'enrolment-save', label: 'Save enrolment', onPress: save, style: { marginTop: 16 } })
      )
    );
  };
  // @end:EnrolmentScreen

  // @section:AttendanceScreen @depends:[ThemeContext,styles,helpers]
  var AttendanceScreen = function(props) {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var sessionId = props.route && props.route.params ? props.route.params.sessionId : null;
    var sessionsQuery = useQuery('sessions');
    var classesQuery = useQuery('classes');
    var enrolmentsQuery = useQuery('enrolments');
    var studentsQuery = useQuery('students');
    var attendanceQuery = useQuery('attendance_records');
    var insertAttendance = useMutation('attendance_records', 'insert');
    var updateAttendance = useMutation('attendance_records', 'update');
    var updateSession = useMutation('sessions', 'update');
    var session = sessionsQuery.data.find(function(s) { return s && s.id === sessionId; }) || {};
    var c = classesQuery.data.find(function(x) { return x && x.id === session.class_id; }) || {};
    var sessionDay = String(session.session_date || '').slice(0, 10);
    var roster = enrolmentsQuery.data.filter(function(e) {
      return e && e.class_id === session.class_id && (!e.start_date || String(e.start_date).slice(0, 10) <= sessionDay) && (!e.end_date || String(e.end_date).slice(0, 10) >= sessionDay);
    });
    var statusFor = function(e) {
      var record = attendanceQuery.data.find(function(a) { return a && a.enrolment_id === e.id && a.session_id === sessionId; });
      return record ? record.attendance_status : 'unmarked';
    };
    var present = roster.filter(function(e) { return statusFor(e) === 'present'; }).length;
    var absent = roster.filter(function(e) { return statusFor(e) === 'absent'; }).length;
    var unmarked = roster.length - present - absent;
    var mark = function(e, status) {
      if (session.session_status === 'cancelled') return;
      var record = attendanceQuery.data.find(function(a) { return a && a.enrolment_id === e.id && a.session_id === sessionId; });
      var action = record
        ? updateAttendance.mutate({ id: record.id, data: { attendance_status: status } })
        : insertAttendance.mutate({ enrolment_id: e.id, session_id: sessionId, attendance_status: status });
      action.then(function() { attendanceQuery.refetch(); }).catch(function(err) { notify('Attendance not saved', err.message); });
    };
    var markAll = function() {
      if (session.session_status === 'cancelled') return;
      var chain = Promise.resolve();
      roster.forEach(function(e) {
        chain = chain.then(function() {
          var record = attendanceQuery.data.find(function(a) { return a && a.enrolment_id === e.id && a.session_id === sessionId; });
          return record
            ? updateAttendance.mutate({ id: record.id, data: { attendance_status: 'present' } })
            : insertAttendance.mutate({ enrolment_id: e.id, session_id: sessionId, attendance_status: 'present' });
        });
      });
      chain.then(function() { attendanceQuery.refetch(); }).catch(function(err) { attendanceQuery.refetch(); notify('Some changes were not saved', err.message); });
    };
    return React.createElement(View, { style: styles.screen, componentId: 'attendance-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'attendance', title: 'Attendance', subtitle: (c.class_name || 'Class') + ' · ' + labelDate(session.session_date), onBack: function() { props.navigation.goBack(); } }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 16, paddingBottom: insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'attendance-scroll' },
        React.createElement(View, { style: styles.summaryCard, componentId: 'attendance-summary' },
          React.createElement(Text, { style: styles.cardTitle, componentId: 'attendance-summary-title' }, session.session_status === 'cancelled' ? 'Session cancelled' : 'Session summary'),
          React.createElement(View, { style: styles.metrics, componentId: 'attendance-counts' },
            [['Present', present], ['Absent', absent], ['Unmarked', unmarked]].map(function(pair, i) {
              return React.createElement(View, { key: pair[0], style: styles.metric, componentId: 'attendance-metric-' + i },
                React.createElement(Text, { style: styles.metricNumber, componentId: 'attendance-count-' + i }, String(pair[1])),
                React.createElement(Text, { style: styles.meta, componentId: 'attendance-count-label-' + i }, pair[0])
              );
            })
          ),
          React.createElement(Text, { style: styles.meta, componentId: 'attendance-save-note' }, 'Each change saves immediately. Unmarked is never counted as absent.')
        ),
        session.session_status !== 'cancelled' ? React.createElement(ActionButton, { id: 'attendance-mark-all', label: 'Mark all present', icon: 'checkmark-done-outline', onPress: markAll }) : null,
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'attendance-roster-heading' }, 'Class roster'),
        roster.length ? roster.map(function(e, i) {
          var s = studentsQuery.data.find(function(x) { return x && x.id === e.student_id; }) || {};
          var value = statusFor(e);
          return React.createElement(View, { key: String(e.id || i), style: styles.attendanceRow, componentId: 'attendance-student-' + i },
            React.createElement(View, { style: styles.attendanceName, componentId: 'attendance-student-info-' + i },
              React.createElement(Text, { style: styles.cardTitle, componentId: 'attendance-student-name-' + i }, s.full_name || 'Student unavailable'),
              React.createElement(Text, { style: styles.meta, componentId: 'attendance-student-status-' + i }, value.charAt(0).toUpperCase() + value.slice(1))
            ),
            session.session_status !== 'cancelled' ? React.createElement(View, { style: styles.attendanceActions, componentId: 'attendance-actions-' + i },
              React.createElement(TouchableOpacity, { style: [styles.markButton, value === 'present' ? styles.markPresent : null], onPress: function() { mark(e, 'present'); }, componentId: 'attendance-present-' + i },
                React.createElement(Text, { style: styles.markText, componentId: 'attendance-present-label-' + i }, 'P')
              ),
              React.createElement(TouchableOpacity, { style: [styles.markButton, value === 'absent' ? styles.markAbsent : null], onPress: function() { mark(e, 'absent'); }, componentId: 'attendance-absent-' + i },
                React.createElement(Text, { style: styles.markText, componentId: 'attendance-absent-label-' + i }, 'A')
              ),
              React.createElement(TouchableOpacity, { style: [styles.markButton, value === 'unmarked' ? styles.markUnmarked : null], onPress: function() { mark(e, 'unmarked'); }, componentId: 'attendance-unmarked-' + i },
                React.createElement(Text, { style: styles.markText, componentId: 'attendance-unmarked-label-' + i }, '—')
              )
            ) : null
          );
        }) : React.createElement(EmptyLine, { id: 'attendance-roster', text: 'No students were enrolled for this session date.' }),
        session.session_status === 'scheduled' && !c.is_archived ? React.createElement(ActionButton, { id: 'attendance-complete', label: 'Mark session held', secondary: true, onPress: function() {
          confirmAction('Mark this teaching session as held? Unmarked students will remain unmarked.', function() {
            updateSession.mutate({ id: sessionId, data: { session_status: 'held' } }).then(sessionsQuery.refetch).catch(function(err) { notify('Update failed', err.message); });
          });
        }, style: { marginTop: 16 } }) : null
      )
    );
  };
  // @end:AttendanceScreen

  // @section:ReportsScreen @depends:[ThemeContext,styles,helpers]
var ReportsScreen = function() {
    var insets = useSafeAreaInsets();
    var height = useWindowDimensions().height;
    var institutesQuery = useQuery('institutes');
    var classesQuery = useQuery('classes');
    var studentsQuery = useQuery('students');
    var enrolmentsQuery = useQuery('enrolments');
    var sessionsQuery = useQuery('sessions');
    var attendanceQuery = useQuery('attendance_records');
    var financialStorage = useStorage('classpilot-monthly-report-financials', {});
    var reportFinancials = financialStorage[0] || {};
    var setReportFinancials = financialStorage[1];
    var initialNow = new Date();
    var initialMonth = initialNow.getFullYear() + '-' + String(initialNow.getMonth() + 1).padStart(2, '0');
    var monthState = React.useState(initialMonth);
    var selectedMonth = monthState[0];
    var setSelectedMonth = monthState[1];
    var instituteState = React.useState('');
    var selectedInstituteId = instituteState[0];
    var setSelectedInstituteId = instituteState[1];
    var financialState = React.useState(true);
    var showFinancials = financialState[0];
    var setShowFinancials = financialState[1];
    var deductionState = React.useState(false);
    var deductQuarter = deductionState[0];
    var setDeductQuarter = deductionState[1];
    var validMonth = /^\d{4}-\d{2}$/.test(selectedMonth);
    var monthStart = validMonth ? selectedMonth + '-01' : '';
    var monthEnd = '';
    if (validMonth) {
      var monthParts = selectedMonth.split('-');
      monthEnd = selectedMonth + '-' + String(new Date(Number(monthParts[0]), Number(monthParts[1]), 0).getDate()).padStart(2, '0');
    }
    var selectedInstitute = institutesQuery.data.find(function(item) { return item && item.id === selectedInstituteId; }) || null;
    var instituteClassIds = classesQuery.data.filter(function(item) {
      return item && item.institute_id === selectedInstituteId;
    }).map(function(item) { return item.id; });
    var monthSessions = validMonth && selectedInstituteId ? sessionsQuery.data.filter(function(item) {
      var day = String(item && item.session_date || '').slice(0, 10);
      return item && instituteClassIds.indexOf(item.class_id) !== -1 && day >= monthStart && day <= monthEnd && item.session_status !== 'cancelled';
    }).sort(function(a, b) {
      return String(a.session_date || '').localeCompare(String(b.session_date || ''));
    }) : [];
    var reportDays = [];
    monthSessions.forEach(function(item) {
      var day = String(item.session_date || '').slice(0, 10);
      if (day && reportDays.indexOf(day) === -1) reportDays.push(day);
    });
    var reportRows = validMonth && selectedInstituteId ? enrolmentsQuery.data.filter(function(item) {
      if (!item || instituteClassIds.indexOf(item.class_id) === -1) return false;
      var enrolmentStart = String(item.start_date || '').slice(0, 10);
      var enrolmentEnd = String(item.end_date || '9999-12-31').slice(0, 10);
      return enrolmentStart <= monthEnd && enrolmentEnd >= monthStart;
    }).map(function(enrolment) {
      return {
        enrolment: enrolment,
        student: studentsQuery.data.find(function(item) { return item && item.id === enrolment.student_id; }) || {},
        classRecord: classesQuery.data.find(function(item) { return item && item.id === enrolment.class_id; }) || {}
      };
    }).sort(function(a, b) {
      var nameCompare = String(a.student.full_name || '').localeCompare(String(b.student.full_name || ''));
      return nameCompare || String(a.classRecord.class_name || '').localeCompare(String(b.classRecord.class_name || ''));
    }) : [];
    var reportKey = function(enrolmentId) {
      return selectedInstituteId + '|' + selectedMonth + '|' + enrolmentId;
    };
    var readAmount = function(value) {
      var amount = Number(String(value || '').replace(/,/g, ''));
      return isFinite(amount) ? amount : 0;
    };
    var money = function(value) {
      return Number(value || 0).toFixed(2);
    };
    var updateFinancialField = function(key, field, value) {
      setReportFinancials(function(previous) {
        var current = previous || {};
        var nextRow = Object.assign({}, current[key] || {});
        nextRow[field] = value;
        return Object.assign({}, current, { [key]: nextRow });
      });
    };
    var currencyGroups = {};
    reportRows.forEach(function(row) {
      var key = reportKey(row.enrolment.id);
      var record = reportFinancials[key] || {};
      var currency = String(record.currency || 'GBP').trim().toUpperCase() || 'GBP';
      if (!currencyGroups[currency]) currencyGroups[currency] = { fees: 0, openingDue: 0, priorReceived: 0, monthPayment: 0, paid: 0, pending: 0 };
      var group = currencyGroups[currency];
      var fee = readAmount(record.fee);
      var openingDue = readAmount(record.openingDue);
      var priorReceived = readAmount(record.priorReceived);
      var monthPayment = readAmount(record.monthPayment);
      group.fees += fee;
      group.openingDue += openingDue;
      group.priorReceived += priorReceived;
      group.monthPayment += monthPayment;
      group.paid += priorReceived + monthPayment;
      group.pending += Math.max(0, fee + openingDue - priorReceived - monthPayment);
    });
    var headerChildren = [
      React.createElement(Text, { key: 'no', style: [styles.reportHeaderCell, styles.reportNumberCell], componentId: 'reports-table-heading-number' }, 'No.'),
      React.createElement(Text, { key: 'student', style: [styles.reportHeaderCell, styles.reportStudentCell], componentId: 'reports-table-heading-student' }, 'Student'),
      React.createElement(Text, { key: 'class', style: [styles.reportHeaderCell, styles.reportClassCell], componentId: 'reports-table-heading-class' }, 'Class')
    ];
    reportDays.forEach(function(day, index) {
      headerChildren.push(React.createElement(Text, { key: 'day-' + day, style: [styles.reportHeaderCell, styles.reportDayCell], componentId: 'reports-table-heading-day-' + index }, String(Number(day.slice(8, 10)))));
    });
    if (showFinancials) {
      [
        ['fee', 'Fee'], ['openingDue', 'Opening due'], ['priorReceived', 'Prior received'],
        ['monthPayment', 'Month payment'], ['paid', 'Paid'], ['pending', 'Pending'],
        ['paymentDate', 'Date'], ['paymentTime', 'Time'], ['paymentMethod', 'Method'], ['currency', 'CCY']
      ].forEach(function(item) {
        headerChildren.push(React.createElement(Text, { key: 'finance-' + item[0], style: [styles.reportHeaderCell, styles.reportFinancialCell], componentId: 'reports-table-heading-' + item[0] }, item[1]));
      });
    }
    var reportTableRows = reportRows.map(function(row, index) {
      var entryKey = reportKey(row.enrolment.id);
      var record = reportFinancials[entryKey] || {};
      var currency = String(record.currency || 'GBP').trim().toUpperCase() || 'GBP';
      var paid = readAmount(record.priorReceived) + readAmount(record.monthPayment);
      var pending = Math.max(0, readAmount(record.fee) + readAmount(record.openingDue) - paid);
      var children = [
        React.createElement(Text, { key: 'no', style: [styles.reportCell, styles.reportNumberCell], componentId: 'reports-row-number-' + index }, String(index + 1)),
        React.createElement(Text, { key: 'student', style: [styles.reportCell, styles.reportStudentCell], componentId: 'reports-row-student-' + index }, row.student.full_name || 'Student profile unavailable'),
        React.createElement(Text, { key: 'class', style: [styles.reportCell, styles.reportClassCell], componentId: 'reports-row-class-' + index }, row.classRecord.class_name || 'Class unavailable')
      ];
      reportDays.forEach(function(day, dayIndex) {
        var daySessions = monthSessions.filter(function(session) { return session.class_id === row.enrolment.class_id && String(session.session_date || '').slice(0, 10) === day; });
        var marks = [];
        daySessions.forEach(function(session) {
          var attendance = attendanceQuery.data.find(function(item) { return item && item.enrolment_id === row.enrolment.id && item.session_id === session.id; });
          var mark = attendance && attendance.attendance_status === 'present' ? 'P' : attendance && attendance.attendance_status === 'absent' ? 'A' : '·';
          if (marks.indexOf(mark) === -1) marks.push(mark);
        });
        children.push(React.createElement(Text, { key: 'day-' + day, style: [styles.reportCell, styles.reportDayCell, marks.indexOf('A') !== -1 ? styles.reportAbsentCell : marks.indexOf('P') !== -1 ? styles.reportPresentCell : null], componentId: 'reports-row-' + index + '-day-' + dayIndex }, marks.length ? marks.join('/') : '—'));
      });
      if (showFinancials) {
        [
          ['fee', record.fee || ''], ['openingDue', record.openingDue || ''],
          ['priorReceived', record.priorReceived || ''], ['monthPayment', record.monthPayment || '']
        ].forEach(function(field) {
          children.push(React.createElement(TextInput, { key: field[0], style: [styles.reportCellInput, styles.reportFinancialCell], value: String(field[1]), onChangeText: function(value) { updateFinancialField(entryKey, field[0], value); }, keyboardType: 'decimal-pad', placeholder: '0.00', placeholderTextColor: MUTED, componentId: 'reports-row-' + index + '-' + field[0] }));
        });
        children.push(React.createElement(Text, { key: 'paid', style: [styles.reportCell, styles.reportFinancialCell], componentId: 'reports-row-' + index + '-paid' }, money(paid)));
        children.push(React.createElement(Text, { key: 'pending', style: [styles.reportCell, styles.reportFinancialCell], componentId: 'reports-row-' + index + '-pending' }, money(pending)));
        [
          ['paymentDate', record.paymentDate || '', 'Payment date'],
          ['paymentTime', record.paymentTime || '', 'Payment time'],
          ['paymentMethod', record.paymentMethod || '', 'Payment method'],
          ['currency', currency, 'Currency code']
        ].forEach(function(field) {
          children.push(React.createElement(TextInput, { key: field[0], style: [styles.reportCellInput, styles.reportFinancialCell], value: String(field[1]), onChangeText: function(value) { updateFinancialField(entryKey, field[0], value); }, placeholder: field[2], placeholderTextColor: MUTED, autoCapitalize: field[0] === 'currency' ? 'characters' : 'none', componentId: 'reports-row-' + index + '-' + field[0] }));
        });
      }
      return React.createElement(View, { key: String(row.enrolment.id || index), style: styles.reportTableRow, componentId: 'reports-table-row-' + index }, children);
    });
    var groupCurrencies = Object.keys(currencyGroups).sort();
    var reportBody = !selectedInstituteId
      ? React.createElement(EmptyLine, { id: 'reports-select-institute', icon: 'business-outline', text: 'Choose an institute to generate its monthly report.' })
      : !validMonth
        ? React.createElement(EmptyLine, { id: 'reports-invalid-month', icon: 'calendar-outline', text: 'Enter the month as YYYY-MM to generate the report.' })
        : !reportRows.length
          ? React.createElement(EmptyLine, { id: 'reports-no-rows', icon: 'people-outline', text: 'No student enrolments overlap this month for the selected institute.' })
          : React.createElement(View, { style: styles.reportTableCard, componentId: 'reports-table-card' },
              React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: true, componentId: 'reports-table-horizontal-scroll' },
                React.createElement(View, { componentId: 'reports-table' },
                  React.createElement(View, { style: styles.reportTableHeader, componentId: 'reports-table-header' }, headerChildren),
                  reportTableRows.length ? reportTableRows : React.createElement(Text, { style: styles.meta, componentId: 'reports-empty-table-row' }, 'No rows for this month.')
                )
              ),
              showFinancials ? React.createElement(View, { style: styles.reportSummary, componentId: 'reports-financial-summary' },
                React.createElement(Text, { style: styles.cardTitle, componentId: 'reports-summary-heading' }, 'Monthly financial summary'),
                groupCurrencies.map(function(currency, index) {
                  var deduction = deductQuarter ? currencyGroups[currency].monthPayment * 0.25 : 0;
                  var net = currencyGroups[currency].monthPayment - deduction;
                  return React.createElement(View, { key: currency, style: styles.reportCurrencySummary, componentId: 'reports-currency-summary-' + index },
                    React.createElement(Text, { style: styles.reportCurrencyTitle, componentId: 'reports-currency-heading-' + index }, currency),
                    React.createElement(Text, { style: styles.meta, componentId: 'reports-currency-collected-' + index }, 'Month payments: ' + money(currencyGroups[currency].monthPayment)),
                    deductQuarter ? React.createElement(Text, { style: styles.meta, componentId: 'reports-currency-deduction-' + index }, '25% deduction: ' + money(deduction)) : null,
                    React.createElement(Text, { style: styles.reportNet, componentId: 'reports-currency-net-' + index }, 'Net payable: ' + money(net)),
                    React.createElement(Text, { style: styles.meta, componentId: 'reports-currency-pending-' + index }, 'Outstanding: ' + money(currencyGroups[currency].pending))
                  );
                })
              ) : null,
              showFinancials && !groupCurrencies.length ? React.createElement(Text, { style: styles.meta, componentId: 'reports-no-finance-yet' }, 'Enter report amounts to see totals. Financial totals remain separate for each currency.') : null
            );
    return React.createElement(View, { style: styles.screen, componentId: 'reports-screen' },
      React.createElement(StatusBar, { backgroundColor: PRIMARY, barStyle: 'light-content' }),
      React.createElement(ScreenHeader, { id: 'reports', title: 'Monthly report', subtitle: selectedInstitute ? selectedInstitute.institute_name : 'Institute attendance & payments' }),
      React.createElement(ScrollView, { style: { height: height - insets.top - insets.bottom - 88, overflow: 'auto' }, contentContainerStyle: { paddingTop: 12, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING, paddingHorizontal: 16 }, componentId: 'reports-scroll' },
        React.createElement(Text, { style: styles.fieldLabel, componentId: 'reports-institute-label' }, 'Institute'),
        institutesQuery.data.filter(function(item) { return item && !item.is_archived; }).length
          ? React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: styles.reportInstitutePicker, componentId: 'reports-institute-picker' },
              institutesQuery.data.filter(function(item) { return item && !item.is_archived; }).map(function(item, index) {
                return React.createElement(TouchableOpacity, { key: String(item.id || index), style: [styles.reportInstituteOption, selectedInstituteId === item.id ? styles.reportInstituteOptionSelected : null], onPress: function() { setSelectedInstituteId(item.id); }, componentId: 'reports-institute-option-' + index },
                  React.createElement(Text, { style: [styles.reportInstituteText, selectedInstituteId === item.id ? styles.reportInstituteTextSelected : null], componentId: 'reports-institute-option-label-' + index }, item.institute_name || 'Unnamed institute'));
              })
            )
          : React.createElement(Text, { style: styles.meta, componentId: 'reports-no-institutes' }, 'Create an institute before generating an institute report.'),
        React.createElement(Text, { style: styles.fieldLabel, componentId: 'reports-month-label' }, 'Report month'),
        React.createElement(TextInput, { style: styles.reportMonthInput, value: selectedMonth, onChangeText: setSelectedMonth, placeholder: 'YYYY-MM', placeholderTextColor: MUTED, keyboardType: 'numbers-and-punctuation', autoCapitalize: 'none', componentId: 'reports-month-input' }),
        React.createElement(View, { style: styles.reportOptions, componentId: 'reports-options' },
          React.createElement(TouchableOpacity, { style: [styles.reportOptionButton, showFinancials ? styles.reportOptionSelected : null], onPress: function() { setShowFinancials(!showFinancials); }, componentId: 'reports-toggle-financial-columns' },
            React.createElement(Ionicons, { name: showFinancials ? 'eye-outline' : 'eye-off-outline', size: 18, color: PRIMARY }),
            React.createElement(Text, { style: styles.reportOptionText, componentId: 'reports-toggle-financial-label' }, showFinancials ? 'Hide financial columns' : 'Show financial columns')
          ),
          React.createElement(TouchableOpacity, { style: [styles.reportOptionButton, deductQuarter ? styles.reportOptionSelected : null], onPress: function() { setDeductQuarter(!deductQuarter); }, componentId: 'reports-toggle-deduction' },
            React.createElement(Ionicons, { name: deductQuarter ? 'checkmark-circle-outline' : 'ellipse-outline', size: 18, color: PRIMARY }),
            React.createElement(Text, { style: styles.reportOptionText, componentId: 'reports-toggle-deduction-label' }, deductQuarter ? 'Apply 25% deduction' : 'No 25% deduction')
          )
        ),
        React.createElement(Text, { style: styles.reportNote, componentId: 'reports-note' }, 'Attendance comes from saved class registers. Financial amounts are entered and saved locally for this monthly report; they do not create fee obligations or payment records. Currency totals are kept separate.'),
        reportBody
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
    var [preferences, setPreferences] = useStorage('classpilot-preferences', { biometricLock: false });
    var [unlocked, setUnlocked] = React.useState(false);
    var [message, setMessage] = React.useState('');
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
          React.createElement(Text, { style: styles.cardTitle, componentId: 'settings-backup-title' }, 'Backup is not yet available'),
          React.createElement(Text, { style: styles.body, componentId: 'settings-backup-description' }, 'The available local-data hooks do not expose an atomic database export or restore operation. A file picker alone cannot safely restore related records or roll back a failed restore. Do not rely on this app as your only copy of important records.'),
          React.createElement(Text, { style: styles.meta, componentId: 'settings-backup-warning' }, 'Future backup files may contain sensitive student information.')
        ),
        React.createElement(View, { style: styles.summaryCard, componentId: 'settings-exports-card' },
          React.createElement(Text, { style: styles.cardTitle, componentId: 'settings-exports-title' }, 'PDF and CSV exports'),
          React.createElement(Text, { style: styles.body, componentId: 'settings-exports-description' }, 'Verified file creation and filtered PDF/CSV export are not available in this version. Sharing a summary is not a substitute for a complete export.')
        ),
        React.createElement(Text, { style: styles.sectionTitle, componentId: 'settings-scope-heading' }, 'What works today'),
        React.createElement(View, { style: styles.summaryCard, componentId: 'settings-scope-card' },
          React.createElement(Text, { style: styles.body, componentId: 'settings-scope-text' }, 'Institutes, independent classes, reusable students, enrolments, dated sessions, cancellations, and attendance are stored in local tables. Attendance changes save as you mark them.'),
          React.createElement(Text, { style: [styles.body, { marginTop: 12 }], componentId: 'settings-future-text' }, 'Recurring timetables, holidays, billing rules, obligations, payments, currencies, teaching-hour reports, and validated backup/restore require additional data tables and integrity controls. They are intentionally not simulated or calculated from incomplete records.')
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
  });
  // @end:styles

  // @section:TabNavigator @depends:[HomeScreen,ClassesScreen,StudentsScreen,ReportsScreen,SettingsScreen,navigation-setup]
  var TabNavigator = function() {
    var insets = useSafeAreaInsets();
    return React.createElement(View, { style: { flex: 1, width: '100%', height: '100%', overflow: 'hidden' }, componentId: 'main-tab-shell' },
      React.createElement(Tab.Navigator, {
        screenOptions: function(options) {
          var icons = { Home: 'home-outline', Classes: 'library-outline', Students: 'people-outline', Reports: 'stats-chart-outline', Settings: 'settings-outline' };
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
  if (seedSampleRows) seedSampleRows(SAMPLE_ROWS);
  return React.createElement(ThemeProvider, null,
    React.createElement(View, { style: { flex: 1, width: '100%', height: '100%' }, componentId: 'app-root' },
      React.createElement(MainNavigator)
    )
  );
  // @end:return
};
module.exports = ComponentFunction;
