/**
 * Contains UI features related to an editor instance.
 * @constructor
 */
Klass.Editor.ui = new Class({

	options: {
		/*
		onRender: function(){},
		onClick: function(){}
		*/
	},

	initialize: function(editor){
		if (editor.ui) return editor.ui;

		this.items = {};
		this.handlers = {};

		this.editor = editor;
		this.markup = editor.markup;

		this.mixComponent = false;
	},

	add: function(name, type, definition){
		this.items[name] = {
			type: type,
			command: definition.command || null,
			args: Array.prototype.slice.call(arguments, 2)
		};
	},

	create: function(name){
		var item = this.items[name],
			handler = item && this.handlers[item.type],
			command = item && item.command && this.editor.getCommand(name);

		var result = handler && handler.create.apply(this, item.args);

		if (command) command.uiItems.push(result);

		return result;
	},

	addHandler: function(type, handler){
		this.handlers[type] = handler;
	}

});


/**
 * UI component type.
 * @constants
 */
Klass.Editor.ui.extend({

	/**
	 * Button UI element.
	 * @constant
	 */
	BUTTON: 1,

	/**
	 * Rich combo UI element.
	 * @constant
	 */
	RICHCOMBO: 2,

	/**
	 * Panel UI element.
	 * @constant
	 */
	PANEL: 3,

	/**
	 * Panel button UI element.
	 * @constant
	 */
	PANELBUTTON: 4,

	/**
	 * Menu button UI element.
	 * @constant
	 */
	MENUBUTTON: 5

});