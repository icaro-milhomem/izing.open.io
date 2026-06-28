import { Client as WbotClient } from "whatsapp-web.js";
import ensureWbotClientInfo from "./ensureWbotClientInfo";
import injectWwebjsLidMigrationFix from "./injectWwebjsLidMigrationFix";

export type PatchedSession = WbotClient & {
  id?: number;
  izingPatchesApplied?: boolean;
};

/** Patches mínimos — sem override de remetente (causava ack=0). */
export const ensureWbotPatches = async (
  wbot: PatchedSession
): Promise<void> => {
  if (wbot.izingPatchesApplied || !wbot.pupPage) {
    return;
  }

  await ensureWbotClientInfo(wbot);
  await injectWwebjsLidMigrationFix(wbot);
  wbot.izingPatchesApplied = true;
};

export default ensureWbotPatches;
