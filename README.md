#byda.js
------

byda is a small (~3kb minified) library that allows you to load in ajax content based on HTML 'data-*' attributes. It works great with pushState although doesn't include any history functionality or routing, nor is it a full-featured templating engine (althout it can be manipulated to be used as such).

####index.html
```html
...
<!-- CSS, JS -->
<script src="byda.js"></script>
<body>
	<div class="Header">
		<h3 class="Header-title">Byda Example</h3>
		<div class="Header-nav" data-load="navigation">
			<!-- Navigation loaded here -->
		</div>
	</div>
	<div class="Main">
		<div class="Main-content" data-load="content">
			<!-- Content loaded here -->
		</div>
	</div>
	<script>
		byda({view:'home'});
	</script>
</body>
...
```

####views/home.html
```html
<a data-load="navigation">
	<ul class="Navigation">
		<li>
			<a href="/home" class="selected">Home</a>
			<a href="/page/1">Page 1</a>
			<a href="/page/2">Page 2</a>
		</li>
	</ul>
</a>

<a data-load="content">
	<h3>Home</h3>
	<p>Paragraph content.</p>
</a>
```

When the index page or the '/home' path (if you're using routing, for example) is accessed, byda will load in HTML wrapped in data-load tags from the file specified. The HTML in the index page's data-load tags will be replaced with the new content.

You can of course initialize byda with options:

```javascript
byda({base:'examples', data:'custom', freeze:true});
```

#####base
string
Apply a base path to all of the ajax requests you perform with byda.
#####data
string
Specify a custom data attribute prefix to use. The default is data-load.
#####freeze
boolean
Store copies of the index.html byda elements in a variable to serve as a fallback if no corresponding element is specified in a view file.

####Callbacks

You can pass a callback to the `byda()` function as the second parameter. The function will be executed with two parameters: `elements` and `data`. 

`elements` is an object that contains all of the byda elements on the page (including inside of newly loaded content) organized by name into arrays.

```javascript
byda('path/to/file.html', function(elements) {
	elements.subtitle.innerHTML = 'Subtitle value set with JavaScript!';
});
```

`data` is an object that contains any json you want to load when calling `byda()`.

```javascript
function calendar(elements, data) {
	var days = data.days,
		activities = data.activities;

	$.each(days, function(index, value) {
		elements.calendar.append(index + ': ' + activities[index]);
	});
}

var options = {
	view: 'calendar',
	json: {
		'days': 'includes/json/days.json',
		'activities': 'includes/json/activities.json'
	}
}

byda(options, calendar);
```

Combining byda with pushState is a good idea. Page.js is a micro-router that lets us utilize pushState routing for our app:

```javascript
page('/', function(ctx) {
	byda({view:'home'});
});

page('/calendar/:day', function(ctx) {
	var day = ctx.params.day;
	byda(options, function(elements, data) {
		console.log(data.activities[day]);
	});
});

page();
```

You can now navigate through your ajax loads with the browser history.