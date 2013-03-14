/**
 * Klass Rich Text Editor v0.5
 * http://kseditor.com
 * 
 * Copyright 2011 - 2012, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */

Klass.run(function(local){

	var constructor = local.Editor,
		pluginName = 'widget';

	var setAttributes = function(node, attributes){
		var element = node[0];
		for (var name in attributes) element.setAttribute(name, '' + attributes[name]);
	};

	var pseudoElementAttributes = {
		'data-kse-widget': 1
	};

	constructor.extend({

		/**
		 * Define a document widget based the defintion.
		 * @param {Array|String} widget The document widget name or definitions.
		 * @param {Object} definition The document widget definition.
		 * @example
		 */
		defineWidget: function(widget, definition){
			definition = definition || {};
			definition.extend = pluginName;

			if (typeof widget === 'string') this.definePseudo(widget, definition);
			else for (var key in widget) this.definePseudo(key, Object.append(widget[key], definition));
		},

		/**
		 * Lookup the definition of a document widget.
		 * @param {String} name The document widget name.
		 * @returns {Object} The definition of the document widget.
		 * @example
		 */
		lookupWidget: function(name){
			return this.lookupPseudo(name);
		}
	
	});

	constructor.implement({
		
		/**
		 * Inserted a have been defined of document widgets into the editing
		 * area when in WYSIWYG mode.
		 * @param {String} name The document widget name.
		 * @param {Object} attributes Set of extended attributes attached to the 
		 *			document widget of the element.
		 * @param {Object} styles A subset of the specified styles should also be 
		 *			applied on the pseudo element to have better visual effect.
		 * @example
		 */
		insertWidget: function(name, attributes, styles){
			name = constructor.lookupWidget(name) ? name : pluginName;
			attributes = Object.append(attributes || {}, {'data-widget-type': name});

			var widgetNode = local.DOM.create('<kse:widget></kse:widget>', editor.document);
			setAttributes(widgetNode, attributes);

			var pseudoElement = this.createPseudoElement(name, widgetNode, pseudoElementAttributes);
			styles && pseudoElement.styles(styles);

			this.insertElement(pseudoElement);
		}

	});

	constructor.plugins.implement(pluginName, function(editor){
		editor.addCommand(pluginName, new constructor.dialogCommand(pluginName, {
			label: editor.lang.widget.label
		}));

		editor.addEvent('afterInitPlugins', function(){
			var dataProcessor = this.dataProcessor, 
				dataFilter = dataProcessor && dataProcessor.dataFilter,
				htmlFilter = dataProcessor && dataProcessor.htmlFilter;

			var moveChild = function(element){
				return element && element.$element && element.attributes['data-kse-widget'];
			};

			dataFilter && dataFilter.addRules({
				elements: {
					'kse:widget': function(element){
						return editor.createPseudoParserElement(element.attributes['data-widget-type'] || pluginName, element, pseudoElementAttributes);
					}
				}
			}, 5);

			htmlFilter && htmlFilter.addRules({
				elements: {
					'p': function(element){
						var parent = element.parent,
							children = element.children, 
							len = children.length,
							index, child;
						if (parent){
							index = parent.children.indexOf(element) + 1;
							for (var i = len; i--;){
								child = children[i];
								if (moveChild(child)){
									parent.add(child, index);
									children.splice(i, 1);
								}
							}
							if (!children.length) return false;
						}
					},
					'kse:widget': function(element){
						var name = element.name, 
							parent = element.parent, 
							childs = element.children,
							len = childs.length,
							ancestor;

						for (var i = len; i--;) if (childs[i].name === name) childs.splice(i, 1);

						while (parent && parent.$element){
							if (parent.name === 'p') ancestor = parent;
							parent = parent.parent;
						}

						if (parent && ancestor){
							var children = parent.children,
								index = children.indexOf(ancestor) + 1;
							parent.add(element, index);
							return false;
						}
					}
				}
			});
		});
	});

	constructor.definePseudo(pluginName, {
		className: 'kse-widget'
	});

	constructor.config.widget = {};

});

/**
 * <kse:pseudotag id="{string}" type="{number}" title="{string}" data-kse-source="{string|json-rpc string}">{real element contents}</kse:pseudotag>
 *
 * <kse:pseudomark id="{string}" type="{number}" title="{string}" data-kse-source="{string|json-rpc string}">{real element contents}</kse:pseudomark>
 *
 * <img src="{模块占位图片}" alt="{模块名称}" title="{模块名称}" data-kse-real-element="{模块真实元素}" data-kse-real-element-type="{模块真实元素类型}" data-kse-resizable="true" />
 *
 * The widget object definition.
 * var widgetObject = {
 *		id: '',
 *		type: '',
 *		name: '',
 *		extend: '',
 *		title: 'custom module name',
 *		image: 'widget-placeholder.png',
 *		className: '',
 *		editable: false,
 *		resizable: false,
 *		lockable: false,
 *		disable: false,
 *		description: '',
 *		html: ''
 * };
 *
 */

/**
 * The list of widget definition files to load.
 * @type String
 * @default 'plugins/templates/templates/default.js'
 * @example
 * config.widget.datasource = 'http://www.kseditor.com/widget/list.html';
 */

/**
 * The list of widget definition files to load.
 * @type Object
 * @default undefined
 * @example
 * config.widget.dataViewSize = {
 *   x: 700, 
 *   y: '200px'
 * };
 */