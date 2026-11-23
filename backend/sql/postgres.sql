-- Run once as the database owner. This schema is private, outside the Data API.
CREATE SCHEMA IF NOT EXISTS brickwell;
REVOKE ALL ON SCHEMA brickwell FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS brickwell.records (
  collection TEXT NOT NULL,
  id INTEGER NOT NULL CHECK (id > 0),
  data JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  PRIMARY KEY (collection, id)
);
CREATE TABLE IF NOT EXISTS brickwell.sequences (
  collection TEXT PRIMARY KEY,
  value INTEGER NOT NULL CHECK (value > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS user_email ON brickwell.records ((data->>'email')) WHERE collection = 'usuarios';
CREATE UNIQUE INDEX IF NOT EXISTS session_token ON brickwell.records ((data->>'key')) WHERE collection = 'sesiones';
CREATE UNIQUE INDEX IF NOT EXISTS reserved_table ON brickwell.records ((data->>'mesa'), (data->>'fecha'))
  WHERE collection = 'reservas' AND data->>'estado' IN ('PENDIENTE', 'CONFIRMADA', 'ACTIVA');
CREATE UNIQUE INDEX IF NOT EXISTS customer_night ON brickwell.records ((data->>'cliente'), (data->>'fecha'))
  WHERE collection = 'reservas' AND data->>'estado' IN ('PENDIENTE', 'CONFIRMADA', 'ACTIVA');
CREATE UNIQUE INDEX IF NOT EXISTS event_ticket ON brickwell.records ((data->>'cliente'), (data->>'evento'))
  WHERE collection = 'entradas' AND data->>'estado' != 'CANCELADA';
ALTER TABLE brickwell.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE brickwell.sequences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA brickwell FROM PUBLIC, anon, authenticated;
-- Create brickwell_backend separately with a private random password, then grant:
GRANT USAGE ON SCHEMA brickwell TO brickwell_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA brickwell TO brickwell_backend;
DROP POLICY IF EXISTS backend_records ON brickwell.records;
CREATE POLICY backend_records ON brickwell.records TO brickwell_backend USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS backend_sequences ON brickwell.sequences;
CREATE POLICY backend_sequences ON brickwell.sequences TO brickwell_backend USING (true) WITH CHECK (true);
