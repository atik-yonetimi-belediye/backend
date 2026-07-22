const express = require("express");

const sikayetController = require("./sikayet.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");
const { uploadSikayetFotograflari } = require("../../middlewares/uploadMiddleware");

const router = express.Router();

router.post(
  "/",
  uploadSikayetFotograflari.array("fotograflar", 3),
  sikayetController.createSikayet
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  sikayetController.getAllSikayetler
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  sikayetController.getSikayetById
);

router.patch(
  "/:id/durum",
  authMiddleware,
  roleMiddleware("admin"),
  sikayetController.updateSikayetDurumu
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  sikayetController.deleteSikayet
);

module.exports = router;