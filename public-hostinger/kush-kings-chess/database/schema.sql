CREATE TABLE IF NOT EXISTS kkc_games (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(12) NOT NULL UNIQUE,
  light_player_name VARCHAR(80) NULL,
  dark_player_name VARCHAR(80) NULL,
  current_fen TEXT NOT NULL,
  pgn MEDIUMTEXT NULL,
  move_json MEDIUMTEXT NULL,
  status ENUM('waiting','active','complete') NOT NULL DEFAULT 'waiting',
  winner ENUM('light','dark','draw') NULL,
  end_reason VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_room_code (room_code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kkc_players (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id INT UNSIGNED NOT NULL,
  player_token CHAR(64) NOT NULL,
  player_name VARCHAR(80) NOT NULL,
  side ENUM('light','dark','spectator') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_game_token (game_id, player_token),
  UNIQUE KEY uniq_game_side_token (game_id, side, player_token),
  INDEX idx_game_side (game_id, side),
  CONSTRAINT fk_kkc_players_game FOREIGN KEY (game_id) REFERENCES kkc_games(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kkc_moves (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id INT UNSIGNED NOT NULL,
  move_number INT UNSIGNED NOT NULL,
  side ENUM('light','dark') NOT NULL,
  from_square CHAR(2) NOT NULL,
  to_square CHAR(2) NOT NULL,
  promotion CHAR(1) NULL,
  fen_after TEXT NOT NULL,
  san VARCHAR(32) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_game_move_number (game_id, move_number),
  INDEX idx_game_created (game_id, created_at),
  CONSTRAINT fk_kkc_moves_game FOREIGN KEY (game_id) REFERENCES kkc_games(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kkc_chat (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id INT UNSIGNED NOT NULL,
  player_name VARCHAR(80) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_game_chat (game_id, created_at),
  CONSTRAINT fk_kkc_chat_game FOREIGN KEY (game_id) REFERENCES kkc_games(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kkc_archives (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  game_id INT UNSIGNED NOT NULL,
  room_code VARCHAR(12) NOT NULL,
  final_fen TEXT NOT NULL,
  final_pgn MEDIUMTEXT NULL,
  winner ENUM('light','dark','draw') NULL,
  end_reason VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_archive_game (game_id),
  INDEX idx_room_code (room_code),
  CONSTRAINT fk_kkc_archives_game FOREIGN KEY (game_id) REFERENCES kkc_games(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
