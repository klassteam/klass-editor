/**
 * Klass Rich Text Editor v0.5
 * http://kseditor.com
 * 
 * Copyright 2011 - 2012, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */

Klass.run(function(local, undefined){

	var constructor = local.Editor;

	var cssStyle = constructor.htmlParser.cssStyle;
	
	var cssLengthRegex = /^((?:\d*(?:\.\d+))|(?:\d+))(.*)?$/i;

	var pseudos = {};
	
	/*
	 * Replacing the former CSS length value with the later one, with
	 * adjustment to the length unit.
	 */
	function replaceCssLength(length1, length2){
		var parts1 = cssLengthRegex.exec(length1), 
			parts2 = cssLengthRegex.exec(length2);
		
		// Omit pixel length unit when necessary,
		// e.g. replaceCssLength( 10, '20px' ) -> 20
		if (parts1){
			if (!parts1[2] && parts2[2] === 'px') return parts2[1];
			if (parts1[2] === 'px' && !parts2[2]) return parts2[1] + 'px';
		}
		
		return length2;
	}
	
	constructor.plugins.implement('pseudos', function(editor){
		editor.addCSSRules(
			'img.kse-pseudo {width: 60px; height: 60px;}'
		);

		editor.addEvent('afterInitPlugins', function(){
			var dataProcessor = this.dataProcessor, 
				htmlFilter = dataProcessor && dataProcessor.htmlFilter;
			
			htmlFilter && htmlFilter.addRules({
				elements: {
					$: function(element){
						var attributes = element.attributes, 
							html = attributes && attributes['data-kse-realelement'], 
							fragment = html && new constructor.htmlParser.fragment.fromHtml(decodeURIComponent(html)), 
							realElement = fragment && fragment.children[0];

						// Width/height in the fake object are subjected to clone into the real element.
						if (realElement && element.attributes['data-kse-resizable']){
							var styles = new cssStyle(element).rules, 
								realAttributes = realElement.attributes, 
								width = styles.width, 
								height = styles.height;
							
							width && (realAttributes.width = replaceCssLength(realAttributes.width, width));
							height && (realAttributes.height = replaceCssLength(realAttributes.height, height));
						}
						
						return realElement;
					}
				}
			});
		});
	});

	constructor.extend({

		/**
		 * @param {String} name
		 * @param {Object} definition
		 */
		definePseudo: function(name, definition){
			var def = definition || {},
				parent = def.extend && this.lookupPseudo(def.extend);
			pseudos[name] = parent ? Object.append({}, parent, def) : def;
		},

		/**
		 * @param {String} name
		 * @returns {Object}
		 */
		lookupPseudo: function(name){
			return pseudos[name];
		}

	});

	constructor.implement({

		/**
		 * @param {String} pseudoName The name for pseudo object.
		 * @param {Klass.DOM.element} targetElement Target element of creating 
		 *			pseudo-element.
		 * @param {Object} extraAttributes A subset of the specified attributes 
		 *			should also be applied on the pseudo element to have better
		 *			visual effect or other uses.
		 * @returns {Klass.DOM.element} Created pseudo-element.
		 */
		createPseudoElement: function(pseudoName, targetElement, extraAttributes){
			var lang = this.lang.pseudos, 
				label = targetElement.getProperty('title') || lang[pseudoName] || lang.unknown,
				pseudo = constructor.lookupPseudo(pseudoName),
				className = pseudo.className || '';
			
			var attributes = {
				'class': ('kse-pseudo ' + className).trim(),
				'data-kse-realelement': encodeURIComponent(targetElement.outerHTML()),
				'data-kse-real-node-type': targetElement.type,
				// Do not set "src" on high-contrast so the alt text is displayed.
				src: pseudo.image || constructor.getUrl('images/spacer.gif'),
				align: targetElement.getProperty('align') || '',
				alt: label,
				title: label
			};
			
			if (pseudo.type) attributes['data-kse-real-element-type'] = pseudo.type;
			
			if (pseudo.resizable){
				attributes['data-kse-resizable'] = pseudo.resizable;
				
				var styleDeclaration = new cssStyle(), 
					width = targetElement.getProperty('width'), 
					height = targetElement.getProperty('height');
				
				width && (styleDeclaration.rules.width = cssLength(width));
				height && (styleDeclaration.rules.height = cssLength(height));
				styleDeclaration.populate(attributes);
			}

			if (extraAttributes) Object.append(attributes, extraAttributes);
			
			return this.document.createElement('img', attributes);
		},

		/**
		 * @param {String} pseudoName The name for pseudo object.
		 * @param {Klass.Editor.htmlParser.element} targetElement Target element
		 *			of creating pseudo-element.
		 * @param {Object} extraAttributes A subset of the specified attributes 
		 *			should also be applied on the pseudo element to have better
		 *			visual effect or other uses.
		 * @returns {Klass.Editor.htmlParser.element} Created pseudo-element.
		 */
		createPseudoParserElement: function(pseudoName, targetElement, extraAttributes){
			var lang = this.lang.pseudos, 
				params = targetElement.attributes,
				pseudo = constructor.lookupPseudo(pseudoName), 
				label = params.title || lang[pseudoName] || lang.unknown,
				className = pseudo.className || '', html;
			
			var writer = new constructor.htmlParser.basicWriter();
			targetElement.writeHtml(writer);
			html = writer.getHtml();
			
			var attributes = {
				'class': ('kse-pseudo ' + className).trim(),
				'data-kse-realelement': encodeURIComponent(html),
				'data-kse-real-node-type': targetElement.type,
				// Do not set "src" on high-contrast so the alt text is displayed.
				src: pseudo.image || constructor.getUrl('images/spacer.gif'),
				align: params.align || '',
				alt: label,
				title: label
			};
			
			if (pseudo.type) attributes['data-kse-real-element-type'] = pseudo.type;
			
			if (pseudo.resizable){
				attributes['data-kse-resizable'] = pseudo.resizable;

				var styleDeclaration = new cssStyle(), 
					width = params.width, 
					height = params.height;
				
				width !== undefined && (styleDeclaration.rules.width = cssLength(width));
				height !== undefined && (styleDeclaration.rules.height = cssLength(height));
				styleDeclaration.populate(attributes);
			}

			if (extraAttributes) Object.append(attributes, extraAttributes);

			return new constructor.htmlParser.element('img', attributes);
		},
	
		/**
		 * @param pseudoElement
		 * @returns
		 */
		restoreRealElement: function(pseudoElement){
			if (pseudoElement.data('kse-real-node-type') != constructor.$['NODE_ELEMENT']) return null;
			
			var element = local.DOM.create(decodeURIComponent(pseudoElement.data('kse-realelement')), this.document);
			
			if (pseudoElement.data('kse-resizable')){
				var width = pseudoElement.style('width'), height = pseudoElement.style('height');
				
				width && element.setProperty('width', replaceCssLength(element.getProperty('width'), width));
				height && element.setProperty('height', replaceCssLength(element.getProperty('height'), height));
			}
			
			return element;
		}
	
	});
	
});