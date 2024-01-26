"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sport.hasMany(models.Session, { foreignKey: "sport_id" });
    }
  }
  Sport.init(
    {
      sport_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Adding a unique constraint
      },
    },
    {
      sequelize,
      modelName: "Sport",
    }
  );
  return Sport;
};
