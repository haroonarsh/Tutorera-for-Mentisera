import { Response } from "express";
import { AuthRequest } from "../types";
import Conversation from "../models/Conversation.model";
import Message from "../models/Message.model";
import Booking from "../models/Booking.model";
import { filterContactInfo, containsContactInfo } from "../utils/contentFilter";
import { sendNotification } from "../utils/socket";
import { Types } from "mongoose";

// @desc    Get or create conversation
// @route   POST /api/chat/conversation
// @access  Private
export const getOrCreateConversation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { bookingId } = req.body;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  // Verify booking exists and user is part of it
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404).json({ success: false, message: "Booking not found" });
    return;
  }

  const isStudent = booking.student.toString() === userId?.toString();
  const isTutor = booking.tutor.toString() === userId?.toString();

  if (!isStudent && !isTutor) {
    res.status(403).json({ success: false, message: "Not authorized" });
    return;
  }

  // Find existing conversation
  let conversation = await Conversation.findOne({ booking: bookingId })
    .populate("student", "name avatar")
    .populate("tutor", "name avatar");

  // Create if not exists
  if (!conversation) {
    conversation = await Conversation.create({
      student: booking.student,
      tutor: booking.tutor,
      booking: bookingId,
    });
    await conversation.populate("student", "name avatar");
    await conversation.populate("tutor", "name avatar");
  }

  // Reset unread count for current user
  if (isStudent) {
    await Conversation.findByIdAndUpdate(conversation._id, { studentUnread: 0 });
  } else {
    await Conversation.findByIdAndUpdate(conversation._id, { tutorUnread: 0 });
  }

  res.status(200).json({ success: true, conversation });
};

// @desc    Get my conversations
// @route   GET /api/chat/conversations
// @access  Private
export const getMyConversations = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const userId = req.user?._id;
  const role = req.user?.role;

  const filter = role === "student"
    ? { student: userId }
    : { tutor: userId };

  const conversations = await Conversation.find(filter)
    .populate("student", "name avatar")
    .populate("tutor", "name avatar")
    .populate("booking", "amount status schedule")
    .sort("-lastMessageAt");

  res.status(200).json({ success: true, conversations });
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/:conversationId/messages
// @access  Private
export const getMessages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { conversationId } = req.params;
  const userId = req.user?._id;

  // Verify user is part of conversation
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404).json({ success: false, message: "Conversation not found" });
    return;
  }

  const isParticipant =
    conversation.student.toString() === userId?.toString() ||
    conversation.tutor.toString() === userId?.toString();

  if (!isParticipant) {
    res.status(403).json({ success: false, message: "Not authorized" });
    return;
  }

  const messages = await Message.find({ conversation: conversationId })
    .populate("sender", "name avatar")
    .sort("createdAt");

  // Mark messages as read
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, isRead: false },
    { isRead: true }
  );

  res.status(200).json({ success: true, messages });
};

// @desc    Send a message
// @route   POST /api/chat/:conversationId/messages
// @access  Private
export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const conversationId = req.params.conversationId as string;
  const { content } = req.body;
  const userId = req.user?._id;

  if (!content?.trim()) {
    res.status(400).json({ success: false, message: "Message cannot be empty" });
    return;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    res.status(404).json({ success: false, message: "Conversation not found" });
    return;
  }

  const isStudent = conversation.student.toString() === userId?.toString();
  const isTutor = conversation.tutor.toString() === userId?.toString();

  if (!isStudent && !isTutor) {
    res.status(403).json({ success: false, message: "Not authorized" });
    return;
  }

  const filteredContent = filterContactInfo(content);
  const wasFiltered = filteredContent !== content;

  // Fix 1 — cast conversationId to Types.ObjectId
  const message = await Message.create({
    conversation: new Types.ObjectId(conversationId),
    sender: new Types.ObjectId(userId?.toString()),
    content: filteredContent,
  }) as InstanceType<typeof Message>;

  // Fix 2 — cast message type so populate and _id work
  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "name avatar") as InstanceType<typeof Message>;

  const updateData: Record<string, unknown> = {
    lastMessage: filteredContent.substring(0, 100),
    lastMessageAt: new Date(),
  };

  if (isStudent) {
    updateData.tutorUnread = conversation.tutorUnread + 1;
  } else {
    updateData.studentUnread = conversation.studentUnread + 1;
  }

  await Conversation.findByIdAndUpdate(conversationId, updateData);

  const io = req.app.get("io");
  io.to(conversationId).emit("new_message", {
    _id: populatedMessage._id,
    conversation: conversationId,
    sender: { _id: userId, name: req.user?.name, avatar: req.user?.avatar },
    content: filteredContent,
    isRead: false,
    createdAt: populatedMessage.createdAt,
    wasFiltered,
  });

  const recipientId = isStudent
    ? conversation.tutor.toString()
    : conversation.student.toString();

  await sendNotification(io, recipientId, {
    title: `💬 New Message from ${req.user?.name}`,
    message: filteredContent.substring(0, 60) + (filteredContent.length > 60 ? "..." : ""),
    type: "general",
    link: `/chat/${conversationId}`,
  });

  res.status(201).json({
    success: true,
    message: populatedMessage,
    wasFiltered,
  });
};