import {
  BrnFieldControl,
  provideBrnLabelable
} from "./chunk-CORRGEFH.js";
import "./chunk-AXXKIU6M.js";
import {
  FocusMonitor
} from "./chunk-6IE75NIU.js";
import "./chunk-C3FLKRDF.js";
import {
  takeUntilDestroyed
} from "./chunk-R4LLFK3G.js";
import "./chunk-2P2IYF4D.js";
import "./chunk-HC33ZOIP.js";
import {
  NG_VALUE_ACCESSOR
} from "./chunk-MQAMSBSO.js";
import {
  isPlatformBrowser
} from "./chunk-LAHHEQBJ.js";
import "./chunk-JK5PHBUV.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  Input,
  Output,
  PLATFORM_ID,
  Renderer2,
  ViewChild,
  afterRenderEffect,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  setClassMetadata,
  signal,
  viewChild,
  ɵɵHostDirectivesFeature,
  ɵɵProvidersFeature,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵdomListener,
  ɵɵdomProperty,
  ɵɵgetCurrentView,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵqueryAdvance,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵviewQuerySignal
} from "./chunk-BFMHQS5Q.js";
import "./chunk-RSS3ODKE.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-checkbox.mjs
var _c0 = ["checkBox"];
var _c1 = ["*"];
var BRN_CHECKBOX_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => BrnCheckbox),
  multi: true
};
var uniqueIdCounter = 0;
var CONTAINER_POST_FIX = "-checkbox";
var BrnCheckbox = class _BrnCheckbox {
  _destroyRef = inject(DestroyRef);
  _renderer = inject(Renderer2);
  _elementRef = inject(ElementRef);
  _focusMonitor = inject(FocusMonitor);
  _cdr = inject(ChangeDetectorRef);
  _fieldControl = inject(BrnFieldControl, {
    optional: true
  });
  _document = inject(DOCUMENT);
  _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  _focusVisible = signal(false, ...ngDevMode ? [{
    debugName: "_focusVisible"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _focused = signal(false, ...ngDevMode ? [{
    debugName: "_focused"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * The checked state of the checkbox.
   * Can be bound with [(checked)] for two-way binding.
   */
  checkedInput = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "checkedInput"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "checked",
    transform: booleanAttribute
  }));
  checked = linkedSignal(this.checkedInput, ...ngDevMode ? [{
    debugName: "checked"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** Emits when checked state changes. */
  checkedChange = output();
  /**
   * Read-only signal of current checkbox state.
   * Use this when you only need to read state without changing it.
   */
  isChecked = this.checked.asReadonly();
  /*
   * The indeterminate state of the checkbox.
   * For example, a "select all/deselect all" checkbox may be in the indeterminate state when some but not all of its sub-controls are checked.
   */
  indeterminate = model(false, ...ngDevMode ? [{
    debugName: "indeterminate"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Computed data-state attribute value based on checked state.
   * Returns 'checked', 'unchecked', or 'indeterminate'.
   */
  _dataState = computed(() => {
    if (this.indeterminate()) return "indeterminate";
    return this.checked() ? "checked" : "unchecked";
  }, ...ngDevMode ? [{
    debugName: "_dataState"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Computed aria-checked attribute value for accessibility.
   * Returns 'true', 'false', or 'mixed' (for indeterminate).
   */
  _ariaChecked = computed(() => {
    if (this.indeterminate()) return "mixed";
    return this.checked() ? "true" : "false";
  }, ...ngDevMode ? [{
    debugName: "_ariaChecked"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Unique identifier for checkbox component.
   * When provided, inner button gets ID without '-checkbox' suffix.
   * Auto-generates ID if not provided.
   */
  id = input(++uniqueIdCounter + "", ...ngDevMode ? [{
    debugName: "id"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Form control name for checkbox.
   * When provided, inner button gets name without '-checkbox' suffix.
   */
  name = input(null, ...ngDevMode ? [{
    debugName: "name"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * CSS classes applied to inner button element.
   */
  class = input(null, ...ngDevMode ? [{
    debugName: "class"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Styles applied to the host element. Bound via `[style]` so they apply through the CSSOM and are
   * not blocked by a strict Content-Security-Policy.
   */
  hostStyles = input("display: contents", ...ngDevMode ? [{
    debugName: "hostStyles"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * Accessibility label for screen readers.
   * Use when no visible label exists.
   */
  ariaLabel = input(null, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "ariaLabel"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "aria-label"
  }));
  /**
   * ID of element that labels this checkbox for accessibility.
   * Auto-set when checkbox is inside label element.
   */
  ariaLabelledby = input(null, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "ariaLabelledby"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "aria-labelledby"
  }));
  mutableAriaLabelledby = linkedSignal(() => this.ariaLabelledby(), ...ngDevMode ? [{
    debugName: "mutableAriaLabelledby"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /**
   * ID of element that describes this checkbox for accessibility.
   */
  ariaDescribedby = input(null, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "ariaDescribedby"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "aria-describedby"
  }));
  /**
   * Whether checkbox is required in a form.
   */
  required = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "required"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  /**
   * Whether checkbox is disabled.
   * Disabled checkboxes cannot be toggled and indicate disabled state through data-disabled attribute.
   */
  disabled = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "disabled"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  /**
   * Whether to force the field into an invalid state, regardless of the form control's state.
   * Overrides both the `data-invalid` and `data-matches-spartan-invalid` attributes.
   */
  forceInvalid = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "forceInvalid"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  /**
   * Computed state for checkbox container and accessibility.
   * Manages ID, name, and disabled state.
   */
  _state = computed(() => {
    const name = this.name();
    const id = this.id();
    return {
      disabled: signal(this.disabled()),
      name: name ? name + CONTAINER_POST_FIX : null,
      id: id ? id + CONTAINER_POST_FIX : null
    };
  }, ...ngDevMode ? [{
    debugName: "_state"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _buttonId = computed(() => this._getCheckboxButtonId(this._state().id), ...ngDevMode ? [{
    debugName: "_buttonId"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _buttonName = computed(() => this._getCheckboxButtonId(this._state().name), ...ngDevMode ? [{
    debugName: "_buttonName"
  }] : (
    /* istanbul ignore next */
    []
  ));
  labelableId = this._buttonId;
  _dirty = this._fieldControl?.dirty;
  _invalid = computed(() => this.forceInvalid() || (this._fieldControl?.invalid?.() ?? null), ...ngDevMode ? [{
    debugName: "_invalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  spartanInvalid = computed(() => this.forceInvalid() || (this._fieldControl?.spartanInvalid?.() ?? null), ...ngDevMode ? [{
    debugName: "spartanInvalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _controlTouched = this._fieldControl?.touched;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  _onChange = () => {
  };
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  _onTouched = () => {
  };
  /**
   * Reference to the checkbox button element in the template.
   */
  checkbox = viewChild.required("checkBox");
  /**
   * Event emitted when checkbox is blurred (loses focus).
   * Used for form validation.
   */
  touched = output();
  constructor() {
    afterRenderEffect(() => {
      const state = this._state();
      const isDisabled = state.disabled();
      if (!this._elementRef.nativeElement || !this._isBrowser) return;
      const newLabelId = state.id + "-label";
      const checkboxButtonId = this._getCheckboxButtonId(state.id);
      const labelElement = this._elementRef.nativeElement.closest("label") ?? this._document.querySelector(`label[for="${checkboxButtonId}"]`);
      if (!labelElement) return;
      const existingLabelId = labelElement.id;
      this._renderer.setAttribute(labelElement, "data-disabled", isDisabled ? "true" : "false");
      this.mutableAriaLabelledby.set(existingLabelId || newLabelId);
      if (!existingLabelId || existingLabelId.length === 0) {
        this._renderer.setAttribute(labelElement, "id", newLabelId);
      }
    });
  }
  /**
   * Toggles checkbox between checked/unchecked states.
   * If checkbox is indeterminate, sets to checked.
   * Does nothing if checkbox is disabled.
   */
  toggle() {
    if (this._state().disabled()) return;
    this._onTouched();
    this.touched.emit();
    const newChecked = this.indeterminate() ? true : !this.checked();
    this.indeterminate.set(false);
    this.checkedChange.emit(newChecked);
    this.checked.set(newChecked);
    this._onChange(newChecked);
  }
  ngAfterContentInit() {
    this._focusMonitor.monitor(this._elementRef, true).pipe(takeUntilDestroyed(this._destroyRef)).subscribe((focusOrigin) => {
      if (focusOrigin) this._focused.set(true);
      if (focusOrigin === "keyboard" || focusOrigin === "program") {
        this._focusVisible.set(true);
        this._cdr.markForCheck();
      }
      if (!focusOrigin) {
        Promise.resolve().then(() => this._handleBlur());
      }
    });
  }
  _handleBlur() {
    if (this._destroyRef.destroyed) return;
    this._focusVisible.set(false);
    this._focused.set(false);
    this._onTouched();
    this.touched.emit();
    this._cdr.markForCheck();
  }
  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
  }
  /**
   * Gets proper ID for inner button element.
   * Removes '-checkbox' suffix if present in container ID.
   *
   * @param idPassedToContainer - ID applied to container element
   * @returns ID to use for inner button or null
   */
  _getCheckboxButtonId(idPassedToContainer) {
    return idPassedToContainer ? idPassedToContainer.replace(new RegExp(CONTAINER_POST_FIX + "$"), "") : null;
  }
  /**
   * Updates internal state when control value changes from outside.
   * Handles boolean and 'indeterminate' values.
   * Part of ControlValueAccessor interface.
   *
   * @param value - New checkbox state (true/false/'indeterminate')
   */
  writeValue(value) {
    this.checked.set(value);
  }
  /**
   * Registers callback for value changes.
   * Part of ControlValueAccessor interface.
   *
   * @param fn - Function to call when value changes
   */
  registerOnChange(fn) {
    this._onChange = fn;
  }
  /**
   * Registers callback for touched events.
   * Part of ControlValueAccessor interface.
   *
   * @param fn - Function to call when control is touched
   */
  registerOnTouched(fn) {
    this._onTouched = fn;
  }
  /**
   * Updates disabled state from form control.
   * Part of ControlValueAccessor interface.
   *
   * @param isDisabled - Whether checkbox should be disabled
   */
  setDisabledState(isDisabled) {
    this._state().disabled.set(isDisabled);
    this._cdr.markForCheck();
  }
  /** @nocollapse */
  static ɵfac = function BrnCheckbox_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnCheckbox)();
  };
  /** @nocollapse */
  static ɵcmp = ɵɵdefineComponent({
    type: _BrnCheckbox,
    selectors: [["brn-checkbox"]],
    viewQuery: function BrnCheckbox_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuerySignal(ctx.checkbox, _c0, 5);
      }
      if (rf & 2) {
        ɵɵqueryAdvance();
      }
    },
    hostVars: 16,
    hostBindings: function BrnCheckbox_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("id", ctx._state().id)("name", ctx._state().name)("aria-labelledby", null)("aria-label", null)("aria-describedby", null)("aria-invalid", (ctx._invalid == null ? null : ctx._invalid()) ? "true" : null)("data-invalid", (ctx._invalid == null ? null : ctx._invalid()) ? "true" : null)("data-matches-spartan-invalid", (ctx.spartanInvalid == null ? null : ctx.spartanInvalid()) ? "true" : null)("data-touched", (ctx._controlTouched == null ? null : ctx._controlTouched()) ? "true" : null)("data-dirty", (ctx._dirty == null ? null : ctx._dirty()) ? "true" : null)("data-state", ctx._dataState())("data-focus-visible", ctx._focusVisible())("data-focus", ctx._focused())("data-disabled", ctx._state().disabled());
        ɵɵstyleMap(ctx.hostStyles());
      }
    },
    inputs: {
      checkedInput: [1, "checked", "checkedInput"],
      indeterminate: [1, "indeterminate"],
      id: [1, "id"],
      name: [1, "name"],
      class: [1, "class"],
      hostStyles: [1, "hostStyles"],
      ariaLabel: [1, "aria-label", "ariaLabel"],
      ariaLabelledby: [1, "aria-labelledby", "ariaLabelledby"],
      ariaDescribedby: [1, "aria-describedby", "ariaDescribedby"],
      required: [1, "required"],
      disabled: [1, "disabled"],
      forceInvalid: [1, "forceInvalid"]
    },
    outputs: {
      checkedChange: "checkedChange",
      indeterminate: "indeterminateChange",
      touched: "touched"
    },
    features: [ɵɵProvidersFeature([BRN_CHECKBOX_VALUE_ACCESSOR, provideBrnLabelable(_BrnCheckbox)]), ɵɵHostDirectivesFeature([BrnFieldControl])],
    ngContentSelectors: _c1,
    decls: 3,
    vars: 14,
    consts: [["checkBox", ""], ["role", "checkbox", "type", "button", 3, "click", "disabled", "tabIndex"]],
    template: function BrnCheckbox_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = ɵɵgetCurrentView();
        ɵɵprojectionDef();
        ɵɵdomElementStart(0, "button", 1, 0);
        ɵɵdomListener("click", function BrnCheckbox_Template_button_click_0_listener($event) {
          ɵɵrestoreView(_r1);
          $event.preventDefault();
          return ɵɵresetView(ctx.toggle());
        });
        ɵɵprojection(2);
        ɵɵdomElementEnd();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.class());
        ɵɵdomProperty("disabled", ctx._state().disabled())("tabIndex", ctx._state().disabled() ? -1 : 0);
        ɵɵattribute("id", ctx._buttonId())("name", ctx._buttonName())("aria-checked", ctx._ariaChecked())("aria-label", ctx.ariaLabel() || null)("aria-labelledby", ctx.mutableAriaLabelledby() || null)("aria-describedby", ctx.ariaDescribedby() || null)("data-state", ctx._dataState())("data-focus-visible", ctx._focusVisible())("data-focus", ctx._focused())("data-disabled", ctx._state().disabled());
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnCheckbox, [{
    type: Component,
    args: [{
      selector: "brn-checkbox",
      providers: [BRN_CHECKBOX_VALUE_ACCESSOR, provideBrnLabelable(BrnCheckbox)],
      changeDetection: ChangeDetectionStrategy.OnPush,
      hostDirectives: [BrnFieldControl],
      host: {
        "[style]": "hostStyles()",
        "[attr.id]": "_state().id",
        "[attr.name]": "_state().name",
        "[attr.aria-labelledby]": "null",
        "[attr.aria-label]": "null",
        "[attr.aria-describedby]": "null",
        "[attr.aria-invalid]": '_invalid?.() ? "true" : null',
        "[attr.data-invalid]": '_invalid?.() ? "true" : null',
        "[attr.data-matches-spartan-invalid]": 'spartanInvalid?.() ? "true" : null',
        "[attr.data-touched]": '_controlTouched?.() ? "true" : null',
        "[attr.data-dirty]": '_dirty?.() ? "true" : null',
        "[attr.data-state]": "_dataState()",
        "[attr.data-focus-visible]": "_focusVisible()",
        "[attr.data-focus]": "_focused()",
        "[attr.data-disabled]": "_state().disabled()"
      },
      template: `
		<button
			#checkBox
			role="checkbox"
			type="button"
			[attr.id]="_buttonId()"
			[attr.name]="_buttonName()"
			[class]="class()"
			[attr.aria-checked]="_ariaChecked()"
			[attr.aria-label]="ariaLabel() || null"
			[attr.aria-labelledby]="mutableAriaLabelledby() || null"
			[attr.aria-describedby]="ariaDescribedby() || null"
			[attr.data-state]="_dataState()"
			[attr.data-focus-visible]="_focusVisible()"
			[attr.data-focus]="_focused()"
			[attr.data-disabled]="_state().disabled()"
			[disabled]="_state().disabled()"
			[tabIndex]="_state().disabled() ? -1 : 0"
			(click)="$event.preventDefault(); toggle()"
		>
			<ng-content />
		</button>
	`
    }]
  }], () => [], {
    checkedInput: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "checked",
        required: false
      }]
    }],
    checkedChange: [{
      type: Output,
      args: ["checkedChange"]
    }],
    indeterminate: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "indeterminate",
        required: false
      }]
    }, {
      type: Output,
      args: ["indeterminateChange"]
    }],
    id: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "id",
        required: false
      }]
    }],
    name: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "name",
        required: false
      }]
    }],
    class: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "class",
        required: false
      }]
    }],
    hostStyles: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "hostStyles",
        required: false
      }]
    }],
    ariaLabel: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "aria-label",
        required: false
      }]
    }],
    ariaLabelledby: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "aria-labelledby",
        required: false
      }]
    }],
    ariaDescribedby: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "aria-describedby",
        required: false
      }]
    }],
    required: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "required",
        required: false
      }]
    }],
    disabled: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "disabled",
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
    }],
    checkbox: [{
      type: ViewChild,
      args: ["checkBox", {
        isSignal: true
      }]
    }],
    touched: [{
      type: Output,
      args: ["touched"]
    }]
  });
})();
var BrnCheckboxImports = [BrnCheckbox];
export {
  BRN_CHECKBOX_VALUE_ACCESSOR,
  BrnCheckbox,
  BrnCheckboxImports
};
//# sourceMappingURL=@spartan-ng_brain_checkbox.js.map
