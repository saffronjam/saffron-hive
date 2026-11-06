CREATE TABLE audit_watermark (id INTEGER PRIMARY KEY CHECK(id=1), sequence INTEGER NOT NULL);
INSERT INTO audit_watermark(id,sequence) SELECT 1,COALESCE(MAX(sequence),0) FROM audit_events;
CREATE TRIGGER audit_watermark_advance AFTER INSERT ON audit_events BEGIN
 UPDATE audit_watermark SET sequence=NEW.sequence WHERE id=1;
END;
