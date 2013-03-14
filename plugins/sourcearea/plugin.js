/**
 * Klass Rich Text Editor v0.5
 * http://kseditor.com
 * 
 * Copyright 2011 - 2012, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */


/**
 * @fileOverview The "sourcearea" plugin. It registers the "source" editing
 *		mode, which displays the raw data being edited in the editor.
 */

Klass.run(function(local){

	var constructor = local.Editor;

	constructor.plugins.implement('sourcearea', function(editor){
	
		var win = constructor.document.getWindow();

		editor.addEvent('editingBlockReady', function(){
			var textarea, onResize;

			this.addMode('source', {
			
				load: function(holderElement, data){
					//if (local.env.ie && local.env.version < 8) holderElement.style('position', 'relative');
					
					// Create the source area <textarea>.
					editor.textarea = textarea = new local.DOM.element('textarea', {
						dir: 'ltr',
						role: 'textbox',
						tabIndex: local.env.webkit ? -1 : editor.tabIndex,
						readOnly: editor.readOnly ? 'readOnly' : null,
						//'aria-label': editor.lang.editorTitle.replace('%1', editor.name),
						'class': 'kse-source kse-enable-context-menu',
						styles: {
							// IE7 has overflow the <textarea> from wrapping table cell.
							width: local.env.ie7 ? '99%' : '100%',
							height: '100%',
							resize: 'none',
							outline: 'none',
							'text-align': 'left'
						},
						events: {
							blur: function(){
								editor.focusManager.blur();
							},
							focus: function(){
								editor.focusManager.focus();
							}
						}
					});
					
					// Having to make <textarea> fixed sized to conque the following bugs:
					// 1. The textarea height/width='100%' doesn't constraint to the 'td' in IE6/7.
					// 2. Unexpected vertical-scrolling behavior happens whenever focus is moving out of editor
					// if text content within it has overflowed. (#4762)
					if (local.env.ie){
						onResize = function(){
							// Holder rectange size is stretched by textarea,
							// so hide it just for a moment.
							textarea.hide();
							textarea.styles({
								height: holderElement[0].clientHeight,
								width: holderElement[0].clientWidth
							});
							// When we have proper holder size, show textarea again.
							textarea.show();
						};
						
						editor.addEvent('resize', onResize);
						win.addEvent('resize', onResize);
						setTimeout(onResize, 0);
					}
					
					// Reset the holder element and append the
					// <textarea> to it.
					holderElement.html('').append(textarea);
					
					//editor.fireEvent('ariaWidget', textarea);
					
					// The editor data "may be record" after this point.
					editor.maybeRecord = true;
					
					// Set the <textarea> value.
					this.loadData(data);
					
					//var keystrokeHandler = editor.keystrokeHandler;
					//if (keystrokeHandler) keystrokeHandler.attach(textarea);
					
					setTimeout(function(){
						editor.mode = 'source';
						editor.fireEvent('mode');
					}, (local.env.firefox || local.env.webkit) ? 100 : 0);

				},

				unload: function(){
					editor.textarea = textarea = null;
					
					if (onResize){
						editor.removeEvent('resize', onResize);
						win.removeEvent('resize', onResize);
					}
				},

				loadData: function(data){
					textarea.value(data);
					//editor.fireEvent('dataReady');
				},

				getData: function(){
					return textarea.value();
				},

				getSnapshotData: function(){
					return this.getData();
				},

				focus: function(){
					textarea.focus();
				}

			});
		
		});

		editor.addEvents({
			readOnly: function(){
				if (this.mode === 'source'){
					this.textarea[editor.readOnly ? 'setProperty' : 'removeProperty']('readOnly', 'readonly');
				}
			},
		
			mode: function(){
				this.getCommand('source').set(this.mode === 'source' ? constructor.$['TRISTATE_ON'] : constructor.$['TRISTATE_OFF']);
			}

		});
	
		/**
		 * Holds the definition of commands an UI elements included with the sourcearea
		 * plugin.
		 * @example
		 */
		editor.addCommand('source', {
			modes: {
				wysiwyg: 1,
				source: 1
			},
			editorFocus: false,
			readOnly: 1,
			execute: function(editor){
				if (editor.mode === 'wysiwyg') editor.fireEvent('saveSnapshot');
				editor.getCommand('source').set(constructor.$['TRISTATE_DISABLED']);
				editor.setMode(editor.mode === 'source' ? 'wysiwyg' : 'source');
			},
			
			canUndo: false
		});
	
	});

});