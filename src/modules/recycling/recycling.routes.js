const express = require("express");

const recyclingController = require("./recycling.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/", recyclingController.getAllGeriDonusumTalepleri);
router.get("/:id", recyclingController.getGeriDonusumTalebiById);
router.patch("/:id/durum", recyclingController.updateGeriDonusumTalebiDurumu);

module.exports = router;