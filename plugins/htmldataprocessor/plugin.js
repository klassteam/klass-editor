(function(local){

	var $E = local.Editor;

	var $dtd = $E.dtd;

	// Regex to scan for &nbsp; at the end of blocks, which are actually placeholders.
	// Safari transforms the &nbsp; to \xa0. (#4172)
	var tailNbspRegex = /^[\t\r\n ]*(?:&nbsp;|\xa0)$/;
	
	var protectedSourceMarker = '{kse_protected}';
	
	// Return the last non-space child node of the block (#4344).
	function lastNoneSpaceChild(block){
		var lastIndex = block.children.length, 
			last = block.children[lastIndex - 1];
		while (last && last.$text && !last.value.trim()) 
			last = block.children[--lastIndex];
		return last;
	}
	
	function trimFillers(block, fromSource){
		// If the current node is a block, and if we're converting from source or
		// we're not in IE then search for and remove any tailing BR node.
		//
		// Also, any &nbsp; at the end of blocks are fillers, remove them as well.
		// (#2886)
		var children = block.children, 
			lastChild = lastNoneSpaceChild(block);
		if (lastChild){
			if ((fromSource || !local.env.ie) && lastChild.$element && lastChild.name === 'br') children.pop();
			if (lastChild.$text && tailNbspRegex.test(lastChild.value)) children.pop();
		}
	}
	
	function blockNeedsExtension(block, fromSource, extendEmptyBlock){
		if (!fromSource && (!extendEmptyBlock || typeof extendEmptyBlock === 'function' && (extendEmptyBlock(block) === false))) return false;
		
		// 1. For IE version >=8,  empty blocks are displayed correctly themself in wysiwiyg;
		// 2. For the rest, at least table cell and list item need no filler space.
		if (fromSource && local.env.ie && (document.documentMode > 7 || block.name in $dtd.tr || block.name in $dtd.$listItem)) return false;
		
		var lastChild = lastNoneSpaceChild(block);
		
		return !lastChild || lastChild && (lastChild.$element && lastChild.name === 'br' || block.name === 'form' && lastChild.name === 'input');
	}
	
	function getBlockExtension(isOutput, emptyBlockFiller){
		return function(node){
			trimFillers(node, !isOutput);
			
			if (blockNeedsExtension(node, !isOutput, emptyBlockFiller)){
				node.add(isOutput || local.env.ie ? new $E.htmlParser.text('\xa0') : new $E.htmlParser.element('br', {}));
			}
		};
	}
	
	// Define orders of table elements.
	var tableOrder = ['caption', 'colgroup', 'col', 'thead', 'tfoot', 'tbody'];
	
	// Find out the list of block-like tags that can contain <br>.
	var blockLikeTags = Object.merge({}, $dtd.$block, $dtd.$listItem, $dtd.$tableContent);
	for (var i in blockLikeTags){
		if (!('br' in $dtd[i])) delete blockLikeTags[i];
	}
	// We just avoid filler in <pre> right now.
	// TODO: Support filler for <pre>, line break is also occupy line height.
	delete blockLikeTags.pre;
	var defaultDataFilterRules = {
		elements: {},
		attributeNames: [
			// Event attributes (onXYZ) must not be directly set. They can become
			// active in the editing area (IE|WebKit).
			[(/^on/), 'data-kse-pa-on']
		]
	};
	
	var defaultDataBlockFilterRules = {
		elements: {}
	};
	
	for (i in blockLikeTags) 
		defaultDataBlockFilterRules.elements[i] = getBlockExtension();
	
	var defaultHtmlFilterRules = {
		elementNames: [
			// Remove the non "widget" of the "kse:" namespace prefix.
			[(/^kse:(?!widget)/), ''],
			// Ignore <?xml:namespace> tags.
			[(/^\?xml:namespace$/), '']
		],
		
		attributeNames: [
			// Attributes saved for changes and protected attributes.
			[(/^data-kse-(saved|pa)-/), ''],
			// All "data-kse-" attributes are to be ignored.
			[(/^data-kse-.*/), ''], 
			['hidefocus', ''],
			['uid', ''],
			['uniqueNumber', '']
		],
		
		elements: {
			$: function(element){
				var attributes = element.attributes;
				
				if (attributes){
					// Elements marked as temporary are to be ignored.
					if (attributes['data-kse-temp']) return false;
					
					// Remove duplicated attributes - #3789.
					var attributeNames = ['name', 'href', 'src'], savedAttributeName;
					for (var i = 0, l = attributeNames.length; i < l; i++){
						savedAttributeName = 'data-kse-saved-' + attributeNames[i];
						savedAttributeName in attributes && (delete attributes[attributeNames[i]]);
					}
				}
				
				return element;
			},
			
			// The contents of table should be in correct order (#4809).
			table: function(element){
				var children = element.children;
				children.sort(function(node1, node2){
					return node1.$element && node2.type === node1.type ? tableOrder.indexOf(node1.name) > tableOrder.indexOf(node2.name) ? 1 : -1 : 0;
				});
			},
			
			embed: function(element){
				var parent = element.parent;
				
				// If the <embed> is child of a <object>, copy the width
				// and height attributes from it.
				if (parent && parent.name === 'object'){
					var parentWidth = parent.attributes.width, 
						parentHeight = parent.attributes.height;
					parentWidth && (element.attributes.width = parentWidth);
					parentHeight && (element.attributes.height = parentHeight);
				}
			},
			// Restore param elements into self-closing.
			param: function(param){
				param.children = [];
				param.isEmpty = true;
				return param;
			},
			
			// Remove empty link but not empty anchor.(#3829)
			a: function(element){
				if (!(element.children.length || element.attributes.name || element.attributes['data-kse-saved-name'])){ return false; }
			},
			
			// Remove dummy span in webkit.
			span: function(element){
				if (element.attributes['class'] == 'Apple-style-span') delete element.name;
			},
			
			// Empty <pre> in IE is reported with filler node (&nbsp;).
			pre: function(element){
				local.env.ie && trimFillers(element);
			},
			
			html: function(element){
				delete element.attributes.contenteditable;
				delete element.attributes['class'];
			},
			
			body: function(element){
				delete element.attributes.spellcheck;
				delete element.attributes.contenteditable;
			},
			
			style: function(element){
				var child = element.children[0];
				child && child.value && (child.value = child.value.trim());
				
				if (!element.attributes.type) element.attributes.type = 'text/css';
			},
			
			title: function(element){
				var titleText = element.children[0];
				titleText && (titleText.value = element.attributes['data-kse-title'] || '');
			}
		},
		
		attributes: {
			'class': function(value, element){
				// Remove all class names starting with "kse-".
				return value.replace(/(?:^|\s+)kse-[^\s]*/g, '').ltrim() || false;
			}
		}
	};
	
	if (local.env.ie){
		// IE outputs style attribute in capital letters. We should convert
		// them back to lower case, while not hurting the values (#5930)
		defaultHtmlFilterRules.attributes.style = function(value, element){
			return value.replace(/(^|;)([^\:]+)/g, function(match){
				return match.toLowerCase();
			});
		};
	}
	
	function protectReadOnly(element){
		var attributes = element.attributes;
		
		// We should flag that the element was locked by our code so
		// it'll be editable by the editor functions (#6046).
		if (attributes.contenteditable != 'false') attributes['data-kse-editable'] = attributes.contenteditable ? 'true' : 1;
		
		attributes.contenteditable = 'false';
	}

	function unprotectReadyOnly(element){
		var attributes = element.attributes;
		switch (attributes['data-kse-editable']){
			case 'true':
				attributes.contenteditable = 'true';
				break;
			case '1':
				delete attributes.contenteditable;
				break;
		}
	}
	// Disable form elements editing mode provided by some browers. (#5746)
	for (i in {input: 1, textarea: 1 }){
		defaultDataFilterRules.elements[i] = protectReadOnly;
		defaultHtmlFilterRules.elements[i] = unprotectReadyOnly;
	}
	
	var protectElementRegex = /<(a|area|img|input)\b([^>]*)>/gi, 
		protectAttributeRegex = /\b(href|src|name)\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|(?:[^ "'>]+))/gi;
	
	var protectElementsRegex = /(?:<style(?=[ >])[^>]*>[\s\S]*<\/style>)|(?:<(:?link|meta|base)[^>]*>)/gi, 
		encodedElementsRegex = /<kse:encoded>([^<]*)<\/kse:encoded>/gi;
	
	var protectElementNamesRegex = /(<\/?)((?:object|embed|param|html|body|head|title)[^>]*>)/gi, 
		unprotectElementNamesRegex = /(<\/?)kse:((?:html|body|head|title)[^>]*>)/gi;
	
	var protectSelfClosingRegex = /<kse:(param|embed)([^>]*?)\/?>(?!\s*<\/kse:\1)/gi;
	
	function protectAttributes(html){
		return html.replace(protectElementRegex, function(element, tag, attributes){
			return '<' + tag + attributes.replace(protectAttributeRegex, function(fullAttr, attrName){
				// We should not rewrite the existed protected attributes, e.g. clipboard content from editor. (#5218)
				if (attributes.indexOf('data-kse-saved-' + attrName) == -1) return ' data-kse-saved-' + fullAttr + ' ' + fullAttr;
				return fullAttr;
			}) + '>';
		});
	}
	
	function protectElements(html){
		return html.replace(protectElementsRegex, function(match){
			return '<kse:encoded>' + encodeURIComponent(match) + '</kse:encoded>';
		});
	}
	
	function unprotectElements(html){
		return html.replace(encodedElementsRegex, function(match, encoded){
			return decodeURIComponent(encoded);
		});
	}
	
	function protectElementsNames(html){
		return html.replace(protectElementNamesRegex, '$1kse:$2');
	}
	
	function unprotectElementNames(html){
		return html.replace(unprotectElementNamesRegex, '$1$2');
	}
	
	function protectSelfClosingElements(html){
		return html.replace(protectSelfClosingRegex, '<kse:$1$2></kse:$1>');
	}
	
	function protectPreFormatted(html){
		return html.replace(/(<pre\b[^>]*>)(\r\n|\n)/g, '$1$2$2');
	}
	
	function protectRealComments(html){
		return html.replace(/<!--(?!{kse_protected})[\s\S]+?-->/g, function(match){
			return '<!--' + protectedSourceMarker + '{C}' + encodeURIComponent(match).replace(/--/g, '%2D%2D') + '-->';
		});
	}
	
	function unprotectRealComments(html){
		return html.replace(/<!--\{kse_protected\}\{C\}([\s\S]+?)-->/g, function(match, data){
			return decodeURIComponent(data);
		});
	}
	
	function unprotectSource(html, editor){
		var store = editor.storage.dataStore;
		
		return html.replace(/<!--\{kse_protected\}([\s\S]+?)-->/g, function(match, data){
			return decodeURIComponent(data);
		}).replace(/\{kse_protected_(\d+)\}/g, function(match, id){
			return store && store[id] || '';
		});
	}
	
	function protectSource(data, editor){
		var protectedHtml = [], 
			protectRegexes = editor.config.protectedSource,
			store = editor.storage.dataStore || (editor.storage.dataStore = {id: 1}),
			tempRegex = /<\!--\{kse_temp(comment)?\}(\d*?)-->/g;
		
		var regexes = [
			// Script tags will also be forced to be protected, otherwise
			// IE will execute them.
			(/<script[\s\S]*?<\/script>/gi),
			// <noscript> tags (get lost in IE and messed up in FF).
			/<noscript[\s\S]*?<\/noscript>/gi
		].concat(protectRegexes);
		
		// First of any other protection, we must protect all comments
		// to avoid loosing them (of course, IE related).
		// Note that we use a different tag for comments, as we need to
		// transform them when applying filters.
		data = data.replace((/<!--[\s\S]*?-->/g), function(match){
			return '<!--{kse_tempcomment}' + (protectedHtml.push(match) - 1) + '-->';
		});
		
		for (var i = 0, l = regexes.length; i < l; i++){
			data = data.replace(regexes[i], function(match){
				match = match.replace(tempRegex, function($, isComment, id){
					return protectedHtml[id];
				});
				
				// Avoid protecting over protected, e.g. /\{.*?\}/
				return (/kse_temp(comment)?/).test(match) ? match : '<!--{kse_temp}' + (protectedHtml.push(match) - 1) + '-->';
			});
		}

		data = data.replace(tempRegex, function($, isComment, id){
			return '<!--' + protectedSourceMarker + (isComment ? '{C}' : '') + encodeURIComponent(protectedHtml[id]).replace(/--/g, '%2D%2D') + '-->';
		});
		
		// Different protection pattern is used for those that
		// live in attributes to avoid from being HTML encoded.
		return data.replace(/(['"]).*?\1/g, function(match){
			return match.replace(/<!--\{kse_protected\}([\s\S]+?)-->/g, function(match, data){
				store[store.id] = decodeURIComponent(data);
				return '{kse_protected_' + (store.id++) + '}';
			});
		});
	}
	
	$E.htmlDataProcessor = new Class({
		
		initialize: function(editor){
			this.editor = editor;
			
			this.writer = new $E.htmlWriter();
			this.dataFilter = new $E.htmlParser.filter();
			this.htmlFilter = new $E.htmlParser.filter();
		},
	
		toHTML: function(data, fixForBody){
			// The source data is already HTML, but we need to clean
			// it up and apply the filter.
			data = protectSource(data, this.editor);

			// Before anything, we must protect the URL attributes as the
			// browser may changing them when setting the innerHTML later in
			// the code.
			data = protectAttributes(data);

			// Protect elements than can't be set inside a DIV. E.g. IE removes
			// style tags from innerHTML. (#3710)
			data = protectElements(data);
			
			// Certain elements has problem to go through DOM operation, protect
			// them by prefixing 'kse' namespace. (#3591)
			data = protectElementsNames(data);
			
			// All none-IE browsers ignore self-closed custom elements,
			// protecting them into open-close. (#3591)
			data = protectSelfClosingElements(data);
			
			// Compensate one leading line break after <pre> open as browsers
			// eat it up. (#5789)
			data = protectPreFormatted(data);
			
			// Call the browser to help us fixing a possibly invalid HTML
			// structure.
			var div = new local.DOM.element('div');
			// Add fake character to workaround IE comments bug. (#3801)
			div.html('a' + data);
			data = div.html().substr(1);
			
			// Unprotect "some" of the protected elements at this point.
			data = unprotectElementNames(data);
			
			data = unprotectElements(data);
			
			// Restore the comments that have been protected, in this way they
			// can be properly filtered.
			data = unprotectRealComments(data);
			
			// Now use our parser to make further fixes to the structure, as
			// well as apply the filter.
			var fragment = $E.htmlParser.fragment.fromHtml(data, fixForBody), 
				writer = new $E.htmlParser.basicWriter();

			fragment.writeHtml(writer, this.dataFilter);
			data = writer.getHtml(true);

			// Protect the real comments again.
			data = protectRealComments(data);

			return data;
		},
		
		toDataFormat: function(html, fixForBody){
			var writer = this.writer, 
				fragment = $E.htmlParser.fragment.fromHtml(html, fixForBody);

			writer.reset();
			
			fragment.writeHtml(writer, this.htmlFilter);

			var data = writer.getHtml(true);

			// Restore those non-HTML protected source. (#4475,#4880)
			data = unprotectRealComments(data);
			data = unprotectSource(data, this.editor);

			return data;
		}

	});

	$E.plugins.implement('htmldataprocessor', function(editor){
		var dataProcessor = editor.dataProcessor = new $E.htmlDataProcessor(editor);
		
		dataProcessor.writer.forceSimpleAmpersand = editor.config.forceSimpleAmpersand;
		
		dataProcessor.dataFilter.addRules(defaultDataFilterRules);
		dataProcessor.dataFilter.addRules(defaultDataBlockFilterRules);
		dataProcessor.htmlFilter.addRules(defaultHtmlFilterRules);
		
		var defaultHtmlBlockFilterRules = {
			elements: {}
		};
		for (var i in blockLikeTags) 
			defaultHtmlBlockFilterRules.elements[i] = getBlockExtension(true, editor.config.fillEmptyBlocks);
		
		dataProcessor.htmlFilter.addRules(defaultHtmlBlockFilterRules);
	});

})(Klass);

/**
 * Whether to force using "&" instead of "&amp;amp;" in elements attributes
 * values, it's not recommended to change this setting for compliance with the
 * W3C XHTML 1.0 standards (<a href="http://www.w3.org/TR/xhtml1/#C_12">C.12, XHTML 1.0</a>).
 * @name Klass.Editor.config.forceSimpleAmpersand
 * @type Boolean
 * @default false
 * @example
 * config.forceSimpleAmpersand = false;
 */

/**
 * Whether a filler text (non-breaking space entity - &nbsp;) will be inserted into empty block elements in HTML output,
 * this is used to render block elements properly with line-height; When a function is instead specified,
 * it'll be passed a {@link Klass.Editor.htmlParser.element} to decide whether adding the filler text
 * by expecting a boolean return value.
 * @name Klass.Editor.config.fillEmptyBlocks
 * @since 3.5
 * @type Boolean
 * @default true
 * @example
 * config.fillEmptyBlocks = false;	// Prevent filler nodes in all empty blocks.
 *
 * // Prevent filler node only in float cleaners.
 * config.fillEmptyBlocks = function( element )
 * {
 * 	if ( element.attributes[ 'class' ].indexOf ( 'clear-both' ) != -1 )
 * 		return false;
 * }
 */
Klass.Editor.config.fillEmptyBlocks = true;