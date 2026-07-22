const pool = require("../../config/db");

async function getAllMahalleler() {
  const result = await pool.query(
    `
    SELECT id, ad, ilce, il, created_at, updated_at
    FROM mahalleler
    ORDER BY ad ASC
    `
  );
  return result.rows;
}

async function getMahalleById(id) {
  const result = await pool.query(
    `
    SELECT id, ad, ilce, il, created_at, updated_at
    FROM mahalleler
    WHERE id = $1
    `,
    [id]
  );
  return result.rows[0];
}

module.exports = {
  getAllMahalleler,
  getMahalleById,
};