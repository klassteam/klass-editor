(function($E){

	function forceMode(data){
		data.mode = 'html';
	}
	
	function loadFilterRules(callback){
		var isLoaded = $E.cleanWord;

		if (isLoaded) callback();
		else {
			var filterFilePath = $E.getUrl($E.config.pasteFromWordCleanupFile || (this.path + 'filter/default.js'));
			
			// Load with busy indicator.
			//$E.scriptLoader.load(filterFilePath, callback, null, true);
		}
		
		return !isLoaded;
	}

	$E.plugins.implement({
		
		pastefromword: function(editor){
			// Flag indicate this command is actually been asked instead of
			// a generic pasting.
			var force = 0;
			var reset = function(){
				this.removeEvents({
					beforePaste: forceMode,
					afterPaste: reset
				});
				force && setTimeout(function(){
					force = 0;
				}, 0);
			};

			// Features bring by this command beside the normal process:
			// 1. No more bothering of user about the clean-up.
			// 2. Perform the clean-up even if content is not from MS-Word.
			// (e.g. from a MS-Word similar application.)
			editor.addCommand('pastefromword', {
				canUndo: false,

				label: editor.lang.pastefromword.label,

				execute: function(){
					// Ensure the received data format is HTML and apply content filtering. (#6718)
					force = 1;
					editor.addEvents({
						beforePaste: forceMode,
						afterPaste: reset
					});
					editor.execCommand('paste', 'html');
				}
			});

			editor.addEvents({

				pasteState: function(state){
					this.getCommand('pastefromword').set(state);
				},
			
				pasteFilter: function(data){
					var mswordHtml;

					// MS-WORD format sniffing.
					if ((mswordHtml = data['html']) && (force || (/(class=\"?Mso|style=\"[^\"]*\bmso\-|w:WordDocument)/).test(mswordHtml))) {
						var isLazyLoad = loadFilterRules(function(){
							// Event continuation with the original data.
							if (isLazyLoad) editor.fireEvent('paste', data);
							else if (!editor.config.pasteFromWordPromptCleanup || (force || confirm(editor.lang.pastefromword.cleanup))) {
								data['html'] = $E.cleanWord(mswordHtml, editor);
							}
						});

						// The cleanup rules are to be loaded, we should just skip
						// this event.
						data.skip = isLazyLoad;
					}
				}

			});

		}

	});

})(Klass.Editor);

/**
 * Whether to prompt the user about the clean up of content being pasted from
 * MS Word.
 * @name Klass.Editor.config.pasteFromWordPromptCleanup
 * @since 3.1
 * @type Boolean
 * @default undefined
 * @example
 * config.pasteFromWordPromptCleanup = true;
 */

/**
 * The file that provides the MS Word cleanup function for pasting operations.
 * Note: This is a global configuration shared by all editor instances present
 * in the page.
 * @name Klass.Editor.config.pasteFromWordCleanupFile
 * @since 3.1
 * @type String
 * @default 'default'
 * @example
 * // Load from 'pastefromword' plugin 'filter' sub folder (custom.js file).
 * config.pasteFromWordCleanupFile = 'custom';
 */