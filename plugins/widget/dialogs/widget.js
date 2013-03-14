/**
 * Klass Rich Text Editor v0.5
 * http://kseditor.com
 * 
 * Copyright 2011 - 2012, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */


Klass.Editor.dialog.add('widget', function(editor){

	var local = Klass.Editor,
		lang = editor.lang.widget,
		config = editor.config.widget,
		datasource = config.datasource,
		dataViewSize = config.dataViewSize || {};

	var contents = local.utils.isURL(datasource) ? 
		'<iframe src="{datasource}" width="100%" height="{height}" frameBorder="0"></iframe>' : 
		lang.emptyList;

	return {
		title: lang.title,
		width: dataViewSize.x || 600,
		contents: contents.substitute({
			height: dataViewSize.y || 400,
			datasource: datasource
		}),
		onOk: function(){
			this.fireEvent('complete');	
		}
	};

});