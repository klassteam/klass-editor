/**
 * Klass Rich Text Editor v0.4
 * http://kseditor.com
 * 
 * Copyright 2011, Alex Tseng
 * Licensed under the MIT-style license.
 * http://kseditor.com/license
 */


/**
 * Constains the dictionary of language entries.
 * @namespace
 * @en English.
 */

Klass.Editor.lang['en'] = {

	// Toolbar buttons without dialogs.
	source				: 'Source',
	save				: 'Save',
	preview				: 'Preview',
	cut					: 'Cut',
	copy				: 'Copy',
	paste				: 'Paste',
	print				: 'Print',
	bold				: 'Bold',
	italic				: 'Italic',
	underline			: 'Underline',
	strike				: 'Strike Through',
	selectAll			: 'Select All',
	subscript			: 'Subscript',
	superscript			: 'Superscript',
	indent				: 'Increase Indent',
	outdent				: 'Decrease Indent',
	bulletedlist		: 'Insert/Remove Bulleted List',
	numberedlist		: 'Insert/Remove Numbered List',
	blockquote			: 'Block Quote',
	removeFormat		: 'Remove Format',
	date				: 'Insert Date',
	horizontalrule		: 'Insert Horizontal Line',
	unlink				: 'Unlink',
	undo				: 'Undo',
	redo				: 'Redo',

	// Common messages and labels.
	common: {
		upload			: 'Upload',
		button			: 'Button',
		name			: 'Name',
		ok				: 'OK',
		cancel			: 'Cancel',
		yes				: 'Yes',
		no				: 'No',
		close			: 'Close',
		preview			: 'Preview',
		general			: 'General',
		advanced		: 'Advanced',
		options			: 'Options',
		target			: 'Target',
		auto			: 'Auto',
		width			: 'Width',
		height			: 'Height',
		align			: 'Alignment',
		alignLeft		: 'Left',
		alignRight		: 'Right',
		alignCenter		: 'Center',
		alignTop		: 'Top',
		alignMiddle		: 'Middle',
		alignBottom		: 'Bottom',
		localFiles		: 'Local Files',
		webAddress		: 'Web Address',
		invalidWidth	: 'Width must be a number.',
		invalidHeight	: 'Height must be a number.',
		confirmCancel	: 'Some of the options have been changed. Are you sure you want to close the dialog?'
	},

	font: {
		label			: 'Font',
		panelTitle		: 'Font Name'
	},

	fontsize: {
		label			: 'Size',
		panelTitle		: 'Font Size'
	},

	format: {
		label			: 'Format',
		panelTitle		: 'Paragraph Format',

		tag_p			: 'Normal',
		tag_pre			: 'Formatted',
		tag_address		: 'Address',
		tag_h1			: 'Heading 1',
		tag_h2			: 'Heading 2',
		tag_h3			: 'Heading 3',
		tag_h4			: 'Heading 4',
		tag_h5			: 'Heading 5',
		tag_h6			: 'Heading 6',
		tag_div			: 'Normal(DIV)'
	},

	styles: {
		label			: 'Styles',
		panelTitle		: 'Formatting Styles',
		panelTitle1		: 'Block Styles',
		panelTitle2		: 'Inline Styles',
		panelTitle3		: 'Object Styles'
	},

	color: {
		selectColor		: 'Select Color',
		textColor		: 'Text Color',
		bgColor			: 'Background Color',
		standard		: 'Standard Colors',
		theme			: 'Theme Colors', // MISSING
		auto			: 'Automatic',
		more			: 'More Colors...'
	},

	colors: {
		'000'			: 'Black',
		'800000'		: 'Maroon',
		'8B4513'		: 'Saddle Brown',
		'2F4F4F'		: 'Dark Slate Gray',
		'008080'		: 'Teal',
		'000080'		: 'Navy',
		'4B0082'		: 'Indigo',
		'696969'		: 'Dark Gray',
		'B22222'		: 'Fire Brick',
		'A52A2A'		: 'Brown',
		'DAA520'		: 'Golden Rod',
		'006400'		: 'Dark Green',
		'40E0D0'		: 'Turquoise',
		'0000CD'		: 'Medium Blue',
		'800080'		: 'Purple',
		'808080'		: 'Gray',
		'F00'			: 'Red',
		'FF8C00'		: 'Dark Orange',
		'FFD700'		: 'Gold',
		'008000'		: 'Green',
		'0FF'			: 'Cyan',
		'00F'			: 'Blue',
		'EE82EE'		: 'Violet',
		'A9A9A9'		: 'Dim Gray',
		'FFA07A'		: 'Light Salmon',
		'FFA500'		: 'Orange',
		'FFFF00'		: 'Yellow',
		'00FF00'		: 'Lime',
		'AFEEEE'		: 'Pale Turquoise',
		'ADD8E6'		: 'Light Blue',
		'DDA0DD'		: 'Plum',
		'D3D3D3'		: 'Light Grey',
		'FFF0F5'		: 'Lavender Blush',
		'FAEBD7'		: 'Antique White',
		'FFFFE0'		: 'Light Yellow',
		'F0FFF0'		: 'Honeydew',
		'F0FFFF'		: 'Azure',
		'F0F8FF'		: 'Alice Blue',
		'E6E6FA'		: 'Lavender',
		'FFF'			: 'White'
	},

	justify: {
		left			: 'Left Justify',
		center			: 'Center Justify',
		right			: 'Right Justify',
		block			: 'Block Justify'
	},

	// Link dialog.
	link: {
		label			: 'Link',
		toolbar			: 'Link',
		menu			: 'Edit Link',
		title			: 'Link',
		info			: 'Link Info',
		type			: 'Link Type',
		url				: 'URL for the link',
		displayText		: 'Text to display',
		emailAddress	: 'Email address for the link',
		emailSubject	: 'Message Subject',
		toWebAddress	: 'Web Address',
		toEmailAddress	: 'Email Address',
		testLink		: 'Test the link',
		emptyEmail		: 'Please input e-mail address.',
		emptyUrl		: 'Please input link URL.',
		invalidEmail	: 'Please input correct e-mail address.',
		invalidUrl		: 'Please input correct link URL.'
	},

	image: {
		label			: 'Image',
		title			: 'Image Properties',
		menu			: 'Image Properties',
		url				: 'Paste Image URL',
		alt				: 'Alternative Text',
		emptyUrl		: 'Please input image URL.',
		invalidUrl		: 'Please input correct image URL.',
		limitQueueDesc	: 'You can only upload <strong>%d</strong> images at one time',
		description		: 'If the URL you entered was correct, you can preview the pictures here.<br />Large images may take a few minutes to upload.'
	},

	flash: {
		label			: 'Flash',
		properties		: 'Flash Properties',
		title			: 'Flash Properties',
		url				: '来源地址',
		loop			: '循环',
		autoplay		: '自动播放',
		size			: 'Flash 尺寸',
		width			: 'Width',
		height			: 'Height',
		custom			: '自定义'
	},

	video: {
		label			: '视频',
		title			: '标题',
		url				: '来源地址',
		loop			: '循环',
		autoplay		: '自动播放',
		width			: '宽度',
		height			: '高度'
	},

	filebrowser: {
		image			: 'Image Browser'
	},

	fileupload: {
		success			: 'Files uploaded successfully.',
		failure			: 'Files failed to upload.',
		timeout			: 'Upload timed out.',
		reupload		: 'Upload again',
		wait			: 'File Uploading',
		start			: 'Start uploading',
		stop			: 'Stop uploading',
		selectFile		: 'Select Files',
		largeFile		: 'The file is too large.',
		invalidFile		: 'Invalid file.',
		invalidFileType	: 'Invalid file type.',
		dragdrop		: 'You can drag the images to this area to upload directly.',
		size			: 'Size Supported',
		format			: 'Format Supported',
		confirmCancel	: 'Some of the files have not been uploaded. Are you sure to close the dialog?',
		serverFailure	: 'Upload service is temporarily unavailable, please try again later!',
		successAndSort	: 'Uploading has been successful. You can change the file order by dragging.',
		lastQueueDesc	: 'You still have <strong></strong> uploads pending from last time. Do you want to <a href="#">continue uploading</a> or <a href="#">clear these files</a>？',
		uncertainError	: 'Uploading failed. Please select the correct file.',
		limitQueueError	: 'Upload limit exceeded: You can only upload %d files at one time.',
		fileSizeError	: 'The file is too large: Please upload a file that is less than %d.',
		fileTypeError	: 'Invalid file type: Only %d is supported.'
	},

	smiley: {
		toolbar			: 'Smiley',
		title			: 'Insert a Smiley'
	},

	widget: {
		toolbar			: 'Insert Document Widget',
		label			: 'Insert Document Widget',
		title			: 'Document Widget',
		emptyList		: '(No widgets defined)'
	},

	pseudos: {
		anchor			: 'Anchor',
		flash			: 'Flash Animation',
		iframe			: 'IFrame',
		widget			: 'Document Widget',
		unknown			: 'Unknown Object'
	},

	clipboard: {
		title			: 'Paste',
		cutError		: 'Your browser security settings don\'t permit the editor to automatically execute cutting operations. Please use the keyboard for that (Windows: Ctrl+X/Mac: Cmd+X).',
		copyError		: 'Your browser security settings don\'t permit the editor to automatically execute copying operations. Please use the keyboard for that (Windows: Ctrl+C/Mac: Cmd+C).',
		pasteMsg		: 'Please paste inside the following box using the keyboard (<strong>Windows: Ctrl+V/Mac: Cmd+V</strong>) and hit OK',
		securityMsg		: 'Because of your browser security settings, the editor is not able to access your clipboard data directly. You are required to paste it again in this window.',
		pasteArea		: 'Paste Area'
	},

	pasteText			: 'Paste as plain text',

	pastefromword: {
		label			: 'Paste from Word',
		error			: 'It was not possible to clean up the pasted data due to an internal error',
		cleanup			: 'The text you want to paste seems to be copied from Word. Do you want to clean it before pasting?'
	},

	maximize			: 'Maximize',
	restore				: 'Restore',

	elementspath		: '%1 element',
	wordcount			: '还可以输入<em>{number}</em>字',

	toolbar: {
		collapse		: 'Collapse Toolbar',
		expand			: 'Expand Toolbar'
	},

	resize: {
		drop			: 'Drag to resize',
		larger			: '增大编辑区域',
		smaller			: '减小编辑区域'
	}

};