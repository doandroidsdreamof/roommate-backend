# Roommate App - Roadmap

## Architecture

[![](https://mermaid.ink/img/pako:eNplT1tvgjAU_ivkPKMTkYt9WDLdsi3RRVcSklEfqhyRKNSUEnXqfx-X4XT24fSc73baIyxEiEBguRG7xYpLpXkDlmrFGW5iTFVQX7Mau2a0Vuvx9OZ5E3rSPqI43d-RPr2l6loBQQ0zSkcPo8Hsji_92ucL9YKyaE-T99l_1qeBj3MqFmtU2itXuOOHmyCf1il8Po_VeBo0DWNjzDIeYfYrb4hajmGcXcdUD7gwQVVv9lRIpZiITEUS6XQU_LWFFnSIZBwCUTJHHRKUCS9HOJYJDNQKE2RAijbkcs2ApefCs-XplxBJY5Mij1ZAlnyTFVO-DYs_P8c8kjy5oBLTEOVQ5KkCYphVBpAj7IG07K7Ztm3D7fZd0zRMy9XhAMTqGG3T6fX7tuk6vZ5hOWcdvqu1nbbrWOcfUQWmaw?type=png)](https://mermaid.live/edit#pako:eNplT1tvgjAU_ivkPKMTkYt9WDLdsi3RRVcSklEfqhyRKNSUEnXqfx-X4XT24fSc73baIyxEiEBguRG7xYpLpXkDlmrFGW5iTFVQX7Mau2a0Vuvx9OZ5E3rSPqI43d-RPr2l6loBQQ0zSkcPo8Hsji_92ucL9YKyaE-T99l_1qeBj3MqFmtU2itXuOOHmyCf1il8Po_VeBo0DWNjzDIeYfYrb4hajmGcXcdUD7gwQVVv9lRIpZiITEUS6XQU_LWFFnSIZBwCUTJHHRKUCS9HOJYJDNQKE2RAijbkcs2ApefCs-XplxBJY5Mij1ZAlnyTFVO-DYs_P8c8kjy5oBLTEOVQ5KkCYphVBpAj7IG07K7Ztm3D7fZd0zRMy9XhAMTqGG3T6fX7tuk6vZ5hOWcdvqu1nbbrWOcfUQWmaw)

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

### Remaining

- [x] JWT Guard decorator
- [x] Token rotation on refresh
- [ ] Seeder for locations
- [ ] Swagger setup
- [x] `POST /auth/refresh` endpoint
- [x] `POST /auth/logout` endpoint

### Notes

```
Access Token:  JWT, stateless
Refresh Token: Opaque string, hashed in DB, 90-day expiry
```

---

## Phase 2: User Profile

> User identity and preferences system. Foundation for matching algorithm.

### Tasks

- [x] Profile schema 
- [ ] Profile CRUD endpoints
- [ ] Lifestyle preferences (enums)
- [ ] Image upload service
- [ ] Image compression
- [ ] NSFW filtering

## Phase 3: Listings

> Property listing system with geospatial search capability.

### Tasks

- [ ] Listing schema based on location
- [ ] Listing CRUD endpoints
- [ ] One listing per user constraint
- [ ] Max 10 images per listing
- [ ] Listing status (active/inactive/rented)

## Phase 4: Discovery & Matching

> Swipe-based discovery system with mutual matching.

### Tasks

- [ ] Location-based feed
- [ ] Cursor pagination
- [ ] Swipe actions (like/pass)
- [ ] Match on mutual like
- [ ] Preference filtering
- [ ] Exclude seen/blocked users

### Algorithm Phases

```
Phase 1: Proximity + basic filters
Phase 2: Lifestyle preference scoring
Phase 3: ML recommendations (future)
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

## Phase 6: Safety & Moderation

> User safety features and abuse prevention.

### Tasks

- [ ] Block user endpoint
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

> Location services for listings and discovery.

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
- [ ] Database migration strategy
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
