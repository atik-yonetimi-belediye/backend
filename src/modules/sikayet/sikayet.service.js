const pool = require("../../config/db");
const { normalizePhone } = require("../../utils/phone");

async function createSikayet(data, files = []) {
  const {
    vatandas_ad_soyad,
    vatandas_telefon,
    konteyner_id,
    sikayet_turu,
    sikayet_kategorisi,
    sikayet_metni,
  } = data;

  const normalizedPhone = normalizePhone(vatandas_telefon);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const konteynerResult = await client.query(
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
      const error = new Error("Pasif konteyner için şikayet oluşturulamaz.");
      error.statusCode = 400;
      throw error;
    }

    if (konteyner.tur !== sikayet_turu) {
      const error = new Error("Şikayet türü konteyner türü ile uyumlu değil.");
      error.statusCode = 400;
      throw error;
    }

    const sikayetResult = await client.query(
      `
      INSERT INTO sikayetler
        (
          vatandas_ad_soyad,
          vatandas_telefon,
          konteyner_id,
          sikayet_turu,
          sikayet_kategorisi,
          sikayet_metni,
          durum
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, 'bekliyor')
      RETURNING
        id,
        vatandas_ad_soyad,
        vatandas_telefon,
        konteyner_id,
        sikayet_turu,
        sikayet_kategorisi,
        sikayet_metni,
        durum,
        yonetici_notu,
        cozulme_tarihi,
        tarih_saat,
        created_at,
        updated_at
      `,
      [
        vatandas_ad_soyad,
        normalizedPhone,
        konteyner_id,
        sikayet_turu,
        sikayet_kategorisi || "diger",
        sikayet_metni,
      ]
    );

    const sikayet = sikayetResult.rows[0];

    const fotograflar = [];

    for (const file of files) {
      const fotoUrl = `/uploads/sikayetler/${file.filename}`;

      const fotoResult = await client.query(
        `
        INSERT INTO sikayet_fotograflari
          (sikayet_id, foto_url)
        VALUES
          ($1, $2)
        RETURNING id, sikayet_id, foto_url, created_at
        `,
        [sikayet.id, fotoUrl]
      );

      fotograflar.push(fotoResult.rows[0]);
    }

    await client.query("COMMIT");

    return {
      ...sikayet,
      fotograflar,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getAllSikayetler(filters = {}) {
  const { durum, sikayet_turu, sikayet_kategorisi, konteyner_id } = filters;

  const values = [];
  const conditions = [];

  if (durum) {
    values.push(durum);
    conditions.push(`s.durum = $${values.length}`);
  }

  if (sikayet_turu) {
    values.push(sikayet_turu);
    conditions.push(`s.sikayet_turu = $${values.length}`);
  }

  if (sikayet_kategorisi) {
    values.push(sikayet_kategorisi);
    conditions.push(`s.sikayet_kategorisi = $${values.length}`);
  }

  if (konteyner_id) {
    values.push(konteyner_id);
    conditions.push(`s.konteyner_id = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `
    SELECT
      s.id,
      s.vatandas_ad_soyad,
      s.vatandas_telefon,
      s.konteyner_id,
      k.konteyner_kodu,
      k.tur AS konteyner_tur,
      m.ad AS mahalle_ad,
      s.sikayet_turu,
      s.sikayet_kategorisi,
      s.sikayet_metni,
      s.durum,
      s.yonetici_notu,
      s.cozulme_tarihi,
      s.tarih_saat,
      s.created_at,
      s.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', sf.id,
            'foto_url', sf.foto_url,
            'created_at', sf.created_at
          )
        ) FILTER (WHERE sf.id IS NOT NULL),
        '[]'
      ) AS fotograflar
    FROM sikayetler s
    LEFT JOIN konteynerler k ON k.id = s.konteyner_id
    LEFT JOIN mahalleler m ON m.id = k.mahalle_id
    LEFT JOIN sikayet_fotograflari sf ON sf.sikayet_id = s.id
    ${whereClause}
    GROUP BY
      s.id,
      k.konteyner_kodu,
      k.tur,
      m.ad
    ORDER BY s.tarih_saat DESC
    `,
    values
  );

  return result.rows;
}

async function getSikayetById(id) {
  const result = await pool.query(
    `
    SELECT
      s.id,
      s.vatandas_ad_soyad,
      s.vatandas_telefon,
      s.konteyner_id,
      k.konteyner_kodu,
      k.tur AS konteyner_tur,
      m.ad AS mahalle_ad,
      s.sikayet_turu,
      s.sikayet_kategorisi,
      s.sikayet_metni,
      s.durum,
      s.yonetici_notu,
      s.cozulme_tarihi,
      s.tarih_saat,
      s.created_at,
      s.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', sf.id,
            'foto_url', sf.foto_url,
            'created_at', sf.created_at
          )
        ) FILTER (WHERE sf.id IS NOT NULL),
        '[]'
      ) AS fotograflar
    FROM sikayetler s
    LEFT JOIN konteynerler k ON k.id = s.konteyner_id
    LEFT JOIN mahalleler m ON m.id = k.mahalle_id
    LEFT JOIN sikayet_fotograflari sf ON sf.sikayet_id = s.id
    WHERE s.id = $1
    GROUP BY
      s.id,
      k.konteyner_kodu,
      k.tur,
      m.ad
    `,
    [id]
  );

  return result.rows[0];
}

async function updateSikayetDurumu(id, data) {
  const { durum, yonetici_notu } = data;

  const result = await pool.query(
    `
    UPDATE sikayetler
    SET
      durum = $1::sikayet_durumu,
      yonetici_notu = COALESCE($2, yonetici_notu),
      cozulme_tarihi = CASE
        WHEN $1::text = 'cozuldu' THEN CURRENT_TIMESTAMP
        ELSE cozulme_tarihi
      END
    WHERE id = $3
    RETURNING
      id,
      vatandas_ad_soyad,
      vatandas_telefon,
      konteyner_id,
      sikayet_turu,
      sikayet_kategorisi,
      sikayet_metni,
      durum,
      yonetici_notu,
      cozulme_tarihi,
      tarih_saat,
      created_at,
      updated_at
    `,
    [durum, yonetici_notu || null, id]
  );

  return result.rows[0];
}

async function deleteSikayet(id) {
  const result = await pool.query(
    `
    DELETE FROM sikayetler
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );
  return result.rows[0];
}

module.exports = {
  createSikayet,
  getAllSikayetler,
  getSikayetById,
  updateSikayetDurumu,
  deleteSikayet,
};