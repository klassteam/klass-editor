/**
 * @Dialog
 * @constructor
 */
Klass.run(function(local){

	var constructor = local.Editor,
		env = local.env;

	var doc = constructor.document,
		document = doc[0],
		window = doc.getWindow();

	var promptypeMap = {},
		reAlpha = /^[a-zA-Z]/;

	var isFocusable = function(element){
		return element.isVisible() && (!element.is('input') || !element.getProperty('disabled'));
	};

	function disableField(element){
		element && element.addClass('kse-disabled').setProperty('disabled', true);
	}

	function enableField(element){
		element && element.removeClass('kse-disabled').removeProperty('disabled');
	}

	constructor.dialog = {

		dialogs: {},

		add: function(name, definitions){
			if (!this.dialogs[name]) this.dialogs[name] = definitions;
		}

	};

	/**
	 * Generic dialog command. It opens a specific dialog when executed.
	 * @constructor
	 * @augments Klass.Editor.commandDefinition
	 * @param {string} name The name of the dialog to open when executing
	 *		this command.
	 * @example
	 * // Register the "link" command, which opens the "link" dialog.
	 * editor.addCommand('link', <b>new Klass.Editor.dialogCommand('link')</b>);
	 */
	constructor.dialogCommand = new Class({
	
		initialize: function(name, options){
			this.name = name;
			if (options){
				this.label = options.label || null;
				this.shortcut = options.shortcut || null;
				this.startDisabled = options.startDisabled || null;
			}
		},
	
		/** @ignore */
		execute: function(editor){
			// Special treatment for Opera. (#8031)
			env.opera ? editor.openDialog.delay(0, this, this.name) : editor.openDialog(this.name);
		},
		
		// Dialog commands just open a dialog ui, thus require no undo logic,
		// undo support should dedicate to specific dialog implementation.
		canUndo: false,
		
		editorFocus: env.ie || env.webkit

	});

	constructor.implement({

		openDialog: function(name, callback){
			if (this.mode === 'wysiwyg' && local.env.ie){
				var selection = this.getSelection();
				selection && selection.lock();
			}

			var dialog = this.getDialog(name), 
				definitions, rules;
			
			if (!dialog){
				definitions = constructor.dialog.dialogs[name];
				if (typeof definitions === 'function') definitions = definitions(this);
				if (typeof definitions === 'object'){
					if (rules = constructor.dialog.validate.getRules(name)){
						definitions.customValidationRules = rules;
					}
					dialog = this.addDialog(name, new constructor.ui.dialog(this, definitions));
				}
			}

			if (dialog){
				callback && callback.call(dialog);

				dialog.show();

				return dialog;
			}
		}

	});

	constructor.ui.dialog = new Class({
	 
		Extends: constructor.ui.component,

		options: {/*
			hideOnClick: false,*/
			width: '600px',
			height: 'auto',
			forms: {},
			buttons: ['ok', 'cancel'],
			modal: true,
			fixed: true,

			// Initialize the tab and page map.
			tabs: {},
			tabBarMode: true,
			tabIndex: 0
		},
	 
		initialize: function(editor, options){
			this.parent(editor, options);

			this.rules = this.options.customValidationRules || {};
			delete this.options.customValidationRules;

			this.disabledButtons = [];

			this.buttons = {};

			this.render();
		},

		/**
		 * Gets the editor instance which opened this dialog.
		 * @returns {Klass.Editor} Parent editor instances.
		 */
		toEditor: function(){
			return this.editor;
		},

		/**
		 * Gets the element that was selected when opening the dialog, if any.
		 * @returns {Klass.DOM.element} The element that was selected, or null.
		 */
		getSelectedElement: function(){
			return this.selectedElement || this.toEditor().getSelection().getSelectedElement();
		},

		getContentElement: function(selector){
			return selector ? this.element.find(selector, 1) || null : this.contentElement;
		},

		addValidationRules: function(name, rules){
			return this.rules[name] = rules;
		},

		getValidationRules: function(name){
			return this.rules[name];
		},

		walk: function(fn){
			var obj = this.options.forms, 
				els = this.formElements, 
				el, expr, opts;
			for (expr in obj){
				opts = obj[expr];
				el = els[expr];
				if (el && opts && fn.call(el, opts) === true) return false;
			}
			return true;
		},

		setupContent: function(data){
			this.walk(function(options){
				var disable = options.disable;
				this.value(data[options.name || options]  || '');
				disable && (disable === true || disable.call(this)) && disableField(this);
			});
		},

		commitContent: function(data){
			var self = this,
				validator = constructor.dialog.validate;

			var check = function(validate){
				var result = true, fn;

				if (local.type(validate) === 'object'){
					for (var rule in validate){
						fn = validator[rule];
						if (fn) {
							result = result && fn.call(validator, validate[rule]);
							if (typeof result === 'function') result = result.call(this);
							if (result !== true) break;
						}
					}
				} else if (validate.slice){
					fn = validator[validate[0]];
					if (fn) result = fn.apply(validator, validate.slice(1));
				} else if (validate.call) result = validate.call(this);

				if (typeof result === 'function') result = result.call(this);

				return result;
			};

			return this.walk(function(options){
				var validate = options.validate || null,
					name = options.name || options,
					invalid, rules, result = true;

				if (isFocusable(this)){
					if (validate) result = check.call(this, validate);
					if (result === true && (rules = self.getValidationRules(name))){
						result = check.call(this, rules);
					}
					invalid = typeof result === 'string' || result === false;
					data[name] = this.value() || '';
				}

				self.handleFieldValidated(this, result);
				this.data('value', null);
				return invalid;
			});
		},

		checkContent: function(){
			var self = this;
			delete this.isChanged;

			return this.walk(function(options){
				var value = this.data('value');
				if (!isFocusable(this) || value === null) return;
				if (value !== this.value()){
					self.isChanged = true;
					return false;
				}
			});
		},

		initContent: function(){
			return this.walk(function(){
				this.data('value', this.value());
			});
		},

		resetContent: function(){
			return this.walk(function(options){
				options.disable && options.disable !== true && enableField(this);
				this.value(this.data('value') || '').data('value', null);
			});
		},

		handleFieldValidated: function(field, msg){
			var invalid = typeof msg === 'string';
			field[invalid ? 'addClass' : 'removeClass']('kse-tip-input-error');
			invalid && field.focus();
			this.handleTooltip(msg);
		},

		handleTooltip: function(msg, type){
			var isDisplayed = typeof msg === 'string', 
				isAlpha = isDisplayed && reAlpha.test(msg),
				storedkey = 'kse-tooltip-type',
				prefix = 'kse-',
				element = this.tipElement;
			if (element){
				type = type && type !== 'error' && type;
				type = type && local.isNumeric(type) ? promptypeMap[type] || null : type;

				var original = element.retrieve(storedkey, type),
					classes = prefix + original;
				if (type){
					original !== type ? element.swapClass(classes, prefix + type) : element.addClass(prefix + type);
					element.store(storedkey, type);
				} else if (original) element.removeClass(classes).eliminate(storedkey);
				
				isDisplayed ? element.style('width', msg.length * (isAlpha ? 6 : 12)).show().html(msg) : element.hide();
			}
		},

		getButtons: function(){
			var buttons = this.options.buttons, results = [];
			if (typeof buttons === 'string') buttons = [buttons];
			else if (buttons == null) buttons = [];
			buttons.each && buttons.each(function(name){
				var button = this.addButton(name);
				this.buttons[name] = button;
				results.push(button);
			}.bind(this));
			return results.length ? results : null;
		},

		addButton: function(type){
			var button = local.DOM.createElement('button', {
				text: this.editor.lang.common[type],
				events: {
					click: function(){
						this.fireEvent(type);
						if (this.disabledClose) delete this.disabledClose;
						else this.close();
					}.bind(this)
				}
			});
			return button;
		},

		/**
		 * Disables a dialog button.
		 * @param {String} name The name of the button.
		 */
		disableButton: function(name){
			var button = this.buttons[name];
			if (button){
				disableField(button);
				this.disabledButtons.include(name);
			} else if (!name){
				this.disabledButtons.each(function(item){
					disableField(this.buttons[item]);
				}, this);
			}
		},

		/**
		 * Enables a dialog button.
		 * @param {String} name The name of the button.
		 */
		enableButton: function(name){
			enableField(this.buttons[name]);
		},

		render: function(){
			var opts = this.options, 
				editor = this.editor;

			var build = editor.themes.dialog(editor, {
				title: opts.title,
				contents: opts.contents,
				close: editor.lang.common.close
			});

			var parts = build.parts;

			var element = this.element = build.element;

			element.styles(Object.merge({}, opts.styles, {
				zIndex: editor.baseZIndex('OVERLAY') + 1,
				display: 'none'
			}));

			var buttons = this.getButtons();

			buttons && parts.buttons.adopt(buttons);

			build.close.addEvent('click', this.close.bind(this));

			this.enforceFixed = !local.support.fixedPosition && opts.fixed;

			this.container.append(element);

			this.contentElement = parts.contents || null;

			this.tipElement = parts.tips || null;

			var tabs = opts.tabs,
				tabIndex = opts.tabIndex,
				tabElements, innerElements;

			if (local.isArray(tabs) && tabs.length > 1){
				tabElements = typeof tabs[0] === 'string' && element.find(tabs[0]);
				innerElements = typeof tabs[1] === 'string' && element.find(tabs[1]);

				if (tabElements && tabElements.each){
					tabElements.each(function(tab, index){
						tab.addEvent('click', function(){
							this.toggleTabPage(index);
						}.bind(this));
						tab.hover('kse-hover');
					}, this);
				}

				if (innerElements && innerElements.each){
					innerElements.each(function(el){
						el.hide();
					});
				}

				this.tabs = [tabElements, innerElements];
				this.defaultTabIndex = tabIndex;
				this.showTabPage(tabIndex)
			}

			var forms = opts.forms, expr,
				formElement, formElements;
			if (typeof forms === 'object'){
				formElements = {};
				for (expr in forms){
					formElement = element.find(expr, 1);
					if (formElement) formElements[expr] = formElement;
				}
			}
			if (formElements) this.formElements = formElements;

			this.fireEvent('render');

			this.modal();
			this.hidden = true;
		},

		modal: function(){
			if (this.options.modal){
				var mask = new local.ui.mask(this.container, {
					'class': 'kse-mask',
					hideOnClick: this.options.hideOnClick,
					shim: false,
					style: {
						zIndex: this.editor.baseZIndex('OVERLAY')
					}
				});

				this.addEvents({
					show: mask.show.bind(mask),
					hide: mask.hide.bind(mask),
					destroy: mask.destroy.bind(mask)
				});
			}
		},

		toggle: function(force){
			return this[(this.hidden = force != null ? force : this.hidden) ? 'show' : 'hide']();
		},

		/**
		 * Shows the dialog box.
		 * @example
		 * dialogObj.show();
		 */
		show: function(){
			if (!this.hidden) return this;
			var container = this.container;
			var current = container.retrieve('kse-dialog', null);
			if (current === this && !current.hidden) return this;
			else container.store('kse-dialog', this);
			if (this.options.autoResize){
				window.addEvent('resize', this.position);
				this.enforceFixed && window.addEvent('scroll', this.position);
			}

			// Prevent some keys from bubbling up.
			for (var event in {keyup :1, keydown :1, keypress :1}){
				this.element.addEvent(event, preventKeyBubbling);
			}

			return this.showActivity();
		},

		/**
		 * Hides the dialog box.
		 * @example
		 * dialogObj.hide();
		 */
		hide: function(){
			if (this.hidden) return this;
			if (this.options.autoResize){
				window.removeEvent('resize', this.position);
				this.enforceFixed && window.removeEvent('scroll', this.position);
			}
			if (this.tipElement) this.tipElement.hide();

			// Remove bubbling-prevention handler. (#4269)
			for (var event in {keyup :1, keydown :1, keypress :1}){
				this.element.removeEvent(event, preventKeyBubbling);
			}

			this.hideActivity();
			this.container.eliminate('kse-dialog');
			return this;
		},

		showActivity: function(){
			this.resetContent();
			this.fireEvent('beforeShow');
			this.element.show();
			this.position();
			this.fireEvent('show');
			this.editor.fireEvent('dialogShow');
			this.initContent();
			this.toggleTabPage(this.currentFocusIndex || 0);
			this.hidden = false;

			/*
			 * IE BUG: If the initial focus went into a non-text element (e.g. button),
			 * then IE would still leave the caret inside the editing area.
			 */
			if (this.editor.mode === 'wysiwyg' && env.ie){
				var doc = this.editor.document[0],
					selection = doc.selection, 
					range = selection.createRange();

				if (range){
					if (range.parentElement && range.parentElement().ownerDocument == doc || range.item && range.item(0).ownerDocument == doc){
						var textRange = document.body.createTextRange();
						textRange.moveToElementText(this.toElement().first()[0]);
						textRange.collapse(true);
						textRange.select();
					}
				}
			}

			this.fireEvent('afterShow');

			return this;
		},

		hideActivity: function(){
			this.fireEvent('beforeHide');
			this.element.hide();
			this.resetContent();
			this.resetTabPage();
			this.fireEvent('hide');
			this.editor.fireEvent('dialogHide');
			this.hidden = true;

			var editor = this.editor;
			editor.focus();

			if (editor.mode === 'wysiwyg' && local.env.ie){
				var selection = editor.getSelection();
				selection && selection.unlock(true);
			}

			this.fireEvent('afterHide');

			return this;
		},

		/**
		 * Activates a tab page in the dialog by its id.
		 * @param {Number} index The id of the dialog tab to be activated.
		 * @example
		 * dialogObj.toggleTabPage(1);
		 */
		toggleTabPage: function(index){
			var currentIndex = this.currentTabIndex;
			return !this.tabs || currentIndex === index ? this : 
				this.hideTabPage(currentIndex).showTabPage(index).fireEvent('toggleTabPage');
		},

		/**
		 * Unhides a page's tab.
		 * @param {Number} index The page's Id.
		 * @example
		 * dialog.showTabPage(2);
		 */
		showTabPage: function(index){
			var tab = this.tabs[0][index],
				page = this.tabs[1][index];

			if (tab && page){
				if (!tab.data('kse-disabled')){
					page.show();
					tab.addClass('kse-active');
					this.currentTabIndex = index;
				} else this.showTabPage(this.currentTabIndex);
			}
			return this;
		},

		/**
		 * Hides a page's tab away from the dialog.
		 * @param {Number} index The page's Id.
		 * @example
		 * dialog.hideTabPage(3);
		 */
		hideTabPage: function(index){
			var tab = this.tabs[0][index],
				page = this.tabs[1][index],
				self = this;

			if (tab && page){
				page.hide();
				tab.removeClass('kse-active');
				this.currentTabIndex = index;
				this.walk(function(){
					self.handleFieldValidated(this);
				});
			}

			return this;
		},

		resetTabPage: function(){
			var defaultTabIndex = this.defaultTabIndex || 0;
			if (this.currentFocusIndex) this.currentFocusIndex = defaultTabIndex;
			return this.toggleTabPage(defaultTabIndex);
		},

		disableTab: function(index){
			var tab = this.tabs[0][index];

			if (tab) tab.data('kse-disabled', 1).hide();
			return this;
		},

		isCurrentTabPage: function(index){
			var tab = this.tabs[0][index];
			return tab && tab.isVisible() && this.currentTabIndex === index;
		},

		destroy: function(){
			this.hide();
			this.element.destroy();
			this.fireEvent('destroy');
			return this;
		},

		close: function(){
			this.fireEvent('beforeClose');
			if (!this.prohibitClose){
				this.checkContent();
				if (!this.isChanged || confirm(this.editor.lang.common.confirmCancel)){
					this.hide();
					this.fireEvent('close');
				}
			}
			return this;
		},
	 
		position: function(){
			this.resize();
			this.element.position({
				enforceFixed: this.options.fixed
			});
			return this;
		},

		/**
		 * Resizes the dialog.
		 * @param {Number} x The width of the dialog in pixels.
		 * @param {Number} y The height of the dialog in pixels.
		 * @function
		 * @example
		 * dialogObj.resize(800, 640);
		 */
		resize: function(x, y){
			var opts = this.options;
			this.element.styles({
				width: x || opts.width,
				height: y || opts.height
			});
			return this;
		}
	 
	});

	// ESC, ENTER
	var preventKeyBubblingKeys = {27 :1, 13 :1};
	var preventKeyBubbling = function(ev){
		if (ev.code in preventKeyBubblingKeys) ev.stop();
	};

	var requiredRegex = /^([a]|[^a])+$/, 
		integerRegex = /^\d*$/, 
		numberRegex = /^\d*(?:\.\d+)?$/, 
		htmlLengthRegex = /^(((\d*(\.\d+))|(\d*))(px|\%)?)?$/, 
		cssLengthRegex = /^(((\d*(\.\d+))|(\d*))(px|em|ex|in|cm|mm|pt|pc|\%)?)?$/i, 
		inlineStyleRegex = /^(\s*[\w-]+\s*:\s*[^:;]+(?:;|$))*$/,
		urlRegex = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i,
		emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,
		protocolRegex = /^((?:http|https|ftp|news):\/\/)?(.*)$/;

	var combineURI = function(uri){
		var match = uri.match(protocolRegex),
			protocol = match[1] || 'http://', 
			url = match[2].trim();

		return url ? (url.indexOf('/') === 0) ? url : protocol + url : '';
	};

	var $ = constructor.constants;
	
	$.VALIDATE_OR = 1;
	$.VALIDATE_AND = 2;


	$.TIP_TYPE_ERROR = 0;
	$.TIP_TYPE_SUCCESS = 1;
	$.TIP_TYPE_WARNING = 2;

	promptypeMap[$.TIP_TYPE_ERROR] = 'error';
	promptypeMap[$.TIP_TYPE_SUCCESS] = 'success';
	promptypeMap[$.TIP_TYPE_WARNING] = 'warning';

	constructor.dialog.validate = {
	
		rules: {},
	
		addRules: function(dialogName, rule){
			return this.rules[dialogName] = rule;
		},

		getRules: function(dialogName){
			return this.rules[dialogName];
		},

		functions: function(){
			var args = arguments;
			return function(){
				/**
				 * It's important for validate functions to be able to accept the value
				 * as argument in addition to this.value(), so that it is possible to
				 * combine validate functions together to make more sophisticated
				 * validators.
				 */
				var value = this && this.value ? this.value() : args[0];
				
				var msg = undefined, relation = $.VALIDATE_AND, functions = [], i;
				
				for (i = 0; i < args.length; i++){
					if (typeof(args[i]) == 'function') functions.push(args[i]);
					else break;
				}
				
				if (i < args.length && typeof args[i] === 'string'){
					msg = args[i];
					i++;
				}
				
				if (i < args.length && typeof args[i] === 'number') relation = args[i];
				
				var passed = (relation == $.VALIDATE_AND ? true : false);
				for (i = 0; i < functions.length; i++){
					if (relation == $.VALIDATE_AND) passed = passed && functions[i](value);
					else passed = passed || functions[i](value);
				}
				
				return !passed ? msg : true;
			};
		},
		
		regex: function(regex, msg){
			/*
			 * Can be greatly shortened by deriving from functions validator if code size
			 * turns out to be more important than performance.
			 */
			return function(){
				var value = this && this.value ? this.value() : arguments[0];
				return !regex.test(value) ? msg : true;
			};
		},
		
		required: function(msg){
			return this.regex(requiredRegex, msg);
		},
		
		integer: function(msg){
			return this.regex(integerRegex, msg);
		},
		
		number: function(msg){
			return this.regex(numberRegex, msg);
		},

		url: function(msg){
			return this.functions(function(val){
				return urlRegex.test(combineURI(val));
			}, msg);
		},

		email: function(msg){
			return this.regex(emailRegex, msg);
		},
		
		cssLength: function(msg){
			return this.functions(function(val){
				return cssLengthRegex.test(val.trim());
			}, msg);
		},
		
		htmlLength: function(msg){
			return this.functions(function(val){
				return htmlLengthRegex.test(val.trim());
			}, msg);
		},
		
		inlineStyle: function(msg){
			return this.functions(function(val){
				return inlineStyleRegex.test(val.trim());
			}, msg);
		},
		
		equals: function(value, msg){
			return this.functions(function(val){
				return val == value;
			}, msg);
		},
		
		notEqual: function(value, msg){
			return this.functions(function(val){
				return val != value;
			}, msg);
		}
	};

});