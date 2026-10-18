import http, { Server as HttpServer } from "http";
import type { AddressInfo } from "net";
import { io as socketClient, Socket as ClientSocket } from "socket.io-client";
import app from "../app";
import { initSocket } from "../utils/socket";
import User from "../models/User.model";
import Booking from "../models/Booking.model";
import Conversation from "../models/Conversation.model";
import { generateToken } from "../utils/generateToken";

let seq = 0;
function uniqueEmail(kind: string) {
  return `guardian-realtime-${kind}-${Date.now()}-${++seq}@example.test`;
}

function connectSocket(baseUrl: string, id: string, role: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const client = socketClient(baseUrl, {
      auth: { token: generateToken(id, role) },
      transports: ["websocket"],
      reconnection: false,
      timeout: 4000,
      forceNew: true,
    });
    const timeout = setTimeout(() => { client.disconnect(); reject(new Error("Socket did not connect")); }, 5000);
    client.once("connect", () => { clearTimeout(timeout); resolve(client); });
    client.once("connect_error", (err) => { clearTimeout(timeout); client.disconnect(); reject(err); });
  });
}

function joinConversation(socket: ClientSocket, conversationId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.timeout(3500).emit("join_conversation", conversationId,
      (error: Error | null, result: { ok: boolean; error?: string }) => {
        if (error || !result?.ok) reject(error || new Error(result?.error || "Join denied"));
        else resolve();
      });
  });
}

describe("guardian revocation for existing realtime sockets", () => {
  let server: HttpServer;
  let clients: ClientSocket[] = [];
  let socketServer: ReturnType<typeof initSocket>;
  let url: string;

  beforeEach(async () => {
    server = http.createServer(app);
    socketServer = initSocket(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as AddressInfo;
    url = `http://127.0.0.1:${address.port}`;
    clients = [];
    process.env.JWT_SECRET = "test-secret-at-least-16-chars";
  });

  afterEach(async () => {
    clients.forEach(client => client.disconnect());
    await new Promise<void>((resolve) => socketServer.close(() => resolve()));
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("disconnects an already connected minor before broadcasting a typing event after guardian approval is revoked", async () => {
    const student = await User.create({
      name: "Approved Student", email: uniqueEmail("student"), role: "student",
      password: "password123", isMinor: true, parentConsentVerified: true,
    });
    const tutor = await User.create({
      name: "Tutor", email: uniqueEmail("tutor"), role: "tutor", password: "password123",
    });
    const booking = await Booking.create({
      student: student._id, tutor: tutor._id, amount: 1000, finalAgreedRate: 1000,
      subtotal: 1000, studentTotal: 1000, tutorNet: 800,
      feeConfig: { version: "test" }, schedule: "Monday", teachingMode: "online",
      paymentStatus: "confirmed",
    });
    const conversation = await Conversation.create({
      student: student._id, tutor: tutor._id, booking: booking._id,
    });

    const studentClient = await connectSocket(url, student._id.toString(), "student");
    clients.push(studentClient);
    const tutorClient = await connectSocket(url, tutor._id.toString(), "tutor");
    clients.push(tutorClient);
    await joinConversation(studentClient, conversation._id.toString());
    await joinConversation(tutorClient, conversation._id.toString());

    let typingCount = 0;
    tutorClient.on("user_typing", () => { typingCount++; });
    studentClient.emit("typing", { conversationId: conversation._id.toString(), isTyping: true });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Typing did not arrive before revocation")), 3000);
      tutorClient.once("user_typing", () => { clearTimeout(timeout); resolve(); });
    });
    expect(typingCount).toBe(1);

    await User.updateOne({ _id: student._id }, { $set: { parentConsentVerified: false } });
    const disconnected = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Revoked session remained connected")), 3000);
      studentClient.once("disconnect", () => { clearTimeout(timeout); resolve(); });
    });
    studentClient.emit("typing", { conversationId: conversation._id.toString(), isTyping: false });
    await disconnected;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(typingCount).toBe(1);
  });

  it("rejects a fresh realtime connection from a student awaiting guardian consent", async () => {
    const minor = await User.create({
      name: "Unapproved Student", email: uniqueEmail("pending"), role: "student",
      password: "password123", isMinor: true, parentConsentVerified: false,
    });
    await expect(connectSocket(url, minor._id.toString(), "student"))
      .rejects.toThrow(/guardian approval/i);
  });
});
