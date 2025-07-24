export const gameSettlementsTable = `
  CREATE TABLE IF NOT EXISTS settlement (
    settlement_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    round_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    operator_id VARCHAR(255) NOT NULL,
    bet_amount DECIMAL(12, 2) NOT NULL,
    hand_dealt JSON NOT NULL,
    hand_rank VARCHAR(50) NOT NULL,
    win_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_round_id (round_id),
    INDEX idx_user_id (user_id)
  );
`;