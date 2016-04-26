var gulp = require('gulp'),
	fs = require('fs'),
	data = require('gulp-data'),
	bower = require('gulp-bower'),
	rename = require('gulp-rename'),
	browserSync = require('browser-sync'),
	reload = browserSync.reload,
	del = require('del'),
	gulpIf = require('gulp-if'),
	replace = require('gulp-replace-task'),
	runSequence = require('run-sequence'),
	gulpUtil = require('gulp-util'),
	notify = require('gulp-notify'),
	duration = require('gulp-duration'),
	pkg = require('./package.json'),
	devTimer = duration('Development process time'),
	nunjucksRender = require('gulp-nunjucks-render'),
	htmlHint = require('gulp-htmlhint'),
	minifyHtml = require('gulp-htmlmin'),
	sass = require('gulp-sass'),
	scssLint = require('gulp-scss-lint'),
	autoPrefixer = require('gulp-autoprefixer'),
	cssComb = require('gulp-csscomb'),
	cssLint = require('gulp-csslint'),
	base64 = require('gulp-base64'),
	sourceMaps = require('gulp-sourcemaps'),
	minifyCss = require('gulp-minify-css'),
	sprity = require('sprity'),
	spriteSmith = require('gulp.spritesmith'),
	imageMin = require('gulp-imagemin'),
	pngQuant = require('imagemin-pngquant'),
	uglify = require('gulp-uglify')
;

gulp.task('cleanUp', function() {
	del(['./dist/**/*', './.tmp/**/*']);
});

gulp.task('bowerSetup', function() { 
	return bower()
 		.pipe(gulp.dest('./bower_components/')) 
		.pipe(bower({ cmd: 'prune'}))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: bowerSetup', err, {showStack: true});
		});
});

gulp.task('nunjucksGenerate', function() {
	nunjucksRender.nunjucks.configure(['./nunjDev/templates/']);
	return gulp.src('./nunjDev/pages/**/*.+(html|nunjucks)')
		.pipe(data(function() {
			return JSON.parse(fs.readFileSync('./nunjDev/data.json','utf8'))
		}))
		.once('data', devTimer.start)
		.pipe(nunjucksRender())
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: nunjucksGenerate', err, {showStack: true});
		})
		.pipe(gulp.dest('./_sites'));
});

gulp.task('checkHtml', function() {
	return gulp.src('./_sites/**/*.html')
		.pipe(htmlHint('.htmlhintrc'))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: checkHtml', err, {showStack: true});
		})
		.pipe(htmlHint.reporter("htmlhint-stylish")) ;
});
gulp.task('copyHtml', function() { 
	return gulp.src('./_sites/**/*.html') 
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: copyHtml', err, {showStack: true});
		})
		.pipe(gulp.dest('./dist')); 
});
gulp.task('minifyHtml', function() {
	return gulp.src('./_sites/**/*.html')
		.pipe(minifyHtml({
			removeComments: true,
			removeCommentsFromCDATA: true,
			removeCDATASectionsFromCDATA: true,
			collapseWhitespace: true,
			collapseInlineTagWhitespace: true,
			conservativeCollapse: true,
			preserveLineBreaks: true,
			removeScriptTypeAttributes: true
		}))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: minifyHtml', err, {showStack: true});
		})
		.pipe(gulp.dest('./dist'));
});
gulp.task('sprites', function () {
	return sprity.src({
			src: './_images/*.{gif,jpg,png,svg}',
			style: './.tmp/style/sprites.scss',
			processor: 'sass',
			prefix: 'tng',
			template: 'custom.hbs'
		})
		.pipe(gulpIf('*.png', gulp.dest('./.tmp/images'), gulp.dest('./.tmp/style')))
});
gulp.task('retinaSprites', function() {
	var spriteData = gulp.src('./_images/sprites-2x/**/*.png')
		.pipe(spriteSmith({
			algorithm: 'binary-tree',
			retinaSrcFilter: './_images/sprites-2x/*-2x.png',
			imgName: 'retinaSprites.png',
			retinaImgName: 'retinaSprites-2x.png',
			cssName: 'retinaSprites.scss'
		}))
	spriteData.img.pipe(gulp.dest('./.tmp/images'));
	spriteData.css.pipe(gulp.dest('./.tmp/style'));
});
gulp.task('copyImgs:dev', function() { 
	return gulp.src(['./_images/*.{gif,jpg,png,svg}', './.tmp/images/*.{gif,jpg,png,svg}']) 
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: copyImgs:dev', err, {showStack: true});
		})
		.pipe(gulp.dest('./dist/images'));
});
gulp.task('copyImgs', function() { 
	return gulp.src('./_images/*.{gif,jpg,png,svg}') 
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: copyImgs', err, {showStack: true});
		})
		.pipe(gulp.dest('./.tmp/images'));
});
gulp.task('minifyImgs', function() {
	return gulp.src('./.tmp/images/**/*.{gif,jpg,png,svg}')
		.pipe(imageMin({
			progressive: true,
			interlaced: true,
			optimizationLevel: 6,
			use: [pngQuant()]
		}))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: minifyImgs', err, {showStack: true});
		})
		.pipe(gulp.dest('./dist/images'));
});

gulp.task('copySass', function() { 
	return gulp.src('./_scss/**/*.scss') 
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: copySass', err, {showStack: true});
		})
		.pipe(gulp.dest('./.tmp/style'));
});
gulp.task('replaceSassPx', function() {
	return gulp.src('./.tmp/style/**/*.scss')
		.pipe(replace({
			patterns: [{
				match: /0px/g,
				replacement: '0'
			}]
		}))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: replaceSassPx', err, {showStack: true});
		})
		.pipe(gulp.dest('./.tmp/style'));
});
gulp.task('replaceSpriteUrl', function() {
	return gulp.src('./.tmp/style/main.css')
		.pipe(replace({
			patterns: [{
				match: /retina/g,
				replacement: '../images/retina'
			}]
		}))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: replaceSassPx', err, {showStack: true});
		})
		.pipe(gulp.dest('./.tmp/style'));
});
gulp.task('lintSass', function() {
	return gulp.src(['./.tmp/style/**/*.scss', '!./.tmp/style/animate.scss', '!./.tmp/style/pure.scss', '!./.tmp/style/sprites.scss', '!./.tmp/style/retinaSprites.scss'])
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: lintSass', err, {showStack: true});
		})
		.pipe(scssLint({'config': 'lint.yml'}));
});
gulp.task('compileSass', function() {
	return gulp.src(['./.tmp/style/**/*.scss', '!./.tmp/style/sprites.scss', '!./.tmp/style/retinaSprites.scss'])
		.pipe(sass())
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: compileSass', err, {showStack: true});
		})
		.pipe(gulp.dest('./.tmp/style'));
});

gulp.task('cssAutofix', function () {
	return gulp.src(['./.tmp/style/*.css', '!./.tmp/style/*.min.css', '!./.tmp/style/pure.css', '!./.tmp/style/animate.css'])
		.pipe(autoPrefixer({
			browsers: ['> 10%', 'last 2 Chrome versions', 'last 2 Firefox versions', 'last 2 Opera versions', 'last 2 Safari versions', 'not ie <= 10'],
			cascade: false
		}))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: cssAutofix - autoPrefixing', err, {showStack: true});
		})
		.pipe(cssComb({
			config: './csscomb.json'
		}))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: cssAutofix - cssComb', err, {showStack: true});
		})
		.pipe(gulp.dest('./.tmp/style'));
});
gulp.task('cssLint:dev', function() {
	return gulp.src(['./.tmp/style/*.css', '!./.tmp/style/*.min.css', '!./.tmp/style/pure.css', '!./.tmp/style/animate.css'])
		.pipe(cssLint('csslintrc.json'))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: cssLint:dev', err, {showStack: true});
		})
		.pipe(cssLint.reporter('compact'))
		.pipe(gulp.dest('./dist/style'))
		.pipe(notify({ message: "Development build was successful", onLast: true }))
		.pipe(devTimer);
});
gulp.task('cssLint', function() {
	return gulp.src(['./.tmp/style/*.css', '!./.tmp/style/*.min.css', '!./.tmp/style/pure.css', '!./.tmp/style/animate.css'])
		.pipe(cssLint('csslintrc.json'))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: cssLint', err, {showStack: true});
		})
		.pipe(cssLint.reporter('junit-xml'));
});
gulp.task('3rdPartyCss', function() {
	return gulp.src(['./.tmp/style/pure.css', './.tmp/style/animate.css'])
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: 3rdPartyCss copy', err, {showStack: true});
		})
		.pipe(gulp.dest('./dist/style'))
});
gulp.task('base64Css', function() {
	return gulp.src(['./.tmp/style/*.css', '!./.tmp/style/*.min.css', '!./.tmp/style/pure.css', '!./.tmp/style/animate.css'])
		.pipe(base64({
			extensions: ['svg', 'png', 'jpg', 'jpeg'],
			maxImageSize: 20*1024,
			debug: true
		}))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: base64', err, {showStack: true});
		})
		.pipe(cssLint.reporter());
});
gulp.task('minifyCss', function () {
	return gulp.src(['./.tmp/style/*.css', '!./.tmp/*.min.css'])
		.pipe(sourceMaps.init())
		.pipe(minifyCss({
			keepSpecialComments : 0
		}))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: minifyCss - minifying', err, {showStack: true});
		})
		.pipe(rename({suffix: '.min'}))
		.pipe(sourceMaps.write('.'))
		.on('error', function(err){
			new gulpUtil.PluginError('Task error: minifyCss - generating', err, {showStack: true});
		})
		.pipe(gulp.dest('./dist/style'))
		.pipe(notify({ message: "Deployment build was successful", onLast: true }));
});


function browserSyncInit(baseDir, files) {
	browserSync.instance = browserSync.init(files, {
		startPath: '/', server: { baseDir: baseDir, index: 'home.html' }, open: true, reloadOnRestart: true
	});
}

function changeEvent(evt) {
    gulpUtil.log('File', gulpUtil.colors.cyan(evt.path.replace(new RegExp('/.*(?=/./)/'), '')), 'was', gulpUtil.colors.magenta(evt.type));
}

gulp.task('buildDev', function() {
	runSequence(['cleanUp'], 'nunjucksGenerate', 'checkHtml', 'copyHtml', 'sprites', 'retinaSprites', 'copySass', 'replaceSassPx', 'copyImgs:dev', 'lintSass', 'compileSass', 'replaceSpriteUrl', '3rdPartyCss', 'cssLint:dev', function() {
		reload({ stream: true });
	});
});

gulp.task('build', function() {
	runSequence(['cleanUp'], 'nunjucksGenerate', 'minifyHtml', 'sprites', 'retinaSprites', 'copyImgs', 'minifyImgs', 'copySass', 'compileSass', 'cssAutofix', 'cssLint', '3rdPartyCss', 'base64Css', 'minifyCss', function() {
		reload({ stream: true });
	});
});

gulp.task('serve', function () {
	browserSyncInit('./dist/');
});

