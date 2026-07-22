const express = require("express");
const konteynerController = require("./konteyner.controller");

const router = express.Router();

router.get("/", konteynerController.getAllKonteynerler);
router.get("/:id", konteynerController.getKonteynerById);

module.exports = router;