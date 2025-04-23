'use strict';
const bcrypt = require('bcryptjs')
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    async isValidPassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }
  User.init({
    username: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      beforeCreate: async (user) => {
        const saltRounds = 10;
        user.password = await
        bcrypt.hash(user.password, saltRounds);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const saltRounds = 10;
          user.password = await
          bcrypt.hash(user.password, saltRounds);
        }
      },
    },
  });
  return User;
};