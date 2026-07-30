import {
  FormGroupDirective,
  NgControl,
  NgForm
} from "./chunk-IG4VRLI4.js";
import {
  Directive,
  Injectable,
  Input,
  booleanAttribute,
  input,
  isSignal,
  setClassMetadata,
  ɵɵProvidersFeature,
  ɵɵattribute,
  ɵɵdefineDirective
} from "./chunk-TXPGLIRP.js";
import {
  DestroyRef,
  InjectionToken,
  Injector,
  computed,
  inject,
  signal,
  ɵɵdefineInjectable
} from "./chunk-RQHHER3I.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-forms.mjs
function controlStateEqual(a, b) {
  return a === b || a != null && b != null && a.dirty === b.dirty && a.invalid === b.invalid && a.touched === b.touched && a.spartanInvalid === b.spartanInvalid && a.errors === b.errors;
}
var ReactiveStateTracker = class {
  _ngControl;
  _matcher;
  _parentFormGroup;
  _parentForm;
  _stateVersion = signal(0, ...ngDevMode ? [{
    debugName: "_stateVersion"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _eventsSubscription;
  controlState = computed(() => {
    const control = this._ngControl.control;
    if (!control) return null;
    this._stateVersion();
    const spartanInvalid = this._matcher?.isInvalid(control, this._controlParent) ?? false;
    return {
      dirty: control.dirty,
      errors: control.errors,
      invalid: control.invalid,
      spartanInvalid,
      touched: control.touched
    };
  }, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "controlState"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    equal: controlStateEqual
  }));
  errors = computed(() => this.controlState()?.errors ?? null, ...ngDevMode ? [{
    debugName: "errors"
  }] : (
    /* istanbul ignore next */
    []
  ));
  dirty = computed(() => this.controlState()?.dirty ?? null, ...ngDevMode ? [{
    debugName: "dirty"
  }] : (
    /* istanbul ignore next */
    []
  ));
  invalid = computed(() => this.controlState()?.invalid ?? null, ...ngDevMode ? [{
    debugName: "invalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  spartanInvalid = computed(() => this.controlState()?.spartanInvalid ?? null, ...ngDevMode ? [{
    debugName: "spartanInvalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  touched = computed(() => this.controlState()?.touched ?? null, ...ngDevMode ? [{
    debugName: "touched"
  }] : (
    /* istanbul ignore next */
    []
  ));
  get _controlParent() {
    return this._parentFormGroup || this._parentForm;
  }
  constructor(_ngControl, _matcher, _parentFormGroup, _parentForm) {
    this._ngControl = _ngControl;
    this._matcher = _matcher;
    this._parentFormGroup = _parentFormGroup;
    this._parentForm = _parentForm;
    const control = _ngControl.control;
    if (control) {
      this._eventsSubscription = control.events.subscribe(() => {
        this._stateVersion.update((v) => v + 1);
      });
    }
  }
  destroy() {
    this._eventsSubscription?.unsubscribe();
  }
};
var SignalStateTracker = class {
  _ngControl;
  _matcher;
  _parentFormGroup;
  _parentForm;
  _control = computed(() => {
    const control = this._ngControl.control;
    if (!control) return null;
    return control;
  }, ...ngDevMode ? [{
    debugName: "_control"
  }] : (
    /* istanbul ignore next */
    []
  ));
  // With signal forms, AbstractControl is implemented by InteropNgControl, whose control state
  // properties (e.g. dirty, touched, invalid) are getter functions that internally read FormField state signals.
  // Accessing them inside a computed() therefore creates reactive signal dependencies automatically.
  // See: https://github.com/angular/angular/blob/39e382a756b552d2b7bd3ce2c364daee9d7a0056/packages/forms/signals/src/controls/interop_ng_control.ts#L68-L129
  dirty = computed(() => this._control()?.dirty ?? null, ...ngDevMode ? [{
    debugName: "dirty"
  }] : (
    /* istanbul ignore next */
    []
  ));
  touched = computed(() => this._control()?.touched ?? null, ...ngDevMode ? [{
    debugName: "touched"
  }] : (
    /* istanbul ignore next */
    []
  ));
  invalid = computed(() => this._control()?.invalid ?? null, ...ngDevMode ? [{
    debugName: "invalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  errors = computed(() => this._control()?.errors ?? null, ...ngDevMode ? [{
    debugName: "errors"
  }] : (
    /* istanbul ignore next */
    []
  ));
  spartanInvalid = computed(() => {
    const control = this._control();
    if (!control) {
      return null;
    }
    return this._matcher?.isInvalid(control, this._controlParent) ?? false;
  }, ...ngDevMode ? [{
    debugName: "spartanInvalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  controlState = computed(() => {
    const dirty = this.dirty();
    const invalid = this.invalid();
    const touched = this.touched();
    const spartanInvalid = this.spartanInvalid();
    const errors = this.errors();
    if (dirty === null || invalid === null || touched === null || spartanInvalid === null) return null;
    return {
      dirty,
      errors,
      invalid,
      spartanInvalid,
      touched
    };
  }, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "controlState"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    equal: controlStateEqual
  }));
  get _controlParent() {
    return this._parentFormGroup || this._parentForm;
  }
  constructor(_ngControl, _matcher, _parentFormGroup, _parentForm) {
    this._ngControl = _ngControl;
    this._matcher = _matcher;
    this._parentFormGroup = _parentFormGroup;
    this._parentForm = _parentForm;
  }
  destroy() {
  }
};
function createStateTracker(ngControl, matcher, parentFormGroup, parentForm) {
  if (ngControl.control && "field" in ngControl.control && isSignal(ngControl.control.field)) {
    return new SignalStateTracker(ngControl, matcher, parentFormGroup, parentForm);
  }
  return new ReactiveStateTracker(ngControl, matcher, parentFormGroup, parentForm);
}
var ShowOnDirtyErrorStateMatcher = class _ShowOnDirtyErrorStateMatcher {
  isInvalid(control, form) {
    return !!(control && control.invalid && (control.dirty || form instanceof NgForm && form.submitted));
  }
  /** @nocollapse */
  static ɵfac = function ShowOnDirtyErrorStateMatcher_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ShowOnDirtyErrorStateMatcher)();
  };
  /** @nocollapse */
  static ɵprov = ɵɵdefineInjectable({
    token: _ShowOnDirtyErrorStateMatcher,
    factory: _ShowOnDirtyErrorStateMatcher.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ShowOnDirtyErrorStateMatcher, [{
    type: Injectable
  }], null, null);
})();
var ErrorStateMatcher = class _ErrorStateMatcher {
  isInvalid(control, form) {
    return !!(control && control.invalid && (control.touched || form instanceof NgForm && form.submitted));
  }
  /** @nocollapse */
  static ɵfac = function ErrorStateMatcher_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ErrorStateMatcher)();
  };
  /** @nocollapse */
  static ɵprov = ɵɵdefineInjectable({
    token: _ErrorStateMatcher,
    factory: _ErrorStateMatcher.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ErrorStateMatcher, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-field.mjs
var BrnFieldA11yService = class _BrnFieldA11yService {
  _descriptions = signal([], ...ngDevMode ? [{
    debugName: "_descriptions"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _errors = signal([], ...ngDevMode ? [{
    debugName: "_errors"
  }] : (
    /* istanbul ignore next */
    []
  ));
  describedBy = computed(() => {
    const ids = [...this._descriptions(), ...this._errors()].filter(Boolean);
    const uniqueIds = [...new Set(ids)];
    return uniqueIds.length ? uniqueIds.join(" ") : null;
  }, ...ngDevMode ? [{
    debugName: "describedBy"
  }] : (
    /* istanbul ignore next */
    []
  ));
  registerDescription(id) {
    this._descriptions.update((ids) => ids.includes(id) ? ids : [...ids, id]);
  }
  unregisterDescription(id) {
    this._descriptions.update((ids) => ids.filter((value) => value !== id));
  }
  registerError(id) {
    this._errors.update((ids) => ids.includes(id) ? ids : [...ids, id]);
  }
  unregisterError(id) {
    this._errors.update((ids) => ids.filter((value) => value !== id));
  }
  /** @nocollapse */
  static ɵfac = function BrnFieldA11yService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnFieldA11yService)();
  };
  /** @nocollapse */
  static ɵprov = ɵɵdefineInjectable({
    token: _BrnFieldA11yService,
    factory: _BrnFieldA11yService.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnFieldA11yService, [{
    type: Injectable
  }], null, null);
})();
var BrnField = class _BrnField {
  _brnFieldControl = signal(null, ...ngDevMode ? [{
    debugName: "_brnFieldControl"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _labelable = signal(null, ...ngDevMode ? [{
    debugName: "_labelable"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** Whether the field is invalid. Overrides the `data-invalid` attribute. */
  dataInvalid = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "dataInvalid"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute,
    alias: "data-invalid"
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
  _invalid = computed(() => {
    if (this.forceInvalid() || this.dataInvalid()) return true;
    const control = this._brnFieldControl();
    if (!control || !control.ngControl) return false;
    return control.controlState()?.invalid;
  }, ...ngDevMode ? [{
    debugName: "_invalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _spartanInvalid = computed(() => {
    return this.forceInvalid() || (this._brnFieldControl()?.controlState()?.spartanInvalid ?? null);
  }, ...ngDevMode ? [{
    debugName: "_spartanInvalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _dirty = computed(() => {
    return this._brnFieldControl()?.controlState()?.dirty ?? null;
  }, ...ngDevMode ? [{
    debugName: "_dirty"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _touched = computed(() => {
    return this._brnFieldControl()?.controlState()?.touched ?? null;
  }, ...ngDevMode ? [{
    debugName: "_touched"
  }] : (
    /* istanbul ignore next */
    []
  ));
  labelableId = computed(() => this._labelable()?.labelableId(), ...ngDevMode ? [{
    debugName: "labelableId"
  }] : (
    /* istanbul ignore next */
    []
  ));
  brnFieldControl = this._brnFieldControl.asReadonly();
  errors = computed(() => this._brnFieldControl()?.errors() ?? null, ...ngDevMode ? [{
    debugName: "errors"
  }] : (
    /* istanbul ignore next */
    []
  ));
  controlState = computed(() => this._brnFieldControl()?.controlState() ?? null, ...ngDevMode ? [{
    debugName: "controlState"
  }] : (
    /* istanbul ignore next */
    []
  ));
  registerFieldControl(fieldControl) {
    if (this._brnFieldControl()) return;
    this._brnFieldControl.set(fieldControl);
  }
  registerLabelable(labelable) {
    if (this._labelable()) return;
    this._labelable.set(labelable);
  }
  unregisterFieldControl(fieldControl) {
    if (this._brnFieldControl() !== fieldControl) return;
    this._brnFieldControl.set(null);
  }
  unregisterLabelable(labelable) {
    if (this._labelable() !== labelable) return;
    this._labelable.set(null);
  }
  /** @nocollapse */
  static ɵfac = function BrnField_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnField)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnField,
    selectors: [["", "brnField", ""], ["brn-field"]],
    hostVars: 4,
    hostBindings: function BrnField_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("data-invalid", ctx._invalid() ? "true" : null)("data-matches-spartan-invalid", ctx._spartanInvalid() ? "true" : null)("data-touched", ctx._touched() ? "true" : null)("data-dirty", ctx._dirty() ? "true" : null);
      }
    },
    inputs: {
      dataInvalid: [1, "data-invalid", "dataInvalid"],
      forceInvalid: [1, "forceInvalid"]
    },
    features: [ɵɵProvidersFeature([BrnFieldA11yService])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnField, [{
    type: Directive,
    args: [{
      selector: "[brnField],brn-field",
      providers: [BrnFieldA11yService],
      host: {
        "[attr.data-invalid]": '_invalid() ? "true" : null',
        "[attr.data-matches-spartan-invalid]": '_spartanInvalid() ? "true" : null',
        "[attr.data-touched]": '_touched() ? "true" : null',
        "[attr.data-dirty]": '_dirty() ? "true" : null'
      }
    }]
  }], null, {
    dataInvalid: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "data-invalid",
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
var BrnLabelable = new InjectionToken("BrnLabelable");
function provideBrnLabelable(labelable) {
  return {
    provide: BrnLabelable,
    useExisting: labelable
  };
}
function injectBrnLabelable() {
  return inject(BrnLabelable, {
    optional: true
  });
}
var BrnFieldControl = class _BrnFieldControl {
  _injector = inject(Injector);
  _errorStateMatcher = inject(ErrorStateMatcher);
  _parentForm = inject(NgForm, {
    optional: true
  });
  _parentFormGroup = inject(FormGroupDirective, {
    optional: true
  });
  _field = inject(BrnField, {
    optional: true
  });
  _destroyRef = inject(DestroyRef);
  _labelable = null;
  _parentFieldControl = null;
  _stateTracker = signal(null, ...ngDevMode ? [{
    debugName: "_stateTracker"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** Sentinel value to differentiate "never checked" from "control is null". */
  _lastControl = null;
  /** Gets the AbstractControlDirective for this control. */
  ngControl = null;
  controlState = computed(() => this._stateTracker()?.controlState() ?? null, ...ngDevMode ? [{
    debugName: "controlState"
  }] : (
    /* istanbul ignore next */
    []
  ));
  errors = computed(() => this._stateTracker()?.errors() ?? null, ...ngDevMode ? [{
    debugName: "errors"
  }] : (
    /* istanbul ignore next */
    []
  ));
  dirty = computed(() => this._stateTracker()?.dirty() ?? null, ...ngDevMode ? [{
    debugName: "dirty"
  }] : (
    /* istanbul ignore next */
    []
  ));
  invalid = computed(() => this._stateTracker()?.invalid() ?? null, ...ngDevMode ? [{
    debugName: "invalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  spartanInvalid = computed(() => this._stateTracker()?.spartanInvalid() ?? null, ...ngDevMode ? [{
    debugName: "spartanInvalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  touched = computed(() => this._stateTracker()?.touched() ?? null, ...ngDevMode ? [{
    debugName: "touched"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    this._destroyRef.onDestroy(() => {
      this._field?.unregisterFieldControl(this);
      if (this._labelable) {
        this._field?.unregisterLabelable(this._labelable);
      }
      this._stateTracker()?.destroy();
    });
  }
  ngOnInit() {
    this.ngControl = this._injector.get(NgControl, null);
    this._parentFieldControl = this._injector.get(_BrnFieldControl, null, {
      skipSelf: true
    });
    if (this.ngControl) {
      this._field?.registerFieldControl(this);
    }
    this._syncTracker();
    if (this.ngControl) {
      Promise.resolve().then(() => {
        this._syncTracker();
      });
    }
    this._labelable = this._injector.get(BrnLabelable, null);
    if (this._labelable) {
      this._field?.registerLabelable(this._labelable);
    }
  }
  // Re-evaluate the control reference on every change detection cycle because
  // the underlying AbstractControl may change when [formControl] rebinds to a new instance.
  // When the instance changes we tear down the old tracker and create a fresh one.
  ngDoCheck() {
    this._syncTracker();
  }
  /** @returns true if the control reference changed */
  _syncTracker() {
    if (!this.ngControl || this._hasFieldControlParent()) return;
    const currentControl = this.ngControl.control ?? null;
    if (currentControl === this._lastControl) return;
    this._lastControl = currentControl;
    this._stateTracker()?.destroy();
    this._stateTracker.set(currentControl ? createStateTracker(this.ngControl, this._errorStateMatcher, this._parentFormGroup, this._parentForm) : null);
  }
  _hasFieldControlParent() {
    if (this._field) {
      return this._field.brnFieldControl() !== this;
    }
    return !!this._parentFieldControl?.ngControl && this._parentFieldControl.ngControl === this.ngControl;
  }
  /** @nocollapse */
  static ɵfac = function BrnFieldControl_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnFieldControl)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnFieldControl
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnFieldControl, [{
    type: Directive
  }], () => [], null);
})();
var BrnFieldControlDescribedBy = class _BrnFieldControlDescribedBy {
  describedBy = input(null, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "describedBy"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "aria-describedby"
  }));
  _a11y = inject(BrnFieldA11yService, {
    optional: true
  });
  _computedDescribedBy = computed(() => {
    const manual = this.describedBy();
    const manualList = manual ? manual.split(/\s+/).filter(Boolean) : [];
    const fieldIds = this._a11y?.describedBy() ?? null;
    const fieldList = fieldIds ? fieldIds.split(/\s+/).filter(Boolean) : [];
    const combined = [.../* @__PURE__ */ new Set([...manualList, ...fieldList])];
    return combined.length ? combined.join(" ") : null;
  }, ...ngDevMode ? [{
    debugName: "_computedDescribedBy"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @nocollapse */
  static ɵfac = function BrnFieldControlDescribedBy_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnFieldControlDescribedBy)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnFieldControlDescribedBy,
    selectors: [["", "brnFieldControlDescribedBy", ""]],
    hostVars: 1,
    hostBindings: function BrnFieldControlDescribedBy_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("aria-describedby", ctx._computedDescribedBy());
      }
    },
    inputs: {
      describedBy: [1, "aria-describedby", "describedBy"]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnFieldControlDescribedBy, [{
    type: Directive,
    args: [{
      selector: "[brnFieldControlDescribedBy]",
      host: {
        "[attr.aria-describedby]": "_computedDescribedBy()"
      }
    }]
  }], null, {
    describedBy: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "aria-describedby",
        required: false
      }]
    }]
  });
})();
var BrnFieldImports = [BrnField, BrnFieldControl, BrnFieldControlDescribedBy];

export {
  BrnFieldA11yService,
  BrnField,
  BrnLabelable,
  provideBrnLabelable,
  injectBrnLabelable,
  BrnFieldControl,
  BrnFieldControlDescribedBy,
  BrnFieldImports
};
//# sourceMappingURL=chunk-TPUZIPLV.js.map
