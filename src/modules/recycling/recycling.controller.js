const recyclingService = require("./recycling.service");
const { successResponse, errorResponse } = require("../../utils/response");

const allowedTalepDurumlari = [
  "bekliyor",
  "onaylandi",
  "reddedildi",
  "tamamlandi",
  "iptal_edildi",
];

const allowedGonderenTipleri = ["vatandas", "yonetici", "sirket"];

async function getAllGeriDonusumTalepleri(req, res) {
  try {
    const { durum, gonderen_tipi, sirket_id, konteyner_id } = req.query;

    if (durum && !allowedTalepDurumlari.includes(durum)) {
      return errorResponse(res, "Geçersiz talep durumu.", 400);
    }

    if (gonderen_tipi && !allowedGonderenTipleri.includes(gonderen_tipi)) {
      return errorResponse(res, "Geçersiz gönderen tipi.", 400);
    }

    const filters = {};

    if (durum) filters.durum = durum;
    if (gonderen_tipi) filters.gonderen_tipi = gonderen_tipi;
    if (sirket_id) filters.sirket_id = sirket_id;
    if (konteyner_id) filters.konteyner_id = konteyner_id;

    const data = await recyclingService.getAllGeriDonusumTalepleri(filters);

    return successResponse(res, "Geri dönüşüm talepleri listelendi.", data);
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
}

async function getGeriDonusumTalebiById(req, res) {
  try {
    const { id } = req.params;

    const data = await recyclingService.getGeriDonusumTalebiById(id);

    if (!data) {
      return errorResponse(res, "Geri dönüşüm talebi bulunamadı.", 404);
    }

    return successResponse(res, "Geri dönüşüm talebi getirildi.", data);
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
}

async function updateGeriDonusumTalebiDurumu(req, res) {
  try {
    const { id } = req.params;
    const { durum, yonetici_notu } = req.body;

    if (!durum) {
      return errorResponse(res, "Durum alanı zorunludur.", 400);
    }

    if (!allowedTalepDurumlari.includes(durum)) {
      return errorResponse(res, "Geçersiz talep durumu.", 400);
    }

    const data = await recyclingService.updateGeriDonusumTalebiDurumu(id, {
      durum,
      yonetici_notu,
    });

    if (!data) {
      return errorResponse(res, "Geri dönüşüm talebi bulunamadı.", 404);
    }

    return successResponse(
      res,
      "Geri dönüşüm talebi durumu güncellendi.",
      data
    );
  } catch (error) {
    return errorResponse(res, error.message, error.statusCode || 500);
  }
}

module.exports = {
  getAllGeriDonusumTalepleri,
  getGeriDonusumTalebiById,
  updateGeriDonusumTalebiDurumu,
};