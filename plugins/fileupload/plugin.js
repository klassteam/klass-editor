/**
 * Klass Rich Text Editor v0.4
 * http://kseditor.com
 * 
 * Copyright 2011, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */


/**
 * @file The "fileupload" plugin that adds support for file uploaded.
 */

Klass.run(function(local){

	var constructor = local.Editor,
		$ = constructor.constants;

	/**
	 * Generic error.
	 *
	 * @property ERROR_GENERIC
	 * @final
	 */
	$.ERROR_GENERIC = 1;

	/**
	 * Generic I/O error. For exampe if it wasn't possible to open the file stream on local machine.
	 *
	 * @property ERROR_SECURITY
	 * @final
	 */
	$.ERROR_SECURITY = 2;

	/**
	 * File size error. If the user selects a file that is too large it will be blocked and an error of this type will be triggered.
	 *
	 * @property ERROR_FILE_SIZE
	 * @final
	 */
	$.ERROR_FILE_SIZE = 3;

	/**
	 * File type(s) error. If the user selects a file that isn't valid according to the filters setting.
	 *
	 * @property ERROR_FILE_TYPE
	 * @final
	 */
	$.ERROR_FILE_TYPE = 4;

	/*constructor.fileUpload = {
	
		instances: {},

		add: function(type, definitions){
			if (!this.instances[type]) this.instances[type] = definitions;
		}
	
	};

	constructor.plugins.implement('fileupload', function(editor){
		var config = editor.config.fileupload,
			filters = config.filters || {};

		var settings = config.settings || {
			runtimes: 'html5,flash,silverlight,html4'
		};

		var filters = {};

		var onFileUploadFailed = function(data){
			var response = data.repsonse && JSON.decode(data.repsonse);
			if (response && response.code){
				var code = response.code;

			}
		};

		editor.implement({
			
			addFileUploadFilter: function(type, filter){
				filters[type] = (filters[type] || []).push(filter);
			},
			
			loadUploader: function(type){



				var fileUploader = new local.Uploader(settings);

			}
		
		});


	});

	constructor.config.fileupload = {};*/

});

/**
 * @name Klass.Editor.config.fileupload.fileUploadUrl
 * @type String
 * @default <code>''</code> (empty string = disabled)
 * @example
 * config.fileupload.fileUploadUrl = '/fileupload/upload.php';
 */

 /**
 * @name Klass.Editor.config.fileupload.imageUploadUrl
 * @type String
 * @default <code>''</code> (empty string = disabled)
 * @example
 * config.fileupload.imageUploadUrl = '/fileupload/upload.php?type=Images';
 */

/**
 * @name Klass.Editor.config.fileupload.settings
 * @type Object
 */


/**
 * @name Klass.Editor.config.fileupload.filters
 * @type Object
 */