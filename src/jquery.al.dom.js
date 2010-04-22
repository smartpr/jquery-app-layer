// DEFINING DOM REFERENCES

// Option 1
$.dom({
	tags: {
		selector: '#tags',
		children: {
			filter: 'dl.filter',
			apply: 'dl.apply'
		}
	},
	contacts: {
		selector: '#contacts',
		children: {
			overview: '> .overview',
			search: '> input[type=search]',
			list: {
				selector: '> ul',
				children: {
					more: 'li.more'
				}
			}
		}
	},
	recipients: '#recipients'
});

// Option 2
$.dom({
	tags: ['#tags', {
		filter: 'dl.filter',
		apply: 'dl.apply'
	}],
	contacts: ['#contacts', {
		overview: '> .overview',
		search: '> input[type=search]',
		list: ['> ul', {
			more: 'li.more'
		}]
	}],
	recipients: '#recipients'
});

// Option 3
$.dom.pin({
	tags: $.dom.pin('#tags', {
		filter: 'dl.filter',
		apply: 'dl.apply'
	}),
	contacts: $.dom.pin('#contacts', {
		overview: '> .overview',
		search: '> input[type=search]',
		list: $.dom.pin('> ul', {
			more: 'li.more'
		})
	})
});

// Option 4
$.dom({
	tags: '#tags',
	contacts: '#contacts',
	recipients: '#recipients'
});

$.dom('tags').dom({
	filter: 'dl.filter',
	apply: 'dl.apply'
});

$.dom('contacts').dom({
	overview: '> .overview',
	search: '> input[type=search]',
	list: '> ul'
});

$.dom('contacts', 'list').dom({
	more: 'li.more'
});

// RETRIEVING DOM REFERENCES

$.dom('tags')
$.dom('contacts')
$.dom('contacts', 'search')

// Inconsistent with data plugin, but functionality worth considering adding to
// data plugin
$.dom('contacts', ['overview', 'search'])

// Inconsistent with data plugin, so might be not a good idea
// (as long as data doesn't support this syntax)
$.dom('tags.filter')

$.dom('tags').dom('filter')
