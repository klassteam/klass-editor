/**
 * Klass Rich Text Editor v0.4
 * http://kseditor.com
 * 
 * Copyright 2011, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */


/**
 * @file Image plugin
 */

Klass.Editor.plugins.implement('image', function(editor){

	var pluginName = 'image';
	
	// Register the dialog.
	//Klass.Editor.dialog.add(pluginName, this.path + 'dialogs/image.js');
	
	// Register the command.
	editor.addCommand(pluginName, new Klass.Editor.dialogCommand(pluginName, {
		label: editor.lang.image.label
	}));
	
	editor.addEvent('doubleclick', function(evt){
		var element = evt.element;
		
		if (element.is('img') && !element.data('kse-realelement') && !element.isReadOnly()) evt.dialog = 'image';
	});
	
	// If the "menu" plugin is loaded, register the menu items.
	/*if (editor.addMenuItems) {
		editor.addMenuItems({
			image: {
				label: editor.lang.image.menu,
				command: 'image',
				group: 'image'
			}
		});
	}
	
	// If the "contextmenu" plugin is loaded, register the listeners.
	if (editor.contextMenu) {
		editor.contextMenu.addListener(function(element, selection){
			if (!element || !element.is('img') || element.data('cke-realelement') || element.isReadOnly()) return null;
			
			return {
				image: Klass.Editor.TRISTATE_OFF
			};
		});
	}*/

});


Klass.Editor.config.image = {

	/**
	 * Whether to remove links when emptying the link URL field in the image dialog.
	 * @type Boolean
	 * @default true
	 * @example
	 * config.image.removeLinkByEmptyURL = false;
	 */
	removeLinkByEmptyURL: true

	/**
	 * The location of the script that handles file uploads in the <strong>Image</strong> dialog window.
	 * If not set, Klass Editor will use <code>{@link Klass.Editor.config.fileUploadUrl}</code>.
	 * @name Klass.Editor.config.image.uploadUrl
	 * @since 3.0
	 * @type String
	 * @default <code>''</code> (empty string = disabled)
	 * @example
	 * config.image.uploadUrl = '/uploader/upload.php';
	 */

	/**
	 * If not set, Klass Editor will use <code>{@link Klass.Editor.config.fileAllowedExtensions}</code>.
	 * @name Klass.Editor.config.image.allowedExtensions
	 * @type String
	 * @default <code>''</code> (empty string = disabled)
	 * @example
	 * config.image.allowedExtensions = 'bmp,gif,jpeg,jpg,png';
	 */

	/**
	 * If not set, Klass Editor will use <code>{@link Klass.Editor.config.fileDeniedExtensions}</code>.
	 * @name Klass.Editor.config.image.deniedExtensions
	 * @type String
	 * @default <code>''</code> (empty string = disabled)
	 * @example
	 * config.image.deniedExtensions = 'bmp,gif,jpeg,jpg,png';
	 */

	/**
	 * maxSize is defined in bytes, but shorthand notation may be also used.
	 * Available options are: G, M, K (case insensitive).
	 * 1M equals 1048576 bytes (one Megabyte), 1K equals 1024 bytes (one Kilobyte), 1G equals one Gigabyte.
	 * If not set, Klass Editor will use <code>{@link Klass.Editor.config.fileMaxSize}</code>.
	 * @name Klass.Editor.config.image.maxSize
	 * @type String
	 * @default <code>'0'</code> (empty string = disabled)
	 * @example
	 * config.image.maxSize = '8M';
	 */
};

/**
 * Padding text to set off the image in preview area.
 * @name Klass.Editor.config.image.previewText
 * @type String
 * @default "Lorem ipsum dolor..." placehoder text.
 * @example
 * config.image.previewText = ('___ ').repeat(100);
 */