import {
  BrnFieldControl,
  provideBrnLabelable
} from "./chunk-CORRGEFH.js";
import "./chunk-MQAMSBSO.js";
import "./chunk-LAHHEQBJ.js";
import "./chunk-JK5PHBUV.js";
import {
  Directive,
  Input,
  booleanAttribute,
  computed,
  inject,
  input,
  setClassMetadata,
  ɵɵHostDirectivesFeature,
  ɵɵProvidersFeature,
  ɵɵattribute,
  ɵɵdefineDirective,
  ɵɵdomProperty
} from "./chunk-BFMHQS5Q.js";
import "./chunk-RSS3ODKE.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-input.mjs
var BrnInput = class _BrnInput {
  static _id = 0;
  _fieldControl = inject(BrnFieldControl, {
    optional: true
  });
  /** The id of the input. */
  id = input(`brn-input-${++_BrnInput._id}`, ...ngDevMode ? [{
    debugName: "id"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** Whether to force the input into an invalid state. */
  forceInvalid = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "forceInvalid"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  labelableId = this.id;
  _ariaInvalid = this._fieldControl?.invalid;
  _touched = this._fieldControl?.touched;
  _dirty = this._fieldControl?.dirty;
  _spartanInvalid = computed(() => this.forceInvalid() || this._fieldControl?.spartanInvalid(), ...ngDevMode ? [{
    debugName: "_spartanInvalid"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @nocollapse */
  static ɵfac = function BrnInput_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnInput)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnInput,
    selectors: [["", "brnInput", ""]],
    hostVars: 6,
    hostBindings: function BrnInput_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵdomProperty("id", ctx.id());
        ɵɵattribute("aria-invalid", (ctx._ariaInvalid == null ? null : ctx._ariaInvalid()) ? "true" : null)("data-invalid", (ctx._ariaInvalid == null ? null : ctx._ariaInvalid()) ? "true" : null)("data-touched", (ctx._touched == null ? null : ctx._touched()) ? "true" : null)("data-dirty", (ctx._dirty == null ? null : ctx._dirty()) ? "true" : null)("data-matches-spartan-invalid", ctx._spartanInvalid() ? "true" : null);
      }
    },
    inputs: {
      id: [1, "id"],
      forceInvalid: [1, "forceInvalid"]
    },
    features: [ɵɵProvidersFeature([provideBrnLabelable(_BrnInput)]), ɵɵHostDirectivesFeature([BrnFieldControl])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnInput, [{
    type: Directive,
    args: [{
      selector: "[brnInput]",
      providers: [provideBrnLabelable(BrnInput)],
      hostDirectives: [BrnFieldControl],
      host: {
        "[id]": "id()",
        "[attr.aria-invalid]": '_ariaInvalid?.() ? "true" : null',
        "[attr.data-invalid]": '_ariaInvalid?.() ? "true" : null',
        "[attr.data-touched]": '_touched?.() ? "true" : null',
        "[attr.data-dirty]": '_dirty?.() ? "true" : null',
        "[attr.data-matches-spartan-invalid]": '_spartanInvalid() ? "true" : null'
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
var BrnInputImports = [BrnInput];
export {
  BrnInput,
  BrnInputImports
};
//# sourceMappingURL=@spartan-ng_brain_input.js.map
