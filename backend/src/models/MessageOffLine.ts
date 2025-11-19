import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  Default,
  BelongsTo,
  ForeignKey,
  AutoIncrement
} from "sequelize-typescript";
import Contact from "./Contact";
import Message from "./Message";
import Ticket from "./Ticket";
import User from "./User";

@Table({ freezeTableName: true })
class MessagesOffLine extends Model<MessagesOffLine> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Default(0)
  @Column
  ack: number;

  @Default(false)
  @Column
  read: boolean;

  @Default(false)
  @Column
  fromMe: boolean;

  @Column(DataType.TEXT)
  body: string;

  @Column(DataType.VIRTUAL)
  get mediaName(): string | null {
    return this.getDataValue("mediaUrl");
  }

  @Column(DataType.STRING)
  get mediaUrl(): string | null {
    if (this.getDataValue("mediaUrl")) {
      const { BACKEND_URL, PORT } = process.env;
      const value = this.getDataValue("mediaUrl");
      // Usar PORT (porta real do servidor) ao invés de PROXY_PORT
      const port = PORT || '3100';
      // Extrair apenas o protocolo e host do BACKEND_URL, ignorando porta antiga
      let baseUrl = BACKEND_URL || 'http://localhost';
      // Remover porta se existir e adicionar a porta correta
      if (baseUrl.includes('://')) {
        const urlParts = baseUrl.split('://');
        const hostParts = urlParts[1].split(':');
        baseUrl = `${urlParts[0]}://${hostParts[0]}:${port}`;
      } else {
        baseUrl = `${baseUrl}:${port}`;
      }
      return `${baseUrl}/public/${value}`;
    }
    return null;
  }

  @Column
  mediaType: string;

  @Default(false)
  @Column
  isDeleted: boolean;

  @CreatedAt
  @Column(DataType.DATE(6))
  createdAt: Date;

  @UpdatedAt
  @Column(DataType.DATE(6))
  updatedAt: Date;

  @ForeignKey(() => Message)
  @Column
  quotedMsgId: string;

  @BelongsTo(() => Message, "quotedMsgId")
  quotedMsg: Message;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact, "contactId")
  contact: Contact;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  tableName: "MessagesOffLine";
}

export default MessagesOffLine;
