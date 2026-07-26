# Don't Touch My Phone — 진행 상황

최종 갱신: 2026-07-26

## 현재 결론

`safeguard` 프로젝트(SoundGuard)에서 "휴대폰 지킴" 기능만 분리해 독립 프로젝트로 만들었다. 원격 사운드 기능과 BLE 태그 감지 기능은 포함하지 않는다.

- Android 전용 (iOS 코드/설정 없음)
- 앱 UI 전 메뉴 영어로 작성
- 패키지명: `com.uniquelab.donttouchmyphone`
- 앱 이름: `Don't Touch My Phone`
- GitHub: https://github.com/selflesskr-design/DontTouchMyPhone.git

## 분리 작업 내역

- React Native/Expo 화면(`App.tsx`, `src/screens/GuardScreen.tsx`, `src/context/GuardContext.tsx`, `src/native/PhoneGuard.ts`, `src/types.ts`)을 지킴 기능만 남기고 새로 작성
- 네이티브 모듈을 `modules/soundguard-ble`(원격 사운드 + BLE 태그 + 지킴 통합)에서 `modules/phone-guard`(지킴 전용)로 분리
  - `PhoneGuardModule.kt`: 지킴 관련 Expo 함수만 남긴 슬림 모듈 (BLE GATT, 페어링, 슬롯 녹음 등 원격 사운드 코드 제거)
  - `GuardService.kt`, `GuardAlarmPlayer.kt`, `GuardSensitivityConfig.kt`, `GuardSoundRepository.kt`: 원본 로직 그대로 이식, 사용자 노출 문자열을 전부 영어로 번역
  - `AndroidManifest.xml`: `GuardService` 등록과 `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` 권한만 유지 (Bluetooth/위치 권한 제거)
- `modules/phone-guard/android/build.gradle` 신규 작성 (ML Kit OCR 의존성 등 불필요한 것 제외)

## 빌드 검증

- [x] `npx tsc --noEmit` 통과
- [x] `npx expo prebuild --platform android` 통과
- [x] expo-modules-autolinking이 `@donttouchmyphone/phone-guard` 모듈을 정상 인식 (최초 시도 시 `modules/phone-guard/android/build.gradle` 누락으로 인식 실패 → 추가 후 해결)
- [x] `android/build.gradle`의 `kotlin-gradle-plugin` 버전 미고정으로 Kotlin 1.9.24가 적용되어 `expo-modules-core` Compose 컴파일러 버전 불일치 오류 발생 → `1.9.25`로 명시 고정하여 해결 (safeguard 프로젝트의 기존 설정과 동일하게 맞춤)
- [x] `./gradlew assembleDebug` 통과
- [x] `./gradlew :app:assembleRelease` 통과 (최초 시도 시 `expo-asset` 의존성 누락으로 릴리스 JS 번들링 실패 → `package.json`에 `expo-asset` 재추가 후 해결)
- [x] release APK 실기기(폰1) adb 설치 및 실행 확인 (`adb install -r`, `adb shell am start`로 프로세스 기동 확인)
- APK: `android/app/build/outputs/apk/release/app-release.apk` (약 64MB)

## 기본 경보음

- [x] `siren.mp3`를 `modules/phone-guard/android/src/main/assets/siren.mp3`로 번들링
- [x] `PhoneGuardModule.requestPermissions()`에서 지킴 사운드가 없을 때만 번들 사이렌을 `guard_alarm_audio`로 복사해 자동 등록 (`ensureDefaultGuardSound`)
- [x] 사용자가 직접 녹음하거나 파일을 가져오면 기존 방식대로 교체·삭제 가능, 자동 등록은 최초 1회만 개입
- [x] 폰1 재설치 후 스크린샷으로 `Guard alarm sound: Siren / Imported audio file` 자동 표시 확인

## 실기기

- 폰1: Galaxy S22 (`SM_S901N`, ADB `R5CT322AQVK`) — 연결 확인, release APK(기본 사이렌 포함) 설치·실행 완료

## Git

- 새 git 저장소로 시작 (safeguard의 커밋 히스토리는 가져오지 않음)
- 원격: `origin` → `https://github.com/selflesskr-design/DontTouchMyPhone.git`

## Google Play Console 등록

- 앱 생성: `Don't Touch My Phone` / `com.uniquelab.donttouchmyphone` (개발자 계정: Unique Fifties)
- 스토어 등록정보: 앱 이름/설명, 아이콘(512x512), 피처 그래픽(1024x500), 스크린샷 3장(`store-assets/`, 루트 png 3개) 업로드 완료
- 카테고리 도구(Tools), 연락처 unique.fifties@gmail.com
- 개인정보처리방침: `privacy.html`을 GitHub Pages로 배포 (`https://selflesskr-design.github.io/DontTouchMyPhone/privacy.html`)
  - Pages 활성화를 위해 저장소를 private → **public**으로 전환 (민감 정보 없음 확인 후 진행, debug.keystore는 표준 공개 키라 문제 없음)
- 앱 콘텐츠 선언 11/11 완료: 로그인 없음, 광고 없음, 정부 앱 아님, 금융 기능 없음, 건강 기능 없음, 데이터 수집 없음(데이터 보안), 타겟층 13~15/16~17/18+, 콘텐츠 등급(IARC) 전 지역 전체이용가
- 릴리스 서명: `debug.keystore`(공개 저장소에 커밋됨)를 업로드 서명키로 쓰지 않고, 별도 `android/app/release-upload.keystore` 생성(`android/keystore.properties`에 자격 증명, 둘 다 `.gitignore` 처리)
- `targetSdkVersion`을 34 → **35**로 상향 (Play 콘솔이 신규 앱은 API 35 이상 요구)
- `versionCode` 1 → **2** (targetSdk 34로 만든 첫 업로드가 거부되어 버전 코드 충돌)
- **내부 테스트 트랙에 배포 완료** (0.1.0 - Initial release), 테스터: kimhyunkun@gmail.com, gimhyeongeon2@gmail.com
  - 참여 링크: https://play.google.com/apps/internaltest/4701588191794600242
- **프로덕션 출시 검토 제출 완료** (2026-07-23)
  - 국가/지역: 전 세계 176개국 + 기타 국가
  - 버전: 2 (0.1.0), 내부 테스트에서 쓰던 AAB 재사용
  - 검증 오류 1건 발생: "앱이 16KB 메모리 페이지 크기를 지원하지 않습니다" (Hermes 등 사전 빌드된 네이티브 라이브러리가 아직 16KB 페이지 크기를 지원하지 않아 발생 — 사용자 확인 후 "무시하고 계속하기"로 진행. 추후 React Native/Expo 관련 네이티브 라이브러리 업데이트 시 재확인 필요)
  - 게시 개요에서 "검토를 위해 변경사항 11개 전송" 완료 → 현재 "검토 중인 변경사항" 상태
  - 관리형 게시 사용 중지 상태이므로 Google 검토 승인 시 자동으로 전 세계에 공개됨 (통상 7일 이내, 더 걸릴 수 있음)

### 내부 테스트 링크 "항목을 찾을 수 없음" 이슈 해결

- 게시 직후 참여 링크가 "항목을 찾을 수 없음" 오류를 반환하는 문제 발생
- 원인: 앱 콘텐츠 선언 중 **광고 ID**, **포그라운드 서비스 권한** 2개가 누락되어 "게시 개요"의 "검토를 위해 앱 전송"이 잠겨 있었음
  - 광고 ID: 사용 안 함으로 선언
  - 포그라운드 서비스 권한(FOREGROUND_SERVICE_MEDIA_PLAYBACK): "미디어 재생"으로 선언, 실제 사용 장면을 담은 데모 영상 필요
    - phone1에서 가드 모드 시작 → 감시 중 → 알람 재생까지 화면 녹화(`adb shell screenrecord`) 후 유튜브 채널 "유니크랩"에 비공개(일부 공개)로 업로드: https://youtube.com/shorts/LcrQBtTr4oE
- 선언 완료 후 재확인 결과 참여 링크 정상 작동 확인 ("Accept invite" 초대 화면 정상 표시)

## 심사 이후 작업 (2026-07-24, 완료 — 아직 미출시 상태)

프로덕션 심사가 진행되는 동안 다음 버전 작업을 미리 진행. **아직 Play Console에 업로드하지 않았음.**

- [x] **UI 정리**: Guard alarm sound 카드에서 Preview/Stop preview/Delete를 위로, Record/Import file을 아래로 재배치하고 구분선 추가. Sensitivity 선택 UI 제거(내부값 HIGH 고정), "Arming delay" → "Get ready time"으로 라벨 변경(오해 방지). 기본 준비 시간 5초는 기존값 그대로 유지.
- [x] **레이아웃 압축**: 언어 선택 UI를 "System default" 버튼 없이 English/한국어/Español 3개만 남기고, 현재 상태 박스 옆에 나란히 배치(가로 폭 축소). 전체 카드 padding/폰트/간격을 줄여 스크롤 없이 한 화면(실기기 기준)에 헤더~시작 버튼까지 모두 보이도록 조정.
- [x] **상/하단 겹침 버그 수정**: 레이아웃 압축 중 상단 여백이 줄면서 다른 실기기(노치 있는 갤럭시 S10+, 이후 폰1 갤럭시 S22에서도)에서 앱 제목이 상태바와, 시작 버튼이 하단 내비게이션 바와 겹치는 문제 발견.
  - 1차 시도(`StatusBar.currentHeight`로 top padding만 수동 추가)로는 하단 내비게이션 바 겹침이 해결 안 됨
  - 근본 원인: RN 내장 `SafeAreaView`는 Android에서 안전영역을 실제로 적용하지 않음(iOS 전용 동작), targetSdk 35(Android 15)의 edge-to-edge 강제 적용과 겹쳐 상/하단 모두 시스템 UI 밑으로 콘텐츠가 그려짐
  - `react-native-safe-area-context` 패키지를 새로 추가해 `SafeAreaProvider`/`SafeAreaView`로 교체 → 상/하단 모두 정상적으로 안전영역 확보됨 (실기기 확인 완료)
- [x] **폰트 크기 재조정**: 레이아웃 압축 과정에서 전체적으로 글씨가 너무 작아졌다는 피드백 → 가독성 우선으로 카드 제목/본문/버튼 폰트를 다시 키움(한 화면에 딱 맞추는 것보다 가독성 우선, 필요하면 스크롤 허용).
- [x] **홈스크린 위젯**: `GuardWidgetProvider.kt` 추가 (상태 텍스트 + 탭하면 시작/종료 토글, `updatePeriodMillis=0`으로 이벤트 기반 갱신). 실기기에서 `dumpsys appwidget`으로 위젯 프로바이더 등록 확인(zombie=false).
- [x] **다국어 UI (한/영/스페인어)**: 기본은 `expo-localization`으로 기기 언어 자동 감지, 화면 하단 "Language" 카드에서 수동 선택도 가능(선택값은 네이티브 SharedPreferences에 저장 — 새 의존성 없이 기존 GuardSoundRepository 재사용). 네이티브 알림/채널 문구는 `res/values`, `values-ko`, `values-es`로 분리하고 수동 선택 시 `createConfigurationContext`로 로케일 오버라이드 적용.
  - 네이티브에서 JS로 보내던 실시간 상태/에러 메시지(약 30개)를 영어 문장 대신 안정적인 코드(`GUARD_ALREADY_RUNNING` 등)로 변경, JS `src/i18n/translations.ts`에서 en/ko/es로 번역 매핑
  - 부수적으로 발견한 버그 수정: `GuardContext.tsx`에서 녹음 상태를 영어 문자열(`'Recording started'`) 비교로 판단하던 로직 — 번역되면 깨지는 문제라 코드 비교(`'RECORDING_STARTED'`)로 수정
  - 실기기(한국어 기기)에서 스크린샷으로 자동 한국어 전환 확인
- [x] **Play 스토어 등록정보 EN/KO/ES 번역 초안**: `store-assets/store-listing.md`에 짧은 설명/전체 설명 초안 작성 완료. Play Console 등록은 사용자가 직접.
- [x] **빌드 검증**: `tsc --noEmit`, `expo prebuild`, `assembleDebug`, `assembleRelease` 모두 통과. 실기기(폰1, 다른 개체 — ADB `R3CM502G1NL`)에 release APK 설치 후 크래시 없이 정상 구동 확인.
- [x] **회귀 버그 발견/수정**: `expo prebuild` 재실행 시 `app.json`에 `android.versionCode`가 명시돼 있지 않아 기존 수동 설정값(2)이 1로 초기화되는 것을 발견 → `app.json`에 `versionCode: 3`을 명시적으로 고정 (다음 업로드는 3이 되어야 기존 프로덕션 심사 버전(2)과 충돌하지 않음).

### 다음에 할 일 (사용자 확인 필요)
- [x] 업로드용 AAB 미리 빌드 완료: `android/app/build/outputs/bundle/release/app-release.aab` (versionCode 3, 2026-07-24)
- 위젯은 시스템에 정상 등록된 것만 확인했고, 실제 홈 화면에 추가해 보는 수동 확인은 아직 안 함.

## 2026-07-25(밤) 진행 상황 — 심사 취소 후 v3 재준비 중 (미완료, 이어서 할 것)

**결정**: 심사가 72시간 넘게 걸려서, v2 통과를 기다리지 않고 지금 취소 후 바로 v3(오늘 작업분: 위젯/다국어 UI/레이아웃 수정)로 재제출하기로 함.

**완료한 것**:
- [x] Play Console에서 "검토 중인 변경사항" 전체 취소함 (게시 개요 → 변경사항 삭제) — 데이터는 안 날아가고 "아직 제출 안 됨" 상태(편집 가능)로 되돌아감
- [x] 프로덕션 트랙에 새 버전 만들기 → `app-release.aab`(versionCode 3) 업로드 완료
- [x] 릴리스 노트 작성 완료(영어): "Added multi-language support (English, 한국어, Español), a home screen widget, and UI improvements."
  - 주의: 이 릴리스 노트 입력 필드가 `<en-US>...</en-US>` 태그를 요구하는 커스텀 에디터라 빈 필드에 `<`로 시작하는 텍스트를 바로 입력하면 태그가 깨지는 버그가 있었음. "이전 버전에서 복사" 버튼으로 기존 태그 구조를 가져온 뒤 내용만 바꾸는 방식이 그나마 안정적이었음.
- [x] "16KB 메모리 페이지 크기 미지원" 경고(기존에도 있었던 것, STATUS.md 상단 참고) → "무시하고 계속하기"로 처리
- [x] "저장" 완료 — v3 바이너리가 게시 개요의 "아직 검토를 위해 제출되지 않음" 섹션에 draft로 저장된 상태

**아직 안 한 것 (다음 세션에서 이어갈 것)**:
1. **영어 기본 등록정보 수정** — 스토어 등록정보 → 기본(en-US) → "자세한 설명"에서 "Choose a sensitivity level (Low, Normal, High)" 문구 삭제(기능 없어짐), `store-assets/store-listing.md`의 업데이트된 영어 본문(anti-theft 키워드 포함)으로 교체
2. **한국어/스페인어 언어 추가** — 스토어 등록정보 → "번역 관리"에서 한국어·Español 추가 → 각각 `store-assets/store-listing.md`의 해당 언어 텍스트 붙여넣기
3. **스크린샷 업로드** — `img_src/` 폴더의 언어별 세트(01/02/03, 상태바 제거된 1080x1844) 각 언어 등록정보에 업로드
4. **피처 그래픽 업로드** — `store-assets/feature-graphic-1024x500-ko.png`, `-es.png`를 각 언어 등록정보에 업로드 (영어는 기존 것 유지)
5. **전체를 한 번에 "검토를 위해 변경사항 전송"** — 위 1~4번을 다 마친 뒤, 게시 개요에서 한 번에 묶어서 재심사 제출 (지금 저장된 v3 바이너리와 함께 자동으로 묶임)

**참고**: Play Console 등록정보 관련 입력 폼들(특히 릴리스 노트 같은 특수 에디터)이 자동화 입력에 예민하게 반응하는 경우가 있었음 — 다음 세션에서 스토어 등록정보 텍스트 필드도 비슷한 문제가 생기면, `browser_evaluate`로 네이티브 setter를 통해 값 설정 후 input/change 이벤트 dispatch하는 방식이 우회책이 될 수 있음.

## 2026-07-25 추가 작업 및 심사 통과 후 할 일 메모

### 현재 심사 상태
- 2026-07-25 기준 여전히 "검토 중" (제출일 2026-07-22 기준 48시간 이상 경과 — 사용자 기존 앱들은 보통 30시간 이내 처리됐다고 함, 첫 프로덕션 출시라 더 걸리는 것으로 추정)
- Play Console 접속 방법: 브라우저 로그인 계정이 `selfless.kr@gmail.com`이면 계정 전환 필요 — 이 앱의 개발자 계정은 `unique.fifties@gmail.com`(Unique Fifties)

### 현재 등록된 스토어 텍스트(영어, en-US)는 옛날 버전(v2) 기준
- 지금 등록된 "자세한 설명"에 "Choose a sensitivity level (Low, Normal, High)" 문구가 있는데, 이는 v2(심사 중인 버전) 기준 — v3부터는 Sensitivity 선택 UI가 없어졌으므로(HIGH 고정) **v3 심사 제출 시 이 문구도 같이 수정해야 함**
- 스토어 등록정보 수정은 지금 편집 자체가 잠겨 있음(저장 버튼 비활성화) — 심사 통과 후에나 가능
- **심사 통과 후 권장 순서**: v3 바이너리 업로드 + 다국어(한/영/스페인어) 등록정보 수정을 한 번에 묶어서 제출 (따로 하면 재심사를 두 번 거치게 됨)

### 검색 키워드 관련 발견
- 현재 등록정보(제목/짧은 설명/자세한 설명) 어디에도 "theft"/"anti-theft"(도난) 단어가 없음 — 유튜브 영상 해시태그엔 `#antitheft`를 썼는데 정작 스토어 텍스트엔 없어서 "phone theft alarm" 같은 검색에는 안 걸림. 다음 등록정보 수정 시 반영 권장
- 한국어/스페인어 번역이 아직 Play Console에 등록 안 되어 있어서(번역 관리에 언어 추가 안 함) 한국어/스페인어로 검색해도 현재는 노출 안 됨 → `store-assets/store-listing.md` 초안을 번역 관리에서 언어 추가 후 등록해야 함

### 신규 준비된 에셋 (전부 로컬에 있음, Play Console 미등록)
- `img_src/` — v3(오늘 빌드) 기준 실기기 스크린샷 9장, 1080x1920 PNG: `01_off`, `02_preparing`, `03_watching` × 언어 없음(한국어 기본)/`_en`/`_es`
- `store-assets/feature-graphic-1024x500-ko.png`, `store-assets/feature-graphic-1024x500-es.png` — 기존 영어 피처 그래픽에서 태그라인만 번역(아이콘·"Don't Touch My Phone" 타이틀은 브랜드명이라 유지)

### 등록 방법 (심사 통과 후)
1. 스토어 등록정보 → 상단 "번역 관리" 드롭다운 → 한국어/Español 언어 추가
2. 언어별로 생성된 등록정보 화면에서 앱 이름/짧은 설명/자세한 설명(`store-assets/store-listing.md` 참고, 위 "theft" 키워드 반영해서 업데이트) 입력
3. 같은 화면의 "그래픽 이미지" 칸에 언어별 피처 그래픽(`-ko.png`, `-es.png`) 업로드
4. 휴대전화 스크린샷 칸에 `img_src/`의 언어별 스크린샷 업로드 (영어는 기본 언어이므로 `_en` 없는/`_en` 세트 중 선택, 한국어는 언어 없는 세트 재사용 가능)

### 유튜브 (별개 진행 상황)
- 예약 업로드된 쇼츠(`boqI3YcRpiQ`, dtmp_0723.mp4, 2026-07-31 예약)는 **영어 전용으로 최종 확정** (다국어 문구 추가했다가 롤백함)
- 동일 영상에 자막만 다르게 입힌 3개 버전(영어/스페인어/한국어) 준비 완료 — 각 언어판은 스토어 등록정보가 해당 언어로 실제 등록된 뒤에 업로드 예정 (번역 없는 상태에서 트래픽 보내면 이탈 위험)
- 스페인어 자막 확정본: "¿Dejas tu teléfono solo un momento?" / "Activa el modo de vigilancia." / "Alguien va a agarrarlo…" / "En cuanto se mueve— ¡ALARMA!" / "¿Qué pasó?" / "Sigue a salvo." / "El modo de vigilancia funcionó." / CTA: "Alarma de movimiento para tu teléfono"
- 한국어 자막 확정본: "잠깐 자리 비우세요?" / "지킴 모드를 켜세요." / "누군가 손을 뻗는다…" / "움직이는 순간— 경보!" / "무슨 일이야?" / "아직 안전해." / "지킴 모드가 통했어." / CTA: "휴대폰 움직임 알람"

## 2026-07-26 — v3 스토어 등록정보 다국어화 + 심사 재제출 완료

2026-07-25(밤)에 남겨둔 "다음에 할 일"을 모두 이어서 완료. Play Console 브라우저 자동화(playwright MCP)로 진행.

- [x] **영어(en-US) 등록정보 수정**: 짧은 설명/자세한 설명을 `store-assets/store-listing.md`의 새 버전으로 교체. "Choose a sensitivity level (Low, Normal, High)" 문구 제거, "anti-theft" 키워드 추가(검색 노출 개선 목적)
- [x] **영어 스크린샷 교체**: 기존 3장(구버전 UI) 삭제 후 `img_src/01~03_*_en_1080x1920.png`로 교체
- [x] **한국어(ko-KR) 언어 추가**: 번역 관리 → 언어 선택에서 한국어 추가, 앱 이름/짧은 설명/자세한 설명(도난 방지 키워드 포함) 입력, `feature-graphic-1024x500-ko.png` 및 `img_src/01~03_*_1080x1920.png`(언어 접미사 없는 세트) 업로드
- [x] **스페인어(es-ES) 언어 추가**: 동일한 방식으로 Español(스페인) 추가, antirrobo 키워드 포함 텍스트 입력, `feature-graphic-1024x500-es.png` 및 `img_src/01~03_*_es_1080x1920.png` 업로드
- [x] **게시 개요에서 일괄 검토 제출**: v3 AAB(versionCode 3) + 3개 언어 등록정보를 포함한 변경사항 13개를 한 번에 "검토를 위해 전송" 완료. 자동 사전 검사(빠른 검사) 통과 후 상태가 "검토 중인 변경사항"으로 전환 — 정식 Google 심사 큐에 들어간 상태 확인 완료

### 작업 중 발견한 사항
- Play Console UI가 개편되어 "스토어 등록정보" 허브 페이지가 기존 데이터 유무와 상관없이 항상 "기본 스토어 등록정보 만들기" 버튼만 보여줌 — 클릭하면 기존 데이터가 그대로 열리는 정상 동작이었음(데이터 유실 아님). 다음에도 이 화면을 보면 당황하지 말 것.
- 애셋 패널의 "업로드"/"추가" 버튼이 Playwright의 기본 클릭으로는 사이드 토스트 메시지에 가려 클릭이 막히는 경우가 있었음 → `element.click()`을 JS로 직접 실행하는 방식으로 우회.
- 새로 추가한 언어(한국어/스페인어)의 필드가 실제로는 입력이 됐는데도 "앱의 이름을 추가하세요" 같은 잔상 오류가 잠깐 표시되는 UI 버그가 있었음 — 다른 언어(예: 그래픽 이미지 애셋 추가) 작업을 하나 더 진행하면 자연히 사라짐. 저장이 안 되면 당황하지 말고 다른 필드를 한 번 더 건드려볼 것.
- 스크린샷 섹션에서 미리보기로 표시되는 "상속된 기본 언어 스크린샷"은 삭제 버튼을 눌러도 반응이 없음(해당 언어 소유의 애셋이 아니라서) — 그냥 새 애셋을 추가하면 자동으로 그 언어 전용 스크린샷으로 교체됨.

## 현재 범위 제외

- 원격 사운드(컨트롤러/리시버) 기능
- BLE 태그 감지(가족 도착/아이 이탈) 기능
- iOS 구현
- 로그인, 서버, 클라우드 동기화
- Google Play 프로덕션 출시
