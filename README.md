# download-screeshot-phantomjs

---

抓取500万页面，通过执行页面js，获取比赛进行时间，之前用java实现，采用HtmlUnit的WebClient，由于执行js实在太烂，试试phantomjs，发现还挺好用的，还可以保存截图

eg
---
* ./phantomjs 500.js 0 gbk //抓今天的
* ./phantomjs 500.js -1 gbk //抓昨天的

运行之后，会在当前目录下生成页面对应的html文件，还有页面截图
