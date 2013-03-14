
(function($E){

	var dtd = $E.dtd;

	// Used to sort attribute entries in an array, where the first element of
	// each object is the attribute name.
	var sortAttributes = function(a, b){
		a = a[0];
		b = b[0];
		return a < b ? -1 : a > b ? 1 : 0;
	};

	/**
	 *  Object presentation of CSS style declaration text.
	 *  @param {Klass.Editor.htmlParser.element|String} elementOrStyleText A html parser element or the inline style text.
	 */
	$E.htmlParser.cssStyle = function(){
		var styleText, arg = arguments[0], rules = {};
		
		styleText = arg instanceof $E.htmlParser.element ? arg.attributes.style : arg;
		
		// html-encoded quote might be introduced by 'font-family'
		// from MS-Word which confused the following regexp. e.g.
		//'font-family: &quot;Lucida, Console&quot;'
		(styleText || '').replace(/&quot;/g, '"').replace(/\s*([^ :;]+)\s*:\s*([^;]+)\s*(?=;|$)/g, function(match, name, value){
			name == 'font-family' && (value = value.replace(/["']/g, ''));
			rules[name.toLowerCase()] = value;
		});
		
		return {
		
			rules: rules,
			
			/**
			 *  Apply the styles onto the specified element or object.
			 * @param {Klass.Editor.htmlParser.element|Klass.DOM.element|Object} obj
			 */
			populate: function(obj){
				var style = this.toString();
				if (style){
					obj instanceof Klass.DOM.element ? 
						obj.setAttribute('style', style) : 
						obj instanceof $E.htmlParser.element ? 
						obj.attributes.style = style : 
						obj.style = style;
				}
			},
			
			toString: function(){
				var output = [];
				for (var i in rules) 
					rules[i] && output.push(i, ':', rules[i], ';');
				return output.join('');
			}

		};

	};

	/**
	 * A lightweight representation of an HTML element.
	 * @param {String} name The element name.
	 * @param {Object} attributes And object holding all attributes defined for
	 *		this element.
	 * @constructor
	 * @example
	 */
	$E.htmlParser.element = new Class({
		
		initialize: function(name, attributes){
			/**
			 * The element name.
			 * @type String
			 * @example
			 */
			this.name = name;
			
			/**
			 * Holds the attributes defined for this element.
			 * @type Object
			 * @example
			 */
			this.attributes = attributes || (attributes = {});
			
			/**
			 * The nodes that are direct children of this element.
			 * @type Array
			 * @example
			 */
			this.children = [];

			/**
			 * The node type. This is a constant value set to {@link Klass.Editor.constants.NODE_ELEMENT}.
			 * @type Number
			 * @example
			 */
			this.type = $E.$['NODE_ELEMENT'];

			/**
			 * Indicate the node type.
			 * @type Boolean
			 */
			this.$element = 1;
			
			var tagName = attributes['data-kse-real-element-type'] || name || '';
			
			// Reveal the real semantic of our internal custom tag name (#6639).
			var internalTag = tagName.match(/^kse:(.*)/);
			internalTag && (tagName = internalTag[1]);
			
			var isBlockLike = !!(dtd.$nonBodyContent[tagName] || 
				dtd.$block[tagName] || 
				dtd.$listItem[tagName] || 
				dtd.$tableContent[tagName] || 
				dtd.$nonEditable[tagName] || tagName == 'br'), 
				isEmpty = !!dtd.$empty[name];
			
			this.isEmpty = isEmpty;
			this.isUnknown = !dtd[name];
			
			/** @private */
			this.isBlockLike = isBlockLike;
			this.hasInlineStarted = isEmpty || !isBlockLike;
		},
		
		/**
		 * Adds a node to the element children list.
		 * @param {Object} node The node to be added. It can be any of of the
		 *		following types: {@link Klass.Editor.htmlParser.element},
		 *		{@link Klass.Editor.htmlParser.text} and
		 *		{@link Klass.Editor.htmlParser.comment}.
		 * @function
		 * @example
		 */
		add: $E.htmlParser.fragment.prototype.add,
		
		/**
		 * Clone this element.
		 * @returns {Klass.Editor.htmlParser.element} The element clone.
		 * @example
		 */
		clone: function(){
			return new $E.htmlParser.element(this.name, this.attributes);
		},
		
		/**
		 * Writes the element HTML to a Klass.Editor.htmlWriter.
		 * @param {Klass.Editor.htmlWriter} writer The writer to which write the HTML.
		 * @example
		 */
		writeHtml: function(writer, filter){
			var attributes = this.attributes;
			
			// Ignore kse: prefixes when writing HTML.
			var element = this, writeName = element.name, a, newAttrName, value;
			
			var isChildrenFiltered;
			
			/**
			 * Providing an option for bottom-up filtering order ( element
			 * children to be pre-filtered before the element itself ).
			 */
			element.filterChildren = function(){
				if (!isChildrenFiltered){
					var writer = new $E.htmlParser.basicWriter();
					$E.htmlParser.fragment.prototype.writeChildrenHtml.call(element, writer, filter);
					element.children = new $E.htmlParser.fragment.fromHtml(writer.getHtml(), 0, element.clone()).children;
					isChildrenFiltered = 1;
				}
			};
			
			if (filter){
				while (true){
					if (!(writeName = filter.onElementName(writeName))) return;
					
					element.name = writeName;
					
					if (!(element = filter.onElement(element))) return;
					
					element.parent = this.parent;
					
					if (element.name == writeName) break;
					
					// If the element has been replaced with something of a
					// different type, then make the replacement write itself.
					if (!element.$element){
						element.writeHtml(writer, filter);
						return;
					}
					
					writeName = element.name;
					
					// This indicate that the element has been dropped by
					// filter but not the children.
					if (!writeName){
						// Fix broken parent refs.
						for (var c = 0, length = this.children.length; c < length; c++) 
							this.children[c].parent = element.parent;
						
						this.writeChildrenHtml.call(element, writer, isChildrenFiltered ? null : filter);
						return;
					}
				}
				
				// The element may have been changed, so update the local
				// references.
				attributes = element.attributes;
			}
			
			// Open element tag.
			writer.openTag(writeName, attributes);
			
			// Copy all attributes to an array.
			var attributesArray = [];
			// Iterate over the attributes twice since filters may alter
			// other attributes.
			for (var i = 0; i < 2; i++){
				for (a in attributes){
					newAttrName = a;
					value = attributes[a];
					if (i == 1) attributesArray.push([a, value]);
					else if (filter){
						while (true){
							if (!(newAttrName = filter.onAttributeName(a))){
								delete attributes[a];
								break;
							} else if (newAttrName != a){
								delete attributes[a];
								a = newAttrName;
								continue;
							} else break;
						}
						if (newAttrName){
							if ((value = filter.onAttribute(element, newAttrName, value)) === false) delete attributes[newAttrName];
							else attributes[newAttrName] = value;
						}
					}
				}
			}
			// Sort the attributes by name.
			if (writer.sortAttributes) attributesArray.sort(sortAttributes);
			
			// Send the attributes.
			var len = attributesArray.length;
			for (i = 0; i < len; i++){
				var attrib = attributesArray[i];
				writer.attribute(attrib[0], attrib[1]);
			}
			
			// Close the tag.
			writer.openTagClose(writeName, element.isEmpty);
			
			if (!element.isEmpty){
				this.writeChildrenHtml.call(element, writer, isChildrenFiltered ? null : filter);
				// Close the element.
				writer.closeTag(writeName);
			}
		},
		
		writeChildrenHtml: function(writer, filter){
			// Send children.
			$E.htmlParser.fragment.prototype.writeChildrenHtml.apply(this, arguments);
		}

	});

})(Klass.Editor);