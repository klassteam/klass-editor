(function(window, local){

	var document = window.document,

		editor = local.Editor,

		storage = editor.storage,

		$ = editor.constants,
			
		dom = editor.DOM,
			
		markup = editor.markup;

	var uniqueID = function(item){
		return 'editor' + local.uidOf(item);
	};

	var attachToForm = function(editor){
		var element = editor.element;
		
		// If are replacing a textarea, we must
		if (editor.startupMode === $['ELEMENT_MODE_REPLACE'] && element.is('textarea')){
			var form = element[0].form;
			form = form && new dom.element(form);
			if (form){
				form.addEvent('submit', editor.updateElement);

				// Setup the submit function because it doesn't fire the
				// "submit" event.
				var submit = form[0].submit;
				if (!submit.nodeName && !submit.length){
					form[0].submit = utils.override(submit, function(originalSubmit){
						return function(){
							editor.updateElement();
							
							// For IE, the DOM submit function is not a
							// function, so we need thid check.
							if (originalSubmit.apply) originalSubmit.apply(this, arguments);
							else originalSubmit();
						};
					});
				}
				
				// Remove 'submit' events registered on form element before destroying.(#3988)
				editor.addEvent('destroy', function(){
					form.removeEvent('submit', editor.updateElement);
				});
			}
		}
	};

	function updateCommands(){
		var command, commands = this.commands, 
			mode = this.mode;

		if (!mode) return;
		
		for (var name in commands){
			command = commands[name];
			command.disable && command[command.startDisabled ? 'disable' : 
				this.readOnly && !command.readOnly ? 'disable' : command.modes[mode] ? 'enable' : 'disable']();
		}
	}

	editor.implement({

		options: {
			baseCls: 'kse-editor',
			prefixCls: 'kse-'
		},

		initialize: function(element, options){
			if (typeof element === 'string') element = '#' + element;
			if (!element || !(element = local(element))) return;

			this.setOptions(options);
			this.loadConfig();

			element = element[0];
			this.element = new local.DOM.element(element);
			this.startupMode = this.options.mode || $['ELEMENT_MODE_REPLACE'];
			this.name = element.id || element.name || uniqueID(element);
			this.uid = local.uidOf(element);

			if (editor.has(this)){
				return editor.get(this.name);
			}

			this.tabIndex = this.config.tabIndex || element.getAttribute('tabindex') || 0;

			this.baseCls = this.options.baseCls;
			this.prefixCls = this.options.prefixCls;

			this.plugins = {};
			this.commands = {};
			this.dialogs = {};
			this.storage = {
				styles: []
			};

			this.ui = new editor.ui(this);

			// 注册UI组件
			this.ui.addHandler(editor.ui.RICHCOMBO, editor.ui.richCombo.handler);
			this.ui.addHandler(editor.ui.PANELBUTTON, editor.ui.panelButton.handler);

			this.focusManager = new editor.manager.Focus(this);

			this.addEvent('mode', updateCommands.bind(this));

			this.render();

			editor.add(this);
		},

		loadConfig: function(){
			var config = this.config = editor.config || {};
			Object.merge(this.config, this.options);

			//load lang
			editor.lang.load(config.language, config.defaultLanguage, function(code, lang){

				if (!lang.dir) lang.dir = 'ltr';

				// We're not able to support RTL in Firefox 2 at this time.
				if (local.env.firefox && local.env.version < 3 && lang.dir === 'rtl'){
					lang.dir = 'ltr';
				}

				config.contentsLangDirection == 'ui' && (config.contentsLangDirection = lang.dir);

				/**
				 * The code for the language resources that have been loaded
				 * for the user interface elements of this editor instance.
				 */
				this.langCode = code;

				/**
				 * An object that contains all language strings used by the editor
				 * interface.
				 */
				this.lang = Object.clone(lang);

			}.bind(this));

			this.markup = editor.markup || {};
		},

		loadPlugins: function(){
			var plugins = this.config.plugins.replace(/\s*,\s*/g, '|');
			var methods = new editor.plugins();
			plugins.split('|').each(function(plugin){
				var method = methods[plugin];
				if (method){
					this.plugins[plugin] = method;
					method(this);
				}
			}, this);
			this.fireEvent('afterInitPlugins');
			this.fireEvent('editingBlockReady');
			this.ui.createToolbar(this, this.tbar);
			this.fireEvent('uiReady');
		},

		createElement: function(name, node){
			var element = document.createElement('div');
			element.className = this.prefixCls + name;
			this[name] = document.node(node.appendChild(element));
		},

		render: function(){
			this.fireEvent('berforeReader');

			var element = this.element;

			var container = local.DOM.create(markup.mainContainer.substitute({
				baseCls: this.baseCls,
				uid: this.uid
			}));

			var config = this.config,
				size = element.getSize(),
				width = size.x,
				height = size.y,
				styleWidth = element.style('width').toInt(),
				styleHeight = element.style('height').toInt();

			width = config.width || width || (isNaN(styleWidth) ? 'auto' : styleWidth);
			height = config.height || height || (isNaN(styleHeight) ? 0 : styleHeight);

			container = container.style('width', width)[0];

			var wrap = container.firstChild;

			this.createElement('tbar', wrap);
			this.createElement('bwrap', wrap);
			this.createElement('bbar', wrap);

			this.container = element[0].parentNode.insertBefore(container, element[0]);
			this.container = document.node(this.container);

			height && this.bwrap.style('height', height);

			element[0].style.display = 'none';

			this.themes = editor.themes();

			this.fireEvent('render');
			this.fireEvent('beforeInitPlugins');
			this.loadPlugins();
		},

		/**
		 * Adds a piece of CSS code to the editor which will be applied to the WYSIWYG editing document.
		 * This CSS would not be added to the output, and is there mainly for editor-specific editing requirements.
		 * Note: This function should be called before the editor is loaded to take effect.
		 * @param rules {String} CSS text.
		 * @example
		 * editorInstance.addCSSRules( 'body { background-color: grey; }' );
		 */
		addCSSRules: function(){
			this.storage.styles.append(arguments);
		},

		addDialog: function(name, object){
			return this.dialogs[name] = object;
		},

		getDialog: function(name){
			return this.dialogs[name];
		},

		useDialog: function(name){

		},

		/**
		 * Adds a command definition to the editor instance. Commands added with
		 * this function can be executed later with the <code>{@link #execCommand}</code> method.
		 * @param {String} name The indentifier name of the command.
		 * @param {Mixed} command The command definition.
		 */
		addCommand: function(name, command){
			return this.commands[name] = command.execute ? new editor.command(this, command) : command;
		},

		/**
		 * Gets one of the registered commands. Note that after registering a
		 * command definition with <code>{@link #addCommand}</code>, it is
		 * transformed internally into an instance of
		 * <code>{@link Klass.Editor.command}</code>, which will then be returned
		 * by this function.
		 * @param {String} name The name of the command to be returned.
		 * This is the same name that is used to register the command with
		 * 		<code>addCommand</code>.
		 * @returns {Klass.Editor.command} The command object identified by the
		 * provided name.
		 */
		getCommand: function(name){
			return this.commands[name];
		},

		hasCommand: function(name){
			return !!this.commands[name];
		},

		/**
		 * Executes a command associated with the editor.
		 * @param {String} commandName The indentifier name of the command.
		 * @param {Object} [data] Data to be passed to the command.
		 * @returns {Boolean} <code>true</code> if the command was executed
		 *		successfully, otherwise <code>false</code>.
		 */
		execCommand: function(commandName, method){
			var command = this.getCommand(commandName);

			if (command && command.state !== $['TRISTATE_DISABLED']){
				if (this.fireEvent('beforeCommandExec', command) !== true){
					var type = typeof command;
					if (type === 'function') command.call(this, commandName);
					if (type === 'object' && command.execute) command.execute(this);
					if (!command.async && this.fireEvent('afterCommandExec', command) !== true){
						// 后期如果有插件需要有返回值的时候，将在此处返回
						return false;
					}
				}
				return this;
			}
			if (!command) this.document[0].execCommand(commandName, false, method || false);
		},

		getContent: function(){
			var element = this.element;
			return (element && this.startupMode === $['ELEMENT_MODE_REPLACE']) ? 
				element[element.is('textarea') ? 'value' : 'html']() : '';
		},

		setContent: function(content){
			var element = this.element;
			if (element && this.startupMode === $['ELEMENT_MODE_REPLACE']){
				element[element.is('textarea') ? 'value' : 'html'](content);
			}
			return this;
		},

		/**
		 * Synchronous the editor data. The data must be provided in the raw format (HTML).
		 * @returns (String) The editor data.
		 */
		syncData: function(data){
			this.updateData(data);
			this.fireEvent('syncData', data);
		},

		/**
		 * Sets the editor data. The data must be provided in the raw format (HTML).
		 * @param {String} data HTML code to replace the curent content in the
		 *		editor.
		 */
		setData: function(data){
			this.fireEvent('setData', data);
			this.syncData(data);
		},

		/**
		 * Gets the editor data. The data will be in raw format. It is the same
		 * data that is posted by the editor.
		 * @returns (String) The editor data.
		 */
		getData: function(){
			this.fireEvent('beforeGetData');

			var data = this.storage.data;

			if (typeof data !== 'string') data = this.getContent();

			this.fireEvent('getData', data);

			return data;
		},

		/**
		 * Update the editor data.
		 * @returns (String) The editor data.
		 */
		updateData: function(data){
			this.storage.data = data;
		},

		/**
		 * Destroys the editor instance, releasing all resources used by it.
		 * If the editor replaced an element, the element will be recovered.
		 * @param {Boolean} [updateElement] If the instance is replacing a DOM
		 *		element, this parameter indicates whether or not to update the
		 *		element with the instance contents.
		 */
		destroy: function(updateElement){
			updateElement && this.updateElement();

			this.fireEvent('destroy');

			editor.destroy(this);
			editor.fireEvent('instanceDestroyed');
		},

		/*focus: function(){
			this.fireEvent('focus');
		},*/

		blur: function(){
			this.fireEvent('blur');
		},

		getSnapshot: function(){
			var data = {};
			this.fireEvent('getSnapshot', data);

			var snapshot = data.snapshot;
			if (typeof snapshot !== 'string') snapshot = this.getContent();
			return snapshot;
		},

		loadSnapshot: function(snapshot){
			this.fireEvent('loadSnapshot', snapshot);
		},

		/**
		 * Inserts HTML into the currently selected position in the editor.
		 * @param {String} html HTML code to be inserted into the editor.
		 */
		insertHTML: function(html){
			this.fireEvent('insertHTML', html);
		},

		/**
		 * Insert text content into the currently selected position in the
		 * editor, in WYSIWYG mode, styles of the selected element will be applied to the inserted text,
		 * spaces around the text will be leaving untouched.
		 * @param {String} text Text to be inserted into the editor.
		 */
		insertText: function(text){
			this.fireEvent('insertText', text);
		},

		/**
		 * Inserts an element into the currently selected position in the
		 * editor in WYSIWYG mode.
		 * @param element The element to be inserted into the editor.
		 */
		insertElement: function(element){
			this.fireEvent('insertElement', element);
		},

		checkRecord: function(){
			return (this.maybeRecord && this.storage.previousValue !== this.getSnapshot());
		},

		resetRecord: function(){
			this.maybeRecord && (this.storage.previousValue = this.getSnapshot());
		},

		livePreview: function(apply){
			var document = this.document;
			if (this.config.useLivePreview){
				document[apply ? 'pauseEvent' : 'restartEvent']('selectionchange');
				document.body()[apply ? 'setProperty' : 'removeProperty']('livepreview', apply);
			}
		},

		/**
		 * Updates the <code>&lt;textarea&gt;</code> element that was replaced by the editor with
		 * the current data available in the editor.
		 */
		updateElement: function(){
			var data = this.getData();
			if (this.config.escapeHTML) data = utils.htmlEncode(data);
			this.setContent(data);
		}

	});

})(window, Klass);

/**
 * Whether to escape HTML when the editor updates the original input element.
 * @name Klass.Editor.config.escapeHTML
 * @type Boolean
 * @default false
 */