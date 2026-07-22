const bcrypt = require("bcrypt");
const pool = require("../../config/db");
const { normalizePhone } = require("../../utils/phone");

async function getMe(cavusId) {
  const result = await pool.query(
    `
    SELECT
      c.id,
      c.ad_soyad,
      c.telefon,
      c.mahalle_id,
      m.ad AS mahalle_ad,
      m.ilce,
      m.il,
      c.aktif_mi,
      c.created_at,
      c.updated_at
    FROM cavuslar c
    JOIN mahalleler m ON m.id = c.mahalle_id
    WHERE c.id = $1
    `,
    [cavusId]
  );

  return result.rows[0];
}

async function getMyKonteynerler(cavusId) {
  const result = await pool.query(
    `
    SELECT
      k.id,
      k.konteyner_kodu,
      k.tur,
      k.mahalle_id,
      m.ad AS mahalle_ad,
      k.cavus_id,
      k.latitude,
      k.longitude,
      k.aktif_mi,
      k.created_at,
      k.updated_at,
      (SELECT MAX(tarih_saat) FROM toplama_kayitlari tk WHERE tk.konteyner_id = k.id AND tk.durum = 'toplandi') as son_toplanma_tarihi
    FROM konteynerler k
    JOIN mahalleler m ON m.id = k.mahalle_id
    WHERE k.cavus_id = $1
    ORDER BY k.id ASC
    `,
    [cavusId]
  );

  return result.rows;
}

async function createKonteyner(cavusId, cavusMahalleId, data) {
  const { konteyner_kodu, tur, latitude, longitude } = data;

  const result = await pool.query(
    `
    INSERT INTO konteynerler
      (konteyner_kodu, tur, mahalle_id, cavus_id, latitude, longitude, aktif_mi)
    VALUES
      ($1, $2, $3, $4, $5, $6, true)
    RETURNING
      id,
      konteyner_kodu,
      tur,
      mahalle_id,
      cavus_id,
      latitude,
      longitude,
      aktif_mi,
      created_at,
      updated_at
    `,
    [konteyner_kodu, tur, cavusMahalleId, cavusId, latitude, longitude]
  );

  return result.rows[0];
}

async function passiveKonteyner(cavusId, konteynerId) {
  const result = await pool.query(
    `
    UPDATE konteynerler
    SET aktif_mi = false
    WHERE id = $1
      AND cavus_id = $2
    RETURNING
      id,
      konteyner_kodu,
      tur,
      mahalle_id,
      cavus_id,
      latitude,
      longitude,
      aktif_mi,
      updated_at
    `,
    [konteynerId, cavusId]
  );

  return result.rows[0];
}

async function getMyAraclar(cavusId) {
  const result = await pool.query(
    `
    SELECT
      id,
      plaka,
      arac_turu,
      cavus_id,
      aktif_mi,
      created_at,
      updated_at
    FROM araclar
    WHERE cavus_id = $1
    ORDER BY id ASC
    `,
    [cavusId]
  );

  return result.rows;
}

async function createArac(cavusId, data) {
  const { plaka, arac_turu } = data;

  const result = await pool.query(
    `
    INSERT INTO araclar
      (plaka, arac_turu, cavus_id, aktif_mi)
    VALUES
      ($1, $2, $3, true)
    RETURNING
      id,
      plaka,
      arac_turu,
      cavus_id,
      aktif_mi,
      created_at,
      updated_at
    `,
    [plaka, arac_turu, cavusId]
  );

  return result.rows[0];
}

async function passiveArac(cavusId, aracId) {
  const result = await pool.query(
    `
    UPDATE araclar
    SET aktif_mi = false
    WHERE id = $1
      AND cavus_id = $2
    RETURNING
      id,
      plaka,
      arac_turu,
      cavus_id,
      aktif_mi,
      updated_at
    `,
    [aracId, cavusId]
  );

  return result.rows[0];
}

async function getMySoforler(cavusId) {
  const result = await pool.query(
    `
    SELECT
      s.id,
      s.ad,
      s.soyad,
      s.telefon,
      s.arac_id,
      a.plaka,
      a.arac_turu,
      s.cavus_id,
      s.aktif_mi,
      s.created_at,
      s.updated_at
    FROM soforler s
    LEFT JOIN araclar a ON a.id = s.arac_id
    WHERE s.cavus_id = $1
    ORDER BY s.id ASC
    `,
    [cavusId]
  );

  return result.rows;
}

async function createSofor(cavusId, data) {
  const { ad, soyad, telefon, sifre, arac_id } = data;

  const normalizedPhone = normalizePhone(telefon);
  const hashedPassword = await bcrypt.hash(sifre, 12);

  const aracResult = await pool.query(
    `
    SELECT id, cavus_id, aktif_mi
    FROM araclar
    WHERE id = $1
      AND cavus_id = $2
      AND aktif_mi = true
    `,
    [arac_id, cavusId]
  );

  if (aracResult.rows.length === 0) {
    const error = new Error("Araç bulunamadı veya bu çavuşa ait değil.");
    error.statusCode = 400;
    throw error;
  }

  const result = await pool.query(
    `
    INSERT INTO soforler
      (ad, soyad, telefon, sifre, arac_id, cavus_id, aktif_mi)
    VALUES
      ($1, $2, $3, $4, $5, $6, true)
    RETURNING
      id,
      ad,
      soyad,
      telefon,
      arac_id,
      cavus_id,
      aktif_mi,
      created_at,
      updated_at
    `,
    [ad, soyad, normalizedPhone, hashedPassword, arac_id, cavusId]
  );

  return result.rows[0];
}

async function passiveSofor(cavusId, soforId) {
  const result = await pool.query(
    `
    UPDATE soforler
    SET aktif_mi = false
    WHERE id = $1
      AND cavus_id = $2
    RETURNING
      id,
      ad,
      soyad,
      telefon,
      arac_id,
      cavus_id,
      aktif_mi,
      updated_at
    `,
    [soforId, cavusId]
  );

  return result.rows[0];
}

async function getMyToplamaKayitlari(cavusId) {
  const result = await pool.query(
    `
    SELECT
      tk.id,
      tk.konteyner_id,
      k.konteyner_kodu,
      k.tur AS konteyner_tur,
      tk.sofor_id,
      CONCAT(s.ad, ' ', s.soyad) AS sofor_ad_soyad,
      tk.durum,
      tk.sebep,
      tk.diger_aciklama,
      tk.tarih_saat
    FROM toplama_kayitlari tk
    JOIN konteynerler k ON k.id = tk.konteyner_id
    LEFT JOIN soforler s ON s.id = tk.sofor_id
    WHERE k.cavus_id = $1
    ORDER BY tk.tarih_saat DESC
    `,
    [cavusId]
  );
  return result.rows;
}

async function updateArac(cavusId, aracId, data) {
  const { plaka, arac_turu } = data;
  const result = await pool.query(
    `
    UPDATE araclar
    SET plaka = COALESCE($1, plaka),
        arac_turu = COALESCE($2, arac_turu),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3 AND cavus_id = $4
    RETURNING id, plaka, arac_turu, cavus_id, aktif_mi, created_at, updated_at
    `,
    [plaka, arac_turu, aracId, cavusId]
  );
  return result.rows[0];
}

async function updateSoforArac(cavusId, soforId, aracId) {
  const result = await pool.query(
    `
    UPDATE soforler
    SET arac_id = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND cavus_id = $3
    RETURNING id, ad, soyad, telefon, arac_id, cavus_id, aktif_mi, updated_at
    `,
    [aracId, soforId, cavusId]
  );
  return result.rows[0];
}

module.exports = {
  getMe,
  getMyKonteynerler,
  createKonteyner,
  passiveKonteyner,
  getMyAraclar,
  createArac,
  updateArac,
  passiveArac,
  getMySoforler,
  createSofor,
  updateSoforArac,
  passiveSofor,
  getMyToplamaKayitlari,
};