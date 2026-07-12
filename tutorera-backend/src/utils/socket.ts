import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import Notification from "../models/Notification.model";

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

  // Auth middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
      socket.data.userId = decoded.id;
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

    // Join a chat conversation room
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${userId} joined conversation ${conversationId}`);
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