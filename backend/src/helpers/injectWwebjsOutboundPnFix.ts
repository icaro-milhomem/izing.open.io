import { Client as WbotClient } from "whatsapp-web.js";
import { logger } from "../utils/logger";

/**
 * wwebjs usa lidUser como remetente em chats @lid. Em linked devices isso gera ack=0.
 * Forçamos meUser (@c.us) em chats 1:1 — callback roda no browser, sem async/await.
 */
export const injectWwebjsOutboundPnFix = async (
  wbot: WbotClient
): Promise<void> => {
  if (!wbot.pupPage) return;

  await wbot.pupPage.evaluate(() => {
    const w = window as any;
    const orig = w.WWebJS?.sendMessage;
    if (!orig || orig.__izingPnPatched || w.__izingOutboundPnFix) return;

    const wrapped = function sendMessagePnFix(
      chat: any,
      content: any,
      options?: Record<string, unknown>
    ) {
      const opts = options || {};
      const chatIdObj = chat?.id;
      let origIsLid: (() => boolean) | undefined;

      const isGroup =
        typeof chatIdObj?.isGroup === "function" && chatIdObj.isGroup();

      if (
        !isGroup &&
        chatIdObj &&
        typeof chatIdObj.isLid === "function" &&
        chatIdObj.isLid()
      ) {
        origIsLid = chatIdObj.isLid.bind(chatIdObj);
        chatIdObj.isLid = function isLidPnOverride() {
          return false;
        };
      }

      const restore = () => {
        if (origIsLid) chatIdObj.isLid = origIsLid;
      };

      return Promise.resolve(orig.call(w.WWebJS, chat, content, opts)).then(
        (result: unknown) => {
          restore();
          return result;
        },
        (error: unknown) => {
          restore();
          if (!origIsLid) {
            throw error;
          }
          return orig.call(w.WWebJS, chat, content, opts);
        }
      );
    };

    wrapped.__izingPnPatched = true;
    w.WWebJS.sendMessage = wrapped;
    w.__izingOutboundPnFix = true;
  });

  const applied = await wbot.pupPage.evaluate(
    () => Boolean((window as any).__izingOutboundPnFix)
  );
  if (applied) {
    logger.info("injectWwebjsOutboundPnFix: sendMessage patched for 1:1 LID chats");
  }
};

export default injectWwebjsOutboundPnFix;
