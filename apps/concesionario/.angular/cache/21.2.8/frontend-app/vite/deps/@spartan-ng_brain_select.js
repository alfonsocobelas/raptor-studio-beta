import {
  BrnOverlay,
  BrnPopover
} from "./chunk-J7CQVLYK.js";
import {
  ActiveDescendantKeyManager
} from "./chunk-AXXKIU6M.js";
import {
  BrnFieldControl,
  provideBrnLabelable
} from "./chunk-CORRGEFH.js";
import {
  NG_VALUE_ACCESSOR
} from "./chunk-MQAMSBSO.js";
import "./chunk-OX253WZ7.js";
import "./chunk-RU4RFFMX.js";
import {
  injectElementSize,
  stringifyAsLabel
} from "./chunk-N5WA7HNS.js";
import "./chunk-6IE75NIU.js";
import "./chunk-C3FLKRDF.js";
import {
  takeUntilDestroyed
} from "./chunk-R4LLFK3G.js";
import "./chunk-2P2IYF4D.js";
import "./chunk-HC33ZOIP.js";
import {
  isPlatformBrowser
} from "./chunk-LAHHEQBJ.js";
import "./chunk-JK5PHBUV.js";
import {
  ContentChild,
  ContentChildren,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  Input,
  Output,
  PLATFORM_ID,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  setClassMetadata,
  signal,
  untracked,
  ɵɵHostDirectivesFeature,
  ɵɵProvidersFeature,
  ɵɵattribute,
  ɵɵcontentQuerySignal,
  ɵɵdefineDirective,
  ɵɵdomProperty,
  ɵɵlistener,
  ɵɵqueryAdvance,
  ɵɵstyleProp
} from "./chunk-BFMHQS5Q.js";
import {
  Subject,
  fromEvent,
  interval,
  takeUntil
} from "./chunk-RSS3ODKE.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-select.mjs
var BrnSelectItemToken = new InjectionToken("BrnSelectItemToken");
function provideBrnSelectItem(selectItem) {
  return {
    provide: BrnSelectItemToken,
    useExisting: selectItem
  };
}
var BrnSelectBaseToken = new InjectionToken("BrnSelectBaseToken");
function provideBrnSelectBase(instance) {
  return {
    provide: BrnSelectBaseToken,
    useExisting: instance
  };
}
function injectBrnSelectBase() {
  return inject(BrnSelectBaseToken);
}
function getDefaultConfig() {
  return {
    isItemEqualToValue: (itemValue, selectedValue) => Object.is(itemValue, selectedValue),
    isSingleValuePresent: (value) => value !== void 0 && value !== null && value !== "",
    itemToString: void 0
  };
}
var BrnSelectConfigToken = new InjectionToken("BrnSelectConfig");
function provideBrnSelectConfig(config) {
  return {
    provide: BrnSelectConfigToken,
    useValue: __spreadValues(__spreadValues({}, getDefaultConfig()), config)
  };
}
function injectBrnSelectConfig() {
  const injectedConfig = inject(BrnSelectConfigToken, {
    optional: true
  });
  return injectedConfig ? injectedConfig : getDefaultConfig();
}
var BRN_SELECT_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => BrnSelect),
  multi: true
};
var BrnSelect = class _BrnSelect {
  _injector = inject(Injector);
  _fieldControl = inject(BrnFieldControl, {
    optional: true
  });
  _config = injectBrnSelectConfig();
  controlState = this._fieldControl?.controlState;
  /** Access the popover if present */
  _brnPopover = inject(BrnPopover, {
    optional: true
  });
  /** Whether the select is disabled */
  disabled = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "disabled"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  _disabled = linkedSignal(this.disabled, ...ngDevMode ? [{
    debugName: "_disabled"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @internal The disabled state as a readonly signal */
  disabledState = this._disabled.asReadonly();
  /** The selected value of the select. */
  value = model(null, ...ngDevMode ? [{
    debugName: "value"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Determines whether a single value is present (i.e., has been selected).
   * Considers `undefined`, `null`, and empty string as "not present".
   * Only used by single select, ignored by the multiple select variant.
   */
  isSingleValuePresent = input(this._config.isSingleValuePresent, ...ngDevMode ? [{
    debugName: "isSingleValuePresent"
  }] : (
    /* istanbul ignore next */
    []
  ));
  hasValue = computed(() => this.isSingleValuePresent()(this.value()), ...ngDevMode ? [{
    debugName: "hasValue"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** A function to compare an item with the selected value. */
  isItemEqualToValue = input(this._config.isItemEqualToValue, ...ngDevMode ? [{
    debugName: "isItemEqualToValue"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** A function to convert an item to a string for display. */
  itemToString = input(this._config.itemToString, ...ngDevMode ? [{
    debugName: "itemToString"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _triggerWidth = signal(null, ...ngDevMode ? [{
    debugName: "_triggerWidth"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @internal The width of the trigger wrapper */
  triggerWidth = this._triggerWidth.asReadonly();
  /** @internal Access all the items within the select */
  items = contentChildren(BrnSelectItemToken, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "items"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    descendants: true
  }));
  /** @internal The key manager for managing active descendant */
  keyManager = new ActiveDescendantKeyManager(this.items, this._injector);
  /** @internal Whether the select is expanded */
  isExpanded = computed(() => this._brnPopover?.stateComputed() === "open", ...ngDevMode ? [{
    debugName: "isExpanded"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _selectTrigger = signal(void 0, ...ngDevMode ? [{
    debugName: "_selectTrigger"
  }] : (
    /* istanbul ignore next */
    []
  ));
  labelableId = computed(() => this._selectTrigger()?.id(), ...ngDevMode ? [{
    debugName: "labelableId"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _onChange;
  _onTouched;
  constructor() {
    this.keyManager.withVerticalOrientation().withHomeAndEnd().withTypeAhead().withWrap().skipPredicate((item) => item.disabled);
    this._brnPopover?.closed.subscribe(() => {
      this._onTouched?.();
      this.keyManager.setActiveItem(-1);
    });
    afterNextRender(() => {
      effect(() => {
        if (!this.isExpanded()) return;
        const items = this.items();
        const value = this.value();
        untracked(() => {
          const index = value !== null && value !== void 0 ? items.findIndex((item) => this.isItemEqualToValue()(item.value(), value)) : -1;
          if (index !== -1) {
            this.keyManager.setActiveItem(index);
          } else if (items.length > 0) {
            this.keyManager.setFirstItemActive();
          } else {
            this.keyManager.setActiveItem(-1);
          }
        });
      }, {
        injector: this._injector
      });
    });
  }
  registerSelectTrigger(input2) {
    return this._selectTrigger.set(input2);
  }
  updateTriggerWidth(width) {
    this._triggerWidth.set(width);
  }
  isSelected(itemValue) {
    return this.isItemEqualToValue()(itemValue, this.value());
  }
  select(itemValue) {
    this.value.set(itemValue);
    this._onChange?.(itemValue);
    this.close();
  }
  /** Select the active item with Enter key. */
  selectActiveItem() {
    if (!this.isExpanded()) return;
    const value = this.keyManager.activeItem?.value();
    if (value !== null && value !== void 0) {
      this.select(value);
    } else {
      this.close();
    }
  }
  open() {
    if (this._disabled() || this.isExpanded()) return;
    this._brnPopover?.open();
  }
  close() {
    if (this._disabled() || !this.isExpanded()) return;
    this._brnPopover?.close();
  }
  toggle() {
    this.isExpanded() ? this.close() : this.open();
  }
  /** CONTROL VALUE ACCESSOR */
  writeValue(value) {
    this.value.set(value);
  }
  registerOnChange(fn) {
    this._onChange = fn;
  }
  registerOnTouched(fn) {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this._disabled.set(isDisabled);
  }
  /** @nocollapse */
  static ɵfac = function BrnSelect_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelect)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelect,
    selectors: [["", "brnSelect", ""]],
    contentQueries: function BrnSelect_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuerySignal(dirIndex, ctx.items, BrnSelectItemToken, 5);
      }
      if (rf & 2) {
        ɵɵqueryAdvance();
      }
    },
    inputs: {
      disabled: [1, "disabled"],
      value: [1, "value"],
      isSingleValuePresent: [1, "isSingleValuePresent"],
      isItemEqualToValue: [1, "isItemEqualToValue"],
      itemToString: [1, "itemToString"]
    },
    outputs: {
      value: "valueChange"
    },
    features: [ɵɵProvidersFeature([provideBrnSelectBase(_BrnSelect), BRN_SELECT_VALUE_ACCESSOR, provideBrnLabelable(_BrnSelect)]), ɵɵHostDirectivesFeature([BrnFieldControl])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelect, [{
    type: Directive,
    args: [{
      selector: "[brnSelect]",
      providers: [provideBrnSelectBase(BrnSelect), BRN_SELECT_VALUE_ACCESSOR, provideBrnLabelable(BrnSelect)],
      hostDirectives: [BrnFieldControl]
    }]
  }], () => [], {
    disabled: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "disabled",
        required: false
      }]
    }],
    value: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "value",
        required: false
      }]
    }, {
      type: Output,
      args: ["valueChange"]
    }],
    isSingleValuePresent: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isSingleValuePresent",
        required: false
      }]
    }],
    isItemEqualToValue: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isItemEqualToValue",
        required: false
      }]
    }],
    itemToString: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "itemToString",
        required: false
      }]
    }],
    items: [{
      type: ContentChildren,
      args: [forwardRef(() => BrnSelectItemToken), __spreadProps(__spreadValues({}, {
        descendants: true
      }), {
        isSignal: true
      })]
    }]
  });
})();
var SCROLLBY_PIXEL = 8;
var BrnSelectContent = class _BrnSelectContent {
  _select = injectBrnSelectBase();
  _selectWidth = this._select.triggerWidth;
  _elementRef = inject(ElementRef);
  _scrollUp = signal(false, ...ngDevMode ? [{
    debugName: "_scrollUp"
  }] : (
    /* istanbul ignore next */
    []
  ));
  showScrollUp = this._scrollUp.asReadonly();
  _scrollDown = signal(false, ...ngDevMode ? [{
    debugName: "_scrollDown"
  }] : (
    /* istanbul ignore next */
    []
  ));
  showScrollDown = this._scrollDown.asReadonly();
  _dataState = computed(() => this._select.isExpanded() ? "open" : "closed", ...ngDevMode ? [{
    debugName: "_dataState"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    afterNextRender(() => {
      this._checkScroll();
    });
  }
  handleScroll() {
    this._checkScroll();
  }
  _checkScroll() {
    const {
      scrollTop,
      scrollHeight,
      clientHeight
    } = this._elementRef.nativeElement;
    this._scrollUp.set(scrollTop > 0);
    const maxScroll = scrollHeight - clientHeight;
    this._scrollDown.set(Math.ceil(scrollTop) < maxScroll);
  }
  scrollDown(stop) {
    this._elementRef.nativeElement.scrollBy({
      top: SCROLLBY_PIXEL,
      behavior: "auto"
    });
    const {
      scrollTop,
      scrollHeight,
      clientHeight
    } = this._elementRef.nativeElement;
    const maxScroll = scrollHeight - clientHeight;
    if (Math.ceil(scrollTop) >= maxScroll) {
      stop();
    }
  }
  scrollUp(stop) {
    this._elementRef.nativeElement.scrollBy({
      top: -SCROLLBY_PIXEL,
      behavior: "auto"
    });
    if (this._elementRef.nativeElement.scrollTop === 0) {
      stop();
    }
  }
  /** @nocollapse */
  static ɵfac = function BrnSelectContent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectContent)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectContent,
    selectors: [["", "brnSelectContent", ""]],
    hostVars: 3,
    hostBindings: function BrnSelectContent_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("scroll", function BrnSelectContent_scroll_HostBindingHandler() {
          return ctx.handleScroll();
        });
      }
      if (rf & 2) {
        ɵɵattribute("data-state", ctx._dataState());
        ɵɵstyleProp("--brn-select-width", ctx._selectWidth(), "px");
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectContent, [{
    type: Directive,
    args: [{
      selector: "[brnSelectContent]",
      host: {
        "[attr.data-state]": "_dataState()",
        "[style.--brn-select-width.px]": "_selectWidth()",
        "(scroll)": "handleScroll()"
      }
    }]
  }], () => [], null);
})();
var BrnSelectLabel = class _BrnSelectLabel {
  static _id = 0;
  id = input(`brn-select-label-${++_BrnSelectLabel._id}`, ...ngDevMode ? [{
    debugName: "id"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @nocollapse */
  static ɵfac = function BrnSelectLabel_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectLabel)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectLabel,
    selectors: [["", "brnSelectLabel", ""]],
    hostVars: 1,
    hostBindings: function BrnSelectLabel_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵdomProperty("id", ctx.id());
      }
    },
    inputs: {
      id: [1, "id"]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectLabel, [{
    type: Directive,
    args: [{
      selector: "[brnSelectLabel]",
      host: {
        "[id]": "id()"
      }
    }]
  }], null, {
    id: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "id",
        required: false
      }]
    }]
  });
})();
var BrnSelectGroup = class _BrnSelectGroup {
  _selectLabel = contentChild(BrnSelectLabel, ...ngDevMode ? [{
    debugName: "_selectLabel"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _labelledby = computed(() => this._selectLabel()?.id() ?? null, ...ngDevMode ? [{
    debugName: "_labelledby"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @nocollapse */
  static ɵfac = function BrnSelectGroup_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectGroup)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectGroup,
    selectors: [["", "brnSelectGroup", ""]],
    contentQueries: function BrnSelectGroup_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuerySignal(dirIndex, ctx._selectLabel, BrnSelectLabel, 5);
      }
      if (rf & 2) {
        ɵɵqueryAdvance();
      }
    },
    hostAttrs: ["role", "group"],
    hostVars: 1,
    hostBindings: function BrnSelectGroup_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("aria-labelledby", ctx._labelledby());
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectGroup, [{
    type: Directive,
    args: [{
      selector: "[brnSelectGroup]",
      host: {
        role: "group",
        "[attr.aria-labelledby]": "_labelledby()"
      }
    }]
  }], null, {
    _selectLabel: [{
      type: ContentChild,
      args: [forwardRef(() => BrnSelectLabel), {
        isSignal: true
      }]
    }]
  });
})();
var BrnSelectItem = class _BrnSelectItem {
  static _id = 0;
  _platform = inject(PLATFORM_ID);
  _elementRef = inject(ElementRef);
  /** Access the select component */
  _select = injectBrnSelectBase();
  /** A unique id for the item */
  id = input(`brn-select-item-${++_BrnSelectItem._id}`, ...ngDevMode ? [{
    debugName: "id"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** The value this item represents. */
  value = input.required(...ngDevMode ? [{
    debugName: "value"
  }] : (
    /* istanbul ignore next */
    []
  ));
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _disabled = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "_disabled"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "disabled",
    transform: booleanAttribute
  }));
  /** Expose disabled as a value - used by the Highlightable interface */
  get disabled() {
    return this._disabled();
  }
  /** Whether the item is selected. */
  active = computed(() => this._select.isSelected(this.value()), ...ngDevMode ? [{
    debugName: "active"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _highlighted = signal(false, ...ngDevMode ? [{
    debugName: "_highlighted"
  }] : (
    /* istanbul ignore next */
    []
  ));
  setActiveStyles() {
    this._highlighted.set(true);
    if (isPlatformBrowser(this._platform)) {
      this._elementRef.nativeElement.scrollIntoView({
        block: "nearest"
      });
    }
  }
  setInactiveStyles() {
    this._highlighted.set(false);
  }
  getLabel() {
    return stringifyAsLabel(this.value(), this._select.itemToString());
  }
  select() {
    if (this._disabled()) {
      return;
    }
    this._select.keyManager.setActiveItem(this);
    this._select.select(this.value());
  }
  activate() {
    if (this._disabled()) {
      return;
    }
    this._select.keyManager.setActiveItem(this);
  }
  /** @nocollapse */
  static ɵfac = function BrnSelectItem_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectItem)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectItem,
    selectors: [["", "brnSelectItem", ""]],
    hostAttrs: ["role", "option"],
    hostVars: 6,
    hostBindings: function BrnSelectItem_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function BrnSelectItem_click_HostBindingHandler() {
          return ctx.select();
        })("mouseenter", function BrnSelectItem_mouseenter_HostBindingHandler() {
          return ctx.activate();
        });
      }
      if (rf & 2) {
        ɵɵdomProperty("id", ctx.id());
        ɵɵattribute("data-highlighted", ctx._highlighted() ? "" : null)("data-value", ctx.value())("aria-selected", ctx.active())("aria-disabled", ctx._disabled())("data-disabled", ctx._disabled() ? "" : null);
      }
    },
    inputs: {
      id: [1, "id"],
      value: [1, "value"],
      _disabled: [1, "disabled", "_disabled"]
    },
    features: [ɵɵProvidersFeature([provideBrnSelectItem(_BrnSelectItem)])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectItem, [{
    type: Directive,
    args: [{
      selector: "[brnSelectItem]",
      providers: [provideBrnSelectItem(BrnSelectItem)],
      host: {
        role: "option",
        "[id]": "id()",
        "[attr.data-highlighted]": '_highlighted() ? "" : null',
        "[attr.data-value]": "value()",
        "[attr.aria-selected]": "active()",
        "[attr.aria-disabled]": "_disabled()",
        "[attr.data-disabled]": '_disabled() ? "" : null',
        "(click)": "select()",
        "(mouseenter)": "activate()"
      }
    }]
  }], null, {
    id: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "id",
        required: false
      }]
    }],
    value: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "value",
        required: true
      }]
    }],
    _disabled: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "disabled",
        required: false
      }]
    }]
  });
})();
var BrnSelectList = class _BrnSelectList {
  /** @nocollapse */
  static ɵfac = function BrnSelectList_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectList)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectList,
    selectors: [["", "brnSelectList", ""]],
    hostAttrs: ["role", "listbox"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectList, [{
    type: Directive,
    args: [{
      selector: "[brnSelectList]",
      host: {
        role: "listbox"
      }
    }]
  }], null, null);
})();
var BRN_SELECT_MULTIPLE_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => BrnSelectMultiple),
  multi: true
};
var BrnSelectMultiple = class _BrnSelectMultiple {
  _injector = inject(Injector);
  _fieldControl = inject(BrnFieldControl, {
    optional: true
  });
  _config = injectBrnSelectConfig();
  controlState = this._fieldControl?.controlState;
  /** Access the popover if present */
  _brnPopover = inject(BrnPopover, {
    optional: true
  });
  /** Whether the combobox is disabled */
  disabled = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "disabled"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  _disabled = linkedSignal(this.disabled, ...ngDevMode ? [{
    debugName: "_disabled"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @internal The disabled state as a readonly signal */
  disabledState = this._disabled.asReadonly();
  /** The selected value of the select. */
  value = model(null, ...ngDevMode ? [{
    debugName: "value"
  }] : (
    /* istanbul ignore next */
    []
  ));
  hasValue = computed(() => {
    const value = this.value();
    if (value === null || value === void 0) return false;
    return value.length > 0;
  }, ...ngDevMode ? [{
    debugName: "hasValue"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** A function to compare an item with the selected value. */
  isItemEqualToValue = input(this._config.isItemEqualToValue, ...ngDevMode ? [{
    debugName: "isItemEqualToValue"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** A function to convert an item to a string for display. */
  itemToString = input(this._config.itemToString, ...ngDevMode ? [{
    debugName: "itemToString"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _triggerWidth = signal(null, ...ngDevMode ? [{
    debugName: "_triggerWidth"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @internal The width of the trigger wrapper */
  triggerWidth = this._triggerWidth.asReadonly();
  /** @internal Access all the items within the select */
  items = contentChildren(BrnSelectItemToken, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "items"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    descendants: true
  }));
  /** @internal The key manager for managing active descendant */
  keyManager = new ActiveDescendantKeyManager(this.items, this._injector);
  /** @internal Whether the select is expanded */
  isExpanded = computed(() => this._brnPopover?.stateComputed() === "open", ...ngDevMode ? [{
    debugName: "isExpanded"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _selectTrigger = signal(void 0, ...ngDevMode ? [{
    debugName: "_selectTrigger"
  }] : (
    /* istanbul ignore next */
    []
  ));
  labelableId = computed(() => this._selectTrigger()?.id(), ...ngDevMode ? [{
    debugName: "labelableId"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _onChange;
  _onTouched;
  constructor() {
    this.keyManager.withVerticalOrientation().withHomeAndEnd().withTypeAhead().withWrap().skipPredicate((item) => item.disabled);
    this._brnPopover?.closed.subscribe(() => {
      this._onTouched?.();
      this.keyManager.setActiveItem(-1);
    });
    afterNextRender(() => {
      effect(() => {
        if (!this.isExpanded()) return;
        const items = this.items();
        const values = this.value();
        const lastValue = values ? values[values.length - 1] : null;
        untracked(() => {
          const index = lastValue !== null && lastValue !== void 0 ? items.findIndex((item) => this.isItemEqualToValue()(item.value(), lastValue)) : -1;
          if (index !== -1) {
            this.keyManager.setActiveItem(index);
          } else if (items.length > 0) {
            this.keyManager.setFirstItemActive();
          } else {
            this.keyManager.setActiveItem(-1);
          }
        });
      }, {
        injector: this._injector
      });
    });
  }
  registerSelectTrigger(input2) {
    return this._selectTrigger.set(input2);
  }
  updateTriggerWidth(width) {
    this._triggerWidth.set(width);
  }
  isSelected(itemValue) {
    return this.value()?.some((v) => this.isItemEqualToValue()(itemValue, v)) ?? false;
  }
  select(itemValue) {
    const selected = this.value() ?? [];
    if (this.isSelected(itemValue)) {
      this.value.set(selected.filter((d) => !this.isItemEqualToValue()(d, itemValue)) ?? []);
    } else {
      this.value.set([...selected, itemValue]);
    }
    this._onChange?.(this.value() ?? []);
  }
  /** Select the active item with Enter key. */
  selectActiveItem() {
    if (!this.isExpanded()) return;
    const value = this.keyManager.activeItem?.value();
    if (value !== null && value !== void 0) {
      this.select(value);
    } else {
      this.close();
    }
  }
  open() {
    if (this._disabled() || this.isExpanded()) return;
    this._brnPopover?.open();
  }
  close() {
    if (this._disabled() || !this.isExpanded()) return;
    this._brnPopover?.close();
  }
  toggle() {
    this.isExpanded() ? this.close() : this.open();
  }
  /** CONTROL VALUE ACCESSOR */
  writeValue(value) {
    this.value.set(value);
  }
  registerOnChange(fn) {
    this._onChange = fn;
  }
  registerOnTouched(fn) {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled) {
    this._disabled.set(isDisabled);
  }
  /** @nocollapse */
  static ɵfac = function BrnSelectMultiple_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectMultiple)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectMultiple,
    selectors: [["", "brnSelectMultiple", ""]],
    contentQueries: function BrnSelectMultiple_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuerySignal(dirIndex, ctx.items, BrnSelectItemToken, 5);
      }
      if (rf & 2) {
        ɵɵqueryAdvance();
      }
    },
    inputs: {
      disabled: [1, "disabled"],
      value: [1, "value"],
      isItemEqualToValue: [1, "isItemEqualToValue"],
      itemToString: [1, "itemToString"]
    },
    outputs: {
      value: "valueChange"
    },
    features: [ɵɵProvidersFeature([provideBrnSelectBase(_BrnSelectMultiple), BRN_SELECT_MULTIPLE_VALUE_ACCESSOR, provideBrnLabelable(_BrnSelectMultiple)]), ɵɵHostDirectivesFeature([BrnFieldControl])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectMultiple, [{
    type: Directive,
    args: [{
      selector: "[brnSelectMultiple]",
      providers: [provideBrnSelectBase(BrnSelectMultiple), BRN_SELECT_MULTIPLE_VALUE_ACCESSOR, provideBrnLabelable(BrnSelectMultiple)],
      hostDirectives: [BrnFieldControl]
    }]
  }], () => [], {
    disabled: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "disabled",
        required: false
      }]
    }],
    value: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "value",
        required: false
      }]
    }, {
      type: Output,
      args: ["valueChange"]
    }],
    isItemEqualToValue: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isItemEqualToValue",
        required: false
      }]
    }],
    itemToString: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "itemToString",
        required: false
      }]
    }],
    items: [{
      type: ContentChildren,
      args: [forwardRef(() => BrnSelectItemToken), __spreadProps(__spreadValues({}, {
        descendants: true
      }), {
        isSignal: true
      })]
    }]
  });
})();
var BrnSelectPlaceholder = class _BrnSelectPlaceholder {
  _select = injectBrnSelectBase();
  _hasValue = this._select.hasValue;
  /** @nocollapse */
  static ɵfac = function BrnSelectPlaceholder_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectPlaceholder)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectPlaceholder,
    selectors: [["", "brnSelectPlaceholder", ""]],
    hostVars: 1,
    hostBindings: function BrnSelectPlaceholder_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("data-hidden", ctx._hasValue() ? "" : null);
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectPlaceholder, [{
    type: Directive,
    args: [{
      selector: "[brnSelectPlaceholder]",
      host: {
        "[attr.data-hidden]": '_hasValue() ? "" : null'
      }
    }]
  }], null, null);
})();
var BrnSelectScrollDown = class _BrnSelectScrollDown {
  _el = inject(ElementRef);
  _destroyRef = inject(DestroyRef);
  _selectContent = inject(BrnSelectContent);
  _showScrollDown = this._selectContent.showScrollDown;
  _endReached = new Subject();
  _scrollDown() {
    const mouseLeave$ = fromEvent(this._el.nativeElement, "mouseleave");
    interval(15).pipe(takeUntil(mouseLeave$), takeUntil(this._endReached), takeUntilDestroyed(this._destroyRef)).subscribe(() => this._selectContent.scrollDown(() => this._endReached.next(true)));
  }
  /** @nocollapse */
  static ɵfac = function BrnSelectScrollDown_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectScrollDown)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectScrollDown,
    selectors: [["", "brnSelectScrollDown", ""]],
    hostAttrs: ["aria-hidden", "true"],
    hostVars: 1,
    hostBindings: function BrnSelectScrollDown_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("mouseenter", function BrnSelectScrollDown_mouseenter_HostBindingHandler() {
          return ctx._scrollDown();
        });
      }
      if (rf & 2) {
        ɵɵattribute("data-hidden", !ctx._showScrollDown() ? "" : null);
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectScrollDown, [{
    type: Directive,
    args: [{
      selector: "[brnSelectScrollDown]",
      host: {
        "aria-hidden": "true",
        "[attr.data-hidden]": '!_showScrollDown() ? "" : null',
        "(mouseenter)": "_scrollDown()"
      }
    }]
  }], null, null);
})();
var BrnSelectScrollUp = class _BrnSelectScrollUp {
  _el = inject(ElementRef);
  _destroyRef = inject(DestroyRef);
  _selectContent = inject(BrnSelectContent);
  _showScrollUp = this._selectContent.showScrollUp;
  _endReached = new Subject();
  _scrollUp() {
    const mouseLeave$ = fromEvent(this._el.nativeElement, "mouseleave");
    interval(15).pipe(takeUntil(mouseLeave$), takeUntil(this._endReached), takeUntilDestroyed(this._destroyRef)).subscribe(() => this._selectContent.scrollUp(() => this._endReached.next(true)));
  }
  /** @nocollapse */
  static ɵfac = function BrnSelectScrollUp_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectScrollUp)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectScrollUp,
    selectors: [["", "brnSelectScrollUp", ""]],
    hostAttrs: ["aria-hidden", "true"],
    hostVars: 1,
    hostBindings: function BrnSelectScrollUp_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("mouseenter", function BrnSelectScrollUp_mouseenter_HostBindingHandler() {
          return ctx._scrollUp();
        });
      }
      if (rf & 2) {
        ɵɵattribute("data-hidden", !ctx._showScrollUp() ? "" : null);
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectScrollUp, [{
    type: Directive,
    args: [{
      selector: "[brnSelectScrollUp]",
      host: {
        "aria-hidden": "true",
        "[attr.data-hidden]": '!_showScrollUp() ? "" : null',
        "(mouseenter)": "_scrollUp()"
      }
    }]
  }], null, null);
})();
var BrnSelectSeparator = class _BrnSelectSeparator {
  orientation = input("horizontal", ...ngDevMode ? [{
    debugName: "orientation"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @nocollapse */
  static ɵfac = function BrnSelectSeparator_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectSeparator)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectSeparator,
    selectors: [["", "brnSelectSeparator", ""]],
    hostAttrs: ["role", "separator"],
    hostVars: 2,
    hostBindings: function BrnSelectSeparator_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("aria-orientation", ctx.orientation())("data-orientation", ctx.orientation());
      }
    },
    inputs: {
      orientation: [1, "orientation"]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectSeparator, [{
    type: Directive,
    args: [{
      selector: "[brnSelectSeparator]",
      host: {
        role: "separator",
        "[attr.aria-orientation]": "orientation()",
        "[attr.data-orientation]": "orientation()"
      }
    }]
  }], null, {
    orientation: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "orientation",
        required: false
      }]
    }]
  });
})();
var BrnSelectTrigger = class _BrnSelectTrigger {
  static _id = 0;
  _host = inject(ElementRef, {
    host: true
  });
  _brnOverlay = inject(BrnOverlay, {
    optional: true
  });
  _select = injectBrnSelectBase();
  _elementSize = injectElementSize();
  id = input(`brn-select-trigger-${++_BrnSelectTrigger._id}`, ...ngDevMode ? [{
    debugName: "id"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** Whether to force the trigger into an invalid state. */
  forceInvalid = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "forceInvalid"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  /** Whether the combobox panel is expanded */
  _isExpanded = this._select.isExpanded;
  _disabled = this._select.disabledState;
  _isPlaceholder = computed(() => !this._select.hasValue(), ...ngDevMode ? [{
    debugName: "_isPlaceholder"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _invalid = computed(() => this._select?.controlState?.()?.invalid, ...ngDevMode ? [{
    debugName: "_invalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _touched = computed(() => this._select?.controlState?.()?.touched, ...ngDevMode ? [{
    debugName: "_touched"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _dirty = computed(() => this._select?.controlState?.()?.dirty, ...ngDevMode ? [{
    debugName: "_dirty"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _spartanInvalid = computed(() => this.forceInvalid() || this._select?.controlState?.()?.spartanInvalid, ...ngDevMode ? [{
    debugName: "_spartanInvalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    this._select.registerSelectTrigger(this);
    this._brnOverlay?.setOrigin(this._host.nativeElement);
    effect(() => {
      const size = this._elementSize();
      if (!size) return;
      this._select.updateTriggerWidth(size.width);
      this._brnOverlay?.updatePosition();
    });
  }
  toggle() {
    this._select.toggle();
  }
  open() {
    this._brnOverlay?.open();
  }
  /** Listen for keydown events */
  onKeyDown(event) {
    const isExpanded = this._isExpanded();
    if (isExpanded && (event.key === "Enter" || event.key === "Tab")) {
      if (event.key === "Enter") {
        event.preventDefault();
      }
      this._select.selectActiveItem();
      return;
    }
    if (!isExpanded && (event.key === "Enter" || event.key === "ArrowDown" || event.key === "ArrowUp")) {
      if (event.key === "Enter") {
        event.preventDefault();
      }
      this._select.open();
    }
    this._select.keyManager.onKeydown(event);
  }
  /** @nocollapse */
  static ɵfac = function BrnSelectTrigger_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectTrigger)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectTrigger,
    selectors: [["button", "brnSelectTrigger", ""]],
    hostAttrs: ["role", "combobox", "aria-haspopup", "listbox", "type", "button"],
    hostVars: 8,
    hostBindings: function BrnSelectTrigger_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function BrnSelectTrigger_click_HostBindingHandler() {
          return ctx.toggle();
        })("keydown", function BrnSelectTrigger_keydown_HostBindingHandler($event) {
          return ctx.onKeyDown($event);
        });
      }
      if (rf & 2) {
        ɵɵdomProperty("id", ctx.id())("disabled", ctx._disabled());
        ɵɵattribute("aria-expanded", ctx._isExpanded())("data-placeholder", ctx._isPlaceholder() ? "" : null)("aria-invalid", (ctx._invalid == null ? null : ctx._invalid()) ? "true" : null)("data-dirty", (ctx._dirty == null ? null : ctx._dirty()) ? "true" : null)("data-touched", (ctx._touched == null ? null : ctx._touched()) ? "true" : null)("data-matches-spartan-invalid", (ctx._spartanInvalid == null ? null : ctx._spartanInvalid()) ? "true" : null);
      }
    },
    inputs: {
      id: [1, "id"],
      forceInvalid: [1, "forceInvalid"]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectTrigger, [{
    type: Directive,
    args: [{
      selector: "button[brnSelectTrigger]",
      host: {
        role: "combobox",
        "aria-haspopup": "listbox",
        type: "button",
        "[id]": "id()",
        "[attr.aria-expanded]": "_isExpanded()",
        "[attr.data-placeholder]": '_isPlaceholder() ? "" : null',
        "[disabled]": "_disabled()",
        "[attr.aria-invalid]": '_invalid?.() ? "true" : null',
        "[attr.data-dirty]": '_dirty?.() ? "true": null',
        "[attr.data-touched]": '_touched?.() ? "true" : null',
        "[attr.data-matches-spartan-invalid]": '_spartanInvalid?.() ? "true" : null',
        "(click)": "toggle()",
        "(keydown)": "onKeyDown($event)"
      }
    }]
  }], () => [], {
    id: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "id",
        required: false
      }]
    }],
    forceInvalid: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "forceInvalid",
        required: false
      }]
    }]
  });
})();
var BrnSelectValue = class _BrnSelectValue {
  _select = injectBrnSelectBase();
  placeholder = input("", ...ngDevMode ? [{
    debugName: "placeholder"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _isPlaceholder = computed(() => !this._select.hasValue(), ...ngDevMode ? [{
    debugName: "_isPlaceholder"
  }] : (
    /* istanbul ignore next */
    []
  ));
  hidden = computed(() => !this._select.hasValue() && !this.placeholder(), ...ngDevMode ? [{
    debugName: "hidden"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _value = computed(() => {
    return this._select.hasValue() ? stringifyAsLabel(this._select.value(), this._select.itemToString()) : this.placeholder();
  }, ...ngDevMode ? [{
    debugName: "_value"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @nocollapse */
  static ɵfac = function BrnSelectValue_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectValue)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectValue,
    selectors: [["", "brnSelectValue", ""]],
    hostVars: 3,
    hostBindings: function BrnSelectValue_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵdomProperty("textContent", ctx._value());
        ɵɵattribute("data-placeholder", ctx._isPlaceholder() ? "" : null)("data-hidden", ctx.hidden() ? "" : null);
      }
    },
    inputs: {
      placeholder: [1, "placeholder"]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectValue, [{
    type: Directive,
    args: [{
      selector: "[brnSelectValue]",
      host: {
        "[attr.data-placeholder]": '_isPlaceholder() ? "" : null',
        "[attr.data-hidden]": 'hidden() ? "" : null',
        "[textContent]": "_value()"
      }
    }]
  }], null, {
    placeholder: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "placeholder",
        required: false
      }]
    }]
  });
})();
var BrnSelectValueTemplate = class _BrnSelectValueTemplate {
  _templateRef = inject(TemplateRef);
  _viewContainerRef = inject(ViewContainerRef);
  _select = injectBrnSelectBase();
  _value = computed(() => {
    const value = this._select.value();
    if (value === null || value === void 0) {
      return null;
    }
    return value;
  }, ...ngDevMode ? [{
    debugName: "_value"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    effect(() => {
      const value = this._value();
      if (value !== null && value !== void 0) {
        this._viewContainerRef.clear();
        this._viewContainerRef.createEmbeddedView(this._templateRef, {
          $implicit: value
        });
      } else {
        this._viewContainerRef.clear();
      }
    });
  }
  /** @nocollapse */
  static ɵfac = function BrnSelectValueTemplate_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectValueTemplate)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectValueTemplate,
    selectors: [["", "brnSelectValueTemplate", ""]]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectValueTemplate, [{
    type: Directive,
    args: [{
      selector: "[brnSelectValueTemplate]"
    }]
  }], () => [], null);
})();
var BrnSelectValues = class _BrnSelectValues {
  _templateRef = inject(TemplateRef);
  _viewContainerRef = inject(ViewContainerRef);
  _select = injectBrnSelectBase();
  _values = computed(() => {
    const values = this._select.value();
    if (values === null || values === void 0) {
      return null;
    }
    return Array.isArray(values) ? values : [values];
  }, ...ngDevMode ? [{
    debugName: "_values"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    effect(() => {
      const values = this._values();
      if (values?.length) {
        this._viewContainerRef.clear();
        this._viewContainerRef.createEmbeddedView(this._templateRef, {
          $implicit: values
        });
      } else {
        this._viewContainerRef.clear();
      }
    });
  }
  /** @nocollapse */
  static ɵfac = function BrnSelectValues_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSelectValues)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSelectValues,
    selectors: [["", "brnSelectValues", ""]]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSelectValues, [{
    type: Directive,
    args: [{
      selector: "[brnSelectValues]"
    }]
  }], () => [], null);
})();
var BrnSelectImports = [BrnSelect, BrnSelectContent, BrnSelectGroup, BrnSelectItem, BrnSelectLabel, BrnSelectList, BrnSelectMultiple, BrnSelectPlaceholder, BrnSelectScrollUp, BrnSelectScrollDown, BrnSelectSeparator, BrnSelectTrigger, BrnSelectValue, BrnSelectValueTemplate, BrnSelectValues];
export {
  BRN_SELECT_MULTIPLE_VALUE_ACCESSOR,
  BRN_SELECT_VALUE_ACCESSOR,
  BrnSelect,
  BrnSelectBaseToken,
  BrnSelectContent,
  BrnSelectGroup,
  BrnSelectImports,
  BrnSelectItem,
  BrnSelectItemToken,
  BrnSelectLabel,
  BrnSelectList,
  BrnSelectMultiple,
  BrnSelectPlaceholder,
  BrnSelectScrollDown,
  BrnSelectScrollUp,
  BrnSelectSeparator,
  BrnSelectTrigger,
  BrnSelectValue,
  BrnSelectValueTemplate,
  BrnSelectValues,
  injectBrnSelectBase,
  injectBrnSelectConfig,
  provideBrnSelectBase,
  provideBrnSelectConfig,
  provideBrnSelectItem
};
//# sourceMappingURL=@spartan-ng_brain_select.js.map
