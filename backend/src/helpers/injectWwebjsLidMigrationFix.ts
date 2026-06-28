import { Client as WbotClient } from "whatsapp-web.js";
import { logger } from "../utils/logger";

/** Mitiga "No LID for user" / falhas de envio em contas migradas para LID. */
export const injectWwebjsLidMigrationFix = async (
  wbot: WbotClient
): Promise<void> => {
  if (!wbot.pupPage) return;

  await wbot.pupPage.evaluate(() => {
    const w = window as any;
    if (w.__izingLidMigrationFix || !w.WWebJS?.injectToFunction) return;

    w.WWebJS.injectToFunction(
      {
        module: "WAWebLid1X1MigrationGating",
        function: "Lid1X1MigrationUtils.isLidMigrated"
      },
      (_module: unknown, func: (...args: unknown[]) => unknown, ...args: unknown[]) => {
        try {
          return func(...args);
        } catch {
          return false;
        }
      }
    );

    w.WWebJS.injectToFunction(
      { module: "WAWebLidMigrationUtils", function: "toUserLid" },
      (_module: unknown, func: (wid: unknown) => unknown, wid: unknown) => {
        try {
          return func(wid);
        } catch {
          return wid;
        }
      }
    );
    w.__izingLidMigrationFix = true;
  });

  const applied = await wbot.pupPage.evaluate(
    () => Boolean((window as any).__izingLidMigrationFix)
  );
  if (applied) {
    logger.info("injectWwebjsLidMigrationFix: LID migration hooks applied");
  }
};

export default injectWwebjsLidMigrationFix;
