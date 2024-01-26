"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Sessions", "sport_id", {
      type: Sequelize.INTEGER,
    });

    queryInterface.addConstraint("Sessions", {
      fields: ["sport_id"],
      type: "foreign key",
      references: {
        table: "Sports",
        fields: ["id"],
      },
    });
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Sessions", "sport_id");
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
