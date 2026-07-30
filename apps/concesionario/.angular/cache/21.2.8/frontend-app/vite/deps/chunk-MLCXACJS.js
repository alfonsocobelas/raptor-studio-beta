import {
  InteractivityChecker
} from "./chunk-6IE75NIU.js";
import {
  ComponentPortal,
  Overlay,
  OverlayPositionBuilder,
  ScrollStrategyOptions,
  TemplatePortal
} from "./chunk-KM2PCSLL.js";
import {
  Directionality
} from "./chunk-RU4RFFMX.js";
import {
  cssClassesToArray,
  getActiveElementAnimations,
  provideExposesStateProviderExisting,
  waitForAnimations
} from "./chunk-N5WA7HNS.js";
import {
  takeUntilDestroyed
} from "./chunk-R4LLFK3G.js";
import {
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  Output,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
  output,
  setClassMetadata,
  signal,
  untracked,
  ɵɵInheritDefinitionFeature,
  ɵɵProvidersFeature,
  ɵɵattribute,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdomProperty,
  ɵɵgetInheritedFactory,
  ɵɵlistener
} from "./chunk-BFMHQS5Q.js";
import {
  ReplaySubject,
  Subject,
  filter,
  map,
  merge,
  takeUntil
} from "./chunk-RSS3ODKE.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-overlay.mjs
var createDefaultOptions = () => ({
  attachPositions: [],
  attachTo: null,
  autoFocus: false,
  backdropClass: "",
  closeOnOutsidePointerEvents: false,
  disableClose: false,
  hasBackdrop: false,
  panelClass: "",
  positionStrategy: null,
  role: null,
  scrollStrategy: null
});
var cloneDefaultOptions = (options) => __spreadProps(__spreadValues({}, options), {
  attachPositions: [...options.attachPositions]
});
var defaultOptions = createDefaultOptions();
var BRN_OVERLAY_DEFAULT_OPTIONS = new InjectionToken("brn-overlay-default-options", {
  providedIn: "root",
  factory: createDefaultOptions
});
function provideBrnOverlayDefaultOptions(options) {
  return {
    provide: BRN_OVERLAY_DEFAULT_OPTIONS,
    useValue: cloneDefaultOptions(__spreadValues(__spreadValues({}, createDefaultOptions()), options))
  };
}
function injectBrnOverlayDefaultOptions() {
  return cloneDefaultOptions(inject(BRN_OVERLAY_DEFAULT_OPTIONS, {
    optional: true
  }) ?? defaultOptions);
}
var BRN_OVERLAY_DATA = new InjectionToken("brn-overlay-data");
var BrnOverlayRef = class {
  _overlayRef;
  _injector;
  overlayId;
  initialOptions;
  _onDisposed;
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
  constructor(_overlayRef, _injector, overlayId, initialOptions, _onDisposed) {
    this._overlayRef = _overlayRef;
    this._injector = _injector;
    this.overlayId = overlayId;
    this.initialOptions = initialOptions;
    this._onDisposed = _onDisposed;
    this._panelClasses = cssClassesToArray(initialOptions.panelClass);
    this._backdropClasses = cssClassesToArray(initialOptions.backdropClass);
    this._setDataState("open");
    this._stateChanged.next("open");
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
  dismiss(reason, target) {
    const options = this.initialOptions;
    if (!this.open || options.disableClose) return false;
    if (reason === "outside") {
      if (!options.closeOnOutsidePointerEvents) return false;
      if (this._isWithinOrigin(target)) return false;
    }
    this.close();
    return true;
  }
  /** Whether the event target sits within the overlay's origin (its trigger/anchor element). */
  _isWithinOrigin(target) {
    const origin = this.initialOptions.attachTo;
    if (!origin || !(target instanceof Node)) return false;
    const element = origin instanceof Element ? origin : "nativeElement" in origin ? origin.nativeElement : null;
    return element instanceof Element && element.contains(target);
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
    this._dispose(result);
  }
  setPanelClass(panelClass) {
    if (this._panelClasses.length) this._overlayRef.removePanelClass(this._panelClasses);
    this._panelClasses = cssClassesToArray(panelClass);
    if (this._panelClasses.length) this._overlayRef.addPanelClass(this._panelClasses);
  }
  setBackdropClass(backdropClass) {
    const backdrop = this._overlayRef.backdropElement;
    if (!backdrop) return;
    backdrop.classList.remove(...this._backdropClasses);
    this._backdropClasses = cssClassesToArray(backdropClass);
    backdrop.classList.add(...this._backdropClasses);
  }
  updatePosition() {
    this._overlayRef.updatePosition();
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
      this._dispose(result);
    }
  }
  _dispose(result) {
    this._phase.set("closed");
    this._overlayRef.dispose();
    this._onDisposed();
    this._closed.next(result);
    this._closed.complete();
    this._closing.complete();
    this._stateChanged.complete();
  }
  _getActiveAnimations() {
    return getActiveElementAnimations([this._overlayRef.overlayElement, this._overlayRef.backdropElement]);
  }
  _setDataState(state) {
    this._overlayRef.overlayElement.setAttribute("data-state", state);
    this._overlayRef.backdropElement?.setAttribute("data-state", state);
  }
};
var overlaySequence = 0;
var BrnOverlayService = class _BrnOverlayService {
  _overlay = inject(Overlay);
  _positionBuilder = inject(OverlayPositionBuilder);
  _scrollStrategies = inject(ScrollStrategyOptions);
  _injector = inject(Injector);
  _interactivityChecker = inject(InteractivityChecker);
  _defaultOptions = injectBrnOverlayDefaultOptions();
  _openOverlayIds = /* @__PURE__ */ new Set();
  _overlayStack = [];
  open(content, vcr, context, options) {
    const overlayId = ++overlaySequence;
    const mergedOptions = __spreadProps(__spreadValues(__spreadValues({}, this._defaultOptions), options), {
      id: options?.id ?? `brn-overlay-${overlayId}`
    });
    if (this._openOverlayIds.has(mergedOptions.id)) {
      throw new Error(`Overlay with ID: ${mergedOptions.id} already exists`);
    }
    const overlayRef = this._overlay.create({
      positionStrategy: mergedOptions.positionStrategy ?? (mergedOptions.attachTo && mergedOptions.attachPositions.length ? this._positionBuilder.flexibleConnectedTo(mergedOptions.attachTo).withPositions(mergedOptions.attachPositions) : this._positionBuilder.global().centerHorizontally().centerVertically()),
      scrollStrategy: mergedOptions.scrollStrategy === "close" ? this._scrollStrategies.close() : mergedOptions.scrollStrategy === "reposition" ? this._scrollStrategies.reposition() : mergedOptions.scrollStrategy ?? this._scrollStrategies.block(),
      hasBackdrop: mergedOptions.hasBackdrop,
      panelClass: mergedOptions.panelClass,
      backdropClass: mergedOptions.backdropClass,
      direction: mergedOptions.direction
    });
    const destroyed = new Subject();
    const brnOverlayRef = new BrnOverlayRef(overlayRef, this._injector, overlayId, mergedOptions, () => {
      destroyed.next();
      destroyed.complete();
      this._openOverlayIds.delete(mergedOptions.id);
      this._removeFromStack(overlayRef);
    });
    const contextOrData = __spreadProps(__spreadValues({}, context), {
      close: (result = void 0) => brnOverlayRef.close(result)
    });
    const portalInjector = Injector.create({
      parent: vcr?.injector ?? this._injector,
      providers: this._createProviders(brnOverlayRef, contextOrData, mergedOptions)
    });
    this._configureElement(overlayRef, mergedOptions);
    this._openOverlayIds.add(mergedOptions.id);
    this._overlayStack.push(overlayRef);
    this._connectDismissalEvents(brnOverlayRef, overlayRef, destroyed);
    overlayRef.detachments().pipe(takeUntil(destroyed)).subscribe(() => brnOverlayRef.forceClose());
    try {
      if (content instanceof TemplateRef) {
        if (!vcr) throw new Error("A ViewContainerRef is required to open an overlay from a TemplateRef");
        overlayRef.attach(new TemplatePortal(content, vcr, {
          $implicit: contextOrData
        }, portalInjector));
      } else {
        overlayRef.attach(new ComponentPortal(content, vcr, portalInjector));
      }
    } catch (error) {
      brnOverlayRef.forceClose();
      throw error;
    }
    if (mergedOptions.autoFocus) {
      this._focusInitialElement(overlayRef, destroyed);
    }
    return brnOverlayRef;
  }
  /**
   * Moves focus to the first tabbable element inside the overlay once its content has rendered.
   * If the overlay has no tabbable content (e.g. a select listbox), focus is left untouched so the
   * trigger keeps it - this is what keeps the `aria-activedescendant` keyboard model working.
   */
  _focusInitialElement(overlayRef, destroyed) {
    let cancelled = false;
    destroyed.subscribe(() => cancelled = true);
    afterNextRender(() => {
      if (cancelled) return;
      const root = overlayRef.overlayElement;
      if (!root) return;
      const target = this._firstTabbableElement(root);
      target?.focus();
    }, {
      injector: this._injector
    });
  }
  _firstTabbableElement(root) {
    const candidates = root.querySelectorAll('a[href], button, input, textarea, select, [tabindex], [contenteditable="true"]');
    for (const candidate of Array.from(candidates)) {
      if (this._interactivityChecker.isTabbable(candidate)) return candidate;
    }
    return null;
  }
  _createProviders(ref, context, options) {
    const providers = [{
      provide: BrnOverlayRef,
      useValue: ref
    }, {
      provide: BRN_OVERLAY_DATA,
      useValue: context
    }];
    if (options.providers) {
      providers.push(...typeof options.providers === "function" ? options.providers() : options.providers);
    }
    return providers;
  }
  _configureElement(overlayRef, options) {
    const element = overlayRef.overlayElement;
    element.id = options.id;
    if (options.role) {
      element.tabIndex = -1;
      element.setAttribute("role", options.role);
    }
  }
  _connectDismissalEvents(ref, overlayRef, destroyed) {
    merge(overlayRef.outsidePointerEvents().pipe(map((event) => ({
      event,
      reason: "outside"
    }))), overlayRef.backdropClick().pipe(map((event) => ({
      event,
      reason: "backdrop"
    }))), overlayRef.keydownEvents().pipe(filter((event) => event.key === "Escape"), map((event) => ({
      event,
      reason: "escape"
    })))).pipe(takeUntil(destroyed)).subscribe(({
      event,
      reason
    }) => this._requestDismissal(ref, overlayRef, reason, event));
  }
  _requestDismissal(ref, overlayRef, reason, event) {
    if (this._overlayStack.at(-1) !== overlayRef) return;
    if (ref.dismiss(reason, event.target) && reason === "escape") event.preventDefault();
  }
  _removeFromStack(overlayRef) {
    const index = this._overlayStack.indexOf(overlayRef);
    if (index !== -1) this._overlayStack.splice(index, 1);
  }
  /** @nocollapse */
  static ɵfac = function BrnOverlayService_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnOverlayService)();
  };
  /** @nocollapse */
  static ɵprov = ɵɵdefineInjectable({
    token: _BrnOverlayService,
    factory: _BrnOverlayService.ɵfac,
    providedIn: "root"
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnOverlayService, [{
    type: Injectable,
    args: [{
      providedIn: "root"
    }]
  }], null, null);
})();
var overlayIdSequence = 0;
var BrnOverlay = class _BrnOverlay {
  _overlayService = inject(BrnOverlayService);
  _destroyRef = inject(DestroyRef);
  _vcr = inject(ViewContainerRef);
  _positionBuilder = inject(OverlayPositionBuilder);
  _scrollStrategies = inject(ScrollStrategyOptions);
  _injector = inject(Injector);
  _directionality = inject(Directionality);
  _document = inject(DOCUMENT);
  _defaultOptions = this.getDefaultOptions();
  _overlayRef = signal(void 0, ...ngDevMode ? [{
    debugName: "_overlayRef"
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
  _resolvedBackdropClass = computed(() => this._backdropClass() ?? this._defaultOptions.backdropClass, ...ngDevMode ? [{
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
  stateComputed = computed(() => this._overlayRef()?.state() ?? "closed", ...ngDevMode ? [{
    debugName: "stateComputed"
  }] : (
    /* istanbul ignore next */
    []
  ));
  id = input(`brn-overlay-${++overlayIdSequence}`, ...ngDevMode ? [{
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
  disableClose = input(this._defaultOptions.disableClose, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "disableClose"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  autoFocus = input(this._defaultOptions.autoFocus, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "autoFocus"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  _options = computed(() => ({
    id: this.id(),
    role: this.role(),
    direction: this._directionality.valueSignal(),
    hasBackdrop: this.hasBackdrop(),
    positionStrategy: this.getPositionStrategy(),
    scrollStrategy: this.getScrollStrategy(),
    closeOnOutsidePointerEvents: this.closeOnOutsidePointerEvents(),
    attachTo: this.getAttachTo(),
    attachPositions: this.getAttachPositions(),
    disableClose: this.disableClose(),
    autoFocus: this.autoFocus(),
    backdropClass: cssClassesToArray(this._resolvedBackdropClass()),
    panelClass: cssClassesToArray(this._resolvedPanelClass())
  }), ...ngDevMode ? [{
    debugName: "_options"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    this._destroyRef.onDestroy(() => this._destroyed = true);
    this._destroyRef.onDestroy(() => this._overlayRef()?.forceClose());
    this._syncPanelClass();
    this._syncBackdropClass();
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
  getDefaultOptions() {
    return injectBrnOverlayDefaultOptions();
  }
  open() {
    if (!this._content) return;
    const currentRef = this._overlayRef();
    if (currentRef) {
      currentRef.reopen();
      return;
    }
    const elementToRestoreFocusTo = this._document.activeElement;
    const overlayRef = this._overlayService.open(this._content.template, this._vcr, this._content.context() ?? {}, this._options());
    this._overlayRef.set(overlayRef);
    overlayRef.stateChanged$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((state) => {
      if (!this._destroyed) this.stateChanged.emit(state);
    });
    overlayRef.closed$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((result) => {
      if (this._overlayRef() === overlayRef) this._overlayRef.set(void 0);
      this._restoreFocus(elementToRestoreFocusTo);
      if (!this._destroyed) this.closed.emit(result);
    });
  }
  close(result) {
    this._overlayRef()?.close(result);
  }
  toggle(result) {
    this.stateComputed() === "open" ? this.close(result) : this.open();
  }
  registerContent(template, context, panelClass) {
    this._content = {
      template,
      context,
      panelClass
    };
  }
  setOrigin(origin) {
    this._origin.set(origin);
  }
  setOverlayClass(overlayClass) {
    this._backdropClass.set(overlayClass);
    this._overlayRef()?.setBackdropClass(overlayClass);
  }
  setPanelClass(panelClass) {
    this._panelClass.set(panelClass);
    this._overlayRef()?.setPanelClass(panelClass);
  }
  updatePosition() {
    this._overlayRef()?.updatePosition();
  }
  getAttachTo() {
    return this._origin() ?? this.attachTo();
  }
  getAttachPositions() {
    return this.attachPositions();
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
  _restoreFocus(element) {
    const HTMLElementCtor = this._document.defaultView?.HTMLElement;
    if (!HTMLElementCtor || !(element instanceof HTMLElementCtor) || element === this._document.body || !element.isConnected) {
      return;
    }
    const activeElement = this._document.activeElement;
    const shouldRestoreFocus = activeElement === this._document.body || !activeElement || !activeElement.isConnected;
    if (shouldRestoreFocus) element.focus({
      preventScroll: true
    });
  }
  _syncPanelClass() {
    effect(() => {
      const overlayRef = this._overlayRef();
      if (!overlayRef) return;
      const panelClass = this._resolvedPanelClass();
      untracked(() => overlayRef.setPanelClass(panelClass));
    }, {
      injector: this._injector
    });
  }
  _syncBackdropClass() {
    effect(() => {
      const overlayRef = this._overlayRef();
      if (!overlayRef) return;
      const backdropClass = this._resolvedBackdropClass();
      untracked(() => overlayRef.setBackdropClass(backdropClass));
    }, {
      injector: this._injector
    });
  }
  /** @nocollapse */
  static ɵfac = function BrnOverlay_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnOverlay)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnOverlay,
    selectors: [["", "brnOverlay", ""], ["brn-overlay"]],
    inputs: {
      id: [1, "id"],
      state: [1, "state"],
      role: [1, "role"],
      hasBackdrop: [1, "hasBackdrop"],
      positionStrategy: [1, "positionStrategy"],
      scrollStrategy: [1, "scrollStrategy"],
      closeOnOutsidePointerEvents: [1, "closeOnOutsidePointerEvents"],
      attachTo: [1, "attachTo"],
      attachPositions: [1, "attachPositions"],
      disableClose: [1, "disableClose"],
      autoFocus: [1, "autoFocus"]
    },
    outputs: {
      closed: "closed",
      stateChanged: "stateChanged"
    },
    exportAs: ["brnOverlay"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnOverlay, [{
    type: Directive,
    args: [{
      selector: "[brnOverlay],brn-overlay",
      exportAs: "brnOverlay"
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
    disableClose: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "disableClose",
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
    }]
  });
})();
var BrnOverlayClose = class _BrnOverlayClose {
  _brnOverlayRef = inject(BrnOverlayRef);
  close() {
    this._brnOverlayRef.close();
  }
  /** @nocollapse */
  static ɵfac = function BrnOverlayClose_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnOverlayClose)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnOverlayClose,
    selectors: [["button", "brnOverlayClose", ""]],
    hostBindings: function BrnOverlayClose_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function BrnOverlayClose_click_HostBindingHandler() {
          return ctx.close();
        });
      }
    }
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnOverlayClose, [{
    type: Directive,
    args: [{
      selector: "button[brnOverlayClose]",
      host: {
        "(click)": "close()"
      }
    }]
  }], null, null);
})();
var BrnOverlayContent = class _BrnOverlayContent {
  _brnOverlay = inject(BrnOverlay, {
    optional: true
  });
  _brnOverlayRef = inject(BrnOverlayRef, {
    optional: true
  });
  _template = inject(TemplateRef);
  state = computed(() => this._brnOverlay?.stateComputed() ?? this._brnOverlayRef?.state() ?? "closed", ...ngDevMode ? [{
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
    this._brnOverlay?.registerContent(this._template, this.context, this.className);
  }
  /** @nocollapse */
  static ɵfac = function BrnOverlayContent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnOverlayContent)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnOverlayContent,
    selectors: [["", "brnOverlayContent", ""]],
    inputs: {
      className: [1, "class", "className"],
      context: [1, "context"]
    },
    features: [ɵɵProvidersFeature([provideExposesStateProviderExisting(() => _BrnOverlayContent)])]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnOverlayContent, [{
    type: Directive,
    args: [{
      selector: "[brnOverlayContent]",
      providers: [provideExposesStateProviderExisting(() => BrnOverlayContent)]
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
var triggerIdSequence = 0;
var BrnOverlayTrigger = class _BrnOverlayTrigger {
  _injectedOverlay = inject(BrnOverlay, {
    optional: true
  });
  _overlayRef = inject(BrnOverlayRef, {
    optional: true
  });
  id = input(`brn-overlay-trigger-${++triggerIdSequence}`, ...ngDevMode ? [{
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
  brnOverlayTriggerFor = input(void 0, ...ngDevMode ? [{
    debugName: "brnOverlayTriggerFor"
  }] : (
    /* istanbul ignore next */
    []
  ));
  state = computed(() => this.getOverlay()?.stateComputed() ?? this._overlayRef?.state() ?? "closed", ...ngDevMode ? [{
    debugName: "state"
  }] : (
    /* istanbul ignore next */
    []
  ));
  overlayId = computed(() => this.getOverlay()?.id() ?? this._overlayRef?.id ?? null, ...ngDevMode ? [{
    debugName: "overlayId"
  }] : (
    /* istanbul ignore next */
    []
  ));
  getOverlay() {
    return this.brnOverlayTriggerFor() ?? this._injectedOverlay ?? void 0;
  }
  open() {
    this.getOverlay()?.open();
  }
  toggle() {
    this.getOverlay()?.toggle();
  }
  /** @nocollapse */
  static ɵfac = function BrnOverlayTrigger_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnOverlayTrigger)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnOverlayTrigger,
    selectors: [["button", "brnOverlayTrigger", ""], ["button", "brnOverlayTriggerFor", ""]],
    hostVars: 5,
    hostBindings: function BrnOverlayTrigger_HostBindings(rf, ctx) {
      if (rf & 1) {
        ɵɵlistener("click", function BrnOverlayTrigger_click_HostBindingHandler() {
          return ctx.toggle();
        });
      }
      if (rf & 2) {
        ɵɵdomProperty("id", ctx.id())("type", ctx.type());
        ɵɵattribute("aria-expanded", ctx.state() === "open" ? "true" : "false")("data-state", ctx.state())("aria-controls", ctx.overlayId());
      }
    },
    inputs: {
      id: [1, "id"],
      type: [1, "type"],
      brnOverlayTriggerFor: [1, "brnOverlayTriggerFor"]
    },
    exportAs: ["brnOverlayTrigger"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnOverlayTrigger, [{
    type: Directive,
    args: [{
      selector: "button[brnOverlayTrigger],button[brnOverlayTriggerFor]",
      exportAs: "brnOverlayTrigger",
      host: {
        "[id]": "id()",
        "(click)": "toggle()",
        "[attr.aria-expanded]": "state() === 'open' ? 'true' : 'false'",
        "[attr.data-state]": "state()",
        "[attr.aria-controls]": "overlayId()",
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
    brnOverlayTriggerFor: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "brnOverlayTriggerFor",
        required: false
      }]
    }]
  });
})();

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-popover.mjs
var defaultConfig = {
  align: "center",
  sideOffset: 0,
  offsetX: 0
};
var BrnPopoverConfigToken = new InjectionToken("BrnPopoverConfig");
function provideBrnPopoverConfig(config) {
  return {
    provide: BrnPopoverConfigToken,
    useValue: __spreadValues(__spreadValues({}, defaultConfig), config)
  };
}
function injectBrnPopoverConfig() {
  return inject(BrnPopoverConfigToken, {
    optional: true
  }) ?? defaultConfig;
}
var BRN_POPOVER_OVERLAY_DEFAULT_OPTIONS = __spreadProps(__spreadValues({}, defaultOptions), {
  autoFocus: true,
  closeOnOutsidePointerEvents: true,
  hasBackdrop: false,
  role: "dialog",
  scrollStrategy: "reposition"
});
var BRN_POPOVER_DEFAULT_OPTIONS = new InjectionToken("brn-popover-default-options", {
  providedIn: "root",
  factory: () => BRN_POPOVER_OVERLAY_DEFAULT_OPTIONS
});
function provideBrnPopoverDefaultOptions(options) {
  return {
    provide: BRN_POPOVER_DEFAULT_OPTIONS,
    useValue: __spreadValues(__spreadValues({}, BRN_POPOVER_OVERLAY_DEFAULT_OPTIONS), options)
  };
}
function injectBrnPopoverDefaultOptions() {
  return inject(BRN_POPOVER_DEFAULT_OPTIONS, {
    optional: true
  }) ?? BRN_POPOVER_OVERLAY_DEFAULT_OPTIONS;
}
var BRN_POPOVER_DIALOG_DEFAULT_OPTIONS = BRN_POPOVER_OVERLAY_DEFAULT_OPTIONS;
var BrnPopover = class _BrnPopover extends BrnOverlay {
  _config = injectBrnPopoverConfig();
  align = input(this._config.align, ...ngDevMode ? [{
    debugName: "align"
  }] : (
    /* istanbul ignore next */
    []
  ));
  sideOffset = input(this._config.sideOffset, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "sideOffset"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: numberAttribute
  }));
  offsetX = input(this._config.offsetX, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "offsetX"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: numberAttribute
  }));
  getDefaultOptions() {
    return injectBrnPopoverDefaultOptions();
  }
  getAttachPositions() {
    const align = this.align();
    const sideOffset = this.sideOffset();
    const offsetX = this.offsetX();
    return [{
      originX: align,
      originY: "bottom",
      overlayX: align,
      overlayY: "top",
      offsetX,
      offsetY: sideOffset
    }, {
      originX: align,
      originY: "top",
      overlayX: align,
      overlayY: "bottom",
      offsetX,
      offsetY: -sideOffset
    }];
  }
  getPositionStrategy() {
    const attachTo = this.getAttachTo();
    if (!attachTo) return super.getPositionStrategy();
    return this._positionBuilder.flexibleConnectedTo(attachTo).withPositions(this.getAttachPositions()).withPush(false);
  }
  /** @nocollapse */
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵBrnPopover_BaseFactory;
    return function BrnPopover_Factory(__ngFactoryType__) {
      return (ɵBrnPopover_BaseFactory || (ɵBrnPopover_BaseFactory = ɵɵgetInheritedFactory(_BrnPopover)))(__ngFactoryType__ || _BrnPopover);
    };
  })();
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnPopover,
    selectors: [["", "brnPopover", ""], ["brn-popover"]],
    inputs: {
      align: [1, "align"],
      sideOffset: [1, "sideOffset"],
      offsetX: [1, "offsetX"]
    },
    exportAs: ["brnPopover"],
    features: [ɵɵProvidersFeature([{
      provide: BrnOverlay,
      useExisting: forwardRef(() => _BrnPopover)
    }, provideBrnOverlayDefaultOptions(BRN_POPOVER_OVERLAY_DEFAULT_OPTIONS)]), ɵɵInheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnPopover, [{
    type: Directive,
    args: [{
      selector: "[brnPopover],brn-popover",
      exportAs: "brnPopover",
      providers: [{
        provide: BrnOverlay,
        useExisting: forwardRef(() => BrnPopover)
      }, provideBrnOverlayDefaultOptions(BRN_POPOVER_OVERLAY_DEFAULT_OPTIONS)]
    }]
  }], null, {
    align: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "align",
        required: false
      }]
    }],
    sideOffset: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "sideOffset",
        required: false
      }]
    }],
    offsetX: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "offsetX",
        required: false
      }]
    }]
  });
})();
var BrnPopoverContent = class _BrnPopoverContent extends BrnOverlayContent {
  /** @nocollapse */
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵBrnPopoverContent_BaseFactory;
    return function BrnPopoverContent_Factory(__ngFactoryType__) {
      return (ɵBrnPopoverContent_BaseFactory || (ɵBrnPopoverContent_BaseFactory = ɵɵgetInheritedFactory(_BrnPopoverContent)))(__ngFactoryType__ || _BrnPopoverContent);
    };
  })();
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnPopoverContent,
    selectors: [["", "brnPopoverContent", ""]],
    features: [ɵɵProvidersFeature([provideExposesStateProviderExisting(() => _BrnPopoverContent)]), ɵɵInheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnPopoverContent, [{
    type: Directive,
    args: [{
      selector: "[brnPopoverContent]",
      providers: [provideExposesStateProviderExisting(() => BrnPopoverContent)]
    }]
  }], null, null);
})();
var BrnPopoverTrigger = class _BrnPopoverTrigger extends BrnOverlayTrigger {
  _host = inject(ElementRef, {
    host: true
  });
  brnPopoverTriggerFor = input(void 0, ...ngDevMode ? [{
    debugName: "brnPopoverTriggerFor"
  }] : (
    /* istanbul ignore next */
    []
  ));
  getOverlay() {
    return this.brnPopoverTriggerFor() ?? super.getOverlay();
  }
  open() {
    const popover = this.getOverlay();
    if (!popover) return;
    popover.setOrigin(this._host.nativeElement);
    popover.open();
  }
  toggle() {
    const popover = this.getOverlay();
    if (!popover) return;
    popover.setOrigin(this._host.nativeElement);
    popover.toggle();
  }
  /** @nocollapse */
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵBrnPopoverTrigger_BaseFactory;
    return function BrnPopoverTrigger_Factory(__ngFactoryType__) {
      return (ɵBrnPopoverTrigger_BaseFactory || (ɵBrnPopoverTrigger_BaseFactory = ɵɵgetInheritedFactory(_BrnPopoverTrigger)))(__ngFactoryType__ || _BrnPopoverTrigger);
    };
  })();
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnPopoverTrigger,
    selectors: [["button", "brnPopoverTrigger", ""], ["button", "brnPopoverTriggerFor", ""]],
    hostAttrs: ["aria-haspopup", "dialog"],
    hostVars: 5,
    hostBindings: function BrnPopoverTrigger_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵdomProperty("id", ctx.id())("type", ctx.type());
        ɵɵattribute("aria-expanded", ctx.state() === "open" ? "true" : "false")("data-state", ctx.state())("aria-controls", ctx.overlayId());
      }
    },
    inputs: {
      brnPopoverTriggerFor: [1, "brnPopoverTriggerFor"]
    },
    features: [ɵɵInheritDefinitionFeature]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnPopoverTrigger, [{
    type: Directive,
    args: [{
      selector: "button[brnPopoverTrigger],button[brnPopoverTriggerFor]",
      host: {
        "[id]": "id()",
        "aria-haspopup": "dialog",
        "[attr.aria-expanded]": "state() === 'open' ? 'true': 'false'",
        "[attr.data-state]": "state()",
        "[attr.aria-controls]": "overlayId()",
        "[type]": "type()"
      }
    }]
  }], null, {
    brnPopoverTriggerFor: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "brnPopoverTriggerFor",
        required: false
      }]
    }]
  });
})();
var BrnPopoverImports = [BrnPopover, BrnPopoverTrigger, BrnPopoverContent];

export {
  BrnOverlay,
  provideBrnPopoverConfig,
  injectBrnPopoverConfig,
  BRN_POPOVER_OVERLAY_DEFAULT_OPTIONS,
  provideBrnPopoverDefaultOptions,
  injectBrnPopoverDefaultOptions,
  BRN_POPOVER_DIALOG_DEFAULT_OPTIONS,
  BrnPopover,
  BrnPopoverContent,
  BrnPopoverTrigger,
  BrnPopoverImports
};
//# sourceMappingURL=chunk-MLCXACJS.js.map
