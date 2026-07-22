import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGuard } from '../context/GuardContext';
import { GuardSensitivity } from '../types';

const stateText = { IDLE: 'Off', ARMING: 'Preparing', CALIBRATING: 'Calibrating', ARMED: 'Watching', ALARMING: 'Alarming', ERROR: 'Error' } as const;

export function GuardScreen() {
  const {
    guardStatus, guardSound, guardRecording, startGuard, cancelGuardPreparation, stopGuard, stopAlarm,
    importGuardSound, recordGuardSound, stopGuardSoundRecording, previewGuardSound, stopGuardSoundPreview, deleteGuardSound,
    acknowledgeGuardGuide, refreshGuardStatus, saveGuardSettings,
  } = useGuard();
  const [sensitivity, setSensitivity] = React.useState<GuardSensitivity>(guardStatus.sensitivity);
  const [delay, setDelay] = React.useState(guardStatus.armingDelaySeconds);
  const idle = guardStatus.state === 'IDLE';
  const chooseSensitivity = (value: GuardSensitivity) => { setSensitivity(value); saveGuardSettings(value, delay); };
  const chooseDelay = (value: number) => { setDelay(value); saveGuardSettings(sensitivity, value); };

  React.useEffect(() => { refreshGuardStatus(); }, [refreshGuardStatus]);

  const begin = () => {
    stopGuardSoundPreview();
    if (!guardSound.exists) { Alert.alert('Alarm sound needed', 'Record or import a guard alarm sound first.'); return; }
    if (!guardStatus.guideAcknowledged) {
      Alert.alert('Before you start', 'Put the phone down and stay still while it arms. The alarm will repeat until you dismiss it.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Got it, start', onPress: () => { acknowledgeGuardGuide(); startGuard(sensitivity, delay); } },
      ]);
      return;
    }
    startGuard(sensitivity, delay);
  };

  const deleteSound = () => Alert.alert('Delete guard sound', 'Delete the registered guard alarm sound?', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: deleteGuardSound },
  ]);

  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.header}>
      <Image source={require('../../logo.png')} style={styles.logo} />
      <Text style={styles.heading}>Don't Touch My Phone</Text>
    </View>
    <Text style={styles.guide}>Put your phone down and start guard mode. If it moves or tilts sharply, the alarm plays on repeat.</Text>

    <View style={[styles.status, guardStatus.state === 'ALARMING' && styles.alarmStatus]}>
      <Text style={styles.statusLabel}>Current status</Text><Text style={[styles.statusValue, guardStatus.state === 'ALARMING' && styles.alarmText]}>{stateText[guardStatus.state]}</Text>
      {guardStatus.state === 'ARMING' && <Text style={styles.countdown}>Calibrating in {guardStatus.countdown}s</Text>}
      {guardStatus.state === 'CALIBRATING' && <Text style={styles.statusCopy}>Don't move the phone.</Text>}
      {guardStatus.state === 'ARMED' && <Text style={styles.statusCopy}>Watching for movement, even with the screen off.</Text>}
      {guardStatus.state === 'ALARMING' && <Text style={styles.statusCopy}>The alarm is playing on repeat.</Text>}
      {guardStatus.errorMessage ? <Text style={styles.error}>{guardStatus.errorMessage}</Text> : null}
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Guard alarm sound</Text>
      <Text style={styles.soundTitle}>{guardSound.exists ? guardSound.title : 'No sound registered'}</Text>
      <Text style={styles.source}>{guardSound.source === 'recording' ? 'Recorded' : guardSound.source === 'file' ? 'Imported audio file' : 'Record a sound or import a file.'}</Text>
      <View style={styles.actions}>
        <Action label={guardRecording ? 'Stop recording' : 'Record'} disabled={!idle} danger={guardRecording} onPress={guardRecording ? stopGuardSoundRecording : recordGuardSound} />
        <Action label="Import file" disabled={!idle || guardRecording} onPress={importGuardSound} />
      </View>
      <View style={styles.actions}>
        <Action label="Preview" disabled={!idle || !guardSound.exists || guardRecording} onPress={previewGuardSound} />
        <Action label="Stop preview" disabled={!idle} onPress={stopGuardSoundPreview} />
        <Action label="Delete" disabled={!idle || !guardSound.exists || guardRecording} danger onPress={deleteSound} />
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Sensitivity</Text>
      <View style={styles.segment}><Choice label="Low" selected={sensitivity === 'LOW'} disabled={!idle} onPress={() => chooseSensitivity('LOW')} /><Choice label="Normal" selected={sensitivity === 'NORMAL'} disabled={!idle} onPress={() => chooseSensitivity('NORMAL')} /><Choice label="High" selected={sensitivity === 'HIGH'} disabled={!idle} onPress={() => chooseSensitivity('HIGH')} /></View>
      <Text style={styles.cardTitle}>Arming delay</Text>
      <View style={styles.segment}>{[3, 5, 10].map((value) => <Choice key={value} label={`${value}s`} selected={delay === value} disabled={!idle} onPress={() => chooseDelay(value)} />)}</View>
    </View>

    {idle && <Pressable style={styles.start} onPress={begin}><Text style={styles.startText}>Start guard mode</Text></Pressable>}
    {(guardStatus.state === 'ARMING' || guardStatus.state === 'CALIBRATING') && <Pressable style={styles.cancel} onPress={cancelGuardPreparation}><Text style={styles.cancelText}>Cancel</Text></Pressable>}
    {guardStatus.state === 'ARMED' && <Pressable style={styles.cancel} onPress={stopGuard}><Text style={styles.cancelText}>Turn off guard mode</Text></Pressable>}
    {guardStatus.state === 'ALARMING' && <Pressable style={styles.stopAlarm} onPress={stopAlarm}><Text style={styles.stopAlarmText}>Stop alarm</Text></Pressable>}
    {guardStatus.lastAlarmAt > 0 && <Text style={styles.lastAlarm}>Last alarm: {new Date(guardStatus.lastAlarmAt).toLocaleString()}</Text>}
  </ScrollView>;
}

function Action({ label, disabled, danger, onPress }: { label: string; disabled?: boolean; danger?: boolean; onPress: () => void }) {
  return <Pressable style={[styles.action, danger && styles.actionDanger, disabled && styles.disabled]} disabled={disabled} onPress={onPress}><Text style={[styles.actionText, danger && styles.actionDangerText]}>{label}</Text></Pressable>;
}
function Choice({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable style={[styles.choice, selected && styles.choiceSelected, disabled && styles.disabled]} disabled={disabled} onPress={onPress}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  page: { padding: 22, gap: 14, paddingBottom: 42 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12 }, logo: { width: 40, height: 40, borderRadius: 10 }, heading: { fontSize: 24, fontWeight: '900', color: '#121826' },
  guide: { color: '#647084', lineHeight: 22 }, status: { backgroundColor: '#ECFDF3', borderColor: '#B7E4C7', borderWidth: 1, padding: 18, borderRadius: 15 }, alarmStatus: { backgroundColor: '#FEF2F2', borderColor: '#F6B8B8' }, statusLabel: { color: '#647084', fontSize: 12, fontWeight: '800' }, statusValue: { color: '#15803D', fontSize: 25, fontWeight: '900', marginTop: 4 }, alarmText: { color: '#B91C1C' }, countdown: { color: '#E66A1A', fontSize: 18, fontWeight: '900', marginTop: 10 }, statusCopy: { color: '#647084', marginTop: 7 }, error: { color: '#B91C1C', marginTop: 8 },
  card: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E6EF', padding: 17, borderRadius: 15, gap: 11 }, cardTitle: { color: '#192235', fontSize: 16, fontWeight: '900', marginTop: 2 }, soundTitle: { color: '#192235', fontSize: 18, fontWeight: '800' }, source: { color: '#7C8799', fontSize: 13 }, actions: { flexDirection: 'row', gap: 7 }, action: { flex: 1, borderWidth: 1, borderColor: '#CBD3DF', borderRadius: 10, paddingVertical: 11, alignItems: 'center' }, actionText: { color: '#334155', fontWeight: '800', fontSize: 12 }, actionDanger: { borderColor: '#F3B5B5', backgroundColor: '#FFF7F7' }, actionDangerText: { color: '#B91C1C' }, disabled: { opacity: 0.4 },
  segment: { flexDirection: 'row', gap: 8 }, choice: { flex: 1, borderWidth: 1, borderColor: '#D6DCE6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }, choiceSelected: { backgroundColor: '#FFF1E8', borderColor: '#E66A1A' }, choiceText: { color: '#647084', fontWeight: '800' }, choiceTextSelected: { color: '#C6530D' },
  start: { backgroundColor: '#E66A1A', padding: 18, borderRadius: 13, alignItems: 'center' }, startText: { color: '#FFF', fontWeight: '900', fontSize: 17 }, cancel: { backgroundColor: '#FEECEC', padding: 18, borderRadius: 13, alignItems: 'center' }, cancelText: { color: '#C62828', fontWeight: '900', fontSize: 16 }, stopAlarm: { backgroundColor: '#C62828', paddingVertical: 24, borderRadius: 15, alignItems: 'center' }, stopAlarmText: { color: '#FFF', fontWeight: '900', fontSize: 21 }, lastAlarm: { color: '#8A94A5', textAlign: 'center', fontSize: 12 },
});
