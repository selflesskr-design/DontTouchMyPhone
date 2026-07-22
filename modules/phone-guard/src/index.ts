import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type GuardEvent = {
  type: string;
  message?: string;
  countdown?: number;
};

export type NativeGuardStatus = {
  state: 'IDLE' | 'ARMING' | 'CALIBRATING' | 'ARMED' | 'ALARMING' | 'ERROR';
  countdown: number;
  sensitivity: 'LOW' | 'NORMAL' | 'HIGH';
  armingDelaySeconds: number;
  errorMessage: string;
  lastAlarmAt: number;
  guideAcknowledged: boolean;
};
export type NativeGuardSoundInfo = { title: string; source: 'none' | 'file' | 'recording'; exists: boolean };

type PhoneGuardEvents = { onGuardEvent: (event: GuardEvent) => void };

class PhoneGuardModule extends NativeModule<PhoneGuardEvents> {
  requestPermissions!: () => void;
  getGuardStatus!: () => NativeGuardStatus;
  getGuardSoundInfo!: () => NativeGuardSoundInfo;
  startGuard!: (sensitivity: string, delaySeconds: number) => void;
  cancelGuardPreparation!: () => void;
  stopGuard!: () => void;
  stopAlarm!: () => void;
  importGuardSound!: () => void;
  recordGuardSound!: () => void;
  stopGuardSoundRecording!: () => void;
  previewGuardSound!: () => void;
  stopGuardSoundPreview!: () => void;
  deleteGuardSound!: () => void;
  setGuardGuideAcknowledged!: (acknowledged: boolean) => void;
  setGuardSettings!: (sensitivity: string, delaySeconds: number) => void;
}

export default requireNativeModule<PhoneGuardModule>('PhoneGuard');
