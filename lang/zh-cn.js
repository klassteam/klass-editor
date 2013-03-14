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
 * @zh-CN Chinese Simplified.
 */

Klass.Editor.lang['zh-cn'] = {

	// Toolbar buttons without dialogs.
	source				: '源代码',
	save				: '保存',
	preview				: '预览',
	cut					: '剪切',
	copy				: '复制',
	paste				: '粘贴',
	print				: '打印',
	bold				: '加粗',
	italic				: '倾斜',
	underline			: '下划线',
	strike				: '删除线',
	selectAll			: '全选',
	subscript			: '下标',
	superscript			: '上标',
	indent				: '增加缩进量',
	outdent				: '减少缩进量',
	bulletedlist		: '项目列表',
	numberedlist		: '编号列表',
	blockquote			: '块引用',
	removeFormat		: '清除格式',
	date				: '插入日期',
	horizontalrule		: '插入水平线',
	unlink				: '取消超链接',
	undo				: '撤销',
	redo				: '重做',

	// Common messages and labels.
	common: {
		upload			: '上传',
		button			: '按钮',
		name			: '名称',
		ok				: '确定',
		cancel			: '取消',
		yes				: '是',
		no				: '否',
		close			: '关闭',
		preview			: '预览',
		general			: '常规',
		advanced		: '高级',
		options			: '选项',
		target			: '目标窗口',
		auto			: '自动',
		width			: '宽度',
		height			: '高度',
		align			: '对齐方式',
		alignLeft		: '左对齐',
		alignRight		: '右对齐',
		alignCenter		: '居中',
		alignTop		: '顶端',
		alignMiddle		: '居中',
		alignBottom		: '底部',
		localFiles		: '本地文件',
		webAddress		: '网络地址',
		invalidWidth	: '宽度必须为数字格式',
		invalidHeight	: '高度必须为数字格式',
		confirmCancel	: '部分修改尚未保存，是否确认关闭对话框？'
	},

	font: {
		label			: '字体',
		panelTitle		: '字体'
	},

	fontsize: {
		label			: '字号',
		panelTitle		: '字号'
	},

	format: {
		label			: '格式',
		panelTitle		: '格式',

		tag_p			: '普通',
		tag_pre			: '已编排格式',
		tag_address		: '地址',
		tag_h1			: '标题 1',
		tag_h2			: '标题 2',
		tag_h3			: '标题 3',
		tag_h4			: '标题 4',
		tag_h5			: '标题 5',
		tag_h6			: '标题 6',
		tag_div			: '段落(DIV)'
	},

	styles: {
		label			: '样式',
		panelTitle		: '样式',
		panelTitle1		: '块级元素样式',
		panelTitle2		: '内联元素样式',
		panelTitle3		: '对象元素样式'
	},

	color: {
		selectColor		: '选择颜色',
		textColor		: '文本颜色',
		bgColor			: '背景颜色',
		standard		: '标准色',
		theme			: '主题颜色',
		auto			: '自动',
		more			: '其他颜色...'
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
		left			: '左对齐',
		center			: '居中对齐',
		right			: '右对齐',
		block			: '两端对齐'
	},

	// Link dialog.
	link: {
		label			: '插入/编辑超链接',
		toolbar			: '插入/编辑超链接',
		menu			: '编辑超链接',
		title			: '超链接',
		info			: '超链接信息',
		type			: '超链接类型',
		url				: '网站的链接地址',
		displayText		: '要显示的文本',
		emailAddress	: '电子邮件的链接地址',
		emailSubject	: '电子邮件的主题',
		toWebAddress	: '网站地址',
		toEmailAddress	: '电子邮件地址',
		testLink		: '测试链接',
		emptyEmail		: '请输入电子邮件地址',
		emptyUrl		: '请输入网站链接地址',
		invalidEmail	: '请输入正确的电子邮件地址',
		invalidUrl		: '请输入正确的网站链接地址'
	},

	image: {
		label			: '图像',
		title			: '图像属性',
		menu			: '图像属性',
		url				: '在此处粘帖图片网址',
		alt				: '替换文本',
		emptyUrl		: '请输入图像地址',
		invalidUrl		: '请输入正确的图像地址',
		limitQueueDesc	: '每次最多可以上传<strong>%d</strong>张图片',
		description		: '如果您输入的网址正确，则可以在此处预览效果。<br />对于大图片，可能需要几分钟才能显示出来。'
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
		image			: '图片浏览器'
	},

	fileupload: {
		success			: '上传成功',
		failure			: '上传失败',
		timeout			: '上传超时',
		reupload		: '重新上传',
		wait			: '等待上传',
		start			: '开始上传',
		stop			: '停止上传',
		selectFile		: '选择文件',
		largeFile		: '文件过大',
		invalidFile		: '无效的文件',
		invalidFileType	: '无效的文件类型',
		dragdrop		: '拖动图片至虚线框内即可直接上传',
		size			: '支持上传的文件大小',
		format			: '支持上传的文件格式',
		confirmCancel	: '部分文件尚未上传，是否确认关闭对话框?',
		serverFailure	: '上传服务暂时不可用，请稍后再试！',
		successAndSort	: '上传成功，你可以通过拖拽已上传的文件进行排序',
		lastQueueDesc	: '上一次的上传队列还有<strong></strong>个文件尚未上传。你要<a href="#">继续上传</a>还是<a href="#">放弃</a>？',
		uncertainError	: '上传失败，请正确选择需要上传的文件！',
		limitQueueError	: '超出最大上传数限制：每次最多上传%d个文件',
		fileSizeError	: '文件过大：请选择小于%d的文件',
		fileTypeError	: '无效的文件类型：支持%d'
	},

	smiley: {
		toolbar			: '表情符',
		title			: '插入表情图标'
	},

	widget: {
		toolbar			: '插入文档部件',
		label			: '插入文档部件',
		title			: '文档部件',
		emptyList		: '(没有已定义的文档部件)'
	},

	pseudos: {
		anchor			: '锚点',
		flash			: 'Flash 动画',
		iframe			: 'IFrame',
		widget			: '文档部件',
		unknown			: '未知对象'
	},

	clipboard: {
		title			: '粘贴',
		cutError		: '您的浏览器安全设置不允许编辑器自动执行剪切操作, 请使用键盘快捷键(Ctrl/Cmd+X)来完成',
		copyError		: '您的浏览器安全设置不允许编辑器自动执行复制操作，请使用键盘快捷键(Ctrl/Cmd+C)来完成',
		pasteMsg		: '请使用键盘快捷键(<STRONG>Ctrl/Cmd+V</STRONG>)把内容粘贴到下面的方框里，再按 <STRONG>确定</STRONG>',
		securityMsg		: '因为你的浏览器的安全设置原因, 本编辑器不能直接访问你的剪贴板内容, 你需要在本窗口重新粘贴一次',
		pasteArea		: '粘贴区域'
	},

	pasteText			: '粘贴为无格式文本',

	pastefromword: {
		label			: '从 MS Word 粘贴',
		error			: '由于内部错误无法清理要粘贴的数据',
		cleanup			: '您要粘贴的内容好像是来自 MS Word, 是否要清除 MS Word 格式后再粘贴?'
	},

	maximize			: '全屏',
	restore				: '还原',

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