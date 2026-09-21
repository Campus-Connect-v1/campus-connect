/**
 * The API answers a correct password on an unverified account with 403. That is
 * not a failed login — it is an interrupted sign-up, and the caller should send
 * the user to the OTP screen rather than showing a dead end.
 */
export const EMAIL_UNVERIFIED = 403;
