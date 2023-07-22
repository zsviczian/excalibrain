import { APPNAME, MINEXCALIDRAWVERSION } from "src/constants/constants";

// 简体中文
export default {
  // 设置
  JSON_MALFORMED: `JSON 格式错误`,
  JSON_MISSING_KEYS: `JSON 必须包含以下四个键："parents"（父节点）、"children"（子节点）、"friends"（友好节点）、"nextFriends"（下一友好节点）`,
  JSON_VALUES_NOT_STRING_ARRAYS: `键的值必须是非空字符串数组。例如："parents": ["Parent", "Parents", "up"]`,
  EXCALIBRAIN_FILE_NAME: "Excalibrain 图绘制的文件路径",
  EXCALIBRAIN_FILE_DESC: "⚠ 此文件将被插件覆盖。如果您停止脚本并对图表进行更改，应该重新命名文件以保留您的编辑内容，因为下次启动 ExcaliBrain 时，您的编辑内容将被自动生成的 ExcaliBrain 图表覆盖。",
  INDEX_REFRESH_FREQ_NAME: "索引刷新频率",
  INDEX_REFRESH_FREQ_DESC: "每当您切换工作窗格时，ExcaliBrain 将更新其索引，以防止您的 Vault 中的文件自上次索引更新以来发生了更改。<br>" +
                           "因此，此设置仅在您在 Markdown 编辑器中输入时有效（不切换文件或窗格），并且您仍希望在输入时更新 ExcaliBrain 图表。" +
                           "由于频繁的后台索引更新可能会占用资源，您可以选择增加索引更新的时间间隔，从而减少系统开销。",
  HIERARCHY_HEAD: "本体论",
  HIERARCHY_DESC: "输入您将使用的 Dataview 字段名称，用逗号（,）分隔，以定义图表中的链接方向。<br>" +
                  "您还可以通过在 Markdown 编辑器中以段落开头键入新字段（例如：'Consits of::'）并调用命令面板操作之一来即时添加字段到本体论：<code>添加 dataview 字段到父节点</code>、<code>添加 dataview 字段到子节点</code>、" +
                  "<code>添加 dataview 字段到友好节点</code> 或 <code>添加 dataview 字段到右侧友好节点</code>",
  INFER_NAME: "将所有隐式关系推断为友好节点",
  INFER_DESC: "<b>打开：</b> 将文档中的所有隐式链接解释为友好节点。<br>" + 
              "<b>关闭：</b> 将使用以下逻辑：<ul>" +
              "<li>前向链接被推断为子节点</li>" +
              "<li>反向链接被推断为父节点</li>" +
              "<li>如果文件相互链接，则它们是友好节点</li></ul>",
  REVERSE_NAME: "反向推断逻辑",
  REVERSE_DESC: "<b>打开：</b> 将反向链接视为子节点，将前向链接视为父节点。<br><b>关闭：</b> 将反向链接视为父节点，将前向链接视为子节点</b>",
  PARENTS_NAME: "父节点",
  CHILDREN_NAME: "子节点",
  LEFT_FRIENDS_NAME: "左侧友好节点",
  RIGHT_FRIENDS_NAME: "右侧友好节点",
  PREVIOUS_NAME: "上一个（友好节点）",
  NEXT_NAME: "下一个（友好节点）",
  EXCLUSIONS_NAME: "排除",
  EXCLUSIONS_DESC: "永远不用于本体论的 Dataview 或 YAML 字段",
  UNASSIGNED_NAME: "未指定",
  UNASSIGNED_DESC: "在您的 Vault 中，既不是排除项也不是已定义本体论的字段。",
  ONTOLOGY_SUGGESTER_NAME: "本体论建议器",
  ONTOLOGY_SUGGESTER_DESC: "在 Markdown 编辑器中激活本体论建议器。如果启用，然后在段落开头键入触发序列，将会触发建议器，显示您上面定义的本体论字段。",
  ONTOLOGY_SUGGESTER_ALL_NAME: "触发通用建议器的字符序列。通用建议器将包含所有本体论字段，而不考虑它们的方向。",
  ONTOLOGY_SUGGESTER_PARENT_NAME: "触发父节点建议器的字符序列",
  ONTOLOGY_SUGGESTER_CHILD_NAME: "触发子节点建议器的字符序列",
  ONTOLOGY_SUGGESTER_LEFT_FRIEND_NAME: "触发左侧友好节点建议器的字符序列",
  ONTOLOGY_SUGGESTER_RIGHT_FRIEND_NAME: "触发右侧友好节点建议器的字符序列",
  ONTOLOGY_SUGGESTER_PREVIOUS_NAME: "触发上一个（友好节点）建议器的字符序列",
  ONTOLOGY_SUGGESTER_NEXT_NAME: "触发下一个（友好节点）建议器的字符序列",
  MID_SENTENCE_SUGGESTER_TRIGGER_NAME: "中间位置的 Dataview 字段建议器触发字符序列",
  MID_SENTENCE_SUGGESTER_TRIGGER_DESC: "您可以在句子中间添加字段，遵循以下两种格式之一：<br>" +
                                      "<code>我们在 [地点:: [[XYZ restaurant]]] 遇见了 [候选人:: [[John Doe]]]</code><br>" +
                                      "<code>我们在 (地点:: [[XYZ restaurant]]) 遇见了 (候选人:: [[John Doe]])</code><br>" +
                                      "如果您将此触发器设置为例如 <code>(</code>，则在句子中的任何位置键入 <code>(:::</code> 将会触发建议器（假设您正在使用默认的通用建议器触发组合 <code>:::</code> - 请参阅上面的设置）。" +
                                      "更多有关内联字段的信息：[DataView 帮助](https://blacksmithgu.github.io/obsidian-dataview/data-annotation/)",
  BOLD_FIELDS_NAME: "使用粗体添加选定的字段",
  BOLD_FIELDS_DESC: "使用粗体类型添加选定的字段，即（**字段名**:: ），结果为（<b>字段名</b>:: ）",
  DISPLAY_HEAD: "显示",
  COMPACT_VIEW_NAME: "紧凑视图",
  COMPACT_VIEW_DESC: "以紧凑的视图显示图表",
  EXCLUDE_PATHLIST_NAME: "要排除的文件路径",
  EXCLUDE_PATHLIST_DESC: "输入要从索引中排除的文件路径，用逗号分隔。",
  RENDERALIAS_NAME: "如果可用，显示别名",
  RENDERALIAS_DESC: "如果页面的 Front Matter 中指定了页面别名，则显示别名而不是文件名。",
  NODETITLE_SCRIPT_NAME: "用于渲染节点名称的 JavaScript",
  NODETITLE_SCRIPT_DESC: "用于渲染节点标题的 JavaScript 代码。如果不需要，请将此字段留空。<br>" +
                         "函数定义：<code>customNodeLabel: (dvPage: Literal, defaultName:string) => string</code><br>" +
                         "在您的脚本中，您可以通过变量 <code>dvPage</code> 引用 dataview 页面对象；通过变量 <code>defaultName</code> 引用默认页面名称（文件名或别名，如果有）。" +
                         "使用以下表达式语法：<br><code>dvPage['field 1']??defaultName</code> - 该示例将在可用时显示 'field 1' 的值，否则显示 defaultName。<br>" +
                         "⚠ 您的代码将按原样执行，请确保添加适当的异常处理。除了 <code>defaultName</code> 和 dataview 字段名称之外，您还可以自由使用任何 JavaScript 函数（例如 <code>defaultName.toLowerCase()</code>）" +
                         "和出现在 <code>dvPage</code> 对象上的任何值，例如 <code>dvPage.file.path</code> 等。<br>" +
                         "要查看 dataview 页面对象，请打开开发者控制台并输入以下代码：<br>" + 
                         "<code>DataviewAPI.page('完整文件路径，包括扩展名')</code><br>" + 
                         "以下是一个示例代码，如果可用，将显示 title 字段的值，否则显示文件名，后跟状态（如果可用）：<br>" +
                         "<code>dvPage.title??defaultName & (dvPage.state ? ' - ' & dvPage.state : '')</code>",
  SHOWINFERRED_NAME: "显示推断关系",
  SHOWINFERRED_DESC: "<b>打开：</b> 显示显式定义的关系和推断的关系。前向链接为子节点，反向链接为父节点，如果两个页面相互引用，则推断为友好关系。显式定义的关系始终优先。<br>" +
                     "<b>关闭：</b> 仅显示显式定义的关系。",
  SHOWVIRTUAL_NAME: "显示虚拟子节点",
  SHOWVIRTUAL_DESC: "<b>打开：</b> 显示未解析的链接。<br><b>关闭：</b> 不显示未解析的链接。",
  SHOWATTACHMENTS_NAME: "包括附件",
  SHOWATTACHMENTS_DESC: "<b>打开：</b> 在图表上显示所有类型的文件。<br>" +
                        "<b>关闭：</b> 仅显示 Markdown 文件。",
  STYLE_HEAD: "样式",
  STYLE_DESC: "样式按顺序应用。<br><ol><li><b>基本</b> 节点样式</li>" +
              "<li><b>推断</b> 节点样式（仅在节点是推断的情况下应用）</li><li><b>虚拟</b> 节点样式（仅在节点是虚拟的情况下应用）</li> " +
              "<li><b>中心</b> 节点样式（仅在节点位于中心时应用）</li><li><b>兄弟</b> 节点样式（仅在节点是兄弟节点时应用）</li> " +
              "<li><b>附件</b> 节点样式（仅在节点是附件时应用）</li><li><b>基于标签</b> 的样式</li></ol>" +
              "必须指定基本节点样式的所有属性。其他样式可以部分定义。例如，您可以在基于标签的样式中添加前缀并覆盖基本节点背景颜色，在推断节点样式中覆盖字体颜色，在虚拟节点样式中设置边框线样式为虚线。",
  CANVAS_BGCOLOR: "画布颜色",
  SHOW_FULL_TAG_PATH_NAME: "显示完整标签名称",
  SHOW_FULL_TAG_PATH_DESC: "<b>打开：</b> 将显示完整的标签，例如 #reading/books/sci-fi</br>" +
                            "<b>关闭：</b> 将根据标签层级显示当前部分标签，例如在上面的标签中，导航标签层级时分别只显示 #reading、#books、#sci-fi。",
  SHOW_COUNT_NAME: "显示邻居数量",
  SHOW_COUNT_DESC: "显示子节点、父节点、友好节点旁边的数量",
  ALLOW_AUTOZOOM_NAME: "自动缩放",
  ALLOW_AUTOZOOM_DESC: "<b>打开：</b> 允许自动缩放<br><b>关闭：</b> 禁用自动缩放",
  ALLOW_AUTOFOCUS_ON_SEARCH_NAME: "搜索时自动聚焦",
  ALLOW_AUTOFOCUS_ON_SEARCH_DESC: "<b>打开：</b> 允许搜索时自动聚焦<br><b>关闭：</b> 禁用搜索时自动聚焦",
  ALWAYS_ON_TOP_NAME: "弹出窗口默认“置顶”行为",
  ALWAYS_ON_TOP_DESC: "<b>打开：</b> 在弹出窗口中打开 ExcaliBrain 时，新窗口将以“始终置顶”模式打开。<br><b>关闭：</b> 新窗口将不会以“始终置顶”模式打开。",
  EMBEDDED_FRAME_WIDTH_NAME: "嵌入帧宽度",
  EMBEDDED_FRAME_HEIGHT_NAME: "嵌入帧高度",
  TAGLIST_NAME: "格式化标签",
  TAGLIST_DESC: "您可以为节点指定基于标签的特殊格式规则。如果页面上存在多个标签，则将使用第一个匹配规范的标签。<br>标签名应以 <mark>#</mark> 开头，可以是不完整的。例如，<code>#book</code> 将匹配 #books、#book/fiction 等。<br>" +
                "在此处输入逗号分隔的标签列表，然后从下拉列表中选择以更改格式。",
  MAX_ITEMCOUNT_DESC: "最大节点数量",
  MAX_ITEMCOUNT_NAME: "在布局中显示的节点的最大数量。例如：最大父节点数、最大子节点数、最大友好节点数和最大兄弟节点数。如果有更多节点，则它们将从图中省略。",
  NODESTYLE_INCLUDE_TOGGLE: "打开：覆盖此属性的基本节点样式；关闭：应用此属性的基本节点样式",
  NODESTYLE_PREFIX_NAME: "前缀",
  NODESTYLE_PREFIX_DESC: "节点标签前显示的前缀字符或表情符号",
  NODESTYLE_BGCOLOR: "背景颜色",
  NODESTYLE_BG_FILLSTYLE: "背景填充样式",
  NODESTYLE_TEXTCOLOR: "文本颜色",
  NODESTYLE_BORDERCOLOR: "边框颜色",
  NODESTYLE_FONTSIZE: "字体大小",
  NODESTYLE_FONTFAMILY: "字体族",
  NODESTYLE_MAXLABELLENGTH_NAME: "最大标签长度",
  NODESTYLE_MAXLABELLENGTH_DESC: "要从节点标题中显示的最大字符数。较长的节点标题将以 '...' 结尾",
  NODESTYLE_ROUGHNESS: "笔触粗糙度",
  NODESTYLE_SHARPNESS: "笔触锐化度",
  NODESTYLE_STROKEWIDTH: "笔触宽度",
  NODESTYLE_STROKESTYLE: "笔触样式",
  NODESTYLE_RECTANGLEPADDING: "节点矩形的填充",
  NODESTYLE_GATE_RADIUS_NAME: "连接点半径",
  NODESTYLE_GATE_RADIUS_DESC: "作为节点连接点的 3 个小圆（别名：连接点）的半径",
  NODESTYLE_GATE_OFFSET_NAME: "连接点偏移",
  NODESTYLE_GATE_OFFSET_DESC: "父节点和子节点连接点的左右偏移量。",
  NODESTYLE_GATE_COLOR: "连接点边框颜色",
  NODESTYLE_GATE_BGCOLOR_NAME: "连接点背景颜色",
  NODESTYLE_GATE_BGCOLOR_DESC: "连接点的填充颜色（如果具有子节点）",
  NODESTYLE_GATE_FILLSTYLE: "连接点背景填充样式",
  NODESTYLE_BASE: "基本节点样式",
  NODESTYLE_CENTRAL: "中心节点样式",
  NODESTYLE_INFERRED: "推断节点样式",
  NODESTYLE_VIRTUAL: "虚拟节点样式",
  NODESTYLE_SIBLING: "兄弟节点样式",
  NODESTYLE_ATTACHMENT: "附件节点样式",
  NODESTYLE_FOLDER: "文件夹节点样式",
  NODESTYLE_TAG: "标签节点样式",
  LINKSTYLE_COLOR: "颜色",
  LINKSTYLE_WIDTH: "宽度",
  LINKSTYLE_STROKE: "笔触样式",
  LINKSTYLE_ROUGHNESS: "粗糙度",
  LINKSTYLE_ARROWSTART: "起始箭头头部",
  LINKSTYLE_ARROWEND: "结束箭头头部",
  LINKSTYLE_SHOWLABEL: "在连接上显示标签",
  LINKSTYLE_FONTSIZE: "标签字体大小",
  LINKSTYLE_FONTFAMILY: "标签字体族",
  LINKSTYLE_BASE: "基本连接样式",
  LINKSTYLE_INFERRED: "推断连接样式",
  LINKSTYLE_FOLDER: "文件夹连接样式",
  LINKSTYLE_TAG: "标签连接样式",
  //main
  DATAVIEW_NOT_FOUND: `未找到 Dataview 插件。请安装或启用 Dataview，然后尝试重新启动 ${APPNAME}。`,
  DATAVIEW_UPGRADE: `请升级 Dataview 到 0.5.31 或更高版本。请更新 Dataview，然后尝试重新启动 ${APPNAME}。`,
  EXCALIDRAW_NOT_FOUND: `未找到 Excalidraw 插件。请安装或启用 Excalidraw，然后尝试重新启动 ${APPNAME}。`,
  EXCALIDRAW_MINAPP_VERSION: `ExcaliBrain 需要 Excalidraw ${MINEXCALIDRAWVERSION} 或更高版本。请升级 Excalidraw，然后尝试重新启动 ${APPNAME}。`,
  COMMAND_ADD_PARENT_FIELD: "将 dataview 字段添加到本体作为父节点",
  COMMAND_ADD_CHILD_FIELD: "将 dataview 字段添加到本体作为子节点",
  COMMAND_ADD_LEFT_FRIEND_FIELD: "将 dataview 字段添加到本体作为左侧友好节点",
  COMMAND_ADD_RIGHT_FRIEND_FIELD: "将 dataview 字段添加到本体作为右侧友好节点",
  COMMAND_ADD_PREVIOUS_FIELD: "将 dataview 字段添加到本体作为上一个节点",
  COMMAND_ADD_NEXT_FIELD: "将 dataview 字段添加到本体作为下一个节点",
  COMMAND_START: "ExcaliBrain 普通模式",
  COMMAND_START_HOVER: "ExcaliBrain 悬停编辑器模式",
  COMMAND_START_POPOUT: "ExcaliBrain 弹出窗口模式",
  //COMMAND_SEARCH: "搜索",
  COMMAND_STOP: "停止 ExcaliBrain",
  HOVER_EDITOR_ERROR: "对不起，发生了一些错误。很可能是 Hover 编辑器更新了版本，而我在 ExcaliBrain 中没有适当处理。通常我会在几天内解决此问题",
  //ToolsPanel
  OPEN_DRAWING: "保存用于编辑的快照",
  SEARCH_IN_VAULT: "收藏夹中的项目将列在空搜索中。\n在您的 Vault 中搜索文件、文件夹或标签。\n切换文件夹和标签的显示/隐藏以在列表中显示。",
  SHOW_HIDE_ATTACHMENTS: "显示/隐藏附件",
  SHOW_HIDE_VIRTUAL: "显示/隐藏虚拟节点",
  SHOW_HIDE_INFERRED: "显示/隐藏推断节点",
  SHOW_HIDE_ALIAS: "显示/隐藏文档别名",
  SHOW_HIDE_SIBLINGS: "显示/隐藏兄弟节点",
  SHOW_HIDE_EMBEDDEDCENTRAL: "将中心节点显示为嵌入式框架",
  SHOW_HIDE_FOLDER: "显示/隐藏文件夹节点",
  SHOW_HIDE_TAG: "显示/隐藏标签节点",
  SHOW_HIDE_PAGES: "显示/隐藏页面节点（包括已定义、推断、虚拟和附件节点）",
  PIN_LEAF: "链接 ExcaliBrain 到最近的活动叶子"
}
              