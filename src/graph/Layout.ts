import { LayoutSpecification } from "src/types";
import {Node} from "./Node";

export class Layout {
  nodes: Node[] = [];
  renderedNodes: Node[][] = [];
  spec: LayoutSpecification;

  constructor(spec: LayoutSpecification) {
    this.spec = spec;
  }

  layout(columns = this.spec.columns) {
    const generateOddLayoutVector = (pattern:number[]) => {
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

    const generateEvenLayoutVector = (pattern: number[]) => {
      const res:number[] = [];
      let i = 0;
      for(i=columns/2;i>pattern[0];i--) res.push(null);
      for(i=0;i<pattern[0];i++) res.push(i+1);
      for (i=0;i<columns/2;i++) res.push(i<pattern[1]?pattern[0]+i+1:null);
      return res;
    }
  
    const getRowLayout = (items: number) => columns%2
      ? (items%2 //even columns
        ? generateEvenLayoutVector([(items+1)/2,(items-1)/2]) //odd
        : generateEvenLayoutVector([items/2,items/2])) //even
      : (items%2 //odd columns
        ? generateOddLayoutVector([(columns-items)/2,items,(columns-items)/2]) //odd
        : generateOddLayoutVector([(columns-items)/2,items/2,1,items/2,(columns-items)/2])); //even
    
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
  private setCompactPosition(center00: { x: number, y: number }) {
    const fixOverlap = (center00: { x: number, y: number }) => {

      //I think if LayoutSpecification could add layoutPositionTag property: 'center' | 'children' | ...
      //,this will be more simple and clear.
      const layoutPosition = this.spec.origoX === 0
        ? (this.spec.top === null && this.spec.bottom === null)
          ? 'center'
          : this.spec.origoY < 0 ? 'top' : 'bottom'
        : (this.spec.top === null && this.spec.bottom === null)
          ? this.spec.origoX < 0 ? 'left' : 'right'
          : 'sibling';

      if (layoutPosition === 'center') {
        return this.setPosition(center00);
      }
      if (layoutPosition === 'sibling') {
        const maxNodeWidth = Math.max(...this.renderedNodes.flatMap(row =>
          row.map(node => node?.labelSize().width)
        ));
        const gap = Math.abs(this.spec.origoX);
        const offset = maxNodeWidth > gap
          ? (maxNodeWidth - gap) + 0.5 * maxNodeWidth
          : 0;
        const newCenter00 = {
          x: center00.x + offset,
          y: center00.y,
        }
        return this.setPosition(newCenter00);
      }
      if (layoutPosition === 'left' || layoutPosition === 'right') {
        const maxNodeWidth = Math.max(...this.renderedNodes.flat().map(node => node?.labelSize().width));
        const offset = maxNodeWidth > this.spec.columnWidth
          ? (maxNodeWidth - this.spec.columnWidth) / 2 + 0.2 * maxNodeWidth
          : 0;
        const newCenter00 = {
          x: layoutPosition === 'left'
            ? center00.x - offset
            : center00.x + offset,
          y: center00.y,
        }
        return this.setPosition(newCenter00);

      }
      else {
        const rowWidth = this.spec.columns * this.spec.columnWidth;
        const nodeGap = rowWidth * 0.1;
        const initialCenter = (spec: LayoutSpecification, width: number, row: number) => {
          return width > spec.columnWidth
            ? {
              x: center00.x + (width - spec.columnWidth) / 2,
              y: center00.y + row * spec.rowHeight,
            }
            : {
              x: center00.x - (spec.columnWidth - width) / 2,
              y: center00.y + row * spec.rowHeight,
            }
        }
        const nodes = this.renderedNodes.flat().filter(node => !!node);
        let stackWidth = 0;
        let nodesInfo: { x: number, y: number, width: number }[][] = [];
        const alignCenter = (nodeInfo: { x: number, y: number, width: number }[]) => {
          const centerX = center00.x - this.spec.columnWidth/2 + rowWidth/2;
          let l = 0;
          let r = nodeInfo.length-1;
          while (l<=r){
            const left = nodeInfo[l];
            const right = nodeInfo[r];
            const offset = centerX-(left.x + right.x)/2;
              nodeInfo[l] = {...left,x:left.x + offset};
              nodeInfo[r] = {...right,x:right.x + offset};
              l +=1;
              r -=1;
          }
          return nodeInfo;
        }

        nodes.forEach((node, index) => {
          const width = node.labelSize().width;
          const row = nodesInfo.length - 1;
          if (index === 0) {
            const init = initialCenter(this.spec, width, 0);
            stackWidth = width;
            nodesInfo.push([{ ...init, width }]);
          }
          else if ((stackWidth + nodeGap + width) > rowWidth) {
            nodesInfo[row] = alignCenter(nodesInfo[row]);
            const newRow = row + 1;
            const init = initialCenter(this.spec, width, newRow);
            stackWidth = width;
            nodesInfo.push([{ width, ...init }]);
          }
          else {
            const prev_center = nodesInfo[row].last();
            nodesInfo[row].push({
              ...prev_center,
              width,
              x: prev_center.x + prev_center.width / 2 + nodeGap + width / 2,
            })
            stackWidth = stackWidth + nodeGap + width;
          }

        });

        const nodePosition = nodesInfo.flatMap((nodes, row) => {
          if (row === nodesInfo.length - 1) {
            return alignCenter(nodes)
          }
          return nodes
        });

        return nodes.map((node, index) => {
          const info = nodePosition[index];
          node?.setCenter({ ...info });
          return node;
        });
      }
    }
    return fixOverlap(center00);
  }
  private setPosition(center00: { x: number, y: number }) {
    return this.renderedNodes.map((nodes, row) => {
      return nodes.map((node, idx) => {
        node?.setCenter({
          x: center00.x + idx * this.spec.columnWidth,
          y: center00.y + row * this.spec.rowHeight
        });
        return node
      })
    }).flat();
  }
  async render(isCompactView:boolean) {
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

    const renderedNodesWithPosition = isCompactView
      ? this.setCompactPosition(center00)
      : this.setPosition(center00);
    for (const [_, node] of renderedNodesWithPosition.entries()) {
      if (node) {
        await node.render();
        }
      }
    }
}