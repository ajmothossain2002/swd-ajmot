import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";

const options = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

export function hashPassword(password) {
  return argonHash(password, options);
}

export function verifyPassword({ hash, password }) {
  return argonVerify(hash, password, options);
}
