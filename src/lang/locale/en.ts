import { APPNAME, MINEXCALIDRAWVERSION } from "src/constants/constants";

//English
export default {
  //settings
  JSON_MALFORMED: `Malformed JSON`,
  JSON_MISSING_KEYS: `JSON must have these 3 keys: "parents", "children", "friends"`,
  JSON_VALUES_NOT_STRING_ARRAYS: `Key values must be a non-empty array of strings. e.g. "parents": ["Parent", "Parents", "up"]`,
  EXCALIBRAIN_FILE_NAME: "Filepath of Excalibrain drawing",
  EXCALIBRAIN_FILE_DESC: "⚠ This file will be overwritten by the plugin. If you stop the script and make changes to the graph, you " +
    "should rename the file so your edits are preserved, because the next time you initiate ExcaliBrain your edits will be overwritten by " +
    "the automatically generated ExcaliBrain graph.",
  HIERARCHY_HEAD: "Hierarchy",
  HIERARCHY_DESC: "Enter the Dataview field names separated by comma (,) that you will use to define link directions in your graph.",
  PARENTS_NAME: "Parents",
  CHILDREN_NAME: "Children",
  FRIENDS_NAME: "Friends",
  DISPLAY_HEAD: "Display",
  EXCLUDE_PATHLIST_NAME: "Filepaths to exclude",
  EXCLUDE_PATHLIST_DESC: "Enter comma-separated list of filepaths to exclude from the index.",
  RENDERALIAS_NAME: "Display alias if available",
  RENDERALIAS_DESC: "Displays the page alias instead of the filename if it is specified in the page's front matter.",
  SHOWINFERRED_NAME: "Display inferred relationships",
  SHOWINFERRED_DESC: "<b>Toggle ON</b>: Display both explicitly defined and inferred links. Forward links are children, backlinks are parents, " +
    "if two page mutually referes to one another then relationship is inferred to be a friendship. Explicitly defined relationships always " +
    "take priority.<br><b>Toggle OFF</b>: Display only explicitely defined relationships.",
  SHOWVIRTUAL_NAME: "Display virtual child nodes",
  SHOWVIRTUAL_DESC: "<b>Toggle ON</b>: Display unresolved links.<br><b>Toggle OFF</b>: Do not display unresolved links.",
  SHOWATTACHMENTS_NAME: "Include attachments",
  SHOWATTACHMENTS_DESC: "<b>Toggle ON</b>: Display every type of file on the graph. " +
    "<br><b>Toggle OFF</b>: Display only markdown files.",
  STYLE_HEAD: "Styling",
  STYLE_DESC: "Styles are applied in sequence.<br><ol><li><b>Base</b> node style</li>" +
    "<li><b>Inferred</b> node style (only applied if the node is inferred)</li><li><b>Virtual</b> node style (only applied if the node is virtual)</li> " +
    "<li><b>Central</b> node style (only applied if the node is in the center)</li><li><b>Sibling</b> node style (only applied if the node is a sibling)</li> " +
    "<li><b>Attachment</b> node style (only applied if the node is an attachment)</li><li><b>Optional</b> tag based style</li></ol>" +
    "All the attributes of the base node style must be specified. " +
    "All other styles may have partial definitions. e.g. You may add a prefix and override the base node-background color in the tag-based style, " + 
    "override the font color in the inferred-node style and set the border stroke style to dotted in the virtual-node style.",
  CANVAS_BGCOLOR: "Canvas color",
  TAGLIST_NAME: "Formatted tags",
  TAGLIST_DESC: "You can specify special formatting rules for Nodes based on tags. If multiple tags are present on the page the first matching a specification " +
    "will be used. <br>Tagnames should start with <mark>#</mark> and may be incomplete. i.e. <code>#book</code> will match #books, #book/fiction, etc.<br>" +
    "Enter a comma separated list of tags here, then select from the dropdown list to change the formatting.",
  MAX_ITEMCOUNT_DESC: "Maximum node count",
  MAX_ITEMCOUNT_NAME: "Maximum number of nodes to display in a given area of the layout." + 
    "i.e. the maximum number of parents, the maximum number of children, the maximum number of friends, and " +
    "the maximum number of siblings to display. If there are more items, they will be ommitted from the drawing.",
  NODESTYLE_INCLUDE_TOGGLE: "Toggle ON: override base node style for this attribute; OFF: apply base node style for this attribute",
  NODESTYLE_PREFIX_NAME: "Prefix",
  NODESTYLE_PREFIX_DESC: "Prefix character or emoji to display in front of the node's label",
  NODESTYLE_BGCOLOR: "Background color",
  NODESTYLE_BG_FILLSTYLE: "Bacground fill-style",
  NODESTYLE_TEXTCOLOR: "Text color",
  NODESTYLE_BORDERCOLOR: "Border color",
  NODESTYLE_FONTSIZE: "Font size",
  NODESTYLE_FONTFAMILY: "Font family",
  NODESTYLE_MAXLABELLENGTH_NAME: "Max label length",
  NODESTYLE_MAXLABELLENGTH_DESC: "Maximum number of characters to display from node title. Longer nodes will end with '...'",
  NODESTYLE_ROUGHNESS: "Stroke roughness",
  NODESTYLE_SHARPNESS: "Stroke sharpness",
  NODESTYLE_STROKEWIDTH: "Stroke width",
  NODESTYLE_STROKESTYLE: "Stroke style",
  NODESTYLE_RECTANGLEPADDING: "Padding of the node rectangle",
  NODESTYLE_GATE_RADIUS_NAME: "Gate radius",
  NODESTYLE_GATE_RADIUS_DESC: "The radius of the 3 small circles (alias: gates) serving as connection points for nodes",
  NODESTYLE_GATE_OFFSET_NAME: "Gate offset",
  NODESTYLE_GATE_OFFSET_DESC: "The offset to the left and right of the parent and child gates.",
  NODESTYLE_GATE_COLOR: "Gate border color",
  NODESTYLE_GATE_BGCOLOR_NAME: "Gate background color",
  NODESTYLE_GATE_BGCOLOR_DESC: "The fill color of the gate if it has children",
  NODESTYLE_GATE_FILLSTYLE: "Gate background fill-style",
  NODESTYLE_BASE: "Base node style",
  NODESTYLE_CENTRAL: "Style of central node",
  NODESTYLE_INFERRED: "Style of inferred nodes",
  NODESTYLE_VIRTUAL: "Style of virtual nodes",
  NODESTYLE_SIBLING: "Style of sibling nodes",
  NODESTYLE_ATTACHMENT: "Style of attachment nodes",
  NODESTYLE_FOLDER: "Style of folder nodes",
  NODESTYLE_TAG: "Style of tag nodes",
  LINKSTYLE_COLOR: "Color",
  LINKSTYLE_WIDTH: "Width",
  LINKSTYLE_STROKE: "Stroke style",
  LINKSTYLE_ROUGHNESS: "Roughness",
  LINKSTYLE_ARROWSTART: "Start arrow head",
  LINKSTYLE_ARROWEND: "End arrow head",
  LINKSTYLE_BASE: "Base link style",
  LINKSTYLE_INFERRED: "Style of inferred link",
  LINKSTYLE_FOLDER: "Style of folder link",
  LINKSTYLE_TAG: "Style of tag link",
  //main
  DATAVIEW_NOT_FOUND: `Dataview plugin not found. Please install or enable Dataview then try restarting ${APPNAME}.`,
  EXCALIDRAW_NOT_FOUND: `Excalidraw plugin not found. Please install or enable Excalidraw then try restarting ${APPNAME}.`,
  EXCALIDRAW_MINAPP_VERSION: `ExcaliBrain requires Excalidraw ${MINEXCALIDRAWVERSION} or higher. Please upgrade Excalidraw then try restarting ${APPNAME}.`,
  COMMAND_START: "Open ExcaliBrain",
  //ToolsPanel
  OPEN_DRAWING: "Save snapshot for editing",
  SEARCH_IN_VAULT: "Search for a file in your Vault",
  SHOW_HIDE_ATTACHMENTS: "Show/Hide attachments",
  SHOW_HIDE_VIRTUAL: "Show/Hide virtual nodes",
  SHOW_HIDE_INFERRED: "Show/Hide inferred nodes",
  SHOW_HIDE_ALIAS: "Show/Hide document alias",
  SHOW_HIDE_FOLDER: "Show/Hide folder nodes",
  SHOW_HIDE_TAG: "Show/Hide tag nodes",
  SHOW_HIDE_PAGES: "Show/Hide page nodes (incl. defined, inferred, virtual and attachments)",
  PIN_LEAF: "Link ExcaliBrain to most recent active leaf"
}