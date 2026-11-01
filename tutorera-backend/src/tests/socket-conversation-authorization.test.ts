import { createServer, Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { AddressInfo } from "net";
import { io as connectClient, Socket as ClientSocket } from "socket.io-client";
import { Server as IOServer } from "socket.io";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import Conversation from "../models/Conversation.model";
import { initSocket } from "../utils/socket";

beforeAll(() => { process.env.JWT_SECRET = "test-secret-at-least-16-chars"; });
let counter = 0;
async function createActor(role: "student" | "tutor", isMinor = false, consent = true) {
  return User.create({
    name: "Socket Test User",
    email: `socket-guardian-${Date.now()}-${++counter}@example.test`,
    password: "password123", role, isMinor, parentConsentVerified: consent,
  });
}

function token(id: string, role: string) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

describe("realtime safeguarding: only authorized conversation members can emit typing", () => {
  let server: HttpServer;
  let io: IOServer;
  let clients: ClientSocket[];

  beforeEach(async () => {
    server = createServer();
    io = initSocket(server);
    clients = [];
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
  });

  afterEach(async () => {
    for (const client of clients) client.disconnect();
    await new Promise<void>(resolve => io.close(() => resolve()));
    if (server.listening) await new Promise<void>(resolve => server.close(() => resolve()));
  });

  async function clientFor(user: { _id: any; role: string }) {
    const address = server.address() as AddressInfo;
    const socket = connectClient(`http://127.0.0.1:${address.port}`, {
      transports: ["websocket"],
      auth: { token: token(user._id.toString(), user.role) },
      forceNew: true,
      reconnection: false,
      timeout: 4000,
    });
    clients.push(socket);
    await new Promise<void>((resolve, reject) => {
      socket.once("connect", () => resolve());
      socket.once("connect_error", reject);
    });
    return socket;
  }

  it("ignores nonparticipants' typing events, even if they guess a valid conversation ID", async () => {
    const student = await createActor("student");
    const tutor = await createActor("tutor");
    const outsider = await createActor("student");
    const booking = await Booking.create({
      student: student._id, tutor: tutor._id, amount: 1200,
      finalAgreedRate: 1200, subtotal: 1200, studentTotal: 1200,
      tutorNet: 950, feeConfig: { version: "socket-test" },
      schedule: "Monday", paymentStatus: "confirmed",
    });
    const conversation = await Conversation.create({
      student: student._id, tutor: tutor._id, booking: booking._id,
    });
    const id = conversation._id.toString();
    const tutorSocket = await clientFor(tutor);
    const studentSocket = await clientFor(student);
    const outsiderSocket = await clientFor(outsider);

    const joinTutor = await new Promise<{ ok: boolean }>(resolve => tutorSocket.emit("join_conversation", id, resolve));
    expect(joinTutor.ok).toBe(true);
    const outsiderJoin = await new Promise<{ ok: boolean }>(resolve => outsiderSocket.emit("join_conversation", id, resolve));
    expect(outsiderJoin.ok).toBe(false);

    const received: { userId: string; isTyping: boolean }[] = [];
    tutorSocket.on("user_typing", event => received.push(event));
    outsiderSocket.emit("typing", { conversationId: id, isTyping: true });
    await new Promise(resolve => setTimeout(resolve, 90));
    expect(received).toHaveLength(0);

    const joinStudent = await new Promise<{ ok: boolean }>(resolve => studentSocket.emit("join_conversation", id, resolve));
    expect(joinStudent.ok).toBe(true);
    const authorizedEvent = new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Authorized typing event not delivered")), 2000);
      tutorSocket.once("user_typing", event => { clearTimeout(timeout); resolve(event); });
    });
    studentSocket.emit("typing", { conversationId: id, isTyping: true });
    expect(await authorizedEvent).toMatchObject({ userId: student._id.toString(), isTyping: true });
  });

  it("rejects Socket.IO connections from unapproved minor accounts despite valid JWTs", async () => {
    const minor = await createActor("student", true, false);
    const address = server.address() as AddressInfo;
    const socket = connectClient(`http://127.0.0.1:${address.port}`, {
      transports: ["websocket"], forceNew: true, reconnection: false,
      auth: { token: token(minor._id.toString(), "student") },
      timeout: 4000,
    });
    clients.push(socket);
    const error = await new Promise<Error>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Unapproved minor unexpectedly connected")), 2500);
      socket.once("connect_error", err => { clearTimeout(timeout); resolve(err); });
      socket.once("connect", () => { clearTimeout(timeout); reject(new Error("Unapproved minor connected")); });
    });
    expect(error.message).toMatch(/Guardian approval is required/i);
  });
});
