import {
  MatRipple
} from "./chunk-FWJGNHLF.js";
import {
  BidiModule
} from "./chunk-ZF46EDWW.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineNgModule
} from "./chunk-HEHWMLPN.js";
import {
  ɵɵdefineInjector
} from "./chunk-6GK5EAZB.js";

// node_modules/@angular/material/fesm2022/_ripple-module-chunk.mjs
var MatRippleModule = class _MatRippleModule {
  static ɵfac = function MatRippleModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatRippleModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatRippleModule,
    imports: [MatRipple],
    exports: [MatRipple, BidiModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [BidiModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatRippleModule, [{
    type: NgModule,
    args: [{
      imports: [MatRipple],
      exports: [MatRipple, BidiModule]
    }]
  }], null, null);
})();

export {
  MatRippleModule
};
//# sourceMappingURL=chunk-5IYW2IVW.js.map
