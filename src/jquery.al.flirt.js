/*
// templating design:

- use resig's micro-templating solution: http://ejohn.org/blog/javascript-micro-templating/
- include fix for single quotes: http://www.west-wind.com/Weblog/posts/509108.aspx
- use jqote syntax: http://aefxx.com/jquery-plugins/jqote/
- add cdata stripping (jqote) (do we need this? do we want this? is html5 cdata compliant?)

syntax:
	    	<ul id="flagme">
                <script type="text/smesh">
                    <li>
                    	<input type="checkbox" /><%= text %>
                    </li>
                </script>
	    	</ul>
	    	
	    	$('#flagme').smesh(data);

philosophy:
- implicit template definition and identification
    * definition = <!--FLIRT ... -->
    * identifaction = is in the element in which it will be applied
- template caching on the element and using jquery.al.data.js

new name: flirt (FLirt Is Resig's Templating)

move to ui widget structure: flirt('get', data) , flirt('set', data), flirt('append', data)
(instead of commit argument)

also: think about how much sophistication we really need. is it worth implementing
an approach which carefully puts parsed html in place of the template, without
touching non-flirts in the same container? or is it ok to just take over the entire
container?

TODO: Automatic nested looping (f.e. tags block: loop groups, then loop group members)

*/

(function($) {

var NS = 'flirt';

$.fn[NS] = function(data, commit) {
	var $this = this,
		template = $this.fetch(NS, 'template'),
		html = '';
	
	if (template === undefined) {
		template = '';
		$this.contents('[nodeType=8]').each(function() {
			if (this.data.substr(0, NS.length).toLowerCase() === NS) {
				template += $.trim(this.data.substr(NS.length));
				$(this).remove();
			}
		});
		if (!template) {
			return null;
		}
		template = _.template(template);
		$this.store(NS, 'template', template);
	}
	if (!$.isArray(data)) {
		data = [data];
	}
	for (var i = 0, l = data.length; i < l; i++) {
		html += template(data[i]);
	}
	if (commit === false) {
		return html;
	}
	return $this.html(html);
};

}(jQuery));
