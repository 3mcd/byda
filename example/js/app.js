load.init({
    base: '/example',
    imports: false, // Set this to true to enable HTML imports
    freeze: true
});

var index = 0;

page('/', function(ctx) {
    load({view:'home.byda'}, function(flash) {
        flash.collections.counter.set('Home visits: ' + index++);
        $('#counterBtn').on('click', function() {
            page('/');
        });
    });
});

page('/page/:id', function(ctx) {
    load({view: 'page.byda'}, function(flash){
        flash.collections.page.set(ctx.params.id);
    });
});

page('/periodic-table/:row/:num', function(ctx) {
    var row = ctx.params.row;
    var num = ctx.params.num;
    load({
        view: 'chemical.byda',
        json: { 'periodic': 'includes/periodic-table.json' }
    }, function(flash, data) {
        var element = isNaN(row) ? data.periodic[row][num] : data.periodic.table[row].elements[num];
        flash.collections.heading.set('Periodic Table - ' + element.small);
        flash.collections['full-name'].set(element.name);
        flash.collections.group.set(element.group);
        flash.collections.position.set(element.position);
        flash.collections.molar.set(element.molar);
        flash.collections.number.set(element.number);
        flash.collections.electrons.set(JSON.stringify(element.electrons));
    });
});

page('/periodic-table', function() {
    load({
        view: 'list.byda',
        json: { 'periodic': 'includes/periodic-table.json' }
    }, function(flash, data) {
        flash.collections.heading.set('Periodic Table');
        flash.collections.description.set('A list of all elements on the periodic table, each with a small set of data.');
        $.each(data.periodic.table, function(row, value) {
            $('.Card').append('<div class="TableView TableView-divider">Row ' + row + '</div>');
            Util.list(value.elements, 'TableView', '.Card', function(key, element) {
                return '<div class="TableView-cell"><a href="/periodic-table/'+ row + '/' + key +'">' + element.name + '</a></div>';
            });
        });

        $('.Card').append('<div class="TableView TableView-divider">Actinoids</div>');
        Util.list(data.periodic.actinoids, 'TableView', '.Card', function(key, element) {
            return '<div class="TableView-cell"><a href="/periodic-table/actinoids/' + key +'">' + element.name + '</a></div>';
        });

        $('.Card').append('<div class="TableView TableView-divider">Lanthanoids</div>');
        Util.list(data.periodic.lanthanoids, 'TableView', '.Card', function(key, element) {
            return '<div class="TableView-cell"><a href="/periodic-table/lanthanoids/' + key +'">' + element.name + '</a></div>';
        });
    });
});


page('/failure', function(ctx) {
    load('nonsense');
});

page();