# CM3070 Final Project — Preliminary Report
## ContextID: A Context-Aware Digital Identity Management System

**Student:** Zhe Wang  
**Date:** June 2026     
**Template:** CM3035 AdvancedWeb Design: Identity and profile management API

---

# Chapter 1: Introduction

## 1.1 Motivation and Problem Statement

People have different roles in life. Someone can be a software engineer, musician, soccer dad, and university graduate at the same time. In real life, people naturally show different sides of themselves depending on the situation. Online, however, most platforms combine everything into one profile. LinkedIn mixes work history and education, Facebook combines friends and coworkers, and one email address connects many accounts.

This creates real problems. A person may want to share different information with different groups of people. For example, a conference attendee may want to exchange contact details without revealing a personal phone number. People with both Chinese and English names may find that a single “full name” field cannot represent them properly. Someone who shares contact information with a new acquaintance may later wish to limit or withdraw that access. These situations show that people often need more control over how they present themselves in different contexts.

These situations are common, not rare. They are a normal part of modern digital life. Current tools such as LinkedIn, virtual business cards, and personal profile pages only solve part of the problem and do not fully support managing multiple identities for different contexts.

## 1.2 Project Concept

**ContextID** is a web-based identity management platform that allows a single user account to hold multiple identity cards, each belonging to a distinct named context. A context is a label (Professional, Academic, Personal, or user-defined) that tags which social sphere an identity belongs to. Each identity card stores structured name fields (given name, family name, and optional additional given and secondary family names to accommodate international naming conventions), a display name, an optional contact email, an optional free-text description, an optional profile photograph, and a validity date range. The validity range allows identities to carry temporal meaning — an academic affiliation that ends upon graduation, a job title that changes when one moves company.

The central user action is sharing. The owner generates a unique URL for any identity card, optionally sets an expiry date, and sends the link to the recipient. The recipient follows the URL and views the identity card in a clean, unbranded public page — no account required. The owner can revoke the link at any time from a dashboard of active and historical shares. This gives the owner granular, recoverable control over every disclosure they make.

The system is designed for non-technical users. Identity creation is a guided wizard (context → names → photo). Sharing requires one button click and one copy-paste. Authentication is passwordless, using Google OAuth, GitHub OAuth, or email magic links.

## 1.3 Project Template

This project follows the web application development approach. The main output is a working prototype. The project includes requirements analysis, system and database design, full-stack development, CI/CD deployment, and user testing. It does not focus on surveys, primary data collection, or literature reviews.

## 1.4 Technical Approach

The system is built as a TypeScript monorepo using Turborepo and pnpm. It includes a Next.js frontend, a Fastify REST API backend, and a shared PostgreSQL database managed by Prisma. Profile photos are stored in Amazon S3 and delivered through CloudFront. User authentication is handled by Auth.js v5. CI/CD is automated with GitHub Actions, and the application is deployed to AWS using ECS Fargate, Amplify, and Amazon RDS. Secrets are stored in AWS Parameter Store, and GitHub OIDC is used for secure AWS access.

## 1.5 Target Users

ContextID is designed for professionals, academics, multilingual users, privacy-conscious individuals, and people who often share contact information. These users need different identities for different situations and want more control over their personal information. The main idea is simple: users decide what information to share, who can see it, and how long it remains available.

---

# Chapter 2: Literature Review

## 2.1 Personal Names Are More Complex Than They Look

Most software stores a name as two fields — first name and last name. In practice, names are far more varied than this. The W3C Internationalization Working Group documents how personal name structures differ across cultures. In many East Asian countries including China, Japan, and Korea, the family name is written before the given name — the opposite order to the Western convention. Spanish and Portuguese names traditionally include two family names, one from each parent. Arabic names can form a chain linking generations. Some cultures use only a single name with no family name component at all. Getting the order and structure wrong is not just a formatting issue; it can cause real problems in administrative and legal contexts.

Beyond structure, names shift depending on situation. In some cultures, the name printed on a birth certificate is used only in formal settings and not in daily conversation. Many people receive religious names at ceremonies such as baptism or confirmation, used only in that context. A stage name or pen name may be completely different from a legal name. Someone who has married may keep their previous surname professionally while using their new legal name elsewhere. People who have changed their name — for any reason — may continue to be known by an older name in some circles. The name that is correct in one situation is simply wrong in another.

A good identity system should store different versions of a person’s name separately and show the right one for each situation. ContextID supports this by storing different name parts and a display name in each context. This allows users to present the most appropriate name for different audiences.

## 2.2 Managing Multiple Online Identities

Most people already have several online identities. For example, they may use LinkedIn for work, GitHub for coding, social media for friends, and other accounts for hobbies. Each account contains different information for different audiences.

The problem is that these accounts are separate and difficult to manage together. When sharing information, people often have to send a full profile or type everything manually. They cannot easily share only the information they want others to see, and they cannot take back access later.


## 2.3 REST APIs for Identity Management

REST is a common way to build web APIs using HTTP. Each resource has its own URL, and HTTP methods such as GET, POST, PATCH, and DELETE describe the action being performed. Each request contains the information needed to process it, making the API simple and predictable.

This fits an identity system well. Identities, contexts, and shares can each be treated as resources with their own URLs. Viewing a shared identity uses a public GET request. Creating or deleting a share requires authentication. The URL and HTTP method clearly show what action is being performed and make access control easier to manage.

HTTP also supports content negotiation through request headers. For example, the Accept-Language header lets clients specify a preferred language. An identity system can use this information to return names in different languages or writing systems when needed.

## 2.4 Web API Security

A web API that stores personal data needs to be careful about who can read or change what. ContextID handles this in four ways.

**Ownership checks on every write.** When a user tries to update, delete, or share an identity, the API first looks up that identity in the database and checks whether its `userId` matches the session's `userId`. If they don't match, the request is rejected with a 403 error. This check happens at the database level on every protected route, not just in the UI, so it cannot be bypassed by calling the API directly.

**Unpredictable share tokens.** Share links use a random token generated with Node.js's `randomBytes(9).toString('base64url')`, which gives 72 bits of randomness. This means an attacker cannot guess or enumerate valid tokens — the space of possible values is too large. The token is the only thing needed to view a shared identity, so it must be hard to guess.

**Session validation on protected routes.** All routes that read or modify user data require a valid session token sent as a Bearer header. The Fastify `authenticate` plugin looks up the token in the `Session` table on every request. If no valid session is found, the request is rejected with 401. Public routes — like viewing a share page — bypass this check entirely, since they are meant to be accessible without an account.

**File upload validation.** When a user uploads a profile photo, the API checks the MIME type against an allowlist (`image/jpeg`, `image/png`, `image/webp`) and rejects files larger than 2 MB. This prevents users from uploading arbitrary files to the S3 bucket.

## 2.5 Authentication and User Management

ContextID supports three ways to sign in: Google, GitHub, and email magic link. None of them use a password.

With Google or GitHub, the user clicks a button and is redirected to the provider's own login page. They authenticate there — using whatever method Google or GitHub requires — and are then sent back to ContextID with a confirmation that the login succeeded. ContextID never sees the user's password. It only receives a short-lived code from the provider, which it exchanges server-side for a session. This is handled by Auth.js v5 using the OAuth authorisation code flow.

With email magic link, the user enters their email address and receives a one-time login link via Resend. Clicking the link creates a session and logs them in. The link expires after a short window and can only be used once. Like OAuth, this approach stores no password anywhere in the system.

In both cases, Auth.js creates a session record in the database using the Prisma adapter. The session token is sent to the browser as a cookie and is checked on every request that requires authentication. Sessions expire after five minutes of inactivity, extended automatically whenever the user makes a request. This short window limits the damage if a session cookie is somehow stolen.

The database schema also includes an `Authenticator` table, which is the Auth.js table for WebAuthn (passkey) support. This means the system is already structured to support passkey login — Face ID, Touch ID, or a hardware key — without any schema changes. This is not enabled in the current prototype but is a straightforward addition for a future release.

## 2.6 Existing Tools and the Gap

Several tools already exist in the identity-sharing space, but none of them fully solve the problem:

| Tool | Multiple contexts | Access control | Link revocation | No recipient account needed | Structured name fields |
|---|:---:|:---:|:---:|:---:|:---:|
| LinkedIn | No | Coarse | No | No | No |
| HiHello / Blinq | Partial | No | No | Yes | No |
| About.me / Linktree | No | No | No | Yes | No |
| **ContextID** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** |

LinkedIn is built for professional identity only and has no mechanism to show a different profile to different people. Virtual business card apps (HiHello, Blinq) allow sharing but support only a single card and no revocation. ContextID fills the gap: multiple context-labelled identity cards per user, shared via URLs with access control and revocation, using standard web technology with no special software required.

## 2.7 Summary

Names are varied, context-dependent, and culturally complex. People already manage multiple online identities across platforms that were not designed to work together. Privacy law and good API design both point toward the same principle: share only what is needed, with only the parties who need it, and make it possible to withdraw access later. REST is a well-established pattern for building such a system, and standard authentication schemes (OAuth, magic links) can secure it without burdening users with passwords. No existing tool combines all of these requirements in a form accessible to ordinary users. ContextID is designed to address that gap.

---

# Chapter 3: Design

## 3.1 Requirements

### Functional Requirements

| ID | Requirement |
|---|---|
| FR1 | A user can register and sign in using Google OAuth, GitHub OAuth, or email magic link |
| FR2 | A user can create an identity card assigned to a named context |
| FR3 | System-provided contexts (Professional, Academic, Personal, Social, Family) are pre-seeded and available to all users |
| FR4 | A user can create custom contexts in addition to system contexts |
| FR5 | Each identity stores given name, family name, optional additional given name, optional secondary family name, display name, optional email, optional description, and a validity date range (`validFrom`, optional `validTo`) |
| FR6 | A user can upload a profile photograph per identity; a deterministic placeholder illustration is used when no photo has been uploaded |
| FR7 | A user can generate a unique share link for any identity, with an optional expiry date |
| FR8 | A share link is revocable by the owner at any time |
| FR9 | An expired or revoked share link returns an appropriate error to the viewer |
| FR10 | The public share page is accessible without authentication |
| FR11 | A user can update any field of an existing identity |
| FR12 | A user can delete an identity and all its associated shares |

### Non-Functional Requirements

**Security:** All operations on protected resources require a valid authenticated session. No user can access, modify, or share another user's identity (IDOR protection). Share tokens must provide sufficient entropy to resist enumeration attacks. Uploaded images must be validated for MIME type and size before storage.

**Performance:** Authenticated dashboard and public share pages are server-rendered, targeting a time-to-first-contentful-paint under one second on a broadband connection.

**Internationalisation:** Name fields must accommodate non-Latin naming structures including compound family names and multiple given names common in East Asian, Hispanic, and Arabic naming traditions.

**Accessibility:** All pages target WCAG 2.1 Level AA compliance, verified by automated and manual review.

## 3.2 System Architecture

ContextID is structured as a pnpm monorepo managed by Turborepo:

```
CM3070-FINAL-PROJECT/
├── apps/
│   ├── web/          Next.js 16 (App Router) — port 3000
│   └── api/          Fastify v5 REST API — port 4000
└── packages/
    └── database/     Prisma schema, migrations, seed, shared Prisma client
```

The Next.js frontend and Fastify API are deliberately separated. Server components within the frontend read from the database directly via the shared Prisma client on the read path, avoiding an unnecessary API round-trip for authenticated page renders. Client-side mutations (create, update, delete, share management) are routed through a catch-all proxy route handler in Next.js (`/api/proxy/[...path]`) that forwards requests to the Fastify API, attaching the Auth.js session token as a Bearer header. The API validates this token against the session table before executing any mutation.

This separation provides several benefits: the API enforces authentication and business logic independently of the frontend; the REST interface is consumable by future clients (a mobile application, a third-party integration) without changes to the frontend; and deployment of the two applications can be managed independently.

The request flow for a write operation (e.g. creating an identity) is: browser → Next.js proxy route handler (`/api/proxy/identities`) → Fastify API (`POST /identities`). The proxy handler retrieves the Auth.js session server-side, attaches the session token as a `Bearer` header, and forwards the request body unchanged. The Fastify `authenticate` plugin resolves the session token against the `Session` table, populates `request.userId`, and any route handler can then compare `request.userId` against the record's `userId` for ownership verification. The public share page follows a different path: the Next.js server component calls the Fastify API directly from the server (not via the browser), bypassing the session mechanism entirely.

Session management is handled by Auth.js v5 with the Prisma adapter, which persists session tokens, OAuth account links, and verification tokens to the same PostgreSQL database, enabling transactional reads that join session state with user data.

## 3.3 Data Model

The domain schema comprises five tables:

- **User** — account record (email, optional name, optional image), managed by Auth.js
- **IdentityContext** — named context, nullable `userId` (null for system contexts, set for user-defined contexts). A unique constraint on `(userId, name)` prevents duplicate custom context names per user
- **Identity** — the identity card (all name fields, image URL, email, description, `validFrom`, nullable `validTo`). A unique constraint on `(userId, contextId)` enforces one identity per context per user. Cascading delete removes all shares when an identity is deleted
- **IdentityShare** — share record (`token` unique, `identityId`, nullable `expiresAt`, nullable `revokedAt`). Soft-deletion via `revokedAt` preserves audit history and enables the distinguishable 410 Gone response
- **Account / Session / Authenticator / VerificationToken** — Auth.js adapter tables

The separation of `IdentityContext` from `Identity` allows context metadata to be managed independently and permits system contexts to be updated once without touching every identity row.

## 3.4 Key Design Decisions

**Separation of read and write paths.** The decision to use Prisma directly in server components for reads, while routing writes through the API, trades a small architectural asymmetry for meaningful practical benefits: read-heavy operations (loading the identity dashboard) are fast and do not require serialisation overhead; write operations carry authentication validation and business logic in a single, testable layer.

**Soft deletion of shares.** Deleting a revoked share record would cause the share URL to return 404 Not Found, which is indistinguishable from a typo or non-existent link. Returning 410 Gone communicates deliberate withdrawal of access — an important semantic distinction both for the recipient's experience and for the owner's audit trail.

**One identity per context per user.** This database-level constraint enforces intentionality. A user cannot accumulate multiple "Professional" identities by accident; if they want to change their professional identity, they must update the existing one. This matches the mental model of identity management as a deliberate curation activity rather than an additive collection.

**Validity period as a first-class attribute.** Including `validFrom` and `validTo` dates on the identity record, rather than treating them as optional metadata, reflects the insight that professional and academic affiliations are inherently time-bounded. A university affiliation ends at graduation; a job title changes when one moves company. Without explicit validity dates, a recipient who receives a shared identity link may view a card that has become factually incorrect. By making validity a structural constraint — visible on the card and enforceable in future application logic — ContextID treats identity as a temporally situated claim rather than a permanent assertion, which aligns with the ISO/IEC 24760-1 (2019) attribute model.

**Deterministic placeholder avatars.** Rather than a default grey silhouette, each identity without a photo receives one of six stylised avatar illustrations, selected deterministically by hashing the identity ID. This means the placeholder is stable across sessions and page refreshes, giving the dashboard a more polished appearance without requiring the user to upload a photo.

## 3.5 CI/CD and Deployment

The project uses GitHub Actions for both continuous integration and continuous deployment. Two workflows are defined:

**CI workflow** (triggers on every pull request and push to `main`): runs `pnpm lint`, `pnpm check-types`, Vitest unit tests, and a Turborepo build verification across all workspaces.

**CD workflow** (triggers on push to `main` only): authenticates to AWS using GitHub OIDC federation (no long-lived credentials stored in the repository), builds a Docker image for the Fastify API and pushes it to Amazon ECR, deploys the new image to ECS Fargate, triggers an AWS Amplify build for the Next.js frontend, and runs `prisma migrate deploy` against the production RDS PostgreSQL instance via a one-off ECS task in the same VPC. Environment variables and secrets (database URL, OAuth client IDs and secrets, S3 bucket name, Resend API key) are stored in AWS SSM Parameter Store and injected at task startup.

## 3.6 Work Plan

| Phase | Tasks | Weeks |
|---|---|---|
| Research & Design | Literature review, requirements, wireframes | 1–4 |
| First Prototype | Auth, identity CRUD, sharing, S3 upload | 5–7 |
| Core Development | Card enhancements, sharing UX, mobile polish, validation, security hardening | 8–13 |
| CI/CD & Infrastructure | GitHub Actions CI, AWS infrastructure, CD pipeline, secrets management | 11–15 |
| Testing & Evaluation | Unit tests, integration tests, usability study (5–8 participants), accessibility audit | 14–19 |
| Documentation & Submission | Final report, prototype video, code cleanup | 19–22 |

| Milestone | Target Week |
|---|---|
| Requirements finalised | Week 4 |
| First prototype complete | Week 7 ✓ |
| Feature-complete build | Week 13 |
| CI/CD live | Week 15 |
| Evaluation complete | Week 19 |
| Final submission | Week 22 |

The first prototype (Weeks 5–7) is complete. CI/CD infrastructure is in progress. The project is on schedule to reach feature-completion by Week 13 and complete evaluation by Week 19.

---

# Chapter 4: Feature Prototype

## 4.1 Overview

The current prototype implements the complete core feature set: multi-provider authentication, identity CRUD with user- and system-defined contexts, S3-backed profile photo upload, and the full share link lifecycle (creation, public access, optional expiry, and owner-initiated revocation). A companion MP4 video demonstrates all features end-to-end.

This chapter focuses on the two most technically significant features: the **token-based identity sharing system** and the **multi-step identity creation wizard**, which together constitute the primary value proposition and the primary user interaction path.

## 4.2 Implementation: Share Token System

When an authenticated user requests a share link for one of their identities, the API executes three steps. First, ownership is verified: the identity's `userId` is fetched from the database and compared to the session's `userId`; mismatches return 403 Forbidden, preventing IDOR attacks. Second, a token is generated using Node.js's `randomBytes(9).toString('base64url')`, producing a 12-character URL-safe string. Nine bytes of cryptographic random data provide 72 bits of entropy, exceeding OWASP's recommended minimum of 64 bits for unpredictable tokens. Third, an `IdentityShare` record is created with the token, the identity ID, and an optional `expiresAt` timestamp.

The public endpoint `GET /shares/:token` evaluates three conditions before returning data: the token must exist, `revokedAt` must be null, and if `expiresAt` is non-null it must be in the future. A revoked share returns HTTP 410 Gone; an expired share also returns 410. These semantically distinct responses from 404 communicate to the recipient that access was deliberately withdrawn rather than that the URL was incorrect. Only the fields of the specific identity card are returned; no user account data or other identities are exposed.

Revocation sets `revokedAt` to the current timestamp rather than deleting the record. This preserves the owner's audit history on the shares dashboard, showing when each link was created, whether it is active, expired, or revoked, and the full share URL in a struck-through monospace style for reference.

## 4.3 Implementation: Identity Creation Wizard

The creation wizard is a client-rendered multiple-step modal dialog. **Step 1** presents available contexts as a selection grid of cards, with system contexts (Professional, Academic, Personal, etc.) shown first, followed by any user-created contexts, and a "New context" option that reveals a text input when selected. The "Next" button is disabled until a valid selection is made. **Step 2** presents name fields: given name and family name are required; additional given name and secondary family name are optional. The display name field is auto-populated from the given and family name concatenation until the user manually edits it, at which point auto-fill is suppressed. Email and description fields are also present on this step. **Step 3** shows a live card preview using the current display name and either a selected photograph or the deterministic placeholder, alongside file upload controls and validity date inputs.

On submission, the wizard makes up to three sequential API calls: (1) creating a new context if the "New context" option was chosen, (2) creating the identity record, and (3) uploading the photograph as multipart form data if a file was selected. The API validates uploaded images against a MIME type allowlist (`image/jpeg`, `image/png`, `image/webp`) and a 2 MB size limit, returning 400 Bad Request with an error message for violations. Each stage can surface an error inline in the dialog without dismissing it, allowing the user to correct and retry without losing the data entered in earlier steps.

## 4.4 Evaluation

### Functional Correctness

All twelve functional requirements listed in Chapter 3 were verified by manual end-to-end testing during development. The share lifecycle was tested against all four token states — active, accessed-after-expiry, revoked, and non-existent — confirming HTTP 200, 410, 410, and 404 responses respectively.

### Security Analysis

Token entropy of 72 bits was verified analytically: `randomBytes(9)` produces 9 bytes of cryptographic randomness, and `base64url` encoding is a bijective transformation preserving entropy. At a generous bound of 10,000 API requests per second, exhausting the 2^72 token space would require approximately 1.49 × 10^13 years. In practice, rate limiting on the public endpoint will further reduce the feasible attack rate. The IDOR check is enforced at the database layer for every share creation and revocation request, not as a UI-level guard, ensuring it cannot be bypassed by direct API calls.

### Usability

The creation wizard is designed with usability in mind throughout. A step indicator shows which step the user is on and marks completed steps with a checkmark. The "Next" button stays disabled until all required fields on that step are filled, so the user cannot move forward with missing information. The submit button shows a loading state while the API calls are in progress. The wizard can be closed or navigated backwards at any step without saving any partial data.

The shares dashboard shows each link's status clearly — active, expired, or revoked — with the full URL visible for active links and shown struck-through for inactive ones. The revoke button only appears on active links.

A formal usability evaluation is planned later in the project. Five to eight participants will be asked to complete four tasks: sign up via magic link, create a Professional identity with a photo, share the identity and copy the link, and revoke the share. After completing the tasks, participants will answer a short questionnaire to rate how easy the system was to use. Think-aloud recordings will also be taken to identify any points of confusion. The results will be used to improve the interface before final submission.

### Limitations and Planned Improvements

1. **Client-side date validation** on Step 3 should enforce `validTo > validFrom` before submission, eliminating a preventable round-trip error (Heuristic 5).
2. **Photo upload decoupling** should allow the edit dialog to re-upload a photo independently of other identity fields, resolving the partial-failure error-recovery gap (Heuristic 3).
3. **Clipboard copy button** for the generated share URL would reduce the friction of the sharing flow; currently the user must manually select and copy the URL string.
4. **Rate limiting** on `GET /shares/:token` is not yet implemented. Even with 72-bit token entropy rendering exhaustion infeasible, per-IP rate limiting is a defence-in-depth measure required before production deployment.
5. **Expiry notification emails** would address the usability scenario where a user sets an expiry date and then forgets about it, resulting in a recipient receiving a 410 response without warning to the sender.

The prototype successfully demonstrates the technical feasibility of the core concept: a user can create a context-specific identity and share it via a controlled-access URL in under thirty seconds from first use. The token-based share system, IDOR protection, and expiry/revocation mechanics all function correctly. The identified usability issues are minor, concrete, and addressable within the remaining development timeline.

---

# References

- Wikipedia (2024). *Personal name*. Available at: https://en.wikipedia.org/wiki/Personal_name
- CM3035 Advanced Web Development. *Course materials on secure account management and REST API design*. University of London.
- MDN Web Docs (2024). *Content negotiation*. Mozilla. Available at: https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation
