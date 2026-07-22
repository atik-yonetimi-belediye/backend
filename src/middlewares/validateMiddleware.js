const { z } = require('zod');

const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errorMessages = err.errors.map(e => e.message).join(", ");
      return res.status(400).json({
        success: false,
        message: `Geçersiz veri: ${errorMessages}`
      });
    }
    next(err);
  }
};

// Validation Schemas
const sikayetCreateSchema = z.object({
  vatandas_ad_soyad: z.string().min(3, "Ad soyad en az 3 karakter olmalıdır"),
  vatandas_telefon: z.string().min(10, "Telefon numarası eksik veya hatalı"),
  konteyner_id: z.union([z.string(), z.number()]).optional(),
  sikayet_turu: z.enum(['kati_atik', 'geri_donusum']).default('kati_atik'),
  sikayet_kategorisi: z.string().optional(),
  sikayet_metni: z.string().min(5, "Şikayet detayı en az 5 karakter olmalıdır")
});

const sirketRegisterSchema = z.object({
  ad: z.string().min(2, "Şirket adı en az 2 karakter olmalıdır"),
  mail: z.string().email("Geçerli bir e-posta adresi giriniz"),
  telefon: z.string().min(10, "Telefon numarası eksik veya hatalı"),
  sifre: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  adres: z.string().optional().nullable()
});

module.exports = {
  validateBody,
  sikayetCreateSchema,
  sirketRegisterSchema
};
