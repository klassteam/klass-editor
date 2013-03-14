(function(window, local, undefined){

	var document = window.document;

	var env = local.env;

	//var collected = {}, storage = {};

	var dom = local.DOM;

	/*var get = function(uid){
		return (storage[uid] || (storage[uid] = {}));
	};*/

	var cssFloat = local.support.cssFloat ? 'cssFloat' : 'styleFloat';

	/*var hasOpacity = local.support.opacity;
	var reAlpha = /alpha\(opacity=([\d.]+)\)/i;*/

	var styleCheck = function(property){
		if (property === 'float') return cssFloat;
		return property.replace(/-./g, function(match){
			return match.substr(1).toUpperCase();
		});
	};

	/*var setOpacity = function(element, opacity){
		if (!element.currentStyle || !element.currentStyle.hasLayout) element.style.zoom = 1;
		if (hasOpacity){
			element.style.opacity = opacity;
		} else {
			opacity = (opacity == 1) ? '' : 'alpha(opacity=' + opacity * 100 + ')';
			var filter = element.style.filter || this.getComputedStyle('filter') || '';
			element.style.filter = filter.test(reAlpha) ? filter.replace(reAlpha, opacity) : filter + opacity;
		}
	};*/

	//var props = local.dom.hooks;
	
	/*props.events = {

		set: function(events){
			this.addEvents(events);
		}

	};

	props.style = {

		set: function(style){
			this[0].style.cssText = style;
		},

		get: function(){
			return this[0].style.cssText;
		},

		erase: function(){
			this[0].style.cssText = '';
		}

	};

	props.styles = {
	
		set: function(styles){
			this.styles(styles)
		}

	};

	props.html = {

		set: function(html){
			this[0].innerHTML = html;
		}

	};*/

	/*props.opacity = {
	
		set: function(opacity){
			var element = this[0];
			var visibility = element.style.visibility;
			if (opacity == 0 && visibility != 'hidden') element.style.visibility = 'hidden';
			else if (opacity != 0 && visibility != 'visible') element.style.visibility = 'visible';

			setOpacity.call(this, element, opacity);
		},

		get: (hasOpacity) ? function(){
			var opacity = this[0].style.opacity || this.getComputedStyle('opacity');
			return (opacity == '') ? 1 : opacity;
		} : function(){
			var opacity, filter = (this[0].style.filter || this.getComputedStyle('filter'));
			if (filter) opacity = filter.match(reAlpha);
			return (opacity == null || filter == null) ? 1 : (opacity[1] / 100);
		}
	
	};*/



	/*var dispose = function(element){
		return (element.parentNode) ? element.parentNode.removeChild(element) : element;
	};

	var clean = function(item){
		if (item.removeEvents) item.removeEvents();
		if (item[0].clearAttributes) item[0].clearAttributes();
		var uid = item.uid;
		if (uid != null){
			delete collected[uid];
			delete storage[uid];
		}
		return item;
	};

	var camels = ['defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan', 'frameBorder', 'maxLength', 'readOnly',
		'rowSpan', 'tabIndex', 'useMap'
	];
	var bools = ['compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked', 'disabled', 'readOnly', 'multiple', 'selected',
		'noresize', 'defer'
	];
	var attributes = {
		'html': 'innerHTML',
		'class': 'className',
		'for': 'htmlFor',
		'text': (function(){
			var temp = document.createElement('div');
			return (temp.innerText == null) ? 'textContent' : 'innerText';
		})()
	};
	var readOnly = ['type'];
	var expandos = ['value', 'defaultValue'];
	var uriAttrs = /^(?:href|src|usemap)$/i;

	bools = bools.associate(bools);
	camels = camels.associate(camels.map(String.toLowerCase));
	readOnly = readOnly.associate(readOnly);

	Object.append(attributes, expandos.associate(expandos));*/

	var editor = local.Editor;

	var $dtd = editor.dtd;
	
	dom.element = function(element, props, context){
		if (element && element.$element){
			if (props != null) element.set(props);
			return element;
		}

		if (typeof element === 'string'){
			context = (context && context[0]) || document;
			element = context.createElement(element);
		}

		this[0] = element;
		this.$element = true;
		this.type = this.nodeType('element');
		this.uid = local.uidOf(element);

		if (props != null) this.set(props);
	};

	dom.element.prototype = new local.DOM.node;

	dom.element.implement({

		id: function(selector){
			return this.getDocument().get(selector);
		},

		getWindow: function(){
			return this.getDocument().getWindow();
		},

		//getElementsByTag: local.DOM.document.prototype.getElementsByTag,

		getFrameDocument: function(){
			var element = this[0];
			
			try {
				// In IE, with custom document.domain, it may happen that
				// the iframe is not yet available, resulting in "Access
				// Denied" for the following property access.
				element.contentWindow.document;
			} catch (e){
				// Trick to solve this issue, forcing the iframe to get ready
				// by simply setting its "src" property.
				element.src = element.src;
				
				// In IE6 though, the above is not enough, so we must pause the
				// execution for a while, giving it time to think.
				if (env.ie && env.version < 7){
					window.showModalDialog('javascript:document.write("' +
					'<script>' +
					'window.setTimeout(' +
					'function(){window.close();}' +
					',50);' +
					'</script>")');
				}
			}

			return element && new local.DOM.document(element.contentWindow.document);
		},

		set: function(prop, value){
			local.dom.set(Array(this[0]), prop, value);
		},

		get: function(prop){
			//var property = props[prop];
			//return (property && property.get) ? property.get.apply(this[0]) : this.getProperty(prop);
			return local.dom.get(this[0], prop);
		}.overloadGetter(),

		/*erase: function(prop){
			var property = props[prop];
			(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
			return this;
		},

		setProperty: function(attribute, value){
			attribute = camels[attribute] || attribute;
			if (value == null) return this.removeProperty(attribute);
			var key = attributes[attribute];
			(key) ? this[0][key] = value :
				(bools[attribute]) ? this[0][attribute] = !!value : this[0].setAttribute(attribute, '' + value);
			return this;
		},*/

		setProperties: function(attributes){
			for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
			return this;
		},

		/*getProperty: function(attribute){
			attribute = camels[attribute] || attribute;
			var key = attributes[attribute] || readOnly[attribute];
			return (key) ? this[0][key] :
				(bools[attribute]) ? !!this[0][attribute] :
				(uriAttrs.test(attribute) ? this[0].getAttribute(attribute, 2) :
				(key = this[0].getAttributeNode(attribute)) ? key.nodeValue : null) || null;
		},*/

		getProperties: function(){
			var args = Array.from(arguments);
			return args.map(this.getProperty, this).associate(args);
		},

		/*removeProperty: function(attribute){
			attribute = camels[attribute] || attribute;
			var key = attributes[attribute];
			(key) ? this[0][key] = '' :
				(bools[attribute]) ? this[0][attribute] = false : this[0].removeAttribute(attribute);
			return this;
		},*/

		removeProperties: function(){
			Array.flatten(arguments).each(this.removeProperty, this);
			return this;
		},

		/**
		 * Copy all the attributes from one node to the other, kinda like a clone
		 * skipAttributes is an object with the attributes that must NOT be copied.
		 * @param {Klass.DOM.element} dest The destination element.
		 * @param {Object} skipAttributes A dictionary of attributes to skip.
		 * @example
		 */
		copyAttributes: function(dest, skipAttributes){
			var element = this[0];
			var attributes = element.attributes;
			skipAttributes = skipAttributes || {};
			
			for (var i = 0, l = attributes.length; i < l; i++){
				var attribute = attributes[i];
				
				// Lowercase attribute name hard rule is broken for
				// some attribute on IE, e.g.
				var name = attribute.nodeName.toLowerCase(), value;
				
				// We can set the type only once, so do it with the proper value, not copying it.
				if (name in skipAttributes) continue;
				
				if (name == 'checked' && (value = this.getProperty(name))) dest.setProperty(name, value);
				// IE BUG: value attribute is never specified even if it exists.
				else if (attribute.specified || (env.ie && attribute.nodeValue && name == 'value')){
					value = this.getProperty(name);
					if (value === null) value = attribute.nodeValue;
					
					dest.setProperty(name, value);
				}
			}
			
			// The style:
			if (element.style.cssText !== '') dest[0].style.cssText = element.style.cssText;
		},

		/*hasAttribute: function(attribute){
			attribute = this[0].attributes.getNamedItem(attribute);
			return !!(attribute && attribute.specified);
		},*/

		hasAttributes: function(){
			var attributes = this[0].attributes, length = attributes.length;

			if (env.ie && (env.ie6 || env.ie7)){
				for (var i = 0; i < length; i++){
					var attribute = attributes[i];
					switch (attribute.nodeName){
						case 'class':
							if (this.getProperty('class')) return true;

						case 'uniqueNumber':
							continue;

						// Attributes to be ignored.
						case 'data-kse-expando':
							continue;

						/*jsl:fallthru*/

						default:
							if (attribute.specified) return true;
					}
				}
				return false;
			}	

			var expandoAttributes = {'data-kse-expando': 1, uid: 1, _moz_dirty: 1};
			return length > 0 && (length > 2 || !expandoAttributes[attributes[0].nodeName] ||
				(length === 2 && !expandoAttributes[attributes[1].nodeName]));
		},

		/*hasClass: function(className){
			return this[0].className.clean().contains(className, ' ');
		},

		addClass: function(className){
			if (!this.hasClass(className)) this[0].className = (this[0].className + ' ' + className).clean();
			return this;
		},

		removeClass: function(className){
			this[0].className = this[0].className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1').trim();
			if (!this[0].className) this[0].removeAttribute('class');
			return this;
		},

		toggleClass: function(className, force){
			if (force == null) force = !this.hasClass(className);
			return (force) ? this.addClass(className) : this.removeClass(className);
		},

		swapClass: function(remove, add){
			return this.removeClass(remove).addClass(add);
		},

		getComputedStyle: function(property){
			if (this[0].currentStyle) return this[0].currentStyle[styleCheck(property.camelCase())];
			var defaultView = this.getDocument()[0].defaultView,
				computed = defaultView ? defaultView.getComputedStyle(this[0], null) : null;
			return (computed) ? computed.getPropertyValue((property == cssFloat) ? 'float' : property.hyphenate()) : null;
		},

		opacity: function(value){
			if (value === undefined) return this.get('opacity');
			setOpacity(this[0], value);
			return this;
		},*/

		contains: function(node){
			var element = this[0];
			node = node[0] || node;
			if (element.contains){
				return node.nodeType !== 1 ? element.contains(node.parentNode) : element != node && element.contains(node);
			}
			return element === node || !!(element.compareDocumentPosition(node) & 16);
		},

		unselectable: function(all){
			if (env.ie || env.opera){
				var element = this[0], elem, i = 0;
				element.unselectable = 'on';
				while (elem = element.all[i++]){
					switch (elem.tagName.toLowerCase()){
						case 'iframe':
						case 'textarea':
						case 'input':
						case 'select':
							/* Ignore the above tags */
							break;
						default:
							elem.unselectable = 'on';
					}
				}
			}

			if (env.firefox || env.webkit){
				var key = env.firefox ? 'MozUserSelect' : 'KhtmlUserSelect';
				this[0].style[key] = 'none';
				this.addEvent('dragstart', function(e){
					e.preventDefault();
				});
			}
			return this;
		},

		is: function(){
			var name = this.name();
			for (var i = 0, l = arguments.length; i < l; i++){
				if (arguments[i] == name) return true;
			}
			return false;
		},

		isEditable: function(){
			// Get the element name.
			var name = this.name();
			
			// Get the element DTD (defaults to span for unknown elements).
			var dtd = !$dtd.$nonEditable[name] && ($dtd[name] || $dtd.span);
			
			// In the DTD # == text node.
			return (dtd && dtd['#']);
		},

		isIdentical: function(node){
			if (this.name() != node.name()) return false;
			
			var attributes = this[0].attributes, nodeAttributes = node[0].attributes;
			
			var l = attributes.length, n = nodeAttributes.length;
			
			for (var i = 0; i < l; i++){
				var attribute = attributes[i];
				if (attribute.nodeName == '_moz_dirty') continue;
				if ((!env.ie || (attribute.specified && attribute.nodeName != 'data-kse-expando')) && 
					attribute.nodeValue != node.getProperty(attribute.nodeName)) return false;
			}
			
			// For IE, we have to for both elements, because it's difficult to
			// know how the atttibutes collection is organized in its DOM.
			if (env.ie){
				for (i = 0; i < n; i++){
					attribute = nodeAttributes[i];
					if (attribute.specified && attribute.nodeName != 'data-kse-expando' && 
						attribute.nodeValue != this.getProperty(attribute.nodeName)) return false;
				}
			}
			return true;
		},

		/*isDisplayed: function(){
			return this.style('display') != 'none';
		},

		isVisible: function(){
			var w = this[0].offsetWidth, h = this[0].offsetHeight;
			return (w == 0 && h == 0) ? false : (w > 0 && h > 0) ? true : this[0].style.display != 'none';
		},*/

		/**
		 * Whether it's an empty inline elements which has no visual impact when removed.
		 */
		isEmptyInlineRemoveable: function(){
			if (!$dtd.$removeEmpty[this.name()]) return false;
			var children = this.children();
			for (var i = 0, l = children.length; i < l; i++){
				var child = children[i];
				if (child.$element && child.data('kse-bookmark')) continue;
				if (child.$element && !child.isEmptyInlineRemoveable() || child.$text && child.text().trim()) return false;
			}
			return true;
		},

		dtd: function(){
			var dtd = $dtd[this.name()];
			return dtd;
		},

		name: function(){
			var nodeName = this[0].nodeName.toLowerCase();
			if (env.ie && !(document.documentMode > 8)){
				var scopeName = this[0].scopeName;
				if (scopeName != 'HTML') nodeName = scopeName.toLowerCase() + ':' + nodeName;
			}
			return nodeName;
		},

		/**
		 * Changes the tag name of the current element.
		 * @param {String} tag The new tag name for the element.
		 */
		rename: function(tag){
			// If it's already correct exit here.
			if (this.is(tag)) return;

			var element = this[0];
			
			var doc = this.getDocument();

			// Create the new node.
			var node = new dom.element(tag, null, doc);
			
			// Copy all attributes.
			this.copyAttributes(node);
			
			// Move children to the new node.
			this.moveChildren(node);
			
			// Replace the node.
			this.parent() && element.parentNode.replaceChild(node[0], element);
			node[0]['data-kse-expando'] = element['data-kse-expando'];
			this[0] = node[0];
		},

		style: function(property, value){
			var element = this[0];

			if (value === undefined) return local.dom.getStyle(element, property);
			/*if (value == null) this.removeStyle(property);
			else */
			local.dom.setStyle(element, property, value);

			/*property = styleCheck(property);
			if (value === undefined){
				value = String(element.style[property] || this.getComputedStyle(property));
				if (env.opera || (env.ie && isNaN(parseFloat(value)))){
					if ((/^(height|width)$/).test(property)){
						var values = (property === 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
						for (var i = 0, l = values; i < l; i++){
							value = values[i];
							size += this.style('border-' + value + '-width').toInt() + this.style('padding-' + value).toInt();
						}
						return element['offset' + property.capitalize()] - size + 'px';
					}
					if (env.opera && value.indexOf('px') != -1) return value;
					if ((/^border(.+)Width|margin|padding/).test(property)) return '0px';
				}
				return value;
			}
			if (value == null){
				element.style[property] = '';
				if (element.style.removeAttribute) element.style.removeAttribute(property);
				if (!element.style.cssText) element.removeAttribute('style');
			} else {
				if (typeof value !== 'string') value += 'px';
				element.style[property] = value;
			}*/
			return this;
		},

		/**
		 * Removes a style from the element.
		 */
		removeStyle: function(property){
			var element = this[0];
			property = styleCheck(property);
			element.style[property] = '';
			if (element.style.removeAttribute) element.style.removeAttribute(property);
			if (!element.style.cssText) element.removeAttribute('style');
		},

		styles: function(styles){
			var args = arguments, result = {};
			if (typeof styles === 'string' || args.length > 1){
				Array.flatten(args).each(function(key){
					result[key] = this.style(key);
				}, this);
				return result;
			}
			for (var style in styles) this.style(style, styles[style]);
			return this;
		},

		/*html: function(html){
			if (html === undefined){
				var result = this[0].innerHTML;
				return env.ie ? result.replace(/<\?[^>]*>/g, '') : result;
			}
			this[0].innerHTML = html;
			return this;
		},

		text: function(text){
			var element = this[0];
			if (text === undefined) return element.textContent || element.innerText || '';
			if (element.innerText) element.innerText = text;
			else element.textContent = text;
			return this;
		},

		value: function(value){
			var element = this[0];
			if (value === undefined) return element.value;
			element.value = value;
			return this;
		},*/

		first: function(evaluator){
			var first = this[0].firstChild, result = first && document.node(first);
			if (result && evaluator && !evaluator(result)) result = result.next(evaluator);
			return result;
		},

		last: function(evaluator){
			var last = this[0].lastChild, result = last && document.node(last);
			if (result && evaluator && !evaluator(result)) result = result.prev(evaluator);
			return result;
		},

		/*empty: function(){
			Array.from(this[0].childNodes).each(dispose);
			return this;
		},

		destroy: function(){
			var children = clean(this)[0].getElementsByTagName('*');
			Array.each(children, clean);
			dispose(this[0]);
			return null;
		},*/

		outerHTML: function(){
			var div, element = this[0];

			// IE includes the <?xml:namespace> tag in the outerHTML of
			// namespaced element. So, we must strip it here. (#3341)
			if (element.outerHTML) return element.outerHTML.replace(/<\?[^>]*>/, '');

			div = element.ownerDocument.createElement('div');
			div.appendChild(element.cloneNode(true));
			return div.innerHTML;
		},

		/*append: function(node, __toStart){
			if (typeof node === 'string') node = this.getDocument().createElement(node);
			
			if (__toStart) this[0].insertBefore(node[0], this[0].firstChild);
			else this[0].appendChild(node[0]);
			
			return node;
		},*/

		appendHtml: function(html){
			if (this.length){
				var temp = new dom.element('div', null, this.getDocument());
				temp.html(html);
				temp.moveChildren(this);
			} else this.html(html);
			return this;
		},

		appendText: function(text){
			if (this[0].text !== undefined) this[0].text += text;
			else this.append(new dom.text(text));
		},

		appendBogus: function(){
			var last = this.last();
			
			// Ignore empty/spaces text.
			while (last && last.$text && !last.text().rtrim())
				last = last.prev();

			if (!last || !last.is || !last.is('br')){
				var bogus = env.opera ? this.getDocument().createText('') : this.getDocument().createElement('br');
				env.firefox && bogus[0].setAttribute('type', '_moz');
				this.append(bogus);
			}
		},

		breakParent: function(parent){
			var range = new dom.range(this.getDocument());
			
			// We'll be extracting part of this element, so let's use our
			// range to get the correct piece.
			range.setStartAfter(this);
			range.setEndAfter(parent);
			
			// Extract it.
			var docFrag = range.extractContents();
			
			// Move the element outside the broken element.
			range.insertNode(this.dispose());
			
			// Re-insert the extracted piece after the element.
			docFrag.insertAfterNode(this);
		},

		moveChildren: function(target, toStart){
			var element = this[0];
			target = target[0];
			
			if (element == target) return this;
			
			var child;
			
			if (toStart){
				while ((child = element.lastChild)) 
					target.insertBefore(element.removeChild(child), target.firstChild);
			} else {
				while ((child = element.firstChild)) 
					target.appendChild(element.removeChild(child));
			}

			return this;
		},

		mergeSiblings: function(){
			var mergeElements = function(element, sibling, next){
				if (sibling && sibling.$element){
					// Jumping over bookmark nodes and empty inline elements, e.g. <b><i></i></b>,
					// queuing them to be moved later. (#5567)
					var pendingNodes = [];
					
					while (sibling.data('kse-bookmark') || sibling.isEmptyInlineRemoveable()){
						pendingNodes.push(sibling);
						sibling = next ? sibling.next() : sibling.prev();
						if (!sibling || !sibling.$element) return;
					}
					
					if (element.isIdentical(sibling)){
						// Save the last child to be checked too, to merge things like
						// <b><i></i></b><b><i></i></b> => <b><i></i></b>
						var innerSibling = next ? element.last() : element.first();
						
						// Move pending nodes first into the target element.
						while (pendingNodes.length) 
							pendingNodes.shift().move(element, !next);
						
						sibling.moveChildren(element, !next);
						sibling.dispose();
						
						// Now check the last inner child (see two comments above).
						if (innerSibling && innerSibling.$element) innerSibling.mergeSiblings();
					}
				}
			};
			
			if (!($dtd.$removeEmpty[this.name()] || this.is('a'))) return;
			
			mergeElements(this, this.next(), true);
			mergeElements(this, this.prev());

		},

		/**
		 * Make any page element visible inside the browser viewport.
		 * @param {Boolean} [alignToTop]
		 */
		scrollIntoView: function(alignToTop){
			var parent = this.parent();
			if (!parent) return;
			
			// Scroll the element into parent container from the inner out.
			do {
				var parentElement = parent[0];

				// Check ancestors that overflows.
				var overflowed = parentElement.clientWidth && parentElement.clientWidth < parentElement.scrollWidth || 
					parentElement.clientHeight && parentElement.clientHeight < parentElement.scrollHeight;

				if (overflowed) scrollIntoParent.call(local.dom, this[0], parentElement, alignToTop, 1);

				// Walk across the frame.
				if (parent.is('html')){
					var win = parent.getWindow();
					
					// Avoid security error.
					try {
						var iframe = win[0].frameElement;
						iframe && (parent = new dom.element(iframe));
					} catch (e){}
				}
			} while ((parent = parent.parent()));
		},

		/*toggle: function(){
			return this[this.isDisplayed() ? 'hide' : 'show']();
		},

		hide: function(){
			var d;
			try {
				//IE fails here if the element is not in the dom
				d = this.style('display');
			} catch(e){}
			if (d == 'none') return this;
			return this.store('element:_originalDisplay', d || '').style('display', 'none');
		},

		show: function(display){
			if (!display && this.isDisplayed()) return this;
			display = display || this.retrieve('element:_originalDisplay') || 'block';
			return this.style('display', (display == 'none') ? 'block' : display);
		},*/

		hover: function(over, force){
			return force || env.ie6 ? this.addEvents({
				'mouseover': function(){
					this.addClass(over);
				},
				'mouseout': function(){
					this.removeClass(over);
				}
			}) : this;
		},

		length: function(){
			return this[0].childNodes.length;
		},

		child: function(indices){
			var element = this[0];
			if (!indices.slice) element = element.childNodes[indices];
			else {
				while (indices.length > 0 && element) 
					element = element.childNodes[indices.shift()];
			}
			return element ? document.node(element) : null;
		},

		children: function(){
			return new local.DOM.nodes(this[0].childNodes);
		},

		/**
		 * Gets element's direction. Supports both CSS 'direction' prop and 'dir' attr.
		 */
		getDirection: function(useComputed){
			return useComputed ? this.getComputedStyle('direction') : this.style('direction') || this.getProperty('dir');
		},
		
		/**
		 * Gets, sets and removes custom data to be stored as HTML5 data-* attributes.
		 * @name Klass.DOM.element.data
		 * @param {String} name The name of the attribute, execluding the 'data-' part.
		 * @param {String} [value] The value to set. If set to false, the attribute will be removed.
		 */
		/*data: function(name, value){
			name = 'data-' + name;
			if (value === undefined) return this.getProperty(name);
			else if (value === null) this.removeProperty(name);
			else this.setProperty(name, value);
		},*/

		/**
		 * Moves the selection focus to this element.
		 * @param  {Boolean} defer Whether to asynchronously defer the
		 * 		execution by 100 ms.
		 */
		focus: function(defer){
			var execute = function(){
				try {
					this[0].focus();
				} catch(e){}
			};
			defer ? execute.delay(100, this) : execute.call(this);
		},

		/**
		 * TODO 待完善
		 */
		insertFirst: function(build, where){
			var element = new dom.element('div', {'html': build}, this.getDocument());
			return element.first().inject(this, where || 'bottom');
		}

	});

	// Figure out the element position relative to the specified window.
	function screenPosition(element, refWin, isQuirks){
		var dom = local.dom;
		var pos = {x: 0, y: 0};
		
		if (!(dom.nodeName(element, isQuirks ? 'body' : 'html'))){
			var box = element.getBoundingClientRect();
			pos.x = box.left, pos.y = box.top;
		}
		
		var win = dom.getWindow(element);
		if (!dom.equals(win, refWin)){
			var outerPos = screenPosition(dom.id(win.frameElement), refWin, isQuirks);
			pos.x += outerPos.x, pos.y += outerPos.y;
		}
		
		return pos;
	}
	
	// calculated margin size.
	function computeMargin(element, side){
		return (local.dom.getComputedStyle(element, 'margin-' + side) || 0).toInt() || 0;
	}

	/**
	 * Make any page element visible inside one of the ancestors by scrolling the parent.
	 * @param {DOMElement} node The node to scroll into.
	 * @param {DOMElement} parent The container to scroll into.
	 * @param {Boolean} [alignToTop] Align the element's top side with the container's
	 * when <code>true</code> is specified; align the bottom with viewport bottom when
	 * <code>false</code> is specified. Otherwise scroll on either side with the minimum
	 * amount to show the element.
	 * @param {Boolean} [hscroll] Whether horizontal overflow should be considered.
	 */
	function scrollIntoParent(node, parent, alignToTop, hscroll){
		!parent && (parent = this.getWindow(node));
		
		var doc = this.getDocument(parent);
		var isQuirks = doc.compatMode == 'BackCompat';

		// On window <html> is scrolled while quirks scrolls <body>.
		if (local.isWindow(parent)) parent = isQuirks ? doc.body : doc.documentElement;

		var win = this.getWindow(parent);
		
		var thisPos = screenPosition(node, win, isQuirks), 
			parentPos = screenPosition(parent, win, isQuirks), 
			eh = node.offsetHeight, 
			ew = node.offsetWidth, 
			ch = parent.clientHeight, 
			cw = parent.clientWidth, lt, br;
		
		// Left-top margins.
		lt = {
			x: thisPos.x - computeMargin(node, 'left') - parentPos.x || 0,
			y: thisPos.y - computeMargin(node, 'top') - parentPos.y || 0
		};
		
		// Bottom-right margins.
		br = {
			x: thisPos.x + ew + computeMargin(node, 'right') - ((parentPos.x) + cw) || 0,
			y: thisPos.y + eh + computeMargin(node, 'bottom') - ((parentPos.y) + ch) || 0
		};
		
		// 1. Do the specified alignment as much as possible;
		// 2. Otherwise be smart to scroll only the minimum amount;
		// 3. Never cut at the top;
		// 4. DO NOT scroll when already visible.
		if (lt.y < 0 || br.y > 0) {
			this.scrollBy(parent, 0, alignToTop === true ? lt.y : alignToTop === false ? br.y : lt.y < 0 ? lt.y : br.y);
		}
		
		if (hscroll && (lt.x < 0 || br.x > 0)) this.scrollBy(parent, lt.x < 0 ? lt.x : br.x, 0);
	}

	/*[dom.window, dom.document, dom.element].invoke('implement', {

		addListener: function(type, fn){
			if (type == 'unload'){
				var old = fn, self = this;
				fn = function(){
					self.removeListener('unload', fn);
					old();
				};
			} else {
				collected[this.uid] = this;
			}
			if (this[0].addEventListener) this[0].addEventListener(type, fn, false);
			else this[0].attachEvent('on' + type, fn);
			return this;
		},

		removeListener: function(type, fn){
			if (this[0].removeEventListener) this[0].removeEventListener(type, fn, false);
			else this[0].detachEvent('on' + type, fn);
			return this;
		},

		retrieve: function(property, dflt){
			var storage = get(this.uid), prop = storage[property];
			if (dflt != null && prop == null) prop = storage[property] = dflt;
			return prop != null ? prop : null;
		},

		store: function(property, value){
			var storage = get(this.uid);
			storage[property] = value;
			return this;
		},

		eliminate: function(property){
			var storage = get(this.uid);
			delete storage[property];
			return this;
		}

	});*/

	/*function isBody(element){
		element = element[0] || element;
		return (/^(?:body|html)$/i).test(element.tagName);
	};

	function getCompatElement(element){
		var doc = element.getDocument();
		doc = doc[0] || doc;
		return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
	};


	dom.element.implement({

		scroll: function(){
			if (isBody(this)) return this.getWindow().scroll();
			return {x: this[0].scrollLeft, y: this[0].scrollTop};
		},

		scrolls: function(){
			var element = this[0].parentNode, position = {x: 0, y: 0};
			while (element && !isBody(element)){
				position.x += element.scrollLeft;
				position.y += element.scrollTop;
				element = element.parentNode;
			}
			return position;
		},

		size: function(){
			if (isBody(this)) return this.getWindow().size();
			return {x: this[0].offsetWidth, y: this[0].offsetHeight};
		}
	
	});

	[dom.document, dom.window].invoke('implement', {

		scroll: function(){
			var win = this.getWindow(), doc = getCompatElement(this);
			return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
		},

		scrollSize: function(){
			var doc = getCompatElement(this),
				min = this.size(),
				body = this.getDocument().body;

			return {x: Math.max(doc.scrollWidth, body.scrollWidth, min.x), y: Math.max(doc.scrollHeight, body.scrollHeight, min.y)};		
		},

		size: function(){
			var doc = getCompatElement(this);
			return {x: doc.clientWidth, y: doc.clientHeight};
		}

	});

	[dom.document, dom.element].invoke('implement', {
	
		getElementsByClassName: (function(document){
			var hasClass = function(element, className){
				return element.className.clean().contains(className, ' ');
			};

			if (document.getElementsByClassName){
				return function(cls, tag){
					var elements = this[0].getElementsByClassName(cls);
					var result = elements, element;
					if (tag && tag !== '*'){
						result = [];
						tag = tag.toUpperCase();
						for (var i = 0, l = elements.length; i < l; ++i){
							element = elements[i];
							if (element.tagName === tag) result[result.length] = element;
						}
					}
					return new dom.nodes(result);
				};
			}

			if (document.querySelectorAll){
				return function(cls, tag){
					return new dom.nodes(this[0].querySelectorAll((tag || '') + '.' + cls));
				};
			}
		
			return function(cls, tag){
				var elements = this[0].getElementsByTagName(tag || '*'), result = [];
				for (var i = 0, l = elements.length; i < l; ++i){
					if (hasClass(elements[i], cls)) result[result.length] = elements[i];
				}
				return new dom.nodes(result);
			}

		})(document)
	
	});*/

	[dom.window, dom.document, dom.element].invoke('implement', {

		width: function(){
			return this.getSize().x;
		},

		height: function(){
			return this.getSize().y;
		}

	});

	//dom.element.props = props;

	dom.element.setMarker = function(database, element, name, value){
		var id = element.retrieve('list_marker_id') || (element.store('list_marker_id', editor.utils.unique()).retrieve('list_marker_id')), 
			markerNames = element.retrieve('list_marker_names') || (element.store('list_marker_names', {}).retrieve('list_marker_names'));
		database[id] = element;
		markerNames[name] = 1;
		
		return element.store(name, value);
	};

	dom.element.clearMarker = function(database, element, removeFromDatabase){
		var names = element.retrieve('list_marker_names'), id = element.retrieve('list_marker_id');
		for (var i in names) element.eliminate(i);
		element.eliminate('list_marker_names');
		if (removeFromDatabase){
			element.eliminate('list_marker_id');
			delete database[id];
		}
	};

	dom.element.clearMarkers = function(database){
		for (var i in database) dom.element.clearMarker(database, database[i], 1);
	};

	(function(local, undefined){
	
		var d = local.dom,
			dom = local.DOM;

		var F = function(name){
			return function(){
				var args = Array.from(arguments), result;
				result = d[name].apply(d, [this[0]].concat(args));
				return result === d ? this : result;
			};
		};

		Array.forEach([
			'hasClass', 'addClass', 'removeClass', 'toggleClass', 'swapClass',
			'hasAttribute', 'setProperty', 'getProperty', 'removeProperty', 
			'getComputedStyle', 'getComputedSize', 'getOffsets',
			'show', 'hide', 'toggle', 'isDisplayed', 'isVisible',
			'empty', 'destroy', 'position',
			'data', 'erase'
		], function(name){
			dom.element.implement(name, F(name));
		});
	
		Array.forEach([
			'addListener', 'removeListener',
			'store', 'retrieve', 'eliminate',
			'getScroll', 'getScrollSize', 'getSize'
		], function(name){
			[dom.window, dom.document, dom.element].invoke('implement', name, F(name));
		});

		Array.forEach([
			'html', 'text', 'value'
		], function(name){
			dom.element.implement(name, function(value){
				if (value === undefined) return d.get(this[0], name);
				if (value === null) d.erase(this[0], name);
				this.set(name, value);
				return this;
			});
		});

		[dom.document, dom.element].invoke('implement', 'find', function(selector, first){
			var result = d.parse(selector, this[0] || this);
			result = result && result.length ? new dom.nodes(result) : [];
			return first ? result[0] : result;
		});

		d.hooks.state = {set: function(state){
			switch (state){
				case 0:
					d.swapClass(this, 'kse-active', 'kse-disabled');
					break;
				case 1:
					d.swapClass(this, 'kse-disabled', 'kse-active');
					break;
				default:
					d.removeClass(this, 'kse-active');
					d.removeClass(this, 'kse-disabled');
					break;
			}
		}};

	})(local);


})(window, Klass);