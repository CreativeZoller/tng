"use strict";
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
function browserSyncInit(baseDir, files) {
	browserSync.instance = browserSync.init(files, {
		startPath: '/', server: { baseDir: baseDir, index: 'home.html' }, open: true, reloadOnRestart: true
	});
}
function changeEvent(evt) {
	gulpUtil.log('File', gulpUtil.colors.cyan(evt.path.replace(new RegExp('/.*(?=/./)/'), '')), 'was', gulpUtil.colors.magenta(evt.type));
}

var basePaths = {
	bowerDir: './bower_components/',
	tempDir: './.tmp/',
	builDir: './dist/',
	tempFiles: './.tmp/**/*',
	siteFiles: './_sites/**/*',
	buildFiles: './dist/**/*'
};
var	nunjPaths = {
	nunjSrc: './nunjDev/templates/',
	nunjFiles: './nunjDev/pages/**/*.+(html|nunjucks)',
	nunjData: './nunjDev/data.json',
	nunjBuilt: './_sites/'
};
var	htmlPaths = {
	htmlSrc: './_sites/**/*.html'
};
var	spritePaths = {
	spriteSrc: './_images/*.{gif,jpg,png,svg}',
	spriteIBuilt: './.tmp/images/',
	spriteSBuilt: './.tmp/style/',
	spriteSName: './.tmp/style/sprites.scss',
	retinaSrc: './_images/sprites-2x/**/*.png',
	retinafilter: './_images/sprites-2x/*-2x.png',
	retinaIName: 'retinaSprites.png',
	retinaSName: 'retinaSprites.scss',
	retinaRName: 'retinaSprites-2x.png',
	imageBuilt: './dist/images/',
	imageTemp: './.tmp/images/*.{gif,jpg,png,svg}',
	imageBuild: './dist/images/**/*.*'
};
var	stylePaths = {
	stylesSrc: './_scss/**/*.scss',
	stylesBuild: './dist/style',
	stylesTempFiles: './.tmp/style/**/*.scss',
	stylesTMain: './.tmp/style/main.css'
};
var	allowancePaths = {
	lintPureD: '!./.tmp/style/pure.scss',
	lintAnimateD: '!./.tmp/style/animate.scss',
	lintSpriteD: '!./.tmp/style/sprites.scss',
	lintRetineD: '!./.tmp/style/retinaSprites.scss',
	fixCssE: './.tmp/style/*.css',
	fixCssD: '!./.tmp/style/*.min.css',
	fixPureD: '!./.tmp/style/pure.css',
	fixPureE: './.tmp/style/pure.css',
	fixAnimateD: '!./.tmp/style/animate.css',
	fixAnimateE: './.tmp/style/animate.css',
	fixMinifieD: '!./.tmp/*.min.css'
};

gulp.task('cleanUp', function() {
	del([basePaths.buildFiles, basePaths.tempFiles, basePaths.siteFiles]);
});

gulp.task('bowerSetup', function() { 
	return bower()
 		.pipe(gulp.dest(basePaths.bowerDir)) 
		.pipe(bower({ cmd: 'prune'}))
		.on('error', function(err) {
			notify.onError({ title: 'bowerSetup error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		});
});

gulp.task('nunjucksGenerate', function() {
	nunjucksRender.nunjucks.configure(nunjPaths.nunjSrc);
	return gulp.src(nunjPaths.nunjFiles)
		.pipe(data(function() {
			return JSON.parse(fs.readFileSync(nunjPaths.nunjData,'utf8'))
		}))
		.once('data', devTimer.start)
		.pipe(nunjucksRender())
		.on('error', function(err) {
			notify.onError({ title: 'nunjucksGenerate error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(nunjPaths.nunjBuilt));
});

gulp.task('checkHtml', function() {
	return gulp.src(htmlPaths.htmlSrc)
		.pipe(htmlHint('.htmlhintrc'))
		.on('error', function(err) {
			notify.onError({ title: 'checkHtml error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(htmlHint.reporter("htmlhint-stylish")) ;
});
gulp.task('copyHtml', function() { 
	return gulp.src(htmlPaths.htmlSrc) 
		.on('error', function(err) {
			notify.onError({ title: 'copyHtml error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(basePaths.builDir)); 
});
gulp.task('minifyHtml', function() {
	return gulp.src(htmlPaths.htmlSrc)
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
		.on('error', function(err) {
			notify.onError({ title: 'minifyHtml error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(basePaths.builDir));
});

gulp.task('sprites', function () {
	return sprity.src({
			src: spritePaths.spriteSrc,
			style: spritePaths.spriteSName,
			processor: 'sass',
			prefix: 'tng',
			template: 'custom.hbs'
		})
		.pipe(gulpIf('*.png', gulp.dest(spritePaths.spriteIBuilt), gulp.dest(spritePaths.spriteSBuilt)));
});
gulp.task('retinaSprites', function() {
	var spriteData = gulp.src(spritePaths.retinaSrc)
		.pipe(spriteSmith({
			algorithm: 'binary-tree',
			retinaSrcFilter: spritePaths.retinafilter,
			imgName: spritePaths.retinaIName,
			retinaImgName: spritePaths.retinaRName,
			cssName: spritePaths.retinaSName
		}))
	spriteData.img.pipe(gulp.dest(spritePaths.spriteIBuilt));
	spriteData.css.pipe(gulp.dest(spritePaths.spriteSBuilt));
});
gulp.task('copyImgs:dev', function() { 
	return gulp.src([spritePaths.spriteSrc, spritePaths.imageTemp]) 
		.on('error', function(err) {
			notify.onError({ title: 'copyImgs:dev error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(spritePaths.imageBuilt));
});
gulp.task('copyImgs', function() { 
	return gulp.src(spritePaths.spriteSrc) 
		.on('error', function(err) {
			notify.onError({ title: 'copyImgs error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(spritePaths.spriteIBuilt));
});
gulp.task('minifyImgs', function() {
	return gulp.src(spritePaths.imageTemp)
		.pipe(imageMin({
			progressive: true,
			interlaced: true,
			optimizationLevel: 6,
			use: [pngQuant()]
		}))
		.on('error', function(err) {
			notify.onError({ title: 'minifyImgs error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(spritePaths.imageBuilt));
});

gulp.task('copySass', function() { 
	return gulp.src(stylePaths.stylesSrc) 
		.on('error', function(err) {
			notify.onError({ title: 'copySass error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(spritePaths.spriteSBuilt));
});
gulp.task('replaceSassPx', function() {
	return gulp.src(stylePaths.stylesTempFiles)
		.pipe(replace({
			patterns: [{
				match: /0px/g,
				replacement: '0'
			}]
		}))
		.on('error', function(err) {
			notify.onError({ title: 'replaceSassPx error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(spritePaths.spriteSBuilt));
});
gulp.task('replaceSpriteUrl', function() {
	return gulp.src(stylePaths.stylesTMain)
		.pipe(replace({
			patterns: [{
				match: /retina/g,
				replacement: '../images/retina'
			}]
		}))
		.on('error', function(err) {
			notify.onError({ title: 'replaceSpriteUrl error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(spritePaths.spriteSBuilt));
});
gulp.task('lintSass', function() {
	return gulp.src([stylePaths.stylesTempFiles, allowancePaths.lintAnimateD, allowancePaths.lintPureD, allowancePaths.lintSpriteD, allowancePaths.lintRetineD])
		.on('error', function(err) {
			notify.onError({ title: 'lintSass error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(scssLint({'config': 'lint.yml'}));
});
gulp.task('compileSass', function() {
	return gulp.src([stylePaths.stylesTempFiles, allowancePaths.lintSpriteD, allowancePaths.lintRetineD])
		.pipe(sass())
		.on('error', function(err) {
			notify.onError({ title: 'compileSass error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(spritePaths.spriteSBuilt));
});

gulp.task('cssAutofix', function () {
	return gulp.src([allowancePaths.fixCssE, allowancePaths.fixCssD, allowancePaths.fixPureD, allowancePaths.fixAnimateD])
		.pipe(autoPrefixer({
			browsers: ['> 10%', 'last 2 Chrome versions', 'last 2 Firefox versions', 'last 2 Opera versions', 'last 2 Safari versions', 'not ie <= 10'],
			cascade: false
		}))
		.on('error', function(err) {
			notify.onError({ title: 'cssPrefixing error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(cssComb({
			config: './csscomb.json'
		}))
		.on('error', function(err) {
			notify.onError({ title: 'cssComb error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(spritePaths.spriteSBuilt));
});
gulp.task('cssLint:dev', function() {
	return gulp.src([allowancePaths.fixCssE, allowancePaths.fixCssD, allowancePaths.fixPureD, allowancePaths.fixAnimateD])
		.pipe(cssLint('csslintrc.json'))
		.on('error', function(err) {
			notify.onError({ title: 'cssLint:dev error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(cssLint.reporter('compact'))
		.pipe(gulp.dest(stylePaths.stylesBuild))
		.pipe(notify({ message: "Development build was successful", onLast: true }))
		.pipe(devTimer);
});
gulp.task('cssLint', function() {
	return gulp.src([allowancePaths.fixCssE, allowancePaths.fixCssD, allowancePaths.fixPureD, allowancePaths.fixAnimateD])
		.pipe(cssLint('csslintrc.json'))
		.on('error', function(err) {
			notify.onError({ title: 'cssLint error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(cssLint.reporter('junit-xml'));
});
gulp.task('3rdPartyCss', function() {
	return gulp.src([allowancePaths.fixPureE, allowancePaths.fixAnimateE])
		.on('error', function(err) {
			notify.onError({ title: '3rdPartyCss copy error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(stylePaths.stylesBuild))
});
gulp.task('base64Css', function() {
	return gulp.src([allowancePaths.fixCssE, allowancePaths.fixCssD, allowancePaths.fixPureD, allowancePaths.fixAnimateD])
		.pipe(base64({
			extensions: ['svg', 'png', 'jpg', 'jpeg'],
			maxImageSize: 20*1024,
			debug: true
		}))
		.on('error', function(err) {
			notify.onError({ title: 'base64 error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(cssLint.reporter())
		.pipe(gulp.dest(spritePaths.spriteSBuilt));
});
gulp.task('minifyCss', function () {
	return gulp.src([allowancePaths.fixCssE, allowancePaths.fixMinifieD])
		.pipe(sourceMaps.init())
		.pipe(minifyCss({
			keepSpecialComments : 0
		}))
		.on('error', function(err) {
			notify.onError({ title: 'minifyCss error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		//.pipe(rename({suffix: '.min'}))
		.pipe(sourceMaps.write('.'))
		.on('error', function(err) {
			notify.onError({ title: 'sourceWriting error!', message: '<%= error.message %>', sound: 'Frog' })(err);
			this.emit('end');
		})
		.pipe(gulp.dest(stylePaths.stylesBuild))
		.pipe(notify({ message: "Deployment build was successful", onLast: true }));
});


gulp.task('buildDev', function() {
	runSequence(['cleanUp'], 'nunjucksGenerate', 'checkHtml', 'copyHtml', 'sprites', 'retinaSprites', 'copySass', 'replaceSassPx', 'copyImgs:dev', 'lintSass', 'compileSass', 'replaceSpriteUrl', '3rdPartyCss', 'cssLint:dev', function() {
		reload({ stream: true });
	});
});

gulp.task('build', function() {
	runSequence(['cleanUp'], 'nunjucksGenerate', 'minifyHtml', 'sprites', 'retinaSprites', 'copyImgs', 'minifyImgs', 'copySass', 'compileSass', 'cssAutofix', 'cssLint', 'replaceSpriteUrl', '3rdPartyCss', 'base64Css', 'minifyCss', function() {
		reload({ stream: true });
	});
});

gulp.task('serve', function () {
	browserSyncInit(basePaths.builDir);
});
