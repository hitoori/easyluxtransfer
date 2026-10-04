// Display names only: route identifiers and submitted addresses stay unchanged.
export const destinationTranslations: Record<string, string> = Object.fromEntries(`
Treviso¦Тревизо
Treviso TV¦Тревизо TV
Mestre¦Местре
Mestre VE¦Местре VE
Chioggia¦Кьоджа
Chioggia VE¦Кьоджа VE
Padova¦Падуя
Padova PD¦Падуя PD
Cortina d’Ampezzo¦Кортина-д’Ампеццо
Verona¦Верона
Verona VR¦Верона VR
Corvara¦Корвара
Corvara BZ¦Корвара BZ
Canazei¦Канацеи
Canazei BZ¦Канацеи BZ
Ortisei¦Ортизеи
Ortisei BZ¦Ортизеи BZ
Lido di Jesolo¦Лидо-ди-Езоло
Lido di Jesolo VE¦Лидо-ди-Езоло VE
Cavallino-Treporti¦Каваллино-Трепорти
Cavallino Treporti¦Каваллино-Трепорти
Cavallino-Treporti VE¦Каваллино-Трепорти VE
Bolzano¦Больцано
Bolzano BZ¦Больцано BZ
Caorle¦Каорле
Caorle VE¦Каорле VE
Trento¦Тренто
Abano Terme¦Абано-Терме
Abano Terme PD¦Абано-Терме PD
Adria¦Адрия
Albarella¦Альбарелла
Alleghe¦Аллеге
Alleghe BL¦Аллеге BL
Alpe di Siusi¦Альпе-ди-Сьюзи
Conegliano¦Конельяно
Conegliano TV¦Конельяно TV
Alta Badia¦Альта-Бадия
Arabba¦Арабба
Bardolino¦Бардолино
Valdobbiadene¦Вальдоббьядене
Jesolo¦Езоло
Marco Polo¦Марко Поло
Bibione¦Бибионе
Lignano Sabbiadoro¦Линьяно-Саббьядоро
Lignano¦Линьяно
Sabbiadoro¦Саббьядоро
Fusina Cruise Terminal¦Круизный терминал Фузина
Ravenna¦Равенна
Trieste¦Триест
Fusina¦Фузина
`.trim().split('\n').map(line => line.split('¦')))
