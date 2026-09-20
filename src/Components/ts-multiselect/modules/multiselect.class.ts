import { MultiselectConfig } from '../models/multiselect-config';
import { MultiselectOption } from './multiselect-option.class';
import { IMultiselectOption } from '../models/multiselect-option';

export class Multiselect {
  private readonly config: MultiselectConfig;

  private origin: HTMLElement;
  private configOptions: IMultiselectOption[];
  private multiple: boolean;
  private singularNominativeLabel?: string;
  private pluralNominativeLabel?: string;
  private pluralGenitiveLabel?: string;
  private placeholder: string;
  private headerLabel?: string;
  private onDropdownOpen?: () => void;
  private onDropdownClose?: (selectedItems: string[]) => void;
  private onSelectionChange?: (selectedItems: string[]) => void;

  private selectHeaderRef?: HTMLElement;
  private selectWrapperRef: HTMLElement;
  private selectedValueRef: HTMLElement;
  private optionsWrapperRef: HTMLElement;
  private options: MultiselectOption[] = [];
  private dropdownOpened = false;
  private destroyed = false;

  public selected: string[];
  public rendered = false;

  private readonly documentClickDropdownToggle = (event: MouseEvent): void => {
    const target = event.target;
    if (target instanceof Node && !this.selectWrapperRef.contains(target)) {
      this.handleDropdownToggle(false, this.dropdownOpened);
    }
  };

  constructor(config: MultiselectConfig) {
    this.config = config;
    this.assignConfig();
    if (!this.origin) {
      throw new Error('You have to pass origin element!');
    }
    this.setOrigin();
    this.init();
  }

  public init(): void {
    this.destroyed = false;
    this.dropdownOpened = false;
    this.createSelect();
    this.createListeners();
  }

  public destroy(): void {
    this.destroyed = true;
    this.rendered = false;
    this.hide();
    this.origin.ownerDocument.removeEventListener('click', this.documentClickDropdownToggle);
    this.options = [];
  }

  public reset(): void {
    this.options.forEach((option) => option.deselect(false));
    this.updateSelection();
  }

  public hide(): void {
    this.origin.replaceChildren();
    this.rendered = false;
  }

  public render(): void {
    if (this.destroyed) {
      throw new Error('Cannot render a destroyed multiselect.');
    }
    if (this.origin.innerText.trim()) {
      throw new Error('Multiselect is already rendered.');
    }

    this.origin.appendChild(this.selectWrapperRef);
    this.rendered = true;
    if (this.selectHeaderRef) this.origin.prepend(this.selectHeaderRef);
  }

  private assignConfig(): void {
    this.origin = this.config.origin;
    this.configOptions = this.config.options;
    this.multiple = this.config.multiple ?? true;
    this.singularNominativeLabel = this.config.singularNominativeLabel;
    this.pluralNominativeLabel = this.config.pluralNominativeLabel;
    this.pluralGenitiveLabel = this.config.pluralGenitiveLabel;
    this.placeholder = this.config.placeholder ?? '';
    this.headerLabel = this.config.headerLabel;
    this.selected = this.config.selected ?? [];
    this.onDropdownOpen = this.config.onDropdownOpen;
    this.onDropdownClose = this.config.onDropdownClose;
    this.onSelectionChange = this.config.onSelectionChange;
  }

  private setOrigin(): void {
    this.origin.addClass('multiselect-container');
  }

  private createHeader(): void {
    if (!this.headerLabel) return;
    this.selectHeaderRef = createDiv({ cls: 'multiselect-header', text: this.headerLabel });
  }

  private createSelect(): void {
    this.selectWrapperRef = createDiv({ cls: 'multiselect-wrapper' });
    if (!this.multiple) this.selectWrapperRef.addClass('single-select');

    this.selectedValueRef = createDiv({ cls: 'selected-value' });
    this.selectWrapperRef.appendChild(this.selectedValueRef);

    this.optionsWrapperRef = createDiv({ cls: 'options-wrapper' });
    this.configOptions.forEach((option) => {
      const optionClass = new MultiselectOption(
        option.value,
        option.label,
        this.multiple,
        this.onSelectChange.bind(this),
      );
      if (this.selected.includes(option.value)) optionClass.select(false);
      this.options.push(optionClass);
      this.optionsWrapperRef.appendChild(optionClass.optionRef);
    });
    this.updateSelection();
    this.selectWrapperRef.appendChild(this.optionsWrapperRef);
    this.createHeader();
    this.render();
  }

  private createListeners(): void {
    this.selectWrapperRef.addEventListener('click', (event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        this.selectWrapperRef.contains(target) &&
        !this.optionsWrapperRef.contains(target)
      ) {
        this.handleDropdownToggle(!this.dropdownOpened);
      }
    });
    this.origin.ownerDocument.addEventListener('click', this.documentClickDropdownToggle);
  }

  private handleDropdownToggle(opened: boolean, emitEvent = true): void {
    this.dropdownOpened = opened;
    this.selectWrapperRef.toggleClass('opened', opened);

    if (opened) {
      if (this.onDropdownOpen && emitEvent) this.onDropdownOpen();
    } else if (this.onDropdownClose && emitEvent) {
      this.onDropdownClose(this.selected);
    }
  }

  private onSelectChange(option: MultiselectOption): void {
    if (!this.multiple) {
      this.options.forEach((item) => item.deselect(false));
      option.select(false);
    }

    this.updateSelection();
    this.onSelectionChange?.(this.selected);

    if (!this.multiple) this.handleDropdownToggle(false);
  }

  private updateSelection(): void {
    const selectedOptions = this.options.filter((option) => option.selected);
    this.selected = selectedOptions.map((option) => option.value);
    const labels = selectedOptions.map((option) => option.label);

    let label = this.placeholder;
    if (labels.length === 1) {
      label = labels[0];
    } else if (labels.length > 1) {
      label = `${labels.length} ${this.transformPluralLabel(labels.length)}`;
    }
    this.selectedValueRef.setText(label);
  }

  private transformPluralLabel(value: number): string {
    if (value === 1) return this.singularNominativeLabel ?? 'items';
    if (value % 10 >= 2 && value % 10 <= 4 && (value % 100 < 10 || value % 100 >= 20)) {
      return this.pluralNominativeLabel ?? 'items';
    }
    return this.pluralGenitiveLabel ?? 'items';
  }
}
