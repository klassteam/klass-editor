/**
 * Klass Rich Text Editor v0.5
 * http://kseditor.com
 * 
 * Copyright 2011 - 2012, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */


/**
 * @file The "filebrowser" plugin that adds support for file browsing.
 */

Klass.run(function(local){

	var constructor = local.Editor;

	var markup = '<iframe src="{browserUrl}" width="{width}" height="{height}" frameBorder="0"></iframe>';
	
	constructor.plugins.implement('filebrowser', function(editor){

		var config = editor.config.filebrowser,
			label = editor.lang.filebrowser.image,
			imageBrowserPluginName = 'imageBrowser';

		// Register the command.
		editor.addCommand(imageBrowserPluginName, new constructor.dialogCommand(imageBrowserPluginName, {
			label: label,
			startDisabled: !config.imageBrowseUrl
		}));

		constructor.dialog.add(imageBrowserPluginName, {
			title: label,
			buttons: null,
			fixed: false,
			width: config.width || 600,
			contents: markup.substitute({
				browserUrl: config.imageBrowseUrl,
				height: config.height || 400,
				width: '100%'
			})
		});

	});

	constructor.config.filebrowser = {};

});


/**
 * The location of an external file browser that should be launched when the <strong>Browse Server</strong>
 * button is pressed. If configured, the <strong>Browse Server</strong> button will appear in the
 * <strong>Link</strong>, <strong>Image</strong>, and <strong>Flash</strong> dialog windows.
 * @name Klass.Editor.config.filebrowser.fileBrowseUrl
 * @type String
 * @default <code>''</code> (empty string = disabled)
 * @example
 * config.filebrowser.fileBrowseUrl = '/browser/browse.php';
 */

/**
 * The location of an external file browser that should be launched when the <strong>Browse Server</strong>
 * button is pressed in the <strong>Image</strong> dialog window.
 * If not set, CKEditor will use <code>{@link Klass.Editor.config.filebrowser.fileBrowseUrl}</code>.
 * @name Klass.Editor..config.filebrowser.imageBrowseUrl
 * @since 3.0
 * @type String
 * @default <code>''</code> (empty string = disabled)
 * @example
 * config.filebrowser.imageBrowseUrl = '/browser/browse.php?type=Images';
 */

 /**
 * The width of the file browser popup window. It can be a number denoting a value in
 * pixels or a percent string.
 * @name Klass.Editor.config.filebrowser.width
 * @type Number|String
 * @default <code>'600'</code>
 * @example
 * config.filebrowser.width = 750;
 * @example
 * config.filebrowser.width = '50%';
 */

/**
 * The height of the file browser popup window. It can be a number denoting a value in
 * pixels or a percent string.
 * @name Klass.Editor.config.filebrowser.height
 * @type Number|String
 * @default <code>'400'</code>
 * @example
 * config.filebrowser.height = 580;
 * @example
 * config.filebrowser.height = '50%';
 */