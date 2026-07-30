import {
  Directive,
  Input,
  booleanAttribute,
  input,
  setClassMetadata,
  ɵɵattribute,
  ɵɵdefineDirective
} from "./chunk-TXPGLIRP.js";
import {
  InjectionToken,
  computed,
  inject
} from "./chunk-RQHHER3I.js";
import "./chunk-RSS3ODKE.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-separator.mjs
var defaultConfig = {
  orientation: "horizontal"
};
var BrnSeparatorConfigToken = new InjectionToken("BrnSeparatorConfig");
function provideBrnSeparatorConfig(config) {
  return {
    provide: BrnSeparatorConfigToken,
    useValue: __spreadValues(__spreadValues({}, defaultConfig), config)
  };
}
function injectBrnSeparatorConfig() {
  return inject(BrnSeparatorConfigToken, {
    optional: true
  }) ?? defaultConfig;
}
var BrnSeparator = class _BrnSeparator {
  _config = injectBrnSeparatorConfig();
  /** Orientation of the separator. */
  orientation = input(this._config.orientation, ...ngDevMode ? [{
    debugName: "orientation"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** Whether the separator is decorative. */
  decorative = input(true, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "decorative"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  _role = computed(() => this.decorative() ? "none" : "separator", ...ngDevMode ? [{
    debugName: "_role"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _ariaOrientation = computed(() => this.decorative() ? void 0 : this.orientation() === "vertical" ? "vertical" : void 0, ...ngDevMode ? [{
    debugName: "_ariaOrientation"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @nocollapse */
  static ɵfac = function BrnSeparator_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSeparator)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnSeparator,
    selectors: [["", "brnSeparator", ""], ["brn-separator"]],
    hostVars: 3,
    hostBindings: function BrnSeparator_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("role", ctx._role())("aria-orientation", ctx._ariaOrientation())("data-orientation", ctx.orientation());
      }
    },
    inputs: {
      orientation: [1, "orientation"],
      decorative: [1, "decorative"]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSeparator, [{
    type: Directive,
    args: [{
      selector: "[brnSeparator],brn-separator",
      host: {
        "[attr.role]": "_role()",
        "[attr.aria-orientation]": "_ariaOrientation()",
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
    }],
    decorative: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "decorative",
        required: false
      }]
    }]
  });
})();
var BrnSeparatorImports = [BrnSeparator];
export {
  BrnSeparator,
  BrnSeparatorImports,
  injectBrnSeparatorConfig,
  provideBrnSeparatorConfig
};
//# sourceMappingURL=@spartan-ng_brain_separator.js.map
