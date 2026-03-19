// services/TranslationService.js
import { prisma } from "../app.js";
import { prisma } from "../prisma/client.js";

export class TranslationService {
  static async t(key, lang = "en") {
    // Uses the named compound unique @@unique([key, lang], name: "key_lang")
    const row = await prisma.translation.findUnique({
      where: { key_lang: { key, lang } }
    }).catch(() => null);

    return row?.text ?? key;
  }

  static async instruction(kind, lang, vars = {}) {
    // Uses @@unique([lang, kind], name: "lang_kind")
    const row = await prisma.instructionTemplate.findUnique({
      where: { lang_kind: { lang, kind } }
    }).catch(() => null);

    let out = (row?.template ?? `{${kind}}`);
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
  }
}
