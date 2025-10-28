export const COLORS = {
  green: "\x1b[32m%s\x1b[0m",
  red: "\x1b[31m%s\x1b[0m",
  yellow: "\x1b[33m%s\x1b[0m",
};

export default {
  info: (message) => console.log(COLORS.green, message),
  error: (message) => console.log(COLORS.red, message),
  warning: (message) => console.log(COLORS.yellow, message),
};
