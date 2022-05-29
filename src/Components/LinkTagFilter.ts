import { link } from "fs";
import ExcaliBrain from "src/main";
import { Multiselect } from "ts-multiselect";

export class LinkTagFilter {
  selectedLinks: Set<string> = new Set<string>();
  selectedTags: Set<string> = new Set<string>();
  filterDiv: HTMLDivElement;
  isOpen: boolean = false;
  selectedItems: any[];

  constructor(
    private plugin: ExcaliBrain,
    containerEl: HTMLElement
  ) {
    this.filterDiv = containerEl.createDiv({attr:{id: "filter"}});
  }

  render() {
    if(this.isOpen) {
      return;
    }
    this.filterDiv.empty();
    if(!this.plugin.scene) return;
    
    const selected:string[] = Array.from(this.selectedTags);
    this.selectedLinks.forEach(x=>selected.push("link::"+x));
    
    const options:{label:string,value:string}[] = [];   

    const links: Set<string> = new Set<string>(this.selectedLinks.keys());
    this.plugin.scene.links.links.forEach((link) => {
      link.hierarchyDefinition?.split(",")
        .map(h=>h.trim())
        .forEach(l=>links.add(l));
      if(!link.hierarchyDefinition) {
        if(link.isInferred) {
          links.add("inferred-link")
        } else {
          links.add("normal-link")
        }
      }
    });
    links.forEach(link=>options.push({label:link, value:"link::"+link}));

    

    const tags: Set<string> = new Set<string>(this.selectedTags.keys());
    this.plugin.scene.nodesMap.forEach(node => {
      if(node.page.primaryStyleTag) {
        tags.add(node.page.primaryStyleTag);
      }
    });
    tags.forEach(tag=>options.push({label:tag, value:tag}))

    const ms = new Multiselect({
      id: "filter",
      placeholder: "filter links and tags",
      options: options.sort((a,b)=>a.label>b.label?1:-1),
      selected: selected,
      onDropdownOpen: () => {
        this.isOpen = true;
        this.selectedItems = ms.selected;
      },
      onSelectionChange: (selectedItems) => {
        this.selectedLinks.clear();
        this.selectedTags.clear();
        selectedItems.forEach(x=>{
          if(x.startsWith("link::")) {
            this.selectedLinks.add(x.substring(6))
          }
          else {
            this.selectedTags.add(x);
          }
        })
        this.plugin.scene?.reRender(false);
      },
      onDropdownClose: (selectedItems) => {
        this.isOpen = false;
        if(selectedItems !== this.selectedItems) {
          this.plugin.scene?.reRender(false);
        }
      }
    })
  }
}