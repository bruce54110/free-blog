# 本机运行Nacos容器每次都要重新创建容器，该怎么办？

背景是这样的，本机通过Docker 容器运行Nacos，我这里使用`docker -e`  来设置环境变量，来给容器传递参数。命令如下：

```bash
docker run \
--name nacos-server \
-p 8848:8848 \
-p 9848:9848 \
-p 9849:9849 \
-e MODE=standalone \
-e SPRING_DATASOURCE_PLATFORM=mysql \
-e MYSQL_SERVICE_HOST=xxx.xx.xxx.xx \
-e MYSQL_SERVICE_PORT=3306 \
-e MYSQL_SERVICE_USER=xxxx \
-e MYSQL_SERVICE_PASSWORD=xxxx \
-e MYSQL_SERVICE_DB_NAME=nacos \
-e TIME_ZONE='Asia/Shanghai' \
-v /Users/zhw/myDevelop/nacos2/logs:/home/nacos/logs \
-v /Users/zhw/myDevelop/nacos2/data:/home/nacos/data \
-d nacos/nacos-server:v2.1.2-slim
```

但是，我在公司正常运行但是回家后启动容器时，却会发生Nacos无法启动成功的问题，日志显示的如此眼熟，Nacos初次使用时经常遇到的无法连接数据库的异常又出现了。数据库为什么会连不上呢？

经过排查是 `MYSQL_SERVICE_HOST` 地址不对的问题，因为我的本机IP变了，因为使用公司网络和使用家中WIFI网络的本机IP是不一样的。

我的Mysql数据库是在本机安装的，Docker容器运行Nacos使用宿主机IP连接Mysql数据库，宿主机IP发生变化了，容器自然连不上了。

果然，删掉容器，将`MYSQL_SERVICE_HOST` 改为家中的本机IP后重新执行` docker run ... ` 命令，容器Nacos正常启动，可以访问了。

---

每次电脑换个网络连接，想启动容器还要修改连接数据库的IP地址，重新执行创建容器的命令，这太不优雅了，怎么办呢？

我们在终端通过mysql命令连接数据库命令是`mysql -h -u` 这里的`-h` 就是指hostname，思路来了，何不在`docker run`命令中使用hostname 作为数据库连接地址参数呢。主机名可以自定义，而且不会随着电脑连接网络的变化而变化。

立马尝试一下，分四步：

1. 设置主机名
2. 配置hosts文件IP映射
3. 使用这个主机名创建Mysql连接账号并权限
4. 修改 docker run 命令，数据库地址环境变量参数使用使用主机名
5. docker run 启动，成功访问

首先在终端命令查询本机的hostname是什么？如果没有就设置主机名

获取主机名，发现没有设置

```bash
scutil --get HostName
```

```
not set
```

设置主机名

```
sudo scutil --set HostName bruce.local.mac
```

获取主机名，成功返回刚刚设置的主机名

```
scutil --get HostName
```

```
bruce.local.mac
```

在hosts文件设置 bruce.local.mac 映射到本机IP，ping 一下主机名，有数据返回，没有问题

```
ping bruce.local.mac
```

然后就要创建Mysql 用户名以及对应权限了。

创建数据库用户

```
CREATE USER nacos@'bruce.local.mac' IDENTIFIED BY 'nacos';
```

授权

```
grant all privileges on nacos.* to nacos@'bruce.local.mac';
```

测试连接，成功连接

```
mysql -u nacos -h bruce.local.mac -p
```

修改 docker run 命令如下

```bash
docker run \
--name nacos-server \
-p 8848:8848 \
-p 9848:9848 \
-p 9849:9849 \
-e MODE=standalone \
-e SPRING_DATASOURCE_PLATFORM=mysql \
-e MYSQL_SERVICE_HOST=bruce.local.mac \
-e MYSQL_SERVICE_PORT=3306 \
-e MYSQL_SERVICE_USER=nacos \
-e MYSQL_SERVICE_PASSWORD=nacos \
-e MYSQL_SERVICE_DB_NAME=nacos \
-e TIME_ZONE='Asia/Shanghai' \
-v /Users/zhw/myDevelop/nacos2/logs:/home/nacos/logs \
-v /Users/zhw/myDevelop/nacos2/data:/home/nacos/data \
-d nacos/nacos-server:v2.1.2-slim
```

执行docker run命令成功启动。

这样下次电脑连接其他网络时，启动容器只需要`docker start`  就好了，不需要重新`docker run` 创建容器。