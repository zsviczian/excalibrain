import { APPNAME, MINEXCALIDRAWVERSION } from "src/constants/constants";

// Deutsch
export default {
  // Einstellungen
  JSON_MALFORMED: `Ungültiges JSON-Format`,
  JSON_MISSING_KEYS: `JSON muss diese 4 Schlüssel enthalten: "parents", "children", "friends", "nextFriends"`,
  JSON_VALUES_NOT_STRING_ARRAYS: `Die Schlüsselwerte müssen ein nicht-leeres Array von Zeichenketten sein. z.B. "parents": ["Eltern", "Elternteile", "hoch"]`,
  EXCALIBRAIN_FILE_NAME: "Dateipfad der Excalibrain-Zeichnung",
  EXCALIBRAIN_FILE_DESC: "⚠ Diese Datei wird durch das Plugin überschrieben. Wenn Sie das Skript stoppen und Änderungen am Graphen vornehmen, sollten Sie die Datei umbenennen, damit Ihre Änderungen erhalten bleiben. Denn beim nächsten Start von ExcaliBrain werden Ihre Änderungen durch den automatisch generierten ExcaliBrain-Graphen überschrieben.",
  INDEX_REFRESH_FREQ_NAME: "Index-Aktualisierungsfrequenz",
  INDEX_REFRESH_FREQ_DESC: "ExcaliBrain wird seinen Index immer dann aktualisieren, wenn Sie zwischen Arbeitsbereichen wechseln, falls eine Datei in Ihrer Vault seit der letzten Index-Aktualisierung geändert wurde. <br>" +
    "Diese Einstellung ist nur relevant, wenn Sie in einem Markdown-Editor tippen (keine Datei- oder Bereichswechsel vornehmen) und dennoch möchten, dass ExcaliBrain den Graphen während des Schreibens aktualisiert. " +
    "Da häufige Hintergrund-Index-Updates ressourcenintensiv sein können, haben Sie die Möglichkeit, das Zeitintervall für die Index-Updates zu vergrößern, um die Auswirkungen auf Ihr System zu reduzieren.",
  HIERARCHY_HEAD: "Ontologie",
  HIERARCHY_DESC: "Geben Sie die Dataview-Feldnamen durch Kommas getrennt ein, die Sie verwenden möchten, um Link-Richtungen in Ihrem Graphen zu definieren.<br>" +
    "Sie können auch Felder dynamisch von Ihrem Markdown-Editor aus zur Ontologie hinzufügen, indem Sie das neue Feld am Anfang eines Absatzes eingeben (z.B. 'Besteht aus::') und dann eine der Befehlspalettenaktionen aufrufen, um das Dataview-Feld als ELTERN, KIND, FREUND oder RECHTER FREUND zur Ontologie hinzuzufügen.",
  INFER_NAME: "Alle impliziten Beziehungen als Freund interpretieren",
  INFER_DESC: "<b>Ein:</b> Alle impliziten Verknüpfungen im Dokument werden als FREUNDE interpretiert.<br>" +
    "<b>Aus:</b> Die folgende Logik wird verwendet:<ul>" +
    "<li>Eine Vorwärtsverknüpfung wird als KIND interpretiert</li>" +
    "<li>Eine Rückverknüpfung wird als ELTERN interpretiert</li>" +
    "<li>Wenn Dateien sich gegenseitig verknüpfen, sind sie FREUNDE</li></ul>",
  REVERSE_NAME: "Logik für implizite Beziehungen umkehren",
  REVERSE_DESC: "<b>Ein:</b> Rückverknüpfungen als KINDER und Vorwärtsverknüpfungen als ELTERN behandeln.<br><b>Aus:</b> Rückverknüpfungen als ELTERN und Vorwärtsverknüpfungen als KINDER behandeln</b>",
  PARENTS_NAME: "Eltern",
  CHILDREN_NAME: "Kinder",
  LEFT_FRIENDS_NAME: "Freunde (links)",
  RIGHT_FRIENDS_NAME: "Freunde (rechts)",
  PREVIOUS_NAME: "Vorherige (Freunde)",
  NEXT_NAME: "Nächste (Freunde)",
  EXCLUSIONS_NAME: "Ausgeschlossen",
  EXCLUSIONS_DESC: "Dataview- oder YAML-Felder, die niemals für die Ontologie verwendet werden.",
  UNASSIGNED_NAME: "Nicht zugewiesen",
  UNASSIGNED_DESC: "Felder in Ihrer Vault, die weder ausgeschlossen noch Teil der definierten Ontologie sind.",
  ONTOLOGY_SUGGESTER_NAME: "Ontologie-Vorschläge",
  ONTOLOGY_SUGGESTER_DESC: "Aktivieren Sie den Ontologie-Vorschläger im Markdown-Editor. Wenn aktiviert, wird das Auslösemuster am Anfang eines Absatzes den Ontologie-Feldern angezeigt, die oben definiert sind.",
  ONTOLOGY_SUGGESTER_ALL_NAME: "Zeichenkette zum Auslösen des generischen Vorschlägers. Der generische Vorschläger enthält alle Ontologie-Felder unabhängig von ihrer Richtung.",
  ONTOLOGY_SUGGESTER_PARENT_NAME: "Zeichenkette zum Auslösen des Vorschlägers für ELTERN",
  ONTOLOGY_SUGGESTER_CHILD_NAME: "Zeichenkette zum Auslösen des Vorschlägers für KINDER",
  ONTOLOGY_SUGGESTER_LEFT_FRIEND_NAME: "Zeichenkette zum Auslösen des Vorschlägers für linke FREUNDE",
  ONTOLOGY_SUGGESTER_RIGHT_FRIEND_NAME: "Zeichenkette zum Auslösen des Vorschlägers für rechte FREUNDE",
  ONTOLOGY_SUGGESTER_PREVIOUS_NAME: "Zeichenkette zum Auslösen des Vorschlägers für vorherige (FREUNDE)",
  ONTOLOGY_SUGGESTER_NEXT_NAME: "Zeichenkette zum Auslösen des Vorschlägers für nächste (FREUNDE)",
  MID_SENTENCE_SUGGESTER_TRIGGER_NAME: "Auslösemuster für Dataview-Feldvorschläge inmitten von Sätzen",
  MID_SENTENCE_SUGGESTER_TRIGGER_DESC: "Sie können Felder inmitten von Sätzen hinzufügen, indem Sie einem der beiden Formate folgen:<br>" +
    "<code>We met at [location:: [[XYZ restaurant]]] with [candidate:: [[John Doe]]]</code><br>" +
    "<code>We met at (location:: [[XYZ restaurant]]) with (candidate:: [[John Doe]])</code><br>" +
    "Wenn Sie das Auslösemuster z.B. auf <code>(</code> setzen, wird das Eingeben von <code>(:::</code> an einer beliebigen Stelle im Satz den Vorschläger aktivieren (sofern Sie das Standard-Auslösemuster für generische Vorschläge von <code>:::</code> verwenden - siehe Einstellung oben).<br>" +
    "Weitere Informationen zu Inline-Feldern finden Sie unter [DataView-Hilfe](https://blacksmithgu.github.io/obsidian-dataview/data-annotation/)",
  BOLD_FIELDS_NAME: "Ausgewähltes Feld fett hervorheben",
  BOLD_FIELDS_DESC: "Fügt das ausgewählte Feld mit fetter Schriftart zum Text hinzu, z.B. (**Feldname**:: ) ergibt (<b>Feldname</b>:: )",
  DISPLAY_HEAD: "Darstellung",
  COMPACT_VIEW_NAME: "Kompakte Ansicht",
  COMPACT_VIEW_DESC: "Zeigt den Graphen in einer kompakten Ansicht an",
  EXCLUDE_PATHLIST_NAME: "Auszuschließende Dateipfade",
  EXCLUDE_PATHLIST_DESC: "Geben Sie eine kommagetrennte Liste von Dateipfaden ein, die vom Index ausgeschlossen werden sollen.",
  RENDERALIAS_NAME: "Alias anzeigen, wenn verfügbar",
  RENDERALIAS_DESC: "Zeigt den Seitennamen anstelle des Dateinamens an, wenn dieser in den Metadaten der Seite angegeben ist.",
  NODETITLE_SCRIPT_NAME: "Javascript zum Rendern von Knotennamen",
  NODETITLE_SCRIPT_DESC: "Javascript-Code zum Rendern des Knotentitels. Wenn Sie es nicht benötigen, lassen Sie dieses Feld einfach leer.<br>" +
    "Funktionsdefinition: <code>customNodeLabel: (dvPage: Literal, defaultName:string) => string</code><br>" +
    "In Ihrem Skript können Sie auf das Dataview-Objekt der Seite über die Variable <code>dvPage</code> und den Standardseitennamen (Dateiname oder Alias, sofern vorhanden) über die Variable <code>defaultName</code> zugreifen. " +
    "Verwenden Sie die folgende Ausdruckssyntax:<br><code>dvPage['Feld 1']??defaultName</code> - dieses Beispiel zeigt den Wert von 'Feld 1', falls verfügbar, andernfalls den Standardnamen.<br>" +
    "⚠ Ihr Code wird wie eingegeben ausgeführt, stellen Sie sicher, dass Sie eine ordnungsgemäße Fehlerbehandlung hinzufügen. Neben <code>defaultName</code> und Dataview-Feldnamen haben Sie auch die Freiheit, " +
    "beliebige JavaScript-Funktionen zu verwenden (z.B. <code>defaultName.toLowerCase()</code>) und beliebige Werte, die im <code>dvPage</code>-Objekt erscheinen, z.B. <code>dvPage.file.path</code>, etc.<br> " +
    "Um das Dataview-Objekt der Seite zu erkunden, öffnen Sie die Entwicklerkonsole und geben Sie folgenden Code ein:<br>" +
    "<code>DataviewAPI.page('vollständiger Dateipfad einschließlich Erweiterung')</code><br>" +
    "Hier ist ein Beispielcode, der den Wert des Titelfelds anzeigt, sofern verfügbar, gefolgt vom Dateinamen und dem Status (sofern verfügbar): <br>" +
    "<code>dvPage.title??defaultName & (dvPage.state ? ' - ' & dvPage.state : '')</code>",
  SHOWINFERRED_NAME: "Implizite Beziehungen anzeigen",
  SHOWINFERRED_DESC: "<b>Ein:</b> Zeigt sowohl explizit definierte als auch implizierte Verknüpfungen an. Vorwärtsverknüpfungen sind Kinder, Rückverknüpfungen sind Eltern, " +
    "wenn sich zwei Seiten gegenseitig beziehen, wird die Beziehung als Freundschaft interpretiert. Explizit definierte Beziehungen haben immer Vorrang.<br><b>Aus:</b> Zeigt nur explizit definierte Beziehungen an.",
  SHOWVIRTUAL_NAME: "Virtuelle Kindknoten anzeigen",
  SHOWVIRTUAL_DESC: "<b>Ein:</b> Zeigt nicht aufgelöste Verknüpfungen an.<br><b>Aus:</b> Zeigt nicht aufgelöste Verknüpfungen nicht an.",
  SHOWATTACHMENTS_NAME: "Anhänge einbeziehen",
  SHOWATTACHMENTS_DESC: "<b>Ein:</b> Zeigt alle Dateitypen im Graphen an. " +
    "<br><b>Aus:</b> Zeigt nur Markdown-Dateien an.",
  STYLE_HEAD: "Stil",
  STYLE_DESC: "Stile werden in der Reihenfolge angewendet.<br><ol><li><b>Basis-</b>Knotenstil</li>" +
    "<li><b>Implizierter</b> Knotenstil (wird nur angewendet, wenn der Knoten impliziert ist)</li><li><b>Virtueller</b> Knotenstil (wird nur angewendet, wenn der Knoten virtuell ist)</li> " +
    "<li><b>Zentraler</b> Knotenstil (wird nur angewendet, wenn der Knoten in der Mitte ist)</li><li><b>Geschwister</b> Knotenstil (wird nur angewendet, wenn der Knoten ein Geschwister ist)</li> " +
    "<li><b>Anlagen</b> Knotenstil (wird nur angewendet, wenn der Knoten ein Anhang ist)</li><li><b>Optionaler</b> stichwortbasierter Stil</li></ol>" +
    "Alle Attribute des Basis-Knotenstils müssen angegeben werden. " +
    "Alle anderen Stile können teilweise definiert sein. Sie können beispielsweise einen Präfix hinzufügen und die Hintergrundfarbe des Basis-Knotens überschreiben oder die Schriftfarbe im implizierten Knotenstil ändern und den Randstrichstil im virtuellen Knotenstil auf gestrichelt setzen.",
  CANVAS_BGCOLOR: "Hintergrundfarbe der Leinwand",
  SHOW_FULL_TAG_PATH_NAME: "Vollständigen Tag-Namen anzeigen",
  SHOW_FULL_TAG_PATH_DESC: "<b>Ein:</b> Der vollständige Tag wird angezeigt, z.B. #lesen/bücher/sci-fi</br>" +
    "<b>Aus:</b> Die aktuelle Sektion des Tags wird angezeigt. Angenommen, der obige Tag lautet #lesen/bücher/sci-fi, dann werden im Graphen nur #lesen, #bücher, #sci-fi angezeigt, wenn Sie die Tag-Hierarchie durchlaufen.",
  SHOW_COUNT_NAME: "Anzahl der Nachbarn anzeigen",
  SHOW_COUNT_DESC: "Zeigt die Anzahl der Kinder, Eltern, Freunde neben dem Knoten-Gate an",
  ALLOW_AUTOZOOM_NAME: "Autozoom erlauben",
  ALLOW_AUTOZOOM_DESC: "<b>Ein:</b> Erlaubt Autozoom<br><b>Aus:</b> Deaktiviert Autozoom",
  ALLOW_AUTOFOCUS_ON_SEARCH_NAME: "Autofokus bei Suche erlauben",
  ALLOW_AUTOFOCUS_ON_SEARCH_DESC: "<b>Ein:</b> Erlaubt Autofokus bei Suche<br><b>Aus:</b> Deaktiviert Autofokus",
  ALWAYS_ON_TOP_NAME: "Standardmäßiges 'immer im Vordergrund' - Verhalten für Popout",
  ALWAYS_ON_TOP_DESC: "<b>Ein:</b> Wenn ExcaliBrain in einem Popout-Fenster geöffnet wird, wird es im 'immer im Vordergrund'-Modus geöffnet.<br><b>Aus:</b> Das neue Fenster wird nicht im 'immer im Vordergrund'-Modus geöffnet.",
  EMBEDDED_FRAME_WIDTH_NAME: "Breite des eingebetteten Rahmens",
  EMBEDDED_FRAME_HEIGHT_NAME: "Höhe des eingebetteten Rahmens",
  TAGLIST_NAME: "Formatierte Tags",
  TAGLIST_DESC: "Sie können spezielle Formatierungsregeln für Knoten basierend auf Tags festlegen. Wenn mehrere Tags auf der Seite vorhanden sind, wird die erste passende Spezifikation verwendet. " +
    "<br>Tagnamen sollten mit einem <mark>#</mark> beginnen und können unvollständig sein. Zum Beispiel wird <code>#buch</code> zu #bücher, #buch/fiction usw. passen.<br>" +
    "Geben Sie hier eine kommagetrennte Liste von Tags ein und wählen Sie aus der Dropdown-Liste, um die Formatierung zu ändern.",
  MAX_ITEMCOUNT_DESC: "Maximale Anzahl von Knoten",
  MAX_ITEMCOUNT_NAME: "Maximale Anzahl von Knoten, die in einem bestimmten Bereich der Anordnung angezeigt werden." + 
    "D.h. die maximale Anzahl von Eltern, die maximale Anzahl von Kindern, die maximale Anzahl von Freunden und " +
    "die maximale Anzahl von Geschwistern, die angezeigt werden sollen. Wenn es mehr Elemente gibt, werden sie aus der Zeichnung ausgelassen.",
  NODESTYLE_INCLUDE_TOGGLE: "Ein: Überschreibt den Basis-Knotenstil für dieses Attribut; Aus: Wendet den Basis-Knotenstil für dieses Attribut an",
  NODESTYLE_PREFIX_NAME: "Präfix",
  NODESTYLE_PREFIX_DESC: "Präfixzeichen oder Emoji, das vor dem Knotenlabel angezeigt wird",
  NODESTYLE_BGCOLOR: "Hintergrundfarbe",
  NODESTYLE_BG_FILLSTYLE: "Hintergrund-Füllstil",
  NODESTYLE_TEXTCOLOR: "Textfarbe",
  NODESTYLE_BORDERCOLOR: "Randfarbe",
  NODESTYLE_FONTSIZE: "Schriftgröße",
  NODESTYLE_FONTFAMILY: "Schriftart",
  NODESTYLE_MAXLABELLENGTH_NAME: "Maximale Label-Länge",
  NODESTYLE_MAXLABELLENGTH_DESC: "Maximale Anzahl von Zeichen, die vom Knotentitel angezeigt werden. Längere Knoten enden mit '...'",
  NODESTYLE_ROUGHNESS: "Strichrauheit",
  NODESTYLE_SHARPNESS: "Strichschärfe",
  NODESTYLE_STROKEWIDTH: "Strichstärke",
  NODESTYLE_STROKESTYLE: "Strichstil",
  NODESTYLE_RECTANGLEPADDING: "Polsterung des Knotenrechtecks",
  NODESTYLE_GATE_RADIUS_NAME: "Radius des Gates",
  NODESTYLE_GATE_RADIUS_DESC: "Der Radius der 3 kleinen Kreise (Alias: Gates), die als Verbindungspunkte für Knoten dienen",
  NODESTYLE_GATE_OFFSET_NAME: "Offset des Gates",
  NODESTYLE_GATE_OFFSET_DESC: "Der Abstand nach links und rechts von den Eltern- und Kind-Gates.",
  NODESTYLE_GATE_COLOR: "Randfarbe des Gates",
  NODESTYLE_GATE_BGCOLOR_NAME: "Hintergrundfarbe des Gates",
  NODESTYLE_GATE_BGCOLOR_DESC: "Die Füllfarbe des Gates, wenn es Kinder hat",
  NODESTYLE_GATE_FILLSTYLE: "Hintergrund-Füllstil des Gates",
  NODESTYLE_BASE: "Basis-Knotenstil",
  NODESTYLE_CENTRAL: "Stil des zentralen Knotens",
  NODESTYLE_INFERRED: "Stil der implizierten Knoten",
  NODESTYLE_VIRTUAL: "Stil der virtuellen Knoten",
  NODESTYLE_SIBLING: "Stil der Geschwister-Knoten",
  NODESTYLE_ATTACHMENT: "Stil der Anlagen-Knoten",
  NODESTYLE_FOLDER: "Stil der Ordner-Knoten",
  NODESTYLE_TAG: "Stil der Tag-Knoten",
  LINKSTYLE_COLOR: "Farbe",
  LINKSTYLE_WIDTH: "Breite",
  LINKSTYLE_STROKE: "Strichstil",
  LINKSTYLE_ROUGHNESS: "Strichrauheit",
  LINKSTYLE_ARROWSTART: "Pfeilspitze am Anfang",
  LINKSTYLE_ARROWEND: "Pfeilspitze am Ende",
  LINKSTYLE_SHOWLABEL: "Label auf Verbindung anzeigen",
  LINKSTYLE_FONTSIZE: "Label-Schriftgröße",
  LINKSTYLE_FONTFAMILY: "Label-Schriftart",
  LINKSTYLE_BASE: "Basis-Verbindungsstil",
  LINKSTYLE_INFERRED: "Stil der implizierten Verbindung",
  LINKSTYLE_FOLDER: "Stil der Ordner-Verbindung",
  LINKSTYLE_TAG: "Stil der Tag-Verbindung",
  //main
  DATAVIEW_NOT_FOUND: `Das Dataview-Plugin wurde nicht gefunden. Bitte installieren oder aktivieren Sie Dataview und starten Sie ${APPNAME} neu.`,
  DATAVIEW_UPGRADE: `Bitte aktualisieren Sie Dataview auf Version 0.5.31 oder höher. Bitte aktualisieren Sie Dataview und starten Sie ${APPNAME} neu.`,
  EXCALIDRAW_NOT_FOUND: `Das Excalidraw-Plugin wurde nicht gefunden. Bitte installieren oder aktivieren Sie Excalidraw und starten Sie ${APPNAME} neu.`,
  EXCALIDRAW_MINAPP_VERSION: `ExcaliBrain erfordert Excalidraw Version ${MINEXCALIDRAWVERSION} oder höher. Bitte aktualisieren Sie Excalidraw und starten Sie ${APPNAME} neu.`,
  COMMAND_ADD_PARENT_FIELD: "Dataview-Feld der Ontologie als ELTERN hinzufügen",
  COMMAND_ADD_CHILD_FIELD: "Dataview-Feld der Ontologie als KIND hinzufügen",
  COMMAND_ADD_LEFT_FRIEND_FIELD: "Dataview-Feld der Ontologie als LINKSFREUND hinzufügen",
  COMMAND_ADD_RIGHT_FRIEND_FIELD: "Dataview-Feld der Ontologie als RECHTSFREUND hinzufügen",
  COMMAND_ADD_PREVIOUS_FIELD: "Dataview-Feld der Ontologie als VORHERIGE hinzufügen",
  COMMAND_ADD_NEXT_FIELD: "Dataview-Feld der Ontologie als NÄCHSTE hinzufügen",
  COMMAND_START: "ExcaliBrain Normal starten",
  COMMAND_START_HOVER: "ExcaliBrain Hover-Editor starten",
  COMMAND_START_POPOUT: "ExcaliBrain Popout-Fenster starten",
  //COMMAND_SEARCH: "Search",
  COMMAND_STOP: "ExcaliBrain beenden",
  HOVER_EDITOR_ERROR: "Entschuldigung. Etwas ist schiefgegangen. Wahrscheinlich gab es ein Versionsupdate von Hover Editor, das ich in ExcaliBrain nicht richtig berücksichtigt habe. Normalerweise werde ich das innerhalb weniger Tage beheben.",
  //ToolsPanel
  OPEN_DRAWING: "Snapshot zum Bearbeiten speichern",
  SEARCH_IN_VAULT: "Markierte Elemente werden in der leeren Suche aufgelistet.\nSuchen Sie nach einer Datei, einem Ordner oder einem Tag in Ihrem Tresor.\nSchalten Sie Ordner und Tags ein/aus, um sie in der Liste anzuzeigen.",
  SHOW_HIDE_ATTACHMENTS: "Anlagen anzeigen/ausblenden",
  SHOW_HIDE_VIRTUAL: "Virtuelle Knoten anzeigen/ausblenden",
  SHOW_HIDE_INFERRED: "Implizierte Knoten anzeigen/ausblenden",
  SHOW_HIDE_ALIAS: "Dokument-Alias anzeigen/ausblenden",
  SHOW_HIDE_SIBLINGS: "Geschwister anzeigen/ausblenden",
  SHOW_HIDE_EMBEDDEDCENTRAL: "Zentralen Knoten als eingebetteten Rahmen anzeigen",
  SHOW_HIDE_FOLDER: "Ordner-Knoten anzeigen/ausblenden",
  SHOW_HIDE_TAG: "Tag-Knoten anzeigen/ausblenden",
  SHOW_HIDE_PAGES: "Seiten-Knoten anzeigen/ausblenden (einschließlich definierter, implizierter, virtueller und Anlagen)",
  PIN_LEAF: "ExcaliBrain mit dem zuletzt aktiven Blatt verbinden"
}