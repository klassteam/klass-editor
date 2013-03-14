Klass.Editor.dialog.add('link', function(editor){

	var local = Klass.Editor,
		lang = editor.lang.link,
		plugin = local.plugins.link;

	var markup = '<div id="kse-dialog-link" class="kse-dialog-link">' +
					'<table cellspacing="0">' +
						'<tr>' +
							'<td>' +
								'<label class="kse-dialog-label" for="kse-link-info">{displayText}</label>' +
							'</td>' +
							'<td class="kse-dialog-header-content">' +
								'<input type="text" id="kse-link-info" class="kse-dialog-input" />' +
							'</td>' +
						'</tr>' +
						'<tr>' +
							'<td class="kse-dialog-tab-bar">' +
								'<div class="kse-dialog-label">{type}</div>' +
								'<div class="kse-tab-bar">' +
									'<div class="kse-tab">{toWebAddress}</div>' +
									'<div class="kse-tab">{toEmailAddress}</div>' +
								'</div>' +
							'</td>' +
							'<td class="kse-dialog-tab-content">' +
								'<div class="kse-dialog-tab-content-inner">' +
									'<table>' +
										'<tr>' +
											'<td>' +
												'<label class="kse-dialog-label kse-block" for="kse-link-address">{url}</label>' +
												'<input type="text" id="kse-link-address" class="kse-dialog-input" />' +
											'</td>' +
										'</tr>' +
										'<tr>' +
											'<td class="kse-text-right">' +
												'<a id="kse-link-test" href="#">{testLink}</a>' +
											'</td>' +
										'</tr>' +
									'</table>' +
								'</div>' +
								'<div class="kse-dialog-tab-content-inner">' +
									'<table>' +
										'<tr>' +
											'<td>' +
												'<label class="kse-dialog-label kse-block" for="kse-link-email-address">{emailAddress}</label>' +
												'<input type="text" id="kse-link-email-address" class="kse-dialog-input" />' +
											'</td>' +
										'</tr>' +
										'<tr>' +
											'<td>' +
												'<label class="kse-dialog-label kse-block" for="kse-link-email-subject">{emailSubject}</label>' +
												'<input type="text" id="kse-link-email-subject" class="kse-dialog-input" />' +
											'</td>' +
										'</tr>' +
									'</table>' +
								'</div>' +
							'</td>' +
						'</tr>' +
					'</table>' +
				'</div>';

	var contents = markup.substitute({
		url: lang.url,
		type: lang.type,
		testLink: lang.testLink,
		displayText: lang.displayText,
		emailAddress: lang.emailAddress,
		emailSubject: lang.emailSubject,
		toWebAddress: lang.toWebAddress,
		toEmailAddress: lang.toEmailAddress
	});

	// Loads the parameters in a selected link to the link dialog fields.
	var javascriptProtocolRegex = /^javascript:/, 
		emailRegex = /^mailto:([^?]+)(?:\?(.+))?$/, 
		emailSubjectRegex = /subject=([^;?:@&=$,\/]*)/, 
		emailBodyRegex = /body=([^;?:@&=$,\/]*)/, 
		anchorRegex = /^#(.*)$/, 
		urlRegex = /^((?:http|https|ftp|news):\/\/)?(.*)$/, 
		selectableTargets = /^(_(?:self|top|parent|blank))$/, 
		encodedEmailLinkRegex = /^javascript:void\(location\.href='mailto:'\+String\.fromCharCode\(([^)]+)\)(?:\+'(.*)')?\)$/, 
		functionCallProtectedEmailLinkRegex = /^javascript:([^(]+)\(([^)]+)\)$/;
	
	var parseLink = function(editor, element){
		var href = (element && (element.data('kse-saved-href') || element.getProperty('href'))) || '', 
			textView = plugin.getSelectedLinkText(editor) || '',
			javascriptMatch, emailMatch, anchorMatch, url, result = {},
			currentFocusIndex;

		if ((javascriptMatch = href.match(javascriptProtocolRegex))){
			if (emailProtection === 'encode'){
				href = href.replace(encodedEmailLinkRegex, function(match, protectedAddress, rest){
					return 'mailto:' + String.fromCharCode.apply(String, protectedAddress.split(',')) + (rest && unescapeSingleQuote(rest));
				});
			// Protected email link as function call.
			} else if (emailProtection){
				href.replace(functionCallProtectedEmailLinkRegex, function(match, name, args){
					if (name == compiledProtectionFunction.name){
						currentFocusIndex = 1;
						result.type = 'email';

						var email = {},
							paramRegex = /[^,\s]+/g, 
							paramQuoteRegex = /(^')|('$)/g, 
							paramsMatch = args.match(paramRegex), 
							paramsMatchLength = paramsMatch.length, 
							paramName, paramValue;
						
						for (var i = 0; i < paramsMatchLength; i++){
							paramValue = decodeURIComponent(unescapeSingleQuote(paramsMatch[i].replace(paramQuoteRegex, '')));
							paramName = compiledProtectionFunction.params[i].toLowerCase();
							email[paramName] = paramValue;
						}
						result.email = [email.name, email.domain].join('@');
					}
				});
			}
		}
	
		if (!result.type){
			if ((anchorMatch = href.match(anchorRegex))){
				result.type = 'anchor';
				result.anchor = {};
				result.anchor.name = result.anchor.id = anchorMatch[1];
			// Protected email link as encoded string.
			} else if ((emailMatch = href.match(emailRegex))){
				var subjectMatch = href.match(emailSubjectRegex), 
					bodyMatch = href.match(emailBodyRegex),
					address, subject, body;
				
				currentFocusIndex = 1
				result.type = 'email';
				result.email = emailMatch[1];
				subjectMatch && (result.subject = decodeURIComponent(subjectMatch[1]));
				bodyMatch && (result.body = decodeURIComponent(bodyMatch[1]));
			} else if ((url = combineURI(href))){
				result.type = 'url';
				result.url = url;
			} else result.type = 'url';
		}
		
		// Load target and popup settings.
		if (element){
			var pushAttr = function(name, prop){
				var value = element.getProperty(prop);
				if (value !== null) result[name] = value || '';
			};

			pushAttr('accessKey', 'accessKey');
			pushAttr('tabIndex', 'tabindex');
			pushAttr('target', 'target');
			pushAttr('title', 'title');
			pushAttr('rel', 'rel');
		}
		
		// Find out whether we have any anchors in the editor.
		var anchors = result.anchors = [], item, i, l;
		
		// For some browsers we set contenteditable="false" on anchors, making document.anchors not to include them, so we must traverse the links manually (#7893).
		if (plugin.emptyAnchorFix){
			var links = editor.document.find('a');
			for (i = 0, l = links.length; i < l; i++){
				item = links[i];
				if (item.data('kse-saved-name') || item.hasAttribute('name')) anchors.push({
					name: item.data('kse-saved-name') || item.getProperty('name'),
					id: item.getProperty('id')
				});
			}
		} else {
			var anchorList = new Klass.DOM.nodes(editor.document[0].anchors);
			for (i = 0, l = anchorList.length; i < l; i++){
				item = anchorList[i];
				anchors[i] = {
					name: item.getProperty('name'),
					id: item.getProperty('id')
				};
			}
		}
		
		if (plugin.fakeAnchor){
			var imgs = editor.document.find('img');
			for (i = 0, l = imgs.length; i < l; i++){
				if ((item = plugin.tryRestoreFakeAnchor(editor, imgs[i]))) anchors.push({
					name: item.getProperty('name'),
					id: item.getProperty('id')
				});
			}
		}

		// Set link text to display
		result.textView = textView;

		// Record down the selected element in the dialog.
		this.selectedElement = element;

		this.currentFocusIndex = currentFocusIndex;

		return result;
	};

	var combineURI = function(uri){
		var bits = uri && uri.match(urlRegex);
		if (!bits) return '';

		var scheme = bits[1] || 'http://', 
			url = bits[2] && bits[2].trim();

		if (url && url.indexOf('/') === -1) url += '/';

		return url ? scheme + url : '';
	};

	var emailProtection = editor.config.link.emailProtection || '';

	// Compile the protection function pattern.
	if (emailProtection && emailProtection !== 'encode'){
		var compiledProtectionFunction = {};
		
		emailProtection.replace(/^([^(]+)\(([^)]+)\)$/, function(match, name, params){
			compiledProtectionFunction.name = name;
			compiledProtectionFunction.params = [];
			params.replace(/[^,\s]+/g, function(param){
				compiledProtectionFunction.params.push(param);
			});
		});
	}

	function unescapeSingleQuote(str){
		return str.replace(/\\'/g, '\'');
	}
	
	function escapeSingleQuote(str){
		return str.replace(/'/g, '\\$&');
	}


	return {
		width: 500,
		title: lang.title,
		contents: contents,

		tabs: ['#kse-dialog-link .kse-tab', '#kse-dialog-link .kse-dialog-tab-content-inner'],

		forms: {
			'#kse-link-info': {
				name: 'textView',
				disable: function(){
					return this.value() === '*';
				}
			},
			'#kse-link-email-subject': 'subject',
			'#kse-link-address': {
				name: 'url',
				validate: {
					required: lang.emptyUrl,
					url: lang.invalidUrl
				}
			},
			'#kse-link-email-address': {
				name: 'email',
				validate: {
					required: lang.emptyEmail,
					email: lang.invalidEmail
				}
			}
		}, 

		onRender: function(){
			var element = this.toElement(),
				linkInfoHandler = element.id('kse-link-info'),
				linkAddressHandler = element.id('kse-link-address'),
				linkTestHandler = element.id('kse-link-test');

			var syncContent = function(){
				!linkInfoHandler.data('changed') && linkInfoHandler.value(this.value());
			};

			var width = 640; // 800 * 0.8.
			var height = 420; // 600 * 0.7.
			var left = 80; // (800 - 0.8 * 800) /2 = 800 * 0.1.
			
			try {
				var screen = window.screen;
				width = Math.round(screen.width * 0.8);
				height = Math.round(screen.height * 0.7);
				left = Math.round(screen.width * 0.1);
			} catch (e){}

			var params = 'toolbar=yes,location=no,scrollbars=yes,resizable=yes,width=' + width + ',height=' + height + ',left=' + left;

			linkAddressHandler.addEvents({
				'keydown': syncContent,
				'keyup': syncContent
			});

			linkInfoHandler.addEvent('keyup', function(){
				this.data('changed', this.value() ? true : null); 
			});

			linkTestHandler.addEvent('click', function(){
				var url = combineURI(linkAddressHandler.value());
				url && window.open(url, null, params);
				return false;
			});

			if (editor.config.disableLinkTabPage) this.disableTab(0);
			if (editor.config.disableEmailTabPage) this.disableTab(1);
		},

		onShow: function(){
			var element = null, 
				editor = this.toEditor(), 
				selection = editor.getSelection(),
				linkInfoHandler = this.toElement().id('kse-link-info');

			// Fill in all the relevant fields if there's already one link selected.
			if ((element = plugin.getSelectedLink(editor)) && element.hasAttribute('href')) selection.selectElement(element);
			else element = null;
			
			this.setupContent(parseLink.call(this, editor, element));

			linkInfoHandler.data('changed', linkInfoHandler.value() ? true : null); 
		},

		onOk: function(){
			var data = {},
				attributes = {}, 
				removeAttributes = [], 
				editor = this.toEditor(),
				element = this.selectedElement;

			if (!this.commitContent(data)){
				this.disabledClose = true;
				return false;
			}

			// Compose the URL.

			if (data.url){
				attributes['data-kse-saved-href'] = combineURI(data.url);
			}

			if (data.anchor){
				var name = data.anchor.name,
					id = data.anchor.id;
				attributes['data-kse-saved-href'] = '#' + (name || id || '');
			}

			if (data.email){
				var linkHref, address = data.email;
				switch (emailProtection){
					case '':

					case 'encode':
						var subject = encodeURIComponent(data.subject || ''), 
							body = encodeURIComponent(data.body || '');

						// Build the e-mail parameters first.
						var argList = [];
						subject && argList.push('subject=' + subject);
						body && argList.push('body=' + body);
						argList = argList.length ? '?' + argList.join('&') : '';
						
						if (emailProtection == 'encode'){
							linkHref = ['javascript:void(location.href=\'mailto:\'+', protectEmailAddressAsEncodedString(address)];
							// parameters are optional.
							argList && linkHref.push('+\'', escapeSingleQuote(argList), '\'');
							
							linkHref.push(')');
						} else linkHref = ['mailto:', address, argList];
						
						break;

					default:
						// Separating name and domain.
						var nameAndDomain = address.split('@', 2);
						email.name = nameAndDomain[0];
						email.domain = nameAndDomain[1];
						
						linkHref = ['javascript:', protectEmailLinkAsFunction(email)];
				}

				attributes['data-kse-saved-href'] = linkHref.join('');
			}

			// Advanced attributes.
			var pushAttr = function(name, prop){
				var value = data[name];
				if (value) attributes[prop] = value;
				else removeAttributes.push(prop);
			};
			
			pushAttr('accessKey', 'accessKey');
			pushAttr('tabIndex', 'tabindex');
			pushAttr('target', 'target');
			pushAttr('title', 'title');
			pushAttr('rel', 'rel');
			
			// Browser need the "href" fro copy/paste link to work. (#6641)
			attributes.href = attributes['data-kse-saved-href'];
			
			if (!element){
				// Create element if current selection is collapsed.
				var selection = editor.getSelection(), 
					ranges = selection.getRanges(true),
					textView = data.textView;

				if (ranges.length == 1 && ranges[0].collapsed){
					// Short mailto link text view (#5736).
					var text = new Klass.DOM.text(textView ? textView : data.type === 'email' ? data.email : attributes['data-kse-saved-href'], editor.document);
					textView = null;
					ranges[0].insertNode(text);
					ranges[0].selectNodeContents(text);
					selection.selectRanges(ranges);
				}

				// Apply style.
				var style = new local.style({
					element: 'a',
					attributes: attributes,
					replication: textView,
					type: local.$.STYLE_INLINE
				});
				style.apply(editor.document);
			} else {
				// We're only editing an existing link, so just overwrite the attributes.
				var href = element.data('kse-saved-href'), 
					textView = element.html();

				element.setProperties(attributes);
				element.removeProperties(removeAttributes);
				
				//if (data.name && plugin.synAnchorSelector) element.addClass(element.length() ? 'kse-anchor' : 'kse-anchor-empty');

				if (data.textView && textView !== data.textView){
					element.html(textView = data.textView);
				}
				
				// Update text view when user changes protocol (#4612).
				if (href == textView || data.type == 'email' && textView.indexOf('@') != -1){
					// Short mailto link text view (#5736).
					element.html(data.type == 'email' ? data.email : attributes['data-kse-saved-href']);
				}
				
				delete this.selectedElement;
			}
		}

	};

});


/**
 * The e-mail address anti-spam protection option. The protection will be
 * applied when creating or modifying e-mail links through the editor interface.<br>
 * Two methods of protection can be choosed:
 * <ol>	<li>The e-mail parts (name, domain and any other query string) are
 *			assembled into a function call pattern. Such function must be
 *			provided by the developer in the pages that will use the contents.
 *		<li>Only the e-mail address is obfuscated into a special string that
 *			has no meaning for humans or spam bots, but which is properly
 *			rendered and accepted by the browser.</li></ol>
 * Both approaches require JavaScript to be enabled.
 * @name Klass.Editor.config.link.emailProtection
 * @type String
 * @default '' (empty string = disabled)
 * @example
 * // href="mailto:tester@kseditor.com?subject=subject&body=body"
 * config.emailProtection = '';
 * @example
 * // href="<a href=\"javascript:void(location.href=\'mailto:\'+String.fromCharCode(116,101,115,116,101,114,64,99,107,101,100,105,116,111,114,46,99,111,109)+\'?subject=subject&body=body\')\">e-mail</a>"
 * config.emailProtection = 'encode';
 * @example
 * // href="javascript:mt('tester','kseditor.com','subject','body')"
 * config.emailProtection = 'mt(NAME,DOMAIN,SUBJECT,BODY)';
 */