# CalendarWidget

`lib/widget/calendar_widget.dart`

---

> **⚠ 2026-07-22 갱신 — MVP는 Google Calendar만 지원**: 여기서 말하는
> 캘린더 이벤트는 현재 **로컬 기기 캘린더**이며, Backend `GET /v1/calendar/events`(Google
> Calendar)와는 다른 데이터 소스다(필드명도 다를 수 있음 — 코드 확인 필요).
> **로컬 캘린더는 MVP 구현 대상이 아니다** — Phase 2(Google Calendar 연동)에서
> 로컬 캘린더 표시는 **병합이 아니라 교체**된다. 정규 스키마는
> [requirements/domain_icd/calendar.md](../../../requirements/domain_icd/calendar.md) 참고.

## 역할

`CalendarModule`에서 가져온 로컬 캘린더 이벤트를 시간순으로 표시합니다.

---

## 입력 (Props)

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `module` | `CalendarModule` | ✅ | 이벤트 데이터 소스 |

---

## 출력 (Callbacks)

없음.

---

## 사용 위치

- `AodDisplay` → `AodTabletLayout.calendar`

---

## 의존성

| 대상 | 타입 |
|------|------|
| `CalendarModule` | `BaseModule` |
