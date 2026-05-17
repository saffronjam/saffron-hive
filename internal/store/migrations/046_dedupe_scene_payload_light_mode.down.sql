-- No-op. The up migration removed a redundant `colorTemp` value that was
-- never the user's intent for that row; the original value is unrecoverable
-- and reinstating it would re-introduce the same ambiguity.
SELECT 1;
