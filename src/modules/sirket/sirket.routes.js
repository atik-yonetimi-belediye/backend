const express = require("express");

const sirketController = require("./sirket.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const roleMiddleware = require("../../middlewares/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware("sirket"));

router.get("/me", sirketController.getMe);

router.post(
  "/geri-donusum-talepleri",
  sirketController.createGeriDonusumTalebi
);

router.get(
  "/geri-donusum-talepleri",
  sirketController.getMyGeriDonusumTalepleri
);

router.put(
  "/geri-donusum-talepleri/:id",
  sirketController.updateGeriDonusumTalebi
);

router.patch(
  "/geri-donusum-talepleri/:id/cancel",
  sirketController.cancelGeriDonusumTalebi
);

module.exports = router;