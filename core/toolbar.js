
Klass.Editor.ui.toolbar = new Class({

	initialize: function(editor, container){
		this.container = document.node(container);
		this.editor = editor;
		this.ui = editor.ui;
		this.elements = [];
		this.render();
	},

	render: function(){
		var config = this.editor.config.toolbar;
		var toolbar = config[config.mode];
		toolbar.each(function(group){
			if (Klass.isArray(group)) {
				group.each(function(item){
					if (item) this.addItem(item);
				}.bind(this));
				this.createGroup();
			}
			if (group === '/') this.createToolbar();
		}.bind(this));
	},
	
	addButton: function(item, value){
		if (item && $type(value) === 'object') this.items.include(item, value);
		return this;
	},
	
	addRichCombo: function(item, value){
		$extend(value, {
			combo: true
		});
		this.addButton(item, value);
		return this;
	},
	
	addCommand: function(){
	
	},
	
	addItem: function(name){
		if (name === '-') return this.addSeparator();
		//if (!this.editor.plugins[name]) return false;
		
		//var type = (this.items[name] && this.items[name].combo) ? 'comboBox' : 'button';

		var item = this.ui.items[name] ? this.ui.create(name) : new Klass.Editor.ui.button(name, this.editor);

		var element = item.toElement();
		
		//this.buttons[name] = button;
		
		this.elements.include(element);
	
		//this.editor.unselectable(element);
	},
	
	addSeparator: function(){
		var separator = Klass.DOM.createElement('span', {
			'class': 'kse-separator'
		});
		this.elements.push(separator);
		return this;
	},
	
	remove: function(){
	
	},
	
	createToolbar: function(){
		var element = this.container;
		if (!element[0].childNodes.length) this.container = Klass.DOM.createElement('div', {
			'class': 'kse-toolbox',
			'events': {
				// fixed IE9 unselectable invalid
				mousedown: function(){
					return false;
				}
			}
		}).appendTo(element);
		this.tbElement = Klass.DOM.createElement('div', {
			'class': 'kse-toolbar'
		}).appendTo(this.container);
	},
	
	addPlugins: function(){
		var plugins = this.config.plugins.split(',');
		for (var i = 0, l = plugins.length; i < l; i++) {
			var p = plugins[i];
			if (this[p]) this[p](this.editor, this);
		}
		this.addPlugins1();
	},
	
	addPlugins1: function(){
		this.getToolbar().each(function(items){
			if ($type(items) === 'array') {
				items.each(function(item){
					if (item) this.addItem(item);
				}.bind(this));
				this.createGroup();
			}
			if (items === '/') this.createToolbar();
		}.bind(this));
	},
	
	createGroup: function(){
		if (!this.tbElement) this.createToolbar();
		var element = Klass.DOM.createElement('span', {
			'class': 'kse-group'
		});
		element.adopt(this.elements).unselectable().appendTo(this.tbElement);
		this.elements.empty();
	}
	
});

Klass.Editor.ui.implement('createToolbar', function(editor, container){
	return new Klass.Editor.ui.toolbar(editor, container);
});


Klass.Editor.config.toolbar = {

	/**
	 * The toolbox (alias toolbar) definition. It is a toolbar name or an array of
	 * toolbars (strips), each one being also an array, containing a list of UI items.
	 * @type Array|String
	 * @default 'Full'
	 * @example
	 * // Defines a toolbar with only one strip containing the "Source" button, a
	 * // separator and the "Bold" and "Italic" buttons.
	 * config.toolbar =
	 * [
	 *     [ 'Source', '-', 'Bold', 'Italic' ]
	 * ];
	 * @example
	 * // Load toolbar_Name where Name = Basic.
	 * config.toolbar = 'Basic';
	 */
	mode: 'default',

	/**
	 * The "theme space" to which rendering the toolbar. For the default theme,
	 * the recommended options are "top" and "bottom".
	 * @type String
	 * @default 'top'
	 * @example
	 * config.toolbar.location = 'bottom';
	 */
	location: 'top',

	/**
	 * Whether the toolbar can be collapsed by the user. If disabled, the collapser
	 * button will not be displayed.
	 * @type Boolean
	 * @default true
	 * @example
	 * config.toolbar.enableCollapse = false;
	 */
	enableCollapse: true,

	/**
	 * Whether the toolbar must start expanded when the editor is loaded.
	 * @name Klass.Editor.config.toolbar.startupExpanded
	 * @type Boolean
	 * @default true
	 * @example
	 * config.toolbar.startupExpanded = false;
	 */
	startupExpanded: true,

	'default': [
		['bold', 'italic', 'underline', 'strike', '-', 'subscript', 'superscript', '-'],
		['justifyleft', 'justifycenter', 'justifyright', 'justifyblock', '-'],
		['outdent', 'indent', '-', 'bulletedlist', 'numberedlist', '-'],
		['selectAll', 'removeFormat', '-', 'undo', 'redo', '-', 'print', 'maximize', '-', 'source'],
		'/',
		['font', 'fontsize', 'format', '-'],
		['cut', 'copy', 'paste', 'pastetext', 'pastefromword', '-'],
		['textcolor', 'bgcolor', '-', 'link', 'unlink', '-', 'image', 'imageBrowser', 'widget', '-', 'preview']/*,
		'/',
		['styles', 'format', 'font', 'fontsize', 'horizontalrule', 'smiley', 'music', 'flash', 'video'],
		'/',
		['link', 'unlink', 'preview', 'save', 'date', 'undo', 'redo']*/
	]

};