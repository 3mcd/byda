load.init({
    base: '/example',
    imports: false, // Set this to true to enable HTML imports
    freeze: true
});

var index = 0;

page('/', function(ctx) {
    load({view:'home.byda'}, function(flash) {
        flash.set('counter', 'Home visits: ' + index++);
        $('#counterBtn').on('click', function() {
            page('/');
        });
    });
});

page('/page/:id', function(ctx) {
    load({view: 'page.byda'}, function(flash){
        flash.set('page', ctx.params.id);
    });
});

var forwards, backwards;

page('/periodic-table/:row/:num', function(ctx) {
    var row = ctx.params.row;
    var num = ctx.params.num;
    load({
        view: 'chemical.byda',
        json: { 'periodic': 'includes/periodic-table.json' }
    }, function(flash, data) {
        var element = isNaN(row) ? data.periodic[row][num] : data.periodic.table[row].elements[num];
        forwards = flash.map(element, false);
        console.log(forwards);
        backwards = forwards.compare(flash);
    });
});

page('/periodic-table', function() {
    load({
        view: 'list.byda',
        json: { 'periodic': 'includes/periodic-table.json' }
    }, function(flash, data) {
        flash.set('heading', 'Periodic Table');
        flash.set('descriptions', 'A list of all elements on the periodic table, each with a small set of data.');
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