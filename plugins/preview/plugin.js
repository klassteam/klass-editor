/**
 * @file Preview plugin.
 */

Klass.Editor.plugins.implement({

	preview: function(editor){

		var execute = function(){

			var html, config = editor.config, title = editor.lang.preview,
				baseTag = baseTag = config.baseHref ? '<base href="' + config.baseHref + '"/>' : '',
				isCustomDomain = Klass.Editor.utils.isCustomDomain();

			if (config.fullPage){
				html = editor.getData().replace(/<head>/, '$&' + baseTag).replace(/[^>]*(?=<\/title>)/, title);
			} else {
				var bodyHtml = '<body ', body = editor.document && editor.document.body();
				
				if (body){
					if (body.getProperty('id')) bodyHtml += 'id="' + body.getProperty('id') + '" ';
					if (body.getProperty('class')) bodyHtml += 'class="' + body.getProperty('class') + '" ';
				}
				
				bodyHtml += '>';
				
				html = config.docType +
				'<html dir="' +
				config.contentsDirection +
				'">' +
				'<head>' +
				baseTag +
				'<title>' +
				title +
				'</title>' +
				Klass.Editor.utils.buildStyleHtml(config.contentsCss) +
				'</head>' +
				bodyHtml +
				editor.getData() +
				'</body></html>';
			}

			var width = 640; // 800 * 0.8.
			var height = 420; // 600 * 0.7.
			var left = 80; // (800 - 0.8 * 800) /2 = 800 * 0.1.
			
			try {
				var screen = window.screen;
				width = Math.round(screen.width * 0.8);
				height = Math.round(screen.height * 0.7);
				left = Math.round(screen.width * 0.1);
			} catch (e){}
		
			var url = '';
			if (isCustomDomain){
				window._kse_htmlToLoad = html;
				url = 'javascript:void((function(){' +
				'document.open();' +
				'document.domain="' +
				document.domain +
				'";' +
				'document.write( window.opener._kse_htmlToLoad );' +
				'document.close();' +
				'window.opener._kse_htmlToLoad = null;' +
				'})() )';
			}
			
			var win = window.open(url, null, 'toolbar=yes,location=no,status=yes,menubar=yes,scrollbars=yes,resizable=yes,width=' + width + ',height=' + height + ',left=' + left);
			
			if (!isCustomDomain){
				win.document.open();
				win.document.write(html);
				win.document.close();
			}
		};

		editor.addCommand('preview', {
			execute: execute,
			canUndo: false,
			modes: {
				wysiwyg: 1,
				source: 1
			}
		});

	}

});