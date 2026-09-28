import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs '<password>'");
  console.error("Prints a scrypt hash. Put it in ADMIN_PASSWORD_HASH. Do not commit it.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const key = scryptSync(password, salt, 32).toString("hex");
process.stdout.write(`scrypt$${salt}$${key}\n`);
