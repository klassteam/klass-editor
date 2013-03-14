(function($, window){

	var dom = $.DOM;

	var document = window.document;

	window = new dom.window(window);

	// 后期需要调整为继承元素原型的position
	var original = dom.element.prototype.position;

	var getStylesList = function(styles, planes){
		var list = [];
		Object.each(planes, function(directions){
			Object.each(directions, function(edge){
				styles.each(function(style){
					list.push(style + '-' + edge + (style == 'border' ? '-width' : ''));
				});
			});
		});
		return list;
	};

	var calculateEdgeSize = function(edge, styles){
		var total = 0;
		Object.each(styles, function(value, style){
			if (style.test(edge)) total = total + value.toInt();
		});
		return total;
	};

	var isBody = function(element){
		element = element[0] || element;
		return (/^(?:body|html)$/i).test(element.tagName);
	};

	var isVisible = function(element){
		element = (element && element[0]) || element;
		return !!(!element || element.offsetHeight || element.offsetWidth);
	};

	var isOffset = function(element){
		return styleString(element, 'position') !== 'static' || isBody(element);
	};

	var isOffsetStatic = function(element){
		return isOffset(element) || (/^(?:table|td|th)$/i).test(element[0].tagName);
	};

	var styleString = function(element, property){
		return element.getComputedStyle(property);
	};

	var styleNumber = function(element, style){
		return styleString(element, style).toInt() || 0;
	};

	var borderBox = function(element){
		return styleString(element, '-moz-box-sizing') == 'border-box';
	};

	var topBorder = function(element){
		return styleNumber(element, 'border-top-width');
	};

	var leftBorder = function(element){
		return styleNumber(element, 'border-left-width');
	};

	dom.element.implement({

		getOffsets: function(){
			if (this[0].getBoundingClientRect && !$.env.ios){
				var bound = this[0].getBoundingClientRect(),
					html = this.getDocument().documentElement(),
					htmlScroll = html.scroll(),
					elemScrolls = this.scrolls(),
					isFixed = (styleString(this, 'position') === 'fixed');

				return {
					x: bound.left.toInt() + elemScrolls.x + ((isFixed) ? 0 : htmlScroll.x) - html[0].clientLeft,
					y: bound.top.toInt()  + elemScrolls.y + ((isFixed) ? 0 : htmlScroll.y) - html[0].clientTop
				};
			}

			var element = this, position = {x: 0, y: 0};
			if (isBody(this)) return position;

			while (element && !isBody(element)){
				position.x += element[0].offsetLeft;
				position.y += element[0].offsetTop;

				if ($.env.firefox){
					if (!borderBox(element)){
						position.x += leftBorder(element);
						position.y += topBorder(element);
					}
					var parent = document.node(element[0].parentNode);
					if (parent && styleString(parent, 'overflow') !== 'visible'){
						position.x += leftBorder(parent);
						position.y += topBorder(parent);
					}
				} else if (element != this && $.env.safari){
					position.x += leftBorder(element);
					position.y += topBorder(element);
				}

				element = document.node(element[0].offsetParent);
			}
			if ($.env.firefox && !borderBox(this)){
				position.x -= leftBorder(this);
				position.y -= topBorder(this);
			}
			return position;
		},

		getPosition: function(relative){
			if (isBody(this)) return {x: 0, y: 0};
			var offset = this.getOffsets(),
				scroll = this.scrolls();
			var position = {
				x: offset.x - scroll.x,
				y: offset.y - scroll.y
			};
			if (relative && (relative = document.node(relative))){
				var relativePosition = relative.getPosition();
				return {x: position.x - relativePosition.x - leftBorder(relative), y: position.y - relativePosition.y - topBorder(relative)};
			}
			return position;
		},

		getOffsetParent: function(){
			var element = this[0];
			if (isBody(element) || styleString(this, 'position') === 'fixed') return null;

			if ($.support.brokenOffsetParent){
				var isOffsetCheck = (styleString(this, 'position') === 'static') ? isOffsetStatic : isOffset;
				while ((element = element.parentNode)){
					if (isOffsetCheck(this)) return element;
				}
			} else {
				try {
					return element.offsetParent;
				} catch (e){}
			}
			return null;
		},

		getDimensions: function(options){
			options = Object.merge({computeSize: false}, options);
			var dim = {x: 0, y: 0};

			var getSize = function(el, options){
				return (options.computeSize) ? el.getComputedSize(options) : el.size();
			};

			var parent = this.parent('body');

			if (parent && this.style('display') === 'none'){
				dim = this.measure(function(){
					return getSize(this, options);
				});
			} else if (parent){
				try { //safari sometimes crashes here, so catch it
					dim = getSize(this, options);
				}catch(e){}
			}

			return Object.append(dim, (dim.x || dim.x === 0) ? {
					width: dim.x,
					height: dim.y
				} : {
					x: dim.width,
					y: dim.height
				}
			);
		},

		getComputedSize: function(options){	
			options = Object.merge({
				styles: ['padding','border'],
				planes: {
					height: ['top','bottom'],
					width: ['left','right']
				},
				mode: 'both'
			}, options);

			var styles = {},
				size = {width: 0, height: 0},
				dimensions;

			if (options.mode == 'vertical'){
				delete size.width;
				delete options.planes.width;
			} else if (options.mode == 'horizontal'){
				delete size.height;
				delete options.planes.height;
			}

			getStylesList(options.styles, options.planes).each(function(style){
				styles[style] = this.style(style).toInt();
			}, this);

			Object.each(options.planes, function(edges, plane){

				var capitalized = plane.capitalize(),
					style = this.style(plane);

				if (style == 'auto' && !dimensions) dimensions = this.getDimensions();

				style = styles[plane] = (style == 'auto') ? dimensions[plane] : style.toInt();
				size['total' + capitalized] = style;

				edges.each(function(edge){
					var edgesize = calculateEdgeSize(edge, styles);
					size['computed' + edge.capitalize()] = edgesize;
					size['total' + capitalized] += edgesize;
				});

			}, this);

			return Object.append(size, styles);
		},

		measure: function(fn){
			if (isVisible(this)) return fn.call(this);
			var parent = this.parent(),
				toMeasure = [];
			while (!isVisible(parent) && parent[0] != document.body){
				toMeasure.push(parent.expose());
				parent = parent.parent();
			}
			var restore = this.expose(),
				result = fn.call(this);
			restore();
			toMeasure.each(function(restore){
				restore();
			});
			return result;
		},

		expose: function(){
			if (this.style('display') != 'none') return function(){};
			var before = this[0].style.cssText;
			this.styles({
				display: 'block',
				position: 'absolute',
				visibility: 'hidden'
			});
			return function(){
				this.style.cssText = before;
			}.bind(this[0]);
		},

		position: function(options){
			//call original position if the options are x/y values
			if (options && (options.x != null || options.y != null)){
				return original ? original.apply(this, arguments) : this;
			}

			Object.each(options || {}, function(v, k){
				if (v == null) delete options[k];
			});

			options = Object.merge({
				// minimum: { x: 0, y: 0 },
				// maximum: { x: 0, y: 0},
				relativeTo: document.body,
				position: {
					x: 'center', //left, center, right
					y: 'center' //top, center, bottom
				},
				offset: {x: 0, y: 0}/*,
				autoFixed: false,
				edge: false,
				returnPos: false,
				relFixedPosition: false,
				ignoreMargins: false,
				ignoreScroll: false,
				allowNegative: false*/
			}, options);

			//compute the offset of the parent positioned element if this element is in one
			var parentOffset = {x: 0, y: 0},
				parentPositioned = false;

			/* dollar around getOffsetParent should not be necessary, but as it does not return
			 * a mootools extended element in IE, an error occurs on the call to expose. See:
			 * http://mootools.lighthouseapp.com/projects/2706/tickets/333-element-getoffsetparent-inconsistency-between-ie-and-other-browsers */
			var offsetParent = this.measure(function(){
				return document.node(this.getOffsetParent());
			});
			if (offsetParent && offsetParent != this.getDocument().body()){
				parentOffset = offsetParent.measure(function(){
					return this.getPosition();
				});
				parentPositioned = offsetParent != document.node(options.relativeTo);
				options.offset.x = options.offset.x - parentOffset.x;
				options.offset.y = options.offset.y - parentOffset.y;
			}

			//upperRight, bottomRight, centerRight, upperLeft, bottomLeft, centerLeft
			//topRight, topLeft, centerTop, centerBottom, center
			var fixValue = function(option){
				if (typeof option !== 'string') return option;
				option = option.toLowerCase();
				var val = {};

				if (option.test('left')){
					val.x = 'left';
				} else if (option.test('right')){
					val.x = 'right';
				} else {
					val.x = 'center';
				}

				if (option.test('upper') || option.test('top')){
					val.y = 'top';
				} else if (option.test('bottom')){
					val.y = 'bottom';
				} else {
					val.y = 'center';
				}

				return val;
			};

			options.edge = fixValue(options.edge);
			options.position = fixValue(options.position);
			if (!options.edge){
				if (options.position.x == 'center' && options.position.y == 'center') options.edge = {x:'center', y:'center'};
				else options.edge = {x:'left', y:'top'};
			}

			this.style('position', options.autoFixed && this[0].style.position.fixed ? 'fixed' : 'absolute');
			var rel = document.node(options.relativeTo || document.body),
				calc = rel[0] == document.body ? window.scroll() : rel.getPosition(),
				top = calc.y, left = calc.x;

			var dim = this.getDimensions({
				computeSize: true,
				styles:['padding', 'border', 'margin']
			});

			var pos = {},
				prefY = options.offset.y,
				prefX = options.offset.x,
				winSize = window.size();

			switch (options.position.x){
				case 'left':
					pos.x = left + prefX;
					break;
				case 'right':
					pos.x = left + prefX + rel[0].offsetWidth;
					break;
				default: //center
					pos.x = left + ((rel[0] == document.body ? winSize.x : rel[0].offsetWidth)/2) + prefX;
					break;
			}

			switch (options.position.y){
				case 'top':
					pos.y = top + prefY;
					break;
				case 'bottom':
					pos.y = top + prefY + rel[0].offsetHeight;
					break;
				default: //center
					pos.y = top + ((rel[0] == document.body ? winSize.y : rel[0].offsetHeight)/2) + prefY;
					break;
			}

			if (options.edge){
				var edgeOffset = {};

				switch (options.edge.x){
					case 'left':
						edgeOffset.x = 0;
						break;
					case 'right':
						edgeOffset.x = -dim.x-dim.computedRight-dim.computedLeft;
						break;
					default: //center
						edgeOffset.x = -(dim.totalWidth/2);
						break;
				}

				switch (options.edge.y){
					case 'top':
						edgeOffset.y = 0;
						break;
					case 'bottom':
						edgeOffset.y = -dim.y-dim.computedTop-dim.computedBottom;
						break;
					default: //center
						edgeOffset.y = -(dim.totalHeight/2);
						break;
				}

				pos.x += edgeOffset.x;
				pos.y += edgeOffset.y;
			}

			pos = {
				left: ((pos.x >= 0 || parentPositioned || options.allowNegative) ? pos.x : 0).toInt(),
				top: ((pos.y >= 0 || parentPositioned || options.allowNegative) ? pos.y : 0).toInt()
			};

			var xy = {left: 'x', top: 'y'};

			['minimum', 'maximum'].each(function(minmax){
				['left', 'top'].each(function(lr){
					var val = options[minmax] ? options[minmax][xy[lr]] : null;
					if (val != null && ((minmax == 'minimum') ? pos[lr] < val : pos[lr] > val)) pos[lr] = val;
				});
			});

			if (rel.style('position') == 'fixed' || options.relFixedPosition){
				var winScroll = window.scroll();
				pos.top+= winScroll.y;
				pos.left+= winScroll.x;
			}
			if (options.ignoreScroll){
				var relScroll = rel.scroll();
				pos.top -= relScroll.y;
				pos.left -= relScroll.x;
			}

			if (options.ignoreMargins){
				pos.left += (
					options.edge.x == 'right' ? dim['margin-right'] :
					options.edge.x == 'center' ? -dim['margin-left'] + ((dim['margin-right'] + dim['margin-left'])/2) :
						- dim['margin-left']
				);
				pos.top += (
					options.edge.y == 'bottom' ? dim['margin-bottom'] :
					options.edge.y == 'center' ? -dim['margin-top'] + ((dim['margin-bottom'] + dim['margin-top'])/2) :
						- dim['margin-top']
				);
			}

			pos.left = Math.ceil(pos.left);
			pos.top = Math.ceil(pos.top);
			if (options.returnPos) return pos;
			else this.styles(pos);
			return this;
		}

	});

})(Klass, window);