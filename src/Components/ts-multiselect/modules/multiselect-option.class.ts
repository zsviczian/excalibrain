export class MultiselectOption {
  private readonly multiple: boolean;
  private readonly onChange: (option: MultiselectOption) => void;
  private singleSelectTextSpanRef: HTMLSpanElement;
  private checkboxRef: HTMLInputElement;

  label = '';
  value: string;
  optionRef: HTMLElement;
  selected = false;

  constructor(
    value: string,
    label: string,
    multiple: boolean,
    onChange: (option: MultiselectOption) => void,
  ) {
    this.value = value;
    this.label = label;
    this.multiple = multiple;
    this.onChange = onChange;

    this.createOptionElement();
    this.createListeners();
  }

  select(emitEvent = true): void {
    this.selected = true;
    this.setAttribute();
    if (emitEvent) this.onChange(this);
  }

  deselect(emitEvent = true): void {
    this.selected = false;
    this.setAttribute();
    if (emitEvent) this.onChange(this);
  }

  private createOptionElement(): void {
    const option = createDiv({ cls: 'option' });

    this.singleSelectTextSpanRef = createSpan({ cls: 'option-text', text: this.label });
    option.appendChild(this.singleSelectTextSpanRef);
    option.appendChild(this.createCheckbox());
    this.optionRef = option;
  }

  private createCheckbox(): HTMLLabelElement {
    const labelEl = createEl('label', { cls: 'checkbox-wrapper' });
    const textSpan = createSpan({ cls: 'checkbox-text', text: this.label });
    const input = createEl('input', { type: 'checkbox' });
    this.checkboxRef = input;
    const checkmarkSpan = createSpan({ cls: 'checkbox-checkmark' });

    labelEl.appendChild(textSpan);
    labelEl.appendChild(input);
    labelEl.appendChild(checkmarkSpan);
    return labelEl;
  }

  private setAttribute(): void {
    if (this.multiple) {
      this.checkboxRef.checked = this.selected;
    } else {
      this.singleSelectTextSpanRef.toggleClass('selected', this.selected);
    }
  }

  private createListeners(): void {
    if (this.multiple) {
      this.checkboxRef.addEventListener('change', () => {
        this.selected = this.checkboxRef.checked;
        this.onChange(this);
      });
    } else {
      this.singleSelectTextSpanRef.addEventListener('click', () => {
        this.selected = true;
        this.onChange(this);
      });
    }
  }
}
