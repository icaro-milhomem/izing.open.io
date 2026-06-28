const sendLocks = new Map<number, Promise<void>>();

/** Serializa envios na mesma sessão WhatsApp (evita corrida no browser). */
export const withWbotSendLock = async <T>(
  whatsappId: number,
  fn: () => Promise<T>
): Promise<T> => {
  while (sendLocks.has(whatsappId)) {
    await sendLocks.get(whatsappId);
  }

  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  sendLocks.set(whatsappId, gate);

  try {
    return await fn();
  } finally {
    sendLocks.delete(whatsappId);
    release();
  }
};

export default withWbotSendLock;
