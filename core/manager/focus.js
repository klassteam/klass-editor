Klass.Editor.manager.Focus = new Class({

	initialize: function(owner){
		if (owner.focusManager) return owner.focusManager;
		this.owner = owner;
		this.hasFocus = false;
	},


	/**
	 * Used to indicate that the editor instance has the focus.<br />
	 * <br />
	 * Note that this function will not explicitelly set the focus in the
	 * editor (for example, making the caret blinking on it). Use
	 * {@link Klass.Editor.editor#focus} for it instead.
	 */
	focus: function(){
		if (this.timer) clearTimeout(this.timer);
		if (!this.hasFocus){
			if (Klass.Editor.currentInstance)
				Klass.Editor.currentInstance.focusManager.forceBlur();
			this.hasFocus = true;
			var owner = this.owner;
			owner.container.child(0).addClass('kse-focus');
			owner.fireEvent('focus');
		}
	},

	/**
	 * Used to indicate that the editor instance has lost the focus.<br />
	 * <br />
	 * Note that this functions acts asynchronously with a delay of 100ms to
	 * avoid subsequent blur/focus effects. If you want the "blur" to happen
	 * immediately, use the {@link #forceBlur} function instead.
	 */
	blur: function(){
		var self = this;

		this.timer && clearTimeout(this.timer);

		this.timer = setTimeout(function(){
			delete self.timer;
			self.forceBlur();
		}, 100);
	},

	/**
	 * Used to indicate that the editor instance has lost the focus. Unlike
	 * {@link #blur}, this function is synchronous, marking the instance as
	 * "blured" immediately.
	 */
	forceBlur: function(){
		if (this.hasFocus){
			this.hasFocus = false;
			var owner = this.owner;
			owner.container.child(0).removeClass('kse-focus');
			owner.fireEvent('blur');
		}
	}

});