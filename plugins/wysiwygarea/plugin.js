/**
 * Klass Rich Text Editor v0.5
 * http://kseditor.com
 * 
 * Copyright 2011 - 2012, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */


/**
 * @fileOverview The "wysiwygarea" plugin. It registers the "wysiwyg" editing
 *		mode, which handles the main editing area space.
 */

Klass.run(function(local){

	var document = this.document,
		env = local.env,
		constructor = local.Editor,
		utils = constructor.utils,
		markup = constructor.markup,
		$ = constructor.constants,
		$dtd = constructor.dtd;

	// Matching an empty paragraph at the end of document.
	var emptyParagraphRegexp = /(^|<body\b[^>]*>)\s*<(p|div|address|h\d|center)[^>]*>\s*(?:<br[^>]*>|&nbsp;|\u00A0|&#160;)?\s*(:?<\/\2>)?\s*(?=$|<\/body>)/gi;
	
	var notWhitespaceEval = local.DOM.walker.whitespaces(true);

	// Elements that could blink the cursor anchoring beside it, like hr, page-break. (#6554)
	function nonEditable(element){
		return element.isBlockBoundary() && $dtd.$empty[element.name()];
	}

	function insertContent(fn){
		return function(args){
			if (this.mode === 'wysiwyg'){
				this.focus();

				// Since the insertion might happen from within dialog or menu
				// where the editor selection might be locked at the moment,
				// update the locked selection.
				var selection = this.getSelection(),
					isLocked = selection.isLocked;

				isLocked && selection.unlock();
				
				this.fireEvent('saveSnapshot');
				
				fn.call(this, args);

				isLocked && this.getSelection().lock();
				
				// Save snaps after the whole execution completed.
				// This's a workaround for make DOM modification's happened after
				// 'insertElement' to be included either, e.g. Form-based dialogs' 'commitContents'
				// call.
				this.fireEvent.delay(0, this, 'saveSnapshot');
			}
		};
	}

	function insertHTML(data){
		if (this.dataProcessor) data = this.dataProcessor.toHTML(data);

		if (!data) return;

		var selection = this.getSelection(),
			range = selection.getRanges()[0];

		if (range.checkReadOnly()) return;

		// Opera: force block splitting when pasted content contains block. 
		if (env.opera){
			var path = new local.DOM.elementPath(range.startContainer);
			if (path.block){
				var nodes = local.htmlParser.fragment.fromHtml(data, false).children;
				for (var i = 0, l = nodes.length; i < l; i++){
					if (nodes[i].isBlockLike){
						range.splitBlock(this.enterMode === $['ENTER_DIV'] ? 'div' : 'p');
						range.insertNode(range.document.createText(''));
						range.select();
						break;
					}
				}
			}
		}

		if (env.ie){
			var nativeSelection = selection.getSelection();
			
			// Delete control selections to avoid IE bugs on pasteHTML.
			if (nativeSelection.type == 'Control') nativeSelection.clear();
			else if (selection.getType() == $['SELECTION_TEXT']){
				// Due to IE bugs on handling contenteditable=false blocks
				// (#6005), we need to make some checks and eventually
				// delete the selection first.
				
				range = selection.getRanges()[0];
				var endContainer = range && range.endContainer;
				
				if (endContainer && endContainer.$element && 
					endContainer.getProperty('contenteditable') == 'false' && 
					range.checkBoundaryOfElement(endContainer, $['END'])){
						range.setEndAfter(range.endContainer);
						range.deleteContents();
				}
			}
			nativeSelection.createRange().pasteHTML(data);
		} else this.execCommand('inserthtml', data);
		
		// Webkit does not scroll to the cursor position after pasting (#5558)
		if (env.webkit){
			selection = this.getSelection();
			selection.scrollIntoView();
		}
	}

	function insertText(text){
		var selection = this.getSelection(), 
			mode = selection.getStartElement().hasAscendant('pre', true) ? $['ENTER_BR'] : this.config.enterMode, 
			isEnterBrMode = mode == $['ENTER_BR'];
		
		var html = utils.htmlEncode(text.replace(/\r\n|\r/g, '\n'));
		var spaceChar = '&nbsp;';

		// Convert leading and trailing whitespaces into &nbsp;
		html = html.replace(/^[ \t]+|[ \t]+$/g, function(match, offset){
			if (match.length == 1) return spaceChar;
			else if (!offset) return spaceChar.repeat(match.length - 1) + ' ';
			else return ' ' + spaceChar.repeat(match.length - 1);
		});
		
		// Convert subsequent whitespaces into &nbsp;
		html = html.replace(/[ \t]{2,}/g, function(match){
			return spaceChar.repeat(match.length - 1) + ' ';
		});
		
		var paragraphTag = mode == $['ENTER_P'] ? 'p' : 'div';
		
		// Two line-breaks create one paragraph.
		if (!isEnterBrMode){
			html = html.replace(/(\n{2})([\s\S]*?)(?:$|\1)/g, function(match, group, text){
				return '<' + paragraphTag + '>' + text + '</' + paragraphTag + '>';
			});
		}
		
		// One <br> per line-break.
		html = html.replace(/\n/g, '<br>');
		
		// Compensate padding <br> for non-IE.
		if (!(isEnterBrMode || env.ie)){
			html = html.replace(new RegExp('<br>(?=</' + paragraphTag + '>)'), function(match){
				return match.repeat(2);
			});
		}
		
		// Inline styles have to be inherited in Firefox.
		if (env.firefox || env.webkit){
			var elements = new local.DOM.elementPath(selection.getStartElement()).elements, context = [];
			
			for (var i = 0, l = elements.length; i < l; i++){
				var tag = elements[i].name();
				if (tag in $dtd.$inline) context.unshift(elements[i].outerHTML().match(/^<.*?>/));
				else if (tag in $dtd.$block) break;
			}
			
			// Reproduce the context  by preceding the pasted HTML with opening inline tags.
			html = context.join('') + html;
		}
		
		insertHTML.call(this, html);
	}
	
	function insertElement(element){
		var selection = this.getSelection(), 
			ranges = selection.getRanges(), 
			name = element.name(), 
			isBlock = $dtd.$block[name];
		
		var isLocked = selection.isLocked;
		
		if (isLocked) selection.unlock();
		
		var range, clone, lastElement, bookmark;
		
		for (var i = ranges.length - 1; i >= 0; i--){
			range = ranges[i];

			if (!range.checkReadOnly()){
				// Remove the original contents.
				range.deleteContents(1);
				
				clone = !i && element || element.clone(1);
			
				// If we're inserting a block at dtd-violated position, split
				// the parent blocks until we reach blockLimit.
				var current, dtd;
				if (isBlock){
					while ((current = range.getCommonAncestor(0, 1)) && (dtd = $dtd[current.name()]) && !(dtd && dtd[name])){
						// Split up inline elements.
						if (current.name() in $dtd.span) range.splitElement(current);
						// If we're in an empty block which indicate a new paragraph,
						// simply replace it with the inserting block.(#3664)
						else if (range.checkStartOfBlock() && range.checkEndOfBlock()){
							range.setStartBefore(current);
							range.collapse(true);
							current.dispose();
						} else range.splitBlock();
					}
				}
			
				// Insert the new node.
				range.insertNode(clone);
			
				// Save the last element reference so we can make the
				// selection later.
				if (!lastElement) lastElement = clone;
			}
		}

		if (lastElement){
			range.moveToPosition(lastElement, $['POSITION_AFTER_END']);
			
			// If we're inserting a block element immediatelly followed by
			// another block element, the selection must move there. (#3100,#5436)
			if (isBlock){
				var next = lastElement.next(notWhitespaceEval), tagName = next && next.$element && next.name();
				
				// Check if it's a block element that accepts text.
				if (tagName && $dtd.$block[tagName] && $dtd[tagName]['#']) range.moveToElementEditStart(next);
			}
		}

		selection.selectRanges([range]);
		
		if (isLocked) this.getSelection().lock();
	}

	function restoreRecord(editor){
		if (!editor.checkRecord()) setTimeout(function(){
			editor.resetRecord();
		}, 0);
	}

	var isNotWhitespace = local.DOM.walker.whitespaces(true), isNotBookmark = local.DOM.walker.bookmark(false, true);

	function isNotEmpty(node){
		return isNotWhitespace(node) && isNotBookmark(node);
	}

	function isNbsp(node){
		return node.$text && node.text().trim().match(/^(?:&nbsp;|\xa0)$/);
	}

	function isBlankParagraph(block){
		return block.outerHTML().match(emptyParagraphRegexp);
	}

	isNotWhitespace = local.DOM.walker.whitespaces(true);

	function selectionChangeFixBody(ev){
		var editor = ev.editor, path = ev.path, 
			blockLimit = path.blockLimit, selection = ev.selection, 
			range = selection.getRanges()[0], body = editor.document.body(), 
			enterMode = editor.config.enterMode;

		if (env.firefox){
			activateEditing(editor);

			// Ensure bogus br could help to move cursor (out of styles) to the end of block. (#7041)
			var block = path.block || blockLimit, lastNode = block && block.last(isNotEmpty);

			// Check some specialities of the current path block:
			// 1. It is really displayed as block; (#7221)
			// 2. It doesn't end with one inner block; (#7467)
			// 3. It doesn't have bogus br yet.
			if (block && block.isBlockBoundary() && 
				!(lastNode && lastNode.$element && lastNode.isBlockBoundary()) && 
				!block.is('pre') && !block.getBogus()){
				block.appendBogus();
			}
		}

		// When enterMode set to block, we'll establing new paragraph only if we're
		// selecting inline contents right under body. (#3657)
		if (editor.config.autoParagraph !== false && enterMode != $['ENTER_BR'] && range.collapsed && blockLimit.is('body') && !path.block){

			var fixedBlock = range.fixBlock(true, editor.config.enterMode == $['ENTER_DIV'] ? 'div' : 'p');

			// For IE, we should remove any filler node which was introduced before.
			if (env.ie){
				var first = fixedBlock.first(isNotEmpty);
				first && isNbsp(first) && first.dispose();
			}

			// If the fixed block is actually blank and is already followed by an exitable blank
			// block, we should revert the fix and move into the existed one. (#3684)
			if (isBlankParagraph(fixedBlock)){
				var element = fixedBlock.next(isNotWhitespace);
				if (element && element.$element && !nonEditable(element)){
					range.moveToElementEditStart(element);
					fixedBlock.dispose();
				} else {
					element = fixedBlock.prev(isNotWhitespace);
					if (element && element.$element && !nonEditable(element)){
						range.moveToElementEditEnd(element);
						fixedBlock.dispose();
					}
				}
			}

			range.select();
		}

		// Browsers are incapable of moving cursor out of certain block elements (e.g. table, div, pre)
		// at the end of document, makes it unable to continue adding content, we have to make this
		// easier by opening an new empty paragraph.
		var testRange = new local.DOM.range(editor.document);
		testRange.moveToElementEditEnd(editor.document.body());
		var testPath = new local.DOM.elementPath(testRange.startContainer);
		if (!testPath.blockLimit.is('body')){
			var paddingBlock = enterMode != $['ENTER_BR'] ? 
				body.append(editor.document.createElement(enterMode == $['ENTER_P'] ? 'p' : 'div')) : body;
			if (!env.ie) paddingBlock.appendBogus();
		}
	}

	function activateEditing(editor){
		var win = editor.window, 
			doc = editor.document, 
			body = doc.body(), 
			length = body.length(),
			first = body.first();

		if (!length || length == 1 && first.$element && first.hasAttribute('_moz_editor_bogus_node')){

			restoreRecord(editor);
			
			// Memorize scroll position to restore it later (#4472).
			var hostDocument = editor.element.getDocument();
			var hostDocumentElement = hostDocument.html();
			var scrollTop = hostDocumentElement[0].scrollTop;
			var scrollLeft = hostDocumentElement[0].scrollLeft;
			
			// Simulating keyboard character input by dispatching a keydown of white-space text.
			var keyEventSimulate = doc[0].createEvent("KeyEvents");
			keyEventSimulate.initKeyEvent('keypress', true, true, win[0], false, false, false, false, 0, 32);
			doc[0].dispatchEvent(keyEventSimulate);
			
			if (scrollTop != hostDocumentElement[0].scrollTop || scrollLeft != hostDocumentElement[0].scrollLeft) 
				hostDocument.getWindow()[0].scrollTo(scrollLeft, scrollTop);

			// Restore the original document status by placing the cursor before a bogus br created (#5021).
			length && first.dispose();
			body.appendBogus();
			var nativeRange = new local.DOM.range(doc);
			nativeRange.setStartAt(body, $['POSITION_AFTER_START']);
			nativeRange.select();
		}
	}


	constructor.plugins.implement({

		wysiwygarea: function(editor){

			var fixForBody = (editor.config.enterMode !== $['ENTER_BR'] && editor.config.autoParagraph !== false) ?
				editor.config.enterMode === $['ENTER_DIV'] ? 'div' : 'p' : false;

			editor.addEvent('editingBlockReady', function(){
				var container, iframe, isLoadingData, isPendingFocus, frameLoaded, fireMode;

				var loaded, editor = this;

				var isCustomDomain = utils.isCustomDomain();

				var tabIndex = env.webkit ? -1 : this.tabIndex;

				var createIFrame = function(data){
					if (iframe) iframe.destroy();

					var src = 'document.open();' + (isCustomDomain ? ('document.domain="' + document.domain + '";') : '') + 'document.close();';
					src = env.air ? 'javascript:void(0)' : env.ie ? 'javascript:void(function(){' + encodeURIComponent(src) + '}())' : '';

					var content = markup.iframeContainer.substitute({
						src: src,
						tabIndex: tabIndex
					});

					iframe = local.DOM.create(content);

					if (document.location.protocol == 'chrome:') local.support.useCapture = true;

					iframe.addEvent('load', function(){
						loaded = true;
						this.removeEvents('load');
						var doc = iframe.getFrameDocument();
						doc.write(data);
					});

					if (document.location.protocol == 'chrome:') local.support.useCapture = false;

					container.append(iframe);

				};

				var contentDOMReadyHandler = utils.addFunction(contentDOMReady);
				var script = isCustomDomain ? 'document.domain="' + document.domain + ';"' :
					'window.parent.Klass.Editor.utils.callFunction(' + contentDOMReadyHandler + ', window);';

				// Editing area bootstrap code.
				function contentDOMReady(DOMWindow){
					if (!loaded) return;
					loaded = false;
					
					//editor.fireEvent('ariaWidget', iframe);
					
					var DOMDocument = DOMWindow.document, 
						body = DOMDocument.body,
						editable = !editor.readOnly;;

					// Remove this script from the DOM.
					var script = DOMDocument.getElementById("kse-script");
					script && script.parentNode.removeChild(script);

					body.spellcheck = !editor.config.disableNativeSpellChecker;

					if (editor.config.enableLivePreview){
						editor.config.useLivePreview = editor.config.enableLivePreview && !env.ie;
						body.setAttribute('livepreview', !editor.config.enableLivePreview);
					}
					
					if (env.ie){
						// Don't display the focus border.
						body.hideFocus = true;
						body.disabled = true;
						body.contentEditable = editable;
						body.removeAttribute('disabled');
					} else {
						setTimeout(function(){
							if (env.firefox || env.opera) DOMDocument[0].body.contentEditable = editable;
							else if (env.webkit) DOMDocument[0].body.parentNode.contentEditable = editable;
							else DOMDocument[0].designMode = editable ? 'off' : 'on';
						}, 0);
					}

					editable && env.firefox && activateEditing.delay(0, null, editor);

					DOMWindow = editor.window = new local.DOM.window(DOMWindow);
					DOMDocument = editor.document = new local.DOM.document(DOMDocument);

					DOMDocument.addEvents({

						// Prevent the browser opening links in read-only blocks.
						click: function(ev){
							if (ev.getTarget().is('a') && !ev.rightClick) ev.preventDefault();
						},
							
						dblclick: function(evt){
							var element = evt.getTarget(), 
								data = {element: element, dialog: ''};
							editor.fireEvent('doubleclick', data);
							data.dialog && editor.openDialog(data.dialog);
						}

					});

					// Gecko/Webkit need some help when selecting control type elements.
					if (env.webkit || env.firefox){
						DOMDocument.addEvent('mousedown', function(ev){
							var control = ev.getTarget();
							if (control.is('img', 'hr', 'input', 'textarea', 'select')) editor.getSelection().selectElement(control);
						});
					}
					
					/*if (env.firefox){
						DOMDocument.addEvent('mouseup', function(ev){
							if (ev.rightClick){
								var target = ev.getTarget();
								
								// Prevent right click from selecting an empty block even
								// when selection is anchored inside it. (#5845)
								if (!target.outerHTML().replace(emptyParagraphRegexp, '')){
									var range = new local.DOM.range(DOMDocument);
									range.moveToElementEditStart(target);
									range.select(true);
								}
							}
						});
					}*/
					
					// Webkit: avoid from editing form control elements content.
					if (env.webkit){
						DOMDocument.addEvents({

							// Mark that cursor will right blinking 
							mousedown: function(){
								wasFocused = 1;
							},

							// Prevent from tick checkbox/radiobox/select
							click: function(ev){
								if (ev.getTarget().is('input', 'select')) ev.preventDefault();
							},

							// Prevent from editig textfield/textarea value.
							mouseup: function(ev){
								if (ev.getTarget().is('input', 'textarea')) ev.preventDefault();
							}

						});
					}

					var focusTarget = env.ie ? iframe : DOMWindow;
					var wasFocused;

					focusTarget.addEvents({
						
						blur: function(){
							editor.focusManager.blur();
						},

						focus: function(){
							var doc = editor.document;
							if (env.firefox && env.opera) doc.body().focus();
							// Webkit needs focus for the first time on the HTML element.
							else if (env.webkit){
								if (!wasFocused){
									editor.document.html().focus();
									wasFocused = 1;
								}
							}
							editor.focusManager.focus();
						}

					});
					
					/*var keystrokeHandler = editor.keystrokeHandler;
					if (keystrokeHandler) keystrokeHandler.attach(DOMDocument);*/
					DOMDocument.addEvent('keydown', function(ev){
						editor.fireEvent('keystroke', ev);
					});

					//DOMDocument.html().addClass(DOMDocument[0].compatMode);

					// Override keystroke behaviors.
					editable && DOMDocument.addEvent('keydown', function(ev){
						var keyCode = ev.code;

						// Backspace OR Delete.
						if (keyCode in {8: 1, 46: 1}){
							var selection = editor.getSelection(), 
								selected = selection.getSelectedElement(),
								range = selection.getRanges()[0],
								path = new local.DOM.elementPath(range.startContainer),
								block, parent, next, rtl = keyCode === 8;

							// Override keystrokes which should have deletion behavior
							//  on fully selected element .
							if (selected){
								// Make undo snapshot.
								editor.fireEvent('saveSnapshot');
								
								// Delete any element that 'hasLayout' (e.g. hr,table) in IE8 will
								// break up the selection, safely manage it here. (#4795)
								range.moveToPosition(selected, $['POSITION_BEFORE_START']);
								// Remove the control manually.
								selected.dispose();
								range.select();
								
								editor.fireEvent('saveSnapshot');
								ev.preventDefault();
							} else {
								// Handle the following special cases: 
								// 1. Del/Backspace key before/after table;
								// 2. Backspace Key after start of table.
								if ((block = path.block) && range[rtl ? 'checkStartOfBlock' : 'checkEndOfBlock']() &&
									(next = block[rtl ? 'prev' : 'next'](notWhitespaceEval)) && next.is('table')){
									editor.fireEvent('saveSnapshot');

									// Remove the current empty block.
									if (range[rtl ? 'checkEndOfBlock' : 'checkStartOfBlock']()) block.dispose();

									// Move cursor to the beginning/end of table cell.
									range['moveToElementEdit' + (rtl ? 'End' : 'Start')](next);
									range.select();

									editor.fireEvent('saveSnapshot');
									ev.preventDefault();
								} else if (path.blockLimit.is('td') && (parent = path.blockLimit.getAscendant('table')) && 
									range.checkBoundaryOfElement(parent, rtl ? $['START'] : $['END']) &&
									(next = parent[rtl ? 'prev' : 'next'](notWhitespaceEval))){
									editor.fireEvent('saveSnapshot');

									// Move cursor to the end of previous block.
									range['moveToElementEdit' + (rtl ? 'End' : 'Start')](next);

									//Remove any previous empty block.
									if (range.checkStartOfBlock() && range.checkEndOfBlock()) next.dispose();
									else range.select();

									editor.fireEvent('saveSnapshot');
									ev.preventDefault();
								}
							}
						}

						// PageUp OR PageDown
						if (env.firefox && keyCode in {33: 1, 34: 1}){
							var body = this.body();

							// Page up/down cause editor selection to leak
							// outside of editable thus we try to intercept
							// the behavior, while it affects only happen
							// when editor contents are not overflowed.
							if (DOMWindow[0].innerHeight > body[0].offsetHeight){
								var range = new local.DOM.range(this);
								range[keyCode === 33 ? 'moveToElementEditStart' : 'moveToElementEditEnd'](body);
								range.select();
								ev.preventDefault();
							}
						}

					});

					// PageUp/PageDown scrolling is broken in document
					// with standard doctype, manually fix it. (#4736)
					if (env.ie && DOMDocument[0].compatMode === 'CSS1Compat'){
						var pageUpDownKeys = {33: 1, 34: 1};
						DOMDocument.addEvent('keydown', function(ev){
							if (ev.code in pageUpDownKeys){
								setTimeout(function(){
									editor.getSelection().scrollIntoView();
								}, 0);
							}
						});
					}
					
					// Adds the document body as a context menu target.
					/*if (editor.contextMenu) editor.contextMenu.addTarget(DOMDocument, editor.config.browserContextMenuOnCtrl !== false);*/

					var keystrokesHook = {};
					if (env.ie || env.webkit) keystrokesHook['187'] = ['=', '+'];

					var getKeystrokes = function(ev){
						if (ev.type === 'keypress') return;
						var result = keystrokesHook[ev.code];
						return result && local.isArray(result) ? result[ev.shift ? 1 : 0] : result; 
					};

					var keyboardEventHandler = function(ev){
						var control = ev.meta || ev.control;
						var shift = ev.shift, alt = ev.alt;
						var key = getKeystrokes(ev) || ev.key;
						var command = editor.specialKeys[key];
						var typeOf = typeof command;
						if (!command) return;
						if (control || shift || alt || ev.key === 'enter'){
							if (typeOf === 'function') return command.call(editor, ev);
							if (typeOf === 'object' && command.keystrokes){
								var keys = [];
								keys.append(command.keystrokes.replace('++', function(){
									keys.push('+'); // shift++ and shift+++a
									return '';
								}).split('+'));
								if (keys.every(function(item){
									return ev.event[item + 'Key'] || item === key;
								})) return !!editor.execCommand(command.command, false);
							}
							if (control){
								editor.execCommand(command, false);
								return false;
							}
						}
					};

					// For most browsers, it is enough to listen to the keydown event
					// only.
					var keyboardEventType = env.opera || env.firefox ? 'keypress' : 'keydown';
					DOMDocument.addEvent(keyboardEventType, keyboardEventHandler);

					// Prevent IE from leaving new paragraph after deleting all contents in body.
					if (env.ie && editor.config.enterMode !== $['ENTER_P']){
						DOMDocument.addEvent('selectionchange', function(){
							var body = this.body(), 
								selection = editor.getSelection(), 
								range = selection && selection.getRanges()[0];

							if (range && body.html().match(/^<p>&nbsp;<\/p>$/i) && range.startContainer.equals(body)){
								// Avoid the ambiguity from a real user cursor position.
								setTimeout(function(){
									range = editor.getSelection().getRanges()[0];
									if (!range.startContainer.equals('body')) {
										body.first().dispose(1);
										range.moveToElementEditEnd(body);
										range.select(1);
									}
								}, 0);
							}
						});
					}

					setTimeout(function(){
						editor.fireEvent('contentDOMReady');
						
						if (fireMode){
							editor.mode = 'wysiwyg';
							editor.fireEvent('mode');
							fireMode = false;
						}
						
						isLoadingData = false;
						
						if (isPendingFocus){
							editor.focus();
							isPendingFocus = false;
						}
						/*setTimeout(function(){
							editor.fireEvent('dataReady');
						}, 0);*/

						// Enable dragging of position:absolute elements in IE.
						try { 
							editor.execCommand('2D-position', true); 
						} catch(e){}
						
						// IE, Opera and Safari may not support it and throw errors.
						try {
							editor.execCommand('enableInlineTableEditing', !editor.config.disableNativeTableHandles);
						} catch (e){}

						if (editor.config.disableObjectResizing){
							try {
								editor.execCommand('enableObjectResizing');
							} catch (e){
								// For browsers in which the above method failed, we can cancel the resizing on the fly
								editor.document.body().addEvent(env.ie ? 'resizestart' : 'resize', function(ev){
									ev.preventDefault();
								});
							}
						}

						/*
						 * IE BUG: IE might have rendered the iframe with invisible contents.
						 * Push some inconsequential CSS style changes to force IE to
						 * refresh it.
						 *
						 * Also, for some unknown reasons, short timeouts (e.g. 100ms) do not
						 * fix the problem. :(
						 */
						/*if (env.ie){
							setTimeout(function(){
								if (editor.document){
									var bodyElement = editor.document[0].body;
									bodyElement.runtimeStyle.marginBottom = '0px';
									bodyElement.runtimeStyle.marginBottom = '';
								}
							}, 1000);
						}*/
					}, 0);

				}

				this.addEvents({
					insertHTML: insertContent(insertHTML),
					insertElement: insertContent(insertElement),
					insertText: insertContent(insertText),
					selectionChange: function(ev){
						if (this.readOnly) return;

						var selection = this.getSelection();
						// Do it only when selection is not locked.
						if (selection && !selection.isLocked){
							var isDirty = this.checkRecord();
							this.fireEvent('saveSnapshot', 1);
							selectionChangeFixBody.call(this, ev);
							this.fireEvent('updateSnapshot');
							!isDirty && this.resetRecord();
						}
					}
				});

				this.addMode('wysiwyg', {

					load: function(holderElement, data){
						container = holderElement; 

						editor.maybeRecord = true;

						fireMode = true;

						this.loadData(data);
					},

					unload: function(){
						this.dispose();
						editor.window = editor.document = container = isPendingFocus = null;
						editor.fireEvent('contentDomUnload');
					},

					getData: function(editor){
						var config = editor.config, 
							fullPage = config.fullPage, 
							docType = fullPage && editor.docType, 
							xmlDeclaration = fullPage && editor.xmlDeclaration, 
							doc = iframe.getFrameDocument();
						
						var data = fullPage ? doc.html().outerHtml() : doc.body().html();
						
						// BR at the end of document is bogus node for Mozilla.
						if (env.firefox) data = data.replace(/<br>(?=\s*(:?$|<\/body>))/, '');
						
						if (editor.dataProcessor) data = editor.dataProcessor.toDataFormat(data, fixForBody);
						
						// Reset empty if the document contains only one empty paragraph.
						if (config.ignoreEmptyParagraph) data = data.replace(emptyParagraphRegexp, function(match, lookback){
							return lookback;
						});
						
						if (xmlDeclaration) data = xmlDeclaration + '\n' + data;
						if (docType) data = docType + '\n' + data;
						
						return data;
					},

					loadData: function(data){
						isLoadingData = true;

						// Get the HTML version of the data.
						if (editor.dataProcessor) data = editor.dataProcessor.toHTML(data, fixForBody);

						// Distinguish bogus to normal BR at the end of document for Mozilla.
						if (env.firefox) data = data.replace(/<br \/>(?=\s*<\/(:?html|body)>)/, '$&<br type="_moz" />');

						data = markup.iframeContent.substitute({
							contentsCss: utils.buildStyleHtml(constructor.getUrl(editor.config.contentsCss)),
							externalCss: editor.storage.styles.join('\n'),
							direction: editor.config.contentsDirection,
							content: data,
							script: script
						});

						// The iframe is recreated on each call of setData, so we need to clear DOM objects
						this.dispose();
						createIFrame(data);
					},

					getSnapshotData: function(){
						return iframe.getFrameDocument().body().html();
					},

					loadSnapshotData: function(snapshot){
						iframe.getFrameDocument().body().html(snapshot);
					},
				
					dispose: function(){
						if (!editor.document) return;

						editor.document.html().removeEvents();
						editor.document.body().removeEvents();

						editor.window.removeEvents();
						editor.document.removeEvents();
					},

					focus: function(){
						var win = editor.window;

						if (isLoadingData) isPendingFocus = true;
						// Temporary solution caused by #6025, supposed be unified by #6154.
						else if (win){
							var selection = editor.getSelection();
							selection = selection && selection.getSelection();

							// IE considers control-type element as separate
							// focus host when selected, avoid destroying the
							// selection in such case.
							if (selection && selection.type === 'Control') return;

							// AIR needs a while to focus when moving from a link.
							env.air ? setTimeout(function(){
								win.focus();
							}, 0) : win.focus();
							editor.selectionChange();
						}
					}
				
				});

			});

		}

	});

});


/**
 * Disables the ability of resize objects (image and tables) in the editing
 * area.
 * @type Boolean
 * @default false
 * @example
 * config.disableObjectResizing = true;
 */
Klass.Editor.config.disableObjectResizing = false;

/**
 * Disables the "table tools" offered natively by the browser (currently
 * Firefox only) to make quick table editing operations, like adding or
 * deleting rows and columns.
 * @type Boolean
 * @default true
 * @example
 * config.disableNativeTableHandles = false;
 */
Klass.Editor.config.disableNativeTableHandles = true;

/**
 * Disables the built-in words spell checker if browser provides one.<br /><br />
 *
 * @type Boolean
 * @default true
 * @example
 * config.disableNativeSpellChecker = false;
 */
Klass.Editor.config.disableNativeSpellChecker = true;

/**
 * Whether the editor must output an empty value ("") if it's contents is made
 * by an empty paragraph only.
 * @type Boolean
 * @default true
 * @example
 * config.ignoreEmptyParagraph = false;
 */
Klass.Editor.config.ignoreEmptyParagraph = true;

/**
 * Whether automatically create wrapping blocks around inline contents inside document body,
 * this helps to ensure the integrality of the block enter mode.
 * <strong>Note:</strong> Changing the default value might introduce unpredictable usability issues.
 * @name Klass.Editor.config.autoParagraph
 * @type Boolean
 * @default true
 * @example
 * config.autoParagraph = false;
 */