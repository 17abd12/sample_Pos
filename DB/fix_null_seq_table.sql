-- Update all NULL seq_no values to '1'
UPDATE "public"."orders"
SET seq_no = '1'
WHERE seq_no IS NULL;

-- Update all NULL table_no values to 0
UPDATE "public"."orders"
SET table_no = 0
WHERE table_no IS NULL;

-- Verify the changes
SELECT id, seq_no, table_no, added_at
FROM "public"."orders"
WHERE seq_no = '1' OR table_no = 0
ORDER BY added_at DESC;
