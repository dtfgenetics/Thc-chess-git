CREATE TABLE IF NOT EXISTS kkc_games (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(12) NOT NULL,
  host_token_hash CHAR(64) NOT NULL,
  white_token_hash CHAR(64) NULL,
  black_token_hash CHAR(64) NULL,
  white_name VARCHAR(24) NULL,
  black_name VARCHAR(24) NULL,
  pgn MEDIUMTEXT NOT NULL,
  fen VARCHAR(128) NOT NULL,
  turn ENUM('w', 'b') NOT NULL DEFAULT 'w',
  status ENUM('waiting', 'active', 'finished') NOT NULL DEFAULT 'waiting',
  winner ENUM('white', 'black', 'draw') NULL,
  end_reason ENUM('draw', 'checkmate', 'stalemate', 'repetition', 'insufficient', 'abandoned') NULL,
  move_number INT UNSIGNED NOT NULL DEFAULT 0,
  unlisted TINYINT(1) NOT NULL DEFAULT 0,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kkc_games_code (code),
  KEY idx_kkc_games_status_updated (status, updated_at),
  KEY idx_kkc_games_unlisted_status (unlisted, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kkc_players (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  display_name VARCHAR(24) NOT NULL,
  side ENUM('white', 'black', 'spectator') NOT NULL DEFAULT 'spectator',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kkc_players_game_token (game_id, token_hash),
  KEY idx_kkc_players_game_side (game_id, side),
  CONSTRAINT fk_kkc_players_game
    FOREIGN KEY (game_id) REFERENCES kkc_games(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kkc_moves (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id BIGINT UNSIGNED NOT NULL,
  move_number INT UNSIGNED NOT NULL,
  side ENUM('white', 'black') NOT NULL,
  from_square CHAR(2) NOT NULL,
  to_square CHAR(2) NOT NULL,
  promotion CHAR(1) NULL,
  san VARCHAR(32) NOT NULL,
  fen_after VARCHAR(128) NOT NULL,
  pgn_after MEDIUMTEXT NOT NULL,
  player_token_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kkc_moves_game_number (game_id, move_number),
  KEY idx_kkc_moves_game_created (game_id, created_at),
  CONSTRAINT fk_kkc_moves_game
    FOREIGN KEY (game_id) REFERENCES kkc_games(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kkc_chat (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id BIGINT UNSIGNED NOT NULL,
  player_token_hash CHAR(64) NOT NULL,
  player_name VARCHAR(24) NOT NULL,
  side ENUM('white', 'black', 'spectator') NOT NULL DEFAULT 'spectator',
  message VARCHAR(240) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_kkc_chat_game_id (game_id, id),
  CONSTRAINT fk_kkc_chat_game
    FOREIGN KEY (game_id) REFERENCES kkc_games(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kkc_archives (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(12) NOT NULL,
  pgn MEDIUMTEXT NOT NULL,
  fen VARCHAR(128) NOT NULL,
  winner ENUM('white', 'black', 'draw') NULL,
  end_reason ENUM('draw', 'checkmate', 'stalemate', 'repetition', 'insufficient', 'abandoned') NULL,
  archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_kkc_archives_game (game_id),
  KEY idx_kkc_archives_code (code),
  CONSTRAINT fk_kkc_archives_game
    FOREIGN KEY (game_id) REFERENCES kkc_games(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
