/**
 * LBS lazyloadIMG
 * Date: 2012-4-15
 * ==================================
 * opts.containner 需要懒加载的图片容器 （默认window 浏览器窗口 文档中所有的图片）
 * opts.event 事件方式  (默认'scroll' 浏览器窗口的滚动 事件绑定在window) 
 			 可以定义其他事件click / mouseover/...(事件绑定在document/opts.containner 非window)
 * opts.attribute 预定义的图片真实地址的属性 默认_src 
 * opts.delay 延时执行 滚动/变换/opts.event 默认100ms 
 * ==================================
 * opts.onLoad 加载中(可以得到加载的图片组 每次事件执行加载了几张图片)
 * opts.onEnd 加载结束(containner容器内所有图片加载完)
 * ==================================
 * 可结合Tab选项卡切换使用 
 * 1. 设置containner 为选项卡容器-(JS对象)-可选
 * 2. 设置event 为选项卡切换事件(click / mouseover / ..)
 * 3. 为了区分非选项卡内的图片 可以设置不同的 attribute(data-src / original-src)
 * ==================================
 **/
;(function() {
	window.lazyloadIMG = function(opts) {
		var _opts = {
			container: window,
			event: 'scroll',
			attribute: '_src',
			delay: 100,
			onLoad: function() {},
			onEnd: function() {}
		}
		for (var k in opts)
			if (opts[k] !== undefined) _opts[k] = opts[k];
		this.container = _opts.container;
		this.event = _opts.event;
		this.attribute = _opts.attribute;
		this.delay = _opts.delay;
		this.onLoad = _opts.onLoad;
		this.onEnd = _opts.onEnd;
		this.data = [];
		this.loadIMG = [];
		this.imgs = null;

		this._init();
	}
	lazyloadIMG.prototype = {
		_init: function() {
			this.imgs = (this.container == window ? document.getElementsByTagName('img') : this.container.getElementsByTagName('img'));
			if (this.imgs.length < 1) return;
			for (var i = 0, n = this.imgs.length; i < n; i++) {
				var img = this.imgs[i];
				if (img.getAttribute(this.attribute)) {
					this.data.push({
						img: img,
						w: parseInt(this.getStyle(img, 'width')) || parseInt(img.width) || parseInt(img.offsetWidth),
						h: parseInt(this.getStyle(img, 'height')) || parseInt(img.height) || parseInt(img.offsetHeight)
						// x: parseInt(this.getPosition(img).x),
						// y: parseInt(this.getPosition(img).y)
					});
				}
			}
			this.count = this.length = this.data.length;
			this._css();
			this._load();
			this._bind();
		},
		_load: function() {
			if (this.count < 1) return;
			this.loadIMG.length = 0;
			for (var i = 0; i < this.length; i++) {
				if (this.data[i].img.loaded) continue;
				var img = this.data[i].img,
					w = this.data[i].w,
					h = this.data[i].h;
					// x = this.data[i].x,
					// y = this.data[i].y;
				if (!this._isHidden(img) && this._isVisible(img, w, h)) {
					img.setAttribute('src', img.getAttribute(this.attribute));
					img.removeAttribute(this.attribute);
					img.loaded = true;
					this.count--;
					this.loadIMG.push(img);
				}
			}
			this.onLoad && this.onLoad(this.loadIMG);
		},
		_css: function() {
			this.wWidth = this.getWindowSize().w;
			this.wHeight = this.getWindowSize().h;
			this._scroll();
		},
		_scroll: function() {
			this.scrollX = this.getScroll().x;
			this.scrollY = this.getScroll().y;
		},
		_bind: function() {
			var _this = this,
				scroll = function(e) {
					e = e || window.event;
					if (_this.count < 1) {
						if (_this.container != window && _this.event != 'scroll') {
							_this.off(_this.container, _this.event, scroll);
						} else if (_this.container == window && _this.event != 'scroll') {
							_this.off(document, _this.event, scroll);
						}
						_this.off(window, 'scroll', scroll);
						_this.off(window, 'resize', scroll);
						_this.onEnd && _this.onEnd();
						return;
					}
					switch (e.type) {
						case 'scroll':
							_this._scroll();
							break;
						case 'resize':
							_this._css();
							break;
					}
					_this.timer && clearTimeout(_this.timer);
					_this.timer = setTimeout(function() {
						_this._load();
					}, _this.delay);
				};
			if (this.container != window && this.event != 'scroll') {
				this.on(this.container, this.event, scroll);
			} else if (this.container == window && this.event != 'scroll') {
				this.on(document, this.event, scroll);
			}
			this.on(window, 'scroll', scroll);
			this.on(window, 'resize', scroll);
		},
		_isHidden: function(o) {
			if (this.getStyle(o, 'display') == 'none') return true;
			while (o = o.parentNode) {
				if (o.nodeType !== 1) continue;
				if (this.getStyle(o, 'display') == 'none') return true;
			}
			return false;
		},
		_isVisible: function(el, w, h, x, y) {
			var ex = this.getPosition(el).x,
				ey = this.getPosition(el).y,
				ew = ex + w,
				eh = ey + h,
				sx = this.scrollX,
				sy = this.scrollY,
				sw = sx + this.wWidth,
				sh = sy + this.wHeight;
			return ((ex < sw && ew > sx) && (ey < sh && eh > sy));
		},
		on: function(el, type, handler) {
			if (el.addEventListener) {
				el.addEventListener(type, handler, false);
			} else if (el.attachEvent) {
				el.attachEvent('on' + type, handler);
			} else {
				el['on' + type] = handler;
			}
		},
		off: function(el, type, handler) {
			if (el.removeEventListener) {
				el.removeEventListener(type, handler, false);
			} else if (el.detachEvent) {
				el.detachEvent('on' + type, handler);
			} else {
				el['on' + type] = null;
			}
		},
		getWindowSize: function() {
			var d = document,
				doc = d.documentElement,
				body = d.body,
				w = doc.clientWidth || body.clientWidth,
				h = doc.clientHeight || body.clientHeight;
			if (d.compatMode != 'CSS1Compat') {
				w = body.clientWidth;
				h = body.clientHeight;
			};
			return {w: w, h: h};
		},
		getScroll: function() {
			var d = document,
				doc = d.documentElement,
				body = d.body,
				x = doc.scrollLeft || body.scrollLeft,
				y = doc.scrollTop || body.scrollTop;
			if (d.compatMode != 'CSS1Compat') {
				x = body.scrollLeft;
				y = body.scrollTop;
			}
			return {x: x, y: y};
		},
		getPosition: function(o) {
			var box = o.getBoundingClientRect(),
				doc = o.ownerDocument,
				body = doc.body,
				html = doc.documentElement,
				clientTop = html.clientTop || body.clientTop || 0,
				clientLeft = html.clientLeft || body.clientLeft || 0,
				x = box.left + (self.pageXOffset || html.scrollLeft || body.scrollLeft) - clientLeft,
				y = box.top + (self.pageYOffset || html.scrollTop || body.scrollTop) - clientTop;
			return {x: x, y: y};
		},
		getStyle: function(o, n) {
			return o.currentStyle ? o.currentStyle[n] : getComputedStyle(o, null)[n];
		}
	}
}());