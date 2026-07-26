import { GuardState } from '../types';

export type Language = 'en' | 'ko' | 'es';
export type LanguagePreference = 'system' | Language;

export type Dict = {
  guide: string;
  currentStatus: string;
  state: Record<GuardState, string>;
  calibratingIn: (seconds: number) => string;
  dontMove: string;
  watchingCopy: string;
  alarmingCopy: string;
  guardAlarmSound: string;
  noSoundRegistered: string;
  recorded: string;
  importedFile: string;
  recordOrImport: string;
  preview: string;
  stopPreview: string;
  deleteLabel: string;
  record: string;
  stopRecording: string;
  importFile: string;
  getReadyTime: string;
  startGuardMode: string;
  cancel: string;
  turnOffGuardMode: string;
  stopAlarm: string;
  lastAlarm: (date: string) => string;
  alarmSoundNeededTitle: string;
  alarmSoundNeededMsg: string;
  beforeStartTitle: string;
  beforeStartMsg: string;
  gotItStart: string;
  deleteSoundTitle: string;
  deleteSoundMsg: string;
  language: string;
  codes: Record<string, string>;
};

const en: Dict = {
  guide: "Put your phone down and start guard mode. If it moves or tilts sharply, the alarm plays on repeat.",
  currentStatus: 'Current status',
  state: { IDLE: 'Off', ARMING: 'Preparing', CALIBRATING: 'Calibrating', ARMED: 'Watching', ALARMING: 'Alarming', ERROR: 'Error' },
  calibratingIn: (s) => `Calibrating in ${s}s`,
  dontMove: "Don't move the phone.",
  watchingCopy: 'Watching for movement, even with the screen off.',
  alarmingCopy: 'The alarm is playing on repeat.',
  guardAlarmSound: 'Guard alarm sound',
  noSoundRegistered: 'No sound registered',
  recorded: 'Recorded',
  importedFile: 'Imported audio file',
  recordOrImport: 'Record a sound or import a file.',
  preview: 'Preview',
  stopPreview: 'Stop preview',
  deleteLabel: 'Delete',
  record: 'Record',
  stopRecording: 'Stop recording',
  importFile: 'Import file',
  getReadyTime: 'Get ready time',
  startGuardMode: 'Start guard mode',
  cancel: 'Cancel',
  turnOffGuardMode: 'Turn off guard mode',
  stopAlarm: 'Stop alarm',
  lastAlarm: (d) => `Last alarm: ${d}`,
  alarmSoundNeededTitle: 'Alarm sound needed',
  alarmSoundNeededMsg: 'Record or import a guard alarm sound first.',
  beforeStartTitle: 'Before you start',
  beforeStartMsg: "Put the phone down and stay still while it arms. The alarm will repeat until you dismiss it.",
  gotItStart: 'Got it, start',
  deleteSoundTitle: 'Delete guard sound',
  deleteSoundMsg: 'Delete the registered guard alarm sound?',
  language: 'Language',
  codes: {
    AUDIO_PLAYBACK_ERROR: 'Could not play the guard alarm sound.',
    GUARD_ALREADY_RUNNING: 'Guard mode is already running.',
    SOUND_MISSING: 'Register a guard alarm sound first.',
    NOTIFICATION_PERMISSION_NEEDED: 'Allow the notification permission and try again.',
    STOP_RECORDING_FIRST: 'Stop recording first.',
    SENSOR_UNAVAILABLE: 'Motion detection is not available on this phone.',
    GUARD_START_FAILED: 'Could not start guard mode. Please try again.',
    GUARD_STOP_FAILED: 'Could not turn off guard mode.',
    GUARD_ACTIVE_CANT_CHANGE_SOUND: 'Turn off guard mode before changing the sound.',
    ACTIVITY_UNAVAILABLE: 'Reopen the screen and try again.',
    SOUND_SELECTION_CANCELLED: 'Sound selection cancelled.',
    FILE_OPEN_FAILED: 'Could not open the selected file.',
    SOUND_REGISTERED: 'Guard alarm sound registered.',
    AUDIO_IMPORT_FAILED: 'Could not import the audio file.',
    MIC_PERMISSION_NEEDED: 'Allow the microphone permission and record again.',
    RECORDING_IN_PROGRESS: 'Another recording is already in progress.',
    RECORDING_STARTED: 'Recording started',
    RECORDING_START_FAILED: 'Could not start recording.',
    SOUND_RECORDED_SAVED: 'Recorded guard alarm sound saved.',
    RECORDING_TOO_SHORT: 'The recording was too short or could not be saved.',
    RECORDING_STOPPED: 'Recording stopped',
    GUARD_ACTIVE_CANT_PREVIEW: "Can't preview while guard mode is active.",
    GUARD_ACTIVE_CANT_DELETE_SOUND: 'Turn off guard mode before deleting the sound.',
    SOUND_DELETED: 'Guard alarm sound deleted.',
    ALARM_PLAYBACK_FAILED: 'Could not play the alarm sound.',
    ARMING_STARTED: 'Arming countdown started.',
    CALIBRATING_STARTED: 'Calibrating the current position.',
    SENSOR_START_FAILED: 'Could not start the motion sensor.',
    CALIBRATION_FAILED: 'Could not calibrate the current position.',
    GUARD_ARMED: 'Watching for phone movement.',
    MOTION_DETECTED: 'Motion detected.',
    GUARD_TURNED_OFF: 'Guard mode was turned off.',
  },
};

const ko: Dict = {
  guide: '휴대폰을 내려놓고 지킴 모드를 시작하세요. 움직이거나 심하게 기울면 경보음이 반복 재생됩니다.',
  currentStatus: '현재 상태',
  state: { IDLE: '꺼짐', ARMING: '준비 중', CALIBRATING: '보정 중', ARMED: '감시 중', ALARMING: '경보 중', ERROR: '오류' },
  calibratingIn: (s) => `${s}초 후 보정 시작`,
  dontMove: '휴대폰을 움직이지 마세요.',
  watchingCopy: '화면이 꺼져 있어도 움직임을 감시합니다.',
  alarmingCopy: '경보음이 반복 재생 중입니다.',
  guardAlarmSound: '지킴 경보음',
  noSoundRegistered: '등록된 소리 없음',
  recorded: '녹음됨',
  importedFile: '가져온 오디오 파일',
  recordOrImport: '소리를 녹음하거나 파일을 가져오세요.',
  preview: '미리듣기',
  stopPreview: '미리듣기 중지',
  deleteLabel: '삭제',
  record: '녹음',
  stopRecording: '녹음 중지',
  importFile: '파일 가져오기',
  getReadyTime: '준비 시간',
  startGuardMode: '지킴 모드 시작',
  cancel: '취소',
  turnOffGuardMode: '지킴 모드 끄기',
  stopAlarm: '경보 중지',
  lastAlarm: (d) => `마지막 경보: ${d}`,
  alarmSoundNeededTitle: '경보음이 필요합니다',
  alarmSoundNeededMsg: '먼저 지킴 경보음을 녹음하거나 가져오세요.',
  beforeStartTitle: '시작하기 전에',
  beforeStartMsg: '준비되는 동안 휴대폰을 내려놓고 가만히 두세요. 경보음은 끌 때까지 반복됩니다.',
  gotItStart: '확인했어요, 시작',
  deleteSoundTitle: '지킴 소리 삭제',
  deleteSoundMsg: '등록된 지킴 경보음을 삭제할까요?',
  language: '언어',
  codes: {
    AUDIO_PLAYBACK_ERROR: '지킴 경보음을 재생할 수 없습니다.',
    GUARD_ALREADY_RUNNING: '지킴 모드가 이미 실행 중입니다.',
    SOUND_MISSING: '먼저 지킴 경보음을 등록해 주세요.',
    NOTIFICATION_PERMISSION_NEEDED: '알림 권한을 허용한 뒤 다시 시도해 주세요.',
    STOP_RECORDING_FIRST: '먼저 녹음을 중지해 주세요.',
    SENSOR_UNAVAILABLE: '이 휴대폰에서는 움직임 감지를 사용할 수 없습니다.',
    GUARD_START_FAILED: '지킴 모드를 시작할 수 없습니다. 다시 시도해 주세요.',
    GUARD_STOP_FAILED: '지킴 모드를 끌 수 없습니다.',
    GUARD_ACTIVE_CANT_CHANGE_SOUND: '소리를 변경하기 전에 지킴 모드를 꺼 주세요.',
    ACTIVITY_UNAVAILABLE: '화면을 다시 열고 시도해 주세요.',
    SOUND_SELECTION_CANCELLED: '소리 선택이 취소되었습니다.',
    FILE_OPEN_FAILED: '선택한 파일을 열 수 없습니다.',
    SOUND_REGISTERED: '지킴 경보음이 등록되었습니다.',
    AUDIO_IMPORT_FAILED: '오디오 파일을 가져올 수 없습니다.',
    MIC_PERMISSION_NEEDED: '마이크 권한을 허용한 뒤 다시 녹음해 주세요.',
    RECORDING_IN_PROGRESS: '이미 다른 녹음이 진행 중입니다.',
    RECORDING_STARTED: '녹음이 시작되었습니다',
    RECORDING_START_FAILED: '녹음을 시작할 수 없습니다.',
    SOUND_RECORDED_SAVED: '녹음한 지킴 경보음이 저장되었습니다.',
    RECORDING_TOO_SHORT: '녹음이 너무 짧거나 저장할 수 없습니다.',
    RECORDING_STOPPED: '녹음이 중지되었습니다',
    GUARD_ACTIVE_CANT_PREVIEW: '지킴 모드가 켜져 있는 동안에는 미리듣기를 할 수 없습니다.',
    GUARD_ACTIVE_CANT_DELETE_SOUND: '소리를 삭제하기 전에 지킴 모드를 꺼 주세요.',
    SOUND_DELETED: '지킴 경보음이 삭제되었습니다.',
    ALARM_PLAYBACK_FAILED: '경보음을 재생할 수 없습니다.',
    ARMING_STARTED: '감시 준비 카운트다운이 시작되었습니다.',
    CALIBRATING_STARTED: '현재 위치를 보정하고 있습니다.',
    SENSOR_START_FAILED: '동작 센서를 시작할 수 없습니다.',
    CALIBRATION_FAILED: '현재 위치를 보정할 수 없습니다.',
    GUARD_ARMED: '휴대폰 움직임을 감시하고 있습니다.',
    MOTION_DETECTED: '움직임이 감지되었습니다.',
    GUARD_TURNED_OFF: '지킴 모드가 꺼졌습니다.',
  },
};

const es: Dict = {
  guide: 'Deja el teléfono e inicia el modo de vigilancia. Si se mueve o se inclina bruscamente, la alarma sonará en bucle.',
  currentStatus: 'Estado actual',
  state: { IDLE: 'Apagado', ARMING: 'Preparando', CALIBRATING: 'Calibrando', ARMED: 'Vigilando', ALARMING: 'Sonando', ERROR: 'Error' },
  calibratingIn: (s) => `Calibración en ${s}s`,
  dontMove: 'No muevas el teléfono.',
  watchingCopy: 'Vigilando el movimiento, incluso con la pantalla apagada.',
  alarmingCopy: 'La alarma se está reproduciendo en bucle.',
  guardAlarmSound: 'Sonido de alarma',
  noSoundRegistered: 'Ningún sonido registrado',
  recorded: 'Grabado',
  importedFile: 'Archivo de audio importado',
  recordOrImport: 'Graba un sonido o importa un archivo.',
  preview: 'Vista previa',
  stopPreview: 'Detener',
  deleteLabel: 'Eliminar',
  record: 'Grabar',
  stopRecording: 'Detener grabación',
  importFile: 'Importar archivo',
  getReadyTime: 'Tiempo de preparación',
  startGuardMode: 'Iniciar modo de vigilancia',
  cancel: 'Cancelar',
  turnOffGuardMode: 'Apagar modo de vigilancia',
  stopAlarm: 'Detener alarma',
  lastAlarm: (d) => `Última alarma: ${d}`,
  alarmSoundNeededTitle: 'Se necesita un sonido de alarma',
  alarmSoundNeededMsg: 'Graba o importa un sonido de alarma primero.',
  beforeStartTitle: 'Antes de empezar',
  beforeStartMsg: 'Deja el teléfono y no lo muevas mientras se prepara. La alarma se repetirá hasta que la detengas.',
  gotItStart: 'Entendido, empezar',
  deleteSoundTitle: 'Eliminar sonido de vigilancia',
  deleteSoundMsg: '¿Eliminar el sonido de alarma registrado?',
  language: 'Idioma',
  codes: {
    AUDIO_PLAYBACK_ERROR: 'No se pudo reproducir el sonido de alarma.',
    GUARD_ALREADY_RUNNING: 'El modo de vigilancia ya está activo.',
    SOUND_MISSING: 'Primero registra un sonido de alarma.',
    NOTIFICATION_PERMISSION_NEEDED: 'Permite las notificaciones e inténtalo de nuevo.',
    STOP_RECORDING_FIRST: 'Detén la grabación primero.',
    SENSOR_UNAVAILABLE: 'La detección de movimiento no está disponible en este teléfono.',
    GUARD_START_FAILED: 'No se pudo iniciar el modo de vigilancia. Inténtalo de nuevo.',
    GUARD_STOP_FAILED: 'No se pudo apagar el modo de vigilancia.',
    GUARD_ACTIVE_CANT_CHANGE_SOUND: 'Apaga el modo de vigilancia antes de cambiar el sonido.',
    ACTIVITY_UNAVAILABLE: 'Vuelve a abrir la pantalla e inténtalo de nuevo.',
    SOUND_SELECTION_CANCELLED: 'Se canceló la selección de sonido.',
    FILE_OPEN_FAILED: 'No se pudo abrir el archivo seleccionado.',
    SOUND_REGISTERED: 'Sonido de alarma registrado.',
    AUDIO_IMPORT_FAILED: 'No se pudo importar el archivo de audio.',
    MIC_PERMISSION_NEEDED: 'Permite el micrófono y graba de nuevo.',
    RECORDING_IN_PROGRESS: 'Ya hay otra grabación en curso.',
    RECORDING_STARTED: 'Grabación iniciada',
    RECORDING_START_FAILED: 'No se pudo iniciar la grabación.',
    SOUND_RECORDED_SAVED: 'Se guardó el sonido de alarma grabado.',
    RECORDING_TOO_SHORT: 'La grabación fue muy corta o no se pudo guardar.',
    RECORDING_STOPPED: 'Grabación detenida',
    GUARD_ACTIVE_CANT_PREVIEW: 'No se puede previsualizar mientras el modo de vigilancia está activo.',
    GUARD_ACTIVE_CANT_DELETE_SOUND: 'Apaga el modo de vigilancia antes de eliminar el sonido.',
    SOUND_DELETED: 'Sonido de alarma eliminado.',
    ALARM_PLAYBACK_FAILED: 'No se pudo reproducir la alarma.',
    ARMING_STARTED: 'Comenzó la cuenta regresiva de preparación.',
    CALIBRATING_STARTED: 'Calibrando la posición actual.',
    SENSOR_START_FAILED: 'No se pudo iniciar el sensor de movimiento.',
    CALIBRATION_FAILED: 'No se pudo calibrar la posición actual.',
    GUARD_ARMED: 'Vigilando el movimiento del teléfono.',
    MOTION_DETECTED: 'Movimiento detectado.',
    GUARD_TURNED_OFF: 'El modo de vigilancia se apagó.',
  },
};

export const translations: Record<Language, Dict> = { en, ko, es };
export const supportedLanguages: Language[] = ['en', 'ko', 'es'];
