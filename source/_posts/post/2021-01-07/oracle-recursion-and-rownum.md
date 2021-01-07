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
<code>Oracle</code> <code>SQL</code> 中的循环使用 <code>START WITH</code> 和 <code>CONNECT BY ... PIROR</code> 字段实现，一般情况下，递归循环分为两种，一种是自上而下进行查找，另外一种方式是自下而上进行查找。
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
    - connect_by_isleaf
    - sys_connect_by_path

### Oracle Rownum

