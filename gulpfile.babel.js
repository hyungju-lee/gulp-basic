"use strict";

// 모듈 호출
// gulp             : gulp 모듈
// gulp-eslint      : javascript 문구 문법 검사
// gulp-concat      : javascript 파일을 한 파일로 합쳐주는 모듈
// gulp-uglify      : javascript 파일을 min 파일처럼 압축해주는 모듈
// gulp-babel       : es6를 es5로 컴파일 해주는 모듈
// gulp-rename      : 파일의 이름을 바꿔주는 모듈
// gulp-jade        : HTML 템플릿 중 하나인 jade 템플릿을 사용할 수 있게 하는 모듈
// gulp-ejs         : HTML 템플릿 중 하나인 ejs 템플릿을 사용할 수 있게 하는 모듈
// gulp-sass        : sass를 사용할 수 있게 해주는 모듈
// gulp-clean-css   : css 파일을 이쁘게 압축해주는 모듈
// del              : 폴더(디렉터리)/파일 제거
// gulp-connect     : local 서버와 연결하게 해주는 모듈
// gulp-open        : 브라우저를 열게하는 모듈
// gulp-sass-lint   : sass 문법검사 모듈
// autoprefixer     : vend prefix를 자동으로 달아주는 모듈
// gulp-postcss     : 위 autoprefixer와 같이 쓰는 모듈
// gulp-imagemin    : image 파일 용량을 줄여주는 모듈
// gulp.spritesmith : sprite 이미지와 CSS 자동 생성 모듈
// vinyl-buffer     : gulp.spritesmith 모듈과 gulp-imagemin 모듈을 연결시켜주는 모듈
// merge-stream     : stream을 merge시켜주는 모듈, 종료신호를 묶어서 보낼 수 있다.

import fs from 'fs';
import {src, dest, watch, series, parallel, lastRun} from 'gulp';
import esLint from 'gulp-eslint';
import jsConcat from 'gulp-concat';
import jsUglify from 'gulp-uglify';
import babel from 'gulp-babel';
import rename from 'gulp-rename';
import jade from 'gulp-jade';
import ejs from 'gulp-ejs';
import sass from 'gulp-sass';
import cleanCss from 'gulp-clean-css';
import del from 'del';
import connect from 'gulp-connect';
import open from 'gulp-open';
import sassLint from 'gulp-sass-lint';
import autoprefixer from 'autoprefixer';
import postcss from 'gulp-postcss';
import imagemin from 'gulp-imagemin';
import spritesmith from 'gulp.spritesmith';
import buffer from 'vinyl-buffer';
import merge from 'merge-stream';
import config from './config.json';

// 테스트 중인 기능
export const fsReadDir = () => {
    let fileList;
    let fileList2 = [];
    fileList = fs.readdirSync('./src/ejs/', {
        encoding: 'utf8',
        withFileTypes: true
    });
    fileList.forEach(function (file, index) {
        if (!file.isDirectory()) {
            fileList2.push(file.name)
        }
    });
    console.log(fileList);
    console.log(fileList[0].isDirectory());
    console.log(fileList[3].isDirectory());
    console.log(fileList2);
};


/*
 * For small tasks you can export arrow functions
 */
// 파일 삭제
export const Clean = () => {
    return del(
        [config.path.del.dest]
    );
};

// 이미지 용량 줄이기 및 sprite
export const SpriteAndImgCompress = () => {
    const imgCompress = src(config.path.img.src)
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 80, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(dest(config.path.img.dest));
    const spriteData = src(config.path.spImg.src)
        .pipe(spritesmith({
            retinaSrcFilter: config.path.retinaImg.src,
            imgName: config.path.spImg.filename,
            retinaImgName: config.path.retinaImg.filename,
            imgPath: config.path.spImg.imgPath,
            retinaImgPath: config.path.retinaImg.retinaImgPath,
            cssName: '_sprite.scss',
            padding: 2
        }));
    const imgStream = spriteData.img
        .pipe(buffer())
        .pipe(imagemin())
        .pipe(dest(config.path.spImg.dest));
    const cssStream = spriteData.css
        .pipe(dest('src/sass/modules/'));
    return merge(imgCompress, imgStream, cssStream);
};

// Sass 컴파일
// 주의할 점, Jade 템플릿과 어떻게 연동했냐에 따라서 watch 함수 내부를 수정해줄 필요가 있다.
// Jade 템플릿에 style 태그에 인라인 형식으로 불러왔으면 watch 형식에서 Jade 탬플릿까지 수정을해줘야하는 함수를 호출해야한다.
const Sass = () => {
    return src(config.path.sass.src, {sourcemaps: true})
        .pipe(sassLint({
            options: {
                formatter: 'stylish'
            }
        }))
        .pipe(sassLint.format())
        .pipe(sass({
            sourceComments: false, // source 위치 주석
            outputStyle: 'compact' // nested, expanded, compact, compressed
        }).on('error', sass.logError))
        .pipe(postcss([autoprefixer()]))
        .pipe(cleanCss({format: 'keep-breaks'}))
        .pipe(dest(config.path.sass.dest, {sourcemaps: true}))
        .pipe(connect.reload())
};

// JS 문법 검사
const HintJs = () => {
    return src(config.path.js.src)
        .pipe(esLint())
        .pipe(esLint.format())
};

// JS 병합
const ConcatJs = () => {
    return src(config.path.js.src)
        .pipe(jsConcat(config.path.js.filename))
        .pipe(babel())
        .pipe(dest(config.path.js.dest));
};

// JS 압축
const UglifyJs = () => {
    return src(config.path.js.dest + config.path.js.filename, {sourcemaps: true})
        .pipe(jsUglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(dest(config.path.js.dest, {sourcemaps: true}))
        .pipe(connect.reload())
};

// JS libs 내보내기
const Libs = () => {
    return src(config.path.js.libs)
        .pipe(dest(config.path.js.libsDest))
        .pipe(connect.reload())
};

// Jade 컴파일
const JadeCompile = () => {
    return src(config.path.jade.src, {since: lastRun(JadeCompile)})
        .pipe(jade({
            pretty: true
        }))
        .pipe(dest(config.path.jade.dest))
        .pipe(connect.reload())
};

// ejs 컴파일
const EjsCompile = () => {
    return src(config.path.ejs.src, {since: lastRun(EjsCompile)})
        .pipe(ejs({
            msg: "Hello Gulp!"
        }))
        .pipe(rename({
            extname: ".html"
        }))
        .pipe(dest(config.path.ejs.dest))
        .pipe(connect.reload())
};

// 웹 서버 업무 (LiveReload 사용)
const Server = () => {
    return connect.server({
        root: config.path.browser.dest,
        port: config.port,
        livereload: config.livereload
    })
};

// 브라우저 오픈 업무
const BrowserOpen = () => {
    const options = {
        uri: `http://localhost:${config.port}`,
        app: config.browser //chrome, firefox, iexplore, opera, safari
    };
    return src(config.path.browser.dest)
        .pipe(open(options)); // local 서버가 아닌 파일 경로로 열려면 '<%file.path%>' 를 넣어주면된다.
};

// 지속적 관찰(Watch) 업무 정의
// Jade Template 내부 인라인 형식으로 들어가게 했을지도 모르므로 다음과 같이 모든 함수 뒤에 JadeCompile 함수를 호출하였다.
const FileWatch = () => {
    watch([config.path.img.src, config.path.spImg.src], SpriteAndImgCompress);
    watch([config.path.jade.src, config.path.jade.parts], JadeCompile);
    watch([config.path.ejs.src, config.path.ejs.parts], EjsCompile);
    watch(config.path.sass.src, series(Sass, JadeCompile, EjsCompile));
    watch(config.path.js.src, series(HintJs, ConcatJs, UglifyJs, JadeCompile, EjsCompile));
    watch(config.path.js.libs, Libs, JadeCompile, EjsCompile);
};

/*
 * You could even use `export as` to rename exported tasks
 */
exports.build = series(Clean, series(Libs, SpriteAndImgCompress), parallel(Sass, series(HintJs, ConcatJs, UglifyJs)), JadeCompile, EjsCompile);

/*
 * You could even use `export as` to rename exported tasks
 */
exports.watch = parallel(Server, BrowserOpen, FileWatch);

/*
 * Export a default task
 */
exports.default = series(Clean, series(Libs, SpriteAndImgCompress), parallel(Sass, series(HintJs, ConcatJs, UglifyJs)), JadeCompile, EjsCompile, parallel(Server, BrowserOpen, FileWatch));