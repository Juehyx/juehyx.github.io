---
title: Pwn 笔记模板
date: 2026-06-01 20:35:00
tags:
  - Pwn
  - Heap
categories:
  - CTF
---

## 基本信息

- 题目：
- 架构：
- libc：
- 保护：

```bash
file ./pwn
checksec ./pwn
ldd ./pwn
```

## 漏洞点

这里写漏洞触发条件、输入点、越界范围和关键结构。

## 利用思路

1. 泄露地址
2. 计算基址
3. 构造堆布局
4. 劫持控制流
5. getshell

## 调试记录

```gdb
b *main
run
heap
bins
vmmap
```

## Exploit

```python
from pwn import *

context.arch = "amd64"
context.log_level = "debug"

io = process("./pwn")
io.interactive()
```
