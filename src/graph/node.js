class Node {
  constructor(spec) {
    const dvPage = spec.file ? DataviewAPI?.page(spec.file.path) : null;
	const tag = (dvPage?.file?.tags?.values??[]).filter(t=>FORMATTED_TAGS.some(x=>t.startsWith(x)))[0];
	if(tag) {
      const format = NODE_FORMATTING[FORMATTED_TAGS.filter(x=>tag.startsWith(x))[0]];
      spec.gateColor = format.gateColor ?? spec.gateColor;
      spec.backgroundColor = format.backgroundColor ?? spec.backgroundColor;
      spec.nodeColor = format.nodeColor ?? spec.nodeColor;
      spec.borderColor = format.borderColor ?? spec.borderColor;
      spec.prefix = format.prefix;
	}
	this.spec = spec;

    const aliases = (spec.file && USE_ALIAS)
      ? (dvPage?.file?.aliases?.values??[])
      : [];
    const label = (spec.prefix??"") + (aliases.length > 0 
      ? aliases[0] 
      : (spec.file
        ? (spec.file.extension === "md" ? spec.file.basename : spec.file.name)
        : spec.nodeTitle));
    this.label = label.length > spec.maxLabelLength
      ? label.substring(0,spec.maxLabelLength-1) + "..."
      : label;
    this.labelSize = measureText(this.label, spec.fontSize);
  }

  setCenter(center) {
    this.center = center;
  }
  
  render() {
    ea.style.fontSize = this.spec.fontSize;
    ea.style.strokeColor = this.spec.file
      ? this.spec.nodeColor
      : this.spec.virtualNodeColor;
    ea.style.backgroundColor = "transparent";
    this.id = ea.addText(
      this.center.x - this.labelSize.width / 2, 
      this.center.y - this.labelSize.height / 2,
      this.label,
      {
        wrapAt: this.spec.maxLabelLength+5,
        textAlign: "center",
        box: true,
        boxPadding: this.spec.padding
      }
    );
    const box = ea.getElement(this.id);
    box.link = `[[${this.spec.file?.path??this.spec.nodeTitle}]]`;
    box.backgroundColor = this.spec.file
      ? this.spec.backgroundColor
      : this.spec.virtualNodeBGColor;
    box.strokeColor = this.spec.borderColor;
    box.strokeStyle = this.spec.strokeStyle??"solid";

    ea.style.strokeColor = this.spec.gateColor;
    ea.style.backgroundColor =  this.spec.hasJumps ? this.spec.gateColor : "transparent";
    this.jumpGateId = ea.addEllipse(
      this.spec.jumpOnLeft
        ? this.center.x - this.spec.gateRadius * 2 - this.spec.padding - this.labelSize.width / 2
        : this.center.x + this.spec.padding + this.labelSize.width / 2,
      this.center.y - this.spec.gateRadius,
      this.spec.gateRadius * 2,
      this.spec.gateRadius * 2
    );
    ea.style.backgroundColor =  this.spec.hasParents ? this.spec.gateColor : "transparent";
    this.parentGateId = ea.addEllipse(
      this.center.x - this.spec.gateRadius - this.spec.gateOffset,
      this.center.y - 2 * this.spec.gateRadius - this.spec.padding - this.labelSize.height / 2,
      this.spec.gateRadius * 2,
      this.spec.gateRadius * 2
    );
    ea.style.backgroundColor =  this.spec.hasChildren ? this.spec.gateColor : "transparent";
    this.childGateId = ea.addEllipse(
      this.center.x - this.spec.gateRadius + this.spec.gateOffset,
      this.center.y + this.spec.padding + this.labelSize.height / 2,
      this.spec.gateRadius * 2,
      this.spec.gateRadius * 2
    );
    
    ea.addToGroup([this.jumpGateId,this.parentGateId,this.childGateId,this.id, box.boundElements[0].id]);
  }
}

settings = {
	"Confirmation prompt at startup": {
	  value: true,
	  description: "Prompt me to confirm starting of the script because " +
	    "it will overwrite the current active drawing. " +
	    "You can disable this warning by turning off this switch"
	},
    "Max number of nodes/domain": {
      value: 30,
      description: "Maximum number of items to show in each domain: parents, children, siblings, jumps."
    },
    "Infer non-Breadcrumbs links": {
      value: true,
      description: "Links on the page are children, backlinks to the page are " +
        "parents. Breadcrumbs take priority. Inferred nodes have a dashed border."
    },
    "Hide attachments": {
      value: true,
      description: "Hide attachments. Will only have an effect if Infer non-Breadcrumbs links is turned on."
    },
    "Font family": {
      value: "Code",
      valueset: ["Hand-drawn","Normal","Code","Fourth (custom) Font"]
    },
    "Stroke roughness": {
      value: "Architect",
      valueset: ["Architect", "Artist", "Cartoonist"]
    },
    "Rectangle stroke sharpness": {
      value: "round",
      valueset: ["sharp", "round"]
    },
    "Central font size": {
      value: 30,
      description: "Font size of the central node"
    },
    "Font size": {
      value: 20,
      description: "Font size of jumps, children and parents"
    },
    "Siblings font size": {
      value: 15,
      description: "Font size of siblings"
    },
    "Max label length": {
      value: 30,
      description: "Maximum number of characters to display from node title. Longer nodes will end with '...'"
    },
    "Padding": {
      value: 10,
      description: "Padding of the node rectangle"
    },
    "Gate offset": {
      value: 15,
      description: "The offset to the left and right of the parent and child gates."
    },  
    "Gate radius": {
      value: 5,
      description: "The radius of the 3 small circles (alias: gates) serving as connection points for nodes"
    },
    "Canvas color": {
      value: "hsl(208, 80%, 23%)",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Gate color": {
      value: "white",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Link color": {
      value: "hsl(0, 0%, 41%)",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Central-node background color": {
      value: "#C49A13",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Central-node color": {
      value: "black",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Breadcrumbs-node background color": {
      value: "rgba(0,0,0,0.4)",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Breadcrumbs-node color": {
      value: "white",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Non-breadcrumbs-node background color": {
      value: "rgba(0,0,5,0.7)",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Non-breadcrumbs-node color": {
      value: "hsl(208, 80%, 77%)",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Virtual-node background color": {
      value: "rgba(255,0,0,0.4)",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    },
    "Virtual-node color": {
      value: "white",
      description: "Any legal HTML color (#000000, rgb, color-name, etc.)."
    }
  };