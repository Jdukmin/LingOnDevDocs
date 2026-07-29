# Intent Layer Requirements

Parent Feature: [SYS-004 Intent Processing](system_requirements.md). 이 Layer는
Architecture에서만 정의되어 있으며, `backend/docs`·`frontend/docs`를 통틀어 대응하는
구현 코드나 문서가 아직 존재하지 않는다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| INT-001 | SYS-004 | Intent Classification | The system shall classify a user's natural-language message into one of a defined set of intent types. | Analysis | Planned | 0% |
| INT-002 | SYS-004 | Slot Extraction | The system shall extract required parameters (slots) for the classified intent from the user's message. | Analysis | Planned | 0% |
| INT-003 | SYS-004 | Entity Recognition | The system shall recognize named entities (dates, places, people, services) within the user's message. | Analysis | Planned | 0% |
| INT-004 | SYS-004 | Intent Validation | The system shall validate that a generated intent has all required slots and is executable before handing it to the Planner. | Test | Planned | 0% |
| INT-005 | SYS-004 | JSON Generation | The system shall emit the resolved intent as a structured JSON object matching a defined intent schema. | Test | Planned | 0% |

---

## 근거 노트 (Evidence)

- **INT-001 ~ INT-005**: `backend/src`(문서상 참조되는 경로), `backend/docs`,
  `frontend/docs`에 `intent` 관련 디렉터리·파일이 전혀 없다. 현재 Chat →
  LLM 호출은 [chat_requirements.md](chat_requirements.md) CHAT-001에서 보듯
  분류/슬롯 추출 없이 원문 메시지를 그대로 LLM에 전달하는 구조라, Intent
  Layer는 설계만 되어 있고 구현은 전무하다. 전체 Planned/0%.
