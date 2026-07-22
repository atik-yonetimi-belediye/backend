const pool = require("../../config/db");

async function getMe(sirketId) {
  const result = await pool.query(
    `
    SELECT
      id,
      ad,
      adres,
      mail,
      telefon,
      onay_durumu,
      aktif_mi,
      created_at,
      updated_at
    FROM sirketler
    WHERE id = $1
    `,
    [sirketId]
  );

  return result.rows[0];
}

async function createGeriDonusumTalebi(sirketId, data) {
  const {
    konteyner_id,
    talep_basligi,
    talep_aciklamasi,
    tahmini_miktar,
    adres,
  } = data;

  const sirketResult = await pool.query(
    `
    SELECT id, ad, telefon, aktif_mi, onay_durumu
    FROM sirketler
    WHERE id = $1
    `,
    [sirketId]
  );

  if (sirketResult.rows.length === 0) {
    const error = new Error("Şirket bulunamadı.");
    error.statusCode = 404;
    throw error;
  }

  const sirket = sirketResult.rows[0];

  if (!sirket.aktif_mi) {
    const error = new Error("Şirket hesabı pasif durumda.");
    error.statusCode = 403;
    throw error;
  }

  if (sirket.onay_durumu !== "onaylandi") {
    const error = new Error("Şirket hesabı onaylı değil.");
    error.statusCode = 403;
    throw error;
  }

  if (konteyner_id) {
    const konteynerResult = await pool.query(
      `
      SELECT id, tur, aktif_mi
      FROM konteynerler
      WHERE id = $1
      `,
      [konteyner_id]
    );

    if (konteynerResult.rows.length === 0) {
      const error = new Error("Konteyner bulunamadı.");
      error.statusCode = 404;
      throw error;
    }

    const konteyner = konteynerResult.rows[0];

    if (!konteyner.aktif_mi) {
      const error = new Error("Pasif konteyner için talep oluşturulamaz.");
      error.statusCode = 400;
      throw error;
    }

    if (konteyner.tur !== "geri_donusum") {
      const error = new Error(
        "Geri dönüşüm talebi sadece geri dönüşüm konteyneri için oluşturulabilir."
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const result = await pool.query(
    `
    INSERT INTO geri_donusum_talepleri
      (
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
        durum
      )
    VALUES
      ($1, $2, 'sirket', $3, $4, 'geri_donusum', $5, $6, $7, $8, 'bekliyor')
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
    [
      sirketId,
      konteyner_id || null,
      sirket.ad,
      sirket.telefon,
      talep_basligi || null,
      talep_aciklamasi || null,
      tahmini_miktar || null,
      adres || null,
    ]
  );

  return result.rows[0];
}

async function getMyGeriDonusumTalepleri(sirketId) {
  const result = await pool.query(
    `
    SELECT
      gdt.id,
      gdt.sirket_id,
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
    LEFT JOIN konteynerler k ON k.id = gdt.konteyner_id
    LEFT JOIN mahalleler m ON m.id = k.mahalle_id
    WHERE gdt.sirket_id = $1
    ORDER BY gdt.tarih_saat DESC
    `,
    [sirketId]
  );

  return result.rows;
}

async function updateGeriDonusumTalebi(sirketId, talepId, data) {
  const { talep_basligi, talep_aciklamasi, tahmini_miktar, adres } = data;
  const result = await pool.query(
    `
    UPDATE geri_donusum_talepleri
    SET talep_basligi = COALESCE($1, talep_basligi),
        talep_aciklamasi = COALESCE($2, talep_aciklamasi),
        tahmini_miktar = COALESCE($3, tahmini_miktar),
        adres = COALESCE($4, adres),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $5 AND sirket_id = $6 AND durum = 'bekliyor'
    RETURNING *
    `,
    [talep_basligi, talep_aciklamasi, tahmini_miktar, adres, talepId, sirketId]
  );
  return result.rows[0];
}

async function cancelGeriDonusumTalebi(sirketId, talepId) {
  const result = await pool.query(
    `
    UPDATE geri_donusum_talepleri
    SET durum = 'iptal_edildi',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND sirket_id = $2 AND durum = 'bekliyor'
    RETURNING *
    `,
    [talepId, sirketId]
  );
  return result.rows[0];
}

module.exports = {
  getMe,
  createGeriDonusumTalebi,
  getMyGeriDonusumTalepleri,
  updateGeriDonusumTalebi,
  cancelGeriDonusumTalebi,
};