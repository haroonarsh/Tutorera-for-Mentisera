import { Response } from "express";
import { AuthRequest } from "../types";
import EmailTemplate from "../models/EmailTemplate.model";
import { logAudit } from "../utils/logAudit";

const extractVariables = (text: string): string[] => {
  const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const matches = text.matchAll(regex);
  return [...new Set([...matches].map((m) => m[1]))];
};

export const listEmailTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, isActive } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (typeof isActive !== "undefined") filter.isActive = isActive === "true";

    const templates = await EmailTemplate.find(filter).sort({ category: 1, name: 1 }).lean();
    res.json({ success: true, templates });
  } catch (error) {
    console.error("Error listing email templates:", error);
    res.status(500).json({ success: false, message: "Failed to list email templates" });
  }
};

export const getEmailTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) {
      res.status(404).json({ success: false, message: "Email template not found" });
      return;
    }
    res.json({ success: true, template });
  } catch (error) {
    console.error("Error getting email template:", error);
    res.status(500).json({ success: false, message: "Failed to get email template" });
  }
};

export const createEmailTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, name, subject, htmlBody, textBody, category, description } = req.body;

    if (!key || !name || !subject || !htmlBody || !category) {
      res.status(400).json({
        success: false,
        message: "Key, name, subject, htmlBody, and category are required",
      });
      return;
    }

    const existing = await EmailTemplate.findOne({ key: key.toUpperCase() });
    if (existing) {
      res.status(400).json({ success: false, message: "Email template with this key already exists" });
      return;
    }

    const variables = extractVariables(htmlBody + (textBody || ""));

    const template = await EmailTemplate.create({
      key: key.toUpperCase(),
      name,
      description,
      subject,
      htmlBody,
      textBody,
      variables,
      category,
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    });

    await logAudit({
      action: "email_template_created",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "EmailTemplate",
      targetId: template._id.toString(),
      targetName: template.key,
      metadata: { category, variables },
    });

    res.status(201).json({ success: true, template });
  } catch (error) {
    console.error("Error creating email template:", error);
    res.status(500).json({ success: false, message: "Failed to create email template" });
  }
};

export const updateEmailTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, subject, htmlBody, textBody, category, description, isActive } = req.body;

    const variables = extractVariables(htmlBody + (textBody || ""));

    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      {
        name,
        subject,
        htmlBody,
        textBody,
        category,
        description,
        isActive,
        variables,
        updatedBy: req.user?._id,
      },
      { new: true, runValidators: true }
    );

    if (!template) {
      res.status(404).json({ success: false, message: "Email template not found" });
      return;
    }

    await logAudit({
      action: "email_template_updated",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "EmailTemplate",
      targetId: template._id.toString(),
      targetName: template.key,
      metadata: { category, variables },
    });

    res.json({ success: true, template });
  } catch (error) {
    console.error("Error updating email template:", error);
    res.status(500).json({ success: false, message: "Failed to update email template" });
  }
};

export const deleteEmailTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      res.status(404).json({ success: false, message: "Email template not found" });
      return;
    }

    await logAudit({
      action: "email_template_deleted",
      actor: req.user?.name,
      actorId: req.user?._id?.toString(),
      entity: "EmailTemplate",
      targetId: template._id.toString(),
      targetName: template.key,
    });

    res.json({ success: true, message: "Email template deleted successfully" });
  } catch (error) {
    console.error("Error deleting email template:", error);
    res.status(500).json({ success: false, message: "Failed to delete email template" });
  }
};

export const getEmailTemplateCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await EmailTemplate.distinct("category").sort();
    res.json({ success: true, categories });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({ success: false, message: "Failed to get categories" });
  }
};

export const testEmailTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, variables } = req.body;

    const template = await EmailTemplate.findById(id);
    if (!template) {
      res.status(404).json({ success: false, message: "Email template not found" });
      return;
    }

    let htmlBody = template.htmlBody;
    let textBody = template.textBody || "";

    Object.entries(variables || {}).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      htmlBody = htmlBody.replace(regex, String(value));
      textBody = textBody.replace(regex, String(value));
    });

    res.json({
      success: true,
      preview: {
        subject: template.subject,
        htmlBody,
        textBody,
      },
    });
  } catch (error) {
    console.error("Error testing email template:", error);
    res.status(500).json({ success: false, message: "Failed to test email template" });
  }
};
