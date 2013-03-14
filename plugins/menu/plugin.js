/**
 * Klass Rich Text Editor v0.5
 * http://kseditor.com
 * 
 * Copyright 2011 - 2012, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */


Klass.Editor.plugins.implement('menu', function(editor){

	var groups = editor.config.menuGroups.split(','),
		menuGroups = editor.storage.menuGroups;

	for (var i = 0; i < groups.length; i++){
		if (!menuGroups[groups[i]]) menuGroups[groups[i]] = i + 1;
	}

});

Klass.Editor.implement({

	/**
	 * Registers an item group to the editor context menu in order to make it
	 * possible to associate it with menu items later.
	 * @name Klass.Editor.editor.prototype.addMenuGroup
	 * @param {String} name Specify a group name.
	 * @param {Number} [order=100] Define the display sequence of this group
	 *  	inside the menu. A smaller value gets displayed first.
	 */
	addMenuGroup: function(name, order){
		this.storage.menuGroups[name] = order || 100;
	},

	/**
	 * Adds an item from the specified definition to the editor context menu.
	 * @name Klass.Editor.editor.prototype.addMenuItem
	 * @param {String} name The menu item name.
	 * @param {Klass.Editor.ui.menu.definition} definition The menu item definition.
	 */
	addMenuItem: function(name, definition){
		if (this.storage.menuGroups[definition.group]) menuItems[name] = new Klass.Editor.ui.menuItem(this, name, definition);
	},

	/**
	 * Adds one or more items from the specified definition array to the editor context menu.
	 * @name Klass.Editor.editor.prototype.addMenuItems
	 * @param {Array} definitions List of definitions for each menu item as if {@link Klass.Editor.editor.addMenuItem} is called.
	 */
	addMenuItems: function(definitions){
		for (var name in definitions) {
			this.addMenuItem(name, definitions[name]);
		}
	},
	
	/**
	 * Retrieves a particular menu item definition from the editor context menu.
	 * @name Klass.Editor.editor.prototype.getMenuItem
	 * @param {String} name The name of the desired menu item.
	 * @return {Klass.Editor.ui.menu.definition}
	 */
	getMenuItem: function(name){
		return this.storage.menuItems[name];
	},
	
	/**
	 * Removes a particular menu item added before from the editor context menu.
	 * @name Klass.Editor.editor.prototype.removeMenuItem
	 * @param {String} name The name of the desired menu item.
	 * @since 3.6.1
	 */
	removeMenuItem: function(name){
		delete this.storage.menuItems[name];
	}

});



/**
 * The amount of time, in milliseconds, the editor waits before displaying submenu
 * options when moving the mouse over options that contain submenus, like the
 * "Cell Properties" entry for tables.
 * @type Number
 * @default 400
 * @example
 * // Remove the submenu delay.
 * config.subMenuDelay = 0;
 */

/**
 * A comma separated list of items group names to be displayed in the context
 * menu. The order of items will reflect the order specified in this list if
 * no priority was defined in the groups.
 * @type String
 * @default 'clipboard,form,tablecell,tablecellproperties,tablerow,tablecolumn,table,anchor,link,image,flash,checkbox,radio,textfield,hiddenfield,imagebutton,button,select,textarea'
 * @example
 * config.menuGroups = 'clipboard,table,anchor,link,image';
 */
Klass.Editor.config.menuGroups = 'clipboard,' + 
	'form,' +
	'tablecell,tablecellproperties,tablerow,tablecolumn,table,' +
	'anchor,link,image,flash,' +
	'checkbox,radio,textfield,hiddenfield,imagebutton,button,select,textarea,div';