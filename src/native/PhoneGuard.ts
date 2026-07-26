import NativePhoneGuard, { GuardEvent } from '../../modules/phone-guard/src';
import { GuardSensitivity, GuardSoundInfo, GuardStatus } from '../types';

type Listener = (event: GuardEvent & { timestamp: number }) => void;

class PhoneGuardApi {
  private listeners = new Set<Listener>();
  private subscription?: { remove: () => void };

  constructor() {
    this.subscription = NativePhoneGuard.addListener('onGuardEvent', (event) => {
      this.listeners.forEach((listener) => listener({ ...event, timestamp: Date.now() }));
    });
  }

  addListener(listener: Listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  requestPermissions() { NativePhoneGuard.requestPermissions(); }
  getGuardStatus(): GuardStatus { return NativePhoneGuard.getGuardStatus() as GuardStatus; }
  getGuardSoundInfo(): GuardSoundInfo { return NativePhoneGuard.getGuardSoundInfo() as GuardSoundInfo; }
  startGuard(sensitivity: GuardSensitivity, delaySeconds: number) { NativePhoneGuard.startGuard(sensitivity, delaySeconds); }
  cancelGuardPreparation() { NativePhoneGuard.cancelGuardPreparation(); }
  stopGuard() { NativePhoneGuard.stopGuard(); }
  stopAlarm() { NativePhoneGuard.stopAlarm(); }
  importGuardSound() { NativePhoneGuard.importGuardSound(); }
  recordGuardSound() { NativePhoneGuard.recordGuardSound(); }
  stopGuardSoundRecording() { NativePhoneGuard.stopGuardSoundRecording(); }
  previewGuardSound() { NativePhoneGuard.previewGuardSound(); }
  stopGuardSoundPreview() { NativePhoneGuard.stopGuardSoundPreview(); }
  deleteGuardSound() { NativePhoneGuard.deleteGuardSound(); }
  setGuardGuideAcknowledged(acknowledged: boolean) { NativePhoneGuard.setGuardGuideAcknowledged(acknowledged); }
  setGuardSettings(sensitivity: GuardSensitivity, delaySeconds: number) { NativePhoneGuard.setGuardSettings(sensitivity, delaySeconds); }
  getLanguage(): string { return NativePhoneGuard.getLanguage(); }
  setLanguage(language: string) { NativePhoneGuard.setLanguage(language); }
}

export const PhoneGuard = new PhoneGuardApi();
