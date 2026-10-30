import http from "http";
import type { AddressInfo } from "net";
import { io as client } from "socket.io-client";
import jwt from "jsonwebtoken";
import User from "../models/User.model";
import { initSocket } from "../utils/socket";

describe("native Worker Socket.IO polling compatibility", () => {
  it("authenticates and delivers events without a WebSocket upgrade", async () => {
    const user = await User.create({ name: "Polling tutor", email: "polling@test.com", password: "password123", role: "tutor", isActive: true });
    const server = http.createServer();
    const io = initSocket(server, { pollingOnly: true });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = (server.address() as AddressInfo).port;
    const socket = client(`http://127.0.0.1:${port}`, {
      transports: ["polling"], upgrade: false, forceNew: true,
      auth: { token: jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET!) },
    });
    try {
      await new Promise<void>((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject); });
      expect(socket.io.engine.transport.name).toBe("polling");
      const delivered = new Promise((resolve) => socket.once("notification", resolve));
      io.to(user._id.toString()).emit("notification", { title: "Native transport" });
      expect(await delivered).toEqual({ title: "Native transport" });
    } finally {
      socket.disconnect();
      await new Promise<void>((resolve) => io.close(() => resolve()));
    }
  });
});
