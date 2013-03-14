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
 * @zh Chinese Traditional.
 */

Klass.Editor.lang['zh'] = {

	// Toolbar buttons without dialogs.
	source				: '原始碼',
	save				: '保存',
	preview				: '預覽',
	cut					: '剪下',
	copy				: '複製',
	paste				: '貼上',
	print				: '列印',
	bold				: '粗體',
	italic				: '斜體',
	underline			: '底線',
	strike				: '删除線',
	selectAll			: '全選',
	subscript			: '下標',
	superscript			: '上標',
	indent				: '增加縮排',
	outdent				: '减少縮排',
	bulletedlist		: '項目清單',
	numberedlist		: '編號清單',
	blockquote			: '块引用',
	removeFormat		: '清除格式',
	date				: '插入日期',
	horizontalrule		: '插入水平线',
	unlink				: '移除超連結',
	undo				: '復原',
	redo				: '重複',

	// Common messages and labels.
	common: {
		upload			: '上傳',
		button			: '按鈕',
		name			: '名稱',
		ok				: '確定',
		cancel			: '取消',
		yes				: '是',
		no				: '否',
		close			: '关闭', // MISSING
		preview			: '預覽',
		general			: '一般',
		advanced		: '進階',
		options			: '选项', // MISSING
		target			: '目标窗口', // MISSING
		auto			: '自动', // MISSING
		width			: '寬度',
		height			: '高度',
		align			: '對齊',
		alignLeft		: '靠左對齊',
		alignRight		: '靠右對齊',
		alignCenter		: '置中',
		alignTop		: '靠上對齊',
		alignMiddle		: '置中對齊',
		alignBottom		: '靠下對齊',
		localFiles		: '本地文件',
		webAddress		: '網絡地址',
		invalidWidth	: '寬度必須為數字格式',
		invalidHeight	: '高度必須為數字格式',
		confirmCancel	: '部份選項尚未儲存，要關閉對話盒？'
	},

	font: {
		label			: '字體',
		panelTitle		: '字體'
	},

	fontsize: {
		label			: '大小',
		panelTitle		: '大小'
	},

	format: {
		label			: '格式',
		panelTitle		: '格式',

		tag_p			: '一般',
		tag_pre			: '已格式化',
		tag_address		: '位址',
		tag_h1			: '標題 1',
		tag_h2			: '標題 2',
		tag_h3			: '標題 3',
		tag_h4			: '標題 4',
		tag_h5			: '標題 5',
		tag_h6			: '標題 6',
		tag_div			: '一般(DIV)'
	},

	styles: {
		label			: '样式',
		panelTitle		: '样式',
		panelTitle1		: '块级元素样式',
		panelTitle2		: '内联元素样式',
		panelTitle3		: '对象元素样式'
	},

	color: {
		selectColor		: '選擇顏色',
		textColor		: '文字顏色',
		bgColor			: '背景顏色',
		standard		: '標準色',
		theme			: '主題顏色',
		auto			: '自動',
		more			: '更多顏色…'
	},

	colors: {
		'000'			: '黑',
		'800000'		: '褐红',
		'8B4513'		: '深褐',
		'2F4F4F'		: '墨绿',
		'008080'		: '绿松石',
		'000080'		: '海军蓝',
		'4B0082'		: '靛蓝',
		'696969'		: '暗灰',
		'B22222'		: '砖红',
		'A52A2A'		: '褐',
		'DAA520'		: '金黄',
		'006400'		: '深绿',
		'40E0D0'		: '蓝绿',
		'0000CD'		: '中蓝',
		'800080'		: '紫',
		'808080'		: '灰',
		'F00'			: '红',
		'FF8C00'		: '深橙',
		'FFD700'		: '金',
		'008000'		: '绿',
		'0FF'			: '青',
		'00F'			: '蓝',
		'EE82EE'		: '紫罗兰',
		'A9A9A9'		: '深灰',
		'FFA07A'		: '亮橙',
		'FFA500'		: '橙',
		'FFFF00'		: '黄',
		'00FF00'		: '水绿',
		'AFEEEE'		: '粉蓝',
		'ADD8E6'		: '亮蓝',
		'DDA0DD'		: '梅红',
		'D3D3D3'		: '淡灰',
		'FFF0F5'		: '淡紫红',
		'FAEBD7'		: '古董白',
		'FFFFE0'		: '淡黄',
		'F0FFF0'		: '蜜白',
		'F0FFFF'		: '天蓝',
		'F0F8FF'		: '淡蓝',
		'E6E6FA'		: '淡紫',
		'FFF'			: '白'
	},

	justify: {
		left			: '靠左對齊',
		center			: '置中',
		right			: '靠右對齊',
		block			: '左右對齊'
	},

	// Link dialog.
	link: {
		label			: '插入/編輯超連結',
		toolbar			: '插入/編輯超連結',
		menu			: '編輯超連結',
		title			: '超連結',
		info			: '超連結資訊',
		type			: '超連接類型',
		url				: '網站的連結地址',
		displayText		: '要顯示的文本',
		emailAddress	: '電子郵件連結地址',
		emailSubject	: '電子郵件主旨',
		toWebAddress	: '網站連結', // MISSING
		toEmailAddress	: '電子郵件位址',
		testLink		: '測試鏈接', // MISSING
		emptyEmail		: '請輸入電子郵件位址',
		emptyUrl		: '請輸入欲連結的 URL',
		invalidEmail	: '請輸入準確的電子郵件位址',
		invalidUrl		: '請準確輸入欲連結的 URL'
	},

	image: {
		label			: '图像',
		title			: '图像属性',
		menu			: '图像属性',
		url				: '在此處粘帖圖片網址',
		alt				: '替代文字',
		emptyUrl		: '請輸入影像 URL',
		invalidUrl		: '請輸入準確的影像 URL',
		limitQueueDesc	: '每次最多可以上传<strong>%d</strong>张图片',
		description		: '如果您輸入的網址正確，則可以在此處預覽效果。<br />對於大圖片，可能需要幾分鐘才能顯示出來。'
	},

	flash: {
		label			: 'Flash',
		properties		: 'Flash 属性',
		title			: '标题',
		url				: '来源地址',
		loop			: '循环',
		autoplay		: '自动播放',
		size			: 'Flash 尺寸',
		width			: '宽度',
		height			: '高度',
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
		image			: '圖片瀏覽器'
	},

	fileupload: {
		success			: '上載成功',
		failure			: '上載失敗',
		timeout			: '上載超時',
		reupload		: '重新上載',
		wait			: '等待上載',
		start			: '開始上載',
		stop			: '停止上載',
		selectFile		: '選擇文件',
		largeFile		: '文件过大',
		invalidFile		: '无效的文件',
		invalidFileType	: '无效的文件类型',
		dragdrop		: '拖動圖片至虛線框內即可直接上載',
		size			: '支持上載的文件大小',
		format			: '支持上載的文件格式',
		confirmCancel	: '部分文件尚未上載，要關閉對話盒?',
		serverFailure	: '上載服務暫時不可用，請稍後再試！',
		successAndSort	: '上載成功，你可以通過拖拽已上載的文件進行排序',
		lastQueueDesc	: '上一次的上載隊列還有<strong></strong>個文件尚未上載。你要<a href="#">繼續上載</a>還是<a href="#">放棄</a>？',
		uncertainError	: '上載失敗，請正確選擇需要上載的文件！',
		limitQueueError	: '超出最大上載數限制：每次最多上載%d個文件',
		fileSizeError	: '文件過大：請選擇小於%d的文件',
		fileTypeError	: '無效的文件類型：支持%d'
	},

	smiley: {
		toolbar			: '表情符',
		title			: '插入表情图标'
	},

	widget: {
		toolbar			: '插入文檔部件',
		label			: '插入文檔部件',
		title			: '文檔部件',
		emptyList		: '(無定義的文檔部件)'
	},

	pseudos: {
		anchor			: '錨點',
		flash			: 'Flash 動畫',
		iframe			: 'IFrame',
		widget			: '文档部件',
		unknown			: '不明物件'
	},

	clipboard: {
		title			: '貼上',
		cutError		: '瀏覽器的安全性設定不允許編輯器自動執行剪下動作。請使用快捷鍵 (Ctrl/Cmd+X) 剪下。',
		copyError		: '瀏覽器的安全性設定不允許編輯器自動執行複製動作。請使用快捷鍵 (Ctrl/Cmd+C) 複製。',
		pasteMsg		: '請使用快捷鍵 (<strong>Ctrl/Cmd+V</strong>) 貼到下方區域中並按下 <strong>確定</strong>',
		securityMsg		: '因為瀏覽器的安全性設定，本編輯器無法直接存取您的剪貼簿資料，請您自行在本視窗進行貼上動作。'
	},

	pasteText			: '貼為純文字格式',

	pastefromword: {
		label			: '自 Word 貼上',
		error			: 'It was not possible to clean up the pasted data due to an internal error',
		cleanup			: '您想貼上的文字似乎是自 Word 複製而來，請問您是否要先清除 Word 的格式後再行貼上？'
	},

	maximize			: '最大化',
	restore				: '恢復',

	elementspath		: '%1 元素',
	wordcount			: '还可以输入<em>{number}</em>字',

	toolbar: {
		collapse		: '折叠工具栏',
		expand			: '展开工具栏'
	},

	resize: {
		drop			: '拖拽以改变尺寸',
		larger			: '增大编辑区域',
		smaller			: '减小编辑区域'
	}

};