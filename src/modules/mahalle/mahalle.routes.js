const express = require("express");
const mahalleController = require("./mahalle.controller");

const router = express.Router();

router.get("/", mahalleController.getAllMahalleler);
router.get("/:id", mahalleController.getMahalleById);

module.exports = router;