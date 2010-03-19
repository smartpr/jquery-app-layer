(root?)	<div>
		<!--
l1			<img src="yadda" />
l1			<span>
				<%= group %>
				<%--tags
l2					<strong><a href="" class="tag"><%= name =></a></strong>, 
				%-->
			</span>
			&bull;
		-->
		</div>


$('ul').dataview('set', [
	{
		group: "Molendijk",
		tags: [
			{id: 1, name: 'ouwe'},
			{id: 2, name: 'jonge'}
		]
	},
	{
		group: "Galle",
		tags: [
			{id: 3, name: 'broabent'},
			{id: 4, name: 'ldope'}
		]
	}
]);

$('a.tag', $('ul')[0]).live('click', function(e) {
	e.preventDefault();
	var d = $(this).dataview('get');
	alert("Clicked tag with id " + d.id);
	d.name = 'clicked';
	$(this).dataview('invalidate');
});
