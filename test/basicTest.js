var assert = require('assert');
var fs = require('fs');
var grunt = require('grunt');
var path = require('path');

var output = path.resolve('./', 'test/sample.html');

describe('grunt aglio', function(){
	this.timeout(5000);

	function resetTempFiles(callback){
		if(fs.existsSync(output)){
			fs.unlinkSync(output);
		}
		// Get rid of the multiple md files
		var filesToDelete = fs.readdirSync(path.resolve('./', 'test')).filter(function(filename){
			var parts = filename.split('.');
			return (parts[parts.length - 1] === 'md' && parts[0] !== 'sample') || parts[parts.length - 1] === 'html';
		});
		for(var i = 0; i < filesToDelete.length; i++){
			fs.unlinkSync(path.resolve('./', 'test/'+filesToDelete[i]));
		}

		callback();
	}

	before(function(done){
		grunt.task.loadTasks('tasks');
		assert(grunt.task.exists('aglio'));
		resetTempFiles(done);
	});

	beforeEach(function(){
		grunt.task.clearQueue();
	});

	it('should do a basic run', function(done){
    this.timeout(15000);
		var configObj = {};
		configObj[output] = [path.resolve('./', 'test/sample.md')];
		grunt.config('aglio.test.files', configObj);
		grunt.task.run('aglio');
		grunt.task.start();

		setTimeout(function(){
			fs.exists(output, function(exists){
				assert(exists);
				resetTempFiles(done);
			})
		}, 10000);

	});

	it('should be able to combine a large number of files together', function(done){
		// Split out sample.md into multiple small files
		var sampleFile = fs.readFileSync(path.resolve('./', 'test/sample.md'), {
			encoding: 'utf8'
		}).split("\n");

		var destFiles = [];
		for(var i = 0; i < sampleFile.length; i++){
			fs.writeFileSync(path.resolve('./', 'test/'+i+'.md'), sampleFile[i]);
			destFiles.push(path.resolve('./', 'test/'+i+'.md'));
		}

		var configObj = {};
		configObj[output] = destFiles;
		grunt.config('aglio.test.files', configObj);
		grunt.config('aglio.test.options.separator', grunt.util.linefeed);
		grunt.task.run('aglio');
		grunt.task.start();

		setTimeout(function(){
			fs.exists(output, function(exists){
				assert(exists);
				resetTempFiles(done)
			})
		}, 1000);
	});

	// NOTE: all theme* options are theme-specific as of aglio 2.x. as such,
	// testing for them may not be worthwhile.
  it('should use a custom jade template', function (done) {
    var configObj = {};
    configObj[output] = [path.resolve('./', 'test/sample.md')];
    grunt.config('aglio.test.files', configObj);
    grunt.config('aglio.test.options.themeTemplate', 'test/fixtures/index-custom.jade');
    grunt.task.run('aglio');
    grunt.task.start();

    setTimeout(function(){
      fs.exists(output, function(exists){
        assert(exists);
        // Make sure that it used the slate theme
        var contents = fs.readFileSync(output, 'utf8');
        assert(contents.indexOf('CUSTOM_JADE_TEMPLATE') > -1);
        resetTempFiles(done);
      })
    }, 1000);
  });

  it('should be able to process include directive', function(done){
    var configObj = {};
    configObj[output] = [path.resolve('./', 'test/fixtures/sample-include.md')];
    grunt.config('aglio.test.files', configObj);
    grunt.config('aglio.test.options', {
      includePath: path.join(__dirname, 'fixtures')
    });

    grunt.task.run('aglio');
    grunt.task.start();

    setTimeout(function(){
      assert(fs.existsSync(output));
      resetTempFiles(done);
    }, 1000);
  });

  after(function(done){
		resetTempFiles(done);
	})
});
