const express = require("express");
const authController = require("./auth.controller");

const router = express.Router();

router.post("/admin/login", authController.loginAdmin);
router.post("/cavus/login", authController.loginCavus);
router.post("/sofor/login", authController.loginSofor);
router.post("/sirket/login", authController.loginSirket);
router.post("/sirket/register", authController.registerSirket);

module.exports = router;