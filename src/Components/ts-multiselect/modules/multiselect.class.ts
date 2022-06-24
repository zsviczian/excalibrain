import {MultiselectConfig} from '../models/multiselect-config';
import {MultiselectOption} from './multiselect-option.class';
import {IMultiselectOption} from '../models/multiselect-option';

export class Multiselect {
	private config: MultiselectConfig;

	// from config
  private origin: HTMLElement;
	private configOptions: IMultiselectOption[];
	private multiple: boolean;
	private singularNominativeLabel: string;
	private pluralNominativeLabel: string;
	private pluralGenitiveLabel: string;
	private placeholder: string;
	private headerLabel: string;
	private onDropdownOpen: () => any;
	private onDropdownClose: (selectedItems: any[]) => any;
	private onSelectionChange: (selectedItems: any[]) => any;

	// used in class
	private selectHeaderRef: HTMLElement;
	private selectWrapperRef: HTMLElement;
	private selectedValueRef: HTMLElement;
	private optionsWrapperRef: HTMLElement;
	private options: MultiselectOption[] = [];
	private dropdownOpened: boolean = false;
	private destroyed: boolean = false;

	public selected: any[];
	public rendered: boolean = false;

	private documentClickDropdownToggle = (e: MouseEvent) => {
		if (!this.selectWrapperRef.contains((e.target as any))) {
			this.handleDropdownToggle(false, this.dropdownOpened);
		}
	}

	constructor(config: MultiselectConfig) {
		this.config = config;
		this.assignConfig()

		this.setOrigin();
		if (!this.origin) {
			throw 'You have to pass origin element!';
		}

		this.init();
	}

	public init() {
		this.destroyed = false;
		this.dropdownOpened = false;

		this.createSelect();
		this.createListeners();
	}

	public destroy() {
		this.destroyed = true;
		this.rendered = false;
		this.hide();
		document.removeEventListener('click', this.documentClickDropdownToggle);
		this.selectWrapperRef.cloneNode(true);
		this.origin = null;
		this.selectHeaderRef = null;
		this.selectWrapperRef = null;
		this.selectedValueRef = null;
		this.optionsWrapperRef = null;
		this.options = [];
	}

	public reset() {
		this.options.forEach(x => x.deselect(false));
		this.updateSelection();
	}

	public hide() {
		this.origin.innerHTML = '';
		this.rendered = false;
	}

	public render() {
		if (this.destroyed) {
			throw 'But you destroyed me... :(';
		}

		if (!!this.origin.innerText.trim()) {
			throw 'Hey! I am rendered already!';
		}

		this.origin.appendChild(this.selectWrapperRef);
		this.rendered = true;
		if (!!this.selectHeaderRef) {
			this.origin.prepend(this.selectHeaderRef);
		}
	}

	private assignConfig() {
		this.origin = this.config.origin;
		this.configOptions = this.config.options;
		this.multiple = this.config.multiple ?? true;
		this.singularNominativeLabel = this.config.singularNominativeLabel;
		this.pluralNominativeLabel = this.config.pluralNominativeLabel;
		this.pluralGenitiveLabel = this.config.pluralGenitiveLabel;
		this.placeholder = this.config.placeholder ?? '';
		this.headerLabel = this.config.headerLabel;
		this.selected = this.config.selected;
		this.onDropdownOpen = this.config.onDropdownOpen;
		this.onDropdownClose = this.config.onDropdownClose;
		this.onSelectionChange = this.config.onSelectionChange;
	}

	private setOrigin() {
		if (!this.origin) {
			return;
		}
		this.origin.classList.add('multiselect-container');
	}

	private createHeader() {
		if (!this.headerLabel) {
			return;
		}

		this.selectHeaderRef = document.createElement('div');
		this.selectHeaderRef.classList.add('multiselect-header');
		this.selectHeaderRef.innerText = this.headerLabel;
	}

	private createSelect() {
		this.selectWrapperRef = document.createElement('div');
		this.selectWrapperRef.classList.add('multiselect-wrapper');

		if (!this.multiple) {
			this.selectWrapperRef.classList.add('single-select');
		}

		this.selectedValueRef = document.createElement('div');
		this.selectedValueRef.classList.add('selected-value');
		this.selectWrapperRef.appendChild(this.selectedValueRef);

		this.optionsWrapperRef = document.createElement('div');
		this.optionsWrapperRef.classList.add('options-wrapper');

		this.configOptions.forEach(option => {
			const optionClass = new MultiselectOption(
				option.value,
				option.label,
				this.multiple,
				this.onSelectChange.bind(this),
			);
			if (this.selected?.includes(option.value)) {
				optionClass.select(false);
			}
			this.options.push(optionClass);
			this.optionsWrapperRef.appendChild(optionClass.optionRef)
		});
		this.updateSelection();
		this.selectWrapperRef.appendChild(this.optionsWrapperRef);
		this.createHeader();
		this.render();
	}

	private createListeners() {
		this.selectWrapperRef.addEventListener('click', (e) => {
			if (this.selectWrapperRef.contains((e.target as any)) && !this.optionsWrapperRef.contains((e.target as any))) {
				this.handleDropdownToggle(!this.dropdownOpened);
			}
		});

		document.addEventListener('click', this.documentClickDropdownToggle);
	}

	private handleDropdownToggle(opened: boolean, emitEvent: boolean = true) {
		this.dropdownOpened = opened;

		if (this.dropdownOpened) {
			this.selectWrapperRef.classList.add('opened');

			if (this.onDropdownOpen && emitEvent) {
				this.onDropdownOpen()
			}
		} else {
			this.selectWrapperRef.classList.remove('opened');

			if (this.onDropdownClose && emitEvent) {
				this.onDropdownClose(this.selected);
			}
		}
	}

	private onSelectChange(option: MultiselectOption) {
		if (!this.multiple) {
			this.options.forEach(x => x.deselect(false));
			option.select(false);
		}

		this.updateSelection();

		if (this.onSelectionChange) {
			this.onSelectionChange(this.selected);
		}

		if (!this.multiple) {
			this.handleDropdownToggle(false);
		}
	}

	private updateSelection() {
		this.selected = this.options.filter(x => !!x.selected).map(x => x.value);
		const labelsArr: string[] = this.options.filter(x => !!x.selected).map(x => x.label);

		let label = this.placeholder;
		if (labelsArr.length === 1) {
			label = labelsArr[0];
		} else if (labelsArr.length > 1) {
			label = `${labelsArr.length} ${this.transformPluralLabel(labelsArr.length)}`;
		}

		this.selectedValueRef.innerText = label;
	}

	private transformPluralLabel(value: number) {
		if (value === 1) {
			return this.singularNominativeLabel ?? 'items';
		} else if (value % 10 >= 2 && value % 10 <= 4 && (value % 100 < 10 || value % 100 >= 20)) {
			return this.pluralNominativeLabel ?? 'items';
		} else {
			return this.pluralGenitiveLabel ?? 'items';
		}
	}
}