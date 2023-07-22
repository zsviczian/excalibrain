import { APPNAME, MINEXCALIDRAWVERSION } from "src/constants/constants";

//Magyar
export default {
  //beállítások
  JSON_MALFORMED: `Hibás JSON`,
  JSON_MISSING_KEYS: `A JSON-nak rendelkeznie kell az alábbi 4 kulccsal: "parents", "children", "friends", "nextFriends"`,
  JSON_VALUES_NOT_STRING_ARRAYS: `A kulcsok értékeinek nem üres string tömbnek kell lenniük. Példa: "parents": ["Szülő", "Szülők", "feljebb"]`,
  EXCALIBRAIN_FILE_NAME: "Excalibrain rajz fájl elérési útvonala",
  EXCALIBRAIN_FILE_DESC: "⚠ Ez a fájl felül lesz írva a bővítmény által. Ha leállítod a szkriptet és változtatsz a gráfban, akkor át kell nevezned a fájlt, hogy a módosításaid megmaradjanak. Mert amikor újra elindítod az ExcaliBrain-t, a módosításaidat felülírja az automatikusan generált ExcaliBrain gráf.",
  INDEX_REFRESH_FREQ_NAME: "Index frissítési gyakorisága",
  INDEX_REFRESH_FREQ_DESC: "Az ExcaliBrain frissíti az indexét, amikor váltasz munkatérre, abban az esetben, ha az előző index frissítése óta megváltozott egy fájl a Vault-odban. <br>" +
                           "Ez a beállítás csak akkor érvényes, ha egy markdown szerkesztőben írsz (nem váltasz fájlokat vagy térképeket), és mégis azt szeretnéd, hogy az ExcaliBrain frissítse a gráfodat ahogy gépelsz. " +
                           "Mivel a gyakori háttérindex frissítések erőforrásigényesek lehetnek, van lehetőséged növelni az index-frissítés időközét, amely csökkenti a rendszer terhelését.",
  HIERARCHY_HEAD: "Ontológia",
  HIERARCHY_DESC: "Add meg a Dataview mezőneveket vesszővel elválasztva (,) úgy, hogy ezeket fogod használni a link irányok meghatározásához a gráfodban.<br>" +
    "Az ontológiát a markdown szerkesztőben a mező elé írva is bővítheted (például: 'Tartalmazza::') majd valamelyik parancspaletta parancs segítségével hozzáadhatod a dataview mezőt az ontológiához, mint SZÜLŐ, GYERMEK, BARÁT, vagy JOBBSZÉL BARÁT",
  INFER_NAME: "Az összes implicit kapcsolat barátként való megjelenítése",
  INFER_DESC: "<b>Be:</b> Az összes implcita linket a dokumentumban barátként értelmezi.<br>" + 
    "<b>Ki:</b> Az alábbi logikát alkalmazza:<ul>" +
    "<li>Egy előre mutató linket gyermekként értelmez</li>" +
    "<li>Egy visszamutató linket szülőként értelmez</li>" +
    "<li>Ha két fájl kölcsönösen hivatkozik egymásra, azok barátok</li></ul>",
  REVERSE_NAME: "Fordított következtető logika",
  REVERSE_DESC: "<b>Be:</b> A visszamutató linkeket gyerekként, az előre mutatókat szülőkként kezeli.<br><b>Ki:</b> A visszamutató linkeket szülőkként, az előre mutatókat gyerekként kezeli</b>",
  PARENTS_NAME: "Szülők",
  CHILDREN_NAME: "Gyermekek",
  LEFT_FRIENDS_NAME: "Baloldali barátok",
  RIGHT_FRIENDS_NAME: "Jobboldali barátok",
  PREVIOUS_NAME: "Előző (barátok)",
  NEXT_NAME: "Következő (barátok)",
  EXCLUSIONS_NAME: "Kizárt",
  EXCLUSIONS_DESC: "Dataview vagy YAML mezők, amelyek sosem kerülnek felhasználásra az ontológiában",
  UNASSIGNED_NAME: "Nem hozzárendelt",
  UNASSIGNED_DESC: "A Vault-odban található mezők, amelyek sem az ontológia részei, sem kizárt mezők.",
  ONTOLOGY_SUGGESTER_NAME: "Ontológia javasoló",
  ONTOLOGY_SUGGESTER_DESC: "Aktiválja az ontológia javasolót a markdown szerkesztőben. Ha engedélyezve van, akkor a paragrafus elején írt trigger szekvenciával aktiválhatod a javasolót, ami felsorolja az előzőleg meghatározott ontológiai mezőket.",
  ONTOLOGY_SUGGESTER_ALL_NAME: "Karakter szekvencia a generikus javasoló aktiválásához. A generikus javasoló az összes ontológiai mezőt tartalmazza függetlenül az irányuktól.",
  ONTOLOGY_SUGGESTER_PARENT_NAME: "Karakter szekvencia a szülő javasoló aktiválásához",
  ONTOLOGY_SUGGESTER_CHILD_NAME: "Karakter szekvencia a gyermek javasoló aktiválásához",
  ONTOLOGY_SUGGESTER_LEFT_FRIEND_NAME: "Karakter szekvencia a baloldali barát javasoló aktiválásához",
  ONTOLOGY_SUGGESTER_RIGHT_FRIEND_NAME: "Karakter szekvencia a jobboldali barát javasoló aktiválásához",
  ONTOLOGY_SUGGESTER_PREVIOUS_NAME: "Karakter szekvencia az előző (barát) javasoló aktiválásához",
  ONTOLOGY_SUGGESTER_NEXT_NAME: "Karakter szekvencia a következő (barát) javasoló aktiválásához",
  MID_SENTENCE_SUGGESTER_TRIGGER_NAME: "Köztes adatmező javasoló kiváltó",
  MID_SENTENCE_SUGGESTER_TRIGGER_DESC: "Lehetőség van mezőket köztes helyen a mondatokban hozzáadni a következő két formátum valamelyikét használva:<br>" +
    "<code>We met at [location:: [[XYZ restaurant]]] with [candidate:: [[John Doe]]]</code><br>" +
    "<code>We met at (location:: [[XYZ restaurant]]) with (candidate:: [[John Doe]])</code><br>" +
    "Ha ezt a kiváltót például <code>(</code>-ra állítod, akkor bárhol a mondatban beírva <code>(:::</code> aktiválja a javasolót (feltéve, hogy a generikus javasoló kiváltója az alapértelmezett <code>:::</code> - lásd fent).<br>" +
    "További információ az inline mezőkről: [DataView Help](https://blacksmithgu.github.io/obsidian-dataview/data-annotation/)",
  BOLD_FIELDS_NAME: "Kijelölt mezők félkövéren",
  BOLD_FIELDS_DESC: "A kijelölt mezőt félkövér típusú szöveggel adja hozzá, azaz (**mező neve**:: ) eredményezve (<b>mező neve</b>:: )",
  DISPLAY_HEAD: "Megjelenítés",
  COMPACT_VIEW_NAME: "Sűrű nézet",
  COMPACT_VIEW_DESC: "A gráf megjelenítése sűrű nézetben",
  EXCLUDE_PATHLIST_NAME: "Kizárandó fájl elérési útvonalak",
  EXCLUDE_PATHLIST_DESC: "Adja meg a kizárandó fájlok elérési útvonalait vesszővel elválasztva.",
  RENDERALIAS_NAME: "Megjelenítési azonosító ha elérhető",
  RENDERALIAS_DESC: "Megjeleníti az oldal azonosítóját a fájlnév helyett, ha az az oldal előlapján van meghatározva.",
  NODETITLE_SCRIPT_NAME: "Node nevek megjelenítéséhez JavaScript kód",
  NODETITLE_SCRIPT_DESC: "JavaScript kód a node nevének megjelenítésére. Ha nem szükséges, hagyja ezt a mezőt üresen.<br>" +
    "Függvény definíció: <code>customNodeLabel: (dvPage: Literal, defaultName:string) => string</code><br>" +
    "A szkriptben hivatkozhat a dataview oldal objektumára a <code>dvPage</code> változóval; és az alapértelmezett oldalnévre (fájlnév vagy azonosító, ha elérhető) a <code>defaultName</code> változóval. " +
    "Használhatod a következő kifejezést: <code>dvPage['mező 1']??defaultName</code> - ez az példa megjeleníti a 'mező 1' értékét, ha elérhető, különben az alapértelmezett névet<br>" +
    "⚠ A kódodat éppen úgy futtatjuk le, ahogy van, tehát győződj meg róla, hogy megfelelő kivételkezelést adtál hozzá. Az <code>defaultName</code> és a dataview mezőnevek mellett szabadon használhatsz " + 
    "bármilyen JavaScript függvényt (például <code>defaultName.toLowerCase()</code>) és bármilyen értéket, ami a <code>dvPage</code> objektumon megjelenik, pl. <code>dvPage.file.path</code>, stb. <br> " +
    "A dataview oldal objektumot felderítheted az Új oldal megnyitásával és a következő kóddal:<br>" + 
    "<code>DataviewAPI.page('teljes fájlnév kiterjesztéssel')</code><br>" + 
    "Itt van egy példa kód, ami a cím mező értékét fogja megjeleníteni, ha elérhető, egyébként az alapértelmezett fájlnévet, és mögé fűzi az állapotot (ha elérhető): <br>" +
    "<code>dvPage.title??defaultName & (dvPage.state ? ' - ' & dvPage.state : '')</code>",
  SHOWINFERRED_NAME: "Az előállított kapcsolatok megjelenítése",
  SHOWINFERRED_DESC: "<b>Be:</b> Mind az expliciten meghatározott, mind az előállított kapcsolatokat megjeleníti. Az előre mutató linkek gyerekek, a visszamutatók szülők, " +
    "ha két oldal egymásra hivatkozik, akkor barátokként lesznek kezelve. Az expliciten meghatározott kapcsolatok mindig előnyt élveznek.<br><b>Ki:</b> Csak az expliciten meghatározott kapcsolatokat jeleníti meg.",
  SHOWVIRTUAL_NAME: "Virtuális gyerek node-ok megjelenítése",
  SHOWVIRTUAL_DESC: "<b>Be:</b> Megjeleníti a feloldatlan linkeket.<br><b>Ki:</b> Nem jeleníti meg a feloldatlan linkeket.",
  SHOWATTACHMENTS_NAME: "Mellékletek beillesztése",
  SHOWATTACHMENTS_DESC: "<b>Be:</b> Minden típusú fájlt megjelenít a gráfban. " +
    "<br><b>Ki:</b> Csak a markdown fájlokat jeleníti meg.",
  STYLE_HEAD: "Stílusok",
  STYLE_DESC: "A stílusokat sorrendben alkalmazzuk.<br><ol><li><b>Alap</b> node stílus</li>" +
    "<li><b>Előállított</b> node stílus (csak akkor alkalmazódik, ha a node előállított)</li><li><b>Virtuális</b> node stílus (csak akkor alkalmazódik, ha a node virtuális)</li> " +
    "<li><b>Középponti</b> node stílus (csak akkor alkalmazódik, ha a node a középpontban van)</li><li><b>Testvérek</b> node stílus (csak akkor alkalmazódik, ha a node testvér)</li> " +
    "<li><b>Melléklet</b> node stílus (csak akkor alkalmazódik, ha a node melléklet)</li><li><b>Opcionális</b> címkén alapuló stílus</li></ol>" +
    "Az alap node stílus minden attribútumát meg kell adni. " +
    "A többi stílusnak részleges definíciója lehet. Például hozzáadhatsz egy előtagot és felülírhatod az alapértelmezett node háttérszínét a címkén alapuló stílusban, " + 
    "a szöveg színét az előállított node stílusban és a szaggatott vonalas keretet a virtuális node stílusban.",
  CANVAS_BGCOLOR: "Vászon szín",
  SHOW_FULL_TAG_PATH_NAME: "Teljes címke név megjelenítése",
  SHOW_FULL_TAG_PATH_DESC: "<b>Be:</b> megjeleníti a teljes címkét, például #reading/books/sci-fi</br>" +
    "<b>Ki:</b> a címke aktuális részét jeleníti meg, például a fent említett címkéknél csak #reading, #books, #sci-fi lenne látható a gráfban a címke hierarchia mentén navigálva.",
  SHOW_COUNT_NAME: "Szomszédok számának megjelenítése",
  SHOW_COUNT_DESC: "Megmutatja a gyermekek, szülők, barátok számát a node kapuja mellett",
  ALLOW_AUTOZOOM_NAME: "Automatikus nagyítás",
  ALLOW_AUTOZOOM_DESC: "<b>Be:</b> Engedélyezi az automatikus nagyítást<br><b>Ki:</b> Letiltja az automatikus nagyítást",
  ALLOW_AUTOFOCUS_ON_SEARCH_NAME: "Automatikus fókusz a keresésnél",
  ALLOW_AUTOFOCUS_ON_SEARCH_DESC: "<b>Be:</b> Engedélyezi az automatikus fókuszt a keresésnél<br><b>Ki:</b> Letiltja az automatikus fókuszt",
  ALWAYS_ON_TOP_NAME: "Alapértelmezett 'mindig legfelül' viselkedés lebegtetett ablak esetén",
  ALWAYS_ON_TOP_DESC: "<b>Be:</b> Ha az ExcaliBrain-t lebegtetett ablakban nyitod meg, akkor az új ablak mindig 'mindig legfelül' módban nyílik meg.<br><b>Ki:</b> Az új ablak nem lesz 'mindig legfelül' módban.",
  EMBEDDED_FRAME_WIDTH_NAME: "Beágyazott keret szélessége",
  EMBEDDED_FRAME_HEIGHT_NAME: "Beágyazott keret magassága",
  TAGLIST_NAME: "Formázott címkék",
  TAGLIST_DESC: "Különleges formázási szabályokat adhatsz meg a node-okhoz címkék alapján. Ha az oldalon több címke van jelen, az első illeszkedő specifikációt használja. <br>A címkéknek a <mark>#</mark>-al kell kezdődniük és nem teljesek is lehetnek. Tehát például <code>#book</code> illeszkedni fog #books, #book/fiction stb.-re.<br>" +
    "Add meg a címkéket vesszővel elválasztva, majd választhatsz a legördülő listából a formázás megváltoztatásához.",
  MAX_ITEMCOUNT_DESC: "Maximális node szám",
  MAX_ITEMCOUNT_NAME: "Maximális node-ok száma a elrendezés adott részén." + 
    "Azaz a maximális szám a szülőknek, a gyermekeknek, a barátoknak és a testvéreknek a megjelenítéshez. Ha több elem van, akkor nem jelennek meg a rajzon.",
  NODESTYLE_INCLUDE_TOGGLE: "Be: Az alap node stílus felülbírálása ehhez az attribútumhoz; Ki: Az alap node stílus alkalmazása ehhez az attribútumhoz",
  NODESTYLE_PREFIX_NAME: "Előtag",
  NODESTYLE_PREFIX_DESC: "Előtag karakter vagy emojival a node címke elé",
  NODESTYLE_BGCOLOR: "Háttérszín",
  NODESTYLE_BG_FILLSTYLE: "Háttér kitöltési stílusa",
  NODESTYLE_TEXTCOLOR: "Szövegszín",
  NODESTYLE_BORDERCOLOR: "Keret szín",
  NODESTYLE_FONTSIZE: "Betűméret",
  NODESTYLE_FONTFAMILY: "Betűcsalád",
  NODESTYLE_MAXLABELLENGTH_NAME: "Max címke hossza",
  NODESTYLE_MAXLABELLENGTH_DESC: "A node címke maximum megjelenített karaktereinek száma. Hosszabb node-ok végén '...' jel lesz látható",
  NODESTYLE_ROUGHNESS: "Vonal élsőség",
  NODESTYLE_SHARPNESS: "Vonal élesség",
  NODESTYLE_STROKEWIDTH: "Vonal vastagsága",
  NODESTYLE_STROKESTYLE: "Vonal stílusa",
  NODESTYLE_RECTANGLEPADDING: "A node téglalapának kitöltése",
  NODESTYLE_GATE_RADIUS_NAME: "Kapu sugara",
  NODESTYLE_GATE_RADIUS_DESC: "A 3 kis kör sugara (alias: kapuk) a node-ok kapcsolódási pontjaként szolgál",
  NODESTYLE_GATE_OFFSET_NAME: "Kapu eltolása",
  NODESTYLE_GATE_OFFSET_DESC: "Az eltolás a szülők és gyermekek kapuinak bal és jobb oldalán",
  NODESTYLE_GATE_COLOR: "Kapu keret színe",
  NODESTYLE_GATE_BGCOLOR_NAME: "Kapu háttérszíne",
  NODESTYLE_GATE_BGCOLOR_DESC: "A kapu kitöltési színe, ha vannak gyermekek",
  NODESTYLE_GATE_FILLSTYLE: "Kapu háttér kitöltési stílusa",
  NODESTYLE_BASE: "Alap node stílus",
  NODESTYLE_CENTRAL: "Középponti node stílusa",
  NODESTYLE_INFERRED: "Előállított node stílusa",
  NODESTYLE_VIRTUAL: "Virtuális node stílusa",
  NODESTYLE_SIBLING: "Testvér node stílusa",
  NODESTYLE_ATTACHMENT: "Melléklet node stílusa",
  NODESTYLE_FOLDER: "Mappa node stílusa",
  NODESTYLE_TAG: "Címke node stílusa",
  LINKSTYLE_COLOR: "Szín",
  LINKSTYLE_WIDTH: "Vastagság",
  LINKSTYLE_STROKE: "Vonal stílusa",
  LINKSTYLE_ROUGHNESS: "Vonal élsőség",
  LINKSTYLE_ARROWSTART: "Nyíl feje kezdetén",
  LINKSTYLE_ARROWEND: "Nyíl feje végén",
  LINKSTYLE_SHOWLABEL: "Címke megjelenítése a link-en",
  LINKSTYLE_FONTSIZE: "Címke betűmérete",
  LINKSTYLE_FONTFAMILY: "Címke betűcsaládja",
  LINKSTYLE_BASE: "Alap link stílus",
  LINKSTYLE_INFERRED: "Előállított link stílusa",
  LINKSTYLE_FOLDER: "Mappa link stílusa",
  LINKSTYLE_TAG: "Címke link stílusa",
  //main
  DATAVIEW_NOT_FOUND: `A Dataview bővítmény nem található. Kérlek telepítsd vagy engedélyezd a Dataview-t, majd próbáld újra indítani a(z) ${APPNAME} alkalmazást.`,
  DATAVIEW_UPGRADE: `Kérlek frissítsd a Dataview-t 0.5.31 vagy újabb verzióra. Kérlek frissítsd a Dataview-t, majd próbáld újra indítani a(z) ${APPNAME} alkalmazást.`,
  EXCALIDRAW_NOT_FOUND: `Az Excalidraw bővítmény nem található. Kérlek telepítsd vagy engedélyezd az Excalidraw-t, majd próbáld újra indítani a(z) ${APPNAME} alkalmazást.`,
  EXCALIDRAW_MINAPP_VERSION: `Az ExcaliBrain az Excalidraw ${MINEXCALIDRAWVERSION} vagy újabb verzióját igényli. Kérlek frissítsd az Excalidraw-t, majd próbáld újra indítani a(z) ${APPNAME} alkalmazást.`,
  COMMAND_ADD_PARENT_FIELD: "Dataview mező hozzáadása ontológiaként SZÜLŐKÉNT",
  COMMAND_ADD_CHILD_FIELD: "Dataview mező hozzáadása ontológiaként GYERMEKEKKÉNT",
  COMMAND_ADD_LEFT_FRIEND_FIELD: "Dataview mező hozzáadása ontológiaként BAL-OLDALI BARÁTKÉNT",
  COMMAND_ADD_RIGHT_FRIEND_FIELD: "Dataview mező hozzáadása ontológiaként JOBB-OLDALI BARÁTKÉNT",
  COMMAND_ADD_PREVIOUS_FIELD: "Dataview mező hozzáadása ontológiaként ELŐZŐKÉNT",
  COMMAND_ADD_NEXT_FIELD: "Dataview mező hozzáadása ontológiaként KÖVETKEZŐKÉNT",
  COMMAND_START: "ExcaliBrain Normál",
  COMMAND_START_HOVER: "ExcaliBrain lebegő szerkesztő",
  COMMAND_START_POPOUT: "ExcaliBrain különálló ablak",
  //COMMAND_SEARCH: "Search",
  COMMAND_STOP: "ExcaliBrain leállítása",
  HOVER_EDITOR_ERROR: "Sajnálom. Valami hiba történt. Valószínűleg a Hover Editor verziófrissítése okozta, amelyet még nem kezeltem megfelelően az ExcaliBrain-ben. Általában néhány napon belül megoldom ezt.",
  //ToolsPanel
  OPEN_DRAWING: "Mentés szerkesztéshez",
  SEARCH_IN_VAULT: "A csillagozott elemek megjelennek az üres keresésben.\nKeresés fájl, mappa vagy címke szerint a Vault-ban.\nKapcsold ki/ki a mappákat és címkéket a listában történő megjelenítéshez.",
  SHOW_HIDE_ATTACHMENTS: "Mellékletek megjelenítése/elrejtése",
  SHOW_HIDE_VIRTUAL: "Virtuális node-ok megjelenítése/elrejtése",
  SHOW_HIDE_INFERRED: "Előállított node-ok megjelenítése/elrejtése",
  SHOW_HIDE_ALIAS: "Dokumentum alias megjelenítése/elrejtése",
  SHOW_HIDE_SIBLINGS: "Testvér node-ok megjelenítése/elrejtése",
  SHOW_HIDE_EMBEDDEDCENTRAL: "Középponti node beágyazott keretként megjelenítése",
  SHOW_HIDE_FOLDER: "Mappa node-ok megjelenítése/elrejtése",
  SHOW_HIDE_TAG: "Címke node-ok megjelenítése/elrejtése",
  SHOW_HIDE_PAGES: "Oldal node-ok megjelenítése/elrejtése (definiált, előállított, virtuális és melléklet)",
  PIN_LEAF: "ExcaliBrain összekapcsolása az aktív legutóbbi elemmel"
}
  
