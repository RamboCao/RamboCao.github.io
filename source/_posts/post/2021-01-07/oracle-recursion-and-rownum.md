---
title: Oracle 递归和行号
tags: Oracle
categories: Oracle
cover: 'https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18068.jpg'
abbrlink: '2001e071'
date: 2021-01-07 17:18:14
---
### Oracle Recursion
#### Hierarchical Queries
![Hierarchical Queries](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/Hierarchical_Queries.png)

Hierarchical Queries
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
1. 先执行 <code>JOIN</code> 操作, 无论 <code>JOIN</code> 在 <code>FROM</code> 中，还是在 <code>WHERE</code> 条件中
2. <code>CONNECT BY</code> 执行
3. 执行剩下的 <code>WHERE</code> 中的限制条件

1. <code>Oracle</code> 选择一个根节点(行)<code>root</code>, 这个节点满足 <code>START WITH</code> 条件
2. <code>Oracle</code> 选择每一个父节点(行)的孩子节点(行), 每一个孩子节点必须满足 <code>CONNECT BY</code> 条件(与其对应的根节点)
3. <code>Oracle</code> 继续向下查找寻找子节点, 首先选择步骤2中找到的节点，然后选择这个节点的孩子节点(Children), 而且这些节点都是通过 <code>CONNECT BY</code> 条件找到的。
4. 如果查询中有 <code>WHERE</code> 且没有 <code>join</code>, <code>Oracle</code> 获取所有的行, 并且排除掉所有不满足 <code>WHERE</code> 条件的结果行。<code>Oracle</code> 对每一行分别执行此条件，而不是删除不满足该条件的行的所有子级
5. 按照顺序返回, 所有的孩子节点都在父节点下边

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

#### 注意事项
1. <code>PRIOR</code> 是一元运算
2. <code>CONNECT BY</code> 条件不能包含子查询
3. 如果 <code>CONNECT BY</code> 导致查询结构陷入循环，那么会抛出一个异常, 即一个节点既是父节点，同样也是子节点
4. 在层级查询中，不能指定 <code>ORDER BY</code> 或者 <code>GROUP BY</code>, 否则会破坏 <code>CONNECT BY</code> 结果的层级顺序，想要查询拥有同一个父节点的所有层级关系，使用 <code>ORDER SIBLINGS BY</code> 条件
5. <code>CONNECT BY</code> 条件中 <code>NO CYCLE</code> 参数会在有循环的情况下返回查询的结果行, <code>CONNECT_BY_ISCYCLE</code> 伪列会返回存在环的行

```sql
SELECT last_name, employee_id, manager_id, LEVEL
      FROM employees
      START WITH employee_id = 100
      CONNECT BY PRIOR employee_id = manager_id
      ORDER SIBLINGS BY last_name;
```

#### 实现方式
![]()
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
    - <code>connect_by_iscycle</code> 该参数用来判断递归中是否存在环，
    - <code>connect_by_isleaf</code> 该参数用来判断当前节点是否是叶子节点, 树节点能否继续展开。
    - <code>level</code> 伪列, <code>root</code> 标识 level 1
    - sys_connect_by_path, 当且仅当层级查询时有效, 查询结果返回一条从根节点到某个节点的路径, <code>colunm</code> 和 <code>char</code> 可以是任意类型
      <pre>
      sys_connect_by_path::= <b>SYS_CONNECT_BY_PATH</b>(column, char)
      </pre>    
### Oracle Rownum
1. <code>Oracle</code> 中的 <code>rownum</code> 参数用来限定查询结果返回行数
2. 当 <code>SQL</code> 中既有排序, 又有 <code>rownum</code> 限定行数, 如果直接在 <code>WHERE</code> 条件中使用 <code>rownum<=2</code>, 那么该结果不是排序之后返回的结果, 而是先查出2条数据, 然后进行排序
3. 错误示例与正确示例
4. 正确示例中，必须将所有的字段全部标出, 与子查询中的字段一一对应, 且字段名字不能重复

```sql
--- 错误示例
SELECT *
FROM tablexxx t
WHERE rownum <= 2
ORDER BY t.create_isntant DESC

-- 正确示例
SELECT id, name
FROM (
         SELECT t.id id, t.name name
         FROM tablexxx t
         ORDER BY t.create_instant DESC) s
WHERE rownum <= 2
```

### Oracle Left Join
<code>SQL</code> 中 <code>LEFT JOIN</code> 无论如何都会返回左表中所有的行, 即使在右表中没有任何匹配的行

```sql
SELECT *
FROM employee e
         LEFT JOIN product p ON p.employee_id = e.id 
```

以上, <code>LEFT JOIN</code> 中 ON 条件只有一个, 所以结果没有问题, 将 <code>product</code> 表与 <code>employee</code> 表进行关联, 但是当查询条件包含多个不同的 <code>ON</code> 条件时:
1. ON 条件中只有第一个条件生效
2. 如果想要其余的条件生效, 需要将其余条件放在 <code>WHERE</code> 条件中, 此时 <code>LEFT JOIN</code> 相当于 <code>INNER JOIN</code> 查询

当数据库通过两张表或者多张表查询所需要的结果是, 都会生成一张中间记录表, <code>ON</code> 中所有的条件都是用来生成中间记录的, <code>WHERE</code> 条件在最后过滤结果时生效

{% note info modern %}
<code>ON</code>条件是在生成临时表时使用的条件，它不管 <code>ON</code> 中的条件是否为真，都会返回左边表中的记录, 这也就是为什么左连接的结果可能并不是我们想要的, 计数出现问题, 或者数据中出现 <code>NULL</code> 值
{% endnote %}

```sql
-- 这样可能会出现右表为空的情况(当右表的数据与左表没有匹配), 但是左表数据不变
SELECT *
FROM employee e
         LEFT JOIN product p ON p.employee_id = e.id AND e.id = 1

-- 这样相当于 INNER JOIN 内连接, WHERE 条件用来过滤产生的临时表结果
SELECT *
FROM employee e
         LEFT JOIN product p ON p.employee_id = e.id 
WHERE e.id = 1
```

### SQL 字符串截取函数
```sql
    select substr('12345678', -8, 8) FROM dual; --运行结果：'12345678'
    select substr('12345678', -9, 9) FROM dual; --运行结果：null

    select 1 from dual where null like '%019';  --无运行结果
    select 1 from dual WHERE '019' like '%' || null --运行结果：1
```