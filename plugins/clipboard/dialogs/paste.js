Klass.Editor.dialog.add('paste', function(editor){

	var env = Klass.env;
	var lang = editor.lang.clipboard;
	var utils = Klass.Editor.utils;
	var isCustomDomain = utils.isCustomDomain();

	var markup = '<p class="kse-dialog-text">{securityMsg}</p>' +
		'<p class="kse-dialog-text">{pasteMsg}</p>' +
		'<p id="kse-dialog-pasteframe"></p>';

	var markupIFrame = '<html dir="{direction}"><head><style>{style}</style></head><body>' +
		'<script type="text/javascript" id="kse_actscrpt">{script}</script>' +
		'</body></html>';

	var srcIFrame = 'document.open();document.domain="' + document.domain + '";document.close();';
	srcIFrame = env.air ? 'javascript:void(0)' : isCustomDomain ? 'javascript:void((function(){' + srcIFrame + '})())' : '';

	var contents = markup.substitute({
		securityMsg: lang.securityMsg,
		pasteMsg: lang.pasteMsg
	});

	function onPasteFrameLoad(win){
		var doc = new Klass.DOM.document(win.document), docElement = doc[0];

		var script = doc.get('kse_actscrpt');
		script && script.destroy();
		
		env.ie ? docElement.body.contentEditable = 'true' : docElement.designMode = 'on';
		
		// IE before version 8 will leave cursor blinking inside the document after
		// editor blurred unless we clean up the selection. (#4716)
		if (env.ie && env.version < 8){
			doc.getWindow().addEvent('blur', function(){
				docElement.selection.empty();
			});
		}
		
		/*doc.on('keydown', function(e){
			var domEvent = e.data, key = domEvent.getKeystroke(), processed;
			
			switch (key) {
				case 27:
					this.hide();
					processed = 1;
					break;
					
				case 9:
				case x.SHIFT + 9:
					this.changeFocus(true);
					processed = 1;
			}
			
			processed && domEvent.preventDefault();
		}, this);
		
		editor.fire('ariaWidget', new Klass.dom.element(win.frameElement));*/
	}



	return {
		title: lang.title,
		width: 380,
		contents: contents,
		onRender: function(){

		},
		onBeforeShow: function(){
			var script = 'window.parent.Klass.Editor.utils.callFunction(' + utils.addFunction(onPasteFrameLoad) + ', this);';

			var iframe = Klass.DOM.createElement('iframe', {
				'class': 'kse-pasteframe',
				'aria-label': lang.pasteArea,
				allowtransparency: 'true',
				frameborder: 0,
				src: srcIFrame
			});

			var html = markupIFrame.substitute({
				direction: editor.config.contentsDirection,
				script: script
			});

			iframe.addEvent('load', function(){
				this.removeEvents('load');
				var doc = iframe.getFrameDocument();
				doc.write(html);
			});

			var container = document.get('kse-dialog-pasteframe');
			container.html('').append(iframe);

			// IE need a redirect on focus to make
			// the cursor blinking inside iframe. (#5461)
			if (env.ie){
				var focusGrabber = Klass.DOM.create('<span tabindex="-1" style="position:absolute;" role="presentation"></span>');
				focusGrabber.addEvent('focus', function(){
					iframe[0].contentWindow.focus();
				}).appendTo(container);
				
				// Override focus handler on field.
				this.focus = function(){
					focusGrabber.focus();
					this.fireEvent('focus');
				};
			}

			this.getInputElement = function(){
				return iframe;
			};
		},
		onShow: function(){
			var win = this.getInputElement()[0].contentWindow;

			// JAWS needs the 500ms delay to detect that the editor iframe
			// iframe is no longer editable. So that it will put the focus into the
			// Paste from Word dialog's editable area instead.
			setTimeout(function(){
				win.focus();
			}, 500);
		},
		onOk: function(){
			var body = this.getInputElement().getFrameDocument().body(),
				bogus = body.getBogus(),
				html;

			bogus && bogus.destroy();

			html = body.html();

			setTimeout(function(){
				editor.fireEvent('paste', {'html': html});
			}, 0);
		}
	};

});