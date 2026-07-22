const pool = require("../../config/db");

async function getDashboard() {
  const [
    konteynerResult,
    aracResult,
    cavusResult,
    soforResult,
    sirketResult,
    sikayetResult,
    geriDonusumTalepResult,
    bugunkuToplamaResult,
  ] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) AS toplam_konteyner,
        COUNT(*) FILTER (WHERE aktif_mi = true) AS aktif_konteyner,
        COUNT(*) FILTER (WHERE aktif_mi = false) AS pasif_konteyner,
        COUNT(*) FILTER (WHERE tur = 'kati_atik') AS kati_atik_konteyner,
        COUNT(*) FILTER (WHERE tur = 'geri_donusum') AS geri_donusum_konteyner
      FROM konteynerler
    `),

    pool.query(`
      SELECT
        COUNT(*) AS toplam_arac,
        COUNT(*) FILTER (WHERE aktif_mi = true) AS aktif_arac,
        COUNT(*) FILTER (WHERE aktif_mi = false) AS pasif_arac,
        COUNT(*) FILTER (WHERE arac_turu = 'kati_atik') AS kati_atik_arac,
        COUNT(*) FILTER (WHERE arac_turu = 'geri_donusum') AS geri_donusum_arac
      FROM araclar
    `),

    pool.query(`
      SELECT
        COUNT(*) AS toplam_cavus,
        COUNT(*) FILTER (WHERE aktif_mi = true) AS aktif_cavus,
        COUNT(*) FILTER (WHERE aktif_mi = false) AS pasif_cavus
      FROM cavuslar
    `),

    pool.query(`
      SELECT
        COUNT(*) AS toplam_sofor,
        COUNT(*) FILTER (WHERE aktif_mi = true) AS aktif_sofor,
        COUNT(*) FILTER (WHERE aktif_mi = false) AS pasif_sofor
      FROM soforler
    `),

    pool.query(`
      SELECT
        COUNT(*) AS toplam_sirket,
        COUNT(*) FILTER (WHERE aktif_mi = true) AS aktif_sirket,
        COUNT(*) FILTER (WHERE aktif_mi = false) AS pasif_sirket,
        COUNT(*) FILTER (WHERE onay_durumu = 'bekliyor') AS bekleyen_sirket,
        COUNT(*) FILTER (WHERE onay_durumu = 'onaylandi') AS onayli_sirket,
        COUNT(*) FILTER (WHERE onay_durumu = 'reddedildi') AS reddedilen_sirket
      FROM sirketler
    `),

    pool.query(`
      SELECT
        COUNT(*) AS toplam_sikayet,
        COUNT(*) FILTER (WHERE durum = 'bekliyor') AS bekleyen_sikayet,
        COUNT(*) FILTER (WHERE durum = 'inceleniyor') AS incelenen_sikayet,
        COUNT(*) FILTER (WHERE durum = 'cozuldu') AS cozulen_sikayet,
        COUNT(*) FILTER (WHERE durum = 'reddedildi') AS reddedilen_sikayet
      FROM sikayetler
    `),

    pool.query(`
      SELECT
        COUNT(*) AS toplam_talep,
        COUNT(*) FILTER (WHERE durum = 'bekliyor') AS bekleyen_talep,
        COUNT(*) FILTER (WHERE durum = 'onaylandi') AS onaylanan_talep,
        COUNT(*) FILTER (WHERE durum = 'reddedildi') AS reddedilen_talep,
        COUNT(*) FILTER (WHERE durum = 'tamamlandi') AS tamamlanan_talep,
        COUNT(*) FILTER (WHERE durum = 'iptal_edildi') AS iptal_edilen_talep
      FROM geri_donusum_talepleri
    `),

    pool.query(`
      SELECT
        COUNT(*) AS bugunku_toplama_kaydi,
        COUNT(*) FILTER (WHERE durum = 'toplandi') AS bugun_toplanan,
        COUNT(*) FILTER (WHERE durum = 'atlanildi') AS bugun_atlanilan
      FROM toplama_kayitlari
      WHERE tarih_saat::date = CURRENT_DATE
    `),
  ]);

  return {
    konteynerler: konteynerResult.rows[0],
    araclar: aracResult.rows[0],
    cavuslar: cavusResult.rows[0],
    soforler: soforResult.rows[0],
    sirketler: sirketResult.rows[0],
    sikayetler: sikayetResult.rows[0],
    geri_donusum_talepleri: geriDonusumTalepResult.rows[0],
    bugunku_toplama: bugunkuToplamaResult.rows[0],
  };
}

async function getAllCavuslar() {
  const result = await pool.query(`
    SELECT
      c.id,
      c.ad_soyad,
      c.telefon,
      c.aktif_mi,
      c.mahalle_id,
      m.ad AS mahalle_ad,
      c.created_at,
      c.updated_at
    FROM cavuslar c
    LEFT JOIN mahalleler m ON m.id = c.mahalle_id
    ORDER BY c.id ASC
  `);

  return result.rows;
}

async function getAllSoforler() {
  const result = await pool.query(`
    SELECT
      s.id,
      s.ad,
      s.soyad,
      CONCAT(s.ad, ' ', s.soyad) AS ad_soyad,
      s.telefon,
      s.aktif_mi,
      s.arac_id,
      a.plaka,
      a.arac_turu,
      a.cavus_id,
      c.ad_soyad AS cavus_ad_soyad,
      m.ad AS mahalle_ad,
      s.created_at,
      s.updated_at
    FROM soforler s
    LEFT JOIN araclar a ON a.id = s.arac_id
    LEFT JOIN cavuslar c ON c.id = a.cavus_id
    LEFT JOIN mahalleler m ON m.id = c.mahalle_id
    ORDER BY s.id ASC
  `);

  return result.rows;
}

async function getAllSirketler(filters = {}) {
  const { onay_durumu, aktif_mi } = filters;

  const values = [];
  const conditions = [];

  if (onay_durumu) {
    values.push(onay_durumu);
    conditions.push(`s.onay_durumu = $${values.length}`);
  }

  if (aktif_mi !== undefined) {
    values.push(aktif_mi);
    conditions.push(`s.aktif_mi = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
    SELECT
      s.id,
      s.ad,
      s.adres,
      s.mail,
      s.telefon,
      s.onay_durumu,
      s.aktif_mi,
      s.created_at,
      s.updated_at
    FROM sirketler s
    ${whereClause}
    ORDER BY s.id ASC
    `,
    values
  );

  return result.rows;
}

async function updateSirketOnayDurumu(id, data) {
  const { onay_durumu } = data;

  const result = await pool.query(
    `
    UPDATE sirketler
    SET onay_durumu = $1
    WHERE id = $2
    RETURNING
      id,
      ad,
      adres,
      mail,
      telefon,
      onay_durumu,
      aktif_mi,
      created_at,
      updated_at
    `,
    [onay_durumu, id]
  );

  return result.rows[0];
}

async function getAllKonteynerler(filters = {}) {
  const { tur, mahalle_id, aktif_mi } = filters;

  const values = [];
  const conditions = [];

  if (tur) {
    values.push(tur);
    conditions.push(`k.tur = $${values.length}`);
  }

  if (mahalle_id) {
    values.push(mahalle_id);
    conditions.push(`k.mahalle_id = $${values.length}`);
  }

  if (aktif_mi !== undefined) {
    values.push(aktif_mi);
    conditions.push(`k.aktif_mi = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
    SELECT
      k.id,
      k.konteyner_kodu,
      k.tur,
      k.latitude,
      k.longitude,
      k.aktif_mi,
      k.mahalle_id,
      m.ad AS mahalle_ad,
      k.cavus_id,
      c.ad_soyad AS cavus_ad_soyad,
      k.created_at,
      k.updated_at
    FROM konteynerler k
    LEFT JOIN mahalleler m ON m.id = k.mahalle_id
    LEFT JOIN cavuslar c ON c.id = k.cavus_id
    ${whereClause}
    ORDER BY k.id ASC
    `,
    values
  );

  return result.rows;
}

async function getAllAraclar(filters = {}) {
  const { arac_turu, cavus_id, aktif_mi } = filters;

  const values = [];
  const conditions = [];

  if (arac_turu) {
    values.push(arac_turu);
    conditions.push(`a.arac_turu = $${values.length}`);
  }

  if (cavus_id) {
    values.push(cavus_id);
    conditions.push(`a.cavus_id = $${values.length}`);
  }

  if (aktif_mi !== undefined) {
    values.push(aktif_mi);
    conditions.push(`a.aktif_mi = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
    SELECT
      a.id,
      a.plaka,
      a.arac_turu,
      a.aktif_mi,
      a.cavus_id,
      c.ad_soyad AS cavus_ad_soyad,
      m.ad AS mahalle_ad,
      a.created_at,
      a.updated_at
    FROM araclar a
    LEFT JOIN cavuslar c ON c.id = a.cavus_id
    LEFT JOIN mahalleler m ON m.id = c.mahalle_id
    ${whereClause}
    ORDER BY a.id ASC
    `,
    values
  );

  return result.rows;
}

async function getAllToplamaKayitlari(filters = {}) {
  const { durum, sofor_id, konteyner_id, mahalle_id, date_from, date_to } =
    filters;

  const values = [];
  const conditions = [];

  if (durum) {
    values.push(durum);
    conditions.push(`tk.durum = $${values.length}`);
  }

  if (sofor_id) {
    values.push(sofor_id);
    conditions.push(`tk.sofor_id = $${values.length}`);
  }

  if (konteyner_id) {
    values.push(konteyner_id);
    conditions.push(`tk.konteyner_id = $${values.length}`);
  }

  if (mahalle_id) {
    values.push(mahalle_id);
    conditions.push(`k.mahalle_id = $${values.length}`);
  }

  if (date_from) {
    values.push(date_from);
    conditions.push(`tk.tarih_saat::date >= $${values.length}`);
  }

  if (date_to) {
    values.push(date_to);
    conditions.push(`tk.tarih_saat::date <= $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
    SELECT
      tk.id,
      tk.konteyner_id,
      k.konteyner_kodu,
      k.tur AS konteyner_turu,
      m.ad AS mahalle_ad,
      tk.sofor_id,
      CONCAT(s.ad, ' ', s.soyad) AS sofor_ad_soyad,
      a.plaka,
      a.arac_turu,
      tk.durum,
      tk.sebep,
      tk.diger_aciklama,
      tk.tarih_saat,
      tk.created_at,
      tk.updated_at
    FROM toplama_kayitlari tk
    LEFT JOIN konteynerler k ON k.id = tk.konteyner_id
    LEFT JOIN mahalleler m ON m.id = k.mahalle_id
    LEFT JOIN soforler s ON s.id = tk.sofor_id
    LEFT JOIN araclar a ON a.id = s.arac_id
    ${whereClause}
    ORDER BY tk.tarih_saat DESC
    `,
    values
  );

  return result.rows;
}

module.exports = {
  getDashboard,
  getAllCavuslar,
  getAllSoforler,
  getAllSirketler,
  updateSirketOnayDurumu,
  getAllKonteynerler,
  getAllAraclar,
  getAllToplamaKayitlari,
};