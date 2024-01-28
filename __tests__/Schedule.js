/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable comma-dangle */
/* eslint-disable semi */
/* eslint-disable quotes */
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");
const { User, Sport, Session } = require("../models");
let server, agent;
// eslint-disable-next-line space-before-function-paren
function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  const csrfToken = extractCsrfToken(res);
  res = await agent
    .post("/logSession")
    .send({ email: username, password, _csrf: csrfToken });
};
describe("Sports Scheduler test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test("Sign Up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "userA",
      email: "userA@example.com",
      password: "1234",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Sign out", async () => {
    let res = await agent.get("/user-dashboard");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/user-dashboard");
    expect(res.statusCode).toBe(302);
  });
  test("Checks for creating a sport", async () => {
    agent = request.agent(server);
    await login(agent, "userA@example.com", "1234");
    const res = await agent.get("/user-dashboard");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/create-sport").send({
      sport_name: "Football",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(200);
  });
  test("Checks for creating a sesssion", async () => {
    agent = request.agent(server);
    await login(agent, "userA@example.com", "1234");
    let res = await agent.get("/user-dashboard");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/create-sport").send({
      sport_name: "Football",
      _csrf: csrfToken,
    });
    const createdSport = await Sport.findOne({
      where: { sport_name: "Football" },
    });
    const sportId = createdSport.id;
    res = await agent.get("/user-dashboard");
    csrfToken = extractCsrfToken(res);
    const date = "2024-02-01"; // Example date in "YYYY-MM-DD" format
    const time = "18:30:00"; // Example time in "HH:mm:ss" format
    const venue = "Sample Venue";
    const additional_players_needed = 8;
    const available_players = "Ajay, Sujay, Vijay";
    const resp = await agent.post(`/create-session/${sportId}`).send({
      date,
      time,
      venue,
      additional_players_needed,
      available_players,
      _csrf: csrfToken,
    });
    expect(resp.statusCode).toBe(302);
  });
  test("Checks for joining a session", async () => {
    agent = request.agent(server);
    await login(agent, "userA@example.com", "1234");
    let res = await agent.get("/user-dashboard");
    const csrfToken = extractCsrfToken(res);
    const session = await Session.findOne({
      where: { venue: "Sample Venue" },
    });
    res = await agent.post(`/join-session/${session.id}`).send({
      _csrf: csrfToken,
    });
    expect(res.statusCode).toEqual(302);
  });
  test("Check for cancellation of a session", async () => {
    agent = request.agent(server);
    await login(agent, "userA@example.com", "1234");
    let res = await agent.get("/user-dashboard");
    const csrfToken = extractCsrfToken(res);
    const session = await Session.findOne({ where: { venue: "Sample Venue" } });
    res = await agent.post(`/cancel-session/${session.id}`).send({
      cancellation_reason: "Session abonded due to rain",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
});
