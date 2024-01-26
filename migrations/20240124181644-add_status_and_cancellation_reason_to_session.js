"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Sessions", "cancellation_status", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    // Add the 'cancellation_reason' column
    await queryInterface.addColumn("Sessions", "cancellation_reason", {
      type: Sequelize.STRING,
    });
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Sessions", "status");
    await queryInterface.removeColumn("Sessions", "cancellation_reason");
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
