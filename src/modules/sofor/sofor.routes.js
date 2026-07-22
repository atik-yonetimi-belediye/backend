const express = require("express");

const soforController = require("./sofor.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("sofor"));

router.get("/me", soforController.getMe);
router.get("/konteynerler", soforController.getAvailableKonteynerlerForSofor);
router.post("/toplama-kayitlari", soforController.createToplamaKaydi);
router.get("/toplama-kayitlari", soforController.getMyToplamaKayitlari);

module.exports = router;