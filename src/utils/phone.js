function normalizePhone(phone) {
  if (!phone) return phone;

  let cleaned = String(phone).trim();

  cleaned = cleaned.replace(/\s+/g, "");
  cleaned = cleaned.replace(/-/g, "");
  cleaned = cleaned.replace(/\(/g, "");
  cleaned = cleaned.replace(/\)/g, "");

  if (cleaned.startsWith("+90")) {
    cleaned = "0" + cleaned.slice(3);
  }

  if (cleaned.startsWith("90") && cleaned.length === 12) {
    cleaned = "0" + cleaned.slice(2);
  }

  if (cleaned.length === 10 && cleaned.startsWith("5")) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

module.exports = {
  normalizePhone,
};