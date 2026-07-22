const pool = require("../../config/db");

async function getAllGeriDonusumTalepleri(filters = {}) {
  const { durum, gonderen_tipi, sirket_id, konteyner_id } = filters;

  const values = [];
  const conditions = [];

  if (durum) {
    values.push(durum);
    conditions.push(`gdt.durum = $${values.length}`);
  }

  if (gonderen_tipi) {
    values.push(gonderen_tipi);
    conditions.push(`gdt.gonderen_tipi = $${values.length}`);
  }

  if (sirket_id) {
    values.push(sirket_id);
    conditions.push(`gdt.sirket_id = $${values.length}`);
  }

  if (konteyner_id) {
    values.push(konteyner_id);
    conditions.push(`gdt.konteyner_id = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
    SELECT
      gdt.id,
      gdt.sirket_id,
      s.ad AS sirket_ad,
      s.mail AS sirket_mail,
      gdt.konteyner_id,
      k.konteyner_kodu,
      m.ad AS mahalle_ad,
      gdt.gonderen_tipi,
      gdt.gonderen_ad,
      gdt.gonderen_telefon,
      gdt.atik_turu,
      gdt.talep_basligi,
      gdt.talep_aciklamasi,
      gdt.tahmini_miktar,
      gdt.adres,
      gdt.tarih_saat,
      gdt.durum,
      gdt.yonetici_notu,
      gdt.created_at,
      gdt.updated_at
    FROM geri_donusum_talepleri gdt
    LEFT JOIN sirketler s ON s.id = gdt.sirket_id
    LEFT JOIN konteynerler k ON k.id = gdt.konteyner_id
    LEFT JOIN mahalleler m ON m.id = k.mahalle_id
    ${whereClause}
    ORDER BY gdt.tarih_saat DESC
    `,
    values
  );

  return result.rows;
}

async function getGeriDonusumTalebiById(id) {
  const result = await pool.query(
    `
    SELECT
      gdt.id,
      gdt.sirket_id,
      s.ad AS sirket_ad,
      s.mail AS sirket_mail,
      s.telefon AS sirket_telefon,
      gdt.konteyner_id,
      k.konteyner_kodu,
      m.ad AS mahalle_ad,
      gdt.gonderen_tipi,
      gdt.gonderen_ad,
      gdt.gonderen_telefon,
      gdt.atik_turu,
      gdt.talep_basligi,
      gdt.talep_aciklamasi,
      gdt.tahmini_miktar,
      gdt.adres,
      gdt.tarih_saat,
      gdt.durum,
      gdt.yonetici_notu,
      gdt.created_at,
      gdt.updated_at
    FROM geri_donusum_talepleri gdt
    LEFT JOIN sirketler s ON s.id = gdt.sirket_id
    LEFT JOIN konteynerler k ON k.id = gdt.konteyner_id
    LEFT JOIN mahalleler m ON m.id = k.mahalle_id
    WHERE gdt.id = $1
    `,
    [id]
  );

  return result.rows[0];
}

async function updateGeriDonusumTalebiDurumu(id, data) {
  const { durum, yonetici_notu } = data;

  const result = await pool.query(
    `
    UPDATE geri_donusum_talepleri
    SET
      durum = $1,
      yonetici_notu = COALESCE($2, yonetici_notu)
    WHERE id = $3
    RETURNING
      id,
      sirket_id,
      konteyner_id,
      gonderen_tipi,
      gonderen_ad,
      gonderen_telefon,
      atik_turu,
      talep_basligi,
      talep_aciklamasi,
      tahmini_miktar,
      adres,
      tarih_saat,
      durum,
      yonetici_notu,
      created_at,
      updated_at
    `,
    [durum, yonetici_notu || null, id]
  );

  return result.rows[0];
}

module.exports = {
  getAllGeriDonusumTalepleri,
  getGeriDonusumTalebiById,
  updateGeriDonusumTalebiDurumu,
};