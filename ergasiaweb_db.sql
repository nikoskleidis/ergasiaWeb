--
-- Database: `ergasiaweb_db`
--

DROP DATABASE IF EXISTS ergasiaweb_db;
CREATE SCHEMA IF NOT EXISTS `ergasiaweb_db` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `ergasiaweb_db`;



--
-- Table structure for table `categories`
--

CREATE TABLE IF NOT EXISTS `categories` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(60) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


INSERT INTO `categories` (id, title) VALUES
(1, 'Δημόσια Wi-Fi'),
(2, 'Δημόσια κτίρια'),
(3, 'Αρχαία Μνημεία'),
(4, 'Παραλίες');


--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(80) NOT NULL,
  `password` varchar(32) NOT NULL,
   public_token VARCHAR(40) NOT NULL,
   private_token VARCHAR(40) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `gender` TINYINT(1) COMMENT '1 man, 2 woman',
  `birth_date` date,
  `last_visit` TIMESTAMP NULL,
  `creation_date` TIMESTAMP NULL,
  `update_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `enabled` BOOLEAN NOT NULL DEFAULT '1' COMMENT '0 disabled, 1 enabled',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email_users` (`email`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;



--
-- Table structure for table `places`
--

CREATE TABLE IF NOT EXISTS `places` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `category_id` tinyint unsigned NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` TEXT,
  `lat` float(10,6) NOT NULL,
  `lng` float(10,6) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_category_places` 
		FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;




--
-- Table structure for table `reviews`
--

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int UNSIGNED AUTO_INCREMENT,
  `place_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `overall` tinyint(1) unsigned NOT NULL,
  `quality` tinyint(1) unsigned NOT NULL,
  `price` tinyint(1) unsigned NOT NULL,
  `availability` tinyint(1) unsigned NOT NULL,
  `comment` varchar(500),
  `review_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_place_reviews` 
		FOREIGN KEY (`place_id`) REFERENCES `places` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_user_reviews` 
		FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;
