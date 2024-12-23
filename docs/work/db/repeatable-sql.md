# 一文掌握如何编写可重复执行的SQL

## 背景

先提出问题，这里的可重复执行是指什么？我们为什么要编写可重复执行的sql？

可重复执行是指一条sql重复多次执行都不回报错，不会因为报错而中断同sql脚本的其它sql语句。
比如如下的建表sql只能执行一次，再次执行就会报错，提示我们`example_table` 表已存在。

```sql
CREATE TABLE `example_table` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `age` INT DEFAULT 0,
  `email` VARCHAR(200),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

通常来说项目发版的执行SQL脚本语句是由DDL 和 DML 组成的，如果SQL脚本文件中某个SQL执行异常就会中断整个SQL脚本文件的执行。我们还要根据报错SQL的位置，重新将SQL脚本文件中未执行的SQL摘出来重新整理执行。一旦报错，整个SQL脚本执行过程就变得繁琐起来。

编写可重复执行的SQL，变成了解决这一痛点的利器。当SQL脚本中的SQL语句都是可重复执行的，脚本中某个SQL有问题，直接在当前SQL脚本中就可以修改，我们若需要重新执行，只需要重新执行该SQL脚本就可以。其他已经执行成功的SQL，依然会成功执行，也不会对库表数据造成影响。接下来我们梳理一下各类SQL可重复执行的写法和注意点，本文中的SQL均基于MySql语法。

## 如何实现

表格列举出编写SQL中常见的sql需求：

| SQL                | SQL类型 |
| :----------------- | ------- |
| 创建表             | DDL     |
| 对表新增字段       | DDL     |
| 对表修改字段       | DDL     |
| 对表新增索引       | DDL     |
| 插入一条新记录     | DML     |
| 对表中记录进行更新 | DML     |
| 对表中记录进行删除 | DML     |

### 编写SQL涉及到的Mysql语法和系统表

1. `IF NOT EXISTS`
2. MySql 预处理语句原生语法
3. 字段表 `INFORMATION_SCHEMA.COLUMNS `
4. 索引表 `INFORMATION_SCHEMA.STATISTICS`
5. 查询当前数据库名称 `SCHEMA()`

##### 预处理语句语法介绍

预处理语句（Prepared Statements）是一种将 SQL 查询与其参数分离的机制。与传统的查询方式不同，预处理语句首先会将 SQL 查询进行编译、优化，并将其缓存，随后可以多次执行该查询，而不必每次都重新编译和解析 SQL 语句。每次执行时，预处理语句只需要提供不同的参数即可，这使得它在需要执行多次相同 SQL 查询的场景中具有明显的性能优势。

```sql
-- 准备预处理语句
PREPARE stmt FROM 'SELECT name, age FROM users WHERE id = ?';

-- 设置参数并执行语句
SET @userId = 1;
EXECUTE stmt USING @userId;

-- 释放预处理语句
DEALLOCATE PREPARE stmt;
```

- `PREPARE` 将带有占位符 `?` 的 SQL 语句预处理并编译。
- `SET` 用于设置查询参数。
- `EXECUTE` 执行预处理语句并传递参数。
- `DEALLOCATE PREPARE` 释放预处理语句，避免占用资源。

---

接下来具体说明一下各种sql如何改写为可重复执行的写法。

#### 创建表

原写法：

```sql
CREATE TABLE `example_table` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `age` INT DEFAULT 0,
  `email` VARCHAR(200),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

创建表可以使用`IF NOT EXISTS` 语法进行判断，仅当表不存在的时候才会创建表。

可重复执行的写法：

```sql
CREATE TABLE IF NOT EXISTS `example_table` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `age` INT DEFAULT 0,
  `email` VARCHAR(200),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 对表新增字段

原写法：

```sql
ALTER TABLE example_table ADD COLUMN create_time datetime null comment '创建时间';
```

我们能不能也判断如果这个表中没有这个字段才执行新增字段，答案是可以的。在这里就要用到 **MySql 预处理语句**的语法了。

判断，如果在当前数据库中，存在当前这个表，表中没有这个字段，那么才会执行新增该字段。

- `INFORMATION_SCHEMA.COLUMNS` 系统级的字段表，记录了全部的字段信息
- `SCHEMA()` 当前数据库名称

可重复执行的写法：

```sql
set @sql = 'select 1 from dual;';
select ' ALTER TABLE example_table add COLUMN create_time datetime NULL comment ''创建时间'' ;' into @sql
from dual where (select count(1) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=SCHEMA() AND TABLE_NAME='example_table' AND COLUMN_NAME='sort')=0;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

#### 对表修改字段

原写法：

```sql
ALTER TABLE example_table MODIFY COLUMN email VARCHAR(500) DEFAULT '' comment '邮箱';
```

同样使用 **MySql 预处理语句**的语法，判断在当前数据库中，存在这个表，且有这个字段，那么才会执行修改字段的语句。

可重复执行的写法：

```sql
set @sql = 'select 1 from dual;';
select ' ALTER TABLE example_table MODIFY COLUMN email VARCHAR(500) DEFAULT '''' comment ''邮箱'' ;' into @sql
from dual where (select count(1) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=SCHEMA() AND TABLE_NAME='example_table' AND COLUMN_NAME='email')=1;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

#### 对表新增索引

原写法：

```sql
ALTER TABLE example_table add index idx_name (name) COMMENT '名称索引';
```

要判断当前数据库中，这个表中，根据索引名查询，未查到该索引就进行添加索引。

- `INFORMATION_SCHEMA.STATISTICS` 系统级的索引表，记录了全部的索引信息

可重复执行的写法：

```sql
set @sql = 'select 1 from dual;';
select 'ALTER TABLE example_table add index idx_name (name) COMMENT ''名称索引'';' into @sql from dual
where (select count(1) FROM INFORMATION_SCHEMA.STATISTICS where TABLE_SCHEMA=SCHEMA() and TABLE_NAME='example_table' and index_name='idx_name')=0;
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```



#### 插入一条新记录

原写法：

```sql
insert into example_table(name, age, email, create_time) VALUE ('jack', 18, 'jackaaa@gmail.com', now());
```

在这里我们判断如果这个表中没有jack这个name，才进行插入记录。使用**DUAL虚拟表**帮助我们添加判断条件。

可重复执行的写法：

```sql
INSERT INTO example_table
(name, age, email, create_time)
SELECT 'jack', 18, 'jackaaa@gmail.com', now()
FROM DUAL
WHERE NOT EXISTS (select id from example_table where name = 'jack');
```

#### 对表中记录进行更新

`update` 语句因为其天生的幂等特质，不需要改写，就支持可重复执行。

```sql
update example_table set age = 20 where name = 'jack';
```

#### 对表中记录进行删除

`delete`  语句因为其天生的幂等特质，不需要改写，就支持可重复执行。

```sql
delete from example_table where name = 'tom';
```

## 总结

至此，SQL脚本中常见的7类SQL写法如何改写为可重复执行的SQL，就整理完成了。可重复执行的SQL脚本不仅在执行时提供了便利，也为项目迁移，项目本地化部署带来了便利。