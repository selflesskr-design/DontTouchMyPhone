# Don't Touch My Phone — 진행 상황

최종 갱신: 2026-07-22

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
- 프로덕션 출시는 아직 진행하지 않음 (사용자 확인 후 진행 예정)

## 현재 범위 제외

- 원격 사운드(컨트롤러/리시버) 기능
- BLE 태그 감지(가족 도착/아이 이탈) 기능
- iOS 구현
- 로그인, 서버, 클라우드 동기화
- Google Play 프로덕션 출시
