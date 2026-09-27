const AppError = require("../lib/app.error");
const prisma = require("../lib/prisma");
const bcrypt = require("bcrypt");

const login = async ({ username, password }) => {
  if (!username || !password) {
    throw new AppError(400, "username and password can't be empty");
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    throw new AppError(404, "Username or password is wrong");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new AppError(404, "Username or password is wrong");
  }

  return {
    id: user.id,
    username: user.username,
    fullAccess: user.fullAccess,
  };
};

module.exports = { login };
