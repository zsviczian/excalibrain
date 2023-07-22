import { APPNAME, MINEXCALIDRAWVERSION } from "src/constants/constants";

//Español
export default {
  //configuración
  JSON_MALFORMED: `JSON mal formado`,
  JSON_MISSING_KEYS: `JSON debe contener estas 4 claves: "parents", "children", "friends", "nextFriends"`,
  JSON_VALUES_NOT_STRING_ARRAYS: `Los valores de las claves deben ser una matriz no vacía de cadenas. Ejemplo: "parents": ["Padre", "Padres", "arriba"]`,
  EXCALIBRAIN_FILE_NAME: "Ruta del archivo de dibujo de Excalibrain",
  EXCALIBRAIN_FILE_DESC: "⚠ Este archivo será sobrescrito por el complemento. Si detienes el script y realizas cambios en el grafo, debes renombrar el archivo para conservar tus ediciones, porque la próxima vez que inicies ExcaliBrain, tus ediciones serán sobrescritas por el grafo generado automáticamente.",
  INDEX_REFRESH_FREQ_NAME: "Frecuencia de actualización del índice",
  INDEX_REFRESH_FREQ_DESC: "ExcaliBrain actualizará su índice cada vez que cambies los paneles de trabajo, en caso de que un archivo haya cambiado en tu Vault desde la última actualización del índice. <br>" +
                           "Esta configuración solo es relevante cuando estás escribiendo en un editor de markdown (sin cambiar de archivo o paneles) y aún deseas que ExcaliBrain actualice su grafo mientras escribes. " +
                           "Debido a que las actualizaciones frecuentes del índice en segundo plano pueden ser intensivas en recursos, tienes la opción de aumentar el intervalo de tiempo para las actualizaciones del índice, lo que reducirá " +
                           "la carga en tu sistema.",
  HIERARCHY_HEAD: "Ontología",
  HIERARCHY_DESC: "Ingresa los nombres de campo de Dataview separados por comas (,) que usarás para definir las direcciones de los enlaces en tu grafo.<br>" +
    "También puedes agregar campos a la ontología sobre la marcha desde el editor de markdown escribiendo el nuevo campo al comienzo de un párrafo (por ejemplo, 'Consta de::') " +
    "y luego llamando a una de las acciones del menú de comandos para <code>Agregar campo de Dataview a la ontología como PADRE</code>, o <code>como HIJO</code>, " +
    "<code>como AMIGO</code>, o <code>como AMIGO DERECHO</code>",
  INFER_NAME: "Inferir todas las relaciones implícitas como Amigos",
  INFER_DESC: "<b>Activado:</b> Todos los enlaces implícitos en el documento se interpretan como AMIGOS.<br>" + 
    "<b>Desactivado:</b> Se utiliza la siguiente lógica:<ul>" +
    "<li>Un enlace hacia adelante se infiere como HIJO</li>" +
    "<li>Un enlace de retroceso se infiere como PADRE</li>" +
    "<li>Si los archivos se vinculan mutuamente, son AMIGOS</li></ul>",
  REVERSE_NAME: "Invertir lógica de inferencia",
  REVERSE_DESC: "<b>Activado:</b> Tratar los enlaces de retroceso como hijos y los enlaces hacia adelante como padres.<br><b>Desactivado:</b> Tratar los enlaces de retroceso como padres y los enlaces hacia adelante como hijos</b>",
  PARENTS_NAME: "Padres",
  CHILDREN_NAME: "Hijos",
  LEFT_FRIENDS_NAME: "Amigos del Lado Izquierdo",
  RIGHT_FRIENDS_NAME: "Amigos del Lado Derecho",
  PREVIOUS_NAME: "Anterior (Amigos)",
  NEXT_NAME: "Siguiente (Amigos)",
  EXCLUSIONS_NAME: "Excluidos",
  EXCLUSIONS_DESC: "Campos de Dataview o YAML que nunca se utilizan para la ontología",
  UNASSIGNED_NAME: "Sin Asignar",
  UNASSIGNED_DESC: "Campos en tu Vault que no están excluidos ni forman parte de la ontología definida.",
  ONTOLOGY_SUGGESTER_NAME: "Sugeridor de Ontología",
  ONTOLOGY_SUGGESTER_DESC: "Activa el sugeridor de ontología en el editor de markdown. Si está habilitado, al escribir la secuencia de activación al comienzo de un párrafo "+
    "activará el sugeridor que muestra los campos de ontología definidos anteriormente.",
  ONTOLOGY_SUGGESTER_ALL_NAME: "Secuencia de caracteres para activar el sugeridor genérico. El sugeridor genérico incluirá todos los campos de ontología sin importar su dirección.",
  ONTOLOGY_SUGGESTER_PARENT_NAME: "Secuencia de caracteres para activar el sugeridor de padres",
  ONTOLOGY_SUGGESTER_CHILD_NAME: "Secuencia de caracteres para activar el sugeridor de hijos",
  ONTOLOGY_SUGGESTER_LEFT_FRIEND_NAME: "Secuencia de caracteres para activar el sugeridor de amigos del lado izquierdo",
  ONTOLOGY_SUGGESTER_RIGHT_FRIEND_NAME: "Secuencia de caracteres para activar el sugeridor de amigos del lado derecho",
  ONTOLOGY_SUGGESTER_PREVIOUS_NAME: "Secuencia de caracteres para activar el sugeridor de anter<u>ior</u> (amigos)",
  ONTOLOGY_SUGGESTER_NEXT_NAME: "Secuencia de caracteres para activar el sugeridor de sigu<u>iente</u> (amigos)",
  MID_SENTENCE_SUGGESTER_TRIGGER_NAME: "Activador de sugeridor de campos de Dataview en medio de oraciones",
  MID_SENTENCE_SUGGESTER_TRIGGER_DESC: "Puedes agregar campos a mitad de las oraciones siguiendo uno de estos dos formatos:<br>" +
    "<code>Nos encontramos en [lugar:: [[Restaurante XYZ]]] con [candidato:: [[John Doe]]]</code><br>" +
    "<code>Nos encontramos en (lugar:: [[Restaurante XYZ]]) con (candidato:: [[John Doe]])</code><br>" +
    "Si configuras este activador como por ejemplo <code>(</code>, entonces al escribir <code>(:::</code> en cualquier parte de la oración se activará el sugeridor (asumiendo que estás utilizando la combinación predeterminada de activador de sugeridor <code>:::</code> - ver configuración anterior).<br>" +
    "Más información sobre campos en línea: [Ayuda de DataView](https://blacksmithgu.github.io/obsidian-dataview/data-annotation/)",
  BOLD_FIELDS_NAME: "Agregar campo seleccionado en negrita",
  BOLD_FIELDS_DESC: "Agregar el campo seleccionado al texto en negrita, es decir, (**nombre del campo**:: ) resultando en (<b>nombre del campo</b>:: )",
  DISPLAY_HEAD: "Visualización",
  COMPACT_VIEW_NAME: "Vista compacta",
  COMPACT_VIEW_DESC: "Mostrar el grafo en una vista compacta",
  EXCLUDE_PATHLIST_NAME: "Rutas de archivos a excluir",
  EXCLUDE_PATHLIST_DESC: "Ingresa una lista de rutas de archivos separadas por comas que se deben excluir del índice.",
  RENDERALIAS_NAME: "Mostrar alias si está disponible",
  RENDERALIAS_DESC: "Muestra el alias de la página en lugar del nombre de archivo si está especificado en el front matter de la página.",
  NODETITLE_SCRIPT_NAME: "Javascript para renderizar nombres de nodos",
  NODETITLE_SCRIPT_DESC: "Código Javascript para renderizar el título del nodo. Si no lo necesitas, simplemente deja este campo vacío.<br>" +
    "Definición de la función: <code>customNodeLabel: (dvPage: Literal, defaultName:string) => string</code><br>" +
    "En tu script, puedes referirte al objeto de página Dataview a través de la variable <code>dvPage</code>; y el nombre de página predeterminado (nombre de archivo o alias si está disponible) a través de la variable <code>defaultName</code>. " +
    "Utiliza la siguiente sintaxis de expresión:<br><code>dvPage['campo 1']??defaultName</code> - este ejemplo mostrará el valor de 'campo 1' si está disponible, de lo contrario mostrará defaultName<br>" +
    "⚠ Tu línea de código se ejecutará tal como está, asegúrate de agregar un manejo adecuado de excepciones. Además de <code>defaultName</code> y los nombres de campo de dataview, también tienes la libertad de " + 
    "usar cualquier función de javascript (por ejemplo, <code>defaultName.toLowerCase()</code>) y cualquier valor que aparezca en el objeto <code>dvPage</code>, como <code>dvPage.file.path</code>, etc. <br> " +
    "Para explorar el objeto de página de Dataview, abre la Consola de Desarrollador e ingresa el siguiente código:<br>" + 
    "<code>DataviewAPI.page('ruta completa del archivo incluyendo extensión')</code><br>" + 
    "Aquí tienes un ejemplo de código que mostrará el valor del campo 'title' si está disponible, de lo contrario mostrará el nombre de archivo, seguido del estado (si está disponible): <br>" +
    "<code>dvPage.title??defaultName & (dvPage.state ? ' - ' & dvPage.state : '')</code>",
  SHOWINFERRED_NAME: "Mostrar relaciones inferidas",
  SHOWINFERRED_DESC: "<b>Activado:</b> Mostrar tanto los enlaces explícitamente definidos como los inferidos. Los enlaces hacia adelante son hijos, los enlaces de retroceso son padres, " +
    "si dos páginas se refieren mutuamente, se infiere que existe una amistad. Las relaciones definidas explícitamente siempre tienen prioridad.<br><b>Desactivado:</b> Mostrar solo relaciones definidas explícitamente.",
  SHOWVIRTUAL_NAME: "Mostrar nodos virtuales hijos",
  SHOWVIRTUAL_DESC: "<b>Activado:</b> Mostrar enlaces no resueltos.<br><b>Desactivado:</b> No mostrar enlaces no resueltos.",
  SHOWATTACHMENTS_NAME: "Incluir adjuntos",
  SHOWATTACHMENTS_DESC: "<b>Activado:</b> Mostrar todo tipo de archivos en el grafo. " +
    "<br><b>Desactivado:</b> Mostrar solo archivos de markdown.",
  STYLE_HEAD: "Estilo",
  STYLE_DESC: "Los estilos se aplican en secuencia.<br><ol><li>Estilo de nodo <b>base</b></li>" +
    "<li>Estilo de nodo <b>inferido</b> (solo se aplica si el nodo es inferido)</li><li>Estilo de nodo <b>virtual</b> (solo se aplica si el nodo es virtual)</li> " +
    "<li>Estilo de nodo <b>central</b> (solo se aplica si el nodo está en el centro)</li><li>Estilo de nodo <b>hermano</b> (solo se aplica si el nodo es un hermano)</li> " +
    "<li>Estilo de nodo <b>adjunto</b> (solo se aplica si el nodo es un adjunto)</li><li>Estilo basado en etiquetas <b>opcional</b></li></ol>" +
    "Todos los atributos del estilo de nodo base deben especificarse. " +
    "Todos los demás estilos pueden tener definiciones parciales. Por ejemplo, puedes agregar un prefijo y sobrescribir el color de fondo del nodo en el estilo basado en etiquetas, " + 
    "sobrescribir el color de fuente en el estilo de nodo inferido y establecer el estilo del borde como punteado en el estilo de nodo virtual.",
  CANVAS_BGCOLOR: "Color del lienzo",
  SHOW_FULL_TAG_PATH_NAME: "Mostrar nombre completo de la etiqueta",
  SHOW_FULL_TAG_PATH_DESC: "<b>Activado:</b> mostrará el nombre completo de la etiqueta, por ejemplo, #lectura/libros/ciencia ficción</br>" +
    "<b>Desactivado:</b> mostrará la sección actual de la etiqueta, por ejemplo, asumiendo la etiqueta anterior, el grafo mostrará solo #lectura, #libros, #ciencia ficción respectivamente a medida que navegas la jerarquía de etiquetas.",
  SHOW_COUNT_NAME: "Mostrar conteo de vecinos",
  SHOW_COUNT_DESC: "Mostrar el número de hijos, padres, amigos junto a la puerta del nodo",
  ALLOW_AUTOZOOM_NAME: "Autozoom",
  ALLOW_AUTOZOOM_DESC: "<b>Activado:</b> Permitir autozoom<br><b>Desactivado:</b> Deshabilitar autozoom",
  ALLOW_AUTOFOCUS_ON_SEARCH_NAME: "Autofocus en búsqueda",
  ALLOW_AUTOFOCUS_ON_SEARCH_DESC: "<b>Activado:</b> Permitir enfoque automático en la búsqueda<br><b>Desactivado:</b> Deshabilitar enfoque automático",
  ALWAYS_ON_TOP_NAME: "Comportamiento predeterminado de 'siempre arriba' en ventana emergente",
  ALWAYS_ON_TOP_DESC: "<b>Activado:</b> Cuando se abre ExcaliBrain en una ventana emergente, se abrirá con la nueva ventana en el modo 'siempre arriba'.<br><b>Desactivado:</b> La nueva ventana no estará en el modo 'siempre arriba'.",
  EMBEDDED_FRAME_WIDTH_NAME: "Ancho del marco incorporado",
  EMBEDDED_FRAME_HEIGHT_NAME: "Altura del marco incorporado",
  TAGLIST_NAME: "Etiquetas formateadas",
  TAGLIST_DESC: "Puedes especificar reglas de formato especial para nodos basadas en etiquetas. Si hay varias etiquetas en la página, se utilizará la primera que coincida con una especificación. " +
    "<br>Los nombres de las etiquetas deben comenzar con <mark>#</mark> y pueden ser incompletas. Es decir, <code>#libro</code> coincidirá con #libros, #libro/ficción, etc.<br>" +
    "Ingresa una lista separada por comas de etiquetas aquí, luego selecciona en la lista desplegable para cambiar el formato.",
  MAX_ITEMCOUNT_DESC: "Recuento máximo de nodos",
  MAX_ITEMCOUNT_NAME: "Número máximo de nodos para mostrar en un área determinada del diseño." + 
    "es decir, el número máximo de padres, el número máximo de hijos, el número máximo de amigos y " +
    "el número máximo de hermanos para mostrar. Si hay más elementos, se omitirán del dibujo.",
  NODESTYLE_INCLUDE_TOGGLE: "Activar: sobrescribir estilo base del nodo para este atributo; Desactivar: aplicar estilo base del nodo para este atributo",
  NODESTYLE_PREFIX_NAME: "Prefijo",
  NODESTYLE_PREFIX_DESC: "Carácter o emoji de prefijo que se mostrará delante de la etiqueta del nodo",
  NODESTYLE_BGCOLOR: "Color de fondo",
  NODESTYLE_BG_FILLSTYLE: "Estilo de relleno de fondo",
  NODESTYLE_TEXTCOLOR: "Color de texto",
  NODESTYLE_BORDERCOLOR: "Color del borde",
  NODESTYLE_FONTSIZE: "Tamaño de fuente",
  NODESTYLE_FONTFAMILY: "Fuente",
  NODESTYLE_MAXLABELLENGTH_NAME: "Longitud máxima de etiqueta",
  NODESTYLE_MAXLABELLENGTH_DESC: "Número máximo de caracteres a mostrar del título del nodo. Los nodos más largos se truncarán con '...'",
  NODESTYLE_ROUGHNESS: "Rugosidad del trazo",
  NODESTYLE_SHARPNESS: "Nitidez del trazo",
  NODESTYLE_STROKEWIDTH: "Ancho del trazo",
  NODESTYLE_STROKESTYLE: "Estilo del trazo",
  NODESTYLE_RECTANGLEPADDING: "Relleno del rectángulo del nodo",
  NODESTYLE_GATE_RADIUS_NAME: "Radio de la puerta",
  NODESTYLE_GATE_RADIUS_DESC: "El radio de los 3 pequeños círculos (alias: puertas) que sirven como puntos de conexión para los nodos",
  NODESTYLE_GATE_OFFSET_NAME: "Desplazamiento de la puerta",
  NODESTYLE_GATE_OFFSET_DESC: "El desplazamiento a la izquierda y derecha de las puertas de los padres e hijos.",
  NODESTYLE_GATE_COLOR: "Color del borde de la puerta",
  NODESTYLE_GATE_BGCOLOR_NAME: "Color de fondo de la puerta",
  NODESTYLE_GATE_BGCOLOR_DESC: "El color de relleno de la puerta si tiene hijos",
  NODESTYLE_GATE_FILLSTYLE: "Estilo de relleno de fondo de la puerta",
  NODESTYLE_BASE: "Estilo base del nodo",
  NODESTYLE_CENTRAL: "Estilo del nodo central",
  NODESTYLE_INFERRED: "Estilo de los nodos inferidos",
  NODESTYLE_VIRTUAL: "Estilo de los nodos virtuales",
  NODESTYLE_SIBLING: "Estilo de los nodos hermanos",
  NODESTYLE_ATTACHMENT: "Estilo de los nodos de adjunto",
  NODESTYLE_FOLDER: "Estilo de los nodos de carpeta",
  NODESTYLE_TAG: "Estilo de los nodos de etiqueta",
  LINKSTYLE_COLOR: "Color",
  LINKSTYLE_WIDTH: "Ancho",
  LINKSTYLE_STROKE: "Estilo del trazo",
  LINKSTYLE_ROUGHNESS: "Rugosidad",
  LINKSTYLE_ARROWSTART: "Cabeza de flecha de inicio",
  LINKSTYLE_ARROWEND: "Cabeza de flecha de fin",
  LINKSTYLE_SHOWLABEL: "Mostrar etiqueta en el enlace",
  LINKSTYLE_FONTSIZE: "Tamaño de fuente de la etiqueta",
  LINKSTYLE_FONTFAMILY: "Fuente de la etiqueta",
  LINKSTYLE_BASE: "Estilo base del enlace",
  LINKSTYLE_INFERRED: "Estilo del enlace inferido",
  LINKSTYLE_FOLDER: "Estilo del enlace de carpeta",
  LINKSTYLE_TAG: "Estilo del enlace de etiqueta",
  //main
  DATAVIEW_NOT_FOUND: `Plugin Dataview no encontrado. Por favor, instala o habilita Dataview y luego intenta reiniciar ${APPNAME}.`,
  DATAVIEW_UPGRADE: `Por favor, actualiza Dataview a la versión 0.5.31 o superior. Actualiza Dataview y luego intenta reiniciar ${APPNAME}.`,
  EXCALIDRAW_NOT_FOUND: `Plugin Excalidraw no encontrado. Por favor, instala o habilita Excalidraw y luego intenta reiniciar ${APPNAME}.`,
  EXCALIDRAW_MINAPP_VERSION: `ExcaliBrain requiere Excalidraw ${MINEXCALIDRAWVERSION} o superior. Por favor, actualiza Excalidraw y luego intenta reiniciar ${APPNAME}.`,
  COMMAND_ADD_PARENT_FIELD: "Agregar campo de Dataview a la ontología como PADRE",
  COMMAND_ADD_CHILD_FIELD: "Agregar campo de Dataview a la ontología como HIJO",
  COMMAND_ADD_LEFT_FRIEND_FIELD: "Agregar campo de Dataview a la ontología como AMIGO LADO IZQUIERDO",
  COMMAND_ADD_RIGHT_FRIEND_FIELD: "Agregar campo de Dataview a la ontología como AMIGO LADO DERECHO",
  COMMAND_ADD_PREVIOUS_FIELD: "Agregar campo de Dataview a la ontología como ANTERIOR",
  COMMAND_ADD_NEXT_FIELD: "Agregar campo de Dataview a la ontología como SIGUIENTE",
  COMMAND_START: "ExcaliBrain Normal",
  COMMAND_START_HOVER: "ExcaliBrain Editor Emergente",
  COMMAND_START_POPOUT: "ExcaliBrain Ventana Emergente",
  //COMMAND_SEARCH: "Buscar",
  COMMAND_STOP: "Detener ExcaliBrain",
  HOVER_EDITOR_ERROR: "Lo siento. Algo salió mal. Lo más probable es que haya habido una actualización de versión en el Editor Emergente que no he abordado adecuadamente en ExcaliBrain. Normalmente debería solucionarlo en unos pocos días",
  //ToolsPanel
  OPEN_DRAWING: "Guardar instantánea para editar",
  SEARCH_IN_VAULT: "Los elementos marcados serán listados en una búsqueda vacía.\nBusca un archivo, una carpeta o una etiqueta en tu Vault.\nAlterna entre carpetas y etiquetas para mostrar/ocultar en la lista.",
  SHOW_HIDE_ATTACHMENTS: "Mostrar/Ocultar adjuntos",
  SHOW_HIDE_VIRTUAL: "Mostrar/Ocultar nodos virtuales",
  SHOW_HIDE_INFERRED: "Mostrar/Ocultar nodos inferidos",
  SHOW_HIDE_ALIAS: "Mostrar/Ocultar alias del documento",
  SHOW_HIDE_SIBLINGS: "Mostrar/Ocultar hermanos",
  SHOW_HIDE_EMBEDDEDCENTRAL: "Mostrar el nodo central como marco incorporado",
  SHOW_HIDE_FOLDER: "Mostrar/Ocultar nodos de carpeta",
  SHOW_HIDE_TAG: "Mostrar/Ocultar nodos de etiqueta",
  SHOW_HIDE_PAGES: "Mostrar/Ocultar nodos de página (incluye definidos, inferidos, virtuales y adjuntos)",
  PIN_LEAF: "Conectar ExcaliBrain a la hoja activa más reciente"
}
    
