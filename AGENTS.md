# Routine Timer — Agent Guide

로컬 전용 **루틴 순차 타이머** MVP (Expo SDK 57 / React Native).

## 필수: Expo 문서

Expo API·패턴은 학습 데이터보다 **버전 문서를 우선**한다.

- https://docs.expo.dev/versions/v57.0.0/
- 유닛 테스트: https://docs.expo.dev/develop/unit-testing/

## MVP 범위 (현재)

**포함**
- 루틴·단계 CRUD, 드래그 순서 변경
- 순차 타이머 (일시정지 / 스킵 / 이전 / 종료)
- 루틴 **반복 횟수** (`repeatCount`)
- **템플릿**에서 루틴 생성
- **사용자 커스텀 템플릿** 작성·편집·삭제, 루틴을 템플릿으로 저장
- **실행 기록·스트릭** (`completions`)
- **예약 알림** (요일·시간, `schedule`)
- 설정: 사운드·햅틱
- AsyncStorage 로컬 저장 (계정/서버 없음)

**비포함 (요청 전까지 확장하지 않음)**
- 클라우드 동기화, 계정, 다크 모드, 위젯, 결제

## 스택

| 항목 | 선택 |
|------|------|
| 런타임 | Expo ~57, React Native 0.86, React 19 |
| 라우팅 | expo-router (`app/`) |
| 상태 | `src/store.tsx` (Context) |
| 저장 | `@react-native-async-storage/async-storage` |
| 알림 | `expo-notifications` |
| 패키지 매니저 | **pnpm** (`npm`/`yarn` 금지) |
| 테스트 | jest-expo + `@testing-library/react-native` |

## 디렉터리

```
app/                 # 화면 (index, routine/[id], player, done, history, templates, settings)
src/
  store.tsx          # 단일 스토어 · 세션 타이머
  storage.ts         # 로드/저장 · 레거시 마이그레이션
  notifications.ts   # 단계 종료 알림 + 루틴 예약 알림 (식별자 분리)
  templates.ts       # 프리셋 템플릿
  theme.ts           # 색/타이포 (accent = 블랙 톤)
  components/        # UI · StepEditorSheet · CircularTimerRing 등
  utils/             # time, stats, sessionAdvance, svgRing
__tests__/           # 회귀·유닛 테스트
docs/WIREFRAMES.md   # 화면 스케치 (일부 구버전일 수 있음 → 코드 우선)
```

## 도메인 규칙

- 타입 단일 출처: `src/types.ts` (`Routine`, `Session`, `CompletionRecord`, …)
- 세션은 시작 시 **루틴 스냅샷**을 고정한다. 편집 중 원본이 바뀌어도 진행 중 세션은 스냅샷 기준.
- 단계 종료 전이 로직은 `src/utils/sessionAdvance.ts` 순수 함수 → `store`가 호출. UI에 비즈니스 로직을 두지 않는다.
- 완료 시 `completions`에 기록하고 스트릭/통계는 `src/utils/stats.ts`로 계산한다.
- 저장 스키마 변경 시 `storage.ts` 마이그레이션을 유지하고 `__tests__/storage-migrate.test.ts`를 갱신한다.

## UI / 코드 컨벤션

- UI 문구는 **한국어**
- 스타일: `StyleSheet` + `src/theme.ts` 토큰. 새 화면에서 하드코딩 색을 늘리지 않는다.
- Primary accent는 블랙 톤 (`colors.accent`). iOS 시스템 블루로 되돌리지 않는다.
- 서버를 대신 켜지 않는다. 실행은 사용자에게 `pnpm start` 등을 요청한다.

## 알려진 함정 (반드시 지킬 것)

1. **SVG 웹**: `react-native-svg`의 `rotation` / `origin` prop은 웹에서 `Invalid DOM property transform-origin`을 유발한다.  
   → `src/utils/svgRing.ts`의 `transform={ringStartAtTopTransform(...)}`만 사용.  
   → 회귀: `__tests__/circular-timer-ring.test.tsx`
2. **알림**: Android Expo Go에서는 `expo-notifications` import가 크래시할 수 있다. `isNotificationsSupported()` 가드를 유지한다.  
   단계 종료 알림과 루틴 예약 알림은 identifier를 섞지 않는다 (`notifications.ts`).
3. **레거시 데이터**: 기존 설치에 `repeatCount` / `schedule` / `completions`가 없을 수 있다. 로드 시 기본값 마이그레이션 필수.

## 테스트

```bash
pnpm test
```

로직 변경 시 관련 테스트를 함께 수정·추가한다. 특히 세션 전이·스트릭·SVG·마이그레이션.

## 작업 원칙

- MVP 범위 밖 기능을 임의로 추가하지 않는다.
- 요청 범위 밖의 리팩터·문서 확장을 하지 않는다.
- 커밋/푸시는 사용자가 명시할 때만 한다.

## 최근 세션 메모

상세는 `.cursor/rules/session-progress.mdc` (alwaysApply)를 본다.
마지막 작업(2026-07-14): 커스텀 템플릿 + DurationPicker 직관 UI, 테스트 통과, 미커밋.
