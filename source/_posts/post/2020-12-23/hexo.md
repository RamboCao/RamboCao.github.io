---
title: Hexo 博客搭建
tags: 
    - Hexo
    - Install
categories: Hexo
keywords: Hexo 安装
top_img:
cover: https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18010.jpg
abbrlink: ab21860c
date: 2020-12-23 10:57:32
---
Welcome to [Hexo](https://hexo.io/)! This is your very first post. Check [documentation](https://hexo.io/docs/) for more info. If you get any problems when using Hexo, you can find the answer in [troubleshooting](https://hexo.io/docs/troubleshooting.html) or you can ask me on [GitHub](https://github.com/hexojs/hexo/issues).

---
## Hexo 
Hexo 优点:
   - 渲染速度快
   - 支持 Markdown
   - 一键部署
   - 插件和可扩展性
---
### Hexo 安装
#### npm 安装
采用 npm 安装并且进行初始化, 由于npm的默认源下载较慢，所以可以更换下载源进行下载。

```shell
# 查看npm的配置
npm config list
# 默认源
npm config set registry https://registry.npmjs.org
# 临时改变镜像源
npm --registry=https://registry.npm.taobao.org
# 永久设置为淘宝镜像源
npm config set registry https://registry.npm.taobao.org
# 另一种方式，编辑 ~/.npmrc 加入下面内容
registry = https://registry.npm.taobao.org
```

{% note info modern %}
 npm 包的全局模块路径和缓存路径进行设置
{% endnote %}

#### npm 全局模块路径和缓存路径
先新建两个文件夹 <code>node_global</code> 和 <code>node_cache</code>
```shell
npm config set prefix "C:\Program Files\nodejs\node_global"
npm config set cache "C:\Program Files\nodejs\node_cache"
```
然后在环境变量中找到 path 变量进行修改，修改值：
<code>C:/Users/[username]/AppData/Roaming/npm</code>
<code>C:/Program Files/nodejs/node_cache</code>

#### Git 安装
  - Git 仓库搭建规则：必须使用 <code><用户名>.github.io</code>, 这样才能在部署的时候匹配到，直接访问 [Github](https://RamboCao.github.io).
  - 然后在本地对 Git 进行配置即可

#### Hexo 安装与发布到 Github Pages
```shell
# hexo框架的安装
npm install -g hexo-cli
# 等上一个命令完成后，在输入下面的命令
hexo init <新建文件夹的名称>  #初始化文件夹
cd <新建文件夹的名称>
npm install  # 安装博客所需要的依赖文件
```

Hexo 基本命令
```shell
hexo clean     # Remove generated files and cache.
hexo deploy    # Deploy your website.
hexo generate  # Generate static files.
hexo server    # Start the server.
示例:
hexo c && hexo g && hexo s && hexo d
```
清除，编译，发布之后就可以在 <code>localhost:4000</code> 看到网页，网页默认使用的主题是 Next 主题。

Hexo 发布到 Github Pages
1. 在安装目录，安装发布插件
2. 将本地目录与github进行关联
3. 对<code>_config.yml</code>文件进行编辑
4. 生成页面
```shell
npm install hexo-deployer-git --save # 安装发布插件
ssh-keygen -t rsa -C "你的邮箱地址" # 本地目录与 Github 进行关联
# 第二步得到的 id_rsa.pub 在 C:/Users/[username]/.ssh下，github中新建一个 ssh key 放入该文件内容
```
<code>_config.yml</code> 文件中<code>deploy</code>修改如下信息

```shell
type: git
# 使用这个配置不用每次都输入账号密码
repo: git@github.com:Github用户名/github用户名.github.io.git
# repo: git@github.com:RamboCao/RamboCao.github.io.git
# 也可使用https地址, 但是每次push或者编译都需要输入账号密码
# repo: https://github.com/RamboCao/RamboCao.github.io 
branch: master
```

控制台输入上方的 <code>hexo g && hexo d </code>命令， 就可以在 **https://用户名.github.io** 中查看网站的内容，和本地调试保持一致。
### Hexo 主题优化
{% note info modern %}
 这是一个采用 <code> ButterFly Design</code> 和响应式设计的 Hexo 博客主题，一开始采用的是 <code>Material Design</code>, 后来看到 ButterFly 主题更加好看，最关键是的是右侧栏有头像，目录，标签，分类等内容，所以果断进行切换。
{% endnote %}

#### 主题下载
在博客根目录进行下载
```shell
# 安装稳定版
git clone -b master https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly
# 安装测试版
git clone -b dev https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly
# 升级
git pull
```
#### 插件安装
修改站点配置文件 <code>_config.yml</code>
```yaml
theme: butterfly
```
安装 pug 和 stylus 渲染器
```shell
npm install hexo-renderer-pug hexo-renderer-stylus --save
```
#### 升级建议
把主题文件夹中的 <code>_config.yml</code> 复製到 Hexo 根目录里，同时重新命名为 <code>_config.butterfly.yml</code>。

以后只需要在 <code>_config.butterfly.yml</code> 进行配置就行。

Hexo会自动合併主题中的 <code>_config.yml</code> 和 <code>_config.butterfly.yml</code>里的配置，如果存在同名配置，会使用 <code>_config.butterfly.yml</code> 的配置，其优先度较高。
#### 新建页面
```shell
# 创建 tags 页面
hexo new page tags
# 创建 categories 页面
hexo new page categories
# 创建友链页面
hexo new page link
# 创建 about 页面
hexo new page about
```
{% note info modern %}
添加一个页面必须在 <code>source/xxx/index.md</code> 页面下内容添加对应的 type。
{% endnote %}

#### Footer 设置
将 Footer 设置成为一个动态变换的颜色
```yaml
# Inject
# Insert the code to head (before '</head>' tag) and the bottom (before '</body>' tag)
# 插入代码到头部 </head> 之前 和 底部 </body> 之前
inject:
  head:
    - <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sviptzk/HexoStaticFile@latest/Hexo/css/footer.min.css">
    - <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sviptzk/HexoStaticFile@latest/Hexo/css/buttons.min.css">
  bottom:

```

<code>footer_bg</code> 属性设置为 <code>false</code> 这样可以使得每一篇文章的页脚显示与主页一样的效果，而不是 <code>top_img</code> 背景图的一部分。

```yaml
# Footer Background
footer_bg: false
```

#### 主题以及页面背景色
将主题替换成为 <code>orange</code> 主题，并且将背景色调整成渐变色
```yaml
# 背景色渐变色
background: 
linear-gradient(
    90deg,
    rgba(247, 149, 51, 0.1) 0,
    rgba(243, 112, 85, 0.1) 15%,
    rgba(239, 78, 123, 0.1) 30%,
    rgba(161, 102, 171, 0.1) 44%,
    rgba(80, 115, 184, 0.1) 58%,
    rgba(16, 152, 173, 0.1) 72%,
    rgba(7, 179, 155, 0.1) 86%,
    rgba(109, 186, 130, 0.1) 100%
  )
# 主题色换为 orange
theme_color:
  enable: true
  main: "#daa520"
```
{% note warning modern %}
不能直接设置 <code>cover:default_cover:</code>会造成页脚动态变换失效.
{% endnote %}


### Hexo 插件配置
添加一些信息来完善博客的功能
#### 中文链接转拼音
如果你的文章名称是中文的，那么 Hexo 默认生成的永久链接也会有中文，这样不利于 <code>SEO</code>，且 <code>gitment</code> 评论对中文链接也不支持。我们可以用 [hexo-abbrlink](https://github.com/rozbo/hexo-abbrlink) Hexo 插件使在生成文章时生成中文拼音的永久链接。

安装命令
```shell
npm install hexo-abbrlink --save
```

<code>_config.yml</code> 中添加

```yaml
# 修改permalink posts 方式
permalink: posts/:abbrlink/

abbrlink:
  alg: crc32      #support crc16(default) and crc32
  rep: hex        #support dec(default) and hex
  drafts: false   #(true)Process draft,(false)Do not process draft. false(default) 
  # Generate categories from directory-tree
  # depth: the max_depth of directory-tree you want to generate, should > 0
  auto_category:
     enable: true  #true(default)
     depth:        #3(default)
     over_write: false 
  auto_title: false #enable auto title, it can auto fill the title by path
  auto_date: false #enable auto date, it can auto fill the date by time today
  force: false #enable force mode,in this mode, the plugin will ignore the cache, and calc the abbrlink for every post even it already had abbrlink.
```

为了使得 <code>_post</code> 中的文件按照 年/月 的方式展示，在配置文件<code>_config.yml</code>中设置：
```yaml
# Writing
new_post_name: post/:year-:month-:day/:title.md # File name of new posts
```

#### 添加 RSS 订阅支持
使用 [hexo-generator-feed](https://github.com/hexojs/hexo-generator-feed) 支持 RSS 订阅:
```shell
npm install hexo-generator-feed --save
```
<code>_config.yml</code> 中添加:

```yaml
feed:
  type: atom
  path: atom.xml
  limit: 20
  hub:
  content:
  content_limit: 140
  content_limit_delim: ''
  order_by: -date
```
#### 代码压缩
本博客采用 **glup** 代码压缩方式:

- glup 以及插件安装
```shell
  # 全局安装gulp模块
npm install gulp -g
# 安装各种小功能模块  执行这步的时候，可能会提示权限的问题，最好以管理员模式执行
npm install gulp gulp-htmlclean gulp-htmlmin gulp-minify-css gulp-uglify gulp-imagemin --save
# 额外的功能模块
npm install gulp-debug gulp-clean-css gulp-changed gulp-if gulp-plumber gulp-babel babel-preset-es2015 del @babel/core --save
```

  {% note warning modern %}
    此处 <code>gulp-babel</code>会安装8.0版本的，不兼容 Hexo，会对压缩一些图像文件造成影响，控制台有报错信息，所以需要安装7.0版本的，安装命令为：
  {% endnote %}

```shell
    $ npm install --save-dev gulp-babel@7 babel-core babel-preset-env
    $ npm install --save-dev @babel/plugin-transform-runtime 
    $ npm install --save @babel/runtime
```
- 构建压缩脚本
根目录新建文件 <code>gulpfile.js</code>
```js
var gulp = require("gulp");
var debug = require("gulp-debug");
var cleancss = require("gulp-clean-css"); //css压缩组件
var uglify = require("gulp-uglify"); //js压缩组件
var htmlmin = require("gulp-htmlmin"); //html压缩组件
var htmlclean = require("gulp-htmlclean"); //html清理组件
var imagemin = require("gulp-imagemin"); //图片压缩组件
var changed = require("gulp-changed"); //文件更改校验组件
var gulpif = require("gulp-if"); //任务 帮助调用组件
var plumber = require("gulp-plumber"); //容错组件（发生错误不跳出任务，并报出错误内容）
var isScriptAll = true; //是否处理所有文件，(true|处理所有文件)(false|只处理有更改的文件)
var isDebug = true; //是否调试显示 编译通过的文件
var gulpBabel = require("gulp-babel");
var es2015Preset = require("babel-preset-es2015");
var del = require("del");
var Hexo = require("hexo");
var hexo = new Hexo(process.cwd(), {}); // 初始化一个hexo对象

// 清除public文件夹
gulp.task("clean", function () {
    return del(["public/**/*"]);
});

// 下面几个跟hexo有关的操作，主要通过hexo.call()去执行，注意return
// 创建静态页面 （等同 hexo generate）
gulp.task("generate", function () {
    return hexo.init().then(function () {
        return hexo
            .call("generate", {
                watch: false
            })
            .then(function () {
                return hexo.exit();
            })
            .catch(function (err) {
                return hexo.exit(err);
            });
    });
});

// 启动Hexo服务器
gulp.task("server", function () {
    return hexo
        .init()
        .then(function () {
            return hexo.call("server", {});
        })
        .catch(function (err) {
            console.log(err);
        });
});

// 部署到服务器
gulp.task("deploy", function () {
    return hexo.init().then(function () {
        return hexo
            .call("deploy", {
                watch: false
            })
            .then(function () {
                return hexo.exit();
            })
            .catch(function (err) {
                return hexo.exit(err);
            });
    });
});

// 压缩public目录下的js文件
gulp.task("compressJs", function () {
    return gulp
        .src(["./public/**/*.js", "!./public/libs/**"]) //排除的js
        .pipe(gulpif(!isScriptAll, changed("./public")))
        .pipe(gulpif(isDebug, debug({ title: "Compress JS:" })))
        .pipe(plumber())
        .pipe(
            gulpBabel({
                presets: [es2015Preset] // es5检查机制
            })
        )
        .pipe(uglify()) //调用压缩组件方法uglify(),对合并的文件进行压缩
        .pipe(gulp.dest("./public")); //输出到目标目录
});

// 压缩public目录下的css文件
gulp.task("compressCss", function () {
    var option = {
        rebase: false,
        //advanced: true, //类型：Boolean 默认：true [是否开启高级优化（合并选择器等）]
        compatibility: "ie7" //保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
        //keepBreaks: true, //类型：Boolean 默认：false [是否保留换行]
        //keepSpecialComments: '*' //保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
    };
    return gulp
        .src(["./public/**/*.css", "!./public/**/*.min.css"]) //排除的css
        .pipe(gulpif(!isScriptAll, changed("./public")))
        .pipe(gulpif(isDebug, debug({ title: "Compress CSS:" })))
        .pipe(plumber())
        .pipe(cleancss(option))
        .pipe(gulp.dest("./public"));
});

// 压缩public目录下的html文件
gulp.task("compressHtml", function () {
    var cleanOptions = {
        protect: /<\!--%fooTemplate\b.*?%-->/g, //忽略处理
        unprotect: /<script [^>]*\btype="text\/x-handlebars-template"[\s\S]+?<\/script>/gi //特殊处理
    };
    var minOption = {
        collapseWhitespace: true, //压缩HTML
        collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
        removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
        removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
        removeComments: true, //清除HTML注释
        minifyJS: true, //压缩页面JS
        minifyCSS: true, //压缩页面CSS
        minifyURLs: true //替换页面URL
    };
    return gulp
        .src("./public/**/*.html")
        .pipe(gulpif(isDebug, debug({ title: "Compress HTML:" })))
        .pipe(plumber())
        .pipe(htmlclean(cleanOptions))
        .pipe(htmlmin(minOption))
        .pipe(gulp.dest("./public"));
});

// 压缩 public/medias 目录内图片
gulp.task("compressImage", function () {
    var option = {
        optimizationLevel: 5, //类型：Number 默认：3 取值范围：0-7（优化等级）
        progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
        interlaced: false, //类型：Boolean 默认：false 隔行扫描gif进行渲染
        multipass: false //类型：Boolean 默认：false 多次优化svg直到完全优化
    };
    return gulp
        .src("./public/medias/**/*.*")
        .pipe(gulpif(!isScriptAll, changed("./public/medias")))
        .pipe(gulpif(isDebug, debug({ title: "Compress Images:" })))
        .pipe(plumber())
        .pipe(imagemin(option))
        .pipe(gulp.dest("./public"));
});
// 执行顺序： 清除public目录 -> 产生原始博客内容 -> 执行压缩混淆 -> 部署到服务器
gulp.task(
    "build",
    gulp.series(
        "clean",
        "generate",
        "compressHtml",
        "compressCss",
        "compressJs",
        "compressImage",
        gulp.parallel("deploy")
    )
);

// 默认任务
gulp.task(
    "default",
    gulp.series(
        "clean",
        "generate",
        gulp.parallel("compressHtml", "compressCss", "compressJs","compressImage")
    )
);
//Gulp4最大的一个改变就是gulp.task函数现在只支持两个参数，分别是任务名和运行任务的函数
```
- 执行压缩并部署
  - 直接在 Hexo 根目录执行 <code>gulp</code> 或者 <code>gulp default</code> ，这个命令相当于 <code>hexo cl&&hexo g</code> 并且再把代码和图片压缩。
  - 在 Hexo 根目录执行 <code>gulp build</code> ，这个命令与第 1 种相比是：在最后又加了个 <code>hexo d</code> ，等于说生成、压缩文件后又帮你自动部署了。

#### hexo-neat 代码压缩
与主题不兼容，同时会使得 markdown 语法块消失，而且回删除全角空格，所以本文不采用该种方式。

### 与 VS Code 关联
在根目录下新建 <code>/scripts/auto_open.js</code>, 插入如下代码
```js
var spawn = require('child_process').exec;

// Hexo 2.x 用户复制这段
//hexo.on('new', function(path){
  //spawn('start  "markdown编辑器绝对路径.exe" ' + path);
//});

// Hexo 3 用户复制这段
hexo.on('new', function(data){
  spawn('start  "D:\Microsoft VS Code\Code.exe" ' + data.path);
});
```
其中 <code>D:\Microsoft VS Code\Code.exe</code> 为 VS Code 运行路径。

---
### Hexo 自动部署

---
### PicGo VS Code 配置 
图床可以更方便的对文章添加图片，无论是从本地添加图片，或者是截图直接进行添加， 本文中主要采用 VS Code 中添加 <code>PicGo</code> 插件来实现。
```json
{
  "repo": "", // 仓库名，格式是username/reponame
  "token": "", // github token
  "path": "", // 自定义存储路径，比如img/
  "customUrl": "", // 自定义域名，注意要加http://或者https://
  "branch": "" // 分支名，默认是main
}
```
其中 token 为存放图片的仓库的 token, 新建仓库之后，可以访问 [token](https://github.com/settings/tokens),然后点击 <code>Generate new token</code> 可生成一个token, 填入即可。

{% note danger modern %}
danger 这个 token 只生成一次！请将其保存！
{% endnote %}

<code>customerUrl</code> 设置为 <code>https://cdn.jsdelivr.net/gh/用户名/图床仓库名</code>, 通过 jsDelivr Jinx ing加速，由于 jsDelivr 和 PicGo 搭配使用，所以无需额外配置， 如果只使用默认的前缀，图片可能无法访问。本博客中 <code>customerUrl</code> 为：

```json
"picgo.picBed.github.customUrl": "https://cdn.jsdelivr.net/gh/RamboCao/PicGo"
```

VS Code 中的快捷键：
<code>Ctrl + Alt + U</code> Uploading an image from clipboard
<code>Ctrl + Alt + E</code> Uploading images from explorer
<code>Ctrl + Alt + O</code> Uploading an image from input box

![这是一个图片测试](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18010.jpg)