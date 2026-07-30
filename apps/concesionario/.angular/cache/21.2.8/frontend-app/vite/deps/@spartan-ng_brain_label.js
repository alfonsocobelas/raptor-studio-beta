import {
  BrnField
} from "./chunk-TPUZIPLV.js";
import "./chunk-IG4VRLI4.js";
import "./chunk-CKLPHC2O.js";
import "./chunk-X7QW64JD.js";
import {
  Directive,
  Input,
  input,
  setClassMetadata,
  ɵɵattribute,
  ɵɵdefineDirective,
  ɵɵdomProperty
} from "./chunk-TXPGLIRP.js";
import {
  computed,
  inject
} from "./chunk-RQHHER3I.js";
import "./chunk-RSS3ODKE.js";
import "./chunk-GOMI4DH3.js";

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-label.mjs
var BrnLabel = class _BrnLabel {
  static _id = 0;
  _brnField = inject(BrnField, {
    optional: true
  });
  /** The id of the label. */
  id = input(`brn-label-${++_BrnLabel._id}`, ...ngDevMode ? [{
    debugName: "id"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** The id of the form control this label is associated with. */
  for = input(...ngDevMode ? [void 0, {
    debugName: "for"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _for = computed(() => {
    const forValue = this.for();
    if (forValue) return forValue;
    return this._brnField?.labelableId();
  }, ...ngDevMode ? [{
    debugName: "_for"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @nocollapse */
  static ɵfac = function BrnLabel_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnLabel)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnLabel,
    selectors: [["", "brnLabel", ""]],
    hostVars: 2,
    hostBindings: function BrnLabel_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵdomProperty("id", ctx.id());
        ɵɵattribute("for", ctx._for());
      }
    },
    inputs: {
      id: [1, "id"],
      for: [1, "for"]
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnLabel, [{
    type: Directive,
    args: [{
      selector: "[brnLabel]",
      host: {
        "[id]": "id()",
        "[attr.for]": "_for()"
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
    for: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "for",
        required: false
      }]
    }]
  });
})();
var BrnLabelImports = [BrnLabel];
export {
  BrnLabel,
  BrnLabelImports
};
//# sourceMappingURL=@spartan-ng_brain_label.js.map
