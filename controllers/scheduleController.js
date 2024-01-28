/* eslint-disable camelcase */
/* eslint-disable comma-dangle */
/* eslint-disable semi */
/* eslint-disable quotes */
const { Sequelize } = require("sequelize");
const { Sport, Session, User, UserSession } = require("../models");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const Scheduler = {
  dashboard: (req, res) => {
    if (req.accepts("html")) {
      res.render("index", { csrfToken: req.csrfToken() });
    } else {
      res.json({ success: true });
    }
  },
  getUserDashboard: async (req, res) => {
    try {
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;
      // Fetch all sports
      const allSports = await Sport.findAll();
      const sportIds = allSports.map((sport) => sport.id);
      const sessionsCountBySport = await Session.findAll({
        attributes: ["sport_id", [Sequelize.fn("COUNT", "id"), "sessionCount"]],
        where: { sport_id: sportIds },
        group: ["sport_id"],
        raw: true,
      });
      // Step 1: Query UserSession to get sessionIds
      const userSessions = await UserSession.findAll({
        where: { userId },
        attributes: ["sessionId"],
      });

      // Step 2: Extract sessionIds from the result
      const sessionIds = userSessions.map(
        (userSession) => userSession.sessionId,
      );

      // Step 3: Query Session table to get details of joined sessions
      const joinedSessions = await Session.findAll({
        where: { id: sessionIds },
        include: Sport, // Use the extracted sessionIds
      });

      // Fetch sessions created by the user
      const sessions = await Session.findAll({
        where: { userId },
        include: Sport,
      });
      res.render("userDashboard", {
        allSports,
        sessionsCountBySport,
        joinedSessions,
        sessions,
        isAdmin,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  signup: (req, res) => {
    res.render("signup", { csrfToken: req.csrfToken() });
  },
  addUsers: async (req, res) => {
    const hasedPwd = await bcrypt.hash(req.body.password, saltRounds);
    console.log(hasedPwd);
    try {
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: hasedPwd,
      });
      req.login(user, (err) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/user-dashboard");
      });
    } catch (error) {
      console.log(error);
    }
  },
  getSignin: (req, res) => {
    res.render("signin", { csrfToken: req.csrfToken() });
  },
  getLogSession: (req, res) => {
    res.redirect("/user-dashboard");
  },
  getSignout: (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  },
  getCreateSession: (req, res) => {
    res.render("createSession", {
      csrfToken: req.csrfToken(),
      sportId: req.params.sportId,
    });
  },
  createSession: async (req, res) => {
    try {
      // Extract sport_id from the route parameter
      const { sportId } = req.params;
      const userId = req.user.id;

      // Check if the provided sport_id exists
      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        throw new Error("Invalid sportId. Sport does not exist.");
      }

      // Extract session details from the request body
      const {
        date,
        time,
        venue,
        additional_players_needed,
        available_players,
      } = req.body;
      const parsedAvailablePlayers = available_players.split(",");

      // Create the session with the associated sport
      await Session.create({
        date,
        time,
        venue,
        additional_players_needed,
        available_players: parsedAvailablePlayers,
        sport_id: sport.id, // Use the id from the retrieved sport
        userId,
      });

      // Respond with the created session
      res.redirect("/created-sessions");
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getCreateSport: async (req, res) => {
    const csrfToken = req.csrfToken();
    res.render("createSport", { csrfToken });
  },

  createSport: async (req, res) => {
    try {
      const { sport_name } = req.body;
      await Sport.create({
        sport_name,
      });

      const allSports = await Sport.findAll();
      const sportIds = allSports.map((sport) => sport.id);
      const sessionsCountBySport = await Session.findAll({
        attributes: ["sport_id", [Sequelize.fn("COUNT", "id"), "sessionCount"]],
        where: { sport_id: sportIds },
        group: ["sport_id"],
        raw: true,
      });
      res.render("sportList", { allSports, sessionsCountBySport });
    } catch (error) {
      if (error instanceof Sequelize.UniqueConstraintError) {
        res.status(400).json({ error: "Sport with this name already exists." });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  },
  getAllSports: async (req, res) => {
    const allSports = await Sport.findAll();
    const sportIds = allSports.map((sport) => sport.id);
    const sessionsCountBySport = await Session.findAll({
      attributes: ["sport_id", [Sequelize.fn("COUNT", "id"), "sessionCount"]],
      where: { sport_id: sportIds },
      group: ["sport_id"],
      raw: true,
    });
    res.render("sportList", { allSports, sessionsCountBySport });
  },
  // Modify the displaySessions function
  displaySessions: async (req, res) => {
    try {
      const { sportId } = req.params;
      const userId = req.user.id;

      // Fetch sessions excluding those joined by the user
      const sessions = await Session.findAll({
        where: {
          sport_id: sportId,
          id: {
            [Sequelize.Op.notIn]: Sequelize.literal(
              `(SELECT "sessionId" FROM "UserSessions" WHERE "userId" = ${userId})`,
            ),
          },
        },
        include: [{ model: Sport }],
      });

      res.render("sessions", { sessions, csrfToken: req.csrfToken() });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  joinSession: async (req, res) => {
    try {
      // Extract the session ID and user ID from the request parameters
      const { sessionId } = req.params;
      const userId = req.user.id; // Assuming you have user information stored in req.user
      const userName = req.user.name;

      // Check if the provided session ID exists
      const session = await Session.findByPk(sessionId);
      if (!session) {
        throw new Error("Invalid sessionId. Session does not exist.");
      }

      // Check if the user is already part of the session
      const userSession = await UserSession.findOne({
        where: {
          userId,
          sessionId,
        },
      });

      if (userSession) {
        throw new Error("User is already part of this session.");
      }

      // Update the available_players attribute by appending the user's name
      const updatedAvailablePlayers = [...session.available_players, userName];

      // Update the additional_players_needed attribute by decrementing it
      const updatedAdditionalPlayersNeeded =
        session.additional_players_needed - 1;

      // Update the session record
      await session.update({
        available_players: updatedAvailablePlayers,
        additional_players_needed: updatedAdditionalPlayersNeeded,
      });

      // Create a new UserSession record to associate the user with the session
      await UserSession.create({
        userId,
        sessionId,
      });

      // res.json({ message: "User joined the session successfully." });
      res.redirect(`/user-dashboard`);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  displayCreatedSessions: async (req, res) => {
    try {
      // Extract user ID from the authenticated user
      const userId = req.user.id;

      // Fetch sessions created by the user
      const createdSessions = await Session.findAll({
        where: { userId },
        include: Sport,
      });
      // console.log(createdSessions.length);

      // Render the page with created session information
      res.render("created-sessions", {
        sessions: createdSessions,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      // Handle errors appropriately
      res.status(500).json({ error: error.message });
    }
  },
  cancelSession: async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Find the session by ID and update cancellation status
      const session = await Session.findByPk(sessionId);
      if (!session) {
        throw new Error("Session not found.");
      }
      // Update the cancellation status to true
      session.cancellation_reason = req.body.cancellation_reason;
      session.cancellation_status = true;
      await session.save();
      res.redirect("/created-sessions");
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  displayJoinedSessions: async (req, res) => {
    try {
      const userId = req.user.id; // Assuming you have the userId of the currently logged-in user

      // Step 1: Query UserSession to get sessionIds
      const userSessions = await UserSession.findAll({
        where: { userId },
        attributes: ["sessionId"],
      });

      // Step 2: Extract sessionIds from the result
      const sessionIds = userSessions.map(
        (userSession) => userSession.sessionId,
      );

      // Step 3: Query Session table to get details of joined sessions
      const joinedSessions = await Session.findAll({
        where: { id: sessionIds }, // Use the extracted sessionIds
        include: Sport,
      });

      // Now, joinedSessions contains the details of sessions that the user has joined

      res.render("joinedSessions", { joinedSessions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
module.exports = Scheduler;
