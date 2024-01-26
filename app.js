const express = require("express");
const { User } = require("./models");
const bodyParser = require("body-parser");
const app = express();
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const Scheduler = require("./controllers/scheduleController");
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "super-secret-12345678765432",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({
        where: {
          email: username,
        },
      })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) return done(null, user);
          else return done(null, false, { message: "Invalid password" });
        })
        .catch((error) => {
          return done(error);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing the user:", user.id);
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});
app.get("/", Scheduler.dashboard);
app.get(
  "/user-dashboard",
  connectEnsureLogin.ensureLoggedIn(),
  Scheduler.getUserDashboard
);
app.get("/signup", Scheduler.signup);
app.get("/login", Scheduler.getSignin);
app.get("/signout", Scheduler.getSignout);
app.post(
  "/logSession",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),
  Scheduler.getLogSession
);
app.get(
  "/create-sport",
  connectEnsureLogin.ensureLoggedIn(),
  Scheduler.getCreateSport
);
app.post(
  "/create-sport",
  connectEnsureLogin.ensureLoggedIn(),
  Scheduler.createSport
);
app.get(
  "/allSports",
  connectEnsureLogin.ensureLoggedIn(),
  Scheduler.getAllSports
);
app.get(
  "/create-session/:sportId",
  connectEnsureLogin.ensureLoggedIn(),
  Scheduler.getCreateSession
);
app.post(
  "/create-session/:sportId",
  connectEnsureLogin.ensureLoggedIn(),
  Scheduler.createSession
);
app.get(
  "/sessions/:sportId",
  connectEnsureLogin.ensureLoggedIn(),
  Scheduler.displaySessions
);
app.get(
  "/created-sessions",
  connectEnsureLogin.ensureLoggedIn(),
  Scheduler.displayCreatedSessions
);
app.post("/users", Scheduler.addUsers);
app.get("/join-session/:sessionId", Scheduler.getJoinSession);
app.post("/join-session/:sessionId", Scheduler.joinSession);
app.get(
  "/joined-sessions",
  connectEnsureLogin.ensureLoggedIn(),
  Scheduler.displayJoinedSessions
);
app.post("/cancel-session/:sessionId", Scheduler.cancelSession);

app.listen(3000, () => {
  console.log("Started Server at port 3000!");
});
