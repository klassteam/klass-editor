(function(window, local){

	var document = window.document;

	var $ = local.Editor.constants;

	var DOM = local.DOM;

	DOM.node = function(node){
		if (node){
			switch (node.nodeType){
				case $['NODE_DOCUMENT']:
					return new DOM.document(node);

				case $['NODE_ELEMENT']:
					return new DOM.element(node);

				case $['NODE_TEXT']:
					return new DOM.text(node);
			}
		}
		this[0] = node;
	};

	DOM.node.prototype = new DOM;

	DOM.node.implement({

		/*appendTo: function(element, toStart){
			element.append(this, toStart);
			return element;
		},*/

		clone: function(contents, keepid){
			var clone = this[0].cloneNode(contents);

			var clean = function(node){
				if (node.nodeType !== $['NODE_ELEMENT']) return;
				if (!keepid) node.removeAttribute('id', false);
				node.removeAttribute('data-kse-expando', false);

				if (contents){
					var childs = node.childNodes, l = childs.length;
					for (var i = 0; i < l; i++) clean(childs[i]);	
				}
			};
			
			clean(clone);
			
			return document.node(clone);
		},

		hasPrevious: function(){
			return !!this[0].previousSibling;
		},
		
		hasNext: function(){
			return !!this[0].nextSibling;
		},

		normalize: function(){
			var node = this[0];
			if (this.$text) this.parent().normalize();
			else if (node.normalize) node.normalize();
			return this;
		},

		/**
		 * Retrieves a uniquely identifiable tree address for this node.
		 * The tree address returns is an array of integers, with each integer
		 * indicating a child index of a DOM node, starting from
		 * document.documentElement.
		 *
		 * For example, assuming <body> is the second child from <html> (<head>
		 * being the first), and we'd like to address the third child under the
		 * fourth child of body, the tree address returned would be:
		 * [1, 3, 2]
		 *
		 * The tree address cannot be used for finding back the DOM tree node once
		 * the DOM tree structure has been modified.
		 */
		getAddress: function(normalized){
			var address = [], node = this[0];
			var documentElement = this.getDocument()[0].documentElement;
			
			while (node && node !== documentElement){
				var parentNode = node.parentNode;
				var currentIndex = -1;
				if (parentNode){
					for (var i = 0, l = parentNode.childNodes.length; i < l; i++){
						var candidate = parentNode.childNodes[i];
						if (normalized && candidate.nodeType == 3 && candidate.previousSibling && candidate.previousSibling.nodeType == 3) continue;
						currentIndex++;
						if (candidate == node) break;
					}
					address.unshift(currentIndex);
				}
				node = parentNode;
			}
			return address;
		},

		getDocument: function(){
			return new DOM.document(this[0].ownerDocument || this[0].parentNode.ownerDocument);
		},

		index: function(normalized){
			var current = this[0], index = 0;

			while ((current = current.previousSibling)){
				if (normalized && current.nodeType === 3 && 
					(!current.nodeValue.length || 
					(current.previousSibling && 
					current.previousSibling.nodeType === 3))) continue;

				index++
			}
			
			return index;
		},

		getNextSourceNode: function(startFromSibling, nodeType, guard){
			// If "guard" is a node, transform it in a function.
			if (guard && !guard.call){
				var guardNode = guard;
				guard = function(node){
					return !node.equals(guardNode);
				};
			}
			
			var node = (!startFromSibling && this.first && this.first()), parent;
			
			// Guarding when we're skipping the current element( no children or 'startFromSibling' ).
			// send the 'moving out' signal even we don't actually dive into.
			if (!node){
				if (this.$element && guard && guard(this, true) === false) return null;
				node = this.next();
			}
			
			while (!node && (parent = (parent || this).parent())){
				// The guard check sends the "true" paramenter to indicate that
				// we are moving "out" of the element.
				if (guard && guard(parent, true) === false) return null;
				
				node = parent.next();
			}
			
			if (!node) return null;
			
			if (guard && guard(node) === false) return null;

			if (nodeType && nodeType != node.type) return node.getNextSourceNode(false, nodeType, guard);

			return node;
		},
		
		getPreviousSourceNode: function(startFromSibling, nodeType, guard){
			if (guard && !guard.call){
				var guardNode = guard;
				guard = function(node){
					return !node.equals(guardNode);
				};
			}
			
			var node = (!startFromSibling && this.last && this.last()), parent;
			
			// Guarding when we're skipping the current element( no children or 'startFromSibling' ).
			// send the 'moving out' signal even we don't actually dive into.
			if (!node){
				if (this.$element && guard && guard(this, true) === false) return null;
				node = this.prev();
			}
			
			while (!node && (parent = (parent || this).parent())){
				// The guard check sends the "true" paramenter to indicate that
				// we are moving "out" of the element.
				if (guard && guard(parent, true) === false) return null;
				
				node = parent.prev();
			}
			
			if (!node) return null;
			
			if (guard && guard(node) === false) return null;
			
			if (nodeType && node.type != nodeType) return node.getPreviousSourceNode(false, nodeType, guard);

			return node;
		},

		parent: function(until){
			var parent = this[0].parentNode;
			if (until && typeof until === 'string'){
				while (parent){
					if (parent.tagName.toLowerCase() === until) break;
					parent = parent.parentNode;
				}
			}
			return parent && parent.nodeType === 1 ? document.node(parent) : null;
		},

		parents: function(closer){
			var node = this;
			var parents = [];
			
			do {
				parents[closer ? 'push' : 'unshift'](node);
			} while ((node = node.parent()))
			
			return parents;
		},

		prev: function(evaluator){
			var prev = this[0], retval;
			do {
				prev = prev.previousSibling;
				// Avoid returning the doc type node.
				// http://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-412266927
				retval = prev && prev.nodeType !== 10 && document.node(prev);
			} while (retval && evaluator && !evaluator(retval))
			return retval;
		},
		
		next: function(evaluator){
			var next = this[0], result;
			do {
				next = next.nextSibling;
				result = next && document.node(next);
			} while (result && evaluator && !evaluator(result))
			return result;
		},

		adopt: function(){
			var parent = this[0], fragment, elements = Array.flatten(arguments), length = elements.length;
			if (length > 1) parent = fragment = document.createDocumentFragment();

			for (var i = 0; i < length; i++){
				var element = document.node(elements[i])[0];
				if (element) parent.appendChild(element);
			}

			if (fragment) this[0].appendChild(fragment);

			return this;
		},

		dispose: function(preserveChildren){
			var node = this[0];
			var parentNode = node.parentNode;
			
			if (parentNode){
				if (preserveChildren){
					for (var child; (child = node.firstChild);){
						parentNode.insertBefore(node.removeChild(child), node);
					}
				}
				parentNode.removeChild(node);
			}
			return this;
		},

		getCommonAncestor: function(node){
			if (node.equals(this)) return this;
			
			if (node.contains && node.contains(this)) return node;
			
			var start = this.contains ? this : this.parent();
			
			do {
				if (start.contains(node)) return start;
			} while ((start = start.parent()));
			
			return null;
		},

		compareDocumentPosition: function(relative){
			var element = this[0];
			var relativeElement = relative[0];
			
			if (element.compareDocumentPosition) return element.compareDocumentPosition(relativeElement);
			
			// IE and Safari have no support for compareDocumentPosition.
			
			if (element == relativeElement) return $['POSITION_IDENTICAL'];
			
			// Only element nodes support contains and sourceIndex.
			if (this.$element && relative.$element){
				if (element.contains){
					if (element.contains(relativeElement)) return $['POSITION_CONTAINS'] + $['POSITION_PRECEDING'];
					
					if (relativeElement.contains(element)) return $['POSITION_IS_CONTAINED'] + $['POSITION_FOLLOWING'];
				}
				
				if ('sourceIndex' in element){
					return (element.sourceIndex < 0 || relativeElement.sourceIndex < 0) ? 
						$['POSITION_DISCONNECTED'] : (element.sourceIndex < relativeElement.sourceIndex) ? 
						$['POSITION_PRECEDING'] : $['POSITION_FOLLOWING'];
				}
			}
			
			// For nodes that don't support compareDocumentPosition, contains
			// or sourceIndex, their "address" is compared.
			
			var elementAddress = this.getAddress(), relativeAddress = relative.getAddress(), minLevel = Math.min(elementAddress.length, relativeAddress.length);
			
			// Determinate preceed/follow relationship.
			for (var i = 0; i <= minLevel - 1; i++){
				if (elementAddress[i] != relativeAddress[i]){
					if (i < minLevel){
						return elementAddress[i] < relativeAddress[i] ? $['POSITION_PRECEDING'] : $['POSITION_FOLLOWING'];
					}
					break;
				}
			}
			
			// Determinate contains/contained relationship.
			return (elementAddress.length < relativeAddress.length) ? 
				$['POSITION_CONTAINS'] + $['POSITION_PRECEDING'] : 
				$['POSITION_IS_CONTAINED'] + $['POSITION_FOLLOWING'];
		},
		
		/**
		 * Gets the closes ancestor node of a specified node name.
		 * @param {String} name Node name of ancestor node.
		 * @param {Boolean} oneself (Optional) Whether to include the current
		 * node in the calculation or not.
		 * @returns {dom.node} Ancestor node.
		 */
		getAscendant: function(name, oneself){
			var element = this[0];
			
			if (!oneself) element = element.parentNode;
			
			while (element){
				if (element.nodeName && element.nodeName.toLowerCase() == name) return document.node(element);
				element = element.parentNode;
			}
			return null;
		},
		
		hasAscendant: function(name, oneself){
			var element = this[0];
			
			if (!oneself) element = element.parentNode;
			
			while (element){
				if (element.nodeName && element.nodeName.toLowerCase() == name) return true;
				element = element.parentNode;
			}
			return false;
		},

		move: function(target, start){
			target[start ? 'prepend' : 'append'](this.dispose());
		},

		replaces: function(nodeToReplace){
			this.injectBefore(nodeToReplace);
			nodeToReplace.dispose();
		},

		trim: function(){
			return this.ltrim().rtrim();
		},
		
		ltrim: function(){
			var child;
			while (this.first && (child = this.first())){
				if (child.$text){
					var trimmed = child.text().ltrim(), originalLength = child.length();
					
					if (!trimmed){
						child.dispose();
						continue;
					} else if (trimmed.length < originalLength){
						child.split(originalLength - trimmed.length);
						
						// IE BUG: child.dispose() may raise JavaScript errors here. (#81)
						this[0].removeChild(this[0].firstChild);
					}
				}
				break;
			}
			return this;
		},
		
		rtrim: function(){
			var child;
			while (this.last && (child = this.last())){
				if (child.$text){
					var trimmed = child.text().rtrim(), originalLength = child.length();
					
					if (!trimmed){
						child.dispose();
						continue;
					} else if (trimmed.length < originalLength){
						child.split(trimmed.length);
						
						// IE BUG: child.next().dispose() may raise JavaScript errors here.
						// (#81)
						this[0].lastChild.parentNode.removeChild(this[0].lastChild);
					}
				}
				break;
			}
			
			if (!local.env.ie && !local.env.opera){
				child = this[0].lastChild;
				
				if (child && child.type == 1 && child.nodeName.toLowerCase() == 'br'){
					// Use "eChildNode.parentNode" instead of "node" to avoid IE bug (#324).
					child.parentNode.removeChild(child);
				}
			}
			return this;
		},

		/**
		 * Checks is this node is read-only (should not be changed). It
		 * additionaly returns the element, if any, which defines the read-only
		 * state of this node. It may be the node itself or any of its parent
		 * nodes.
		 * @returns An element containing read-only attributes or "false" if none is found.
		 */
		isReadOnly: function(){
			var element = this;
			if (this.type != $['NODE_ELEMENT']) element = this.parent();
			if (element && typeof element[0].isContentEditable !== 'undefined'){
				return !(element[0].isContentEditable || element.data('kse-editable'));
			} else {
				var current = element;
				while (current){
					if (current.is('body') || !!current.data('kse-editable')) break;
					if (current.getProperty('contentEditable') === 'false') return true;
					else if (current.getProperty('contentEditable') === 'true') break;
					current = current.parent();
				}
				return false;
			}
		}

	});

	var inserters = {
	
		before: function(context, element){
			if (element.parentNode) element.parentNode.insertBefore(context, element);
		},
		
		after: function(context, element){
			if (!element.parentNode) return;
			var next = element.nextSibling;
			(next) ? element.parentNode.insertBefore(context, next) : element.parentNode.appendChild(context);
		},
		
		bottom: function(context, element){
			element.appendChild(context);
		},
		
		top: function(context, element){
			var first = element.firstChild;
			(first) ? element.insertBefore(context, first) : element.appendChild(context);
		}
		
	};
	
	inserters.inside = inserters.bottom;
	
	/*Object.each(inserters, function(inserter, where){
	
		where = where.capitalize();
		
		//DOM.node.implement('insert' + where, function(element){
		//	inserter(this[0], element[0]);
		//	return this;
		//});
		
		DOM.node.implement('inject' + where, function(element){
			inserter(this[0], element[0]);
			return this;
		});
		
		//DOM.node.implement('grab' + where, function(element){
		//	inserter(element[0], this[0]);
		//	return this;
		//});
		
	});*/
	
	DOM.node.implement({
	
		inject: function(element, where){
			inserters[where || 'bottom'](this[0], element[0]);
			return this;
		}/*,
		
		//insert: function(element, where){
		//	inserters[where || 'bottom'](this[0], element[0]);
		//	return this;
		//},
		
		grab: function(element, where){
			inserters[where || 'bottom'](element[0], this[0]);
			// @quote Range execContentsAction
			// 原来的返回值是this, 暂时改为返回element
			return element;
		}*/
		
	});

	// 临时方法，后期考虑移除
	/*DOM.node.implement({
		
		insertAfter: function(context){
			context[0].parentNode.insertBefore(this[0], context[0].nextSibling);
			return context;
		},

		insertBefore: function(context){
			context[0].parentNode.insertBefore(this[0], context[0]);
			return context;
		}

	});*/

	(function(local){
	
		var d = local.dom,
			dom = local.DOM;

		var getElement = function(element){
			if (typeof element === 'string') element = this.getDocument().createElement(element);
			return element[0] || element;
		};

		Object.forEach({
			before: 'injectBefore',
			after: 'injectAfter',
			append: 'appendTo',
			prepend: 'prependTo'
		}, function(method, name){
			dom.node.implement(name, function(context){
				d[name](getElement(context), this[0]);
				return this;
			});
			dom.node.implement(method, function(context){
				d[name](this[0], getElement(context));
				return this;
			});
		});
	
	})(local);

})(window, Klass);