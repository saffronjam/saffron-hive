-- Rotate the JWT signing secret on this deploy. The previous secret was
-- exposed by the operationName auth bypass in /graphql (Query.settings was
-- callable unauthenticated and returned every settings row, including
-- jwt.secret), so any token signed with it must be considered compromised.
--
-- Deleting the row makes auth.LoadOrInitSecret regenerate a fresh 32-byte
-- random secret on the next process start. Every active session is
-- invalidated as a side effect — every user is forced back through /login.
DELETE FROM settings WHERE key = 'jwt.secret';
