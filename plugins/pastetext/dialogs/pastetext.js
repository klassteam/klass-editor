Klass.Editor.dialog.add('pastetext', function(editor){

	var lang = editor.lang;

	var markup = '<p class="kse-dialog-text">{pasteMsg}</p>' +
		'<p class="kse-pastetext"><textarea cols="20" rows="5"></textarea></p>';

	var contents = markup.replace(/{pasteMsg}/, lang.clipboard.pasteMsg);

	return {
		title: lang.pasteText,
		width: 380,
		contents: contents,
		onRender: function(){
			var textarea = this.toElement().find('textarea', 1);
			textarea.style('direction', editor.config.contentsDirection);
			this.getInputElement = function(){
				return textarea;
			};
		},
		onShow: function(){
			var element = this.getInputElement();
			element.value('');
			element.focus();
		},
		onOk: function(){
			var value = this.getInputElement().value();
			setTimeout(function(){
				editor.fireEvent('paste', {'text': value});
			}, 0);
		}
	
	};

});