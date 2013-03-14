(function(local, undefined){

	var $E = local.Editor;
	
	var $ = $E.constants;
	
	$E.command = new Class({
	
		Implements: Class.Events,
		
		initialize: function(editor, options){
			this.uiItems = [];

			this.state = $['TRISTATE_OFF'];

			this.modes = options.modes || {wysiwyg: 1};

			this.editorFocus = 1;
			
			this.execute = function(data){
				if (this.state === $['TRISTATE_DISABLED']) return false;
				
				// Give editor focus if necessary (#4355).
				if (this.editorFocus) editor.focus();

				return (options.execute.call(this, editor, data) !== false);
			};

			if (typeof options === 'object') for (var key in options){
				if (this[key] === undefined) this[key] = options[key];
			}
		},
		
		enable: function(){
			if (this.state == $['TRISTATE_DISABLED']) 
				this.set((!this.preserveState || (typeof this.previousState === undefined)) ? $['TRISTATE_OFF'] : this.previousState);
		},
		
		disable: function(){
			this.set($['TRISTATE_DISABLED']);
		},
		
		set: function(state){
			// Do nothing if there is no state change.
			if (this.state == state) return false;
			
			this.previousState = this.state;
			
			// Set the new state.
			this.state = state;
			
			// Fire the "state" event, so other parts of the code can react to the
			// change.
			this.fireEvent('state');
			
			return true;
		},
		
		toggle: function(){
			if (this.state == $['TRISTATE_OFF']) this.set($['TRISTATE_ON']);
			else if (this.state == $['TRISTATE_ON']) this.set($['TRISTATE_OFF']);
		}
		
	});
	
})(Klass);