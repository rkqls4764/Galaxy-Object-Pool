# 언어별 스타터 생성 가이드

공통 프로토콜은 동일하지만 각 언어의 프로젝트 구조, 빌드 및 테스트 방법은 다릅니다. 아래 표는 **AI에게 스타터를 요청할 때 참고할 기본값**입니다. 버전이나 라이브러리는 로컬 개발 환경에 맞게 조정하십시오.

| 언어 | 권장 시작점 | JSONL 처리 | 검증할 특징 |
| --- | --- | --- | --- |
| C++20 | `solution/src`, 헤더와 테스트, 컴파일러 직접 실행 가능 | `std::getline` + 검증된 JSON 라이브러리 | 소유권, 수명, move/copy, 반환 후 참조 |
| C# | `dotnet new console`, `.csproj` | `Console.ReadLine`, `System.Text.Json` | 클래스 참조 동일성, 관리형 할당 |
| Java | `src/main/java`, JUnit 등 테스트 | `BufferedReader`, 검증된 JSON 라이브러리 | 참조 동일성(`==`), GC, 동시성 범위 |
| Python | `solution/main.py`, `unittest`/`pytest` | 내장 `json`, `sys.stdin`, `print(..., flush=True)` | `is`, 재초기화, mutable 상태 |
| Rust | `cargo new`, `src/main.rs` | `serde`, `serde_json`, `BufRead` | 소유권/대여, 인덱스 또는 핸들 재사용 |
| Go | `go mod init`, `main.go`, `_test.go` | `encoding/json`, `bufio.Scanner` | 포인터/슬롯 관리, 종료 및 flush |
| C | `struct` + 함수 API + 단위 테스트 | 검증된 JSON 라이브러리 사용 | 수동 메모리 관리, 반환 후 사용 |
| JavaScript | Node.js 22+, ESM | `readline`, `JSON.parse/stringify` | 객체 참조, 상태 초기화 |

> C는 클래스가 없는 언어입니다. `struct`와 함수 기반 모듈로 같은 수명 관리 개념을 학습하면 됩니다. Rust도 상속 지향 클래스 대신 타입과 트레이트·소유권을 활용합니다.

## 공통 필수 실행 요건

1. 실행 프로그램은 표준 입력에서 **한 줄짜리 `init` JSON**을 읽은 후 이벤트를 생성합니다.
2. 표준 출력에는 JSONL `acquire`, `release`, `reset`만 기록합니다.
3. 기타 출력은 stderr로 보냅니다. 언어별 버퍼링을 고려해 매 메시지를 flush합니다.
4. 유한한 시나리오를 실행한 뒤 정상 종료할 수 있어야 오프라인 검증이 가능합니다.
5. `ack`를 확인하고 싶다면 입력을 계속 처리하되, stdin 읽기와 출력이 서로 교착되지 않게 설계합니다.

## AI에게 요청할 실행 스크립트

```text
이 언어로 만든 프로그램의 개발자용 명령을 solution/README.md에 적으십시오.
- 최초 빌드 및 의존성 설치
- 컴파일 또는 실행
- 언어별 단위 테스트
- 공통 JSONL 검증기 실행 (실제 실행 파일 기준)
- GitHub Actions 언어별 테스트 작업
기존 verify.yml은 바꾸지 마십시오.
```

가령 Python은 `node scripts/verify-protocol.mjs -- python solution/main.py`, C#은 먼저 빌드 후 `node scripts/verify-protocol.mjs -- dotnet solution/bin/.../YourApp.dll`처럼 전달합니다. C++이나 Rust는 빌드된 실행 파일 경로를 전달하면 됩니다. **경로와 빌드 산출물 이름은 실제 프로젝트에 맞게 생성**해야 합니다.
