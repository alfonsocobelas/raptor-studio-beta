import {
  clsx_default
} from "./chunk-QE4NYG33.js";
import {
  Directionality
} from "./chunk-RU4RFFMX.js";
import {
  NgComponentOutlet,
  NgTemplateOutlet,
  isPlatformBrowser
} from "./chunk-ASBVJPSV.js";
import "./chunk-XA2CA324.js";
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  DOCUMENT,
  DestroyRef,
  InjectionToken,
  Input,
  PLATFORM_ID,
  Pipe,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  setClassMetadata,
  signal,
  viewChild,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵconditionalBranchCreate,
  ɵɵconditionalCreate,
  ɵɵcontentQuerySignal,
  ɵɵdefineComponent,
  ɵɵdefinePipe,
  ɵɵdomElement,
  ɵɵdomElementEnd,
  ɵɵdomElementStart,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵpipeBind3,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction0,
  ɵɵqueryAdvance,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵrepeaterTrackByIndex,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleMap,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate1,
  ɵɵviewQuerySignal
} from "./chunk-BFMHQS5Q.js";
import "./chunk-RSS3ODKE.js";
import {
  __objRest,
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-sonner.mjs
function BrnSonnerIcon_Case_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵnamespaceSVG();
    ɵɵdomElementStart(0, "svg", 0);
    ɵɵdomElement(1, "path", 2);
    ɵɵdomElementEnd();
  }
}
function BrnSonnerIcon_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵnamespaceSVG();
    ɵɵdomElementStart(0, "svg", 0);
    ɵɵdomElement(1, "path", 3);
    ɵɵdomElementEnd();
  }
}
function BrnSonnerIcon_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵnamespaceSVG();
    ɵɵdomElementStart(0, "svg", 0);
    ɵɵdomElement(1, "path", 4);
    ɵɵdomElementEnd();
  }
}
function BrnSonnerIcon_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵnamespaceSVG();
    ɵɵdomElementStart(0, "svg", 1);
    ɵɵdomElement(1, "path", 5)(2, "path", 6);
    ɵɵdomElementEnd();
  }
}
function BrnSonnerLoader_For_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵdomElement(0, "div", 2);
  }
}
var _c0 = ["toastRef"];
var _c1 = [[["", "loading-icon", ""]], [["", "success-icon", ""]], [["", "error-icon", ""]], [["", "warning-icon", ""]], [["", "info-icon", ""]]];
var _c2 = ["[loading-icon]", "[success-icon]", "[error-icon]", "[warning-icon]", "[info-icon]"];
function BrnSonnerToast_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 3);
    ɵɵlistener("click", function BrnSonnerToast_Conditional_2_Template_button_click_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onCloseButtonClick());
    });
    ɵɵnamespaceSVG();
    ɵɵelementStart(1, "svg", 4);
    ɵɵelement(2, "line", 5)(3, "line", 6);
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵclassMap(ctx_r1._closeButtonClasses());
    ɵɵattribute("data-disabled", ctx_r1._disabled());
  }
}
function BrnSonnerToast_Conditional_3_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function BrnSonnerToast_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, BrnSonnerToast_Conditional_3_ng_container_0_Template, 1, 0, "ng-container", 7);
    ɵɵpipe(1, "asComponent");
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("ngComponentOutlet", ɵɵpipeBind1(1, 2, ctx_r1.toast().component))("ngComponentOutletInputs", ctx_r1.toast().componentProps);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_0_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_0_Conditional_2_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_0_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, BrnSonnerToast_Conditional_4_Conditional_0_Conditional_2_ng_container_0_Template, 1, 0, "ng-container", 7);
    ɵɵpipe(1, "asComponent");
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵproperty("ngComponentOutlet", ɵɵpipeBind1(1, 2, ctx_r1.toast().icon))("ngComponentOutletInputs", ctx_r1.toast().componentProps);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Case_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0, 1);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Case_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0, 2);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Case_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0, 3);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Case_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵprojection(0, 4);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵconditionalCreate(0, BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Case_0_Template, 1, 0)(1, BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Case_1_Template, 1, 0)(2, BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Case_2_Template, 1, 0)(3, BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Case_3_Template, 1, 0);
  }
  if (rf & 2) {
    let tmp_4_0;
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵconditional((tmp_4_0 = ctx_r1._toastType()) === "success" ? 0 : tmp_4_0 === "error" ? 1 : tmp_4_0 === "warning" ? 2 : tmp_4_0 === "info" ? 3 : -1);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 8);
    ɵɵconditionalCreate(1, BrnSonnerToast_Conditional_4_Conditional_0_Conditional_1_Template, 1, 0);
    ɵɵconditionalCreate(2, BrnSonnerToast_Conditional_4_Conditional_0_Conditional_2_Template, 2, 4, "ng-container")(3, BrnSonnerToast_Conditional_4_Conditional_0_Conditional_3_Template, 4, 1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵconditional(ctx_r1._toastType() === "loading" && !ctx_r1.toast().icon ? 1 : -1);
    ɵɵadvance();
    ɵɵconditional(ctx_r1.toast().icon ? 2 : 3);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_2_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtext(0);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵtextInterpolate1(" ", ctx_r1.toast().title, " ");
  }
}
function BrnSonnerToast_Conditional_4_Conditional_2_Conditional_3_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, BrnSonnerToast_Conditional_4_Conditional_2_Conditional_3_ng_container_0_Template, 1, 0, "ng-container", 7);
    ɵɵpipe(1, "asComponent");
  }
  if (rf & 2) {
    const title_r3 = ɵɵnextContext();
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("ngComponentOutlet", ɵɵpipeBind1(1, 2, title_r3))("ngComponentOutletInputs", ctx_r1.toast().componentProps);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 14);
    ɵɵconditionalCreate(1, BrnSonnerToast_Conditional_4_Conditional_2_Conditional_1_Template, 1, 1);
    ɵɵpipe(2, "isString");
    ɵɵconditionalBranchCreate(3, BrnSonnerToast_Conditional_4_Conditional_2_Conditional_3_Template, 2, 4, "ng-container");
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1._titleClasses());
    ɵɵadvance();
    ɵɵconditional(ɵɵpipeBind1(2, 3, ctx) ? 1 : 3);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtext(0);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵtextInterpolate1(" ", ctx_r1.toast().description, " ");
  }
}
function BrnSonnerToast_Conditional_4_Conditional_3_Conditional_3_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_3_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, BrnSonnerToast_Conditional_4_Conditional_3_Conditional_3_ng_container_0_Template, 1, 0, "ng-container", 7);
    ɵɵpipe(1, "asComponent");
  }
  if (rf & 2) {
    const description_r4 = ɵɵnextContext();
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("ngComponentOutlet", ɵɵpipeBind1(1, 2, description_r4))("ngComponentOutletInputs", ctx_r1.toast().componentProps);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 15);
    ɵɵconditionalCreate(1, BrnSonnerToast_Conditional_4_Conditional_3_Conditional_1_Template, 1, 1);
    ɵɵpipe(2, "isString");
    ɵɵconditionalBranchCreate(3, BrnSonnerToast_Conditional_4_Conditional_3_Conditional_3_Template, 2, 4, "ng-container");
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1._toastDescriptionClasses());
    ɵɵadvance();
    ɵɵconditional(ɵɵpipeBind1(2, 3, ctx) ? 1 : 3);
  }
}
function BrnSonnerToast_Conditional_4_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 16);
    ɵɵlistener("click", function BrnSonnerToast_Conditional_4_Conditional_4_Template_button_click_0_listener() {
      ɵɵrestoreView(_r5);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onCancelClick());
    });
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵstyleMap(ctx_r1.cancelButtonStyle() ?? ctx_r1.toast().cancelButtonStyle);
    ɵɵclassMap(ctx_r1._cancelButtonClasses());
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx.label, " ");
  }
}
function BrnSonnerToast_Conditional_4_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 17);
    ɵɵlistener("click", function BrnSonnerToast_Conditional_4_Conditional_5_Template_button_click_0_listener($event) {
      ɵɵrestoreView(_r6);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onActionClick($event));
    });
    ɵɵtext(1);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵstyleMap(ctx_r1.actionButtonStyle() ?? ctx_r1.toast().actionButtonStyle);
    ɵɵclassMap(ctx_r1._actionButtonClasses());
    ɵɵadvance();
    ɵɵtextInterpolate1(" ", ctx.label, " ");
  }
}
function BrnSonnerToast_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵconditionalCreate(0, BrnSonnerToast_Conditional_4_Conditional_0_Template, 4, 2, "div", 8);
    ɵɵelementStart(1, "div", 9);
    ɵɵconditionalCreate(2, BrnSonnerToast_Conditional_4_Conditional_2_Template, 4, 5, "div", 10);
    ɵɵconditionalCreate(3, BrnSonnerToast_Conditional_4_Conditional_3_Template, 4, 5, "div", 11);
    ɵɵelementEnd();
    ɵɵconditionalCreate(4, BrnSonnerToast_Conditional_4_Conditional_4_Template, 2, 5, "button", 12);
    ɵɵconditionalCreate(5, BrnSonnerToast_Conditional_4_Conditional_5_Template, 2, 5, "button", 13);
  }
  if (rf & 2) {
    let tmp_3_0;
    let tmp_4_0;
    let tmp_5_0;
    let tmp_6_0;
    const ctx_r1 = ɵɵnextContext();
    ɵɵconditional(ctx_r1._toastType() !== "default" || ctx_r1.toast().icon || ctx_r1.toast().promise ? 0 : -1);
    ɵɵadvance(2);
    ɵɵconditional((tmp_3_0 = ctx_r1.toast().title) ? 2 : -1, tmp_3_0);
    ɵɵadvance();
    ɵɵconditional((tmp_4_0 = ctx_r1.toast().description) ? 3 : -1, tmp_4_0);
    ɵɵadvance();
    ɵɵconditional((tmp_5_0 = ctx_r1.toast().cancel) ? 4 : -1, tmp_5_0);
    ɵɵadvance();
    ɵɵconditional((tmp_6_0 = ctx_r1.toast().action) ? 5 : -1, tmp_6_0);
  }
}
var _c3 = ["loadingIcon"];
var _c4 = ["successIcon"];
var _c5 = ["errorIcon"];
var _c6 = ["warningIcon"];
var _c7 = ["infoIcon"];
var _c8 = ["listRef"];
var _c9 = () => ({});
var _forTrack0 = ($index, $item) => $item.id;
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_1_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0, 6);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_1_ng_container_0_Template, 1, 0, "ng-container", 16);
  }
  if (rf & 2) {
    ɵɵproperty("ngTemplateOutlet", ctx);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "brn-sonner-loader", 7);
  }
  if (rf & 2) {
    const toast_r3 = ɵɵnextContext().$implicit;
    ɵɵproperty("isVisible", toast_r3.type === "loading");
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_3_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0, 8);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_3_ng_container_0_Template, 1, 0, "ng-container", 17);
  }
  if (rf & 2) {
    ɵɵproperty("ngTemplateOutlet", ctx);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "brn-sonner-icon", 9);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_5_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0, 10);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_5_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_5_ng_container_0_Template, 1, 0, "ng-container", 18);
  }
  if (rf & 2) {
    ɵɵproperty("ngTemplateOutlet", ctx);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "brn-sonner-icon", 11);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_7_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0, 12);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_7_ng_container_0_Template, 1, 0, "ng-container", 19);
  }
  if (rf & 2) {
    ɵɵproperty("ngTemplateOutlet", ctx);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "brn-sonner-icon", 13);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_9_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0, 14);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_9_ng_container_0_Template, 1, 0, "ng-container", 20);
  }
  if (rf & 2) {
    ɵɵproperty("ngTemplateOutlet", ctx);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "brn-sonner-icon", 15);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_For_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "brn-sonner-toast", 5);
    ɵɵconditionalCreate(1, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_1_Template, 1, 1, "ng-container", 6)(2, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_2_Template, 1, 1, "brn-sonner-loader", 7);
    ɵɵconditionalCreate(3, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_3_Template, 1, 1, "ng-container", 8)(4, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_4_Template, 1, 0, "brn-sonner-icon", 9);
    ɵɵconditionalCreate(5, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_5_Template, 1, 1, "ng-container", 10)(6, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_6_Template, 1, 0, "brn-sonner-icon", 11);
    ɵɵconditionalCreate(7, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_7_Template, 1, 1, "ng-container", 12)(8, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_8_Template, 1, 0, "brn-sonner-icon", 13);
    ɵɵconditionalCreate(9, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_9_Template, 1, 1, "ng-container", 14)(10, BrnSonnerToaster_Conditional_0_For_2_For_3_Conditional_10_Template, 1, 0, "brn-sonner-icon", 15);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    let tmp_38_0;
    let tmp_39_0;
    let tmp_40_0;
    let tmp_41_0;
    let tmp_42_0;
    const toast_r3 = ctx.$implicit;
    const $index_r4 = ctx.$index;
    const pos_r5 = ɵɵnextContext().$implicit;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵclassMap(ctx_r1.toastOptions().class ?? "");
    ɵɵproperty("index", $index_r4)("toast", toast_r3)("invert", ctx_r1.invert())("visibleToasts", ctx_r1.visibleToasts())("closeButton", ctx_r1.closeButton())("interacting", ctx_r1._interacting())("position", pos_r5)("expandByDefault", ctx_r1.expand())("expanded", ctx_r1._expanded())("actionButtonStyle", ctx_r1.toastOptions().actionButtonStyle)("cancelButtonStyle", ctx_r1.toastOptions().cancelButtonStyle)("descriptionClass", ctx_r1.toastOptions().descriptionClass ?? "")("classes", ctx_r1.toastOptions().classes ?? ɵɵpureFunction0(22, _c9))("duration", ctx_r1.toastOptions().duration ?? ctx_r1.duration())("unstyled", ctx_r1.toastOptions().unstyled ?? false);
    ɵɵadvance();
    ɵɵconditional((tmp_38_0 = ctx_r1._loadingIcon()) ? 1 : 2, tmp_38_0);
    ɵɵadvance(2);
    ɵɵconditional((tmp_39_0 = ctx_r1._successIcon()) ? 3 : 4, tmp_39_0);
    ɵɵadvance(2);
    ɵɵconditional((tmp_40_0 = ctx_r1._errorIcon()) ? 5 : 6, tmp_40_0);
    ɵɵadvance(2);
    ɵɵconditional((tmp_41_0 = ctx_r1._warningIcon()) ? 7 : 8, tmp_41_0);
    ɵɵadvance(2);
    ɵɵconditional((tmp_42_0 = ctx_r1._infoIcon()) ? 9 : 10, tmp_42_0);
  }
}
function BrnSonnerToaster_Conditional_0_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "ol", 3, 0);
    ɵɵlistener("blur", function BrnSonnerToaster_Conditional_0_For_2_Template_ol_blur_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.handleBlur($event));
    })("focus", function BrnSonnerToaster_Conditional_0_For_2_Template_ol_focus_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.handleFocus($event));
    })("mouseenter", function BrnSonnerToaster_Conditional_0_For_2_Template_ol_mouseenter_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1._expanded.set(true));
    })("mousemove", function BrnSonnerToaster_Conditional_0_For_2_Template_ol_mousemove_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1._expanded.set(true));
    })("mouseleave", function BrnSonnerToaster_Conditional_0_For_2_Template_ol_mouseleave_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.handleMouseLeave());
    })("pointerdown", function BrnSonnerToaster_Conditional_0_For_2_Template_ol_pointerdown_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.handlePointerDown($event));
    })("pointerup", function BrnSonnerToaster_Conditional_0_For_2_Template_ol_pointerup_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1._interacting.set(false));
    });
    ɵɵrepeaterCreate(2, BrnSonnerToaster_Conditional_0_For_2_For_3_Template, 11, 23, "brn-sonner-toast", 4, _forTrack0);
    ɵɵpipe(4, "toastFilter");
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const pos_r5 = ctx.$implicit;
    const $index_r6 = ctx.$index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵstyleMap(ctx_r1._toasterStyles());
    ɵɵclassMap(ctx_r1.userClass());
    ɵɵproperty("tabIndex", -1);
    ɵɵattribute("data-theme", ctx_r1._actualTheme())("data-rich-colors", ctx_r1.richColors())("dir", ctx_r1.direction())("data-y-position", pos_r5.split("-")[0])("data-x-position", pos_r5.split("-")[1]);
    ɵɵadvance(2);
    ɵɵrepeater(ɵɵpipeBind3(4, 10, ctx_r1._toasts(), $index_r6, pos_r5));
  }
}
function BrnSonnerToaster_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "section", 1);
    ɵɵrepeaterCreate(1, BrnSonnerToaster_Conditional_0_For_2_Template, 5, 14, "ol", 2, ɵɵrepeaterTrackByIdentity);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("tabIndex", -1);
    ɵɵattribute("aria-label", "Notifications " + ctx_r1._hotKeyLabel());
    ɵɵadvance();
    ɵɵrepeater(ctx_r1._possiblePositions());
  }
}
var BrnSonnerIcon = class _BrnSonnerIcon {
  type = input("default", ...ngDevMode ? [{
    debugName: "type"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** @nocollapse */
  static ɵfac = function BrnSonnerIcon_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSonnerIcon)();
  };
  /** @nocollapse */
  static ɵcmp = ɵɵdefineComponent({
    type: _BrnSonnerIcon,
    selectors: [["brn-sonner-icon"]],
    inputs: {
      type: [1, "type"]
    },
    decls: 4,
    vars: 1,
    consts: [["xmlns", "http://www.w3.org/2000/svg", "viewBox", "0 0 20 20", "fill", "currentColor", "height", "20", "width", "20"], ["viewBox", "0 0 64 64", "fill", "currentColor", "height", "20", "width", "20", "xmlns", "http://www.w3.org/2000/svg"], ["fill-rule", "evenodd", "d", "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z", "clip-rule", "evenodd"], ["fill-rule", "evenodd", "d", "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z", "clip-rule", "evenodd"], ["fill-rule", "evenodd", "d", "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z", "clip-rule", "evenodd"], ["d", "M32.427,7.987c2.183,0.124 4,1.165 5.096,3.281l17.936,36.208c1.739,3.66 -0.954,8.585 -5.373,8.656l-36.119,0c-4.022,-0.064 -7.322,-4.631 -5.352,-8.696l18.271,-36.207c0.342,-0.65 0.498,-0.838 0.793,-1.179c1.186,-1.375 2.483,-2.111 4.748,-2.063Zm-0.295,3.997c-0.687,0.034 -1.316,0.419 -1.659,1.017c-6.312,11.979 -12.397,24.081 -18.301,36.267c-0.546,1.225 0.391,2.797 1.762,2.863c12.06,0.195 24.125,0.195 36.185,0c1.325,-0.064 2.321,-1.584 1.769,-2.85c-5.793,-12.184 -11.765,-24.286 -17.966,-36.267c-0.366,-0.651 -0.903,-1.042 -1.79,-1.03Z"], ["d", "M33.631,40.581l-3.348,0l-0.368,-16.449l4.1,0l-0.384,16.449Zm-3.828,5.03c0,-0.609 0.197,-1.113 0.592,-1.514c0.396,-0.4 0.935,-0.601 1.618,-0.601c0.684,0 1.223,0.201 1.618,0.601c0.395,0.401 0.593,0.905 0.593,1.514c0,0.587 -0.193,1.078 -0.577,1.473c-0.385,0.395 -0.929,0.593 -1.634,0.593c-0.705,0 -1.249,-0.198 -1.634,-0.593c-0.384,-0.395 -0.576,-0.886 -0.576,-1.473Z"]],
    template: function BrnSonnerIcon_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵconditionalCreate(0, BrnSonnerIcon_Case_0_Template, 2, 0, ":svg:svg", 0)(1, BrnSonnerIcon_Case_1_Template, 2, 0, ":svg:svg", 0)(2, BrnSonnerIcon_Case_2_Template, 2, 0, ":svg:svg", 0)(3, BrnSonnerIcon_Case_3_Template, 3, 0, ":svg:svg", 1);
      }
      if (rf & 2) {
        let tmp_0_0;
        ɵɵconditional((tmp_0_0 = ctx.type()) === "success" ? 0 : tmp_0_0 === "error" ? 1 : tmp_0_0 === "info" ? 2 : tmp_0_0 === "warning" ? 3 : -1);
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSonnerIcon, [{
    type: Component,
    args: [{
      selector: "brn-sonner-icon",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
		@switch (type()) {
			@case ('success') {
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
						clip-rule="evenodd"
					/>
				</svg>
			}
			@case ('error') {
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
						clip-rule="evenodd"
					/>
				</svg>
			}
			@case ('info') {
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" height="20" width="20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
						clip-rule="evenodd"
					/>
				</svg>
			}
			@case ('warning') {
				<svg viewBox="0 0 64 64" fill="currentColor" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M32.427,7.987c2.183,0.124 4,1.165 5.096,3.281l17.936,36.208c1.739,3.66 -0.954,8.585 -5.373,8.656l-36.119,0c-4.022,-0.064 -7.322,-4.631 -5.352,-8.696l18.271,-36.207c0.342,-0.65 0.498,-0.838 0.793,-1.179c1.186,-1.375 2.483,-2.111 4.748,-2.063Zm-0.295,3.997c-0.687,0.034 -1.316,0.419 -1.659,1.017c-6.312,11.979 -12.397,24.081 -18.301,36.267c-0.546,1.225 0.391,2.797 1.762,2.863c12.06,0.195 24.125,0.195 36.185,0c1.325,-0.064 2.321,-1.584 1.769,-2.85c-5.793,-12.184 -11.765,-24.286 -17.966,-36.267c-0.366,-0.651 -0.903,-1.042 -1.79,-1.03Z"
					/>
					<path
						d="M33.631,40.581l-3.348,0l-0.368,-16.449l4.1,0l-0.384,16.449Zm-3.828,5.03c0,-0.609 0.197,-1.113 0.592,-1.514c0.396,-0.4 0.935,-0.601 1.618,-0.601c0.684,0 1.223,0.201 1.618,0.601c0.395,0.401 0.593,0.905 0.593,1.514c0,0.587 -0.193,1.078 -0.577,1.473c-0.385,0.395 -0.929,0.593 -1.634,0.593c-0.705,0 -1.249,-0.198 -1.634,-0.593c-0.384,-0.395 -0.576,-0.886 -0.576,-1.473Z"
					/>
				</svg>
			}
		}
	`
    }]
  }], null, {
    type: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "type",
        required: false
      }]
    }]
  });
})();
var BrnSonnerLoader = class _BrnSonnerLoader {
  isVisible = input.required(__spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "isVisible"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  _bars = Array(12).fill(0);
  /** @nocollapse */
  static ɵfac = function BrnSonnerLoader_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSonnerLoader)();
  };
  /** @nocollapse */
  static ɵcmp = ɵɵdefineComponent({
    type: _BrnSonnerLoader,
    selectors: [["brn-sonner-loader"]],
    inputs: {
      isVisible: [1, "isVisible"]
    },
    decls: 4,
    vars: 1,
    consts: [[1, "sonner-loading-wrapper"], [1, "sonner-spinner"], [1, "sonner-loading-bar"]],
    template: function BrnSonnerLoader_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵdomElementStart(0, "div", 0)(1, "div", 1);
        ɵɵrepeaterCreate(2, BrnSonnerLoader_For_3_Template, 1, 0, "div", 2, ɵɵrepeaterTrackByIndex);
        ɵɵdomElementEnd()();
      }
      if (rf & 2) {
        ɵɵattribute("data-visible", ctx.isVisible());
        ɵɵadvance(2);
        ɵɵrepeater(ctx._bars);
      }
    },
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSonnerLoader, [{
    type: Component,
    args: [{
      selector: "brn-sonner-loader",
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
		<div class="sonner-loading-wrapper" [attr.data-visible]="isVisible()">
			<div class="sonner-spinner">
				@for (_ of _bars; track $index) {
					<div class="sonner-loading-bar"></div>
				}
			</div>
		</div>
	`
    }]
  }], null, {
    isVisible: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "isVisible",
        required: true
      }]
    }]
  });
})();
var defaultConfig = {
  visibleToastsAmount: 3,
  viewPortOffset: "32px",
  toastLifetime: 4e3,
  toastWidth: 356,
  gap: 14,
  swipeThreshold: 20,
  timeBeforeUnmount: 200
};
var BrnSonnerToasterConfigToken = new InjectionToken("BrnSonnerToasterConfig");
function provideBrnSonnerToasterConfig(config) {
  return {
    provide: BrnSonnerToasterConfigToken,
    useValue: __spreadValues(__spreadValues({}, defaultConfig), config)
  };
}
function injectBrnSonnerToasterConfig() {
  return inject(BrnSonnerToasterConfigToken, {
    optional: true
  }) ?? defaultConfig;
}
var defaultClasses = {
  toast: "",
  title: "",
  description: "",
  loader: "",
  closeButton: "",
  cancelButton: "",
  actionButton: "",
  action: "",
  warning: "",
  error: "",
  success: "",
  default: "",
  info: "",
  loading: ""
};
var AsComponentPipe = class _AsComponentPipe {
  transform(value) {
    return value;
  }
  /** @nocollapse */
  static ɵfac = function AsComponentPipe_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _AsComponentPipe)();
  };
  /** @nocollapse */
  static ɵpipe = ɵɵdefinePipe({
    name: "asComponent",
    type: _AsComponentPipe,
    pure: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(AsComponentPipe, [{
    type: Pipe,
    args: [{
      name: "asComponent"
    }]
  }], null, null);
})();
var IsStringPipe = class _IsStringPipe {
  transform(value) {
    return typeof value === "string";
  }
  /** @nocollapse */
  static ɵfac = function IsStringPipe_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _IsStringPipe)();
  };
  /** @nocollapse */
  static ɵpipe = ɵɵdefinePipe({
    name: "isString",
    type: _IsStringPipe,
    pure: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(IsStringPipe, [{
    type: Pipe,
    args: [{
      name: "isString"
    }]
  }], null, null);
})();
var toastsCounter = 0;
function createToastState() {
  const toasts = signal([], ...ngDevMode ? [{
    debugName: "toasts"
  }] : (
    /* istanbul ignore next */
    []
  ));
  const heights = signal([], ...ngDevMode ? [{
    debugName: "heights"
  }] : (
    /* istanbul ignore next */
    []
  ));
  function addToast(data) {
    toasts.update((prev) => [data, ...prev]);
  }
  function create(data) {
    const _a = data, {
      message: message2
    } = _a, rest = __objRest(_a, [
      "message"
    ]);
    const id = typeof data?.id === "number" || data.id && data.id?.length > 0 ? data.id : toastsCounter++;
    const dismissible = data.dismissible ?? true;
    const type = data.type ?? "default";
    const alreadyExists = toasts().find((toast2) => toast2.id === id);
    if (alreadyExists) {
      toasts.update((prev) => prev.map((toast2) => {
        if (toast2.id === id) {
          return __spreadProps(__spreadValues(__spreadValues({}, toast2), data), {
            id,
            title: message2,
            dismissible,
            type,
            updated: true
          });
        } else return __spreadProps(__spreadValues({}, toast2), {
          updated: false
        });
      }));
    } else {
      addToast(__spreadProps(__spreadValues({}, rest), {
        id,
        title: message2,
        dismissible,
        type
      }));
    }
    return id;
  }
  function dismiss(id) {
    if (id === void 0) {
      toasts.set([]);
      return;
    }
    toasts.update((prev) => prev.filter((toast2) => toast2.id !== id));
    return id;
  }
  function message(message2, data) {
    return create(__spreadProps(__spreadValues({}, data), {
      type: "default",
      message: message2
    }));
  }
  function error(message2, data) {
    return create(__spreadProps(__spreadValues({}, data), {
      type: "error",
      message: message2
    }));
  }
  function success(message2, data) {
    return create(__spreadProps(__spreadValues({}, data), {
      type: "success",
      message: message2
    }));
  }
  function info(message2, data) {
    return create(__spreadProps(__spreadValues({}, data), {
      type: "info",
      message: message2
    }));
  }
  function warning(message2, data) {
    return create(__spreadProps(__spreadValues({}, data), {
      type: "warning",
      message: message2
    }));
  }
  function loading(message2, data) {
    return create(__spreadProps(__spreadValues({}, data), {
      type: "loading",
      message: message2
    }));
  }
  function promise(promise2, data) {
    if (!data) return;
    let id = void 0;
    if (data.loading !== void 0) {
      id = create(__spreadProps(__spreadValues({}, data), {
        promise: promise2,
        type: "loading",
        message: data.loading
      }));
    }
    const p = promise2 instanceof Promise ? promise2 : promise2();
    let shouldDismiss = id !== void 0;
    p.then((response) => {
      if (response && typeof response.ok === "boolean" && !response.ok) {
        shouldDismiss = false;
        const message2 = typeof data.error === "function" ? (
          // @ts-expect-error: TODO: Better function checking
          data.error(`HTTP error! status: ${response.status}`)
        ) : data.error;
        create({
          id,
          type: "error",
          message: message2
        });
      } else if (data.success !== void 0) {
        shouldDismiss = false;
        const message2 = typeof data.success === "function" ? (
          // @ts-expect-error: TODO: Better function checking
          data.success(response)
        ) : data.success;
        create({
          id,
          type: "success",
          message: message2
        });
      }
    }).catch((error2) => {
      if (data.error !== void 0) {
        shouldDismiss = false;
        const message2 = (
          // @ts-expect-error: TODO: Better function checking
          typeof data.error === "function" ? data.error(error2) : data.error
        );
        create({
          id,
          type: "error",
          message: message2
        });
      }
    }).finally(() => {
      if (shouldDismiss) {
        dismiss(id);
        id = void 0;
      }
      data.finally?.();
    });
    return id;
  }
  function custom(component, data) {
    const id = data?.id ?? toastsCounter++;
    create(__spreadValues({
      component,
      id
    }, data));
    return id;
  }
  function removeHeight(id) {
    heights.update((prev) => prev.filter((height) => height.toastId !== id));
  }
  function addHeight(height) {
    heights.update((prev) => [height, ...prev].sort(sortHeights));
  }
  const sortHeights = (a, b) => toasts().findIndex((t) => t.id === a.toastId) - toasts().findIndex((t) => t.id === b.toastId);
  function reset() {
    toasts.set([]);
    heights.set([]);
  }
  return {
    //methods
    create,
    addToast,
    dismiss,
    message,
    error,
    success,
    info,
    warning,
    loading,
    promise,
    custom,
    removeHeight,
    addHeight,
    reset,
    // signals
    toasts: toasts.asReadonly(),
    heights: heights.asReadonly()
  };
}
var toastState = createToastState();
function toastFunction(message, data) {
  return toastState.create(__spreadValues({
    message
  }, data));
}
var basicToast = toastFunction;
var toast = Object.assign(basicToast, {
  success: toastState.success,
  info: toastState.info,
  warning: toastState.warning,
  error: toastState.error,
  custom: toastState.custom,
  message: toastState.message,
  promise: toastState.promise,
  dismiss: toastState.dismiss,
  loading: toastState.loading
});
var BrnSonnerToast = class _BrnSonnerToast {
  _config = injectBrnSonnerToasterConfig();
  _toasts = computed(() => toastState.toasts().filter((t) => t.position === this.position()), ...ngDevMode ? [{
    debugName: "_toasts"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _heights = computed(() => toastState.heights().filter((h) => h.position === this.position()), ...ngDevMode ? [{
    debugName: "_heights"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _removeHeight = toastState.removeHeight;
  _addHeight = toastState.addHeight;
  _dismiss = toastState.dismiss;
  toast = input.required(...ngDevMode ? [{
    debugName: "toast"
  }] : (
    /* istanbul ignore next */
    []
  ));
  index = input.required(...ngDevMode ? [{
    debugName: "index"
  }] : (
    /* istanbul ignore next */
    []
  ));
  expanded = input.required(...ngDevMode ? [{
    debugName: "expanded"
  }] : (
    /* istanbul ignore next */
    []
  ));
  invert = input.required(...ngDevMode ? [{
    debugName: "invert"
  }] : (
    /* istanbul ignore next */
    []
  ));
  position = input.required(...ngDevMode ? [{
    debugName: "position"
  }] : (
    /* istanbul ignore next */
    []
  ));
  visibleToasts = input.required(...ngDevMode ? [{
    debugName: "visibleToasts"
  }] : (
    /* istanbul ignore next */
    []
  ));
  expandByDefault = input.required(...ngDevMode ? [{
    debugName: "expandByDefault"
  }] : (
    /* istanbul ignore next */
    []
  ));
  closeButton = input.required(...ngDevMode ? [{
    debugName: "closeButton"
  }] : (
    /* istanbul ignore next */
    []
  ));
  interacting = input.required(...ngDevMode ? [{
    debugName: "interacting"
  }] : (
    /* istanbul ignore next */
    []
  ));
  cancelButtonStyle = input(...ngDevMode ? [void 0, {
    debugName: "cancelButtonStyle"
  }] : (
    /* istanbul ignore next */
    []
  ));
  actionButtonStyle = input(...ngDevMode ? [void 0, {
    debugName: "actionButtonStyle"
  }] : (
    /* istanbul ignore next */
    []
  ));
  duration = input(this._config.toastLifetime, ...ngDevMode ? [{
    debugName: "duration"
  }] : (
    /* istanbul ignore next */
    []
  ));
  descriptionClass = input("", ...ngDevMode ? [{
    debugName: "descriptionClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  classes = input({}, ...ngDevMode ? [{
    debugName: "classes"
  }] : (
    /* istanbul ignore next */
    []
  ));
  unstyled = input(false, ...ngDevMode ? [{
    debugName: "unstyled"
  }] : (
    /* istanbul ignore next */
    []
  ));
  userClass = input("", __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "userClass"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "class"
  }));
  style = input({}, ...ngDevMode ? [{
    debugName: "style"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _mounted = signal(false, ...ngDevMode ? [{
    debugName: "_mounted"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _removed = signal(false, ...ngDevMode ? [{
    debugName: "_removed"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _swiping = signal(false, ...ngDevMode ? [{
    debugName: "_swiping"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _swipeOut = signal(false, ...ngDevMode ? [{
    debugName: "_swipeOut"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _offsetBeforeRemove = signal(0, ...ngDevMode ? [{
    debugName: "_offsetBeforeRemove"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _initialHeight = signal(0, ...ngDevMode ? [{
    debugName: "_initialHeight"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toastRef = viewChild.required("toastRef");
  _classes = computed(() => __spreadValues(__spreadValues({}, defaultClasses), this.classes()), ...ngDevMode ? [{
    debugName: "_classes"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _isFront = computed(() => this.index() === 0, ...ngDevMode ? [{
    debugName: "_isFront"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _isVisible = computed(() => this.index() + 1 <= this.visibleToasts(), ...ngDevMode ? [{
    debugName: "_isVisible"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toastType = computed(() => this.toast().type ?? "default", ...ngDevMode ? [{
    debugName: "_toastType"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toastClass = computed(() => this.toast().class ?? "", ...ngDevMode ? [{
    debugName: "_toastClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toastPosition = computed(() => this.toast().position ?? this.position(), ...ngDevMode ? [{
    debugName: "_toastPosition"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toastDescriptionClass = computed(() => this.toast().descriptionClass ?? "", ...ngDevMode ? [{
    debugName: "_toastDescriptionClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _heightIndex = computed(() => this._heights().findIndex((height) => height.toastId === this.toast().id), ...ngDevMode ? [{
    debugName: "_heightIndex"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _offset = linkedSignal(__spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "_offset"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    source: () => ({
      heightIndex: this._heightIndex(),
      toastsHeightBefore: this._toastsHeightBefore()
    }),
    computation: ({
      heightIndex,
      toastsHeightBefore
    }) => Math.round(heightIndex * this._config.gap + toastsHeightBefore)
  }));
  _closeTimerStartTimeRef = 0;
  _lastCloseTimerStartTimeRef = 0;
  _pointerStartRef = null;
  _coords = computed(() => this._toastPosition().split("-"), ...ngDevMode ? [{
    debugName: "_coords"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toastsHeightBefore = computed(() => this._heights().reduce((prev, curr, reducerIndex) => {
    if (reducerIndex >= this._heightIndex()) return prev;
    return prev + curr.height;
  }, 0), ...ngDevMode ? [{
    debugName: "_toastsHeightBefore"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _invert = computed(() => this.toast().invert ?? this.invert(), ...ngDevMode ? [{
    debugName: "_invert"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _closeButton = computed(() => this.toast().closeButton ?? this.closeButton(), ...ngDevMode ? [{
    debugName: "_closeButton"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _disabled = computed(() => this._toastType() === "loading", ...ngDevMode ? [{
    debugName: "_disabled"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _timeoutId;
  _remainingTime = 0;
  _isPromiseLoadingOrInfiniteDuration = computed(() => this.toast().promise && this._toastType() === "loading" || this.toast().duration === Number.POSITIVE_INFINITY, ...ngDevMode ? [{
    debugName: "_isPromiseLoadingOrInfiniteDuration"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toastClasses = computed(() => clsx_default(this.userClass(), this._toastClass(), this._classes().toast, this.toast().classes?.toast, this._classes()[this._toastType()], this.toast().classes?.[this._toastType()]), ...ngDevMode ? [{
    debugName: "_toastClasses"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toastStyle = computed(() => __spreadValues({
    "--index": `${this.index()}`,
    "--toasts-before": `${this.index()}`,
    "--z-index": `${this._toasts().length - this.index()}`,
    "--offset": `${this._removed() ? this._offsetBeforeRemove() : this._offset()}px`,
    "--initial-height": this.expandByDefault() ? "auto" : `${this._initialHeight()}px`
  }, this.style()), ...ngDevMode ? [{
    debugName: "_toastStyle"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _actionButtonClasses = computed(() => clsx_default(this._classes().actionButton, this.toast().classes?.actionButton), ...ngDevMode ? [{
    debugName: "_actionButtonClasses"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _cancelButtonClasses = computed(() => clsx_default(this._classes().cancelButton, this.toast().classes?.cancelButton), ...ngDevMode ? [{
    debugName: "_cancelButtonClasses"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toastDescriptionClasses = computed(() => clsx_default(this.descriptionClass(), this._toastDescriptionClass(), this._classes().description, this.toast().classes?.description), ...ngDevMode ? [{
    debugName: "_toastDescriptionClasses"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _titleClasses = computed(() => clsx_default(this._classes().title, this.toast().classes?.title), ...ngDevMode ? [{
    debugName: "_titleClasses"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _closeButtonClasses = computed(() => clsx_default(this._classes().closeButton, this.toast().classes?.closeButton), ...ngDevMode ? [{
    debugName: "_closeButtonClasses"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    effect(() => {
      if (this.toast().updated) {
        clearTimeout(this._timeoutId);
        this._remainingTime = this.toast().duration ?? this.duration() ?? this._config.toastLifetime;
        this.startTimer();
      }
    });
    afterRenderEffect((onCleanup) => {
      if (!this._isPromiseLoadingOrInfiniteDuration()) {
        if (this.expanded() || this.interacting()) {
          this.pauseTimer();
        } else {
          this.startTimer();
        }
      }
      onCleanup(() => clearTimeout(this._timeoutId));
    });
    effect(() => {
      if (this.toast().delete) {
        this.deleteToast();
      }
    });
  }
  ngAfterViewInit() {
    this._remainingTime = this.toast().duration ?? this.duration() ?? this._config.toastLifetime;
    this._mounted.set(true);
    const height = this._toastRef().nativeElement.getBoundingClientRect().height;
    this._initialHeight.set(height);
    this._addHeight({
      toastId: this.toast().id,
      height,
      position: this._toastPosition()
    });
  }
  ngOnDestroy() {
    clearTimeout(this._timeoutId);
    this._removeHeight(this.toast().id);
  }
  deleteToast() {
    this._removed.set(true);
    this._offsetBeforeRemove.set(this._offset());
    this._removeHeight(this.toast().id);
    setTimeout(() => {
      this._dismiss(this.toast().id);
    }, this._config.timeBeforeUnmount);
  }
  // If toast's duration changes, it will be out of sync with the
  // remainingAtTimeout, so we know we need to restart the timer
  // with the new duration
  // Pause the timer on each hover
  pauseTimer() {
    if (this._lastCloseTimerStartTimeRef < this._closeTimerStartTimeRef) {
      const elapsedTime = (/* @__PURE__ */ new Date()).getTime() - this._closeTimerStartTimeRef;
      this._remainingTime = this._remainingTime - elapsedTime;
    }
    this._lastCloseTimerStartTimeRef = (/* @__PURE__ */ new Date()).getTime();
  }
  startTimer() {
    this._closeTimerStartTimeRef = (/* @__PURE__ */ new Date()).getTime();
    this._timeoutId = setTimeout(() => {
      this.toast().onAutoClose?.(this.toast());
      this.deleteToast();
    }, this._remainingTime);
  }
  onPointerDown(event) {
    if (this._disabled() || !this.toast().dismissible) return;
    this._offsetBeforeRemove.set(this._offset());
    const target = event.target;
    target.setPointerCapture(event.pointerId);
    if (target.tagName === "BUTTON") {
      return;
    }
    this._swiping.set(true);
    this._pointerStartRef = {
      x: event.clientX,
      y: event.clientY
    };
  }
  onPointerUp() {
    if (this._swipeOut() || !this.toast().dismissible) return;
    this._pointerStartRef = null;
    const swipeAmount = Number(this._toastRef().nativeElement.style.getPropertyValue("--swipe-amount").replace("px", "") || 0);
    if (Math.abs(swipeAmount) >= this._config.swipeThreshold) {
      this._offsetBeforeRemove.set(this._offset());
      this.toast().onDismiss?.(this.toast());
      this.deleteToast();
      this._swipeOut.set(true);
      return;
    }
    this._toastRef().nativeElement.style.setProperty("--swipe-amount", "0px");
    this._swiping.set(false);
  }
  onPointerMove(event) {
    if (!this._pointerStartRef || !this.toast().dismissible) return;
    const yPosition = event.clientY - this._pointerStartRef.y;
    const xPosition = event.clientX - this._pointerStartRef.x;
    const clamp = this._coords()[0] === "top" ? Math.min : Math.max;
    const clampedY = clamp(0, yPosition);
    const swipeStartThreshold = event.pointerType === "touch" ? 10 : 2;
    const isAllowedToSwipe = Math.abs(clampedY) > swipeStartThreshold;
    if (isAllowedToSwipe) {
      this._toastRef().nativeElement.style.setProperty("--swipe-amount", `${yPosition}px`);
    } else if (Math.abs(xPosition) > swipeStartThreshold) {
      this._pointerStartRef = null;
    }
  }
  onCloseButtonClick() {
    if (this._disabled() || !this.toast().dismissible) return;
    this.deleteToast();
    this.toast().onDismiss?.(this.toast());
  }
  onCancelClick() {
    const toast2 = this.toast();
    if (!toast2.dismissible) return;
    this.deleteToast();
    if (toast2.cancel?.onClick) {
      toast2.cancel.onClick();
    }
  }
  onActionClick(event) {
    const toast2 = this.toast();
    toast2.action?.onClick(event);
    if (event.defaultPrevented) return;
    this.deleteToast();
  }
  /** @nocollapse */
  static ɵfac = function BrnSonnerToast_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSonnerToast)();
  };
  /** @nocollapse */
  static ɵcmp = ɵɵdefineComponent({
    type: _BrnSonnerToast,
    selectors: [["brn-sonner-toast"]],
    viewQuery: function BrnSonnerToast_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuerySignal(ctx._toastRef, _c0, 5);
      }
      if (rf & 2) {
        ɵɵqueryAdvance();
      }
    },
    inputs: {
      toast: [1, "toast"],
      index: [1, "index"],
      expanded: [1, "expanded"],
      invert: [1, "invert"],
      position: [1, "position"],
      visibleToasts: [1, "visibleToasts"],
      expandByDefault: [1, "expandByDefault"],
      closeButton: [1, "closeButton"],
      interacting: [1, "interacting"],
      cancelButtonStyle: [1, "cancelButtonStyle"],
      actionButtonStyle: [1, "actionButtonStyle"],
      duration: [1, "duration"],
      descriptionClass: [1, "descriptionClass"],
      classes: [1, "classes"],
      unstyled: [1, "unstyled"],
      userClass: [1, "class", "userClass"],
      style: [1, "style"]
    },
    ngContentSelectors: _c2,
    decls: 5,
    vars: 22,
    consts: [["toastRef", ""], ["data-sonner-toast", "", "aria-atomic", "true", "role", "status", "tabindex", "0", 3, "pointerdown", "pointerup", "pointermove"], ["aria-label", "Close toast", "data-close-button", "", 3, "class"], ["aria-label", "Close toast", "data-close-button", "", 3, "click"], ["xmlns", "http://www.w3.org/2000/svg", "width", "12", "height", "12", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor", "stroke-width", "1.5", "stroke-linecap", "round", "stroke-linejoin", "round"], ["x1", "18", "y1", "6", "x2", "6", "y2", "18"], ["x1", "6", "y1", "6", "x2", "18", "y2", "18"], [4, "ngComponentOutlet", "ngComponentOutletInputs"], ["data-icon", ""], ["data-content", ""], ["data-title", "", 3, "class"], ["data-description", "", 3, "class"], ["data-button", "", "data-cancel", "", 3, "style", "class"], ["data-button", "", 3, "style", "class"], ["data-title", ""], ["data-description", ""], ["data-button", "", "data-cancel", "", 3, "click"], ["data-button", "", 3, "click"]],
    template: function BrnSonnerToast_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵprojectionDef(_c1);
        ɵɵelementStart(0, "li", 1, 0);
        ɵɵlistener("pointerdown", function BrnSonnerToast_Template_li_pointerdown_0_listener($event) {
          return ctx.onPointerDown($event);
        })("pointerup", function BrnSonnerToast_Template_li_pointerup_0_listener() {
          return ctx.onPointerUp();
        })("pointermove", function BrnSonnerToast_Template_li_pointermove_0_listener($event) {
          return ctx.onPointerMove($event);
        });
        ɵɵconditionalCreate(2, BrnSonnerToast_Conditional_2_Template, 4, 3, "button", 2);
        ɵɵconditionalCreate(3, BrnSonnerToast_Conditional_3_Template, 2, 4, "ng-container")(4, BrnSonnerToast_Conditional_4_Template, 6, 5);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        ɵɵstyleMap(ctx._toastStyle());
        ɵɵclassMap(ctx._toastClasses());
        ɵɵattribute("aria-live", ctx.toast().important ? "assertive" : "polite")("data-styled", !(ctx.toast().component || ctx.toast().unstyled || ctx.unstyled()))("data-mounted", ctx._mounted())("data-promise", !!ctx.toast().promise)("data-removed", ctx._removed())("data-visible", ctx._isVisible())("data-y-position", ctx._coords()[0])("data-x-position", ctx._coords()[1])("data-index", ctx.index())("data-front", ctx._isFront())("data-swiping", ctx._swiping())("data-dismissible", ctx.toast().dismissible)("data-type", ctx._toastType())("data-invert", ctx._invert())("data-swipe-out", ctx._swipeOut())("data-expanded", ctx.expanded() || ctx.expandByDefault() && ctx._mounted());
        ɵɵadvance(2);
        ɵɵconditional(ctx._closeButton() && !ctx.toast().component ? 2 : -1);
        ɵɵadvance();
        ɵɵconditional(ctx.toast().component ? 3 : 4);
      }
    },
    dependencies: [NgComponentOutlet, IsStringPipe, AsComponentPipe],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSonnerToast, [{
    type: Component,
    args: [{
      selector: "brn-sonner-toast",
      imports: [NgComponentOutlet, IsStringPipe, AsComponentPipe],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
		<li
			#toastRef
			data-sonner-toast
			[attr.aria-live]="toast().important ? 'assertive' : 'polite'"
			aria-atomic="true"
			role="status"
			tabindex="0"
			[class]="_toastClasses()"
			[attr.data-styled]="!(toast().component || toast().unstyled || unstyled())"
			[attr.data-mounted]="_mounted()"
			[attr.data-promise]="!!toast().promise"
			[attr.data-removed]="_removed()"
			[attr.data-visible]="_isVisible()"
			[attr.data-y-position]="_coords()[0]"
			[attr.data-x-position]="_coords()[1]"
			[attr.data-index]="index()"
			[attr.data-front]="_isFront()"
			[attr.data-swiping]="_swiping()"
			[attr.data-dismissible]="toast().dismissible"
			[attr.data-type]="_toastType()"
			[attr.data-invert]="_invert()"
			[attr.data-swipe-out]="_swipeOut()"
			[attr.data-expanded]="expanded() || (expandByDefault() && _mounted())"
			[style]="_toastStyle()"
			(pointerdown)="onPointerDown($event)"
			(pointerup)="onPointerUp()"
			(pointermove)="onPointerMove($event)"
		>
			@if (_closeButton() && !toast().component) {
				<button
					aria-label="Close toast"
					[attr.data-disabled]="_disabled()"
					data-close-button
					(click)="onCloseButtonClick()"
					[class]="_closeButtonClasses()"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			}

			@if (toast().component) {
				<ng-container *ngComponentOutlet="toast().component | asComponent; inputs: toast().componentProps" />
			} @else {
				@if (_toastType() !== 'default' || toast().icon || toast().promise) {
					<div data-icon>
						@if (_toastType() === 'loading' && !toast().icon) {
							<ng-content select="[loading-icon]" />
						}
						@if (toast().icon) {
							<ng-container *ngComponentOutlet="toast().icon | asComponent; inputs: toast().componentProps" />
						} @else {
							@switch (_toastType()) {
								@case ('success') {
									<ng-content select="[success-icon]" />
								}
								@case ('error') {
									<ng-content select="[error-icon]" />
								}
								@case ('warning') {
									<ng-content select="[warning-icon]" />
								}
								@case ('info') {
									<ng-content select="[info-icon]" />
								}
							}
						}
					</div>
				}
				<div data-content>
					@if (toast().title; as title) {
						<div data-title [class]="_titleClasses()">
							@if (title | isString) {
								{{ toast().title }}
							} @else {
								<ng-container *ngComponentOutlet="title | asComponent; inputs: toast().componentProps" />
							}
						</div>
					}
					@if (toast().description; as description) {
						<div data-description [class]="_toastDescriptionClasses()">
							@if (description | isString) {
								{{ toast().description }}
							} @else {
								<ng-container *ngComponentOutlet="description | asComponent; inputs: toast().componentProps" />
							}
						</div>
					}
				</div>
				@if (toast().cancel; as cancel) {
					<button
						data-button
						data-cancel
						[style]="cancelButtonStyle() ?? toast().cancelButtonStyle"
						[class]="_cancelButtonClasses()"
						(click)="onCancelClick()"
					>
						{{ cancel.label }}
					</button>
				}
				@if (toast().action; as action) {
					<button
						data-button
						[style]="actionButtonStyle() ?? toast().actionButtonStyle"
						[class]="_actionButtonClasses()"
						(click)="onActionClick($event)"
					>
						{{ action.label }}
					</button>
				}
			}
		</li>
	`
    }]
  }], () => [], {
    toast: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "toast",
        required: true
      }]
    }],
    index: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "index",
        required: true
      }]
    }],
    expanded: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "expanded",
        required: true
      }]
    }],
    invert: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "invert",
        required: true
      }]
    }],
    position: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "position",
        required: true
      }]
    }],
    visibleToasts: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "visibleToasts",
        required: true
      }]
    }],
    expandByDefault: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "expandByDefault",
        required: true
      }]
    }],
    closeButton: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "closeButton",
        required: true
      }]
    }],
    interacting: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "interacting",
        required: true
      }]
    }],
    cancelButtonStyle: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "cancelButtonStyle",
        required: false
      }]
    }],
    actionButtonStyle: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "actionButtonStyle",
        required: false
      }]
    }],
    duration: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "duration",
        required: false
      }]
    }],
    descriptionClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "descriptionClass",
        required: false
      }]
    }],
    classes: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "classes",
        required: false
      }]
    }],
    unstyled: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "unstyled",
        required: false
      }]
    }],
    userClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "class",
        required: false
      }]
    }],
    style: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "style",
        required: false
      }]
    }],
    _toastRef: [{
      type: ViewChild,
      args: ["toastRef", {
        isSignal: true
      }]
    }]
  });
})();
var ToastFilterPipe = class _ToastFilterPipe {
  transform(toasts, index, position) {
    return toasts.filter((toast2) => !toast2.position && index === 0 || toast2.position === position);
  }
  /** @nocollapse */
  static ɵfac = function ToastFilterPipe_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _ToastFilterPipe)();
  };
  /** @nocollapse */
  static ɵpipe = ɵɵdefinePipe({
    name: "toastFilter",
    type: _ToastFilterPipe,
    pure: true
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ToastFilterPipe, [{
    type: Pipe,
    args: [{
      name: "toastFilter"
    }]
  }], null, null);
})();
var BrnSonnerToaster = class _BrnSonnerToaster {
  _platformId = inject(PLATFORM_ID);
  _config = injectBrnSonnerToasterConfig();
  _document = inject(DOCUMENT);
  _window = this._document.defaultView;
  _dir = inject(Directionality);
  _toasts = toastState.toasts;
  _heights = toastState.heights;
  _reset = toastState.reset;
  invert = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "invert"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  theme = input("light", ...ngDevMode ? [{
    debugName: "theme"
  }] : (
    /* istanbul ignore next */
    []
  ));
  position = input("bottom-right", ...ngDevMode ? [{
    debugName: "position"
  }] : (
    /* istanbul ignore next */
    []
  ));
  hotKey = input(["altKey", "KeyT"], ...ngDevMode ? [{
    debugName: "hotKey"
  }] : (
    /* istanbul ignore next */
    []
  ));
  richColors = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "richColors"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  expand = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "expand"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  duration = input(this._config.toastLifetime, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "duration"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: numberAttribute
  }));
  visibleToasts = input(this._config.visibleToastsAmount, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "visibleToasts"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: numberAttribute
  }));
  closeButton = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "closeButton"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  toastOptions = input({}, ...ngDevMode ? [{
    debugName: "toastOptions"
  }] : (
    /* istanbul ignore next */
    []
  ));
  offset = input(null, ...ngDevMode ? [{
    debugName: "offset"
  }] : (
    /* istanbul ignore next */
    []
  ));
  userClass = input("", __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "userClass"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "class"
  }));
  style = input({}, ...ngDevMode ? [{
    debugName: "style"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _possiblePositions = computed(() => Array.from(new Set([this.position(), ...this._toasts().filter((toast2) => toast2.position).map((toast2) => toast2.position)].filter(Boolean))), ...ngDevMode ? [{
    debugName: "_possiblePositions"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _expanded = linkedSignal(__spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "_expanded"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    source: this._toasts,
    computation: (toasts) => toasts.length < 1
  }));
  _actualTheme = linkedSignal(__spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "_actualTheme"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    source: this.theme,
    computation: (newTheme) => this.getActualTheme(newTheme)
  }));
  _interacting = signal(false, ...ngDevMode ? [{
    debugName: "_interacting"
  }] : (
    /* istanbul ignore next */
    []
  ));
  /** internal **/
  direction = this._dir.valueSignal;
  _listRef = viewChild("listRef", ...ngDevMode ? [{
    debugName: "_listRef"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _lastFocusedElementRef = signal(null, ...ngDevMode ? [{
    debugName: "_lastFocusedElementRef"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _isFocusWithinRef = signal(false, ...ngDevMode ? [{
    debugName: "_isFocusWithinRef"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _hotKeyLabel = computed(() => this.hotKey().join("+").replace(/Key/g, "").replace(/Digit/g, ""), ...ngDevMode ? [{
    debugName: "_hotKeyLabel"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _toasterStyles = computed(() => __spreadValues({
    "--front-toast-height": `${this._heights()[0]?.height}px`,
    "--offset": typeof this.offset() === "number" ? `${this.offset()}px` : this.offset() ?? `${this._config.viewPortOffset}`,
    "--width": `${this._config.toastWidth}px`,
    "--gap": `${this._config.gap}px`
  }, this.style()), ...ngDevMode ? [{
    debugName: "_toasterStyles"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _loadingIcon = contentChild("loadingIcon", __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "_loadingIcon"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    read: TemplateRef
  }));
  _successIcon = contentChild("successIcon", __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "_successIcon"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    read: TemplateRef
  }));
  _errorIcon = contentChild("errorIcon", __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "_errorIcon"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    read: TemplateRef
  }));
  _warningIcon = contentChild("warningIcon", __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "_warningIcon"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    read: TemplateRef
  }));
  _infoIcon = contentChild("infoIcon", __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "_infoIcon"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    read: TemplateRef
  }));
  constructor() {
    this._reset();
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this._document.addEventListener("keydown", this.handleKeydown);
      const window = this._window;
      if (window) {
        this._window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", this.handleThemePreferenceChange);
      }
      destroyRef.onDestroy(() => {
        this._document.removeEventListener("keydown", this.handleKeydown);
        if (window) {
          window.matchMedia("(prefers-color-scheme: dark)").removeEventListener("change", this.handleThemePreferenceChange);
        }
      });
    });
  }
  handleBlur(event) {
    if (this._isFocusWithinRef() && !event.target.contains(event.relatedTarget)) {
      this._isFocusWithinRef.set(false);
      if (this._lastFocusedElementRef()) {
        this._lastFocusedElementRef()?.focus({
          preventScroll: true
        });
        this._lastFocusedElementRef.set(null);
      }
    }
  }
  handleFocus(event) {
    const isNotDismissible = event.target instanceof HTMLElement && event.target.dataset["dismissible"] === "false";
    if (isNotDismissible) return;
    if (!this._isFocusWithinRef()) {
      this._isFocusWithinRef.set(true);
      this._lastFocusedElementRef.set(event.relatedTarget);
    }
  }
  handlePointerDown(event) {
    const isNotDismissible = event.target instanceof HTMLElement && event.target.dataset["dismissible"] === "false";
    if (isNotDismissible) return;
    this._interacting.set(true);
  }
  handleMouseLeave() {
    if (!this._interacting()) {
      this._expanded.set(false);
    }
  }
  handleKeydown = (event) => {
    const listRef = this._listRef()?.nativeElement;
    if (!listRef) return;
    const isHotkeyPressed = this.hotKey().every((key) => event[key] || event.code === key);
    if (isHotkeyPressed) {
      this._expanded.set(true);
      listRef.focus();
    }
    if (event.code === "Escape" && (this._document.activeElement === listRef || listRef.contains(this._document.activeElement))) {
      this._expanded.set(false);
    }
  };
  handleThemePreferenceChange = ({
    matches
  }) => {
    if (this.theme() === "system") {
      this._actualTheme.set(matches ? "dark" : "light");
    }
  };
  getActualTheme(theme) {
    if (theme !== "system") {
      return theme;
    }
    if (isPlatformBrowser(this._platformId) && this._window) {
      const prefersDark = this._window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    return "light";
  }
  /** @nocollapse */
  static ɵfac = function BrnSonnerToaster_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnSonnerToaster)();
  };
  /** @nocollapse */
  static ɵcmp = ɵɵdefineComponent({
    type: _BrnSonnerToaster,
    selectors: [["brn-sonner-toaster"]],
    contentQueries: function BrnSonnerToaster_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuerySignal(dirIndex, ctx._loadingIcon, _c3, 5, TemplateRef)(dirIndex, ctx._successIcon, _c4, 5, TemplateRef)(dirIndex, ctx._errorIcon, _c5, 5, TemplateRef)(dirIndex, ctx._warningIcon, _c6, 5, TemplateRef)(dirIndex, ctx._infoIcon, _c7, 5, TemplateRef);
      }
      if (rf & 2) {
        ɵɵqueryAdvance(5);
      }
    },
    viewQuery: function BrnSonnerToaster_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuerySignal(ctx._listRef, _c8, 5);
      }
      if (rf & 2) {
        ɵɵqueryAdvance();
      }
    },
    inputs: {
      invert: [1, "invert"],
      theme: [1, "theme"],
      position: [1, "position"],
      hotKey: [1, "hotKey"],
      richColors: [1, "richColors"],
      expand: [1, "expand"],
      duration: [1, "duration"],
      visibleToasts: [1, "visibleToasts"],
      closeButton: [1, "closeButton"],
      toastOptions: [1, "toastOptions"],
      offset: [1, "offset"],
      userClass: [1, "class", "userClass"],
      style: [1, "style"]
    },
    decls: 1,
    vars: 1,
    consts: [["listRef", ""], [3, "tabIndex"], ["data-sonner-toaster", "", 3, "tabIndex", "class", "style"], ["data-sonner-toaster", "", 3, "blur", "focus", "mouseenter", "mousemove", "mouseleave", "pointerdown", "pointerup", "tabIndex"], [3, "index", "toast", "invert", "visibleToasts", "closeButton", "interacting", "position", "expandByDefault", "expanded", "actionButtonStyle", "cancelButtonStyle", "class", "descriptionClass", "classes", "duration", "unstyled"], [3, "index", "toast", "invert", "visibleToasts", "closeButton", "interacting", "position", "expandByDefault", "expanded", "actionButtonStyle", "cancelButtonStyle", "descriptionClass", "classes", "duration", "unstyled"], ["loading-icon", ""], ["loading-icon", "", 3, "isVisible"], ["success-icon", ""], ["type", "success", "success-icon", ""], ["error-icon", ""], ["type", "error", "error-icon", ""], ["warning-icon", ""], ["type", "warning", "warning-icon", ""], ["info-icon", ""], ["type", "info", "info-icon", ""], ["loading-icon", "", 4, "ngTemplateOutlet"], ["success-icon", "", 4, "ngTemplateOutlet"], ["error-icon", "", 4, "ngTemplateOutlet"], ["warning-icon", "", 4, "ngTemplateOutlet"], ["info-icon", "", 4, "ngTemplateOutlet"]],
    template: function BrnSonnerToaster_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵconditionalCreate(0, BrnSonnerToaster_Conditional_0_Template, 3, 2, "section", 1);
      }
      if (rf & 2) {
        ɵɵconditional(ctx._toasts().length > 0 ? 0 : -1);
      }
    },
    dependencies: [BrnSonnerToast, BrnSonnerIcon, BrnSonnerLoader, NgTemplateOutlet, ToastFilterPipe],
    styles: ['html[dir=ltr],[data-sonner-toaster][dir=ltr]{--toast-icon-margin-start: var(--brn-sonner-toast-icon-margin-start, -3px);--toast-icon-margin-end: var(--brn-sonner-toast-icon-margin-end, 4px);--toast-svg-margin-start: var(--brn-sonner-toast-svg-margin-start, -1px);--toast-svg-margin-end: var(--brn-sonner-toast-svg-margin-end, 0px);--toast-button-margin-start: var(--brn-sonner-toast-button-margin-start, auto);--toast-button-margin-end: var(--brn-sonner-toast-button-margin-end, 0);--toast-close-button-start: var(--brn-sonner-toast-close-button-start, 0);--toast-close-button-end: var(--brn-sonner-toast-close-button-end, unset);--toast-close-button-transform: var(--brn-sonner-toast-close-button-transform, translate(-35%, -35%))}html[dir=rtl],[data-sonner-toaster][dir=rtl]{--toast-icon-margin-start: var(--brn-sonner-rtl-toast-icon-margin-start, 4px);--toast-icon-margin-end: var(--brn-sonner-rtl-toast-icon-margin-end, -3px);--toast-svg-margin-start: var(--brn-sonner-rtl-toast-svg-margin-start, 0px);--toast-svg-margin-end: var(--brn-sonner-rtl-toast-svg-margin-end, -1px);--toast-button-margin-start: var(--brn-sonner-rtl-toast-button-margin-start, 0);--toast-button-margin-end: var(--brn-sonner-rtl-toast-button-margin-end, auto);--toast-close-button-start: var(--brn-sonner-rtl-toast-close-button-start, unset);--toast-close-button-end: var(--brn-sonner-rtl-toast-close-button-end, 0);--toast-close-button-transform: var(--brn-sonner-rtl-toast-close-button-transform, translate(35%, -35%))}[data-sonner-toaster]{position:fixed;width:var(--width);font-family:var( --brn-sonner-font-family, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji );--gray1: hsl(0, 0%, 99%);--gray2: hsl(0, 0%, 97.3%);--gray3: hsl(0, 0%, 95.1%);--gray4: hsl(0, 0%, 93%);--gray5: hsl(0, 0%, 90.9%);--gray6: hsl(0, 0%, 88.7%);--gray7: hsl(0, 0%, 85.8%);--gray8: hsl(0, 0%, 78%);--gray9: hsl(0, 0%, 56.1%);--gray10: hsl(0, 0%, 52.3%);--gray11: hsl(0, 0%, 43.5%);--gray12: hsl(0, 0%, 9%);--border-radius: var(--brn-sonner-border-radius, 8px);box-sizing:border-box;padding:0;margin:0;list-style:none;outline:none;z-index:999999999}[data-sonner-toaster][data-x-position=right]{right:max(var(--offset),env(safe-area-inset-right))}[data-sonner-toaster][data-x-position=left]{left:max(var(--offset),env(safe-area-inset-left))}[data-sonner-toaster][data-x-position=center]{left:50%;transform:translate(-50%)}[data-sonner-toaster][data-y-position=top]{top:max(var(--offset),env(safe-area-inset-top))}[data-sonner-toaster][data-y-position=bottom]{bottom:max(var(--offset),env(safe-area-inset-bottom))}[data-sonner-toast]{--y: translateY(100%);--lift-amount: calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);filter:blur(0);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:none;overflow-wrap:anywhere}[data-sonner-toast][data-styled=true]{padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px #0000001a;width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}[data-sonner-toast]:focus-visible{box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}[data-sonner-toast][data-y-position=top]{top:0;--y: translateY(-100%);--lift: 1;--lift-amount: calc(1 * var(--gap))}[data-sonner-toast][data-y-position=bottom]{bottom:0;--y: translateY(100%);--lift: -1;--lift-amount: calc(var(--lift) * var(--gap))}[data-sonner-toast] [data-description]{font-weight:400;line-height:1.4;color:inherit}[data-sonner-toast] [data-title]{font-weight:500;line-height:1.5;color:inherit}[data-sonner-toast] [data-icon]{display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}[data-sonner-toast][data-promise=true] [data-icon]>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}[data-sonner-toast] [data-icon]>*{flex-shrink:0}[data-sonner-toast] [data-icon] svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}[data-sonner-toast] [data-content]{display:flex;flex-direction:column;gap:2px}[data-sonner-toast] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;cursor:pointer;outline:none;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}[data-sonner-toast] [data-button]:focus-visible{box-shadow:var(--brn-sonner-toast-focus-box-shadow, 0 0 0 2px rgba(0, 0, 0, .4))}[data-sonner-toast] [data-button]:first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}[data-sonner-toast] [data-cancel]{color:var(--normal-text);background:#00000014}[data-sonner-toast][data-theme=dark] [data-cancel]{background:#ffffff4d}[data-sonner-toast] [data-close-button]{position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;background:var(--brn-sonner-toast-close-button-background, var(--gray1));color:var(--brn-sonner-toast-close-button-color, var(--gray12));border:var(--brn-sonner-toast-close-button-border, 1px solid var(--gray4));transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast] [data-close-button]:focus-visible{box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}[data-sonner-toast] [data-disabled=true]{cursor:not-allowed}[data-sonner-toast]:hover [data-close-button]:hover{background:var(--brn-sonner-toast-close-button-hover-background, var(--gray2));color:var(--brn-sonner-toast-close-button-hover-color, var(--gray12));border-color:var(--brn-sonner-toast-close-button-hover-border-color, var(--gray5))}[data-sonner-toast][data-swiping=true]:before{content:"";position:absolute;left:0;right:0;height:100%;z-index:-1}[data-sonner-toast][data-y-position=top][data-swiping=true]:before{bottom:50%;transform:scaleY(3) translateY(50%)}[data-sonner-toast][data-y-position=bottom][data-swiping=true]:before{top:50%;transform:scaleY(3) translateY(-50%)}[data-sonner-toast][data-swiping=false][data-removed=true]:before{content:"";position:absolute;inset:0;transform:scaleY(2)}[data-sonner-toast]:after{content:"";position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}[data-sonner-toast][data-mounted=true]{--y: translateY(0);opacity:1}[data-sonner-toast][data-expanded=false][data-front=false]{--scale: var(--toasts-before) * .05 + 1;--y: translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}[data-sonner-toast]>*{transition:opacity .4s}[data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>*{opacity:0}[data-sonner-toast][data-visible=false]{opacity:0;pointer-events:none}[data-sonner-toast][data-mounted=true][data-expanded=true]{--y: translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}[data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false]{--y: translateY(calc(var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true]{--y: translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false]{--y: translateY(40%);opacity:0;transition:transform .5s,opacity .2s}[data-sonner-toast][data-removed=true][data-front=false]:before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount, 0px));transition:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation:swipe-out .2s ease-out forwards}@keyframes swipe-out{0%{transform:translateY(calc(var(--lift) * var(--offset) + var(--swipe-amount)));opacity:1}to{transform:translateY(calc(var(--lift) * var(--offset) + var(--swipe-amount) + var(--lift) * -100%));opacity:0}}@media(max-width:600px){[data-sonner-toaster]{position:fixed;--mobile-offset: 16px;right:var(--mobile-offset);left:var(--mobile-offset);width:100%}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - 32px)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset)}[data-sonner-toaster][data-y-position=bottom]{bottom:20px}[data-sonner-toaster][data-y-position=top]{top:20px}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset);right:var(--mobile-offset);transform:none}}[data-sonner-toaster][data-theme=light]{--normal-bg: var(--brn-sonner-toast-normal-background, #fff);--normal-border: var(--brn-sonner-toast-normal-border-color, var(--gray4));--normal-text: var(--brn-sonner-toast-normal-color, var(--gray12));--success-bg: var(--brn-sonner-toast-success-background, hsl(143, 85%, 96%));--success-border: var(--brn-sonner-toast-success-border, hsl(145, 92%, 91%));--success-text: var(--brn-sonner-toast-success-color, hsl(140, 100%, 27%));--info-bg: var(--brn-sonner-toast-info-background, hsl(208, 100%, 97%));--info-border: var(--brn-sonner-toast-info-border, hsl(221, 91%, 91%));--info-text: var(--brn-sonner-toast-info-color, hsl(210, 92%, 45%));--warning-bg: var(--brn-sonner-toast-warning-background, hsl(49, 100%, 97%));--warning-border: var(--brn-sonner-toast-warning-border, hsl(49, 91%, 91%));--warning-text: var(--brn-sonner-toast-warning-color, hsl(31, 92%, 45%));--error-bg: var(--brn-sonner-toast-error-background, hsl(359, 100%, 97%));--error-border: var(--brn-sonner-toast-error-border, hsl(359, 100%, 94%));--error-text: var(--brn-sonner-toast-error-color, hsl(360, 100%, 45%))}[data-sonner-toaster][data-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg: var(--brn-sonner-toast-inverse-normal-background, #000);--normal-border: var(--brn-sonner-toast-inverse-normal-border-color, hsl(0, 0%, 20%));--normal-text: var(--brn-sonner-toast-inverse-normal-color, var(--gray1))}[data-sonner-toaster][data-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg: var(--brn-sonner-toast-inverse-dark-normal-background, #fff);--normal-border: var(--brn-sonner-toast-inverse-dark-normal-border-color, var(--gray3));--normal-text: var(--brn-sonner-toast-inverse-dark-normal-color, var(--gray12))}[data-sonner-toaster][data-theme=dark]{--normal-bg: var(--brn-sonner-toast-dark-normal-background, #000);--normal-border: var(--brn-sonner-toast-dark-normal-border-color, hsl(0, 0%, 20%));--normal-text: var(--brn-sonner-toast-dark-normal-color, var(--gray1));--success-bg: var(--brn-sonner-toast-dark-success-background, hsl(150, 100%, 6%));--success-border: var(--brn-sonner-toast-dark-success-border, hsl(147, 100%, 12%));--success-text: var(--brn-sonner-toast-dark-success-color, hsl(150, 86%, 65%));--info-bg: var(--brn-sonner-toast-dark-info-background, hsl(215, 100%, 6%));--info-border: var(--brn-sonner-toast-dark-info-border, hsl(223, 100%, 12%));--info-text: var(--brn-sonner-toast-dark-info-color, hsl(216, 87%, 65%));--warning-bg: var(--brn-sonner-toast-dark-warning-background, hsl(64, 100%, 6%));--warning-border: var(--brn-sonner-toast-dark-warning-border, hsl(60, 100%, 12%));--warning-text: var(--brn-sonner-toast-dark-warning-color, hsl(46, 87%, 65%));--error-bg: var(--brn-sonner-toast-dark-error-background, hsl(358, 76%, 10%));--error-border: var(--brn-sonner-toast-dark-error-border, hsl(357, 89%, 16%));--error-text: var(--brn-sonner-toast-dark-error-color, hsl(358, 100%, 81%))}[data-rich-colors=true] [data-sonner-toast][data-type=success],[data-rich-colors=true] [data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true] [data-sonner-toast][data-type=info],[data-rich-colors=true] [data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true] [data-sonner-toast][data-type=warning],[data-rich-colors=true] [data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true] [data-sonner-toast][data-type=error],[data-rich-colors=true] [data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size: 16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:nth-child(1){animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}to{opacity:.15}}@media(prefers-reduced-motion){[data-sonner-toast],[data-sonner-toast]>*,.sonner-loading-bar{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}\n'],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnSonnerToaster, [{
    type: Component,
    args: [{
      selector: "brn-sonner-toaster",
      imports: [BrnSonnerToast, ToastFilterPipe, BrnSonnerIcon, BrnSonnerLoader, NgTemplateOutlet],
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
		@if (_toasts().length > 0) {
			<section [attr.aria-label]="'Notifications ' + _hotKeyLabel()" [tabIndex]="-1">
				@for (pos of _possiblePositions(); track pos) {
					<ol
						#listRef
						[tabIndex]="-1"
						[class]="userClass()"
						data-sonner-toaster
						[attr.data-theme]="_actualTheme()"
						[attr.data-rich-colors]="richColors()"
						[attr.dir]="direction()"
						[attr.data-y-position]="pos.split('-')[0]"
						[attr.data-x-position]="pos.split('-')[1]"
						[style]="_toasterStyles()"
						(blur)="handleBlur($event)"
						(focus)="handleFocus($event)"
						(mouseenter)="_expanded.set(true)"
						(mousemove)="_expanded.set(true)"
						(mouseleave)="handleMouseLeave()"
						(pointerdown)="handlePointerDown($event)"
						(pointerup)="_interacting.set(false)"
					>
						@for (toast of _toasts() | toastFilter: $index : pos; track toast.id) {
							<brn-sonner-toast
								[index]="$index"
								[toast]="toast"
								[invert]="invert()"
								[visibleToasts]="visibleToasts()"
								[closeButton]="closeButton()"
								[interacting]="_interacting()"
								[position]="pos"
								[expandByDefault]="expand()"
								[expanded]="_expanded()"
								[actionButtonStyle]="toastOptions().actionButtonStyle"
								[cancelButtonStyle]="toastOptions().cancelButtonStyle"
								[class]="toastOptions().class ?? ''"
								[descriptionClass]="toastOptions().descriptionClass ?? ''"
								[classes]="toastOptions().classes ?? {}"
								[duration]="toastOptions().duration ?? duration()"
								[unstyled]="toastOptions().unstyled ?? false"
							>
								@if (_loadingIcon(); as loadingIcon) {
									<ng-container *ngTemplateOutlet="loadingIcon" loading-icon />
								} @else {
									<brn-sonner-loader [isVisible]="toast.type === 'loading'" loading-icon />
								}

								@if (_successIcon(); as successIcon) {
									<ng-container *ngTemplateOutlet="successIcon" success-icon />
								} @else {
									<brn-sonner-icon type="success" success-icon />
								}

								@if (_errorIcon(); as errorIcon) {
									<ng-container *ngTemplateOutlet="errorIcon" error-icon />
								} @else {
									<brn-sonner-icon type="error" error-icon />
								}

								@if (_warningIcon(); as warningIcon) {
									<ng-container *ngTemplateOutlet="warningIcon" warning-icon />
								} @else {
									<brn-sonner-icon type="warning" warning-icon />
								}

								@if (_infoIcon(); as infoIcon) {
									<ng-container *ngTemplateOutlet="infoIcon" info-icon />
								} @else {
									<brn-sonner-icon type="info" info-icon />
								}
							</brn-sonner-toast>
						}
					</ol>
				}
			</section>
		}
	`,
      styles: ['html[dir=ltr],[data-sonner-toaster][dir=ltr]{--toast-icon-margin-start: var(--brn-sonner-toast-icon-margin-start, -3px);--toast-icon-margin-end: var(--brn-sonner-toast-icon-margin-end, 4px);--toast-svg-margin-start: var(--brn-sonner-toast-svg-margin-start, -1px);--toast-svg-margin-end: var(--brn-sonner-toast-svg-margin-end, 0px);--toast-button-margin-start: var(--brn-sonner-toast-button-margin-start, auto);--toast-button-margin-end: var(--brn-sonner-toast-button-margin-end, 0);--toast-close-button-start: var(--brn-sonner-toast-close-button-start, 0);--toast-close-button-end: var(--brn-sonner-toast-close-button-end, unset);--toast-close-button-transform: var(--brn-sonner-toast-close-button-transform, translate(-35%, -35%))}html[dir=rtl],[data-sonner-toaster][dir=rtl]{--toast-icon-margin-start: var(--brn-sonner-rtl-toast-icon-margin-start, 4px);--toast-icon-margin-end: var(--brn-sonner-rtl-toast-icon-margin-end, -3px);--toast-svg-margin-start: var(--brn-sonner-rtl-toast-svg-margin-start, 0px);--toast-svg-margin-end: var(--brn-sonner-rtl-toast-svg-margin-end, -1px);--toast-button-margin-start: var(--brn-sonner-rtl-toast-button-margin-start, 0);--toast-button-margin-end: var(--brn-sonner-rtl-toast-button-margin-end, auto);--toast-close-button-start: var(--brn-sonner-rtl-toast-close-button-start, unset);--toast-close-button-end: var(--brn-sonner-rtl-toast-close-button-end, 0);--toast-close-button-transform: var(--brn-sonner-rtl-toast-close-button-transform, translate(35%, -35%))}[data-sonner-toaster]{position:fixed;width:var(--width);font-family:var( --brn-sonner-font-family, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji );--gray1: hsl(0, 0%, 99%);--gray2: hsl(0, 0%, 97.3%);--gray3: hsl(0, 0%, 95.1%);--gray4: hsl(0, 0%, 93%);--gray5: hsl(0, 0%, 90.9%);--gray6: hsl(0, 0%, 88.7%);--gray7: hsl(0, 0%, 85.8%);--gray8: hsl(0, 0%, 78%);--gray9: hsl(0, 0%, 56.1%);--gray10: hsl(0, 0%, 52.3%);--gray11: hsl(0, 0%, 43.5%);--gray12: hsl(0, 0%, 9%);--border-radius: var(--brn-sonner-border-radius, 8px);box-sizing:border-box;padding:0;margin:0;list-style:none;outline:none;z-index:999999999}[data-sonner-toaster][data-x-position=right]{right:max(var(--offset),env(safe-area-inset-right))}[data-sonner-toaster][data-x-position=left]{left:max(var(--offset),env(safe-area-inset-left))}[data-sonner-toaster][data-x-position=center]{left:50%;transform:translate(-50%)}[data-sonner-toaster][data-y-position=top]{top:max(var(--offset),env(safe-area-inset-top))}[data-sonner-toaster][data-y-position=bottom]{bottom:max(var(--offset),env(safe-area-inset-bottom))}[data-sonner-toast]{--y: translateY(100%);--lift-amount: calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);filter:blur(0);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:none;overflow-wrap:anywhere}[data-sonner-toast][data-styled=true]{padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px #0000001a;width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}[data-sonner-toast]:focus-visible{box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}[data-sonner-toast][data-y-position=top]{top:0;--y: translateY(-100%);--lift: 1;--lift-amount: calc(1 * var(--gap))}[data-sonner-toast][data-y-position=bottom]{bottom:0;--y: translateY(100%);--lift: -1;--lift-amount: calc(var(--lift) * var(--gap))}[data-sonner-toast] [data-description]{font-weight:400;line-height:1.4;color:inherit}[data-sonner-toast] [data-title]{font-weight:500;line-height:1.5;color:inherit}[data-sonner-toast] [data-icon]{display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}[data-sonner-toast][data-promise=true] [data-icon]>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}[data-sonner-toast] [data-icon]>*{flex-shrink:0}[data-sonner-toast] [data-icon] svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}[data-sonner-toast] [data-content]{display:flex;flex-direction:column;gap:2px}[data-sonner-toast] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;cursor:pointer;outline:none;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}[data-sonner-toast] [data-button]:focus-visible{box-shadow:var(--brn-sonner-toast-focus-box-shadow, 0 0 0 2px rgba(0, 0, 0, .4))}[data-sonner-toast] [data-button]:first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}[data-sonner-toast] [data-cancel]{color:var(--normal-text);background:#00000014}[data-sonner-toast][data-theme=dark] [data-cancel]{background:#ffffff4d}[data-sonner-toast] [data-close-button]{position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;background:var(--brn-sonner-toast-close-button-background, var(--gray1));color:var(--brn-sonner-toast-close-button-color, var(--gray12));border:var(--brn-sonner-toast-close-button-border, 1px solid var(--gray4));transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast] [data-close-button]:focus-visible{box-shadow:0 4px 12px #0000001a,0 0 0 2px #0003}[data-sonner-toast] [data-disabled=true]{cursor:not-allowed}[data-sonner-toast]:hover [data-close-button]:hover{background:var(--brn-sonner-toast-close-button-hover-background, var(--gray2));color:var(--brn-sonner-toast-close-button-hover-color, var(--gray12));border-color:var(--brn-sonner-toast-close-button-hover-border-color, var(--gray5))}[data-sonner-toast][data-swiping=true]:before{content:"";position:absolute;left:0;right:0;height:100%;z-index:-1}[data-sonner-toast][data-y-position=top][data-swiping=true]:before{bottom:50%;transform:scaleY(3) translateY(50%)}[data-sonner-toast][data-y-position=bottom][data-swiping=true]:before{top:50%;transform:scaleY(3) translateY(-50%)}[data-sonner-toast][data-swiping=false][data-removed=true]:before{content:"";position:absolute;inset:0;transform:scaleY(2)}[data-sonner-toast]:after{content:"";position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}[data-sonner-toast][data-mounted=true]{--y: translateY(0);opacity:1}[data-sonner-toast][data-expanded=false][data-front=false]{--scale: var(--toasts-before) * .05 + 1;--y: translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}[data-sonner-toast]>*{transition:opacity .4s}[data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>*{opacity:0}[data-sonner-toast][data-visible=false]{opacity:0;pointer-events:none}[data-sonner-toast][data-mounted=true][data-expanded=true]{--y: translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}[data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false]{--y: translateY(calc(var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true]{--y: translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false]{--y: translateY(40%);opacity:0;transition:transform .5s,opacity .2s}[data-sonner-toast][data-removed=true][data-front=false]:before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount, 0px));transition:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation:swipe-out .2s ease-out forwards}@keyframes swipe-out{0%{transform:translateY(calc(var(--lift) * var(--offset) + var(--swipe-amount)));opacity:1}to{transform:translateY(calc(var(--lift) * var(--offset) + var(--swipe-amount) + var(--lift) * -100%));opacity:0}}@media(max-width:600px){[data-sonner-toaster]{position:fixed;--mobile-offset: 16px;right:var(--mobile-offset);left:var(--mobile-offset);width:100%}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - 32px)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset)}[data-sonner-toaster][data-y-position=bottom]{bottom:20px}[data-sonner-toaster][data-y-position=top]{top:20px}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset);right:var(--mobile-offset);transform:none}}[data-sonner-toaster][data-theme=light]{--normal-bg: var(--brn-sonner-toast-normal-background, #fff);--normal-border: var(--brn-sonner-toast-normal-border-color, var(--gray4));--normal-text: var(--brn-sonner-toast-normal-color, var(--gray12));--success-bg: var(--brn-sonner-toast-success-background, hsl(143, 85%, 96%));--success-border: var(--brn-sonner-toast-success-border, hsl(145, 92%, 91%));--success-text: var(--brn-sonner-toast-success-color, hsl(140, 100%, 27%));--info-bg: var(--brn-sonner-toast-info-background, hsl(208, 100%, 97%));--info-border: var(--brn-sonner-toast-info-border, hsl(221, 91%, 91%));--info-text: var(--brn-sonner-toast-info-color, hsl(210, 92%, 45%));--warning-bg: var(--brn-sonner-toast-warning-background, hsl(49, 100%, 97%));--warning-border: var(--brn-sonner-toast-warning-border, hsl(49, 91%, 91%));--warning-text: var(--brn-sonner-toast-warning-color, hsl(31, 92%, 45%));--error-bg: var(--brn-sonner-toast-error-background, hsl(359, 100%, 97%));--error-border: var(--brn-sonner-toast-error-border, hsl(359, 100%, 94%));--error-text: var(--brn-sonner-toast-error-color, hsl(360, 100%, 45%))}[data-sonner-toaster][data-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg: var(--brn-sonner-toast-inverse-normal-background, #000);--normal-border: var(--brn-sonner-toast-inverse-normal-border-color, hsl(0, 0%, 20%));--normal-text: var(--brn-sonner-toast-inverse-normal-color, var(--gray1))}[data-sonner-toaster][data-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg: var(--brn-sonner-toast-inverse-dark-normal-background, #fff);--normal-border: var(--brn-sonner-toast-inverse-dark-normal-border-color, var(--gray3));--normal-text: var(--brn-sonner-toast-inverse-dark-normal-color, var(--gray12))}[data-sonner-toaster][data-theme=dark]{--normal-bg: var(--brn-sonner-toast-dark-normal-background, #000);--normal-border: var(--brn-sonner-toast-dark-normal-border-color, hsl(0, 0%, 20%));--normal-text: var(--brn-sonner-toast-dark-normal-color, var(--gray1));--success-bg: var(--brn-sonner-toast-dark-success-background, hsl(150, 100%, 6%));--success-border: var(--brn-sonner-toast-dark-success-border, hsl(147, 100%, 12%));--success-text: var(--brn-sonner-toast-dark-success-color, hsl(150, 86%, 65%));--info-bg: var(--brn-sonner-toast-dark-info-background, hsl(215, 100%, 6%));--info-border: var(--brn-sonner-toast-dark-info-border, hsl(223, 100%, 12%));--info-text: var(--brn-sonner-toast-dark-info-color, hsl(216, 87%, 65%));--warning-bg: var(--brn-sonner-toast-dark-warning-background, hsl(64, 100%, 6%));--warning-border: var(--brn-sonner-toast-dark-warning-border, hsl(60, 100%, 12%));--warning-text: var(--brn-sonner-toast-dark-warning-color, hsl(46, 87%, 65%));--error-bg: var(--brn-sonner-toast-dark-error-background, hsl(358, 76%, 10%));--error-border: var(--brn-sonner-toast-dark-error-border, hsl(357, 89%, 16%));--error-text: var(--brn-sonner-toast-dark-error-color, hsl(358, 100%, 81%))}[data-rich-colors=true] [data-sonner-toast][data-type=success],[data-rich-colors=true] [data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true] [data-sonner-toast][data-type=info],[data-rich-colors=true] [data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true] [data-sonner-toast][data-type=warning],[data-rich-colors=true] [data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true] [data-sonner-toast][data-type=error],[data-rich-colors=true] [data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size: 16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:nth-child(1){animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}to{opacity:.15}}@media(prefers-reduced-motion){[data-sonner-toast],[data-sonner-toast]>*,.sonner-loading-bar{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}\n']
    }]
  }], () => [], {
    invert: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "invert",
        required: false
      }]
    }],
    theme: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "theme",
        required: false
      }]
    }],
    position: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "position",
        required: false
      }]
    }],
    hotKey: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "hotKey",
        required: false
      }]
    }],
    richColors: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "richColors",
        required: false
      }]
    }],
    expand: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "expand",
        required: false
      }]
    }],
    duration: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "duration",
        required: false
      }]
    }],
    visibleToasts: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "visibleToasts",
        required: false
      }]
    }],
    closeButton: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "closeButton",
        required: false
      }]
    }],
    toastOptions: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "toastOptions",
        required: false
      }]
    }],
    offset: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "offset",
        required: false
      }]
    }],
    userClass: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "class",
        required: false
      }]
    }],
    style: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "style",
        required: false
      }]
    }],
    _listRef: [{
      type: ViewChild,
      args: ["listRef", {
        isSignal: true
      }]
    }],
    _loadingIcon: [{
      type: ContentChild,
      args: ["loadingIcon", __spreadProps(__spreadValues({}, {
        read: TemplateRef
      }), {
        isSignal: true
      })]
    }],
    _successIcon: [{
      type: ContentChild,
      args: ["successIcon", __spreadProps(__spreadValues({}, {
        read: TemplateRef
      }), {
        isSignal: true
      })]
    }],
    _errorIcon: [{
      type: ContentChild,
      args: ["errorIcon", __spreadProps(__spreadValues({}, {
        read: TemplateRef
      }), {
        isSignal: true
      })]
    }],
    _warningIcon: [{
      type: ContentChild,
      args: ["warningIcon", __spreadProps(__spreadValues({}, {
        read: TemplateRef
      }), {
        isSignal: true
      })]
    }],
    _infoIcon: [{
      type: ContentChild,
      args: ["infoIcon", __spreadProps(__spreadValues({}, {
        read: TemplateRef
      }), {
        isSignal: true
      })]
    }]
  });
})();
var BrnSonnerImports = [BrnSonnerToaster];
export {
  BrnSonnerImports,
  BrnSonnerToaster,
  defaultClasses,
  injectBrnSonnerToasterConfig,
  provideBrnSonnerToasterConfig,
  toast,
  toastState
};
//# sourceMappingURL=@spartan-ng_brain_sonner.js.map
