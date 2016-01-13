# download-screeshot-phantomjs
抓取500万页面，通过执行页面js，获取比赛进行时间，之前用java实现，采用HtmlUnit的WebClient，由于执行js实在太烂，试试phantomjs，发现还挺好用的，还可以保存截图

eg
---
./phantomjs 500.js "http://live.500.com/?e=2016-01-13" gbk


