const express = require("express");

const adminController = require("./admin.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/dashboard", adminController.getDashboard);

router.get("/cavuslar", adminController.getAllCavuslar);
router.get("/soforler", adminController.getAllSoforler);

router.get("/sirketler", adminController.getAllSirketler);
router.patch("/sirketler/:id/onay-durumu", adminController.updateSirketOnayDurumu);

router.get("/konteynerler", adminController.getAllKonteynerler);
router.get("/araclar", adminController.getAllAraclar);
router.get("/toplama-kayitlari", adminController.getAllToplamaKayitlari);

module.exports = router;