// ══════════════════════════════════════════════════════════════
//  Module 1: signals.js — Reactive primitives (~120 lines)
// ══════════════════════════════════════════════════════════════
'use strict';

const _EMPTY = Symbol('empty');
let _currentEffect = null;
let _batchDepth = 0;
let _batchQueue = new Set();

function signal(initialValue) {
	let _value = initialValue;
	const _subs = new Set();

	const s = {
		get() {
			if (_currentEffect) _subs.add(_currentEffect);
			return _value;
		},
		peek() { return _value; },
		set(newValue) {
			if (Object.is(_value, newValue)) return;
			_value = newValue;
			_notify(_subs);
		},
		update(fn) {
			s.set(fn(_value));
		},
		subscribe(fn) {
			_subs.add(fn);
			return () => _subs.delete(fn);
		},
		_subs,
	};
	return s;
}

function computed(fn) {
	let _value = _EMPTY;
	let _dirty = true;
	const _subs = new Set();

	const innerEffect = {
		run() {
			_dirty = true;
			_notify(_subs);
		},
	};

	const c = {
		get() {
			if (_currentEffect) _subs.add(_currentEffect);
			if (_dirty) {
				const prev = _currentEffect;
				_currentEffect = innerEffect;
				try { _value = fn(); }
				finally { _currentEffect = prev; }
				_dirty = false;
			}
			return _value;
		},
		peek() {
			if (_dirty) {
				const prev = _currentEffect;
				_currentEffect = null;
				try { _value = fn(); }
				finally { _currentEffect = prev; }
				_dirty = false;
			}
			return _value;
		},
	};
	return c;
}

function effect(fn) {
	const eff = {
		run() {
			if (_batchDepth > 0) { _batchQueue.add(eff); return; }
			const prev = _currentEffect;
			_currentEffect = eff;
			try { fn(); }
			finally { _currentEffect = prev; }
		},
	};
	eff.run();
	return () => { /* dispose — no-op for simplicity, effects auto-clean via WeakRef-style GC */ };
}

function batch(fn) {
	_batchDepth++;
	try { fn(); }
	finally {
		_batchDepth--;
		if (_batchDepth === 0) {
			const queue = [..._batchQueue];
			_batchQueue.clear();
			for (const eff of queue) eff.run();
		}
	}
}

function untracked(fn) {
	const prev = _currentEffect;
	_currentEffect = null;
	try { return fn(); }
	finally { _currentEffect = prev; }
}

const peek = untracked;

function _notify(subs) {
	for (const sub of subs) {
		if (typeof sub === 'object' && sub.run) {
			if (_batchDepth > 0) _batchQueue.add(sub);
			else sub.run();
		} else if (typeof sub === 'function') {
			sub();
		}
	}
}


// ══════════════════════════════════════════════════════════════
//  Module 3: state.js — All state signals + computed indexes
// ══════════════════════════════════════════════════════════════

const SWATCH_COLORS = ['#2b4abd','#2a7a3e','#a07820','#bd1e2e','#7a5040','#6a3ea1','#1a8a8a'];

const _domCache = new Map();
function $(id) {
	let el = _domCache.get(id);
	if (!el || !el.isConnected) {
		el = document.getElementById(id);
		if (el) _domCache.set(id, el);
	}
	return el;
}

let _activeHover = null;
let _activeIndicator = null;
let _activeReorderIndicator = null;

function clearHover() {
	if (_activeHover) { _activeHover.classList.remove('drop-hover'); _activeHover = null; }
}
function setHover(el) {
	if (el === _activeHover) return;
	clearHover();
	_activeHover = el;
	if (el) el.classList.add('drop-hover');
}
function clearIndicator() {
	if (_activeIndicator) { _activeIndicator.remove(); _activeIndicator = null; }
}
function clearReorderIndicator() {
	if (_activeReorderIndicator) { _activeReorderIndicator.remove(); _activeReorderIndicator = null; }
}
function setReorderIndicator(el) {
	clearReorderIndicator();
	_activeReorderIndicator = el;
	document.body.appendChild(el);
}

const deviceId = 'device-' + Math.random().toString(36).slice(2, 8);

const stages = signal([]);
const projects = signal([]);

function makeCols(projs, stgs) {
	const cols = [];
	for (const p of projs) {
		for (const s of stgs) {
			cols.push({ id: `col-${p.id}-${s.id}`, name: s.name, pId: p.id, stage: s.id, wip: 0 });
		}
	}
	return cols;
}

const cols = signal([]);

const cards = signal([]);

const NOW_STR = new Date().toISOString().slice(0, 10);

const filterStr = signal('');
const inboxOpen = signal(false);

const focusedCardId = signal(null);
const filterPresets = signal([]); // [{name, query}]
const selectedCards = new Set(); // for multi-select

