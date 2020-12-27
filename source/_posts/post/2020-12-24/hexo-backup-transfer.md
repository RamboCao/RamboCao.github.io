---
title: Hexo 博客备份与迁移
tags: Hexo
cover: 'https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18107.jpg'
abbrlink: c9eafdcf
categories: Hexo
date: 2020-12-24 21:30:26
---

之前使用 </code>Hexo</code> 和 </code>Github Pages</code> 搭建了 Hexo 博客，但是每次运行 <code>hexo g && hexo g</code> 只是将生成的静态文件部署在 Github 上，所以如果想要对 Hexo 博客进行备份或者是迁移到其他的电脑上，就需要将 Hexo 生成的网站源文件也 push 到 Github 上，但是 master 分支主要是用来部署 hexo 静态文件的，主要体现在 <code>_config.yml</code> 中的 <code>deploy</code>的配置上，所以我们需要新建一个分支来对源码进行推送。

### 主要步骤

#### 预处理
将项目文件中主题文件夹中的 <code>.git</code> 文件夹删除，避免在 push 操作中出现问题。然后在项目文件夹中新建 <code>.gitignore</code>文件，该文件的主要作用是剔除一些无需上传的文件或者文件夹，输入的内容为：

```gitignore
Thumbs.db
db.json
*.log
node_modules/
public/
.deploy*/
```

#### 创建本地分支
主要的命令如下：
```shell
#git初始化
git init
#创建hexo分支，用来存放源码
git checkout -b hexo
#git 文件添加
git add .
#git 提交
git commit -m "backup"
#添加远程仓库，github上的博客仓库
git remote add origin git@github.com:RamboCao/RamboCao.github.io.git
#push到hexo分支
git push origin hexo
```
此时，在 Github 远端有两个不同的分支，一个分支是 <code>master</code>, 另外一个分支是 <code>hexo</code>, 我们在书写代码的时候使用 <code>hexo</code> 分支，在提交源代码的时候使用 <code>hexo</code> 分支。

#### 执行部署
```shell
hexo g && hexo d
```
这样会在 <code>master</code> 分支上对代码进行更新和部署。

---
### 迁移代码
该操作是将远程的代码 pull 到一台新的机器上边，直接拉取远端 <code>hexo</code> 分支上上的代码到本地。所以首先在本地新建一个文件夹 ***.

#### Github 安装与设置
Github 仓库并没有新电脑的私钥，所以需要在新的电脑上生成一个私钥，然后在网页端新加入一个 <code>SSH Key</code>，新建私钥的命令：
```shell
ssh-keygen -t rsa -C "github账号邮箱"
```
然后查看 <code>.ssh</code> 文件夹中<code>id_rsa.pub</code>内容复制到网页 Github 中新建的 <code>SSH Key</code>中。

#### 远程拉取特定分支代码
选择创建好的文件夹，然后将远端的 <code>hexo</code> 分支的代码拉取到本地文件夹中
```shell
# git clone -b <远程指定分支> <远程仓库地址> <本地文件夹名>
git clone -b hexo git@github.com:RamboCao/RamboCao.github.io.git ./blog
```

#### 安装npm依赖
博客目录下安装下如下包，其中 <code>npm install</code> 会安装 <code>package.json</code> 文件中所有的包。
```shell
npm install -g hexo-cli
npm install gulp -g 
npm install
```

### 更新多分支代码
```shell
# 可以使用 hexo c && hexo g && hexo d 
# 也可以使用自动部署脚本 glup build
hexo c && hexo g && hexo d 
gulp build
# 然后再将代码 push 到 hexo 分支，保证代码的完整
git add .
git commit -m 'update'
git push origin hexo
```

#### 安装一些其他的软件
  - PicGo
  - VS Code

{% note info modern %}
  新建 Page 自动打开 VS Code 需要配置新的路径，由于不同环境不一样，所以可以考虑在 <code>.gitignore</code>中设置
{% endnote %}
