INSERT INTO categories (name) VALUES ('Sueldo');
INSERT INTO categories (name) VALUES ('Mensualidad');
INSERT INTO categories (name) VALUES ('Compras');
INSERT INTO categories (name) VALUES ('Comida');
INSERT INTO categories (name) VALUES ('Juegos');
INSERT INTO categories (name) VALUES ('Ser sociable');
INSERT INTO categories (name) VALUES ('Coche/Gasolina');
INSERT INTO categories (name) VALUES ('Casa');
INSERT INTO categories (name) VALUES ('Gimnasio');
INSERT INTO categories (name) VALUES ('Bizums');
SELECT * from categories;


insert into transactions (date, name, amount, category_id, description) values ('2025-11-01', 'Sueldo', 1520,  1,   NULL);
insert into transactions (date, name, amount, category_id, description) values ('2025-11-01', 'Juego VR', -12,  5,   NULL);
insert into transactions (date, name, amount, category_id, description) values ('2025-11-01', 'Beber con Jose 1', -5.2,  6,   NULL);
insert into transactions (date, name, amount, category_id, description) values ('2025-11-01', 'Beber con Jose 2', -5.2,  6,   NULL);
select * from transactions where category_id is null;


SHOW COLUMNS FROM users;
SELECT id, username, email, createdAt, updatedAt FROM users;
SHOW COLUMNS FROM categories;
SELECT id, name, user_id FROM categories LIMIT 100;
SHOW COLUMNS FROM transactions;
SELECT id, name, user_id FROM transactions LIMIT 100;

select * from users;

