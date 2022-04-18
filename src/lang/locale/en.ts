import { APPNAME } from "src/constants";

//English
export default {
  //settings
  JSON_MALFORMED: `Malformed JSON`,
  JSON_MISSING_KEYS: `JSON must have these 3 keys: "parents", "children", "friends"`,
  JSON_VALUES_NOT_STRING_ARRAYS: `Key values must be a non-empty array of strings. e.g. "parents": ["Parent", "Parents", "up"]`,
  HIERARCHY_NAME: "Hierarchy",
  HIERARCHY_DESC: "User hierarchy JSON",

  //main
  DATAVIEW_NOT_FOUND: `Dataview plugin not found. Please install or enable dataview, then try restarting ${APPNAME}`
}