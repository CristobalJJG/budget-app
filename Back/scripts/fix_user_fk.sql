-- fix_user_fk.sql
-- Script seguro para añadir user_id a categories y transactions, asignar usuario existente y crear FK
-- EJECUTAR SOLO UNA VEZ y revisar antes de aplicar.

-- 1) Añadir columna user_id como NULL para evitar errores en tablas con filas existentes
ALTER TABLE categories ADD COLUMN user_id INT NULL;
ALTER TABLE transactions ADD COLUMN user_id INT NULL;
-- Añadir columna color a categories (nullable por ahora)
ALTER TABLE categories ADD COLUMN color VARCHAR(7) NULL DEFAULT '#cccccc';

-- 2) Si no existe ningún usuario, crea uno temporal (recomendado usar el endpoint /api/auth/register en su lugar).
-- Si prefieres crear un usuario desde SQL, primero genera un hash bcrypt (ver instrucciones) y luego descomenta e inserta:
-- INSERT INTO users (username, email, password, createdAt, updatedAt) VALUES ('seeduser','seed@example.com','<BCRYPT_HASH>', NOW(), NOW());

-- 3) Asignar user_id a filas existentes usando el primer usuario disponible (ajusta si necesitas otro id)
-- Este UPDATE asigna todas las categorías/transacciones al primer usuario encontrado.
UPDATE categories SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
UPDATE transactions SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- 4) (Opcional) Verificar filas sin user_id
SELECT COUNT(*) AS categories_without_user FROM categories WHERE user_id IS NULL;
SELECT COUNT(*) AS transactions_without_user FROM transactions WHERE user_id IS NULL;

-- 5) Hacer la columna NOT NULL solo si los contadores anteriores son 0
-- Si los contadores son 0, descomenta las siguientes líneas para forzar NOT NULL y añadir la FK
-- ALTER TABLE categories MODIFY COLUMN user_id INT NOT NULL;
-- ALTER TABLE transactions MODIFY COLUMN user_id INT NOT NULL;

-- 6) Crear las restricciones FK (descomenta después de asegurar NOT NULL o si quieres una FK que permita NULLs en filas existentes)
-- ALTER TABLE categories
--   ADD CONSTRAINT categories_user_id_foreign_idx
--   FOREIGN KEY (user_id) REFERENCES users(id)
--   ON DELETE CASCADE ON UPDATE CASCADE;

-- ALTER TABLE transactions
--   ADD CONSTRAINT transactions_user_id_foreign_idx
--   FOREIGN KEY (user_id) REFERENCES users(id)
--   ON DELETE CASCADE ON UPDATE CASCADE;

-- FIN del script. Revisa y ejecuta paso a paso en tu cliente MySQL/MariaDB.
