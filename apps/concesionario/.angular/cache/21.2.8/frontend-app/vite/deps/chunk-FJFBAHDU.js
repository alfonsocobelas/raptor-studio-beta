import {
  A11yModule,
  FocusMonitor,
  FocusTrapFactory,
  InteractivityChecker
} from "./chunk-6IE75NIU.js";
import {
  BasePortalOutlet,
  CdkPortalOutlet,
  ComponentPortal,
  OverlayConfig,
  OverlayContainer,
  OverlayModule,
  OverlayOutsideClickDispatcher,
  OverlayPositionBuilder,
  OverlayRef,
  PortalModule,
  ScrollStrategyOptions,
  TemplatePortal,
  createBlockScrollStrategy,
  createGlobalPositionStrategy,
  createOverlayRef
} from "./chunk-KM2PCSLL.js";
import {
  ESCAPE,
  Platform,
  _IdGenerator,
  _getFocusedElementPierceShadowDom,
  hasModifierKey
} from "./chunk-C3FLKRDF.js";
import {
  Directionality
} from "./chunk-RU4RFFMX.js";
import {
  cssClassesToArray,
  getActiveElementAnimations,
  provideCustomClassSettableExisting,
  provideExposesStateProviderExisting,
  waitForAnimations
} from "./chunk-N5WA7HNS.js";
import {
  takeUntilDestroyed
} from "./chunk-R4LLFK3G.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  EventEmitter,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  NgModule,
  NgZone,
  Output,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  setClassMetadata,
  signal,
  untracked,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵattribute,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdomProperty,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵqueryRefresh,
  ɵɵtemplate,
  ɵɵviewQuery
} from "./chunk-BFMHQS5Q.js";
import {
  ReplaySubject,
  Subject,
  defer,
  filter,
  startWith,
  take,
  takeUntil
} from "./chunk-RSS3ODKE.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/@angular/cdk/fesm2022/dialog.mjs
function CdkDialogContainer_ng_template_0_Template(rf, ctx) {
}
var DialogConfig = class {
  viewContainerRef;
  injector;
  id;
  role = "dialog";
  panelClass = "";
  hasBackdrop = true;
  backdropClass = "";
  disableClose = false;
  closePredicate;
  width = "";
  height = "";
  minWidth;
  minHeight;
  maxWidth;
  maxHeight;
  positionStrategy;
  data = null;
  direction;
  ariaDescribedBy = null;
  ariaLabelledBy = null;
  ariaLabel = null;
  ariaModal = false;
  autoFocus = "first-tabbable";
  restoreFocus = true;
  scrollStrategy;
  closeOnNavigation = true;
  closeOnDestroy = true;
  closeOnOverlayDetachments = true;
  disableAnimations = false;
  providers;
  container;
  templateContext;
};
function throwDialogContentAlreadyAttachedError() {
  throw Error("Attempting to attach dialog content after content is already attached");
}
var CdkDialogContainer = class _CdkDialogContainer extends BasePortalOutlet {
  _elementRef = inject(ElementRef);
  _focusTrapFactory = inject(FocusTrapFactory);
  _config;
  _interactivityChecker = inject(InteractivityChecker);
  _ngZone = inject(NgZone);
  _focusMonitor = inject(FocusMonitor);
  _renderer = inject(Renderer2);
  _changeDetectorRef = inject(ChangeDetectorRef);
  _injector = inject(Injector);
  _platform = inject(Platform);
  _document = inject(DOCUMENT);
  _portalOutlet;
  _focusTrapped = new Subject();
  _focusTrap = null;
  _elementFocusedBeforeDialogWasOpened = null;
  _closeInteractionType = null;
  _ariaLabelledByQueue = [];
  _isDestroyed = false;
  constructor() {
    super();
    this._config = inject(DialogConfig, {
      optional: true
    }) || new DialogConfig();
    if (this._config.ariaLabelledBy) {
      this._ariaLabelledByQueue.push(this._config.ariaLabelledBy);
    }
  }
  _addAriaLabelledBy(id) {
    this._ariaLabelledByQueue.push(id);
    this._changeDetectorRef.markForCheck();
  }
  _removeAriaLabelledBy(id) {
    const index = this._ariaLabelledByQueue.indexOf(id);
    if (index > -1) {
      this._ariaLabelledByQueue.splice(index, 1);
      this._changeDetectorRef.markForCheck();
    }
  }
  _contentAttached() {
    this._initializeFocusTrap();
    this._captureInitialFocus();
  }
  _captureInitialFocus() {
    this._trapFocus();
  }
  ngOnDestroy() {
    this._focusTrapped.complete();
    this._isDestroyed = true;
    this._restoreFocus();
  }
  attachComponentPortal(portal) {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throwDialogContentAlreadyAttachedError();
    }
    const result = this._portalOutlet.attachComponentPortal(portal);
    this._contentAttached();
    return result;
  }
  attachTemplatePortal(portal) {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throwDialogContentAlreadyAttachedError();
    }
    const result = this._portalOutlet.attachTemplatePortal(portal);
    this._contentAttached();
    return result;
  }
  attachDomPortal = (portal) => {
    if (this._portalOutlet.hasAttached() && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throwDialogContentAlreadyAttachedError();
    }
    const result = this._portalOutlet.attachDomPortal(portal);
    this._contentAttached();
    return result;
  };
  _recaptureFocus() {
    if (!this._containsFocus()) {
      this._trapFocus();
    }
  }
  _forceFocus(element, options) {
    if (!this._interactivityChecker.isFocusable(element)) {
      element.tabIndex = -1;
      this._ngZone.runOutsideAngular(() => {
        const callback = () => {
          deregisterBlur();
          deregisterMousedown();
          element.removeAttribute("tabindex");
        };
        const deregisterBlur = this._renderer.listen(element, "blur", callback);
        const deregisterMousedown = this._renderer.listen(element, "mousedown", callback);
      });
    }
    element.focus(options);
  }
  _focusByCssSelector(selector, options) {
    let elementToFocus = this._elementRef.nativeElement.querySelector(selector);
    if (elementToFocus) {
      this._forceFocus(elementToFocus, options);
    }
  }
  _trapFocus(options) {
    if (this._isDestroyed) {
      return;
    }
    afterNextRender(() => {
      const element = this._elementRef.nativeElement;
      switch (this._config.autoFocus) {
        case false:
        case "dialog":
          if (!this._containsFocus()) {
            element.focus(options);
          }
          break;
        case true:
        case "first-tabbable":
          const focusedSuccessfully = this._focusTrap?.focusInitialElement(options);
          if (!focusedSuccessfully) {
            this._focusDialogContainer(options);
          }
          break;
        case "first-heading":
          this._focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]', options);
          break;
        default:
          this._focusByCssSelector(this._config.autoFocus, options);
          break;
      }
      this._focusTrapped.next();
    }, {
      injector: this._injector
    });
  }
  _restoreFocus() {
    const focusConfig = this._config.restoreFocus;
    let focusTargetElement = null;
    if (typeof focusConfig === "string") {
      focusTargetElement = this._document.querySelector(focusConfig);
    } else if (typeof focusConfig === "boolean") {
      focusTargetElement = focusConfig ? this._elementFocusedBeforeDialogWasOpened : null;
    } else if (focusConfig) {
      focusTargetElement = focusConfig;
    }
    if (this._config.restoreFocus && focusTargetElement && typeof focusTargetElement.focus === "function") {
      const activeElement = _getFocusedElementPierceShadowDom();
      const element = this._elementRef.nativeElement;
      if (!activeElement || activeElement === this._document.body || activeElement === element || element.contains(activeElement)) {
        if (this._focusMonitor) {
          this._focusMonitor.focusVia(focusTargetElement, this._closeInteractionType);
          this._closeInteractionType = null;
        } else {
          focusTargetElement.focus();
        }
      }
    }
    if (this._focusTrap) {
      this._focusTrap.destroy();
    }
  }
  _focusDialogContainer(options) {
    this._elementRef.nativeElement.focus?.(options);
  }
  _containsFocus() {
    const element = this._elementRef.nativeElement;
    const activeElement = _getFocusedElementPierceShadowDom();
    return element === activeElement || element.contains(activeElement);
  }
  _initializeFocusTrap() {
    if (this._platform.isBrowser) {
      this._focusTrap = this._focusTrapFactory.create(this._elementRef.nativeElement);
      if (this._document) {
        this._elementFocusedBeforeDialogWasOpened = _getFocusedElementPierceShadowDom();
      }
    }
  }
  static ɵfac = function CdkDialogContainer_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _CdkDialogContainer)();
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _CdkDialogContainer,
    selectors: [["cdk-dialog-container"]],
    viewQuery: function CdkDialogContainer_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(CdkPortalOutlet, 7);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx._portalOutlet = _t.first);
      }
    },
    hostAttrs: ["tabindex", "-1", 1, "cdk-dialog-container"],
    hostVars: 6,
    hostBindings: function CdkDialogContainer_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("id", ctx._config.id || null)("role", ctx._config.role)("aria-modal", ctx._config.ariaModal)("aria-labelledby", ctx._config.ariaLabel ? null : ctx._ariaLabelledByQueue[0])("aria-label", ctx._config.ariaLabel)("aria-describedby", ctx._config.ariaDescribedBy || null);
      }
    },
    features: [ɵɵInheritDefinitionFeature],
    decls: 1,
    vars: 0,
    consts: [["cdkPortalOutlet", ""]],
    template: function CdkDialogContainer_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵtemplate(0, CdkDialogContainer_ng_template_0_Template, 0, 0, "ng-template", 0);
      }
    },
    dependencies: [CdkPortalOutlet],
    styles: [".cdk-dialog-container {\n  display: block;\n  width: 100%;\n  height: 100%;\n  min-height: inherit;\n  max-height: inherit;\n}\n"],
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CdkDialogContainer, [{
    type: Component,
    args: [{
      selector: "cdk-dialog-container",
      encapsulation: ViewEncapsulation.None,
      changeDetection: ChangeDetectionStrategy.Default,
      imports: [CdkPortalOutlet],
      host: {
        "class": "cdk-dialog-container",
        "tabindex": "-1",
        "[attr.id]": "_config.id || null",
        "[attr.role]": "_config.role",
        "[attr.aria-modal]": "_config.ariaModal",
        "[attr.aria-labelledby]": "_config.ariaLabel ? null : _ariaLabelledByQueue[0]",
        "[attr.aria-label]": "_config.ariaLabel",
        "[attr.aria-describedby]": "_config.ariaDescribedBy || null"
      },
      template: "<ng-template cdkPortalOutlet />\n",
      styles: [".cdk-dialog-container {\n  display: block;\n  width: 100%;\n  height: 100%;\n  min-height: inherit;\n  max-height: inherit;\n}\n"]
    }]
  }], () => [], {
    _portalOutlet: [{
      type: ViewChild,
      args: [CdkPortalOutlet, {
        static: true
      }]
    }]
  });
})();
var DialogRef = class {
  overlayRef;
  config;
  componentInstance = null;
  componentRef = null;
  containerInstance;
  disableClose;
  closed = new Subject();
  backdropClick;
  keydownEvents;
  outsidePointerEvents;
  id;
  _detachSubscription;
  constructor(overlayRef, config) {
    this.overlayRef = overlayRef;
    this.config = config;
    this.disableClose = config.disableClose;
    this.backdropClick = overlayRef.backdropClick();
    this.keydownEvents = overlayRef.keydownEvents();
    this.outsidePointerEvents = overlayRef.outsidePointerEvents();
    this.id = config.id;
    this.keydownEvents.subscribe((event) => {
      if (event.keyCode === ESCAPE && !this.disableClose && !hasModifierKey(event)) {
        event.preventDefault();
        this.close(void 0, {
          focusOrigin: "keyboard"
        });
      }
    });
    this.backdropClick.subscribe(() => {
      if (!this.disableClose && this._canClose()) {
        this.close(void 0, {
          focusOrigin: "mouse"
        });
      } else {
        this.containerInstance._recaptureFocus?.();
      }
    });
    this._detachSubscription = overlayRef.detachments().subscribe(() => {
      if (config.closeOnOverlayDetachments !== false) {
        this.close();
      }
    });
  }
  close(result, options) {
    if (this._canClose(result)) {
      const closedSubject = this.closed;
      this.containerInstance._closeInteractionType = options?.focusOrigin || "program";
      this._detachSubscription.unsubscribe();
      this.overlayRef.dispose();
      closedSubject.next(result);
      closedSubject.complete();
      this.componentInstance = this.containerInstance = null;
    }
  }
  updatePosition() {
    this.overlayRef.updatePosition();
    return this;
  }
  updateSize(width = "", height = "") {
    this.overlayRef.updateSize({
      width,
      height
    });
    return this;
  }
  addPanelClass(classes) {
    this.overlayRef.addPanelClass(classes);
    return this;
  }
  removePanelClass(classes) {
    this.overlayRef.removePanelClass(classes);
    return this;
  }
  _canClose(result) {
    const config = this.config;
    return !!this.containerInstance && (!config.closePredicate || config.closePredicate(result, config, this.componentInstance));
  }
};
var DIALOG_SCROLL_STRATEGY = new InjectionToken("DialogScrollStrategy", {
  providedIn: "root",
  factory: () => {
    const injector = inject(Injector);
    return () => createBlockScrollStrategy(injector);
  }
});
var DIALOG_DATA = new InjectionToken("DialogData");
var DEFAULT_DIALOG_CONFIG = new InjectionToken("DefaultDialogConfig");
function getDirectionality(value) {
  const valueSignal = signal(value, ...ngDevMode ? [{
    debugName: "valueSignal"
  }] : []);
  const change = new EventEmitter();
  return {
    valueSignal,
    get value() {
      return valueSignal();
    },
    change,
    ngOnDestroy() {
      change.complete();
    }
  };
}
var Dialog = class _Dialog {
  _injector = inject(Injector);
  _defaultOptions = inject(DEFAULT_DIALOG_CONFIG, {
    optional: true
  });
  _parentDialog = inject(_Dialog, {
    optional: true,
    skipSelf: true
  });
  _overlayContainer = inject(OverlayContainer);
  _idGenerator = inject(_IdGenerator);
  _openDialogsAtThisLevel = [];
  _afterAllClosedAtThisLevel = new Subject();
  _afterOpenedAtThisLevel = new Subject();
  _ariaHiddenElements = /* @__PURE__ */ new Map();
  _scrollStrategy = inject(DIALOG_SCROLL_STRATEGY);
  get openDialogs() {
    return this._parentDialog ? this._parentDialog.openDialogs : this._openDialogsAtThisLevel;
  }
  get afterOpened() {
    return this._parentDialog ? this._parentDialog.afterOpened : this._afterOpenedAtThisLevel;
  }
  afterAllClosed = defer(() => this.openDialogs.length ? this._getAfterAllClosed() : this._getAfterAllClosed().pipe(startWith(void 0)));
  constructor() {
  }
  open(componentOrTemplateRef, config) {
    const defaults = this._defaultOptions || new DialogConfig();
    config = __spreadValues(__spreadValues({}, defaults), config);
    config.id = config.id || this._idGenerator.getId("cdk-dialog-");
    if (config.id && this.getDialogById(config.id) && (typeof ngDevMode === "undefined" || ngDevMode)) {
      throw Error(`Dialog with id "${config.id}" exists already. The dialog id must be unique.`);
    }
    const overlayConfig = this._getOverlayConfig(config);
    const overlayRef = createOverlayRef(this._injector, overlayConfig);
    const dialogRef = new DialogRef(overlayRef, config);
    const dialogContainer = this._attachContainer(overlayRef, dialogRef, config);
    dialogRef.containerInstance = dialogContainer;
    if (!this.openDialogs.length) {
      const overlayContainer = this._overlayContainer.getContainerElement();
      if (dialogContainer._focusTrapped) {
        dialogContainer._focusTrapped.pipe(take(1)).subscribe(() => {
          this._hideNonDialogContentFromAssistiveTechnology(overlayContainer);
        });
      } else {
        this._hideNonDialogContentFromAssistiveTechnology(overlayContainer);
      }
    }
    this._attachDialogContent(componentOrTemplateRef, dialogRef, dialogContainer, config);
    this.openDialogs.push(dialogRef);
    dialogRef.closed.subscribe(() => this._removeOpenDialog(dialogRef, true));
    this.afterOpened.next(dialogRef);
    return dialogRef;
  }
  closeAll() {
    reverseForEach(this.openDialogs, (dialog) => dialog.close());
  }
  getDialogById(id) {
    return this.openDialogs.find((dialog) => dialog.id === id);
  }
  ngOnDestroy() {
    reverseForEach(this._openDialogsAtThisLevel, (dialog) => {
      if (dialog.config.closeOnDestroy === false) {
        this._removeOpenDialog(dialog, false);
      }
    });
    reverseForEach(this._openDialogsAtThisLevel, (dialog) => dialog.close());
    this._afterAllClosedAtThisLevel.complete();
    this._afterOpenedAtThisLevel.complete();
    this._openDialogsAtThisLevel = [];
  }
  _getOverlayConfig(config) {
    const state = new OverlayConfig({
      positionStrategy: config.positionStrategy || createGlobalPositionStrategy().centerHorizontally().centerVertically(),
      scrollStrategy: config.scrollStrategy || this._scrollStrategy(),
      panelClass: config.panelClass,
      hasBackdrop: config.hasBackdrop,
      direction: config.direction,
      minWidth: config.minWidth,
      minHeight: config.minHeight,
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      width: config.width,
      height: config.height,
      disposeOnNavigation: config.closeOnNavigation,
      disableAnimations: config.disableAnimations
    });
    if (config.backdropClass) {
      state.backdropClass = config.backdropClass;
    }
    return state;
  }
  _attachContainer(overlay, dialogRef, config) {
    const userInjector = config.injector || config.viewContainerRef?.injector;
    const providers = [{
      provide: DialogConfig,
      useValue: config
    }, {
      provide: DialogRef,
      useValue: dialogRef
    }, {
      provide: OverlayRef,
      useValue: overlay
    }];
    let containerType;
    if (config.container) {
      if (typeof config.container === "function") {
        containerType = config.container;
      } else {
        containerType = config.container.type;
        providers.push(...config.container.providers(config));
      }
    } else {
      containerType = CdkDialogContainer;
    }
    const containerPortal = new ComponentPortal(containerType, config.viewContainerRef, Injector.create({
      parent: userInjector || this._injector,
      providers
    }));
    const containerRef = overlay.attach(containerPortal);
    return containerRef.instance;
  }
  _attachDialogContent(componentOrTemplateRef, dialogRef, dialogContainer, config) {
    if (componentOrTemplateRef instanceof TemplateRef) {
      const injector = this._createInjector(config, dialogRef, dialogContainer, void 0);
      let context = {
        $implicit: config.data,
        dialogRef
      };
      if (config.templateContext) {
        context = __spreadValues(__spreadValues({}, context), typeof config.templateContext === "function" ? config.templateContext() : config.templateContext);
      }
      dialogContainer.attachTemplatePortal(new TemplatePortal(componentOrTemplateRef, null, context, injector));
    } else {
      const injector = this._createInjector(config, dialogRef, dialogContainer, this._injector);
      const contentRef = dialogContainer.attachComponentPortal(new ComponentPortal(componentOrTemplateRef, config.viewContainerRef, injector));
      dialogRef.componentRef = contentRef;
      dialogRef.componentInstance = contentRef.instance;
    }
  }
  _createInjector(config, dialogRef, dialogContainer, fallbackInjector) {
    const userInjector = config.injector || config.viewContainerRef?.injector;
    const providers = [{
      provide: DIALOG_DATA,
      useValue: config.data
    }, {
      provide: DialogRef,
      useValue: dialogRef
    }];
    if (config.providers) {
      if (typeof config.providers === "function") {
        providers.push(...config.providers(dialogRef, config, dialogContainer));
      } else {
        providers.push(...config.providers);
      }
    }
    if (config.direction && (!userInjector || !userInjector.get(Directionality, null, {
      optional: true
    }))) {
      providers.push({
        provide: Directionality,
        useValue: getDirectionality(config.direction)
      });
    }
    return Injector.create({
      parent: userInjector || fallbackInjector,
      providers
    });
  }
  _removeOpenDialog(dialogRef, emitEvent) {
    const index = this.openDialogs.indexOf(dialogRef);
    if (index > -1) {
      this.openDialogs.splice(index, 1);
      if (!this.openDialogs.length) {
        this._ariaHiddenElements.forEach((previousValue, element) => {
          if (previousValue) {
            element.setAttribute("aria-hidden", previousValue);
          } else {
            element.removeAttribute("aria-hidden");
          }
        });
        this._ariaHiddenElements.clear();
        if (emitEvent) {
          this._getAfterAllClosed().next();
        }
      }
    }
  }
  _hideNonDialogContentFromAssistiveTechnology(overlayContainer) {
    if (overlayContainer.parentElement) {
      const siblings = overlayContainer.parentElement.children;
      for (let i = siblings.length - 1; i > -1; i--) {
        const sibling = siblings[i];
        if (sibling !== overlayContainer && sibling.nodeName !== "SCRIPT" && sibling.nodeName !== "STYLE" && !sibling.hasAttribute("aria-live") && !sibling.hasAttribute("popover")) {
          this._ariaHiddenElements.set(sibling, sibling.getAttribute("aria-hidden"));
          sibling.setAttribute("aria-hidden", "true");
        }
      }
    }
  }
  _getAfterAllClosed() {
    const parent = this._parentDialog;
    return parent ? parent._getAfterAllClosed() : this._afterAllClosedAtThisLevel;
  }
  static ɵfac = function Dialog_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _Dialog)();
  };
  static ɵprov = ɵɵdefineInjectable({
    token: _Dialog,
    factory: _Dialog.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Dialog, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], () => [], null);
})();
function reverseForEach(items, callback) {
  let i = items.length;
  while (i--) {
    callback(items[i]);
  }
}
var DialogModule = class _DialogModule {
  static ɵfac = function DialogModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _DialogModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _DialogModule,
    imports: [OverlayModule, PortalModule, A11yModule, CdkDialogContainer],
    exports: [PortalModule, CdkDialogContainer]
  });
  static ɵinj = ɵɵdefineInjector({
    providers: [Dialog],
    imports: [OverlayModule, PortalModule, A11yModule, PortalModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DialogModule, [{
    type: NgModule,
    args: [{
      imports: [OverlayModule, PortalModule, A11yModule, CdkDialogContainer],
      exports: [PortalModule, CdkDialogContainer],
      providers: [Dialog]
    }]
  }], null, null);
})();

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-dialog.mjs
var defaultOptions = {
  ariaDescribedBy: void 0,
  ariaLabel: void 0,
  ariaLabelledBy: void 0,
  ariaModal: true,
  attachPositions: [],
  attachTo: null,
  autoFocus: "first-tabbable",
  backdropClass: "",
  closeOnOutsidePointerEvents: false,
  disableClose: false,
  hasBackdrop: true,
  panelClass: "",
  positionStrategy: null,
  restoreFocus: true,
  role: "dialog",
  scrollStrategy: null
};
var BRN_DIALOG_DEFAULT_OPTIONS = new InjectionToken("brn-dialog-default-options", {
  providedIn: "root",
  factory: () => defaultOptions
});
function provideBrnDialogDefaultOptions(options) {
  return {
    provide: BRN_DIALOG_DEFAULT_OPTIONS,
    useValue: __spreadValues(__spreadValues({}, defaultOptions), options)
  };
}
function injectBrnDialogDefaultOptions() {
  return inject(BRN_DIALOG_DEFAULT_OPTIONS, {
    optional: true
  }) ?? defaultOptions;
}
var BrnDialogRef = class {
  _cdkDialogRef;
  _injector;
  dialogId;
  initialOptions;
  _closing = new Subject();
  closing$ = this._closing.asObservable();
  _closed = new ReplaySubject(1);
  closed$ = this._closed.asObservable();
  _stateChanged = new ReplaySubject(1);
  stateChanged$ = this._stateChanged.asObservable();
  _phase = signal("open", ...ngDevMode ? [{
    debugName: "_phase"
  }] : (
    /* istanbul ignore next */
    []
  ));
  phase = this._phase.asReadonly();
  state = computed(() => this._phase() === "open" ? "open" : "closed", ...ngDevMode ? [{
    debugName: "state"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _closeGeneration = 0;
  _panelClasses;
  _backdropClasses;
  get open() {
    return this._phase() === "open";
  }
  get id() {
    return this.initialOptions.id;
  }
  constructor(_cdkDialogRef, _injector, dialogId, initialOptions) {
    this._cdkDialogRef = _cdkDialogRef;
    this._injector = _injector;
    this.dialogId = dialogId;
    this.initialOptions = initialOptions;
    this._panelClasses = cssClassesToArray(initialOptions.panelClass);
    this._backdropClasses = cssClassesToArray(initialOptions.backdropClass);
    this._setDataState("open");
    this._stateChanged.next("open");
    this._cdkDialogRef.closed.subscribe((result) => {
      this._phase.set("closed");
      this._closed.next(result);
      this._closed.complete();
      this._closing.complete();
      this._stateChanged.complete();
    });
  }
  close(result) {
    if (!this.open) return;
    const generation = ++this._closeGeneration;
    const animationsBeforeClose = new Set(this._getActiveAnimations());
    this._phase.set("closing");
    this._setDataState("closed");
    this._closing.next();
    this._stateChanged.next("closed");
    afterNextRender(() => {
      void this._finishClose(generation, animationsBeforeClose, result);
    }, {
      injector: this._injector
    });
  }
  dismiss(reason) {
    const options = this.initialOptions;
    if (!this.open || options.disableClose) return false;
    if (reason === "outside" && !options.closeOnOutsidePointerEvents) return false;
    this.close();
    return true;
  }
  reopen() {
    if (this._phase() !== "closing") return;
    this._closeGeneration++;
    this._phase.set("open");
    this._setDataState("open");
    this._stateChanged.next("open");
  }
  forceClose(result) {
    if (this._phase() === "closed") return;
    this._closeGeneration++;
    this._phase.set("closed");
    this._cdkDialogRef.close(result);
  }
  setPanelClass(panelClass) {
    if (this._panelClasses.length) this._cdkDialogRef.removePanelClass(this._panelClasses);
    this._panelClasses = cssClassesToArray(panelClass);
    if (this._panelClasses.length) this._cdkDialogRef.addPanelClass(this._panelClasses);
  }
  setOverlayClass(overlayClass) {
    const backdrop = this._cdkDialogRef.overlayRef.backdropElement;
    if (!backdrop) return;
    backdrop.classList.remove(...this._backdropClasses);
    this._backdropClasses = cssClassesToArray(overlayClass);
    backdrop.classList.add(...this._backdropClasses);
  }
  updatePosition() {
    this._cdkDialogRef.updatePosition();
  }
  async _finishClose(generation, animationsBeforeClose, result) {
    if (generation !== this._closeGeneration || this._phase() !== "closing") return;
    const exitAnimations = this._getActiveAnimations().filter((animation) => !animationsBeforeClose.has(animation));
    for (const animation of exitAnimations) {
      animation.effect?.updateTiming({
        fill: "forwards"
      });
    }
    await waitForAnimations(exitAnimations);
    if (generation === this._closeGeneration && this._phase() === "closing") {
      this._phase.set("closed");
      this._cdkDialogRef.close(result);
    }
  }
  _getActiveAnimations() {
    return getActiveElementAnimations([this._cdkDialogRef.overlayRef.overlayElement, this._cdkDialogRef.overlayRef.backdropElement]);
  }
  _setDataState(state) {
    this._cdkDialogRef.overlayRef.overlayElement.setAttribute("data-state", state);
    this._cdkDialogRef.overlayRef.backdropElement?.setAttribute("data-state", state);
  }
};
var dialogSequence = 0;
var injectBrnDialogContext = (options = {}) => inject(DIALOG_DATA, options);
var BrnDialogService = class _BrnDialogService {
  _overlayCloseDispatcher = inject(OverlayOutsideClickDispatcher);
  _cdkDialog = inject(Dialog);
  _positionBuilder = inject(OverlayPositionBuilder);
  _scrollStrategies = inject(ScrollStrategyOptions);
  _injector = inject(Injector);
  _defaultOptions = injectBrnDialogDefaultOptions();
  open(content, vcr, context, options) {
    const dialogId = ++dialogSequence;
    const mergedOptions = __spreadProps(__spreadValues(__spreadValues({}, this._defaultOptions), options), {
      id: options?.id ?? `brn-dialog-${dialogId}`
    });
    if (this._cdkDialog.getDialogById(mergedOptions.id)) {
      throw new Error(`Dialog with ID: ${mergedOptions.id} already exists`);
    }
    const positionStrategy = mergedOptions.positionStrategy ?? (mergedOptions.attachTo && mergedOptions.attachPositions.length ? this._positionBuilder.flexibleConnectedTo(mergedOptions.attachTo).withPositions(mergedOptions.attachPositions) : this._positionBuilder.global().centerHorizontally().centerVertically());
    const scrollStrategy = mergedOptions.scrollStrategy === "close" ? this._scrollStrategies.close() : mergedOptions.scrollStrategy === "reposition" ? this._scrollStrategies.reposition() : mergedOptions.scrollStrategy ?? this._scrollStrategies.block();
    let brnDialogRef;
    const contextOrData = __spreadProps(__spreadValues({}, context), {
      close: (result = void 0) => brnDialogRef.close(result)
    });
    const cdkDialogRef = this._cdkDialog.open(content, {
      id: mergedOptions.id,
      role: mergedOptions.role,
      viewContainerRef: vcr,
      templateContext: () => ({
        $implicit: contextOrData
      }),
      data: contextOrData,
      direction: mergedOptions.direction,
      hasBackdrop: mergedOptions.hasBackdrop,
      panelClass: mergedOptions.panelClass,
      backdropClass: mergedOptions.backdropClass,
      positionStrategy,
      scrollStrategy,
      restoreFocus: mergedOptions.restoreFocus,
      disableClose: true,
      autoFocus: mergedOptions.autoFocus,
      ariaDescribedBy: mergedOptions.ariaDescribedBy === void 0 ? `brn-dialog-description-${dialogId}` : mergedOptions.ariaDescribedBy,
      ariaLabelledBy: mergedOptions.ariaLabelledBy === void 0 ? `brn-dialog-title-${dialogId}` : mergedOptions.ariaLabelledBy,
      ariaLabel: mergedOptions.ariaLabel,
      ariaModal: mergedOptions.ariaModal,
      providers: (dialogRef) => {
        brnDialogRef = new BrnDialogRef(dialogRef, this._injector, dialogId, mergedOptions);
        return this._createProviders(brnDialogRef, mergedOptions);
      }
    });
    this._connectDismissalEvents(brnDialogRef, cdkDialogRef.overlayRef);
    return brnDialogRef;
  }
  _createProviders(dialogRef, options) {
    const providers = [{
      provide: BrnDialogRef,
      useValue: dialogRef
    }];
    if (options.providers) {
      providers.push(...typeof options.providers === "function" ? options.providers() : options.providers);
    }
    return providers;
  }
  _connectDismissalEvents(dialogRef, overlayRef) {
    const closed$ = dialogRef.closed$;
    overlayRef.outsidePointerEvents().pipe(takeUntil(closed$)).subscribe(() => {
      if (this._isTopmostOutsideTarget(overlayRef)) dialogRef.dismiss("outside");
    });
    overlayRef.backdropClick().pipe(takeUntil(closed$)).subscribe(() => dialogRef.dismiss("backdrop"));
    overlayRef.keydownEvents().pipe(filter((event) => event.key === "Escape"), takeUntil(closed$)).subscribe((event) => {
      if (this._overlayCloseDispatcher._attachedOverlays.at(-1) !== overlayRef) return;
      if (dialogRef.dismiss("escape")) event.preventDefault();
    });
  }
  _isTopmostOutsideTarget(overlayRef) {
    const overlays = this._overlayCloseDispatcher._attachedOverlays;
    const index = overlays.indexOf(overlayRef);
    return index === overlays.length - 1 || overlays.length > 1 && !this._isNested(overlayRef, overlays.at(-1));
  }
  _isNested(parent, child) {
    const childOrigin = child.getConfig().positionStrategy._origin;
    if (!childOrigin) return false;
    if ("x" in childOrigin && "y" in childOrigin) {
      const rect = parent.hostElement.getBoundingClientRect();
      return childOrigin.x >= rect.left && childOrigin.x <= rect.right && childOrigin.y >= rect.top && childOrigin.y <= rect.bottom;
    }
    const element = childOrigin instanceof ElementRef ? childOrigin.nativeElement : childOrigin;
    return typeof Node !== "undefined" && element instanceof Node ? parent.hostElement.contains(element) : false;
  }
  /** @nocollapse */
  static ɵfac = function BrnDialogService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnDialogService)();
  };
  /** @nocollapse */
  static ɵprov = ɵɵdefineInjectable({
    token: _BrnDialogService,
    factory: _BrnDialogService.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnDialogService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var dialogIdSequence = 0;
var BrnDialog = class _BrnDialog {
  _dialogService = inject(BrnDialogService);
  _destroyRef = inject(DestroyRef);
  _vcr = inject(ViewContainerRef);
  _positionBuilder = inject(OverlayPositionBuilder);
  _scrollStrategies = inject(ScrollStrategyOptions);
  _injector = inject(Injector);
  _directionality = inject(Directionality);
  _defaultOptions = injectBrnDialogDefaultOptions();
  _dialogRef = signal(void 0, ...ngDevMode ? [{
    debugName: "_dialogRef"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _origin = signal(void 0, ...ngDevMode ? [{
    debugName: "_origin"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _panelClass = signal(void 0, ...ngDevMode ? [{
    debugName: "_panelClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _backdropClass = signal(void 0, ...ngDevMode ? [{
    debugName: "_backdropClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _content;
  _destroyed = false;
  _overlayClass;
  _resolvedBackdropClass = computed(() => this._backdropClass() ?? this._overlayClass?.() ?? this._defaultOptions.backdropClass, ...ngDevMode ? [{
    debugName: "_resolvedBackdropClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _resolvedPanelClass = computed(() => this._panelClass() ?? this._content?.panelClass() ?? this._defaultOptions.panelClass, ...ngDevMode ? [{
    debugName: "_resolvedPanelClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  closed = output();
  stateChanged = output();
  stateComputed = computed(() => this._dialogRef()?.state() ?? "closed", ...ngDevMode ? [{
    debugName: "stateComputed"
  }] : (
    /* istanbul ignore next */
    []
  ));
  id = input(`brn-dialog-${++dialogIdSequence}`, ...ngDevMode ? [{
    debugName: "id"
  }] : (
    /* istanbul ignore next */
    []
  ));
  state = input(null, ...ngDevMode ? [{
    debugName: "state"
  }] : (
    /* istanbul ignore next */
    []
  ));
  role = input(this._defaultOptions.role, ...ngDevMode ? [{
    debugName: "role"
  }] : (
    /* istanbul ignore next */
    []
  ));
  hasBackdrop = input(this._defaultOptions.hasBackdrop, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "hasBackdrop"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  positionStrategy = input(this._defaultOptions.positionStrategy, ...ngDevMode ? [{
    debugName: "positionStrategy"
  }] : (
    /* istanbul ignore next */
    []
  ));
  scrollStrategy = input(this._defaultOptions.scrollStrategy, ...ngDevMode ? [{
    debugName: "scrollStrategy"
  }] : (
    /* istanbul ignore next */
    []
  ));
  restoreFocus = input(this._defaultOptions.restoreFocus, ...ngDevMode ? [{
    debugName: "restoreFocus"
  }] : (
    /* istanbul ignore next */
    []
  ));
  closeOnOutsidePointerEvents = input(this._defaultOptions.closeOnOutsidePointerEvents, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "closeOnOutsidePointerEvents"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  attachTo = input(this._defaultOptions.attachTo, ...ngDevMode ? [{
    debugName: "attachTo"
  }] : (
    /* istanbul ignore next */
    []
  ));
  attachPositions = input(this._defaultOptions.attachPositions, ...ngDevMode ? [{
    debugName: "attachPositions"
  }] : (
    /* istanbul ignore next */
    []
  ));
  autoFocus = input(this._defaultOptions.autoFocus, ...ngDevMode ? [{
    debugName: "autoFocus"
  }] : (
    /* istanbul ignore next */
    []
  ));
  disableClose = input(this._defaultOptions.disableClose, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "disableClose"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  ariaDescribedBy = input(this._defaultOptions.ariaDescribedBy, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "ariaDescribedBy"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "aria-describedby"
  }));
  ariaLabelledBy = input(this._defaultOptions.ariaLabelledBy, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "ariaLabelledBy"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "aria-labelledby"
  }));
  ariaLabel = input(this._defaultOptions.ariaLabel, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "ariaLabel"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "aria-label"
  }));
  ariaModal = input(this._defaultOptions.ariaModal, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "ariaModal"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "aria-modal",
    transform: booleanAttribute
  }));
  _options = computed(() => ({
    id: this.id(),
    role: this.role(),
    direction: this._directionality.valueSignal(),
    hasBackdrop: this.hasBackdrop(),
    positionStrategy: this.getPositionStrategy(),
    scrollStrategy: this.getScrollStrategy(),
    restoreFocus: this.restoreFocus(),
    closeOnOutsidePointerEvents: this.closeOnOutsidePointerEvents(),
    attachTo: this.getAttachTo(),
    attachPositions: this.attachPositions(),
    autoFocus: this.autoFocus(),
    disableClose: this.disableClose(),
    backdropClass: cssClassesToArray(this._resolvedBackdropClass()),
    panelClass: cssClassesToArray(this._resolvedPanelClass()),
    ariaDescribedBy: this.ariaDescribedBy(),
    ariaLabelledBy: this.ariaLabelledBy(),
    ariaLabel: this.ariaLabel(),
    ariaModal: this.ariaModal()
  }), ...ngDevMode ? [{
    debugName: "_options"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    this._destroyRef.onDestroy(() => this._destroyed = true);
    this._destroyRef.onDestroy(() => this._dialogRef()?.forceClose());
    this._syncPanelClass();
    this._syncOverlayClass();
    afterNextRender(() => {
      effect(() => {
        const state = this.state();
        if (state === "open") untracked(() => this.open());
        if (state === "closed") untracked(() => this.close());
      }, {
        injector: this._injector
      });
    });
  }
  open() {
    if (!this._content) return;
    const currentRef = this._dialogRef();
    if (currentRef) {
      currentRef.reopen();
      return;
    }
    const dialogRef = this._dialogService.open(this._content.template, this._vcr, this._content.context() ?? {}, this._options());
    this._dialogRef.set(dialogRef);
    dialogRef.stateChanged$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((state) => {
      if (!this._destroyed) this.stateChanged.emit(state);
    });
    dialogRef.closed$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((result) => {
      if (this._dialogRef() === dialogRef) this._dialogRef.set(void 0);
      if (!this._destroyed) this.closed.emit(result);
    });
  }
  close(result) {
    this._dialogRef()?.close(result);
  }
  registerContent(template, context, panelClass) {
    this._content = {
      template,
      context,
      panelClass
    };
  }
  registerOverlayClass(overlayClass) {
    this._overlayClass = overlayClass;
  }
  setOrigin(origin) {
    this._origin.set(origin);
  }
  setOverlayClass(overlayClass) {
    this._backdropClass.set(overlayClass);
    this._dialogRef()?.setOverlayClass(overlayClass);
  }
  setPanelClass(panelClass) {
    this._panelClass.set(panelClass);
    this._dialogRef()?.setPanelClass(panelClass);
  }
  updatePosition() {
    this._dialogRef()?.updatePosition();
  }
  getAttachTo() {
    return this._origin() ?? this.attachTo();
  }
  getPositionStrategy() {
    return this.positionStrategy();
  }
  getScrollStrategy() {
    const strategy = this.scrollStrategy();
    if (strategy === "close") return this._scrollStrategies.close();
    if (strategy === "reposition") return this._scrollStrategies.reposition();
    return strategy;
  }
  _syncPanelClass() {
    effect(() => {
      const dialogRef = this._dialogRef();
      if (!dialogRef) return;
      const panelClass = this._resolvedPanelClass();
      untracked(() => dialogRef.setPanelClass(panelClass));
    }, {
      injector: this._injector
    });
  }
  _syncOverlayClass() {
    effect(() => {
      const dialogRef = this._dialogRef();
      if (!dialogRef) return;
      const overlayClass = this._resolvedBackdropClass();
      untracked(() => dialogRef.setOverlayClass(overlayClass));
    }, {
      injector: this._injector
    });
  }
  /** @nocollapse */
  static ɵfac = function BrnDialog_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnDialog)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnDialog,
    selectors: [["", "brnDialog", ""], ["brn-dialog"]],
    inputs: {
      id: [1, "id"],
      state: [1, "state"],
      role: [1, "role"],
      hasBackdrop: [1, "hasBackdrop"],
      positionStrategy: [1, "positionStrategy"],
      scrollStrategy: [1, "scrollStrategy"],
      restoreFocus: [1, "restoreFocus"],
      closeOnOutsidePointerEvents: [1, "closeOnOutsidePointerEvents"],
      attachTo: [1, "attachTo"],
      attachPositions: [1, "attachPositions"],
      autoFocus: [1, "autoFocus"],
      disableClose: [1, "disableClose"],
      ariaDescribedBy: [1, "aria-describedby", "ariaDescribedBy"],
      ariaLabelledBy: [1, "aria-labelledby", "ariaLabelledBy"],
      ariaLabel: [1, "aria-label", "ariaLabel"],
      ariaModal: [1, "aria-modal", "ariaModal"]
    },
    outputs: {
      closed: "closed",
      stateChanged: "stateChanged"
    },
    exportAs: ["brnDialog"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnDialog, [{
    type: Directive,
    args: [{
      selector: "[brnDialog],brn-dialog",
      exportAs: "brnDialog"
    }]
  }], () => [], {
    closed: [{
      type: Output,
      args: ["closed"]
    }],
    stateChanged: [{
      type: Output,
      args: ["stateChanged"]
    }],
    id: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "id",
        required: false
      }]
    }],
    state: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "state",
        required: false
      }]
    }],
    role: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "role",
        required: false
      }]
    }],
    hasBackdrop: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "hasBackdrop",
        required: false
      }]
    }],
    positionStrategy: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "positionStrategy",
        required: false
      }]
    }],
    scrollStrategy: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "scrollStrategy",
        required: false
      }]
    }],
    restoreFocus: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "restoreFocus",
        required: false
      }]
    }],
    closeOnOutsidePointerEvents: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "closeOnOutsidePointerEvents",
        required: false
      }]
    }],
    attachTo: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "attachTo",
        required: false
      }]
    }],
    attachPositions: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "attachPositions",
        required: false
      }]
    }],
    autoFocus: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "autoFocus",
        required: false
      }]
    }],
    disableClose: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "disableClose",
        required: false
      }]
    }],
    ariaDescribedBy: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "aria-describedby",
        required: false
      }]
    }],
    ariaLabelledBy: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "aria-labelledby",
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
    ariaModal: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "aria-modal",
        required: false
      }]
    }]
  });
})();
var BrnDialogClose = class _BrnDialogClose {
  _brnDialogRef = inject(BrnDialogRef);
  close() {
    this._brnDialogRef.close();
  }
  /** @nocollapse */
  static ɵfac = function BrnDialogClose_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnDialogClose)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnDialogClose,
    selectors: [["button", "brnDialogClose", ""]],
    hostBindings: function BrnDialogClose_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function BrnDialogClose_click_HostBindingHandler() {
          return ctx.close();
        });
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnDialogClose, [{
    type: Directive,
    args: [{
      selector: "button[brnDialogClose]",
      host: {
        "(click)": "close()"
      }
    }]
  }], null, null);
})();
var BrnDialogContent = class _BrnDialogContent {
  _brnDialog = inject(BrnDialog, {
    optional: true
  });
  _brnDialogRef = inject(BrnDialogRef, {
    optional: true
  });
  _template = inject(TemplateRef);
  state = computed(() => this._brnDialog?.stateComputed() ?? this._brnDialogRef?.state() ?? "closed", ...ngDevMode ? [{
    debugName: "state"
  }] : (
    /* istanbul ignore next */
    []
  ));
  className = input(void 0, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "className"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "class"
  }));
  context = input(void 0, ...ngDevMode ? [{
    debugName: "context"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    this._brnDialog?.registerContent(this._template, this.context, this.className);
  }
  /** @nocollapse */
  static ɵfac = function BrnDialogContent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnDialogContent)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnDialogContent,
    selectors: [["", "brnDialogContent", ""]],
    inputs: {
      className: [1, "class", "className"],
      context: [1, "context"]
    },
    features: [ɵɵProvidersFeature([provideExposesStateProviderExisting(() => _BrnDialogContent)])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnDialogContent, [{
    type: Directive,
    args: [{
      selector: "[brnDialogContent]",
      providers: [provideExposesStateProviderExisting(() => BrnDialogContent)]
    }]
  }], () => [], {
    className: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "class",
        required: false
      }]
    }],
    context: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "context",
        required: false
      }]
    }]
  });
})();
var BrnDialogDescription = class _BrnDialogDescription {
  _brnDialogRef = inject(BrnDialogRef);
  _id = `brn-dialog-description-${this._brnDialogRef.dialogId}`;
  /** @nocollapse */
  static ɵfac = function BrnDialogDescription_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnDialogDescription)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnDialogDescription,
    selectors: [["", "brnDialogDescription", ""]],
    hostVars: 1,
    hostBindings: function BrnDialogDescription_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵdomProperty("id", ctx._id);
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnDialogDescription, [{
    type: Directive,
    args: [{
      selector: "[brnDialogDescription]",
      host: {
        "[id]": "_id"
      }
    }]
  }], null, null);
})();
var BrnDialogOverlay = class _BrnDialogOverlay {
  _brnDialog = inject(BrnDialog);
  _customClass = signal(void 0, ...ngDevMode ? [{
    debugName: "_customClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  className = input(void 0, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "className"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "class"
  }));
  _resolvedClass = computed(() => this._customClass() ?? this.className(), ...ngDevMode ? [{
    debugName: "_resolvedClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    this._brnDialog.registerOverlayClass(this._resolvedClass);
  }
  setClassToCustomElement(newClass) {
    this._customClass.set(newClass);
  }
  /** @nocollapse */
  static ɵfac = function BrnDialogOverlay_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnDialogOverlay)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnDialogOverlay,
    selectors: [["", "brnDialogOverlay", ""], ["brn-dialog-overlay"]],
    inputs: {
      className: [1, "class", "className"]
    },
    features: [ɵɵProvidersFeature([provideCustomClassSettableExisting(() => _BrnDialogOverlay)])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnDialogOverlay, [{
    type: Directive,
    args: [{
      selector: "[brnDialogOverlay],brn-dialog-overlay",
      providers: [provideCustomClassSettableExisting(() => BrnDialogOverlay)]
    }]
  }], () => [], {
    className: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "class",
        required: false
      }]
    }]
  });
})();
var BrnDialogTitle = class _BrnDialogTitle {
  _brnDialogRef = inject(BrnDialogRef);
  _id = `brn-dialog-title-${this._brnDialogRef.dialogId}`;
  /** @nocollapse */
  static ɵfac = function BrnDialogTitle_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnDialogTitle)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnDialogTitle,
    selectors: [["", "brnDialogTitle", ""]],
    hostVars: 1,
    hostBindings: function BrnDialogTitle_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵdomProperty("id", ctx._id);
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnDialogTitle, [{
    type: Directive,
    args: [{
      selector: "[brnDialogTitle]",
      host: {
        "[id]": "_id"
      }
    }]
  }], null, null);
})();
var triggerIdSequence = 0;
var BrnDialogTrigger = class _BrnDialogTrigger {
  _injectedDialog = inject(BrnDialog, {
    optional: true
  });
  _dialogRef = inject(BrnDialogRef, {
    optional: true
  });
  id = input(`brn-dialog-trigger-${++triggerIdSequence}`, ...ngDevMode ? [{
    debugName: "id"
  }] : (
    /* istanbul ignore next */
    []
  ));
  type = input("button", ...ngDevMode ? [{
    debugName: "type"
  }] : (
    /* istanbul ignore next */
    []
  ));
  brnDialogTriggerFor = input(void 0, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "brnDialogTriggerFor"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    alias: "brnDialogTriggerFor"
  }));
  state = computed(() => this.getDialog()?.stateComputed() ?? this._dialogRef?.state() ?? "closed", ...ngDevMode ? [{
    debugName: "state"
  }] : (
    /* istanbul ignore next */
    []
  ));
  dialogId = computed(() => this.getDialog()?.id() ?? this._dialogRef?.id ?? null, ...ngDevMode ? [{
    debugName: "dialogId"
  }] : (
    /* istanbul ignore next */
    []
  ));
  getDialog() {
    return this.brnDialogTriggerFor() ?? this._injectedDialog ?? void 0;
  }
  open() {
    this.getDialog()?.open();
  }
  /** @nocollapse */
  static ɵfac = function BrnDialogTrigger_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnDialogTrigger)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnDialogTrigger,
    selectors: [["button", "brnDialogTrigger", ""], ["button", "brnDialogTriggerFor", ""]],
    hostAttrs: ["aria-haspopup", "dialog"],
    hostVars: 5,
    hostBindings: function BrnDialogTrigger_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function BrnDialogTrigger_click_HostBindingHandler() {
          return ctx.open();
        });
      }
      if (rf & 2) {
        ɵɵdomProperty("id", ctx.id())("type", ctx.type());
        ɵɵattribute("aria-expanded", ctx.state() === "open" ? "true" : "false")("data-state", ctx.state())("aria-controls", ctx.dialogId());
      }
    },
    inputs: {
      id: [1, "id"],
      type: [1, "type"],
      brnDialogTriggerFor: [1, "brnDialogTriggerFor"]
    },
    exportAs: ["brnDialogTrigger"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnDialogTrigger, [{
    type: Directive,
    args: [{
      selector: "button[brnDialogTrigger],button[brnDialogTriggerFor]",
      exportAs: "brnDialogTrigger",
      host: {
        "[id]": "id()",
        "(click)": "open()",
        "aria-haspopup": "dialog",
        "[attr.aria-expanded]": "state() === 'open' ? 'true' : 'false'",
        "[attr.data-state]": "state()",
        "[attr.aria-controls]": "dialogId()",
        "[type]": "type()"
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
    type: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "type",
        required: false
      }]
    }],
    brnDialogTriggerFor: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "brnDialogTriggerFor",
        required: false
      }]
    }]
  });
})();
var BrnDialogImports = [BrnDialog, BrnDialogOverlay, BrnDialogTrigger, BrnDialogClose, BrnDialogContent, BrnDialogTitle, BrnDialogDescription];

export {
  defaultOptions,
  provideBrnDialogDefaultOptions,
  injectBrnDialogDefaultOptions,
  BrnDialogRef,
  injectBrnDialogContext,
  BrnDialogService,
  BrnDialog,
  BrnDialogClose,
  BrnDialogContent,
  BrnDialogDescription,
  BrnDialogOverlay,
  BrnDialogTitle,
  BrnDialogTrigger,
  BrnDialogImports
};
//# sourceMappingURL=chunk-FJFBAHDU.js.map
