export type PresetLanguage = 'en' | 'uk' | 'ru'

export const VOICE_PRESET_TEXTS: Record<PresetLanguage, string> = {
  // Treasure Island — Robert Louis Stevenson, 1883
  en:
    'I remember him as if it were yesterday, as he came plodding to the inn door, his sea-chest ' +
    'following behind him in a hand-barrow — a tall, strong, heavy, nut-brown man, his tarry ' +
    'pigtail falling over the shoulder of his soiled blue coat, his hands ragged and scarred, ' +
    'with black, broken nails, and the sabre cut across one cheek, a dirty, livid white.',
  // Тіні забутих предків — Михайло Коцюбинський, 1912
  uk:
    'Вони жили в глибокому, як криниця, селі, засипаному білим снігом. Воно було таке ' +
    'маленьке те село, що навіть чорти його не завжди знаходили. Не було де розгорнутись. ' +
    'Гори стояли навколо нього, неприступні, вкриті лісом. Вони підпирали небо, і тільки ' +
    'над самим селом воно було відкрите, щоб міг Бог заглянути в цю дивну долину.',
  // Степь — Антон Чехов, 1888
  ru:
    'Из-за холмов неожиданно показалось пепельно-серое кудрявое облако. Оно переглянулось ' +
    'со степью — я, мол, готово — и нахмурилось. Вдруг в стоячем воздухе что-то порвалось, ' +
    'сильно рванул ветер и с шумом, со свистом закружился по степи. Тотчас же трава и прошлогодний ' +
    'бурьян подняли ропот, на дороге спирально закружилась пыль, побежала по степи и, увлекая ' +
    'за собой солому, стрекоз и перья, чёрным вертящимся столбом поднялась к небу и затуманила солнце.',
}

export const isPresetLanguage = (language: string): language is PresetLanguage =>
  language in VOICE_PRESET_TEXTS
