
import ExcaliBrain from "src/excalibrain-main";

export class RangeSlider {
    private slider: HTMLInputElement
    constructor({ plugin, setVal, isEnabled, range, wrapper, updateIndex }:
        {
            plugin: ExcaliBrain,
            setVal: (val: number) => boolean,
            isEnabled?: () => boolean,
            wrapper: HTMLElement,
            range: {
                min: number,
                max: number,
                step: number,
                defalutValue?: number,
            },
            updateIndex: boolean,
        }) {

        this.slider = wrapper.createEl('input', { type: 'range', cls: "excalibrain-slider" });
        this.SetRange(range);
        this.slider.onchange = (ev) => {
            const value = (ev.target as HTMLInputElement).value;
            const shouldSaveSettings = setVal(parseFloat(value));
            if (shouldSaveSettings) plugin.saveSettings();
            plugin.scene?.reRender(updateIndex);
        }
    }

    private SetRange(range: {
        min: number,
        max: number,
        step: number,
        defalutValue?: number,
    }) {
        this.slider.min = `${range.min}`;
        this.slider.max = `${range.max}`;
        this.slider.step = `${range.step}`;
        this.slider.value = `${range.defalutValue ?? 1.6}`;
    }

}