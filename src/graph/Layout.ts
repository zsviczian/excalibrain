import { LayoutSpecification } from "src/Types";
import {Node} from "./Node";

export class Layout {
  nodes: Node[] = [];
  renderedNodes: Node[][] = [];
  spec: LayoutSpecification;

  constructor(spec: LayoutSpecification) {
    this.spec = spec;
  }

  layout(columns = this.spec.columns) {
    const generateLayoutVector = (pattern:number[]) => {
      const res:number[] = [];
      let cur = 1;
      let state = true;
      pattern
        .map(p => Math.floor(p))
        .forEach(cnt => {
          for(let i=0;i<cnt;i++) res.push(state ? null : cur++);
          state = !state;
        });
    return res;
  }
  
  const getRowLayout = (items: number) => items%2
    ? generateLayoutVector([(columns-items)/2,items,(columns-items)/2])
    : generateLayoutVector([(columns-items)/2,items/2,1,items/2,(columns-items)/2]);
    
  const sortedNodes = this.nodes.sort((a,b) => a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1)
  const itemCount = sortedNodes.length;
  if(itemCount === 0) {
    return;
  }
  const rowCount = Math.ceil(itemCount / columns);
  this.renderedNodes = Array<Node>(rowCount).fill(null).map((_,i) =>
    (i+1 < rowCount) || (itemCount % columns === 0)
      ? Array(columns).fill(null).map((_,j) => sortedNodes[i*columns+j]) //full row
      : getRowLayout(itemCount % columns).map(idx => idx ? sortedNodes[i*columns+idx-1]:null));
  }

  render() {
    this.layout();
    const rows = this.renderedNodes.length;
    const height = rows * this.spec.rowHeight;
    const top = (this.spec.top === null && this.spec.bottom === null) //unconstrained
      ? this.spec.origoY - height/2
      : this.spec.top !== null 
        ? (this.spec.origoY - height/2) < this.spec.top //top constrained
          ? this.spec.top
          : this.spec.origoY - height/2
        : (this.spec.origoY + height/2) > this.spec.bottom  //bottom constrained
          ? this.spec.bottom - height
          : this.spec.origoY - height/2;
    const center00 = {
      x: this.spec.origoX - (this.spec.columns === 1 ? 0 : (this.spec.columns-1)/2*this.spec.columnWidth),
      y: top
    };
    this.renderedNodes.forEach((nodes,row) =>
    nodes.forEach((node,idx) => {
      if(!node) return;
      node.setCenter({
        x: center00.x + idx*this.spec.columnWidth,
        y: center00.y + row*this.spec.rowHeight
      });
      node.render();
    })
    );
  }
}