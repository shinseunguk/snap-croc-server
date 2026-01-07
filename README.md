# 🐊 Snap Croc Server

실시간 멀티플레이어 게임 플랫폼 **Snap Croc**의 백엔드 서버입니다.

## 📋 프로젝트 개요

Snap Croc은 실시간으로 여러 플레이어가 함께 즐길 수 있는 웹 게임 플랫폼입니다. 소셜 로그인, 게임 매칭, 실시간 통신, 랭킹 시스템 등을 제공합니다.

### 🏗️ 기술 스택

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT + Social Login (Google, Apple, Kakao)
- **File Upload**: Multer + Sharp (이미지 처리)
- **API Documentation**: Swagger
- **Container**: Docker & Docker Compose

## 🚀 시작하기

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd snap-croc-server

# 의존성 설치
npm install
```

### 2. 환경변수 설정

`.env` 파일을 생성하고 필요한 환경변수를 설정하세요:

```env
# 데이터베이스
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=snapcroc
DATABASE_PASSWORD=password
DATABASE_NAME=snapcroc_dev

# JWT
JWT_SECRET=your-jwt-secret-key

# 소셜 로그인
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret

APPLE_CLIENT_ID=your-apple-client-id
APPLE_PRIVATE_KEY=your-apple-private-key
```

### 3. 개발 환경 실행

#### Docker 사용 (권장)
```bash
# 개발 환경 실행
npm run docker:dev

# 빌드와 함께 실행
npm run docker:dev:build

# 로그 확인
npm run docker:dev:logs

# 종료
npm run docker:dev:down
```

#### 로컬 실행
```bash
# PostgreSQL, Redis가 이미 실행 중이어야 함
npm run start:dev
```

### 4. 테스트 데이터 생성

```bash
# 테스트 사용자 5명 생성
npm run seed
```

### 5. API 테스트

```bash
# 테스트용 JWT 토큰 생성
node test-token.js

# 생성된 토큰으로 API 테스트
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/users/me
```

## 📚 API 문서

서버 실행 후 다음 URL에서 Swagger API 문서를 확인할 수 있습니다:
- **개발환경**: http://localhost:3000/api-docs

## 🎮 주요 기능

### 🔐 인증 시스템
- **소셜 로그인**: Google, Apple, Kakao 지원
- **JWT 토큰**: 무상태 인증 방식
- **리프레시 토큰**: 토큰 자동 갱신

### 👤 사용자 프로필 관리
- **닉네임 설정**: 2-20자, 중복 확인
- **아바타 시스템**: 이모지 또는 커스텀 이미지
- **프로필 이미지**: 업로드, 자동 리사이징 (300x300px)
- **표시 우선순위**: 커스텀 이미지 > 선택 이모지 > 소셜 이미지 > 기본

### 📊 게임 통계
- **게임 기록**: 승리/패배, 연승 기록
- **포인트 시스템**: 레벨 및 티어 산정
- **랭킹 시스템**: 포인트 기반 순위

## 🗂️ 프로젝트 구조

```
src/
├── auth/                 # 인증 모듈
│   ├── guards/          # JWT, 소셜 로그인 가드
│   └── strategies/      # Passport 전략들
├── common/              # 공통 유틸리티
│   ├── filters/         # 예외 필터
│   ├── interceptors/    # 인터셉터
│   ├── multer/          # 파일 업로드 설정
│   ├── pipes/           # 유효성 검사 파이프
│   └── utils/           # 유틸리티 함수들
├── config/              # 설정 파일들
├── database/            # 데이터베이스 관련
│   └── seeds/           # 시드 데이터
├── entities/            # TypeORM 엔티티들
├── logger/              # 로깅 설정
└── modules/             # 비즈니스 로직 모듈들
    └── users/           # 사용자 관리
```

## 🛠️ 개발 명령어

```bash
# 개발 서버 실행
npm run start:dev

# 빌드
npm run build

# 프로덕션 실행
npm run start:prod

# 테스트
npm run test
npm run test:e2e
npm run test:cov

# 린트
npm run lint

# 포맷터
npm run format

# 시드 데이터 생성
npm run seed
```

## 📡 API 엔드포인트

### 🔐 인증
- `POST /auth/google` - Google 소셜 로그인
- `POST /auth/kakao` - Kakao 소셜 로그인  
- `POST /auth/apple` - Apple 소셜 로그인
- `POST /auth/refresh` - 토큰 갱신

### 👤 사용자 관리
- `GET /users/me` - 내 정보 조회
- `PUT /users/me/nickname` - 닉네임 변경
- `GET /users/nickname/check/:nickname` - 닉네임 중복 확인
- `POST /users/me/profile-image` - 프로필 이미지 업로드
- `PUT /users/me/avatar` - 아바타 변경 (이모지/이미지)
- `DELETE /users/me` - 회원 탈퇴

## 🚀 배포

### Docker 프로덕션 배포
```bash
# 프로덕션 환경 실행
npm run docker:prod
```

### 수동 배포
```bash
# 빌드
npm run build

# PM2로 프로덕션 실행
pm2 start dist/main.js --name snap-croc-server
```

## 🔧 환경별 설정

### 개발 환경
- 로컬 PostgreSQL/Redis 또는 Docker
- 상세한 로그 출력
- Hot Reload 활성화

### 프로덕션 환경  
- Nginx 리버스 프록시
- 환경변수 기반 설정
- 로그 레벨 최적화

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat(scope): amazing feature'`)
4. Push to the Branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### 커밋 컨벤션
```
feat(scope): 새로운 기능 추가
fix(scope): 버그 수정  
docs(scope): 문서 변경
style(scope): 코드 포맷팅
refactor(scope): 리팩토링
test(scope): 테스트 추가
chore(scope): 빌드 프로세스 변경
```

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

---

**Snap Croc** - 함께 즐기는 실시간 멀티플레이어 게임 🎮🐊