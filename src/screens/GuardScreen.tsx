import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGuard } from '../context/GuardContext';
import { useI18n } from '../i18n';
import { LanguagePreference } from '../i18n/translations';
import { GuardSensitivity } from '../types';

const languageOptions: { value: LanguagePreference; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
];

export function GuardScreen() {
  const {
    guardStatus, guardSound, guardRecording, startGuard, cancelGuardPreparation, stopGuard, stopAlarm,
    importGuardSound, recordGuardSound, stopGuardSoundRecording, previewGuardSound, stopGuardSoundPreview, deleteGuardSound,
    acknowledgeGuardGuide, refreshGuardStatus, saveGuardSettings,
  } = useGuard();
  const { t, language, setPreference } = useI18n();
  const sensitivity: GuardSensitivity = 'HIGH';
  const [delay, setDelay] = React.useState(guardStatus.armingDelaySeconds);
  const idle = guardStatus.state === 'IDLE';
  const chooseDelay = (value: number) => { setDelay(value); saveGuardSettings(sensitivity, value); };
  const errorMessage = guardStatus.errorMessage ? (t.codes[guardStatus.errorMessage] ?? guardStatus.errorMessage) : '';

  React.useEffect(() => { refreshGuardStatus(); }, [refreshGuardStatus]);
  React.useEffect(() => { if (guardStatus.sensitivity !== 'HIGH') saveGuardSettings('HIGH', guardStatus.armingDelaySeconds); }, [guardStatus.sensitivity, guardStatus.armingDelaySeconds, saveGuardSettings]);

  const begin = () => {
    stopGuardSoundPreview();
    if (!guardSound.exists) { Alert.alert(t.alarmSoundNeededTitle, t.alarmSoundNeededMsg); return; }
    if (!guardStatus.guideAcknowledged) {
      Alert.alert(t.beforeStartTitle, t.beforeStartMsg, [
        { text: t.cancel, style: 'cancel' },
        { text: t.gotItStart, onPress: () => { acknowledgeGuardGuide(); startGuard(sensitivity, delay); } },
      ]);
      return;
    }
    startGuard(sensitivity, delay);
  };

  const deleteSound = () => Alert.alert(t.deleteSoundTitle, t.deleteSoundMsg, [
    { text: t.cancel, style: 'cancel' }, { text: t.deleteLabel, style: 'destructive', onPress: deleteGuardSound },
  ]);

  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.header}>
      <Image source={require('../../logo.png')} style={styles.logo} />
      <Text style={styles.heading}>Don't Touch My Phone</Text>
    </View>

    <Text style={styles.guide}>{t.guide}</Text>

    <View style={styles.topRow}>
      <View style={[styles.status, styles.statusNarrow, guardStatus.state === 'ALARMING' && styles.alarmStatus]}>
        <Text style={styles.statusLabel}>{t.currentStatus}</Text><Text style={[styles.statusValue, guardStatus.state === 'ALARMING' && styles.alarmText]}>{t.state[guardStatus.state]}</Text>
        {guardStatus.state === 'ARMING' && <Text style={styles.countdown}>{t.calibratingIn(guardStatus.countdown)}</Text>}
        {guardStatus.state === 'CALIBRATING' && <Text style={styles.statusCopy}>{t.dontMove}</Text>}
        {guardStatus.state === 'ARMED' && <Text style={styles.statusCopy}>{t.watchingCopy}</Text>}
        {guardStatus.state === 'ALARMING' && <Text style={styles.statusCopy}>{t.alarmingCopy}</Text>}
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </View>
      <View style={styles.languageCard}>
        <Text style={styles.cardTitle}>{t.language}</Text>
        {languageOptions.map((option) => (
          <Pressable key={option.value} style={[styles.langChoice, language === option.value && styles.choiceSelected]} onPress={() => setPreference(option.value)}>
            <Text style={[styles.langChoiceText, language === option.value && styles.choiceTextSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t.guardAlarmSound}</Text>
      <Text style={styles.soundTitle}>{guardSound.exists ? guardSound.title : t.noSoundRegistered}</Text>
      <Text style={styles.source}>{guardSound.source === 'recording' ? t.recorded : guardSound.source === 'file' ? t.importedFile : t.recordOrImport}</Text>
      <View style={styles.actions}>
        <Action label={t.preview} disabled={!idle || !guardSound.exists || guardRecording} onPress={previewGuardSound} />
        <Action label={t.stopPreview} disabled={!idle} onPress={stopGuardSoundPreview} />
        <Action label={t.deleteLabel} disabled={!idle || !guardSound.exists || guardRecording} danger onPress={deleteSound} />
      </View>
      <View style={styles.divider} />
      <View style={styles.actions}>
        <Action label={guardRecording ? t.stopRecording : t.record} disabled={!idle} danger={guardRecording} onPress={guardRecording ? stopGuardSoundRecording : recordGuardSound} />
        <Action label={t.importFile} disabled={!idle || guardRecording} onPress={importGuardSound} />
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t.getReadyTime}</Text>
      <View style={styles.segment}>{[3, 5, 10].map((value) => <Choice key={value} label={`${value}s`} selected={delay === value} disabled={!idle} onPress={() => chooseDelay(value)} />)}</View>
    </View>

    {idle && <Pressable style={styles.start} onPress={begin}><Text style={styles.startText}>{t.startGuardMode}</Text></Pressable>}
    {(guardStatus.state === 'ARMING' || guardStatus.state === 'CALIBRATING') && <Pressable style={styles.cancel} onPress={cancelGuardPreparation}><Text style={styles.cancelText}>{t.cancel}</Text></Pressable>}
    {guardStatus.state === 'ARMED' && <Pressable style={styles.cancel} onPress={stopGuard}><Text style={styles.cancelText}>{t.turnOffGuardMode}</Text></Pressable>}
    {guardStatus.state === 'ALARMING' && <Pressable style={styles.stopAlarm} onPress={stopAlarm}><Text style={styles.stopAlarmText}>{t.stopAlarm}</Text></Pressable>}
    {guardStatus.lastAlarmAt > 0 && <Text style={styles.lastAlarm}>{t.lastAlarm(new Date(guardStatus.lastAlarmAt).toLocaleString())}</Text>}
  </ScrollView>;
}

function Action({ label, disabled, danger, onPress }: { label: string; disabled?: boolean; danger?: boolean; onPress: () => void }) {
  return <Pressable style={[styles.action, danger && styles.actionDanger, disabled && styles.disabled]} disabled={disabled} onPress={onPress}><Text style={[styles.actionText, danger && styles.actionDangerText]}>{label}</Text></Pressable>;
}
function Choice({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable style={[styles.choice, selected && styles.choiceSelected, disabled && styles.disabled]} disabled={disabled} onPress={onPress}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 14, gap: 10, paddingBottom: 14, justifyContent: 'space-between' }, header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 }, logo: { width: 34, height: 34, borderRadius: 9 }, heading: { fontSize: 20, fontWeight: '900', color: '#121826' },
  guide: { color: '#647084', lineHeight: 19, fontSize: 14 }, topRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' }, status: { backgroundColor: '#ECFDF3', borderColor: '#B7E4C7', borderWidth: 1, padding: 12, borderRadius: 12 }, statusNarrow: { flex: 1 }, alarmStatus: { backgroundColor: '#FEF2F2', borderColor: '#F6B8B8' }, statusLabel: { color: '#647084', fontSize: 12, fontWeight: '800' }, statusValue: { color: '#15803D', fontSize: 22, fontWeight: '900', marginTop: 3 }, alarmText: { color: '#B91C1C' }, countdown: { color: '#E66A1A', fontSize: 15, fontWeight: '900', marginTop: 5 }, statusCopy: { color: '#647084', marginTop: 4, fontSize: 13 }, error: { color: '#B91C1C', marginTop: 5, fontSize: 13 },
  languageCard: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E6EF', padding: 10, borderRadius: 12, gap: 5, justifyContent: 'center' }, langChoice: { borderWidth: 1, borderColor: '#D6DCE6', borderRadius: 8, paddingVertical: 7, alignItems: 'center' }, langChoiceText: { color: '#647084', fontWeight: '800', fontSize: 13 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E6EF', padding: 12, borderRadius: 12, gap: 7 }, cardTitle: { color: '#192235', fontSize: 14, fontWeight: '900' }, soundTitle: { color: '#192235', fontSize: 16, fontWeight: '800' }, source: { color: '#7C8799', fontSize: 13 }, actions: { flexDirection: 'row', gap: 6 }, action: { flex: 1, borderWidth: 1, borderColor: '#CBD3DF', borderRadius: 9, paddingVertical: 9, alignItems: 'center' }, actionText: { color: '#334155', fontWeight: '800', fontSize: 13 }, actionDanger: { borderColor: '#F3B5B5', backgroundColor: '#FFF7F7' }, actionDangerText: { color: '#B91C1C' }, disabled: { opacity: 0.4 }, divider: { height: 1, backgroundColor: '#E1E6EF' },
  segment: { flexDirection: 'row', gap: 6 }, choice: { flex: 1, borderWidth: 1, borderColor: '#D6DCE6', paddingVertical: 9, borderRadius: 9, alignItems: 'center' }, choiceSelected: { backgroundColor: '#FFF1E8', borderColor: '#E66A1A' }, choiceText: { color: '#647084', fontWeight: '800', fontSize: 14 }, choiceTextSelected: { color: '#C6530D' },
  start: { backgroundColor: '#E66A1A', padding: 15, borderRadius: 12, alignItems: 'center' }, startText: { color: '#FFF', fontWeight: '900', fontSize: 17 }, cancel: { backgroundColor: '#FEECEC', padding: 15, borderRadius: 12, alignItems: 'center' }, cancelText: { color: '#C62828', fontWeight: '900', fontSize: 15 }, stopAlarm: { backgroundColor: '#C62828', paddingVertical: 18, borderRadius: 13, alignItems: 'center' }, stopAlarmText: { color: '#FFF', fontWeight: '900', fontSize: 18 }, lastAlarm: { color: '#8A94A5', textAlign: 'center', fontSize: 11 },
});
