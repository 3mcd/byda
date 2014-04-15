describe("Byda core [ajax]", function() {
    var base = window.location.href.split('/').slice(0, window.location.href.split('/').indexOf('_SpecRunner.html')).join('/'),
        testDone,
        testStr;

    beforeEach(function() {
        byda.init({
            base: base,
            complete: function() {
                if (testDone) testDone();
            }
        });
        testStr = document.querySelector('#setup').innerHTML;
    });

    beforeEach(function(done) {
        byda('spec/import.html');
        testDone = done;
    });

    it("Ajax success", function(done) {
        done();
    });

    it("Loaded content identical to source", function() {
        expect(document.querySelector('#content').innerHTML).toEqual(testStr);
    });
});