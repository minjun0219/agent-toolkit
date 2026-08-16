---
'@minjun0219/rocky': minor
---

번들 스킬 `todoist` 를 제거한다

rocky 가 다루는 작업 목록은 rocky-todo 보드 하나이고 기록은 `worklog_*` 다. 외부 태스크
서비스 연동은 이 플러그인의 표면에 두지 않는다 — 자격증명을 싣지 않고 세션에 연결된 MCP 만
빌려 쓰는 스킬이어도 마찬가지다.

- `skills/todoist/` 삭제. 스킬 자체는 오너의 `harness` 레포로 이관했다.
- `README.md` · `docs/hosts.md` · `.claude-plugin/plugin.json`(description + keywords) 동기화.
- `AGENTS.md` 의 *Scope → Out* 에 "외부 태스크 서비스 연동 금지" 항목 추가.

되살릴 일이 있으면 git 히스토리에서 꺼낼 수 있다.
