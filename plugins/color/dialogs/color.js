Klass.Editor.dialog.add('color', function(editor){

	return {
		width: 465,
		title: editor.lang.color.selectColor,
	
		onRender: function(){
			this.colorPicker = new Klass.ui.Colorpicker(null, {
				container: this.getContentElement()[0]
			}).show();
		},

		onOk: function(){
			this.fireEvent('complete', this.colorPicker.sets.hex);
		}
	
	};

});