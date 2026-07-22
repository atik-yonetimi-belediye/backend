const express = require("express");

const cavusController = require("./cavus.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("cavus"));

router.get("/me", cavusController.getMe);

router.get("/konteynerler", cavusController.getMyKonteynerler);
router.post("/konteynerler", cavusController.createKonteyner);
router.patch("/konteynerler/:id/passive", cavusController.passiveKonteyner);

router.get("/araclar", cavusController.getMyAraclar);
router.post("/araclar", cavusController.createArac);
router.patch("/araclar/:id", cavusController.updateArac);
router.patch("/araclar/:id/passive", cavusController.passiveArac);

router.get("/soforler", cavusController.getMySoforler);
router.post("/soforler", cavusController.createSofor);
router.patch("/soforler/:id/arac", cavusController.updateSoforArac);
router.patch("/soforler/:id/passive", cavusController.passiveSofor);

router.get("/toplama-kayitlari", cavusController.getMyToplamaKayitlari);

module.exports = router;