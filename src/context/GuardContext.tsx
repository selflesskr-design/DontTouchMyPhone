import React from 'react';
import { AppState } from 'react-native';
import { GuardSensitivity, GuardSoundInfo, GuardStatus } from '../types';
import { PhoneGuard } from '../native/PhoneGuard';

type ContextValue = {
  guardStatus: GuardStatus; guardSound: GuardSoundInfo; guardRecording: boolean;
  startGuard: (sensitivity: GuardSensitivity, delaySeconds: number) => void; cancelGuardPreparation: () => void; stopGuard: () => void; stopAlarm: () => void; refreshGuardStatus: () => void;
  importGuardSound: () => void; recordGuardSound: () => void; stopGuardSoundRecording: () => void; previewGuardSound: () => void; stopGuardSoundPreview: () => void; deleteGuardSound: () => void; acknowledgeGuardGuide: () => void;
  saveGuardSettings: (sensitivity: GuardSensitivity, delaySeconds: number) => void;
};
const Context = React.createContext<ContextValue | null>(null);

export function GuardProvider({ children }: { children: React.ReactNode }) {
  const [guardStatus, setGuardStatus] = React.useState<GuardStatus>(() => PhoneGuard.getGuardStatus());
  const [guardSound, setGuardSound] = React.useState<GuardSoundInfo>(() => PhoneGuard.getGuardSoundInfo());
  const [guardRecording, setGuardRecording] = React.useState(false);

  React.useEffect(() => { PhoneGuard.requestPermissions(); }, []);

  const refreshGuardStatus = React.useCallback(() => {
    setGuardStatus(PhoneGuard.getGuardStatus());
    setGuardSound(PhoneGuard.getGuardSoundInfo());
  }, []);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') refreshGuardStatus(); });
    return () => subscription.remove();
  }, [refreshGuardStatus]);

  React.useEffect(() => {
    const removeListener = PhoneGuard.addListener((event) => {
      if (event.type === 'onGuardStateChanged' || event.type === 'guardStopped' || event.type === 'alarmStopped' || event.type === 'alarmStarted' || event.type === 'serviceError') {
        setGuardStatus(PhoneGuard.getGuardStatus());
      }
      if (event.type === 'onGuardSoundChanged') setGuardSound(PhoneGuard.getGuardSoundInfo());
      if (event.type === 'onGuardRecordingStateChanged') setGuardRecording(event.message === 'Recording started');
    });
    return () => { removeListener(); };
  }, []);

  const value: ContextValue = {
    guardStatus, guardSound, guardRecording,
    startGuard: (sensitivity, delaySeconds) => PhoneGuard.startGuard(sensitivity, delaySeconds),
    cancelGuardPreparation: () => PhoneGuard.cancelGuardPreparation(),
    stopGuard: () => PhoneGuard.stopGuard(),
    stopAlarm: () => PhoneGuard.stopAlarm(),
    refreshGuardStatus,
    importGuardSound: () => PhoneGuard.importGuardSound(),
    recordGuardSound: () => PhoneGuard.recordGuardSound(),
    stopGuardSoundRecording: () => PhoneGuard.stopGuardSoundRecording(),
    previewGuardSound: () => PhoneGuard.previewGuardSound(),
    stopGuardSoundPreview: () => PhoneGuard.stopGuardSoundPreview(),
    deleteGuardSound: () => PhoneGuard.deleteGuardSound(),
    acknowledgeGuardGuide: () => { PhoneGuard.setGuardGuideAcknowledged(true); refreshGuardStatus(); },
    saveGuardSettings: (sensitivity, delaySeconds) => { PhoneGuard.setGuardSettings(sensitivity, delaySeconds); refreshGuardStatus(); },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useGuard() { const value = React.useContext(Context); if (!value) throw new Error('useGuard must be used inside GuardProvider'); return value; }
