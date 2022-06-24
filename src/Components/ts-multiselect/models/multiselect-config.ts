import {IMultiselectOption} from './multiselect-option';

export interface MultiselectConfig {
	origin: HTMLElement;
	options: IMultiselectOption[];
	multiple?: boolean;
	singularNominativeLabel?: string; // 1 porcja
	pluralNominativeLabel?: string; // 2 porcje
	pluralGenitiveLabel?: string; // 5 porcji
	placeholder?: string;
	headerLabel?: string;
	selected?: any[];
	onDropdownOpen?: () => any;
	onDropdownClose?: (selectedItems: any[]) => any;
	onSelectionChange?: (selectedItems: any[]) => any;
}
