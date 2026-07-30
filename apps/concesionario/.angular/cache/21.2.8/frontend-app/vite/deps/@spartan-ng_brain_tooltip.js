import {
  ComponentPortal,
  Overlay,
  OverlayPositionBuilder
} from "./chunk-KM2PCSLL.js";
import "./chunk-C3FLKRDF.js";
import {
  Directionality
} from "./chunk-RU4RFFMX.js";
import {
  injectSkipDelay,
  waitForElementAnimations
} from "./chunk-N5WA7HNS.js";
import {
  takeUntilDestroyed
} from "./chunk-R4LLFK3G.js";
import "./chunk-LAHHEQBJ.js";
import "./chunk-JK5PHBUV.js";
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  InjectionToken,
  Injector,
  Input,
  Output,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  output,
  runInInjectionContext,
  setClassMetadata,
  signal,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵelement,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-BFMHQS5Q.js";
import {
  Subject,
  map,
  of,
  switchMap,
  timer
} from "./chunk-RSS3ODKE.js";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-GOMI4DH3.js";

// node_modules/@spartan-ng/brain/fesm2022/spartan-ng-brain-tooltip.mjs
function BrnTooltipContent_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtext(1);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r0 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r0._tooltipText());
  }
}
function isTemplateRef(value) {
  return value instanceof TemplateRef;
}
var BrnTooltipStringTemplateOutlet = class _BrnTooltipStringTemplateOutlet {
  _viewContainer = inject(ViewContainerRef);
  _templateRef = inject(TemplateRef);
  _embeddedViewRef = null;
  _context = {};
  _isFirstChange = true;
  _lastOutletWasTemplate = false;
  _lastTemplateRef = null;
  _lastContext;
  brnTooltipStringTemplateOutletContext = input(void 0, ...ngDevMode ? [{
    debugName: "brnTooltipStringTemplateOutletContext"
  }] : (
    /* istanbul ignore next */
    []
  ));
  brnTooltipStringTemplateOutlet = input.required(...ngDevMode ? [{
    debugName: "brnTooltipStringTemplateOutlet"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _hasContextShapeChanged(context) {
    if (!context) {
      return false;
    }
    const prevCtxKeys = Object.keys(this._lastContext || {});
    const currCtxKeys = Object.keys(context || {});
    if (prevCtxKeys.length === currCtxKeys.length) {
      for (const propName of currCtxKeys) {
        if (!prevCtxKeys.includes(propName)) {
          return true;
        }
      }
      return false;
    } else {
      return true;
    }
  }
  _shouldViewBeRecreated(stringTemplateOutlet, stringTemplateOutletContext) {
    const isTemplate = isTemplateRef(stringTemplateOutlet);
    const shouldOutletRecreate = this._isFirstChange || isTemplate !== this._lastOutletWasTemplate || isTemplate && stringTemplateOutlet !== this._lastTemplateRef;
    const shouldContextRecreate = this._hasContextShapeChanged(stringTemplateOutletContext);
    return shouldContextRecreate || shouldOutletRecreate;
  }
  _updateTrackingState(stringTemplateOutlet, stringTemplateOutletContext) {
    const isTemplate = isTemplateRef(stringTemplateOutlet);
    if (this._isFirstChange && !isTemplate) {
      this._isFirstChange = false;
    }
    if (stringTemplateOutletContext !== void 0) {
      this._lastContext = stringTemplateOutletContext;
    }
    this._lastOutletWasTemplate = isTemplate;
    this._lastTemplateRef = isTemplate ? stringTemplateOutlet : null;
  }
  _viewEffect = effect(() => {
    const stringTemplateOutlet = this.brnTooltipStringTemplateOutlet();
    const stringTemplateOutletContext = this.brnTooltipStringTemplateOutletContext();
    if (!this._isFirstChange && isTemplateRef(stringTemplateOutlet)) {
      this._isFirstChange = true;
    }
    if (!isTemplateRef(stringTemplateOutlet)) {
      this._context["$implicit"] = stringTemplateOutlet;
    }
    const recreateView = this._shouldViewBeRecreated(stringTemplateOutlet, stringTemplateOutletContext);
    this._updateTrackingState(stringTemplateOutlet, stringTemplateOutletContext);
    if (recreateView) {
      this._recreateView(stringTemplateOutlet, stringTemplateOutletContext);
    } else {
      this._updateContext(stringTemplateOutlet, stringTemplateOutletContext);
    }
  }, ...ngDevMode ? [{
    debugName: "_viewEffect"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _recreateView(outlet, context) {
    this._viewContainer.clear();
    if (isTemplateRef(outlet)) {
      this._embeddedViewRef = this._viewContainer.createEmbeddedView(outlet, context);
    } else {
      this._embeddedViewRef = this._viewContainer.createEmbeddedView(this._templateRef, this._context);
    }
  }
  _updateContext(outlet, context) {
    const newCtx = isTemplateRef(outlet) ? context : this._context;
    let oldCtx = this._embeddedViewRef?.context;
    if (!oldCtx) {
      oldCtx = newCtx;
    } else if (newCtx && typeof newCtx === "object") {
      for (const propName of Object.keys(newCtx)) {
        oldCtx[propName] = newCtx[propName];
      }
    }
    this._lastContext = oldCtx;
  }
  static ngTemplateContextGuard(_dir, _ctx) {
    return true;
  }
  ngOnDestroy() {
    this._viewEffect.destroy();
    this._viewContainer.clear();
    this._embeddedViewRef = null;
  }
  /** @nocollapse */
  static ɵfac = function BrnTooltipStringTemplateOutlet_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnTooltipStringTemplateOutlet)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnTooltipStringTemplateOutlet,
    selectors: [["", "brnTooltipStringTemplateOutlet", ""]],
    inputs: {
      brnTooltipStringTemplateOutletContext: [1, "brnTooltipStringTemplateOutletContext"],
      brnTooltipStringTemplateOutlet: [1, "brnTooltipStringTemplateOutlet"]
    },
    exportAs: ["brnTooltipStringTemplateOutlet"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnTooltipStringTemplateOutlet, [{
    type: Directive,
    args: [{
      selector: "[brnTooltipStringTemplateOutlet]",
      exportAs: "brnTooltipStringTemplateOutlet"
    }]
  }], null, {
    brnTooltipStringTemplateOutletContext: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "brnTooltipStringTemplateOutletContext",
        required: false
      }]
    }],
    brnTooltipStringTemplateOutlet: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "brnTooltipStringTemplateOutlet",
        required: true
      }]
    }]
  });
})();
var uniqueId = 0;
var BrnTooltipContent = class _BrnTooltipContent {
  id = input(`brn-tooltip-${++uniqueId}`, ...ngDevMode ? [{
    debugName: "id"
  }] : (
    /* istanbul ignore next */
    []
  ));
  state = signal("closed", ...ngDevMode ? [{
    debugName: "state"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _tooltipClass = signal("", ...ngDevMode ? [{
    debugName: "_tooltipClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _arrowClass = signal("", ...ngDevMode ? [{
    debugName: "_arrowClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _svgClass = signal("", ...ngDevMode ? [{
    debugName: "_svgClass"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _position = signal("top", ...ngDevMode ? [{
    debugName: "_position"
  }] : (
    /* istanbul ignore next */
    []
  ));
  _tooltipText = signal(null, ...ngDevMode ? [{
    debugName: "_tooltipText"
  }] : (
    /* istanbul ignore next */
    []
  ));
  setProps(tooltipText, position, tooltipClasses, arrowClasses, svgClasses) {
    if (tooltipText) {
      this._tooltipText.set(tooltipText);
    }
    this._position.set(position);
    this._tooltipClass.set(tooltipClasses);
    this._arrowClass.set(arrowClasses);
    this._svgClass.set(svgClasses);
  }
  /** @nocollapse */
  static ɵfac = function BrnTooltipContent_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnTooltipContent)();
  };
  /** @nocollapse */
  static ɵcmp = ɵɵdefineComponent({
    type: _BrnTooltipContent,
    selectors: [["ng-component"]],
    hostAttrs: ["role", "tooltip"],
    hostVars: 5,
    hostBindings: function BrnTooltipContent_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵattribute("id", ctx.id())("data-side", ctx._position())("data-state", ctx.state());
        ɵɵclassMap(ctx._tooltipClass());
      }
    },
    inputs: {
      id: [1, "id"]
    },
    decls: 4,
    vars: 5,
    consts: [[4, "brnTooltipStringTemplateOutlet"], ["width", "10", "height", "5", "viewBox", "0 0 30 10", "preserveAspectRatio", "none"], ["points", "0,0 30,0 15,10"]],
    template: function BrnTooltipContent_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵtemplate(0, BrnTooltipContent_ng_container_0_Template, 2, 1, "ng-container", 0);
        ɵɵelementStart(1, "span");
        ɵɵnamespaceSVG();
        ɵɵelementStart(2, "svg", 1);
        ɵɵelement(3, "polygon", 2);
        ɵɵelementEnd()();
      }
      if (rf & 2) {
        ɵɵproperty("brnTooltipStringTemplateOutlet", ctx._tooltipText());
        ɵɵadvance();
        ɵɵclassMap(ctx._arrowClass());
        ɵɵadvance();
        ɵɵclassMap(ctx._svgClass());
      }
    },
    dependencies: [BrnTooltipStringTemplateOutlet],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnTooltipContent, [{
    type: Component,
    args: [{
      imports: [BrnTooltipStringTemplateOutlet],
      changeDetection: ChangeDetectionStrategy.OnPush,
      host: {
        "[class]": "_tooltipClass()",
        "[attr.id]": "id()",
        "[attr.data-side]": "_position()",
        "[attr.data-state]": "state()",
        role: "tooltip"
      },
      template: `
		<ng-container *brnTooltipStringTemplateOutlet="_tooltipText()">{{ _tooltipText() }}</ng-container>

		<span [class]="_arrowClass()">
			<svg [class]="_svgClass()" width="10" height="5" viewBox="0 0 30 10" preserveAspectRatio="none">
				<polygon points="0,0 30,0 15,10" />
			</svg>
		</span>
	`
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
var defaultGroupOptions = {
  skipDelayDuration: 300
};
var BRN_TOOLTIP_GROUP_OPTIONS = new InjectionToken("BrnTooltipGroupOptions");
var BrnTooltipGroup = class _BrnTooltipGroup {
  _options = inject(BRN_TOOLTIP_GROUP_OPTIONS);
  _skipDelay = injectSkipDelay(() => this._options.skipDelayDuration);
  /** Whether the next tooltip waits for its show delay, or opens instantly within the skip window. */
  isOpenDelayed = this._skipDelay.isOpenDelayed;
  onOpen() {
    this._skipDelay.open();
  }
  onClose() {
    this._skipDelay.close();
  }
  /** @nocollapse */
  static ɵfac = function BrnTooltipGroup_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnTooltipGroup)();
  };
  /** @nocollapse */
  static ɵprov = ɵɵdefineInjectable({
    token: _BrnTooltipGroup,
    factory: _BrnTooltipGroup.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnTooltipGroup, [{
    type: Injectable
  }], null, null);
})();
function provideBrnTooltipGroup(options) {
  return [{
    provide: BRN_TOOLTIP_GROUP_OPTIONS,
    useValue: __spreadValues(__spreadValues({}, defaultGroupOptions), options)
  }, BrnTooltipGroup];
}
var BRN_TOOLTIP_POSITIONS_MAP = {
  top: {
    originX: "center",
    originY: "top",
    overlayX: "center",
    overlayY: "bottom",
    offsetY: -8
  },
  bottom: {
    originX: "center",
    originY: "bottom",
    overlayX: "center",
    overlayY: "top",
    offsetY: 8
  },
  left: {
    originX: "start",
    originY: "center",
    overlayX: "end",
    overlayY: "center",
    offsetX: -8
  },
  right: {
    originX: "end",
    originY: "center",
    overlayX: "start",
    overlayY: "center",
    offsetX: 8
  }
};
var BRN_TOOLTIP_FALLBACK_POSITIONS = {
  top: ["bottom", "right", "left"],
  bottom: ["top", "right", "left"],
  left: ["right", "top", "bottom"],
  right: ["left", "top", "bottom"]
};
function resolveTooltipPosition(pair) {
  for (const [pos, config] of Object.entries(BRN_TOOLTIP_POSITIONS_MAP)) {
    if (pair.originX === config.originX && pair.originY === config.originY && pair.overlayX === config.overlayX && pair.overlayY === config.overlayY) {
      return pos;
    }
  }
  return null;
}
var defaultOptions = {
  showDelay: 150,
  hideDelay: 100,
  svgClasses: "",
  arrowClasses: () => "",
  tooltipContentClasses: ""
};
var BRN_TOOLTIP_DEFAULT_OPTIONS = new InjectionToken("brn-tooltip-default-options", {
  providedIn: "root",
  factory: () => defaultOptions
});
function provideBrnTooltipDefaultOptions(options) {
  return {
    provide: BRN_TOOLTIP_DEFAULT_OPTIONS,
    useValue: __spreadValues(__spreadValues({}, defaultOptions), options)
  };
}
function injectBrnTooltipDefaultOptions() {
  return inject(BRN_TOOLTIP_DEFAULT_OPTIONS, {
    optional: true
  }) ?? defaultOptions;
}
var BrnTooltip = class _BrnTooltip {
  _config = injectBrnTooltipDefaultOptions();
  _destroyRef = inject(DestroyRef);
  _document = inject(DOCUMENT);
  _elementRef = inject(ElementRef);
  _injector = inject(Injector);
  _overlay = inject(Overlay);
  _overlayPositionBuilder = inject(OverlayPositionBuilder);
  _renderer = inject(Renderer2);
  _dir = inject(Directionality);
  _group = inject(BrnTooltipGroup, {
    optional: true
  });
  _tooltipHovered = false;
  _listenersRefs = [];
  _delaySubject = void 0;
  _componentRef = void 0;
  _overlayRef = void 0;
  _ariaEffectRef = void 0;
  _positionChangeSub = void 0;
  /** Bumped on every close/show so a pending exit-animation teardown can detect it was superseded. */
  _closeGeneration = 0;
  /** The position currently applied to the content - the CDK-resolved one after a flip, not the raw input. */
  _activePosition = void 0;
  tooltipDisabled = input(false, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "tooltipDisabled"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: booleanAttribute
  }));
  mutableTooltipDisabled = linkedSignal(this.tooltipDisabled, ...ngDevMode ? [{
    debugName: "mutableTooltipDisabled"
  }] : (
    /* istanbul ignore next */
    []
  ));
  position = input(this._config.position ?? "top", ...ngDevMode ? [{
    debugName: "position"
  }] : (
    /* istanbul ignore next */
    []
  ));
  brnTooltip = input(null, ...ngDevMode ? [{
    debugName: "brnTooltip"
  }] : (
    /* istanbul ignore next */
    []
  ));
  showDelay = input(this._config.showDelay, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "showDelay"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: numberAttribute
  }));
  hideDelay = input(this._config.hideDelay, __spreadProps(__spreadValues({}, ngDevMode ? {
    debugName: "hideDelay"
  } : (
    /* istanbul ignore next */
    {}
  )), {
    transform: numberAttribute
  }));
  show = output();
  hide = output();
  _tooltipText = computed(() => {
    let tooltipText = this.brnTooltip();
    if (!tooltipText) {
      return "";
    } else if (typeof tooltipText === "string") {
      tooltipText = tooltipText.trim();
    }
    return tooltipText;
  }, ...ngDevMode ? [{
    debugName: "_tooltipText"
  }] : (
    /* istanbul ignore next */
    []
  ));
  constructor() {
    afterNextRender(() => {
      this._overlayRef = this._overlay.create({
        direction: this._dir,
        positionStrategy: this._buildPositionStrategy()
      });
      this._dir.change.pipe(takeUntilDestroyed(this._destroyRef)).subscribe(() => {
        if (this._overlayRef) {
          this._updatePosition();
          if (this._overlayRef.hasAttached()) {
            this._overlayRef.updatePosition();
          }
        }
      });
      runInInjectionContext(this._injector, () => {
        if (!this._overlayRef) return;
        this._setupDelayMechanism();
        this._cleanupTriggerEvents();
        this._initTriggers();
        effect(() => {
          const text = this._tooltipText();
          if (this._componentRef) {
            this._applyContentProps(this._componentRef.instance, this._activePosition ?? this.position(), text);
          }
        });
        this._listenersRefs = [...this._listenersRefs, this._renderer.listen(this._overlayRef.hostElement, "pointerenter", (event) => {
          if (this._isHoverPointer(event)) this._tooltipHovered = true;
        }), this._renderer.listen(this._overlayRef.hostElement, "pointerleave", (event) => {
          if (!this._isHoverPointer(event)) return;
          this._tooltipHovered = false;
          this.delay(false, this.hideDelay());
        })];
      });
    });
    this._destroyRef.onDestroy(() => {
      this._clearAriaDescribedBy();
      this._delaySubject?.complete();
      this._cleanupTriggerEvents();
      this._overlayRef?.dispose();
    });
  }
  _updatePosition() {
    const strategy = this._overlayRef?.getConfig().positionStrategy;
    if (strategy) {
      strategy.withPositions(this._getAllPositions());
    }
  }
  _buildPositionStrategy() {
    return this._overlayPositionBuilder.flexibleConnectedTo(this._elementRef).withPositions(this._getAllPositions()).withViewportMargin(8);
  }
  /** Build [preferred, ...fallbacks] position array for viewport-aware auto-flip. */
  _getAllPositions() {
    const preferred = this.position();
    return [preferred, ...BRN_TOOLTIP_FALLBACK_POSITIONS[preferred]].map((pos) => this._getAdjustedPositionFor(pos));
  }
  _getAdjustedPositionFor(pos) {
    const position = BRN_TOOLTIP_POSITIONS_MAP[pos];
    const isLtr = this._dir.value !== "rtl";
    const baseOffsetX = position.offsetX != null ? isLtr ? position.offsetX : -position.offsetX : 0;
    const baseOffsetY = position.offsetY ?? 0;
    const {
      x: compensationX,
      y: compensationY
    } = this._getVisualViewportCompensation(position, isLtr);
    return __spreadProps(__spreadValues({}, position), {
      offsetX: baseOffsetX + compensationX,
      offsetY: baseOffsetY + compensationY
    });
  }
  /**
   * Corrects overlay placement for the layout-vs-visual viewport mismatch on mobile browsers.
   *
   * Tooltips only open on hover/focus, but a hovering pen (e.g. Apple Pencil on iOS Safari) can open
   * one on a phone/tablet where this bites: as the browser's toolbars collapse the visual viewport
   * grows, yet `documentElement.clientHeight`/`clientWidth` stay frozen at the toolbar-expanded size.
   * CDK anchors bottom/right overlays from those stale dimensions (top/left overlays measure from the
   * pinned top-left edge and are unaffected), so a `position: 'top'` tooltip lands shifted by the delta.
   *
   * We fold that delta back in as an offset. It is 0 whenever the viewports match (desktop, or toolbar
   * expanded), so this is a no-op everywhere except the collapsed-toolbar case it targets.
   */
  _getVisualViewportCompensation(position, isLtr) {
    const visualViewport = this._document.defaultView?.visualViewport;
    if (!visualViewport) return {
      x: 0,
      y: 0
    };
    const pinnedToTopLeft = Math.abs(visualViewport.offsetTop) < 1 && Math.abs(visualViewport.offsetLeft) < 1;
    if (Math.abs(visualViewport.scale - 1) > 0.01 || !pinnedToTopLeft) return {
      x: 0,
      y: 0
    };
    const docEl = this._document.documentElement;
    const anchorsFromBottom = position.overlayY === "bottom";
    const anchorsFromRight = isLtr ? position.overlayX === "end" : position.overlayX === "start";
    return {
      x: anchorsFromRight ? docEl.clientWidth - visualViewport.width : 0,
      y: anchorsFromBottom ? docEl.clientHeight - visualViewport.height : 0
    };
  }
  _initTriggers() {
    this._initScrollListener();
    this._initHoverListeners();
  }
  /**
   * Tooltips are supplementary labels for a trigger that already has its own action, so - like Radix
   * and Base UI - they open only on mouse/pen hover and keyboard focus, never on touch (a touch tap
   * would both fire the trigger's action and the tooltip). Touch pointers are ignored via
   * `_isHoverPointer`; use a popover when touch users need to see the content.
   */
  _initHoverListeners() {
    this._listenersRefs = [...this._listenersRefs, this._renderer.listen(this._elementRef.nativeElement, "pointerenter", (event) => {
      if (this._isHoverPointer(event)) this._requestShow();
    }), this._renderer.listen(this._elementRef.nativeElement, "pointerleave", (event) => {
      if (this._isHoverPointer(event)) this.delay(false, this.hideDelay());
    }), this._renderer.listen(this._elementRef.nativeElement, "focus", () => this._requestShow()), this._renderer.listen(this._elementRef.nativeElement, "blur", () => this.delay(false, this.hideDelay()))];
  }
  _isHoverPointer(event) {
    return event.pointerType === "mouse" || event.pointerType === "pen";
  }
  /** Snapshot the group skip decision once, so the delay and the instant-open state agree even if a
   *  sibling flips the window during the show delay. */
  _requestShow() {
    const skip = !!this._group && !this._group.isOpenDelayed();
    this.delay(true, skip ? 0 : this.showDelay(), skip);
  }
  _initScrollListener() {
    this._listenersRefs = [...this._listenersRefs, this._renderer.listen(this._document.defaultView, "scroll", () => this._hide())];
  }
  _cleanupTriggerEvents() {
    for (const eventRef of this._listenersRefs) {
      eventRef();
    }
    this._listenersRefs = [];
  }
  delay(isShow, delay = -1, instant = false) {
    this._delaySubject?.next({
      isShow,
      delay,
      instant
    });
  }
  _setupDelayMechanism() {
    this._delaySubject?.complete();
    this._delaySubject = new Subject();
    this._delaySubject.pipe(switchMap((config) => config.delay < 0 ? of(config) : timer(config.delay).pipe(map(() => config))), takeUntilDestroyed(this._destroyRef)).subscribe((config) => {
      if (config.isShow) {
        this._show(config.instant);
      } else {
        this._hide();
      }
    });
  }
  _show(instant = false) {
    if (!this._tooltipText() || this.mutableTooltipDisabled()) {
      return;
    }
    this._updatePosition();
    const openState = instant ? "instant-open" : "open";
    if (this._componentRef) {
      if (this._componentRef.instance.state() === "closed") {
        this._closeGeneration++;
        this._componentRef.instance.state.set(openState);
        this._applyContentProps(this._componentRef.instance, this._activePosition ?? this.position());
        this._group?.onOpen();
        this.show.emit();
      }
      return;
    }
    const tooltipPortal = new ComponentPortal(BrnTooltipContent);
    this._componentRef = this._overlayRef?.attach(tooltipPortal);
    this._componentRef?.onDestroy(() => {
      this._componentRef = void 0;
    });
    this._componentRef?.instance.state.set(openState);
    this._group?.onOpen();
    if (this._componentRef) {
      this._applyContentProps(this._componentRef.instance, this.position());
    }
    const strategy = this._overlayRef?.getConfig().positionStrategy;
    if (strategy && this._componentRef) {
      const compRef = this._componentRef;
      this._positionChangeSub = strategy.positionChanges.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((change) => {
        const resolved = resolveTooltipPosition(change.connectionPair);
        if (resolved) {
          this._applyContentProps(compRef.instance, resolved, null);
        }
      });
    }
    runInInjectionContext(this._injector, () => {
      this._ariaEffectRef = effect(() => {
        const tooltipId = this._componentRef?.instance.id();
        if (tooltipId) {
          this._renderer.setAttribute(this._elementRef.nativeElement, "aria-describedby", tooltipId);
          this._ariaEffectRef?.destroy();
          this._ariaEffectRef = void 0;
        }
      }, ...ngDevMode ? [{
        debugName: "_ariaEffectRef"
      }] : (
        /* istanbul ignore next */
        []
      ));
    });
    this.show.emit();
  }
  /** Apply text + position (and the position-derived classes) to the content, recording the position as
   *  active. Pass `text = null` for a position-only update that keeps the content's existing text. */
  _applyContentProps(content, position, text = this._tooltipText()) {
    this._activePosition = position;
    content.setProps(text, position, this._config.tooltipContentClasses, this._config.arrowClasses(position), this._config.svgClasses);
  }
  _hide() {
    if (!this._componentRef || this._tooltipHovered) return;
    if (this._componentRef.instance.state() === "closed") return;
    this._componentRef.instance.state.set("closed");
    this._group?.onClose();
    this.hide.emit();
    this._scheduleDetach(this._componentRef);
  }
  /**
   * Keep the content mounted until its `data-[state=closed]` exit animation finishes, then tear it
   * down. A re-show (revive) bumps `_closeGeneration`, which cancels the pending detach.
   */
  _scheduleDetach(componentRef) {
    const generation = ++this._closeGeneration;
    const content = componentRef.location.nativeElement;
    afterNextRender(() => {
      void waitForElementAnimations(content).then(() => {
        if (generation === this._closeGeneration) this._detach();
      });
    }, {
      injector: this._injector
    });
  }
  _detach() {
    this._clearAriaDescribedBy();
    this._positionChangeSub?.unsubscribe();
    this._positionChangeSub = void 0;
    this._renderer.removeAttribute(this._elementRef.nativeElement, "aria-describedby");
    this._overlayRef?.detach();
  }
  _clearAriaDescribedBy() {
    if (this._ariaEffectRef) {
      this._ariaEffectRef.destroy();
      this._ariaEffectRef = void 0;
    }
  }
  /** @nocollapse */
  static ɵfac = function BrnTooltip_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _BrnTooltip)();
  };
  /** @nocollapse */
  static ɵdir = ɵɵdefineDirective({
    type: _BrnTooltip,
    selectors: [["", "brnTooltip", ""]],
    inputs: {
      tooltipDisabled: [1, "tooltipDisabled"],
      position: [1, "position"],
      brnTooltip: [1, "brnTooltip"],
      showDelay: [1, "showDelay"],
      hideDelay: [1, "hideDelay"]
    },
    outputs: {
      show: "show",
      hide: "hide"
    },
    exportAs: ["brnTooltip"]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BrnTooltip, [{
    type: Directive,
    args: [{
      selector: "[brnTooltip]",
      exportAs: "brnTooltip"
    }]
  }], () => [], {
    tooltipDisabled: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "tooltipDisabled",
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
    brnTooltip: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "brnTooltip",
        required: false
      }]
    }],
    showDelay: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "showDelay",
        required: false
      }]
    }],
    hideDelay: [{
      type: Input,
      args: [{
        isSignal: true,
        alias: "hideDelay",
        required: false
      }]
    }],
    show: [{
      type: Output,
      args: ["show"]
    }],
    hide: [{
      type: Output,
      args: ["hide"]
    }]
  });
})();
var BrnTooltipImports = [BrnTooltip, BrnTooltipContent];
export {
  BRN_TOOLTIP_FALLBACK_POSITIONS,
  BrnTooltip,
  BrnTooltipContent,
  BrnTooltipGroup,
  BrnTooltipImports,
  defaultOptions,
  injectBrnTooltipDefaultOptions,
  provideBrnTooltipDefaultOptions,
  provideBrnTooltipGroup,
  resolveTooltipPosition
};
//# sourceMappingURL=@spartan-ng_brain_tooltip.js.map
