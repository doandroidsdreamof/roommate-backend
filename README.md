# Roommate App - Roadmap

## Architecture

[![](https://mermaid.ink/img/pako:eNplT8tuwjAQ_JVozwERQl4-VGpp1VYqFTSRItXmYMgSIkiMHEdAKf_exCkUig_j3ZnZWfsAc5EgEFisxXa-5FIZ0QMrjPoM1xkWirbXtOUuFaPTuft-iaJx-G28p1mxuxHj8FpqURNU4_SGb-aMj6cwog0Y9-PX6X81DmmMs1DMV6iMZ65wy_dXQXHYpvDZLFOjCT0VjI2wLHmK5a_9JLR2TLLyMkY_4KxQjVd7NKMdY1GqVGI4eaN_Ze0FE1KZJUCUrNCEHGXOmxYOTQIDtcQcGZC6TLhcMWDFsZ7Z8OJTiPw0JkWVLoEs-Lqsu2qT1H9-zHgqeX5mJRYJyqGoCgWkH-gMIAfYAem4fbvrupbfD3zbtmzHN2EPxOlZXdsbBIFr-95gYDne0YQvvbbX9T3n-AMo16QL?type=png)](https://mermaid.live/edit#pako:eNplT8tuwjAQ_JVozwERQl4-VGpp1VYqFTSRItXmYMgSIkiMHEdAKf_exCkUig_j3ZnZWfsAc5EgEFisxXa-5FIZ0QMrjPoM1xkWirbXtOUuFaPTuft-iaJx-G28p1mxuxHj8FpqURNU4_SGb-aMj6cwog0Y9-PX6X81DmmMs1DMV6iMZ65wy_dXQXHYpvDZLFOjCT0VjI2wLHmK5a_9JLR2TLLyMkY_4KxQjVd7NKMdY1GqVGI4eaN_Ze0FE1KZJUCUrNCEHGXOmxYOTQIDtcQcGZC6TLhcMWDFsZ7Z8OJTiPw0JkWVLoEs-Lqsu2qT1H9-zHgqeX5mJRYJyqGoCgWkH-gMIAfYAem4fbvrupbfD3zbtmzHN2EPxOlZXdsbBIFr-95gYDne0YQvvbbX9T3n-AMo16QL)

---

## Component Overview

| Component         | Technology | Responsibility                         |
| ----------------- | ---------- | -------------------------------------- |
| Reverse Proxy     | Nginx      | SSL termination, load balancing        |
| REST API          | NestJS     | HTTP endpoints, business logic         |
| WebSocket Gateway | Socket.io  | Real-time chat, presence               |
| Message Queue     | RabbitMQ   | Async message delivery between clients |
| Cache             | Redis      | Cache layer, rate limiting, session    |
| Database          | PostgreSQL | Primary data store                     |

---

## Phase 1: Foundation

> Core authentication system with stateless JWT access tokens and database-stored refresh tokens.

### Completed

- [x] Project scaffolding (NestJS, Drizzle, Docker)
- [x] Email service (SMTP)
- [x] OTP generation and verification
- [x] JWT access tokens
- [x] Refresh tokens (hashed, 90-day expiry)
- [x] JWT Guard decorator
- [x] Token rotation on refresh
- [x] `POST /auth/refresh` endpoint
- [x] `POST /auth/logout` endpoint

### Remaining

- [x] Seeder for locations
- [x] Swagger setup
- [ ] Image upload service
- [ ] Image compression
- [ ] NSFW filtering

### Notes

```
Access Token:  JWT, stateless
Refresh Token: Opaque string, hashed in DB, 90-day expiry
```

---

## Phase 2: User Profile & Preferences

> User identity and preferences system. Foundation for matching algorithm.

### Tasks

- [x] Profile schema
- [x] Profile CRUD endpoints
- [x] Preferences schema
- [x] Preferences CRUD endpoints

## Phase 3: Postings

> Property posting system with geospatial search capability.

### Tasks

- [x] Posting schema based on location
- [x] Posting create/updated CRUD endpoints
- [x] Posting image update CRUD endpoints
- [x] Posting delete/posting_status
- [x] Pagination (posting lists)
- [x] Location endpoint for getting neighborhoodsID
- [x] Search and Filtering endpoints for lists
- [x] Pagination GET bookmarks
- [x] Preventing multiple postings in the same location
- [x] Bookmark feature and count of it for posts
- [x] Posting type (offering_room, looking_for_room, looking_for_roommate)
- [x] Posting status (active/inactive/rented)

## Phase 4: Discovery & Matching

> Swipe-based discovery system with mutual matching.

### Tasks

#### Core

- [x] `swipes` table
- [x] `matches` table
- [x] `POST /swipes` endpoint
- [x] `GET /matches` endpoint (list matches)
- [x] `DELETE /matches/:id` endpoint (unmatch)

#### Feed Generation

- [x] `GET /feed` endpoint
- [x] Location-based filtering
- [x] Gender preference filtering
- [x] Budget/lifestyle preference filtering
- [x] Exclude swiped profiles
- [x] Exclude blocked users (bidirectional)

[![](https://mermaid.ink/img/pako:eNpNkEFvgjAUx79K805bggZwUtfDksXpLjss6i4rHip9AhFaUkqmM373QYFtPby8_y-_1770ComWCAyOhf5KMmEsedvEirRna9t0x1NUaITFNaLc35PJ5IkstbJ4tvwVLfmo0Yxg3w8OyanvWhd8jTbJyKrI0_xQoGOD2rXOW52ToqlzrWr-XFXF5R8Y1D_gBraJNshddTuMWk-coY3lXSGHS49HpWOdsdNV6POdOGHXktAfBMf7tZS84xu0jVGk_4DeiBV4kJpcArOmQQ9KNKXoIlw7IwabYYkxsLaVwpxiiNWtnamE-tS6HMeMbtIM2FEUdZuaSrYf_ZKL1IjylxpUEs1SN8oCCwLqLgF2hTOwKJzOZosgmIeL0PejKPDgAiykdDqjD4808qOQRtH85sG3e9WfLuj89gPuAp5F?type=png)](https://mermaid.live/edit#pako:eNpNkEFvgjAUx79K805bggZwUtfDksXpLjss6i4rHip9AhFaUkqmM373QYFtPby8_y-_1770ComWCAyOhf5KMmEsedvEirRna9t0x1NUaITFNaLc35PJ5IkstbJ4tvwVLfmo0Yxg3w8OyanvWhd8jTbJyKrI0_xQoGOD2rXOW52ToqlzrWr-XFXF5R8Y1D_gBraJNshddTuMWk-coY3lXSGHS49HpWOdsdNV6POdOGHXktAfBMf7tZS84xu0jVGk_4DeiBV4kJpcArOmQQ9KNKXoIlw7IwabYYkxsLaVwpxiiNWtnamE-tS6HMeMbtIM2FEUdZuaSrYf_ZKL1IjylxpUEs1SN8oCCwLqLgF2hTOwKJzOZosgmIeL0PejKPDgAiykdDqjD4808qOQRtH85sG3e9WfLuj89gPuAp5F)

#### Ranking Algorithm

- [x] Basic scoring system:
  - Location match
  - Preference compatibility
  - Profile popularity
  - Recent activity
- [x] ORDER BY score logic

#### Optimizations

- [ ] Redis cache for feed sets
- [ ] Query indexes on swipes table
- [ ] Archive old swipes (>6 months)

#### Analytics

- [ ] Track swipe behavior (view duration, time to decision)
- [ ] Track match quality (unmatch rate, time to unmatch)
- [ ] Monitor algorithm effectiveness

### Edge Cases

- [ ] Self-swipe prevention
- [ ] Duplicate swipe prevention
- [ ] Race condition on match creation
- [ ] Deleted/blocked user handling
- [ ] Re-match after unmatch

### Algorithm Phases

```
Phase 1: Location + basic filters
Phase 2: + Lifestyle preference scoring
Phase 3: + Collaborative filtering (Apache AGE extension?)
Phase 4: + ML recommendations (future)
```

---

## Phase 5: Real-time Messaging

> End-to-end encrypted peer-to-peer messaging via WebSocket.

### Tasks

- [ ] WebSocket Gateway (Socket.io)
- [ ] JWT auth on connection
- [ ] Room per match
- [ ] RabbitMQ integration
- [ ] E2EE implementation
- [ ] Offline message queue
- [ ] Delivery/read receipts
- [ ] Temporary stored messages strategy

### E2EE Design

> Messages are encrypted on sender's device and decrypted on receiver's device. Server only stores encrypted data it cannot read.

```
Key Exchange: Diffie-Hellman

Flow:
  1. Users match → exchange encryption keys
  2. Sender encrypts message on their phone
  3. Server stores encrypted message (until it is delivered e.g. for offline users)
  4. Receiver decrypts on their phone
```

## Phase 5.5: Notifications

> Push notifications for matches and messages when users are offline.

### Tasks

- [ ] `user_devices` table (device_token, platform, user_id)
- [ ] `notifications` table (user_id, type, title, body, read_at, created_at)
- [ ] `POST /devices/register` endpoint
- [ ] `GET /notifications` endpoint
- [ ] `PUT /notifications/:id/read` endpoint
- [ ] RabbitMQ notification consumer
- [ ] FCM integration (Android push)
- [ ] APNs integration (iOS push)
- [ ] Firebase project setup
- [ ] APNs certificate setup
- [ ] Rate limiting (max 5 push/day per user)
- [ ] Auto-delete notifications older than 30 days

### Notification Types

```
- New match (when offline)
- New message (when offline)
```

## Phase 6: Safety & Moderation

> User safety features and abuse prevention.

### Tasks

- [x] Block/unblock user endpoint
- [ ] Rate limiting (Redis)
- [ ] Bot prevention

### Rate Limiting Strategy

```
Layer 1 - Nginx:   IP-based throttling
Layer 2 - Redis:   User-based limits
Layer 3 - App:     Endpoint-specific limits

Limits:
├── Auth:     5 OTP requests/hour/email
```

---

## Phase 7: Maps Integration

> Location services for postings and discovery.

### Tasks

- [ ] Geocoding service
- [ ] Reverse geocoding
- [ ] Location picker component

## Phase 8: Infrastructure

> Production deployment and DevOps setup.

### Tasks

- [ ] Docker Compose production config
- [ ] Nginx SSL configuration (Let's Encrypt)
- [x] GitHub Actions CI
- [ ] GitHub Actions CD
- [ ] Health check endpoints
- [ ] Structured logging
- [ ] Backup strategy (cron)

### Docker Services

```yaml
services:
  api: NestJS application
  postgres: PostgreSQL
  redis: Cache + Rate limiting
  rabbitmq: Message queue
  nginx: Reverse proxy + SSL
```

### CI/CD Pipeline

[![](https://mermaid.ink/img/pako:eNpNjc1ugzAQhF_F2jNBTs2vD5UKpFKlHKK26qHAwYodQAUbGVttinj3EjepOqedbzSzMxwVF0Dh1KvPY8u0QfvnSqJVD-XBTm2NNpt7lJX7Tpr6N8gcystXMd1Q7lBRZrbr-ZUVju3cCnoaWCOuwc4Fj2Uhxl6d0dvhpQYPGt1xoEZb4cEg9MAuFuZLpQLTikFUQNeTM_1RQSWXtTMy-a7UcKtpZZsW6In10-rsyJkRRccazYY_qoXkQufKSgN0S7AbATrDF9Ag9AlJtkGc3iU4inAUeHAGSkLikzhI04REaYJTsnjw7d5iP4lD_E_b5QdmD2IE?type=png)](https://mermaid.live/edit#pako:eNpNjc1ugzAQhF_F2jNBTs2vD5UKpFKlHKK26qHAwYodQAUbGVttinj3EjepOqedbzSzMxwVF0Dh1KvPY8u0QfvnSqJVD-XBTm2NNpt7lJX7Tpr6N8gcystXMd1Q7lBRZrbr-ZUVju3cCnoaWCOuwc4Fj2Uhxl6d0dvhpQYPGt1xoEZb4cEg9MAuFuZLpQLTikFUQNeTM_1RQSWXtTMy-a7UcKtpZZsW6In10-rsyJkRRccazYY_qoXkQufKSgN0S7AbATrDF9Ag9AlJtkGc3iU4inAUeHAGSkLikzhI04REaYJTsnjw7d5iP4lD_E_b5QdmD2IE)

---

## Phase 9: Performance

> Optimization and caching strategies.

### Tasks

- [ ] Move refresh tokens to Redis
- [ ] Query optimization (indexes)
- [ ] Connection pooling (pgBouncer)
- [ ] Response caching
