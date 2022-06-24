export class MultiselectOption {
	private multiple: boolean;
	private onChange: (option: MultiselectOption) => any;
	private singleSelectTextSpanRef: HTMLSpanElement;
	private checkboxRef: HTMLInputElement;

	label: string = '';
	value: any;
	optionRef: HTMLElement;
	selected: boolean = false;

	constructor(
		value: string | number,
		label: string,
		multiple: boolean,
		onChange: (option: MultiselectOption) => any,
	) {
		this.value = value;
		this.label = label;
		this.multiple = multiple;
		this.onChange = onChange;

		this.createOptionElement();
		this.createListeners();
	}

	select(emitEvent: boolean = true) {
		this.selected = true;
		this.setAttribute();

		if (emitEvent) {
			this.onChange(this);
		}
	}

	deselect(emitEvent: boolean = true) {
		this.selected = false;
		this.setAttribute();

		if (emitEvent) {
			this.onChange(this);
		}
	}

	private createOptionElement() {
		const option: HTMLElement = document.createElement('div');
		option.classList.add('option');

		this.singleSelectTextSpanRef = document.createElement('span');
		this.singleSelectTextSpanRef.classList.add('option-text');
		this.singleSelectTextSpanRef.innerText = this.label;
		option.appendChild(this.singleSelectTextSpanRef)

		option.appendChild(this.createCheckbox());
		this.optionRef = option;
	}

	private createCheckbox(): HTMLLabelElement {
		const labelEl: HTMLLabelElement = document.createElement('label');
		labelEl.classList.add('checkbox-wrapper');
		const textSpan: HTMLSpanElement = document.createElement('span');
		textSpan.classList.add('checkbox-text');
		textSpan.innerText = this.label;
		const input: HTMLInputElement = document.createElement('input');
		input.setAttribute('type', 'checkbox');
		this.checkboxRef = input;
		const checkmarkSpan: HTMLSpanElement = document.createElement('span');
		checkmarkSpan.classList.add('checkbox-checkmark');

		labelEl.appendChild(textSpan);
		labelEl.appendChild(input);
		labelEl.appendChild(checkmarkSpan);
		return labelEl;
	}

	private setAttribute() {
		if (this.multiple) {
			if (this.selected) {
				this.checkboxRef.setAttribute('checked', 'checked');
			} else {
				this.checkboxRef.removeAttribute('checked');
			}
		} else {
			if (this.selected) {
				this.singleSelectTextSpanRef.classList.add('selected');
			} else {
				this.singleSelectTextSpanRef.classList.remove('selected');
			}
		}
	}

	private createListeners() {
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