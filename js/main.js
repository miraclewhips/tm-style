let SELECTED_CHARS = [0];
let ELEMENT_HISTORY = [];
let ELEMENT_HISTORY_SP = 0;
let ELEMENTS = [];
let PREVIEW_BG = 'neutral';

let INPUT_VALUE_BEFORE = null;
let INPUT_START_BEFORE = null;

const title = document.getElementById('title');
const TITLE_SRC = '$z$s$fc0🏆 $i$n$ef4T$fc5r$f85a$f56c$f5ak$o$t$w$f5em$b5fa$65fn$t$5afi$t$5ffa $o$t$s$m$f50T$w$08fe$ff0x$n$f0dt $i$m$0f8$$$0f1t$5f0y$t$bf0l$i$t$w$fd0i$f60n$f00g $s$0f0';

const input = document.getElementById('input');
input.addEventListener('beforeinput', beforeInputChange);
input.addEventListener('input', inputChange);

const output = document.getElementById('output');
output.addEventListener('focus', output.select);
output.addEventListener('click', output.select);

const preview = document.getElementById('preview');

const previewBgNeutral = document.getElementById('preview-bg-neutral');
previewBgNeutral.addEventListener('click', e => setPreviewBg(e, 'neutral'));

const previewBgDark = document.getElementById('preview-bg-dark');
previewBgDark.addEventListener('click', e => setPreviewBg(e, 'dark'));

const previewBgLight = document.getElementById('preview-bg-light');
previewBgLight.addEventListener('click', e => setPreviewBg(e, 'light'));

const elementButtons = document.querySelectorAll('.element-buttons button');
for(const btn of elementButtons) {
	btn.addEventListener('click', addElement);
}

const colorPicker = document.getElementById('color-picker');
Coloris({
	theme: 'polaroid',
	themeMode: 'dark',
	alpha: false,
	onChange: (color) => {
		for(const el of ELEMENTS) {
			if(SELECTED_CHARS.indexOf(el.index) === -1) continue;
			if(el.type !== 'color') continue;
			el.color = color;
		}
		update();
	}
});

colorPicker.addEventListener('close', () => {
	elementHistoryReplace();
	update();
});

const colorBlending = document.getElementById('color-blending');
colorBlending.addEventListener('input', () => {
	window.localStorage.setItem('colorBlending', colorBlending.value);
	update();
});

const elementList = document.querySelector('.element-list tbody');

const elementTypes = {
	'default-style': {sort: 0, group: 'reset', togglable: true},
	'default-color': {sort: 1, group: 'color', togglable: true},
	'color': {sort: 1, group: 'color'},
	'bold': {sort: 2, group: 'bold', togglable: true},
	'italic': {sort: 3, group: 'italic', togglable: true},
	'uppercase': {sort: 4, group: 'uppercase', togglable: true},
	'drop-shadow': {sort: 5, group: 'shadow', togglable: true},
	'default-width': {sort: 6, group: 'width', togglable: true},
	'wide-width': {sort: 6, group: 'width', togglable: true},
	'narrow-width': {sort: 6, group: 'width', togglable: true},
}

const importBtn = document.getElementById('import');
importBtn.addEventListener('click', () => {
	const str = window.prompt('Trackmania Style String');
	if(str && str.trim().length) {
		const parsed = parseTMString(str);
		if(parsed) {
			input.value = parsed[0];
			ELEMENTS = parsed[1];
			elementHistoryPush();
			update();
		}else{
			window.alert('Could not import. Check that the syntax of your string is correct.');
		}
	}
});

const deleteAll = document.getElementById('delete-all');
deleteAll.addEventListener('click', () => {
	if(window.confirm('Are you sure you want to delete all the styles?')) {
		ELEMENTS = [];
		elementHistoryPush();
		update();
	}
});

function beforeInputChange() {
	INPUT_VALUE_BEFORE = input.value;
	INPUT_START_BEFORE = input.selectionStart;
}

function inputChange() {
	if(INPUT_VALUE_BEFORE === input.value) return;

	if(INPUT_VALUE_BEFORE.length === input.value.length) {
		elementHistoryPush();
		update();
		return;
	}

	const diff = Math.abs(input.value.length - INPUT_VALUE_BEFORE.length);
	const index = Math.min(INPUT_START_BEFORE, input.selectionStart);
	const deleted = input.value.length < INPUT_VALUE_BEFORE.length;

	for(let i = ELEMENTS.length - 1; i >= 0; i--) {
		if(ELEMENTS[i].index < index) continue;

		if(deleted) {
			if(ELEMENTS[i].index < index + diff) {
				ELEMENTS.splice(i, 1);
			}else{
				ELEMENTS[i].index -= diff;
			}
		}else if(ELEMENTS[i].index >= index) {
			ELEMENTS[i].index += diff;
		}
	}

	elementHistoryPush();
	update();
}

function setPreviewBg(e, type) {
	if(e) e.preventDefault();
	PREVIEW_BG = type;
	saveData();
	preview.classList.remove('bg-dark', 'bg-light');
	switch(type) {
		case 'dark': preview.classList.add('bg-dark'); break;
		case 'light': preview.classList.add('bg-light'); break;
	}
}

function validColorString(str) {
	str = str.toLowerCase();
	return /^[0-9a-f]{3}$/.test(str);
}

function parseTMString(tmString) {
	let raw = '';
	let elementArray = [];

	for(let i = 0; i < tmString.length; i++) {
		if(tmString[i] !== '$') {
			raw += tmString[i];
			continue;
		}

		const next = tmString[i + 1].toLowerCase();

		if(next === '$') {
			raw += '$';
			i += 1;
			continue;
		}

		// skip links since they are not supported
		if(next === 'l') {
			if(tmString[i + 2] === '[') {
				let foundCloseBracket = false;
				let j;
				for(j = i + 3; j < tmString.length; j++) {
					if(tmString[j] === ']') {
						foundCloseBracket = true;
						break;
					}
				}
				if(!foundCloseBracket) return null;
				i += j - i;
			}else{
				i += 1;
			}
			continue;
		}

		const el = {index: raw.length};
		let foundBasicTag = true;

		switch(next) {
			case 'z': el.type = 'default-style'; break;
			case 'g': el.type = 'default-color'; break;
			case 'o': el.type = 'bold'; break;
			case 'i': el.type = 'italic'; break;
			case 't': el.type = 'uppercase'; break;
			case 's': el.type = 'drop-shadow'; break;
			case 'm': el.type = 'default-width'; break;
			case 'w': el.type = 'wide-width'; break;
			case 'n': el.type = 'narrow-width'; break;
			default: foundBasicTag = false;
		}

		if(foundBasicTag) {
			elementArray.push(el);
			i += 1;
			continue;
		}

		const rgb = tmString.slice(i + 1, i + 4);
		if(!validColorString(rgb)) return null;
		const [r, g ,b] = rgb.split('');
		el.type = 'color';
		el.color = `#${r}${r}${g}${g}${b}${b}`;
		elementArray.push(el);
		i += 3;
	}
	return [raw, elementArray];
}

function elementHistoryPush() {
	if(ELEMENT_HISTORY_SP > 0) {
		const index = ELEMENT_HISTORY.length - ELEMENT_HISTORY_SP;
		ELEMENT_HISTORY.splice(index);
	}
	ELEMENT_HISTORY.push({
		value: input.value,
		elements: JSON.parse(JSON.stringify(ELEMENTS))
	});
	ELEMENT_HISTORY_SP = 0;
}

function elementHistoryReplace() {
	if(ELEMENT_HISTORY_SP > 0) {
		const index = ELEMENT_HISTORY.length - ELEMENT_HISTORY_SP;
		ELEMENT_HISTORY.splice(index);
	}

	if(ELEMENT_HISTORY.length === 0) {
		elementHistoryPush();
	}else{
		ELEMENT_HISTORY[ELEMENT_HISTORY.length - 1] = {
			value: input.value,
			elements: JSON.parse(JSON.stringify(ELEMENTS))
		}
	}

	ELEMENT_HISTORY_SP = 0;
}

function elementHistoryUndo() {
	if(ELEMENT_HISTORY.length - ELEMENT_HISTORY_SP > 1) {
		ELEMENT_HISTORY_SP++;
		const index = ELEMENT_HISTORY.length - 1 - ELEMENT_HISTORY_SP;
		input.value = ELEMENT_HISTORY[index].value;
		ELEMENTS = JSON.parse(JSON.stringify(ELEMENT_HISTORY[index].elements));
		update();
	}
}

function elementHistoryRedo() {
	if(ELEMENT_HISTORY_SP > 0) {
		ELEMENT_HISTORY_SP--;
		const index = ELEMENT_HISTORY.length - 1 - ELEMENT_HISTORY_SP;
		input.value = ELEMENT_HISTORY[index].value;
		ELEMENTS = JSON.parse(JSON.stringify(ELEMENT_HISTORY[index].elements));
		update();
	}
}

function sameElementGroup(type1, type2) {
	return elementTypes[type1].group === elementTypes[type2].group;
}

function addElement(e) {
	for(const CHAR of SELECTED_CHARS) {
		if(CHAR < 0 || CHAR >= input.value.length) return;

		const element = {
			index: CHAR,
			type: e.target.dataset.type,
		}

		if(element.type === 'color') {
			element.blend = false;
		}

		let addNew = true;

		for(let i = 0; i < ELEMENTS.length; i++) {
			if(ELEMENTS[i].index !== element.index) continue;
			if(!sameElementGroup(ELEMENTS[i].type, element.type)) continue;

			if(elementTypes[element.type].togglable && ELEMENTS[i].type === element.type) {
				addNew = false;
			}

			const old = ELEMENTS.splice(i, 1);

			if(old[0].type === 'color') {
				colorPicker.value = old[0].color;
				element.blend = old[0].blend;
			}

			break;
		}

		if(element.type === 'color') {
			element.color = colorPicker.value;
			colorPicker.click();
		}

		if(addNew) {
			ELEMENTS.push(element);
		}
	}

	elementHistoryPush();

	update();
}

function sortElements(a, b) {
	if(a.index != b.index) {
		return a.index - b.index;
	}
	return elementTypes[a.type].sort - elementTypes[b.type].sort;
}

function updateElementList() {
	elementList.innerHTML = '';

	ELEMENTS.sort(sortElements);

	for(let i = 0; i < ELEMENTS.length; i++) {
		const el = ELEMENTS[i];

		if(el.index >= input.value.length) continue;

		const row = document.createElement('tr');
		row.dataset.index = el.index;

		if(SELECTED_CHARS.indexOf(el.index) !== -1) {
			row.classList.add('is-active');
		}

		const cellIndex = document.createElement('td');
		cellIndex.classList.add('nowrap');
		cellIndex.innerHTML = `${input.value[el.index]} <span class="muted">[${el.index}]</span>`;
		row.appendChild(cellIndex);

		const cellType = document.createElement('td');
		cellType.textContent = document.querySelector(`.element-buttons button[data-type="${el.type}"]`).textContent;
		if(el.type === 'color') {
			cellType.innerHTML += `<span class="color-indicator" style="background-color:${clampColor(el.color)}"></span>`;
		}
		row.appendChild(cellType);

		const cellOptions = document.createElement('td');

		if(el.type === 'color') {
			const label = document.createElement('label');
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.checked = el.blend;

			checkbox.addEventListener('change', (e) => {
				el.blend = e.target.checked;
				update();
			});

			label.appendChild(checkbox);

			const labelText = document.createElement('span');
			labelText.textContent = 'Blend with previous color?';
			label.appendChild(labelText);

			cellOptions.appendChild(label);
		}

		row.appendChild(cellOptions);

		const cellDelete = document.createElement('td');
		cellDelete.classList.add('nowrap');
		const deleteBtn = document.createElement('button');
		deleteBtn.textContent = 'Delete';

		deleteBtn.addEventListener('click', () => {
			ELEMENTS.splice(i, 1);
			elementHistoryPush();
			update();
		});

		cellDelete.appendChild(deleteBtn);
		row.appendChild(cellDelete);

		row.addEventListener('click', () => {
			preview.querySelector(`span[data-index="${el.index}"]`).click();
		});

		row.addEventListener('mouseenter', () => {
			preview.classList.add('hide-selection');
			preview.querySelector(`span[data-index="${el.index}"]`)?.classList.add('is-hovered');
		});

		row.addEventListener('mouseleave', () => {
			preview.classList.remove('hide-selection');
			preview.querySelector(`span[data-index="${el.index}"]`)?.classList.remove('is-hovered');
		});

		elementList.appendChild(row);
	}
}

function selectChar(e) {
	const index = parseInt(e.target.dataset.index);

	if(!e.ctrlKey && !e.shiftKey) {
		SELECTED_CHARS = [];
	}

	let removedExisting = false;

	for(let i = SELECTED_CHARS.length - 1; i >= 0; i--) {
		if(SELECTED_CHARS[i] === index) {
			removedExisting = true;
			SELECTED_CHARS.splice(i, 1);
		}
	}

	if(e.shiftKey) {
		const lastChar = SELECTED_CHARS[SELECTED_CHARS.length - 1];
		if(index < lastChar) {
			for(let i = lastChar - 1; i > index; i--) {
				if(SELECTED_CHARS.indexOf(i) === -1) {
					SELECTED_CHARS.push(i);
				}
			}
		}else if(index > lastChar) {
			for(let i = lastChar + 1; i < index; i++) {
				if(SELECTED_CHARS.indexOf(i) === -1) {
					SELECTED_CHARS.push(i);
				}
			}
		}
	}

	if(!(e.ctrlKey && removedExisting)) {
		SELECTED_CHARS.push(index);
	}

	for(const char of preview.querySelectorAll('span')) {
		char.classList.toggle('is-selected', SELECTED_CHARS.indexOf(parseInt(char.dataset.index)) !== -1);
	}

	for(const row of elementList.querySelectorAll('tr')) {
		row.classList.toggle('is-active', SELECTED_CHARS.indexOf(parseInt(row.dataset.index)) !== -1);
	}

	saveData();
	toggleButtonDisabled();
}

function clampColor(hex) {
	const rr = parseInt(hex[1] + hex[2], 16);
	const gg = parseInt(hex[3] + hex[4], 16);
	const bb = parseInt(hex[5] + hex[6], 16);
	const r = Math.round(rr / 0xFF * 0xF).toString(16);
	const g = Math.round(gg / 0xFF * 0xF).toString(16);
	const b = Math.round(bb / 0xFF * 0xF).toString(16);
	return `#${r}${g}${b}`;
}

function defaultStyles() {
	return {
		color: null,
		colorIndex: null,
		blendColor: null,
		blendColorIndex: null,
		blendWithNext: false,
		bold: false,
		italic: false,
		uppercase: false,
		dropShadow: false,
		width: null,
	}
}

function getNextBlendColor(currentIndex) {
	for(let i = 0; i < ELEMENTS.length; i++) {
		if(ELEMENTS[i].index <= currentIndex) continue;
		if(elementTypes[ELEMENTS[i].type].group === 'color') {
			if(ELEMENTS[i].type !== 'color' || !ELEMENTS[i].blend) return null;
			return ELEMENTS[i];
		}
	}
	return null;
}

function invlerp(start, end, val) {
	return (val - start) / (end - start);
}

function blendColors(color1, color2, startIndex, endIndex, currentIndex) {
	const p = invlerp(startIndex, endIndex, currentIndex) * 100;
	
	const div = document.createElement('div');
	div.style.display = 'none';
	div.style.color = `color-mix(in ${colorBlending.value}, ${color1} ${100 - p}%, ${color2} ${p}%)`;
	document.body.appendChild(div);
	const result = getComputedStyle(div).color;
	div.remove();

	const rgb = result.slice(11, -1).split(' ').map(i => Math.round(parseFloat(i) * 255));
	const hex = (rgb[0] << 16) | (rgb[1] << 8) | (rgb[2]);
	return `#${hex.toString(16).padStart(6, 0)}`;
}

function generateText(inputString, elementArray, previewDiv) {
	previewDiv.classList.remove('hide-selection');

	if(inputString.trim().length === 0) {
		previewDiv.innerHTML = '&nbsp;';
		return '';
	}

	let out = '';

	if(elementArray.length > 0 && elementArray[0].type !== 'default-style') {
		out += '$z';
	}

	let styles = defaultStyles();

	previewDiv.innerHTML = '';

	const chars = inputString.split('');

	let lastColor = null;

	for(let i = 0; i < chars.length; i++) {
		if(chars[i] === '\n') {
			previewDiv.appendChild(document.createElement('br'));
			out += '\n';
			continue;
		}

		const span = document.createElement('span');
		span.dataset.index = i;
		span.textContent = chars[i];

		if(SELECTED_CHARS.indexOf(i) !== -1) {
			span.classList.add('is-selected');
		}

		span.addEventListener('click', selectChar);

		for(let j = 0; j < elementArray.length; j++) {
			if(elementArray[j].index !== i) continue;

			span.classList.add('has-styles');

			switch(elementArray[j].type) {
				case 'default-style':
					styles = defaultStyles();
					out += '$z';
					break;
				case 'default-color':
					styles.color = null;
					styles.colorIndex = null;
					styles.blendColor = null;
					styles.blendColorIndex = null;
					out += '$g';
					break;
				case 'color':
					styles.color = elementArray[j].color;
					styles.colorIndex = i;

					const blendColor = getNextBlendColor(i);
					styles.blendColor = blendColor ? blendColor.color : null;
					styles.blendColorIndex = blendColor ? blendColor.index : null;
					break;
				case 'bold':
					styles.bold = !styles.bold;
					out += '$o';
					break;
				case 'italic':
					styles.italic = !styles.italic;
					out += '$i';
					break;
				case 'uppercase':
					styles.uppercase = !styles.uppercase;
					out += '$t';
					break;
				case 'drop-shadow':
					styles.dropShadow = !styles.dropShadow;
					out += '$s';
					break;
				case 'default-width':
					styles.width = null;
					out += '$m';
					break;
				case 'wide-width':
					styles.width = 'wide';
					out += '$w';
					break;
				case 'narrow-width':
					styles.width = 'narrow';
					out += '$n';
					break;
			}
		}

		if(styles.color) {
			let color = styles.color;

			if(styles.blendColor) {
				color = blendColors(styles.color, styles.blendColor, styles.colorIndex, styles.blendColorIndex, i);
			}

			color = clampColor(color);
			span.style.color = color;

			if(lastColor !== color) {
				lastColor = color;
				out += color.replace('#', '$');
			}
		}else{
			lastColor = null;
		}

		if(styles.bold) span.classList.add('bold');
		if(styles.italic) span.classList.add('italic');
		if(styles.uppercase) span.classList.add('uppercase');
		if(styles.dropShadow) span.classList.add('drop-shadow');

		switch(styles.width) {
			case 'narrow': span.classList.add('narrow'); break;
			case 'wide':   span.classList.add('wide');   break;
		}

		previewDiv.appendChild(span);

		if(chars[i] === '$') {
			out += '$$';
		}else{
			out += chars[i];
		}
	}

	return out;
}

function toggleButtonDisabled() {
	let isActive = true;
	if(SELECTED_CHARS.length === 0) SELECTED_CHARS = [0];

	if(input.value.trim().length === 0) {
		isActive = false;
	}

	for(const btn of elementButtons) {
		if(isActive) {
			btn.removeAttribute('disabled');
		}else{
			btn.setAttribute('disabled', true);
		}
	}
}

function saveData() {
	window.localStorage.setItem('input', input.value);
	window.localStorage.setItem('selectedChars', JSON.stringify(SELECTED_CHARS));
	window.localStorage.setItem('elements', JSON.stringify(ELEMENTS));
	window.localStorage.setItem('previewBg', PREVIEW_BG);
}

function loadData() {
	const savedValue = window.localStorage.getItem('input');
	if(savedValue) {
		input.value = savedValue;
	}

	const savedSelectedChars = window.localStorage.getItem('selectedChars');
	if(savedSelectedChars) {
		try {
			SELECTED_CHARS = JSON.parse(savedSelectedChars);
		}catch(e){}
	}

	const savedElements = window.localStorage.getItem('elements');
	if(savedElements) {
		try {
			ELEMENTS = JSON.parse(savedElements);
		}catch(e){}
	}

	const savedPreviewBg = window.localStorage.getItem('previewBg');
	if(savedPreviewBg) {
		setPreviewBg(null, savedPreviewBg);
	}

	const savedColorBlending = window.localStorage.getItem('colorBlending');
	if(savedColorBlending) {
		colorBlending.value = savedColorBlending;
	}
}

function update() {
	saveData();
	updateElementList();
	toggleButtonDisabled();
	output.value = generateText(input.value, ELEMENTS, preview);
}

function init() {
	const parsed = parseTMString(TITLE_SRC);
	if(parsed) {
		generateText(parsed[0], parsed[1], title);
	}

	loadData();
	elementHistoryPush();
	update();

	document.addEventListener('keyup', (e) => {
		switch(document.activeElement.tagName.toLowerCase()) {
			case 'input':
			case 'textarea':
				return;
		}

		if(!e.ctrlKey) return;
		const key = e.key.toLowerCase();

		if(key === 'z' && !e.shiftKey) {
			elementHistoryUndo();
		}else if(key === 'y' || (key === 'z' && e.shiftKey)) {
			elementHistoryRedo();
		}
	});
}

init();
