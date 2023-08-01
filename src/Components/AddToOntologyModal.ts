import { create } from "domain";
import { App, Modal, Notice, Setting } from "obsidian";
import { createBinaryOps } from "obsidian-dataview/lib/expression/binaryop";
import ExcaliBrain from "src/excalibrain-main";
import { t } from "src/lang/helpers";

export enum Ontology {
  Parent = "parent",
  Child = "child",
  LeftFriend = "leftFriend",
  RightFriend = "rightFriend",
  Previous = "previous",
  Next = "next",
}

export class AddToOntologyModal extends Modal {
  private ontology:Ontology|null = null;
  private fieldName:string;
  constructor(
    app: App,
    private plugin: ExcaliBrain,
  ) {
    super(app);
  }

  private getCurrentOntology():Ontology|null {
    const { settings } = this.plugin;
    const field = this.fieldName;

    if(settings.hierarchy.parents.includes(field)) {
      return Ontology.Parent;
    }
    if(settings.hierarchy.children.includes(field)) {
      return Ontology.Child;
    }
    if(settings.hierarchy.leftFriends.includes(field)) {
      return Ontology.LeftFriend;
    }
    if(settings.hierarchy.rightFriends.includes(field)) {
      return Ontology.RightFriend;
    }
    if(settings.hierarchy.previous.includes(field)) {
      return Ontology.Previous;
    }
    if(settings.hierarchy.next.includes(field)) {
      return Ontology.Next;
    }

    return null;
  }

  private async setOntology(ontology:Ontology) {
    if(this.ontology === ontology) return;
    const { settings } = this.plugin;
    const plugin = this.plugin;

    //remove from current ontology
    switch(this.ontology) {
      case Ontology.Parent:
        settings.hierarchy.parents = settings.hierarchy.parents.filter(f=>f!==this.fieldName);
        plugin.hierarchyLowerCase.parents = [];
        settings.hierarchy.parents.forEach(f=>plugin.hierarchyLowerCase.parents.push(f.toLowerCase().replaceAll(" ","-")));  
        break;
      case Ontology.Child:
        settings.hierarchy.children = settings.hierarchy.children.filter(f=>f!==this.fieldName);
        plugin.hierarchyLowerCase.children = [];
        settings.hierarchy.children.forEach(f=>plugin.hierarchyLowerCase.children.push(f.toLowerCase().replaceAll(" ","-")));
        break;
      case Ontology.LeftFriend:
        settings.hierarchy.leftFriends = settings.hierarchy.leftFriends.filter(f=>f!==this.fieldName);
        plugin.hierarchyLowerCase.leftFriends = [];
        settings.hierarchy.leftFriends.forEach(f=>plugin.hierarchyLowerCase.leftFriends.push(f.toLowerCase().replaceAll(" ","-")));
        break;
      case Ontology.RightFriend:
        settings.hierarchy.rightFriends = settings.hierarchy.rightFriends.filter(f=>f!==this.fieldName);
        plugin.hierarchyLowerCase.rightFriends = [];
        settings.hierarchy.rightFriends.forEach(f=>plugin.hierarchyLowerCase.rightFriends.push(f.toLowerCase().replaceAll(" ","-")));
        break;
      case Ontology.Previous:
        settings.hierarchy.previous = settings.hierarchy.previous.filter(f=>f!==this.fieldName);
        plugin.hierarchyLowerCase.previous = [];
        settings.hierarchy.previous.forEach(f=>plugin.hierarchyLowerCase.previous.push(f.toLowerCase().replaceAll(" ","-")));
        break;
      case Ontology.Next:
        settings.hierarchy.next = settings.hierarchy.next.filter(f=>f!==this.fieldName);
        plugin.hierarchyLowerCase.next = [];
        settings.hierarchy.next.forEach(f=>plugin.hierarchyLowerCase.next.push(f.toLowerCase().replaceAll(" ","-")));
        break;
    }
    
    //add to new ontology
    switch(ontology) {
      case Ontology.Parent:
        settings.hierarchy.parents.push(this.fieldName);
        settings.hierarchy.parents = settings.hierarchy.parents.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
        plugin.hierarchyLowerCase.parents = [];
        settings.hierarchy.parents.forEach(f=>plugin.hierarchyLowerCase.parents.push(f.toLowerCase().replaceAll(" ","-")));
        break;
      case Ontology.Child:
        settings.hierarchy.children.push(this.fieldName);
        settings.hierarchy.children = settings.hierarchy.children.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
        plugin.hierarchyLowerCase.children = [];
        settings.hierarchy.children.forEach(f=>plugin.hierarchyLowerCase.children.push(f.toLowerCase().replaceAll(" ","-")));
        break;
      case Ontology.LeftFriend:
        settings.hierarchy.leftFriends.push(this.fieldName);
        settings.hierarchy.leftFriends = settings.hierarchy.leftFriends.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
        plugin.hierarchyLowerCase.leftFriends = [];
        settings.hierarchy.leftFriends.forEach(f=>plugin.hierarchyLowerCase.leftFriends.push(f.toLowerCase().replaceAll(" ","-")));
        break;
      case Ontology.RightFriend:
        settings.hierarchy.rightFriends.push(this.fieldName);
        settings.hierarchy.rightFriends = settings.hierarchy.rightFriends.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
        plugin.hierarchyLowerCase.rightFriends = [];
        settings.hierarchy.rightFriends.forEach(f=>plugin.hierarchyLowerCase.rightFriends.push(f.toLowerCase().replaceAll(" ","-")));
        break;
      case Ontology.Previous:
        settings.hierarchy.previous.push(this.fieldName);
        settings.hierarchy.previous = settings.hierarchy.previous.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
        plugin.hierarchyLowerCase.previous = [];
        settings.hierarchy.previous.forEach(f=>plugin.hierarchyLowerCase.previous.push(f.toLowerCase().replaceAll(" ","-")));
        break;
      case Ontology.Next:
        settings.hierarchy.next.push(this.fieldName);
        settings.hierarchy.next = settings.hierarchy.next.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
        plugin.hierarchyLowerCase.next = [];
        settings.hierarchy.next.forEach(f=>plugin.hierarchyLowerCase.next.push(f.toLowerCase().replaceAll(" ","-")));
        break;
    }
    await this.plugin.saveSettings();
    if (plugin.scene && !plugin.scene.terminated) {
      plugin.scene.vaultFileChanged = true;
    }
    new Notice(`Added ${this.fieldName} as ${ontology}`);
    this.fieldName = null;
    this.close();
  }

  async show( fieldName:string ) {
    await this.plugin.loadSettings();
    this.fieldName = fieldName;
    this.ontology = this.getCurrentOntology();
    this.open();
  }

  public async addFieldToOntology(ontology:Ontology, fieldName:string) {
    await this.plugin.loadSettings();
    this.fieldName = fieldName;
    this.ontology = this.getCurrentOntology();
    await this.setOntology(ontology);
    this.fieldName = null;
  }
  
  open () {
    if(!this.fieldName) return;
    const { contentEl, titleEl } = this;
    titleEl.setText(this.fieldName);
    contentEl.createEl("p", {text: t("ADD_TO_ONTOLOGY_MODAL_DESC")});
    const setting = new Setting(contentEl)
      .addButton((b) => {
        b.buttonEl.style.flex = "1 0 calc(33.33% - var(--size-4-2))";
        b.setButtonText(t("PARENTS_NAME"))
        if(this.ontology === Ontology.Parent) b.setCta();
        b.onClick(()=>this.setOntology(Ontology.Parent))
      })
      .addButton((b) => {
        b.buttonEl.style.flex = "1 0 calc(33.33% - var(--size-4-2))";
        b.setButtonText(t("CHILDREN_NAME"))
        if(this.ontology === Ontology.Child) b.setCta();
        b.onClick(()=>this.setOntology(Ontology.Child))
      })
      .addButton((b) => {
        b.buttonEl.style.flex = "1 0 calc(33.33% - var(--size-4-2))";
        b.setButtonText(t("LEFT_FRIENDS_NAME"))
        if(this.ontology === Ontology.LeftFriend) b.setCta();
        b.onClick(()=>this.setOntology(Ontology.LeftFriend))
      })
      .addButton((b) => {
        b.buttonEl.style.flex = "1 0 calc(33.33% - var(--size-4-2))";
        b.setButtonText(t("RIGHT_FRIENDS_NAME"))
        if(this.ontology === Ontology.RightFriend) b.setCta();
        b.onClick(()=>this.setOntology(Ontology.RightFriend))
      })
      .addButton((b) => {
        b.buttonEl.style.flex = "1 0 calc(33.33% - var(--size-4-2))";
        b.setButtonText(t("PREVIOUS_NAME"))
        if(this.ontology === Ontology.Previous) b.setCta();
        b.onClick(()=>this.setOntology(Ontology.Previous))
      })
      .addButton((b) => {
        b.buttonEl.style.flex = "1 0 calc(33.33% - var(--size-4-2))";
        b.setButtonText(t("NEXT_NAME"))
        if(this.ontology === Ontology.Next) b.setCta();
        b.onClick(()=>this.setOntology(Ontology.Next))
      });
    setting.controlEl.style.flexWrap = "wrap";
    setting.controlEl.style.justifyContent = "space-between";
    super.open();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}