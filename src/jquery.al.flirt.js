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

/*

Next iteration API design:

$('ul').flirt('set', 'tmpl-name', data-object-or-list-of-data-objects);

$('ul').flirt('append', 'tmpl-name', data-object-or-list-of-data-objects);

var html = $('ul').flirt('get', 'tmpl-name', data-object-or-list-of-data-objects);


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




  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  $.flirtSettings = {
    start       : '<%',
    end         : '%>',
    interpolate : /<%=(.+?)%>/g,
    down        : /<!-(\w+?)\s(.*)->/g
  };

  // JavaScript templating a-la ERB, pilfered from John Resig's
  // "Secrets of the JavaScript Ninja", page 83.
  // Single-quote fix from Rick Strahl's version.
  $.flirt = function(str, data) {
    var c  = $.flirtSettings;
    for (var i = 0; i < 10; i++) {
      str=str.replace(c.down, "<%for(i[" + i + "] = 0; i[" + i + "] < $1.length; i[" + i + "]++) { with($1[i[" + i + "]]) { %>$2<% }} %>");
    }
    var fn = new Function('obj',
      'var p=[],i=[],print=function(){p.push.apply(p,arguments);};' +
      'with(obj){p.push(\'' +
      str.replace(/[\r\t\n]/g, " ")
         .replace(new RegExp("'(?=[^"+c.end[0]+"]*"+c.end+")","g"),"\t")
         .split("'").join("\\'")
         .split("\t").join("'")
         .replace(c.interpolate, "',$1,'")
         .split(c.start).join("');")
         .split(c.end).join("p.push('")
         + "');}return p.join('');");
    return data ? fn(data) : fn;
  };

}(jQuery));
