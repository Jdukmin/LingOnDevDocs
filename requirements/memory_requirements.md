# Memory Layer Requirements (RAG)

Parent Feature: [SYS-005 Memory Management](system_requirements.md). 이 Layer는
Architecture에서만 정의되어 있으며, 대응하는 구현 코드나 문서가 아직 존재하지 않는다.

| ID | Parent Feature | Requirement | Description | Verification | Status | Progress |
|---|---|---|---|---|---|---|
| MEM-001 | SYS-005 | Calendar Retrieval | The system shall retrieve relevant past/upcoming calendar events as context for Intent/Planner decisions. | Analysis | Planned | 0% |
| MEM-002 | SYS-005 | Note Retrieval | The system shall retrieve relevant user notes as context for Intent/Planner decisions. | Analysis | Planned | 0% |
| MEM-003 | SYS-005 | Semantic Search | The system shall support embedding-based semantic search over stored user memory. | Test | Planned | 0% |
| MEM-004 | SYS-005 | Hybrid Search | The system shall combine keyword and semantic search to rank memory retrieval results. | Test | Planned | 0% |
| MEM-005 | SYS-005 | Context Ranking | The system shall rank and truncate retrieved memory items to fit within the LLM context window. | Analysis | Planned | 0% |

---

## 근거 노트 (Evidence)

- **MEM-001 ~ MEM-005**: 벡터 스토어, 임베딩, RAG 파이프라인, notes 저장소 등에
  대한 코드·문서 근거가 없다. `BriefCardWidget`이 `WeatherModule`/`CalendarModule`을
  직접 참조해 브리핑을 만드는 것은 인메모리 객체 참조일 뿐, 영속적·검색 가능한
  Memory Layer가 아니므로 MEM-001(Calendar Retrieval)의 근거로 보지 않았다.
  근거: [frontend/docs/widgets/BriefCardWidget.md](../frontend/docs/widgets/BriefCardWidget.md),
  [frontend/docs/state/Overview.md](../frontend/docs/state/Overview.md). 전체 Planned/0%.
