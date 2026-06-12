import { QueryTypes } from "sequelize";
import { getWbot } from "../../libs/wbot";
import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import ResolveContactProfilePicUrl from "./ResolveContactProfilePicUrl";
import SendContactVCardToSelf from "./SendContactVCardToSelf";

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const MAX_PROFILE_PIC_SYNC = Number(
  process.env.CONTACT_PIC_SYNC_LIMIT || 40
);

const SyncContactsWhatsappInstanceService = async (
  whatsappId: number,
  tenantId: number
): Promise<void> => {
  const wbot = getWbot(whatsappId);

  let contacts;

  try {
    contacts = await wbot.getContacts();
  } catch (err) {
    logger.error(
      `Could not get whatsapp contacts from phone. Check connection page. | Error: ${err}`
    );
  }

  if (!contacts) {
    throw new AppError("ERR_CONTACTS_NOT_EXISTS_WHATSAPP", 404);
  }

  try {
    const dataArray: Array<{
      name: string;
      number: string;
      tenantId: number;
      profilePicUrl?: string;
      isNew: boolean;
    }> = [];

    let picFetchCount = 0;

    for (const { name, pushname, number, isGroup, id } of contacts) {
      if (!(name || pushname) || isGroup || id.server === "lid") {
        continue;
      }

      const existing = await Contact.findOne({
        where: { number, tenantId }
      });

      let profilePicUrl = existing?.profilePicUrl;
      const needsPhoto =
        !profilePicUrl ||
        profilePicUrl.includes("pps.whatsapp.net") ||
        profilePicUrl.includes("whatsapp.net");

      if (needsPhoto && picFetchCount < MAX_PROFILE_PIC_SYNC) {
        profilePicUrl = await ResolveContactProfilePicUrl(
          tenantId,
          number,
          id._serialized,
          whatsappId
        );
        picFetchCount += 1;
        await sleep(250);
      }

      dataArray.push({
        name: name || pushname,
        number,
        tenantId,
        profilePicUrl,
        isNew: !existing
      });
    }

    if (dataArray.length) {
      const d = new Date().toJSON();

      for (const entry of dataArray) {
        const cleanedName = String(entry.name || "").replace(
          /[^a-zA-Z0-9 ]+/g,
          ""
        );
        const picValue = entry.profilePicUrl
          ? `'${String(entry.profilePicUrl).replace(/'/g, "''")}'`
          : "NULL";

        const query = `INSERT INTO "Contacts" (number, name, "profilePicUrl", "tenantId", "createdAt", "updatedAt")
          VALUES ('${entry.number}', '${cleanedName}', ${picValue}, '${entry.tenantId}', '${d}'::timestamp, '${d}'::timestamp)
          ON CONFLICT (number, "tenantId") DO UPDATE SET
            name = EXCLUDED.name,
            "profilePicUrl" = COALESCE(EXCLUDED."profilePicUrl", "Contacts"."profilePicUrl"),
            "updatedAt" = '${d}'::timestamp`;

        await Contact.sequelize?.query(query, {
          type: QueryTypes.INSERT
        });

        if (entry.isNew) {
          SendContactVCardToSelf(tenantId, entry.number, whatsappId).catch(
            () => undefined
          );
        }
      }
    }
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

export default SyncContactsWhatsappInstanceService;
