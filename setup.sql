DROP DATABASE IF EXISTS skinfolio;
CREATE DATABASE IF NOT EXISTS skinfolio; 
USE skinfolio; 

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user'
); 

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS conditions(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS skins (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL, 
    category_id INT NOT NULL,
    condition_id INT NOT NULL, 
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2), 
    image_url VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE
);

INSERT INTO users(username, password, role) VALUES
('Admin', 'secret', 'admin'),
('testUser', 'notAsSecret', 'user');

INSERT INTO categories (name) VALUES 
('Sniper'),
('Rifle'),
('Pistol');

INSERT INTO conditions(name) VALUES 
('Factory New'),
('Minimal Wear'),
('Field-Tested'),
('Well-Worn'),
('Battle-Scarred');

INSERT INTO skins(user_id, category_id, condition_id, name, price) VALUES 
(1, 1, 1, 'AWP | Dragon Lore', 15000.00),
(1, 2, 3, 'AK-47 | Redline', 250.00),
(2, 2, 2, 'M4A4 | Howl', 8500.00);

