# Firebase Analytics CSV Dashboard

Firebase Analytics에서 내보낸 CSV 데이터를 분석하고 시각화하는 대시보드 도구입니다.

## 주요 기능

- **CSV 기반 데이터 분석**: Firebase Analytics에서 내보낸 CSV 파일을 직접 분석
- **인터랙티브 대시보드**: 실시간 차트와 테이블로 데이터 시각화
- **Screen View 분석**: 화면별 조회수 및 참여도 분석
- **User Engagement 분석**: 사용자 참여 패턴 분석
- **Feature Usage 분석**: 모든 기능의 사용 패턴 통합 분석
- **리포트 다운로드**: CSV 및 HTML 형식으로 리포트 다운로드
- **다중 프로젝트 지원**: 여러 프로젝트의 CSV 데이터를 폴더별로 관리

## 시작하기

### 설치

```bash
npm install
```

### 데이터 준비

1. Firebase Analytics에서 CSV 파일을 내보내기
2. `data/{프로젝트명}/` 폴더에 CSV 파일 복사

필수 파일:
- `Firebase_overview.csv` (또는 `Firebase_overview1.csv` 등)
- `Events_Event_name.csv` (또는 `Events_Event_name1.csv` 등)
- `Pages_and_screens_Page_title_and_screen_class.csv` (또는 `Pages_and_screens_Page_title_and_screen_class1.csv` 등)

### 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 사용 방법

### 1. 데이터 추가

```bash
# 프로젝트별로 폴더 생성
mkdir -p data/my-project

# CSV 파일 복사
cp /path/to/csv/*.csv data/my-project/
```

### 2. 대시보드 사용

- 상단의 "Data Source" 드롭다운에서 프로젝트 선택
- 자동으로 해당 프로젝트의 데이터가 로드됨
- 리포트 다운로드 버튼으로 CSV/HTML 리포트 생성

## 프로젝트 구조

```
├── data/                    # CSV 데이터 폴더
│   ├── default/            # 기본 프로젝트
│   └── {project-name}/     # 다른 프로젝트들
├── src/
│   ├── app/                # Next.js 앱 라우트
│   ├── components/         # React 컴포넌트
│   ├── repositories/       # 데이터 레포지토리
│   └── services/           # 비즈니스 로직
└── README.md
```

## 분석 기능

### Screen View Analysis
- 화면별 조회수 분석
- 사용자당 평균 조회수
- 평균 참여 시간

### User Engagement Analysis
- 화면별 참여도 분석
- 참여 이벤트 수
- 사용자 참여 패턴

### Feature Usage Analysis
- 모든 기능의 통합 분석
- Feature 타입별 분류 (screen, menu, action, event)
- 관련 화면 매핑

## 리포트

### CSV 리포트
- 모든 분석 데이터를 CSV 형식으로 다운로드
- Excel에서 열어서 추가 분석 가능

### HTML 리포트
- 시각적으로 정리된 리포트
- 차트 포함
- 인쇄 가능

## 기술 스택

- **Next.js 14**: React 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **Recharts**: 차트 라이브러리
- **Chart.js**: HTML 리포트용 차트
- **csv-parse**: CSV 파싱
- **date-fns**: 날짜 처리

## 라이선스

MIT

