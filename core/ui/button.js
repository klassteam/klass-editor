
Klass.Editor.ui.button = new Class({

	Extends: Klass.Editor.ui.component,

	initialize: function(name, editor){
		this.name = name;
		this.prefixCls = editor.prefixCls;

		var item = editor.getCommand(name) || name;

		this.markup = editor.markup;
		this.editor = editor;

		this.config = item.config || editor.config[name];
		this.title = item.label || editor.lang[name] || '';
		this.item = item;

		this.bound = {
			click: this.execCommand.bind(this)
		};

		this.render();

		item.button = this;
		item.element = this.toElement();
	},

	render: function(){
		var item = this.item;
		var key = Klass.env.mac ? 'Cmd' : 'Ctrl', config = this.config || {}, 
			shortcut = config.shortcut || item.shortcut || '',
			combinator = shortcut.split('+'), keystrokes,
			buttonCls = this.prefixCls + 'button', 
			overCls = this.prefixCls + 'hover',
			title , html;

		if (shortcut.length > 1 && shortcut.indexOf('+') != -1){
			keystrokes = shortcut;
			shortcut = combinator[combinator.length - 1] || '+';
		} else keystrokes = key + '+' + shortcut;

		if (shortcut && !item.specialKey){
			var specialKeys = this.editor.specialKeys = this.editor.specialKeys || {};
			specialKeys[shortcut] = combinator.length > 1 ? {
				command: this.name,
				keystrokes: keystrokes
			} : this.name;
		}

		title = this.title + (shortcut ? ' [' + keystrokes.capitalize() + ']' : '');
		html = this.markup.button.substitute({title: title});

		this.element = new Klass.DOM.element('span', {
			'html': html,
			'title': title,
			'class': buttonCls,
			'events': this.bound
		}).hover(overCls);

		this.element.unselectable().first().addClass(this.prefixCls + 'icon-' + this.name);

		var command = item;
		if (command && command.addEvent){
			command.addEvent('state', function(){
				this.element.set('state', command.state);
			}.bind(this));
			this.element.set('state', command.state);
		}
	},

	execCommand: function(){
 		this.editor.execCommand(this.name, false);
		return false;
	},

	enable: function(){
		if ( !this.disabled ) return this;
		if ( this.active ) this.element.removeClass('kse-active');
		this.element.removeClass('kse-disabled');
		this.disabled = false;
		return this;
	},

	disable: function(){
		if ( this.disabled ) return this;
		this.element.addClass('kse-disabled');
		this.disabled = true;
		return this;
	},

	setDisabled: function(disabled){
		return this[disabled ? 'disable' : 'enable']();
	},

	activate: function(){
		if ( this.disabled ) return this;
		this.element.addClass('kse-button-active');
		this.active = true;
		return this;
	},

	deactivate: function(){
		this.element.removeClass('kse-button-active');
		this.active = false;
		return this;
	}

});