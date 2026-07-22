const bcrypt = require("bcrypt");
const pool = require("../../config/db");
const { generateToken } = require("../../utils/jwt");
const { normalizePhone } = require("../../utils/phone");

async function checkPassword(inputPassword, hashedPassword) {
  return bcrypt.compare(inputPassword, hashedPassword);
}

async function loginAdmin(kullanici_adi, sifre) {
  const result = await pool.query(
    `
    SELECT id, kullanici_adi, sifre, ad_soyad, mail, telefon, aktif_mi
    FROM yoneticiler
    WHERE kullanici_adi = $1
    `,
    [kullanici_adi]
  );

  if (result.rows.length === 0) {
    const error = new Error("Yönetici bulunamadı.");
    error.statusCode = 401;
    throw error;
  }

  const admin = result.rows[0];

  if (!admin.aktif_mi) {
    const error = new Error("Yönetici hesabı pasif durumda.");
    error.statusCode = 403;
    throw error;
  }

  const passwordMatch = await checkPassword(sifre, admin.sifre);

  if (!passwordMatch) {
    const error = new Error("Şifre hatalı.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: admin.id,
    role: "admin",
    kullanici_adi: admin.kullanici_adi,
  });

  return {
    token,
    user: {
      id: admin.id,
      role: "admin",
      kullanici_adi: admin.kullanici_adi,
      ad_soyad: admin.ad_soyad,
      mail: admin.mail,
      telefon: admin.telefon,
    },
  };
}

async function loginCavus(telefon, sifre) {
  const normalizedPhone = normalizePhone(telefon);

  const result = await pool.query(
    `
    SELECT 
      c.id,
      c.ad_soyad,
      c.telefon,
      c.sifre,
      c.mahalle_id,
      c.aktif_mi,
      m.ad AS mahalle_ad,
      m.ilce,
      m.il
    FROM cavuslar c
    JOIN mahalleler m ON m.id = c.mahalle_id
    WHERE c.telefon = $1
    `,
    [normalizedPhone]
  );

  if (result.rows.length === 0) {
    const error = new Error("Çavuş bulunamadı.");
    error.statusCode = 401;
    throw error;
  }

  const cavus = result.rows[0];

  if (!cavus.aktif_mi) {
    const error = new Error("Çavuş hesabı pasif durumda.");
    error.statusCode = 403;
    throw error;
  }

  const passwordMatch = await checkPassword(sifre, cavus.sifre);

  if (!passwordMatch) {
    const error = new Error("Şifre hatalı.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: cavus.id,
    role: "cavus",
    telefon: cavus.telefon,
    mahalle_id: cavus.mahalle_id,
  });

  return {
    token,
    user: {
      id: cavus.id,
      role: "cavus",
      ad_soyad: cavus.ad_soyad,
      telefon: cavus.telefon,
      mahalle_id: cavus.mahalle_id,
      mahalle_ad: cavus.mahalle_ad,
      ilce: cavus.ilce,
      il: cavus.il,
    },
  };
}

async function loginSofor(telefon, sifre) {
  const normalizedPhone = normalizePhone(telefon);

  const result = await pool.query(
    `
    SELECT 
      s.id,
      s.ad,
      s.soyad,
      s.telefon,
      s.sifre,
      s.arac_id,
      s.cavus_id,
      s.aktif_mi,
      a.plaka,
      a.arac_turu,
      a.aktif_mi AS arac_aktif_mi
    FROM soforler s
    LEFT JOIN araclar a ON a.id = s.arac_id
    WHERE s.telefon = $1
    `,
    [normalizedPhone]
  );

  if (result.rows.length === 0) {
    const error = new Error("Şoför bulunamadı.");
    error.statusCode = 401;
    throw error;
  }

  const sofor = result.rows[0];

  if (!sofor.aktif_mi) {
    const error = new Error("Şoför hesabı pasif durumda.");
    error.statusCode = 403;
    throw error;
  }

  if (!sofor.arac_id) {
    const error = new Error("Şoföre atanmış araç bulunmuyor.");
    error.statusCode = 403;
    throw error;
  }

  if (!sofor.arac_aktif_mi) {
    const error = new Error("Şoföre atanmış araç pasif durumda.");
    error.statusCode = 403;
    throw error;
  }

  const passwordMatch = await checkPassword(sifre, sofor.sifre);

  if (!passwordMatch) {
    const error = new Error("Şifre hatalı.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: sofor.id,
    role: "sofor",
    telefon: sofor.telefon,
    arac_id: sofor.arac_id,
    arac_turu: sofor.arac_turu,
    cavus_id: sofor.cavus_id,
  });

  return {
    token,
    user: {
      id: sofor.id,
      role: "sofor",
      ad: sofor.ad,
      soyad: sofor.soyad,
      telefon: sofor.telefon,
      arac_id: sofor.arac_id,
      plaka: sofor.plaka,
      arac_turu: sofor.arac_turu,
      cavus_id: sofor.cavus_id,
    },
  };
}

async function loginSirket(mail, sifre) {
  const result = await pool.query(
    `
    SELECT id, ad, adres, mail, telefon, sifre, onay_durumu, aktif_mi
    FROM sirketler
    WHERE mail = $1
    `,
    [mail]
  );

  if (result.rows.length === 0) {
    const error = new Error("Şirket bulunamadı.");
    error.statusCode = 401;
    throw error;
  }

  const sirket = result.rows[0];

  if (!sirket.aktif_mi) {
    const error = new Error("Şirket hesabı pasif durumda.");
    error.statusCode = 403;
    throw error;
  }

  if (sirket.onay_durumu !== "onaylandi") {
    const error = new Error("Şirket hesabı henüz onaylanmamış.");
    error.statusCode = 403;
    throw error;
  }

  const passwordMatch = await checkPassword(sifre, sirket.sifre);

  if (!passwordMatch) {
    const error = new Error("Şifre hatalı.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: sirket.id,
    role: "sirket",
    mail: sirket.mail,
  });

  return {
    token,
    user: {
      id: sirket.id,
      role: "sirket",
      ad: sirket.ad,
      adres: sirket.adres,
      mail: sirket.mail,
      telefon: sirket.telefon,
      onay_durumu: sirket.onay_durumu,
    },
  };
}

async function registerSirket(data) {
  const { ad, adres, mail, telefon, sifre } = data;

  const normalizedPhone = normalizePhone(telefon);
  const hashedPassword = await bcrypt.hash(sifre, 12);

  const result = await pool.query(
    `
    INSERT INTO sirketler
      (ad, adres, mail, telefon, sifre, onay_durumu, aktif_mi)
    VALUES
      ($1, $2, $3, $4, $5, 'bekliyor', true)
    RETURNING id, ad, adres, mail, telefon, onay_durumu, aktif_mi, created_at
    `,
    [ad, adres || null, mail, normalizedPhone, hashedPassword]
  );

  return result.rows[0];
}

module.exports = {
  loginAdmin,
  loginCavus,
  loginSofor,
  loginSirket,
  registerSirket,
};