# TUTORERA Guardian Consent — Phase 5 rollout and safety checklist

## Scope and protection level

This release adds age declaration and supervised access for newly registered students. Students aged 13–17 are placed in a restricted state until an authenticated parent/guardian verifies control of a **separate** guardian mailbox via a one-time code. Students under 13 cannot self-register. Parent links, payment approval and spending limits are enforced server-side, and the consent can be revoked.

**This release is not an age-identity verification system or legal guardianship certification.** Dates of birth and adult relationships are self-declared. An email code verifies mailbox control, and parent login verifies account access. A legal and safeguarding review must decide whether stronger verification is necessary for each supported market.

## Production pre-release gates

- [ ] Merge the stacked Phase 4 dependencies in order, review changes in PR #41, and require both backend CI and Cloudflare frontend CI to pass on the actual release commit.
- [ ] Test local, Google, role-selection, pending-consent, approval, and revocation paths against staging. Test with different accounts and devices; do not email actual students.
- [ ] Confirm guardian consent email delivery, localization, security rate limits, backoff, support escalation and recovery for undeliverable email.
- [ ] Confirm no Socket.IO or public optional-auth bypass exists for a pending child.
- [ ] Confirm the parent booking approval setting cannot be disabled when linked minors are present; settlement webhooks must recheck guardian approvals and spending caps before finalizing a lesson.
- [ ] Decide market-specific laws and retention rules governing minors, guardian verification and communications. Have policy/counsel sign off.
- [ ] Review whether an authenticated parent's DOB attestation and email-code consent are sufficient; where not, hold the service behind a stronger verification process.
- [ ] Document how parents/guardians can deny or revoke consent, report an impersonator, recover lost email access, and request a secure DOB correction.
- [ ] Confirm that no under-13 signups can slip through any API/Google flow; provide a verified adult-managed workflow before accepting under-13 students.
- [ ] Run restoration and rollback tests; retain full evidence of access denials and consent events without logging the one-time code.

## Existing-user migration — **must happen before public enforcement claim**

Old accounts often lack `User.dateOfBirth`, and `isMinor` defaults to false. This PR deliberately does **not** silently convert existing users or invent birth dates.

1. Produce a read-only count of existing student accounts with missing DOB, inconsistent DOB in StudentProfile, or existing guardian links without verified consent. Preserve only the aggregates in the audit report.

   Run `npm run audit:student-age` from `tutorera-backend` using a read-only database account. The command produces aggregate counts only and refuses `--apply`. Never publish production student details or database credentials in CI logs.
2. Define an explicit re-verification journey for those accounts and age-specific treatment after approval by the privacy/safeguarding owner.
3. Migrate in reviewed batches, with a dry run and rollback snapshot. Do not classify unknown-age accounts as verified adults.
4. Verify that guardian links, booking policies and prior transactions are preserved, and ensure affected users receive proper messaging.
5. Monitor approvals, revocations, OTP lockouts, guardian-email failures and support escalations.

## Security behavior

- The student auth token remains valid while consent is pending, but `protect` rejects tutoring/payment/booking/chat routes and `optionalAuth` does not attach the student identity to public handlers.
- Socket.IO rejects new pending-child connections, checks status on joining a conversation, and typing events are emitted only from an already-authorized joined room.
- Parent removal of a verified minor is transactional with revoking the student's permission. Existing sockets are disconnected by the server after revocation.
- Guardian OTP is random, HMAC-hashed at rest, time-limited, has a resend cooldown and per-request verification-attempt ceiling, and is guarded by endpoint rate limiting.
- Guarded birth dates are not user-editable through profile onboarding. Corrections require a separate verified support workflow.
- Adults are allowed to register without guardian supervision, but a declared DOB alone is not independent proof of adulthood.

## Excluded from Phase 5

- Automatic import or silent reclassification of historical user accounts
- Under-13 adult-created child accounts
- Government ID / age-estimation verification or legal-custody validation
- Comprehensive chat safeguarding/content moderation for live tutor sessions
- Market-specific external review/legal certification

These remain launch dependencies where applicable, not features that this PR claims to implement.
