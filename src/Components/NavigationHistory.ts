import { ToggleButton } from "./ToggleButton";

export class NavigationHistory {
  private history: string[] = [];
  private currentPosition: number = -1;
  private navigateButtons: ToggleButton[];

  constructor(savedHistory: string[]) {
    this.history = savedHistory;
    this.currentPosition = savedHistory.length - 1;
  }

  setNavigateButtons(navigateButtons:ToggleButton[]) {
    this.navigateButtons  = navigateButtons;
  }

  addToHistory(path: string) {
    if(this.navigateButtons) {
      this.navigateButtons.forEach(b=>b.updateButton());
    }
    // Check if the path is already at the end of history (i.e., the current page)
    if (this.history[this.currentPosition] === path) {
      return;
    }

    // Remove the path if it already exists in history
    const i = this.history.indexOf(path);
    if (i > -1) {
      this.history.splice(i, 1);
    }

    // Add the path to the end of history
    this.history.push(path);

    // Remove the oldest path if the history length exceeds 50
    if (this.history.length > 50) {
      this.history.shift();
    }

    // Update the current position to point to the latest path
    this.currentPosition = this.history.length - 1;
  }

  get length() {
    return this.history.length;
  }

  get last() {
    return this.history[this.currentPosition];
  }

  get() {
    return this.history;
  }

  getPrevious() {
    // Check if there are any previous paths
    if (this.currentPosition > 0) {
      // Move one step backward in history
      this.currentPosition--;
      return this.history[this.currentPosition];
    }
    // If there are no previous paths, return null or handle as needed
    return null;
  }

  getNext() {
    // Check if there are any next paths
    if (this.currentPosition < this.history.length - 1) {
      // Move one step forward in history
      this.currentPosition++;
      return this.history[this.currentPosition];
    }
    // If there are no next paths, return null or handle as needed
    return null;
  }

  // Function to check if there are elements forward in the history
  hasNext() {
    return this.currentPosition < this.history.length - 1;
  }

  // Function to check if there are elements backward in the history
  hasPrevious() {
    return this.currentPosition > 0;
  }
}
