---
title: oracle recursion and rownum
tags: Oracle
categories: Oracle
cover: 'https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18068.jpg'
abbrlink: '2001e071'
date: 2021-01-07 17:18:14
---

![18068](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18068.jpg)

### Oracle Recursion
#### Hierarchical Queries
![Hierarchical Queries](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/Hierarchical_Queries.png)

hierarchical_query_clause::=
<pre>
[ <b>START WITH</b> condition ]
<b>CONNECT BY</b> [ <b>NOCYCLE</b> ] condition
</pre>

其中 <code>START WITH</code> 用来标识遍历层级结构的 <code>root</code> 节点, <code>CONNECT BY</code> 用来指明层级结构中父节点和子节点之间的关系, 即标明两者之间的连接关系。

<code>NOCYCLE</code> 和 <code>CONNECT_BY_ISCYCLE</code> 伪列一起使用来检查返回的数据是否存在循环，将存在循环的结果展示出来 <code>CONNECT_BY_ISCYCLE</code> 展示为1, 如果不使用 <code>NOCYCLE</code> 参数执行的话，当层级中存在循环关系的话，执行结果会报错。

在层级结构查询中, <code>condition</code> 中的条件表达式必须满足 <code>PRIOR</code> 操作, 同时支持多条件 <code>PRIOR</code>, 但 <code>condition</code> 中只需要一个 <code>PRIOR</code>, 如果是多条件的操作，那么只有一个 <code>PRIOR</code> 条件会生效。
```sql
... PRIOR expr = expr
or
... expr = PRIOR expr

CONNECT BY last_name != 'King' AND PRIOR employee_id = manager_id ...
CONNECT BY PRIOR employee_id = manager_id and 
           PRIOR account_mgr_id = customer_id ...
```

<code>PRIOR</code> 一元运算符, 优先级等同于 "+"、"-", 用来计算层级查询中跟在其之后的运算表达式(当前节点的父节点)

<code>CONNECT BY</code> 和 <PRIOR> 后边的查询都可以采用子查询的方式，但是不能使用序列, <code>CURRVAL</code> 和 <code>NEXTVAL</code> 是无效的 <code>PRIOR</code> 表达式

#### Hierarchical Queries 步骤
1. 先执行 <code>join</code> 操作, 无论 <code>join</code> 在 <code>FROM</code> 中，还是在 <code>WHERE</code> 条件中
2. <code>CONNECT BY</code> 执行
3. 执行剩下的 <code>WHERE</code> 中的限制条件

```sql
SELECT DISTINCT *
FROM (
         SELECT DISTINCT c.name                                               公司，
                         p.parent_id                                          上级合作伙伴节点标识，
                         p1.code                                              上级合作伙伴编码，
                         p1.name                                              上级合作伙伴名称，
                         p.id                                                 合作伙伴标识，
                         p.code                                               合作伙伴编码，
                         p.name                                               合作伙伴名称，
                         connect_by_iscycle                                   cycle,
                         decode(p.status, 1, '有效', '无效')                      状态，
                         sys_connect_by_path(p1.code, '<-') || '<-' || p.code 合作伙伴路径，
                         level                                                重复级别
         FROM boss_partner.partner p
                  LEFT JOIN boss_partner.partner p1 ON p.parent_id = p1.id
                  LEFT JOIN boss_system.company c ON p.company_id = c.id
         START WITH p.parent_id IN (SELECT p.parent_id
                                    FROM boss_partner.partner p
                                    WHERE p.parent_id IS NOT NULL
                                      AND p.status = 1)
         CONNECT BY NOCYCLE PRIOR p.id = p.parent_id)
WHERE cycle = 1
```
<code>Oracle</code> <code>SQL</code> 中的层级结构查询使用 <code>START WITH</code> 和 <code>CONNECT BY ... PIROR</code> 字段实现，一般情况下，递归循环分为两种，一种是自上而下进行查找，另外一种方式是自下而上进行查找。
1. 自上而上进行查找
   
   ```sql
    SELECT *
    FROM boss_partner.partner p
    START WITH p.id = ?
    CONNECT BY PRIOR p.parent_id = p.id
   ```
2. 自下而上进行查找
     ```sql
    SELECT * from boss_partner.partner p 
    START WITH p.parent_id = ?
      CONNECT BY PRIOR p.id = p.parent_id
   ```
3. 查找中存在环路
   
4. 一些参数的解释
    - connect_by_iscycle
    该参数用来判断递归中是否存在环，
    - connect_by_isleaf
    - sys_connect_by_path

### Oracle Rownum

