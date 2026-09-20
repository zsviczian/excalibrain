import { IMultiselectOption } from './multiselect-option';

export interface MultiselectConfig {
  origin: HTMLElement;
  options: IMultiselectOption[];
  multiple?: boolean;
  singularNominativeLabel?: string;
  pluralNominativeLabel?: string;
  pluralGenitiveLabel?: string;
  placeholder?: string;
  headerLabel?: string;
  selected?: string[];
  onDropdownOpen?: () => void;
  onDropdownClose?: (selectedItems: string[]) => void;
  onSelectionChange?: (selectedItems: string[]) => void;
}
