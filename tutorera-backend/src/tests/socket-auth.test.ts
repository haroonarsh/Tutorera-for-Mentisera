// src/tests/socket-auth.test.ts
//
// Covers BE-03 (WebSocket room authorization bypass) from the audit: an
// authenticated user must not be able to join an arbitrary conversation
// room just by knowing its ID — only real participants (student or tutor
// on that conversation) may join. This spins up a real HTTP server +
// Socket.io instance and connects real socket.io-client sockets to it,
// since this behavior can't be exercised through plain HTTP requests.

import http from "http";
import { AddressInfo } from "net";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import jwt from "jsonwebtoken";
import { initSocket } from "../utils/socket";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import Conversation from "../models/Conversation.model";

let httpServer: http.Server;
let port: number;

beforeAll((done) => {
  process.env.JWT_SECRET = "test-secret-at-least-16-chars";
  httpServer = http.createServer();
  initSocket(httpServer);
  httpServer.listen(() => {
    port = (httpServer.address() as AddressInfo).port;
    done();
  });
});

afterAll((done) => {
  httpServer.close(() => done());
});

function connectAs(userId: string): Promise<ClientSocket> {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: "1h" });
  const socket = ioClient(`http://localhost:${port}`, {
    auth: { token },
    transports: ["websocket"],
    forceNew: true,
  });
  return new Promise((resolve, reject) => {
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

describe("BE-03: Socket.IO conversation room authorization", () => {
  it("rejects connection with no auth token", async () => {
    const socket = ioClient(`http://localhost:${port}`, {
      transports: ["websocket"],
      forceNew: true,
    });

    await new Promise<void>((resolve, reject) => {
      socket.on("connect", () => reject(new Error("Should not have connected without a token")));
      socket.on("connect_error", () => resolve());
    });

    socket.close();
  });

  it("a real conversation participant CAN join their own conversation room", async () => {
    const student = await User.create({ name: "Student", email: "socket-student@test.com", password: "password123", role: "student", isActive: true });
    const tutor = await User.create({ name: "Tutor", email: "socket-tutor@test.com", password: "password123", role: "tutor", isActive: true });
    const conversation = await Conversation.create({
      student: student._id,
      tutor: tutor._id,
      booking: (await Booking.create({ student: student._id, tutor: tutor._id, amount: 1000, schedule: "Mon 5pm" }))._id,
    });

    const socket = await connectAs(student._id.toString());

    const result = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      socket.emit("join_conversation", conversation._id.toString(), resolve);
    });

    expect(result.ok).toBe(true);
    socket.close();
  });

  it("an authenticated user who is NOT a participant cannot join the conversation room", async () => {
    const student = await User.create({ name: "Student2", email: "socket-student2@test.com", password: "password123", role: "student", isActive: true });
    const tutor = await User.create({ name: "Tutor2", email: "socket-tutor2@test.com", password: "password123", role: "tutor", isActive: true });
    const outsider = await User.create({ name: "Outsider", email: "socket-outsider@test.com", password: "password123", role: "student", isActive: true });
    const conversation = await Conversation.create({
      student: student._id,
      tutor: tutor._id,
      booking: (await Booking.create({ student: student._id, tutor: tutor._id, amount: 1200, schedule: "Tue 6pm" }))._id,
    });

    const socket = await connectAs(outsider._id.toString());

    const result = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      socket.emit("join_conversation", conversation._id.toString(), resolve);
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not authorized/i);
    socket.close();
  });

  it("rejects an invalid (non-ObjectId) conversation ID instead of crashing", async () => {
    const student = await User.create({ name: "Student3", email: "socket-student3@test.com", password: "password123", role: "student", isActive: true });
    const socket = await connectAs(student._id.toString());

    const result = await new Promise<{ ok: boolean; error?: string }>((resolve) => {
      socket.emit("join_conversation", "not-a-valid-id", resolve);
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid/i);
    socket.close();
  });

  it("a suspended (isActive: false) user cannot even establish a socket connection", async () => {
    const suspended = await User.create({ name: "Suspended", email: "socket-suspended@test.com", password: "password123", role: "student", isActive: false });

    await expect(connectAs(suspended._id.toString())).rejects.toBeDefined();
  });
});