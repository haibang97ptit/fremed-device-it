ALTER TABLE quy_trinh ALTER COLUMN file_type TYPE VARCHAR(500);

UPDATE users SET password = '$2a$12$5AzeeoJLEFUr/8axd40//.Vf9jlknP1omXt8xCOoRkoL2PSavNy/q' WHERE username = 'admin';