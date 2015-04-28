(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof famousflex === 'undefined') {
    famousflex = {};
}

famousflex.FlexScrollView = require('../src/FlexScrollView');
famousflex.FlowLayoutNode = require('../src/FlowLayoutNode');
famousflex.LayoutContext = require('../src/LayoutContext');
famousflex.LayoutController = require('../src/LayoutController');
famousflex.LayoutNode = require('../src/LayoutNode');
famousflex.LayoutNodeManager = require('../src/LayoutNodeManager');
famousflex.LayoutUtility = require('../src/LayoutUtility');
famousflex.ScrollController = require('../src/ScrollController');
famousflex.VirtualViewSequence = require('../src/VirtualViewSequence');
famousflex.AnimationController = require('../src/AnimationController');

famousflex.widgets = famousflex.widgets || {};
famousflex.widgets.DatePicker = require('../src/widgets/DatePicker');
famousflex.widgets.TabBar = require('../src/widgets/TabBar');

famousflex.layouts = famousflex.layouts || {};
famousflex.layouts.CollectionLayout = require('../src/layouts/CollectionLayout');
famousflex.layouts.CoverLayout = require('../src/layouts/CoverLayout');
famousflex.layouts.CubeLayout = require('../src/layouts/CubeLayout');
famousflex.layouts.GridLayout = require('../src/layouts/GridLayout');
famousflex.layouts.HeaderFooterLayout = require('../src/layouts/HeaderFooterLayout');
famousflex.layouts.ListLayout = require('../src/layouts/ListLayout');
famousflex.layouts.NavBarLayout = require('../src/layouts/NavBarLayout');
famousflex.layouts.ProportionalLayout = require('../src/layouts/ProportionalLayout');
famousflex.layouts.WheelLayout = require('../src/layouts/WheelLayout');

famousflex.helpers = famousflex.helpers || {};
famousflex.helpers.LayoutDockHelper = require('../src/helpers/LayoutDockHelper');

},{"../src/AnimationController":2,"../src/FlexScrollView":3,"../src/FlowLayoutNode":4,"../src/LayoutContext":5,"../src/LayoutController":6,"../src/LayoutNode":7,"../src/LayoutNodeManager":8,"../src/LayoutUtility":9,"../src/ScrollController":10,"../src/VirtualViewSequence":11,"../src/helpers/LayoutDockHelper":12,"../src/layouts/CollectionLayout":13,"../src/layouts/CoverLayout":14,"../src/layouts/CubeLayout":15,"../src/layouts/GridLayout":16,"../src/layouts/HeaderFooterLayout":17,"../src/layouts/ListLayout":18,"../src/layouts/NavBarLayout":19,"../src/layouts/ProportionalLayout":20,"../src/layouts/WheelLayout":22,"../src/widgets/DatePicker":23,"../src/widgets/TabBar":25}],2:[function(require,module,exports){
(function (global){
var View = typeof window !== 'undefined' ? window.famous.core.View : typeof global !== 'undefined' ? global.famous.core.View : null;
var LayoutController = require('./LayoutController');
var Transform = typeof window !== 'undefined' ? window.famous.core.Transform : typeof global !== 'undefined' ? global.famous.core.Transform : null;
var Modifier = typeof window !== 'undefined' ? window.famous.core.Modifier : typeof global !== 'undefined' ? global.famous.core.Modifier : null;
var StateModifier = typeof window !== 'undefined' ? window.famous.modifiers.StateModifier : typeof global !== 'undefined' ? global.famous.modifiers.StateModifier : null;
var RenderNode = typeof window !== 'undefined' ? window.famous.core.RenderNode : typeof global !== 'undefined' ? global.famous.core.RenderNode : null;
var Timer = typeof window !== 'undefined' ? window.famous.utilities.Timer : typeof global !== 'undefined' ? global.famous.utilities.Timer : null;
var Easing = typeof window !== 'undefined' ? window.famous.transitions.Easing : typeof global !== 'undefined' ? global.famous.transitions.Easing : null;
function AnimationController(options) {
    View.apply(this, arguments);
    _createLayout.call(this);
    if (options) {
        this.setOptions(options);
    }
}
AnimationController.prototype = Object.create(View.prototype);
AnimationController.prototype.constructor = AnimationController;
AnimationController.Animation = {
    Slide: {
        Left: function (show, size) {
            return { transform: Transform.translate(show ? size[0] : -size[0], 0, 0) };
        },
        Right: function (show, size) {
            return { transform: Transform.translate(show ? -size[0] : size[0], 0, 0) };
        },
        Up: function (show, size) {
            return { transform: Transform.translate(0, show ? size[1] : -size[1], 0) };
        },
        Down: function (show, size) {
            return { transform: Transform.translate(0, show ? -size[1] : size[1], 0) };
        }
    },
    Fade: function (show, size, opacity) {
        return { opacity: opacity === undefined ? 0 : opacity };
    },
    Zoom: function (show, size, scale) {
        return {
            transform: Transform.scale(scale ? scale[0] : 0.5, scale ? scale[1] : 0.5, 1),
            align: [
                0.5,
                0.5
            ],
            origin: [
                0.5,
                0.5
            ]
        };
    }
};
AnimationController.DEFAULT_OPTIONS = {
    transition: {
        duration: 400,
        curve: Easing.inOutQuad
    },
    animation: AnimationController.Animation.Fade,
    show: {},
    hide: {},
    transfer: { zIndex: 10 },
    zIndexOffset: 0
};
var ItemState = {
        NONE: 0,
        HIDE: 1,
        HIDING: 2,
        SHOW: 3,
        SHOWING: 4,
        VISIBLE: 5,
        QUEUED: 6
    };
function ViewStackLayout(context, options) {
    var set = {
            size: context.size,
            translate: [
                0,
                0,
                0
            ]
        };
    var views = context.get('views');
    var transferables = context.get('transferables');
    for (var i = 0; i < Math.min(views.length, 2); i++) {
        var item = this._viewStack[i];
        switch (item.state) {
        case ItemState.HIDE:
        case ItemState.HIDING:
        case ItemState.VISIBLE:
        case ItemState.SHOW:
        case ItemState.SHOWING:
            var view = views[i];
            context.set(view, set);
            for (var j = 0; j < transferables.length; j++) {
                for (var k = 0; k < item.transferables.length; k++) {
                    if (transferables[j].renderNode === item.transferables[k].renderNode) {
                        context.set(transferables[j], {
                            translate: [
                                0,
                                0,
                                set.translate[2]
                            ],
                            size: [
                                context.size[0],
                                context.size[1]
                            ]
                        });
                    }
                }
            }
            set.translate[2] += options.zIndexOffset;
            break;
        }
    }
}
function _createLayout() {
    this._renderables = {
        views: [],
        transferables: []
    };
    this._viewStack = [];
    this.layout = new LayoutController({
        layout: ViewStackLayout.bind(this),
        layoutOptions: this.options,
        dataSource: this._renderables
    });
    this.add(this.layout);
    this.layout.on('layoutend', _startAnimations.bind(this));
}
function _getViewSpec(item, view, id, callback) {
    if (!item.view) {
        return;
    }
    var spec = view.getSpec(id);
    if (spec) {
        callback(spec);
    } else {
        Timer.after(_getViewSpec.bind(this, item, view, id, callback), 1);
    }
}
function _getTransferable(item, view, id) {
    if (view.getTransferable) {
        return view.getTransferable(id);
    }
    if (view.getSpec && view.get && view.replace) {
        if (view.get(id) !== undefined) {
            return {
                get: function () {
                    return view.get(id);
                },
                show: function (renderable) {
                    view.replace(id, renderable);
                },
                getSpec: _getViewSpec.bind(this, item, view, id)
            };
        }
    }
    if (view.layout) {
        return _getTransferable.call(this, item, view.layout, id);
    }
}
function _startTransferableAnimations(item, prevItem) {
    for (var sourceId in item.options.transfer.items) {
        _startTransferableAnimation.call(this, item, prevItem, sourceId);
    }
}
function _startTransferableAnimation(item, prevItem, sourceId) {
    var target = item.options.transfer.items[sourceId];
    var transferable = {};
    transferable.source = _getTransferable.call(this, prevItem, prevItem.view, sourceId);
    if (Array.isArray(target)) {
        for (var i = 0; i < target.length; i++) {
            transferable.target = _getTransferable.call(this, item, item.view, target[i]);
            if (transferable.target) {
                break;
            }
        }
    } else {
        transferable.target = _getTransferable.call(this, item, item.view, target);
    }
    if (transferable.source && transferable.target) {
        transferable.source.getSpec(function (sourceSpec) {
            transferable.originalSource = transferable.source.get();
            transferable.source.show(new RenderNode(new Modifier(sourceSpec)));
            transferable.originalTarget = transferable.target.get();
            var targetNode = new RenderNode(new Modifier({ opacity: 0 }));
            targetNode.add(transferable.originalTarget);
            transferable.target.show(targetNode);
            var zIndexMod = new Modifier({ transform: Transform.translate(0, 0, item.options.transfer.zIndex) });
            var mod = new StateModifier(sourceSpec);
            transferable.renderNode = new RenderNode(zIndexMod);
            transferable.renderNode.add(mod).add(transferable.originalSource);
            item.transferables.push(transferable);
            this._renderables.transferables.push(transferable.renderNode);
            this.layout.reflowLayout();
            Timer.after(function () {
                transferable.target.getSpec(function (targetSpec, transition) {
                    mod.halt();
                    if (sourceSpec.transform || targetSpec.transform) {
                        mod.setTransform(targetSpec.transform || Transform.identity, transition || item.options.transfer.transition);
                    }
                    if (sourceSpec.opacity !== undefined || targetSpec.opacity !== undefined) {
                        mod.setOpacity(targetSpec.opacity === undefined ? 1 : targetSpec.opacity, transition || item.options.transfer.transition);
                    }
                    if (sourceSpec.size || targetSpec.size) {
                        mod.setSize(targetSpec.size || sourceSpec.size, transition || item.options.transfer.transition);
                    }
                }, true);
            }, 1);
        }.bind(this), false);
    }
}
function _endTransferableAnimations(item) {
    for (var j = 0; j < item.transferables.length; j++) {
        var transferable = item.transferables[j];
        for (var i = 0; i < this._renderables.transferables.length; i++) {
            if (this._renderables.transferables[i] === transferable.renderNode) {
                this._renderables.transferables.splice(i, 1);
                break;
            }
        }
        transferable.source.show(transferable.originalSource);
        transferable.target.show(transferable.originalTarget);
    }
    item.transferables = [];
    this.layout.reflowLayout();
}
function _startAnimations(event) {
    var prevItem;
    for (var i = 0; i < this._viewStack.length; i++) {
        var item = this._viewStack[i];
        switch (item.state) {
        case ItemState.HIDE:
            item.state = ItemState.HIDING;
            _startAnimation.call(this, item, prevItem, event.size, false);
            _updateState.call(this);
            break;
        case ItemState.SHOW:
            item.state = ItemState.SHOWING;
            _startAnimation.call(this, item, prevItem, event.size, true);
            _updateState.call(this);
            break;
        }
        prevItem = item;
    }
}
function _startAnimation(item, prevItem, size, show) {
    var animation = show ? item.options.show.animation : item.options.hide.animation;
    var spec = animation ? animation(show, size) : {};
    item.mod.halt();
    var callback;
    if (show) {
        callback = item.showCallback;
        if (spec.transform) {
            item.mod.setTransform(spec.transform);
            item.mod.setTransform(Transform.identity, item.options.show.transition, callback);
            callback = undefined;
        }
        if (spec.opacity !== undefined) {
            item.mod.setOpacity(spec.opacity);
            item.mod.setOpacity(1, item.options.show.transition, callback);
            callback = undefined;
        }
        if (spec.align) {
            item.mod.setAlign(spec.align);
        }
        if (spec.origin) {
            item.mod.setOrigin(spec.origin);
        }
        if (prevItem) {
            _startTransferableAnimations.call(this, item, prevItem);
        }
        if (callback) {
            callback();
        }
    } else {
        callback = item.hideCallback;
        if (spec.transform) {
            item.mod.setTransform(spec.transform, item.options.hide.transition, callback);
            callback = undefined;
        }
        if (spec.opacity !== undefined) {
            item.mod.setOpacity(spec.opacity, item.options.hide.transition, callback);
            callback = undefined;
        }
        if (callback) {
            callback();
        }
    }
}
function _createItem(view, options, callback) {
    var item = {
            view: view,
            mod: new StateModifier(),
            state: ItemState.QUEUED,
            options: {
                show: {
                    transition: this.options.show.transition || this.options.transition,
                    animation: this.options.show.animation || this.options.animation
                },
                hide: {
                    transition: this.options.hide.transition || this.options.transition,
                    animation: this.options.hide.animation || this.options.animation
                },
                transfer: {
                    transition: this.options.transfer.transition || this.options.transition,
                    items: this.options.transfer.items || {},
                    zIndex: this.options.transfer.zIndex
                }
            },
            callback: callback,
            transferables: []
        };
    if (options) {
        item.options.show.transition = (options.show ? options.show.transition : undefined) || options.transition || item.options.show.transition;
        item.options.show.animation = (options.show ? options.show.animation : undefined) || options.animation || item.options.show.animation;
        item.options.transfer.transition = (options.transfer ? options.transfer.transition : undefined) || options.transition || item.options.transfer.transition;
        item.options.transfer.items = (options.transfer ? options.transfer.items : undefined) || item.options.transfer.items;
        item.options.transfer.zIndex = options.transfer && options.transfer.zIndex !== undefined ? options.transfer.zIndex : item.options.transfer.zIndex;
    }
    item.node = new RenderNode(item.mod);
    item.node.add(view);
    return item;
}
function _updateState() {
    var prevItem;
    var invalidated = false;
    for (var i = 0; i < Math.min(this._viewStack.length, 2); i++) {
        var item = this._viewStack[i];
        if (item.state === ItemState.QUEUED) {
            if (!prevItem || prevItem.state === ItemState.VISIBLE || prevItem.state === ItemState.HIDING) {
                if (prevItem && prevItem.state === ItemState.VISIBLE) {
                    prevItem.state = ItemState.HIDE;
                }
                item.state = ItemState.SHOW;
                invalidated = true;
            }
            break;
        } else if (item.state === ItemState.VISIBLE && item.hide) {
            item.state = ItemState.HIDE;
        }
        if (item.state === ItemState.SHOW || item.state === ItemState.HIDE) {
            this.layout.reflowLayout();
        }
        prevItem = item;
    }
    if (invalidated) {
        _updateState.call(this);
        this.layout.reflowLayout();
    }
}
AnimationController.prototype.show = function (renderable, options, callback) {
    if (!renderable) {
        return this.hide(options, callback);
    }
    var item = this._viewStack.length ? this._viewStack[this._viewStack.length - 1] : undefined;
    if (item && item.view === renderable) {
        item.hide = false;
        return this;
    }
    if (item && item.state !== ItemState.HIDING && options) {
        item.options.hide.transition = (options.hide ? options.hide.transition : undefined) || options.transition || item.options.hide.transition;
        item.options.hide.animation = (options.hide ? options.hide.animation : undefined) || options.animation || item.options.hide.animation;
    }
    item = _createItem.call(this, renderable, options, callback);
    item.showCallback = function () {
        item.state = ItemState.VISIBLE;
        _updateState.call(this);
        _endTransferableAnimations.call(this, item);
        if (callback) {
            callback();
        }
    }.bind(this);
    item.hideCallback = function () {
        var index = this._viewStack.indexOf(item);
        this._renderables.views.splice(index, 1);
        this._viewStack.splice(index, 1);
        item.view = undefined;
        _updateState.call(this);
    }.bind(this);
    this._renderables.views.push(item.node);
    this._viewStack.push(item);
    _updateState.call(this);
    return this;
};
AnimationController.prototype.hide = function (options, callback) {
    var item = this._viewStack.length ? this._viewStack[this._viewStack.length - 1] : undefined;
    if (!item || item.state === ItemState.HIDING) {
        return this;
    }
    item.hide = true;
    if (options) {
        item.options.hide.transition = (options.hide ? options.hide.transition : undefined) || options.transition || item.options.hide.transition;
        item.options.hide.animation = (options.hide ? options.hide.animation : undefined) || options.animation || item.options.hide.animation;
    }
    item.hideCallback = function () {
        var index = this._viewStack.indexOf(item);
        this._renderables.views.splice(index, 1);
        this._viewStack.splice(index, 1);
        item.view = undefined;
        _updateState.call(this);
        if (callback) {
            callback();
        }
    }.bind(this);
    _updateState.call(this);
    return this;
};
AnimationController.prototype.halt = function () {
    for (var i = 0; i < this._viewStack.length; i++) {
        var item = this._viewStack[this._viewStack.length - 1];
        if (item.state === ItemState.QUEUED || item.state === ItemState.SHOW) {
            this._renderables.views.splice(this._viewStack.length - 1, 1);
            this._viewStack.splice(this._viewStack.length - 1, 1);
            item.view = undefined;
        } else {
            break;
        }
    }
    return this;
};
AnimationController.prototype.get = function () {
    for (var i = 0; i < this._viewStack.length; i++) {
        var item = this._viewStack[i];
        if (item.state === ItemState.VISIBLE || item.state === ItemState.SHOW || item.state === ItemState.SHOWING) {
            return item.view;
        }
    }
    return undefined;
};
module.exports = AnimationController;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./LayoutController":6}],3:[function(require,module,exports){
var LayoutUtility = require('./LayoutUtility');
var ScrollController = require('./ScrollController');
var ListLayout = require('./layouts/ListLayout');
var PullToRefreshState = {
        HIDDEN: 0,
        PULLING: 1,
        ACTIVE: 2,
        COMPLETED: 3,
        HIDDING: 4
    };
function FlexScrollView(options) {
    ScrollController.call(this, LayoutUtility.combineOptions(FlexScrollView.DEFAULT_OPTIONS, options));
    this._thisScrollViewDelta = 0;
    this._leadingScrollViewDelta = 0;
    this._trailingScrollViewDelta = 0;
}
FlexScrollView.prototype = Object.create(ScrollController.prototype);
FlexScrollView.prototype.constructor = FlexScrollView;
FlexScrollView.PullToRefreshState = PullToRefreshState;
FlexScrollView.Bounds = ScrollController.Bounds;
FlexScrollView.PaginationMode = ScrollController.PaginationMode;
FlexScrollView.DEFAULT_OPTIONS = {
    layout: ListLayout,
    direction: undefined,
    paginated: false,
    alignment: 0,
    flow: false,
    mouseMove: false,
    useContainer: false,
    visibleItemThresshold: 0.5,
    pullToRefreshHeader: undefined,
    pullToRefreshFooter: undefined,
    leadingScrollView: undefined,
    trailingScrollView: undefined
};
FlexScrollView.prototype.setOptions = function (options) {
    ScrollController.prototype.setOptions.call(this, options);
    if (options.pullToRefreshHeader || options.pullToRefreshFooter || this._pullToRefresh) {
        if (options.pullToRefreshHeader) {
            this._pullToRefresh = this._pullToRefresh || [
                undefined,
                undefined
            ];
            if (!this._pullToRefresh[0]) {
                this._pullToRefresh[0] = {
                    state: PullToRefreshState.HIDDEN,
                    prevState: PullToRefreshState.HIDDEN,
                    footer: false
                };
            }
            this._pullToRefresh[0].node = options.pullToRefreshHeader;
        } else if (!this.options.pullToRefreshHeader && this._pullToRefresh) {
            this._pullToRefresh[0] = undefined;
        }
        if (options.pullToRefreshFooter) {
            this._pullToRefresh = this._pullToRefresh || [
                undefined,
                undefined
            ];
            if (!this._pullToRefresh[1]) {
                this._pullToRefresh[1] = {
                    state: PullToRefreshState.HIDDEN,
                    prevState: PullToRefreshState.HIDDEN,
                    footer: true
                };
            }
            this._pullToRefresh[1].node = options.pullToRefreshFooter;
        } else if (!this.options.pullToRefreshFooter && this._pullToRefresh) {
            this._pullToRefresh[1] = undefined;
        }
        if (this._pullToRefresh && !this._pullToRefresh[0] && !this._pullToRefresh[1]) {
            this._pullToRefresh = undefined;
        }
    }
    return this;
};
FlexScrollView.prototype.sequenceFrom = function (node) {
    return this.setDataSource(node);
};
FlexScrollView.prototype.getCurrentIndex = function () {
    var item = this.getFirstVisibleItem();
    return item ? item.viewSequence.getIndex() : -1;
};
FlexScrollView.prototype.goToPage = function (index, noAnimation) {
    var viewSequence = this._viewSequence;
    if (!viewSequence) {
        return this;
    }
    while (viewSequence.getIndex() < index) {
        viewSequence = viewSequence.getNext();
        if (!viewSequence) {
            return this;
        }
    }
    while (viewSequence.getIndex() > index) {
        viewSequence = viewSequence.getPrevious();
        if (!viewSequence) {
            return this;
        }
    }
    this.goToRenderNode(viewSequence.get(), noAnimation);
    return this;
};
FlexScrollView.prototype.getOffset = function () {
    return this._scrollOffsetCache;
};
FlexScrollView.prototype.getPosition = FlexScrollView.prototype.getOffset;
FlexScrollView.prototype.getAbsolutePosition = function () {
    return -(this._scrollOffsetCache + this._scroll.groupStart);
};
function _setPullToRefreshState(pullToRefresh, state) {
    if (pullToRefresh.state !== state) {
        pullToRefresh.state = state;
        if (pullToRefresh.node && pullToRefresh.node.setPullToRefreshStatus) {
            pullToRefresh.node.setPullToRefreshStatus(state);
        }
    }
}
function _getPullToRefresh(footer) {
    return this._pullToRefresh ? this._pullToRefresh[footer ? 1 : 0] : undefined;
}
FlexScrollView.prototype._postLayout = function (size, scrollOffset) {
    if (!this._pullToRefresh) {
        return;
    }
    if (this.options.alignment) {
        scrollOffset += size[this._direction];
    }
    var prevHeight;
    var nextHeight;
    var totalHeight;
    for (var i = 0; i < 2; i++) {
        var pullToRefresh = this._pullToRefresh[i];
        if (pullToRefresh) {
            var length = pullToRefresh.node.getSize()[this._direction];
            var pullLength = pullToRefresh.node.getPullToRefreshSize ? pullToRefresh.node.getPullToRefreshSize()[this._direction] : length;
            var offset;
            if (!pullToRefresh.footer) {
                prevHeight = this._calcScrollHeight(false);
                prevHeight = prevHeight === undefined ? -1 : prevHeight;
                offset = prevHeight >= 0 ? scrollOffset - prevHeight : prevHeight;
                if (this.options.alignment) {
                    nextHeight = this._calcScrollHeight(true);
                    nextHeight = nextHeight === undefined ? -1 : nextHeight;
                    totalHeight = prevHeight >= 0 && nextHeight >= 0 ? prevHeight + nextHeight : -1;
                    if (totalHeight >= 0 && totalHeight < size[this._direction]) {
                        offset = Math.round(scrollOffset - size[this._direction] + nextHeight);
                    }
                }
            } else {
                nextHeight = nextHeight === undefined ? nextHeight = this._calcScrollHeight(true) : nextHeight;
                nextHeight = nextHeight === undefined ? -1 : nextHeight;
                offset = nextHeight >= 0 ? scrollOffset + nextHeight : size[this._direction] + 1;
                if (!this.options.alignment) {
                    prevHeight = prevHeight === undefined ? this._calcScrollHeight(false) : prevHeight;
                    prevHeight = prevHeight === undefined ? -1 : prevHeight;
                    totalHeight = prevHeight >= 0 && nextHeight >= 0 ? prevHeight + nextHeight : -1;
                    if (totalHeight >= 0 && totalHeight < size[this._direction]) {
                        offset = Math.round(scrollOffset - prevHeight + size[this._direction]);
                    }
                }
                offset = -(offset - size[this._direction]);
            }
            var visiblePerc = Math.max(Math.min(offset / pullLength, 1), 0);
            switch (pullToRefresh.state) {
            case PullToRefreshState.HIDDEN:
                if (this._scroll.scrollForceCount) {
                    if (visiblePerc >= 1) {
                        _setPullToRefreshState(pullToRefresh, PullToRefreshState.ACTIVE);
                    } else if (offset >= 0.2) {
                        _setPullToRefreshState(pullToRefresh, PullToRefreshState.PULLING);
                    }
                }
                break;
            case PullToRefreshState.PULLING:
                if (this._scroll.scrollForceCount && visiblePerc >= 1) {
                    _setPullToRefreshState(pullToRefresh, PullToRefreshState.ACTIVE);
                } else if (offset < 0.2) {
                    _setPullToRefreshState(pullToRefresh, PullToRefreshState.HIDDEN);
                }
                break;
            case PullToRefreshState.ACTIVE:
                break;
            case PullToRefreshState.COMPLETED:
                if (!this._scroll.scrollForceCount) {
                    if (offset >= 0.2) {
                        _setPullToRefreshState(pullToRefresh, PullToRefreshState.HIDDING);
                    } else {
                        _setPullToRefreshState(pullToRefresh, PullToRefreshState.HIDDEN);
                    }
                }
                break;
            case PullToRefreshState.HIDDING:
                if (offset < 0.2) {
                    _setPullToRefreshState(pullToRefresh, PullToRefreshState.HIDDEN);
                }
                break;
            }
            if (pullToRefresh.state !== PullToRefreshState.HIDDEN) {
                var contextNode = {
                        renderNode: pullToRefresh.node,
                        prev: !pullToRefresh.footer,
                        next: pullToRefresh.footer,
                        index: !pullToRefresh.footer ? --this._nodes._contextState.prevGetIndex : ++this._nodes._contextState.nextGetIndex
                    };
                var scrollLength;
                if (pullToRefresh.state === PullToRefreshState.ACTIVE) {
                    scrollLength = length;
                } else if (this._scroll.scrollForceCount) {
                    scrollLength = Math.min(offset, length);
                }
                var set = {
                        size: [
                            size[0],
                            size[1]
                        ],
                        translate: [
                            0,
                            0,
                            -0.001
                        ],
                        scrollLength: scrollLength
                    };
                set.size[this._direction] = Math.max(Math.min(offset, pullLength), 0);
                set.translate[this._direction] = pullToRefresh.footer ? size[this._direction] - length : 0;
                this._nodes._context.set(contextNode, set);
            }
        }
    }
};
FlexScrollView.prototype.showPullToRefresh = function (footer) {
    var pullToRefresh = _getPullToRefresh.call(this, footer);
    if (pullToRefresh) {
        _setPullToRefreshState(pullToRefresh, PullToRefreshState.ACTIVE);
        this._scroll.scrollDirty = true;
    }
};
FlexScrollView.prototype.hidePullToRefresh = function (footer) {
    var pullToRefresh = _getPullToRefresh.call(this, footer);
    if (pullToRefresh && pullToRefresh.state === PullToRefreshState.ACTIVE) {
        _setPullToRefreshState(pullToRefresh, PullToRefreshState.COMPLETED);
        this._scroll.scrollDirty = true;
    }
    return this;
};
FlexScrollView.prototype.isPullToRefreshVisible = function (footer) {
    var pullToRefresh = _getPullToRefresh.call(this, footer);
    return pullToRefresh ? pullToRefresh.state === PullToRefreshState.ACTIVE : false;
};
FlexScrollView.prototype.applyScrollForce = function (delta) {
    var leadingScrollView = this.options.leadingScrollView;
    var trailingScrollView = this.options.trailingScrollView;
    if (!leadingScrollView && !trailingScrollView) {
        return ScrollController.prototype.applyScrollForce.call(this, delta);
    }
    var partialDelta;
    if (delta < 0) {
        if (leadingScrollView) {
            partialDelta = leadingScrollView.canScroll(delta);
            this._leadingScrollViewDelta += partialDelta;
            leadingScrollView.applyScrollForce(partialDelta);
            delta -= partialDelta;
        }
        if (trailingScrollView) {
            partialDelta = this.canScroll(delta);
            ScrollController.prototype.applyScrollForce.call(this, partialDelta);
            this._thisScrollViewDelta += partialDelta;
            delta -= partialDelta;
            trailingScrollView.applyScrollForce(delta);
            this._trailingScrollViewDelta += delta;
        } else {
            ScrollController.prototype.applyScrollForce.call(this, delta);
            this._thisScrollViewDelta += delta;
        }
    } else {
        if (trailingScrollView) {
            partialDelta = trailingScrollView.canScroll(delta);
            trailingScrollView.applyScrollForce(partialDelta);
            this._trailingScrollViewDelta += partialDelta;
            delta -= partialDelta;
        }
        if (leadingScrollView) {
            partialDelta = this.canScroll(delta);
            ScrollController.prototype.applyScrollForce.call(this, partialDelta);
            this._thisScrollViewDelta += partialDelta;
            delta -= partialDelta;
            leadingScrollView.applyScrollForce(delta);
            this._leadingScrollViewDelta += delta;
        } else {
            ScrollController.prototype.applyScrollForce.call(this, delta);
            this._thisScrollViewDelta += delta;
        }
    }
    return this;
};
FlexScrollView.prototype.updateScrollForce = function (prevDelta, newDelta) {
    var leadingScrollView = this.options.leadingScrollView;
    var trailingScrollView = this.options.trailingScrollView;
    if (!leadingScrollView && !trailingScrollView) {
        return ScrollController.prototype.updateScrollForce.call(this, prevDelta, newDelta);
    }
    var partialDelta;
    var delta = newDelta - prevDelta;
    if (delta < 0) {
        if (leadingScrollView) {
            partialDelta = leadingScrollView.canScroll(delta);
            leadingScrollView.updateScrollForce(this._leadingScrollViewDelta, this._leadingScrollViewDelta + partialDelta);
            this._leadingScrollViewDelta += partialDelta;
            delta -= partialDelta;
        }
        if (trailingScrollView && delta) {
            partialDelta = this.canScroll(delta);
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, this._thisScrollViewDelta + partialDelta);
            this._thisScrollViewDelta += partialDelta;
            delta -= partialDelta;
            this._trailingScrollViewDelta += delta;
            trailingScrollView.updateScrollForce(this._trailingScrollViewDelta, this._trailingScrollViewDelta + delta);
        } else if (delta) {
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, this._thisScrollViewDelta + delta);
            this._thisScrollViewDelta += delta;
        }
    } else {
        if (trailingScrollView) {
            partialDelta = trailingScrollView.canScroll(delta);
            trailingScrollView.updateScrollForce(this._trailingScrollViewDelta, this._trailingScrollViewDelta + partialDelta);
            this._trailingScrollViewDelta += partialDelta;
            delta -= partialDelta;
        }
        if (leadingScrollView) {
            partialDelta = this.canScroll(delta);
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, this._thisScrollViewDelta + partialDelta);
            this._thisScrollViewDelta += partialDelta;
            delta -= partialDelta;
            leadingScrollView.updateScrollForce(this._leadingScrollViewDelta, this._leadingScrollViewDelta + delta);
            this._leadingScrollViewDelta += delta;
        } else {
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, this._thisScrollViewDelta + delta);
            this._thisScrollViewDelta += delta;
        }
    }
    return this;
};
FlexScrollView.prototype.releaseScrollForce = function (delta, velocity) {
    var leadingScrollView = this.options.leadingScrollView;
    var trailingScrollView = this.options.trailingScrollView;
    if (!leadingScrollView && !trailingScrollView) {
        return ScrollController.prototype.releaseScrollForce.call(this, delta, velocity);
    }
    var partialDelta;
    if (delta < 0) {
        if (leadingScrollView) {
            partialDelta = Math.max(this._leadingScrollViewDelta, delta);
            this._leadingScrollViewDelta -= partialDelta;
            delta -= partialDelta;
            leadingScrollView.releaseScrollForce(this._leadingScrollViewDelta, delta ? 0 : velocity);
        }
        if (trailingScrollView) {
            partialDelta = Math.max(this._thisScrollViewDelta, delta);
            this._thisScrollViewDelta -= partialDelta;
            delta -= partialDelta;
            ScrollController.prototype.releaseScrollForce.call(this, this._thisScrollViewDelta, delta ? 0 : velocity);
            this._trailingScrollViewDelta -= delta;
            trailingScrollView.releaseScrollForce(this._trailingScrollViewDelta, delta ? velocity : 0);
        } else {
            this._thisScrollViewDelta -= delta;
            ScrollController.prototype.releaseScrollForce.call(this, this._thisScrollViewDelta, delta ? velocity : 0);
        }
    } else {
        if (trailingScrollView) {
            partialDelta = Math.min(this._trailingScrollViewDelta, delta);
            this._trailingScrollViewDelta -= partialDelta;
            delta -= partialDelta;
            trailingScrollView.releaseScrollForce(this._trailingScrollViewDelta, delta ? 0 : velocity);
        }
        if (leadingScrollView) {
            partialDelta = Math.min(this._thisScrollViewDelta, delta);
            this._thisScrollViewDelta -= partialDelta;
            delta -= partialDelta;
            ScrollController.prototype.releaseScrollForce.call(this, this._thisScrollViewDelta, delta ? 0 : velocity);
            this._leadingScrollViewDelta -= delta;
            leadingScrollView.releaseScrollForce(this._leadingScrollViewDelta, delta ? velocity : 0);
        } else {
            this._thisScrollViewDelta -= delta;
            ScrollController.prototype.updateScrollForce.call(this, this._thisScrollViewDelta, delta ? velocity : 0);
        }
    }
    return this;
};
FlexScrollView.prototype.commit = function (context) {
    var result = ScrollController.prototype.commit.call(this, context);
    if (this._pullToRefresh) {
        for (var i = 0; i < 2; i++) {
            var pullToRefresh = this._pullToRefresh[i];
            if (pullToRefresh) {
                if (pullToRefresh.state === PullToRefreshState.ACTIVE && pullToRefresh.prevState !== PullToRefreshState.ACTIVE) {
                    this._eventOutput.emit('refresh', {
                        target: this,
                        footer: pullToRefresh.footer
                    });
                }
                pullToRefresh.prevState = pullToRefresh.state;
            }
        }
    }
    return result;
};
module.exports = FlexScrollView;
},{"./LayoutUtility":9,"./ScrollController":10,"./layouts/ListLayout":18}],4:[function(require,module,exports){
(function (global){
var OptionsManager = typeof window !== 'undefined' ? window.famous.core.OptionsManager : typeof global !== 'undefined' ? global.famous.core.OptionsManager : null;
var Transform = typeof window !== 'undefined' ? window.famous.core.Transform : typeof global !== 'undefined' ? global.famous.core.Transform : null;
var Vector = typeof window !== 'undefined' ? window.famous.math.Vector : typeof global !== 'undefined' ? global.famous.math.Vector : null;
var Particle = typeof window !== 'undefined' ? window.famous.physics.bodies.Particle : typeof global !== 'undefined' ? global.famous.physics.bodies.Particle : null;
var Spring = typeof window !== 'undefined' ? window.famous.physics.forces.Spring : typeof global !== 'undefined' ? global.famous.physics.forces.Spring : null;
var PhysicsEngine = typeof window !== 'undefined' ? window.famous.physics.PhysicsEngine : typeof global !== 'undefined' ? global.famous.physics.PhysicsEngine : null;
var LayoutNode = require('./LayoutNode');
var Transitionable = typeof window !== 'undefined' ? window.famous.transitions.Transitionable : typeof global !== 'undefined' ? global.famous.transitions.Transitionable : null;
function FlowLayoutNode(renderNode, spec) {
    LayoutNode.apply(this, arguments);
    if (!this.options) {
        this.options = Object.create(this.constructor.DEFAULT_OPTIONS);
        this._optionsManager = new OptionsManager(this.options);
    }
    if (!this._pe) {
        this._pe = new PhysicsEngine();
        this._pe.sleep();
    }
    if (!this._properties) {
        this._properties = {};
    } else {
        for (var propName in this._properties) {
            this._properties[propName].init = false;
        }
    }
    if (!this._lockTransitionable) {
        this._lockTransitionable = new Transitionable(1);
    } else {
        this._lockTransitionable.halt();
        this._lockTransitionable.reset(1);
    }
    this._specModified = true;
    this._initial = true;
    this._spec.endState = {};
    if (spec) {
        this.setSpec(spec);
    }
}
FlowLayoutNode.prototype = Object.create(LayoutNode.prototype);
FlowLayoutNode.prototype.constructor = FlowLayoutNode;
FlowLayoutNode.DEFAULT_OPTIONS = {
    spring: {
        dampingRatio: 0.8,
        period: 300
    },
    properties: {
        opacity: true,
        align: true,
        origin: true,
        size: true,
        translate: true,
        skew: true,
        rotate: true,
        scale: true
    },
    particleRounding: 0.001
};
var DEFAULT = {
        opacity: 1,
        opacity2D: [
            1,
            0
        ],
        size: [
            0,
            0
        ],
        origin: [
            0,
            0
        ],
        align: [
            0,
            0
        ],
        scale: [
            1,
            1,
            1
        ],
        translate: [
            0,
            0,
            0
        ],
        rotate: [
            0,
            0,
            0
        ],
        skew: [
            0,
            0,
            0
        ]
    };
FlowLayoutNode.prototype.setOptions = function (options) {
    this._optionsManager.setOptions(options);
    var wasSleeping = this._pe.isSleeping();
    for (var propName in this._properties) {
        var prop = this._properties[propName];
        if (options.spring && prop.force) {
            prop.force.setOptions(this.options.spring);
        }
        if (options.properties && options.properties[propName] !== undefined) {
            if (this.options.properties[propName].length) {
                prop.enabled = this.options.properties[propName];
            } else {
                prop.enabled = [
                    this.options.properties[propName],
                    this.options.properties[propName],
                    this.options.properties[propName]
                ];
            }
        }
    }
    if (wasSleeping) {
        this._pe.sleep();
    }
    return this;
};
FlowLayoutNode.prototype.setSpec = function (spec) {
    var set;
    if (spec.transform) {
        set = Transform.interpret(spec.transform);
    }
    if (!set) {
        set = {};
    }
    set.opacity = spec.opacity;
    set.size = spec.size;
    set.align = spec.align;
    set.origin = spec.origin;
    var oldRemoving = this._removing;
    var oldInvalidated = this._invalidated;
    this.set(set);
    this._removing = oldRemoving;
    this._invalidated = oldInvalidated;
};
FlowLayoutNode.prototype.reset = function () {
    if (this._invalidated) {
        for (var propName in this._properties) {
            this._properties[propName].invalidated = false;
        }
        this._invalidated = false;
    }
    this.trueSizeRequested = false;
    this.usesTrueSize = false;
};
FlowLayoutNode.prototype.remove = function (removeSpec) {
    this._removing = true;
    if (removeSpec) {
        this.setSpec(removeSpec);
    } else {
        this._pe.sleep();
        this._specModified = false;
    }
    this._invalidated = false;
};
FlowLayoutNode.prototype.releaseLock = function (enable) {
    this._lockTransitionable.halt();
    this._lockTransitionable.reset(0);
    if (enable) {
        this._lockTransitionable.set(1, { duration: this.options.spring.period || 1000 });
    }
};
function _getRoundedValue3D(prop, def, precision, lockValue) {
    if (!prop || !prop.init) {
        return def;
    }
    return [
        prop.enabled[0] ? Math.round((prop.curState.x + (prop.endState.x - prop.curState.x) * lockValue) / precision) * precision : prop.endState.x,
        prop.enabled[1] ? Math.round((prop.curState.y + (prop.endState.y - prop.curState.y) * lockValue) / precision) * precision : prop.endState.y,
        prop.enabled[2] ? Math.round((prop.curState.z + (prop.endState.z - prop.curState.z) * lockValue) / precision) * precision : prop.endState.z
    ];
}
FlowLayoutNode.prototype.getSpec = function () {
    var endStateReached = this._pe.isSleeping();
    if (!this._specModified && endStateReached) {
        this._spec.removed = !this._invalidated;
        return this._spec;
    }
    this._initial = false;
    this._specModified = !endStateReached;
    this._spec.removed = false;
    if (!endStateReached) {
        this._pe.step();
    }
    var spec = this._spec;
    var precision = this.options.particleRounding;
    var lockValue = this._lockTransitionable.get();
    var prop = this._properties.opacity;
    if (prop && prop.init) {
        spec.opacity = prop.enabled[0] ? Math.round(Math.max(0, Math.min(1, prop.curState.x)) / precision) * precision : prop.endState.x;
        spec.endState.opacity = prop.endState.x;
    } else {
        spec.opacity = undefined;
        spec.endState.opacity = undefined;
    }
    prop = this._properties.size;
    if (prop && prop.init) {
        spec.size = spec.size || [
            0,
            0
        ];
        spec.size[0] = prop.enabled[0] ? Math.round((prop.curState.x + (prop.endState.x - prop.curState.x) * lockValue) / 0.1) * 0.1 : prop.endState.x;
        spec.size[1] = prop.enabled[1] ? Math.round((prop.curState.y + (prop.endState.y - prop.curState.y) * lockValue) / 0.1) * 0.1 : prop.endState.y;
        spec.endState.size = spec.endState.size || [
            0,
            0
        ];
        spec.endState.size[0] = prop.endState.x;
        spec.endState.size[1] = prop.endState.y;
    } else {
        spec.size = undefined;
        spec.endState.size = undefined;
    }
    prop = this._properties.align;
    if (prop && prop.init) {
        spec.align = spec.align || [
            0,
            0
        ];
        spec.align[0] = prop.enabled[0] ? Math.round((prop.curState.x + (prop.endState.x - prop.curState.x) * lockValue) / 0.1) * 0.1 : prop.endState.x;
        spec.align[1] = prop.enabled[1] ? Math.round((prop.curState.y + (prop.endState.y - prop.curState.y) * lockValue) / 0.1) * 0.1 : prop.endState.y;
        spec.endState.align = spec.endState.align || [
            0,
            0
        ];
        spec.endState.align[0] = prop.endState.x;
        spec.endState.align[1] = prop.endState.y;
    } else {
        spec.align = undefined;
        spec.endState.align = undefined;
    }
    prop = this._properties.origin;
    if (prop && prop.init) {
        spec.origin = spec.origin || [
            0,
            0
        ];
        spec.origin[0] = prop.enabled[0] ? Math.round((prop.curState.x + (prop.endState.x - prop.curState.x) * lockValue) / 0.1) * 0.1 : prop.endState.x;
        spec.origin[1] = prop.enabled[1] ? Math.round((prop.curState.y + (prop.endState.y - prop.curState.y) * lockValue) / 0.1) * 0.1 : prop.endState.y;
        spec.endState.origin = spec.endState.origin || [
            0,
            0
        ];
        spec.endState.origin[0] = prop.endState.x;
        spec.endState.origin[1] = prop.endState.y;
    } else {
        spec.origin = undefined;
        spec.endState.origin = undefined;
    }
    var translate = this._properties.translate;
    var translateX;
    var translateY;
    var translateZ;
    if (translate && translate.init) {
        translateX = translate.enabled[0] ? Math.round((translate.curState.x + (translate.endState.x - translate.curState.x) * lockValue) / precision) * precision : translate.endState.x;
        translateY = translate.enabled[1] ? Math.round((translate.curState.y + (translate.endState.y - translate.curState.y) * lockValue) / precision) * precision : translate.endState.y;
        translateZ = translate.enabled[2] ? Math.round((translate.curState.z + (translate.endState.z - translate.curState.z) * lockValue) / precision) * precision : translate.endState.z;
    } else {
        translateX = 0;
        translateY = 0;
        translateZ = 0;
    }
    var scale = this._properties.scale;
    var skew = this._properties.skew;
    var rotate = this._properties.rotate;
    if (scale || skew || rotate) {
        spec.transform = Transform.build({
            translate: [
                translateX,
                translateY,
                translateZ
            ],
            skew: _getRoundedValue3D.call(this, skew, DEFAULT.skew, this.options.particleRounding, lockValue),
            scale: _getRoundedValue3D.call(this, scale, DEFAULT.scale, this.options.particleRounding, lockValue),
            rotate: _getRoundedValue3D.call(this, rotate, DEFAULT.rotate, this.options.particleRounding, lockValue)
        });
        spec.endState.transform = Transform.build({
            translate: translate ? [
                translate.endState.x,
                translate.endState.y,
                translate.endState.z
            ] : DEFAULT.translate,
            scale: scale ? [
                scale.endState.x,
                scale.endState.y,
                scale.endState.z
            ] : DEFAULT.scale,
            skew: skew ? [
                skew.endState.x,
                skew.endState.y,
                skew.endState.z
            ] : DEFAULT.skew,
            rotate: rotate ? [
                rotate.endState.x,
                rotate.endState.y,
                rotate.endState.z
            ] : DEFAULT.rotate
        });
    } else if (translate) {
        if (!spec.transform) {
            spec.transform = Transform.translate(translateX, translateY, translateZ);
        } else {
            spec.transform[12] = translateX;
            spec.transform[13] = translateY;
            spec.transform[14] = translateZ;
        }
        if (!spec.endState.transform) {
            spec.endState.transform = Transform.translate(translate.endState.x, translate.endState.y, translate.endState.z);
        } else {
            spec.endState.transform[12] = translate.endState.x;
            spec.endState.transform[13] = translate.endState.y;
            spec.endState.transform[14] = translate.endState.z;
        }
    } else {
        spec.transform = undefined;
        spec.endState.transform = undefined;
    }
    return this._spec;
};
function _setPropertyValue(prop, propName, endState, defaultValue, immediate, isTranslate) {
    prop = prop || this._properties[propName];
    if (prop && prop.init) {
        prop.invalidated = true;
        var value = defaultValue;
        if (endState !== undefined) {
            value = endState;
        } else if (this._removing) {
            value = prop.particle.getPosition();
        }
        prop.endState.x = value[0];
        prop.endState.y = value.length > 1 ? value[1] : 0;
        prop.endState.z = value.length > 2 ? value[2] : 0;
        if (immediate) {
            prop.curState.x = prop.endState.x;
            prop.curState.y = prop.endState.y;
            prop.curState.z = prop.endState.z;
            prop.velocity.x = 0;
            prop.velocity.y = 0;
            prop.velocity.z = 0;
        } else if (prop.endState.x !== prop.curState.x || prop.endState.y !== prop.curState.y || prop.endState.z !== prop.curState.z) {
            this._pe.wake();
        }
        return;
    } else {
        var wasSleeping = this._pe.isSleeping();
        if (!prop) {
            prop = {
                particle: new Particle({ position: this._initial || immediate ? endState : defaultValue }),
                endState: new Vector(endState)
            };
            prop.curState = prop.particle.position;
            prop.velocity = prop.particle.velocity;
            prop.force = new Spring(this.options.spring);
            prop.force.setOptions({ anchor: prop.endState });
            this._pe.addBody(prop.particle);
            prop.forceId = this._pe.attach(prop.force, prop.particle);
            this._properties[propName] = prop;
        } else {
            prop.particle.setPosition(this._initial || immediate ? endState : defaultValue);
            prop.endState.set(endState);
        }
        if (!this._initial && !immediate) {
            this._pe.wake();
        } else if (wasSleeping) {
            this._pe.sleep();
        }
        if (this.options.properties[propName] && this.options.properties[propName].length) {
            prop.enabled = this.options.properties[propName];
        } else {
            prop.enabled = [
                this.options.properties[propName],
                this.options.properties[propName],
                this.options.properties[propName]
            ];
        }
        prop.init = true;
        prop.invalidated = true;
    }
}
function _getIfNE2D(a1, a2) {
    return a1[0] === a2[0] && a1[1] === a2[1] ? undefined : a1;
}
function _getIfNE3D(a1, a2) {
    return a1[0] === a2[0] && a1[1] === a2[1] && a1[2] === a2[2] ? undefined : a1;
}
FlowLayoutNode.prototype.set = function (set, defaultSize) {
    if (defaultSize) {
        this._removing = false;
    }
    this._invalidated = true;
    this.scrollLength = set.scrollLength;
    this._specModified = true;
    var prop = this._properties.opacity;
    var value = set.opacity === DEFAULT.opacity ? undefined : set.opacity;
    if (value !== undefined || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'opacity', value === undefined ? undefined : [
            value,
            0
        ], DEFAULT.opacity2D);
    }
    prop = this._properties.align;
    value = set.align ? _getIfNE2D(set.align, DEFAULT.align) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'align', value, DEFAULT.align);
    }
    prop = this._properties.origin;
    value = set.origin ? _getIfNE2D(set.origin, DEFAULT.origin) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'origin', value, DEFAULT.origin);
    }
    prop = this._properties.size;
    value = set.size || defaultSize;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'size', value, defaultSize, this.usesTrueSize);
    }
    prop = this._properties.translate;
    value = set.translate;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'translate', value, DEFAULT.translate, undefined, true);
    }
    prop = this._properties.scale;
    value = set.scale ? _getIfNE3D(set.scale, DEFAULT.scale) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'scale', value, DEFAULT.scale);
    }
    prop = this._properties.rotate;
    value = set.rotate ? _getIfNE3D(set.rotate, DEFAULT.rotate) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'rotate', value, DEFAULT.rotate);
    }
    prop = this._properties.skew;
    value = set.skew ? _getIfNE3D(set.skew, DEFAULT.skew) : undefined;
    if (value || prop && prop.init) {
        _setPropertyValue.call(this, prop, 'skew', value, DEFAULT.skew);
    }
};
module.exports = FlowLayoutNode;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./LayoutNode":7}],5:[function(require,module,exports){
function LayoutContext(methods) {
    for (var n in methods) {
        this[n] = methods[n];
    }
}
LayoutContext.prototype.size = undefined;
LayoutContext.prototype.direction = undefined;
LayoutContext.prototype.scrollOffset = undefined;
LayoutContext.prototype.scrollStart = undefined;
LayoutContext.prototype.scrollEnd = undefined;
LayoutContext.prototype.next = function () {
};
LayoutContext.prototype.prev = function () {
};
LayoutContext.prototype.get = function (node) {
};
LayoutContext.prototype.set = function (node, set) {
};
LayoutContext.prototype.resolveSize = function (node) {
};
module.exports = LayoutContext;
},{}],6:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var Entity = typeof window !== 'undefined' ? window.famous.core.Entity : typeof global !== 'undefined' ? global.famous.core.Entity : null;
var ViewSequence = typeof window !== 'undefined' ? window.famous.core.ViewSequence : typeof global !== 'undefined' ? global.famous.core.ViewSequence : null;
var OptionsManager = typeof window !== 'undefined' ? window.famous.core.OptionsManager : typeof global !== 'undefined' ? global.famous.core.OptionsManager : null;
var EventHandler = typeof window !== 'undefined' ? window.famous.core.EventHandler : typeof global !== 'undefined' ? global.famous.core.EventHandler : null;
var LayoutUtility = require('./LayoutUtility');
var LayoutNodeManager = require('./LayoutNodeManager');
var LayoutNode = require('./LayoutNode');
var FlowLayoutNode = require('./FlowLayoutNode');
var Transform = typeof window !== 'undefined' ? window.famous.core.Transform : typeof global !== 'undefined' ? global.famous.core.Transform : null;
require('./helpers/LayoutDockHelper');
function LayoutController(options, nodeManager) {
    this.id = Entity.register(this);
    this._isDirty = true;
    this._contextSizeCache = [
        0,
        0
    ];
    this._commitOutput = {};
    this._cleanupRegistration = {
        commit: function () {
            return undefined;
        },
        cleanup: function (context) {
            this.cleanup(context);
        }.bind(this)
    };
    this._cleanupRegistration.target = Entity.register(this._cleanupRegistration);
    this._cleanupRegistration.render = function () {
        return this.target;
    }.bind(this._cleanupRegistration);
    this._eventInput = new EventHandler();
    EventHandler.setInputHandler(this, this._eventInput);
    this._eventOutput = new EventHandler();
    EventHandler.setOutputHandler(this, this._eventOutput);
    this._layout = { options: Object.create({}) };
    this._layout.optionsManager = new OptionsManager(this._layout.options);
    this._layout.optionsManager.on('change', function () {
        this._isDirty = true;
    }.bind(this));
    this.options = Object.create(LayoutController.DEFAULT_OPTIONS);
    this._optionsManager = new OptionsManager(this.options);
    if (nodeManager) {
        this._nodes = nodeManager;
    } else if (options && options.flow) {
        this._nodes = new LayoutNodeManager(FlowLayoutNode, _initFlowLayoutNode.bind(this));
    } else {
        this._nodes = new LayoutNodeManager(LayoutNode);
    }
    this.setDirection(undefined);
    if (options) {
        this.setOptions(options);
    }
}
LayoutController.DEFAULT_OPTIONS = {
    flow: false,
    flowOptions: {
        reflowOnResize: true,
        properties: {
            opacity: true,
            align: true,
            origin: true,
            size: true,
            translate: true,
            skew: true,
            rotate: true,
            scale: true
        },
        spring: {
            dampingRatio: 0.8,
            period: 300
        }
    }
};
function _initFlowLayoutNode(node, spec) {
    if (!spec && this.options.flowOptions.insertSpec) {
        node.setSpec(this.options.flowOptions.insertSpec);
    }
}
LayoutController.prototype.setOptions = function (options) {
    if (options.alignment !== undefined && options.alignment !== this.options.alignment) {
        this._isDirty = true;
    }
    this._optionsManager.setOptions(options);
    if (options.nodeSpring) {
        console.warn('nodeSpring options have been moved inside `flowOptions`. Use `flowOptions.spring` instead.');
        this._optionsManager.setOptions({ flowOptions: { spring: options.nodeSpring } });
        this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.reflowOnResize !== undefined) {
        console.warn('reflowOnResize options have been moved inside `flowOptions`. Use `flowOptions.reflowOnResize` instead.');
        this._optionsManager.setOptions({ flowOptions: { reflowOnResize: options.reflowOnResize } });
        this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.insertSpec) {
        console.warn('insertSpec options have been moved inside `flowOptions`. Use `flowOptions.insertSpec` instead.');
        this._optionsManager.setOptions({ flowOptions: { insertSpec: options.insertSpec } });
        this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.removeSpec) {
        console.warn('removeSpec options have been moved inside `flowOptions`. Use `flowOptions.removeSpec` instead.');
        this._optionsManager.setOptions({ flowOptions: { removeSpec: options.removeSpec } });
        this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.dataSource) {
        this.setDataSource(options.dataSource);
    }
    if (options.layout) {
        this.setLayout(options.layout, options.layoutOptions);
    } else if (options.layoutOptions) {
        this.setLayoutOptions(options.layoutOptions);
    }
    if (options.direction !== undefined) {
        this.setDirection(options.direction);
    }
    if (options.flowOptions && this.options.flow) {
        this._nodes.setNodeOptions(this.options.flowOptions);
    }
    if (options.preallocateNodes) {
        this._nodes.preallocateNodes(options.preallocateNodes.count || 0, options.preallocateNodes.spec);
    }
    return this;
};
function _forEachRenderable(callback) {
    var dataSource = this._dataSource;
    if (dataSource instanceof Array) {
        for (var i = 0, j = dataSource.length; i < j; i++) {
            callback(dataSource[i]);
        }
    } else if (dataSource instanceof ViewSequence) {
        var renderable;
        while (dataSource) {
            renderable = dataSource.get();
            if (!renderable) {
                break;
            }
            callback(renderable);
            dataSource = dataSource.getNext();
        }
    } else {
        for (var key in dataSource) {
            callback(dataSource[key]);
        }
    }
}
LayoutController.prototype.setDataSource = function (dataSource) {
    this._dataSource = dataSource;
    this._initialViewSequence = undefined;
    this._nodesById = undefined;
    if (dataSource instanceof Array) {
        this._viewSequence = new ViewSequence(dataSource);
        this._initialViewSequence = this._viewSequence;
    } else if (dataSource instanceof ViewSequence || dataSource.getNext) {
        this._viewSequence = dataSource;
        this._initialViewSequence = dataSource;
    } else if (dataSource instanceof Object) {
        this._nodesById = dataSource;
    }
    if (this.options.autoPipeEvents) {
        if (this._dataSource.pipe) {
            this._dataSource.pipe(this);
            this._dataSource.pipe(this._eventOutput);
        } else {
            _forEachRenderable.call(this, function (renderable) {
                if (renderable && renderable.pipe) {
                    renderable.pipe(this);
                    renderable.pipe(this._eventOutput);
                }
            }.bind(this));
        }
    }
    this._isDirty = true;
    return this;
};
LayoutController.prototype.getDataSource = function () {
    return this._dataSource;
};
LayoutController.prototype.setLayout = function (layout, options) {
    if (layout instanceof Function) {
        this._layout._function = layout;
        this._layout.capabilities = layout.Capabilities;
        this._layout.literal = undefined;
    } else if (layout instanceof Object) {
        this._layout.literal = layout;
        this._layout.capabilities = undefined;
        var helperName = Object.keys(layout)[0];
        var Helper = LayoutUtility.getRegisteredHelper(helperName);
        this._layout._function = Helper ? function (context, options2) {
            var helper = new Helper(context, options2);
            helper.parse(layout[helperName]);
        } : undefined;
    } else {
        this._layout._function = undefined;
        this._layout.capabilities = undefined;
        this._layout.literal = undefined;
    }
    if (options) {
        this.setLayoutOptions(options);
    }
    this.setDirection(this._configuredDirection);
    this._isDirty = true;
    return this;
};
LayoutController.prototype.getLayout = function () {
    return this._layout.literal || this._layout._function;
};
LayoutController.prototype.setLayoutOptions = function (options) {
    this._layout.optionsManager.setOptions(options);
    return this;
};
LayoutController.prototype.getLayoutOptions = function () {
    return this._layout.options;
};
function _getActualDirection(direction) {
    if (this._layout.capabilities && this._layout.capabilities.direction) {
        if (Array.isArray(this._layout.capabilities.direction)) {
            for (var i = 0; i < this._layout.capabilities.direction.length; i++) {
                if (this._layout.capabilities.direction[i] === direction) {
                    return direction;
                }
            }
            return this._layout.capabilities.direction[0];
        } else {
            return this._layout.capabilities.direction;
        }
    }
    return direction === undefined ? Utility.Direction.Y : direction;
}
LayoutController.prototype.setDirection = function (direction) {
    this._configuredDirection = direction;
    var newDirection = _getActualDirection.call(this, direction);
    if (newDirection !== this._direction) {
        this._direction = newDirection;
        this._isDirty = true;
    }
};
LayoutController.prototype.getDirection = function (actual) {
    return actual ? this._direction : this._configuredDirection;
};
LayoutController.prototype.getSpec = function (node, normalize, endState) {
    if (!node) {
        return undefined;
    }
    if (node instanceof String || typeof node === 'string') {
        if (!this._nodesById) {
            return undefined;
        }
        node = this._nodesById[node];
        if (!node) {
            return undefined;
        }
        if (node instanceof Array) {
            return node;
        }
    }
    if (this._specs) {
        for (var i = 0; i < this._specs.length; i++) {
            var spec = this._specs[i];
            if (spec.renderNode === node) {
                if (endState && spec.endState) {
                    spec = spec.endState;
                }
                if (normalize && spec.transform && spec.size && (spec.align || spec.origin)) {
                    var transform = spec.transform;
                    if (spec.align && (spec.align[0] || spec.align[1])) {
                        transform = Transform.thenMove(transform, [
                            spec.align[0] * this._contextSizeCache[0],
                            spec.align[1] * this._contextSizeCache[1],
                            0
                        ]);
                    }
                    if (spec.origin && (spec.origin[0] || spec.origin[1])) {
                        transform = Transform.moveThen([
                            -spec.origin[0] * spec.size[0],
                            -spec.origin[1] * spec.size[1],
                            0
                        ], transform);
                    }
                    return {
                        opacity: spec.opacity,
                        size: spec.size,
                        transform: transform
                    };
                }
                return spec;
            }
        }
    }
    return undefined;
};
LayoutController.prototype.reflowLayout = function () {
    this._isDirty = true;
    return this;
};
LayoutController.prototype.resetFlowState = function () {
    if (this.options.flow) {
        this._resetFlowState = true;
    }
    return this;
};
LayoutController.prototype.insert = function (indexOrId, renderable, insertSpec) {
    if (indexOrId instanceof String || typeof indexOrId === 'string') {
        if (this._dataSource === undefined) {
            this._dataSource = {};
            this._nodesById = this._dataSource;
        }
        if (this._nodesById[indexOrId] === renderable) {
            return this;
        }
        this._nodesById[indexOrId] = renderable;
    } else {
        if (this._dataSource === undefined) {
            this._dataSource = [];
            this._viewSequence = new ViewSequence(this._dataSource);
            this._initialViewSequence = this._viewSequence;
        }
        var dataSource = this._viewSequence || this._dataSource;
        if (indexOrId === -1) {
            dataSource.push(renderable);
        } else if (indexOrId === 0) {
            if (dataSource === this._viewSequence) {
                dataSource.splice(0, 0, renderable);
                if (this._viewSequence.getIndex() === 0) {
                    var nextViewSequence = this._viewSequence.getNext();
                    if (nextViewSequence && nextViewSequence.get()) {
                        this._viewSequence = nextViewSequence;
                    }
                }
            } else {
                dataSource.splice(0, 0, renderable);
            }
        } else {
            dataSource.splice(indexOrId, 0, renderable);
        }
    }
    if (insertSpec) {
        this._nodes.insertNode(this._nodes.createNode(renderable, insertSpec));
    }
    if (this.options.autoPipeEvents && renderable && renderable.pipe) {
        renderable.pipe(this);
        renderable.pipe(this._eventOutput);
    }
    this._isDirty = true;
    return this;
};
LayoutController.prototype.push = function (renderable, insertSpec) {
    return this.insert(-1, renderable, insertSpec);
};
function _getViewSequenceAtIndex(index, startViewSequence) {
    var viewSequence = startViewSequence || this._viewSequence;
    var i = viewSequence ? viewSequence.getIndex() : index;
    if (index > i) {
        while (viewSequence) {
            viewSequence = viewSequence.getNext();
            if (!viewSequence) {
                return undefined;
            }
            i = viewSequence.getIndex();
            if (i === index) {
                return viewSequence;
            } else if (index < i) {
                return undefined;
            }
        }
    } else if (index < i) {
        while (viewSequence) {
            viewSequence = viewSequence.getPrevious();
            if (!viewSequence) {
                return undefined;
            }
            i = viewSequence.getIndex();
            if (i === index) {
                return viewSequence;
            } else if (index > i) {
                return undefined;
            }
        }
    }
    return viewSequence;
}
function _getDataSourceArray() {
    if (Array.isArray(this._dataSource)) {
        return this._dataSource;
    } else if (this._viewSequence || this._viewSequence._) {
        return this._viewSequence._.array;
    }
    return undefined;
}
LayoutController.prototype.get = function (indexOrId) {
    if (this._nodesById || indexOrId instanceof String || typeof indexOrId === 'string') {
        return this._nodesById[indexOrId];
    }
    var viewSequence = _getViewSequenceAtIndex.call(this, indexOrId);
    return viewSequence ? viewSequence.get() : undefined;
};
LayoutController.prototype.swap = function (index, index2) {
    var array = _getDataSourceArray.call(this);
    if (!array) {
        throw '.swap is only supported for dataSources of type Array or ViewSequence';
    }
    if (index === index2) {
        return this;
    }
    if (index < 0 || index >= array.length) {
        throw 'Invalid index (' + index + ') specified to .swap';
    }
    if (index2 < 0 || index2 >= array.length) {
        throw 'Invalid second index (' + index2 + ') specified to .swap';
    }
    var renderNode = array[index];
    array[index] = array[index2];
    array[index2] = renderNode;
    this._isDirty = true;
    return this;
};
LayoutController.prototype.replace = function (indexOrId, renderable, noAnimation) {
    var oldRenderable;
    if (this._nodesById || indexOrId instanceof String || typeof indexOrId === 'string') {
        oldRenderable = this._nodesById[indexOrId];
        if (oldRenderable !== renderable) {
            if (noAnimation && oldRenderable) {
                var node = this._nodes.getNodeByRenderNode(oldRenderable);
                if (node) {
                    node.setRenderNode(renderable);
                }
            }
            this._nodesById[indexOrId] = renderable;
            this._isDirty = true;
        }
        return oldRenderable;
    }
    var array = _getDataSourceArray.call(this);
    if (!array) {
        return undefined;
    }
    if (indexOrId < 0 || indexOrId >= array.length) {
        throw 'Invalid index (' + indexOrId + ') specified to .replace';
    }
    oldRenderable = array[indexOrId];
    if (oldRenderable !== renderable) {
        array[indexOrId] = renderable;
        this._isDirty = true;
    }
    return oldRenderable;
};
LayoutController.prototype.move = function (index, newIndex) {
    var array = _getDataSourceArray.call(this);
    if (!array) {
        throw '.move is only supported for dataSources of type Array or ViewSequence';
    }
    if (index < 0 || index >= array.length) {
        throw 'Invalid index (' + index + ') specified to .move';
    }
    if (newIndex < 0 || newIndex >= array.length) {
        throw 'Invalid newIndex (' + newIndex + ') specified to .move';
    }
    var item = array.splice(index, 1)[0];
    array.splice(newIndex, 0, item);
    this._isDirty = true;
    return this;
};
LayoutController.prototype.remove = function (indexOrId, removeSpec) {
    var renderNode;
    if (this._nodesById || indexOrId instanceof String || typeof indexOrId === 'string') {
        if (indexOrId instanceof String || typeof indexOrId === 'string') {
            renderNode = this._nodesById[indexOrId];
            if (renderNode) {
                delete this._nodesById[indexOrId];
            }
        } else {
            for (var key in this._nodesById) {
                if (this._nodesById[key] === indexOrId) {
                    delete this._nodesById[key];
                    renderNode = indexOrId;
                    break;
                }
            }
        }
    } else if (indexOrId instanceof Number || typeof indexOrId === 'number') {
        var array = _getDataSourceArray.call(this);
        if (!array || indexOrId < 0 || indexOrId >= array.length) {
            throw 'Invalid index (' + indexOrId + ') specified to .remove (or dataSource doesn\'t support remove)';
        }
        renderNode = array[indexOrId];
        this._dataSource.splice(indexOrId, 1);
    } else {
        indexOrId = this._dataSource.indexOf(indexOrId);
        if (indexOrId >= 0) {
            this._dataSource.splice(indexOrId, 1);
            renderNode = indexOrId;
        }
    }
    if (this._viewSequence && renderNode) {
        var viewSequence = _getViewSequenceAtIndex.call(this, this._viewSequence.getIndex(), this._initialViewSequence);
        viewSequence = viewSequence || _getViewSequenceAtIndex.call(this, this._viewSequence.getIndex() - 1, this._initialViewSequence);
        viewSequence = viewSequence || this._dataSource;
        this._viewSequence = viewSequence;
    }
    if (renderNode && removeSpec) {
        var node = this._nodes.getNodeByRenderNode(renderNode);
        if (node) {
            node.remove(removeSpec || this.options.flowOptions.removeSpec);
        }
    }
    if (renderNode) {
        this._isDirty = true;
    }
    return renderNode;
};
LayoutController.prototype.removeAll = function (removeSpec) {
    if (this._nodesById) {
        var dirty = false;
        for (var key in this._nodesById) {
            delete this._nodesById[key];
            dirty = true;
        }
        if (dirty) {
            this._isDirty = true;
        }
    } else if (this._dataSource) {
        this.setDataSource([]);
    }
    if (removeSpec) {
        var node = this._nodes.getStartEnumNode();
        while (node) {
            node.remove(removeSpec || this.options.flowOptions.removeSpec);
            node = node._next;
        }
    }
    return this;
};
LayoutController.prototype.getSize = function () {
    return this._size || this.options.size;
};
LayoutController.prototype.render = function render() {
    return this.id;
};
LayoutController.prototype.commit = function commit(context) {
    var transform = context.transform;
    var origin = context.origin;
    var size = context.size;
    var opacity = context.opacity;
    if (this._resetFlowState) {
        this._resetFlowState = false;
        this._isDirty = true;
        this._nodes.removeAll();
    }
    if (size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1] || this._isDirty || this._nodes._trueSizeRequested || this.options.alwaysLayout) {
        var eventData = {
                target: this,
                oldSize: this._contextSizeCache,
                size: size,
                dirty: this._isDirty,
                trueSizeRequested: this._nodes._trueSizeRequested
            };
        this._eventOutput.emit('layoutstart', eventData);
        if (this.options.flow) {
            var lock = false;
            if (!this.options.flowOptions.reflowOnResize) {
                if (!this._isDirty && (size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1])) {
                    lock = undefined;
                } else {
                    lock = true;
                }
            }
            if (lock !== undefined) {
                var node = this._nodes.getStartEnumNode();
                while (node) {
                    node.releaseLock(lock);
                    node = node._next;
                }
            }
        }
        this._contextSizeCache[0] = size[0];
        this._contextSizeCache[1] = size[1];
        this._isDirty = false;
        var scrollEnd;
        if (this.options.size && this.options.size[this._direction] === true) {
            scrollEnd = 1000000;
        }
        var layoutContext = this._nodes.prepareForLayout(this._viewSequence, this._nodesById, {
                size: size,
                direction: this._direction,
                scrollEnd: scrollEnd
            });
        if (this._layout._function) {
            this._layout._function(layoutContext, this._layout.options);
        }
        this._nodes.removeNonInvalidatedNodes(this.options.flowOptions.removeSpec);
        this._nodes.removeVirtualViewSequenceNodes();
        if (scrollEnd) {
            scrollEnd = 0;
            node = this._nodes.getStartEnumNode();
            while (node) {
                if (node._invalidated && node.scrollLength) {
                    scrollEnd += node.scrollLength;
                }
                node = node._next;
            }
            this._size = this._size || [
                0,
                0
            ];
            this._size[0] = this.options.size[0];
            this._size[1] = this.options.size[1];
            this._size[this._direction] = scrollEnd;
        }
        var result = this._nodes.buildSpecAndDestroyUnrenderedNodes();
        this._specs = result.specs;
        this._commitOutput.target = result.specs;
        this._eventOutput.emit('layoutend', eventData);
        this._eventOutput.emit('reflow', { target: this });
    } else if (this.options.flow) {
        result = this._nodes.buildSpecAndDestroyUnrenderedNodes();
        this._specs = result.specs;
        this._commitOutput.target = result.specs;
        if (result.modified) {
            this._eventOutput.emit('reflow', { target: this });
        }
    }
    var target = this._commitOutput.target;
    for (var i = 0, j = target.length; i < j; i++) {
        if (target[i].renderNode) {
            target[i].target = target[i].renderNode.render();
        }
    }
    if (!target.length || target[target.length - 1] !== this._cleanupRegistration) {
        target.push(this._cleanupRegistration);
    }
    if (origin && (origin[0] !== 0 || origin[1] !== 0)) {
        transform = Transform.moveThen([
            -size[0] * origin[0],
            -size[1] * origin[1],
            0
        ], transform);
    }
    this._commitOutput.size = size;
    this._commitOutput.opacity = opacity;
    this._commitOutput.transform = transform;
    return this._commitOutput;
};
LayoutController.prototype.cleanup = function (context) {
    if (this.options.flow) {
        this._resetFlowState = true;
    }
};
module.exports = LayoutController;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./FlowLayoutNode":4,"./LayoutNode":7,"./LayoutNodeManager":8,"./LayoutUtility":9,"./helpers/LayoutDockHelper":12}],7:[function(require,module,exports){
(function (global){
var Transform = typeof window !== 'undefined' ? window.famous.core.Transform : typeof global !== 'undefined' ? global.famous.core.Transform : null;
var LayoutUtility = require('./LayoutUtility');
function LayoutNode(renderNode, spec) {
    this.renderNode = renderNode;
    this._spec = spec ? LayoutUtility.cloneSpec(spec) : {};
    this._spec.renderNode = renderNode;
    this._specModified = true;
    this._invalidated = false;
    this._removing = false;
}
LayoutNode.prototype.setRenderNode = function (renderNode) {
    this.renderNode = renderNode;
    this._spec.renderNode = renderNode;
};
LayoutNode.prototype.setOptions = function (options) {
};
LayoutNode.prototype.destroy = function () {
    this.renderNode = undefined;
    this._spec.renderNode = undefined;
    this._viewSequence = undefined;
};
LayoutNode.prototype.reset = function () {
    this._invalidated = false;
    this.trueSizeRequested = false;
};
LayoutNode.prototype.setSpec = function (spec) {
    this._specModified = true;
    if (spec.align) {
        if (!spec.align) {
            this._spec.align = [
                0,
                0
            ];
        }
        this._spec.align[0] = spec.align[0];
        this._spec.align[1] = spec.align[1];
    } else {
        this._spec.align = undefined;
    }
    if (spec.origin) {
        if (!spec.origin) {
            this._spec.origin = [
                0,
                0
            ];
        }
        this._spec.origin[0] = spec.origin[0];
        this._spec.origin[1] = spec.origin[1];
    } else {
        this._spec.origin = undefined;
    }
    if (spec.size) {
        if (!spec.size) {
            this._spec.size = [
                0,
                0
            ];
        }
        this._spec.size[0] = spec.size[0];
        this._spec.size[1] = spec.size[1];
    } else {
        this._spec.size = undefined;
    }
    if (spec.transform) {
        if (!spec.transform) {
            this._spec.transform = spec.transform.slice(0);
        } else {
            for (var i = 0; i < 16; i++) {
                this._spec.transform[i] = spec.transform[i];
            }
        }
    } else {
        this._spec.transform = undefined;
    }
    this._spec.opacity = spec.opacity;
};
LayoutNode.prototype.set = function (set, size) {
    this._invalidated = true;
    this._specModified = true;
    this._removing = false;
    var spec = this._spec;
    spec.opacity = set.opacity;
    if (set.size) {
        if (!spec.size) {
            spec.size = [
                0,
                0
            ];
        }
        spec.size[0] = set.size[0];
        spec.size[1] = set.size[1];
    } else {
        spec.size = undefined;
    }
    if (set.origin) {
        if (!spec.origin) {
            spec.origin = [
                0,
                0
            ];
        }
        spec.origin[0] = set.origin[0];
        spec.origin[1] = set.origin[1];
    } else {
        spec.origin = undefined;
    }
    if (set.align) {
        if (!spec.align) {
            spec.align = [
                0,
                0
            ];
        }
        spec.align[0] = set.align[0];
        spec.align[1] = set.align[1];
    } else {
        spec.align = undefined;
    }
    if (set.skew || set.rotate || set.scale) {
        this._spec.transform = Transform.build({
            translate: set.translate || [
                0,
                0,
                0
            ],
            skew: set.skew || [
                0,
                0,
                0
            ],
            scale: set.scale || [
                1,
                1,
                1
            ],
            rotate: set.rotate || [
                0,
                0,
                0
            ]
        });
    } else if (set.translate) {
        this._spec.transform = Transform.translate(set.translate[0], set.translate[1], set.translate[2]);
    } else {
        this._spec.transform = undefined;
    }
    this.scrollLength = set.scrollLength;
};
LayoutNode.prototype.getSpec = function () {
    this._specModified = false;
    this._spec.removed = !this._invalidated;
    return this._spec;
};
LayoutNode.prototype.remove = function (removeSpec) {
    this._removing = true;
};
module.exports = LayoutNode;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./LayoutUtility":9}],8:[function(require,module,exports){
var LayoutContext = require('./LayoutContext');
var LayoutUtility = require('./LayoutUtility');
var MAX_POOL_SIZE = 100;
function LayoutNodeManager(LayoutNode, initLayoutNodeFn) {
    this.LayoutNode = LayoutNode;
    this._initLayoutNodeFn = initLayoutNodeFn;
    this._layoutCount = 0;
    this._context = new LayoutContext({
        next: _contextNext.bind(this),
        prev: _contextPrev.bind(this),
        get: _contextGet.bind(this),
        set: _contextSet.bind(this),
        resolveSize: _contextResolveSize.bind(this),
        size: [
            0,
            0
        ]
    });
    this._contextState = {};
    this._pool = {
        layoutNodes: { size: 0 },
        resolveSize: [
            0,
            0
        ]
    };
}
LayoutNodeManager.prototype.prepareForLayout = function (viewSequence, nodesById, contextData) {
    var node = this._first;
    while (node) {
        node.reset();
        node = node._next;
    }
    var context = this._context;
    this._layoutCount++;
    this._nodesById = nodesById;
    this._trueSizeRequested = false;
    this._reevalTrueSize = contextData.reevalTrueSize || !context.size || context.size[0] !== contextData.size[0] || context.size[1] !== contextData.size[1];
    var contextState = this._contextState;
    contextState.startSequence = viewSequence;
    contextState.nextSequence = viewSequence;
    contextState.prevSequence = viewSequence;
    contextState.start = undefined;
    contextState.nextGetIndex = 0;
    contextState.prevGetIndex = 0;
    contextState.nextSetIndex = 0;
    contextState.prevSetIndex = 0;
    contextState.addCount = 0;
    contextState.removeCount = 0;
    contextState.lastRenderNode = undefined;
    context.size[0] = contextData.size[0];
    context.size[1] = contextData.size[1];
    context.direction = contextData.direction;
    context.reverse = contextData.reverse;
    context.alignment = contextData.reverse ? 1 : 0;
    context.scrollOffset = contextData.scrollOffset || 0;
    context.scrollStart = contextData.scrollStart || 0;
    context.scrollEnd = contextData.scrollEnd || context.size[context.direction];
    return context;
};
LayoutNodeManager.prototype.removeNonInvalidatedNodes = function (removeSpec) {
    var node = this._first;
    while (node) {
        if (!node._invalidated && !node._removing) {
            node.remove(removeSpec);
        }
        node = node._next;
    }
};
LayoutNodeManager.prototype.removeVirtualViewSequenceNodes = function () {
    if (this._contextState.startSequence && this._contextState.startSequence.cleanup) {
        this._contextState.startSequence.cleanup();
    }
};
LayoutNodeManager.prototype.buildSpecAndDestroyUnrenderedNodes = function (translate) {
    var specs = [];
    var result = {
            specs: specs,
            modified: false
        };
    var node = this._first;
    while (node) {
        var modified = node._specModified;
        var spec = node.getSpec();
        if (spec.removed) {
            var destroyNode = node;
            node = node._next;
            _destroyNode.call(this, destroyNode);
            result.modified = true;
        } else {
            if (modified) {
                if (spec.transform && translate) {
                    spec.transform[12] += translate[0];
                    spec.transform[13] += translate[1];
                    spec.transform[14] += translate[2];
                    spec.transform[12] = Math.round(spec.transform[12] * 100000) / 100000;
                    spec.transform[13] = Math.round(spec.transform[13] * 100000) / 100000;
                    if (spec.endState) {
                        spec.endState.transform[12] += translate[0];
                        spec.endState.transform[13] += translate[1];
                        spec.endState.transform[14] += translate[2];
                        spec.endState.transform[12] = Math.round(spec.endState.transform[12] * 100000) / 100000;
                        spec.endState.transform[13] = Math.round(spec.endState.transform[13] * 100000) / 100000;
                    }
                }
                result.modified = true;
            }
            specs.push(spec);
            node = node._next;
        }
    }
    this._contextState.addCount = 0;
    this._contextState.removeCount = 0;
    return result;
};
LayoutNodeManager.prototype.getNodeByRenderNode = function (renderable) {
    var node = this._first;
    while (node) {
        if (node.renderNode === renderable) {
            return node;
        }
        node = node._next;
    }
    return undefined;
};
LayoutNodeManager.prototype.insertNode = function (node) {
    node._next = this._first;
    if (this._first) {
        this._first._prev = node;
    }
    this._first = node;
};
LayoutNodeManager.prototype.setNodeOptions = function (options) {
    this._nodeOptions = options;
    var node = this._first;
    while (node) {
        node.setOptions(options);
        node = node._next;
    }
    node = this._pool.layoutNodes.first;
    while (node) {
        node.setOptions(options);
        node = node._next;
    }
};
LayoutNodeManager.prototype.preallocateNodes = function (count, spec) {
    var nodes = [];
    for (var i = 0; i < count; i++) {
        nodes.push(this.createNode(undefined, spec));
    }
    for (i = 0; i < count; i++) {
        _destroyNode.call(this, nodes[i]);
    }
};
LayoutNodeManager.prototype.createNode = function (renderNode, spec) {
    var node;
    if (this._pool.layoutNodes.first) {
        node = this._pool.layoutNodes.first;
        this._pool.layoutNodes.first = node._next;
        this._pool.layoutNodes.size--;
        node.constructor.apply(node, arguments);
    } else {
        node = new this.LayoutNode(renderNode, spec);
        if (this._nodeOptions) {
            node.setOptions(this._nodeOptions);
        }
    }
    node._prev = undefined;
    node._next = undefined;
    node._viewSequence = undefined;
    node._layoutCount = 0;
    if (this._initLayoutNodeFn) {
        this._initLayoutNodeFn.call(this, node, spec);
    }
    return node;
};
LayoutNodeManager.prototype.removeAll = function () {
    var node = this._first;
    while (node) {
        var next = node._next;
        _destroyNode.call(this, node);
        node = next;
    }
    this._first = undefined;
};
function _destroyNode(node) {
    if (node._next) {
        node._next._prev = node._prev;
    }
    if (node._prev) {
        node._prev._next = node._next;
    } else {
        this._first = node._next;
    }
    node.destroy();
    if (this._pool.layoutNodes.size < MAX_POOL_SIZE) {
        this._pool.layoutNodes.size++;
        node._prev = undefined;
        node._next = this._pool.layoutNodes.first;
        this._pool.layoutNodes.first = node;
    }
}
LayoutNodeManager.prototype.getStartEnumNode = function (next) {
    if (next === undefined) {
        return this._first;
    } else if (next === true) {
        return this._contextState.start && this._contextState.startPrev ? this._contextState.start._next : this._contextState.start;
    } else if (next === false) {
        return this._contextState.start && !this._contextState.startPrev ? this._contextState.start._prev : this._contextState.start;
    }
};
function _contextGetCreateAndOrderNodes(renderNode, prev) {
    var node;
    var state = this._contextState;
    if (!state.start) {
        node = this._first;
        while (node) {
            if (node.renderNode === renderNode) {
                break;
            }
            node = node._next;
        }
        if (!node) {
            node = this.createNode(renderNode);
            node._next = this._first;
            if (this._first) {
                this._first._prev = node;
            }
            this._first = node;
        }
        state.start = node;
        state.startPrev = prev;
        state.prev = node;
        state.next = node;
        return node;
    }
    if (prev) {
        if (state.prev._prev && state.prev._prev.renderNode === renderNode) {
            state.prev = state.prev._prev;
            return state.prev;
        }
    } else {
        if (state.next._next && state.next._next.renderNode === renderNode) {
            state.next = state.next._next;
            return state.next;
        }
    }
    node = this._first;
    while (node) {
        if (node.renderNode === renderNode) {
            break;
        }
        node = node._next;
    }
    if (!node) {
        node = this.createNode(renderNode);
    } else {
        if (node._next) {
            node._next._prev = node._prev;
        }
        if (node._prev) {
            node._prev._next = node._next;
        } else {
            this._first = node._next;
        }
        node._next = undefined;
        node._prev = undefined;
    }
    if (prev) {
        if (state.prev._prev) {
            node._prev = state.prev._prev;
            state.prev._prev._next = node;
        } else {
            this._first = node;
        }
        state.prev._prev = node;
        node._next = state.prev;
        state.prev = node;
    } else {
        if (state.next._next) {
            node._next = state.next._next;
            state.next._next._prev = node;
        }
        state.next._next = node;
        node._prev = state.next;
        state.next = node;
    }
    return node;
}
function _contextNext() {
    if (!this._contextState.nextSequence) {
        return undefined;
    }
    if (this._context.reverse) {
        this._contextState.nextSequence = this._contextState.nextSequence.getNext();
        if (!this._contextState.nextSequence) {
            return undefined;
        }
    }
    var renderNode = this._contextState.nextSequence.get();
    if (!renderNode) {
        this._contextState.nextSequence = undefined;
        return undefined;
    }
    var nextSequence = this._contextState.nextSequence;
    if (!this._context.reverse) {
        this._contextState.nextSequence = this._contextState.nextSequence.getNext();
    }
    if (this._contextState.lastRenderNode === renderNode) {
        throw 'ViewSequence is corrupted, should never contain the same renderNode twice, index: ' + nextSequence.getIndex();
    }
    this._contextState.lastRenderNode = renderNode;
    return {
        renderNode: renderNode,
        viewSequence: nextSequence,
        next: true,
        index: ++this._contextState.nextGetIndex
    };
}
function _contextPrev() {
    if (!this._contextState.prevSequence) {
        return undefined;
    }
    if (!this._context.reverse) {
        this._contextState.prevSequence = this._contextState.prevSequence.getPrevious();
        if (!this._contextState.prevSequence) {
            return undefined;
        }
    }
    var renderNode = this._contextState.prevSequence.get();
    if (!renderNode) {
        this._contextState.prevSequence = undefined;
        return undefined;
    }
    var prevSequence = this._contextState.prevSequence;
    if (this._context.reverse) {
        this._contextState.prevSequence = this._contextState.prevSequence.getPrevious();
    }
    if (this._contextState.lastRenderNode === renderNode) {
        throw 'ViewSequence is corrupted, should never contain the same renderNode twice, index: ' + prevSequence.getIndex();
    }
    this._contextState.lastRenderNode = renderNode;
    return {
        renderNode: renderNode,
        viewSequence: prevSequence,
        prev: true,
        index: --this._contextState.prevGetIndex
    };
}
function _contextGet(contextNodeOrId) {
    if (this._nodesById && (contextNodeOrId instanceof String || typeof contextNodeOrId === 'string')) {
        var renderNode = this._nodesById[contextNodeOrId];
        if (!renderNode) {
            return undefined;
        }
        if (renderNode instanceof Array) {
            var result = [];
            for (var i = 0, j = renderNode.length; i < j; i++) {
                result.push({
                    renderNode: renderNode[i],
                    arrayElement: true
                });
            }
            return result;
        }
        return {
            renderNode: renderNode,
            byId: true
        };
    } else {
        return contextNodeOrId;
    }
}
function _contextSet(contextNodeOrId, set) {
    var contextNode = this._nodesById ? _contextGet.call(this, contextNodeOrId) : contextNodeOrId;
    if (contextNode) {
        var node = contextNode.node;
        if (!node) {
            if (contextNode.next) {
                if (contextNode.index < this._contextState.nextSetIndex) {
                    LayoutUtility.error('Nodes must be layed out in the same order as they were requested!');
                }
                this._contextState.nextSetIndex = contextNode.index;
            } else if (contextNode.prev) {
                if (contextNode.index > this._contextState.prevSetIndex) {
                    LayoutUtility.error('Nodes must be layed out in the same order as they were requested!');
                }
                this._contextState.prevSetIndex = contextNode.index;
            }
            node = _contextGetCreateAndOrderNodes.call(this, contextNode.renderNode, contextNode.prev);
            node._viewSequence = contextNode.viewSequence;
            node._layoutCount++;
            if (node._layoutCount === 1) {
                this._contextState.addCount++;
            }
            contextNode.node = node;
        }
        node.usesTrueSize = contextNode.usesTrueSize;
        node.trueSizeRequested = contextNode.trueSizeRequested;
        node.set(set, this._context.size);
        contextNode.set = set;
    }
    return set;
}
function _contextResolveSize(contextNodeOrId, parentSize) {
    var contextNode = this._nodesById ? _contextGet.call(this, contextNodeOrId) : contextNodeOrId;
    var resolveSize = this._pool.resolveSize;
    if (!contextNode) {
        resolveSize[0] = 0;
        resolveSize[1] = 0;
        return resolveSize;
    }
    var renderNode = contextNode.renderNode;
    var size = renderNode.getSize();
    if (!size) {
        return parentSize;
    }
    var configSize = renderNode.size && renderNode._trueSizeCheck !== undefined ? renderNode.size : undefined;
    if (configSize && (configSize[0] === true || configSize[1] === true)) {
        contextNode.usesTrueSize = true;
        var backupSize = renderNode._backupSize;
        if (renderNode._contentDirty || renderNode._trueSizeCheck) {
            this._trueSizeRequested = true;
            contextNode.trueSizeRequested = true;
        }
        if (renderNode._trueSizeCheck) {
            if (backupSize && configSize !== size) {
                var newWidth = configSize[0] === true ? Math.max(backupSize[0], size[0]) : size[0];
                var newHeight = configSize[1] === true ? Math.max(backupSize[1], size[1]) : size[1];
                backupSize[0] = newWidth;
                backupSize[1] = newHeight;
                size = backupSize;
                renderNode._backupSize = undefined;
                backupSize = undefined;
            }
        }
        if (this._reevalTrueSize || backupSize && (backupSize[0] !== size[0] || backupSize[1] !== size[1])) {
            renderNode._trueSizeCheck = true;
            renderNode._sizeDirty = true;
            this._trueSizeRequested = true;
        }
        if (!backupSize) {
            renderNode._backupSize = [
                0,
                0
            ];
            backupSize = renderNode._backupSize;
        }
        backupSize[0] = size[0];
        backupSize[1] = size[1];
    }
    configSize = renderNode._nodes ? renderNode.options.size : undefined;
    if (configSize && (configSize[0] === true || configSize[1] === true)) {
        if (this._reevalTrueSize || renderNode._nodes._trueSizeRequested) {
            contextNode.usesTrueSize = true;
            contextNode.trueSizeRequested = true;
            this._trueSizeRequested = true;
        }
    }
    if (size[0] === undefined || size[0] === true || size[1] === undefined || size[1] === true) {
        resolveSize[0] = size[0];
        resolveSize[1] = size[1];
        size = resolveSize;
        if (size[0] === undefined) {
            size[0] = parentSize[0];
        } else if (size[0] === true) {
            size[0] = 0;
            this._trueSizeRequested = true;
            contextNode.trueSizeRequested = true;
        }
        if (size[1] === undefined) {
            size[1] = parentSize[1];
        } else if (size[1] === true) {
            size[1] = 0;
            this._trueSizeRequested = true;
            contextNode.trueSizeRequested = true;
        }
    }
    return size;
}
module.exports = LayoutNodeManager;
},{"./LayoutContext":5,"./LayoutUtility":9}],9:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
function LayoutUtility() {
}
LayoutUtility.registeredHelpers = {};
var Capabilities = {
        SEQUENCE: 1,
        DIRECTION_X: 2,
        DIRECTION_Y: 4,
        SCROLLING: 8
    };
LayoutUtility.Capabilities = Capabilities;
LayoutUtility.normalizeMargins = function (margins) {
    if (!margins) {
        return [
            0,
            0,
            0,
            0
        ];
    } else if (!Array.isArray(margins)) {
        return [
            margins,
            margins,
            margins,
            margins
        ];
    } else if (margins.length === 0) {
        return [
            0,
            0,
            0,
            0
        ];
    } else if (margins.length === 1) {
        return [
            margins[0],
            margins[0],
            margins[0],
            margins[0]
        ];
    } else if (margins.length === 2) {
        return [
            margins[0],
            margins[1],
            margins[0],
            margins[1]
        ];
    } else {
        return margins;
    }
};
LayoutUtility.cloneSpec = function (spec) {
    var clone = {};
    if (spec.opacity !== undefined) {
        clone.opacity = spec.opacity;
    }
    if (spec.size !== undefined) {
        clone.size = spec.size.slice(0);
    }
    if (spec.transform !== undefined) {
        clone.transform = spec.transform.slice(0);
    }
    if (spec.origin !== undefined) {
        clone.origin = spec.origin.slice(0);
    }
    if (spec.align !== undefined) {
        clone.align = spec.align.slice(0);
    }
    return clone;
};
function _isEqualArray(a, b) {
    if (a === b) {
        return true;
    }
    if (a === undefined || b === undefined) {
        return false;
    }
    var i = a.length;
    if (i !== b.length) {
        return false;
    }
    while (i--) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
LayoutUtility.isEqualSpec = function (spec1, spec2) {
    if (spec1.opacity !== spec2.opacity) {
        return false;
    }
    if (!_isEqualArray(spec1.size, spec2.size)) {
        return false;
    }
    if (!_isEqualArray(spec1.transform, spec2.transform)) {
        return false;
    }
    if (!_isEqualArray(spec1.origin, spec2.origin)) {
        return false;
    }
    if (!_isEqualArray(spec1.align, spec2.align)) {
        return false;
    }
    return true;
};
LayoutUtility.getSpecDiffText = function (spec1, spec2) {
    var result = 'spec diff:';
    if (spec1.opacity !== spec2.opacity) {
        result += '\nopacity: ' + spec1.opacity + ' != ' + spec2.opacity;
    }
    if (!_isEqualArray(spec1.size, spec2.size)) {
        result += '\nsize: ' + JSON.stringify(spec1.size) + ' != ' + JSON.stringify(spec2.size);
    }
    if (!_isEqualArray(spec1.transform, spec2.transform)) {
        result += '\ntransform: ' + JSON.stringify(spec1.transform) + ' != ' + JSON.stringify(spec2.transform);
    }
    if (!_isEqualArray(spec1.origin, spec2.origin)) {
        result += '\norigin: ' + JSON.stringify(spec1.origin) + ' != ' + JSON.stringify(spec2.origin);
    }
    if (!_isEqualArray(spec1.align, spec2.align)) {
        result += '\nalign: ' + JSON.stringify(spec1.align) + ' != ' + JSON.stringify(spec2.align);
    }
    return result;
};
LayoutUtility.error = function (message) {
    console.log('ERROR: ' + message);
    throw message;
};
LayoutUtility.warning = function (message) {
    console.log('WARNING: ' + message);
};
LayoutUtility.log = function (args) {
    var message = '';
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if (arg instanceof Object || arg instanceof Array) {
            message += JSON.stringify(arg);
        } else {
            message += arg;
        }
    }
    console.log(message);
};
LayoutUtility.combineOptions = function (options1, options2, forceClone) {
    if (options1 && !options2 && !forceClone) {
        return options1;
    } else if (!options1 && options2 && !forceClone) {
        return options2;
    }
    var options = Utility.clone(options1 || {});
    if (options2) {
        for (var key in options2) {
            options[key] = options2[key];
        }
    }
    return options;
};
LayoutUtility.registerHelper = function (name, Helper) {
    if (!Helper.prototype.parse) {
        LayoutUtility.error('The layout-helper for name "' + name + '" is required to support the "parse" method');
    }
    if (this.registeredHelpers[name] !== undefined) {
        LayoutUtility.warning('A layout-helper with the name "' + name + '" is already registered and will be overwritten');
    }
    this.registeredHelpers[name] = Helper;
};
LayoutUtility.unregisterHelper = function (name) {
    delete this.registeredHelpers[name];
};
LayoutUtility.getRegisteredHelper = function (name) {
    return this.registeredHelpers[name];
};
module.exports = LayoutUtility;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],10:[function(require,module,exports){
(function (global){
var LayoutUtility = require('./LayoutUtility');
var LayoutController = require('./LayoutController');
var LayoutNode = require('./LayoutNode');
var FlowLayoutNode = require('./FlowLayoutNode');
var LayoutNodeManager = require('./LayoutNodeManager');
var ContainerSurface = typeof window !== 'undefined' ? window.famous.surfaces.ContainerSurface : typeof global !== 'undefined' ? global.famous.surfaces.ContainerSurface : null;
var Transform = typeof window !== 'undefined' ? window.famous.core.Transform : typeof global !== 'undefined' ? global.famous.core.Transform : null;
var EventHandler = typeof window !== 'undefined' ? window.famous.core.EventHandler : typeof global !== 'undefined' ? global.famous.core.EventHandler : null;
var Group = typeof window !== 'undefined' ? window.famous.core.Group : typeof global !== 'undefined' ? global.famous.core.Group : null;
var Vector = typeof window !== 'undefined' ? window.famous.math.Vector : typeof global !== 'undefined' ? global.famous.math.Vector : null;
var PhysicsEngine = typeof window !== 'undefined' ? window.famous.physics.PhysicsEngine : typeof global !== 'undefined' ? global.famous.physics.PhysicsEngine : null;
var Particle = typeof window !== 'undefined' ? window.famous.physics.bodies.Particle : typeof global !== 'undefined' ? global.famous.physics.bodies.Particle : null;
var Drag = typeof window !== 'undefined' ? window.famous.physics.forces.Drag : typeof global !== 'undefined' ? global.famous.physics.forces.Drag : null;
var Spring = typeof window !== 'undefined' ? window.famous.physics.forces.Spring : typeof global !== 'undefined' ? global.famous.physics.forces.Spring : null;
var ScrollSync = typeof window !== 'undefined' ? window.famous.inputs.ScrollSync : typeof global !== 'undefined' ? global.famous.inputs.ScrollSync : null;
var ViewSequence = typeof window !== 'undefined' ? window.famous.core.ViewSequence : typeof global !== 'undefined' ? global.famous.core.ViewSequence : null;
var Bounds = {
        NONE: 0,
        PREV: 1,
        NEXT: 2,
        BOTH: 3
    };
var SpringSource = {
        NONE: 'none',
        NEXTBOUNDS: 'next-bounds',
        PREVBOUNDS: 'prev-bounds',
        MINSIZE: 'minimal-size',
        GOTOSEQUENCE: 'goto-sequence',
        ENSUREVISIBLE: 'ensure-visible',
        GOTOPREVDIRECTION: 'goto-prev-direction',
        GOTONEXTDIRECTION: 'goto-next-direction'
    };
var PaginationMode = {
        PAGE: 0,
        SCROLL: 1
    };
function ScrollController(options) {
    options = LayoutUtility.combineOptions(ScrollController.DEFAULT_OPTIONS, options);
    var layoutManager = new LayoutNodeManager(options.flow ? FlowLayoutNode : LayoutNode, _initLayoutNode.bind(this));
    LayoutController.call(this, options, layoutManager);
    this._scroll = {
        activeTouches: [],
        pe: new PhysicsEngine(),
        particle: new Particle(this.options.scrollParticle),
        dragForce: new Drag(this.options.scrollDrag),
        frictionForce: new Drag(this.options.scrollFriction),
        springValue: undefined,
        springForce: new Spring(this.options.scrollSpring),
        springEndState: new Vector([
            0,
            0,
            0
        ]),
        groupStart: 0,
        groupTranslate: [
            0,
            0,
            0
        ],
        scrollDelta: 0,
        normalizedScrollDelta: 0,
        scrollForce: 0,
        scrollForceCount: 0,
        unnormalizedScrollOffset: 0,
        isScrolling: false
    };
    this._debug = {
        layoutCount: 0,
        commitCount: 0
    };
    this.group = new Group();
    this.group.add({ render: _innerRender.bind(this) });
    this._scroll.pe.addBody(this._scroll.particle);
    if (!this.options.scrollDrag.disabled) {
        this._scroll.dragForceId = this._scroll.pe.attach(this._scroll.dragForce, this._scroll.particle);
    }
    if (!this.options.scrollFriction.disabled) {
        this._scroll.frictionForceId = this._scroll.pe.attach(this._scroll.frictionForce, this._scroll.particle);
    }
    this._scroll.springForce.setOptions({ anchor: this._scroll.springEndState });
    this._eventInput.on('touchstart', _touchStart.bind(this));
    this._eventInput.on('touchmove', _touchMove.bind(this));
    this._eventInput.on('touchend', _touchEnd.bind(this));
    this._eventInput.on('touchcancel', _touchEnd.bind(this));
    this._eventInput.on('mousedown', _mouseDown.bind(this));
    this._eventInput.on('mouseup', _mouseUp.bind(this));
    this._eventInput.on('mousemove', _mouseMove.bind(this));
    this._scrollSync = new ScrollSync(this.options.scrollSync);
    this._eventInput.pipe(this._scrollSync);
    this._scrollSync.on('update', _scrollUpdate.bind(this));
    if (this.options.useContainer) {
        this.container = new ContainerSurface(this.options.container);
        this.container.add({
            render: function () {
                return this.id;
            }.bind(this)
        });
        if (!this.options.autoPipeEvents) {
            this.subscribe(this.container);
            EventHandler.setInputHandler(this.container, this);
            EventHandler.setOutputHandler(this.container, this);
        }
    }
}
ScrollController.prototype = Object.create(LayoutController.prototype);
ScrollController.prototype.constructor = ScrollController;
ScrollController.Bounds = Bounds;
ScrollController.PaginationMode = PaginationMode;
ScrollController.DEFAULT_OPTIONS = {
    useContainer: false,
    container: { properties: { overflow: 'hidden' } },
    scrollParticle: {},
    scrollDrag: {
        forceFunction: Drag.FORCE_FUNCTIONS.QUADRATIC,
        strength: 0.001,
        disabled: true
    },
    scrollFriction: {
        forceFunction: Drag.FORCE_FUNCTIONS.LINEAR,
        strength: 0.0025,
        disabled: false
    },
    scrollSpring: {
        dampingRatio: 1,
        period: 350
    },
    scrollSync: { scale: 0.2 },
    overscroll: true,
    paginated: false,
    paginationMode: PaginationMode.PAGE,
    paginationEnergyThresshold: 0.01,
    alignment: 0,
    touchMoveDirectionThresshold: undefined,
    touchMoveNoVelocityDuration: 100,
    mouseMove: false,
    enabled: true,
    layoutAll: false,
    alwaysLayout: false,
    extraBoundsSpace: [
        100,
        100
    ],
    debug: false
};
ScrollController.prototype.setOptions = function (options) {
    LayoutController.prototype.setOptions.call(this, options);
    if (this._scroll) {
        if (options.scrollSpring) {
            this._scroll.springForce.setOptions(options.scrollSpring);
        }
        if (options.scrollDrag) {
            this._scroll.dragForce.setOptions(options.scrollDrag);
        }
    }
    if (options.scrollSync && this._scrollSync) {
        this._scrollSync.setOptions(options.scrollSync);
    }
    return this;
};
function _initLayoutNode(node, spec) {
    if (!spec && this.options.flowOptions.insertSpec) {
        node.setSpec(this.options.flowOptions.insertSpec);
    }
}
function _updateSpring() {
    var springValue = this._scroll.scrollForceCount ? undefined : this._scroll.springPosition;
    if (this._scroll.springValue !== springValue) {
        this._scroll.springValue = springValue;
        if (springValue === undefined) {
            if (this._scroll.springForceId !== undefined) {
                this._scroll.pe.detach(this._scroll.springForceId);
                this._scroll.springForceId = undefined;
            }
        } else {
            if (this._scroll.springForceId === undefined) {
                this._scroll.springForceId = this._scroll.pe.attach(this._scroll.springForce, this._scroll.particle);
            }
            this._scroll.springEndState.set1D(springValue);
            this._scroll.pe.wake();
        }
    }
}
function _mouseDown(event) {
    if (!this.options.mouseMove) {
        return;
    }
    if (this._scroll.mouseMove) {
        this.releaseScrollForce(this._scroll.mouseMove.delta);
    }
    var current = [
            event.clientX,
            event.clientY
        ];
    var time = Date.now();
    this._scroll.mouseMove = {
        delta: 0,
        start: current,
        current: current,
        prev: current,
        time: time,
        prevTime: time
    };
    this.applyScrollForce(this._scroll.mouseMove.delta);
}
function _mouseMove(event) {
    if (!this._scroll.mouseMove || !this.options.enabled) {
        return;
    }
    var moveDirection = Math.atan2(Math.abs(event.clientY - this._scroll.mouseMove.prev[1]), Math.abs(event.clientX - this._scroll.mouseMove.prev[0])) / (Math.PI / 2);
    var directionDiff = Math.abs(this._direction - moveDirection);
    if (this.options.touchMoveDirectionThresshold === undefined || directionDiff <= this.options.touchMoveDirectionThresshold) {
        this._scroll.mouseMove.prev = this._scroll.mouseMove.current;
        this._scroll.mouseMove.current = [
            event.clientX,
            event.clientY
        ];
        this._scroll.mouseMove.prevTime = this._scroll.mouseMove.time;
        this._scroll.mouseMove.direction = moveDirection;
        this._scroll.mouseMove.time = Date.now();
    }
    var delta = this._scroll.mouseMove.current[this._direction] - this._scroll.mouseMove.start[this._direction];
    this.updateScrollForce(this._scroll.mouseMove.delta, delta);
    this._scroll.mouseMove.delta = delta;
}
function _mouseUp(event) {
    if (!this._scroll.mouseMove) {
        return;
    }
    var velocity = 0;
    var diffTime = this._scroll.mouseMove.time - this._scroll.mouseMove.prevTime;
    if (diffTime > 0 && Date.now() - this._scroll.mouseMove.time <= this.options.touchMoveNoVelocityDuration) {
        var diffOffset = this._scroll.mouseMove.current[this._direction] - this._scroll.mouseMove.prev[this._direction];
        velocity = diffOffset / diffTime;
    }
    this.releaseScrollForce(this._scroll.mouseMove.delta, velocity);
    this._scroll.mouseMove = undefined;
}
function _touchStart(event) {
    if (!this._touchEndEventListener) {
        this._touchEndEventListener = function (event2) {
            event2.target.removeEventListener('touchend', this._touchEndEventListener);
            _touchEnd.call(this, event2);
        }.bind(this);
    }
    var oldTouchesCount = this._scroll.activeTouches.length;
    var i = 0;
    var j;
    var touchFound;
    while (i < this._scroll.activeTouches.length) {
        var activeTouch = this._scroll.activeTouches[i];
        touchFound = false;
        for (j = 0; j < event.touches.length; j++) {
            var touch = event.touches[j];
            if (touch.identifier === activeTouch.id) {
                touchFound = true;
                break;
            }
        }
        if (!touchFound) {
            this._scroll.activeTouches.splice(i, 1);
        } else {
            i++;
        }
    }
    for (i = 0; i < event.touches.length; i++) {
        var changedTouch = event.touches[i];
        touchFound = false;
        for (j = 0; j < this._scroll.activeTouches.length; j++) {
            if (this._scroll.activeTouches[j].id === changedTouch.identifier) {
                touchFound = true;
                break;
            }
        }
        if (!touchFound) {
            var current = [
                    changedTouch.clientX,
                    changedTouch.clientY
                ];
            var time = Date.now();
            this._scroll.activeTouches.push({
                id: changedTouch.identifier,
                start: current,
                current: current,
                prev: current,
                time: time,
                prevTime: time
            });
            changedTouch.target.addEventListener('touchend', this._touchEndEventListener);
        }
    }
    if (!oldTouchesCount && this._scroll.activeTouches.length) {
        this.applyScrollForce(0);
        this._scroll.touchDelta = 0;
    }
}
function _touchMove(event) {
    if (!this.options.enabled) {
        return;
    }
    var primaryTouch;
    for (var i = 0; i < event.changedTouches.length; i++) {
        var changedTouch = event.changedTouches[i];
        for (var j = 0; j < this._scroll.activeTouches.length; j++) {
            var touch = this._scroll.activeTouches[j];
            if (touch.id === changedTouch.identifier) {
                var moveDirection = Math.atan2(Math.abs(changedTouch.clientY - touch.prev[1]), Math.abs(changedTouch.clientX - touch.prev[0])) / (Math.PI / 2);
                var directionDiff = Math.abs(this._direction - moveDirection);
                if (this.options.touchMoveDirectionThresshold === undefined || directionDiff <= this.options.touchMoveDirectionThresshold) {
                    touch.prev = touch.current;
                    touch.current = [
                        changedTouch.clientX,
                        changedTouch.clientY
                    ];
                    touch.prevTime = touch.time;
                    touch.direction = moveDirection;
                    touch.time = Date.now();
                    primaryTouch = j === 0 ? touch : undefined;
                }
            }
        }
    }
    if (primaryTouch) {
        var delta = primaryTouch.current[this._direction] - primaryTouch.start[this._direction];
        this.updateScrollForce(this._scroll.touchDelta, delta);
        this._scroll.touchDelta = delta;
    }
}
function _touchEnd(event) {
    var primaryTouch = this._scroll.activeTouches.length ? this._scroll.activeTouches[0] : undefined;
    for (var i = 0; i < event.changedTouches.length; i++) {
        var changedTouch = event.changedTouches[i];
        for (var j = 0; j < this._scroll.activeTouches.length; j++) {
            var touch = this._scroll.activeTouches[j];
            if (touch.id === changedTouch.identifier) {
                this._scroll.activeTouches.splice(j, 1);
                if (j === 0 && this._scroll.activeTouches.length) {
                    var newPrimaryTouch = this._scroll.activeTouches[0];
                    newPrimaryTouch.start[0] = newPrimaryTouch.current[0] - (touch.current[0] - touch.start[0]);
                    newPrimaryTouch.start[1] = newPrimaryTouch.current[1] - (touch.current[1] - touch.start[1]);
                }
                break;
            }
        }
    }
    if (!primaryTouch || this._scroll.activeTouches.length) {
        return;
    }
    var velocity = 0;
    var diffTime = primaryTouch.time - primaryTouch.prevTime;
    if (diffTime > 0 && Date.now() - primaryTouch.time <= this.options.touchMoveNoVelocityDuration) {
        var diffOffset = primaryTouch.current[this._direction] - primaryTouch.prev[this._direction];
        velocity = diffOffset / diffTime;
    }
    var delta = this._scroll.touchDelta;
    this.releaseScrollForce(delta, velocity);
    this._scroll.touchDelta = 0;
}
function _scrollUpdate(event) {
    if (!this.options.enabled) {
        return;
    }
    var offset = Array.isArray(event.delta) ? event.delta[this._direction] : event.delta;
    this.scroll(offset);
}
function _setParticle(position, velocity, phase) {
    if (position !== undefined) {
        this._scroll.particleValue = position;
        this._scroll.particle.setPosition1D(position);
    }
    if (velocity !== undefined) {
        var oldVelocity = this._scroll.particle.getVelocity1D();
        if (oldVelocity !== velocity) {
            this._scroll.particle.setVelocity1D(velocity);
        }
    }
}
function _calcScrollOffset(normalize, refreshParticle) {
    if (refreshParticle || this._scroll.particleValue === undefined) {
        this._scroll.particleValue = this._scroll.particle.getPosition1D();
        this._scroll.particleValue = Math.round(this._scroll.particleValue * 1000) / 1000;
    }
    var scrollOffset = this._scroll.particleValue;
    if (this._scroll.scrollDelta || this._scroll.normalizedScrollDelta) {
        scrollOffset += this._scroll.scrollDelta + this._scroll.normalizedScrollDelta;
        if (this._scroll.boundsReached & Bounds.PREV && scrollOffset > this._scroll.springPosition || this._scroll.boundsReached & Bounds.NEXT && scrollOffset < this._scroll.springPosition || this._scroll.boundsReached === Bounds.BOTH) {
            scrollOffset = this._scroll.springPosition;
        }
        if (normalize) {
            if (!this._scroll.scrollDelta) {
                this._scroll.normalizedScrollDelta = 0;
                _setParticle.call(this, scrollOffset, undefined, '_calcScrollOffset');
            }
            this._scroll.normalizedScrollDelta += this._scroll.scrollDelta;
            this._scroll.scrollDelta = 0;
        }
    }
    if (this._scroll.scrollForceCount && this._scroll.scrollForce) {
        if (this._scroll.springPosition !== undefined) {
            scrollOffset = (scrollOffset + this._scroll.scrollForce + this._scroll.springPosition) / 2;
        } else {
            scrollOffset += this._scroll.scrollForce;
        }
    }
    if (!this.options.overscroll) {
        if (this._scroll.boundsReached === Bounds.BOTH || this._scroll.boundsReached === Bounds.PREV && scrollOffset > this._scroll.springPosition || this._scroll.boundsReached === Bounds.NEXT && scrollOffset < this._scroll.springPosition) {
            scrollOffset = this._scroll.springPosition;
        }
    }
    return scrollOffset;
}
ScrollController.prototype._calcScrollHeight = function (next, lastNodeOnly) {
    var calcedHeight = 0;
    var node = this._nodes.getStartEnumNode(next);
    while (node) {
        if (node._invalidated) {
            if (node.trueSizeRequested) {
                calcedHeight = undefined;
                break;
            }
            if (node.scrollLength !== undefined) {
                calcedHeight = lastNodeOnly ? node.scrollLength : calcedHeight + node.scrollLength;
                if (!next && lastNodeOnly) {
                    break;
                }
            }
        }
        node = next ? node._next : node._prev;
    }
    return calcedHeight;
};
function _calcBounds(size, scrollOffset) {
    var prevHeight = this._calcScrollHeight(false);
    var nextHeight = this._calcScrollHeight(true);
    var enforeMinSize = this._layout.capabilities && this._layout.capabilities.sequentialScrollingOptimized;
    var totalHeight;
    if (enforeMinSize) {
        if (nextHeight !== undefined && prevHeight !== undefined) {
            totalHeight = prevHeight + nextHeight;
        }
        if (totalHeight !== undefined && totalHeight <= size[this._direction]) {
            this._scroll.boundsReached = Bounds.BOTH;
            this._scroll.springPosition = this.options.alignment ? -nextHeight : prevHeight;
            this._scroll.springSource = SpringSource.MINSIZE;
            return;
        }
    }
    if (this.options.alignment) {
        if (enforeMinSize) {
            if (nextHeight !== undefined && scrollOffset + nextHeight <= 0) {
                this._scroll.boundsReached = Bounds.NEXT;
                this._scroll.springPosition = -nextHeight;
                this._scroll.springSource = SpringSource.NEXTBOUNDS;
                return;
            }
        } else {
            var firstPrevItemHeight = this._calcScrollHeight(false, true);
            if (nextHeight !== undefined && firstPrevItemHeight && scrollOffset + nextHeight + size[this._direction] <= firstPrevItemHeight) {
                this._scroll.boundsReached = Bounds.NEXT;
                this._scroll.springPosition = nextHeight - (size[this._direction] - firstPrevItemHeight);
                this._scroll.springSource = SpringSource.NEXTBOUNDS;
                return;
            }
        }
    } else {
        if (prevHeight !== undefined && scrollOffset - prevHeight >= 0) {
            this._scroll.boundsReached = Bounds.PREV;
            this._scroll.springPosition = prevHeight;
            this._scroll.springSource = SpringSource.PREVBOUNDS;
            return;
        }
    }
    if (this.options.alignment) {
        if (prevHeight !== undefined && scrollOffset - prevHeight >= -size[this._direction]) {
            this._scroll.boundsReached = Bounds.PREV;
            this._scroll.springPosition = -size[this._direction] + prevHeight;
            this._scroll.springSource = SpringSource.PREVBOUNDS;
            return;
        }
    } else {
        var nextBounds = enforeMinSize ? size[this._direction] : this._calcScrollHeight(true, true);
        if (nextHeight !== undefined && scrollOffset + nextHeight <= nextBounds) {
            this._scroll.boundsReached = Bounds.NEXT;
            this._scroll.springPosition = nextBounds - nextHeight;
            this._scroll.springSource = SpringSource.NEXTBOUNDS;
            return;
        }
    }
    this._scroll.boundsReached = Bounds.NONE;
    this._scroll.springPosition = undefined;
    this._scroll.springSource = SpringSource.NONE;
}
function _calcScrollToOffset(size, scrollOffset) {
    var scrollToRenderNode = this._scroll.scrollToRenderNode || this._scroll.ensureVisibleRenderNode;
    if (!scrollToRenderNode) {
        return;
    }
    if (this._scroll.boundsReached === Bounds.BOTH || !this._scroll.scrollToDirection && this._scroll.boundsReached === Bounds.PREV || this._scroll.scrollToDirection && this._scroll.boundsReached === Bounds.NEXT) {
        return;
    }
    var foundNode;
    var scrollToOffset = 0;
    var node = this._nodes.getStartEnumNode(true);
    var count = 0;
    while (node) {
        count++;
        if (!node._invalidated || node.scrollLength === undefined) {
            break;
        }
        if (this.options.alignment) {
            scrollToOffset -= node.scrollLength;
        }
        if (node.renderNode === scrollToRenderNode) {
            foundNode = node;
            break;
        }
        if (!this.options.alignment) {
            scrollToOffset -= node.scrollLength;
        }
        node = node._next;
    }
    if (!foundNode) {
        scrollToOffset = 0;
        node = this._nodes.getStartEnumNode(false);
        while (node) {
            if (!node._invalidated || node.scrollLength === undefined) {
                break;
            }
            if (!this.options.alignment) {
                scrollToOffset += node.scrollLength;
            }
            if (node.renderNode === scrollToRenderNode) {
                foundNode = node;
                break;
            }
            if (this.options.alignment) {
                scrollToOffset += node.scrollLength;
            }
            node = node._prev;
        }
    }
    if (foundNode) {
        if (this._scroll.ensureVisibleRenderNode) {
            if (this.options.alignment) {
                if (scrollToOffset - foundNode.scrollLength < 0) {
                    this._scroll.springPosition = scrollToOffset;
                    this._scroll.springSource = SpringSource.ENSUREVISIBLE;
                } else if (scrollToOffset > size[this._direction]) {
                    this._scroll.springPosition = size[this._direction] - scrollToOffset;
                    this._scroll.springSource = SpringSource.ENSUREVISIBLE;
                } else {
                    if (!foundNode.trueSizeRequested) {
                        this._scroll.ensureVisibleRenderNode = undefined;
                    }
                }
            } else {
                scrollToOffset = -scrollToOffset;
                if (scrollToOffset < 0) {
                    this._scroll.springPosition = scrollToOffset;
                    this._scroll.springSource = SpringSource.ENSUREVISIBLE;
                } else if (scrollToOffset + foundNode.scrollLength > size[this._direction]) {
                    this._scroll.springPosition = size[this._direction] - (scrollToOffset + foundNode.scrollLength);
                    this._scroll.springSource = SpringSource.ENSUREVISIBLE;
                } else {
                    if (!foundNode.trueSizeRequested) {
                        this._scroll.ensureVisibleRenderNode = undefined;
                    }
                }
            }
        } else {
            this._scroll.springPosition = scrollToOffset;
            this._scroll.springSource = SpringSource.GOTOSEQUENCE;
        }
        return;
    }
    if (this._scroll.scrollToDirection) {
        this._scroll.springPosition = scrollOffset - size[this._direction];
        this._scroll.springSource = SpringSource.GOTONEXTDIRECTION;
    } else {
        this._scroll.springPosition = scrollOffset + size[this._direction];
        this._scroll.springSource = SpringSource.GOTOPREVDIRECTION;
    }
    if (this._viewSequence.cleanup) {
        var viewSequence = this._viewSequence;
        while (viewSequence.get() !== scrollToRenderNode) {
            viewSequence = this._scroll.scrollToDirection ? viewSequence.getNext(true) : viewSequence.getPrevious(true);
            if (!viewSequence) {
                break;
            }
        }
    }
}
function _snapToPage() {
    if (!this.options.paginated || this._scroll.scrollForceCount || this._scroll.springPosition !== undefined) {
        return;
    }
    var item;
    switch (this.options.paginationMode) {
    case PaginationMode.SCROLL:
        if (!this.options.paginationEnergyThresshold || Math.abs(this._scroll.particle.getEnergy()) <= this.options.paginationEnergyThresshold) {
            item = this.options.alignment ? this.getLastVisibleItem() : this.getFirstVisibleItem();
            if (item && item.renderNode) {
                this.goToRenderNode(item.renderNode);
            }
        }
        break;
    case PaginationMode.PAGE:
        item = this.options.alignment ? this.getLastVisibleItem() : this.getFirstVisibleItem();
        if (item && item.renderNode) {
            this.goToRenderNode(item.renderNode);
        }
        break;
    }
}
function _normalizePrevViewSequence(scrollOffset) {
    var count = 0;
    var normalizedScrollOffset = scrollOffset;
    var normalizeNextPrev = false;
    var node = this._nodes.getStartEnumNode(false);
    while (node) {
        if (!node._invalidated || !node._viewSequence) {
            break;
        }
        if (normalizeNextPrev) {
            this._viewSequence = node._viewSequence;
            normalizedScrollOffset = scrollOffset;
            normalizeNextPrev = false;
        }
        if (node.scrollLength === undefined || node.trueSizeRequested || scrollOffset < 0) {
            break;
        }
        scrollOffset -= node.scrollLength;
        count++;
        if (node.scrollLength) {
            if (this.options.alignment) {
                normalizeNextPrev = scrollOffset >= 0;
            } else {
                this._viewSequence = node._viewSequence;
                normalizedScrollOffset = scrollOffset;
            }
        }
        node = node._prev;
    }
    return normalizedScrollOffset;
}
function _normalizeNextViewSequence(scrollOffset) {
    var count = 0;
    var normalizedScrollOffset = scrollOffset;
    var node = this._nodes.getStartEnumNode(true);
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined || node.trueSizeRequested || !node._viewSequence || scrollOffset > 0 && (!this.options.alignment || node.scrollLength !== 0)) {
            break;
        }
        if (this.options.alignment) {
            scrollOffset += node.scrollLength;
            count++;
        }
        if (node.scrollLength || this.options.alignment) {
            this._viewSequence = node._viewSequence;
            normalizedScrollOffset = scrollOffset;
        }
        if (!this.options.alignment) {
            scrollOffset += node.scrollLength;
            count++;
        }
        node = node._next;
    }
    return normalizedScrollOffset;
}
function _normalizeViewSequence(size, scrollOffset) {
    var caps = this._layout.capabilities;
    if (caps && caps.debug && caps.debug.normalize !== undefined && !caps.debug.normalize) {
        return scrollOffset;
    }
    if (this._scroll.scrollForceCount) {
        return scrollOffset;
    }
    var normalizedScrollOffset = scrollOffset;
    if (this.options.alignment && scrollOffset < 0) {
        normalizedScrollOffset = _normalizeNextViewSequence.call(this, scrollOffset);
    } else if (!this.options.alignment && scrollOffset > 0) {
        normalizedScrollOffset = _normalizePrevViewSequence.call(this, scrollOffset);
    }
    if (normalizedScrollOffset === scrollOffset) {
        if (this.options.alignment && scrollOffset > 0) {
            normalizedScrollOffset = _normalizePrevViewSequence.call(this, scrollOffset);
        } else if (!this.options.alignment && scrollOffset < 0) {
            normalizedScrollOffset = _normalizeNextViewSequence.call(this, scrollOffset);
        }
    }
    if (normalizedScrollOffset !== scrollOffset) {
        var delta = normalizedScrollOffset - scrollOffset;
        var particleValue = this._scroll.particle.getPosition1D();
        _setParticle.call(this, particleValue + delta, undefined, 'normalize');
        if (this._scroll.springPosition !== undefined) {
            this._scroll.springPosition += delta;
        }
        if (caps && caps.sequentialScrollingOptimized) {
            this._scroll.groupStart -= delta;
        }
    }
    return normalizedScrollOffset;
}
ScrollController.prototype.getVisibleItems = function () {
    var size = this._contextSizeCache;
    var scrollOffset = this.options.alignment ? this._scroll.unnormalizedScrollOffset + size[this._direction] : this._scroll.unnormalizedScrollOffset;
    var result = [];
    var node = this._nodes.getStartEnumNode(true);
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined || scrollOffset > size[this._direction]) {
            break;
        }
        scrollOffset += node.scrollLength;
        if (scrollOffset >= 0 && node._viewSequence) {
            result.push({
                index: node._viewSequence.getIndex(),
                viewSequence: node._viewSequence,
                renderNode: node.renderNode,
                visiblePerc: node.scrollLength ? (Math.min(scrollOffset, size[this._direction]) - Math.max(scrollOffset - node.scrollLength, 0)) / node.scrollLength : 1,
                scrollOffset: scrollOffset - node.scrollLength,
                scrollLength: node.scrollLength,
                _node: node
            });
        }
        node = node._next;
    }
    scrollOffset = this.options.alignment ? this._scroll.unnormalizedScrollOffset + size[this._direction] : this._scroll.unnormalizedScrollOffset;
    node = this._nodes.getStartEnumNode(false);
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined || scrollOffset < 0) {
            break;
        }
        scrollOffset -= node.scrollLength;
        if (scrollOffset < size[this._direction] && node._viewSequence) {
            result.unshift({
                index: node._viewSequence.getIndex(),
                viewSequence: node._viewSequence,
                renderNode: node.renderNode,
                visiblePerc: node.scrollLength ? (Math.min(scrollOffset + node.scrollLength, size[this._direction]) - Math.max(scrollOffset, 0)) / node.scrollLength : 1,
                scrollOffset: scrollOffset,
                scrollLength: node.scrollLength,
                _node: node
            });
        }
        node = node._prev;
    }
    return result;
};
function _getVisibleItem(first) {
    var result = {};
    var diff;
    var prevDiff = 10000000;
    var diffDelta = first && this.options.alignment ? -this._contextSizeCache[this._direction] : !first && !this.options.alignment ? this._contextSizeCache[this._direction] : 0;
    var scrollOffset = this._scroll.unnormalizedScrollOffset;
    var node = this._nodes.getStartEnumNode(true);
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined) {
            break;
        }
        if (node._viewSequence) {
            diff = Math.abs(diffDelta - (scrollOffset + (!first ? node.scrollLength : 0)));
            if (diff >= prevDiff) {
                break;
            }
            prevDiff = diff;
            result.scrollOffset = scrollOffset;
            result._node = node;
            scrollOffset += node.scrollLength;
        }
        node = node._next;
    }
    scrollOffset = this._scroll.unnormalizedScrollOffset;
    node = this._nodes.getStartEnumNode(false);
    while (node) {
        if (!node._invalidated || node.scrollLength === undefined) {
            break;
        }
        if (node._viewSequence) {
            scrollOffset -= node.scrollLength;
            diff = Math.abs(diffDelta - (scrollOffset + (!first ? node.scrollLength : 0)));
            if (diff >= prevDiff) {
                break;
            }
            prevDiff = diff;
            result.scrollOffset = scrollOffset;
            result._node = node;
        }
        node = node._prev;
    }
    if (!result._node) {
        return undefined;
    }
    result.scrollLength = result._node.scrollLength;
    if (this.options.alignment) {
        result.visiblePerc = (Math.min(result.scrollOffset + result.scrollLength, 0) - Math.max(result.scrollOffset, -this._contextSizeCache[this._direction])) / result.scrollLength;
    } else {
        result.visiblePerc = (Math.min(result.scrollOffset + result.scrollLength, this._contextSizeCache[this._direction]) - Math.max(result.scrollOffset, 0)) / result.scrollLength;
    }
    result.index = result._node._viewSequence.getIndex();
    result.viewSequence = result._node._viewSequence;
    result.renderNode = result._node.renderNode;
    return result;
}
ScrollController.prototype.getFirstVisibleItem = function () {
    return _getVisibleItem.call(this, true);
};
ScrollController.prototype.getLastVisibleItem = function () {
    return _getVisibleItem.call(this, false);
};
function _goToSequence(viewSequence, next, noAnimation) {
    if (noAnimation) {
        this._viewSequence = viewSequence;
        this._scroll.springPosition = undefined;
        _updateSpring.call(this);
        this.halt();
        this._scroll.scrollDelta = 0;
        _setParticle.call(this, 0, 0, '_goToSequence');
        this._isDirty = true;
    } else {
        this._scroll.scrollToSequence = viewSequence;
        this._scroll.scrollToRenderNode = viewSequence.get();
        this._scroll.ensureVisibleRenderNode = undefined;
        this._scroll.scrollToDirection = next;
        this._scroll.scrollDirty = true;
    }
}
function _ensureVisibleSequence(viewSequence, next) {
    this._scroll.scrollToSequence = undefined;
    this._scroll.scrollToRenderNode = undefined;
    this._scroll.ensureVisibleRenderNode = viewSequence.get();
    this._scroll.scrollToDirection = next;
    this._scroll.scrollDirty = true;
}
function _goToPage(amount, noAnimation) {
    var viewSequence = (!noAnimation ? this._scroll.scrollToSequence : undefined) || this._viewSequence;
    if (!this._scroll.scrollToSequence && !noAnimation) {
        var firstVisibleItem = this.getFirstVisibleItem();
        if (firstVisibleItem) {
            viewSequence = firstVisibleItem.viewSequence;
            if (amount < 0 && firstVisibleItem.scrollOffset < 0 || amount > 0 && firstVisibleItem.scrollOffset > 0) {
                amount = 0;
            }
        }
    }
    if (!viewSequence) {
        return;
    }
    for (var i = 0; i < Math.abs(amount); i++) {
        var nextViewSequence = amount > 0 ? viewSequence.getNext() : viewSequence.getPrevious();
        if (nextViewSequence) {
            viewSequence = nextViewSequence;
        } else {
            break;
        }
    }
    _goToSequence.call(this, viewSequence, amount >= 0, noAnimation);
}
ScrollController.prototype.goToFirstPage = function (noAnimation) {
    if (!this._viewSequence) {
        return this;
    }
    if (this._viewSequence._ && this._viewSequence._.loop) {
        LayoutUtility.error('Unable to go to first item of looped ViewSequence');
        return this;
    }
    var viewSequence = this._viewSequence;
    while (viewSequence) {
        var prev = viewSequence.getPrevious();
        if (prev && prev.get()) {
            viewSequence = prev;
        } else {
            break;
        }
    }
    _goToSequence.call(this, viewSequence, false, noAnimation);
    return this;
};
ScrollController.prototype.goToPreviousPage = function (noAnimation) {
    _goToPage.call(this, -1, noAnimation);
    return this;
};
ScrollController.prototype.goToNextPage = function (noAnimation) {
    _goToPage.call(this, 1, noAnimation);
    return this;
};
ScrollController.prototype.goToLastPage = function (noAnimation) {
    if (!this._viewSequence) {
        return this;
    }
    if (this._viewSequence._ && this._viewSequence._.loop) {
        LayoutUtility.error('Unable to go to last item of looped ViewSequence');
        return this;
    }
    var viewSequence = this._viewSequence;
    while (viewSequence) {
        var next = viewSequence.getNext();
        if (next && next.get()) {
            viewSequence = next;
        } else {
            break;
        }
    }
    _goToSequence.call(this, viewSequence, true, noAnimation);
    return this;
};
ScrollController.prototype.goToRenderNode = function (node, noAnimation) {
    if (!this._viewSequence || !node) {
        return this;
    }
    if (this._viewSequence.get() === node) {
        var next = _calcScrollOffset.call(this) >= 0;
        _goToSequence.call(this, this._viewSequence, next, noAnimation);
        return this;
    }
    var nextSequence = this._viewSequence.getNext();
    var prevSequence = this._viewSequence.getPrevious();
    while ((nextSequence || prevSequence) && nextSequence !== this._viewSequence) {
        var nextNode = nextSequence ? nextSequence.get() : undefined;
        if (nextNode === node) {
            _goToSequence.call(this, nextSequence, true, noAnimation);
            break;
        }
        var prevNode = prevSequence ? prevSequence.get() : undefined;
        if (prevNode === node) {
            _goToSequence.call(this, prevSequence, false, noAnimation);
            break;
        }
        nextSequence = nextNode ? nextSequence.getNext() : undefined;
        prevSequence = prevNode ? prevSequence.getPrevious() : undefined;
    }
    return this;
};
ScrollController.prototype.ensureVisible = function (node) {
    if (node instanceof ViewSequence) {
        node = node.get();
    } else if (node instanceof Number || typeof node === 'number') {
        var viewSequence = this._viewSequence;
        while (viewSequence.getIndex() < node) {
            viewSequence = viewSequence.getNext();
            if (!viewSequence) {
                return this;
            }
        }
        while (viewSequence.getIndex() > node) {
            viewSequence = viewSequence.getPrevious();
            if (!viewSequence) {
                return this;
            }
        }
    }
    if (this._viewSequence.get() === node) {
        var next = _calcScrollOffset.call(this) >= 0;
        _ensureVisibleSequence.call(this, this._viewSequence, next);
        return this;
    }
    var nextSequence = this._viewSequence.getNext();
    var prevSequence = this._viewSequence.getPrevious();
    while ((nextSequence || prevSequence) && nextSequence !== this._viewSequence) {
        var nextNode = nextSequence ? nextSequence.get() : undefined;
        if (nextNode === node) {
            _ensureVisibleSequence.call(this, nextSequence, true);
            break;
        }
        var prevNode = prevSequence ? prevSequence.get() : undefined;
        if (prevNode === node) {
            _ensureVisibleSequence.call(this, prevSequence, false);
            break;
        }
        nextSequence = nextNode ? nextSequence.getNext() : undefined;
        prevSequence = prevNode ? prevSequence.getPrevious() : undefined;
    }
    return this;
};
ScrollController.prototype.scroll = function (delta) {
    this.halt();
    this._scroll.scrollDelta += delta;
    return this;
};
ScrollController.prototype.canScroll = function (delta) {
    var scrollOffset = _calcScrollOffset.call(this);
    var prevHeight = this._calcScrollHeight(false);
    var nextHeight = this._calcScrollHeight(true);
    var totalHeight;
    if (nextHeight !== undefined && prevHeight !== undefined) {
        totalHeight = prevHeight + nextHeight;
    }
    if (totalHeight !== undefined && totalHeight <= this._contextSizeCache[this._direction]) {
        return 0;
    }
    if (delta < 0 && nextHeight !== undefined) {
        var nextOffset = this._contextSizeCache[this._direction] - (scrollOffset + nextHeight);
        return Math.max(nextOffset, delta);
    } else if (delta > 0 && prevHeight !== undefined) {
        var prevOffset = -(scrollOffset - prevHeight);
        return Math.min(prevOffset, delta);
    }
    return delta;
};
ScrollController.prototype.halt = function () {
    this._scroll.scrollToSequence = undefined;
    this._scroll.scrollToRenderNode = undefined;
    this._scroll.ensureVisibleRenderNode = undefined;
    _setParticle.call(this, undefined, 0, 'halt');
    return this;
};
ScrollController.prototype.isScrolling = function () {
    return this._scroll.isScrolling;
};
ScrollController.prototype.getBoundsReached = function () {
    return this._scroll.boundsReached;
};
ScrollController.prototype.getVelocity = function () {
    return this._scroll.particle.getVelocity1D();
};
ScrollController.prototype.getEnergy = function () {
    return this._scroll.particle.getEnergy();
};
ScrollController.prototype.setVelocity = function (velocity) {
    return this._scroll.particle.setVelocity1D(velocity);
};
ScrollController.prototype.applyScrollForce = function (delta) {
    this.halt();
    if (this._scroll.scrollForceCount === 0) {
        this._scroll.scrollForceStartItem = this.options.alignment ? this.getLastVisibleItem() : this.getFirstVisibleItem();
    }
    this._scroll.scrollForceCount++;
    this._scroll.scrollForce += delta;
    return this;
};
ScrollController.prototype.updateScrollForce = function (prevDelta, newDelta) {
    this.halt();
    newDelta -= prevDelta;
    this._scroll.scrollForce += newDelta;
    return this;
};
ScrollController.prototype.releaseScrollForce = function (delta, velocity) {
    this.halt();
    if (this._scroll.scrollForceCount === 1) {
        var scrollOffset = _calcScrollOffset.call(this);
        _setParticle.call(this, scrollOffset, velocity, 'releaseScrollForce');
        this._scroll.pe.wake();
        this._scroll.scrollForce = 0;
        this._scroll.scrollDirty = true;
        if (this._scroll.scrollForceStartItem && this.options.paginated && this.options.paginationMode === PaginationMode.PAGE) {
            var item = this.options.alignment ? this.getLastVisibleItem(true) : this.getFirstVisibleItem(true);
            if (item) {
                if (item.renderNode !== this._scroll.scrollForceStartItem.renderNode) {
                    this.goToRenderNode(item.renderNode);
                } else if (this.options.paginationEnergyThresshold && Math.abs(this._scroll.particle.getEnergy()) >= this.options.paginationEnergyThresshold) {
                    velocity = velocity || 0;
                    if (velocity < 0 && item._node._next && item._node._next.renderNode) {
                        this.goToRenderNode(item._node._next.renderNode);
                    } else if (velocity >= 0 && item._node._prev && item._node._prev.renderNode) {
                        this.goToRenderNode(item._node._prev.renderNode);
                    }
                } else {
                    this.goToRenderNode(item.renderNode);
                }
            }
        }
        this._scroll.scrollForceStartItem = undefined;
    } else {
        this._scroll.scrollForce -= delta;
    }
    this._scroll.scrollForceCount--;
    return this;
};
ScrollController.prototype.getSpec = function (node, normalize) {
    var spec = LayoutController.prototype.getSpec.apply(this, arguments);
    if (spec && this._layout.capabilities && this._layout.capabilities.sequentialScrollingOptimized) {
        spec = {
            origin: spec.origin,
            align: spec.align,
            opacity: spec.opacity,
            size: spec.size,
            renderNode: spec.renderNode,
            transform: spec.transform
        };
        var translate = [
                0,
                0,
                0
            ];
        translate[this._direction] = this._scrollOffsetCache + this._scroll.groupStart;
        spec.transform = Transform.thenMove(spec.transform, translate);
    }
    return spec;
};
function _layout(size, scrollOffset, nested) {
    this._debug.layoutCount++;
    var scrollStart = 0 - Math.max(this.options.extraBoundsSpace[0], 1);
    var scrollEnd = size[this._direction] + Math.max(this.options.extraBoundsSpace[1], 1);
    if (this.options.layoutAll) {
        scrollStart = -1000000;
        scrollEnd = 1000000;
    }
    var layoutContext = this._nodes.prepareForLayout(this._viewSequence, this._nodesById, {
            size: size,
            direction: this._direction,
            reverse: this.options.alignment ? true : false,
            scrollOffset: this.options.alignment ? scrollOffset + size[this._direction] : scrollOffset,
            scrollStart: scrollStart,
            scrollEnd: scrollEnd
        });
    if (this._layout._function) {
        this._layout._function(layoutContext, this._layout.options);
    }
    this._scroll.unnormalizedScrollOffset = scrollOffset;
    if (this._postLayout) {
        this._postLayout(size, scrollOffset);
    }
    this._nodes.removeNonInvalidatedNodes(this.options.flowOptions.removeSpec);
    _calcBounds.call(this, size, scrollOffset);
    _calcScrollToOffset.call(this, size, scrollOffset);
    _snapToPage.call(this);
    var newScrollOffset = _calcScrollOffset.call(this, true);
    if (!nested && newScrollOffset !== scrollOffset) {
        return _layout.call(this, size, newScrollOffset, true);
    }
    scrollOffset = _normalizeViewSequence.call(this, size, scrollOffset);
    _updateSpring.call(this);
    this._nodes.removeVirtualViewSequenceNodes();
    if (this.options.size && this.options.size[this._direction] === true) {
        var scrollLength = 0;
        var node = this._nodes.getStartEnumNode();
        while (node) {
            if (node._invalidated && node.scrollLength) {
                scrollLength += node.scrollLength;
            }
            node = node._next;
        }
        this._size = this._size || [
            0,
            0
        ];
        this._size[0] = this.options.size[0];
        this._size[1] = this.options.size[1];
        this._size[this._direction] = scrollLength;
    }
    return scrollOffset;
}
function _innerRender() {
    var specs = this._specs;
    for (var i3 = 0, j3 = specs.length; i3 < j3; i3++) {
        if (specs[i3].renderNode) {
            specs[i3].target = specs[i3].renderNode.render();
        }
    }
    if (!specs.length || specs[specs.length - 1] !== this._cleanupRegistration) {
        specs.push(this._cleanupRegistration);
    }
    return specs;
}
ScrollController.prototype.commit = function commit(context) {
    var size = context.size;
    this._debug.commitCount++;
    if (this._resetFlowState) {
        this._resetFlowState = false;
        this._isDirty = true;
        this._nodes.removeAll();
    }
    var scrollOffset = _calcScrollOffset.call(this, true, true);
    if (this._scrollOffsetCache === undefined) {
        this._scrollOffsetCache = scrollOffset;
    }
    var emitEndScrollingEvent = false;
    var emitScrollEvent = false;
    var eventData;
    if (size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1] || this._isDirty || this._scroll.scrollDirty || this._nodes._trueSizeRequested || this.options.alwaysLayout || this._scrollOffsetCache !== scrollOffset) {
        eventData = {
            target: this,
            oldSize: this._contextSizeCache,
            size: size,
            oldScrollOffset: -(this._scrollOffsetCache + this._scroll.groupStart),
            scrollOffset: -(scrollOffset + this._scroll.groupStart)
        };
        if (this._scrollOffsetCache !== scrollOffset) {
            if (!this._scroll.isScrolling) {
                this._scroll.isScrolling = true;
                this._eventOutput.emit('scrollstart', eventData);
            }
            emitScrollEvent = true;
        } else if (this._scroll.isScrolling && !this._scroll.scrollForceCount) {
            emitEndScrollingEvent = true;
        }
        this._eventOutput.emit('layoutstart', eventData);
        if (this.options.flow && (this._isDirty || this.options.flowOptions.reflowOnResize && (size[0] !== this._contextSizeCache[0] || size[1] !== this._contextSizeCache[1]))) {
            var node = this._nodes.getStartEnumNode();
            while (node) {
                node.releaseLock(true);
                node = node._next;
            }
        }
        this._contextSizeCache[0] = size[0];
        this._contextSizeCache[1] = size[1];
        this._isDirty = false;
        this._scroll.scrollDirty = false;
        scrollOffset = _layout.call(this, size, scrollOffset);
        this._scrollOffsetCache = scrollOffset;
        eventData.scrollOffset = -(this._scrollOffsetCache + this._scroll.groupStart);
    } else if (this._scroll.isScrolling && !this._scroll.scrollForceCount) {
        emitEndScrollingEvent = true;
    }
    var groupTranslate = this._scroll.groupTranslate;
    groupTranslate[0] = 0;
    groupTranslate[1] = 0;
    groupTranslate[2] = 0;
    groupTranslate[this._direction] = -this._scroll.groupStart - scrollOffset;
    var sequentialScrollingOptimized = this._layout.capabilities ? this._layout.capabilities.sequentialScrollingOptimized : false;
    var result = this._nodes.buildSpecAndDestroyUnrenderedNodes(sequentialScrollingOptimized ? groupTranslate : undefined);
    this._specs = result.specs;
    if (!this._specs.length) {
        this._scroll.groupStart = 0;
    }
    if (eventData) {
        this._eventOutput.emit('layoutend', eventData);
    }
    if (result.modified) {
        this._eventOutput.emit('reflow', { target: this });
    }
    if (emitScrollEvent) {
        this._eventOutput.emit('scroll', eventData);
    }
    if (eventData) {
        var visibleItem = this.options.alignment ? this.getLastVisibleItem() : this.getFirstVisibleItem();
        if (visibleItem && !this._visibleItemCache || !visibleItem && this._visibleItemCache || visibleItem && this._visibleItemCache && visibleItem.renderNode !== this._visibleItemCache.renderNode) {
            this._eventOutput.emit('pagechange', {
                target: this,
                oldViewSequence: this._visibleItemCache ? this._visibleItemCache.viewSequence : undefined,
                viewSequence: visibleItem ? visibleItem.viewSequence : undefined,
                oldIndex: this._visibleItemCache ? this._visibleItemCache.index : undefined,
                index: visibleItem ? visibleItem.index : undefined,
                renderNode: visibleItem ? visibleItem.renderNode : undefined,
                oldRenderNode: this._visibleItemCache ? this._visibleItemCache.renderNode : undefined
            });
            this._visibleItemCache = visibleItem;
        }
    }
    if (emitEndScrollingEvent) {
        this._scroll.isScrolling = false;
        eventData = {
            target: this,
            oldSize: size,
            size: size,
            oldScrollOffset: -(this._scroll.groupStart + scrollOffset),
            scrollOffset: -(this._scroll.groupStart + scrollOffset)
        };
        this._eventOutput.emit('scrollend', eventData);
    }
    var transform = context.transform;
    if (sequentialScrollingOptimized) {
        var windowOffset = scrollOffset + this._scroll.groupStart;
        var translate = [
                0,
                0,
                0
            ];
        translate[this._direction] = windowOffset;
        transform = Transform.thenMove(transform, translate);
    }
    return {
        transform: transform,
        size: size,
        opacity: context.opacity,
        origin: context.origin,
        target: this.group.render()
    };
};
ScrollController.prototype.render = function render() {
    if (this.container) {
        return this.container.render.apply(this.container, arguments);
    } else {
        return this.id;
    }
};
module.exports = ScrollController;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./FlowLayoutNode":4,"./LayoutController":6,"./LayoutNode":7,"./LayoutNodeManager":8,"./LayoutUtility":9}],11:[function(require,module,exports){
(function (global){
var EventHandler = typeof window !== 'undefined' ? window.famous.core.EventHandler : typeof global !== 'undefined' ? global.famous.core.EventHandler : null;
function VirtualViewSequence(options) {
    options = options || {};
    this._ = options._ || new this.constructor.Backing(options);
    this.touched = true;
    this.value = options.value || this._.factory.create();
    this.index = options.index || 0;
    this.next = options.next;
    this.prev = options.prev;
    EventHandler.setOutputHandler(this, this._.eventOutput);
    this.value.pipe(this._.eventOutput);
}
VirtualViewSequence.Backing = function Backing(options) {
    this.factory = options.factory;
    this.eventOutput = new EventHandler();
};
VirtualViewSequence.prototype.getPrevious = function (noCreate) {
    if (this.prev) {
        this.prev.touched = true;
        return this.prev;
    }
    if (noCreate) {
        return undefined;
    }
    var value = this._.factory.createPrevious(this.get());
    if (!value) {
        return undefined;
    }
    this.prev = new VirtualViewSequence({
        _: this._,
        value: value,
        index: this.index - 1,
        next: this
    });
    return this.prev;
};
VirtualViewSequence.prototype.getNext = function (noCreate) {
    if (this.next) {
        this.next.touched = true;
        return this.next;
    }
    if (noCreate) {
        return undefined;
    }
    var value = this._.factory.createNext(this.get());
    if (!value) {
        return undefined;
    }
    this.next = new VirtualViewSequence({
        _: this._,
        value: value,
        index: this.index + 1,
        prev: this
    });
    return this.next;
};
VirtualViewSequence.prototype.get = function () {
    this.touched = true;
    return this.value;
};
VirtualViewSequence.prototype.getIndex = function () {
    this.touched = true;
    return this.index;
};
VirtualViewSequence.prototype.toString = function () {
    return '' + this.index;
};
VirtualViewSequence.prototype.cleanup = function () {
    var node = this.prev;
    while (node) {
        if (!node.touched) {
            node.next.prev = undefined;
            node.next = undefined;
            if (this._.factory.destroy) {
                while (node) {
                    this._.factory.destroy(node.value);
                    node = node.prev;
                }
            }
            break;
        }
        node.touched = false;
        node = node.prev;
    }
    node = this.next;
    while (node) {
        if (!node.touched) {
            node.prev.next = undefined;
            node.prev = undefined;
            if (this._.factory.destroy) {
                while (node) {
                    this._.factory.destroy(node.value);
                    node = node.next;
                }
            }
            break;
        }
        node.touched = false;
        node = node.next;
    }
    return this;
};
VirtualViewSequence.prototype.unshift = function () {
    if (console.error) {
        console.error('VirtualViewSequence.unshift is not supported and should not be called');
    }
};
VirtualViewSequence.prototype.push = function () {
    if (console.error) {
        console.error('VirtualViewSequence.push is not supported and should not be called');
    }
};
VirtualViewSequence.prototype.splice = function () {
    if (console.error) {
        console.error('VirtualViewSequence.splice is not supported and should not be called');
    }
};
VirtualViewSequence.prototype.swap = function () {
    if (console.error) {
        console.error('VirtualViewSequence.swap is not supported and should not be called');
    }
};
module.exports = VirtualViewSequence;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],12:[function(require,module,exports){
var LayoutUtility = require('../LayoutUtility');
function LayoutDockHelper(context, options) {
    var size = context.size;
    this._size = size;
    this._context = context;
    this._options = options;
    this._z = options && options.translateZ ? options.translateZ : 0;
    if (options && options.margins) {
        var margins = LayoutUtility.normalizeMargins(options.margins);
        this._left = margins[3];
        this._top = margins[0];
        this._right = size[0] - margins[1];
        this._bottom = size[1] - margins[2];
    } else {
        this._left = 0;
        this._top = 0;
        this._right = size[0];
        this._bottom = size[1];
    }
}
LayoutDockHelper.prototype.parse = function (data) {
    for (var i = 0; i < data.length; i++) {
        var rule = data[i];
        var value = rule.length >= 3 ? rule[2] : undefined;
        if (rule[0] === 'top') {
            this.top(rule[1], value, rule.length >= 4 ? rule[3] : undefined);
        } else if (rule[0] === 'left') {
            this.left(rule[1], value, rule.length >= 4 ? rule[3] : undefined);
        } else if (rule[0] === 'right') {
            this.right(rule[1], value, rule.length >= 4 ? rule[3] : undefined);
        } else if (rule[0] === 'bottom') {
            this.bottom(rule[1], value, rule.length >= 4 ? rule[3] : undefined);
        } else if (rule[0] === 'fill') {
            this.fill(rule[1], rule.length >= 3 ? rule[2] : undefined);
        } else if (rule[0] === 'margins') {
            this.margins(rule[1]);
        }
    }
};
LayoutDockHelper.prototype.top = function (node, height, z) {
    if (height instanceof Array) {
        height = height[1];
    }
    if (height === undefined) {
        var size = this._context.resolveSize(node, [
                this._right - this._left,
                this._bottom - this._top
            ]);
        height = size[1];
    }
    this._context.set(node, {
        size: [
            this._right - this._left,
            height
        ],
        origin: [
            0,
            0
        ],
        align: [
            0,
            0
        ],
        translate: [
            this._left,
            this._top,
            z === undefined ? this._z : z
        ]
    });
    this._top += height;
    return this;
};
LayoutDockHelper.prototype.left = function (node, width, z) {
    if (width instanceof Array) {
        width = width[0];
    }
    if (width === undefined) {
        var size = this._context.resolveSize(node, [
                this._right - this._left,
                this._bottom - this._top
            ]);
        width = size[0];
    }
    this._context.set(node, {
        size: [
            width,
            this._bottom - this._top
        ],
        origin: [
            0,
            0
        ],
        align: [
            0,
            0
        ],
        translate: [
            this._left,
            this._top,
            z === undefined ? this._z : z
        ]
    });
    this._left += width;
    return this;
};
LayoutDockHelper.prototype.bottom = function (node, height, z) {
    if (height instanceof Array) {
        height = height[1];
    }
    if (height === undefined) {
        var size = this._context.resolveSize(node, [
                this._right - this._left,
                this._bottom - this._top
            ]);
        height = size[1];
    }
    this._context.set(node, {
        size: [
            this._right - this._left,
            height
        ],
        origin: [
            0,
            1
        ],
        align: [
            0,
            1
        ],
        translate: [
            this._left,
            -(this._size[1] - this._bottom),
            z === undefined ? this._z : z
        ]
    });
    this._bottom -= height;
    return this;
};
LayoutDockHelper.prototype.right = function (node, width, z) {
    if (width instanceof Array) {
        width = width[0];
    }
    if (node) {
        if (width === undefined) {
            var size = this._context.resolveSize(node, [
                    this._right - this._left,
                    this._bottom - this._top
                ]);
            width = size[0];
        }
        this._context.set(node, {
            size: [
                width,
                this._bottom - this._top
            ],
            origin: [
                1,
                0
            ],
            align: [
                1,
                0
            ],
            translate: [
                -(this._size[0] - this._right),
                this._top,
                z === undefined ? this._z : z
            ]
        });
    }
    if (width) {
        this._right -= width;
    }
    return this;
};
LayoutDockHelper.prototype.fill = function (node, z) {
    this._context.set(node, {
        size: [
            this._right - this._left,
            this._bottom - this._top
        ],
        translate: [
            this._left,
            this._top,
            z === undefined ? this._z : z
        ]
    });
    return this;
};
LayoutDockHelper.prototype.margins = function (margins) {
    margins = LayoutUtility.normalizeMargins(margins);
    this._left += margins[3];
    this._top += margins[0];
    this._right -= margins[1];
    this._bottom -= margins[2];
    return this;
};
LayoutUtility.registerHelper('dock', LayoutDockHelper);
module.exports = LayoutDockHelper;
},{"../LayoutUtility":9}],13:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var LayoutUtility = require('../LayoutUtility');
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.Y,
            Utility.Direction.X
        ],
        scrolling: true,
        trueSize: true,
        sequentialScrollingOptimized: true
    };
var context;
var size;
var direction;
var alignment;
var lineDirection;
var lineLength;
var offset;
var margins;
var margin = [
        0,
        0
    ];
var spacing;
var justify;
var itemSize;
var getItemSize;
var lineNodes;
function _layoutLine(next, endReached) {
    if (!lineNodes.length) {
        return 0;
    }
    var i;
    var lineSize = [
            0,
            0
        ];
    var lineNode;
    for (i = 0; i < lineNodes.length; i++) {
        lineSize[direction] = Math.max(lineSize[direction], lineNodes[i].size[direction]);
        lineSize[lineDirection] += (i > 0 ? spacing[lineDirection] : 0) + lineNodes[i].size[lineDirection];
    }
    var justifyOffset = justify[lineDirection] ? (lineLength - lineSize[lineDirection]) / (lineNodes.length * 2) : 0;
    var lineOffset = (direction ? margins[3] : margins[0]) + justifyOffset;
    var scrollLength;
    for (i = 0; i < lineNodes.length; i++) {
        lineNode = lineNodes[i];
        var translate = [
                0,
                0,
                0
            ];
        translate[lineDirection] = lineOffset;
        translate[direction] = next ? offset : offset - lineSize[direction];
        scrollLength = 0;
        if (i === 0) {
            scrollLength = lineSize[direction];
            if (endReached && (next && !alignment || !next && alignment)) {
                scrollLength += direction ? margins[0] + margins[2] : margins[3] + margins[1];
            } else {
                scrollLength += spacing[direction];
            }
        }
        lineNode.set = {
            size: lineNode.size,
            translate: translate,
            scrollLength: scrollLength
        };
        lineOffset += lineNode.size[lineDirection] + spacing[lineDirection] + justifyOffset * 2;
    }
    for (i = 0; i < lineNodes.length; i++) {
        lineNode = next ? lineNodes[i] : lineNodes[lineNodes.length - 1 - i];
        context.set(lineNode.node, lineNode.set);
    }
    lineNodes = [];
    return lineSize[direction] + spacing[direction];
}
function _resolveNodeSize(node) {
    var localItemSize = itemSize;
    if (getItemSize) {
        localItemSize = getItemSize(node.renderNode, size);
    }
    if (localItemSize[0] === true || localItemSize[1] === true) {
        var result = context.resolveSize(node, size);
        if (localItemSize[0] !== true) {
            result[0] = itemSize[0];
        }
        if (localItemSize[1] !== true) {
            result[1] = itemSize[1];
        }
        return result;
    } else {
        return localItemSize;
    }
}
function CollectionLayout(context_, options) {
    context = context_;
    size = context.size;
    direction = context.direction;
    alignment = context.alignment;
    lineDirection = (direction + 1) % 2;
    if (options.gutter !== undefined && console.warn) {
        console.warn('option `gutter` has been deprecated for CollectionLayout, use margins & spacing instead');
    }
    if (options.gutter && !options.margins && !options.spacing) {
        var gutter = Array.isArray(options.gutter) ? options.gutter : [
                options.gutter,
                options.gutter
            ];
        margins = [
            gutter[1],
            gutter[0],
            gutter[1],
            gutter[0]
        ];
        spacing = gutter;
    } else {
        margins = LayoutUtility.normalizeMargins(options.margins);
        spacing = options.spacing || 0;
        spacing = Array.isArray(spacing) ? spacing : [
            spacing,
            spacing
        ];
    }
    margin[0] = margins[direction ? 0 : 3];
    margin[1] = -margins[direction ? 2 : 1];
    justify = Array.isArray(options.justify) ? options.justify : options.justify ? [
        true,
        true
    ] : [
        false,
        false
    ];
    lineLength = size[lineDirection] - (direction ? margins[3] + margins[1] : margins[0] + margins[2]);
    var node;
    var nodeSize;
    var lineOffset;
    var bound;
    if (options.cells) {
        if (options.itemSize && console.warn) {
            console.warn('options `cells` and `itemSize` cannot both be specified for CollectionLayout, only use one of the two');
        }
        itemSize = [
            (size[0] - (margins[1] + margins[3] + spacing[0] * (options.cells[0] - 1))) / options.cells[0],
            (size[1] - (margins[0] + margins[2] + spacing[1] * (options.cells[1] - 1))) / options.cells[1]
        ];
    } else if (!options.itemSize) {
        itemSize = [
            true,
            true
        ];
    } else if (options.itemSize instanceof Function) {
        getItemSize = options.itemSize;
    } else if (options.itemSize[0] === undefined || options.itemSize[0] === undefined) {
        itemSize = [
            options.itemSize[0] === undefined ? size[0] : options.itemSize[0],
            options.itemSize[1] === undefined ? size[1] : options.itemSize[1]
        ];
    } else {
        itemSize = options.itemSize;
    }
    offset = context.scrollOffset + (alignment ? 0 : margin[alignment]);
    bound = context.scrollEnd + (alignment ? 0 : margin[alignment]);
    lineOffset = 0;
    lineNodes = [];
    while (offset < bound) {
        node = context.next();
        if (!node) {
            _layoutLine(true, true);
            break;
        }
        nodeSize = _resolveNodeSize(node);
        lineOffset += (lineNodes.length ? spacing[lineDirection] : 0) + nodeSize[lineDirection];
        if (lineOffset > lineLength) {
            offset += _layoutLine(true, !node);
            lineOffset = nodeSize[lineDirection];
        }
        lineNodes.push({
            node: node,
            size: nodeSize
        });
    }
    offset = context.scrollOffset + (alignment ? margin[alignment] : 0);
    bound = context.scrollStart + (alignment ? margin[alignment] : 0);
    lineOffset = 0;
    lineNodes = [];
    while (offset > bound) {
        node = context.prev();
        if (!node) {
            _layoutLine(false, true);
            break;
        }
        nodeSize = _resolveNodeSize(node);
        lineOffset += (lineNodes.length ? spacing[lineDirection] : 0) + nodeSize[lineDirection];
        if (lineOffset > lineLength) {
            offset -= _layoutLine(false, !node);
            lineOffset = nodeSize[lineDirection];
        }
        lineNodes.unshift({
            node: node,
            size: nodeSize
        });
    }
}
CollectionLayout.Capabilities = capabilities;
CollectionLayout.Name = 'CollectionLayout';
CollectionLayout.Description = 'Multi-cell collection-layout with margins & spacing';
module.exports = CollectionLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../LayoutUtility":9}],14:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.X,
            Utility.Direction.Y
        ],
        scrolling: true
    };
function CoverLayout(context, options) {
    var node = context.next();
    if (!node) {
        return;
    }
    var size = context.size;
    var direction = context.direction;
    var itemSize = options.itemSize;
    var opacityStep = 0.2;
    var scaleStep = 0.1;
    var translateStep = 30;
    var zStart = 100;
    context.set(node, {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        align: [
            0.5,
            0.5
        ],
        translate: [
            0,
            0,
            zStart
        ],
        scrollLength: itemSize[direction]
    });
    var translate = itemSize[0] / 2;
    var opacity = 1 - opacityStep;
    var zIndex = zStart - 1;
    var scale = 1 - scaleStep;
    var prev = false;
    var endReached = false;
    node = context.next();
    if (!node) {
        node = context.prev();
        prev = true;
    }
    while (node) {
        context.set(node, {
            size: itemSize,
            origin: [
                0.5,
                0.5
            ],
            align: [
                0.5,
                0.5
            ],
            translate: direction ? [
                0,
                prev ? -translate : translate,
                zIndex
            ] : [
                prev ? -translate : translate,
                0,
                zIndex
            ],
            scale: [
                scale,
                scale,
                1
            ],
            opacity: opacity,
            scrollLength: itemSize[direction]
        });
        opacity -= opacityStep;
        scale -= scaleStep;
        translate += translateStep;
        zIndex--;
        if (translate >= size[direction] / 2) {
            endReached = true;
        } else {
            node = prev ? context.prev() : context.next();
            endReached = !node;
        }
        if (endReached) {
            if (prev) {
                break;
            }
            endReached = false;
            prev = true;
            node = context.prev();
            if (node) {
                translate = itemSize[direction] / 2;
                opacity = 1 - opacityStep;
                zIndex = zStart - 1;
                scale = 1 - scaleStep;
            }
        }
    }
}
CoverLayout.Capabilities = capabilities;
module.exports = CoverLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],15:[function(require,module,exports){
module.exports = function CubeLayout(context, options) {
    var itemSize = options.itemSize;
    context.set(context.next(), {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        rotate: [
            0,
            Math.PI / 2,
            0
        ],
        translate: [
            itemSize[0] / 2,
            0,
            0
        ]
    });
    context.set(context.next(), {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        rotate: [
            0,
            Math.PI / 2,
            0
        ],
        translate: [
            -(itemSize[0] / 2),
            0,
            0
        ]
    });
    context.set(context.next(), {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        rotate: [
            Math.PI / 2,
            0,
            0
        ],
        translate: [
            0,
            -(itemSize[1] / 2),
            0
        ]
    });
    context.set(context.next(), {
        size: itemSize,
        origin: [
            0.5,
            0.5
        ],
        rotate: [
            Math.PI / 2,
            0,
            0
        ],
        translate: [
            0,
            itemSize[1] / 2,
            0
        ]
    });
};
},{}],16:[function(require,module,exports){
if (console.warn) {
    console.warn('GridLayout has been deprecated and will be removed in the future, use CollectionLayout instead');
}
module.exports = require('./CollectionLayout');
},{"./CollectionLayout":13}],17:[function(require,module,exports){
var LayoutDockHelper = require('../helpers/LayoutDockHelper');
module.exports = function HeaderFooterLayout(context, options) {
    var dock = new LayoutDockHelper(context, options);
    dock.top('header', options.headerSize !== undefined ? options.headerSize : options.headerHeight);
    dock.bottom('footer', options.footerSize !== undefined ? options.footerSize : options.footerHeight);
    dock.fill('content');
};
},{"../helpers/LayoutDockHelper":12}],18:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var LayoutUtility = require('../LayoutUtility');
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.Y,
            Utility.Direction.X
        ],
        scrolling: true,
        trueSize: true,
        sequentialScrollingOptimized: true
    };
var set = {
        size: [
            0,
            0
        ],
        translate: [
            0,
            0,
            0
        ],
        scrollLength: undefined
    };
var margin = [
        0,
        0
    ];
function ListLayout(context, options) {
    var size = context.size;
    var direction = context.direction;
    var alignment = context.alignment;
    var revDirection = direction ? 0 : 1;
    var offset;
    var margins = LayoutUtility.normalizeMargins(options.margins);
    var spacing = options.spacing || 0;
    var node;
    var nodeSize;
    var itemSize;
    var getItemSize;
    var lastSectionBeforeVisibleCell;
    var lastSectionBeforeVisibleCellOffset;
    var lastSectionBeforeVisibleCellLength;
    var lastSectionBeforeVisibleCellScrollLength;
    var firstVisibleCell;
    var lastNode;
    var lastCellOffsetInFirstVisibleSection;
    var isSectionCallback = options.isSectionCallback;
    var bound;
    set.size[0] = size[0];
    set.size[1] = size[1];
    set.size[revDirection] -= margins[1 - revDirection] + margins[3 - revDirection];
    set.translate[0] = 0;
    set.translate[1] = 0;
    set.translate[2] = 0;
    set.translate[revDirection] = margins[direction ? 3 : 0];
    if (options.itemSize === true || !options.hasOwnProperty('itemSize')) {
        itemSize = true;
    } else if (options.itemSize instanceof Function) {
        getItemSize = options.itemSize;
    } else {
        itemSize = options.itemSize === undefined ? size[direction] : options.itemSize;
    }
    margin[0] = margins[direction ? 0 : 3];
    margin[1] = -margins[direction ? 2 : 1];
    offset = context.scrollOffset + margin[alignment];
    bound = context.scrollEnd + margin[alignment];
    while (offset < bound + spacing) {
        lastNode = node;
        node = context.next();
        if (!node) {
            break;
        }
        nodeSize = getItemSize ? getItemSize(node.renderNode) : itemSize;
        nodeSize = nodeSize === true ? context.resolveSize(node, size)[direction] : nodeSize;
        set.size[direction] = nodeSize;
        set.translate[direction] = offset + (alignment ? spacing : 0);
        set.scrollLength = nodeSize + spacing;
        context.set(node, set);
        offset += set.scrollLength;
        if (isSectionCallback && isSectionCallback(node.renderNode)) {
            set.translate[direction] = Math.max(margin[0], set.translate[direction]);
            context.set(node, set);
            if (!firstVisibleCell) {
                lastSectionBeforeVisibleCell = node;
                lastSectionBeforeVisibleCellOffset = offset - nodeSize;
                lastSectionBeforeVisibleCellLength = nodeSize;
                lastSectionBeforeVisibleCellScrollLength = nodeSize;
            } else if (lastCellOffsetInFirstVisibleSection === undefined) {
                lastCellOffsetInFirstVisibleSection = offset - nodeSize;
            }
        } else if (!firstVisibleCell && offset >= 0) {
            firstVisibleCell = node;
        }
    }
    if (lastNode && !node && !alignment) {
        set.scrollLength = nodeSize + margin[0] + -margin[1];
        context.set(lastNode, set);
    }
    lastNode = undefined;
    node = undefined;
    offset = context.scrollOffset + margin[alignment];
    bound = context.scrollStart + margin[alignment];
    while (offset > bound - spacing) {
        lastNode = node;
        node = context.prev();
        if (!node) {
            break;
        }
        nodeSize = getItemSize ? getItemSize(node.renderNode) : itemSize;
        nodeSize = nodeSize === true ? context.resolveSize(node, size)[direction] : nodeSize;
        set.scrollLength = nodeSize + spacing;
        offset -= set.scrollLength;
        set.size[direction] = nodeSize;
        set.translate[direction] = offset + (alignment ? spacing : 0);
        context.set(node, set);
        if (isSectionCallback && isSectionCallback(node.renderNode)) {
            set.translate[direction] = Math.max(margin[0], set.translate[direction]);
            context.set(node, set);
            if (!lastSectionBeforeVisibleCell) {
                lastSectionBeforeVisibleCell = node;
                lastSectionBeforeVisibleCellOffset = offset;
                lastSectionBeforeVisibleCellLength = nodeSize;
                lastSectionBeforeVisibleCellScrollLength = set.scrollLength;
            }
        } else if (offset + nodeSize >= 0) {
            firstVisibleCell = node;
            if (lastSectionBeforeVisibleCell) {
                lastCellOffsetInFirstVisibleSection = offset + nodeSize;
            }
            lastSectionBeforeVisibleCell = undefined;
        }
    }
    if (lastNode && !node && alignment) {
        set.scrollLength = nodeSize + margin[0] + -margin[1];
        context.set(lastNode, set);
        if (lastSectionBeforeVisibleCell === lastNode) {
            lastSectionBeforeVisibleCellScrollLength = set.scrollLength;
        }
    }
    if (isSectionCallback && !lastSectionBeforeVisibleCell) {
        node = context.prev();
        while (node) {
            if (isSectionCallback(node.renderNode)) {
                lastSectionBeforeVisibleCell = node;
                nodeSize = options.itemSize || context.resolveSize(node, size)[direction];
                lastSectionBeforeVisibleCellOffset = offset - nodeSize;
                lastSectionBeforeVisibleCellLength = nodeSize;
                lastSectionBeforeVisibleCellScrollLength = undefined;
                break;
            } else {
                node = context.prev();
            }
        }
    }
    if (lastSectionBeforeVisibleCell) {
        var correctedOffset = Math.max(margin[0], lastSectionBeforeVisibleCellOffset);
        if (lastCellOffsetInFirstVisibleSection !== undefined && lastSectionBeforeVisibleCellLength > lastCellOffsetInFirstVisibleSection - margin[0]) {
            correctedOffset = lastCellOffsetInFirstVisibleSection - lastSectionBeforeVisibleCellLength;
        }
        set.size[direction] = lastSectionBeforeVisibleCellLength;
        set.translate[direction] = correctedOffset;
        set.scrollLength = lastSectionBeforeVisibleCellScrollLength;
        context.set(lastSectionBeforeVisibleCell, set);
    }
}
ListLayout.Capabilities = capabilities;
ListLayout.Name = 'ListLayout';
ListLayout.Description = 'List-layout with margins, spacing and sticky headers';
module.exports = ListLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../LayoutUtility":9}],19:[function(require,module,exports){
var LayoutDockHelper = require('../helpers/LayoutDockHelper');
module.exports = function NavBarLayout(context, options) {
    var dock = new LayoutDockHelper(context, {
            margins: options.margins,
            translateZ: 1
        });
    context.set('background', { size: context.size });
    var node;
    var i;
    var rightItems = context.get('rightItems');
    if (rightItems) {
        for (i = 0; i < rightItems.length; i++) {
            node = context.get(rightItems[i]);
            dock.right(node, options.rightItemWidth || options.itemWidth);
            dock.right(undefined, options.rightItemSpacer || options.itemSpacer);
        }
    }
    var leftItems = context.get('leftItems');
    if (leftItems) {
        for (i = 0; i < leftItems.length; i++) {
            node = context.get(leftItems[i]);
            dock.left(node, options.leftItemWidth || options.itemWidth);
            dock.left(undefined, options.leftItemSpacer || options.itemSpacer);
        }
    }
    dock.fill('title');
};
},{"../helpers/LayoutDockHelper":12}],20:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.Y,
            Utility.Direction.X
        ],
        scrolling: false
    };
var direction;
var size;
var ratios;
var total;
var offset;
var index;
var node;
var set = {
        size: [
            0,
            0
        ],
        translate: [
            0,
            0,
            0
        ]
    };
function ProportionalLayout(context, options) {
    size = context.size;
    direction = context.direction;
    ratios = options.ratios;
    total = 0;
    for (index = 0; index < ratios.length; index++) {
        total += ratios[index];
    }
    set.size[0] = size[0];
    set.size[1] = size[1];
    set.translate[0] = 0;
    set.translate[1] = 0;
    node = context.next();
    offset = 0;
    index = 0;
    while (node && index < ratios.length) {
        set.size[direction] = (size[direction] - offset) / total * ratios[index];
        set.translate[direction] = offset;
        context.set(node, set);
        offset += set.size[direction];
        total -= ratios[index];
        index++;
        node = context.next();
    }
}
ProportionalLayout.Capabilities = capabilities;
module.exports = ProportionalLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],21:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var LayoutUtility = require('../LayoutUtility');
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.X,
            Utility.Direction.Y
        ],
        trueSize: true
    };
var size;
var direction;
var revDirection;
var items;
var spacers;
var margins;
var spacing;
var sizeLeft;
var set = {
        size: [
            0,
            0
        ],
        translate: [
            0,
            0,
            0
        ],
        align: [
            0,
            0
        ],
        origin: [
            0,
            0
        ]
    };
var nodeSize;
var offset;
var zIncrement;
function TabBarLayout(context, options) {
    size = context.size;
    direction = context.direction;
    revDirection = direction ? 0 : 1;
    spacing = options.spacing || 0;
    items = context.get('items');
    spacers = context.get('spacers');
    margins = LayoutUtility.normalizeMargins(options.margins);
    zIncrement = options.zIncrement || 0.001;
    set.size[0] = context.size[0];
    set.size[1] = context.size[1];
    set.size[revDirection] -= margins[1 - revDirection] + margins[3 - revDirection];
    set.translate[0] = 0;
    set.translate[1] = 0;
    set.translate[2] = zIncrement;
    set.translate[revDirection] = margins[direction ? 3 : 0];
    set.align[0] = 0;
    set.align[1] = 0;
    set.origin[0] = 0;
    set.origin[1] = 0;
    offset = direction ? margins[0] : margins[3];
    sizeLeft = size[direction] - (offset + (direction ? margins[2] : margins[1]));
    sizeLeft -= (items.length - 1) * spacing;
    for (var i = 0; i < items.length; i++) {
        if (options.itemSize === undefined) {
            nodeSize = Math.round(sizeLeft / (items.length - i));
        } else {
            nodeSize = options.itemSize === true ? context.resolveSize(items[i], size)[direction] : options.itemSize;
        }
        set.scrollLength = nodeSize;
        if (i === 0) {
            set.scrollLength += direction ? margins[0] : margins[3];
        }
        if (i === items.length - 1) {
            set.scrollLength += direction ? margins[2] : margins[1];
        } else {
            set.scrollLength += spacing;
        }
        set.size[direction] = nodeSize;
        set.translate[direction] = offset;
        context.set(items[i], set);
        offset += nodeSize;
        sizeLeft -= nodeSize;
        if (i === options.selectedItemIndex) {
            set.scrollLength = 0;
            set.translate[direction] += nodeSize / 2;
            set.translate[2] = zIncrement * 2;
            set.origin[direction] = 0.5;
            context.set('selectedItemOverlay', set);
            set.origin[direction] = 0;
            set.translate[2] = zIncrement;
        }
        if (i < items.length - 1) {
            if (spacers && i < spacers.length) {
                set.size[direction] = spacing;
                set.translate[direction] = offset;
                context.set(spacers[i], set);
            }
            offset += spacing;
        } else {
            offset += direction ? margins[2] : margins[1];
        }
    }
    set.scrollLength = 0;
    set.size[0] = size[0];
    set.size[1] = size[1];
    set.size[direction] = size[direction];
    set.translate[0] = 0;
    set.translate[1] = 0;
    set.translate[2] = 0;
    set.translate[direction] = 0;
    context.set('background', set);
}
TabBarLayout.Capabilities = capabilities;
TabBarLayout.Name = 'TabBarLayout';
TabBarLayout.Description = 'TabBar widget layout';
module.exports = TabBarLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../LayoutUtility":9}],22:[function(require,module,exports){
(function (global){
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var capabilities = {
        sequence: true,
        direction: [
            Utility.Direction.Y,
            Utility.Direction.X
        ],
        scrolling: true,
        trueSize: true
    };
var size;
var direction;
var revDirection;
var node;
var itemSize;
var diameter;
var offset;
var bound;
var angle;
var radius;
var itemAngle;
var radialOpacity;
var set = {
        opacity: 1,
        size: [
            0,
            0
        ],
        translate: [
            0,
            0,
            0
        ],
        rotate: [
            0,
            0,
            0
        ],
        origin: [
            0.5,
            0.5
        ],
        align: [
            0.5,
            0.5
        ],
        scrollLength: undefined
    };
function WheelLayout(context, options) {
    size = context.size;
    direction = context.direction;
    revDirection = direction ? 0 : 1;
    itemSize = options.itemSize || size[direction] / 2;
    diameter = options.diameter || itemSize * 3;
    radius = diameter / 2;
    itemAngle = Math.atan2(itemSize / 2, radius) * 2;
    radialOpacity = options.radialOpacity === undefined ? 1 : options.radialOpacity;
    set.opacity = 1;
    set.size[0] = size[0];
    set.size[1] = size[1];
    set.size[revDirection] = size[revDirection];
    set.size[direction] = itemSize;
    set.translate[0] = 0;
    set.translate[1] = 0;
    set.translate[2] = 0;
    set.rotate[0] = 0;
    set.rotate[1] = 0;
    set.rotate[2] = 0;
    set.scrollLength = itemSize;
    offset = context.scrollOffset;
    bound = Math.PI / 2 / itemAngle * itemSize + itemSize;
    while (offset <= bound) {
        node = context.next();
        if (!node) {
            break;
        }
        if (offset >= -bound) {
            angle = offset / itemSize * itemAngle;
            set.translate[direction] = radius * Math.sin(angle);
            set.translate[2] = radius * Math.cos(angle) - radius;
            set.rotate[revDirection] = direction ? -angle : angle;
            set.opacity = 1 - Math.abs(angle) / (Math.PI / 2) * (1 - radialOpacity);
            context.set(node, set);
        }
        offset += itemSize;
    }
    offset = context.scrollOffset - itemSize;
    while (offset >= -bound) {
        node = context.prev();
        if (!node) {
            break;
        }
        if (offset <= bound) {
            angle = offset / itemSize * itemAngle;
            set.translate[direction] = radius * Math.sin(angle);
            set.translate[2] = radius * Math.cos(angle) - radius;
            set.rotate[revDirection] = direction ? -angle : angle;
            set.opacity = 1 - Math.abs(angle) / (Math.PI / 2) * (1 - radialOpacity);
            context.set(node, set);
        }
        offset -= itemSize;
    }
}
WheelLayout.Capabilities = capabilities;
WheelLayout.Name = 'WheelLayout';
WheelLayout.Description = 'Spinner-wheel/slot-machine layout';
module.exports = WheelLayout;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],23:[function(require,module,exports){
(function (global){
var View = typeof window !== 'undefined' ? window.famous.core.View : typeof global !== 'undefined' ? global.famous.core.View : null;
var Surface = typeof window !== 'undefined' ? window.famous.core.Surface : typeof global !== 'undefined' ? global.famous.core.Surface : null;
var Utility = typeof window !== 'undefined' ? window.famous.utilities.Utility : typeof global !== 'undefined' ? global.famous.utilities.Utility : null;
var ContainerSurface = typeof window !== 'undefined' ? window.famous.surfaces.ContainerSurface : typeof global !== 'undefined' ? global.famous.surfaces.ContainerSurface : null;
var LayoutController = require('../LayoutController');
var ScrollController = require('../ScrollController');
var WheelLayout = require('../layouts/WheelLayout');
var ProportionalLayout = require('../layouts/ProportionalLayout');
var VirtualViewSequence = require('../VirtualViewSequence');
var DatePickerComponents = require('./DatePickerComponents');
var LayoutUtility = require('../LayoutUtility');
function DatePicker(options) {
    View.apply(this, arguments);
    options = options || {};
    this._date = new Date(options.date ? options.date.getTime() : undefined);
    this._components = [];
    this.classes = options.classes ? this.classes.concat(options.classes) : this.classes;
    _createLayout.call(this);
    _updateComponents.call(this);
    this._overlayRenderables = {
        top: _createRenderable.call(this, 'top'),
        middle: _createRenderable.call(this, 'middle'),
        bottom: _createRenderable.call(this, 'bottom')
    };
    _createOverlay.call(this);
    this.setOptions(this.options);
}
DatePicker.prototype = Object.create(View.prototype);
DatePicker.prototype.constructor = DatePicker;
DatePicker.prototype.classes = [
    'ff-widget',
    'ff-datepicker'
];
DatePicker.Component = DatePickerComponents;
DatePicker.DEFAULT_OPTIONS = {
    perspective: 500,
    wheelLayout: {
        itemSize: 100,
        diameter: 500
    },
    createRenderables: {
        item: true,
        top: false,
        middle: false,
        bottom: false
    },
    scrollController: {
        enabled: true,
        paginated: true,
        paginationMode: ScrollController.PaginationMode.SCROLL,
        mouseMove: true,
        scrollSpring: {
            dampingRatio: 1,
            period: 800
        }
    }
};
function _createRenderable(id, data) {
    var option = this.options.createRenderables[Array.isArray(id) ? id[0] : id];
    if (option instanceof Function) {
        return option.call(this, id, data);
    } else if (!option) {
        return undefined;
    }
    if (data !== undefined && data instanceof Object) {
        return data;
    }
    var surface = new Surface({
            classes: this.classes,
            content: data ? '<div>' + data + '</div>' : undefined
        });
    if (Array.isArray(id)) {
        for (var i = 0; i < id.length; i++) {
            surface.addClass(id[i]);
        }
    } else {
        surface.addClass(id);
    }
    return surface;
}
DatePicker.prototype.setOptions = function (options) {
    View.prototype.setOptions.call(this, options);
    if (!this.layout) {
        return this;
    }
    if (options.perspective !== undefined) {
        this.container.context.setPerspective(options.perspective);
    }
    var i;
    if (options.wheelLayout !== undefined) {
        for (i = 0; i < this.scrollWheels.length; i++) {
            this.scrollWheels[i].scrollController.setLayoutOptions(options.wheelLayout);
        }
        this.overlay.setLayoutOptions({ itemSize: this.options.wheelLayout.itemSize });
    }
    if (options.scrollController !== undefined) {
        for (i = 0; i < this.scrollWheels.length; i++) {
            this.scrollWheels[i].scrollController.setOptions(options.scrollController);
        }
    }
    return this;
};
DatePicker.prototype.setComponents = function (components) {
    this._components = components;
    _updateComponents.call(this);
    return this;
};
DatePicker.prototype.getComponents = function () {
    return this._components;
};
DatePicker.prototype.setDate = function (date) {
    this._date.setTime(date.getTime());
    _setDateToScrollWheels.call(this, this._date);
    return this;
};
DatePicker.prototype.getDate = function () {
    return this._date;
};
function _setDateToScrollWheels(date) {
    for (var i = 0; i < this.scrollWheels.length; i++) {
        var scrollWheel = this.scrollWheels[i];
        var component = scrollWheel.component;
        var item = scrollWheel.scrollController.getFirstVisibleItem();
        if (item && item.viewSequence) {
            var viewSequence = item.viewSequence;
            var renderNode = item.viewSequence.get();
            var currentValue = component.getComponent(renderNode.date);
            var destValue = component.getComponent(date);
            var steps = 0;
            if (currentValue !== destValue) {
                steps = destValue - currentValue;
                if (component.loop) {
                    var revSteps = steps < 0 ? steps + component.upperBound : steps - component.upperBound;
                    if (Math.abs(revSteps) < Math.abs(steps)) {
                        steps = revSteps;
                    }
                }
            }
            if (!steps) {
                scrollWheel.scrollController.goToRenderNode(renderNode);
            } else {
                while (currentValue !== destValue) {
                    viewSequence = steps > 0 ? viewSequence.getNext() : viewSequence.getPrevious();
                    renderNode = viewSequence ? viewSequence.get() : undefined;
                    if (!renderNode) {
                        break;
                    }
                    currentValue = component.getComponent(renderNode.date);
                    if (steps > 0) {
                        scrollWheel.scrollController.goToNextPage();
                    } else {
                        scrollWheel.scrollController.goToPreviousPage();
                    }
                }
            }
        }
    }
}
function _getDateFromScrollWheels() {
    var date = new Date(this._date);
    for (var i = 0; i < this.scrollWheels.length; i++) {
        var scrollWheel = this.scrollWheels[i];
        var component = scrollWheel.component;
        var item = scrollWheel.scrollController.getFirstVisibleItem();
        if (item && item.renderNode) {
            component.setComponent(date, component.getComponent(item.renderNode.date));
        }
    }
    return date;
}
function _createLayout() {
    this.container = new ContainerSurface(this.options.container);
    this.container.setClasses(this.classes);
    this.layout = new LayoutController({
        layout: ProportionalLayout,
        layoutOptions: { ratios: [] },
        direction: Utility.Direction.X
    });
    this.container.add(this.layout);
    this.add(this.container);
}
function _clickItem(scrollWheel, event) {
}
function _scrollWheelScrollStart() {
    this._scrollingCount++;
    if (this._scrollingCount === 1) {
        this._eventOutput.emit('scrollstart', { target: this });
    }
}
function _scrollWheelScrollEnd() {
    this._scrollingCount--;
    if (this._scrollingCount === 0) {
        this._eventOutput.emit('scrollend', {
            target: this,
            date: this._date
        });
    }
}
function _scrollWheelPageChange() {
    this._date = _getDateFromScrollWheels.call(this);
    this._eventOutput.emit('datechange', {
        target: this,
        date: this._date
    });
}
function _updateComponents() {
    this.scrollWheels = [];
    this._scrollingCount = 0;
    var dataSource = [];
    var sizeRatios = [];
    for (var i = 0; i < this._components.length; i++) {
        var component = this._components[i];
        component.createRenderable = _createRenderable.bind(this);
        var viewSequence = new VirtualViewSequence({
                factory: component,
                value: component.create(this._date)
            });
        var options = LayoutUtility.combineOptions(this.options.scrollController, {
                layout: WheelLayout,
                layoutOptions: this.options.wheelLayout,
                flow: false,
                direction: Utility.Direction.Y,
                dataSource: viewSequence,
                autoPipeEvents: true
            });
        var scrollController = new ScrollController(options);
        scrollController.on('scrollstart', _scrollWheelScrollStart.bind(this));
        scrollController.on('scrollend', _scrollWheelScrollEnd.bind(this));
        scrollController.on('pagechange', _scrollWheelPageChange.bind(this));
        var scrollWheel = {
                component: component,
                scrollController: scrollController,
                viewSequence: viewSequence
            };
        this.scrollWheels.push(scrollWheel);
        component.on('click', _clickItem.bind(this, scrollWheel));
        dataSource.push(scrollController);
        sizeRatios.push(component.sizeRatio);
    }
    this.layout.setDataSource(dataSource);
    this.layout.setLayoutOptions({ ratios: sizeRatios });
}
function OverlayLayout(context, options) {
    var height = (context.size[1] - options.itemSize) / 2;
    context.set('top', {
        size: [
            context.size[0],
            height
        ],
        translate: [
            0,
            0,
            1
        ]
    });
    context.set('middle', {
        size: [
            context.size[0],
            context.size[1] - height * 2
        ],
        translate: [
            0,
            height,
            1
        ]
    });
    context.set('bottom', {
        size: [
            context.size[0],
            height
        ],
        translate: [
            0,
            context.size[1] - height,
            1
        ]
    });
}
function _createOverlay() {
    this.overlay = new LayoutController({
        layout: OverlayLayout,
        layoutOptions: { itemSize: this.options.wheelLayout.itemSize },
        dataSource: this._overlayRenderables
    });
    this.add(this.overlay);
}
module.exports = DatePicker;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../LayoutController":6,"../LayoutUtility":9,"../ScrollController":10,"../VirtualViewSequence":11,"../layouts/ProportionalLayout":20,"../layouts/WheelLayout":22,"./DatePickerComponents":24}],24:[function(require,module,exports){
(function (global){
var Surface = typeof window !== 'undefined' ? window.famous.core.Surface : typeof global !== 'undefined' ? global.famous.core.Surface : null;
var EventHandler = typeof window !== 'undefined' ? window.famous.core.EventHandler : typeof global !== 'undefined' ? global.famous.core.EventHandler : null;
function decimal1(date) {
    return '' + date[this.get]();
}
function decimal2(date) {
    return ('0' + date[this.get]()).slice(-2);
}
function decimal3(date) {
    return ('00' + date[this.get]()).slice(-3);
}
function decimal4(date) {
    return ('000' + date[this.get]()).slice(-4);
}
function Base(options) {
    this._eventOutput = new EventHandler();
    this._pool = [];
    EventHandler.setOutputHandler(this, this._eventOutput);
    if (options) {
        for (var key in options) {
            this[key] = options[key];
        }
    }
}
Base.prototype.step = 1;
Base.prototype.classes = ['item'];
Base.prototype.getComponent = function (date) {
    return date[this.get]();
};
Base.prototype.setComponent = function (date, value) {
    return date[this.set](value);
};
Base.prototype.format = function (date) {
    return 'overide to implement';
};
Base.prototype.createNext = function (renderable) {
    var date = this.getNext(renderable.date);
    return date ? this.create(date) : undefined;
};
Base.prototype.getNext = function (date) {
    date = new Date(date.getTime());
    var newVal = this.getComponent(date) + this.step;
    if (this.upperBound !== undefined && newVal >= this.upperBound) {
        if (!this.loop) {
            return undefined;
        }
        newVal = Math.max(newVal % this.upperBound, this.lowerBound || 0);
    }
    this.setComponent(date, newVal);
    return date;
};
Base.prototype.createPrevious = function (renderable) {
    var date = this.getPrevious(renderable.date);
    return date ? this.create(date) : undefined;
};
Base.prototype.getPrevious = function (date) {
    date = new Date(date.getTime());
    var newVal = this.getComponent(date) - this.step;
    if (this.lowerBound !== undefined && newVal < this.lowerBound) {
        if (!this.loop) {
            return undefined;
        }
        newVal = newVal % this.upperBound;
    }
    this.setComponent(date, newVal);
    return date;
};
Base.prototype.installClickHandler = function (renderable) {
    renderable.on('click', function (event) {
        this._eventOutput.emit('click', {
            target: renderable,
            event: event
        });
    }.bind(this));
};
Base.prototype.createRenderable = function (classes, data) {
    return new Surface({
        classes: classes,
        content: '<div>' + data + '</div>'
    });
};
Base.prototype.create = function (date) {
    date = date || new Date();
    var renderable;
    if (this._pool.length) {
        renderable = this._pool[0];
        this._pool.splice(0, 1);
        renderable.setContent(this.format(date));
    } else {
        renderable = this.createRenderable(this.classes, this.format(date));
        this.installClickHandler(renderable);
    }
    renderable.date = date;
    return renderable;
};
Base.prototype.destroy = function (renderable) {
    this._pool.push(renderable);
};
function Year() {
    Base.apply(this, arguments);
}
Year.prototype = Object.create(Base.prototype);
Year.prototype.constructor = Year;
Year.prototype.classes = [
    'item',
    'year'
];
Year.prototype.format = decimal4;
Year.prototype.sizeRatio = 1;
Year.prototype.step = 1;
Year.prototype.loop = false;
Year.prototype.set = 'setFullYear';
Year.prototype.get = 'getFullYear';
function Month() {
    Base.apply(this, arguments);
}
Month.prototype = Object.create(Base.prototype);
Month.prototype.constructor = Month;
Month.prototype.classes = [
    'item',
    'month'
];
Month.prototype.sizeRatio = 2;
Month.prototype.lowerBound = 0;
Month.prototype.upperBound = 12;
Month.prototype.step = 1;
Month.prototype.loop = true;
Month.prototype.set = 'setMonth';
Month.prototype.get = 'getMonth';
Month.prototype.strings = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];
Month.prototype.format = function (date) {
    return this.strings[date.getMonth()];
};
function FullDay() {
    Base.apply(this, arguments);
}
FullDay.prototype = Object.create(Base.prototype);
FullDay.prototype.constructor = FullDay;
FullDay.prototype.classes = [
    'item',
    'fullday'
];
FullDay.prototype.sizeRatio = 2;
FullDay.prototype.step = 1;
FullDay.prototype.set = 'setDate';
FullDay.prototype.get = 'getDate';
FullDay.prototype.format = function (date) {
    return date.toLocaleDateString();
};
function WeekDay() {
    Base.apply(this, arguments);
}
WeekDay.prototype = Object.create(Base.prototype);
WeekDay.prototype.constructor = WeekDay;
WeekDay.prototype.classes = [
    'item',
    'weekday'
];
WeekDay.prototype.sizeRatio = 2;
WeekDay.prototype.lowerBound = 0;
WeekDay.prototype.upperBound = 7;
WeekDay.prototype.step = 1;
WeekDay.prototype.loop = true;
WeekDay.prototype.set = 'setDate';
WeekDay.prototype.get = 'getDate';
WeekDay.prototype.strings = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];
WeekDay.prototype.format = function (date) {
    return this.strings[date.getDay()];
};
function Day() {
    Base.apply(this, arguments);
}
Day.prototype = Object.create(Base.prototype);
Day.prototype.constructor = Day;
Day.prototype.classes = [
    'item',
    'day'
];
Day.prototype.format = decimal1;
Day.prototype.sizeRatio = 1;
Day.prototype.lowerBound = 1;
Day.prototype.upperBound = 32;
Day.prototype.step = 1;
Day.prototype.loop = true;
Day.prototype.set = 'setDate';
Day.prototype.get = 'getDate';
function Hour() {
    Base.apply(this, arguments);
}
Hour.prototype = Object.create(Base.prototype);
Hour.prototype.constructor = Hour;
Hour.prototype.classes = [
    'item',
    'hour'
];
Hour.prototype.format = decimal2;
Hour.prototype.sizeRatio = 1;
Hour.prototype.lowerBound = 0;
Hour.prototype.upperBound = 24;
Hour.prototype.step = 1;
Hour.prototype.loop = true;
Hour.prototype.set = 'setHours';
Hour.prototype.get = 'getHours';
function Minute() {
    Base.apply(this, arguments);
}
Minute.prototype = Object.create(Base.prototype);
Minute.prototype.constructor = Minute;
Minute.prototype.classes = [
    'item',
    'minute'
];
Minute.prototype.format = decimal2;
Minute.prototype.sizeRatio = 1;
Minute.prototype.lowerBound = 0;
Minute.prototype.upperBound = 60;
Minute.prototype.step = 1;
Minute.prototype.loop = true;
Minute.prototype.set = 'setMinutes';
Minute.prototype.get = 'getMinutes';
function Second() {
    Base.apply(this, arguments);
}
Second.prototype = Object.create(Base.prototype);
Second.prototype.constructor = Second;
Second.prototype.classes = [
    'item',
    'second'
];
Second.prototype.format = decimal2;
Second.prototype.sizeRatio = 1;
Second.prototype.lowerBound = 0;
Second.prototype.upperBound = 60;
Second.prototype.step = 1;
Second.prototype.loop = true;
Second.prototype.set = 'setSeconds';
Second.prototype.get = 'getSeconds';
function Millisecond() {
    Base.apply(this, arguments);
}
Millisecond.prototype = Object.create(Base.prototype);
Millisecond.prototype.constructor = Millisecond;
Millisecond.prototype.classes = [
    'item',
    'millisecond'
];
Millisecond.prototype.format = decimal3;
Millisecond.prototype.sizeRatio = 1;
Millisecond.prototype.lowerBound = 0;
Millisecond.prototype.upperBound = 1000;
Millisecond.prototype.step = 1;
Millisecond.prototype.loop = true;
Millisecond.prototype.set = 'setMilliseconds';
Millisecond.prototype.get = 'getMilliseconds';
module.exports = {
    Base: Base,
    Year: Year,
    Month: Month,
    FullDay: FullDay,
    WeekDay: WeekDay,
    Day: Day,
    Hour: Hour,
    Minute: Minute,
    Second: Second,
    Millisecond: Millisecond
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],25:[function(require,module,exports){
(function (global){
var Surface = typeof window !== 'undefined' ? window.famous.core.Surface : typeof global !== 'undefined' ? global.famous.core.Surface : null;
var View = typeof window !== 'undefined' ? window.famous.core.View : typeof global !== 'undefined' ? global.famous.core.View : null;
var LayoutController = require('../LayoutController');
var TabBarLayout = require('../layouts/TabBarLayout');
function TabBar(options) {
    View.apply(this, arguments);
    this._selectedItemIndex = -1;
    options = options || {};
    this.classes = options.classes ? this.classes.concat(options.classes) : this.classes;
    this.layout = new LayoutController(this.options.layoutController);
    this.add(this.layout);
    this.layout.pipe(this._eventOutput);
    this._renderables = {
        items: [],
        spacers: [],
        background: _createRenderable.call(this, 'background'),
        selectedItemOverlay: _createRenderable.call(this, 'selectedItemOverlay')
    };
    this.setOptions(this.options);
}
TabBar.prototype = Object.create(View.prototype);
TabBar.prototype.constructor = TabBar;
TabBar.prototype.classes = [
    'ff-widget',
    'ff-tabbar'
];
TabBar.DEFAULT_OPTIONS = {
    tabBarLayout: {
        margins: [
            0,
            0,
            0,
            0
        ],
        spacing: 0
    },
    createRenderables: {
        item: true,
        background: false,
        selectedItemOverlay: false,
        spacer: false
    },
    layoutController: {
        autoPipeEvents: true,
        layout: TabBarLayout,
        flow: true,
        flowOptions: {
            reflowOnResize: false,
            spring: {
                dampingRatio: 0.8,
                period: 300
            }
        }
    }
};
function _setSelectedItem(index) {
    if (index !== this._selectedItemIndex) {
        var oldIndex = this._selectedItemIndex;
        this._selectedItemIndex = index;
        this.layout.setLayoutOptions({ selectedItemIndex: index });
        if (oldIndex >= 0 && this._renderables.items[oldIndex].removeClass) {
            this._renderables.items[oldIndex].removeClass('selected');
        }
        if (this._renderables.items[index].addClass) {
            this._renderables.items[index].addClass('selected');
        }
        if (oldIndex >= 0) {
            this._eventOutput.emit('tabchange', {
                target: this,
                index: index,
                oldIndex: oldIndex,
                item: this._renderables.items[index]
            });
        }
    }
}
function _createRenderable(id, data) {
    var option = this.options.createRenderables[id];
    if (option instanceof Function) {
        return option.call(this, id, data);
    } else if (!option) {
        return undefined;
    }
    if (data !== undefined && data instanceof Object) {
        return data;
    }
    var surface = new Surface({
            classes: this.classes,
            content: data ? '<div>' + data + '</div>' : undefined
        });
    surface.addClass(id);
    if (id === 'item') {
        if (this.options.tabBarLayout && this.options.tabBarLayout.itemSize && this.options.tabBarLayout.itemSize === true) {
            surface.setSize(this.layout.getDirection() ? [
                undefined,
                true
            ] : [
                true,
                undefined
            ]);
        }
    }
    return surface;
}
TabBar.prototype.setOptions = function (options) {
    View.prototype.setOptions.call(this, options);
    if (!this.layout) {
        return this;
    }
    if (options.tabBarLayout !== undefined) {
        this.layout.setLayoutOptions(options.tabBarLayout);
    }
    if (options.layoutController) {
        this.layout.setOptions(options.layoutController);
    }
    return this;
};
TabBar.prototype.setItems = function (items) {
    var currentIndex = this._selectedItemIndex;
    this._selectedItemIndex = -1;
    this._renderables.items = [];
    this._renderables.spacers = [];
    if (items) {
        for (var i = 0; i < items.length; i++) {
            var item = _createRenderable.call(this, 'item', items[i]);
            if (item.on) {
                item.on('click', _setSelectedItem.bind(this, i));
            }
            this._renderables.items.push(item);
            if (i < items.length - 1) {
                var spacer = _createRenderable.call(this, 'spacer', ' ');
                if (spacer) {
                    this._renderables.spacers.push(spacer);
                }
            }
        }
    }
    this.layout.setDataSource(this._renderables);
    if (this._renderables.items.length) {
        _setSelectedItem.call(this, Math.max(Math.min(currentIndex, this._renderables.items.length - 1), 0));
    }
    return this;
};
TabBar.prototype.getItems = function () {
    return this._renderables.items;
};
TabBar.prototype.getItemSpec = function (index, normalize) {
    return this.layout.getSpec(this._renderables.items[index], normalize);
};
TabBar.prototype.setSelectedItemIndex = function (index) {
    _setSelectedItem.call(this, index);
    return this;
};
TabBar.prototype.getSelectedItemIndex = function () {
    return this._selectedItemIndex;
};
TabBar.prototype.getSize = function () {
    return this.options.size || (this.layout ? this.layout.getSize() : View.prototype.getSize.call(this));
};
module.exports = TabBar;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../LayoutController":6,"../layouts/TabBarLayout":21}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2ZhbW91cy1mbGV4LWdsb2JhbC50ZW1wbGF0ZS5qcyIsInNyYy9BbmltYXRpb25Db250cm9sbGVyLmpzIiwic3JjL0ZsZXhTY3JvbGxWaWV3LmpzIiwic3JjL0Zsb3dMYXlvdXROb2RlLmpzIiwic3JjL0xheW91dENvbnRleHQuanMiLCJzcmMvTGF5b3V0Q29udHJvbGxlci5qcyIsInNyYy9MYXlvdXROb2RlLmpzIiwic3JjL0xheW91dE5vZGVNYW5hZ2VyLmpzIiwic3JjL0xheW91dFV0aWxpdHkuanMiLCJzcmMvU2Nyb2xsQ29udHJvbGxlci5qcyIsInNyYy9WaXJ0dWFsVmlld1NlcXVlbmNlLmpzIiwic3JjL2hlbHBlcnMvTGF5b3V0RG9ja0hlbHBlci5qcyIsInNyYy9sYXlvdXRzL0NvbGxlY3Rpb25MYXlvdXQuanMiLCJzcmMvbGF5b3V0cy9Db3ZlckxheW91dC5qcyIsInNyYy9sYXlvdXRzL0N1YmVMYXlvdXQuanMiLCJzcmMvbGF5b3V0cy9HcmlkTGF5b3V0LmpzIiwic3JjL2xheW91dHMvSGVhZGVyRm9vdGVyTGF5b3V0LmpzIiwic3JjL2xheW91dHMvTGlzdExheW91dC5qcyIsInNyYy9sYXlvdXRzL05hdkJhckxheW91dC5qcyIsInNyYy9sYXlvdXRzL1Byb3BvcnRpb25hbExheW91dC5qcyIsInNyYy9sYXlvdXRzL1RhYkJhckxheW91dC5qcyIsInNyYy9sYXlvdXRzL1doZWVsTGF5b3V0LmpzIiwic3JjL3dpZGdldHMvRGF0ZVBpY2tlci5qcyIsInNyYy93aWRnZXRzL0RhdGVQaWNrZXJDb21wb25lbnRzLmpzIiwic3JjL3dpZGdldHMvVGFiQmFyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNhQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0WkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeGJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDdG9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaGVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzF2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNoTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzlSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzlSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAodHlwZW9mIGZhbW91c2ZsZXggPT09ICd1bmRlZmluZWQnKSB7XG4gICAgZmFtb3VzZmxleCA9IHt9O1xufVxuXG5mYW1vdXNmbGV4LkZsZXhTY3JvbGxWaWV3ID0gcmVxdWlyZSgnLi4vc3JjL0ZsZXhTY3JvbGxWaWV3Jyk7XG5mYW1vdXNmbGV4LkZsb3dMYXlvdXROb2RlID0gcmVxdWlyZSgnLi4vc3JjL0Zsb3dMYXlvdXROb2RlJyk7XG5mYW1vdXNmbGV4LkxheW91dENvbnRleHQgPSByZXF1aXJlKCcuLi9zcmMvTGF5b3V0Q29udGV4dCcpO1xuZmFtb3VzZmxleC5MYXlvdXRDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vc3JjL0xheW91dENvbnRyb2xsZXInKTtcbmZhbW91c2ZsZXguTGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4uL3NyYy9MYXlvdXROb2RlJyk7XG5mYW1vdXNmbGV4LkxheW91dE5vZGVNYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3JjL0xheW91dE5vZGVNYW5hZ2VyJyk7XG5mYW1vdXNmbGV4LkxheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuLi9zcmMvTGF5b3V0VXRpbGl0eScpO1xuZmFtb3VzZmxleC5TY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vc3JjL1Njcm9sbENvbnRyb2xsZXInKTtcbmZhbW91c2ZsZXguVmlydHVhbFZpZXdTZXF1ZW5jZSA9IHJlcXVpcmUoJy4uL3NyYy9WaXJ0dWFsVmlld1NlcXVlbmNlJyk7XG5mYW1vdXNmbGV4LkFuaW1hdGlvbkNvbnRyb2xsZXIgPSByZXF1aXJlKCcuLi9zcmMvQW5pbWF0aW9uQ29udHJvbGxlcicpO1xuXG5mYW1vdXNmbGV4LndpZGdldHMgPSBmYW1vdXNmbGV4LndpZGdldHMgfHwge307XG5mYW1vdXNmbGV4LndpZGdldHMuRGF0ZVBpY2tlciA9IHJlcXVpcmUoJy4uL3NyYy93aWRnZXRzL0RhdGVQaWNrZXInKTtcbmZhbW91c2ZsZXgud2lkZ2V0cy5UYWJCYXIgPSByZXF1aXJlKCcuLi9zcmMvd2lkZ2V0cy9UYWJCYXInKTtcblxuZmFtb3VzZmxleC5sYXlvdXRzID0gZmFtb3VzZmxleC5sYXlvdXRzIHx8IHt9O1xuZmFtb3VzZmxleC5sYXlvdXRzLkNvbGxlY3Rpb25MYXlvdXQgPSByZXF1aXJlKCcuLi9zcmMvbGF5b3V0cy9Db2xsZWN0aW9uTGF5b3V0Jyk7XG5mYW1vdXNmbGV4LmxheW91dHMuQ292ZXJMYXlvdXQgPSByZXF1aXJlKCcuLi9zcmMvbGF5b3V0cy9Db3ZlckxheW91dCcpO1xuZmFtb3VzZmxleC5sYXlvdXRzLkN1YmVMYXlvdXQgPSByZXF1aXJlKCcuLi9zcmMvbGF5b3V0cy9DdWJlTGF5b3V0Jyk7XG5mYW1vdXNmbGV4LmxheW91dHMuR3JpZExheW91dCA9IHJlcXVpcmUoJy4uL3NyYy9sYXlvdXRzL0dyaWRMYXlvdXQnKTtcbmZhbW91c2ZsZXgubGF5b3V0cy5IZWFkZXJGb290ZXJMYXlvdXQgPSByZXF1aXJlKCcuLi9zcmMvbGF5b3V0cy9IZWFkZXJGb290ZXJMYXlvdXQnKTtcbmZhbW91c2ZsZXgubGF5b3V0cy5MaXN0TGF5b3V0ID0gcmVxdWlyZSgnLi4vc3JjL2xheW91dHMvTGlzdExheW91dCcpO1xuZmFtb3VzZmxleC5sYXlvdXRzLk5hdkJhckxheW91dCA9IHJlcXVpcmUoJy4uL3NyYy9sYXlvdXRzL05hdkJhckxheW91dCcpO1xuZmFtb3VzZmxleC5sYXlvdXRzLlByb3BvcnRpb25hbExheW91dCA9IHJlcXVpcmUoJy4uL3NyYy9sYXlvdXRzL1Byb3BvcnRpb25hbExheW91dCcpO1xuZmFtb3VzZmxleC5sYXlvdXRzLldoZWVsTGF5b3V0ID0gcmVxdWlyZSgnLi4vc3JjL2xheW91dHMvV2hlZWxMYXlvdXQnKTtcblxuZmFtb3VzZmxleC5oZWxwZXJzID0gZmFtb3VzZmxleC5oZWxwZXJzIHx8IHt9O1xuZmFtb3VzZmxleC5oZWxwZXJzLkxheW91dERvY2tIZWxwZXIgPSByZXF1aXJlKCcuLi9zcmMvaGVscGVycy9MYXlvdXREb2NrSGVscGVyJyk7XG4iLCJ2YXIgVmlldyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlZpZXcgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5WaWV3IDogbnVsbDtcbnZhciBMYXlvdXRDb250cm9sbGVyID0gcmVxdWlyZSgnLi9MYXlvdXRDb250cm9sbGVyJyk7XG52YXIgVHJhbnNmb3JtID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogbnVsbDtcbnZhciBNb2RpZmllciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLk1vZGlmaWVyIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuTW9kaWZpZXIgOiBudWxsO1xudmFyIFN0YXRlTW9kaWZpZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMubW9kaWZpZXJzLlN0YXRlTW9kaWZpZXIgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMubW9kaWZpZXJzLlN0YXRlTW9kaWZpZXIgOiBudWxsO1xudmFyIFJlbmRlck5vZGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5SZW5kZXJOb2RlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuUmVuZGVyTm9kZSA6IG51bGw7XG52YXIgVGltZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlRpbWVyIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnV0aWxpdGllcy5UaW1lciA6IG51bGw7XG52YXIgRWFzaW5nID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnRyYW5zaXRpb25zLkVhc2luZyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy50cmFuc2l0aW9ucy5FYXNpbmcgOiBudWxsO1xuZnVuY3Rpb24gQW5pbWF0aW9uQ29udHJvbGxlcihvcHRpb25zKSB7XG4gICAgVmlldy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIF9jcmVhdGVMYXlvdXQuY2FsbCh0aGlzKTtcbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgfVxufVxuQW5pbWF0aW9uQ29udHJvbGxlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFZpZXcucHJvdG90eXBlKTtcbkFuaW1hdGlvbkNvbnRyb2xsZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQW5pbWF0aW9uQ29udHJvbGxlcjtcbkFuaW1hdGlvbkNvbnRyb2xsZXIuQW5pbWF0aW9uID0ge1xuICAgIFNsaWRlOiB7XG4gICAgICAgIExlZnQ6IGZ1bmN0aW9uIChzaG93LCBzaXplKSB7XG4gICAgICAgICAgICByZXR1cm4geyB0cmFuc2Zvcm06IFRyYW5zZm9ybS50cmFuc2xhdGUoc2hvdyA/IHNpemVbMF0gOiAtc2l6ZVswXSwgMCwgMCkgfTtcbiAgICAgICAgfSxcbiAgICAgICAgUmlnaHQ6IGZ1bmN0aW9uIChzaG93LCBzaXplKSB7XG4gICAgICAgICAgICByZXR1cm4geyB0cmFuc2Zvcm06IFRyYW5zZm9ybS50cmFuc2xhdGUoc2hvdyA/IC1zaXplWzBdIDogc2l6ZVswXSwgMCwgMCkgfTtcbiAgICAgICAgfSxcbiAgICAgICAgVXA6IGZ1bmN0aW9uIChzaG93LCBzaXplKSB7XG4gICAgICAgICAgICByZXR1cm4geyB0cmFuc2Zvcm06IFRyYW5zZm9ybS50cmFuc2xhdGUoMCwgc2hvdyA/IHNpemVbMV0gOiAtc2l6ZVsxXSwgMCkgfTtcbiAgICAgICAgfSxcbiAgICAgICAgRG93bjogZnVuY3Rpb24gKHNob3csIHNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHRyYW5zZm9ybTogVHJhbnNmb3JtLnRyYW5zbGF0ZSgwLCBzaG93ID8gLXNpemVbMV0gOiBzaXplWzFdLCAwKSB9O1xuICAgICAgICB9XG4gICAgfSxcbiAgICBGYWRlOiBmdW5jdGlvbiAoc2hvdywgc2l6ZSwgb3BhY2l0eSkge1xuICAgICAgICByZXR1cm4geyBvcGFjaXR5OiBvcGFjaXR5ID09PSB1bmRlZmluZWQgPyAwIDogb3BhY2l0eSB9O1xuICAgIH0sXG4gICAgWm9vbTogZnVuY3Rpb24gKHNob3csIHNpemUsIHNjYWxlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06IFRyYW5zZm9ybS5zY2FsZShzY2FsZSA/IHNjYWxlWzBdIDogMC41LCBzY2FsZSA/IHNjYWxlWzFdIDogMC41LCAxKSxcbiAgICAgICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgICAgIDAuNVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgICAgIDAuNSxcbiAgICAgICAgICAgICAgICAwLjVcbiAgICAgICAgICAgIF1cbiAgICAgICAgfTtcbiAgICB9XG59O1xuQW5pbWF0aW9uQ29udHJvbGxlci5ERUZBVUxUX09QVElPTlMgPSB7XG4gICAgdHJhbnNpdGlvbjoge1xuICAgICAgICBkdXJhdGlvbjogNDAwLFxuICAgICAgICBjdXJ2ZTogRWFzaW5nLmluT3V0UXVhZFxuICAgIH0sXG4gICAgYW5pbWF0aW9uOiBBbmltYXRpb25Db250cm9sbGVyLkFuaW1hdGlvbi5GYWRlLFxuICAgIHNob3c6IHt9LFxuICAgIGhpZGU6IHt9LFxuICAgIHRyYW5zZmVyOiB7IHpJbmRleDogMTAgfSxcbiAgICB6SW5kZXhPZmZzZXQ6IDBcbn07XG52YXIgSXRlbVN0YXRlID0ge1xuICAgICAgICBOT05FOiAwLFxuICAgICAgICBISURFOiAxLFxuICAgICAgICBISURJTkc6IDIsXG4gICAgICAgIFNIT1c6IDMsXG4gICAgICAgIFNIT1dJTkc6IDQsXG4gICAgICAgIFZJU0lCTEU6IDUsXG4gICAgICAgIFFVRVVFRDogNlxuICAgIH07XG5mdW5jdGlvbiBWaWV3U3RhY2tMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBzZXQgPSB7XG4gICAgICAgICAgICBzaXplOiBjb250ZXh0LnNpemUsXG4gICAgICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXVxuICAgICAgICB9O1xuICAgIHZhciB2aWV3cyA9IGNvbnRleHQuZ2V0KCd2aWV3cycpO1xuICAgIHZhciB0cmFuc2ZlcmFibGVzID0gY29udGV4dC5nZXQoJ3RyYW5zZmVyYWJsZXMnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IE1hdGgubWluKHZpZXdzLmxlbmd0aCwgMik7IGkrKykge1xuICAgICAgICB2YXIgaXRlbSA9IHRoaXMuX3ZpZXdTdGFja1tpXTtcbiAgICAgICAgc3dpdGNoIChpdGVtLnN0YXRlKSB7XG4gICAgICAgIGNhc2UgSXRlbVN0YXRlLkhJREU6XG4gICAgICAgIGNhc2UgSXRlbVN0YXRlLkhJRElORzpcbiAgICAgICAgY2FzZSBJdGVtU3RhdGUuVklTSUJMRTpcbiAgICAgICAgY2FzZSBJdGVtU3RhdGUuU0hPVzpcbiAgICAgICAgY2FzZSBJdGVtU3RhdGUuU0hPV0lORzpcbiAgICAgICAgICAgIHZhciB2aWV3ID0gdmlld3NbaV07XG4gICAgICAgICAgICBjb250ZXh0LnNldCh2aWV3LCBzZXQpO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0cmFuc2ZlcmFibGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBpdGVtLnRyYW5zZmVyYWJsZXMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zZmVyYWJsZXNbal0ucmVuZGVyTm9kZSA9PT0gaXRlbS50cmFuc2ZlcmFibGVzW2tdLnJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc2V0KHRyYW5zZmVyYWJsZXNbal0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0LnRyYW5zbGF0ZVsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnNpemVbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc2l6ZVsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2V0LnRyYW5zbGF0ZVsyXSArPSBvcHRpb25zLnpJbmRleE9mZnNldDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gX2NyZWF0ZUxheW91dCgpIHtcbiAgICB0aGlzLl9yZW5kZXJhYmxlcyA9IHtcbiAgICAgICAgdmlld3M6IFtdLFxuICAgICAgICB0cmFuc2ZlcmFibGVzOiBbXVxuICAgIH07XG4gICAgdGhpcy5fdmlld1N0YWNrID0gW107XG4gICAgdGhpcy5sYXlvdXQgPSBuZXcgTGF5b3V0Q29udHJvbGxlcih7XG4gICAgICAgIGxheW91dDogVmlld1N0YWNrTGF5b3V0LmJpbmQodGhpcyksXG4gICAgICAgIGxheW91dE9wdGlvbnM6IHRoaXMub3B0aW9ucyxcbiAgICAgICAgZGF0YVNvdXJjZTogdGhpcy5fcmVuZGVyYWJsZXNcbiAgICB9KTtcbiAgICB0aGlzLmFkZCh0aGlzLmxheW91dCk7XG4gICAgdGhpcy5sYXlvdXQub24oJ2xheW91dGVuZCcsIF9zdGFydEFuaW1hdGlvbnMuYmluZCh0aGlzKSk7XG59XG5mdW5jdGlvbiBfZ2V0Vmlld1NwZWMoaXRlbSwgdmlldywgaWQsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFpdGVtLnZpZXcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc3BlYyA9IHZpZXcuZ2V0U3BlYyhpZCk7XG4gICAgaWYgKHNwZWMpIHtcbiAgICAgICAgY2FsbGJhY2soc3BlYyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgVGltZXIuYWZ0ZXIoX2dldFZpZXdTcGVjLmJpbmQodGhpcywgaXRlbSwgdmlldywgaWQsIGNhbGxiYWNrKSwgMSk7XG4gICAgfVxufVxuZnVuY3Rpb24gX2dldFRyYW5zZmVyYWJsZShpdGVtLCB2aWV3LCBpZCkge1xuICAgIGlmICh2aWV3LmdldFRyYW5zZmVyYWJsZSkge1xuICAgICAgICByZXR1cm4gdmlldy5nZXRUcmFuc2ZlcmFibGUoaWQpO1xuICAgIH1cbiAgICBpZiAodmlldy5nZXRTcGVjICYmIHZpZXcuZ2V0ICYmIHZpZXcucmVwbGFjZSkge1xuICAgICAgICBpZiAodmlldy5nZXQoaWQpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2aWV3LmdldChpZCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzaG93OiBmdW5jdGlvbiAocmVuZGVyYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICB2aWV3LnJlcGxhY2UoaWQsIHJlbmRlcmFibGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZ2V0U3BlYzogX2dldFZpZXdTcGVjLmJpbmQodGhpcywgaXRlbSwgdmlldywgaWQpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh2aWV3LmxheW91dCkge1xuICAgICAgICByZXR1cm4gX2dldFRyYW5zZmVyYWJsZS5jYWxsKHRoaXMsIGl0ZW0sIHZpZXcubGF5b3V0LCBpZCk7XG4gICAgfVxufVxuZnVuY3Rpb24gX3N0YXJ0VHJhbnNmZXJhYmxlQW5pbWF0aW9ucyhpdGVtLCBwcmV2SXRlbSkge1xuICAgIGZvciAodmFyIHNvdXJjZUlkIGluIGl0ZW0ub3B0aW9ucy50cmFuc2Zlci5pdGVtcykge1xuICAgICAgICBfc3RhcnRUcmFuc2ZlcmFibGVBbmltYXRpb24uY2FsbCh0aGlzLCBpdGVtLCBwcmV2SXRlbSwgc291cmNlSWQpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIF9zdGFydFRyYW5zZmVyYWJsZUFuaW1hdGlvbihpdGVtLCBwcmV2SXRlbSwgc291cmNlSWQpIHtcbiAgICB2YXIgdGFyZ2V0ID0gaXRlbS5vcHRpb25zLnRyYW5zZmVyLml0ZW1zW3NvdXJjZUlkXTtcbiAgICB2YXIgdHJhbnNmZXJhYmxlID0ge307XG4gICAgdHJhbnNmZXJhYmxlLnNvdXJjZSA9IF9nZXRUcmFuc2ZlcmFibGUuY2FsbCh0aGlzLCBwcmV2SXRlbSwgcHJldkl0ZW0udmlldywgc291cmNlSWQpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHRhcmdldCkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0YXJnZXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRyYW5zZmVyYWJsZS50YXJnZXQgPSBfZ2V0VHJhbnNmZXJhYmxlLmNhbGwodGhpcywgaXRlbSwgaXRlbS52aWV3LCB0YXJnZXRbaV0pO1xuICAgICAgICAgICAgaWYgKHRyYW5zZmVyYWJsZS50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYW5zZmVyYWJsZS50YXJnZXQgPSBfZ2V0VHJhbnNmZXJhYmxlLmNhbGwodGhpcywgaXRlbSwgaXRlbS52aWV3LCB0YXJnZXQpO1xuICAgIH1cbiAgICBpZiAodHJhbnNmZXJhYmxlLnNvdXJjZSAmJiB0cmFuc2ZlcmFibGUudGFyZ2V0KSB7XG4gICAgICAgIHRyYW5zZmVyYWJsZS5zb3VyY2UuZ2V0U3BlYyhmdW5jdGlvbiAoc291cmNlU3BlYykge1xuICAgICAgICAgICAgdHJhbnNmZXJhYmxlLm9yaWdpbmFsU291cmNlID0gdHJhbnNmZXJhYmxlLnNvdXJjZS5nZXQoKTtcbiAgICAgICAgICAgIHRyYW5zZmVyYWJsZS5zb3VyY2Uuc2hvdyhuZXcgUmVuZGVyTm9kZShuZXcgTW9kaWZpZXIoc291cmNlU3BlYykpKTtcbiAgICAgICAgICAgIHRyYW5zZmVyYWJsZS5vcmlnaW5hbFRhcmdldCA9IHRyYW5zZmVyYWJsZS50YXJnZXQuZ2V0KCk7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0Tm9kZSA9IG5ldyBSZW5kZXJOb2RlKG5ldyBNb2RpZmllcih7IG9wYWNpdHk6IDAgfSkpO1xuICAgICAgICAgICAgdGFyZ2V0Tm9kZS5hZGQodHJhbnNmZXJhYmxlLm9yaWdpbmFsVGFyZ2V0KTtcbiAgICAgICAgICAgIHRyYW5zZmVyYWJsZS50YXJnZXQuc2hvdyh0YXJnZXROb2RlKTtcbiAgICAgICAgICAgIHZhciB6SW5kZXhNb2QgPSBuZXcgTW9kaWZpZXIoeyB0cmFuc2Zvcm06IFRyYW5zZm9ybS50cmFuc2xhdGUoMCwgMCwgaXRlbS5vcHRpb25zLnRyYW5zZmVyLnpJbmRleCkgfSk7XG4gICAgICAgICAgICB2YXIgbW9kID0gbmV3IFN0YXRlTW9kaWZpZXIoc291cmNlU3BlYyk7XG4gICAgICAgICAgICB0cmFuc2ZlcmFibGUucmVuZGVyTm9kZSA9IG5ldyBSZW5kZXJOb2RlKHpJbmRleE1vZCk7XG4gICAgICAgICAgICB0cmFuc2ZlcmFibGUucmVuZGVyTm9kZS5hZGQobW9kKS5hZGQodHJhbnNmZXJhYmxlLm9yaWdpbmFsU291cmNlKTtcbiAgICAgICAgICAgIGl0ZW0udHJhbnNmZXJhYmxlcy5wdXNoKHRyYW5zZmVyYWJsZSk7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJhYmxlcy50cmFuc2ZlcmFibGVzLnB1c2godHJhbnNmZXJhYmxlLnJlbmRlck5vZGUpO1xuICAgICAgICAgICAgdGhpcy5sYXlvdXQucmVmbG93TGF5b3V0KCk7XG4gICAgICAgICAgICBUaW1lci5hZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmZXJhYmxlLnRhcmdldC5nZXRTcGVjKGZ1bmN0aW9uICh0YXJnZXRTcGVjLCB0cmFuc2l0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZC5oYWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2VTcGVjLnRyYW5zZm9ybSB8fCB0YXJnZXRTcGVjLnRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kLnNldFRyYW5zZm9ybSh0YXJnZXRTcGVjLnRyYW5zZm9ybSB8fCBUcmFuc2Zvcm0uaWRlbnRpdHksIHRyYW5zaXRpb24gfHwgaXRlbS5vcHRpb25zLnRyYW5zZmVyLnRyYW5zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2VTcGVjLm9wYWNpdHkgIT09IHVuZGVmaW5lZCB8fCB0YXJnZXRTcGVjLm9wYWNpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kLnNldE9wYWNpdHkodGFyZ2V0U3BlYy5vcGFjaXR5ID09PSB1bmRlZmluZWQgPyAxIDogdGFyZ2V0U3BlYy5vcGFjaXR5LCB0cmFuc2l0aW9uIHx8IGl0ZW0ub3B0aW9ucy50cmFuc2Zlci50cmFuc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlU3BlYy5zaXplIHx8IHRhcmdldFNwZWMuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbW9kLnNldFNpemUodGFyZ2V0U3BlYy5zaXplIHx8IHNvdXJjZVNwZWMuc2l6ZSwgdHJhbnNpdGlvbiB8fCBpdGVtLm9wdGlvbnMudHJhbnNmZXIudHJhbnNpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LCB0cnVlKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICB9LmJpbmQodGhpcyksIGZhbHNlKTtcbiAgICB9XG59XG5mdW5jdGlvbiBfZW5kVHJhbnNmZXJhYmxlQW5pbWF0aW9ucyhpdGVtKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBpdGVtLnRyYW5zZmVyYWJsZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIHRyYW5zZmVyYWJsZSA9IGl0ZW0udHJhbnNmZXJhYmxlc1tqXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9yZW5kZXJhYmxlcy50cmFuc2ZlcmFibGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVuZGVyYWJsZXMudHJhbnNmZXJhYmxlc1tpXSA9PT0gdHJhbnNmZXJhYmxlLnJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJhYmxlcy50cmFuc2ZlcmFibGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0cmFuc2ZlcmFibGUuc291cmNlLnNob3codHJhbnNmZXJhYmxlLm9yaWdpbmFsU291cmNlKTtcbiAgICAgICAgdHJhbnNmZXJhYmxlLnRhcmdldC5zaG93KHRyYW5zZmVyYWJsZS5vcmlnaW5hbFRhcmdldCk7XG4gICAgfVxuICAgIGl0ZW0udHJhbnNmZXJhYmxlcyA9IFtdO1xuICAgIHRoaXMubGF5b3V0LnJlZmxvd0xheW91dCgpO1xufVxuZnVuY3Rpb24gX3N0YXJ0QW5pbWF0aW9ucyhldmVudCkge1xuICAgIHZhciBwcmV2SXRlbTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3ZpZXdTdGFjay5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaXRlbSA9IHRoaXMuX3ZpZXdTdGFja1tpXTtcbiAgICAgICAgc3dpdGNoIChpdGVtLnN0YXRlKSB7XG4gICAgICAgIGNhc2UgSXRlbVN0YXRlLkhJREU6XG4gICAgICAgICAgICBpdGVtLnN0YXRlID0gSXRlbVN0YXRlLkhJRElORztcbiAgICAgICAgICAgIF9zdGFydEFuaW1hdGlvbi5jYWxsKHRoaXMsIGl0ZW0sIHByZXZJdGVtLCBldmVudC5zaXplLCBmYWxzZSk7XG4gICAgICAgICAgICBfdXBkYXRlU3RhdGUuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEl0ZW1TdGF0ZS5TSE9XOlxuICAgICAgICAgICAgaXRlbS5zdGF0ZSA9IEl0ZW1TdGF0ZS5TSE9XSU5HO1xuICAgICAgICAgICAgX3N0YXJ0QW5pbWF0aW9uLmNhbGwodGhpcywgaXRlbSwgcHJldkl0ZW0sIGV2ZW50LnNpemUsIHRydWUpO1xuICAgICAgICAgICAgX3VwZGF0ZVN0YXRlLmNhbGwodGhpcyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBwcmV2SXRlbSA9IGl0ZW07XG4gICAgfVxufVxuZnVuY3Rpb24gX3N0YXJ0QW5pbWF0aW9uKGl0ZW0sIHByZXZJdGVtLCBzaXplLCBzaG93KSB7XG4gICAgdmFyIGFuaW1hdGlvbiA9IHNob3cgPyBpdGVtLm9wdGlvbnMuc2hvdy5hbmltYXRpb24gOiBpdGVtLm9wdGlvbnMuaGlkZS5hbmltYXRpb247XG4gICAgdmFyIHNwZWMgPSBhbmltYXRpb24gPyBhbmltYXRpb24oc2hvdywgc2l6ZSkgOiB7fTtcbiAgICBpdGVtLm1vZC5oYWx0KCk7XG4gICAgdmFyIGNhbGxiYWNrO1xuICAgIGlmIChzaG93KSB7XG4gICAgICAgIGNhbGxiYWNrID0gaXRlbS5zaG93Q2FsbGJhY2s7XG4gICAgICAgIGlmIChzcGVjLnRyYW5zZm9ybSkge1xuICAgICAgICAgICAgaXRlbS5tb2Quc2V0VHJhbnNmb3JtKHNwZWMudHJhbnNmb3JtKTtcbiAgICAgICAgICAgIGl0ZW0ubW9kLnNldFRyYW5zZm9ybShUcmFuc2Zvcm0uaWRlbnRpdHksIGl0ZW0ub3B0aW9ucy5zaG93LnRyYW5zaXRpb24sIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzcGVjLm9wYWNpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaXRlbS5tb2Quc2V0T3BhY2l0eShzcGVjLm9wYWNpdHkpO1xuICAgICAgICAgICAgaXRlbS5tb2Quc2V0T3BhY2l0eSgxLCBpdGVtLm9wdGlvbnMuc2hvdy50cmFuc2l0aW9uLCBjYWxsYmFjayk7XG4gICAgICAgICAgICBjYWxsYmFjayA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BlYy5hbGlnbikge1xuICAgICAgICAgICAgaXRlbS5tb2Quc2V0QWxpZ24oc3BlYy5hbGlnbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNwZWMub3JpZ2luKSB7XG4gICAgICAgICAgICBpdGVtLm1vZC5zZXRPcmlnaW4oc3BlYy5vcmlnaW4pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcmV2SXRlbSkge1xuICAgICAgICAgICAgX3N0YXJ0VHJhbnNmZXJhYmxlQW5pbWF0aW9ucy5jYWxsKHRoaXMsIGl0ZW0sIHByZXZJdGVtKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsYmFjayA9IGl0ZW0uaGlkZUNhbGxiYWNrO1xuICAgICAgICBpZiAoc3BlYy50cmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIGl0ZW0ubW9kLnNldFRyYW5zZm9ybShzcGVjLnRyYW5zZm9ybSwgaXRlbS5vcHRpb25zLmhpZGUudHJhbnNpdGlvbiwgY2FsbGJhY2spO1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNwZWMub3BhY2l0eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpdGVtLm1vZC5zZXRPcGFjaXR5KHNwZWMub3BhY2l0eSwgaXRlbS5vcHRpb25zLmhpZGUudHJhbnNpdGlvbiwgY2FsbGJhY2spO1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gX2NyZWF0ZUl0ZW0odmlldywgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgIHZpZXc6IHZpZXcsXG4gICAgICAgICAgICBtb2Q6IG5ldyBTdGF0ZU1vZGlmaWVyKCksXG4gICAgICAgICAgICBzdGF0ZTogSXRlbVN0YXRlLlFVRVVFRCxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICBzaG93OiB7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IHRoaXMub3B0aW9ucy5zaG93LnRyYW5zaXRpb24gfHwgdGhpcy5vcHRpb25zLnRyYW5zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogdGhpcy5vcHRpb25zLnNob3cuYW5pbWF0aW9uIHx8IHRoaXMub3B0aW9ucy5hbmltYXRpb25cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGhpZGU6IHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogdGhpcy5vcHRpb25zLmhpZGUudHJhbnNpdGlvbiB8fCB0aGlzLm9wdGlvbnMudHJhbnNpdGlvbixcbiAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uOiB0aGlzLm9wdGlvbnMuaGlkZS5hbmltYXRpb24gfHwgdGhpcy5vcHRpb25zLmFuaW1hdGlvblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdHJhbnNmZXI6IHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogdGhpcy5vcHRpb25zLnRyYW5zZmVyLnRyYW5zaXRpb24gfHwgdGhpcy5vcHRpb25zLnRyYW5zaXRpb24sXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiB0aGlzLm9wdGlvbnMudHJhbnNmZXIuaXRlbXMgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHpJbmRleDogdGhpcy5vcHRpb25zLnRyYW5zZmVyLnpJbmRleFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICB0cmFuc2ZlcmFibGVzOiBbXVxuICAgICAgICB9O1xuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIGl0ZW0ub3B0aW9ucy5zaG93LnRyYW5zaXRpb24gPSAob3B0aW9ucy5zaG93ID8gb3B0aW9ucy5zaG93LnRyYW5zaXRpb24gOiB1bmRlZmluZWQpIHx8IG9wdGlvbnMudHJhbnNpdGlvbiB8fCBpdGVtLm9wdGlvbnMuc2hvdy50cmFuc2l0aW9uO1xuICAgICAgICBpdGVtLm9wdGlvbnMuc2hvdy5hbmltYXRpb24gPSAob3B0aW9ucy5zaG93ID8gb3B0aW9ucy5zaG93LmFuaW1hdGlvbiA6IHVuZGVmaW5lZCkgfHwgb3B0aW9ucy5hbmltYXRpb24gfHwgaXRlbS5vcHRpb25zLnNob3cuYW5pbWF0aW9uO1xuICAgICAgICBpdGVtLm9wdGlvbnMudHJhbnNmZXIudHJhbnNpdGlvbiA9IChvcHRpb25zLnRyYW5zZmVyID8gb3B0aW9ucy50cmFuc2Zlci50cmFuc2l0aW9uIDogdW5kZWZpbmVkKSB8fCBvcHRpb25zLnRyYW5zaXRpb24gfHwgaXRlbS5vcHRpb25zLnRyYW5zZmVyLnRyYW5zaXRpb247XG4gICAgICAgIGl0ZW0ub3B0aW9ucy50cmFuc2Zlci5pdGVtcyA9IChvcHRpb25zLnRyYW5zZmVyID8gb3B0aW9ucy50cmFuc2Zlci5pdGVtcyA6IHVuZGVmaW5lZCkgfHwgaXRlbS5vcHRpb25zLnRyYW5zZmVyLml0ZW1zO1xuICAgICAgICBpdGVtLm9wdGlvbnMudHJhbnNmZXIuekluZGV4ID0gb3B0aW9ucy50cmFuc2ZlciAmJiBvcHRpb25zLnRyYW5zZmVyLnpJbmRleCAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy50cmFuc2Zlci56SW5kZXggOiBpdGVtLm9wdGlvbnMudHJhbnNmZXIuekluZGV4O1xuICAgIH1cbiAgICBpdGVtLm5vZGUgPSBuZXcgUmVuZGVyTm9kZShpdGVtLm1vZCk7XG4gICAgaXRlbS5ub2RlLmFkZCh2aWV3KTtcbiAgICByZXR1cm4gaXRlbTtcbn1cbmZ1bmN0aW9uIF91cGRhdGVTdGF0ZSgpIHtcbiAgICB2YXIgcHJldkl0ZW07XG4gICAgdmFyIGludmFsaWRhdGVkID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBNYXRoLm1pbih0aGlzLl92aWV3U3RhY2subGVuZ3RoLCAyKTsgaSsrKSB7XG4gICAgICAgIHZhciBpdGVtID0gdGhpcy5fdmlld1N0YWNrW2ldO1xuICAgICAgICBpZiAoaXRlbS5zdGF0ZSA9PT0gSXRlbVN0YXRlLlFVRVVFRCkge1xuICAgICAgICAgICAgaWYgKCFwcmV2SXRlbSB8fCBwcmV2SXRlbS5zdGF0ZSA9PT0gSXRlbVN0YXRlLlZJU0lCTEUgfHwgcHJldkl0ZW0uc3RhdGUgPT09IEl0ZW1TdGF0ZS5ISURJTkcpIHtcbiAgICAgICAgICAgICAgICBpZiAocHJldkl0ZW0gJiYgcHJldkl0ZW0uc3RhdGUgPT09IEl0ZW1TdGF0ZS5WSVNJQkxFKSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZJdGVtLnN0YXRlID0gSXRlbVN0YXRlLkhJREU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW0uc3RhdGUgPSBJdGVtU3RhdGUuU0hPVztcbiAgICAgICAgICAgICAgICBpbnZhbGlkYXRlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLnN0YXRlID09PSBJdGVtU3RhdGUuVklTSUJMRSAmJiBpdGVtLmhpZGUpIHtcbiAgICAgICAgICAgIGl0ZW0uc3RhdGUgPSBJdGVtU3RhdGUuSElERTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXRlbS5zdGF0ZSA9PT0gSXRlbVN0YXRlLlNIT1cgfHwgaXRlbS5zdGF0ZSA9PT0gSXRlbVN0YXRlLkhJREUpIHtcbiAgICAgICAgICAgIHRoaXMubGF5b3V0LnJlZmxvd0xheW91dCgpO1xuICAgICAgICB9XG4gICAgICAgIHByZXZJdGVtID0gaXRlbTtcbiAgICB9XG4gICAgaWYgKGludmFsaWRhdGVkKSB7XG4gICAgICAgIF91cGRhdGVTdGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLmxheW91dC5yZWZsb3dMYXlvdXQoKTtcbiAgICB9XG59XG5BbmltYXRpb25Db250cm9sbGVyLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKHJlbmRlcmFibGUsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFyZW5kZXJhYmxlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhpZGUob3B0aW9ucywgY2FsbGJhY2spO1xuICAgIH1cbiAgICB2YXIgaXRlbSA9IHRoaXMuX3ZpZXdTdGFjay5sZW5ndGggPyB0aGlzLl92aWV3U3RhY2tbdGhpcy5fdmlld1N0YWNrLmxlbmd0aCAtIDFdIDogdW5kZWZpbmVkO1xuICAgIGlmIChpdGVtICYmIGl0ZW0udmlldyA9PT0gcmVuZGVyYWJsZSkge1xuICAgICAgICBpdGVtLmhpZGUgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmIChpdGVtICYmIGl0ZW0uc3RhdGUgIT09IEl0ZW1TdGF0ZS5ISURJTkcgJiYgb3B0aW9ucykge1xuICAgICAgICBpdGVtLm9wdGlvbnMuaGlkZS50cmFuc2l0aW9uID0gKG9wdGlvbnMuaGlkZSA/IG9wdGlvbnMuaGlkZS50cmFuc2l0aW9uIDogdW5kZWZpbmVkKSB8fCBvcHRpb25zLnRyYW5zaXRpb24gfHwgaXRlbS5vcHRpb25zLmhpZGUudHJhbnNpdGlvbjtcbiAgICAgICAgaXRlbS5vcHRpb25zLmhpZGUuYW5pbWF0aW9uID0gKG9wdGlvbnMuaGlkZSA/IG9wdGlvbnMuaGlkZS5hbmltYXRpb24gOiB1bmRlZmluZWQpIHx8IG9wdGlvbnMuYW5pbWF0aW9uIHx8IGl0ZW0ub3B0aW9ucy5oaWRlLmFuaW1hdGlvbjtcbiAgICB9XG4gICAgaXRlbSA9IF9jcmVhdGVJdGVtLmNhbGwodGhpcywgcmVuZGVyYWJsZSwgb3B0aW9ucywgY2FsbGJhY2spO1xuICAgIGl0ZW0uc2hvd0NhbGxiYWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpdGVtLnN0YXRlID0gSXRlbVN0YXRlLlZJU0lCTEU7XG4gICAgICAgIF91cGRhdGVTdGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICBfZW5kVHJhbnNmZXJhYmxlQW5pbWF0aW9ucy5jYWxsKHRoaXMsIGl0ZW0pO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcyk7XG4gICAgaXRlbS5oaWRlQ2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuX3ZpZXdTdGFjay5pbmRleE9mKGl0ZW0pO1xuICAgICAgICB0aGlzLl9yZW5kZXJhYmxlcy52aWV3cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB0aGlzLl92aWV3U3RhY2suc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgaXRlbS52aWV3ID0gdW5kZWZpbmVkO1xuICAgICAgICBfdXBkYXRlU3RhdGUuY2FsbCh0aGlzKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdGhpcy5fcmVuZGVyYWJsZXMudmlld3MucHVzaChpdGVtLm5vZGUpO1xuICAgIHRoaXMuX3ZpZXdTdGFjay5wdXNoKGl0ZW0pO1xuICAgIF91cGRhdGVTdGF0ZS5jYWxsKHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkFuaW1hdGlvbkNvbnRyb2xsZXIucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiAob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICB2YXIgaXRlbSA9IHRoaXMuX3ZpZXdTdGFjay5sZW5ndGggPyB0aGlzLl92aWV3U3RhY2tbdGhpcy5fdmlld1N0YWNrLmxlbmd0aCAtIDFdIDogdW5kZWZpbmVkO1xuICAgIGlmICghaXRlbSB8fCBpdGVtLnN0YXRlID09PSBJdGVtU3RhdGUuSElESU5HKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpdGVtLmhpZGUgPSB0cnVlO1xuICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgIGl0ZW0ub3B0aW9ucy5oaWRlLnRyYW5zaXRpb24gPSAob3B0aW9ucy5oaWRlID8gb3B0aW9ucy5oaWRlLnRyYW5zaXRpb24gOiB1bmRlZmluZWQpIHx8IG9wdGlvbnMudHJhbnNpdGlvbiB8fCBpdGVtLm9wdGlvbnMuaGlkZS50cmFuc2l0aW9uO1xuICAgICAgICBpdGVtLm9wdGlvbnMuaGlkZS5hbmltYXRpb24gPSAob3B0aW9ucy5oaWRlID8gb3B0aW9ucy5oaWRlLmFuaW1hdGlvbiA6IHVuZGVmaW5lZCkgfHwgb3B0aW9ucy5hbmltYXRpb24gfHwgaXRlbS5vcHRpb25zLmhpZGUuYW5pbWF0aW9uO1xuICAgIH1cbiAgICBpdGVtLmhpZGVDYWxsYmFjayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fdmlld1N0YWNrLmluZGV4T2YoaXRlbSk7XG4gICAgICAgIHRoaXMuX3JlbmRlcmFibGVzLnZpZXdzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIHRoaXMuX3ZpZXdTdGFjay5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICBpdGVtLnZpZXcgPSB1bmRlZmluZWQ7XG4gICAgICAgIF91cGRhdGVTdGF0ZS5jYWxsKHRoaXMpO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9LmJpbmQodGhpcyk7XG4gICAgX3VwZGF0ZVN0YXRlLmNhbGwodGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuQW5pbWF0aW9uQ29udHJvbGxlci5wcm90b3R5cGUuaGFsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3ZpZXdTdGFjay5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgaXRlbSA9IHRoaXMuX3ZpZXdTdGFja1t0aGlzLl92aWV3U3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChpdGVtLnN0YXRlID09PSBJdGVtU3RhdGUuUVVFVUVEIHx8IGl0ZW0uc3RhdGUgPT09IEl0ZW1TdGF0ZS5TSE9XKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJhYmxlcy52aWV3cy5zcGxpY2UodGhpcy5fdmlld1N0YWNrLmxlbmd0aCAtIDEsIDEpO1xuICAgICAgICAgICAgdGhpcy5fdmlld1N0YWNrLnNwbGljZSh0aGlzLl92aWV3U3RhY2subGVuZ3RoIC0gMSwgMSk7XG4gICAgICAgICAgICBpdGVtLnZpZXcgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5BbmltYXRpb25Db250cm9sbGVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl92aWV3U3RhY2subGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGl0ZW0gPSB0aGlzLl92aWV3U3RhY2tbaV07XG4gICAgICAgIGlmIChpdGVtLnN0YXRlID09PSBJdGVtU3RhdGUuVklTSUJMRSB8fCBpdGVtLnN0YXRlID09PSBJdGVtU3RhdGUuU0hPVyB8fCBpdGVtLnN0YXRlID09PSBJdGVtU3RhdGUuU0hPV0lORykge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0udmlldztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufTtcbm1vZHVsZS5leHBvcnRzID0gQW5pbWF0aW9uQ29udHJvbGxlcjsiLCJ2YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4vTGF5b3V0VXRpbGl0eScpO1xudmFyIFNjcm9sbENvbnRyb2xsZXIgPSByZXF1aXJlKCcuL1Njcm9sbENvbnRyb2xsZXInKTtcbnZhciBMaXN0TGF5b3V0ID0gcmVxdWlyZSgnLi9sYXlvdXRzL0xpc3RMYXlvdXQnKTtcbnZhciBQdWxsVG9SZWZyZXNoU3RhdGUgPSB7XG4gICAgICAgIEhJRERFTjogMCxcbiAgICAgICAgUFVMTElORzogMSxcbiAgICAgICAgQUNUSVZFOiAyLFxuICAgICAgICBDT01QTEVURUQ6IDMsXG4gICAgICAgIEhJRERJTkc6IDRcbiAgICB9O1xuZnVuY3Rpb24gRmxleFNjcm9sbFZpZXcob3B0aW9ucykge1xuICAgIFNjcm9sbENvbnRyb2xsZXIuY2FsbCh0aGlzLCBMYXlvdXRVdGlsaXR5LmNvbWJpbmVPcHRpb25zKEZsZXhTY3JvbGxWaWV3LkRFRkFVTFRfT1BUSU9OUywgb3B0aW9ucykpO1xuICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgPSAwO1xuICAgIHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEgPSAwO1xuICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhID0gMDtcbn1cbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUpO1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmxleFNjcm9sbFZpZXc7XG5GbGV4U2Nyb2xsVmlldy5QdWxsVG9SZWZyZXNoU3RhdGUgPSBQdWxsVG9SZWZyZXNoU3RhdGU7XG5GbGV4U2Nyb2xsVmlldy5Cb3VuZHMgPSBTY3JvbGxDb250cm9sbGVyLkJvdW5kcztcbkZsZXhTY3JvbGxWaWV3LlBhZ2luYXRpb25Nb2RlID0gU2Nyb2xsQ29udHJvbGxlci5QYWdpbmF0aW9uTW9kZTtcbkZsZXhTY3JvbGxWaWV3LkRFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBsYXlvdXQ6IExpc3RMYXlvdXQsXG4gICAgZGlyZWN0aW9uOiB1bmRlZmluZWQsXG4gICAgcGFnaW5hdGVkOiBmYWxzZSxcbiAgICBhbGlnbm1lbnQ6IDAsXG4gICAgZmxvdzogZmFsc2UsXG4gICAgbW91c2VNb3ZlOiBmYWxzZSxcbiAgICB1c2VDb250YWluZXI6IGZhbHNlLFxuICAgIHZpc2libGVJdGVtVGhyZXNzaG9sZDogMC41LFxuICAgIHB1bGxUb1JlZnJlc2hIZWFkZXI6IHVuZGVmaW5lZCxcbiAgICBwdWxsVG9SZWZyZXNoRm9vdGVyOiB1bmRlZmluZWQsXG4gICAgbGVhZGluZ1Njcm9sbFZpZXc6IHVuZGVmaW5lZCxcbiAgICB0cmFpbGluZ1Njcm9sbFZpZXc6IHVuZGVmaW5lZFxufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5zZXRPcHRpb25zLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMucHVsbFRvUmVmcmVzaEhlYWRlciB8fCBvcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXIgfHwgdGhpcy5fcHVsbFRvUmVmcmVzaCkge1xuICAgICAgICBpZiAob3B0aW9ucy5wdWxsVG9SZWZyZXNoSGVhZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl9wdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaCB8fCBbXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIHVuZGVmaW5lZFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGlmICghdGhpcy5fcHVsbFRvUmVmcmVzaFswXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2hbMF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOLFxuICAgICAgICAgICAgICAgICAgICBwcmV2U3RhdGU6IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4sXG4gICAgICAgICAgICAgICAgICAgIGZvb3RlcjogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFswXS5ub2RlID0gb3B0aW9ucy5wdWxsVG9SZWZyZXNoSGVhZGVyO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm9wdGlvbnMucHVsbFRvUmVmcmVzaEhlYWRlciAmJiB0aGlzLl9wdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgICAgICB0aGlzLl9wdWxsVG9SZWZyZXNoWzBdID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2ggPSB0aGlzLl9wdWxsVG9SZWZyZXNoIHx8IFtcbiAgICAgICAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgaWYgKCF0aGlzLl9wdWxsVG9SZWZyZXNoWzFdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4sXG4gICAgICAgICAgICAgICAgICAgIHByZXZTdGF0ZTogUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTixcbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyOiB0cnVlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3B1bGxUb1JlZnJlc2hbMV0ubm9kZSA9IG9wdGlvbnMucHVsbFRvUmVmcmVzaEZvb3RlcjtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5vcHRpb25zLnB1bGxUb1JlZnJlc2hGb290ZXIgJiYgdGhpcy5fcHVsbFRvUmVmcmVzaCkge1xuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcHVsbFRvUmVmcmVzaCAmJiAhdGhpcy5fcHVsbFRvUmVmcmVzaFswXSAmJiAhdGhpcy5fcHVsbFRvUmVmcmVzaFsxXSkge1xuICAgICAgICAgICAgdGhpcy5fcHVsbFRvUmVmcmVzaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuc2VxdWVuY2VGcm9tID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICByZXR1cm4gdGhpcy5zZXREYXRhU291cmNlKG5vZGUpO1xufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5nZXRDdXJyZW50SW5kZXggPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGl0ZW0gPSB0aGlzLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICByZXR1cm4gaXRlbSA/IGl0ZW0udmlld1NlcXVlbmNlLmdldEluZGV4KCkgOiAtMTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ29Ub1BhZ2UgPSBmdW5jdGlvbiAoaW5kZXgsIG5vQW5pbWF0aW9uKSB7XG4gICAgdmFyIHZpZXdTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZTtcbiAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgd2hpbGUgKHZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpIDwgaW5kZXgpIHtcbiAgICAgICAgdmlld1NlcXVlbmNlID0gdmlld1NlcXVlbmNlLmdldE5leHQoKTtcbiAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfVxuICAgIHdoaWxlICh2aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSA+IGluZGV4KSB7XG4gICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgICAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5nb1RvUmVuZGVyTm9kZSh2aWV3U2VxdWVuY2UuZ2V0KCksIG5vQW5pbWF0aW9uKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0T2Zmc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBGbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuZ2V0T2Zmc2V0O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLmdldEFic29sdXRlUG9zaXRpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIC0odGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgKyB0aGlzLl9zY3JvbGwuZ3JvdXBTdGFydCk7XG59O1xuZnVuY3Rpb24gX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBzdGF0ZSkge1xuICAgIGlmIChwdWxsVG9SZWZyZXNoLnN0YXRlICE9PSBzdGF0ZSkge1xuICAgICAgICBwdWxsVG9SZWZyZXNoLnN0YXRlID0gc3RhdGU7XG4gICAgICAgIGlmIChwdWxsVG9SZWZyZXNoLm5vZGUgJiYgcHVsbFRvUmVmcmVzaC5ub2RlLnNldFB1bGxUb1JlZnJlc2hTdGF0dXMpIHtcbiAgICAgICAgICAgIHB1bGxUb1JlZnJlc2gubm9kZS5zZXRQdWxsVG9SZWZyZXNoU3RhdHVzKHN0YXRlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIF9nZXRQdWxsVG9SZWZyZXNoKGZvb3Rlcikge1xuICAgIHJldHVybiB0aGlzLl9wdWxsVG9SZWZyZXNoID8gdGhpcy5fcHVsbFRvUmVmcmVzaFtmb290ZXIgPyAxIDogMF0gOiB1bmRlZmluZWQ7XG59XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuX3Bvc3RMYXlvdXQgPSBmdW5jdGlvbiAoc2l6ZSwgc2Nyb2xsT2Zmc2V0KSB7XG4gICAgaWYgKCF0aGlzLl9wdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHNpemVbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICB9XG4gICAgdmFyIHByZXZIZWlnaHQ7XG4gICAgdmFyIG5leHRIZWlnaHQ7XG4gICAgdmFyIHRvdGFsSGVpZ2h0O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgaSsrKSB7XG4gICAgICAgIHZhciBwdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaFtpXTtcbiAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2gpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBwdWxsVG9SZWZyZXNoLm5vZGUuZ2V0U2l6ZSgpW3RoaXMuX2RpcmVjdGlvbl07XG4gICAgICAgICAgICB2YXIgcHVsbExlbmd0aCA9IHB1bGxUb1JlZnJlc2gubm9kZS5nZXRQdWxsVG9SZWZyZXNoU2l6ZSA/IHB1bGxUb1JlZnJlc2gubm9kZS5nZXRQdWxsVG9SZWZyZXNoU2l6ZSgpW3RoaXMuX2RpcmVjdGlvbl0gOiBsZW5ndGg7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0O1xuICAgICAgICAgICAgaWYgKCFwdWxsVG9SZWZyZXNoLmZvb3Rlcikge1xuICAgICAgICAgICAgICAgIHByZXZIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KGZhbHNlKTtcbiAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gcHJldkhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IHByZXZIZWlnaHQgPj0gMCA/IHNjcm9sbE9mZnNldCAtIHByZXZIZWlnaHQgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIG5leHRIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0SGVpZ2h0ID0gbmV4dEhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBuZXh0SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB0b3RhbEhlaWdodCA9IHByZXZIZWlnaHQgPj0gMCAmJiBuZXh0SGVpZ2h0ID49IDAgPyBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodCA6IC0xO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxIZWlnaHQgPj0gMCAmJiB0b3RhbEhlaWdodCA8IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gTWF0aC5yb3VuZChzY3JvbGxPZmZzZXQgLSBzaXplW3RoaXMuX2RpcmVjdGlvbl0gKyBuZXh0SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV4dEhlaWdodCA9IG5leHRIZWlnaHQgPT09IHVuZGVmaW5lZCA/IG5leHRIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KHRydWUpIDogbmV4dEhlaWdodDtcbiAgICAgICAgICAgICAgICBuZXh0SGVpZ2h0ID0gbmV4dEhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBuZXh0SGVpZ2h0O1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IG5leHRIZWlnaHQgPj0gMCA/IHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgOiBzaXplW3RoaXMuX2RpcmVjdGlvbl0gKyAxO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gcHJldkhlaWdodCA9PT0gdW5kZWZpbmVkID8gdGhpcy5fY2FsY1Njcm9sbEhlaWdodChmYWxzZSkgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBwcmV2SGVpZ2h0ID0gcHJldkhlaWdodCA9PT0gdW5kZWZpbmVkID8gLTEgOiBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB0b3RhbEhlaWdodCA9IHByZXZIZWlnaHQgPj0gMCAmJiBuZXh0SGVpZ2h0ID49IDAgPyBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodCA6IC0xO1xuICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxIZWlnaHQgPj0gMCAmJiB0b3RhbEhlaWdodCA8IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gTWF0aC5yb3VuZChzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0ICsgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBvZmZzZXQgPSAtKG9mZnNldCAtIHNpemVbdGhpcy5fZGlyZWN0aW9uXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdmlzaWJsZVBlcmMgPSBNYXRoLm1heChNYXRoLm1pbihvZmZzZXQgLyBwdWxsTGVuZ3RoLCAxKSwgMCk7XG4gICAgICAgICAgICBzd2l0Y2ggKHB1bGxUb1JlZnJlc2guc3RhdGUpIHtcbiAgICAgICAgICAgIGNhc2UgUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTjpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZpc2libGVQZXJjID49IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkFDVElWRSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0ID49IDAuMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuUFVMTElORyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5QVUxMSU5HOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCAmJiB2aXNpYmxlUGVyYyA+PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkFDVElWRSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvZmZzZXQgPCAwLjIpIHtcbiAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuSElEREVOKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkU6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFB1bGxUb1JlZnJlc2hTdGF0ZS5DT01QTEVURUQ6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID49IDAuMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3NldFB1bGxUb1JlZnJlc2hTdGF0ZShwdWxsVG9SZWZyZXNoLCBQdWxsVG9SZWZyZXNoU3RhdGUuSElERElORyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQdWxsVG9SZWZyZXNoU3RhdGUuSElERElORzpcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0IDwgMC4yKSB7XG4gICAgICAgICAgICAgICAgICAgIF9zZXRQdWxsVG9SZWZyZXNoU3RhdGUocHVsbFRvUmVmcmVzaCwgUHVsbFRvUmVmcmVzaFN0YXRlLkhJRERFTik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2guc3RhdGUgIT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5ISURERU4pIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dE5vZGUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlOiBwdWxsVG9SZWZyZXNoLm5vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2OiAhcHVsbFRvUmVmcmVzaC5mb290ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBwdWxsVG9SZWZyZXNoLmZvb3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiAhcHVsbFRvUmVmcmVzaC5mb290ZXIgPyAtLXRoaXMuX25vZGVzLl9jb250ZXh0U3RhdGUucHJldkdldEluZGV4IDogKyt0aGlzLl9ub2Rlcy5fY29udGV4dFN0YXRlLm5leHRHZXRJbmRleFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBzY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoID0gbGVuZ3RoO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoID0gTWF0aC5taW4ob2Zmc2V0LCBsZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc2V0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemVbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZVsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtMC4wMDFcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGg6IHNjcm9sbExlbmd0aFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNldC5zaXplW3RoaXMuX2RpcmVjdGlvbl0gPSBNYXRoLm1heChNYXRoLm1pbihvZmZzZXQsIHB1bGxMZW5ndGgpLCAwKTtcbiAgICAgICAgICAgICAgICBzZXQudHJhbnNsYXRlW3RoaXMuX2RpcmVjdGlvbl0gPSBwdWxsVG9SZWZyZXNoLmZvb3RlciA/IHNpemVbdGhpcy5fZGlyZWN0aW9uXSAtIGxlbmd0aCA6IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZXMuX2NvbnRleHQuc2V0KGNvbnRleHROb2RlLCBzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcbkZsZXhTY3JvbGxWaWV3LnByb3RvdHlwZS5zaG93UHVsbFRvUmVmcmVzaCA9IGZ1bmN0aW9uIChmb290ZXIpIHtcbiAgICB2YXIgcHVsbFRvUmVmcmVzaCA9IF9nZXRQdWxsVG9SZWZyZXNoLmNhbGwodGhpcywgZm9vdGVyKTtcbiAgICBpZiAocHVsbFRvUmVmcmVzaCkge1xuICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xuICAgIH1cbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuaGlkZVB1bGxUb1JlZnJlc2ggPSBmdW5jdGlvbiAoZm9vdGVyKSB7XG4gICAgdmFyIHB1bGxUb1JlZnJlc2ggPSBfZ2V0UHVsbFRvUmVmcmVzaC5jYWxsKHRoaXMsIGZvb3Rlcik7XG4gICAgaWYgKHB1bGxUb1JlZnJlc2ggJiYgcHVsbFRvUmVmcmVzaC5zdGF0ZSA9PT0gUHVsbFRvUmVmcmVzaFN0YXRlLkFDVElWRSkge1xuICAgICAgICBfc2V0UHVsbFRvUmVmcmVzaFN0YXRlKHB1bGxUb1JlZnJlc2gsIFB1bGxUb1JlZnJlc2hTdGF0ZS5DT01QTEVURUQpO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuaXNQdWxsVG9SZWZyZXNoVmlzaWJsZSA9IGZ1bmN0aW9uIChmb290ZXIpIHtcbiAgICB2YXIgcHVsbFRvUmVmcmVzaCA9IF9nZXRQdWxsVG9SZWZyZXNoLmNhbGwodGhpcywgZm9vdGVyKTtcbiAgICByZXR1cm4gcHVsbFRvUmVmcmVzaCA/IHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUgOiBmYWxzZTtcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuYXBwbHlTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgIHZhciBsZWFkaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy5sZWFkaW5nU2Nyb2xsVmlldztcbiAgICB2YXIgdHJhaWxpbmdTY3JvbGxWaWV3ID0gdGhpcy5vcHRpb25zLnRyYWlsaW5nU2Nyb2xsVmlldztcbiAgICBpZiAoIWxlYWRpbmdTY3JvbGxWaWV3ICYmICF0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgcmV0dXJuIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmFwcGx5U2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCBkZWx0YSk7XG4gICAgfVxuICAgIHZhciBwYXJ0aWFsRGVsdGE7XG4gICAgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IGxlYWRpbmdTY3JvbGxWaWV3LmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGxlYWRpbmdTY3JvbGxWaWV3LmFwcGx5U2Nyb2xsRm9yY2UocGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0aGlzLmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgcGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LmFwcGx5U2Nyb2xsRm9yY2UoZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRyYWlsaW5nU2Nyb2xsVmlldy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LmFwcGx5U2Nyb2xsRm9yY2UocGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRoaXMuY2FuU2Nyb2xsKGRlbHRhKTtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmFwcGx5U2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCBwYXJ0aWFsRGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy5hcHBseVNjcm9sbEZvcmNlKGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5hcHBseVNjcm9sbEZvcmNlLmNhbGwodGhpcywgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUudXBkYXRlU2Nyb2xsRm9yY2UgPSBmdW5jdGlvbiAocHJldkRlbHRhLCBuZXdEZWx0YSkge1xuICAgIHZhciBsZWFkaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy5sZWFkaW5nU2Nyb2xsVmlldztcbiAgICB2YXIgdHJhaWxpbmdTY3JvbGxWaWV3ID0gdGhpcy5vcHRpb25zLnRyYWlsaW5nU2Nyb2xsVmlldztcbiAgICBpZiAoIWxlYWRpbmdTY3JvbGxWaWV3ICYmICF0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgcmV0dXJuIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgcHJldkRlbHRhLCBuZXdEZWx0YSk7XG4gICAgfVxuICAgIHZhciBwYXJ0aWFsRGVsdGE7XG4gICAgdmFyIGRlbHRhID0gbmV3RGVsdGEgLSBwcmV2RGVsdGE7XG4gICAgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICBpZiAobGVhZGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IGxlYWRpbmdTY3JvbGxWaWV3LmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy51cGRhdGVTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICsgcGFydGlhbERlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEgKz0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcgJiYgZGVsdGEpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRoaXMuY2FuU2Nyb2xsKGRlbHRhKTtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArIHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhICs9IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhICs9IGRlbHRhO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArIGRlbHRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChkZWx0YSkge1xuICAgICAgICAgICAgU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUudXBkYXRlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhICsgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0cmFpbGluZ1Njcm9sbFZpZXcpIHtcbiAgICAgICAgICAgIHBhcnRpYWxEZWx0YSA9IHRyYWlsaW5nU2Nyb2xsVmlldy5jYW5TY3JvbGwoZGVsdGEpO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3RyYWlsaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArIHBhcnRpYWxEZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxlYWRpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSB0aGlzLmNhblNjcm9sbChkZWx0YSk7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKyBwYXJ0aWFsRGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBsZWFkaW5nU2Nyb2xsVmlldy51cGRhdGVTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhICsgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fbGVhZGluZ1Njcm9sbFZpZXdEZWx0YSArPSBkZWx0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZVNjcm9sbEZvcmNlLmNhbGwodGhpcywgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSArIGRlbHRhKTtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgKz0gZGVsdGE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuRmxleFNjcm9sbFZpZXcucHJvdG90eXBlLnJlbGVhc2VTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChkZWx0YSwgdmVsb2NpdHkpIHtcbiAgICB2YXIgbGVhZGluZ1Njcm9sbFZpZXcgPSB0aGlzLm9wdGlvbnMubGVhZGluZ1Njcm9sbFZpZXc7XG4gICAgdmFyIHRyYWlsaW5nU2Nyb2xsVmlldyA9IHRoaXMub3B0aW9ucy50cmFpbGluZ1Njcm9sbFZpZXc7XG4gICAgaWYgKCFsZWFkaW5nU2Nyb2xsVmlldyAmJiAhdHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgIHJldHVybiBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCBkZWx0YSwgdmVsb2NpdHkpO1xuICAgIH1cbiAgICB2YXIgcGFydGlhbERlbHRhO1xuICAgIGlmIChkZWx0YSA8IDApIHtcbiAgICAgICAgaWYgKGxlYWRpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSBNYXRoLm1heCh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGRlbHRhIC09IHBhcnRpYWxEZWx0YTtcbiAgICAgICAgICAgIGxlYWRpbmdTY3JvbGxWaWV3LnJlbGVhc2VTY3JvbGxGb3JjZSh0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IDAgOiB2ZWxvY2l0eSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRyYWlsaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gTWF0aC5tYXgodGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IDAgOiB2ZWxvY2l0eSk7XG4gICAgICAgICAgICB0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSAtPSBkZWx0YTtcbiAgICAgICAgICAgIHRyYWlsaW5nU2Nyb2xsVmlldy5yZWxlYXNlU2Nyb2xsRm9yY2UodGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gdmVsb2NpdHkgOiAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgLT0gZGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IHZlbG9jaXR5IDogMCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHJhaWxpbmdTY3JvbGxWaWV3KSB7XG4gICAgICAgICAgICBwYXJ0aWFsRGVsdGEgPSBNYXRoLm1pbih0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdHJhaWxpbmdTY3JvbGxWaWV3RGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgZGVsdGEgLT0gcGFydGlhbERlbHRhO1xuICAgICAgICAgICAgdHJhaWxpbmdTY3JvbGxWaWV3LnJlbGVhc2VTY3JvbGxGb3JjZSh0aGlzLl90cmFpbGluZ1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEgPyAwIDogdmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsZWFkaW5nU2Nyb2xsVmlldykge1xuICAgICAgICAgICAgcGFydGlhbERlbHRhID0gTWF0aC5taW4odGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSwgZGVsdGEpO1xuICAgICAgICAgICAgdGhpcy5fdGhpc1Njcm9sbFZpZXdEZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBkZWx0YSAtPSBwYXJ0aWFsRGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UuY2FsbCh0aGlzLCB0aGlzLl90aGlzU2Nyb2xsVmlld0RlbHRhLCBkZWx0YSA/IDAgOiB2ZWxvY2l0eSk7XG4gICAgICAgICAgICB0aGlzLl9sZWFkaW5nU2Nyb2xsVmlld0RlbHRhIC09IGRlbHRhO1xuICAgICAgICAgICAgbGVhZGluZ1Njcm9sbFZpZXcucmVsZWFzZVNjcm9sbEZvcmNlKHRoaXMuX2xlYWRpbmdTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gdmVsb2NpdHkgOiAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEgLT0gZGVsdGE7XG4gICAgICAgICAgICBTY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZS5jYWxsKHRoaXMsIHRoaXMuX3RoaXNTY3JvbGxWaWV3RGVsdGEsIGRlbHRhID8gdmVsb2NpdHkgOiAwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5GbGV4U2Nyb2xsVmlldy5wcm90b3R5cGUuY29tbWl0ID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICB2YXIgcmVzdWx0ID0gU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuY29tbWl0LmNhbGwodGhpcywgY29udGV4dCk7XG4gICAgaWYgKHRoaXMuX3B1bGxUb1JlZnJlc2gpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwdWxsVG9SZWZyZXNoID0gdGhpcy5fcHVsbFRvUmVmcmVzaFtpXTtcbiAgICAgICAgICAgIGlmIChwdWxsVG9SZWZyZXNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHB1bGxUb1JlZnJlc2guc3RhdGUgPT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUgJiYgcHVsbFRvUmVmcmVzaC5wcmV2U3RhdGUgIT09IFB1bGxUb1JlZnJlc2hTdGF0ZS5BQ1RJVkUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgncmVmcmVzaCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvb3RlcjogcHVsbFRvUmVmcmVzaC5mb290ZXJcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHB1bGxUb1JlZnJlc2gucHJldlN0YXRlID0gcHVsbFRvUmVmcmVzaC5zdGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbm1vZHVsZS5leHBvcnRzID0gRmxleFNjcm9sbFZpZXc7IiwidmFyIE9wdGlvbnNNYW5hZ2VyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuT3B0aW9uc01hbmFnZXIgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5PcHRpb25zTWFuYWdlciA6IG51bGw7XG52YXIgVHJhbnNmb3JtID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogbnVsbDtcbnZhciBWZWN0b3IgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMubWF0aC5WZWN0b3IgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMubWF0aC5WZWN0b3IgOiBudWxsO1xudmFyIFBhcnRpY2xlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogbnVsbDtcbnZhciBTcHJpbmcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMucGh5c2ljcy5mb3JjZXMuU3ByaW5nIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLlNwcmluZyA6IG51bGw7XG52YXIgUGh5c2ljc0VuZ2luZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5waHlzaWNzLlBoeXNpY3NFbmdpbmUgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMucGh5c2ljcy5QaHlzaWNzRW5naW5lIDogbnVsbDtcbnZhciBMYXlvdXROb2RlID0gcmVxdWlyZSgnLi9MYXlvdXROb2RlJyk7XG52YXIgVHJhbnNpdGlvbmFibGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudHJhbnNpdGlvbnMuVHJhbnNpdGlvbmFibGUgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudHJhbnNpdGlvbnMuVHJhbnNpdGlvbmFibGUgOiBudWxsO1xuZnVuY3Rpb24gRmxvd0xheW91dE5vZGUocmVuZGVyTm9kZSwgc3BlYykge1xuICAgIExheW91dE5vZGUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICBpZiAoIXRoaXMub3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuY3JlYXRlKHRoaXMuY29uc3RydWN0b3IuREVGQVVMVF9PUFRJT05TKTtcbiAgICAgICAgdGhpcy5fb3B0aW9uc01hbmFnZXIgPSBuZXcgT3B0aW9uc01hbmFnZXIodGhpcy5vcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9wZSkge1xuICAgICAgICB0aGlzLl9wZSA9IG5ldyBQaHlzaWNzRW5naW5lKCk7XG4gICAgICAgIHRoaXMuX3BlLnNsZWVwKCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5fcHJvcGVydGllcykge1xuICAgICAgICB0aGlzLl9wcm9wZXJ0aWVzID0ge307XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gdGhpcy5fcHJvcGVydGllcykge1xuICAgICAgICAgICAgdGhpcy5fcHJvcGVydGllc1twcm9wTmFtZV0uaW5pdCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlKSB7XG4gICAgICAgIHRoaXMuX2xvY2tUcmFuc2l0aW9uYWJsZSA9IG5ldyBUcmFuc2l0aW9uYWJsZSgxKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUuaGFsdCgpO1xuICAgICAgICB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUucmVzZXQoMSk7XG4gICAgfVxuICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9IHRydWU7XG4gICAgdGhpcy5faW5pdGlhbCA9IHRydWU7XG4gICAgdGhpcy5fc3BlYy5lbmRTdGF0ZSA9IHt9O1xuICAgIGlmIChzcGVjKSB7XG4gICAgICAgIHRoaXMuc2V0U3BlYyhzcGVjKTtcbiAgICB9XG59XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKExheW91dE5vZGUucHJvdG90eXBlKTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dMYXlvdXROb2RlO1xuRmxvd0xheW91dE5vZGUuREVGQVVMVF9PUFRJT05TID0ge1xuICAgIHNwcmluZzoge1xuICAgICAgICBkYW1waW5nUmF0aW86IDAuOCxcbiAgICAgICAgcGVyaW9kOiAzMDBcbiAgICB9LFxuICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgb3BhY2l0eTogdHJ1ZSxcbiAgICAgICAgYWxpZ246IHRydWUsXG4gICAgICAgIG9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2l6ZTogdHJ1ZSxcbiAgICAgICAgdHJhbnNsYXRlOiB0cnVlLFxuICAgICAgICBza2V3OiB0cnVlLFxuICAgICAgICByb3RhdGU6IHRydWUsXG4gICAgICAgIHNjYWxlOiB0cnVlXG4gICAgfSxcbiAgICBwYXJ0aWNsZVJvdW5kaW5nOiAwLjAwMVxufTtcbnZhciBERUZBVUxUID0ge1xuICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICBvcGFjaXR5MkQ6IFtcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgYWxpZ246IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHNjYWxlOiBbXG4gICAgICAgICAgICAxLFxuICAgICAgICAgICAgMSxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgcm90YXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgc2tldzogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9O1xuRmxvd0xheW91dE5vZGUucHJvdG90eXBlLnNldE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMuX29wdGlvbnNNYW5hZ2VyLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgdmFyIHdhc1NsZWVwaW5nID0gdGhpcy5fcGUuaXNTbGVlcGluZygpO1xuICAgIGZvciAodmFyIHByb3BOYW1lIGluIHRoaXMuX3Byb3BlcnRpZXMpIHtcbiAgICAgICAgdmFyIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzW3Byb3BOYW1lXTtcbiAgICAgICAgaWYgKG9wdGlvbnMuc3ByaW5nICYmIHByb3AuZm9yY2UpIHtcbiAgICAgICAgICAgIHByb3AuZm9yY2Uuc2V0T3B0aW9ucyh0aGlzLm9wdGlvbnMuc3ByaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5wcm9wZXJ0aWVzICYmIG9wdGlvbnMucHJvcGVydGllc1twcm9wTmFtZV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wcm9wZXJ0aWVzW3Byb3BOYW1lXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBwcm9wLmVuYWJsZWQgPSB0aGlzLm9wdGlvbnMucHJvcGVydGllc1twcm9wTmFtZV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb3AuZW5hYmxlZCA9IFtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnByb3BlcnRpZXNbcHJvcE5hbWVdLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucHJvcGVydGllc1twcm9wTmFtZV0sXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wcm9wZXJ0aWVzW3Byb3BOYW1lXVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHdhc1NsZWVwaW5nKSB7XG4gICAgICAgIHRoaXMuX3BlLnNsZWVwKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5zZXRTcGVjID0gZnVuY3Rpb24gKHNwZWMpIHtcbiAgICB2YXIgc2V0O1xuICAgIGlmIChzcGVjLnRyYW5zZm9ybSkge1xuICAgICAgICBzZXQgPSBUcmFuc2Zvcm0uaW50ZXJwcmV0KHNwZWMudHJhbnNmb3JtKTtcbiAgICB9XG4gICAgaWYgKCFzZXQpIHtcbiAgICAgICAgc2V0ID0ge307XG4gICAgfVxuICAgIHNldC5vcGFjaXR5ID0gc3BlYy5vcGFjaXR5O1xuICAgIHNldC5zaXplID0gc3BlYy5zaXplO1xuICAgIHNldC5hbGlnbiA9IHNwZWMuYWxpZ247XG4gICAgc2V0Lm9yaWdpbiA9IHNwZWMub3JpZ2luO1xuICAgIHZhciBvbGRSZW1vdmluZyA9IHRoaXMuX3JlbW92aW5nO1xuICAgIHZhciBvbGRJbnZhbGlkYXRlZCA9IHRoaXMuX2ludmFsaWRhdGVkO1xuICAgIHRoaXMuc2V0KHNldCk7XG4gICAgdGhpcy5fcmVtb3ZpbmcgPSBvbGRSZW1vdmluZztcbiAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IG9sZEludmFsaWRhdGVkO1xufTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgZm9yICh2YXIgcHJvcE5hbWUgaW4gdGhpcy5fcHJvcGVydGllcykge1xuICAgICAgICAgICAgdGhpcy5fcHJvcGVydGllc1twcm9wTmFtZV0uaW52YWxpZGF0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLnRydWVTaXplUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgdGhpcy51c2VzVHJ1ZVNpemUgPSBmYWxzZTtcbn07XG5GbG93TGF5b3V0Tm9kZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHJlbW92ZVNwZWMpIHtcbiAgICB0aGlzLl9yZW1vdmluZyA9IHRydWU7XG4gICAgaWYgKHJlbW92ZVNwZWMpIHtcbiAgICAgICAgdGhpcy5zZXRTcGVjKHJlbW92ZVNwZWMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3BlLnNsZWVwKCk7XG4gICAgICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLl9pbnZhbGlkYXRlZCA9IGZhbHNlO1xufTtcbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5yZWxlYXNlTG9jayA9IGZ1bmN0aW9uIChlbmFibGUpIHtcbiAgICB0aGlzLl9sb2NrVHJhbnNpdGlvbmFibGUuaGFsdCgpO1xuICAgIHRoaXMuX2xvY2tUcmFuc2l0aW9uYWJsZS5yZXNldCgwKTtcbiAgICBpZiAoZW5hYmxlKSB7XG4gICAgICAgIHRoaXMuX2xvY2tUcmFuc2l0aW9uYWJsZS5zZXQoMSwgeyBkdXJhdGlvbjogdGhpcy5vcHRpb25zLnNwcmluZy5wZXJpb2QgfHwgMTAwMCB9KTtcbiAgICB9XG59O1xuZnVuY3Rpb24gX2dldFJvdW5kZWRWYWx1ZTNEKHByb3AsIGRlZiwgcHJlY2lzaW9uLCBsb2NrVmFsdWUpIHtcbiAgICBpZiAoIXByb3AgfHwgIXByb3AuaW5pdCkge1xuICAgICAgICByZXR1cm4gZGVmO1xuICAgIH1cbiAgICByZXR1cm4gW1xuICAgICAgICBwcm9wLmVuYWJsZWRbMF0gPyBNYXRoLnJvdW5kKChwcm9wLmN1clN0YXRlLnggKyAocHJvcC5lbmRTdGF0ZS54IC0gcHJvcC5jdXJTdGF0ZS54KSAqIGxvY2tWYWx1ZSkgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uIDogcHJvcC5lbmRTdGF0ZS54LFxuICAgICAgICBwcm9wLmVuYWJsZWRbMV0gPyBNYXRoLnJvdW5kKChwcm9wLmN1clN0YXRlLnkgKyAocHJvcC5lbmRTdGF0ZS55IC0gcHJvcC5jdXJTdGF0ZS55KSAqIGxvY2tWYWx1ZSkgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uIDogcHJvcC5lbmRTdGF0ZS55LFxuICAgICAgICBwcm9wLmVuYWJsZWRbMl0gPyBNYXRoLnJvdW5kKChwcm9wLmN1clN0YXRlLnogKyAocHJvcC5lbmRTdGF0ZS56IC0gcHJvcC5jdXJTdGF0ZS56KSAqIGxvY2tWYWx1ZSkgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uIDogcHJvcC5lbmRTdGF0ZS56XG4gICAgXTtcbn1cbkZsb3dMYXlvdXROb2RlLnByb3RvdHlwZS5nZXRTcGVjID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbmRTdGF0ZVJlYWNoZWQgPSB0aGlzLl9wZS5pc1NsZWVwaW5nKCk7XG4gICAgaWYgKCF0aGlzLl9zcGVjTW9kaWZpZWQgJiYgZW5kU3RhdGVSZWFjaGVkKSB7XG4gICAgICAgIHRoaXMuX3NwZWMucmVtb3ZlZCA9ICF0aGlzLl9pbnZhbGlkYXRlZDtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NwZWM7XG4gICAgfVxuICAgIHRoaXMuX2luaXRpYWwgPSBmYWxzZTtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSAhZW5kU3RhdGVSZWFjaGVkO1xuICAgIHRoaXMuX3NwZWMucmVtb3ZlZCA9IGZhbHNlO1xuICAgIGlmICghZW5kU3RhdGVSZWFjaGVkKSB7XG4gICAgICAgIHRoaXMuX3BlLnN0ZXAoKTtcbiAgICB9XG4gICAgdmFyIHNwZWMgPSB0aGlzLl9zcGVjO1xuICAgIHZhciBwcmVjaXNpb24gPSB0aGlzLm9wdGlvbnMucGFydGljbGVSb3VuZGluZztcbiAgICB2YXIgbG9ja1ZhbHVlID0gdGhpcy5fbG9ja1RyYW5zaXRpb25hYmxlLmdldCgpO1xuICAgIHZhciBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5vcGFjaXR5O1xuICAgIGlmIChwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBzcGVjLm9wYWNpdHkgPSBwcm9wLmVuYWJsZWRbMF0gPyBNYXRoLnJvdW5kKE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHByb3AuY3VyU3RhdGUueCkpIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbiA6IHByb3AuZW5kU3RhdGUueDtcbiAgICAgICAgc3BlYy5lbmRTdGF0ZS5vcGFjaXR5ID0gcHJvcC5lbmRTdGF0ZS54O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMub3BhY2l0eSA9IHVuZGVmaW5lZDtcbiAgICAgICAgc3BlYy5lbmRTdGF0ZS5vcGFjaXR5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5zaXplO1xuICAgIGlmIChwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBzcGVjLnNpemUgPSBzcGVjLnNpemUgfHwgW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICAgICAgc3BlYy5zaXplWzBdID0gcHJvcC5lbmFibGVkWzBdID8gTWF0aC5yb3VuZCgocHJvcC5jdXJTdGF0ZS54ICsgKHByb3AuZW5kU3RhdGUueCAtIHByb3AuY3VyU3RhdGUueCkgKiBsb2NrVmFsdWUpIC8gMC4xKSAqIDAuMSA6IHByb3AuZW5kU3RhdGUueDtcbiAgICAgICAgc3BlYy5zaXplWzFdID0gcHJvcC5lbmFibGVkWzFdID8gTWF0aC5yb3VuZCgocHJvcC5jdXJTdGF0ZS55ICsgKHByb3AuZW5kU3RhdGUueSAtIHByb3AuY3VyU3RhdGUueSkgKiBsb2NrVmFsdWUpIC8gMC4xKSAqIDAuMSA6IHByb3AuZW5kU3RhdGUueTtcbiAgICAgICAgc3BlYy5lbmRTdGF0ZS5zaXplID0gc3BlYy5lbmRTdGF0ZS5zaXplIHx8IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF07XG4gICAgICAgIHNwZWMuZW5kU3RhdGUuc2l6ZVswXSA9IHByb3AuZW5kU3RhdGUueDtcbiAgICAgICAgc3BlYy5lbmRTdGF0ZS5zaXplWzFdID0gcHJvcC5lbmRTdGF0ZS55O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMuc2l6ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgc3BlYy5lbmRTdGF0ZS5zaXplID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5hbGlnbjtcbiAgICBpZiAocHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgc3BlYy5hbGlnbiA9IHNwZWMuYWxpZ24gfHwgW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICAgICAgc3BlYy5hbGlnblswXSA9IHByb3AuZW5hYmxlZFswXSA/IE1hdGgucm91bmQoKHByb3AuY3VyU3RhdGUueCArIChwcm9wLmVuZFN0YXRlLnggLSBwcm9wLmN1clN0YXRlLngpICogbG9ja1ZhbHVlKSAvIDAuMSkgKiAwLjEgOiBwcm9wLmVuZFN0YXRlLng7XG4gICAgICAgIHNwZWMuYWxpZ25bMV0gPSBwcm9wLmVuYWJsZWRbMV0gPyBNYXRoLnJvdW5kKChwcm9wLmN1clN0YXRlLnkgKyAocHJvcC5lbmRTdGF0ZS55IC0gcHJvcC5jdXJTdGF0ZS55KSAqIGxvY2tWYWx1ZSkgLyAwLjEpICogMC4xIDogcHJvcC5lbmRTdGF0ZS55O1xuICAgICAgICBzcGVjLmVuZFN0YXRlLmFsaWduID0gc3BlYy5lbmRTdGF0ZS5hbGlnbiB8fCBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdO1xuICAgICAgICBzcGVjLmVuZFN0YXRlLmFsaWduWzBdID0gcHJvcC5lbmRTdGF0ZS54O1xuICAgICAgICBzcGVjLmVuZFN0YXRlLmFsaWduWzFdID0gcHJvcC5lbmRTdGF0ZS55O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNwZWMuYWxpZ24gPSB1bmRlZmluZWQ7XG4gICAgICAgIHNwZWMuZW5kU3RhdGUuYWxpZ24gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLm9yaWdpbjtcbiAgICBpZiAocHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgc3BlYy5vcmlnaW4gPSBzcGVjLm9yaWdpbiB8fCBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdO1xuICAgICAgICBzcGVjLm9yaWdpblswXSA9IHByb3AuZW5hYmxlZFswXSA/IE1hdGgucm91bmQoKHByb3AuY3VyU3RhdGUueCArIChwcm9wLmVuZFN0YXRlLnggLSBwcm9wLmN1clN0YXRlLngpICogbG9ja1ZhbHVlKSAvIDAuMSkgKiAwLjEgOiBwcm9wLmVuZFN0YXRlLng7XG4gICAgICAgIHNwZWMub3JpZ2luWzFdID0gcHJvcC5lbmFibGVkWzFdID8gTWF0aC5yb3VuZCgocHJvcC5jdXJTdGF0ZS55ICsgKHByb3AuZW5kU3RhdGUueSAtIHByb3AuY3VyU3RhdGUueSkgKiBsb2NrVmFsdWUpIC8gMC4xKSAqIDAuMSA6IHByb3AuZW5kU3RhdGUueTtcbiAgICAgICAgc3BlYy5lbmRTdGF0ZS5vcmlnaW4gPSBzcGVjLmVuZFN0YXRlLm9yaWdpbiB8fCBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdO1xuICAgICAgICBzcGVjLmVuZFN0YXRlLm9yaWdpblswXSA9IHByb3AuZW5kU3RhdGUueDtcbiAgICAgICAgc3BlYy5lbmRTdGF0ZS5vcmlnaW5bMV0gPSBwcm9wLmVuZFN0YXRlLnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy5vcmlnaW4gPSB1bmRlZmluZWQ7XG4gICAgICAgIHNwZWMuZW5kU3RhdGUub3JpZ2luID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB2YXIgdHJhbnNsYXRlID0gdGhpcy5fcHJvcGVydGllcy50cmFuc2xhdGU7XG4gICAgdmFyIHRyYW5zbGF0ZVg7XG4gICAgdmFyIHRyYW5zbGF0ZVk7XG4gICAgdmFyIHRyYW5zbGF0ZVo7XG4gICAgaWYgKHRyYW5zbGF0ZSAmJiB0cmFuc2xhdGUuaW5pdCkge1xuICAgICAgICB0cmFuc2xhdGVYID0gdHJhbnNsYXRlLmVuYWJsZWRbMF0gPyBNYXRoLnJvdW5kKCh0cmFuc2xhdGUuY3VyU3RhdGUueCArICh0cmFuc2xhdGUuZW5kU3RhdGUueCAtIHRyYW5zbGF0ZS5jdXJTdGF0ZS54KSAqIGxvY2tWYWx1ZSkgLyBwcmVjaXNpb24pICogcHJlY2lzaW9uIDogdHJhbnNsYXRlLmVuZFN0YXRlLng7XG4gICAgICAgIHRyYW5zbGF0ZVkgPSB0cmFuc2xhdGUuZW5hYmxlZFsxXSA/IE1hdGgucm91bmQoKHRyYW5zbGF0ZS5jdXJTdGF0ZS55ICsgKHRyYW5zbGF0ZS5lbmRTdGF0ZS55IC0gdHJhbnNsYXRlLmN1clN0YXRlLnkpICogbG9ja1ZhbHVlKSAvIHByZWNpc2lvbikgKiBwcmVjaXNpb24gOiB0cmFuc2xhdGUuZW5kU3RhdGUueTtcbiAgICAgICAgdHJhbnNsYXRlWiA9IHRyYW5zbGF0ZS5lbmFibGVkWzJdID8gTWF0aC5yb3VuZCgodHJhbnNsYXRlLmN1clN0YXRlLnogKyAodHJhbnNsYXRlLmVuZFN0YXRlLnogLSB0cmFuc2xhdGUuY3VyU3RhdGUueikgKiBsb2NrVmFsdWUpIC8gcHJlY2lzaW9uKSAqIHByZWNpc2lvbiA6IHRyYW5zbGF0ZS5lbmRTdGF0ZS56O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRyYW5zbGF0ZVggPSAwO1xuICAgICAgICB0cmFuc2xhdGVZID0gMDtcbiAgICAgICAgdHJhbnNsYXRlWiA9IDA7XG4gICAgfVxuICAgIHZhciBzY2FsZSA9IHRoaXMuX3Byb3BlcnRpZXMuc2NhbGU7XG4gICAgdmFyIHNrZXcgPSB0aGlzLl9wcm9wZXJ0aWVzLnNrZXc7XG4gICAgdmFyIHJvdGF0ZSA9IHRoaXMuX3Byb3BlcnRpZXMucm90YXRlO1xuICAgIGlmIChzY2FsZSB8fCBza2V3IHx8IHJvdGF0ZSkge1xuICAgICAgICBzcGVjLnRyYW5zZm9ybSA9IFRyYW5zZm9ybS5idWlsZCh7XG4gICAgICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGVYLFxuICAgICAgICAgICAgICAgIHRyYW5zbGF0ZVksXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlWlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHNrZXc6IF9nZXRSb3VuZGVkVmFsdWUzRC5jYWxsKHRoaXMsIHNrZXcsIERFRkFVTFQuc2tldywgdGhpcy5vcHRpb25zLnBhcnRpY2xlUm91bmRpbmcsIGxvY2tWYWx1ZSksXG4gICAgICAgICAgICBzY2FsZTogX2dldFJvdW5kZWRWYWx1ZTNELmNhbGwodGhpcywgc2NhbGUsIERFRkFVTFQuc2NhbGUsIHRoaXMub3B0aW9ucy5wYXJ0aWNsZVJvdW5kaW5nLCBsb2NrVmFsdWUpLFxuICAgICAgICAgICAgcm90YXRlOiBfZ2V0Um91bmRlZFZhbHVlM0QuY2FsbCh0aGlzLCByb3RhdGUsIERFRkFVTFQucm90YXRlLCB0aGlzLm9wdGlvbnMucGFydGljbGVSb3VuZGluZywgbG9ja1ZhbHVlKVxuICAgICAgICB9KTtcbiAgICAgICAgc3BlYy5lbmRTdGF0ZS50cmFuc2Zvcm0gPSBUcmFuc2Zvcm0uYnVpbGQoe1xuICAgICAgICAgICAgdHJhbnNsYXRlOiB0cmFuc2xhdGUgPyBbXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlLmVuZFN0YXRlLngsXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlLmVuZFN0YXRlLnksXG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlLmVuZFN0YXRlLnpcbiAgICAgICAgICAgIF0gOiBERUZBVUxULnRyYW5zbGF0ZSxcbiAgICAgICAgICAgIHNjYWxlOiBzY2FsZSA/IFtcbiAgICAgICAgICAgICAgICBzY2FsZS5lbmRTdGF0ZS54LFxuICAgICAgICAgICAgICAgIHNjYWxlLmVuZFN0YXRlLnksXG4gICAgICAgICAgICAgICAgc2NhbGUuZW5kU3RhdGUuelxuICAgICAgICAgICAgXSA6IERFRkFVTFQuc2NhbGUsXG4gICAgICAgICAgICBza2V3OiBza2V3ID8gW1xuICAgICAgICAgICAgICAgIHNrZXcuZW5kU3RhdGUueCxcbiAgICAgICAgICAgICAgICBza2V3LmVuZFN0YXRlLnksXG4gICAgICAgICAgICAgICAgc2tldy5lbmRTdGF0ZS56XG4gICAgICAgICAgICBdIDogREVGQVVMVC5za2V3LFxuICAgICAgICAgICAgcm90YXRlOiByb3RhdGUgPyBbXG4gICAgICAgICAgICAgICAgcm90YXRlLmVuZFN0YXRlLngsXG4gICAgICAgICAgICAgICAgcm90YXRlLmVuZFN0YXRlLnksXG4gICAgICAgICAgICAgICAgcm90YXRlLmVuZFN0YXRlLnpcbiAgICAgICAgICAgIF0gOiBERUZBVUxULnJvdGF0ZVxuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRyYW5zbGF0ZSkge1xuICAgICAgICBpZiAoIXNwZWMudHJhbnNmb3JtKSB7XG4gICAgICAgICAgICBzcGVjLnRyYW5zZm9ybSA9IFRyYW5zZm9ybS50cmFuc2xhdGUodHJhbnNsYXRlWCwgdHJhbnNsYXRlWSwgdHJhbnNsYXRlWik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzcGVjLnRyYW5zZm9ybVsxMl0gPSB0cmFuc2xhdGVYO1xuICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTNdID0gdHJhbnNsYXRlWTtcbiAgICAgICAgICAgIHNwZWMudHJhbnNmb3JtWzE0XSA9IHRyYW5zbGF0ZVo7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzcGVjLmVuZFN0YXRlLnRyYW5zZm9ybSkge1xuICAgICAgICAgICAgc3BlYy5lbmRTdGF0ZS50cmFuc2Zvcm0gPSBUcmFuc2Zvcm0udHJhbnNsYXRlKHRyYW5zbGF0ZS5lbmRTdGF0ZS54LCB0cmFuc2xhdGUuZW5kU3RhdGUueSwgdHJhbnNsYXRlLmVuZFN0YXRlLnopO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3BlYy5lbmRTdGF0ZS50cmFuc2Zvcm1bMTJdID0gdHJhbnNsYXRlLmVuZFN0YXRlLng7XG4gICAgICAgICAgICBzcGVjLmVuZFN0YXRlLnRyYW5zZm9ybVsxM10gPSB0cmFuc2xhdGUuZW5kU3RhdGUueTtcbiAgICAgICAgICAgIHNwZWMuZW5kU3RhdGUudHJhbnNmb3JtWzE0XSA9IHRyYW5zbGF0ZS5lbmRTdGF0ZS56O1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy50cmFuc2Zvcm0gPSB1bmRlZmluZWQ7XG4gICAgICAgIHNwZWMuZW5kU3RhdGUudHJhbnNmb3JtID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc3BlYztcbn07XG5mdW5jdGlvbiBfc2V0UHJvcGVydHlWYWx1ZShwcm9wLCBwcm9wTmFtZSwgZW5kU3RhdGUsIGRlZmF1bHRWYWx1ZSwgaW1tZWRpYXRlLCBpc1RyYW5zbGF0ZSkge1xuICAgIHByb3AgPSBwcm9wIHx8IHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdO1xuICAgIGlmIChwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBwcm9wLmludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIHZhbHVlID0gZGVmYXVsdFZhbHVlO1xuICAgICAgICBpZiAoZW5kU3RhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdmFsdWUgPSBlbmRTdGF0ZTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9yZW1vdmluZykge1xuICAgICAgICAgICAgdmFsdWUgPSBwcm9wLnBhcnRpY2xlLmdldFBvc2l0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcHJvcC5lbmRTdGF0ZS54ID0gdmFsdWVbMF07XG4gICAgICAgIHByb3AuZW5kU3RhdGUueSA9IHZhbHVlLmxlbmd0aCA+IDEgPyB2YWx1ZVsxXSA6IDA7XG4gICAgICAgIHByb3AuZW5kU3RhdGUueiA9IHZhbHVlLmxlbmd0aCA+IDIgPyB2YWx1ZVsyXSA6IDA7XG4gICAgICAgIGlmIChpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgIHByb3AuY3VyU3RhdGUueCA9IHByb3AuZW5kU3RhdGUueDtcbiAgICAgICAgICAgIHByb3AuY3VyU3RhdGUueSA9IHByb3AuZW5kU3RhdGUueTtcbiAgICAgICAgICAgIHByb3AuY3VyU3RhdGUueiA9IHByb3AuZW5kU3RhdGUuejtcbiAgICAgICAgICAgIHByb3AudmVsb2NpdHkueCA9IDA7XG4gICAgICAgICAgICBwcm9wLnZlbG9jaXR5LnkgPSAwO1xuICAgICAgICAgICAgcHJvcC52ZWxvY2l0eS56ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9wLmVuZFN0YXRlLnggIT09IHByb3AuY3VyU3RhdGUueCB8fCBwcm9wLmVuZFN0YXRlLnkgIT09IHByb3AuY3VyU3RhdGUueSB8fCBwcm9wLmVuZFN0YXRlLnogIT09IHByb3AuY3VyU3RhdGUueikge1xuICAgICAgICAgICAgdGhpcy5fcGUud2FrZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgd2FzU2xlZXBpbmcgPSB0aGlzLl9wZS5pc1NsZWVwaW5nKCk7XG4gICAgICAgIGlmICghcHJvcCkge1xuICAgICAgICAgICAgcHJvcCA9IHtcbiAgICAgICAgICAgICAgICBwYXJ0aWNsZTogbmV3IFBhcnRpY2xlKHsgcG9zaXRpb246IHRoaXMuX2luaXRpYWwgfHwgaW1tZWRpYXRlID8gZW5kU3RhdGUgOiBkZWZhdWx0VmFsdWUgfSksXG4gICAgICAgICAgICAgICAgZW5kU3RhdGU6IG5ldyBWZWN0b3IoZW5kU3RhdGUpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcHJvcC5jdXJTdGF0ZSA9IHByb3AucGFydGljbGUucG9zaXRpb247XG4gICAgICAgICAgICBwcm9wLnZlbG9jaXR5ID0gcHJvcC5wYXJ0aWNsZS52ZWxvY2l0eTtcbiAgICAgICAgICAgIHByb3AuZm9yY2UgPSBuZXcgU3ByaW5nKHRoaXMub3B0aW9ucy5zcHJpbmcpO1xuICAgICAgICAgICAgcHJvcC5mb3JjZS5zZXRPcHRpb25zKHsgYW5jaG9yOiBwcm9wLmVuZFN0YXRlIH0pO1xuICAgICAgICAgICAgdGhpcy5fcGUuYWRkQm9keShwcm9wLnBhcnRpY2xlKTtcbiAgICAgICAgICAgIHByb3AuZm9yY2VJZCA9IHRoaXMuX3BlLmF0dGFjaChwcm9wLmZvcmNlLCBwcm9wLnBhcnRpY2xlKTtcbiAgICAgICAgICAgIHRoaXMuX3Byb3BlcnRpZXNbcHJvcE5hbWVdID0gcHJvcDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3AucGFydGljbGUuc2V0UG9zaXRpb24odGhpcy5faW5pdGlhbCB8fCBpbW1lZGlhdGUgPyBlbmRTdGF0ZSA6IGRlZmF1bHRWYWx1ZSk7XG4gICAgICAgICAgICBwcm9wLmVuZFN0YXRlLnNldChlbmRTdGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLl9pbml0aWFsICYmICFpbW1lZGlhdGUpIHtcbiAgICAgICAgICAgIHRoaXMuX3BlLndha2UoKTtcbiAgICAgICAgfSBlbHNlIGlmICh3YXNTbGVlcGluZykge1xuICAgICAgICAgICAgdGhpcy5fcGUuc2xlZXAoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnByb3BlcnRpZXNbcHJvcE5hbWVdICYmIHRoaXMub3B0aW9ucy5wcm9wZXJ0aWVzW3Byb3BOYW1lXS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHByb3AuZW5hYmxlZCA9IHRoaXMub3B0aW9ucy5wcm9wZXJ0aWVzW3Byb3BOYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb3AuZW5hYmxlZCA9IFtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucHJvcGVydGllc1twcm9wTmFtZV0sXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnByb3BlcnRpZXNbcHJvcE5hbWVdLFxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wcm9wZXJ0aWVzW3Byb3BOYW1lXVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICBwcm9wLmluaXQgPSB0cnVlO1xuICAgICAgICBwcm9wLmludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBfZ2V0SWZORTJEKGExLCBhMikge1xuICAgIHJldHVybiBhMVswXSA9PT0gYTJbMF0gJiYgYTFbMV0gPT09IGEyWzFdID8gdW5kZWZpbmVkIDogYTE7XG59XG5mdW5jdGlvbiBfZ2V0SWZORTNEKGExLCBhMikge1xuICAgIHJldHVybiBhMVswXSA9PT0gYTJbMF0gJiYgYTFbMV0gPT09IGEyWzFdICYmIGExWzJdID09PSBhMlsyXSA/IHVuZGVmaW5lZCA6IGExO1xufVxuRmxvd0xheW91dE5vZGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChzZXQsIGRlZmF1bHRTaXplKSB7XG4gICAgaWYgKGRlZmF1bHRTaXplKSB7XG4gICAgICAgIHRoaXMuX3JlbW92aW5nID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuX2ludmFsaWRhdGVkID0gdHJ1ZTtcbiAgICB0aGlzLnNjcm9sbExlbmd0aCA9IHNldC5zY3JvbGxMZW5ndGg7XG4gICAgdGhpcy5fc3BlY01vZGlmaWVkID0gdHJ1ZTtcbiAgICB2YXIgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMub3BhY2l0eTtcbiAgICB2YXIgdmFsdWUgPSBzZXQub3BhY2l0eSA9PT0gREVGQVVMVC5vcGFjaXR5ID8gdW5kZWZpbmVkIDogc2V0Lm9wYWNpdHk7XG4gICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnb3BhY2l0eScsIHZhbHVlID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBbXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSwgREVGQVVMVC5vcGFjaXR5MkQpO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5hbGlnbjtcbiAgICB2YWx1ZSA9IHNldC5hbGlnbiA/IF9nZXRJZk5FMkQoc2V0LmFsaWduLCBERUZBVUxULmFsaWduKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnYWxpZ24nLCB2YWx1ZSwgREVGQVVMVC5hbGlnbik7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLm9yaWdpbjtcbiAgICB2YWx1ZSA9IHNldC5vcmlnaW4gPyBfZ2V0SWZORTJEKHNldC5vcmlnaW4sIERFRkFVTFQub3JpZ2luKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAodmFsdWUgfHwgcHJvcCAmJiBwcm9wLmluaXQpIHtcbiAgICAgICAgX3NldFByb3BlcnR5VmFsdWUuY2FsbCh0aGlzLCBwcm9wLCAnb3JpZ2luJywgdmFsdWUsIERFRkFVTFQub3JpZ2luKTtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMuc2l6ZTtcbiAgICB2YWx1ZSA9IHNldC5zaXplIHx8IGRlZmF1bHRTaXplO1xuICAgIGlmICh2YWx1ZSB8fCBwcm9wICYmIHByb3AuaW5pdCkge1xuICAgICAgICBfc2V0UHJvcGVydHlWYWx1ZS5jYWxsKHRoaXMsIHByb3AsICdzaXplJywgdmFsdWUsIGRlZmF1bHRTaXplLCB0aGlzLnVzZXNUcnVlU2l6ZSk7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLnRyYW5zbGF0ZTtcbiAgICB2YWx1ZSA9IHNldC50cmFuc2xhdGU7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3RyYW5zbGF0ZScsIHZhbHVlLCBERUZBVUxULnRyYW5zbGF0ZSwgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICB9XG4gICAgcHJvcCA9IHRoaXMuX3Byb3BlcnRpZXMuc2NhbGU7XG4gICAgdmFsdWUgPSBzZXQuc2NhbGUgPyBfZ2V0SWZORTNEKHNldC5zY2FsZSwgREVGQVVMVC5zY2FsZSkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3NjYWxlJywgdmFsdWUsIERFRkFVTFQuc2NhbGUpO1xuICAgIH1cbiAgICBwcm9wID0gdGhpcy5fcHJvcGVydGllcy5yb3RhdGU7XG4gICAgdmFsdWUgPSBzZXQucm90YXRlID8gX2dldElmTkUzRChzZXQucm90YXRlLCBERUZBVUxULnJvdGF0ZSkgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3JvdGF0ZScsIHZhbHVlLCBERUZBVUxULnJvdGF0ZSk7XG4gICAgfVxuICAgIHByb3AgPSB0aGlzLl9wcm9wZXJ0aWVzLnNrZXc7XG4gICAgdmFsdWUgPSBzZXQuc2tldyA/IF9nZXRJZk5FM0Qoc2V0LnNrZXcsIERFRkFVTFQuc2tldykgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHZhbHVlIHx8IHByb3AgJiYgcHJvcC5pbml0KSB7XG4gICAgICAgIF9zZXRQcm9wZXJ0eVZhbHVlLmNhbGwodGhpcywgcHJvcCwgJ3NrZXcnLCB2YWx1ZSwgREVGQVVMVC5za2V3KTtcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBGbG93TGF5b3V0Tm9kZTsiLCJmdW5jdGlvbiBMYXlvdXRDb250ZXh0KG1ldGhvZHMpIHtcbiAgICBmb3IgKHZhciBuIGluIG1ldGhvZHMpIHtcbiAgICAgICAgdGhpc1tuXSA9IG1ldGhvZHNbbl07XG4gICAgfVxufVxuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuc2l6ZSA9IHVuZGVmaW5lZDtcbkxheW91dENvbnRleHQucHJvdG90eXBlLmRpcmVjdGlvbiA9IHVuZGVmaW5lZDtcbkxheW91dENvbnRleHQucHJvdG90eXBlLnNjcm9sbE9mZnNldCA9IHVuZGVmaW5lZDtcbkxheW91dENvbnRleHQucHJvdG90eXBlLnNjcm9sbFN0YXJ0ID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuc2Nyb2xsRW5kID0gdW5kZWZpbmVkO1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcbn07XG5MYXlvdXRDb250ZXh0LnByb3RvdHlwZS5wcmV2ID0gZnVuY3Rpb24gKCkge1xufTtcbkxheW91dENvbnRleHQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChub2RlKSB7XG59O1xuTGF5b3V0Q29udGV4dC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKG5vZGUsIHNldCkge1xufTtcbkxheW91dENvbnRleHQucHJvdG90eXBlLnJlc29sdmVTaXplID0gZnVuY3Rpb24gKG5vZGUpIHtcbn07XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dENvbnRleHQ7IiwidmFyIFV0aWxpdHkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiBudWxsO1xudmFyIEVudGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLkVudGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLkVudGl0eSA6IG51bGw7XG52YXIgVmlld1NlcXVlbmNlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuVmlld1NlcXVlbmNlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVmlld1NlcXVlbmNlIDogbnVsbDtcbnZhciBPcHRpb25zTWFuYWdlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLk9wdGlvbnNNYW5hZ2VyIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuT3B0aW9uc01hbmFnZXIgOiBudWxsO1xudmFyIEV2ZW50SGFuZGxlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLkV2ZW50SGFuZGxlciA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLkV2ZW50SGFuZGxlciA6IG51bGw7XG52YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4vTGF5b3V0VXRpbGl0eScpO1xudmFyIExheW91dE5vZGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9MYXlvdXROb2RlTWFuYWdlcicpO1xudmFyIExheW91dE5vZGUgPSByZXF1aXJlKCcuL0xheW91dE5vZGUnKTtcbnZhciBGbG93TGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vRmxvd0xheW91dE5vZGUnKTtcbnZhciBUcmFuc2Zvcm0gPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5UcmFuc2Zvcm0gOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5UcmFuc2Zvcm0gOiBudWxsO1xucmVxdWlyZSgnLi9oZWxwZXJzL0xheW91dERvY2tIZWxwZXInKTtcbmZ1bmN0aW9uIExheW91dENvbnRyb2xsZXIob3B0aW9ucywgbm9kZU1hbmFnZXIpIHtcbiAgICB0aGlzLmlkID0gRW50aXR5LnJlZ2lzdGVyKHRoaXMpO1xuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX2NvbnRleHRTaXplQ2FjaGUgPSBbXG4gICAgICAgIDAsXG4gICAgICAgIDBcbiAgICBdO1xuICAgIHRoaXMuX2NvbW1pdE91dHB1dCA9IHt9O1xuICAgIHRoaXMuX2NsZWFudXBSZWdpc3RyYXRpb24gPSB7XG4gICAgICAgIGNvbW1pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfSxcbiAgICAgICAgY2xlYW51cDogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYW51cChjb250ZXh0KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgfTtcbiAgICB0aGlzLl9jbGVhbnVwUmVnaXN0cmF0aW9uLnRhcmdldCA9IEVudGl0eS5yZWdpc3Rlcih0aGlzLl9jbGVhbnVwUmVnaXN0cmF0aW9uKTtcbiAgICB0aGlzLl9jbGVhbnVwUmVnaXN0cmF0aW9uLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGFyZ2V0O1xuICAgIH0uYmluZCh0aGlzLl9jbGVhbnVwUmVnaXN0cmF0aW9uKTtcbiAgICB0aGlzLl9ldmVudElucHV0ID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgIEV2ZW50SGFuZGxlci5zZXRJbnB1dEhhbmRsZXIodGhpcywgdGhpcy5fZXZlbnRJbnB1dCk7XG4gICAgdGhpcy5fZXZlbnRPdXRwdXQgPSBuZXcgRXZlbnRIYW5kbGVyKCk7XG4gICAgRXZlbnRIYW5kbGVyLnNldE91dHB1dEhhbmRsZXIodGhpcywgdGhpcy5fZXZlbnRPdXRwdXQpO1xuICAgIHRoaXMuX2xheW91dCA9IHsgb3B0aW9uczogT2JqZWN0LmNyZWF0ZSh7fSkgfTtcbiAgICB0aGlzLl9sYXlvdXQub3B0aW9uc01hbmFnZXIgPSBuZXcgT3B0aW9uc01hbmFnZXIodGhpcy5fbGF5b3V0Lm9wdGlvbnMpO1xuICAgIHRoaXMuX2xheW91dC5vcHRpb25zTWFuYWdlci5vbignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5jcmVhdGUoTGF5b3V0Q29udHJvbGxlci5ERUZBVUxUX09QVElPTlMpO1xuICAgIHRoaXMuX29wdGlvbnNNYW5hZ2VyID0gbmV3IE9wdGlvbnNNYW5hZ2VyKHRoaXMub3B0aW9ucyk7XG4gICAgaWYgKG5vZGVNYW5hZ2VyKSB7XG4gICAgICAgIHRoaXMuX25vZGVzID0gbm9kZU1hbmFnZXI7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZmxvdykge1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG5ldyBMYXlvdXROb2RlTWFuYWdlcihGbG93TGF5b3V0Tm9kZSwgX2luaXRGbG93TGF5b3V0Tm9kZS5iaW5kKHRoaXMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9ub2RlcyA9IG5ldyBMYXlvdXROb2RlTWFuYWdlcihMYXlvdXROb2RlKTtcbiAgICB9XG4gICAgdGhpcy5zZXREaXJlY3Rpb24odW5kZWZpbmVkKTtcbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgfVxufVxuTGF5b3V0Q29udHJvbGxlci5ERUZBVUxUX09QVElPTlMgPSB7XG4gICAgZmxvdzogZmFsc2UsXG4gICAgZmxvd09wdGlvbnM6IHtcbiAgICAgICAgcmVmbG93T25SZXNpemU6IHRydWUsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IHRydWUsXG4gICAgICAgICAgICBhbGlnbjogdHJ1ZSxcbiAgICAgICAgICAgIG9yaWdpbjogdHJ1ZSxcbiAgICAgICAgICAgIHNpemU6IHRydWUsXG4gICAgICAgICAgICB0cmFuc2xhdGU6IHRydWUsXG4gICAgICAgICAgICBza2V3OiB0cnVlLFxuICAgICAgICAgICAgcm90YXRlOiB0cnVlLFxuICAgICAgICAgICAgc2NhbGU6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgc3ByaW5nOiB7XG4gICAgICAgICAgICBkYW1waW5nUmF0aW86IDAuOCxcbiAgICAgICAgICAgIHBlcmlvZDogMzAwXG4gICAgICAgIH1cbiAgICB9XG59O1xuZnVuY3Rpb24gX2luaXRGbG93TGF5b3V0Tm9kZShub2RlLCBzcGVjKSB7XG4gICAgaWYgKCFzcGVjICYmIHRoaXMub3B0aW9ucy5mbG93T3B0aW9ucy5pbnNlcnRTcGVjKSB7XG4gICAgICAgIG5vZGUuc2V0U3BlYyh0aGlzLm9wdGlvbnMuZmxvd09wdGlvbnMuaW5zZXJ0U3BlYyk7XG4gICAgfVxufVxuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuYWxpZ25tZW50ICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5hbGlnbm1lbnQgIT09IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuX29wdGlvbnNNYW5hZ2VyLnNldE9wdGlvbnMob3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMubm9kZVNwcmluZykge1xuICAgICAgICBjb25zb2xlLndhcm4oJ25vZGVTcHJpbmcgb3B0aW9ucyBoYXZlIGJlZW4gbW92ZWQgaW5zaWRlIGBmbG93T3B0aW9uc2AuIFVzZSBgZmxvd09wdGlvbnMuc3ByaW5nYCBpbnN0ZWFkLicpO1xuICAgICAgICB0aGlzLl9vcHRpb25zTWFuYWdlci5zZXRPcHRpb25zKHsgZmxvd09wdGlvbnM6IHsgc3ByaW5nOiBvcHRpb25zLm5vZGVTcHJpbmcgfSB9KTtcbiAgICAgICAgdGhpcy5fbm9kZXMuc2V0Tm9kZU9wdGlvbnModGhpcy5vcHRpb25zLmZsb3dPcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMucmVmbG93T25SZXNpemUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ3JlZmxvd09uUmVzaXplIG9wdGlvbnMgaGF2ZSBiZWVuIG1vdmVkIGluc2lkZSBgZmxvd09wdGlvbnNgLiBVc2UgYGZsb3dPcHRpb25zLnJlZmxvd09uUmVzaXplYCBpbnN0ZWFkLicpO1xuICAgICAgICB0aGlzLl9vcHRpb25zTWFuYWdlci5zZXRPcHRpb25zKHsgZmxvd09wdGlvbnM6IHsgcmVmbG93T25SZXNpemU6IG9wdGlvbnMucmVmbG93T25SZXNpemUgfSB9KTtcbiAgICAgICAgdGhpcy5fbm9kZXMuc2V0Tm9kZU9wdGlvbnModGhpcy5vcHRpb25zLmZsb3dPcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuaW5zZXJ0U3BlYykge1xuICAgICAgICBjb25zb2xlLndhcm4oJ2luc2VydFNwZWMgb3B0aW9ucyBoYXZlIGJlZW4gbW92ZWQgaW5zaWRlIGBmbG93T3B0aW9uc2AuIFVzZSBgZmxvd09wdGlvbnMuaW5zZXJ0U3BlY2AgaW5zdGVhZC4nKTtcbiAgICAgICAgdGhpcy5fb3B0aW9uc01hbmFnZXIuc2V0T3B0aW9ucyh7IGZsb3dPcHRpb25zOiB7IGluc2VydFNwZWM6IG9wdGlvbnMuaW5zZXJ0U3BlYyB9IH0pO1xuICAgICAgICB0aGlzLl9ub2Rlcy5zZXROb2RlT3B0aW9ucyh0aGlzLm9wdGlvbnMuZmxvd09wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5yZW1vdmVTcGVjKSB7XG4gICAgICAgIGNvbnNvbGUud2FybigncmVtb3ZlU3BlYyBvcHRpb25zIGhhdmUgYmVlbiBtb3ZlZCBpbnNpZGUgYGZsb3dPcHRpb25zYC4gVXNlIGBmbG93T3B0aW9ucy5yZW1vdmVTcGVjYCBpbnN0ZWFkLicpO1xuICAgICAgICB0aGlzLl9vcHRpb25zTWFuYWdlci5zZXRPcHRpb25zKHsgZmxvd09wdGlvbnM6IHsgcmVtb3ZlU3BlYzogb3B0aW9ucy5yZW1vdmVTcGVjIH0gfSk7XG4gICAgICAgIHRoaXMuX25vZGVzLnNldE5vZGVPcHRpb25zKHRoaXMub3B0aW9ucy5mbG93T3B0aW9ucyk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmRhdGFTb3VyY2UpIHtcbiAgICAgICAgdGhpcy5zZXREYXRhU291cmNlKG9wdGlvbnMuZGF0YVNvdXJjZSk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLmxheW91dCkge1xuICAgICAgICB0aGlzLnNldExheW91dChvcHRpb25zLmxheW91dCwgb3B0aW9ucy5sYXlvdXRPcHRpb25zKTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMubGF5b3V0T3B0aW9ucykge1xuICAgICAgICB0aGlzLnNldExheW91dE9wdGlvbnMob3B0aW9ucy5sYXlvdXRPcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuZGlyZWN0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5zZXREaXJlY3Rpb24ob3B0aW9ucy5kaXJlY3Rpb24pO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5mbG93T3B0aW9ucyAmJiB0aGlzLm9wdGlvbnMuZmxvdykge1xuICAgICAgICB0aGlzLl9ub2Rlcy5zZXROb2RlT3B0aW9ucyh0aGlzLm9wdGlvbnMuZmxvd09wdGlvbnMpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5wcmVhbGxvY2F0ZU5vZGVzKSB7XG4gICAgICAgIHRoaXMuX25vZGVzLnByZWFsbG9jYXRlTm9kZXMob3B0aW9ucy5wcmVhbGxvY2F0ZU5vZGVzLmNvdW50IHx8IDAsIG9wdGlvbnMucHJlYWxsb2NhdGVOb2Rlcy5zcGVjKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuZnVuY3Rpb24gX2ZvckVhY2hSZW5kZXJhYmxlKGNhbGxiYWNrKSB7XG4gICAgdmFyIGRhdGFTb3VyY2UgPSB0aGlzLl9kYXRhU291cmNlO1xuICAgIGlmIChkYXRhU291cmNlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSBkYXRhU291cmNlLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YVNvdXJjZVtpXSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGRhdGFTb3VyY2UgaW5zdGFuY2VvZiBWaWV3U2VxdWVuY2UpIHtcbiAgICAgICAgdmFyIHJlbmRlcmFibGU7XG4gICAgICAgIHdoaWxlIChkYXRhU291cmNlKSB7XG4gICAgICAgICAgICByZW5kZXJhYmxlID0gZGF0YVNvdXJjZS5nZXQoKTtcbiAgICAgICAgICAgIGlmICghcmVuZGVyYWJsZSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FsbGJhY2socmVuZGVyYWJsZSk7XG4gICAgICAgICAgICBkYXRhU291cmNlID0gZGF0YVNvdXJjZS5nZXROZXh0KCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YVNvdXJjZSkge1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YVNvdXJjZVtrZXldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldERhdGFTb3VyY2UgPSBmdW5jdGlvbiAoZGF0YVNvdXJjZSkge1xuICAgIHRoaXMuX2RhdGFTb3VyY2UgPSBkYXRhU291cmNlO1xuICAgIHRoaXMuX2luaXRpYWxWaWV3U2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fbm9kZXNCeUlkID0gdW5kZWZpbmVkO1xuICAgIGlmIChkYXRhU291cmNlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgdGhpcy5fdmlld1NlcXVlbmNlID0gbmV3IFZpZXdTZXF1ZW5jZShkYXRhU291cmNlKTtcbiAgICAgICAgdGhpcy5faW5pdGlhbFZpZXdTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZTtcbiAgICB9IGVsc2UgaWYgKGRhdGFTb3VyY2UgaW5zdGFuY2VvZiBWaWV3U2VxdWVuY2UgfHwgZGF0YVNvdXJjZS5nZXROZXh0KSB7XG4gICAgICAgIHRoaXMuX3ZpZXdTZXF1ZW5jZSA9IGRhdGFTb3VyY2U7XG4gICAgICAgIHRoaXMuX2luaXRpYWxWaWV3U2VxdWVuY2UgPSBkYXRhU291cmNlO1xuICAgIH0gZWxzZSBpZiAoZGF0YVNvdXJjZSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgICB0aGlzLl9ub2Rlc0J5SWQgPSBkYXRhU291cmNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9QaXBlRXZlbnRzKSB7XG4gICAgICAgIGlmICh0aGlzLl9kYXRhU291cmNlLnBpcGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGFTb3VyY2UucGlwZSh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuX2RhdGFTb3VyY2UucGlwZSh0aGlzLl9ldmVudE91dHB1dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfZm9yRWFjaFJlbmRlcmFibGUuY2FsbCh0aGlzLCBmdW5jdGlvbiAocmVuZGVyYWJsZSkge1xuICAgICAgICAgICAgICAgIGlmIChyZW5kZXJhYmxlICYmIHJlbmRlcmFibGUucGlwZSkge1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJhYmxlLnBpcGUodGhpcyk7XG4gICAgICAgICAgICAgICAgICAgIHJlbmRlcmFibGUucGlwZSh0aGlzLl9ldmVudE91dHB1dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5nZXREYXRhU291cmNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9kYXRhU291cmNlO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnNldExheW91dCA9IGZ1bmN0aW9uIChsYXlvdXQsIG9wdGlvbnMpIHtcbiAgICBpZiAobGF5b3V0IGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgdGhpcy5fbGF5b3V0Ll9mdW5jdGlvbiA9IGxheW91dDtcbiAgICAgICAgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcyA9IGxheW91dC5DYXBhYmlsaXRpZXM7XG4gICAgICAgIHRoaXMuX2xheW91dC5saXRlcmFsID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAobGF5b3V0IGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgIHRoaXMuX2xheW91dC5saXRlcmFsID0gbGF5b3V0O1xuICAgICAgICB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzID0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgaGVscGVyTmFtZSA9IE9iamVjdC5rZXlzKGxheW91dClbMF07XG4gICAgICAgIHZhciBIZWxwZXIgPSBMYXlvdXRVdGlsaXR5LmdldFJlZ2lzdGVyZWRIZWxwZXIoaGVscGVyTmFtZSk7XG4gICAgICAgIHRoaXMuX2xheW91dC5fZnVuY3Rpb24gPSBIZWxwZXIgPyBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9uczIpIHtcbiAgICAgICAgICAgIHZhciBoZWxwZXIgPSBuZXcgSGVscGVyKGNvbnRleHQsIG9wdGlvbnMyKTtcbiAgICAgICAgICAgIGhlbHBlci5wYXJzZShsYXlvdXRbaGVscGVyTmFtZV0pO1xuICAgICAgICB9IDogdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2xheW91dC5fZnVuY3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX2xheW91dC5saXRlcmFsID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLnNldExheW91dE9wdGlvbnMob3B0aW9ucyk7XG4gICAgfVxuICAgIHRoaXMuc2V0RGlyZWN0aW9uKHRoaXMuX2NvbmZpZ3VyZWREaXJlY3Rpb24pO1xuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldExheW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fbGF5b3V0LmxpdGVyYWwgfHwgdGhpcy5fbGF5b3V0Ll9mdW5jdGlvbjtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zZXRMYXlvdXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB0aGlzLl9sYXlvdXQub3B0aW9uc01hbmFnZXIuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5nZXRMYXlvdXRPcHRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9sYXlvdXQub3B0aW9ucztcbn07XG5mdW5jdGlvbiBfZ2V0QWN0dWFsRGlyZWN0aW9uKGRpcmVjdGlvbikge1xuICAgIGlmICh0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzICYmIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uKSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzLmRpcmVjdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzLmRpcmVjdGlvbltpXSA9PT0gZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uWzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuZGlyZWN0aW9uO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaXJlY3Rpb24gPT09IHVuZGVmaW5lZCA/IFV0aWxpdHkuRGlyZWN0aW9uLlkgOiBkaXJlY3Rpb247XG59XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zZXREaXJlY3Rpb24gPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XG4gICAgdGhpcy5fY29uZmlndXJlZERpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICB2YXIgbmV3RGlyZWN0aW9uID0gX2dldEFjdHVhbERpcmVjdGlvbi5jYWxsKHRoaXMsIGRpcmVjdGlvbik7XG4gICAgaWYgKG5ld0RpcmVjdGlvbiAhPT0gdGhpcy5fZGlyZWN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2RpcmVjdGlvbiA9IG5ld0RpcmVjdGlvbjtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfVxufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldERpcmVjdGlvbiA9IGZ1bmN0aW9uIChhY3R1YWwpIHtcbiAgICByZXR1cm4gYWN0dWFsID8gdGhpcy5fZGlyZWN0aW9uIDogdGhpcy5fY29uZmlndXJlZERpcmVjdGlvbjtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5nZXRTcGVjID0gZnVuY3Rpb24gKG5vZGUsIG5vcm1hbGl6ZSwgZW5kU3RhdGUpIHtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIG5vZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICghdGhpcy5fbm9kZXNCeUlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSB0aGlzLl9ub2Rlc0J5SWRbbm9kZV07XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5fc3BlY3MpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9zcGVjcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHNwZWMgPSB0aGlzLl9zcGVjc1tpXTtcbiAgICAgICAgICAgIGlmIChzcGVjLnJlbmRlck5vZGUgPT09IG5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZW5kU3RhdGUgJiYgc3BlYy5lbmRTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBzcGVjID0gc3BlYy5lbmRTdGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZSAmJiBzcGVjLnRyYW5zZm9ybSAmJiBzcGVjLnNpemUgJiYgKHNwZWMuYWxpZ24gfHwgc3BlYy5vcmlnaW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm0gPSBzcGVjLnRyYW5zZm9ybTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNwZWMuYWxpZ24gJiYgKHNwZWMuYWxpZ25bMF0gfHwgc3BlYy5hbGlnblsxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybSA9IFRyYW5zZm9ybS50aGVuTW92ZSh0cmFuc2Zvcm0sIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmFsaWduWzBdICogdGhpcy5fY29udGV4dFNpemVDYWNoZVswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmFsaWduWzFdICogdGhpcy5fY29udGV4dFNpemVDYWNoZVsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3BlYy5vcmlnaW4gJiYgKHNwZWMub3JpZ2luWzBdIHx8IHNwZWMub3JpZ2luWzFdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtID0gVHJhbnNmb3JtLm1vdmVUaGVuKFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAtc3BlYy5vcmlnaW5bMF0gKiBzcGVjLnNpemVbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLXNwZWMub3JpZ2luWzFdICogc3BlYy5zaXplWzFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sIHRyYW5zZm9ybSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wYWNpdHk6IHNwZWMub3BhY2l0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IHNwZWMuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNmb3JtXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBzcGVjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUucmVmbG93TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnJlc2V0Rmxvd1N0YXRlID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLm9wdGlvbnMuZmxvdykge1xuICAgICAgICB0aGlzLl9yZXNldEZsb3dTdGF0ZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChpbmRleE9ySWQsIHJlbmRlcmFibGUsIGluc2VydFNwZWMpIHtcbiAgICBpZiAoaW5kZXhPcklkIGluc3RhbmNlb2YgU3RyaW5nIHx8IHR5cGVvZiBpbmRleE9ySWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlmICh0aGlzLl9kYXRhU291cmNlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGFTb3VyY2UgPSB7fTtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzQnlJZCA9IHRoaXMuX2RhdGFTb3VyY2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX25vZGVzQnlJZFtpbmRleE9ySWRdID09PSByZW5kZXJhYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9ub2Rlc0J5SWRbaW5kZXhPcklkXSA9IHJlbmRlcmFibGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuX2RhdGFTb3VyY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5fZGF0YVNvdXJjZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fdmlld1NlcXVlbmNlID0gbmV3IFZpZXdTZXF1ZW5jZSh0aGlzLl9kYXRhU291cmNlKTtcbiAgICAgICAgICAgIHRoaXMuX2luaXRpYWxWaWV3U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRhdGFTb3VyY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UgfHwgdGhpcy5fZGF0YVNvdXJjZTtcbiAgICAgICAgaWYgKGluZGV4T3JJZCA9PT0gLTEpIHtcbiAgICAgICAgICAgIGRhdGFTb3VyY2UucHVzaChyZW5kZXJhYmxlKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbmRleE9ySWQgPT09IDApIHtcbiAgICAgICAgICAgIGlmIChkYXRhU291cmNlID09PSB0aGlzLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlLnNwbGljZSgwLCAwLCByZW5kZXJhYmxlKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlLmdldEluZGV4KCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRWaWV3U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dFZpZXdTZXF1ZW5jZSAmJiBuZXh0Vmlld1NlcXVlbmNlLmdldCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBuZXh0Vmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkYXRhU291cmNlLnNwbGljZSgwLCAwLCByZW5kZXJhYmxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGFTb3VyY2Uuc3BsaWNlKGluZGV4T3JJZCwgMCwgcmVuZGVyYWJsZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGluc2VydFNwZWMpIHtcbiAgICAgICAgdGhpcy5fbm9kZXMuaW5zZXJ0Tm9kZSh0aGlzLl9ub2Rlcy5jcmVhdGVOb2RlKHJlbmRlcmFibGUsIGluc2VydFNwZWMpKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvUGlwZUV2ZW50cyAmJiByZW5kZXJhYmxlICYmIHJlbmRlcmFibGUucGlwZSkge1xuICAgICAgICByZW5kZXJhYmxlLnBpcGUodGhpcyk7XG4gICAgICAgIHJlbmRlcmFibGUucGlwZSh0aGlzLl9ldmVudE91dHB1dCk7XG4gICAgfVxuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAocmVuZGVyYWJsZSwgaW5zZXJ0U3BlYykge1xuICAgIHJldHVybiB0aGlzLmluc2VydCgtMSwgcmVuZGVyYWJsZSwgaW5zZXJ0U3BlYyk7XG59O1xuZnVuY3Rpb24gX2dldFZpZXdTZXF1ZW5jZUF0SW5kZXgoaW5kZXgsIHN0YXJ0Vmlld1NlcXVlbmNlKSB7XG4gICAgdmFyIHZpZXdTZXF1ZW5jZSA9IHN0YXJ0Vmlld1NlcXVlbmNlIHx8IHRoaXMuX3ZpZXdTZXF1ZW5jZTtcbiAgICB2YXIgaSA9IHZpZXdTZXF1ZW5jZSA/IHZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpIDogaW5kZXg7XG4gICAgaWYgKGluZGV4ID4gaSkge1xuICAgICAgICB3aGlsZSAodmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICB2aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpO1xuICAgICAgICAgICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPCBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW5kZXggPCBpKSB7XG4gICAgICAgIHdoaWxlICh2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgICAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpO1xuICAgICAgICAgICAgaWYgKGkgPT09IGluZGV4KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5kZXggPiBpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmlld1NlcXVlbmNlO1xufVxuZnVuY3Rpb24gX2dldERhdGFTb3VyY2VBcnJheSgpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLl9kYXRhU291cmNlKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVNvdXJjZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX3ZpZXdTZXF1ZW5jZSB8fCB0aGlzLl92aWV3U2VxdWVuY2UuXykge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmlld1NlcXVlbmNlLl8uYXJyYXk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoaW5kZXhPcklkKSB7XG4gICAgaWYgKHRoaXMuX25vZGVzQnlJZCB8fCBpbmRleE9ySWQgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIGluZGV4T3JJZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzQnlJZFtpbmRleE9ySWRdO1xuICAgIH1cbiAgICB2YXIgdmlld1NlcXVlbmNlID0gX2dldFZpZXdTZXF1ZW5jZUF0SW5kZXguY2FsbCh0aGlzLCBpbmRleE9ySWQpO1xuICAgIHJldHVybiB2aWV3U2VxdWVuY2UgPyB2aWV3U2VxdWVuY2UuZ2V0KCkgOiB1bmRlZmluZWQ7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUuc3dhcCA9IGZ1bmN0aW9uIChpbmRleCwgaW5kZXgyKSB7XG4gICAgdmFyIGFycmF5ID0gX2dldERhdGFTb3VyY2VBcnJheS5jYWxsKHRoaXMpO1xuICAgIGlmICghYXJyYXkpIHtcbiAgICAgICAgdGhyb3cgJy5zd2FwIGlzIG9ubHkgc3VwcG9ydGVkIGZvciBkYXRhU291cmNlcyBvZiB0eXBlIEFycmF5IG9yIFZpZXdTZXF1ZW5jZSc7XG4gICAgfVxuICAgIGlmIChpbmRleCA9PT0gaW5kZXgyKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAoaW5kZXggPCAwIHx8IGluZGV4ID49IGFycmF5Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyAnSW52YWxpZCBpbmRleCAoJyArIGluZGV4ICsgJykgc3BlY2lmaWVkIHRvIC5zd2FwJztcbiAgICB9XG4gICAgaWYgKGluZGV4MiA8IDAgfHwgaW5kZXgyID49IGFycmF5Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyAnSW52YWxpZCBzZWNvbmQgaW5kZXggKCcgKyBpbmRleDIgKyAnKSBzcGVjaWZpZWQgdG8gLnN3YXAnO1xuICAgIH1cbiAgICB2YXIgcmVuZGVyTm9kZSA9IGFycmF5W2luZGV4XTtcbiAgICBhcnJheVtpbmRleF0gPSBhcnJheVtpbmRleDJdO1xuICAgIGFycmF5W2luZGV4Ml0gPSByZW5kZXJOb2RlO1xuICAgIHRoaXMuX2lzRGlydHkgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiAoaW5kZXhPcklkLCByZW5kZXJhYmxlLCBub0FuaW1hdGlvbikge1xuICAgIHZhciBvbGRSZW5kZXJhYmxlO1xuICAgIGlmICh0aGlzLl9ub2Rlc0J5SWQgfHwgaW5kZXhPcklkIGluc3RhbmNlb2YgU3RyaW5nIHx8IHR5cGVvZiBpbmRleE9ySWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIG9sZFJlbmRlcmFibGUgPSB0aGlzLl9ub2Rlc0J5SWRbaW5kZXhPcklkXTtcbiAgICAgICAgaWYgKG9sZFJlbmRlcmFibGUgIT09IHJlbmRlcmFibGUpIHtcbiAgICAgICAgICAgIGlmIChub0FuaW1hdGlvbiAmJiBvbGRSZW5kZXJhYmxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXROb2RlQnlSZW5kZXJOb2RlKG9sZFJlbmRlcmFibGUpO1xuICAgICAgICAgICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0UmVuZGVyTm9kZShyZW5kZXJhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9ub2Rlc0J5SWRbaW5kZXhPcklkXSA9IHJlbmRlcmFibGU7XG4gICAgICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb2xkUmVuZGVyYWJsZTtcbiAgICB9XG4gICAgdmFyIGFycmF5ID0gX2dldERhdGFTb3VyY2VBcnJheS5jYWxsKHRoaXMpO1xuICAgIGlmICghYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGluZGV4T3JJZCA8IDAgfHwgaW5kZXhPcklkID49IGFycmF5Lmxlbmd0aCkge1xuICAgICAgICB0aHJvdyAnSW52YWxpZCBpbmRleCAoJyArIGluZGV4T3JJZCArICcpIHNwZWNpZmllZCB0byAucmVwbGFjZSc7XG4gICAgfVxuICAgIG9sZFJlbmRlcmFibGUgPSBhcnJheVtpbmRleE9ySWRdO1xuICAgIGlmIChvbGRSZW5kZXJhYmxlICE9PSByZW5kZXJhYmxlKSB7XG4gICAgICAgIGFycmF5W2luZGV4T3JJZF0gPSByZW5kZXJhYmxlO1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIG9sZFJlbmRlcmFibGU7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUubW92ZSA9IGZ1bmN0aW9uIChpbmRleCwgbmV3SW5kZXgpIHtcbiAgICB2YXIgYXJyYXkgPSBfZ2V0RGF0YVNvdXJjZUFycmF5LmNhbGwodGhpcyk7XG4gICAgaWYgKCFhcnJheSkge1xuICAgICAgICB0aHJvdyAnLm1vdmUgaXMgb25seSBzdXBwb3J0ZWQgZm9yIGRhdGFTb3VyY2VzIG9mIHR5cGUgQXJyYXkgb3IgVmlld1NlcXVlbmNlJztcbiAgICB9XG4gICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSBhcnJheS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgJ0ludmFsaWQgaW5kZXggKCcgKyBpbmRleCArICcpIHNwZWNpZmllZCB0byAubW92ZSc7XG4gICAgfVxuICAgIGlmIChuZXdJbmRleCA8IDAgfHwgbmV3SW5kZXggPj0gYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIHRocm93ICdJbnZhbGlkIG5ld0luZGV4ICgnICsgbmV3SW5kZXggKyAnKSBzcGVjaWZpZWQgdG8gLm1vdmUnO1xuICAgIH1cbiAgICB2YXIgaXRlbSA9IGFycmF5LnNwbGljZShpbmRleCwgMSlbMF07XG4gICAgYXJyYXkuc3BsaWNlKG5ld0luZGV4LCAwLCBpdGVtKTtcbiAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoaW5kZXhPcklkLCByZW1vdmVTcGVjKSB7XG4gICAgdmFyIHJlbmRlck5vZGU7XG4gICAgaWYgKHRoaXMuX25vZGVzQnlJZCB8fCBpbmRleE9ySWQgaW5zdGFuY2VvZiBTdHJpbmcgfHwgdHlwZW9mIGluZGV4T3JJZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgaWYgKGluZGV4T3JJZCBpbnN0YW5jZW9mIFN0cmluZyB8fCB0eXBlb2YgaW5kZXhPcklkID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmVuZGVyTm9kZSA9IHRoaXMuX25vZGVzQnlJZFtpbmRleE9ySWRdO1xuICAgICAgICAgICAgaWYgKHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5fbm9kZXNCeUlkW2luZGV4T3JJZF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5fbm9kZXNCeUlkKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX25vZGVzQnlJZFtrZXldID09PSBpbmRleE9ySWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX25vZGVzQnlJZFtrZXldO1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlID0gaW5kZXhPcklkO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGluZGV4T3JJZCBpbnN0YW5jZW9mIE51bWJlciB8fCB0eXBlb2YgaW5kZXhPcklkID09PSAnbnVtYmVyJykge1xuICAgICAgICB2YXIgYXJyYXkgPSBfZ2V0RGF0YVNvdXJjZUFycmF5LmNhbGwodGhpcyk7XG4gICAgICAgIGlmICghYXJyYXkgfHwgaW5kZXhPcklkIDwgMCB8fCBpbmRleE9ySWQgPj0gYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyAnSW52YWxpZCBpbmRleCAoJyArIGluZGV4T3JJZCArICcpIHNwZWNpZmllZCB0byAucmVtb3ZlIChvciBkYXRhU291cmNlIGRvZXNuXFwndCBzdXBwb3J0IHJlbW92ZSknO1xuICAgICAgICB9XG4gICAgICAgIHJlbmRlck5vZGUgPSBhcnJheVtpbmRleE9ySWRdO1xuICAgICAgICB0aGlzLl9kYXRhU291cmNlLnNwbGljZShpbmRleE9ySWQsIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGV4T3JJZCA9IHRoaXMuX2RhdGFTb3VyY2UuaW5kZXhPZihpbmRleE9ySWQpO1xuICAgICAgICBpZiAoaW5kZXhPcklkID49IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2RhdGFTb3VyY2Uuc3BsaWNlKGluZGV4T3JJZCwgMSk7XG4gICAgICAgICAgICByZW5kZXJOb2RlID0gaW5kZXhPcklkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLl92aWV3U2VxdWVuY2UgJiYgcmVuZGVyTm9kZSkge1xuICAgICAgICB2YXIgdmlld1NlcXVlbmNlID0gX2dldFZpZXdTZXF1ZW5jZUF0SW5kZXguY2FsbCh0aGlzLCB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSwgdGhpcy5faW5pdGlhbFZpZXdTZXF1ZW5jZSk7XG4gICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZSB8fCBfZ2V0Vmlld1NlcXVlbmNlQXRJbmRleC5jYWxsKHRoaXMsIHRoaXMuX3ZpZXdTZXF1ZW5jZS5nZXRJbmRleCgpIC0gMSwgdGhpcy5faW5pdGlhbFZpZXdTZXF1ZW5jZSk7XG4gICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZSB8fCB0aGlzLl9kYXRhU291cmNlO1xuICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2U7XG4gICAgfVxuICAgIGlmIChyZW5kZXJOb2RlICYmIHJlbW92ZVNwZWMpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXROb2RlQnlSZW5kZXJOb2RlKHJlbmRlck5vZGUpO1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgbm9kZS5yZW1vdmUocmVtb3ZlU3BlYyB8fCB0aGlzLm9wdGlvbnMuZmxvd09wdGlvbnMucmVtb3ZlU3BlYyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlbmRlck5vZGUpIHtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZW5kZXJOb2RlO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLnJlbW92ZUFsbCA9IGZ1bmN0aW9uIChyZW1vdmVTcGVjKSB7XG4gICAgaWYgKHRoaXMuX25vZGVzQnlJZCkge1xuICAgICAgICB2YXIgZGlydHkgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIHRoaXMuX25vZGVzQnlJZCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX25vZGVzQnlJZFtrZXldO1xuICAgICAgICAgICAgZGlydHkgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkaXJ0eSkge1xuICAgICAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuX2RhdGFTb3VyY2UpIHtcbiAgICAgICAgdGhpcy5zZXREYXRhU291cmNlKFtdKTtcbiAgICB9XG4gICAgaWYgKHJlbW92ZVNwZWMpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKCk7XG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZShyZW1vdmVTcGVjIHx8IHRoaXMub3B0aW9ucy5mbG93T3B0aW9ucy5yZW1vdmVTcGVjKTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NpemUgfHwgdGhpcy5vcHRpb25zLnNpemU7XG59O1xuTGF5b3V0Q29udHJvbGxlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xufTtcbkxheW91dENvbnRyb2xsZXIucHJvdG90eXBlLmNvbW1pdCA9IGZ1bmN0aW9uIGNvbW1pdChjb250ZXh0KSB7XG4gICAgdmFyIHRyYW5zZm9ybSA9IGNvbnRleHQudHJhbnNmb3JtO1xuICAgIHZhciBvcmlnaW4gPSBjb250ZXh0Lm9yaWdpbjtcbiAgICB2YXIgc2l6ZSA9IGNvbnRleHQuc2l6ZTtcbiAgICB2YXIgb3BhY2l0eSA9IGNvbnRleHQub3BhY2l0eTtcbiAgICBpZiAodGhpcy5fcmVzZXRGbG93U3RhdGUpIHtcbiAgICAgICAgdGhpcy5fcmVzZXRGbG93U3RhdGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgICAgIHRoaXMuX25vZGVzLnJlbW92ZUFsbCgpO1xuICAgIH1cbiAgICBpZiAoc2l6ZVswXSAhPT0gdGhpcy5fY29udGV4dFNpemVDYWNoZVswXSB8fCBzaXplWzFdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzFdIHx8IHRoaXMuX2lzRGlydHkgfHwgdGhpcy5fbm9kZXMuX3RydWVTaXplUmVxdWVzdGVkIHx8IHRoaXMub3B0aW9ucy5hbHdheXNMYXlvdXQpIHtcbiAgICAgICAgdmFyIGV2ZW50RGF0YSA9IHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHRoaXMsXG4gICAgICAgICAgICAgICAgb2xkU2l6ZTogdGhpcy5fY29udGV4dFNpemVDYWNoZSxcbiAgICAgICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgICAgIGRpcnR5OiB0aGlzLl9pc0RpcnR5LFxuICAgICAgICAgICAgICAgIHRydWVTaXplUmVxdWVzdGVkOiB0aGlzLl9ub2Rlcy5fdHJ1ZVNpemVSZXF1ZXN0ZWRcbiAgICAgICAgICAgIH07XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ2xheW91dHN0YXJ0JywgZXZlbnREYXRhKTtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mbG93KSB7XG4gICAgICAgICAgICB2YXIgbG9jayA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuZmxvd09wdGlvbnMucmVmbG93T25SZXNpemUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2lzRGlydHkgJiYgKHNpemVbMF0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMF0gfHwgc2l6ZVsxXSAhPT0gdGhpcy5fY29udGV4dFNpemVDYWNoZVsxXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jayA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsb2NrID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobG9jayAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKCk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5yZWxlYXNlTG9jayhsb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMF0gPSBzaXplWzBdO1xuICAgICAgICB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzFdID0gc2l6ZVsxXTtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IGZhbHNlO1xuICAgICAgICB2YXIgc2Nyb2xsRW5kO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLnNpemUgJiYgdGhpcy5vcHRpb25zLnNpemVbdGhpcy5fZGlyZWN0aW9uXSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgc2Nyb2xsRW5kID0gMTAwMDAwMDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGF5b3V0Q29udGV4dCA9IHRoaXMuX25vZGVzLnByZXBhcmVGb3JMYXlvdXQodGhpcy5fdmlld1NlcXVlbmNlLCB0aGlzLl9ub2Rlc0J5SWQsIHtcbiAgICAgICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogdGhpcy5fZGlyZWN0aW9uLFxuICAgICAgICAgICAgICAgIHNjcm9sbEVuZDogc2Nyb2xsRW5kXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuX2xheW91dC5fZnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuX2xheW91dC5fZnVuY3Rpb24obGF5b3V0Q29udGV4dCwgdGhpcy5fbGF5b3V0Lm9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX25vZGVzLnJlbW92ZU5vbkludmFsaWRhdGVkTm9kZXModGhpcy5vcHRpb25zLmZsb3dPcHRpb25zLnJlbW92ZVNwZWMpO1xuICAgICAgICB0aGlzLl9ub2Rlcy5yZW1vdmVWaXJ0dWFsVmlld1NlcXVlbmNlTm9kZXMoKTtcbiAgICAgICAgaWYgKHNjcm9sbEVuZCkge1xuICAgICAgICAgICAgc2Nyb2xsRW5kID0gMDtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKCk7XG4gICAgICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLl9pbnZhbGlkYXRlZCAmJiBub2RlLnNjcm9sbExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzY3JvbGxFbmQgKz0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2l6ZSA9IHRoaXMuX3NpemUgfHwgW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHRoaXMuX3NpemVbMF0gPSB0aGlzLm9wdGlvbnMuc2l6ZVswXTtcbiAgICAgICAgICAgIHRoaXMuX3NpemVbMV0gPSB0aGlzLm9wdGlvbnMuc2l6ZVsxXTtcbiAgICAgICAgICAgIHRoaXMuX3NpemVbdGhpcy5fZGlyZWN0aW9uXSA9IHNjcm9sbEVuZDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy5fbm9kZXMuYnVpbGRTcGVjQW5kRGVzdHJveVVucmVuZGVyZWROb2RlcygpO1xuICAgICAgICB0aGlzLl9zcGVjcyA9IHJlc3VsdC5zcGVjcztcbiAgICAgICAgdGhpcy5fY29tbWl0T3V0cHV0LnRhcmdldCA9IHJlc3VsdC5zcGVjcztcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnbGF5b3V0ZW5kJywgZXZlbnREYXRhKTtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgncmVmbG93JywgeyB0YXJnZXQ6IHRoaXMgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuZmxvdykge1xuICAgICAgICByZXN1bHQgPSB0aGlzLl9ub2Rlcy5idWlsZFNwZWNBbmREZXN0cm95VW5yZW5kZXJlZE5vZGVzKCk7XG4gICAgICAgIHRoaXMuX3NwZWNzID0gcmVzdWx0LnNwZWNzO1xuICAgICAgICB0aGlzLl9jb21taXRPdXRwdXQudGFyZ2V0ID0gcmVzdWx0LnNwZWNzO1xuICAgICAgICBpZiAocmVzdWx0Lm1vZGlmaWVkKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdyZWZsb3cnLCB7IHRhcmdldDogdGhpcyB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy5fY29tbWl0T3V0cHV0LnRhcmdldDtcbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IHRhcmdldC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgaWYgKHRhcmdldFtpXS5yZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICB0YXJnZXRbaV0udGFyZ2V0ID0gdGFyZ2V0W2ldLnJlbmRlck5vZGUucmVuZGVyKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCF0YXJnZXQubGVuZ3RoIHx8IHRhcmdldFt0YXJnZXQubGVuZ3RoIC0gMV0gIT09IHRoaXMuX2NsZWFudXBSZWdpc3RyYXRpb24pIHtcbiAgICAgICAgdGFyZ2V0LnB1c2godGhpcy5fY2xlYW51cFJlZ2lzdHJhdGlvbik7XG4gICAgfVxuICAgIGlmIChvcmlnaW4gJiYgKG9yaWdpblswXSAhPT0gMCB8fCBvcmlnaW5bMV0gIT09IDApKSB7XG4gICAgICAgIHRyYW5zZm9ybSA9IFRyYW5zZm9ybS5tb3ZlVGhlbihbXG4gICAgICAgICAgICAtc2l6ZVswXSAqIG9yaWdpblswXSxcbiAgICAgICAgICAgIC1zaXplWzFdICogb3JpZ2luWzFdLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLCB0cmFuc2Zvcm0pO1xuICAgIH1cbiAgICB0aGlzLl9jb21taXRPdXRwdXQuc2l6ZSA9IHNpemU7XG4gICAgdGhpcy5fY29tbWl0T3V0cHV0Lm9wYWNpdHkgPSBvcGFjaXR5O1xuICAgIHRoaXMuX2NvbW1pdE91dHB1dC50cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgcmV0dXJuIHRoaXMuX2NvbW1pdE91dHB1dDtcbn07XG5MYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5jbGVhbnVwID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmZsb3cpIHtcbiAgICAgICAgdGhpcy5fcmVzZXRGbG93U3RhdGUgPSB0cnVlO1xuICAgIH1cbn07XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dENvbnRyb2xsZXI7IiwidmFyIFRyYW5zZm9ybSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlRyYW5zZm9ybSA6IG51bGw7XG52YXIgTGF5b3V0VXRpbGl0eSA9IHJlcXVpcmUoJy4vTGF5b3V0VXRpbGl0eScpO1xuZnVuY3Rpb24gTGF5b3V0Tm9kZShyZW5kZXJOb2RlLCBzcGVjKSB7XG4gICAgdGhpcy5yZW5kZXJOb2RlID0gcmVuZGVyTm9kZTtcbiAgICB0aGlzLl9zcGVjID0gc3BlYyA/IExheW91dFV0aWxpdHkuY2xvbmVTcGVjKHNwZWMpIDoge307XG4gICAgdGhpcy5fc3BlYy5yZW5kZXJOb2RlID0gcmVuZGVyTm9kZTtcbiAgICB0aGlzLl9zcGVjTW9kaWZpZWQgPSB0cnVlO1xuICAgIHRoaXMuX2ludmFsaWRhdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fcmVtb3ZpbmcgPSBmYWxzZTtcbn1cbkxheW91dE5vZGUucHJvdG90eXBlLnNldFJlbmRlck5vZGUgPSBmdW5jdGlvbiAocmVuZGVyTm9kZSkge1xuICAgIHRoaXMucmVuZGVyTm9kZSA9IHJlbmRlck5vZGU7XG4gICAgdGhpcy5fc3BlYy5yZW5kZXJOb2RlID0gcmVuZGVyTm9kZTtcbn07XG5MYXlvdXROb2RlLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbn07XG5MYXlvdXROb2RlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVuZGVyTm9kZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zcGVjLnJlbmRlck5vZGUgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fdmlld1NlcXVlbmNlID0gdW5kZWZpbmVkO1xufTtcbkxheW91dE5vZGUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX2ludmFsaWRhdGVkID0gZmFsc2U7XG4gICAgdGhpcy50cnVlU2l6ZVJlcXVlc3RlZCA9IGZhbHNlO1xufTtcbkxheW91dE5vZGUucHJvdG90eXBlLnNldFNwZWMgPSBmdW5jdGlvbiAoc3BlYykge1xuICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9IHRydWU7XG4gICAgaWYgKHNwZWMuYWxpZ24pIHtcbiAgICAgICAgaWYgKCFzcGVjLmFsaWduKSB7XG4gICAgICAgICAgICB0aGlzLl9zcGVjLmFsaWduID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zcGVjLmFsaWduWzBdID0gc3BlYy5hbGlnblswXTtcbiAgICAgICAgdGhpcy5fc3BlYy5hbGlnblsxXSA9IHNwZWMuYWxpZ25bMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3BlYy5hbGlnbiA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHNwZWMub3JpZ2luKSB7XG4gICAgICAgIGlmICghc3BlYy5vcmlnaW4pIHtcbiAgICAgICAgICAgIHRoaXMuX3NwZWMub3JpZ2luID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zcGVjLm9yaWdpblswXSA9IHNwZWMub3JpZ2luWzBdO1xuICAgICAgICB0aGlzLl9zcGVjLm9yaWdpblsxXSA9IHNwZWMub3JpZ2luWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NwZWMub3JpZ2luID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoc3BlYy5zaXplKSB7XG4gICAgICAgIGlmICghc3BlYy5zaXplKSB7XG4gICAgICAgICAgICB0aGlzLl9zcGVjLnNpemUgPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3NwZWMuc2l6ZVswXSA9IHNwZWMuc2l6ZVswXTtcbiAgICAgICAgdGhpcy5fc3BlYy5zaXplWzFdID0gc3BlYy5zaXplWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3NwZWMuc2l6ZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHNwZWMudHJhbnNmb3JtKSB7XG4gICAgICAgIGlmICghc3BlYy50cmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIHRoaXMuX3NwZWMudHJhbnNmb3JtID0gc3BlYy50cmFuc2Zvcm0uc2xpY2UoMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zcGVjLnRyYW5zZm9ybVtpXSA9IHNwZWMudHJhbnNmb3JtW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3BlYy50cmFuc2Zvcm0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMuX3NwZWMub3BhY2l0eSA9IHNwZWMub3BhY2l0eTtcbn07XG5MYXlvdXROb2RlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoc2V0LCBzaXplKSB7XG4gICAgdGhpcy5faW52YWxpZGF0ZWQgPSB0cnVlO1xuICAgIHRoaXMuX3NwZWNNb2RpZmllZCA9IHRydWU7XG4gICAgdGhpcy5fcmVtb3ZpbmcgPSBmYWxzZTtcbiAgICB2YXIgc3BlYyA9IHRoaXMuX3NwZWM7XG4gICAgc3BlYy5vcGFjaXR5ID0gc2V0Lm9wYWNpdHk7XG4gICAgaWYgKHNldC5zaXplKSB7XG4gICAgICAgIGlmICghc3BlYy5zaXplKSB7XG4gICAgICAgICAgICBzcGVjLnNpemUgPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHNwZWMuc2l6ZVswXSA9IHNldC5zaXplWzBdO1xuICAgICAgICBzcGVjLnNpemVbMV0gPSBzZXQuc2l6ZVsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGVjLnNpemUgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChzZXQub3JpZ2luKSB7XG4gICAgICAgIGlmICghc3BlYy5vcmlnaW4pIHtcbiAgICAgICAgICAgIHNwZWMub3JpZ2luID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuICAgICAgICBzcGVjLm9yaWdpblswXSA9IHNldC5vcmlnaW5bMF07XG4gICAgICAgIHNwZWMub3JpZ2luWzFdID0gc2V0Lm9yaWdpblsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBzcGVjLm9yaWdpbiA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHNldC5hbGlnbikge1xuICAgICAgICBpZiAoIXNwZWMuYWxpZ24pIHtcbiAgICAgICAgICAgIHNwZWMuYWxpZ24gPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHNwZWMuYWxpZ25bMF0gPSBzZXQuYWxpZ25bMF07XG4gICAgICAgIHNwZWMuYWxpZ25bMV0gPSBzZXQuYWxpZ25bMV07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3BlYy5hbGlnbiA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKHNldC5za2V3IHx8IHNldC5yb3RhdGUgfHwgc2V0LnNjYWxlKSB7XG4gICAgICAgIHRoaXMuX3NwZWMudHJhbnNmb3JtID0gVHJhbnNmb3JtLmJ1aWxkKHtcbiAgICAgICAgICAgIHRyYW5zbGF0ZTogc2V0LnRyYW5zbGF0ZSB8fCBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBza2V3OiBzZXQuc2tldyB8fCBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBzY2FsZTogc2V0LnNjYWxlIHx8IFtcbiAgICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJvdGF0ZTogc2V0LnJvdGF0ZSB8fCBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDBcbiAgICAgICAgICAgIF1cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChzZXQudHJhbnNsYXRlKSB7XG4gICAgICAgIHRoaXMuX3NwZWMudHJhbnNmb3JtID0gVHJhbnNmb3JtLnRyYW5zbGF0ZShzZXQudHJhbnNsYXRlWzBdLCBzZXQudHJhbnNsYXRlWzFdLCBzZXQudHJhbnNsYXRlWzJdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zcGVjLnRyYW5zZm9ybSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy5zY3JvbGxMZW5ndGggPSBzZXQuc2Nyb2xsTGVuZ3RoO1xufTtcbkxheW91dE5vZGUucHJvdG90eXBlLmdldFNwZWMgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fc3BlY01vZGlmaWVkID0gZmFsc2U7XG4gICAgdGhpcy5fc3BlYy5yZW1vdmVkID0gIXRoaXMuX2ludmFsaWRhdGVkO1xuICAgIHJldHVybiB0aGlzLl9zcGVjO1xufTtcbkxheW91dE5vZGUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChyZW1vdmVTcGVjKSB7XG4gICAgdGhpcy5fcmVtb3ZpbmcgPSB0cnVlO1xufTtcbm1vZHVsZS5leHBvcnRzID0gTGF5b3V0Tm9kZTsiLCJ2YXIgTGF5b3V0Q29udGV4dCA9IHJlcXVpcmUoJy4vTGF5b3V0Q29udGV4dCcpO1xudmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuL0xheW91dFV0aWxpdHknKTtcbnZhciBNQVhfUE9PTF9TSVpFID0gMTAwO1xuZnVuY3Rpb24gTGF5b3V0Tm9kZU1hbmFnZXIoTGF5b3V0Tm9kZSwgaW5pdExheW91dE5vZGVGbikge1xuICAgIHRoaXMuTGF5b3V0Tm9kZSA9IExheW91dE5vZGU7XG4gICAgdGhpcy5faW5pdExheW91dE5vZGVGbiA9IGluaXRMYXlvdXROb2RlRm47XG4gICAgdGhpcy5fbGF5b3V0Q291bnQgPSAwO1xuICAgIHRoaXMuX2NvbnRleHQgPSBuZXcgTGF5b3V0Q29udGV4dCh7XG4gICAgICAgIG5leHQ6IF9jb250ZXh0TmV4dC5iaW5kKHRoaXMpLFxuICAgICAgICBwcmV2OiBfY29udGV4dFByZXYuYmluZCh0aGlzKSxcbiAgICAgICAgZ2V0OiBfY29udGV4dEdldC5iaW5kKHRoaXMpLFxuICAgICAgICBzZXQ6IF9jb250ZXh0U2V0LmJpbmQodGhpcyksXG4gICAgICAgIHJlc29sdmVTaXplOiBfY29udGV4dFJlc29sdmVTaXplLmJpbmQodGhpcyksXG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9KTtcbiAgICB0aGlzLl9jb250ZXh0U3RhdGUgPSB7fTtcbiAgICB0aGlzLl9wb29sID0ge1xuICAgICAgICBsYXlvdXROb2RlczogeyBzaXplOiAwIH0sXG4gICAgICAgIHJlc29sdmVTaXplOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdXG4gICAgfTtcbn1cbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5wcmVwYXJlRm9yTGF5b3V0ID0gZnVuY3Rpb24gKHZpZXdTZXF1ZW5jZSwgbm9kZXNCeUlkLCBjb250ZXh0RGF0YSkge1xuICAgIHZhciBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgbm9kZS5yZXNldCgpO1xuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLl9jb250ZXh0O1xuICAgIHRoaXMuX2xheW91dENvdW50Kys7XG4gICAgdGhpcy5fbm9kZXNCeUlkID0gbm9kZXNCeUlkO1xuICAgIHRoaXMuX3RydWVTaXplUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgdGhpcy5fcmVldmFsVHJ1ZVNpemUgPSBjb250ZXh0RGF0YS5yZWV2YWxUcnVlU2l6ZSB8fCAhY29udGV4dC5zaXplIHx8IGNvbnRleHQuc2l6ZVswXSAhPT0gY29udGV4dERhdGEuc2l6ZVswXSB8fCBjb250ZXh0LnNpemVbMV0gIT09IGNvbnRleHREYXRhLnNpemVbMV07XG4gICAgdmFyIGNvbnRleHRTdGF0ZSA9IHRoaXMuX2NvbnRleHRTdGF0ZTtcbiAgICBjb250ZXh0U3RhdGUuc3RhcnRTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZTtcbiAgICBjb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlID0gdmlld1NlcXVlbmNlO1xuICAgIGNvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UgPSB2aWV3U2VxdWVuY2U7XG4gICAgY29udGV4dFN0YXRlLnN0YXJ0ID0gdW5kZWZpbmVkO1xuICAgIGNvbnRleHRTdGF0ZS5uZXh0R2V0SW5kZXggPSAwO1xuICAgIGNvbnRleHRTdGF0ZS5wcmV2R2V0SW5kZXggPSAwO1xuICAgIGNvbnRleHRTdGF0ZS5uZXh0U2V0SW5kZXggPSAwO1xuICAgIGNvbnRleHRTdGF0ZS5wcmV2U2V0SW5kZXggPSAwO1xuICAgIGNvbnRleHRTdGF0ZS5hZGRDb3VudCA9IDA7XG4gICAgY29udGV4dFN0YXRlLnJlbW92ZUNvdW50ID0gMDtcbiAgICBjb250ZXh0U3RhdGUubGFzdFJlbmRlck5vZGUgPSB1bmRlZmluZWQ7XG4gICAgY29udGV4dC5zaXplWzBdID0gY29udGV4dERhdGEuc2l6ZVswXTtcbiAgICBjb250ZXh0LnNpemVbMV0gPSBjb250ZXh0RGF0YS5zaXplWzFdO1xuICAgIGNvbnRleHQuZGlyZWN0aW9uID0gY29udGV4dERhdGEuZGlyZWN0aW9uO1xuICAgIGNvbnRleHQucmV2ZXJzZSA9IGNvbnRleHREYXRhLnJldmVyc2U7XG4gICAgY29udGV4dC5hbGlnbm1lbnQgPSBjb250ZXh0RGF0YS5yZXZlcnNlID8gMSA6IDA7XG4gICAgY29udGV4dC5zY3JvbGxPZmZzZXQgPSBjb250ZXh0RGF0YS5zY3JvbGxPZmZzZXQgfHwgMDtcbiAgICBjb250ZXh0LnNjcm9sbFN0YXJ0ID0gY29udGV4dERhdGEuc2Nyb2xsU3RhcnQgfHwgMDtcbiAgICBjb250ZXh0LnNjcm9sbEVuZCA9IGNvbnRleHREYXRhLnNjcm9sbEVuZCB8fCBjb250ZXh0LnNpemVbY29udGV4dC5kaXJlY3Rpb25dO1xuICAgIHJldHVybiBjb250ZXh0O1xufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5yZW1vdmVOb25JbnZhbGlkYXRlZE5vZGVzID0gZnVuY3Rpb24gKHJlbW92ZVNwZWMpIHtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgJiYgIW5vZGUuX3JlbW92aW5nKSB7XG4gICAgICAgICAgICBub2RlLnJlbW92ZShyZW1vdmVTcGVjKTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG59O1xuTGF5b3V0Tm9kZU1hbmFnZXIucHJvdG90eXBlLnJlbW92ZVZpcnR1YWxWaWV3U2VxdWVuY2VOb2RlcyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0U2VxdWVuY2UgJiYgdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0U2VxdWVuY2UuY2xlYW51cCkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUuc3RhcnRTZXF1ZW5jZS5jbGVhbnVwKCk7XG4gICAgfVxufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5idWlsZFNwZWNBbmREZXN0cm95VW5yZW5kZXJlZE5vZGVzID0gZnVuY3Rpb24gKHRyYW5zbGF0ZSkge1xuICAgIHZhciBzcGVjcyA9IFtdO1xuICAgIHZhciByZXN1bHQgPSB7XG4gICAgICAgICAgICBzcGVjczogc3BlY3MsXG4gICAgICAgICAgICBtb2RpZmllZDogZmFsc2VcbiAgICAgICAgfTtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIHZhciBtb2RpZmllZCA9IG5vZGUuX3NwZWNNb2RpZmllZDtcbiAgICAgICAgdmFyIHNwZWMgPSBub2RlLmdldFNwZWMoKTtcbiAgICAgICAgaWYgKHNwZWMucmVtb3ZlZCkge1xuICAgICAgICAgICAgdmFyIGRlc3Ryb3lOb2RlID0gbm9kZTtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgICAgICAgICAgX2Rlc3Ryb3lOb2RlLmNhbGwodGhpcywgZGVzdHJveU5vZGUpO1xuICAgICAgICAgICAgcmVzdWx0Lm1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChtb2RpZmllZCkge1xuICAgICAgICAgICAgICAgIGlmIChzcGVjLnRyYW5zZm9ybSAmJiB0cmFuc2xhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTJdICs9IHRyYW5zbGF0ZVswXTtcbiAgICAgICAgICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTNdICs9IHRyYW5zbGF0ZVsxXTtcbiAgICAgICAgICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTRdICs9IHRyYW5zbGF0ZVsyXTtcbiAgICAgICAgICAgICAgICAgICAgc3BlYy50cmFuc2Zvcm1bMTJdID0gTWF0aC5yb3VuZChzcGVjLnRyYW5zZm9ybVsxMl0gKiAxMDAwMDApIC8gMTAwMDAwO1xuICAgICAgICAgICAgICAgICAgICBzcGVjLnRyYW5zZm9ybVsxM10gPSBNYXRoLnJvdW5kKHNwZWMudHJhbnNmb3JtWzEzXSAqIDEwMDAwMCkgLyAxMDAwMDA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzcGVjLmVuZFN0YXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmVuZFN0YXRlLnRyYW5zZm9ybVsxMl0gKz0gdHJhbnNsYXRlWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BlYy5lbmRTdGF0ZS50cmFuc2Zvcm1bMTNdICs9IHRyYW5zbGF0ZVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwZWMuZW5kU3RhdGUudHJhbnNmb3JtWzE0XSArPSB0cmFuc2xhdGVbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmVuZFN0YXRlLnRyYW5zZm9ybVsxMl0gPSBNYXRoLnJvdW5kKHNwZWMuZW5kU3RhdGUudHJhbnNmb3JtWzEyXSAqIDEwMDAwMCkgLyAxMDAwMDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGVjLmVuZFN0YXRlLnRyYW5zZm9ybVsxM10gPSBNYXRoLnJvdW5kKHNwZWMuZW5kU3RhdGUudHJhbnNmb3JtWzEzXSAqIDEwMDAwMCkgLyAxMDAwMDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0Lm1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNwZWNzLnB1c2goc3BlYyk7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9jb250ZXh0U3RhdGUuYWRkQ291bnQgPSAwO1xuICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5yZW1vdmVDb3VudCA9IDA7XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5MYXlvdXROb2RlTWFuYWdlci5wcm90b3R5cGUuZ2V0Tm9kZUJ5UmVuZGVyTm9kZSA9IGZ1bmN0aW9uIChyZW5kZXJhYmxlKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9maXJzdDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5yZW5kZXJOb2RlID09PSByZW5kZXJhYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn07XG5MYXlvdXROb2RlTWFuYWdlci5wcm90b3R5cGUuaW5zZXJ0Tm9kZSA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgbm9kZS5fbmV4dCA9IHRoaXMuX2ZpcnN0O1xuICAgIGlmICh0aGlzLl9maXJzdCkge1xuICAgICAgICB0aGlzLl9maXJzdC5fcHJldiA9IG5vZGU7XG4gICAgfVxuICAgIHRoaXMuX2ZpcnN0ID0gbm9kZTtcbn07XG5MYXlvdXROb2RlTWFuYWdlci5wcm90b3R5cGUuc2V0Tm9kZU9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMuX25vZGVPcHRpb25zID0gb3B0aW9ucztcbiAgICB2YXIgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIG5vZGUuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIG5vZGUgPSB0aGlzLl9wb29sLmxheW91dE5vZGVzLmZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIG5vZGUuc2V0T3B0aW9ucyhvcHRpb25zKTtcbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5wcmVhbGxvY2F0ZU5vZGVzID0gZnVuY3Rpb24gKGNvdW50LCBzcGVjKSB7XG4gICAgdmFyIG5vZGVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgIG5vZGVzLnB1c2godGhpcy5jcmVhdGVOb2RlKHVuZGVmaW5lZCwgc3BlYykpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICBfZGVzdHJveU5vZGUuY2FsbCh0aGlzLCBub2Rlc1tpXSk7XG4gICAgfVxufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5jcmVhdGVOb2RlID0gZnVuY3Rpb24gKHJlbmRlck5vZGUsIHNwZWMpIHtcbiAgICB2YXIgbm9kZTtcbiAgICBpZiAodGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5maXJzdCkge1xuICAgICAgICBub2RlID0gdGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5maXJzdDtcbiAgICAgICAgdGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5maXJzdCA9IG5vZGUuX25leHQ7XG4gICAgICAgIHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuc2l6ZS0tO1xuICAgICAgICBub2RlLmNvbnN0cnVjdG9yLmFwcGx5KG5vZGUsIGFyZ3VtZW50cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbm9kZSA9IG5ldyB0aGlzLkxheW91dE5vZGUocmVuZGVyTm9kZSwgc3BlYyk7XG4gICAgICAgIGlmICh0aGlzLl9ub2RlT3B0aW9ucykge1xuICAgICAgICAgICAgbm9kZS5zZXRPcHRpb25zKHRoaXMuX25vZGVPcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBub2RlLl9wcmV2ID0gdW5kZWZpbmVkO1xuICAgIG5vZGUuX25leHQgPSB1bmRlZmluZWQ7XG4gICAgbm9kZS5fdmlld1NlcXVlbmNlID0gdW5kZWZpbmVkO1xuICAgIG5vZGUuX2xheW91dENvdW50ID0gMDtcbiAgICBpZiAodGhpcy5faW5pdExheW91dE5vZGVGbikge1xuICAgICAgICB0aGlzLl9pbml0TGF5b3V0Tm9kZUZuLmNhbGwodGhpcywgbm9kZSwgc3BlYyk7XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xufTtcbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9maXJzdDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICB2YXIgbmV4dCA9IG5vZGUuX25leHQ7XG4gICAgICAgIF9kZXN0cm95Tm9kZS5jYWxsKHRoaXMsIG5vZGUpO1xuICAgICAgICBub2RlID0gbmV4dDtcbiAgICB9XG4gICAgdGhpcy5fZmlyc3QgPSB1bmRlZmluZWQ7XG59O1xuZnVuY3Rpb24gX2Rlc3Ryb3lOb2RlKG5vZGUpIHtcbiAgICBpZiAobm9kZS5fbmV4dCkge1xuICAgICAgICBub2RlLl9uZXh0Ll9wcmV2ID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgaWYgKG5vZGUuX3ByZXYpIHtcbiAgICAgICAgbm9kZS5fcHJldi5fbmV4dCA9IG5vZGUuX25leHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fZmlyc3QgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBub2RlLmRlc3Ryb3koKTtcbiAgICBpZiAodGhpcy5fcG9vbC5sYXlvdXROb2Rlcy5zaXplIDwgTUFYX1BPT0xfU0laRSkge1xuICAgICAgICB0aGlzLl9wb29sLmxheW91dE5vZGVzLnNpemUrKztcbiAgICAgICAgbm9kZS5fcHJldiA9IHVuZGVmaW5lZDtcbiAgICAgICAgbm9kZS5fbmV4dCA9IHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3Q7XG4gICAgICAgIHRoaXMuX3Bvb2wubGF5b3V0Tm9kZXMuZmlyc3QgPSBub2RlO1xuICAgIH1cbn1cbkxheW91dE5vZGVNYW5hZ2VyLnByb3RvdHlwZS5nZXRTdGFydEVudW1Ob2RlID0gZnVuY3Rpb24gKG5leHQpIHtcbiAgICBpZiAobmV4dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maXJzdDtcbiAgICB9IGVsc2UgaWYgKG5leHQgPT09IHRydWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydCAmJiB0aGlzLl9jb250ZXh0U3RhdGUuc3RhcnRQcmV2ID8gdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0Ll9uZXh0IDogdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0O1xuICAgIH0gZWxzZSBpZiAobmV4dCA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydCAmJiAhdGhpcy5fY29udGV4dFN0YXRlLnN0YXJ0UHJldiA/IHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydC5fcHJldiA6IHRoaXMuX2NvbnRleHRTdGF0ZS5zdGFydDtcbiAgICB9XG59O1xuZnVuY3Rpb24gX2NvbnRleHRHZXRDcmVhdGVBbmRPcmRlck5vZGVzKHJlbmRlck5vZGUsIHByZXYpIHtcbiAgICB2YXIgbm9kZTtcbiAgICB2YXIgc3RhdGUgPSB0aGlzLl9jb250ZXh0U3RhdGU7XG4gICAgaWYgKCFzdGF0ZS5zdGFydCkge1xuICAgICAgICBub2RlID0gdGhpcy5fZmlyc3Q7XG4gICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5yZW5kZXJOb2RlID09PSByZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLmNyZWF0ZU5vZGUocmVuZGVyTm9kZSk7XG4gICAgICAgICAgICBub2RlLl9uZXh0ID0gdGhpcy5fZmlyc3Q7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmlyc3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9maXJzdC5fcHJldiA9IG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9maXJzdCA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuc3RhcnQgPSBub2RlO1xuICAgICAgICBzdGF0ZS5zdGFydFByZXYgPSBwcmV2O1xuICAgICAgICBzdGF0ZS5wcmV2ID0gbm9kZTtcbiAgICAgICAgc3RhdGUubmV4dCA9IG5vZGU7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICBpZiAocHJldikge1xuICAgICAgICBpZiAoc3RhdGUucHJldi5fcHJldiAmJiBzdGF0ZS5wcmV2Ll9wcmV2LnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIHN0YXRlLnByZXYgPSBzdGF0ZS5wcmV2Ll9wcmV2O1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLnByZXY7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoc3RhdGUubmV4dC5fbmV4dCAmJiBzdGF0ZS5uZXh0Ll9uZXh0LnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIHN0YXRlLm5leHQgPSBzdGF0ZS5uZXh0Ll9uZXh0O1xuICAgICAgICAgICAgcmV0dXJuIHN0YXRlLm5leHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbm9kZSA9IHRoaXMuX2ZpcnN0O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgbm9kZSA9IHRoaXMuY3JlYXRlTm9kZShyZW5kZXJOb2RlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobm9kZS5fbmV4dCkge1xuICAgICAgICAgICAgbm9kZS5fbmV4dC5fcHJldiA9IG5vZGUuX3ByZXY7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuX3ByZXYpIHtcbiAgICAgICAgICAgIG5vZGUuX3ByZXYuX25leHQgPSBub2RlLl9uZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSBub2RlLl9uZXh0O1xuICAgICAgICB9XG4gICAgICAgIG5vZGUuX25leHQgPSB1bmRlZmluZWQ7XG4gICAgICAgIG5vZGUuX3ByZXYgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChwcmV2KSB7XG4gICAgICAgIGlmIChzdGF0ZS5wcmV2Ll9wcmV2KSB7XG4gICAgICAgICAgICBub2RlLl9wcmV2ID0gc3RhdGUucHJldi5fcHJldjtcbiAgICAgICAgICAgIHN0YXRlLnByZXYuX3ByZXYuX25leHQgPSBub2RlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZmlyc3QgPSBub2RlO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLnByZXYuX3ByZXYgPSBub2RlO1xuICAgICAgICBub2RlLl9uZXh0ID0gc3RhdGUucHJldjtcbiAgICAgICAgc3RhdGUucHJldiA9IG5vZGU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHN0YXRlLm5leHQuX25leHQpIHtcbiAgICAgICAgICAgIG5vZGUuX25leHQgPSBzdGF0ZS5uZXh0Ll9uZXh0O1xuICAgICAgICAgICAgc3RhdGUubmV4dC5fbmV4dC5fcHJldiA9IG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUubmV4dC5fbmV4dCA9IG5vZGU7XG4gICAgICAgIG5vZGUuX3ByZXYgPSBzdGF0ZS5uZXh0O1xuICAgICAgICBzdGF0ZS5uZXh0ID0gbm9kZTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG59XG5mdW5jdGlvbiBfY29udGV4dE5leHQoKSB7XG4gICAgaWYgKCF0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb250ZXh0LnJldmVyc2UpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZSA9IHRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgICAgICBpZiAoIXRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHJlbmRlck5vZGUgPSB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlLmdldCgpO1xuICAgIGlmICghcmVuZGVyTm9kZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB2YXIgbmV4dFNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZTtcbiAgICBpZiAoIXRoaXMuX2NvbnRleHQucmV2ZXJzZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUubmV4dFNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUubGFzdFJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgdGhyb3cgJ1ZpZXdTZXF1ZW5jZSBpcyBjb3JydXB0ZWQsIHNob3VsZCBuZXZlciBjb250YWluIHRoZSBzYW1lIHJlbmRlck5vZGUgdHdpY2UsIGluZGV4OiAnICsgbmV4dFNlcXVlbmNlLmdldEluZGV4KCk7XG4gICAgfVxuICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5sYXN0UmVuZGVyTm9kZSA9IHJlbmRlck5vZGU7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyTm9kZTogcmVuZGVyTm9kZSxcbiAgICAgICAgdmlld1NlcXVlbmNlOiBuZXh0U2VxdWVuY2UsXG4gICAgICAgIG5leHQ6IHRydWUsXG4gICAgICAgIGluZGV4OiArK3RoaXMuX2NvbnRleHRTdGF0ZS5uZXh0R2V0SW5kZXhcbiAgICB9O1xufVxuZnVuY3Rpb24gX2NvbnRleHRQcmV2KCkge1xuICAgIGlmICghdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2NvbnRleHQucmV2ZXJzZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgICAgICBpZiAoIXRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHJlbmRlck5vZGUgPSB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlLmdldCgpO1xuICAgIGlmICghcmVuZGVyTm9kZSkge1xuICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB2YXIgcHJldlNlcXVlbmNlID0gdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXF1ZW5jZTtcbiAgICBpZiAodGhpcy5fY29udGV4dC5yZXZlcnNlKSB7XG4gICAgICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2U2VxdWVuY2UgPSB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNlcXVlbmNlLmdldFByZXZpb3VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9jb250ZXh0U3RhdGUubGFzdFJlbmRlck5vZGUgPT09IHJlbmRlck5vZGUpIHtcbiAgICAgICAgdGhyb3cgJ1ZpZXdTZXF1ZW5jZSBpcyBjb3JydXB0ZWQsIHNob3VsZCBuZXZlciBjb250YWluIHRoZSBzYW1lIHJlbmRlck5vZGUgdHdpY2UsIGluZGV4OiAnICsgcHJldlNlcXVlbmNlLmdldEluZGV4KCk7XG4gICAgfVxuICAgIHRoaXMuX2NvbnRleHRTdGF0ZS5sYXN0UmVuZGVyTm9kZSA9IHJlbmRlck5vZGU7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVuZGVyTm9kZTogcmVuZGVyTm9kZSxcbiAgICAgICAgdmlld1NlcXVlbmNlOiBwcmV2U2VxdWVuY2UsXG4gICAgICAgIHByZXY6IHRydWUsXG4gICAgICAgIGluZGV4OiAtLXRoaXMuX2NvbnRleHRTdGF0ZS5wcmV2R2V0SW5kZXhcbiAgICB9O1xufVxuZnVuY3Rpb24gX2NvbnRleHRHZXQoY29udGV4dE5vZGVPcklkKSB7XG4gICAgaWYgKHRoaXMuX25vZGVzQnlJZCAmJiAoY29udGV4dE5vZGVPcklkIGluc3RhbmNlb2YgU3RyaW5nIHx8IHR5cGVvZiBjb250ZXh0Tm9kZU9ySWQgPT09ICdzdHJpbmcnKSkge1xuICAgICAgICB2YXIgcmVuZGVyTm9kZSA9IHRoaXMuX25vZGVzQnlJZFtjb250ZXh0Tm9kZU9ySWRdO1xuICAgICAgICBpZiAoIXJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbmRlck5vZGUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSByZW5kZXJOb2RlLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyTm9kZTogcmVuZGVyTm9kZVtpXSxcbiAgICAgICAgICAgICAgICAgICAgYXJyYXlFbGVtZW50OiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW5kZXJOb2RlOiByZW5kZXJOb2RlLFxuICAgICAgICAgICAgYnlJZDogdHJ1ZVxuICAgICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBjb250ZXh0Tm9kZU9ySWQ7XG4gICAgfVxufVxuZnVuY3Rpb24gX2NvbnRleHRTZXQoY29udGV4dE5vZGVPcklkLCBzZXQpIHtcbiAgICB2YXIgY29udGV4dE5vZGUgPSB0aGlzLl9ub2Rlc0J5SWQgPyBfY29udGV4dEdldC5jYWxsKHRoaXMsIGNvbnRleHROb2RlT3JJZCkgOiBjb250ZXh0Tm9kZU9ySWQ7XG4gICAgaWYgKGNvbnRleHROb2RlKSB7XG4gICAgICAgIHZhciBub2RlID0gY29udGV4dE5vZGUubm9kZTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBpZiAoY29udGV4dE5vZGUubmV4dCkge1xuICAgICAgICAgICAgICAgIGlmIChjb250ZXh0Tm9kZS5pbmRleCA8IHRoaXMuX2NvbnRleHRTdGF0ZS5uZXh0U2V0SW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgTGF5b3V0VXRpbGl0eS5lcnJvcignTm9kZXMgbXVzdCBiZSBsYXllZCBvdXQgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSB3ZXJlIHJlcXVlc3RlZCEnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLm5leHRTZXRJbmRleCA9IGNvbnRleHROb2RlLmluZGV4O1xuICAgICAgICAgICAgfSBlbHNlIGlmIChjb250ZXh0Tm9kZS5wcmV2KSB7XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRleHROb2RlLmluZGV4ID4gdGhpcy5fY29udGV4dFN0YXRlLnByZXZTZXRJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBMYXlvdXRVdGlsaXR5LmVycm9yKCdOb2RlcyBtdXN0IGJlIGxheWVkIG91dCBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IHdlcmUgcmVxdWVzdGVkIScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9jb250ZXh0U3RhdGUucHJldlNldEluZGV4ID0gY29udGV4dE5vZGUuaW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlID0gX2NvbnRleHRHZXRDcmVhdGVBbmRPcmRlck5vZGVzLmNhbGwodGhpcywgY29udGV4dE5vZGUucmVuZGVyTm9kZSwgY29udGV4dE5vZGUucHJldik7XG4gICAgICAgICAgICBub2RlLl92aWV3U2VxdWVuY2UgPSBjb250ZXh0Tm9kZS52aWV3U2VxdWVuY2U7XG4gICAgICAgICAgICBub2RlLl9sYXlvdXRDb3VudCsrO1xuICAgICAgICAgICAgaWYgKG5vZGUuX2xheW91dENvdW50ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29udGV4dFN0YXRlLmFkZENvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZXh0Tm9kZS5ub2RlID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBub2RlLnVzZXNUcnVlU2l6ZSA9IGNvbnRleHROb2RlLnVzZXNUcnVlU2l6ZTtcbiAgICAgICAgbm9kZS50cnVlU2l6ZVJlcXVlc3RlZCA9IGNvbnRleHROb2RlLnRydWVTaXplUmVxdWVzdGVkO1xuICAgICAgICBub2RlLnNldChzZXQsIHRoaXMuX2NvbnRleHQuc2l6ZSk7XG4gICAgICAgIGNvbnRleHROb2RlLnNldCA9IHNldDtcbiAgICB9XG4gICAgcmV0dXJuIHNldDtcbn1cbmZ1bmN0aW9uIF9jb250ZXh0UmVzb2x2ZVNpemUoY29udGV4dE5vZGVPcklkLCBwYXJlbnRTaXplKSB7XG4gICAgdmFyIGNvbnRleHROb2RlID0gdGhpcy5fbm9kZXNCeUlkID8gX2NvbnRleHRHZXQuY2FsbCh0aGlzLCBjb250ZXh0Tm9kZU9ySWQpIDogY29udGV4dE5vZGVPcklkO1xuICAgIHZhciByZXNvbHZlU2l6ZSA9IHRoaXMuX3Bvb2wucmVzb2x2ZVNpemU7XG4gICAgaWYgKCFjb250ZXh0Tm9kZSkge1xuICAgICAgICByZXNvbHZlU2l6ZVswXSA9IDA7XG4gICAgICAgIHJlc29sdmVTaXplWzFdID0gMDtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVTaXplO1xuICAgIH1cbiAgICB2YXIgcmVuZGVyTm9kZSA9IGNvbnRleHROb2RlLnJlbmRlck5vZGU7XG4gICAgdmFyIHNpemUgPSByZW5kZXJOb2RlLmdldFNpemUoKTtcbiAgICBpZiAoIXNpemUpIHtcbiAgICAgICAgcmV0dXJuIHBhcmVudFNpemU7XG4gICAgfVxuICAgIHZhciBjb25maWdTaXplID0gcmVuZGVyTm9kZS5zaXplICYmIHJlbmRlck5vZGUuX3RydWVTaXplQ2hlY2sgIT09IHVuZGVmaW5lZCA/IHJlbmRlck5vZGUuc2l6ZSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoY29uZmlnU2l6ZSAmJiAoY29uZmlnU2l6ZVswXSA9PT0gdHJ1ZSB8fCBjb25maWdTaXplWzFdID09PSB0cnVlKSkge1xuICAgICAgICBjb250ZXh0Tm9kZS51c2VzVHJ1ZVNpemUgPSB0cnVlO1xuICAgICAgICB2YXIgYmFja3VwU2l6ZSA9IHJlbmRlck5vZGUuX2JhY2t1cFNpemU7XG4gICAgICAgIGlmIChyZW5kZXJOb2RlLl9jb250ZW50RGlydHkgfHwgcmVuZGVyTm9kZS5fdHJ1ZVNpemVDaGVjaykge1xuICAgICAgICAgICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZW5kZXJOb2RlLl90cnVlU2l6ZUNoZWNrKSB7XG4gICAgICAgICAgICBpZiAoYmFja3VwU2l6ZSAmJiBjb25maWdTaXplICE9PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5ld1dpZHRoID0gY29uZmlnU2l6ZVswXSA9PT0gdHJ1ZSA/IE1hdGgubWF4KGJhY2t1cFNpemVbMF0sIHNpemVbMF0pIDogc2l6ZVswXTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3SGVpZ2h0ID0gY29uZmlnU2l6ZVsxXSA9PT0gdHJ1ZSA/IE1hdGgubWF4KGJhY2t1cFNpemVbMV0sIHNpemVbMV0pIDogc2l6ZVsxXTtcbiAgICAgICAgICAgICAgICBiYWNrdXBTaXplWzBdID0gbmV3V2lkdGg7XG4gICAgICAgICAgICAgICAgYmFja3VwU2l6ZVsxXSA9IG5ld0hlaWdodDtcbiAgICAgICAgICAgICAgICBzaXplID0gYmFja3VwU2l6ZTtcbiAgICAgICAgICAgICAgICByZW5kZXJOb2RlLl9iYWNrdXBTaXplID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGJhY2t1cFNpemUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3JlZXZhbFRydWVTaXplIHx8IGJhY2t1cFNpemUgJiYgKGJhY2t1cFNpemVbMF0gIT09IHNpemVbMF0gfHwgYmFja3VwU2l6ZVsxXSAhPT0gc2l6ZVsxXSkpIHtcbiAgICAgICAgICAgIHJlbmRlck5vZGUuX3RydWVTaXplQ2hlY2sgPSB0cnVlO1xuICAgICAgICAgICAgcmVuZGVyTm9kZS5fc2l6ZURpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3RydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWJhY2t1cFNpemUpIHtcbiAgICAgICAgICAgIHJlbmRlck5vZGUuX2JhY2t1cFNpemUgPSBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgYmFja3VwU2l6ZSA9IHJlbmRlck5vZGUuX2JhY2t1cFNpemU7XG4gICAgICAgIH1cbiAgICAgICAgYmFja3VwU2l6ZVswXSA9IHNpemVbMF07XG4gICAgICAgIGJhY2t1cFNpemVbMV0gPSBzaXplWzFdO1xuICAgIH1cbiAgICBjb25maWdTaXplID0gcmVuZGVyTm9kZS5fbm9kZXMgPyByZW5kZXJOb2RlLm9wdGlvbnMuc2l6ZSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoY29uZmlnU2l6ZSAmJiAoY29uZmlnU2l6ZVswXSA9PT0gdHJ1ZSB8fCBjb25maWdTaXplWzFdID09PSB0cnVlKSkge1xuICAgICAgICBpZiAodGhpcy5fcmVldmFsVHJ1ZVNpemUgfHwgcmVuZGVyTm9kZS5fbm9kZXMuX3RydWVTaXplUmVxdWVzdGVkKSB7XG4gICAgICAgICAgICBjb250ZXh0Tm9kZS51c2VzVHJ1ZVNpemUgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dE5vZGUudHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fdHJ1ZVNpemVSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChzaXplWzBdID09PSB1bmRlZmluZWQgfHwgc2l6ZVswXSA9PT0gdHJ1ZSB8fCBzaXplWzFdID09PSB1bmRlZmluZWQgfHwgc2l6ZVsxXSA9PT0gdHJ1ZSkge1xuICAgICAgICByZXNvbHZlU2l6ZVswXSA9IHNpemVbMF07XG4gICAgICAgIHJlc29sdmVTaXplWzFdID0gc2l6ZVsxXTtcbiAgICAgICAgc2l6ZSA9IHJlc29sdmVTaXplO1xuICAgICAgICBpZiAoc2l6ZVswXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzaXplWzBdID0gcGFyZW50U2l6ZVswXTtcbiAgICAgICAgfSBlbHNlIGlmIChzaXplWzBdID09PSB0cnVlKSB7XG4gICAgICAgICAgICBzaXplWzBdID0gMDtcbiAgICAgICAgICAgIHRoaXMuX3RydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRleHROb2RlLnRydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2l6ZVsxXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzaXplWzFdID0gcGFyZW50U2l6ZVsxXTtcbiAgICAgICAgfSBlbHNlIGlmIChzaXplWzFdID09PSB0cnVlKSB7XG4gICAgICAgICAgICBzaXplWzFdID0gMDtcbiAgICAgICAgICAgIHRoaXMuX3RydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRleHROb2RlLnRydWVTaXplUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2l6ZTtcbn1cbm1vZHVsZS5leHBvcnRzID0gTGF5b3V0Tm9kZU1hbmFnZXI7IiwidmFyIFV0aWxpdHkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiBudWxsO1xuZnVuY3Rpb24gTGF5b3V0VXRpbGl0eSgpIHtcbn1cbkxheW91dFV0aWxpdHkucmVnaXN0ZXJlZEhlbHBlcnMgPSB7fTtcbnZhciBDYXBhYmlsaXRpZXMgPSB7XG4gICAgICAgIFNFUVVFTkNFOiAxLFxuICAgICAgICBESVJFQ1RJT05fWDogMixcbiAgICAgICAgRElSRUNUSU9OX1k6IDQsXG4gICAgICAgIFNDUk9MTElORzogOFxuICAgIH07XG5MYXlvdXRVdGlsaXR5LkNhcGFiaWxpdGllcyA9IENhcGFiaWxpdGllcztcbkxheW91dFV0aWxpdHkubm9ybWFsaXplTWFyZ2lucyA9IGZ1bmN0aW9uIChtYXJnaW5zKSB7XG4gICAgaWYgKCFtYXJnaW5zKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF07XG4gICAgfSBlbHNlIGlmICghQXJyYXkuaXNBcnJheShtYXJnaW5zKSkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgbWFyZ2lucyxcbiAgICAgICAgICAgIG1hcmdpbnMsXG4gICAgICAgICAgICBtYXJnaW5zLFxuICAgICAgICAgICAgbWFyZ2luc1xuICAgICAgICBdO1xuICAgIH0gZWxzZSBpZiAobWFyZ2lucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICB9IGVsc2UgaWYgKG1hcmdpbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICBtYXJnaW5zWzBdLFxuICAgICAgICAgICAgbWFyZ2luc1swXSxcbiAgICAgICAgICAgIG1hcmdpbnNbMF0sXG4gICAgICAgICAgICBtYXJnaW5zWzBdXG4gICAgICAgIF07XG4gICAgfSBlbHNlIGlmIChtYXJnaW5zLmxlbmd0aCA9PT0gMikge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgbWFyZ2luc1swXSxcbiAgICAgICAgICAgIG1hcmdpbnNbMV0sXG4gICAgICAgICAgICBtYXJnaW5zWzBdLFxuICAgICAgICAgICAgbWFyZ2luc1sxXVxuICAgICAgICBdO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBtYXJnaW5zO1xuICAgIH1cbn07XG5MYXlvdXRVdGlsaXR5LmNsb25lU3BlYyA9IGZ1bmN0aW9uIChzcGVjKSB7XG4gICAgdmFyIGNsb25lID0ge307XG4gICAgaWYgKHNwZWMub3BhY2l0eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNsb25lLm9wYWNpdHkgPSBzcGVjLm9wYWNpdHk7XG4gICAgfVxuICAgIGlmIChzcGVjLnNpemUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9uZS5zaXplID0gc3BlYy5zaXplLnNsaWNlKDApO1xuICAgIH1cbiAgICBpZiAoc3BlYy50cmFuc2Zvcm0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjbG9uZS50cmFuc2Zvcm0gPSBzcGVjLnRyYW5zZm9ybS5zbGljZSgwKTtcbiAgICB9XG4gICAgaWYgKHNwZWMub3JpZ2luICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY2xvbmUub3JpZ2luID0gc3BlYy5vcmlnaW4uc2xpY2UoMCk7XG4gICAgfVxuICAgIGlmIChzcGVjLmFsaWduICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY2xvbmUuYWxpZ24gPSBzcGVjLmFsaWduLnNsaWNlKDApO1xuICAgIH1cbiAgICByZXR1cm4gY2xvbmU7XG59O1xuZnVuY3Rpb24gX2lzRXF1YWxBcnJheShhLCBiKSB7XG4gICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChhID09PSB1bmRlZmluZWQgfHwgYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGkgPSBhLmxlbmd0aDtcbiAgICBpZiAoaSAhPT0gYi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5MYXlvdXRVdGlsaXR5LmlzRXF1YWxTcGVjID0gZnVuY3Rpb24gKHNwZWMxLCBzcGVjMikge1xuICAgIGlmIChzcGVjMS5vcGFjaXR5ICE9PSBzcGVjMi5vcGFjaXR5KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLnNpemUsIHNwZWMyLnNpemUpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLnRyYW5zZm9ybSwgc3BlYzIudHJhbnNmb3JtKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS5vcmlnaW4sIHNwZWMyLm9yaWdpbikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEuYWxpZ24sIHNwZWMyLmFsaWduKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufTtcbkxheW91dFV0aWxpdHkuZ2V0U3BlY0RpZmZUZXh0ID0gZnVuY3Rpb24gKHNwZWMxLCBzcGVjMikge1xuICAgIHZhciByZXN1bHQgPSAnc3BlYyBkaWZmOic7XG4gICAgaWYgKHNwZWMxLm9wYWNpdHkgIT09IHNwZWMyLm9wYWNpdHkpIHtcbiAgICAgICAgcmVzdWx0ICs9ICdcXG5vcGFjaXR5OiAnICsgc3BlYzEub3BhY2l0eSArICcgIT0gJyArIHNwZWMyLm9wYWNpdHk7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS5zaXplLCBzcGVjMi5zaXplKSkge1xuICAgICAgICByZXN1bHQgKz0gJ1xcbnNpemU6ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMS5zaXplKSArICcgIT0gJyArIEpTT04uc3RyaW5naWZ5KHNwZWMyLnNpemUpO1xuICAgIH1cbiAgICBpZiAoIV9pc0VxdWFsQXJyYXkoc3BlYzEudHJhbnNmb3JtLCBzcGVjMi50cmFuc2Zvcm0pKSB7XG4gICAgICAgIHJlc3VsdCArPSAnXFxudHJhbnNmb3JtOiAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzEudHJhbnNmb3JtKSArICcgIT0gJyArIEpTT04uc3RyaW5naWZ5KHNwZWMyLnRyYW5zZm9ybSk7XG4gICAgfVxuICAgIGlmICghX2lzRXF1YWxBcnJheShzcGVjMS5vcmlnaW4sIHNwZWMyLm9yaWdpbikpIHtcbiAgICAgICAgcmVzdWx0ICs9ICdcXG5vcmlnaW46ICcgKyBKU09OLnN0cmluZ2lmeShzcGVjMS5vcmlnaW4pICsgJyAhPSAnICsgSlNPTi5zdHJpbmdpZnkoc3BlYzIub3JpZ2luKTtcbiAgICB9XG4gICAgaWYgKCFfaXNFcXVhbEFycmF5KHNwZWMxLmFsaWduLCBzcGVjMi5hbGlnbikpIHtcbiAgICAgICAgcmVzdWx0ICs9ICdcXG5hbGlnbjogJyArIEpTT04uc3RyaW5naWZ5KHNwZWMxLmFsaWduKSArICcgIT0gJyArIEpTT04uc3RyaW5naWZ5KHNwZWMyLmFsaWduKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5MYXlvdXRVdGlsaXR5LmVycm9yID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICBjb25zb2xlLmxvZygnRVJST1I6ICcgKyBtZXNzYWdlKTtcbiAgICB0aHJvdyBtZXNzYWdlO1xufTtcbkxheW91dFV0aWxpdHkud2FybmluZyA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgY29uc29sZS5sb2coJ1dBUk5JTkc6ICcgKyBtZXNzYWdlKTtcbn07XG5MYXlvdXRVdGlsaXR5LmxvZyA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgdmFyIG1lc3NhZ2UgPSAnJztcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBpZiAoYXJnIGluc3RhbmNlb2YgT2JqZWN0IHx8IGFyZyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9IEpTT04uc3RyaW5naWZ5KGFyZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9IGFyZztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn07XG5MYXlvdXRVdGlsaXR5LmNvbWJpbmVPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMxLCBvcHRpb25zMiwgZm9yY2VDbG9uZSkge1xuICAgIGlmIChvcHRpb25zMSAmJiAhb3B0aW9uczIgJiYgIWZvcmNlQ2xvbmUpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMxO1xuICAgIH0gZWxzZSBpZiAoIW9wdGlvbnMxICYmIG9wdGlvbnMyICYmICFmb3JjZUNsb25lKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zMjtcbiAgICB9XG4gICAgdmFyIG9wdGlvbnMgPSBVdGlsaXR5LmNsb25lKG9wdGlvbnMxIHx8IHt9KTtcbiAgICBpZiAob3B0aW9uczIpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMyKSB7XG4gICAgICAgICAgICBvcHRpb25zW2tleV0gPSBvcHRpb25zMltrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zO1xufTtcbkxheW91dFV0aWxpdHkucmVnaXN0ZXJIZWxwZXIgPSBmdW5jdGlvbiAobmFtZSwgSGVscGVyKSB7XG4gICAgaWYgKCFIZWxwZXIucHJvdG90eXBlLnBhcnNlKSB7XG4gICAgICAgIExheW91dFV0aWxpdHkuZXJyb3IoJ1RoZSBsYXlvdXQtaGVscGVyIGZvciBuYW1lIFwiJyArIG5hbWUgKyAnXCIgaXMgcmVxdWlyZWQgdG8gc3VwcG9ydCB0aGUgXCJwYXJzZVwiIG1ldGhvZCcpO1xuICAgIH1cbiAgICBpZiAodGhpcy5yZWdpc3RlcmVkSGVscGVyc1tuYW1lXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIExheW91dFV0aWxpdHkud2FybmluZygnQSBsYXlvdXQtaGVscGVyIHdpdGggdGhlIG5hbWUgXCInICsgbmFtZSArICdcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQgYW5kIHdpbGwgYmUgb3ZlcndyaXR0ZW4nKTtcbiAgICB9XG4gICAgdGhpcy5yZWdpc3RlcmVkSGVscGVyc1tuYW1lXSA9IEhlbHBlcjtcbn07XG5MYXlvdXRVdGlsaXR5LnVucmVnaXN0ZXJIZWxwZXIgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLnJlZ2lzdGVyZWRIZWxwZXJzW25hbWVdO1xufTtcbkxheW91dFV0aWxpdHkuZ2V0UmVnaXN0ZXJlZEhlbHBlciA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMucmVnaXN0ZXJlZEhlbHBlcnNbbmFtZV07XG59O1xubW9kdWxlLmV4cG9ydHMgPSBMYXlvdXRVdGlsaXR5OyIsInZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgTGF5b3V0Q29udHJvbGxlciA9IHJlcXVpcmUoJy4vTGF5b3V0Q29udHJvbGxlcicpO1xudmFyIExheW91dE5vZGUgPSByZXF1aXJlKCcuL0xheW91dE5vZGUnKTtcbnZhciBGbG93TGF5b3V0Tm9kZSA9IHJlcXVpcmUoJy4vRmxvd0xheW91dE5vZGUnKTtcbnZhciBMYXlvdXROb2RlTWFuYWdlciA9IHJlcXVpcmUoJy4vTGF5b3V0Tm9kZU1hbmFnZXInKTtcbnZhciBDb250YWluZXJTdXJmYWNlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnN1cmZhY2VzLkNvbnRhaW5lclN1cmZhY2UgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuc3VyZmFjZXMuQ29udGFpbmVyU3VyZmFjZSA6IG51bGw7XG52YXIgVHJhbnNmb3JtID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVHJhbnNmb3JtIDogbnVsbDtcbnZhciBFdmVudEhhbmRsZXIgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5FdmVudEhhbmRsZXIgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5FdmVudEhhbmRsZXIgOiBudWxsO1xudmFyIEdyb3VwID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuR3JvdXAgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5Hcm91cCA6IG51bGw7XG52YXIgVmVjdG9yID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLm1hdGguVmVjdG9yIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLm1hdGguVmVjdG9yIDogbnVsbDtcbnZhciBQaHlzaWNzRW5naW5lID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuUGh5c2ljc0VuZ2luZSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5waHlzaWNzLlBoeXNpY3NFbmdpbmUgOiBudWxsO1xudmFyIFBhcnRpY2xlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnBoeXNpY3MuYm9kaWVzLlBhcnRpY2xlIDogbnVsbDtcbnZhciBEcmFnID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLkRyYWcgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMucGh5c2ljcy5mb3JjZXMuRHJhZyA6IG51bGw7XG52YXIgU3ByaW5nID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnBoeXNpY3MuZm9yY2VzLlNwcmluZyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5waHlzaWNzLmZvcmNlcy5TcHJpbmcgOiBudWxsO1xudmFyIFNjcm9sbFN5bmMgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuaW5wdXRzLlNjcm9sbFN5bmMgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuaW5wdXRzLlNjcm9sbFN5bmMgOiBudWxsO1xudmFyIFZpZXdTZXF1ZW5jZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlZpZXdTZXF1ZW5jZSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlZpZXdTZXF1ZW5jZSA6IG51bGw7XG52YXIgQm91bmRzID0ge1xuICAgICAgICBOT05FOiAwLFxuICAgICAgICBQUkVWOiAxLFxuICAgICAgICBORVhUOiAyLFxuICAgICAgICBCT1RIOiAzXG4gICAgfTtcbnZhciBTcHJpbmdTb3VyY2UgPSB7XG4gICAgICAgIE5PTkU6ICdub25lJyxcbiAgICAgICAgTkVYVEJPVU5EUzogJ25leHQtYm91bmRzJyxcbiAgICAgICAgUFJFVkJPVU5EUzogJ3ByZXYtYm91bmRzJyxcbiAgICAgICAgTUlOU0laRTogJ21pbmltYWwtc2l6ZScsXG4gICAgICAgIEdPVE9TRVFVRU5DRTogJ2dvdG8tc2VxdWVuY2UnLFxuICAgICAgICBFTlNVUkVWSVNJQkxFOiAnZW5zdXJlLXZpc2libGUnLFxuICAgICAgICBHT1RPUFJFVkRJUkVDVElPTjogJ2dvdG8tcHJldi1kaXJlY3Rpb24nLFxuICAgICAgICBHT1RPTkVYVERJUkVDVElPTjogJ2dvdG8tbmV4dC1kaXJlY3Rpb24nXG4gICAgfTtcbnZhciBQYWdpbmF0aW9uTW9kZSA9IHtcbiAgICAgICAgUEFHRTogMCxcbiAgICAgICAgU0NST0xMOiAxXG4gICAgfTtcbmZ1bmN0aW9uIFNjcm9sbENvbnRyb2xsZXIob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBMYXlvdXRVdGlsaXR5LmNvbWJpbmVPcHRpb25zKFNjcm9sbENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TLCBvcHRpb25zKTtcbiAgICB2YXIgbGF5b3V0TWFuYWdlciA9IG5ldyBMYXlvdXROb2RlTWFuYWdlcihvcHRpb25zLmZsb3cgPyBGbG93TGF5b3V0Tm9kZSA6IExheW91dE5vZGUsIF9pbml0TGF5b3V0Tm9kZS5iaW5kKHRoaXMpKTtcbiAgICBMYXlvdXRDb250cm9sbGVyLmNhbGwodGhpcywgb3B0aW9ucywgbGF5b3V0TWFuYWdlcik7XG4gICAgdGhpcy5fc2Nyb2xsID0ge1xuICAgICAgICBhY3RpdmVUb3VjaGVzOiBbXSxcbiAgICAgICAgcGU6IG5ldyBQaHlzaWNzRW5naW5lKCksXG4gICAgICAgIHBhcnRpY2xlOiBuZXcgUGFydGljbGUodGhpcy5vcHRpb25zLnNjcm9sbFBhcnRpY2xlKSxcbiAgICAgICAgZHJhZ0ZvcmNlOiBuZXcgRHJhZyh0aGlzLm9wdGlvbnMuc2Nyb2xsRHJhZyksXG4gICAgICAgIGZyaWN0aW9uRm9yY2U6IG5ldyBEcmFnKHRoaXMub3B0aW9ucy5zY3JvbGxGcmljdGlvbiksXG4gICAgICAgIHNwcmluZ1ZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgIHNwcmluZ0ZvcmNlOiBuZXcgU3ByaW5nKHRoaXMub3B0aW9ucy5zY3JvbGxTcHJpbmcpLFxuICAgICAgICBzcHJpbmdFbmRTdGF0ZTogbmV3IFZlY3RvcihbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSksXG4gICAgICAgIGdyb3VwU3RhcnQ6IDAsXG4gICAgICAgIGdyb3VwVHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgc2Nyb2xsRGVsdGE6IDAsXG4gICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxEZWx0YTogMCxcbiAgICAgICAgc2Nyb2xsRm9yY2U6IDAsXG4gICAgICAgIHNjcm9sbEZvcmNlQ291bnQ6IDAsXG4gICAgICAgIHVubm9ybWFsaXplZFNjcm9sbE9mZnNldDogMCxcbiAgICAgICAgaXNTY3JvbGxpbmc6IGZhbHNlXG4gICAgfTtcbiAgICB0aGlzLl9kZWJ1ZyA9IHtcbiAgICAgICAgbGF5b3V0Q291bnQ6IDAsXG4gICAgICAgIGNvbW1pdENvdW50OiAwXG4gICAgfTtcbiAgICB0aGlzLmdyb3VwID0gbmV3IEdyb3VwKCk7XG4gICAgdGhpcy5ncm91cC5hZGQoeyByZW5kZXI6IF9pbm5lclJlbmRlci5iaW5kKHRoaXMpIH0pO1xuICAgIHRoaXMuX3Njcm9sbC5wZS5hZGRCb2R5KHRoaXMuX3Njcm9sbC5wYXJ0aWNsZSk7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuc2Nyb2xsRHJhZy5kaXNhYmxlZCkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuZHJhZ0ZvcmNlSWQgPSB0aGlzLl9zY3JvbGwucGUuYXR0YWNoKHRoaXMuX3Njcm9sbC5kcmFnRm9yY2UsIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZSk7XG4gICAgfVxuICAgIGlmICghdGhpcy5vcHRpb25zLnNjcm9sbEZyaWN0aW9uLmRpc2FibGVkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5mcmljdGlvbkZvcmNlSWQgPSB0aGlzLl9zY3JvbGwucGUuYXR0YWNoKHRoaXMuX3Njcm9sbC5mcmljdGlvbkZvcmNlLCB0aGlzLl9zY3JvbGwucGFydGljbGUpO1xuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwuc3ByaW5nRm9yY2Uuc2V0T3B0aW9ucyh7IGFuY2hvcjogdGhpcy5fc2Nyb2xsLnNwcmluZ0VuZFN0YXRlIH0pO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ3RvdWNoc3RhcnQnLCBfdG91Y2hTdGFydC5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl9ldmVudElucHV0Lm9uKCd0b3VjaG1vdmUnLCBfdG91Y2hNb3ZlLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ3RvdWNoZW5kJywgX3RvdWNoRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ3RvdWNoY2FuY2VsJywgX3RvdWNoRW5kLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ21vdXNlZG93bicsIF9tb3VzZURvd24uYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fZXZlbnRJbnB1dC5vbignbW91c2V1cCcsIF9tb3VzZVVwLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX2V2ZW50SW5wdXQub24oJ21vdXNlbW92ZScsIF9tb3VzZU1vdmUuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fc2Nyb2xsU3luYyA9IG5ldyBTY3JvbGxTeW5jKHRoaXMub3B0aW9ucy5zY3JvbGxTeW5jKTtcbiAgICB0aGlzLl9ldmVudElucHV0LnBpcGUodGhpcy5fc2Nyb2xsU3luYyk7XG4gICAgdGhpcy5fc2Nyb2xsU3luYy5vbigndXBkYXRlJywgX3Njcm9sbFVwZGF0ZS5iaW5kKHRoaXMpKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnVzZUNvbnRhaW5lcikge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IG5ldyBDb250YWluZXJTdXJmYWNlKHRoaXMub3B0aW9ucy5jb250YWluZXIpO1xuICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGQoe1xuICAgICAgICAgICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgICAgICAgICB9LmJpbmQodGhpcylcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmF1dG9QaXBlRXZlbnRzKSB7XG4gICAgICAgICAgICB0aGlzLnN1YnNjcmliZSh0aGlzLmNvbnRhaW5lcik7XG4gICAgICAgICAgICBFdmVudEhhbmRsZXIuc2V0SW5wdXRIYW5kbGVyKHRoaXMuY29udGFpbmVyLCB0aGlzKTtcbiAgICAgICAgICAgIEV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKHRoaXMuY29udGFpbmVyLCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShMYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZSk7XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNjcm9sbENvbnRyb2xsZXI7XG5TY3JvbGxDb250cm9sbGVyLkJvdW5kcyA9IEJvdW5kcztcblNjcm9sbENvbnRyb2xsZXIuUGFnaW5hdGlvbk1vZGUgPSBQYWdpbmF0aW9uTW9kZTtcblNjcm9sbENvbnRyb2xsZXIuREVGQVVMVF9PUFRJT05TID0ge1xuICAgIHVzZUNvbnRhaW5lcjogZmFsc2UsXG4gICAgY29udGFpbmVyOiB7IHByb3BlcnRpZXM6IHsgb3ZlcmZsb3c6ICdoaWRkZW4nIH0gfSxcbiAgICBzY3JvbGxQYXJ0aWNsZToge30sXG4gICAgc2Nyb2xsRHJhZzoge1xuICAgICAgICBmb3JjZUZ1bmN0aW9uOiBEcmFnLkZPUkNFX0ZVTkNUSU9OUy5RVUFEUkFUSUMsXG4gICAgICAgIHN0cmVuZ3RoOiAwLjAwMSxcbiAgICAgICAgZGlzYWJsZWQ6IHRydWVcbiAgICB9LFxuICAgIHNjcm9sbEZyaWN0aW9uOiB7XG4gICAgICAgIGZvcmNlRnVuY3Rpb246IERyYWcuRk9SQ0VfRlVOQ1RJT05TLkxJTkVBUixcbiAgICAgICAgc3RyZW5ndGg6IDAuMDAyNSxcbiAgICAgICAgZGlzYWJsZWQ6IGZhbHNlXG4gICAgfSxcbiAgICBzY3JvbGxTcHJpbmc6IHtcbiAgICAgICAgZGFtcGluZ1JhdGlvOiAxLFxuICAgICAgICBwZXJpb2Q6IDM1MFxuICAgIH0sXG4gICAgc2Nyb2xsU3luYzogeyBzY2FsZTogMC4yIH0sXG4gICAgb3ZlcnNjcm9sbDogdHJ1ZSxcbiAgICBwYWdpbmF0ZWQ6IGZhbHNlLFxuICAgIHBhZ2luYXRpb25Nb2RlOiBQYWdpbmF0aW9uTW9kZS5QQUdFLFxuICAgIHBhZ2luYXRpb25FbmVyZ3lUaHJlc3Nob2xkOiAwLjAxLFxuICAgIGFsaWdubWVudDogMCxcbiAgICB0b3VjaE1vdmVEaXJlY3Rpb25UaHJlc3Nob2xkOiB1bmRlZmluZWQsXG4gICAgdG91Y2hNb3ZlTm9WZWxvY2l0eUR1cmF0aW9uOiAxMDAsXG4gICAgbW91c2VNb3ZlOiBmYWxzZSxcbiAgICBlbmFibGVkOiB0cnVlLFxuICAgIGxheW91dEFsbDogZmFsc2UsXG4gICAgYWx3YXlzTGF5b3V0OiBmYWxzZSxcbiAgICBleHRyYUJvdW5kc1NwYWNlOiBbXG4gICAgICAgIDEwMCxcbiAgICAgICAgMTAwXG4gICAgXSxcbiAgICBkZWJ1ZzogZmFsc2Vcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5zZXRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBMYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5zZXRPcHRpb25zLmNhbGwodGhpcywgb3B0aW9ucyk7XG4gICAgaWYgKHRoaXMuX3Njcm9sbCkge1xuICAgICAgICBpZiAob3B0aW9ucy5zY3JvbGxTcHJpbmcpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdGb3JjZS5zZXRPcHRpb25zKG9wdGlvbnMuc2Nyb2xsU3ByaW5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5zY3JvbGxEcmFnKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuZHJhZ0ZvcmNlLnNldE9wdGlvbnMob3B0aW9ucy5zY3JvbGxEcmFnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAob3B0aW9ucy5zY3JvbGxTeW5jICYmIHRoaXMuX3Njcm9sbFN5bmMpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsU3luYy5zZXRPcHRpb25zKG9wdGlvbnMuc2Nyb2xsU3luYyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbmZ1bmN0aW9uIF9pbml0TGF5b3V0Tm9kZShub2RlLCBzcGVjKSB7XG4gICAgaWYgKCFzcGVjICYmIHRoaXMub3B0aW9ucy5mbG93T3B0aW9ucy5pbnNlcnRTcGVjKSB7XG4gICAgICAgIG5vZGUuc2V0U3BlYyh0aGlzLm9wdGlvbnMuZmxvd09wdGlvbnMuaW5zZXJ0U3BlYyk7XG4gICAgfVxufVxuZnVuY3Rpb24gX3VwZGF0ZVNwcmluZygpIHtcbiAgICB2YXIgc3ByaW5nVmFsdWUgPSB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCA/IHVuZGVmaW5lZCA6IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbjtcbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNwcmluZ1ZhbHVlICE9PSBzcHJpbmdWYWx1ZSkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nVmFsdWUgPSBzcHJpbmdWYWx1ZTtcbiAgICAgICAgaWYgKHNwcmluZ1ZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc3ByaW5nRm9yY2VJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnBlLmRldGFjaCh0aGlzLl9zY3JvbGwuc3ByaW5nRm9yY2VJZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlSWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLnNwcmluZ0ZvcmNlSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdGb3JjZUlkID0gdGhpcy5fc2Nyb2xsLnBlLmF0dGFjaCh0aGlzLl9zY3JvbGwuc3ByaW5nRm9yY2UsIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nRW5kU3RhdGUuc2V0MUQoc3ByaW5nVmFsdWUpO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnBlLndha2UoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIF9tb3VzZURvd24oZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5tb3VzZU1vdmUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2Nyb2xsLm1vdXNlTW92ZSkge1xuICAgICAgICB0aGlzLnJlbGVhc2VTY3JvbGxGb3JjZSh0aGlzLl9zY3JvbGwubW91c2VNb3ZlLmRlbHRhKTtcbiAgICB9XG4gICAgdmFyIGN1cnJlbnQgPSBbXG4gICAgICAgICAgICBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgZXZlbnQuY2xpZW50WVxuICAgICAgICBdO1xuICAgIHZhciB0aW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlID0ge1xuICAgICAgICBkZWx0YTogMCxcbiAgICAgICAgc3RhcnQ6IGN1cnJlbnQsXG4gICAgICAgIGN1cnJlbnQ6IGN1cnJlbnQsXG4gICAgICAgIHByZXY6IGN1cnJlbnQsXG4gICAgICAgIHRpbWU6IHRpbWUsXG4gICAgICAgIHByZXZUaW1lOiB0aW1lXG4gICAgfTtcbiAgICB0aGlzLmFwcGx5U2Nyb2xsRm9yY2UodGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5kZWx0YSk7XG59XG5mdW5jdGlvbiBfbW91c2VNb3ZlKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLl9zY3JvbGwubW91c2VNb3ZlIHx8ICF0aGlzLm9wdGlvbnMuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBtb3ZlRGlyZWN0aW9uID0gTWF0aC5hdGFuMihNYXRoLmFicyhldmVudC5jbGllbnRZIC0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5wcmV2WzFdKSwgTWF0aC5hYnMoZXZlbnQuY2xpZW50WCAtIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUucHJldlswXSkpIC8gKE1hdGguUEkgLyAyKTtcbiAgICB2YXIgZGlyZWN0aW9uRGlmZiA9IE1hdGguYWJzKHRoaXMuX2RpcmVjdGlvbiAtIG1vdmVEaXJlY3Rpb24pO1xuICAgIGlmICh0aGlzLm9wdGlvbnMudG91Y2hNb3ZlRGlyZWN0aW9uVGhyZXNzaG9sZCA9PT0gdW5kZWZpbmVkIHx8IGRpcmVjdGlvbkRpZmYgPD0gdGhpcy5vcHRpb25zLnRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5wcmV2ID0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5jdXJyZW50O1xuICAgICAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLmN1cnJlbnQgPSBbXG4gICAgICAgICAgICBldmVudC5jbGllbnRYLFxuICAgICAgICAgICAgZXZlbnQuY2xpZW50WVxuICAgICAgICBdO1xuICAgICAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnByZXZUaW1lID0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS50aW1lO1xuICAgICAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLmRpcmVjdGlvbiA9IG1vdmVEaXJlY3Rpb247XG4gICAgICAgIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUudGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuICAgIHZhciBkZWx0YSA9IHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuY3VycmVudFt0aGlzLl9kaXJlY3Rpb25dIC0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5zdGFydFt0aGlzLl9kaXJlY3Rpb25dO1xuICAgIHRoaXMudXBkYXRlU2Nyb2xsRm9yY2UodGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5kZWx0YSwgZGVsdGEpO1xuICAgIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEgPSBkZWx0YTtcbn1cbmZ1bmN0aW9uIF9tb3VzZVVwKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLl9zY3JvbGwubW91c2VNb3ZlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHZlbG9jaXR5ID0gMDtcbiAgICB2YXIgZGlmZlRpbWUgPSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnRpbWUgLSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnByZXZUaW1lO1xuICAgIGlmIChkaWZmVGltZSA+IDAgJiYgRGF0ZS5ub3coKSAtIHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUudGltZSA8PSB0aGlzLm9wdGlvbnMudG91Y2hNb3ZlTm9WZWxvY2l0eUR1cmF0aW9uKSB7XG4gICAgICAgIHZhciBkaWZmT2Zmc2V0ID0gdGhpcy5fc2Nyb2xsLm1vdXNlTW92ZS5jdXJyZW50W3RoaXMuX2RpcmVjdGlvbl0gLSB0aGlzLl9zY3JvbGwubW91c2VNb3ZlLnByZXZbdGhpcy5fZGlyZWN0aW9uXTtcbiAgICAgICAgdmVsb2NpdHkgPSBkaWZmT2Zmc2V0IC8gZGlmZlRpbWU7XG4gICAgfVxuICAgIHRoaXMucmVsZWFzZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC5tb3VzZU1vdmUuZGVsdGEsIHZlbG9jaXR5KTtcbiAgICB0aGlzLl9zY3JvbGwubW91c2VNb3ZlID0gdW5kZWZpbmVkO1xufVxuZnVuY3Rpb24gX3RvdWNoU3RhcnQoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMuX3RvdWNoRW5kRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl90b3VjaEVuZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnQyKSB7XG4gICAgICAgICAgICBldmVudDIudGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5fdG91Y2hFbmRFdmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgIF90b3VjaEVuZC5jYWxsKHRoaXMsIGV2ZW50Mik7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICB9XG4gICAgdmFyIG9sZFRvdWNoZXNDb3VudCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aDtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGo7XG4gICAgdmFyIHRvdWNoRm91bmQ7XG4gICAgd2hpbGUgKGkgPCB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGFjdGl2ZVRvdWNoID0gdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXNbaV07XG4gICAgICAgIHRvdWNoRm91bmQgPSBmYWxzZTtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGV2ZW50LnRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IGV2ZW50LnRvdWNoZXNbal07XG4gICAgICAgICAgICBpZiAodG91Y2guaWRlbnRpZmllciA9PT0gYWN0aXZlVG91Y2guaWQpIHtcbiAgICAgICAgICAgICAgICB0b3VjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvdWNoRm91bmQpIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZXZlbnQudG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlZFRvdWNoID0gZXZlbnQudG91Y2hlc1tpXTtcbiAgICAgICAgdG91Y2hGb3VuZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1tqXS5pZCA9PT0gY2hhbmdlZFRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICB0b3VjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRvdWNoRm91bmQpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50ID0gW1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkVG91Y2guY2xpZW50WCxcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlZFRvdWNoLmNsaWVudFlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgdmFyIHRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgaWQ6IGNoYW5nZWRUb3VjaC5pZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiBjdXJyZW50LFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IGN1cnJlbnQsXG4gICAgICAgICAgICAgICAgcHJldjogY3VycmVudCxcbiAgICAgICAgICAgICAgICB0aW1lOiB0aW1lLFxuICAgICAgICAgICAgICAgIHByZXZUaW1lOiB0aW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNoYW5nZWRUb3VjaC50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLl90b3VjaEVuZEV2ZW50TGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghb2xkVG91Y2hlc0NvdW50ICYmIHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmFwcGx5U2Nyb2xsRm9yY2UoMCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gMDtcbiAgICB9XG59XG5mdW5jdGlvbiBfdG91Y2hNb3ZlKGV2ZW50KSB7XG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZW5hYmxlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBwcmltYXJ5VG91Y2g7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBldmVudC5jaGFuZ2VkVG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhbmdlZFRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbaV07XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciB0b3VjaCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzW2pdO1xuICAgICAgICAgICAgaWYgKHRvdWNoLmlkID09PSBjaGFuZ2VkVG91Y2guaWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgIHZhciBtb3ZlRGlyZWN0aW9uID0gTWF0aC5hdGFuMihNYXRoLmFicyhjaGFuZ2VkVG91Y2guY2xpZW50WSAtIHRvdWNoLnByZXZbMV0pLCBNYXRoLmFicyhjaGFuZ2VkVG91Y2guY2xpZW50WCAtIHRvdWNoLnByZXZbMF0pKSAvIChNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICAgICAgdmFyIGRpcmVjdGlvbkRpZmYgPSBNYXRoLmFicyh0aGlzLl9kaXJlY3Rpb24gLSBtb3ZlRGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRvdWNoTW92ZURpcmVjdGlvblRocmVzc2hvbGQgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3Rpb25EaWZmIDw9IHRoaXMub3B0aW9ucy50b3VjaE1vdmVEaXJlY3Rpb25UaHJlc3Nob2xkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLnByZXYgPSB0b3VjaC5jdXJyZW50O1xuICAgICAgICAgICAgICAgICAgICB0b3VjaC5jdXJyZW50ID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZFRvdWNoLmNsaWVudFgsXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkVG91Y2guY2xpZW50WVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB0b3VjaC5wcmV2VGltZSA9IHRvdWNoLnRpbWU7XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLmRpcmVjdGlvbiA9IG1vdmVEaXJlY3Rpb247XG4gICAgICAgICAgICAgICAgICAgIHRvdWNoLnRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICBwcmltYXJ5VG91Y2ggPSBqID09PSAwID8gdG91Y2ggOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChwcmltYXJ5VG91Y2gpIHtcbiAgICAgICAgdmFyIGRlbHRhID0gcHJpbWFyeVRvdWNoLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHByaW1hcnlUb3VjaC5zdGFydFt0aGlzLl9kaXJlY3Rpb25dO1xuICAgICAgICB0aGlzLnVwZGF0ZVNjcm9sbEZvcmNlKHRoaXMuX3Njcm9sbC50b3VjaERlbHRhLCBkZWx0YSk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gZGVsdGE7XG4gICAgfVxufVxuZnVuY3Rpb24gX3RvdWNoRW5kKGV2ZW50KSB7XG4gICAgdmFyIHByaW1hcnlUb3VjaCA9IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aCA/IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzWzBdIDogdW5kZWZpbmVkO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnQuY2hhbmdlZFRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoYW5nZWRUb3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzW2ldO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuX3Njcm9sbC5hY3RpdmVUb3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB2YXIgdG91Y2ggPSB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1tqXTtcbiAgICAgICAgICAgIGlmICh0b3VjaC5pZCA9PT0gY2hhbmdlZFRvdWNoLmlkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgaWYgKGogPT09IDAgJiYgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdQcmltYXJ5VG91Y2ggPSB0aGlzLl9zY3JvbGwuYWN0aXZlVG91Y2hlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJpbWFyeVRvdWNoLnN0YXJ0WzBdID0gbmV3UHJpbWFyeVRvdWNoLmN1cnJlbnRbMF0gLSAodG91Y2guY3VycmVudFswXSAtIHRvdWNoLnN0YXJ0WzBdKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3UHJpbWFyeVRvdWNoLnN0YXJ0WzFdID0gbmV3UHJpbWFyeVRvdWNoLmN1cnJlbnRbMV0gLSAodG91Y2guY3VycmVudFsxXSAtIHRvdWNoLnN0YXJ0WzFdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFwcmltYXJ5VG91Y2ggfHwgdGhpcy5fc2Nyb2xsLmFjdGl2ZVRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHZlbG9jaXR5ID0gMDtcbiAgICB2YXIgZGlmZlRpbWUgPSBwcmltYXJ5VG91Y2gudGltZSAtIHByaW1hcnlUb3VjaC5wcmV2VGltZTtcbiAgICBpZiAoZGlmZlRpbWUgPiAwICYmIERhdGUubm93KCkgLSBwcmltYXJ5VG91Y2gudGltZSA8PSB0aGlzLm9wdGlvbnMudG91Y2hNb3ZlTm9WZWxvY2l0eUR1cmF0aW9uKSB7XG4gICAgICAgIHZhciBkaWZmT2Zmc2V0ID0gcHJpbWFyeVRvdWNoLmN1cnJlbnRbdGhpcy5fZGlyZWN0aW9uXSAtIHByaW1hcnlUb3VjaC5wcmV2W3RoaXMuX2RpcmVjdGlvbl07XG4gICAgICAgIHZlbG9jaXR5ID0gZGlmZk9mZnNldCAvIGRpZmZUaW1lO1xuICAgIH1cbiAgICB2YXIgZGVsdGEgPSB0aGlzLl9zY3JvbGwudG91Y2hEZWx0YTtcbiAgICB0aGlzLnJlbGVhc2VTY3JvbGxGb3JjZShkZWx0YSwgdmVsb2NpdHkpO1xuICAgIHRoaXMuX3Njcm9sbC50b3VjaERlbHRhID0gMDtcbn1cbmZ1bmN0aW9uIF9zY3JvbGxVcGRhdGUoZXZlbnQpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5lbmFibGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG9mZnNldCA9IEFycmF5LmlzQXJyYXkoZXZlbnQuZGVsdGEpID8gZXZlbnQuZGVsdGFbdGhpcy5fZGlyZWN0aW9uXSA6IGV2ZW50LmRlbHRhO1xuICAgIHRoaXMuc2Nyb2xsKG9mZnNldCk7XG59XG5mdW5jdGlvbiBfc2V0UGFydGljbGUocG9zaXRpb24sIHZlbG9jaXR5LCBwaGFzZSkge1xuICAgIGlmIChwb3NpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZVZhbHVlID0gcG9zaXRpb247XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZS5zZXRQb3NpdGlvbjFEKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgaWYgKHZlbG9jaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIG9sZFZlbG9jaXR5ID0gdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldFZlbG9jaXR5MUQoKTtcbiAgICAgICAgaWYgKG9sZFZlbG9jaXR5ICE9PSB2ZWxvY2l0eSkge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLnNldFZlbG9jaXR5MUQodmVsb2NpdHkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gX2NhbGNTY3JvbGxPZmZzZXQobm9ybWFsaXplLCByZWZyZXNoUGFydGljbGUpIHtcbiAgICBpZiAocmVmcmVzaFBhcnRpY2xlIHx8IHRoaXMuX3Njcm9sbC5wYXJ0aWNsZVZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnBhcnRpY2xlVmFsdWUgPSB0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0UG9zaXRpb24xRCgpO1xuICAgICAgICB0aGlzLl9zY3JvbGwucGFydGljbGVWYWx1ZSA9IE1hdGgucm91bmQodGhpcy5fc2Nyb2xsLnBhcnRpY2xlVmFsdWUgKiAxMDAwKSAvIDEwMDA7XG4gICAgfVxuICAgIHZhciBzY3JvbGxPZmZzZXQgPSB0aGlzLl9zY3JvbGwucGFydGljbGVWYWx1ZTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhIHx8IHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEpIHtcbiAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSArIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGE7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCAmIEJvdW5kcy5QUkVWICYmIHNjcm9sbE9mZnNldCA+IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiB8fCB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCAmIEJvdW5kcy5ORVhUICYmIHNjcm9sbE9mZnNldCA8IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiB8fCB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLkJPVEgpIHtcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldCA9IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9ybWFsaXplKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEgPSAwO1xuICAgICAgICAgICAgICAgIF9zZXRQYXJ0aWNsZS5jYWxsKHRoaXMsIHNjcm9sbE9mZnNldCwgdW5kZWZpbmVkLCAnX2NhbGNTY3JvbGxPZmZzZXQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ub3JtYWxpemVkU2Nyb2xsRGVsdGEgKz0gdGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbERlbHRhID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgJiYgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ID0gKHNjcm9sbE9mZnNldCArIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSArIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbikgLyAyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5vdmVyc2Nyb2xsKSB7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLkJPVEggfHwgdGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPT09IEJvdW5kcy5QUkVWICYmIHNjcm9sbE9mZnNldCA+IHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiB8fCB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9PT0gQm91bmRzLk5FWFQgJiYgc2Nyb2xsT2Zmc2V0IDwgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uKSB7XG4gICAgICAgICAgICBzY3JvbGxPZmZzZXQgPSB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb247XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNjcm9sbE9mZnNldDtcbn1cblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLl9jYWxjU2Nyb2xsSGVpZ2h0ID0gZnVuY3Rpb24gKG5leHQsIGxhc3ROb2RlT25seSkge1xuICAgIHZhciBjYWxjZWRIZWlnaHQgPSAwO1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZShuZXh0KTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZS5faW52YWxpZGF0ZWQpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnRydWVTaXplUmVxdWVzdGVkKSB7XG4gICAgICAgICAgICAgICAgY2FsY2VkSGVpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vZGUuc2Nyb2xsTGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjYWxjZWRIZWlnaHQgPSBsYXN0Tm9kZU9ubHkgPyBub2RlLnNjcm9sbExlbmd0aCA6IGNhbGNlZEhlaWdodCArIG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgICAgIGlmICghbmV4dCAmJiBsYXN0Tm9kZU9ubHkpIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBuZXh0ID8gbm9kZS5fbmV4dCA6IG5vZGUuX3ByZXY7XG4gICAgfVxuICAgIHJldHVybiBjYWxjZWRIZWlnaHQ7XG59O1xuZnVuY3Rpb24gX2NhbGNCb3VuZHMoc2l6ZSwgc2Nyb2xsT2Zmc2V0KSB7XG4gICAgdmFyIHByZXZIZWlnaHQgPSB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KGZhbHNlKTtcbiAgICB2YXIgbmV4dEhlaWdodCA9IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQodHJ1ZSk7XG4gICAgdmFyIGVuZm9yZU1pblNpemUgPSB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzICYmIHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMuc2VxdWVudGlhbFNjcm9sbGluZ09wdGltaXplZDtcbiAgICB2YXIgdG90YWxIZWlnaHQ7XG4gICAgaWYgKGVuZm9yZU1pblNpemUpIHtcbiAgICAgICAgaWYgKG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRvdGFsSGVpZ2h0ID0gcHJldkhlaWdodCArIG5leHRIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvdGFsSGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgdG90YWxIZWlnaHQgPD0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5CT1RIO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IC1uZXh0SGVpZ2h0IDogcHJldkhlaWdodDtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTUlOU0laRTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICBpZiAoZW5mb3JlTWluU2l6ZSkge1xuICAgICAgICAgICAgaWYgKG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBzY3JvbGxPZmZzZXQgKyBuZXh0SGVpZ2h0IDw9IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5ORVhUO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IC1uZXh0SGVpZ2h0O1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTkVYVEJPVU5EUztcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZmlyc3RQcmV2SXRlbUhlaWdodCA9IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQoZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgaWYgKG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBmaXJzdFByZXZJdGVtSGVpZ2h0ICYmIHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gPD0gZmlyc3RQcmV2SXRlbUhlaWdodCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID0gQm91bmRzLk5FWFQ7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gbmV4dEhlaWdodCAtIChzaXplW3RoaXMuX2RpcmVjdGlvbl0gLSBmaXJzdFByZXZJdGVtSGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLk5FWFRCT1VORFM7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByZXZIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBzY3JvbGxPZmZzZXQgLSBwcmV2SGVpZ2h0ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID0gQm91bmRzLlBSRVY7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBwcmV2SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5QUkVWQk9VTkRTO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50KSB7XG4gICAgICAgIGlmIChwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgc2Nyb2xsT2Zmc2V0IC0gcHJldkhlaWdodCA+PSAtc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZCA9IEJvdW5kcy5QUkVWO1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gLXNpemVbdGhpcy5fZGlyZWN0aW9uXSArIHByZXZIZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLlBSRVZCT1VORFM7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbmV4dEJvdW5kcyA9IGVuZm9yZU1pblNpemUgPyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gOiB0aGlzLl9jYWxjU2Nyb2xsSGVpZ2h0KHRydWUsIHRydWUpO1xuICAgICAgICBpZiAobmV4dEhlaWdodCAhPT0gdW5kZWZpbmVkICYmIHNjcm9sbE9mZnNldCArIG5leHRIZWlnaHQgPD0gbmV4dEJvdW5kcykge1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPSBCb3VuZHMuTkVYVDtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IG5leHRCb3VuZHMgLSBuZXh0SGVpZ2h0O1xuICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5ORVhUQk9VTkRTO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID0gQm91bmRzLk5PTkU7XG4gICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuTk9ORTtcbn1cbmZ1bmN0aW9uIF9jYWxjU2Nyb2xsVG9PZmZzZXQoc2l6ZSwgc2Nyb2xsT2Zmc2V0KSB7XG4gICAgdmFyIHNjcm9sbFRvUmVuZGVyTm9kZSA9IHRoaXMuX3Njcm9sbC5zY3JvbGxUb1JlbmRlck5vZGUgfHwgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVSZW5kZXJOb2RlO1xuICAgIGlmICghc2Nyb2xsVG9SZW5kZXJOb2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID09PSBCb3VuZHMuQk9USCB8fCAhdGhpcy5fc2Nyb2xsLnNjcm9sbFRvRGlyZWN0aW9uICYmIHRoaXMuX3Njcm9sbC5ib3VuZHNSZWFjaGVkID09PSBCb3VuZHMuUFJFViB8fCB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9EaXJlY3Rpb24gJiYgdGhpcy5fc2Nyb2xsLmJvdW5kc1JlYWNoZWQgPT09IEJvdW5kcy5ORVhUKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGZvdW5kTm9kZTtcbiAgICB2YXIgc2Nyb2xsVG9PZmZzZXQgPSAwO1xuICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSh0cnVlKTtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGNvdW50Kys7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgfHwgbm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgIHNjcm9sbFRvT2Zmc2V0IC09IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLnJlbmRlck5vZGUgPT09IHNjcm9sbFRvUmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgZm91bmROb2RlID0gbm9kZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgc2Nyb2xsVG9PZmZzZXQgLT0gbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIGlmICghZm91bmROb2RlKSB7XG4gICAgICAgIHNjcm9sbFRvT2Zmc2V0ID0gMDtcbiAgICAgICAgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUoZmFsc2UpO1xuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgaWYgKCFub2RlLl9pbnZhbGlkYXRlZCB8fCBub2RlLnNjcm9sbExlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxUb09mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub2RlLnJlbmRlck5vZGUgPT09IHNjcm9sbFRvUmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgICAgIGZvdW5kTm9kZSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgICAgIHNjcm9sbFRvT2Zmc2V0ICs9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZSA9IG5vZGUuX3ByZXY7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGZvdW5kTm9kZSkge1xuICAgICAgICBpZiAodGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVSZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxUb09mZnNldCAtIGZvdW5kTm9kZS5zY3JvbGxMZW5ndGggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiA9IHNjcm9sbFRvT2Zmc2V0O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkVOU1VSRVZJU0lCTEU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzY3JvbGxUb09mZnNldCA+IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBzaXplW3RoaXMuX2RpcmVjdGlvbl0gLSBzY3JvbGxUb09mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5FTlNVUkVWSVNJQkxFO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZm91bmROb2RlLnRydWVTaXplUmVxdWVzdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuZW5zdXJlVmlzaWJsZVJlbmRlck5vZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNjcm9sbFRvT2Zmc2V0ID0gLXNjcm9sbFRvT2Zmc2V0O1xuICAgICAgICAgICAgICAgIGlmIChzY3JvbGxUb09mZnNldCA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsVG9PZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuRU5TVVJFVklTSUJMRTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNjcm9sbFRvT2Zmc2V0ICsgZm91bmROb2RlLnNjcm9sbExlbmd0aCA+IHNpemVbdGhpcy5fZGlyZWN0aW9uXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBzaXplW3RoaXMuX2RpcmVjdGlvbl0gLSAoc2Nyb2xsVG9PZmZzZXQgKyBmb3VuZE5vZGUuc2Nyb2xsTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1NvdXJjZSA9IFNwcmluZ1NvdXJjZS5FTlNVUkVWSVNJQkxFO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZm91bmROb2RlLnRydWVTaXplUmVxdWVzdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zY3JvbGwuZW5zdXJlVmlzaWJsZVJlbmRlck5vZGUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBzY3JvbGxUb09mZnNldDtcbiAgICAgICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuR09UT1NFUVVFTkNFO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5zY3JvbGxUb0RpcmVjdGlvbikge1xuICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gPSBzY3JvbGxPZmZzZXQgLSBzaXplW3RoaXMuX2RpcmVjdGlvbl07XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zcHJpbmdTb3VyY2UgPSBTcHJpbmdTb3VyY2UuR09UT05FWFRESVJFQ1RJT047XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gc2Nyb2xsT2Zmc2V0ICsgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nU291cmNlID0gU3ByaW5nU291cmNlLkdPVE9QUkVWRElSRUNUSU9OO1xuICAgIH1cbiAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlLmNsZWFudXApIHtcbiAgICAgICAgdmFyIHZpZXdTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZTtcbiAgICAgICAgd2hpbGUgKHZpZXdTZXF1ZW5jZS5nZXQoKSAhPT0gc2Nyb2xsVG9SZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICB2aWV3U2VxdWVuY2UgPSB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9EaXJlY3Rpb24gPyB2aWV3U2VxdWVuY2UuZ2V0TmV4dCh0cnVlKSA6IHZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cyh0cnVlKTtcbiAgICAgICAgICAgIGlmICghdmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBfc25hcFRvUGFnZSgpIHtcbiAgICBpZiAoIXRoaXMub3B0aW9ucy5wYWdpbmF0ZWQgfHwgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQgfHwgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgaXRlbTtcbiAgICBzd2l0Y2ggKHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uTW9kZSkge1xuICAgIGNhc2UgUGFnaW5hdGlvbk1vZGUuU0NST0xMOlxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5wYWdpbmF0aW9uRW5lcmd5VGhyZXNzaG9sZCB8fCBNYXRoLmFicyh0aGlzLl9zY3JvbGwucGFydGljbGUuZ2V0RW5lcmd5KCkpIDw9IHRoaXMub3B0aW9ucy5wYWdpbmF0aW9uRW5lcmd5VGhyZXNzaG9sZCkge1xuICAgICAgICAgICAgaXRlbSA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyB0aGlzLmdldExhc3RWaXNpYmxlSXRlbSgpIDogdGhpcy5nZXRGaXJzdFZpc2libGVJdGVtKCk7XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLnJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdvVG9SZW5kZXJOb2RlKGl0ZW0ucmVuZGVyTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgY2FzZSBQYWdpbmF0aW9uTW9kZS5QQUdFOlxuICAgICAgICBpdGVtID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuZ2V0TGFzdFZpc2libGVJdGVtKCkgOiB0aGlzLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5yZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmdvVG9SZW5kZXJOb2RlKGl0ZW0ucmVuZGVyTm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxufVxuZnVuY3Rpb24gX25vcm1hbGl6ZVByZXZWaWV3U2VxdWVuY2Uoc2Nyb2xsT2Zmc2V0KSB7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICB2YXIgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICB2YXIgbm9ybWFsaXplTmV4dFByZXYgPSBmYWxzZTtcbiAgICB2YXIgbm9kZSA9IHRoaXMuX25vZGVzLmdldFN0YXJ0RW51bU5vZGUoZmFsc2UpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgfHwgIW5vZGUuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vcm1hbGl6ZU5leHRQcmV2KSB7XG4gICAgICAgICAgICB0aGlzLl92aWV3U2VxdWVuY2UgPSBub2RlLl92aWV3U2VxdWVuY2U7XG4gICAgICAgICAgICBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgICAgICAgICAgbm9ybWFsaXplTmV4dFByZXYgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCB8fCBub2RlLnRydWVTaXplUmVxdWVzdGVkIHx8IHNjcm9sbE9mZnNldCA8IDApIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHNjcm9sbE9mZnNldCAtPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgY291bnQrKztcbiAgICAgICAgaWYgKG5vZGUuc2Nyb2xsTGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgICAgIG5vcm1hbGl6ZU5leHRQcmV2ID0gc2Nyb2xsT2Zmc2V0ID49IDA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ZpZXdTZXF1ZW5jZSA9IG5vZGUuX3ZpZXdTZXF1ZW5jZTtcbiAgICAgICAgICAgICAgICBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9wcmV2O1xuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplZFNjcm9sbE9mZnNldDtcbn1cbmZ1bmN0aW9uIF9ub3JtYWxpemVOZXh0Vmlld1NlcXVlbmNlKHNjcm9sbE9mZnNldCkge1xuICAgIHZhciBjb3VudCA9IDA7XG4gICAgdmFyIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKHRydWUpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgfHwgbm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCB8fCBub2RlLnRydWVTaXplUmVxdWVzdGVkIHx8ICFub2RlLl92aWV3U2VxdWVuY2UgfHwgc2Nyb2xsT2Zmc2V0ID4gMCAmJiAoIXRoaXMub3B0aW9ucy5hbGlnbm1lbnQgfHwgbm9kZS5zY3JvbGxMZW5ndGggIT09IDApKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZS5zY3JvbGxMZW5ndGggfHwgdGhpcy5vcHRpb25zLmFsaWdubWVudCkge1xuICAgICAgICAgICAgdGhpcy5fdmlld1NlcXVlbmNlID0gbm9kZS5fdmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IHNjcm9sbE9mZnNldDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xufVxuZnVuY3Rpb24gX25vcm1hbGl6ZVZpZXdTZXF1ZW5jZShzaXplLCBzY3JvbGxPZmZzZXQpIHtcbiAgICB2YXIgY2FwcyA9IHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXM7XG4gICAgaWYgKGNhcHMgJiYgY2Fwcy5kZWJ1ZyAmJiBjYXBzLmRlYnVnLm5vcm1hbGl6ZSAhPT0gdW5kZWZpbmVkICYmICFjYXBzLmRlYnVnLm5vcm1hbGl6ZSkge1xuICAgICAgICByZXR1cm4gc2Nyb2xsT2Zmc2V0O1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgcmV0dXJuIHNjcm9sbE9mZnNldDtcbiAgICB9XG4gICAgdmFyIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgJiYgc2Nyb2xsT2Zmc2V0IDwgMCkge1xuICAgICAgICBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gX25vcm1hbGl6ZU5leHRWaWV3U2VxdWVuY2UuY2FsbCh0aGlzLCBzY3JvbGxPZmZzZXQpO1xuICAgIH0gZWxzZSBpZiAoIXRoaXMub3B0aW9ucy5hbGlnbm1lbnQgJiYgc2Nyb2xsT2Zmc2V0ID4gMCkge1xuICAgICAgICBub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gX25vcm1hbGl6ZVByZXZWaWV3U2VxdWVuY2UuY2FsbCh0aGlzLCBzY3JvbGxPZmZzZXQpO1xuICAgIH1cbiAgICBpZiAobm9ybWFsaXplZFNjcm9sbE9mZnNldCA9PT0gc2Nyb2xsT2Zmc2V0KSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWxpZ25tZW50ICYmIHNjcm9sbE9mZnNldCA+IDApIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgPSBfbm9ybWFsaXplUHJldlZpZXdTZXF1ZW5jZS5jYWxsKHRoaXMsIHNjcm9sbE9mZnNldCk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMub3B0aW9ucy5hbGlnbm1lbnQgJiYgc2Nyb2xsT2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgbm9ybWFsaXplZFNjcm9sbE9mZnNldCA9IF9ub3JtYWxpemVOZXh0Vmlld1NlcXVlbmNlLmNhbGwodGhpcywgc2Nyb2xsT2Zmc2V0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobm9ybWFsaXplZFNjcm9sbE9mZnNldCAhPT0gc2Nyb2xsT2Zmc2V0KSB7XG4gICAgICAgIHZhciBkZWx0YSA9IG5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgLSBzY3JvbGxPZmZzZXQ7XG4gICAgICAgIHZhciBwYXJ0aWNsZVZhbHVlID0gdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldFBvc2l0aW9uMUQoKTtcbiAgICAgICAgX3NldFBhcnRpY2xlLmNhbGwodGhpcywgcGFydGljbGVWYWx1ZSArIGRlbHRhLCB1bmRlZmluZWQsICdub3JtYWxpemUnKTtcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbC5zcHJpbmdQb3NpdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuc3ByaW5nUG9zaXRpb24gKz0gZGVsdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhcHMgJiYgY2Fwcy5zZXF1ZW50aWFsU2Nyb2xsaW5nT3B0aW1pemVkKSB7XG4gICAgICAgICAgICB0aGlzLl9zY3JvbGwuZ3JvdXBTdGFydCAtPSBkZWx0YTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplZFNjcm9sbE9mZnNldDtcbn1cblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdldFZpc2libGVJdGVtcyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2l6ZSA9IHRoaXMuX2NvbnRleHRTaXplQ2FjaGU7XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPyB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ICsgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dIDogdGhpcy5fc2Nyb2xsLnVubm9ybWFsaXplZFNjcm9sbE9mZnNldDtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKHRydWUpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgfHwgbm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCB8fCBzY3JvbGxPZmZzZXQgPiBzaXplW3RoaXMuX2RpcmVjdGlvbl0pIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHNjcm9sbE9mZnNldCArPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgaWYgKHNjcm9sbE9mZnNldCA+PSAwICYmIG5vZGUuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goe1xuICAgICAgICAgICAgICAgIGluZGV4OiBub2RlLl92aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSxcbiAgICAgICAgICAgICAgICB2aWV3U2VxdWVuY2U6IG5vZGUuX3ZpZXdTZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICByZW5kZXJOb2RlOiBub2RlLnJlbmRlck5vZGUsXG4gICAgICAgICAgICAgICAgdmlzaWJsZVBlcmM6IG5vZGUuc2Nyb2xsTGVuZ3RoID8gKE1hdGgubWluKHNjcm9sbE9mZnNldCwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dKSAtIE1hdGgubWF4KHNjcm9sbE9mZnNldCAtIG5vZGUuc2Nyb2xsTGVuZ3RoLCAwKSkgLyBub2RlLnNjcm9sbExlbmd0aCA6IDEsXG4gICAgICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0OiBzY3JvbGxPZmZzZXQgLSBub2RlLnNjcm9sbExlbmd0aCxcbiAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGg6IG5vZGUuc2Nyb2xsTGVuZ3RoLFxuICAgICAgICAgICAgICAgIF9ub2RlOiBub2RlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fbmV4dDtcbiAgICB9XG4gICAgc2Nyb2xsT2Zmc2V0ID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQgKyBzaXplW3RoaXMuX2RpcmVjdGlvbl0gOiB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xuICAgIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKGZhbHNlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQgfHwgc2Nyb2xsT2Zmc2V0IDwgMCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc2Nyb2xsT2Zmc2V0IC09IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBpZiAoc2Nyb2xsT2Zmc2V0IDwgc2l6ZVt0aGlzLl9kaXJlY3Rpb25dICYmIG5vZGUuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgcmVzdWx0LnVuc2hpZnQoe1xuICAgICAgICAgICAgICAgIGluZGV4OiBub2RlLl92aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSxcbiAgICAgICAgICAgICAgICB2aWV3U2VxdWVuY2U6IG5vZGUuX3ZpZXdTZXF1ZW5jZSxcbiAgICAgICAgICAgICAgICByZW5kZXJOb2RlOiBub2RlLnJlbmRlck5vZGUsXG4gICAgICAgICAgICAgICAgdmlzaWJsZVBlcmM6IG5vZGUuc2Nyb2xsTGVuZ3RoID8gKE1hdGgubWluKHNjcm9sbE9mZnNldCArIG5vZGUuc2Nyb2xsTGVuZ3RoLCBzaXplW3RoaXMuX2RpcmVjdGlvbl0pIC0gTWF0aC5tYXgoc2Nyb2xsT2Zmc2V0LCAwKSkgLyBub2RlLnNjcm9sbExlbmd0aCA6IDEsXG4gICAgICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0OiBzY3JvbGxPZmZzZXQsXG4gICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoOiBub2RlLnNjcm9sbExlbmd0aCxcbiAgICAgICAgICAgICAgICBfbm9kZTogbm9kZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IG5vZGUuX3ByZXY7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuZnVuY3Rpb24gX2dldFZpc2libGVJdGVtKGZpcnN0KSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBkaWZmO1xuICAgIHZhciBwcmV2RGlmZiA9IDEwMDAwMDAwO1xuICAgIHZhciBkaWZmRGVsdGEgPSBmaXJzdCAmJiB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID8gLXRoaXMuX2NvbnRleHRTaXplQ2FjaGVbdGhpcy5fZGlyZWN0aW9uXSA6ICFmaXJzdCAmJiAhdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbdGhpcy5fZGlyZWN0aW9uXSA6IDA7XG4gICAgdmFyIHNjcm9sbE9mZnNldCA9IHRoaXMuX3Njcm9sbC51bm5vcm1hbGl6ZWRTY3JvbGxPZmZzZXQ7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKHRydWUpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS5faW52YWxpZGF0ZWQgfHwgbm9kZS5zY3JvbGxMZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5vZGUuX3ZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgZGlmZiA9IE1hdGguYWJzKGRpZmZEZWx0YSAtIChzY3JvbGxPZmZzZXQgKyAoIWZpcnN0ID8gbm9kZS5zY3JvbGxMZW5ndGggOiAwKSkpO1xuICAgICAgICAgICAgaWYgKGRpZmYgPj0gcHJldkRpZmYpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByZXZEaWZmID0gZGlmZjtcbiAgICAgICAgICAgIHJlc3VsdC5zY3JvbGxPZmZzZXQgPSBzY3JvbGxPZmZzZXQ7XG4gICAgICAgICAgICByZXN1bHQuX25vZGUgPSBub2RlO1xuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ICs9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLl9uZXh0O1xuICAgIH1cbiAgICBzY3JvbGxPZmZzZXQgPSB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0O1xuICAgIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKGZhbHNlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUuX2ludmFsaWRhdGVkIHx8IG5vZGUuc2Nyb2xsTGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChub2RlLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldCAtPSBub2RlLnNjcm9sbExlbmd0aDtcbiAgICAgICAgICAgIGRpZmYgPSBNYXRoLmFicyhkaWZmRGVsdGEgLSAoc2Nyb2xsT2Zmc2V0ICsgKCFmaXJzdCA/IG5vZGUuc2Nyb2xsTGVuZ3RoIDogMCkpKTtcbiAgICAgICAgICAgIGlmIChkaWZmID49IHByZXZEaWZmKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcmV2RGlmZiA9IGRpZmY7XG4gICAgICAgICAgICByZXN1bHQuc2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgICAgICAgICAgcmVzdWx0Ll9ub2RlID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5fcHJldjtcbiAgICB9XG4gICAgaWYgKCFyZXN1bHQuX25vZGUpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmVzdWx0LnNjcm9sbExlbmd0aCA9IHJlc3VsdC5fbm9kZS5zY3JvbGxMZW5ndGg7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbGlnbm1lbnQpIHtcbiAgICAgICAgcmVzdWx0LnZpc2libGVQZXJjID0gKE1hdGgubWluKHJlc3VsdC5zY3JvbGxPZmZzZXQgKyByZXN1bHQuc2Nyb2xsTGVuZ3RoLCAwKSAtIE1hdGgubWF4KHJlc3VsdC5zY3JvbGxPZmZzZXQsIC10aGlzLl9jb250ZXh0U2l6ZUNhY2hlW3RoaXMuX2RpcmVjdGlvbl0pKSAvIHJlc3VsdC5zY3JvbGxMZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LnZpc2libGVQZXJjID0gKE1hdGgubWluKHJlc3VsdC5zY3JvbGxPZmZzZXQgKyByZXN1bHQuc2Nyb2xsTGVuZ3RoLCB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlW3RoaXMuX2RpcmVjdGlvbl0pIC0gTWF0aC5tYXgocmVzdWx0LnNjcm9sbE9mZnNldCwgMCkpIC8gcmVzdWx0LnNjcm9sbExlbmd0aDtcbiAgICB9XG4gICAgcmVzdWx0LmluZGV4ID0gcmVzdWx0Ll9ub2RlLl92aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKTtcbiAgICByZXN1bHQudmlld1NlcXVlbmNlID0gcmVzdWx0Ll9ub2RlLl92aWV3U2VxdWVuY2U7XG4gICAgcmVzdWx0LnJlbmRlck5vZGUgPSByZXN1bHQuX25vZGUucmVuZGVyTm9kZTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ2V0Rmlyc3RWaXNpYmxlSXRlbSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX2dldFZpc2libGVJdGVtLmNhbGwodGhpcywgdHJ1ZSk7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ2V0TGFzdFZpc2libGVJdGVtID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfZ2V0VmlzaWJsZUl0ZW0uY2FsbCh0aGlzLCBmYWxzZSk7XG59O1xuZnVuY3Rpb24gX2dvVG9TZXF1ZW5jZSh2aWV3U2VxdWVuY2UsIG5leHQsIG5vQW5pbWF0aW9uKSB7XG4gICAgaWYgKG5vQW5pbWF0aW9uKSB7XG4gICAgICAgIHRoaXMuX3ZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNwcmluZ1Bvc2l0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgICBfdXBkYXRlU3ByaW5nLmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuaGFsdCgpO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGVsdGEgPSAwO1xuICAgICAgICBfc2V0UGFydGljbGUuY2FsbCh0aGlzLCAwLCAwLCAnX2dvVG9TZXF1ZW5jZScpO1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9TZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvUmVuZGVyTm9kZSA9IHZpZXdTZXF1ZW5jZS5nZXQoKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLmVuc3VyZVZpc2libGVSZW5kZXJOb2RlID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9EaXJlY3Rpb24gPSBuZXh0O1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIF9lbnN1cmVWaXNpYmxlU2VxdWVuY2Uodmlld1NlcXVlbmNlLCBuZXh0KSB7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvU2VxdWVuY2UgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvUmVuZGVyTm9kZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuZW5zdXJlVmlzaWJsZVJlbmRlck5vZGUgPSB2aWV3U2VxdWVuY2UuZ2V0KCk7XG4gICAgdGhpcy5fc2Nyb2xsLnNjcm9sbFRvRGlyZWN0aW9uID0gbmV4dDtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgPSB0cnVlO1xufVxuZnVuY3Rpb24gX2dvVG9QYWdlKGFtb3VudCwgbm9BbmltYXRpb24pIHtcbiAgICB2YXIgdmlld1NlcXVlbmNlID0gKCFub0FuaW1hdGlvbiA/IHRoaXMuX3Njcm9sbC5zY3JvbGxUb1NlcXVlbmNlIDogdW5kZWZpbmVkKSB8fCB0aGlzLl92aWV3U2VxdWVuY2U7XG4gICAgaWYgKCF0aGlzLl9zY3JvbGwuc2Nyb2xsVG9TZXF1ZW5jZSAmJiAhbm9BbmltYXRpb24pIHtcbiAgICAgICAgdmFyIGZpcnN0VmlzaWJsZUl0ZW0gPSB0aGlzLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICAgICAgaWYgKGZpcnN0VmlzaWJsZUl0ZW0pIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IGZpcnN0VmlzaWJsZUl0ZW0udmlld1NlcXVlbmNlO1xuICAgICAgICAgICAgaWYgKGFtb3VudCA8IDAgJiYgZmlyc3RWaXNpYmxlSXRlbS5zY3JvbGxPZmZzZXQgPCAwIHx8IGFtb3VudCA+IDAgJiYgZmlyc3RWaXNpYmxlSXRlbS5zY3JvbGxPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgYW1vdW50ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTWF0aC5hYnMoYW1vdW50KTsgaSsrKSB7XG4gICAgICAgIHZhciBuZXh0Vmlld1NlcXVlbmNlID0gYW1vdW50ID4gMCA/IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCkgOiB2aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKG5leHRWaWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IG5leHRWaWV3U2VxdWVuY2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBfZ29Ub1NlcXVlbmNlLmNhbGwodGhpcywgdmlld1NlcXVlbmNlLCBhbW91bnQgPj0gMCwgbm9BbmltYXRpb24pO1xufVxuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ29Ub0ZpcnN0UGFnZSA9IGZ1bmN0aW9uIChub0FuaW1hdGlvbikge1xuICAgIGlmICghdGhpcy5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlLl8gJiYgdGhpcy5fdmlld1NlcXVlbmNlLl8ubG9vcCkge1xuICAgICAgICBMYXlvdXRVdGlsaXR5LmVycm9yKCdVbmFibGUgdG8gZ28gdG8gZmlyc3QgaXRlbSBvZiBsb29wZWQgVmlld1NlcXVlbmNlJyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICB2YXIgdmlld1NlcXVlbmNlID0gdGhpcy5fdmlld1NlcXVlbmNlO1xuICAgIHdoaWxlICh2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgdmFyIHByZXYgPSB2aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICAgICAgaWYgKHByZXYgJiYgcHJldi5nZXQoKSkge1xuICAgICAgICAgICAgdmlld1NlcXVlbmNlID0gcHJldjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9nb1RvU2VxdWVuY2UuY2FsbCh0aGlzLCB2aWV3U2VxdWVuY2UsIGZhbHNlLCBub0FuaW1hdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ29Ub1ByZXZpb3VzUGFnZSA9IGZ1bmN0aW9uIChub0FuaW1hdGlvbikge1xuICAgIF9nb1RvUGFnZS5jYWxsKHRoaXMsIC0xLCBub0FuaW1hdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ29Ub05leHRQYWdlID0gZnVuY3Rpb24gKG5vQW5pbWF0aW9uKSB7XG4gICAgX2dvVG9QYWdlLmNhbGwodGhpcywgMSwgbm9BbmltYXRpb24pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdvVG9MYXN0UGFnZSA9IGZ1bmN0aW9uIChub0FuaW1hdGlvbikge1xuICAgIGlmICghdGhpcy5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlLl8gJiYgdGhpcy5fdmlld1NlcXVlbmNlLl8ubG9vcCkge1xuICAgICAgICBMYXlvdXRVdGlsaXR5LmVycm9yKCdVbmFibGUgdG8gZ28gdG8gbGFzdCBpdGVtIG9mIGxvb3BlZCBWaWV3U2VxdWVuY2UnKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHZhciB2aWV3U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2U7XG4gICAgd2hpbGUgKHZpZXdTZXF1ZW5jZSkge1xuICAgICAgICB2YXIgbmV4dCA9IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgICAgIGlmIChuZXh0ICYmIG5leHQuZ2V0KCkpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IG5leHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICBfZ29Ub1NlcXVlbmNlLmNhbGwodGhpcywgdmlld1NlcXVlbmNlLCB0cnVlLCBub0FuaW1hdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuZ29Ub1JlbmRlck5vZGUgPSBmdW5jdGlvbiAobm9kZSwgbm9BbmltYXRpb24pIHtcbiAgICBpZiAoIXRoaXMuX3ZpZXdTZXF1ZW5jZSB8fCAhbm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgaWYgKHRoaXMuX3ZpZXdTZXF1ZW5jZS5nZXQoKSA9PT0gbm9kZSkge1xuICAgICAgICB2YXIgbmV4dCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcykgPj0gMDtcbiAgICAgICAgX2dvVG9TZXF1ZW5jZS5jYWxsKHRoaXMsIHRoaXMuX3ZpZXdTZXF1ZW5jZSwgbmV4dCwgbm9BbmltYXRpb24pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdmFyIG5leHRTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgdmFyIHByZXZTZXF1ZW5jZSA9IHRoaXMuX3ZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgIHdoaWxlICgobmV4dFNlcXVlbmNlIHx8IHByZXZTZXF1ZW5jZSkgJiYgbmV4dFNlcXVlbmNlICE9PSB0aGlzLl92aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgdmFyIG5leHROb2RlID0gbmV4dFNlcXVlbmNlID8gbmV4dFNlcXVlbmNlLmdldCgpIDogdW5kZWZpbmVkO1xuICAgICAgICBpZiAobmV4dE5vZGUgPT09IG5vZGUpIHtcbiAgICAgICAgICAgIF9nb1RvU2VxdWVuY2UuY2FsbCh0aGlzLCBuZXh0U2VxdWVuY2UsIHRydWUsIG5vQW5pbWF0aW9uKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcmV2Tm9kZSA9IHByZXZTZXF1ZW5jZSA/IHByZXZTZXF1ZW5jZS5nZXQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHByZXZOb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICBfZ29Ub1NlcXVlbmNlLmNhbGwodGhpcywgcHJldlNlcXVlbmNlLCBmYWxzZSwgbm9BbmltYXRpb24pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbmV4dFNlcXVlbmNlID0gbmV4dE5vZGUgPyBuZXh0U2VxdWVuY2UuZ2V0TmV4dCgpIDogdW5kZWZpbmVkO1xuICAgICAgICBwcmV2U2VxdWVuY2UgPSBwcmV2Tm9kZSA/IHByZXZTZXF1ZW5jZS5nZXRQcmV2aW91cygpIDogdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5lbnN1cmVWaXNpYmxlID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIFZpZXdTZXF1ZW5jZSkge1xuICAgICAgICBub2RlID0gbm9kZS5nZXQoKTtcbiAgICB9IGVsc2UgaWYgKG5vZGUgaW5zdGFuY2VvZiBOdW1iZXIgfHwgdHlwZW9mIG5vZGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHZhciB2aWV3U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2U7XG4gICAgICAgIHdoaWxlICh2aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSA8IG5vZGUpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXROZXh0KCk7XG4gICAgICAgICAgICBpZiAoIXZpZXdTZXF1ZW5jZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdoaWxlICh2aWV3U2VxdWVuY2UuZ2V0SW5kZXgoKSA+IG5vZGUpIHtcbiAgICAgICAgICAgIHZpZXdTZXF1ZW5jZSA9IHZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgICAgICAgICAgaWYgKCF2aWV3U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5fdmlld1NlcXVlbmNlLmdldCgpID09PSBub2RlKSB7XG4gICAgICAgIHZhciBuZXh0ID0gX2NhbGNTY3JvbGxPZmZzZXQuY2FsbCh0aGlzKSA+PSAwO1xuICAgICAgICBfZW5zdXJlVmlzaWJsZVNlcXVlbmNlLmNhbGwodGhpcywgdGhpcy5fdmlld1NlcXVlbmNlLCBuZXh0KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHZhciBuZXh0U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0TmV4dCgpO1xuICAgIHZhciBwcmV2U2VxdWVuY2UgPSB0aGlzLl92aWV3U2VxdWVuY2UuZ2V0UHJldmlvdXMoKTtcbiAgICB3aGlsZSAoKG5leHRTZXF1ZW5jZSB8fCBwcmV2U2VxdWVuY2UpICYmIG5leHRTZXF1ZW5jZSAhPT0gdGhpcy5fdmlld1NlcXVlbmNlKSB7XG4gICAgICAgIHZhciBuZXh0Tm9kZSA9IG5leHRTZXF1ZW5jZSA/IG5leHRTZXF1ZW5jZS5nZXQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKG5leHROb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICBfZW5zdXJlVmlzaWJsZVNlcXVlbmNlLmNhbGwodGhpcywgbmV4dFNlcXVlbmNlLCB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwcmV2Tm9kZSA9IHByZXZTZXF1ZW5jZSA/IHByZXZTZXF1ZW5jZS5nZXQoKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKHByZXZOb2RlID09PSBub2RlKSB7XG4gICAgICAgICAgICBfZW5zdXJlVmlzaWJsZVNlcXVlbmNlLmNhbGwodGhpcywgcHJldlNlcXVlbmNlLCBmYWxzZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBuZXh0U2VxdWVuY2UgPSBuZXh0Tm9kZSA/IG5leHRTZXF1ZW5jZS5nZXROZXh0KCkgOiB1bmRlZmluZWQ7XG4gICAgICAgIHByZXZTZXF1ZW5jZSA9IHByZXZOb2RlID8gcHJldlNlcXVlbmNlLmdldFByZXZpb3VzKCkgOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLnNjcm9sbCA9IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgIHRoaXMuaGFsdCgpO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxEZWx0YSArPSBkZWx0YTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5jYW5TY3JvbGwgPSBmdW5jdGlvbiAoZGVsdGEpIHtcbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gX2NhbGNTY3JvbGxPZmZzZXQuY2FsbCh0aGlzKTtcbiAgICB2YXIgcHJldkhlaWdodCA9IHRoaXMuX2NhbGNTY3JvbGxIZWlnaHQoZmFsc2UpO1xuICAgIHZhciBuZXh0SGVpZ2h0ID0gdGhpcy5fY2FsY1Njcm9sbEhlaWdodCh0cnVlKTtcbiAgICB2YXIgdG90YWxIZWlnaHQ7XG4gICAgaWYgKG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdG90YWxIZWlnaHQgPSBwcmV2SGVpZ2h0ICsgbmV4dEhlaWdodDtcbiAgICB9XG4gICAgaWYgKHRvdGFsSGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgdG90YWxIZWlnaHQgPD0gdGhpcy5fY29udGV4dFNpemVDYWNoZVt0aGlzLl9kaXJlY3Rpb25dKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBpZiAoZGVsdGEgPCAwICYmIG5leHRIZWlnaHQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgbmV4dE9mZnNldCA9IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbdGhpcy5fZGlyZWN0aW9uXSAtIChzY3JvbGxPZmZzZXQgKyBuZXh0SGVpZ2h0KTtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KG5leHRPZmZzZXQsIGRlbHRhKTtcbiAgICB9IGVsc2UgaWYgKGRlbHRhID4gMCAmJiBwcmV2SGVpZ2h0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIHByZXZPZmZzZXQgPSAtKHNjcm9sbE9mZnNldCAtIHByZXZIZWlnaHQpO1xuICAgICAgICByZXR1cm4gTWF0aC5taW4ocHJldk9mZnNldCwgZGVsdGEpO1xuICAgIH1cbiAgICByZXR1cm4gZGVsdGE7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuaGFsdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9TZXF1ZW5jZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsVG9SZW5kZXJOb2RlID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3Njcm9sbC5lbnN1cmVWaXNpYmxlUmVuZGVyTm9kZSA9IHVuZGVmaW5lZDtcbiAgICBfc2V0UGFydGljbGUuY2FsbCh0aGlzLCB1bmRlZmluZWQsIDAsICdoYWx0Jyk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuaXNTY3JvbGxpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njcm9sbC5pc1Njcm9sbGluZztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRCb3VuZHNSZWFjaGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGwuYm91bmRzUmVhY2hlZDtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRWZWxvY2l0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldFZlbG9jaXR5MUQoKTtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5nZXRFbmVyZ3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Njcm9sbC5wYXJ0aWNsZS5nZXRFbmVyZ3koKTtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5zZXRWZWxvY2l0eSA9IGZ1bmN0aW9uICh2ZWxvY2l0eSkge1xuICAgIHJldHVybiB0aGlzLl9zY3JvbGwucGFydGljbGUuc2V0VmVsb2NpdHkxRCh2ZWxvY2l0eSk7XG59O1xuU2Nyb2xsQ29udHJvbGxlci5wcm90b3R5cGUuYXBwbHlTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChkZWx0YSkge1xuICAgIHRoaXMuaGFsdCgpO1xuICAgIGlmICh0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCA9PT0gMCkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VTdGFydEl0ZW0gPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID8gdGhpcy5nZXRMYXN0VmlzaWJsZUl0ZW0oKSA6IHRoaXMuZ2V0Rmlyc3RWaXNpYmxlSXRlbSgpO1xuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCsrO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSArPSBkZWx0YTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS51cGRhdGVTY3JvbGxGb3JjZSA9IGZ1bmN0aW9uIChwcmV2RGVsdGEsIG5ld0RlbHRhKSB7XG4gICAgdGhpcy5oYWx0KCk7XG4gICAgbmV3RGVsdGEgLT0gcHJldkRlbHRhO1xuICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSArPSBuZXdEZWx0YTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZWxlYXNlU2Nyb2xsRm9yY2UgPSBmdW5jdGlvbiAoZGVsdGEsIHZlbG9jaXR5KSB7XG4gICAgdGhpcy5oYWx0KCk7XG4gICAgaWYgKHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZUNvdW50ID09PSAxKSB7XG4gICAgICAgIHZhciBzY3JvbGxPZmZzZXQgPSBfY2FsY1Njcm9sbE9mZnNldC5jYWxsKHRoaXMpO1xuICAgICAgICBfc2V0UGFydGljbGUuY2FsbCh0aGlzLCBzY3JvbGxPZmZzZXQsIHZlbG9jaXR5LCAncmVsZWFzZVNjcm9sbEZvcmNlJyk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5wZS53YWtlKCk7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxGb3JjZSA9IDA7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxEaXJ0eSA9IHRydWU7XG4gICAgICAgIGlmICh0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VTdGFydEl0ZW0gJiYgdGhpcy5vcHRpb25zLnBhZ2luYXRlZCAmJiB0aGlzLm9wdGlvbnMucGFnaW5hdGlvbk1vZGUgPT09IFBhZ2luYXRpb25Nb2RlLlBBR0UpIHtcbiAgICAgICAgICAgIHZhciBpdGVtID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuZ2V0TGFzdFZpc2libGVJdGVtKHRydWUpIDogdGhpcy5nZXRGaXJzdFZpc2libGVJdGVtKHRydWUpO1xuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5yZW5kZXJOb2RlICE9PSB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VTdGFydEl0ZW0ucmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdvVG9SZW5kZXJOb2RlKGl0ZW0ucmVuZGVyTm9kZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMucGFnaW5hdGlvbkVuZXJneVRocmVzc2hvbGQgJiYgTWF0aC5hYnModGhpcy5fc2Nyb2xsLnBhcnRpY2xlLmdldEVuZXJneSgpKSA+PSB0aGlzLm9wdGlvbnMucGFnaW5hdGlvbkVuZXJneVRocmVzc2hvbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmVsb2NpdHkgPSB2ZWxvY2l0eSB8fCAwO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmVsb2NpdHkgPCAwICYmIGl0ZW0uX25vZGUuX25leHQgJiYgaXRlbS5fbm9kZS5fbmV4dC5yZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdvVG9SZW5kZXJOb2RlKGl0ZW0uX25vZGUuX25leHQucmVuZGVyTm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodmVsb2NpdHkgPj0gMCAmJiBpdGVtLl9ub2RlLl9wcmV2ICYmIGl0ZW0uX25vZGUuX3ByZXYucmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nb1RvUmVuZGVyTm9kZShpdGVtLl9ub2RlLl9wcmV2LnJlbmRlck5vZGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nb1RvUmVuZGVyTm9kZShpdGVtLnJlbmRlck5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VTdGFydEl0ZW0gPSB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlIC09IGRlbHRhO1xuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudC0tO1xuICAgIHJldHVybiB0aGlzO1xufTtcblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmdldFNwZWMgPSBmdW5jdGlvbiAobm9kZSwgbm9ybWFsaXplKSB7XG4gICAgdmFyIHNwZWMgPSBMYXlvdXRDb250cm9sbGVyLnByb3RvdHlwZS5nZXRTcGVjLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgaWYgKHNwZWMgJiYgdGhpcy5fbGF5b3V0LmNhcGFiaWxpdGllcyAmJiB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzLnNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQpIHtcbiAgICAgICAgc3BlYyA9IHtcbiAgICAgICAgICAgIG9yaWdpbjogc3BlYy5vcmlnaW4sXG4gICAgICAgICAgICBhbGlnbjogc3BlYy5hbGlnbixcbiAgICAgICAgICAgIG9wYWNpdHk6IHNwZWMub3BhY2l0eSxcbiAgICAgICAgICAgIHNpemU6IHNwZWMuc2l6ZSxcbiAgICAgICAgICAgIHJlbmRlck5vZGU6IHNwZWMucmVuZGVyTm9kZSxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogc3BlYy50cmFuc2Zvcm1cbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHRyYW5zbGF0ZSA9IFtcbiAgICAgICAgICAgICAgICAwLFxuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXTtcbiAgICAgICAgdHJhbnNsYXRlW3RoaXMuX2RpcmVjdGlvbl0gPSB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSArIHRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0O1xuICAgICAgICBzcGVjLnRyYW5zZm9ybSA9IFRyYW5zZm9ybS50aGVuTW92ZShzcGVjLnRyYW5zZm9ybSwgdHJhbnNsYXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHNwZWM7XG59O1xuZnVuY3Rpb24gX2xheW91dChzaXplLCBzY3JvbGxPZmZzZXQsIG5lc3RlZCkge1xuICAgIHRoaXMuX2RlYnVnLmxheW91dENvdW50Kys7XG4gICAgdmFyIHNjcm9sbFN0YXJ0ID0gMCAtIE1hdGgubWF4KHRoaXMub3B0aW9ucy5leHRyYUJvdW5kc1NwYWNlWzBdLCAxKTtcbiAgICB2YXIgc2Nyb2xsRW5kID0gc2l6ZVt0aGlzLl9kaXJlY3Rpb25dICsgTWF0aC5tYXgodGhpcy5vcHRpb25zLmV4dHJhQm91bmRzU3BhY2VbMV0sIDEpO1xuICAgIGlmICh0aGlzLm9wdGlvbnMubGF5b3V0QWxsKSB7XG4gICAgICAgIHNjcm9sbFN0YXJ0ID0gLTEwMDAwMDA7XG4gICAgICAgIHNjcm9sbEVuZCA9IDEwMDAwMDA7XG4gICAgfVxuICAgIHZhciBsYXlvdXRDb250ZXh0ID0gdGhpcy5fbm9kZXMucHJlcGFyZUZvckxheW91dCh0aGlzLl92aWV3U2VxdWVuY2UsIHRoaXMuX25vZGVzQnlJZCwge1xuICAgICAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogdGhpcy5fZGlyZWN0aW9uLFxuICAgICAgICAgICAgcmV2ZXJzZTogdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldDogdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHNjcm9sbE9mZnNldCArIHNpemVbdGhpcy5fZGlyZWN0aW9uXSA6IHNjcm9sbE9mZnNldCxcbiAgICAgICAgICAgIHNjcm9sbFN0YXJ0OiBzY3JvbGxTdGFydCxcbiAgICAgICAgICAgIHNjcm9sbEVuZDogc2Nyb2xsRW5kXG4gICAgICAgIH0pO1xuICAgIGlmICh0aGlzLl9sYXlvdXQuX2Z1bmN0aW9uKSB7XG4gICAgICAgIHRoaXMuX2xheW91dC5fZnVuY3Rpb24obGF5b3V0Q29udGV4dCwgdGhpcy5fbGF5b3V0Lm9wdGlvbnMpO1xuICAgIH1cbiAgICB0aGlzLl9zY3JvbGwudW5ub3JtYWxpemVkU2Nyb2xsT2Zmc2V0ID0gc2Nyb2xsT2Zmc2V0O1xuICAgIGlmICh0aGlzLl9wb3N0TGF5b3V0KSB7XG4gICAgICAgIHRoaXMuX3Bvc3RMYXlvdXQoc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICB9XG4gICAgdGhpcy5fbm9kZXMucmVtb3ZlTm9uSW52YWxpZGF0ZWROb2Rlcyh0aGlzLm9wdGlvbnMuZmxvd09wdGlvbnMucmVtb3ZlU3BlYyk7XG4gICAgX2NhbGNCb3VuZHMuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgIF9jYWxjU2Nyb2xsVG9PZmZzZXQuY2FsbCh0aGlzLCBzaXplLCBzY3JvbGxPZmZzZXQpO1xuICAgIF9zbmFwVG9QYWdlLmNhbGwodGhpcyk7XG4gICAgdmFyIG5ld1Njcm9sbE9mZnNldCA9IF9jYWxjU2Nyb2xsT2Zmc2V0LmNhbGwodGhpcywgdHJ1ZSk7XG4gICAgaWYgKCFuZXN0ZWQgJiYgbmV3U2Nyb2xsT2Zmc2V0ICE9PSBzY3JvbGxPZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIF9sYXlvdXQuY2FsbCh0aGlzLCBzaXplLCBuZXdTY3JvbGxPZmZzZXQsIHRydWUpO1xuICAgIH1cbiAgICBzY3JvbGxPZmZzZXQgPSBfbm9ybWFsaXplVmlld1NlcXVlbmNlLmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICBfdXBkYXRlU3ByaW5nLmNhbGwodGhpcyk7XG4gICAgdGhpcy5fbm9kZXMucmVtb3ZlVmlydHVhbFZpZXdTZXF1ZW5jZU5vZGVzKCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zaXplICYmIHRoaXMub3B0aW9ucy5zaXplW3RoaXMuX2RpcmVjdGlvbl0gPT09IHRydWUpIHtcbiAgICAgICAgdmFyIHNjcm9sbExlbmd0aCA9IDA7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5fbm9kZXMuZ2V0U3RhcnRFbnVtTm9kZSgpO1xuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUuX2ludmFsaWRhdGVkICYmIG5vZGUuc2Nyb2xsTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoICs9IG5vZGUuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fc2l6ZSA9IHRoaXMuX3NpemUgfHwgW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5fc2l6ZVswXSA9IHRoaXMub3B0aW9ucy5zaXplWzBdO1xuICAgICAgICB0aGlzLl9zaXplWzFdID0gdGhpcy5vcHRpb25zLnNpemVbMV07XG4gICAgICAgIHRoaXMuX3NpemVbdGhpcy5fZGlyZWN0aW9uXSA9IHNjcm9sbExlbmd0aDtcbiAgICB9XG4gICAgcmV0dXJuIHNjcm9sbE9mZnNldDtcbn1cbmZ1bmN0aW9uIF9pbm5lclJlbmRlcigpIHtcbiAgICB2YXIgc3BlY3MgPSB0aGlzLl9zcGVjcztcbiAgICBmb3IgKHZhciBpMyA9IDAsIGozID0gc3BlY3MubGVuZ3RoOyBpMyA8IGozOyBpMysrKSB7XG4gICAgICAgIGlmIChzcGVjc1tpM10ucmVuZGVyTm9kZSkge1xuICAgICAgICAgICAgc3BlY3NbaTNdLnRhcmdldCA9IHNwZWNzW2kzXS5yZW5kZXJOb2RlLnJlbmRlcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghc3BlY3MubGVuZ3RoIHx8IHNwZWNzW3NwZWNzLmxlbmd0aCAtIDFdICE9PSB0aGlzLl9jbGVhbnVwUmVnaXN0cmF0aW9uKSB7XG4gICAgICAgIHNwZWNzLnB1c2godGhpcy5fY2xlYW51cFJlZ2lzdHJhdGlvbik7XG4gICAgfVxuICAgIHJldHVybiBzcGVjcztcbn1cblNjcm9sbENvbnRyb2xsZXIucHJvdG90eXBlLmNvbW1pdCA9IGZ1bmN0aW9uIGNvbW1pdChjb250ZXh0KSB7XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgdGhpcy5fZGVidWcuY29tbWl0Q291bnQrKztcbiAgICBpZiAodGhpcy5fcmVzZXRGbG93U3RhdGUpIHtcbiAgICAgICAgdGhpcy5fcmVzZXRGbG93U3RhdGUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5faXNEaXJ0eSA9IHRydWU7XG4gICAgICAgIHRoaXMuX25vZGVzLnJlbW92ZUFsbCgpO1xuICAgIH1cbiAgICB2YXIgc2Nyb2xsT2Zmc2V0ID0gX2NhbGNTY3JvbGxPZmZzZXQuY2FsbCh0aGlzLCB0cnVlLCB0cnVlKTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSA9IHNjcm9sbE9mZnNldDtcbiAgICB9XG4gICAgdmFyIGVtaXRFbmRTY3JvbGxpbmdFdmVudCA9IGZhbHNlO1xuICAgIHZhciBlbWl0U2Nyb2xsRXZlbnQgPSBmYWxzZTtcbiAgICB2YXIgZXZlbnREYXRhO1xuICAgIGlmIChzaXplWzBdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzBdIHx8IHNpemVbMV0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMV0gfHwgdGhpcy5faXNEaXJ0eSB8fCB0aGlzLl9zY3JvbGwuc2Nyb2xsRGlydHkgfHwgdGhpcy5fbm9kZXMuX3RydWVTaXplUmVxdWVzdGVkIHx8IHRoaXMub3B0aW9ucy5hbHdheXNMYXlvdXQgfHwgdGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgIT09IHNjcm9sbE9mZnNldCkge1xuICAgICAgICBldmVudERhdGEgPSB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMsXG4gICAgICAgICAgICBvbGRTaXplOiB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlLFxuICAgICAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgICAgIG9sZFNjcm9sbE9mZnNldDogLSh0aGlzLl9zY3JvbGxPZmZzZXRDYWNoZSArIHRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0KSxcbiAgICAgICAgICAgIHNjcm9sbE9mZnNldDogLShzY3JvbGxPZmZzZXQgKyB0aGlzLl9zY3JvbGwuZ3JvdXBTdGFydClcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRoaXMuX3Njcm9sbE9mZnNldENhY2hlICE9PSBzY3JvbGxPZmZzZXQpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fc2Nyb2xsLmlzU2Nyb2xsaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2Nyb2xsLmlzU2Nyb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdzY3JvbGxzdGFydCcsIGV2ZW50RGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbWl0U2Nyb2xsRXZlbnQgPSB0cnVlO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3Njcm9sbC5pc1Njcm9sbGluZyAmJiAhdGhpcy5fc2Nyb2xsLnNjcm9sbEZvcmNlQ291bnQpIHtcbiAgICAgICAgICAgIGVtaXRFbmRTY3JvbGxpbmdFdmVudCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnbGF5b3V0c3RhcnQnLCBldmVudERhdGEpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmZsb3cgJiYgKHRoaXMuX2lzRGlydHkgfHwgdGhpcy5vcHRpb25zLmZsb3dPcHRpb25zLnJlZmxvd09uUmVzaXplICYmIChzaXplWzBdICE9PSB0aGlzLl9jb250ZXh0U2l6ZUNhY2hlWzBdIHx8IHNpemVbMV0gIT09IHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMV0pKSkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLl9ub2Rlcy5nZXRTdGFydEVudW1Ob2RlKCk7XG4gICAgICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgICAgIG5vZGUucmVsZWFzZUxvY2sodHJ1ZSk7XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUuX25leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udGV4dFNpemVDYWNoZVswXSA9IHNpemVbMF07XG4gICAgICAgIHRoaXMuX2NvbnRleHRTaXplQ2FjaGVbMV0gPSBzaXplWzFdO1xuICAgICAgICB0aGlzLl9pc0RpcnR5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5zY3JvbGxEaXJ0eSA9IGZhbHNlO1xuICAgICAgICBzY3JvbGxPZmZzZXQgPSBfbGF5b3V0LmNhbGwodGhpcywgc2l6ZSwgc2Nyb2xsT2Zmc2V0KTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsT2Zmc2V0Q2FjaGUgPSBzY3JvbGxPZmZzZXQ7XG4gICAgICAgIGV2ZW50RGF0YS5zY3JvbGxPZmZzZXQgPSAtKHRoaXMuX3Njcm9sbE9mZnNldENhY2hlICsgdGhpcy5fc2Nyb2xsLmdyb3VwU3RhcnQpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5fc2Nyb2xsLmlzU2Nyb2xsaW5nICYmICF0aGlzLl9zY3JvbGwuc2Nyb2xsRm9yY2VDb3VudCkge1xuICAgICAgICBlbWl0RW5kU2Nyb2xsaW5nRXZlbnQgPSB0cnVlO1xuICAgIH1cbiAgICB2YXIgZ3JvdXBUcmFuc2xhdGUgPSB0aGlzLl9zY3JvbGwuZ3JvdXBUcmFuc2xhdGU7XG4gICAgZ3JvdXBUcmFuc2xhdGVbMF0gPSAwO1xuICAgIGdyb3VwVHJhbnNsYXRlWzFdID0gMDtcbiAgICBncm91cFRyYW5zbGF0ZVsyXSA9IDA7XG4gICAgZ3JvdXBUcmFuc2xhdGVbdGhpcy5fZGlyZWN0aW9uXSA9IC10aGlzLl9zY3JvbGwuZ3JvdXBTdGFydCAtIHNjcm9sbE9mZnNldDtcbiAgICB2YXIgc2VxdWVudGlhbFNjcm9sbGluZ09wdGltaXplZCA9IHRoaXMuX2xheW91dC5jYXBhYmlsaXRpZXMgPyB0aGlzLl9sYXlvdXQuY2FwYWJpbGl0aWVzLnNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQgOiBmYWxzZTtcbiAgICB2YXIgcmVzdWx0ID0gdGhpcy5fbm9kZXMuYnVpbGRTcGVjQW5kRGVzdHJveVVucmVuZGVyZWROb2RlcyhzZXF1ZW50aWFsU2Nyb2xsaW5nT3B0aW1pemVkID8gZ3JvdXBUcmFuc2xhdGUgOiB1bmRlZmluZWQpO1xuICAgIHRoaXMuX3NwZWNzID0gcmVzdWx0LnNwZWNzO1xuICAgIGlmICghdGhpcy5fc3BlY3MubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0ID0gMDtcbiAgICB9XG4gICAgaWYgKGV2ZW50RGF0YSkge1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdsYXlvdXRlbmQnLCBldmVudERhdGEpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0Lm1vZGlmaWVkKSB7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3JlZmxvdycsIHsgdGFyZ2V0OiB0aGlzIH0pO1xuICAgIH1cbiAgICBpZiAoZW1pdFNjcm9sbEV2ZW50KSB7XG4gICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3Njcm9sbCcsIGV2ZW50RGF0YSk7XG4gICAgfVxuICAgIGlmIChldmVudERhdGEpIHtcbiAgICAgICAgdmFyIHZpc2libGVJdGVtID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA/IHRoaXMuZ2V0TGFzdFZpc2libGVJdGVtKCkgOiB0aGlzLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICAgICAgaWYgKHZpc2libGVJdGVtICYmICF0aGlzLl92aXNpYmxlSXRlbUNhY2hlIHx8ICF2aXNpYmxlSXRlbSAmJiB0aGlzLl92aXNpYmxlSXRlbUNhY2hlIHx8IHZpc2libGVJdGVtICYmIHRoaXMuX3Zpc2libGVJdGVtQ2FjaGUgJiYgdmlzaWJsZUl0ZW0ucmVuZGVyTm9kZSAhPT0gdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZS5yZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdwYWdlY2hhbmdlJywge1xuICAgICAgICAgICAgICAgIHRhcmdldDogdGhpcyxcbiAgICAgICAgICAgICAgICBvbGRWaWV3U2VxdWVuY2U6IHRoaXMuX3Zpc2libGVJdGVtQ2FjaGUgPyB0aGlzLl92aXNpYmxlSXRlbUNhY2hlLnZpZXdTZXF1ZW5jZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB2aWV3U2VxdWVuY2U6IHZpc2libGVJdGVtID8gdmlzaWJsZUl0ZW0udmlld1NlcXVlbmNlIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIG9sZEluZGV4OiB0aGlzLl92aXNpYmxlSXRlbUNhY2hlID8gdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZS5pbmRleCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBpbmRleDogdmlzaWJsZUl0ZW0gPyB2aXNpYmxlSXRlbS5pbmRleCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICByZW5kZXJOb2RlOiB2aXNpYmxlSXRlbSA/IHZpc2libGVJdGVtLnJlbmRlck5vZGUgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgb2xkUmVuZGVyTm9kZTogdGhpcy5fdmlzaWJsZUl0ZW1DYWNoZSA/IHRoaXMuX3Zpc2libGVJdGVtQ2FjaGUucmVuZGVyTm9kZSA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl92aXNpYmxlSXRlbUNhY2hlID0gdmlzaWJsZUl0ZW07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGVtaXRFbmRTY3JvbGxpbmdFdmVudCkge1xuICAgICAgICB0aGlzLl9zY3JvbGwuaXNTY3JvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgZXZlbnREYXRhID0ge1xuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLFxuICAgICAgICAgICAgb2xkU2l6ZTogc2l6ZSxcbiAgICAgICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgICAgICBvbGRTY3JvbGxPZmZzZXQ6IC0odGhpcy5fc2Nyb2xsLmdyb3VwU3RhcnQgKyBzY3JvbGxPZmZzZXQpLFxuICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0OiAtKHRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0ICsgc2Nyb2xsT2Zmc2V0KVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdzY3JvbGxlbmQnLCBldmVudERhdGEpO1xuICAgIH1cbiAgICB2YXIgdHJhbnNmb3JtID0gY29udGV4dC50cmFuc2Zvcm07XG4gICAgaWYgKHNlcXVlbnRpYWxTY3JvbGxpbmdPcHRpbWl6ZWQpIHtcbiAgICAgICAgdmFyIHdpbmRvd09mZnNldCA9IHNjcm9sbE9mZnNldCArIHRoaXMuX3Njcm9sbC5ncm91cFN0YXJ0O1xuICAgICAgICB2YXIgdHJhbnNsYXRlID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB0cmFuc2xhdGVbdGhpcy5fZGlyZWN0aW9uXSA9IHdpbmRvd09mZnNldDtcbiAgICAgICAgdHJhbnNmb3JtID0gVHJhbnNmb3JtLnRoZW5Nb3ZlKHRyYW5zZm9ybSwgdHJhbnNsYXRlKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm0sXG4gICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgIG9wYWNpdHk6IGNvbnRleHQub3BhY2l0eSxcbiAgICAgICAgb3JpZ2luOiBjb250ZXh0Lm9yaWdpbixcbiAgICAgICAgdGFyZ2V0OiB0aGlzLmdyb3VwLnJlbmRlcigpXG4gICAgfTtcbn07XG5TY3JvbGxDb250cm9sbGVyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgaWYgKHRoaXMuY29udGFpbmVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhaW5lci5yZW5kZXIuYXBwbHkodGhpcy5jb250YWluZXIsIGFyZ3VtZW50cyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gU2Nyb2xsQ29udHJvbGxlcjsiLCJ2YXIgRXZlbnRIYW5kbGVyID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuRXZlbnRIYW5kbGVyIDogbnVsbDtcbmZ1bmN0aW9uIFZpcnR1YWxWaWV3U2VxdWVuY2Uob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuXyA9IG9wdGlvbnMuXyB8fCBuZXcgdGhpcy5jb25zdHJ1Y3Rvci5CYWNraW5nKG9wdGlvbnMpO1xuICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgdGhpcy52YWx1ZSA9IG9wdGlvbnMudmFsdWUgfHwgdGhpcy5fLmZhY3RvcnkuY3JlYXRlKCk7XG4gICAgdGhpcy5pbmRleCA9IG9wdGlvbnMuaW5kZXggfHwgMDtcbiAgICB0aGlzLm5leHQgPSBvcHRpb25zLm5leHQ7XG4gICAgdGhpcy5wcmV2ID0gb3B0aW9ucy5wcmV2O1xuICAgIEV2ZW50SGFuZGxlci5zZXRPdXRwdXRIYW5kbGVyKHRoaXMsIHRoaXMuXy5ldmVudE91dHB1dCk7XG4gICAgdGhpcy52YWx1ZS5waXBlKHRoaXMuXy5ldmVudE91dHB1dCk7XG59XG5WaXJ0dWFsVmlld1NlcXVlbmNlLkJhY2tpbmcgPSBmdW5jdGlvbiBCYWNraW5nKG9wdGlvbnMpIHtcbiAgICB0aGlzLmZhY3RvcnkgPSBvcHRpb25zLmZhY3Rvcnk7XG4gICAgdGhpcy5ldmVudE91dHB1dCA9IG5ldyBFdmVudEhhbmRsZXIoKTtcbn07XG5WaXJ0dWFsVmlld1NlcXVlbmNlLnByb3RvdHlwZS5nZXRQcmV2aW91cyA9IGZ1bmN0aW9uIChub0NyZWF0ZSkge1xuICAgIGlmICh0aGlzLnByZXYpIHtcbiAgICAgICAgdGhpcy5wcmV2LnRvdWNoZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5wcmV2O1xuICAgIH1cbiAgICBpZiAobm9DcmVhdGUpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdmFyIHZhbHVlID0gdGhpcy5fLmZhY3RvcnkuY3JlYXRlUHJldmlvdXModGhpcy5nZXQoKSk7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnByZXYgPSBuZXcgVmlydHVhbFZpZXdTZXF1ZW5jZSh7XG4gICAgICAgIF86IHRoaXMuXyxcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBpbmRleDogdGhpcy5pbmRleCAtIDEsXG4gICAgICAgIG5leHQ6IHRoaXNcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5wcmV2O1xufTtcblZpcnR1YWxWaWV3U2VxdWVuY2UucHJvdG90eXBlLmdldE5leHQgPSBmdW5jdGlvbiAobm9DcmVhdGUpIHtcbiAgICBpZiAodGhpcy5uZXh0KSB7XG4gICAgICAgIHRoaXMubmV4dC50b3VjaGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMubmV4dDtcbiAgICB9XG4gICAgaWYgKG5vQ3JlYXRlKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHZhciB2YWx1ZSA9IHRoaXMuXy5mYWN0b3J5LmNyZWF0ZU5leHQodGhpcy5nZXQoKSk7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLm5leHQgPSBuZXcgVmlydHVhbFZpZXdTZXF1ZW5jZSh7XG4gICAgICAgIF86IHRoaXMuXyxcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBpbmRleDogdGhpcy5pbmRleCArIDEsXG4gICAgICAgIHByZXY6IHRoaXNcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5uZXh0O1xufTtcblZpcnR1YWxWaWV3U2VxdWVuY2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnRvdWNoZWQgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzLnZhbHVlO1xufTtcblZpcnR1YWxWaWV3U2VxdWVuY2UucHJvdG90eXBlLmdldEluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudG91Y2hlZCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMuaW5kZXg7XG59O1xuVmlydHVhbFZpZXdTZXF1ZW5jZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICcnICsgdGhpcy5pbmRleDtcbn07XG5WaXJ0dWFsVmlld1NlcXVlbmNlLnByb3RvdHlwZS5jbGVhbnVwID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBub2RlID0gdGhpcy5wcmV2O1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgIGlmICghbm9kZS50b3VjaGVkKSB7XG4gICAgICAgICAgICBub2RlLm5leHQucHJldiA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIG5vZGUubmV4dCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmICh0aGlzLl8uZmFjdG9yeS5kZXN0cm95KSB7XG4gICAgICAgICAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fLmZhY3RvcnkuZGVzdHJveShub2RlLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IG5vZGUucHJldjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlLnRvdWNoZWQgPSBmYWxzZTtcbiAgICAgICAgbm9kZSA9IG5vZGUucHJldjtcbiAgICB9XG4gICAgbm9kZSA9IHRoaXMubmV4dDtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUudG91Y2hlZCkge1xuICAgICAgICAgICAgbm9kZS5wcmV2Lm5leHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBub2RlLnByZXYgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAodGhpcy5fLmZhY3RvcnkuZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIHdoaWxlIChub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuXy5mYWN0b3J5LmRlc3Ryb3kobm9kZS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlLm5leHQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS50b3VjaGVkID0gZmFsc2U7XG4gICAgICAgIG5vZGUgPSBub2RlLm5leHQ7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblZpcnR1YWxWaWV3U2VxdWVuY2UucHJvdG90eXBlLnVuc2hpZnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVmlydHVhbFZpZXdTZXF1ZW5jZS51bnNoaWZ0IGlzIG5vdCBzdXBwb3J0ZWQgYW5kIHNob3VsZCBub3QgYmUgY2FsbGVkJyk7XG4gICAgfVxufTtcblZpcnR1YWxWaWV3U2VxdWVuY2UucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKGNvbnNvbGUuZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignVmlydHVhbFZpZXdTZXF1ZW5jZS5wdXNoIGlzIG5vdCBzdXBwb3J0ZWQgYW5kIHNob3VsZCBub3QgYmUgY2FsbGVkJyk7XG4gICAgfVxufTtcblZpcnR1YWxWaWV3U2VxdWVuY2UucHJvdG90eXBlLnNwbGljZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoY29uc29sZS5lcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdWaXJ0dWFsVmlld1NlcXVlbmNlLnNwbGljZSBpcyBub3Qgc3VwcG9ydGVkIGFuZCBzaG91bGQgbm90IGJlIGNhbGxlZCcpO1xuICAgIH1cbn07XG5WaXJ0dWFsVmlld1NlcXVlbmNlLnByb3RvdHlwZS5zd2FwID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChjb25zb2xlLmVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1ZpcnR1YWxWaWV3U2VxdWVuY2Uuc3dhcCBpcyBub3Qgc3VwcG9ydGVkIGFuZCBzaG91bGQgbm90IGJlIGNhbGxlZCcpO1xuICAgIH1cbn07XG5tb2R1bGUuZXhwb3J0cyA9IFZpcnR1YWxWaWV3U2VxdWVuY2U7IiwidmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuLi9MYXlvdXRVdGlsaXR5Jyk7XG5mdW5jdGlvbiBMYXlvdXREb2NrSGVscGVyKGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgc2l6ZSA9IGNvbnRleHQuc2l6ZTtcbiAgICB0aGlzLl9zaXplID0gc2l6ZTtcbiAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDtcbiAgICB0aGlzLl9vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLl96ID0gb3B0aW9ucyAmJiBvcHRpb25zLnRyYW5zbGF0ZVogPyBvcHRpb25zLnRyYW5zbGF0ZVogOiAwO1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMubWFyZ2lucykge1xuICAgICAgICB2YXIgbWFyZ2lucyA9IExheW91dFV0aWxpdHkubm9ybWFsaXplTWFyZ2lucyhvcHRpb25zLm1hcmdpbnMpO1xuICAgICAgICB0aGlzLl9sZWZ0ID0gbWFyZ2luc1szXTtcbiAgICAgICAgdGhpcy5fdG9wID0gbWFyZ2luc1swXTtcbiAgICAgICAgdGhpcy5fcmlnaHQgPSBzaXplWzBdIC0gbWFyZ2luc1sxXTtcbiAgICAgICAgdGhpcy5fYm90dG9tID0gc2l6ZVsxXSAtIG1hcmdpbnNbMl07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbGVmdCA9IDA7XG4gICAgICAgIHRoaXMuX3RvcCA9IDA7XG4gICAgICAgIHRoaXMuX3JpZ2h0ID0gc2l6ZVswXTtcbiAgICAgICAgdGhpcy5fYm90dG9tID0gc2l6ZVsxXTtcbiAgICB9XG59XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBydWxlID0gZGF0YVtpXTtcbiAgICAgICAgdmFyIHZhbHVlID0gcnVsZS5sZW5ndGggPj0gMyA/IHJ1bGVbMl0gOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChydWxlWzBdID09PSAndG9wJykge1xuICAgICAgICAgICAgdGhpcy50b3AocnVsZVsxXSwgdmFsdWUsIHJ1bGUubGVuZ3RoID49IDQgPyBydWxlWzNdIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChydWxlWzBdID09PSAnbGVmdCcpIHtcbiAgICAgICAgICAgIHRoaXMubGVmdChydWxlWzFdLCB2YWx1ZSwgcnVsZS5sZW5ndGggPj0gNCA/IHJ1bGVbM10gOiB1bmRlZmluZWQpO1xuICAgICAgICB9IGVsc2UgaWYgKHJ1bGVbMF0gPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIHRoaXMucmlnaHQocnVsZVsxXSwgdmFsdWUsIHJ1bGUubGVuZ3RoID49IDQgPyBydWxlWzNdIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChydWxlWzBdID09PSAnYm90dG9tJykge1xuICAgICAgICAgICAgdGhpcy5ib3R0b20ocnVsZVsxXSwgdmFsdWUsIHJ1bGUubGVuZ3RoID49IDQgPyBydWxlWzNdIDogdW5kZWZpbmVkKTtcbiAgICAgICAgfSBlbHNlIGlmIChydWxlWzBdID09PSAnZmlsbCcpIHtcbiAgICAgICAgICAgIHRoaXMuZmlsbChydWxlWzFdLCBydWxlLmxlbmd0aCA+PSAzID8gcnVsZVsyXSA6IHVuZGVmaW5lZCk7XG4gICAgICAgIH0gZWxzZSBpZiAocnVsZVswXSA9PT0gJ21hcmdpbnMnKSB7XG4gICAgICAgICAgICB0aGlzLm1hcmdpbnMocnVsZVsxXSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuTGF5b3V0RG9ja0hlbHBlci5wcm90b3R5cGUudG9wID0gZnVuY3Rpb24gKG5vZGUsIGhlaWdodCwgeikge1xuICAgIGlmIChoZWlnaHQgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBoZWlnaHQgPSBoZWlnaHRbMV07XG4gICAgfVxuICAgIGlmIChoZWlnaHQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB2YXIgc2l6ZSA9IHRoaXMuX2NvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgW1xuICAgICAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgICAgICB0aGlzLl9ib3R0b20gLSB0aGlzLl90b3BcbiAgICAgICAgICAgIF0pO1xuICAgICAgICBoZWlnaHQgPSBzaXplWzFdO1xuICAgIH1cbiAgICB0aGlzLl9jb250ZXh0LnNldChub2RlLCB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIGhlaWdodFxuICAgICAgICBdLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICB0aGlzLl90b3AsXG4gICAgICAgICAgICB6ID09PSB1bmRlZmluZWQgPyB0aGlzLl96IDogelxuICAgICAgICBdXG4gICAgfSk7XG4gICAgdGhpcy5fdG9wICs9IGhlaWdodDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS5sZWZ0ID0gZnVuY3Rpb24gKG5vZGUsIHdpZHRoLCB6KSB7XG4gICAgaWYgKHdpZHRoIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgd2lkdGggPSB3aWR0aFswXTtcbiAgICB9XG4gICAgaWYgKHdpZHRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIFtcbiAgICAgICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgd2lkdGggPSBzaXplWzBdO1xuICAgIH1cbiAgICB0aGlzLl9jb250ZXh0LnNldChub2RlLCB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgIF0sXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgYWxpZ246IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIHRoaXMuX3RvcCxcbiAgICAgICAgICAgIHogPT09IHVuZGVmaW5lZCA/IHRoaXMuX3ogOiB6XG4gICAgICAgIF1cbiAgICB9KTtcbiAgICB0aGlzLl9sZWZ0ICs9IHdpZHRoO1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dERvY2tIZWxwZXIucHJvdG90eXBlLmJvdHRvbSA9IGZ1bmN0aW9uIChub2RlLCBoZWlnaHQsIHopIHtcbiAgICBpZiAoaGVpZ2h0IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgaGVpZ2h0ID0gaGVpZ2h0WzFdO1xuICAgIH1cbiAgICBpZiAoaGVpZ2h0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdmFyIHNpemUgPSB0aGlzLl9jb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIFtcbiAgICAgICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgaGVpZ2h0ID0gc2l6ZVsxXTtcbiAgICB9XG4gICAgdGhpcy5fY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICB0aGlzLl9yaWdodCAtIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICBoZWlnaHRcbiAgICAgICAgXSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMVxuICAgICAgICBdLFxuICAgICAgICBhbGlnbjogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICB0aGlzLl9sZWZ0LFxuICAgICAgICAgICAgLSh0aGlzLl9zaXplWzFdIC0gdGhpcy5fYm90dG9tKSxcbiAgICAgICAgICAgIHogPT09IHVuZGVmaW5lZCA/IHRoaXMuX3ogOiB6XG4gICAgICAgIF1cbiAgICB9KTtcbiAgICB0aGlzLl9ib3R0b20gLT0gaGVpZ2h0O1xuICAgIHJldHVybiB0aGlzO1xufTtcbkxheW91dERvY2tIZWxwZXIucHJvdG90eXBlLnJpZ2h0ID0gZnVuY3Rpb24gKG5vZGUsIHdpZHRoLCB6KSB7XG4gICAgaWYgKHdpZHRoIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgd2lkdGggPSB3aWR0aFswXTtcbiAgICB9XG4gICAgaWYgKG5vZGUpIHtcbiAgICAgICAgaWYgKHdpZHRoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHZhciBzaXplID0gdGhpcy5fY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBbXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYm90dG9tIC0gdGhpcy5fdG9wXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB3aWR0aCA9IHNpemVbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgICAgIHdpZHRoLFxuICAgICAgICAgICAgICAgIHRoaXMuX2JvdHRvbSAtIHRoaXMuX3RvcFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICAgICAgMFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAgICAgLSh0aGlzLl9zaXplWzBdIC0gdGhpcy5fcmlnaHQpLFxuICAgICAgICAgICAgICAgIHRoaXMuX3RvcCxcbiAgICAgICAgICAgICAgICB6ID09PSB1bmRlZmluZWQgPyB0aGlzLl96IDogelxuICAgICAgICAgICAgXVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHdpZHRoKSB7XG4gICAgICAgIHRoaXMuX3JpZ2h0IC09IHdpZHRoO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXREb2NrSGVscGVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKG5vZGUsIHopIHtcbiAgICB0aGlzLl9jb250ZXh0LnNldChub2RlLCB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIHRoaXMuX3JpZ2h0IC0gdGhpcy5fbGVmdCxcbiAgICAgICAgICAgIHRoaXMuX2JvdHRvbSAtIHRoaXMuX3RvcFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIHRoaXMuX2xlZnQsXG4gICAgICAgICAgICB0aGlzLl90b3AsXG4gICAgICAgICAgICB6ID09PSB1bmRlZmluZWQgPyB0aGlzLl96IDogelxuICAgICAgICBdXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuTGF5b3V0RG9ja0hlbHBlci5wcm90b3R5cGUubWFyZ2lucyA9IGZ1bmN0aW9uIChtYXJnaW5zKSB7XG4gICAgbWFyZ2lucyA9IExheW91dFV0aWxpdHkubm9ybWFsaXplTWFyZ2lucyhtYXJnaW5zKTtcbiAgICB0aGlzLl9sZWZ0ICs9IG1hcmdpbnNbM107XG4gICAgdGhpcy5fdG9wICs9IG1hcmdpbnNbMF07XG4gICAgdGhpcy5fcmlnaHQgLT0gbWFyZ2luc1sxXTtcbiAgICB0aGlzLl9ib3R0b20gLT0gbWFyZ2luc1syXTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5MYXlvdXRVdGlsaXR5LnJlZ2lzdGVySGVscGVyKCdkb2NrJywgTGF5b3V0RG9ja0hlbHBlcik7XG5tb2R1bGUuZXhwb3J0cyA9IExheW91dERvY2tIZWxwZXI7IiwidmFyIFV0aWxpdHkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiBudWxsO1xudmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5ZLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IHRydWUsXG4gICAgICAgIHRydWVTaXplOiB0cnVlLFxuICAgICAgICBzZXF1ZW50aWFsU2Nyb2xsaW5nT3B0aW1pemVkOiB0cnVlXG4gICAgfTtcbnZhciBjb250ZXh0O1xudmFyIHNpemU7XG52YXIgZGlyZWN0aW9uO1xudmFyIGFsaWdubWVudDtcbnZhciBsaW5lRGlyZWN0aW9uO1xudmFyIGxpbmVMZW5ndGg7XG52YXIgb2Zmc2V0O1xudmFyIG1hcmdpbnM7XG52YXIgbWFyZ2luID0gW1xuICAgICAgICAwLFxuICAgICAgICAwXG4gICAgXTtcbnZhciBzcGFjaW5nO1xudmFyIGp1c3RpZnk7XG52YXIgaXRlbVNpemU7XG52YXIgZ2V0SXRlbVNpemU7XG52YXIgbGluZU5vZGVzO1xuZnVuY3Rpb24gX2xheW91dExpbmUobmV4dCwgZW5kUmVhY2hlZCkge1xuICAgIGlmICghbGluZU5vZGVzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgdmFyIGxpbmVTaXplID0gW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXTtcbiAgICB2YXIgbGluZU5vZGU7XG4gICAgZm9yIChpID0gMDsgaSA8IGxpbmVOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaW5lU2l6ZVtkaXJlY3Rpb25dID0gTWF0aC5tYXgobGluZVNpemVbZGlyZWN0aW9uXSwgbGluZU5vZGVzW2ldLnNpemVbZGlyZWN0aW9uXSk7XG4gICAgICAgIGxpbmVTaXplW2xpbmVEaXJlY3Rpb25dICs9IChpID4gMCA/IHNwYWNpbmdbbGluZURpcmVjdGlvbl0gOiAwKSArIGxpbmVOb2Rlc1tpXS5zaXplW2xpbmVEaXJlY3Rpb25dO1xuICAgIH1cbiAgICB2YXIganVzdGlmeU9mZnNldCA9IGp1c3RpZnlbbGluZURpcmVjdGlvbl0gPyAobGluZUxlbmd0aCAtIGxpbmVTaXplW2xpbmVEaXJlY3Rpb25dKSAvIChsaW5lTm9kZXMubGVuZ3RoICogMikgOiAwO1xuICAgIHZhciBsaW5lT2Zmc2V0ID0gKGRpcmVjdGlvbiA/IG1hcmdpbnNbM10gOiBtYXJnaW5zWzBdKSArIGp1c3RpZnlPZmZzZXQ7XG4gICAgdmFyIHNjcm9sbExlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGluZU5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpbmVOb2RlID0gbGluZU5vZGVzW2ldO1xuICAgICAgICB2YXIgdHJhbnNsYXRlID0gW1xuICAgICAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAwXG4gICAgICAgICAgICBdO1xuICAgICAgICB0cmFuc2xhdGVbbGluZURpcmVjdGlvbl0gPSBsaW5lT2Zmc2V0O1xuICAgICAgICB0cmFuc2xhdGVbZGlyZWN0aW9uXSA9IG5leHQgPyBvZmZzZXQgOiBvZmZzZXQgLSBsaW5lU2l6ZVtkaXJlY3Rpb25dO1xuICAgICAgICBzY3JvbGxMZW5ndGggPSAwO1xuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoID0gbGluZVNpemVbZGlyZWN0aW9uXTtcbiAgICAgICAgICAgIGlmIChlbmRSZWFjaGVkICYmIChuZXh0ICYmICFhbGlnbm1lbnQgfHwgIW5leHQgJiYgYWxpZ25tZW50KSkge1xuICAgICAgICAgICAgICAgIHNjcm9sbExlbmd0aCArPSBkaXJlY3Rpb24gPyBtYXJnaW5zWzBdICsgbWFyZ2luc1syXSA6IG1hcmdpbnNbM10gKyBtYXJnaW5zWzFdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxMZW5ndGggKz0gc3BhY2luZ1tkaXJlY3Rpb25dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxpbmVOb2RlLnNldCA9IHtcbiAgICAgICAgICAgIHNpemU6IGxpbmVOb2RlLnNpemUsXG4gICAgICAgICAgICB0cmFuc2xhdGU6IHRyYW5zbGF0ZSxcbiAgICAgICAgICAgIHNjcm9sbExlbmd0aDogc2Nyb2xsTGVuZ3RoXG4gICAgICAgIH07XG4gICAgICAgIGxpbmVPZmZzZXQgKz0gbGluZU5vZGUuc2l6ZVtsaW5lRGlyZWN0aW9uXSArIHNwYWNpbmdbbGluZURpcmVjdGlvbl0gKyBqdXN0aWZ5T2Zmc2V0ICogMjtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGxpbmVOb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaW5lTm9kZSA9IG5leHQgPyBsaW5lTm9kZXNbaV0gOiBsaW5lTm9kZXNbbGluZU5vZGVzLmxlbmd0aCAtIDEgLSBpXTtcbiAgICAgICAgY29udGV4dC5zZXQobGluZU5vZGUubm9kZSwgbGluZU5vZGUuc2V0KTtcbiAgICB9XG4gICAgbGluZU5vZGVzID0gW107XG4gICAgcmV0dXJuIGxpbmVTaXplW2RpcmVjdGlvbl0gKyBzcGFjaW5nW2RpcmVjdGlvbl07XG59XG5mdW5jdGlvbiBfcmVzb2x2ZU5vZGVTaXplKG5vZGUpIHtcbiAgICB2YXIgbG9jYWxJdGVtU2l6ZSA9IGl0ZW1TaXplO1xuICAgIGlmIChnZXRJdGVtU2l6ZSkge1xuICAgICAgICBsb2NhbEl0ZW1TaXplID0gZ2V0SXRlbVNpemUobm9kZS5yZW5kZXJOb2RlLCBzaXplKTtcbiAgICB9XG4gICAgaWYgKGxvY2FsSXRlbVNpemVbMF0gPT09IHRydWUgfHwgbG9jYWxJdGVtU2l6ZVsxXSA9PT0gdHJ1ZSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0gY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBzaXplKTtcbiAgICAgICAgaWYgKGxvY2FsSXRlbVNpemVbMF0gIT09IHRydWUpIHtcbiAgICAgICAgICAgIHJlc3VsdFswXSA9IGl0ZW1TaXplWzBdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2NhbEl0ZW1TaXplWzFdICE9PSB0cnVlKSB7XG4gICAgICAgICAgICByZXN1bHRbMV0gPSBpdGVtU2l6ZVsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBsb2NhbEl0ZW1TaXplO1xuICAgIH1cbn1cbmZ1bmN0aW9uIENvbGxlY3Rpb25MYXlvdXQoY29udGV4dF8sIG9wdGlvbnMpIHtcbiAgICBjb250ZXh0ID0gY29udGV4dF87XG4gICAgc2l6ZSA9IGNvbnRleHQuc2l6ZTtcbiAgICBkaXJlY3Rpb24gPSBjb250ZXh0LmRpcmVjdGlvbjtcbiAgICBhbGlnbm1lbnQgPSBjb250ZXh0LmFsaWdubWVudDtcbiAgICBsaW5lRGlyZWN0aW9uID0gKGRpcmVjdGlvbiArIDEpICUgMjtcbiAgICBpZiAob3B0aW9ucy5ndXR0ZXIgIT09IHVuZGVmaW5lZCAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdvcHRpb24gYGd1dHRlcmAgaGFzIGJlZW4gZGVwcmVjYXRlZCBmb3IgQ29sbGVjdGlvbkxheW91dCwgdXNlIG1hcmdpbnMgJiBzcGFjaW5nIGluc3RlYWQnKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuZ3V0dGVyICYmICFvcHRpb25zLm1hcmdpbnMgJiYgIW9wdGlvbnMuc3BhY2luZykge1xuICAgICAgICB2YXIgZ3V0dGVyID0gQXJyYXkuaXNBcnJheShvcHRpb25zLmd1dHRlcikgPyBvcHRpb25zLmd1dHRlciA6IFtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmd1dHRlcixcbiAgICAgICAgICAgICAgICBvcHRpb25zLmd1dHRlclxuICAgICAgICAgICAgXTtcbiAgICAgICAgbWFyZ2lucyA9IFtcbiAgICAgICAgICAgIGd1dHRlclsxXSxcbiAgICAgICAgICAgIGd1dHRlclswXSxcbiAgICAgICAgICAgIGd1dHRlclsxXSxcbiAgICAgICAgICAgIGd1dHRlclswXVxuICAgICAgICBdO1xuICAgICAgICBzcGFjaW5nID0gZ3V0dGVyO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG1hcmdpbnMgPSBMYXlvdXRVdGlsaXR5Lm5vcm1hbGl6ZU1hcmdpbnMob3B0aW9ucy5tYXJnaW5zKTtcbiAgICAgICAgc3BhY2luZyA9IG9wdGlvbnMuc3BhY2luZyB8fCAwO1xuICAgICAgICBzcGFjaW5nID0gQXJyYXkuaXNBcnJheShzcGFjaW5nKSA/IHNwYWNpbmcgOiBbXG4gICAgICAgICAgICBzcGFjaW5nLFxuICAgICAgICAgICAgc3BhY2luZ1xuICAgICAgICBdO1xuICAgIH1cbiAgICBtYXJnaW5bMF0gPSBtYXJnaW5zW2RpcmVjdGlvbiA/IDAgOiAzXTtcbiAgICBtYXJnaW5bMV0gPSAtbWFyZ2luc1tkaXJlY3Rpb24gPyAyIDogMV07XG4gICAganVzdGlmeSA9IEFycmF5LmlzQXJyYXkob3B0aW9ucy5qdXN0aWZ5KSA/IG9wdGlvbnMuanVzdGlmeSA6IG9wdGlvbnMuanVzdGlmeSA/IFtcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgdHJ1ZVxuICAgIF0gOiBbXG4gICAgICAgIGZhbHNlLFxuICAgICAgICBmYWxzZVxuICAgIF07XG4gICAgbGluZUxlbmd0aCA9IHNpemVbbGluZURpcmVjdGlvbl0gLSAoZGlyZWN0aW9uID8gbWFyZ2luc1szXSArIG1hcmdpbnNbMV0gOiBtYXJnaW5zWzBdICsgbWFyZ2luc1syXSk7XG4gICAgdmFyIG5vZGU7XG4gICAgdmFyIG5vZGVTaXplO1xuICAgIHZhciBsaW5lT2Zmc2V0O1xuICAgIHZhciBib3VuZDtcbiAgICBpZiAob3B0aW9ucy5jZWxscykge1xuICAgICAgICBpZiAob3B0aW9ucy5pdGVtU2l6ZSAmJiBjb25zb2xlLndhcm4pIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2Fybignb3B0aW9ucyBgY2VsbHNgIGFuZCBgaXRlbVNpemVgIGNhbm5vdCBib3RoIGJlIHNwZWNpZmllZCBmb3IgQ29sbGVjdGlvbkxheW91dCwgb25seSB1c2Ugb25lIG9mIHRoZSB0d28nKTtcbiAgICAgICAgfVxuICAgICAgICBpdGVtU2l6ZSA9IFtcbiAgICAgICAgICAgIChzaXplWzBdIC0gKG1hcmdpbnNbMV0gKyBtYXJnaW5zWzNdICsgc3BhY2luZ1swXSAqIChvcHRpb25zLmNlbGxzWzBdIC0gMSkpKSAvIG9wdGlvbnMuY2VsbHNbMF0sXG4gICAgICAgICAgICAoc2l6ZVsxXSAtIChtYXJnaW5zWzBdICsgbWFyZ2luc1syXSArIHNwYWNpbmdbMV0gKiAob3B0aW9ucy5jZWxsc1sxXSAtIDEpKSkgLyBvcHRpb25zLmNlbGxzWzFdXG4gICAgICAgIF07XG4gICAgfSBlbHNlIGlmICghb3B0aW9ucy5pdGVtU2l6ZSkge1xuICAgICAgICBpdGVtU2l6ZSA9IFtcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICB0cnVlXG4gICAgICAgIF07XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLml0ZW1TaXplIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgZ2V0SXRlbVNpemUgPSBvcHRpb25zLml0ZW1TaXplO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pdGVtU2l6ZVswXSA9PT0gdW5kZWZpbmVkIHx8IG9wdGlvbnMuaXRlbVNpemVbMF0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpdGVtU2l6ZSA9IFtcbiAgICAgICAgICAgIG9wdGlvbnMuaXRlbVNpemVbMF0gPT09IHVuZGVmaW5lZCA/IHNpemVbMF0gOiBvcHRpb25zLml0ZW1TaXplWzBdLFxuICAgICAgICAgICAgb3B0aW9ucy5pdGVtU2l6ZVsxXSA9PT0gdW5kZWZpbmVkID8gc2l6ZVsxXSA6IG9wdGlvbnMuaXRlbVNpemVbMV1cbiAgICAgICAgXTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgfVxuICAgIG9mZnNldCA9IGNvbnRleHQuc2Nyb2xsT2Zmc2V0ICsgKGFsaWdubWVudCA/IDAgOiBtYXJnaW5bYWxpZ25tZW50XSk7XG4gICAgYm91bmQgPSBjb250ZXh0LnNjcm9sbEVuZCArIChhbGlnbm1lbnQgPyAwIDogbWFyZ2luW2FsaWdubWVudF0pO1xuICAgIGxpbmVPZmZzZXQgPSAwO1xuICAgIGxpbmVOb2RlcyA9IFtdO1xuICAgIHdoaWxlIChvZmZzZXQgPCBib3VuZCkge1xuICAgICAgICBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgX2xheW91dExpbmUodHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlU2l6ZSA9IF9yZXNvbHZlTm9kZVNpemUobm9kZSk7XG4gICAgICAgIGxpbmVPZmZzZXQgKz0gKGxpbmVOb2Rlcy5sZW5ndGggPyBzcGFjaW5nW2xpbmVEaXJlY3Rpb25dIDogMCkgKyBub2RlU2l6ZVtsaW5lRGlyZWN0aW9uXTtcbiAgICAgICAgaWYgKGxpbmVPZmZzZXQgPiBsaW5lTGVuZ3RoKSB7XG4gICAgICAgICAgICBvZmZzZXQgKz0gX2xheW91dExpbmUodHJ1ZSwgIW5vZGUpO1xuICAgICAgICAgICAgbGluZU9mZnNldCA9IG5vZGVTaXplW2xpbmVEaXJlY3Rpb25dO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVOb2Rlcy5wdXNoKHtcbiAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICBzaXplOiBub2RlU2l6ZVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgb2Zmc2V0ID0gY29udGV4dC5zY3JvbGxPZmZzZXQgKyAoYWxpZ25tZW50ID8gbWFyZ2luW2FsaWdubWVudF0gOiAwKTtcbiAgICBib3VuZCA9IGNvbnRleHQuc2Nyb2xsU3RhcnQgKyAoYWxpZ25tZW50ID8gbWFyZ2luW2FsaWdubWVudF0gOiAwKTtcbiAgICBsaW5lT2Zmc2V0ID0gMDtcbiAgICBsaW5lTm9kZXMgPSBbXTtcbiAgICB3aGlsZSAob2Zmc2V0ID4gYm91bmQpIHtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIF9sYXlvdXRMaW5lKGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVTaXplID0gX3Jlc29sdmVOb2RlU2l6ZShub2RlKTtcbiAgICAgICAgbGluZU9mZnNldCArPSAobGluZU5vZGVzLmxlbmd0aCA/IHNwYWNpbmdbbGluZURpcmVjdGlvbl0gOiAwKSArIG5vZGVTaXplW2xpbmVEaXJlY3Rpb25dO1xuICAgICAgICBpZiAobGluZU9mZnNldCA+IGxpbmVMZW5ndGgpIHtcbiAgICAgICAgICAgIG9mZnNldCAtPSBfbGF5b3V0TGluZShmYWxzZSwgIW5vZGUpO1xuICAgICAgICAgICAgbGluZU9mZnNldCA9IG5vZGVTaXplW2xpbmVEaXJlY3Rpb25dO1xuICAgICAgICB9XG4gICAgICAgIGxpbmVOb2Rlcy51bnNoaWZ0KHtcbiAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICBzaXplOiBub2RlU2l6ZVxuICAgICAgICB9KTtcbiAgICB9XG59XG5Db2xsZWN0aW9uTGF5b3V0LkNhcGFiaWxpdGllcyA9IGNhcGFiaWxpdGllcztcbkNvbGxlY3Rpb25MYXlvdXQuTmFtZSA9ICdDb2xsZWN0aW9uTGF5b3V0JztcbkNvbGxlY3Rpb25MYXlvdXQuRGVzY3JpcHRpb24gPSAnTXVsdGktY2VsbCBjb2xsZWN0aW9uLWxheW91dCB3aXRoIG1hcmdpbnMgJiBzcGFjaW5nJztcbm1vZHVsZS5leHBvcnRzID0gQ29sbGVjdGlvbkxheW91dDsiLCJ2YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5YLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWVxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IHRydWVcbiAgICB9O1xuZnVuY3Rpb24gQ292ZXJMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGNvbnRleHQuZGlyZWN0aW9uO1xuICAgIHZhciBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgdmFyIG9wYWNpdHlTdGVwID0gMC4yO1xuICAgIHZhciBzY2FsZVN0ZXAgPSAwLjE7XG4gICAgdmFyIHRyYW5zbGF0ZVN0ZXAgPSAzMDtcbiAgICB2YXIgelN0YXJ0ID0gMTAwO1xuICAgIGNvbnRleHQuc2V0KG5vZGUsIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAwLjVcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIHpTdGFydFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxMZW5ndGg6IGl0ZW1TaXplW2RpcmVjdGlvbl1cbiAgICB9KTtcbiAgICB2YXIgdHJhbnNsYXRlID0gaXRlbVNpemVbMF0gLyAyO1xuICAgIHZhciBvcGFjaXR5ID0gMSAtIG9wYWNpdHlTdGVwO1xuICAgIHZhciB6SW5kZXggPSB6U3RhcnQgLSAxO1xuICAgIHZhciBzY2FsZSA9IDEgLSBzY2FsZVN0ZXA7XG4gICAgdmFyIHByZXYgPSBmYWxzZTtcbiAgICB2YXIgZW5kUmVhY2hlZCA9IGZhbHNlO1xuICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICBwcmV2ID0gdHJ1ZTtcbiAgICB9XG4gICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgY29udGV4dC5zZXQobm9kZSwge1xuICAgICAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAgICAgMC41XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgYWxpZ246IFtcbiAgICAgICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAgICAgMC41XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiBkaXJlY3Rpb24gPyBbXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICBwcmV2ID8gLXRyYW5zbGF0ZSA6IHRyYW5zbGF0ZSxcbiAgICAgICAgICAgICAgICB6SW5kZXhcbiAgICAgICAgICAgIF0gOiBbXG4gICAgICAgICAgICAgICAgcHJldiA/IC10cmFuc2xhdGUgOiB0cmFuc2xhdGUsXG4gICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICB6SW5kZXhcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBzY2FsZTogW1xuICAgICAgICAgICAgICAgIHNjYWxlLFxuICAgICAgICAgICAgICAgIHNjYWxlLFxuICAgICAgICAgICAgICAgIDFcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBvcGFjaXR5OiBvcGFjaXR5LFxuICAgICAgICAgICAgc2Nyb2xsTGVuZ3RoOiBpdGVtU2l6ZVtkaXJlY3Rpb25dXG4gICAgICAgIH0pO1xuICAgICAgICBvcGFjaXR5IC09IG9wYWNpdHlTdGVwO1xuICAgICAgICBzY2FsZSAtPSBzY2FsZVN0ZXA7XG4gICAgICAgIHRyYW5zbGF0ZSArPSB0cmFuc2xhdGVTdGVwO1xuICAgICAgICB6SW5kZXgtLTtcbiAgICAgICAgaWYgKHRyYW5zbGF0ZSA+PSBzaXplW2RpcmVjdGlvbl0gLyAyKSB7XG4gICAgICAgICAgICBlbmRSZWFjaGVkID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUgPSBwcmV2ID8gY29udGV4dC5wcmV2KCkgOiBjb250ZXh0Lm5leHQoKTtcbiAgICAgICAgICAgIGVuZFJlYWNoZWQgPSAhbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZW5kUmVhY2hlZCkge1xuICAgICAgICAgICAgaWYgKHByZXYpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVuZFJlYWNoZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHByZXYgPSB0cnVlO1xuICAgICAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2xhdGUgPSBpdGVtU2l6ZVtkaXJlY3Rpb25dIC8gMjtcbiAgICAgICAgICAgICAgICBvcGFjaXR5ID0gMSAtIG9wYWNpdHlTdGVwO1xuICAgICAgICAgICAgICAgIHpJbmRleCA9IHpTdGFydCAtIDE7XG4gICAgICAgICAgICAgICAgc2NhbGUgPSAxIC0gc2NhbGVTdGVwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuQ292ZXJMYXlvdXQuQ2FwYWJpbGl0aWVzID0gY2FwYWJpbGl0aWVzO1xubW9kdWxlLmV4cG9ydHMgPSBDb3ZlckxheW91dDsiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEN1YmVMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgY29udGV4dC5zZXQoY29udGV4dC5uZXh0KCksIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIHJvdGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIE1hdGguUEkgLyAyLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIGl0ZW1TaXplWzBdIC8gMixcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9KTtcbiAgICBjb250ZXh0LnNldChjb250ZXh0Lm5leHQoKSwge1xuICAgICAgICBzaXplOiBpdGVtU2l6ZSxcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAwLjUsXG4gICAgICAgICAgICAwLjVcbiAgICAgICAgXSxcbiAgICAgICAgcm90YXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgTWF0aC5QSSAvIDIsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgLShpdGVtU2l6ZVswXSAvIDIpLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIGNvbnRleHQuc2V0KGNvbnRleHQubmV4dCgpLCB7XG4gICAgICAgIHNpemU6IGl0ZW1TaXplLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAuNSxcbiAgICAgICAgICAgIDAuNVxuICAgICAgICBdLFxuICAgICAgICByb3RhdGU6IFtcbiAgICAgICAgICAgIE1hdGguUEkgLyAyLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDBcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgLShpdGVtU2l6ZVsxXSAvIDIpLFxuICAgICAgICAgICAgMFxuICAgICAgICBdXG4gICAgfSk7XG4gICAgY29udGV4dC5zZXQoY29udGV4dC5uZXh0KCksIHtcbiAgICAgICAgc2l6ZTogaXRlbVNpemUsXG4gICAgICAgIG9yaWdpbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIHJvdGF0ZTogW1xuICAgICAgICAgICAgTWF0aC5QSSAvIDIsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICBpdGVtU2l6ZVsxXSAvIDIsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9KTtcbn07IiwiaWYgKGNvbnNvbGUud2Fybikge1xuICAgIGNvbnNvbGUud2FybignR3JpZExheW91dCBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gdGhlIGZ1dHVyZSwgdXNlIENvbGxlY3Rpb25MYXlvdXQgaW5zdGVhZCcpO1xufVxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL0NvbGxlY3Rpb25MYXlvdXQnKTsiLCJ2YXIgTGF5b3V0RG9ja0hlbHBlciA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvTGF5b3V0RG9ja0hlbHBlcicpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBIZWFkZXJGb290ZXJMYXlvdXQoY29udGV4dCwgb3B0aW9ucykge1xuICAgIHZhciBkb2NrID0gbmV3IExheW91dERvY2tIZWxwZXIoY29udGV4dCwgb3B0aW9ucyk7XG4gICAgZG9jay50b3AoJ2hlYWRlcicsIG9wdGlvbnMuaGVhZGVyU2l6ZSAhPT0gdW5kZWZpbmVkID8gb3B0aW9ucy5oZWFkZXJTaXplIDogb3B0aW9ucy5oZWFkZXJIZWlnaHQpO1xuICAgIGRvY2suYm90dG9tKCdmb290ZXInLCBvcHRpb25zLmZvb3RlclNpemUgIT09IHVuZGVmaW5lZCA/IG9wdGlvbnMuZm9vdGVyU2l6ZSA6IG9wdGlvbnMuZm9vdGVySGVpZ2h0KTtcbiAgICBkb2NrLmZpbGwoJ2NvbnRlbnQnKTtcbn07IiwidmFyIFV0aWxpdHkgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMudXRpbGl0aWVzLlV0aWxpdHkgOiBudWxsO1xudmFyIExheW91dFV0aWxpdHkgPSByZXF1aXJlKCcuLi9MYXlvdXRVdGlsaXR5Jyk7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5ZLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IHRydWUsXG4gICAgICAgIHRydWVTaXplOiB0cnVlLFxuICAgICAgICBzZXF1ZW50aWFsU2Nyb2xsaW5nT3B0aW1pemVkOiB0cnVlXG4gICAgfTtcbnZhciBzZXQgPSB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHNjcm9sbExlbmd0aDogdW5kZWZpbmVkXG4gICAgfTtcbnZhciBtYXJnaW4gPSBbXG4gICAgICAgIDAsXG4gICAgICAgIDBcbiAgICBdO1xuZnVuY3Rpb24gTGlzdExheW91dChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIHNpemUgPSBjb250ZXh0LnNpemU7XG4gICAgdmFyIGRpcmVjdGlvbiA9IGNvbnRleHQuZGlyZWN0aW9uO1xuICAgIHZhciBhbGlnbm1lbnQgPSBjb250ZXh0LmFsaWdubWVudDtcbiAgICB2YXIgcmV2RGlyZWN0aW9uID0gZGlyZWN0aW9uID8gMCA6IDE7XG4gICAgdmFyIG9mZnNldDtcbiAgICB2YXIgbWFyZ2lucyA9IExheW91dFV0aWxpdHkubm9ybWFsaXplTWFyZ2lucyhvcHRpb25zLm1hcmdpbnMpO1xuICAgIHZhciBzcGFjaW5nID0gb3B0aW9ucy5zcGFjaW5nIHx8IDA7XG4gICAgdmFyIG5vZGU7XG4gICAgdmFyIG5vZGVTaXplO1xuICAgIHZhciBpdGVtU2l6ZTtcbiAgICB2YXIgZ2V0SXRlbVNpemU7XG4gICAgdmFyIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGw7XG4gICAgdmFyIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxPZmZzZXQ7XG4gICAgdmFyIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGg7XG4gICAgdmFyIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGg7XG4gICAgdmFyIGZpcnN0VmlzaWJsZUNlbGw7XG4gICAgdmFyIGxhc3ROb2RlO1xuICAgIHZhciBsYXN0Q2VsbE9mZnNldEluRmlyc3RWaXNpYmxlU2VjdGlvbjtcbiAgICB2YXIgaXNTZWN0aW9uQ2FsbGJhY2sgPSBvcHRpb25zLmlzU2VjdGlvbkNhbGxiYWNrO1xuICAgIHZhciBib3VuZDtcbiAgICBzZXQuc2l6ZVswXSA9IHNpemVbMF07XG4gICAgc2V0LnNpemVbMV0gPSBzaXplWzFdO1xuICAgIHNldC5zaXplW3JldkRpcmVjdGlvbl0gLT0gbWFyZ2luc1sxIC0gcmV2RGlyZWN0aW9uXSArIG1hcmdpbnNbMyAtIHJldkRpcmVjdGlvbl07XG4gICAgc2V0LnRyYW5zbGF0ZVswXSA9IDA7XG4gICAgc2V0LnRyYW5zbGF0ZVsxXSA9IDA7XG4gICAgc2V0LnRyYW5zbGF0ZVsyXSA9IDA7XG4gICAgc2V0LnRyYW5zbGF0ZVtyZXZEaXJlY3Rpb25dID0gbWFyZ2luc1tkaXJlY3Rpb24gPyAzIDogMF07XG4gICAgaWYgKG9wdGlvbnMuaXRlbVNpemUgPT09IHRydWUgfHwgIW9wdGlvbnMuaGFzT3duUHJvcGVydHkoJ2l0ZW1TaXplJykpIHtcbiAgICAgICAgaXRlbVNpemUgPSB0cnVlO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5pdGVtU2l6ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIGdldEl0ZW1TaXplID0gb3B0aW9ucy5pdGVtU2l6ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtU2l6ZSA9IG9wdGlvbnMuaXRlbVNpemUgPT09IHVuZGVmaW5lZCA/IHNpemVbZGlyZWN0aW9uXSA6IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgfVxuICAgIG1hcmdpblswXSA9IG1hcmdpbnNbZGlyZWN0aW9uID8gMCA6IDNdO1xuICAgIG1hcmdpblsxXSA9IC1tYXJnaW5zW2RpcmVjdGlvbiA/IDIgOiAxXTtcbiAgICBvZmZzZXQgPSBjb250ZXh0LnNjcm9sbE9mZnNldCArIG1hcmdpblthbGlnbm1lbnRdO1xuICAgIGJvdW5kID0gY29udGV4dC5zY3JvbGxFbmQgKyBtYXJnaW5bYWxpZ25tZW50XTtcbiAgICB3aGlsZSAob2Zmc2V0IDwgYm91bmQgKyBzcGFjaW5nKSB7XG4gICAgICAgIGxhc3ROb2RlID0gbm9kZTtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQubmV4dCgpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVTaXplID0gZ2V0SXRlbVNpemUgPyBnZXRJdGVtU2l6ZShub2RlLnJlbmRlck5vZGUpIDogaXRlbVNpemU7XG4gICAgICAgIG5vZGVTaXplID0gbm9kZVNpemUgPT09IHRydWUgPyBjb250ZXh0LnJlc29sdmVTaXplKG5vZGUsIHNpemUpW2RpcmVjdGlvbl0gOiBub2RlU2l6ZTtcbiAgICAgICAgc2V0LnNpemVbZGlyZWN0aW9uXSA9IG5vZGVTaXplO1xuICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBvZmZzZXQgKyAoYWxpZ25tZW50ID8gc3BhY2luZyA6IDApO1xuICAgICAgICBzZXQuc2Nyb2xsTGVuZ3RoID0gbm9kZVNpemUgKyBzcGFjaW5nO1xuICAgICAgICBjb250ZXh0LnNldChub2RlLCBzZXQpO1xuICAgICAgICBvZmZzZXQgKz0gc2V0LnNjcm9sbExlbmd0aDtcbiAgICAgICAgaWYgKGlzU2VjdGlvbkNhbGxiYWNrICYmIGlzU2VjdGlvbkNhbGxiYWNrKG5vZGUucmVuZGVyTm9kZSkpIHtcbiAgICAgICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IE1hdGgubWF4KG1hcmdpblswXSwgc2V0LnRyYW5zbGF0ZVtkaXJlY3Rpb25dKTtcbiAgICAgICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHNldCk7XG4gICAgICAgICAgICBpZiAoIWZpcnN0VmlzaWJsZUNlbGwpIHtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsID0gbm9kZTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsT2Zmc2V0ID0gb2Zmc2V0IC0gbm9kZVNpemU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aCA9IG5vZGVTaXplO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGggPSBub2RlU2l6ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAobGFzdENlbGxPZmZzZXRJbkZpcnN0VmlzaWJsZVNlY3Rpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uID0gb2Zmc2V0IC0gbm9kZVNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIWZpcnN0VmlzaWJsZUNlbGwgJiYgb2Zmc2V0ID49IDApIHtcbiAgICAgICAgICAgIGZpcnN0VmlzaWJsZUNlbGwgPSBub2RlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChsYXN0Tm9kZSAmJiAhbm9kZSAmJiAhYWxpZ25tZW50KSB7XG4gICAgICAgIHNldC5zY3JvbGxMZW5ndGggPSBub2RlU2l6ZSArIG1hcmdpblswXSArIC1tYXJnaW5bMV07XG4gICAgICAgIGNvbnRleHQuc2V0KGxhc3ROb2RlLCBzZXQpO1xuICAgIH1cbiAgICBsYXN0Tm9kZSA9IHVuZGVmaW5lZDtcbiAgICBub2RlID0gdW5kZWZpbmVkO1xuICAgIG9mZnNldCA9IGNvbnRleHQuc2Nyb2xsT2Zmc2V0ICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgYm91bmQgPSBjb250ZXh0LnNjcm9sbFN0YXJ0ICsgbWFyZ2luW2FsaWdubWVudF07XG4gICAgd2hpbGUgKG9mZnNldCA+IGJvdW5kIC0gc3BhY2luZykge1xuICAgICAgICBsYXN0Tm9kZSA9IG5vZGU7XG4gICAgICAgIG5vZGUgPSBjb250ZXh0LnByZXYoKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlU2l6ZSA9IGdldEl0ZW1TaXplID8gZ2V0SXRlbVNpemUobm9kZS5yZW5kZXJOb2RlKSA6IGl0ZW1TaXplO1xuICAgICAgICBub2RlU2l6ZSA9IG5vZGVTaXplID09PSB0cnVlID8gY29udGV4dC5yZXNvbHZlU2l6ZShub2RlLCBzaXplKVtkaXJlY3Rpb25dIDogbm9kZVNpemU7XG4gICAgICAgIHNldC5zY3JvbGxMZW5ndGggPSBub2RlU2l6ZSArIHNwYWNpbmc7XG4gICAgICAgIG9mZnNldCAtPSBzZXQuc2Nyb2xsTGVuZ3RoO1xuICAgICAgICBzZXQuc2l6ZVtkaXJlY3Rpb25dID0gbm9kZVNpemU7XG4gICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IG9mZnNldCArIChhbGlnbm1lbnQgPyBzcGFjaW5nIDogMCk7XG4gICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHNldCk7XG4gICAgICAgIGlmIChpc1NlY3Rpb25DYWxsYmFjayAmJiBpc1NlY3Rpb25DYWxsYmFjayhub2RlLnJlbmRlck5vZGUpKSB7XG4gICAgICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBNYXRoLm1heChtYXJnaW5bMF0sIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSk7XG4gICAgICAgICAgICBjb250ZXh0LnNldChub2RlLCBzZXQpO1xuICAgICAgICAgICAgaWYgKCFsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsKSB7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbE9mZnNldCA9IG9mZnNldDtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsTGVuZ3RoID0gbm9kZVNpemU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbFNjcm9sbExlbmd0aCA9IHNldC5zY3JvbGxMZW5ndGg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob2Zmc2V0ICsgbm9kZVNpemUgPj0gMCkge1xuICAgICAgICAgICAgZmlyc3RWaXNpYmxlQ2VsbCA9IG5vZGU7XG4gICAgICAgICAgICBpZiAobGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCkge1xuICAgICAgICAgICAgICAgIGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uID0gb2Zmc2V0ICsgbm9kZVNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChsYXN0Tm9kZSAmJiAhbm9kZSAmJiBhbGlnbm1lbnQpIHtcbiAgICAgICAgc2V0LnNjcm9sbExlbmd0aCA9IG5vZGVTaXplICsgbWFyZ2luWzBdICsgLW1hcmdpblsxXTtcbiAgICAgICAgY29udGV4dC5zZXQobGFzdE5vZGUsIHNldCk7XG4gICAgICAgIGlmIChsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsID09PSBsYXN0Tm9kZSkge1xuICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbFNjcm9sbExlbmd0aCA9IHNldC5zY3JvbGxMZW5ndGg7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzU2VjdGlvbkNhbGxiYWNrICYmICFsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsKSB7XG4gICAgICAgIG5vZGUgPSBjb250ZXh0LnByZXYoKTtcbiAgICAgICAgd2hpbGUgKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChpc1NlY3Rpb25DYWxsYmFjayhub2RlLnJlbmRlck5vZGUpKSB7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbm9kZVNpemUgPSBvcHRpb25zLml0ZW1TaXplIHx8IGNvbnRleHQucmVzb2x2ZVNpemUobm9kZSwgc2l6ZSlbZGlyZWN0aW9uXTtcbiAgICAgICAgICAgICAgICBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsT2Zmc2V0ID0gb2Zmc2V0IC0gbm9kZVNpemU7XG4gICAgICAgICAgICAgICAgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aCA9IG5vZGVTaXplO1xuICAgICAgICAgICAgICAgIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGggPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBjb250ZXh0LnByZXYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAobGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbCkge1xuICAgICAgICB2YXIgY29ycmVjdGVkT2Zmc2V0ID0gTWF0aC5tYXgobWFyZ2luWzBdLCBsYXN0U2VjdGlvbkJlZm9yZVZpc2libGVDZWxsT2Zmc2V0KTtcbiAgICAgICAgaWYgKGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uICE9PSB1bmRlZmluZWQgJiYgbGFzdFNlY3Rpb25CZWZvcmVWaXNpYmxlQ2VsbExlbmd0aCA+IGxhc3RDZWxsT2Zmc2V0SW5GaXJzdFZpc2libGVTZWN0aW9uIC0gbWFyZ2luWzBdKSB7XG4gICAgICAgICAgICBjb3JyZWN0ZWRPZmZzZXQgPSBsYXN0Q2VsbE9mZnNldEluRmlyc3RWaXNpYmxlU2VjdGlvbiAtIGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgc2V0LnNpemVbZGlyZWN0aW9uXSA9IGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxMZW5ndGg7XG4gICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IGNvcnJlY3RlZE9mZnNldDtcbiAgICAgICAgc2V0LnNjcm9sbExlbmd0aCA9IGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGxTY3JvbGxMZW5ndGg7XG4gICAgICAgIGNvbnRleHQuc2V0KGxhc3RTZWN0aW9uQmVmb3JlVmlzaWJsZUNlbGwsIHNldCk7XG4gICAgfVxufVxuTGlzdExheW91dC5DYXBhYmlsaXRpZXMgPSBjYXBhYmlsaXRpZXM7XG5MaXN0TGF5b3V0Lk5hbWUgPSAnTGlzdExheW91dCc7XG5MaXN0TGF5b3V0LkRlc2NyaXB0aW9uID0gJ0xpc3QtbGF5b3V0IHdpdGggbWFyZ2lucywgc3BhY2luZyBhbmQgc3RpY2t5IGhlYWRlcnMnO1xubW9kdWxlLmV4cG9ydHMgPSBMaXN0TGF5b3V0OyIsInZhciBMYXlvdXREb2NrSGVscGVyID0gcmVxdWlyZSgnLi4vaGVscGVycy9MYXlvdXREb2NrSGVscGVyJyk7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIE5hdkJhckxheW91dChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgdmFyIGRvY2sgPSBuZXcgTGF5b3V0RG9ja0hlbHBlcihjb250ZXh0LCB7XG4gICAgICAgICAgICBtYXJnaW5zOiBvcHRpb25zLm1hcmdpbnMsXG4gICAgICAgICAgICB0cmFuc2xhdGVaOiAxXG4gICAgICAgIH0pO1xuICAgIGNvbnRleHQuc2V0KCdiYWNrZ3JvdW5kJywgeyBzaXplOiBjb250ZXh0LnNpemUgfSk7XG4gICAgdmFyIG5vZGU7XG4gICAgdmFyIGk7XG4gICAgdmFyIHJpZ2h0SXRlbXMgPSBjb250ZXh0LmdldCgncmlnaHRJdGVtcycpO1xuICAgIGlmIChyaWdodEl0ZW1zKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCByaWdodEl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBub2RlID0gY29udGV4dC5nZXQocmlnaHRJdGVtc1tpXSk7XG4gICAgICAgICAgICBkb2NrLnJpZ2h0KG5vZGUsIG9wdGlvbnMucmlnaHRJdGVtV2lkdGggfHwgb3B0aW9ucy5pdGVtV2lkdGgpO1xuICAgICAgICAgICAgZG9jay5yaWdodCh1bmRlZmluZWQsIG9wdGlvbnMucmlnaHRJdGVtU3BhY2VyIHx8IG9wdGlvbnMuaXRlbVNwYWNlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGxlZnRJdGVtcyA9IGNvbnRleHQuZ2V0KCdsZWZ0SXRlbXMnKTtcbiAgICBpZiAobGVmdEl0ZW1zKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZWZ0SXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5vZGUgPSBjb250ZXh0LmdldChsZWZ0SXRlbXNbaV0pO1xuICAgICAgICAgICAgZG9jay5sZWZ0KG5vZGUsIG9wdGlvbnMubGVmdEl0ZW1XaWR0aCB8fCBvcHRpb25zLml0ZW1XaWR0aCk7XG4gICAgICAgICAgICBkb2NrLmxlZnQodW5kZWZpbmVkLCBvcHRpb25zLmxlZnRJdGVtU3BhY2VyIHx8IG9wdGlvbnMuaXRlbVNwYWNlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZG9jay5maWxsKCd0aXRsZScpO1xufTsiLCJ2YXIgVXRpbGl0eSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy51dGlsaXRpZXMuVXRpbGl0eSA6IG51bGw7XG52YXIgY2FwYWJpbGl0aWVzID0ge1xuICAgICAgICBzZXF1ZW5jZTogdHJ1ZSxcbiAgICAgICAgZGlyZWN0aW9uOiBbXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5ZLFxuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWFxuICAgICAgICBdLFxuICAgICAgICBzY3JvbGxpbmc6IGZhbHNlXG4gICAgfTtcbnZhciBkaXJlY3Rpb247XG52YXIgc2l6ZTtcbnZhciByYXRpb3M7XG52YXIgdG90YWw7XG52YXIgb2Zmc2V0O1xudmFyIGluZGV4O1xudmFyIG5vZGU7XG52YXIgc2V0ID0ge1xuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdXG4gICAgfTtcbmZ1bmN0aW9uIFByb3BvcnRpb25hbExheW91dChjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgc2l6ZSA9IGNvbnRleHQuc2l6ZTtcbiAgICBkaXJlY3Rpb24gPSBjb250ZXh0LmRpcmVjdGlvbjtcbiAgICByYXRpb3MgPSBvcHRpb25zLnJhdGlvcztcbiAgICB0b3RhbCA9IDA7XG4gICAgZm9yIChpbmRleCA9IDA7IGluZGV4IDwgcmF0aW9zLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICB0b3RhbCArPSByYXRpb3NbaW5kZXhdO1xuICAgIH1cbiAgICBzZXQuc2l6ZVswXSA9IHNpemVbMF07XG4gICAgc2V0LnNpemVbMV0gPSBzaXplWzFdO1xuICAgIHNldC50cmFuc2xhdGVbMF0gPSAwO1xuICAgIHNldC50cmFuc2xhdGVbMV0gPSAwO1xuICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICBvZmZzZXQgPSAwO1xuICAgIGluZGV4ID0gMDtcbiAgICB3aGlsZSAobm9kZSAmJiBpbmRleCA8IHJhdGlvcy5sZW5ndGgpIHtcbiAgICAgICAgc2V0LnNpemVbZGlyZWN0aW9uXSA9IChzaXplW2RpcmVjdGlvbl0gLSBvZmZzZXQpIC8gdG90YWwgKiByYXRpb3NbaW5kZXhdO1xuICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBvZmZzZXQ7XG4gICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHNldCk7XG4gICAgICAgIG9mZnNldCArPSBzZXQuc2l6ZVtkaXJlY3Rpb25dO1xuICAgICAgICB0b3RhbCAtPSByYXRpb3NbaW5kZXhdO1xuICAgICAgICBpbmRleCsrO1xuICAgICAgICBub2RlID0gY29udGV4dC5uZXh0KCk7XG4gICAgfVxufVxuUHJvcG9ydGlvbmFsTGF5b3V0LkNhcGFiaWxpdGllcyA9IGNhcGFiaWxpdGllcztcbm1vZHVsZS5leHBvcnRzID0gUHJvcG9ydGlvbmFsTGF5b3V0OyIsInZhciBVdGlsaXR5ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogbnVsbDtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi4vTGF5b3V0VXRpbGl0eScpO1xudmFyIGNhcGFiaWxpdGllcyA9IHtcbiAgICAgICAgc2VxdWVuY2U6IHRydWUsXG4gICAgICAgIGRpcmVjdGlvbjogW1xuICAgICAgICAgICAgVXRpbGl0eS5EaXJlY3Rpb24uWCxcbiAgICAgICAgICAgIFV0aWxpdHkuRGlyZWN0aW9uLllcbiAgICAgICAgXSxcbiAgICAgICAgdHJ1ZVNpemU6IHRydWVcbiAgICB9O1xudmFyIHNpemU7XG52YXIgZGlyZWN0aW9uO1xudmFyIHJldkRpcmVjdGlvbjtcbnZhciBpdGVtcztcbnZhciBzcGFjZXJzO1xudmFyIG1hcmdpbnM7XG52YXIgc3BhY2luZztcbnZhciBzaXplTGVmdDtcbnZhciBzZXQgPSB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIGFsaWduOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF1cbiAgICB9O1xudmFyIG5vZGVTaXplO1xudmFyIG9mZnNldDtcbnZhciB6SW5jcmVtZW50O1xuZnVuY3Rpb24gVGFiQmFyTGF5b3V0KGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBzaXplID0gY29udGV4dC5zaXplO1xuICAgIGRpcmVjdGlvbiA9IGNvbnRleHQuZGlyZWN0aW9uO1xuICAgIHJldkRpcmVjdGlvbiA9IGRpcmVjdGlvbiA/IDAgOiAxO1xuICAgIHNwYWNpbmcgPSBvcHRpb25zLnNwYWNpbmcgfHwgMDtcbiAgICBpdGVtcyA9IGNvbnRleHQuZ2V0KCdpdGVtcycpO1xuICAgIHNwYWNlcnMgPSBjb250ZXh0LmdldCgnc3BhY2VycycpO1xuICAgIG1hcmdpbnMgPSBMYXlvdXRVdGlsaXR5Lm5vcm1hbGl6ZU1hcmdpbnMob3B0aW9ucy5tYXJnaW5zKTtcbiAgICB6SW5jcmVtZW50ID0gb3B0aW9ucy56SW5jcmVtZW50IHx8IDAuMDAxO1xuICAgIHNldC5zaXplWzBdID0gY29udGV4dC5zaXplWzBdO1xuICAgIHNldC5zaXplWzFdID0gY29udGV4dC5zaXplWzFdO1xuICAgIHNldC5zaXplW3JldkRpcmVjdGlvbl0gLT0gbWFyZ2luc1sxIC0gcmV2RGlyZWN0aW9uXSArIG1hcmdpbnNbMyAtIHJldkRpcmVjdGlvbl07XG4gICAgc2V0LnRyYW5zbGF0ZVswXSA9IDA7XG4gICAgc2V0LnRyYW5zbGF0ZVsxXSA9IDA7XG4gICAgc2V0LnRyYW5zbGF0ZVsyXSA9IHpJbmNyZW1lbnQ7XG4gICAgc2V0LnRyYW5zbGF0ZVtyZXZEaXJlY3Rpb25dID0gbWFyZ2luc1tkaXJlY3Rpb24gPyAzIDogMF07XG4gICAgc2V0LmFsaWduWzBdID0gMDtcbiAgICBzZXQuYWxpZ25bMV0gPSAwO1xuICAgIHNldC5vcmlnaW5bMF0gPSAwO1xuICAgIHNldC5vcmlnaW5bMV0gPSAwO1xuICAgIG9mZnNldCA9IGRpcmVjdGlvbiA/IG1hcmdpbnNbMF0gOiBtYXJnaW5zWzNdO1xuICAgIHNpemVMZWZ0ID0gc2l6ZVtkaXJlY3Rpb25dIC0gKG9mZnNldCArIChkaXJlY3Rpb24gPyBtYXJnaW5zWzJdIDogbWFyZ2luc1sxXSkpO1xuICAgIHNpemVMZWZ0IC09IChpdGVtcy5sZW5ndGggLSAxKSAqIHNwYWNpbmc7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAob3B0aW9ucy5pdGVtU2l6ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBub2RlU2l6ZSA9IE1hdGgucm91bmQoc2l6ZUxlZnQgLyAoaXRlbXMubGVuZ3RoIC0gaSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZVNpemUgPSBvcHRpb25zLml0ZW1TaXplID09PSB0cnVlID8gY29udGV4dC5yZXNvbHZlU2l6ZShpdGVtc1tpXSwgc2l6ZSlbZGlyZWN0aW9uXSA6IG9wdGlvbnMuaXRlbVNpemU7XG4gICAgICAgIH1cbiAgICAgICAgc2V0LnNjcm9sbExlbmd0aCA9IG5vZGVTaXplO1xuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgc2V0LnNjcm9sbExlbmd0aCArPSBkaXJlY3Rpb24gPyBtYXJnaW5zWzBdIDogbWFyZ2luc1szXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaSA9PT0gaXRlbXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgc2V0LnNjcm9sbExlbmd0aCArPSBkaXJlY3Rpb24gPyBtYXJnaW5zWzJdIDogbWFyZ2luc1sxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldC5zY3JvbGxMZW5ndGggKz0gc3BhY2luZztcbiAgICAgICAgfVxuICAgICAgICBzZXQuc2l6ZVtkaXJlY3Rpb25dID0gbm9kZVNpemU7XG4gICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IG9mZnNldDtcbiAgICAgICAgY29udGV4dC5zZXQoaXRlbXNbaV0sIHNldCk7XG4gICAgICAgIG9mZnNldCArPSBub2RlU2l6ZTtcbiAgICAgICAgc2l6ZUxlZnQgLT0gbm9kZVNpemU7XG4gICAgICAgIGlmIChpID09PSBvcHRpb25zLnNlbGVjdGVkSXRlbUluZGV4KSB7XG4gICAgICAgICAgICBzZXQuc2Nyb2xsTGVuZ3RoID0gMDtcbiAgICAgICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSArPSBub2RlU2l6ZSAvIDI7XG4gICAgICAgICAgICBzZXQudHJhbnNsYXRlWzJdID0gekluY3JlbWVudCAqIDI7XG4gICAgICAgICAgICBzZXQub3JpZ2luW2RpcmVjdGlvbl0gPSAwLjU7XG4gICAgICAgICAgICBjb250ZXh0LnNldCgnc2VsZWN0ZWRJdGVtT3ZlcmxheScsIHNldCk7XG4gICAgICAgICAgICBzZXQub3JpZ2luW2RpcmVjdGlvbl0gPSAwO1xuICAgICAgICAgICAgc2V0LnRyYW5zbGF0ZVsyXSA9IHpJbmNyZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGkgPCBpdGVtcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICBpZiAoc3BhY2VycyAmJiBpIDwgc3BhY2Vycy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBzZXQuc2l6ZVtkaXJlY3Rpb25dID0gc3BhY2luZztcbiAgICAgICAgICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSBvZmZzZXQ7XG4gICAgICAgICAgICAgICAgY29udGV4dC5zZXQoc3BhY2Vyc1tpXSwgc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9mZnNldCArPSBzcGFjaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2Zmc2V0ICs9IGRpcmVjdGlvbiA/IG1hcmdpbnNbMl0gOiBtYXJnaW5zWzFdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldC5zY3JvbGxMZW5ndGggPSAwO1xuICAgIHNldC5zaXplWzBdID0gc2l6ZVswXTtcbiAgICBzZXQuc2l6ZVsxXSA9IHNpemVbMV07XG4gICAgc2V0LnNpemVbZGlyZWN0aW9uXSA9IHNpemVbZGlyZWN0aW9uXTtcbiAgICBzZXQudHJhbnNsYXRlWzBdID0gMDtcbiAgICBzZXQudHJhbnNsYXRlWzFdID0gMDtcbiAgICBzZXQudHJhbnNsYXRlWzJdID0gMDtcbiAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSAwO1xuICAgIGNvbnRleHQuc2V0KCdiYWNrZ3JvdW5kJywgc2V0KTtcbn1cblRhYkJhckxheW91dC5DYXBhYmlsaXRpZXMgPSBjYXBhYmlsaXRpZXM7XG5UYWJCYXJMYXlvdXQuTmFtZSA9ICdUYWJCYXJMYXlvdXQnO1xuVGFiQmFyTGF5b3V0LkRlc2NyaXB0aW9uID0gJ1RhYkJhciB3aWRnZXQgbGF5b3V0Jztcbm1vZHVsZS5leHBvcnRzID0gVGFiQmFyTGF5b3V0OyIsInZhciBVdGlsaXR5ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogbnVsbDtcbnZhciBjYXBhYmlsaXRpZXMgPSB7XG4gICAgICAgIHNlcXVlbmNlOiB0cnVlLFxuICAgICAgICBkaXJlY3Rpb246IFtcbiAgICAgICAgICAgIFV0aWxpdHkuRGlyZWN0aW9uLlksXG4gICAgICAgICAgICBVdGlsaXR5LkRpcmVjdGlvbi5YXG4gICAgICAgIF0sXG4gICAgICAgIHNjcm9sbGluZzogdHJ1ZSxcbiAgICAgICAgdHJ1ZVNpemU6IHRydWVcbiAgICB9O1xudmFyIHNpemU7XG52YXIgZGlyZWN0aW9uO1xudmFyIHJldkRpcmVjdGlvbjtcbnZhciBub2RlO1xudmFyIGl0ZW1TaXplO1xudmFyIGRpYW1ldGVyO1xudmFyIG9mZnNldDtcbnZhciBib3VuZDtcbnZhciBhbmdsZTtcbnZhciByYWRpdXM7XG52YXIgaXRlbUFuZ2xlO1xudmFyIHJhZGlhbE9wYWNpdHk7XG52YXIgc2V0ID0ge1xuICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICB0cmFuc2xhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICByb3RhdGU6IFtcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMFxuICAgICAgICBdLFxuICAgICAgICBvcmlnaW46IFtcbiAgICAgICAgICAgIDAuNSxcbiAgICAgICAgICAgIDAuNVxuICAgICAgICBdLFxuICAgICAgICBhbGlnbjogW1xuICAgICAgICAgICAgMC41LFxuICAgICAgICAgICAgMC41XG4gICAgICAgIF0sXG4gICAgICAgIHNjcm9sbExlbmd0aDogdW5kZWZpbmVkXG4gICAgfTtcbmZ1bmN0aW9uIFdoZWVsTGF5b3V0KGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICBzaXplID0gY29udGV4dC5zaXplO1xuICAgIGRpcmVjdGlvbiA9IGNvbnRleHQuZGlyZWN0aW9uO1xuICAgIHJldkRpcmVjdGlvbiA9IGRpcmVjdGlvbiA/IDAgOiAxO1xuICAgIGl0ZW1TaXplID0gb3B0aW9ucy5pdGVtU2l6ZSB8fCBzaXplW2RpcmVjdGlvbl0gLyAyO1xuICAgIGRpYW1ldGVyID0gb3B0aW9ucy5kaWFtZXRlciB8fCBpdGVtU2l6ZSAqIDM7XG4gICAgcmFkaXVzID0gZGlhbWV0ZXIgLyAyO1xuICAgIGl0ZW1BbmdsZSA9IE1hdGguYXRhbjIoaXRlbVNpemUgLyAyLCByYWRpdXMpICogMjtcbiAgICByYWRpYWxPcGFjaXR5ID0gb3B0aW9ucy5yYWRpYWxPcGFjaXR5ID09PSB1bmRlZmluZWQgPyAxIDogb3B0aW9ucy5yYWRpYWxPcGFjaXR5O1xuICAgIHNldC5vcGFjaXR5ID0gMTtcbiAgICBzZXQuc2l6ZVswXSA9IHNpemVbMF07XG4gICAgc2V0LnNpemVbMV0gPSBzaXplWzFdO1xuICAgIHNldC5zaXplW3JldkRpcmVjdGlvbl0gPSBzaXplW3JldkRpcmVjdGlvbl07XG4gICAgc2V0LnNpemVbZGlyZWN0aW9uXSA9IGl0ZW1TaXplO1xuICAgIHNldC50cmFuc2xhdGVbMF0gPSAwO1xuICAgIHNldC50cmFuc2xhdGVbMV0gPSAwO1xuICAgIHNldC50cmFuc2xhdGVbMl0gPSAwO1xuICAgIHNldC5yb3RhdGVbMF0gPSAwO1xuICAgIHNldC5yb3RhdGVbMV0gPSAwO1xuICAgIHNldC5yb3RhdGVbMl0gPSAwO1xuICAgIHNldC5zY3JvbGxMZW5ndGggPSBpdGVtU2l6ZTtcbiAgICBvZmZzZXQgPSBjb250ZXh0LnNjcm9sbE9mZnNldDtcbiAgICBib3VuZCA9IE1hdGguUEkgLyAyIC8gaXRlbUFuZ2xlICogaXRlbVNpemUgKyBpdGVtU2l6ZTtcbiAgICB3aGlsZSAob2Zmc2V0IDw9IGJvdW5kKSB7XG4gICAgICAgIG5vZGUgPSBjb250ZXh0Lm5leHQoKTtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2Zmc2V0ID49IC1ib3VuZCkge1xuICAgICAgICAgICAgYW5nbGUgPSBvZmZzZXQgLyBpdGVtU2l6ZSAqIGl0ZW1BbmdsZTtcbiAgICAgICAgICAgIHNldC50cmFuc2xhdGVbZGlyZWN0aW9uXSA9IHJhZGl1cyAqIE1hdGguc2luKGFuZ2xlKTtcbiAgICAgICAgICAgIHNldC50cmFuc2xhdGVbMl0gPSByYWRpdXMgKiBNYXRoLmNvcyhhbmdsZSkgLSByYWRpdXM7XG4gICAgICAgICAgICBzZXQucm90YXRlW3JldkRpcmVjdGlvbl0gPSBkaXJlY3Rpb24gPyAtYW5nbGUgOiBhbmdsZTtcbiAgICAgICAgICAgIHNldC5vcGFjaXR5ID0gMSAtIE1hdGguYWJzKGFuZ2xlKSAvIChNYXRoLlBJIC8gMikgKiAoMSAtIHJhZGlhbE9wYWNpdHkpO1xuICAgICAgICAgICAgY29udGV4dC5zZXQobm9kZSwgc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBvZmZzZXQgKz0gaXRlbVNpemU7XG4gICAgfVxuICAgIG9mZnNldCA9IGNvbnRleHQuc2Nyb2xsT2Zmc2V0IC0gaXRlbVNpemU7XG4gICAgd2hpbGUgKG9mZnNldCA+PSAtYm91bmQpIHtcbiAgICAgICAgbm9kZSA9IGNvbnRleHQucHJldigpO1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvZmZzZXQgPD0gYm91bmQpIHtcbiAgICAgICAgICAgIGFuZ2xlID0gb2Zmc2V0IC8gaXRlbVNpemUgKiBpdGVtQW5nbGU7XG4gICAgICAgICAgICBzZXQudHJhbnNsYXRlW2RpcmVjdGlvbl0gPSByYWRpdXMgKiBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgICAgICBzZXQudHJhbnNsYXRlWzJdID0gcmFkaXVzICogTWF0aC5jb3MoYW5nbGUpIC0gcmFkaXVzO1xuICAgICAgICAgICAgc2V0LnJvdGF0ZVtyZXZEaXJlY3Rpb25dID0gZGlyZWN0aW9uID8gLWFuZ2xlIDogYW5nbGU7XG4gICAgICAgICAgICBzZXQub3BhY2l0eSA9IDEgLSBNYXRoLmFicyhhbmdsZSkgLyAoTWF0aC5QSSAvIDIpICogKDEgLSByYWRpYWxPcGFjaXR5KTtcbiAgICAgICAgICAgIGNvbnRleHQuc2V0KG5vZGUsIHNldCk7XG4gICAgICAgIH1cbiAgICAgICAgb2Zmc2V0IC09IGl0ZW1TaXplO1xuICAgIH1cbn1cbldoZWVsTGF5b3V0LkNhcGFiaWxpdGllcyA9IGNhcGFiaWxpdGllcztcbldoZWVsTGF5b3V0Lk5hbWUgPSAnV2hlZWxMYXlvdXQnO1xuV2hlZWxMYXlvdXQuRGVzY3JpcHRpb24gPSAnU3Bpbm5lci13aGVlbC9zbG90LW1hY2hpbmUgbGF5b3V0Jztcbm1vZHVsZS5leHBvcnRzID0gV2hlZWxMYXlvdXQ7IiwidmFyIFZpZXcgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5WaWV3IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuVmlldyA6IG51bGw7XG52YXIgU3VyZmFjZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlN1cmZhY2UgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5TdXJmYWNlIDogbnVsbDtcbnZhciBVdGlsaXR5ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLnV0aWxpdGllcy5VdGlsaXR5IDogbnVsbDtcbnZhciBDb250YWluZXJTdXJmYWNlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLnN1cmZhY2VzLkNvbnRhaW5lclN1cmZhY2UgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuc3VyZmFjZXMuQ29udGFpbmVyU3VyZmFjZSA6IG51bGw7XG52YXIgTGF5b3V0Q29udHJvbGxlciA9IHJlcXVpcmUoJy4uL0xheW91dENvbnRyb2xsZXInKTtcbnZhciBTY3JvbGxDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vU2Nyb2xsQ29udHJvbGxlcicpO1xudmFyIFdoZWVsTGF5b3V0ID0gcmVxdWlyZSgnLi4vbGF5b3V0cy9XaGVlbExheW91dCcpO1xudmFyIFByb3BvcnRpb25hbExheW91dCA9IHJlcXVpcmUoJy4uL2xheW91dHMvUHJvcG9ydGlvbmFsTGF5b3V0Jyk7XG52YXIgVmlydHVhbFZpZXdTZXF1ZW5jZSA9IHJlcXVpcmUoJy4uL1ZpcnR1YWxWaWV3U2VxdWVuY2UnKTtcbnZhciBEYXRlUGlja2VyQ29tcG9uZW50cyA9IHJlcXVpcmUoJy4vRGF0ZVBpY2tlckNvbXBvbmVudHMnKTtcbnZhciBMYXlvdXRVdGlsaXR5ID0gcmVxdWlyZSgnLi4vTGF5b3V0VXRpbGl0eScpO1xuZnVuY3Rpb24gRGF0ZVBpY2tlcihvcHRpb25zKSB7XG4gICAgVmlldy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuX2RhdGUgPSBuZXcgRGF0ZShvcHRpb25zLmRhdGUgPyBvcHRpb25zLmRhdGUuZ2V0VGltZSgpIDogdW5kZWZpbmVkKTtcbiAgICB0aGlzLl9jb21wb25lbnRzID0gW107XG4gICAgdGhpcy5jbGFzc2VzID0gb3B0aW9ucy5jbGFzc2VzID8gdGhpcy5jbGFzc2VzLmNvbmNhdChvcHRpb25zLmNsYXNzZXMpIDogdGhpcy5jbGFzc2VzO1xuICAgIF9jcmVhdGVMYXlvdXQuY2FsbCh0aGlzKTtcbiAgICBfdXBkYXRlQ29tcG9uZW50cy5jYWxsKHRoaXMpO1xuICAgIHRoaXMuX292ZXJsYXlSZW5kZXJhYmxlcyA9IHtcbiAgICAgICAgdG9wOiBfY3JlYXRlUmVuZGVyYWJsZS5jYWxsKHRoaXMsICd0b3AnKSxcbiAgICAgICAgbWlkZGxlOiBfY3JlYXRlUmVuZGVyYWJsZS5jYWxsKHRoaXMsICdtaWRkbGUnKSxcbiAgICAgICAgYm90dG9tOiBfY3JlYXRlUmVuZGVyYWJsZS5jYWxsKHRoaXMsICdib3R0b20nKVxuICAgIH07XG4gICAgX2NyZWF0ZU92ZXJsYXkuY2FsbCh0aGlzKTtcbiAgICB0aGlzLnNldE9wdGlvbnModGhpcy5vcHRpb25zKTtcbn1cbkRhdGVQaWNrZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShWaWV3LnByb3RvdHlwZSk7XG5EYXRlUGlja2VyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERhdGVQaWNrZXI7XG5EYXRlUGlja2VyLnByb3RvdHlwZS5jbGFzc2VzID0gW1xuICAgICdmZi13aWRnZXQnLFxuICAgICdmZi1kYXRlcGlja2VyJ1xuXTtcbkRhdGVQaWNrZXIuQ29tcG9uZW50ID0gRGF0ZVBpY2tlckNvbXBvbmVudHM7XG5EYXRlUGlja2VyLkRFRkFVTFRfT1BUSU9OUyA9IHtcbiAgICBwZXJzcGVjdGl2ZTogNTAwLFxuICAgIHdoZWVsTGF5b3V0OiB7XG4gICAgICAgIGl0ZW1TaXplOiAxMDAsXG4gICAgICAgIGRpYW1ldGVyOiA1MDBcbiAgICB9LFxuICAgIGNyZWF0ZVJlbmRlcmFibGVzOiB7XG4gICAgICAgIGl0ZW06IHRydWUsXG4gICAgICAgIHRvcDogZmFsc2UsXG4gICAgICAgIG1pZGRsZTogZmFsc2UsXG4gICAgICAgIGJvdHRvbTogZmFsc2VcbiAgICB9LFxuICAgIHNjcm9sbENvbnRyb2xsZXI6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgcGFnaW5hdGVkOiB0cnVlLFxuICAgICAgICBwYWdpbmF0aW9uTW9kZTogU2Nyb2xsQ29udHJvbGxlci5QYWdpbmF0aW9uTW9kZS5TQ1JPTEwsXG4gICAgICAgIG1vdXNlTW92ZTogdHJ1ZSxcbiAgICAgICAgc2Nyb2xsU3ByaW5nOiB7XG4gICAgICAgICAgICBkYW1waW5nUmF0aW86IDEsXG4gICAgICAgICAgICBwZXJpb2Q6IDgwMFxuICAgICAgICB9XG4gICAgfVxufTtcbmZ1bmN0aW9uIF9jcmVhdGVSZW5kZXJhYmxlKGlkLCBkYXRhKSB7XG4gICAgdmFyIG9wdGlvbiA9IHRoaXMub3B0aW9ucy5jcmVhdGVSZW5kZXJhYmxlc1tBcnJheS5pc0FycmF5KGlkKSA/IGlkWzBdIDogaWRdO1xuICAgIGlmIChvcHRpb24gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICByZXR1cm4gb3B0aW9uLmNhbGwodGhpcywgaWQsIGRhdGEpO1xuICAgIH0gZWxzZSBpZiAoIW9wdGlvbikge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoZGF0YSAhPT0gdW5kZWZpbmVkICYmIGRhdGEgaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuICAgIHZhciBzdXJmYWNlID0gbmV3IFN1cmZhY2Uoe1xuICAgICAgICAgICAgY2xhc3NlczogdGhpcy5jbGFzc2VzLFxuICAgICAgICAgICAgY29udGVudDogZGF0YSA/ICc8ZGl2PicgKyBkYXRhICsgJzwvZGl2PicgOiB1bmRlZmluZWRcbiAgICAgICAgfSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaWQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN1cmZhY2UuYWRkQ2xhc3MoaWRbaV0pO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc3VyZmFjZS5hZGRDbGFzcyhpZCk7XG4gICAgfVxuICAgIHJldHVybiBzdXJmYWNlO1xufVxuRGF0ZVBpY2tlci5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgVmlldy5wcm90b3R5cGUuc2V0T3B0aW9ucy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIGlmICghdGhpcy5sYXlvdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnBlcnNwZWN0aXZlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIuY29udGV4dC5zZXRQZXJzcGVjdGl2ZShvcHRpb25zLnBlcnNwZWN0aXZlKTtcbiAgICB9XG4gICAgdmFyIGk7XG4gICAgaWYgKG9wdGlvbnMud2hlZWxMYXlvdXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zY3JvbGxXaGVlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsV2hlZWxzW2ldLnNjcm9sbENvbnRyb2xsZXIuc2V0TGF5b3V0T3B0aW9ucyhvcHRpb25zLndoZWVsTGF5b3V0KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm92ZXJsYXkuc2V0TGF5b3V0T3B0aW9ucyh7IGl0ZW1TaXplOiB0aGlzLm9wdGlvbnMud2hlZWxMYXlvdXQuaXRlbVNpemUgfSk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnNjcm9sbENvbnRyb2xsZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5zY3JvbGxXaGVlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsV2hlZWxzW2ldLnNjcm9sbENvbnRyb2xsZXIuc2V0T3B0aW9ucyhvcHRpb25zLnNjcm9sbENvbnRyb2xsZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcbkRhdGVQaWNrZXIucHJvdG90eXBlLnNldENvbXBvbmVudHMgPSBmdW5jdGlvbiAoY29tcG9uZW50cykge1xuICAgIHRoaXMuX2NvbXBvbmVudHMgPSBjb21wb25lbnRzO1xuICAgIF91cGRhdGVDb21wb25lbnRzLmNhbGwodGhpcyk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuRGF0ZVBpY2tlci5wcm90b3R5cGUuZ2V0Q29tcG9uZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50cztcbn07XG5EYXRlUGlja2VyLnByb3RvdHlwZS5zZXREYXRlID0gZnVuY3Rpb24gKGRhdGUpIHtcbiAgICB0aGlzLl9kYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkpO1xuICAgIF9zZXREYXRlVG9TY3JvbGxXaGVlbHMuY2FsbCh0aGlzLCB0aGlzLl9kYXRlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5EYXRlUGlja2VyLnByb3RvdHlwZS5nZXREYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9kYXRlO1xufTtcbmZ1bmN0aW9uIF9zZXREYXRlVG9TY3JvbGxXaGVlbHMoZGF0ZSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zY3JvbGxXaGVlbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNjcm9sbFdoZWVsID0gdGhpcy5zY3JvbGxXaGVlbHNbaV07XG4gICAgICAgIHZhciBjb21wb25lbnQgPSBzY3JvbGxXaGVlbC5jb21wb25lbnQ7XG4gICAgICAgIHZhciBpdGVtID0gc2Nyb2xsV2hlZWwuc2Nyb2xsQ29udHJvbGxlci5nZXRGaXJzdFZpc2libGVJdGVtKCk7XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0udmlld1NlcXVlbmNlKSB7XG4gICAgICAgICAgICB2YXIgdmlld1NlcXVlbmNlID0gaXRlbS52aWV3U2VxdWVuY2U7XG4gICAgICAgICAgICB2YXIgcmVuZGVyTm9kZSA9IGl0ZW0udmlld1NlcXVlbmNlLmdldCgpO1xuICAgICAgICAgICAgdmFyIGN1cnJlbnRWYWx1ZSA9IGNvbXBvbmVudC5nZXRDb21wb25lbnQocmVuZGVyTm9kZS5kYXRlKTtcbiAgICAgICAgICAgIHZhciBkZXN0VmFsdWUgPSBjb21wb25lbnQuZ2V0Q29tcG9uZW50KGRhdGUpO1xuICAgICAgICAgICAgdmFyIHN0ZXBzID0gMDtcbiAgICAgICAgICAgIGlmIChjdXJyZW50VmFsdWUgIT09IGRlc3RWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHN0ZXBzID0gZGVzdFZhbHVlIC0gY3VycmVudFZhbHVlO1xuICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQubG9vcCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmV2U3RlcHMgPSBzdGVwcyA8IDAgPyBzdGVwcyArIGNvbXBvbmVudC51cHBlckJvdW5kIDogc3RlcHMgLSBjb21wb25lbnQudXBwZXJCb3VuZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKHJldlN0ZXBzKSA8IE1hdGguYWJzKHN0ZXBzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcHMgPSByZXZTdGVwcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc3RlcHMpIHtcbiAgICAgICAgICAgICAgICBzY3JvbGxXaGVlbC5zY3JvbGxDb250cm9sbGVyLmdvVG9SZW5kZXJOb2RlKHJlbmRlck5vZGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aGlsZSAoY3VycmVudFZhbHVlICE9PSBkZXN0VmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmlld1NlcXVlbmNlID0gc3RlcHMgPiAwID8gdmlld1NlcXVlbmNlLmdldE5leHQoKSA6IHZpZXdTZXF1ZW5jZS5nZXRQcmV2aW91cygpO1xuICAgICAgICAgICAgICAgICAgICByZW5kZXJOb2RlID0gdmlld1NlcXVlbmNlID8gdmlld1NlcXVlbmNlLmdldCgpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlbmRlck5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IGNvbXBvbmVudC5nZXRDb21wb25lbnQocmVuZGVyTm9kZS5kYXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0ZXBzID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsV2hlZWwuc2Nyb2xsQ29udHJvbGxlci5nb1RvTmV4dFBhZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFdoZWVsLnNjcm9sbENvbnRyb2xsZXIuZ29Ub1ByZXZpb3VzUGFnZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gX2dldERhdGVGcm9tU2Nyb2xsV2hlZWxzKCkge1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUodGhpcy5fZGF0ZSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnNjcm9sbFdoZWVscy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2Nyb2xsV2hlZWwgPSB0aGlzLnNjcm9sbFdoZWVsc1tpXTtcbiAgICAgICAgdmFyIGNvbXBvbmVudCA9IHNjcm9sbFdoZWVsLmNvbXBvbmVudDtcbiAgICAgICAgdmFyIGl0ZW0gPSBzY3JvbGxXaGVlbC5zY3JvbGxDb250cm9sbGVyLmdldEZpcnN0VmlzaWJsZUl0ZW0oKTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5yZW5kZXJOb2RlKSB7XG4gICAgICAgICAgICBjb21wb25lbnQuc2V0Q29tcG9uZW50KGRhdGUsIGNvbXBvbmVudC5nZXRDb21wb25lbnQoaXRlbS5yZW5kZXJOb2RlLmRhdGUpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGF0ZTtcbn1cbmZ1bmN0aW9uIF9jcmVhdGVMYXlvdXQoKSB7XG4gICAgdGhpcy5jb250YWluZXIgPSBuZXcgQ29udGFpbmVyU3VyZmFjZSh0aGlzLm9wdGlvbnMuY29udGFpbmVyKTtcbiAgICB0aGlzLmNvbnRhaW5lci5zZXRDbGFzc2VzKHRoaXMuY2xhc3Nlcyk7XG4gICAgdGhpcy5sYXlvdXQgPSBuZXcgTGF5b3V0Q29udHJvbGxlcih7XG4gICAgICAgIGxheW91dDogUHJvcG9ydGlvbmFsTGF5b3V0LFxuICAgICAgICBsYXlvdXRPcHRpb25zOiB7IHJhdGlvczogW10gfSxcbiAgICAgICAgZGlyZWN0aW9uOiBVdGlsaXR5LkRpcmVjdGlvbi5YXG4gICAgfSk7XG4gICAgdGhpcy5jb250YWluZXIuYWRkKHRoaXMubGF5b3V0KTtcbiAgICB0aGlzLmFkZCh0aGlzLmNvbnRhaW5lcik7XG59XG5mdW5jdGlvbiBfY2xpY2tJdGVtKHNjcm9sbFdoZWVsLCBldmVudCkge1xufVxuZnVuY3Rpb24gX3Njcm9sbFdoZWVsU2Nyb2xsU3RhcnQoKSB7XG4gICAgdGhpcy5fc2Nyb2xsaW5nQ291bnQrKztcbiAgICBpZiAodGhpcy5fc2Nyb2xsaW5nQ291bnQgPT09IDEpIHtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnc2Nyb2xsc3RhcnQnLCB7IHRhcmdldDogdGhpcyB9KTtcbiAgICB9XG59XG5mdW5jdGlvbiBfc2Nyb2xsV2hlZWxTY3JvbGxFbmQoKSB7XG4gICAgdGhpcy5fc2Nyb2xsaW5nQ291bnQtLTtcbiAgICBpZiAodGhpcy5fc2Nyb2xsaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgdGhpcy5fZXZlbnRPdXRwdXQuZW1pdCgnc2Nyb2xsZW5kJywge1xuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLFxuICAgICAgICAgICAgZGF0ZTogdGhpcy5fZGF0ZVxuICAgICAgICB9KTtcbiAgICB9XG59XG5mdW5jdGlvbiBfc2Nyb2xsV2hlZWxQYWdlQ2hhbmdlKCkge1xuICAgIHRoaXMuX2RhdGUgPSBfZ2V0RGF0ZUZyb21TY3JvbGxXaGVlbHMuY2FsbCh0aGlzKTtcbiAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdkYXRlY2hhbmdlJywge1xuICAgICAgICB0YXJnZXQ6IHRoaXMsXG4gICAgICAgIGRhdGU6IHRoaXMuX2RhdGVcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIF91cGRhdGVDb21wb25lbnRzKCkge1xuICAgIHRoaXMuc2Nyb2xsV2hlZWxzID0gW107XG4gICAgdGhpcy5fc2Nyb2xsaW5nQ291bnQgPSAwO1xuICAgIHZhciBkYXRhU291cmNlID0gW107XG4gICAgdmFyIHNpemVSYXRpb3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2NvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNvbXBvbmVudCA9IHRoaXMuX2NvbXBvbmVudHNbaV07XG4gICAgICAgIGNvbXBvbmVudC5jcmVhdGVSZW5kZXJhYmxlID0gX2NyZWF0ZVJlbmRlcmFibGUuYmluZCh0aGlzKTtcbiAgICAgICAgdmFyIHZpZXdTZXF1ZW5jZSA9IG5ldyBWaXJ0dWFsVmlld1NlcXVlbmNlKHtcbiAgICAgICAgICAgICAgICBmYWN0b3J5OiBjb21wb25lbnQsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGNvbXBvbmVudC5jcmVhdGUodGhpcy5fZGF0ZSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB2YXIgb3B0aW9ucyA9IExheW91dFV0aWxpdHkuY29tYmluZU9wdGlvbnModGhpcy5vcHRpb25zLnNjcm9sbENvbnRyb2xsZXIsIHtcbiAgICAgICAgICAgICAgICBsYXlvdXQ6IFdoZWVsTGF5b3V0LFxuICAgICAgICAgICAgICAgIGxheW91dE9wdGlvbnM6IHRoaXMub3B0aW9ucy53aGVlbExheW91dCxcbiAgICAgICAgICAgICAgICBmbG93OiBmYWxzZSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFV0aWxpdHkuRGlyZWN0aW9uLlksXG4gICAgICAgICAgICAgICAgZGF0YVNvdXJjZTogdmlld1NlcXVlbmNlLFxuICAgICAgICAgICAgICAgIGF1dG9QaXBlRXZlbnRzOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgdmFyIHNjcm9sbENvbnRyb2xsZXIgPSBuZXcgU2Nyb2xsQ29udHJvbGxlcihvcHRpb25zKTtcbiAgICAgICAgc2Nyb2xsQ29udHJvbGxlci5vbignc2Nyb2xsc3RhcnQnLCBfc2Nyb2xsV2hlZWxTY3JvbGxTdGFydC5iaW5kKHRoaXMpKTtcbiAgICAgICAgc2Nyb2xsQ29udHJvbGxlci5vbignc2Nyb2xsZW5kJywgX3Njcm9sbFdoZWVsU2Nyb2xsRW5kLmJpbmQodGhpcykpO1xuICAgICAgICBzY3JvbGxDb250cm9sbGVyLm9uKCdwYWdlY2hhbmdlJywgX3Njcm9sbFdoZWVsUGFnZUNoYW5nZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgdmFyIHNjcm9sbFdoZWVsID0ge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogY29tcG9uZW50LFxuICAgICAgICAgICAgICAgIHNjcm9sbENvbnRyb2xsZXI6IHNjcm9sbENvbnRyb2xsZXIsXG4gICAgICAgICAgICAgICAgdmlld1NlcXVlbmNlOiB2aWV3U2VxdWVuY2VcbiAgICAgICAgICAgIH07XG4gICAgICAgIHRoaXMuc2Nyb2xsV2hlZWxzLnB1c2goc2Nyb2xsV2hlZWwpO1xuICAgICAgICBjb21wb25lbnQub24oJ2NsaWNrJywgX2NsaWNrSXRlbS5iaW5kKHRoaXMsIHNjcm9sbFdoZWVsKSk7XG4gICAgICAgIGRhdGFTb3VyY2UucHVzaChzY3JvbGxDb250cm9sbGVyKTtcbiAgICAgICAgc2l6ZVJhdGlvcy5wdXNoKGNvbXBvbmVudC5zaXplUmF0aW8pO1xuICAgIH1cbiAgICB0aGlzLmxheW91dC5zZXREYXRhU291cmNlKGRhdGFTb3VyY2UpO1xuICAgIHRoaXMubGF5b3V0LnNldExheW91dE9wdGlvbnMoeyByYXRpb3M6IHNpemVSYXRpb3MgfSk7XG59XG5mdW5jdGlvbiBPdmVybGF5TGF5b3V0KGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgICB2YXIgaGVpZ2h0ID0gKGNvbnRleHQuc2l6ZVsxXSAtIG9wdGlvbnMuaXRlbVNpemUpIC8gMjtcbiAgICBjb250ZXh0LnNldCgndG9wJywge1xuICAgICAgICBzaXplOiBbXG4gICAgICAgICAgICBjb250ZXh0LnNpemVbMF0sXG4gICAgICAgICAgICBoZWlnaHRcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXVxuICAgIH0pO1xuICAgIGNvbnRleHQuc2V0KCdtaWRkbGUnLCB7XG4gICAgICAgIHNpemU6IFtcbiAgICAgICAgICAgIGNvbnRleHQuc2l6ZVswXSxcbiAgICAgICAgICAgIGNvbnRleHQuc2l6ZVsxXSAtIGhlaWdodCAqIDJcbiAgICAgICAgXSxcbiAgICAgICAgdHJhbnNsYXRlOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgaGVpZ2h0LFxuICAgICAgICAgICAgMVxuICAgICAgICBdXG4gICAgfSk7XG4gICAgY29udGV4dC5zZXQoJ2JvdHRvbScsIHtcbiAgICAgICAgc2l6ZTogW1xuICAgICAgICAgICAgY29udGV4dC5zaXplWzBdLFxuICAgICAgICAgICAgaGVpZ2h0XG4gICAgICAgIF0sXG4gICAgICAgIHRyYW5zbGF0ZTogW1xuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIGNvbnRleHQuc2l6ZVsxXSAtIGhlaWdodCxcbiAgICAgICAgICAgIDFcbiAgICAgICAgXVxuICAgIH0pO1xufVxuZnVuY3Rpb24gX2NyZWF0ZU92ZXJsYXkoKSB7XG4gICAgdGhpcy5vdmVybGF5ID0gbmV3IExheW91dENvbnRyb2xsZXIoe1xuICAgICAgICBsYXlvdXQ6IE92ZXJsYXlMYXlvdXQsXG4gICAgICAgIGxheW91dE9wdGlvbnM6IHsgaXRlbVNpemU6IHRoaXMub3B0aW9ucy53aGVlbExheW91dC5pdGVtU2l6ZSB9LFxuICAgICAgICBkYXRhU291cmNlOiB0aGlzLl9vdmVybGF5UmVuZGVyYWJsZXNcbiAgICB9KTtcbiAgICB0aGlzLmFkZCh0aGlzLm92ZXJsYXkpO1xufVxubW9kdWxlLmV4cG9ydHMgPSBEYXRlUGlja2VyOyIsInZhciBTdXJmYWNlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cuZmFtb3VzLmNvcmUuU3VyZmFjZSA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLlN1cmZhY2UgOiBudWxsO1xudmFyIEV2ZW50SGFuZGxlciA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLkV2ZW50SGFuZGxlciA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsLmZhbW91cy5jb3JlLkV2ZW50SGFuZGxlciA6IG51bGw7XG5mdW5jdGlvbiBkZWNpbWFsMShkYXRlKSB7XG4gICAgcmV0dXJuICcnICsgZGF0ZVt0aGlzLmdldF0oKTtcbn1cbmZ1bmN0aW9uIGRlY2ltYWwyKGRhdGUpIHtcbiAgICByZXR1cm4gKCcwJyArIGRhdGVbdGhpcy5nZXRdKCkpLnNsaWNlKC0yKTtcbn1cbmZ1bmN0aW9uIGRlY2ltYWwzKGRhdGUpIHtcbiAgICByZXR1cm4gKCcwMCcgKyBkYXRlW3RoaXMuZ2V0XSgpKS5zbGljZSgtMyk7XG59XG5mdW5jdGlvbiBkZWNpbWFsNChkYXRlKSB7XG4gICAgcmV0dXJuICgnMDAwJyArIGRhdGVbdGhpcy5nZXRdKCkpLnNsaWNlKC00KTtcbn1cbmZ1bmN0aW9uIEJhc2Uob3B0aW9ucykge1xuICAgIHRoaXMuX2V2ZW50T3V0cHV0ID0gbmV3IEV2ZW50SGFuZGxlcigpO1xuICAgIHRoaXMuX3Bvb2wgPSBbXTtcbiAgICBFdmVudEhhbmRsZXIuc2V0T3V0cHV0SGFuZGxlcih0aGlzLCB0aGlzLl9ldmVudE91dHB1dCk7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXNba2V5XSA9IG9wdGlvbnNba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbn1cbkJhc2UucHJvdG90eXBlLnN0ZXAgPSAxO1xuQmFzZS5wcm90b3R5cGUuY2xhc3NlcyA9IFsnaXRlbSddO1xuQmFzZS5wcm90b3R5cGUuZ2V0Q29tcG9uZW50ID0gZnVuY3Rpb24gKGRhdGUpIHtcbiAgICByZXR1cm4gZGF0ZVt0aGlzLmdldF0oKTtcbn07XG5CYXNlLnByb3RvdHlwZS5zZXRDb21wb25lbnQgPSBmdW5jdGlvbiAoZGF0ZSwgdmFsdWUpIHtcbiAgICByZXR1cm4gZGF0ZVt0aGlzLnNldF0odmFsdWUpO1xufTtcbkJhc2UucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uIChkYXRlKSB7XG4gICAgcmV0dXJuICdvdmVyaWRlIHRvIGltcGxlbWVudCc7XG59O1xuQmFzZS5wcm90b3R5cGUuY3JlYXRlTmV4dCA9IGZ1bmN0aW9uIChyZW5kZXJhYmxlKSB7XG4gICAgdmFyIGRhdGUgPSB0aGlzLmdldE5leHQocmVuZGVyYWJsZS5kYXRlKTtcbiAgICByZXR1cm4gZGF0ZSA/IHRoaXMuY3JlYXRlKGRhdGUpIDogdW5kZWZpbmVkO1xufTtcbkJhc2UucHJvdG90eXBlLmdldE5leHQgPSBmdW5jdGlvbiAoZGF0ZSkge1xuICAgIGRhdGUgPSBuZXcgRGF0ZShkYXRlLmdldFRpbWUoKSk7XG4gICAgdmFyIG5ld1ZhbCA9IHRoaXMuZ2V0Q29tcG9uZW50KGRhdGUpICsgdGhpcy5zdGVwO1xuICAgIGlmICh0aGlzLnVwcGVyQm91bmQgIT09IHVuZGVmaW5lZCAmJiBuZXdWYWwgPj0gdGhpcy51cHBlckJvdW5kKSB7XG4gICAgICAgIGlmICghdGhpcy5sb29wKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIG5ld1ZhbCA9IE1hdGgubWF4KG5ld1ZhbCAlIHRoaXMudXBwZXJCb3VuZCwgdGhpcy5sb3dlckJvdW5kIHx8IDApO1xuICAgIH1cbiAgICB0aGlzLnNldENvbXBvbmVudChkYXRlLCBuZXdWYWwpO1xuICAgIHJldHVybiBkYXRlO1xufTtcbkJhc2UucHJvdG90eXBlLmNyZWF0ZVByZXZpb3VzID0gZnVuY3Rpb24gKHJlbmRlcmFibGUpIHtcbiAgICB2YXIgZGF0ZSA9IHRoaXMuZ2V0UHJldmlvdXMocmVuZGVyYWJsZS5kYXRlKTtcbiAgICByZXR1cm4gZGF0ZSA/IHRoaXMuY3JlYXRlKGRhdGUpIDogdW5kZWZpbmVkO1xufTtcbkJhc2UucHJvdG90eXBlLmdldFByZXZpb3VzID0gZnVuY3Rpb24gKGRhdGUpIHtcbiAgICBkYXRlID0gbmV3IERhdGUoZGF0ZS5nZXRUaW1lKCkpO1xuICAgIHZhciBuZXdWYWwgPSB0aGlzLmdldENvbXBvbmVudChkYXRlKSAtIHRoaXMuc3RlcDtcbiAgICBpZiAodGhpcy5sb3dlckJvdW5kICE9PSB1bmRlZmluZWQgJiYgbmV3VmFsIDwgdGhpcy5sb3dlckJvdW5kKSB7XG4gICAgICAgIGlmICghdGhpcy5sb29wKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIG5ld1ZhbCA9IG5ld1ZhbCAlIHRoaXMudXBwZXJCb3VuZDtcbiAgICB9XG4gICAgdGhpcy5zZXRDb21wb25lbnQoZGF0ZSwgbmV3VmFsKTtcbiAgICByZXR1cm4gZGF0ZTtcbn07XG5CYXNlLnByb3RvdHlwZS5pbnN0YWxsQ2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKHJlbmRlcmFibGUpIHtcbiAgICByZW5kZXJhYmxlLm9uKCdjbGljaycsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0aGlzLl9ldmVudE91dHB1dC5lbWl0KCdjbGljaycsIHtcbiAgICAgICAgICAgIHRhcmdldDogcmVuZGVyYWJsZSxcbiAgICAgICAgICAgIGV2ZW50OiBldmVudFxuICAgICAgICB9KTtcbiAgICB9LmJpbmQodGhpcykpO1xufTtcbkJhc2UucHJvdG90eXBlLmNyZWF0ZVJlbmRlcmFibGUgPSBmdW5jdGlvbiAoY2xhc3NlcywgZGF0YSkge1xuICAgIHJldHVybiBuZXcgU3VyZmFjZSh7XG4gICAgICAgIGNsYXNzZXM6IGNsYXNzZXMsXG4gICAgICAgIGNvbnRlbnQ6ICc8ZGl2PicgKyBkYXRhICsgJzwvZGl2PidcbiAgICB9KTtcbn07XG5CYXNlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoZGF0ZSkge1xuICAgIGRhdGUgPSBkYXRlIHx8IG5ldyBEYXRlKCk7XG4gICAgdmFyIHJlbmRlcmFibGU7XG4gICAgaWYgKHRoaXMuX3Bvb2wubGVuZ3RoKSB7XG4gICAgICAgIHJlbmRlcmFibGUgPSB0aGlzLl9wb29sWzBdO1xuICAgICAgICB0aGlzLl9wb29sLnNwbGljZSgwLCAxKTtcbiAgICAgICAgcmVuZGVyYWJsZS5zZXRDb250ZW50KHRoaXMuZm9ybWF0KGRhdGUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZW5kZXJhYmxlID0gdGhpcy5jcmVhdGVSZW5kZXJhYmxlKHRoaXMuY2xhc3NlcywgdGhpcy5mb3JtYXQoZGF0ZSkpO1xuICAgICAgICB0aGlzLmluc3RhbGxDbGlja0hhbmRsZXIocmVuZGVyYWJsZSk7XG4gICAgfVxuICAgIHJlbmRlcmFibGUuZGF0ZSA9IGRhdGU7XG4gICAgcmV0dXJuIHJlbmRlcmFibGU7XG59O1xuQmFzZS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uIChyZW5kZXJhYmxlKSB7XG4gICAgdGhpcy5fcG9vbC5wdXNoKHJlbmRlcmFibGUpO1xufTtcbmZ1bmN0aW9uIFllYXIoKSB7XG4gICAgQmFzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuWWVhci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKTtcblllYXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gWWVhcjtcblllYXIucHJvdG90eXBlLmNsYXNzZXMgPSBbXG4gICAgJ2l0ZW0nLFxuICAgICd5ZWFyJ1xuXTtcblllYXIucHJvdG90eXBlLmZvcm1hdCA9IGRlY2ltYWw0O1xuWWVhci5wcm90b3R5cGUuc2l6ZVJhdGlvID0gMTtcblllYXIucHJvdG90eXBlLnN0ZXAgPSAxO1xuWWVhci5wcm90b3R5cGUubG9vcCA9IGZhbHNlO1xuWWVhci5wcm90b3R5cGUuc2V0ID0gJ3NldEZ1bGxZZWFyJztcblllYXIucHJvdG90eXBlLmdldCA9ICdnZXRGdWxsWWVhcic7XG5mdW5jdGlvbiBNb250aCgpIHtcbiAgICBCYXNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5Nb250aC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKTtcbk1vbnRoLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1vbnRoO1xuTW9udGgucHJvdG90eXBlLmNsYXNzZXMgPSBbXG4gICAgJ2l0ZW0nLFxuICAgICdtb250aCdcbl07XG5Nb250aC5wcm90b3R5cGUuc2l6ZVJhdGlvID0gMjtcbk1vbnRoLnByb3RvdHlwZS5sb3dlckJvdW5kID0gMDtcbk1vbnRoLnByb3RvdHlwZS51cHBlckJvdW5kID0gMTI7XG5Nb250aC5wcm90b3R5cGUuc3RlcCA9IDE7XG5Nb250aC5wcm90b3R5cGUubG9vcCA9IHRydWU7XG5Nb250aC5wcm90b3R5cGUuc2V0ID0gJ3NldE1vbnRoJztcbk1vbnRoLnByb3RvdHlwZS5nZXQgPSAnZ2V0TW9udGgnO1xuTW9udGgucHJvdG90eXBlLnN0cmluZ3MgPSBbXG4gICAgJ0phbnVhcnknLFxuICAgICdGZWJydWFyeScsXG4gICAgJ01hcmNoJyxcbiAgICAnQXByaWwnLFxuICAgICdNYXknLFxuICAgICdKdW5lJyxcbiAgICAnSnVseScsXG4gICAgJ0F1Z3VzdCcsXG4gICAgJ1NlcHRlbWJlcicsXG4gICAgJ09jdG9iZXInLFxuICAgICdOb3ZlbWJlcicsXG4gICAgJ0RlY2VtYmVyJ1xuXTtcbk1vbnRoLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbiAoZGF0ZSkge1xuICAgIHJldHVybiB0aGlzLnN0cmluZ3NbZGF0ZS5nZXRNb250aCgpXTtcbn07XG5mdW5jdGlvbiBGdWxsRGF5KCkge1xuICAgIEJhc2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cbkZ1bGxEYXkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShCYXNlLnByb3RvdHlwZSk7XG5GdWxsRGF5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZ1bGxEYXk7XG5GdWxsRGF5LnByb3RvdHlwZS5jbGFzc2VzID0gW1xuICAgICdpdGVtJyxcbiAgICAnZnVsbGRheSdcbl07XG5GdWxsRGF5LnByb3RvdHlwZS5zaXplUmF0aW8gPSAyO1xuRnVsbERheS5wcm90b3R5cGUuc3RlcCA9IDE7XG5GdWxsRGF5LnByb3RvdHlwZS5zZXQgPSAnc2V0RGF0ZSc7XG5GdWxsRGF5LnByb3RvdHlwZS5nZXQgPSAnZ2V0RGF0ZSc7XG5GdWxsRGF5LnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbiAoZGF0ZSkge1xuICAgIHJldHVybiBkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xufTtcbmZ1bmN0aW9uIFdlZWtEYXkoKSB7XG4gICAgQmFzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuV2Vla0RheS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKTtcbldlZWtEYXkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gV2Vla0RheTtcbldlZWtEYXkucHJvdG90eXBlLmNsYXNzZXMgPSBbXG4gICAgJ2l0ZW0nLFxuICAgICd3ZWVrZGF5J1xuXTtcbldlZWtEYXkucHJvdG90eXBlLnNpemVSYXRpbyA9IDI7XG5XZWVrRGF5LnByb3RvdHlwZS5sb3dlckJvdW5kID0gMDtcbldlZWtEYXkucHJvdG90eXBlLnVwcGVyQm91bmQgPSA3O1xuV2Vla0RheS5wcm90b3R5cGUuc3RlcCA9IDE7XG5XZWVrRGF5LnByb3RvdHlwZS5sb29wID0gdHJ1ZTtcbldlZWtEYXkucHJvdG90eXBlLnNldCA9ICdzZXREYXRlJztcbldlZWtEYXkucHJvdG90eXBlLmdldCA9ICdnZXREYXRlJztcbldlZWtEYXkucHJvdG90eXBlLnN0cmluZ3MgPSBbXG4gICAgJ1N1bmRheScsXG4gICAgJ01vbmRheScsXG4gICAgJ1R1ZXNkYXknLFxuICAgICdXZWRuZXNkYXknLFxuICAgICdUaHVyc2RheScsXG4gICAgJ0ZyaWRheScsXG4gICAgJ1NhdHVyZGF5J1xuXTtcbldlZWtEYXkucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uIChkYXRlKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RyaW5nc1tkYXRlLmdldERheSgpXTtcbn07XG5mdW5jdGlvbiBEYXkoKSB7XG4gICAgQmFzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuRGF5LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpO1xuRGF5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IERheTtcbkRheS5wcm90b3R5cGUuY2xhc3NlcyA9IFtcbiAgICAnaXRlbScsXG4gICAgJ2RheSdcbl07XG5EYXkucHJvdG90eXBlLmZvcm1hdCA9IGRlY2ltYWwxO1xuRGF5LnByb3RvdHlwZS5zaXplUmF0aW8gPSAxO1xuRGF5LnByb3RvdHlwZS5sb3dlckJvdW5kID0gMTtcbkRheS5wcm90b3R5cGUudXBwZXJCb3VuZCA9IDMyO1xuRGF5LnByb3RvdHlwZS5zdGVwID0gMTtcbkRheS5wcm90b3R5cGUubG9vcCA9IHRydWU7XG5EYXkucHJvdG90eXBlLnNldCA9ICdzZXREYXRlJztcbkRheS5wcm90b3R5cGUuZ2V0ID0gJ2dldERhdGUnO1xuZnVuY3Rpb24gSG91cigpIHtcbiAgICBCYXNlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59XG5Ib3VyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpO1xuSG91ci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBIb3VyO1xuSG91ci5wcm90b3R5cGUuY2xhc3NlcyA9IFtcbiAgICAnaXRlbScsXG4gICAgJ2hvdXInXG5dO1xuSG91ci5wcm90b3R5cGUuZm9ybWF0ID0gZGVjaW1hbDI7XG5Ib3VyLnByb3RvdHlwZS5zaXplUmF0aW8gPSAxO1xuSG91ci5wcm90b3R5cGUubG93ZXJCb3VuZCA9IDA7XG5Ib3VyLnByb3RvdHlwZS51cHBlckJvdW5kID0gMjQ7XG5Ib3VyLnByb3RvdHlwZS5zdGVwID0gMTtcbkhvdXIucHJvdG90eXBlLmxvb3AgPSB0cnVlO1xuSG91ci5wcm90b3R5cGUuc2V0ID0gJ3NldEhvdXJzJztcbkhvdXIucHJvdG90eXBlLmdldCA9ICdnZXRIb3Vycyc7XG5mdW5jdGlvbiBNaW51dGUoKSB7XG4gICAgQmFzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuTWludXRlLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpO1xuTWludXRlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1pbnV0ZTtcbk1pbnV0ZS5wcm90b3R5cGUuY2xhc3NlcyA9IFtcbiAgICAnaXRlbScsXG4gICAgJ21pbnV0ZSdcbl07XG5NaW51dGUucHJvdG90eXBlLmZvcm1hdCA9IGRlY2ltYWwyO1xuTWludXRlLnByb3RvdHlwZS5zaXplUmF0aW8gPSAxO1xuTWludXRlLnByb3RvdHlwZS5sb3dlckJvdW5kID0gMDtcbk1pbnV0ZS5wcm90b3R5cGUudXBwZXJCb3VuZCA9IDYwO1xuTWludXRlLnByb3RvdHlwZS5zdGVwID0gMTtcbk1pbnV0ZS5wcm90b3R5cGUubG9vcCA9IHRydWU7XG5NaW51dGUucHJvdG90eXBlLnNldCA9ICdzZXRNaW51dGVzJztcbk1pbnV0ZS5wcm90b3R5cGUuZ2V0ID0gJ2dldE1pbnV0ZXMnO1xuZnVuY3Rpb24gU2Vjb25kKCkge1xuICAgIEJhc2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblNlY29uZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEJhc2UucHJvdG90eXBlKTtcblNlY29uZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTZWNvbmQ7XG5TZWNvbmQucHJvdG90eXBlLmNsYXNzZXMgPSBbXG4gICAgJ2l0ZW0nLFxuICAgICdzZWNvbmQnXG5dO1xuU2Vjb25kLnByb3RvdHlwZS5mb3JtYXQgPSBkZWNpbWFsMjtcblNlY29uZC5wcm90b3R5cGUuc2l6ZVJhdGlvID0gMTtcblNlY29uZC5wcm90b3R5cGUubG93ZXJCb3VuZCA9IDA7XG5TZWNvbmQucHJvdG90eXBlLnVwcGVyQm91bmQgPSA2MDtcblNlY29uZC5wcm90b3R5cGUuc3RlcCA9IDE7XG5TZWNvbmQucHJvdG90eXBlLmxvb3AgPSB0cnVlO1xuU2Vjb25kLnByb3RvdHlwZS5zZXQgPSAnc2V0U2Vjb25kcyc7XG5TZWNvbmQucHJvdG90eXBlLmdldCA9ICdnZXRTZWNvbmRzJztcbmZ1bmN0aW9uIE1pbGxpc2Vjb25kKCkge1xuICAgIEJhc2UuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cbk1pbGxpc2Vjb25kLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoQmFzZS5wcm90b3R5cGUpO1xuTWlsbGlzZWNvbmQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTWlsbGlzZWNvbmQ7XG5NaWxsaXNlY29uZC5wcm90b3R5cGUuY2xhc3NlcyA9IFtcbiAgICAnaXRlbScsXG4gICAgJ21pbGxpc2Vjb25kJ1xuXTtcbk1pbGxpc2Vjb25kLnByb3RvdHlwZS5mb3JtYXQgPSBkZWNpbWFsMztcbk1pbGxpc2Vjb25kLnByb3RvdHlwZS5zaXplUmF0aW8gPSAxO1xuTWlsbGlzZWNvbmQucHJvdG90eXBlLmxvd2VyQm91bmQgPSAwO1xuTWlsbGlzZWNvbmQucHJvdG90eXBlLnVwcGVyQm91bmQgPSAxMDAwO1xuTWlsbGlzZWNvbmQucHJvdG90eXBlLnN0ZXAgPSAxO1xuTWlsbGlzZWNvbmQucHJvdG90eXBlLmxvb3AgPSB0cnVlO1xuTWlsbGlzZWNvbmQucHJvdG90eXBlLnNldCA9ICdzZXRNaWxsaXNlY29uZHMnO1xuTWlsbGlzZWNvbmQucHJvdG90eXBlLmdldCA9ICdnZXRNaWxsaXNlY29uZHMnO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgQmFzZTogQmFzZSxcbiAgICBZZWFyOiBZZWFyLFxuICAgIE1vbnRoOiBNb250aCxcbiAgICBGdWxsRGF5OiBGdWxsRGF5LFxuICAgIFdlZWtEYXk6IFdlZWtEYXksXG4gICAgRGF5OiBEYXksXG4gICAgSG91cjogSG91cixcbiAgICBNaW51dGU6IE1pbnV0ZSxcbiAgICBTZWNvbmQ6IFNlY29uZCxcbiAgICBNaWxsaXNlY29uZDogTWlsbGlzZWNvbmRcbn07IiwidmFyIFN1cmZhY2UgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5mYW1vdXMuY29yZS5TdXJmYWNlIDogdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwuZmFtb3VzLmNvcmUuU3VyZmFjZSA6IG51bGw7XG52YXIgVmlldyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93LmZhbW91cy5jb3JlLlZpZXcgOiB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbC5mYW1vdXMuY29yZS5WaWV3IDogbnVsbDtcbnZhciBMYXlvdXRDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vTGF5b3V0Q29udHJvbGxlcicpO1xudmFyIFRhYkJhckxheW91dCA9IHJlcXVpcmUoJy4uL2xheW91dHMvVGFiQmFyTGF5b3V0Jyk7XG5mdW5jdGlvbiBUYWJCYXIob3B0aW9ucykge1xuICAgIFZpZXcuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB0aGlzLl9zZWxlY3RlZEl0ZW1JbmRleCA9IC0xO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuY2xhc3NlcyA9IG9wdGlvbnMuY2xhc3NlcyA/IHRoaXMuY2xhc3Nlcy5jb25jYXQob3B0aW9ucy5jbGFzc2VzKSA6IHRoaXMuY2xhc3NlcztcbiAgICB0aGlzLmxheW91dCA9IG5ldyBMYXlvdXRDb250cm9sbGVyKHRoaXMub3B0aW9ucy5sYXlvdXRDb250cm9sbGVyKTtcbiAgICB0aGlzLmFkZCh0aGlzLmxheW91dCk7XG4gICAgdGhpcy5sYXlvdXQucGlwZSh0aGlzLl9ldmVudE91dHB1dCk7XG4gICAgdGhpcy5fcmVuZGVyYWJsZXMgPSB7XG4gICAgICAgIGl0ZW1zOiBbXSxcbiAgICAgICAgc3BhY2VyczogW10sXG4gICAgICAgIGJhY2tncm91bmQ6IF9jcmVhdGVSZW5kZXJhYmxlLmNhbGwodGhpcywgJ2JhY2tncm91bmQnKSxcbiAgICAgICAgc2VsZWN0ZWRJdGVtT3ZlcmxheTogX2NyZWF0ZVJlbmRlcmFibGUuY2FsbCh0aGlzLCAnc2VsZWN0ZWRJdGVtT3ZlcmxheScpXG4gICAgfTtcbiAgICB0aGlzLnNldE9wdGlvbnModGhpcy5vcHRpb25zKTtcbn1cblRhYkJhci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFZpZXcucHJvdG90eXBlKTtcblRhYkJhci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUYWJCYXI7XG5UYWJCYXIucHJvdG90eXBlLmNsYXNzZXMgPSBbXG4gICAgJ2ZmLXdpZGdldCcsXG4gICAgJ2ZmLXRhYmJhcidcbl07XG5UYWJCYXIuREVGQVVMVF9PUFRJT05TID0ge1xuICAgIHRhYkJhckxheW91dDoge1xuICAgICAgICBtYXJnaW5zOiBbXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgMCxcbiAgICAgICAgICAgIDAsXG4gICAgICAgICAgICAwXG4gICAgICAgIF0sXG4gICAgICAgIHNwYWNpbmc6IDBcbiAgICB9LFxuICAgIGNyZWF0ZVJlbmRlcmFibGVzOiB7XG4gICAgICAgIGl0ZW06IHRydWUsXG4gICAgICAgIGJhY2tncm91bmQ6IGZhbHNlLFxuICAgICAgICBzZWxlY3RlZEl0ZW1PdmVybGF5OiBmYWxzZSxcbiAgICAgICAgc3BhY2VyOiBmYWxzZVxuICAgIH0sXG4gICAgbGF5b3V0Q29udHJvbGxlcjoge1xuICAgICAgICBhdXRvUGlwZUV2ZW50czogdHJ1ZSxcbiAgICAgICAgbGF5b3V0OiBUYWJCYXJMYXlvdXQsXG4gICAgICAgIGZsb3c6IHRydWUsXG4gICAgICAgIGZsb3dPcHRpb25zOiB7XG4gICAgICAgICAgICByZWZsb3dPblJlc2l6ZTogZmFsc2UsXG4gICAgICAgICAgICBzcHJpbmc6IHtcbiAgICAgICAgICAgICAgICBkYW1waW5nUmF0aW86IDAuOCxcbiAgICAgICAgICAgICAgICBwZXJpb2Q6IDMwMFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcbmZ1bmN0aW9uIF9zZXRTZWxlY3RlZEl0ZW0oaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggIT09IHRoaXMuX3NlbGVjdGVkSXRlbUluZGV4KSB7XG4gICAgICAgIHZhciBvbGRJbmRleCA9IHRoaXMuX3NlbGVjdGVkSXRlbUluZGV4O1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEl0ZW1JbmRleCA9IGluZGV4O1xuICAgICAgICB0aGlzLmxheW91dC5zZXRMYXlvdXRPcHRpb25zKHsgc2VsZWN0ZWRJdGVtSW5kZXg6IGluZGV4IH0pO1xuICAgICAgICBpZiAob2xkSW5kZXggPj0gMCAmJiB0aGlzLl9yZW5kZXJhYmxlcy5pdGVtc1tvbGRJbmRleF0ucmVtb3ZlQ2xhc3MpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmFibGVzLml0ZW1zW29sZEluZGV4XS5yZW1vdmVDbGFzcygnc2VsZWN0ZWQnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcmVuZGVyYWJsZXMuaXRlbXNbaW5kZXhdLmFkZENsYXNzKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXJhYmxlcy5pdGVtc1tpbmRleF0uYWRkQ2xhc3MoJ3NlbGVjdGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9sZEluZGV4ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50T3V0cHV0LmVtaXQoJ3RhYmNoYW5nZScsIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQ6IHRoaXMsXG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgICAgIG9sZEluZGV4OiBvbGRJbmRleCxcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLl9yZW5kZXJhYmxlcy5pdGVtc1tpbmRleF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gX2NyZWF0ZVJlbmRlcmFibGUoaWQsIGRhdGEpIHtcbiAgICB2YXIgb3B0aW9uID0gdGhpcy5vcHRpb25zLmNyZWF0ZVJlbmRlcmFibGVzW2lkXTtcbiAgICBpZiAob3B0aW9uIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbi5jYWxsKHRoaXMsIGlkLCBkYXRhKTtcbiAgICB9IGVsc2UgaWYgKCFvcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCAmJiBkYXRhIGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbiAgICB2YXIgc3VyZmFjZSA9IG5ldyBTdXJmYWNlKHtcbiAgICAgICAgICAgIGNsYXNzZXM6IHRoaXMuY2xhc3NlcyxcbiAgICAgICAgICAgIGNvbnRlbnQ6IGRhdGEgPyAnPGRpdj4nICsgZGF0YSArICc8L2Rpdj4nIDogdW5kZWZpbmVkXG4gICAgICAgIH0pO1xuICAgIHN1cmZhY2UuYWRkQ2xhc3MoaWQpO1xuICAgIGlmIChpZCA9PT0gJ2l0ZW0nKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudGFiQmFyTGF5b3V0ICYmIHRoaXMub3B0aW9ucy50YWJCYXJMYXlvdXQuaXRlbVNpemUgJiYgdGhpcy5vcHRpb25zLnRhYkJhckxheW91dC5pdGVtU2l6ZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgc3VyZmFjZS5zZXRTaXplKHRoaXMubGF5b3V0LmdldERpcmVjdGlvbigpID8gW1xuICAgICAgICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICBdIDogW1xuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3VyZmFjZTtcbn1cblRhYkJhci5wcm90b3R5cGUuc2V0T3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgVmlldy5wcm90b3R5cGUuc2V0T3B0aW9ucy5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuICAgIGlmICghdGhpcy5sYXlvdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLnRhYkJhckxheW91dCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRoaXMubGF5b3V0LnNldExheW91dE9wdGlvbnMob3B0aW9ucy50YWJCYXJMYXlvdXQpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5sYXlvdXRDb250cm9sbGVyKSB7XG4gICAgICAgIHRoaXMubGF5b3V0LnNldE9wdGlvbnMob3B0aW9ucy5sYXlvdXRDb250cm9sbGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuVGFiQmFyLnByb3RvdHlwZS5zZXRJdGVtcyA9IGZ1bmN0aW9uIChpdGVtcykge1xuICAgIHZhciBjdXJyZW50SW5kZXggPSB0aGlzLl9zZWxlY3RlZEl0ZW1JbmRleDtcbiAgICB0aGlzLl9zZWxlY3RlZEl0ZW1JbmRleCA9IC0xO1xuICAgIHRoaXMuX3JlbmRlcmFibGVzLml0ZW1zID0gW107XG4gICAgdGhpcy5fcmVuZGVyYWJsZXMuc3BhY2VycyA9IFtdO1xuICAgIGlmIChpdGVtcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaXRlbSA9IF9jcmVhdGVSZW5kZXJhYmxlLmNhbGwodGhpcywgJ2l0ZW0nLCBpdGVtc1tpXSk7XG4gICAgICAgICAgICBpZiAoaXRlbS5vbikge1xuICAgICAgICAgICAgICAgIGl0ZW0ub24oJ2NsaWNrJywgX3NldFNlbGVjdGVkSXRlbS5iaW5kKHRoaXMsIGkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3JlbmRlcmFibGVzLml0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgICAgICBpZiAoaSA8IGl0ZW1zLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3BhY2VyID0gX2NyZWF0ZVJlbmRlcmFibGUuY2FsbCh0aGlzLCAnc3BhY2VyJywgJyAnKTtcbiAgICAgICAgICAgICAgICBpZiAoc3BhY2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlcmFibGVzLnNwYWNlcnMucHVzaChzcGFjZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmxheW91dC5zZXREYXRhU291cmNlKHRoaXMuX3JlbmRlcmFibGVzKTtcbiAgICBpZiAodGhpcy5fcmVuZGVyYWJsZXMuaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgIF9zZXRTZWxlY3RlZEl0ZW0uY2FsbCh0aGlzLCBNYXRoLm1heChNYXRoLm1pbihjdXJyZW50SW5kZXgsIHRoaXMuX3JlbmRlcmFibGVzLml0ZW1zLmxlbmd0aCAtIDEpLCAwKSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblRhYkJhci5wcm90b3R5cGUuZ2V0SXRlbXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlcmFibGVzLml0ZW1zO1xufTtcblRhYkJhci5wcm90b3R5cGUuZ2V0SXRlbVNwZWMgPSBmdW5jdGlvbiAoaW5kZXgsIG5vcm1hbGl6ZSkge1xuICAgIHJldHVybiB0aGlzLmxheW91dC5nZXRTcGVjKHRoaXMuX3JlbmRlcmFibGVzLml0ZW1zW2luZGV4XSwgbm9ybWFsaXplKTtcbn07XG5UYWJCYXIucHJvdG90eXBlLnNldFNlbGVjdGVkSXRlbUluZGV4ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgX3NldFNlbGVjdGVkSXRlbS5jYWxsKHRoaXMsIGluZGV4KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5UYWJCYXIucHJvdG90eXBlLmdldFNlbGVjdGVkSXRlbUluZGV4ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3RlZEl0ZW1JbmRleDtcbn07XG5UYWJCYXIucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5zaXplIHx8ICh0aGlzLmxheW91dCA/IHRoaXMubGF5b3V0LmdldFNpemUoKSA6IFZpZXcucHJvdG90eXBlLmdldFNpemUuY2FsbCh0aGlzKSk7XG59O1xubW9kdWxlLmV4cG9ydHMgPSBUYWJCYXI7Il19
