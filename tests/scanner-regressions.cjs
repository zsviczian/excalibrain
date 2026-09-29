/** Run with: node --test tests/scanner-regressions.cjs (after npm ci). */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const settle = () => new Promise((resolve) => setImmediate(resolve));
const flatten = (items) => items.flatMap((item) => item.type === 'group' ? item.items : [item]);

// A deliberately small host model: no APIs introduced after Obsidian 1.8.7.
// It exercises our render callbacks, not Obsidian's own settings-search engine.
function host() {
  const rows = [];
  const errors = [];
  let eaCalls = 0;
  let document;
  class Element {
    constructor(tag = 'div', options = {}) {
      this.tagName = tag;
      this.children = [];
      this.classes = new Set();
      this.attributes = {};
      this.listeners = new Map();
      this.ownerDocument = document;
      this.value = '';
      this.text = '';
      this.css = {};
      this.disabled = false;
      if(typeof options === 'string') this.addClass(options);
      else {
        if(options.cls) this.addClass(...[options.cls].flat());
        if(options.text) this.setText(options.text);
        if(options.attr) this.attributes = {...options.attr};
      }
    }
    get textContent() { return this.text + this.children.map((child) => child.textContent).join(''); }
    set textContent(value) { this.empty(); this.text = value; }
    get innerText() { return this.textContent; }
    set innerText(value) { this.textContent = value; }
    get options() { return this.children; }
    get isConnected() { return true; }
    get outerHTML() { return '<svg></svg>'; }
    appendChild(child) {
      if(child.tagName === '#fragment') {
        [...child.children].forEach((node) => this.appendChild(node));
        return child;
      }
      child.detach();
      child.parentElement = this;
      this.children.push(child);
      return child;
    }
    createEl(tag, options, cb) { const el = this.appendChild(new Element(tag, options)); cb?.(el); return el; }
    createDiv(options, cb) { return this.createEl('div', options, cb); }
    createSpan(options, cb) { return this.createEl('span', options, cb); }
    empty() { this.children.forEach((child) => { child.parentElement = null; }); this.children = []; this.text = ''; }
    detach() {
      if(this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
      this.parentElement = null;
    }
    remove(index) { if(typeof index === 'number') this.children[index]?.detach(); else this.detach(); }
    addClass(...classes) { classes.flatMap((cls) => cls.split(' ')).filter(Boolean).forEach((cls) => this.classes.add(cls)); }
    removeClass(...classes) { classes.forEach((cls) => this.classes.delete(cls)); }
    setText(value) { this.empty(); if(typeof value === 'string') this.text = value; else this.appendChild(value); }
    setAttribute(key, value) { this.attributes[key] = value; }
    removeAttribute(key) { delete this.attributes[key]; }
    setCssProps(props) {
      assert.ok(Object.keys(props).every((key) => key.startsWith('--')), 'setCssProps must only set custom properties');
      Object.assign(this.css, props);
    }
    setCssStyles(styles) { Object.assign(this.css, styles); }
    addEventListener(event, fn) { this.listeners.set(event, fn); }
    removeEventListener(event, fn) { if(this.listeners.get(event) === fn) this.listeners.delete(event); }
    contains(el) { return el === this || this.children.some((child) => child.contains(el)); }
    on() {}
    scrollIntoView() {}
    getBoundingClientRect() { return this.rect ?? {left: 123.5, bottom: 456.25, width: 320}; }
  }
  document = {
    createTextNode(text) { return new Element('#text', {text}); },
    hasFocus: () => false,
    defaultView: {Node: Element},
  };
  document.body = new Element('body');

  class Control {
    constructor(container, tag = 'input') { this.inputEl = container.createEl(tag); this.disabled = false; }
    setValue(value) { this.value = value; this.inputEl.value = value; return this; }
    getValue() { return this.value; }
    onChange(fn) { this.change = fn; return this; }
    setDisabled(value) { this.disabled = value; this.inputEl.disabled = value; return this; }
    setTooltip() { return this; }
    setLimits(min, max, step) { this.limits = {min, max, step}; return this; }
    userChange(value) { this.setValue(value); return this.change?.(value); }
  }
  class TextComponent extends Control {}
  class TextAreaComponent extends Control { constructor(el) { super(el, 'textarea'); } }
  class ToggleComponent extends Control { constructor(el) { super(el); this.toggleEl = this.inputEl; } }
  class SliderComponent extends Control { constructor(el) { super(el); this.sliderEl = this.inputEl; } }
  class DropdownComponent extends Control {
    constructor(el) { super(el, 'select'); this.selectEl = this.inputEl; }
    addOption(value, name) { const option = this.selectEl.createEl('option', {text: name}); option.value = value; return this; }
    addOptions(options) { Object.entries(options).forEach(([key, value]) => this.addOption(key, value)); return this; }
  }
  class Setting {
    constructor(el) {
      this.settingEl = el.createDiv('setting-item');
      this.infoEl = this.settingEl.createDiv('setting-item-info');
      this.nameEl = this.infoEl.createDiv('setting-item-name');
      this.descEl = this.infoEl.createDiv('setting-item-description');
      this.controlEl = this.settingEl.createDiv('setting-item-control');
      this.controls = [];
      rows.push(this);
    }
    setName(value) { this.nameEl.setText(value); return this; }
    setDesc(value) { this.descEl.setText(value); return this; }
    setClass(value) { this.settingEl.addClass(value); return this; }
    setHeading() { this.heading = true; return this; }
    setDisabled(value) { this.disabled = value; this.controls.forEach((control) => control.setDisabled(value)); return this; }
    add(Component, cb) { const control = new Component(this.controlEl); this.controls.push(control); cb(control); return this; }
    addText(cb) { return this.add(TextComponent, cb); }
    addTextArea(cb) { return this.add(TextAreaComponent, cb); }
    addToggle(cb) { return this.add(ToggleComponent, cb); }
    addSlider(cb) { return this.add(SliderComponent, cb); }
    addDropdown(cb) { return this.add(DropdownComponent, cb); }
  }
  class PluginSettingTab {
    constructor(app, plugin) { this.app = app; this.plugin = plugin; this.containerEl = document.body.createDiv(); }
  }
  class Page {
    addChild() {} addParent() {} addLeftFriend() {} addRightFriend() {}
  }
  class GraphNode { setCenter() {} async render() {} }
  class Link { render() {} }
  class Scope { register() {} }
  const prompts = [];
  class WarningPrompt { show(fn) { prompts.push(fn); } }
  const ea = {reset() {}, canvas: {}, async createSVG() { return new Element('svg'); }};
  const mockObsidian = {PluginSettingTab, Setting, ToggleComponent, SliderComponent, TextComponent,
    TextAreaComponent, DropdownComponent, Scope};
  const loaded = new Map();
  const sandbox = vm.createContext({
    console, window: {setTimeout}, setTimeout, document,
    createEl: (tag, options, cb) => { const el = new Element(tag, options); cb?.(el); return el; },
    createDiv: (options) => new Element('div', options),
    createSpan: (options) => new Element('span', options),
    createFragment: (cb) => { const frag = new Element('#fragment'); cb?.(frag); return frag; },
  });
  vm.runInContext('Array.prototype.contains = Array.prototype.includes; String.prototype.contains = String.prototype.includes;', sandbox);
  // Production callbacks also receive arrays made by the host's plugin mock.
  if(!Array.prototype.contains) Object.defineProperty(Array.prototype, 'contains', {value: Array.prototype.includes, configurable: true});
  if(!String.prototype.contains) Object.defineProperty(String.prototype, 'contains', {value: String.prototype.includes, configurable: true});

  function load(file) {
    file = path.resolve(root, file);
    if(loaded.has(file)) return loaded.get(file);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS},
      fileName: file, reportDiagnostics: true,
    });
    assert.equal(code.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error).length, 0);
    const module = {exports: {}};
    loaded.set(file, module.exports);
    const requireMock = (specifier) => {
      if(specifier === 'obsidian') return mockObsidian;
      if(specifier.endsWith('/graph/Page')) return {Page};
      if(specifier.endsWith('/graph/Node')) return {Node: GraphNode};
      if(specifier.endsWith('/graph/Link')) return {Link};
      if(specifier.endsWith('/utils/Prompts')) return {WarningPrompt};
      if(specifier.endsWith('/utils/utils')) return {svgToBase64: () => 'data:image/svg+xml;base64,test', errorlog: (error) => errors.push(error)};
      if(specifier.endsWith('/utils/ExcalidrawAutomateCompatibility')) return {getEA: () => { eaCalls++; return ea; }};
      if(specifier.endsWith('/lang/helpers')) return {t: (key) => load('src/lang/locale/en.ts').default[key]};
      const target = specifier.startsWith('src/') ? path.join(root, specifier) : path.resolve(path.dirname(file), specifier);
      return load(`${target}.ts`);
    };
    vm.runInContext(`(function(require, module, exports) {\n${code.outputText}\n})`, sandbox, {filename: file})(requireMock, module, module.exports);
    return module.exports;
  }
  const {ExcaliBrainSettingTab, DEFAULT_SETTINGS} = load('src/Settings.ts');
  const labels = load('src/lang/locale/en.ts').default;
  const plugin = {
    settings: structuredClone(DEFAULT_SETTINGS),
    hierarchyLowerCase: {parents: [], children: [], leftFriends: [], rightFriends: [], previous: [], next: [], hidden: []},
    DVAPI: {index: {pages: new Map([['note.md', {fields: new Map([['Unused Field', []]])}]])}},
    loads: 0, saves: [], scene: null,
    async loadSettings() { this.loads++; },
    async saveSettings() { this.saves.push(structuredClone(this.settings)); },
    setHierarchyLinkStylesExtended() {}, loadCustomNodeLabelFunction() {},
  };
  plugin.nodeStyles = {};
  for(const [key, setting] of Object.entries({base: 'baseNodeStyle', central: 'centralNodeStyle', inferred: 'inferredNodeStyle',
    url: 'urlNodeStyle', virtual: 'virtualNodeStyle', sibling: 'siblingNodeStyle', attachment: 'attachmentNodeStyle', folder: 'folderNodeStyle', tag: 'tagNodeStyle'})) {
    plugin.nodeStyles[key] = {display: key, style: plugin.settings[setting], allowOverride: key !== 'base',
      getInheritedStyle: () => plugin.settings.baseNodeStyle};
  }
  plugin.linkStyles = {};
  for(const [key, setting] of Object.entries({base: 'baseLinkStyle', inferred: 'inferredLinkStyle', 'file-tree': 'folderLinkStyle', 'tag-tree': 'tagLinkStyle'})) {
    plugin.linkStyles[key] = {display: key, style: plugin.settings[setting], allowOverride: key !== 'base',
      getInheritedStyle: () => plugin.settings.baseLinkStyle};
  }
  const existing = new Set();
  const scopes = [];
  const app = {vault: {getAbstractFileByPath: (file) => existing.has(file) ? {path: file} : null},
    keymap: {pushScope: (scope) => scopes.push(scope), popScope: (scope) => scopes.splice(scopes.indexOf(scope), 1)}};
  const tab = new ExcaliBrainSettingTab(app, plugin);
  const row = (key) => rows.find((setting) => setting.nameEl.textContent === labels[key] && setting.controls.length);
  const find = (key) => {
    const result = row(key);
    assert.ok(result, `Missing rendered setting ${key}`);
    return result;
  };
  async function render() {
    const definitions = flatten(tab.getSettingDefinitions());
    const cleanups = definitions.map((definition) => {
      const setting = new Setting(tab.containerEl).setName(definition.name);
      if(definition.desc) setting.setDesc(definition.desc);
      return definition.render(setting);
    });
    await settle();
    assert.deepEqual(errors, []);
    return cleanups;
  }
  return {tab, plugin, labels, rows, find, render, errors, existing, prompts, scopes, load, app, document,
    Element, Setting, eaCalls: () => eaCalls};
}

test('scanner targets and compatibility declarations', () => {
  const settings = read('src/Settings.ts');
  assert.match(settings, /getSettingDefinitions\(\): SearchableSettingItem\[\]/);
  assert.doesNotMatch(settings, /createEl\(["']h[1-6]["']/);
  assert.equal((settings.match(/\.setHeading\(\)/g) ?? []).length, 4);
  assert.match(read('src/Suggesters/Suggest.ts'), /this\.suggestEl\.setCssStyles\(/);
  assert.doesNotMatch(read('src/Suggesters/Suggest.ts'), /this\.suggestEl\.setCssProps\(/);
  assert.equal(JSON.parse(read('manifest.json')).minAppVersion, '1.8.7');
  assert.equal(JSON.parse(read('package.json')).devDependencies.obsidian, '1.8.7');
  assert.doesNotMatch(settings, /eslint-disable.*(?:settings|styles)/);
});

test('registration builds searchable definitions without DOM, I/O or dependency initialization', () => {
  const h = host();
  delete h.plugin.DVAPI;
  const before = JSON.stringify(h.plugin.settings);
  const count = h.rows.length;
  const definitions = h.tab.getSettingDefinitions();
  const flat = flatten(definitions);
  assert.ok(flat.length >= 40);
  assert.equal(definitions.filter((definition) => definition.type === 'group').length, 4);
  assert.equal(h.rows.length, count);
  assert.equal(h.plugin.loads, 0);
  assert.equal(h.eaCalls(), 0);
  assert.equal(JSON.stringify(h.plugin.settings), before);
  assert.ok(flat.every((definition) => typeof definition.name === 'string' && typeof definition.render === 'function'));
  for(const key of ['EXCALIBRAIN_FILE_NAME', 'PARENTS_NAME', 'EXCLUDE_PATHLIST_NAME', 'MAX_AUTOZOOM_NAME']) {
    assert.ok(flat.some((definition) => definition.name === h.labels[key]));
  }
  const styling = flat.find((definition) => definition.name === h.labels.STYLE_HEAD);
  for(const key of ['TAGLIST_NAME', 'NODESTYLE_FONTSIZE', 'NODESTYLE_GATE_OFFSET_NAME', 'LINKSTYLE_ARROWEND']) {
    assert.ok(styling.aliases.includes(h.labels[key]), `Style search must include ${key}`);
  }
});

test('both rendering paths keep all existing controls, with one reload per native render', async () => {
  const native = host();
  await native.render();
  assert.equal(native.plugin.loads, 1);
  assert.equal(native.eaCalls(), 1);
  const legacy = host();
  legacy.tab.display();
  await settle();
  assert.deepEqual(legacy.errors, []);
  const names = (h) => [...new Set(h.rows.filter((row) => row.controls.length).map((row) => row.nameEl.textContent))].sort();
  assert.deepEqual(names(native), names(legacy));
  assert.equal(legacy.rows.filter((row) => row.heading).length, 4);
});

test('native callbacks retain unit conversions, validation, hierarchy updates and persistence', async () => {
  const h = host();
  await h.render();
  const input = h.find('EXCALIBRAIN_FILE_NAME').controls[0];
  input.userChange('new-drawing.m');
  assert.equal(h.plugin.settings.excalibrainFilepath, 'new-drawing.md');
  input.inputEl.onblur();
  assert.equal(input.getValue(), 'new-drawing.md');
  h.existing.add('existing.md');
  input.userChange('existing.md');
  h.prompts.pop()(false);
  assert.equal(h.plugin.settings.excalibrainFilepath, 'new-drawing.md');
  input.userChange('existing.md');
  h.prompts.pop()(true);
  assert.equal(h.plugin.settings.excalibrainFilepath, 'existing.md');
  h.find('INDEX_REFRESH_FREQ_NAME').controls[0].userChange(45);
  assert.equal(h.plugin.settings.indexUpdateInterval, 45000);
  h.find('MAX_AUTOZOOM_NAME').controls[0].userChange(250);
  assert.equal(h.plugin.settings.maxZoom, 2.5);
  h.find('PARENTS_NAME').controls[0].userChange(' Zeta, Alpha Field ');
  assert.deepEqual(Array.from(h.plugin.settings.hierarchy.parents), ['Alpha Field', 'Zeta']);
  assert.deepEqual(Array.from(h.plugin.hierarchyLowerCase.parents), ['alpha-field', 'zeta']);
  assert.ok(h.plugin.linkStyles['Alpha Field']);
  h.find('EXCLUDE_PATHLIST_NAME').controls[0].userChange(' folder/ , ,\narchive/ ');
  assert.deepEqual(Array.from(h.plugin.settings.excludeFilepaths), ['folder/', 'archive/']);
  h.find('TAGLIST_NAME').controls[0].userChange('#project');
  assert.ok(h.plugin.settings.tagNodeStyles['#project']);
  assert.ok(h.plugin.nodeStyles['#project']);
  h.find('NOTE_STYLE_TAG_NAME').controls[0].userChange('Note Class');
  assert.equal(h.plugin.settings.primaryTagFieldLowerCase, 'note-class');
  h.find('ONTOLOGY_SUGGESTER_PARENT_NAME').controls[0].userChange('');
  h.tab.hide();
  await settle();
  assert.equal(h.plugin.settings.ontologySuggesterParentTrigger, '::p');
  assert.ok(h.plugin.saves.length);
  assert.equal(h.plugin.saves.at(-1).maxZoom, 2.5);
  assert.deepEqual(h.errors, []);
  assert.equal(h.tab.containerEl.listeners.has('focusout'), false);
});

test('all ontology-dependent controls follow the master toggle', async () => {
  const h = host();
  h.plugin.settings.allowOntologySuggester = false;
  await h.render();
  const keys = ['ONTOLOGY_SUGGESTER_ALL_NAME', 'ONTOLOGY_SUGGESTER_PARENT_NAME', 'ONTOLOGY_SUGGESTER_CHILD_NAME',
    'ONTOLOGY_SUGGESTER_LEFT_FRIEND_NAME', 'ONTOLOGY_SUGGESTER_RIGHT_FRIEND_NAME', 'ONTOLOGY_SUGGESTER_NEXT_NAME',
    'MID_SENTENCE_SUGGESTER_TRIGGER_NAME', 'BOLD_FIELDS_NAME'];
  for(const key of keys) assert.equal(h.find(key).disabled, true, key);
  h.find('ONTOLOGY_SUGGESTER_NAME').controls[0].userChange(true);
  for(const key of keys) assert.equal(h.find(key).disabled, false, key);
  h.find('ONTOLOGY_SUGGESTER_NAME').controls[0].userChange(false);
  for(const key of keys) assert.equal(h.find(key).disabled, true, key);
});

test('hiding or disposing during the asynchronous reload does not mount stale controls', async () => {
  for(const hide of [false, true]) {
    const h = host();
    let resolve;
    h.plugin.loadSettings = () => new Promise((done) => { resolve = done; });
    const definition = flatten(h.tab.getSettingDefinitions()).find((item) => item.name === h.labels.EXCALIBRAIN_FILE_NAME);
    const setting = new h.Setting(h.tab.containerEl);
    const cleanup = definition.render(setting);
    if(hide) h.tab.hide(); else cleanup();
    resolve();
    await settle();
    assert.equal(setting.controls.length, 0);
    assert.deepEqual(h.errors, []);
  }
});

test('native re-renders do not reload over unsaved edits', async () => {
  const h = host();
  await h.render();
  h.find('MAX_AUTOZOOM_NAME').controls[0].userChange(350);
  await h.render();
  assert.equal(h.plugin.loads, 1);
  assert.equal(h.plugin.settings.maxZoom, 3.5);
});

test('suggestions keep viewport coordinates and mount in the input owner document', () => {
  const h = host();
  const {TextInputSuggest} = h.load('src/Suggesters/Suggest.ts');
  class TestSuggest extends TextInputSuggest { getSuggestions() { return []; } renderSuggestion() {} selectSuggestion() {} }
  const otherDocument = {...h.document, body: new h.Element('body')};
  const container = new h.Element('div');
  const input = container.createEl('input');
  input.ownerDocument = otherDocument;
  const suggest = new TestSuggest(h.app, input, container);
  suggest.open(container, input);
  assert.equal(suggest.suggestEl.parentElement, otherDocument.body);
  assert.deepEqual(suggest.suggestEl.css, {left: '123.5px', top: '456.25px', width: '320px'});
  assert.equal(h.scopes.length, 1);
  suggest.close();
  assert.equal(suggest.suggestEl.parentElement, null);
  assert.equal(h.scopes.length, 0);
});


test('an independently rendered search row reconciles the model and saves on teardown', async () => {
  const h = host();
  const definition = flatten(h.tab.getSettingDefinitions()).find((item) => item.name === h.labels.PARENTS_NAME);
  const setting = new h.Setting(h.tab.containerEl);
  const cleanup = definition.render(setting);
  await settle();
  setting.controls[0].userChange('New Parent');
  assert.ok(h.plugin.settings.hierarchyLinkStyles['New Parent']);
  assert.ok(h.plugin.linkStyles['New Parent']);
  assert.equal(h.eaCalls(), 0);
  cleanup();
  await settle();
  assert.ok(h.plugin.saves.length);
  assert.deepEqual(h.errors, []);
});
