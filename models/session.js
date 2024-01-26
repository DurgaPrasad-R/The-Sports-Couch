"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Session.belongsTo(models.Sport, { foreignKey: "sport_id" });
      Session.belongsTo(models.User, { foreignKey: "userId" });
      Session.belongsToMany(models.User, {
        through: models.UserSession,
        foreignKey: "sessionId",
      });
    }
  }
  Session.init(
    {
      date: DataTypes.DATEONLY,
      time: DataTypes.TIME,
      venue: DataTypes.STRING,
      additional_players_needed: DataTypes.INTEGER,
      available_players: DataTypes.JSON,
      cancellation_status: DataTypes.BOOLEAN,
      cancellation_reason: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Session",
    }
  );
  return Session;
};
