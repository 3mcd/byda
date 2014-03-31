#byda.js
------

byda is a small (~3kb minified) library that allows you to load in ajax content based on HTML 'data-*' attributes. It works great with pushState although doesn't include any history functionality or routing, nor is it a full-featured templating engine (althout it can be manipulated to be used as such).

##Basic Example
------

####index.html
```html
...
	<!-- CSS, JS -->
	<script src="byda.js"></script>
</head>
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

##Callbacks
------

You can pass a callback to the `byda()` function as the second parameter. The function will be executed with two parameters: `collections` and `data`.

###flash

The first parameter of the callback will be passed an object that contains all of the newly loaded byda info including an object containing a list of byda elements organized by name into arrays called collections.

```javascript
byda('path/to/file.html', function(flash) {
	// Access the subtitle collection (which has one element inside)
	flash.collections.subtitle.innerHTML = 'Subtitle value set with JavaScript!';
});
```

Collections currently only have one method, `set()`, which will set the innerHTML of all elements in the collection to a specified string. This is useful if your collection contains multiple elements that you want to have the same values.

```javascript
flash.collections.day.set(ctx.params.day);
```

###data

`data` is an object that contains any json you want to load when calling `byda()`.

```javascript
function calendar(flash, data) {
	var activities = data.activities;

	$.each(days, function(index, value) {
		flash.collections.calendar.append(index + ': ' + activities[index]);
	});
}

byda({
	view: 'calendar',
	json: {'activites' : 'includes/json/activities.json'},
	callback: calendar
});
```

Combining byda with pushState is a good idea. Page.js is a micro-router that lets us utilize pushState routing for our app:

```javascript
page('/', function(ctx) {
	byda({view:'home'});
});

page('/calendar/:day', function(ctx) {
	var day = ctx.params.day;
	byda(/* options */, function(collections, data) {
		console.log(data.activities[day]);
	});
});

page();
```

You can now navigate through your ajax loads with the browser history.

##Public API
------

###byda(options, callback)
Load data into your document by data attributes through XHR or HTML import (experimental).

| Option        | typeof        | Description 																			 	|
| ------------- |:-------------:| :---------------------------------------------------------------------------------------- |
| complete     	| function 		| Callback function that is run after byda is complete. Passed back flash and json data.	|
| file	     	| string 		| Path to a file to use as the basis for swapping the content of byda elements.				|
| json      	| string      	| The path to a .json file to load alongside the HTML.										|
| view	 		| string      	| Shorthand for 'file':'views/' + (path) + '.html'. 										|

###byda.base
Set the base path for XHR

```javascript
byda.base('/path/to/base');
```

###byda.init
You can of course initialize byda with options:

```javascript
byda({
	base: '/examples',
	data: 'foo', // will now look for elements with the attribute called 'data-foo'
	freeze: true
});
```

| Option        | typeof        | Description 																			 	|
| ------------- |:-------------:| :---------------------------------------------------------------------------------------- |
| base      	| string 		| Apply a base path to all of the ajax requests you perform with byda.						|
| complete     	| function 		| A global complete function that will call after every byda request or import.				|
| data      	| string      	| Specify a custom data attribute prefix to use. The default is data-load. 					|
| freeze 		| boolean      	| Store copies of the index.html byda elements in a variable to serve as a fallback if no corresponding element is specified in a view file. |
| imports 		| boolean      	| Use HTML5 imports instead of XHR (experimental)											|

###byda.flash(options)
Returns a `Flash` object:

| Option        | typeof        | Description 																			 	|
| ------------- |:-------------:| :---------------------------------------------------------------------------------------- |
| dom	      	| string      	| A string of custom HTML to use as the DOM when generating list of byda elements Flash#list. Optional. |
| frozen		| boolean		| Perform cloneNode() on the byda elements before pushing them to the Flash#list.			|

Example:

```javascript
var older = byda.flash({frozen: true});

// Do something, like edit the value of some byda elements

var newer = byda.flash();

newer.compare(older).commit(); // Revert back to the older values
```

####Flash API

| Flash#        | typeof        | Description 																			 	|
| ------------- |:-------------:| :---------------------------------------------------------------------------------------- |
| changes      	| array 		| Contains a list of all changes generated by Flash#compare. 								|
| commit      	| function      | Perform the changes. 																		|
| compare 		| function      | Compare flash with another flash to generate an array of changes stored in Flash#changes. |
| elements      | object      	| An organization of byda elements on the page. 											|
| list 			| array      	| Contains a list of all byda elements on the page. Generated when the Flash is created. 	|
| organize      | function 		| Organize all elements from Flash#list or an array specified in the first parameter. 		|

###byda.freeze
Store copies of the index.html byda elements in a variable to serve as a fallback if no corresponding element is specified in a view file.

###byda.get
Returns an array of all byda elements on the page.
