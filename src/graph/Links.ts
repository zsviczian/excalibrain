import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import ExcaliBrain from "src/excalibrain-main";
import { ExcaliBrainSettings } from "src/Settings";
import { LinkDirection, RelationType, Role } from "src/types";
import { Link } from "./Link";
import { Node } from "./Node";

const SEPARATOR = "|:?:|"

export class Links {
  links: Map<string,Link> = new Map<string,Link>();
  reverseLinks: Set<string> = new Set<string>();
  constructor(private plugin:ExcaliBrain) {

  }

  addLink(
    nodeA: Node,
    nodeB: Node,
    nodeBRole: Role,
    relation: RelationType,
    hierarchyDefinition: string,
    linkDirection: LinkDirection,
    ea: ExcalidrawAutomate,
    settings: ExcaliBrainSettings
  ) {
    const key1 = nodeA.page.path+SEPARATOR+nodeB.page.path;
    if(this.links.has(key1) || this.reverseLinks.has(key1)) {
      return;
    }
    const key2 = nodeB.page.path+SEPARATOR+nodeA.page.path;
    const link = new Link(
      linkDirection===LinkDirection.FROM
        ? nodeB
        : nodeA,
        linkDirection===LinkDirection.FROM
        ? nodeA
        : nodeB,
        linkDirection===LinkDirection.FROM
          ? nodeBRole === Role.LEFT || nodeBRole === Role.RIGHT
            ? nodeBRole === Role.LEFT ? Role.LEFT : Role.RIGHT
            : nodeBRole === Role.CHILD
              ? Role.PARENT
              : Role.CHILD
          : nodeBRole,
      relation,
      hierarchyDefinition,
      ea,
      settings,
      this.plugin
    )
    this.links.set(key1, link),
    this.reverseLinks.add(key2)
  }

  render(linksToHide:string[]) {
    this.links.forEach(link=>
      link.render(
        linksToHide.some(lth=>link.hierarchyDefinition?.includes(lth)) ||
        (link.isInferred && linksToHide.includes("inferred-link"))
      )
    );
  }
}