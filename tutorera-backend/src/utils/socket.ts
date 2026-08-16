import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Notification from "../models/Notification.model";
import Conversation from "../models/Conversation.model";
import User from "../models/User.model";

interface ConnectedUsers {
  [userId: string]: string; // userId -> socketId
}

const connectedUsers: ConnectedUsers = {};

export const initSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Auth middleware — verify token AND confirm the user still exists and is active
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

      const user = await User.findById(decoded.id).select("isActive role");
      if (!user) return next(new Error("User no longer exists"));
      if (!user.isActive) return next(new Error("Account is deactivated"));

      socket.data.userId = decoded.id;
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    connectedUsers[userId] = socket.id;
    console.log(`✅ User connected: ${userId}`);

    // Join personal room for notifications
    socket.join(userId);

    // Join a chat conversation room — only if the user is a real participant
    socket.on("join_conversation", async (conversationId: string, callback?: (res: { ok: boolean; error?: string }) => void) => {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        if (callback) callback({ ok: false, error: "Invalid conversation ID" });
        return;
      }

      try {
        const conversation = await Conversation.findById(conversationId).select("student tutor");
        if (!conversation) {
          if (callback) callback({ ok: false, error: "Conversation not found" });
          return;
        }

        const isParticipant =
          conversation.student.toString() === userId ||
          conversation.tutor.toString() === userId;

        if (!isParticipant) {
          if (callback) callback({ ok: false, error: "Not authorized to join this conversation" });
          return;
        }

        socket.join(conversationId);
        console.log(`User ${userId} joined conversation ${conversationId}`);
        if (callback) callback({ ok: true });
      } catch (err) {
        console.error("Error joining conversation:", err);
        if (callback) callback({ ok: false, error: "Failed to join conversation" });
      }
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(conversationId);
    });

    // Typing indicator
    socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
      socket.to(data.conversationId).emit("user_typing", {
        userId,
        isTyping: data.isTyping,
      });
    });

    socket.on("disconnect", () => {
      delete connectedUsers[userId];
      console.log(`❌ User disconnected: ${userId}`);
    });
  });

  return io;
};

// Send notification to specific user
export const sendNotification = async (
  io: Server,
  userId: string,
  notification: {
    title: string;
    message: string;
    type: "verification" | "bid" | "booking" | "payment" | "general" | "broadcast";
    link?: string;
  }
) => {
  // Save to DB
  const saved = await Notification.create({
    user: userId,
    ...notification,
  });

  // Send real-time if user is connected
  io.to(userId).emit("notification", {
    _id: saved._id,
    title: saved.title,
    message: saved.message,
    type: saved.type,
    link: saved.link,
    isRead: false,
    createdAt: saved.createdAt,
  });
};