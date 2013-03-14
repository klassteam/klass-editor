Klass.Editor.dialog.add('image', function(editor){

	var lang = editor.lang.image,
		common = editor.lang.common,
		fileupload = editor.lang.fileupload,
		config = editor.config,
		imageConfig = config.image,
		sizeRegex = /^\s*(\d+)((px)|\%)?\s*$/i,
		sizeOrEmptyRegex = /(^\s*(\d+)((px)|\%)?\s*$)|^$/i,
		document = Klass.Editor.document;

	var markup = '<div id="kse-dialog-image" class="kse-dialog-image">' +
					'<table cellspacing="0">' +
						'<tr>' +
							'<td class="kse-dialog-tab-bar">' +
								'<div class="kse-tab-bar">' +
									'<div class="kse-tab">{localFiles}</div>' +
									'<div class="kse-tab">{webAddress}</div>' +
								'</div>' +
							'</td>' +
							'<td class="kse-dialog-tab-content">' +
								'<div id="kse-image-upload" class="kse-dialog-tab-content-inner kse-image-upload">' +
									'<div id="kse-image-upload-container" class="kse-image-upload-container">' +
										'<div id="kse-image-upload-dropzone" class="kse-image-upload-dropzone">' +
											'<input id="kse-image-upload-handler" type="button" value="{selectFile}" />' +
											'<p id="kse-image-last-queue-desc" class="kse-hide">{lastUploadQueueDesc}</p>' +
											'<p id="kse-image-dropupload-desc">{dropUpload}</p>' +
											'<p id="kse-image-limit-queue-desc"></p>' +
											'<dl class="kse-explain">' +
												'<dt>{format}</dt>' +
												'<dd>{allowedExtensions}</dd>' +
											'</dl>' +
											'<dl class="kse-explain">' +
												'<dt>{size}</dt>' +
												'<dd>{maxSize}</dd>' +
											'</dl>' +
										'</div>' +
									'</div>' +
									'<div id="kse-image-upload-panel" class="kse-image-upload-panel kse-hide">' +
										'<ul id="kse-image-upload-list">' +
											'<li></li>' +
											'<li></li>' +
											'<li></li>' +
											'<li></li>' +
											'<li></li>' +
											'<li></li>' +
											'<li></li>' +
											'<li></li>' +
										'</ul>' +
									'</div>' +
									'<div id="kse-image-upload-progress" class="kse-image-upload-progress kse-hide"></div>' +
								'</div>' +
								'<div class="kse-dialog-tab-content-inner">' +
									'<table class="kse-image-url-view">' +
										'<tr>' +
											'<td>' +
												'<label for="kse-image-url" style="width:120px;">{url}</label>' +
												'<input type="text" id="kse-image-url" class="kse-dialog-input" style="width:400px;" />' +
											'</td>' +
										'</tr>' +
										'<tr>' +
											'<td>' +
												'<label for="kse-image-width" style="width:120px;">{width}</label>' +
												'<input type="text" id="kse-image-width" class="kse-dialog-input" style="width:60px;" />' +
												'<label for="kse-image-height" style="width: 45px;">{height}</label>' +
												'<input type="text" id="kse-image-height" class="kse-dialog-input" style="width:60px;" />' +
												'<label for="kse-image-align">{align}</label>' +
												'<select id="kse-image-align">' +
													'<option value="">{auto}</option>' +
													'<option value="left">{alignLeft}</option>' +
													'<option value="right">{alignRight}</option>' +
												'</select>' +
											'</td>' +
										'</tr>' +
										'<tr>' +
											'<td>' +
												'<div class="kse-image-preview-area">' +
													'<table>' +
														'<tr>' +
															'<td class="kse-explain">' +
																'<div id="kse-image-preview-loader" class="kse-spinner"></div>' +
																'<img id="kse-image-preview-container" />' +
																'<div id="kse-image-preview-description">{description}</div>' +
															'</td>' +
														'</tr>' +
													'</table>' +
												'</div>' +
											'</td>' +
										'</tr>' +
									'</table>' +
								'</div>' +
							'</td>' +
						'</tr>' +
					'</table>' +
				'</div>';

	var imageAllowedExtensions = imageConfig.allowedExtensions || config.fileAllowedExtensions || '*';
	var formatImageAllowedExtensions = imageAllowedExtensions.replace(/(\s*),(\s*)/g, ', ').toUpperCase();
	var imageMaxSize = imageConfig.maxSize || config.fileMaxSize || 0;
	var formatImageMaxSize = imageMaxSize.toUpperCase();

	var contents = markup.substitute({
		url: lang.url,
		upload: common.upload,
		width: common.width,
		height: common.height,
		auto: common.auto,
		align: common.align,
		alignLeft: common.alignLeft,
		alignRight: common.alignRight,
		localFiles: common.localFiles,
		webAddress: common.webAddress,
		format: fileupload.format,
		size: fileupload.size,
		dropUpload: fileupload.dragdrop,
		selectFile: fileupload.selectFile,
		lastUploadQueueDesc: fileupload.lastQueueDesc,
		description: lang.description,
		maxSize: imageMaxSize.toUpperCase(),
		allowedExtensions: imageAllowedExtensions.replace(/(\s*),(\s*)/g, ', ').toUpperCase()
	});

	var imagePreviewLoader,
		imagePreviewContainer,
		imagePreviewDescription,
		imageField,
		widthField,
		heightField;

	var imageUploadContainer,
		imageUploadPanel,
		imageUploadProgress, 
		sandboxUpload;

	var getPreviewElement = function(id){
		return document.get('kse-image-preview-' + id);
	};

	var getUploadElement = function(id){
		return document.get('kse-image-upload-' + id);
	};

	var onImgLoadEvent = function(){
		// Image is ready.
		this.originalElement.store('isReady', true);

		// Show preview image.
		showPreviewContainer();

		// New image -> new domensions
		if (!this.dontResetSize) resetDimension(this);
		else updatePreview(this);

		this.enableButton('ok');

		this.dontResetSize = false;
	};

	var onImgLoadErrorEvent = function(){
		// Error. Image is not loaded.
		this.originalElement.store('isReady', false);

		// Fixing IE9 BUG.
		// When the pictures fail to load, the additional width height values ​​of the error.
		// And will not be loaded successfully by the new value coverage.
		this.originalElement.removeProperties('src', 'width', 'height');

		this.disableButton('ok');
		
		// Hide loader & show description
		showPreviewDescription();
	};

	var onImageSizeChange = function(){
		updatePreview(this);
	};

	var showElement = function(element){
		return element && element.show();
	};

	var hideElement = function(element){
		return element && element.hide();
	};

	function showPreviewLoader(){
		showElement(imagePreviewLoader);
		hideElement(imagePreviewContainer);
		hideElement(imagePreviewDescription);
	}

	function showPreviewContainer(){
		hideElement(imagePreviewLoader);
		showElement(imagePreviewContainer);
		hideElement(imagePreviewDescription);
	}

	function showPreviewDescription(){
		hideElement(imagePreviewLoader);
		hideElement(imagePreviewContainer);
		showElement(imagePreviewDescription);
	}

	function checkDimension(size, value){
		var match = String(size).match(sizeRegex);
		if (match) {
			// % is allowed.
			if (match[2] === '%'){
				match[1] += '%';
				//switchLockRatio(dialog, false); // Unlock ratio
			}
			return match[1];
		}
		return value;
	}

	function unityDimension(size){
		var match = String(size).match(sizeRegex);
		if (match){
			if (match[2] === '%'){
				return match[1] / 100;
			}
		}
		return size;
	}

	function getDimension(element, name){
		var size = element.getProperty(name), value = '';
		if (size) value = checkDimension(size, value);
		return checkDimension(element.style(name), value);
	}

	function resetDimension(dialog){
		var original = dialog.originalElement;
		if (original.retrieve('isReady')){
			widthField && widthField.value(original[0].width);
			heightField && heightField.value(original[0].height);
		}
		updatePreview(dialog);
	}

	function updatePreview(dialog){
		//Don't load before onShow.
		if (!dialog.originalElement || !imagePreviewContainer) return 1;
		
		// Read attributes and update imagePreview;
		var src = dialog.originalElement.getProperty('src');

		setTimeout(function(){
			zoomPreviewImage(dialog);

			imagePreviewContainer.setProperties({
				alt: '',
				src: src
			});
		}, 0);

		//dialog.commitContent(PREVIEW, dialog.preview);
		return 0;
	}

	function zoomPreviewImage(dialog){
		var original = dialog.originalElement[0], 
			preview = imagePreviewContainer,
			size = computeImageFitDimensions(original, preview.parent());

		if (size) preview.setProperties(size);
	}

	function computeImageFitDimensions(image, container){
		var size = container.getSize(),
			sw = container.style('width').toInt(),
			sh = container.style('height').toInt(),
			fw = widthField && widthField.value(),
			fh = heightField && heightField.value(),
			iw = unityDimension(fw || image.width),
			ih = unityDimension(fh || image.height),
			height, width;

		sw = isNaN(sw) ? 0 : sw;
		sh = isNaN(sh) ? 0 : sh;

		size.x = sw ? Math.min(size.x, sw) : size.x;
		size.y = sh ? Math.min(size.y, sh) : size.y;

		iwidth = iw < 1 ? size.x * iw : iw;
		iheight = ih < 1 ? size.y * ih : ih;

		if (iwidth > 0 && iheight > 0){
			if (iwidth / iheight >= size.x / size.y){
				if (iwidth > size.x) {
					width = size.x;
					height = (iheight * size.x) / iwidth;
				} else {
					width = iwidth;
					height = iheight;
				}
			} else {
				if (iheight > size.y) {
					height = size.y;
					width = (iwidth * size.y) / iheight;
				} else {
					width = iwidth;
					height = iheight;
				}
			}

			return {
				width: width,
				height: height
			};
		}
		return null;
	}

	function showUploadContainer(){
		showElement(imageUploadContainer);
		hideElement(imageUploadProgress);
		hideElement(imageUploadPanel);
		restoreUploadWrapper();
	}

	function showUploadProgress(){
		hideElement(imageUploadContainer);
		showElement(imageUploadProgress);
		hideElement(imageUploadPanel);
		hijackUploadWrapper();
	}

	function showUploadPanel(){
		hideElement(imageUploadContainer);
		hideElement(imageUploadProgress);
		showElement(imageUploadPanel);
		hijackUploadWrapper();
	}

	function hijackUploadWrapper(){
		sandboxUpload && sandboxUpload.store('kse-upload-sandbox-style', sandboxUpload.getProperty('style')).styles({
			top: -9999,
			left: -9999
		});
	}

	function restoreUploadWrapper(){
		if (sandboxUpload){
			original = sandboxUpload.retrieve('kse-upload-sandbox-style', null);
			original && sandboxUpload.eliminate('kse-upload-sandbox-style').setProperty('style', original);
		}
	}

	function cleanUploadPanel(){
		var items = imageUploadPanel.find('li');
		for (var i = 0, l = items.length; i < l; i++){
			var item = items[i];
			item.find('img').each(function(img){
				img.destroy();
			});
			item.erase('id').erase('class').empty();
		}
		imageUploadProgress.empty().removeClass('kse-spinner').removeClass('kse-progress');
		showUploadContainer();
	}

	var $KU = Klass.Uploader, 
		lastUploadQueueFiles = [];

	function savedUploadQueue(up){
		var files = up.files;
		for (var file, l = files.length, i = l - 1; i >=0; i--){
			if ((file = files[i]) && file.status === $KU.QUEUED) lastUploadQueueFiles.include(file);
		}
	}

	function cleanUploadQueue(up){
		var files = lastUploadQueueFiles;
		for (var l = files.length, i = l - 1; i >=0; i--){
			files[i].status = $KU.FAILED;
		}
		up.fireEvent('queueChanged');
		lastUploadQueueFiles.empty();
	}

	return {
		width: 750,
		title: lang.title,
		contents: contents,

		tabs: ['#kse-dialog-image .kse-tab', '#kse-dialog-image .kse-dialog-tab-content-inner'],

		forms: {
			'#kse-image-url': {
				name: 'src',
				validate: {
					required: lang.emptyUrl,
					url: lang.invalidUrl
				}
			},
			'#kse-image-width': {
				name: 'width',
				validate: function(){
					var match = this.value().match(sizeOrEmptyRegex),
						isValid = !!(match && parseInt(match[1], 10) !== 0);
					return isValid ? true : common.invalidWidth;
				}
			},
			'#kse-image-height': {
				name: 'height',
				validate: function(){
					var match = this.value().match(sizeOrEmptyRegex),
						isValid = !!(match && parseInt(match[1], 10) !== 0);
					return isValid ? true : common.invalidHeight;
				}
			},
			'#kse-image-align': 'align'
		},

		onRender: function(){
			var self = this, editor = this.toEditor(),
				element = this.toElement();

			widthField = element.id('kse-image-width');
			widthField && widthField.addEvent('change', onImageSizeChange.bind(this));

			heightField = element.id('kse-image-height');
			heightField && heightField.addEvent('change', onImageSizeChange.bind(this));

			imageField = element.id('kse-image-url');
			imageField && imageField.addEvent('change', function(){
				var url = this.value();
				if (url.length){
					showPreviewLoader();
					self.originalElement.setProperty('src', url);
				} else self.disableButton('ok');
			});

			imagePreviewLoader = getPreviewElement('loader');
			imagePreviewContainer = getPreviewElement('container');
			imagePreviewDescription = getPreviewElement('description');
			showPreviewDescription();

			imageUploadContainer = getUploadElement('container');
			imageUploadProgress = getUploadElement('progress');
			imageUploadPanel = getUploadElement('panel');


			var dom = Klass.DOM;

			var sortables = new Klass.ui.Sortables('#kse-image-upload-list', {
				clone: true,
				onStart: function(element, shadow){
					element = new dom.element(element);
					shadow = new dom.element(shadow, {'class': 'kse-move-shadow'});

					var backgroundColor = element.style('background-color');
					if (backgroundColor === 'transparent') backgroundColor = '#FFF';
					shadow.styles({
						color: backgroundColor,
						backgroundColor: backgroundColor
					});

					var img = element.find('img')[0];

					element.addClass('kse-move-place');
					element.store('kse-sortables-contents', img ? img : element.html());
					img ? img.hide() : element.empty();
				},
				onComplete: function(element){
					element = new dom.element(element);

					var img, contents = element.retrieve('kse-sortables-contents', null);
					if (!contents) return;
					else if (typeof contents !== 'string') img = contents;

					element.eliminate('kse-sortables-content');
					element.removeProperty('style').removeClass('kse-move-place');
					img ? img.show() : element.html(contents);
					self.cacheImages = this.serialize(function(element){
						var img = element.getElementsByTagName('img')[0];
						return img ? img.getAttribute('src') : null;
					}).clean();
				}
			});


			var imageUploadURL = imageConfig.uploadURL || config.fileUploadURL;
			var imageUploadSettings = imageConfig.uploadSettings || config.fileUploadSettings || {};
			var maxUploadQueued = imageUploadPanel.find('li').length;
			var sortablesItems;

			sandboxUpload = new dom.element('div', {
				'class': 'kse-upload-sandbox',
				'styles': {
					position: 'absolute',
					zIndex: editor.baseZIndex('OVERLAY') + 10
				}
			}).appendTo(document.body());

			this.cacheImages = [];

			var $ = Klass.Editor.constants,
				prohibitCloseDialog;

			var imageUploader = new Klass.Uploader(Object.append(imageUploadSettings, {

				runtimes: 'html5,flash,silverlight,html4',
				selectElement: 'kse-image-upload-handler',
				dropElement: 'kse-image-upload-dropzone',
				max_file_size: imageMaxSize,
				maxQueued: maxUploadQueued,
				container: sandboxUpload,
				url: imageUploadURL,
				filters: [
					{title: 'Image files', extensions: imageAllowedExtensions}
				],

				onStart: function(){
					// Empty the sorted list.
					if (!sortablesItems){
						sortablesItems = [];
						imageUploadPanel.find('li').each(function(element){
							sortablesItems.push(element[0]);
						});
					}
					sortables.removeItems(sortablesItems);

					prohibitCloseDialog = true;
					self.disableButton('ok');
				},

				onFilesAdded: function(files){
					var failed, queued = this.total.queued;
					for (var i = 0; i < files.length; i++){
						if (files[i].status === $KU.FAILED){
							failed = true;
							break;
						}
					}
					if (!failed && queued) self.handleTooltip();
					cleanUploadQueue(this);
				},

				onQueueChanged: function(){
					var total = this.total,
						files = total.files,
						queued = total.queued;

					if (queued > 1){
						var items = imageUploadPanel.find('li');
						for (var i = 0; i < queued; i++){
							items[i] && items[i].addClass('kse-spinner').setProperty('id', files[i].id);
						}
						showUploadPanel();
					} else if (queued === 1) showUploadProgress();

					if (queued) this.start();
				},

				onFailed: function(data){
					data = data || {};
					var code = data.code || 0,
						file = data.file,
						message, internal;
					switch (code){
						case $KU.QUEUE_ERROR:
							message = fileupload.limitQueueError.replace(/%d/, maxUploadQueued);
							break;
						case $KU.FILE_SIZE_ERROR:
							message = fileupload.fileSizeError.replace(/%d/, formatImageMaxSize);
							break;
						case $KU.FILE_EXTENSION_ERROR:
							message = fileupload.fileTypeError.replace(/%d/, formatImageAllowedExtensions);
							break;
						case $KU.SECURITY_ERROR:
							message = fileupload.invalidFile;
							internal = 1;
							break;
						case $KU.IMAGE_FORMAT_ERROR:
						case $KU.IMAGE_MEMORY_ERROR:
						case $KU.IMAGE_DIMENSIONS_ERROR:
							message = fileupload.invalidFileType;
							internal = 1;
							break;
						case $KU.INIT_ERROR:
						case $KU.HTTP_ERROR: 
							message = fileupload.serverFailure;
							break;
						case $KU.IO_ERROR:
							message = fileupload.timeout;
							break;
						default:
							message = fileupload.uncertainError;
							break;
					}

					if (internal && file){
						var wrap = document.get(file.id);
						if (wrap){
							wrap.erase('class').addClass('kse-stress').html(message);
							self.cacheImages.push(null);
							return;
						}
					}

					self.handleTooltip(message || data.message);
					showUploadContainer();
					this.refresh();
				}

			}));

			var imageUploadEvents = {

				progress: function(file){
					var container = document.get(file.id) || imageUploadProgress;
					container && container.swapClass('kse-spinner', 'kse-progress').html(file.percent + '%');
				},

				beforeUpload: function(file){
					var container = document.get(file.id) || imageUploadProgress;
					container && container.swapClass('kse-spinner', 'kse-progress').html('0%');
				},

				fileUploaded: function(result){
					var res = result.response && JSON.decode(result.response);
					if (res){
						var doc = document,
							wrap = doc.get(result.file.id),
							code = res.code && res.code.toInt(),
							url = res.url, img;
						if (wrap){
							wrap.erase('class').empty();
							if (url){
								img = doc.createElement('img', {
									src: url, 
									alt: '', 
									events: {
										load: function(){
											var size = computeImageFitDimensions(this, wrap);
											if (size){
												this.setAttribute('width', size.width);
												this.setAttribute('height', size.height);
											}
											Klass.event.removeEvents(this);
										},
										error: function(){
											wrap.addClass('kse-stress').html(fileupload.invalidFile);
											Klass.event.removeEvents(this);
										}
									}
								});
								wrap.append(img);
								sortables.addItems(wrap.addClass('kse-move')[0]);
								img = null;
							}
							if (code){
								var message;
								switch (code){
									case $.ERROR_SECURITY:
										message = fileupload.invalidFile;
										break;
									case $.ERROR_FILE_TYPE:
										message = fileupload.invalidFileType;
										break;
									case $.ERROR_FILE_SIZE:
										message = fileupload.largeFile;
										break;
									case $.ERROR_GENERIC:
										message = fileupload.timeout;
										break;
									default:
										message = fileupload.failure;
										break;
								}
								wrap.addClass('kse-stress').html(message);
							}
						}
						url && self.cacheImages.push(url);
					}
				},
				
				complete: function(){
					var items = self.cacheImages, 
						imageItems = items.clean(),
						invalid = !(items.length && imageItems.length);
						single = imageItems.length === 1;

					prohibitCloseDialog = false;

					if (invalid){
						 self.cacheImages.empty();
						 invalid && this.fireEvent('failed');
						 return;
					} else self.cacheImages = imageItems;

					if (!single){
						self.handleTooltip(fileupload.successAndSort, $.TIP_TYPE_SUCCESS);
						self.enableButton('ok');
					} else self.fireEvent('ok').close();
				}
			
			};

			if (!imageUploader.features.dragdrop){
				document.get('kse-image-dropupload-desc').empty();
			}

			document.get('kse-image-limit-queue-desc').html(lang.limitQueueDesc.replace(/%d/, imageUploader.features.multiple ? maxUploadQueued : 1));

			var lastUploadQueueDesc = document.get('kse-image-last-queue-desc');
			var lastUploadQueueHandlers = lastUploadQueueDesc.find('a');

			// Continue upload
			lastUploadQueueHandlers[0].addEvent('click', function(){
				imageUploader.fireEvent('queueChanged');
				lastUploadQueueFiles.empty();
				return false;
			});

			// Clear lasted upload queue
			lastUploadQueueHandlers[1].addEvent('click', function(){
				cleanUploadQueue(imageUploader);
				lastUploadQueueDesc.hide();
				return false;
			});

			this.addEvents({
				afterShow: function(){
					this.disableButton('ok');
					imageField && imageField.fireEvent('change');

					var queued = lastUploadQueueFiles.length;
					if (queued) lastUploadQueueDesc.show().find('strong')[0].html(queued);
					restoreUploadWrapper();
					imageUploader.addEvents(imageUploadEvents);
					imageUploader.refresh();
				},
				afterHide: function(){
					hijackUploadWrapper();
				},
				beforeHide: function(){
					prohibitCloseDialog = null;

					// Forced stop upload.
					imageUploader.stop();
					imageUploader.removeEvents(imageUploadEvents);
					savedUploadQueue(imageUploader);

					lastUploadQueueDesc.hide();
				},
				beforeClose: function(){
					this.prohibitClose = prohibitCloseDialog && !confirm(fileupload.confirmCancel);
				},
				toggleTabPage: function(){
					this.enableButton('ok');

					// Upload
					if (this.isCurrentTabPage(0)){
						if (prohibitCloseDialog !== false) this.disableButton('ok');
						restoreUploadWrapper();
					}

					// Web URL
					if (this.isCurrentTabPage(1)){
						delete this.prohibitClose;
						hijackUploadWrapper();
						imageField && !imageField.value() && imageField.fireEvent('change');
					}
				}
			});
		},
		
		onShow: function(){
			var editor = this.toEditor(),
				selection = editor.getSelection(),
				element = selection.getSelectedElement(),
				link = element && element.getAscendant('a');

			this.linkElement = null;
			this.imageElement = null;
			this.dontResetSize = false;

			this.disableButton('ok');

			// Copy of the image
			this.originalElement = editor.document.createElement('img', {
				alt: '',
				events: {
					load: onImgLoadEvent.bind(this),
					error: onImgLoadErrorEvent.bind(this),
					abort: onImgLoadErrorEvent.bind(this)
				}
			});

			if (link){
				this.linkElement = link;

				// Look for Image element.
				var linkChildren = link.children();
				if (linkChildren.length === 1){
					var child = linkChildren[0];
					if (child.is('img')) this.imageElement = child;
				}
			}

			if (element && element.is('img') && !element.data('kse-realelement')) this.imageElement = element;

			if (this.imageElement){
				this.cleanImageElement = this.imageElement;
				this.imageElement = this.cleanImageElement.clone(true, true);
				this.setupContent({
					src: element.getProperty('src'),
					align: element.getProperty('align'),
					width: getDimension(element, 'width'),
					height: getDimension(element, 'height')
				});
				this.dontResetSize = true;
				this.currentFocusIndex = 1;
			} else this.imageElement = editor.document.createElement('img');
		},

		onHide: function(){
			if (this.originalElement){
				this.originalElement.removeEvents({
					'load': onImgLoadEvent.bind(this),
					'error': onImgLoadErrorEvent.bind(this),
					'abort': onImgLoadErrorEvent.bind(this)
				}).dispose();
				this.originalElement = null;
			}

			showPreviewDescription();
			cleanUploadPanel();
			
			this.cacheImages = [];

			delete this.linkElement;
			delete this.imageElement;
			delete this.cleanImageElement;
		},

		onOk: function(){
			var data = {},
				editor = this.toEditor(), 
				img = this.cleanImageElement || this.imageElement,
				imgs = this.cacheImages, i = 0, l = imgs && imgs.length;

			if (imgs && l && this.isCurrentTabPage(0)){
				for (; i < l; i++){
					if (!imgs[i]) continue;
					if (!img) img = editor.document.createElement('img');
					editor.insertElement(img.setProperties({
						src: imgs[i],
						alt: ''
					}));
					img = null;
				}
				return;
			}

			if (!this.commitContent(data)){
				this.disabledClose = true; 
				return false;
			}

			if (!data.src) return;

			if (!this.cleanImageElement) img.setProperty('alt', '');
			if (this.linkElement) editor.getSelection().selectElement(this.linkElement);

			editor.insertElement(img.setProperties(data));
		}
	
	};

});