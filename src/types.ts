export type GuardState = 'IDLE' | 'ARMING' | 'CALIBRATING' | 'ARMED' | 'ALARMING' | 'ERROR';
export type GuardSensitivity = 'LOW' | 'NORMAL' | 'HIGH';
export type GuardStatus = {
  state: GuardState;
  countdown: number;
  sensitivity: GuardSensitivity;
  armingDelaySeconds: number;
  errorMessage: string;
  lastAlarmAt: number;
  guideAcknowledged: boolean;
};
export type GuardSoundInfo = { title: string; source: 'none' | 'file' | 'recording'; exists: boolean };
