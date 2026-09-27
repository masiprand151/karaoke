const service = require("../service/user.service");
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const result = await service.login({ username, password });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
