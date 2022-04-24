import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import { ExcaliBrainSettings } from "src/Settings";
import { RelationType, Role } from "src/Types";
import { Link } from "./Link";
import { Node } from "./Node";

const SEPARATOR = "|:?:|"

export class Links {
  links: Map<string,Link> = new Map<string,Link>();
  reverseLinks: Set<string> = new Set<string>();
  constructor() {

  }

  addLink(
    nodeA: Node,
    nodeB: Node,
    nodeBRole: Role,
    relation: RelationType,
    hierarchyDefinition: string,
    ea: ExcalidrawAutomate,
    settings: ExcaliBrainSettings
  ) {
    const key1 = nodeA.page.path+SEPARATOR+nodeB.page.path;
    if(this.links.has(key1) || this.reverseLinks.has(key1)) {
      return;
    }
    const key2 = nodeB.page.path+SEPARATOR+nodeA.page.path;
    const link = new Link(
      nodeA,
      nodeB,
      nodeBRole,
      relation,
      hierarchyDefinition,
      ea,
      settings
    )
    this.links.set(key1, link),
    this.reverseLinks.add(key2)
  }

  render() {
    this.links.forEach(link=>link.render());
  }
}