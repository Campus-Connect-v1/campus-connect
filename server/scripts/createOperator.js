// Bootstrap an operator account.
//
// There is no sign-up for the admin app on purpose, so the first account has to
// be created here. Subsequent operators are added from the UI by an owner.
//
//   node scripts/createOperator.js                      (prompts)
//   node scripts/createOperator.js you@example.com 'pw' Ada Lovelace owner
//
// Reads server/.env for the database connection.

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import dotenv from "dotenv";
import {
  createOperator,
  findOperatorByEmail,
  countOperators,
  ROLES,
} from "../models/operator.model.js";
import { hashOperatorPassword } from "../controllers/admin/auth.controller.js";
import { db } from "../config/db.js";

dotenv.config();

const [argEmail, argPassword, argFirst, argLast, argRole] =
  process.argv.slice(2);

const ask = async (rl, question, fallback) => {
  if (fallback) return fallback;
  const answer = (await rl.question(question)).trim();
  if (!answer) throw new Error("This field is required");
  return answer;
};

const main = async () => {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const existing = await countOperators();
    console.log(
      existing === 0
        ? "\nNo operators yet — this will be the first (role: owner).\n"
        : `\n${existing} operator(s) already exist.\n`
    );

    const email = await ask(rl, "Email: ", argEmail);
    if (await findOperatorByEmail(email)) {
      throw new Error(`An operator with ${email} already exists`);
    }

    const password = await ask(rl, "Password (min 10 chars): ", argPassword);
    if (password.length < 10) {
      throw new Error("Password must be at least 10 characters");
    }

    const first_name = await ask(rl, "First name: ", argFirst);
    const last_name = await ask(rl, "Last name: ", argLast);

    // The first account must be an owner, or nobody could ever add operators.
    const role =
      existing === 0
        ? "owner"
        : argRole || (await ask(rl, `Role (${ROLES.join("/")}): `));
    if (!ROLES.includes(role)) {
      throw new Error(`role must be one of: ${ROLES.join(", ")}`);
    }

    const operator = await createOperator({
      email,
      password_hash: await hashOperatorPassword(password),
      first_name,
      last_name,
      role,
    });

    console.log(
      `\n✓ Created ${operator.email} (${operator.role})` +
        `\n  id: ${operator.operator_id}\n\nSign in at /admin\n`
    );
  } catch (error) {
    console.error(`\n✗ ${error.message}\n`);
    process.exitCode = 1;
  } finally {
    rl.close();
    await db.end().catch(() => {});
  }
};

main();
