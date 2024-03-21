import ExcaliBrain from "src/excalibrain-main";
import { Neighbour } from "src/types";

export class PowerFilter {

  constructor(
    private plugin: ExcaliBrain,
  ) {
    this.plugin = plugin;
  }

  isNeighbourHidden(neighbor: Neighbour):boolean {
    if(!this.plugin.settings.applyPowerFilter) return false;
    return false;
  }
}