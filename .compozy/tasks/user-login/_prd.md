# PRD: User Login (Sign In)

## Overview

Registered users of Clube do Pão currently have no way to authenticate — the system can create a user profile, but no credential exists for that user anywhere. This feature introduces login (sign in), letting a registered user prove their identity with an email and password and receive a token that authenticates their subsequent requests.

This is for all three user populations of the platform: end customers, bakery owners, and delivery couriers who pick up orders. It is the foundation that every authenticated feature in the product depends on, and it lays the groundwork for signing in with Google in a later phase.

## Goals

- Every registered user can authenticate with email and password and receive a valid session token.
- The login response identifies the user's role, so downstream features can grant the right access per persona (customer, bakery owner, courier).
- Registration is updated so new users leave the signup flow with a working credential — no user finishes signup unable to log in.
- Lay the groundwork so "Sign in with Google" can be added later without reworking the identity model.

## User Stories

- As a customer, I want to log in with my email and password so I can access my account, orders, and favorite bakeries.
- As a bakery owner, I want to log in so I can manage my bakery's information and incoming orders.
- As a delivery courier, I want to log in so I can see which orders I need to pick up.
- As a new user completing signup, I want to set a password so I can log in afterward.
- As any user, I want a clear, generic error message when my email or password is wrong, so I know to try again without being told which field was incorrect.

## Core Features

### Email + password login

Users authenticate with their email and password. On success, they receive a token that authenticates their subsequent requests. On failure, they receive a clear, generic error that does not reveal whether the email or the password was incorrect.

### Role identification on login

The login response identifies which type of user is authenticating — customer, bakery owner, or courier — so the client application can present the right experience and, in the future, gate access to role-specific features.

### Registration updated to require a password

Signup is extended so new users set a password as part of registration. This gives every new account a working credential from day one, since login cannot function for accounts without one.

### Google sign-in (Phase 2, not in this MVP)

Users will be able to sign in with their Google account as an alternative to email and password. This is explicitly out of scope for the MVP described here; it is called out because it shapes the identity approach chosen (see ADR-001).

## User Experience

- **One login screen for everyone.** Customers, bakery owners, and couriers use the same login form — there is no persona picker and no separate login pages (see ADR-002).
- **Primary flow:** user opens the login screen, enters email and password, submits, and is signed in immediately on success — no additional confirmation step.
- **Error flow:** invalid credentials show one generic message (e.g., "incorrect email or password") rather than indicating which field was wrong, to avoid revealing whether an email is registered.
- **Session persistence:** once logged in, the user should not need to log in again during normal day-to-day use. Session renewal happens transparently in the background; the user is only asked to log in again if the session has been inactive for an extended period.
- **New user path:** during registration, the user sets a password alongside their existing signup details, so they can log in right after creating their account.

## High-Level Technical Constraints

- Must integrate with the project's existing authentication provider (Supabase) rather than introducing a parallel identity system, per ADR-001.
- Must support all three existing user personas without requiring separate login surfaces, per ADR-002.
- Must not break the existing authenticated routes that already validate tokens issued by the current provider.

## Non-Goals (Out of Scope)

- **Password reset / "forgot password."** Not included in this delivery; users who forget their password have no self-service recovery yet.
- **Brute-force protection (account lockout, rate limiting).** Not addressed explicitly in this phase; relies on the identity provider's default protections.
- **Google sign-in.** Deferred to Phase 2 (see Phased Rollout Plan).
- **Persona-specific login screens or endpoints.** Explicitly rejected — see ADR-002.
- **Enforcing role-based permissions on other features.** This feature identifies and returns the role; deciding what each role can access elsewhere in the product is out of scope here.
- **Migrating or backfilling users who registered before this feature existed.** Addressed as an open question below, not solved in this PRD.
- **Giving bakery owners and couriers a way to obtain a login credential.** Their records are created through a separate process today with no self-registration step. Linking an existing bakery/courier record to a login credential is deferred; for this MVP, that linkage is assumed to happen out-of-band.

## Phased Rollout Plan

### MVP (Phase 1)

- Email + password login for all personas, returning an authentication token.
- Login response includes the user's role.
- Registration updated to require and set a password.
- Success criteria to proceed to Phase 2: registered users can reliably log in and reach authenticated parts of the product without support intervention.

### Phase 2

- Add "Sign in with Google" as an alternative login method, using the same underlying identity system.
- Success criteria to proceed to Phase 3: Google sign-in reaches parity with email/password in reliability.

### Phase 3

- Revisit deferred hardening: password reset, brute-force protection, and the backfill strategy for pre-existing users, based on real usage and support signals from Phases 1–2.

## Success Metrics

- Login success rate (successful logins ÷ total login attempts).
- Percentage of new signups that complete registration with a working credential (target: 100%).
- Volume of support requests related to "can't log in."
- Time from account creation to first successful login for new users.

## Risks and Mitigations

- **Existing users have no credential to log in with.** Since registration previously didn't collect a password, everyone registered before this feature ships is locked out until a credential exists for them. Mitigation: tracked explicitly as an open question below; must be resolved before rollout to production users.
- **Adoption friction from the new password requirement.** Users accustomed to a no-password signup may find the extra step unexpected. Mitigation: keep password requirements reasonable and clearly communicate the change at signup.
- **Role misidentification.** If a user's role is wrong or missing on login, they could be denied access to features they need. Mitigation: role must be explicitly verified as part of acceptance testing for each persona before rollout.

## Architecture Decision Records

- [ADR-001: Use Supabase Auth as the Identity Provider](adrs/adr-001.md) — Login and future Google sign-in build on Supabase Auth rather than a project-owned credentials table.
- [ADR-002: Single Unified Login Flow for All User Roles](adrs/adr-002.md) — One login flow serves customers, bakery owners, and couriers; no persona-specific screens or routes.

## Open Questions

- How should existing users who registered before this feature (and therefore have no password/credential) get access? Options include a forced "set your password" step on next contact, or an email-driven activation flow — needs a decision before this rolls out to real users.
- What are the minimum password requirements (length, complexity)? Not yet defined.
- What is the exact set and naming of roles (e.g., customer, bakery_owner, courier) and are there users who hold more than one role? Assumed to be one role per user for this PRD; needs confirmation.
