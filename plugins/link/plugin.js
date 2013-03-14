/**
 * Klass Rich Text Editor v0.4
 * http://kseditor.com
 * 
 * Copyright 2011, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */

Klass.Editor.plugins.implement('link', function(editor){

	var $E = Klass.Editor,
		$ = $E.constants,
		currentPlugin = $E.plugins.link;

	var uriRegex = /^((?:https?|ftp|news):\/\/)?(.*)$/;

	var simpleURLRegex = /\b((https?|ftp):\/\/\w+|www)\.(([\w-]+)(\.?)(\w+))+\S*$/i;

	var escapeRegExp = function(string){// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
		return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function(match){
			return '\\' + match;
		});
	};

	var combineURI = function(uri){
		var bits = uri && uri.match(uriRegex);
		if (!bits) return '';

		var scheme = bits[1] || 'http://', 
			url = bits[2] && bits[2].trim();

		if (url && url.indexOf('/') === -1) url += '/';

		return url ? scheme + url : '';
	};

	var unlinkCommand = {
	
		/** @ignore */
		execute: function(editor){
			/*
			 * execCommand( 'unlink', ... ) in Firefox leaves behind <span> tags at where
			 * the <a> was, so again we have to remove the link ourselves. (See #430)
			 *
			 * TODO: Use the style system when it's complete. Let's use execCommand()
			 * as a stopgap solution for now.
			 */
			var selection = editor.getSelection(), 
				bookmarks = selection.createBookmarks(), 
				ranges = selection.getRanges(), 
				rootRange, element, style;
			
			for (var i = 0, l = ranges.length; i < l; i++){
				rootRange = ranges[i].getCommonAncestor(true);
				element = rootRange.getAscendant('a', true);
				if (!element) continue;
				ranges[i].selectNodeContents(element);
			}
			
			selection.selectRanges(ranges);
			style = new $E.style({
				element: 'a',
				type: $['STYLE_INLINE'],
				alwaysRemoveElement: 1
			});
			style.remove(editor.document);
			selection.selectBookmarks(bookmarks);
		},
		
		startDisabled: true

	};

	// Register selection change handler for the unlink button.
	editor.addEvent('selectionChange', function(evt){
		if (this.readOnly) return;

		/*
		 * Despite our initial hope, document.queryCommandEnabled() does not work
		 * for this in Firefox. So we must detect the state by element paths.
		 */
		var command = this.getCommand('unlink'), 
			element = evt.path.lastElement && evt.path.lastElement.getAscendant('a', true);
		command.set($[(element && element.name() === 'a' && element.getProperty('href') && element.length()) ? 'TRISTATE_OFF' : 'TRISTATE_DISABLED']);
	});
	
	editor.addEvent('doubleclick', function(evt){
		var element = currentPlugin.getSelectedLink(this) || evt.element;

		if (!element.isReadOnly()){
			if (element.is('a')){
				evt.dialog = (element.getProperty('name') && (!element.getProperty('href') || !element.length())) ? 'anchor' : 'link';
				this.getSelection().selectElement(element);
			} else if (currentPlugin.tryRestoreFakeAnchor(this, element)) evt.dialog = 'anchor';
		}
	});

	// Add the link and unlink buttons.
	editor.addCommand('link', new Klass.Editor.dialogCommand('link', {
		label: editor.lang.link.toolbar,
		shortcut: editor.config.link.shortcut
	}));
	editor.addCommand('unlink', unlinkCommand);

	if (!currentPlugin.autoCaptureLink && editor.config.link.enableAutoFormat){
		var listenerKeys = {8: 1, 13: 1, 32: 1};
		editor.addEvent('keystroke', function(ev){
			var keyCode = ev.code;
			if (keyCode in listenerKeys){
				var selection = editor.getSelection(), 
					ranges = selection.getRanges(),
					range = ranges[0],
					boundaryNodes = range.getBoundaryNodes(),
					ancestor = range.getCommonAncestor(true),
					ascendant = ancestor.getAscendant('a', true),
					unlink = keyCode === 8, bookmarks, previous;

				if (!range.collapsed) return;

				if (unlink){
					if (!ascendant){
						previous = range.endOffset === 0 ? ancestor.prev() : boundaryNodes.startNode;
						if (previous && previous.is){
							// Ignore bogus br element in the Firefox.
							if (previous.is('br')) previous = previous.prev();
							if (previous && (previous.$text || previous.is('a'))){
								ascendant = previous.is ? previous: null;
								range.setEndAt(previous, $['POSITION_BEFORE_END']);
								range.select();
							}
						}
					}

					if (ascendant && range.checkBoundaryOfElement(ascendant, $['END'])){
						// Make undo snapshot.
						editor.fireEvent('saveSnapshot');
						ascendant.normalize();
						// After the execution normalize method merges adjacent text nodes, 
						// need to re-set the offset of the range in Webkit.
						range.setEndAt(ascendant, $['POSITION_BEFORE_END']);
						range.select();
						unlinkCommand.execute(editor);
						editor.fireEvent('saveSnapshot');
						ev.preventDefault();
					}
					return;
				}

				if (ancestor.parent() && ancestor.parent().is('a')) return;
				if (!ancestor.$text) ancestor = boundaryNodes.startNode;

				if (ancestor.$text){
					var bookmark = range.createBookmark(),
						text = ancestor.text() || null,
						simpleMatch = text && text.match(simpleURLRegex),
						simpleMatchLink = simpleMatch && simpleMatch[0];

					range.moveToBookmark(bookmark);

					if (!simpleMatchLink) return;
					var regexp = new RegExp("[^\\s\\u4E00-\\u9FA5]*" + escapeRegExp(simpleMatchLink)),
						match = text.match(regexp),
						link = match && match[0];

					if (link && link === simpleMatchLink){
						// Make undo snapshot.
						editor.fireEvent('saveSnapshot');
						bookmarks = selection.createBookmarks();
						range.setStart(ancestor, link.length === ancestor.length() ? 0 : ancestor.length() - link.length);
						range.setEnd(ancestor, ancestor.length());
						selection.selectRanges(ranges);
						editor.document[0].execCommand('CreateLink', false, combineURI(link));
						selection.selectBookmarks(bookmarks);
						editor.fireEvent('saveSnapshot');
					}
				}
			}
		});
	}

});


Klass.Editor.plugins.link = {

	/**
	 *  Get the surrounding link element of current selection.
	 * @param editor
	 * @example Klass.Editor.plugins.link.getSelectedLink(editor);
	 * The following selection will all return the link element.
	 *	 <pre>
	 *  <a href="#">li^nk</a>
	 *  <a href="#">[link]</a>
	 *  text[<a href="#">link]</a>
	 *  <a href="#">li[nk</a>]
	 *  [<b><a href="#">li]nk</a></b>]
	 *  [<a href="#"><b>li]nk</b></a>
	 * </pre>
	 */
	getSelectedLink: function(editor){
		try {
			var selection = editor.getSelection();
			if (selection.getType() == Klass.Editor.$.SELECTION_ELEMENT){
				var selectedElement = selection.getSelectedElement();
				if (selectedElement.is('a')) return selectedElement;
			}
			
			var range = selection.getRanges(true)[0], root;
			range.shrink(Klass.Editor.$.SHRINK_TEXT);
			root = range.getCommonAncestor();
			return root.getAscendant('a', true);
		} catch (e){
			return null;
		}
	},

	getSelectedLinkText: function(editor){
		try {
			var selection = editor.getSelection(),
				ranges = selection.getRanges(),
				range = ranges[0],
				boundaryNodes = range.getBoundaryNodes(),
				selectedElement, selectedText;

			if (selection.getType() === Klass.Editor.$.SELECTION_TEXT){
				selectedText = selection.getSelectedText();
				return ranges.length === 1 && boundaryNodes.startNode.equals(boundaryNodes.endNode) ? selectedText : '*';
			}

			if (selectedElement = this.getSelectedLink(editor)){
				var childs = selectedElement.children();
				for (var i = 0, l = childs.length; i < l; i++){
					if (childs[i].$element && !childs[i].is('br')) return '*';
				}
				return selectedElement.text();
			}

			if (selection.getSelectedElement()) return '*';

		} catch (e){
			return null;
		}
	},

	// Automatically to capture typed in Internet or network path.
	autoCaptureLink: Klass.env.ie,
	
	// Opera and WebKit don't make it possible to select empty anchors. Fake
	// elements must be used for them.
	fakeAnchor: Klass.env.opera || Klass.env.webkit,
	
	// For browsers that don't support CSS3 a[name]:empty(), note IE9 is included because of #7783.
	synAnchorSelector: Klass.env.ie,
	
	// For browsers that have editing issue with empty anchor.
	emptyAnchorFix: Klass.env.ie && Klass.env.version < 8,
	
	tryRestoreFakeAnchor: function(editor, element){
		if (element && element.data('kse-real-element-type') && element.data('kse-real-element-type') == 'anchor'){
			var link = editor.restoreRealElement(element);
			if (link.data('kse-saved-name')) return link;
		}
	}

};


Klass.Editor.config.link = {

	shortcut: 'k',

	/**
	 * Enable AutoFormat, When the content type contains the Internet or network 
	 * path automatically replaced with hyperlinks.
	 * @default true
	 * @type Boolean
	 * @example
	 * config.link.enableAutoFormat = false;
	 */
	enableAutoFormat: true

};

/**
 * Klass.Editor.config.disableLinkTabPage = false;
 * Klass.Editor.config.disableEmailTabPage = false;
 */