import { Request, Response } from "express";
import User from "../models/User";
import InternalMessage from "../models/InternalMessage";
import { getIO } from "../libs/socket";
import { Op } from "sequelize";

export const index = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const messages = await InternalMessage.findAll({
      where: {
        [Op.or]: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id }
        ]
      },
      order: [["createdAt", "ASC"]],
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name"]
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "name"]
        }
      ]
    });
    
    const messagesWithSenderName = messages.map(msg => {
      const json = msg.toJSON();
      return {
        ...json,
        senderName: (msg as any).sender?.name || 'Atendente'
      };
    });
    
    return res.json(messagesWithSenderName);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao carregar mensagens" });
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { receiverId, message } = req.body;
    
    const internalMessage = await InternalMessage.create({
      senderId: req.user.id,
      receiverId,
      message
    });
    
    const messageWithUser = await InternalMessage.findByPk(internalMessage.id, {
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name"]
        },
        {
          model: User,
          as: "receiver",
          attributes: ["id", "name"]
        }
      ]
    });
    
    if (messageWithUser) {
      const json = messageWithUser.toJSON();
      getIO().emit(`${req.user.tenantId}:internal_message:${receiverId}`, {
        type: "internal_message",
        ...json,
        senderName: (messageWithUser as any).sender?.name || 'Atendente'
      });
      return res.json({
        ...json,
        senderName: (messageWithUser as any).sender?.name || 'Atendente'
      });
    }
    return res.status(500).json({ error: "Erro ao enviar mensagem" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    
    await InternalMessage.update(
      { read: true },
      {
        where: {
          senderId: userId,
          receiverId: req.user.id,
          read: false
        }
      }
    );
    
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao marcar mensagens como lidas" });
  }
}; 