// ── Column cells ──

function createCell(d) {
	const el = document.createElement('div');
	el.className = 'col-cell';
	el.setAttribute('role', 'gridcell');
	d.patch(el, d);
	return el;
}

function patchCell(el, d) {
	const { colId, colData, stage, project, vis } = d;
	el.dataset.colId = colId;
	const visCount = vis ? colData.filter(c => vis.has(c.id)).length : colData.length;
	const isFiltering = !!vis;
	setAttr(el, 'aria-label', `${project.name} — ${stage.name}, ${visCount} cards`);

	// Count
	let countEl = el.querySelector(':scope > .sw-col-count');
	if (!countEl) {
		countEl = document.createElement('span');
		el.prepend(countEl);
	}
	const countCls = `sw-col-count${visCount === 0 ? ' count-hidden' : (isFiltering ? ' count-filtered' : '')}`;
	setCls(countEl, countCls);
	if (countEl.textContent !== String(visCount)) countEl.textContent = visCount;

	// Cards container
	let cardsEl = el.querySelector(':scope > .col-cards');
	if (!cardsEl) {
		cardsEl = document.createElement('div');
		cardsEl.className = 'col-cards';
		cardsEl.setAttribute('role', 'listbox');
		cardsEl.setAttribute('aria-label', 'Cards');
		cardsEl.dataset.colCards = colId;
		el.insertBefore(cardsEl, countEl.nextSibling);
	}

	// Reconcile cards
	const cardDescs = [];
	for (const c of colData) {
		const sig = cardSig(c, stage.done, vis, cardTypeColor(c.type));
		cardDescs.push({
			key: c.id,
			create: createCard,
			patch: patchCard,
			sig,
			cls: cardClasses(c, stage.done, vis),
			color: cardTypeColor(c.type),
			html: cachedCardHtml(sig, c, stage.done, vis),
		});
	}
	reconcileChildren(cardsEl, cardDescs, el => el.dataset.cardId);

	// Add button
	let addBtn = el.querySelector(':scope > .col-add');
	if (!addBtn) {
		addBtn = document.createElement('button');
		addBtn.className = 'col-add';
		addBtn.innerHTML = ICON_PLUS;
		el.appendChild(addBtn);
	}
	addBtn.dataset.addCol = colId;
}

// ══════════════════════════════════════════════════════════════
//  renderInbox — keyed reconciliation
// ══════════════════════════════════════════════════════════════

function renderInbox() {
	const inbox = cardsByColumn.get().get('inbox-col') ?? [];
	const list = $('inbox-list');
	if (!list) return;
	const vis = visibleIds.get();

	const descs = [];
	for (const c of inbox) {
		const sig = cardSig(c, false, vis, cardTypeColor(c.type));
		descs.push({
			key: c.id,
			create: createCard,
			patch: patchCard,
			sig,
			cls: cardClasses(c, false, vis),
			color: cardTypeColor(c.type),
			html: cachedCardHtml(sig, c, false, vis),
		});
	}
	reconcileChildren(list, descs, el => el.dataset.cardId);

	const badge = $('inbox-badge');
	if (badge) {
		const visibleCount = vis ? inbox.filter(c => vis.has(c.id)).length : inbox.length;
		if (badge.textContent !== String(visibleCount)) badge.textContent = visibleCount;
		badge.classList.toggle('empty', visibleCount === 0);
		badge.classList.toggle('filtered', !!vis);
		if (vis && visibleCount === 0 && inboxOpen.peek()) inboxOpen.set(false);
	}
	updateInboxShadows();
}


function updateInboxShadows() {
	const list = $('inbox-list');
	const top = $('inbox-shadow-top');
	const bot = $('inbox-shadow-bottom');
	if (!list || !top || !bot) return;
	top.classList.toggle('visible', list.scrollTop > 4);
	bot.classList.toggle('visible', list.scrollTop + list.clientHeight < list.scrollHeight - 4);
}

function renderStats() {
	// Always update the count badge
	const all = cards.get();
	const countEl = $('stats-count');
	if (countEl) countEl.textContent = all.length;

	const el = $('stats-bar');
	if (!el || !el.classList.contains('open')) return;
	const currentFilter = filterStr.get();
	const openCount = all.filter(c => !c.done).length;
	const doneCount = all.filter(c => c.done).length;
	const taskCount = all.filter(c => c.type === 'task' && !c.done).length;
	const meetingCount = all.filter(c => c.type === 'meeting' && !c.done).length;
	const followupCount = all.filter(c => c.type === 'followup' && !c.done).length;
	const overdueCount = all.filter(c => isOverdue(c) && !c.done).length;

	const chip = (label, count, filterVal, cls) => {
		const active = filterVal !== '' && currentFilter === filterVal ? ' active' : '';
		const extra = cls ? ` ${cls}` : '';
		return `<span class="stat-chip${active}${extra}" data-stat-filter="${filterVal}"><strong>${count}</strong> ${label}</span>`;
	};

	// Preset chips (dashed, before counters)
	const presets = filterPresets.peek();
	let presetHtml = '';
	for (const p of presets) {
		const active = currentFilter === p.query ? ' active' : '';
		const pCount = all.filter(c => matchesFilter(c, p.query.toLowerCase().trim())).length;
		presetHtml += `<span class="stat-chip stat-chip--preset${active}" data-preset-query="${escHtml(p.query)}"><strong>${pCount}</strong> ${escHtml(p.name)}<button class="stat-chip__del" data-del-preset="${escHtml(p.name)}">&times;</button></span>`;
	}

	el.innerHTML = presetHtml
		+ chip('open', openCount, '', '')
		+ chip('tasks', taskCount, '$task', '')
		+ chip('meetings', meetingCount, '$meeting', '')
		+ chip('follow-ups', followupCount, '$followup', '')
		+ (overdueCount > 0 ? chip('overdue', overdueCount, '$overdue', 'overdue') : '')
		+ `<span class="stat-chip done-chip${currentFilter === '$done' ? ' active' : ''}" data-stat-filter="$done"><strong>${doneCount}</strong> <s>&nbsp;done&nbsp;</s></span>`;

	// Stat chip click → set filter
	el.querySelectorAll('.stat-chip[data-stat-filter]').forEach(c => {
		c.addEventListener('click', () => {
			const val = c.dataset.statFilter;
			const input = $('filter-input');
			const wrap = $('filter-wrap');
			if (!val || filterStr.peek() === val) {
				input.value = '';
				filterStr.set('');
			} else {
				input.value = val;
				filterStr.set(val);
			}
			input.focus();
			wrap.classList.add('expanded');
		});
	});

	// Preset chip click → set filter
	el.querySelectorAll('.stat-chip--preset[data-preset-query]').forEach(c => {
		c.addEventListener('click', (e) => {
			if (e.target.closest('.stat-chip__del')) return;
			const val = c.dataset.presetQuery;
			const input = $('filter-input');
			const wrap = $('filter-wrap');
			if (filterStr.peek() === val) {
				input.value = '';
				filterStr.set('');
			} else {
				input.value = val;
				filterStr.set(val);
			}
			input.focus();
			wrap.classList.add('expanded');
		});
	});

	// Preset × delete
	el.querySelectorAll('.stat-chip__del[data-del-preset]').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.stopPropagation();
			const name = btn.dataset.delPreset;
			filterPresets.update(all => all.filter(p => p.name !== name));
			renderStats();
		});
	});
}

// ══════════════════════════════════════════════════════════════
//  Module 6: dnd.js — Pointer-based drag-and-drop (touch + mouse)
// ══════════════════════════════════════════════════════════════

