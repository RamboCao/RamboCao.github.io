---
title: Mybatis 增删改查
tags: Mybatis
categories: Mybatis
cover: 'https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18078.jpg'
abbrlink: 4ebc1d4b
date: 2021-01-14 14:57:01
---
![Mybatis 增删改查](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18078.jpg)

### Mybatis 增删改查

#### Xml 书写
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.mybatis.mapper.EmployeeMapper03">
    <select id="getEmployee" resultType="com.mybatis.bean.Employee">
        select * from mybatis.EMPLOYEE e where e.id = #{id}
    </select>

    <!-- parameterType：参数类型，可以省略，
    获取自增主键的值：
    mysql支持自增主键，自增主键值的获取，mybatis也是利用statement.getGeneratedKeys()；
    useGeneratedKeys="true"；使用自增主键获取主键值策略
    keyProperty；指定对应的主键属性，也就是mybatis获取到主键值以后，将这个值封装给javaBean的哪个属性
    -->
    <insert id="insertEmployee" useGeneratedKeys="true" keyProperty="id" databaseId="mysql">
        insert into mybatis.EMPLOYEE (id, last_name, gender) VALUES (null, #{lastName}, #{gender})
    </insert>

    <!--
    获取非自增主键的值：
    Oracle不支持自增；Oracle使用序列来模拟自增；zx
    每次插入的数据的主键是从序列中拿到的值；如何获取到这个值；
     -->
    <insert id="insertEmployee" databaseId="oracle">
        <!--
        keyProperty: 查出的主键值封装给javaBean的哪个属性
        order="BEFORE": 当前sql在插入sql之前运行
               AFTER: 当前sql在插入sql之后运行
        resultType: 查出的数据的返回值类型

        BEFORE运行顺序：
            先运行selectKey查询id的sql: 查出id值封装给javaBean的id属性
            在运行插入的sql: 就可以取出id属性对应的值
        AFTER运行顺序：
            先运行插入的sql（从序列中取出新值作为id）；
            再运行selectKey查询id的sql；
         -->
        <selectKey keyProperty="id" order="BEFORE" resultType="Integer">
            <!-- 编写查询主键的sql语句 -->
            <!-- BEFORE-->
            select EMPLOYEES_SEQ.nextval from dual
            <!-- AFTER：
             select EMPLOYEES_SEQ.currval from dual -->
        </selectKey>

        <!-- 插入时的主键是从序列中拿到的 -->
        <!-- BEFORE:-->
        insert into employees(EMPLOYEE_ID,LAST_NAME,EMAIL)
        values(#{id},#{lastName},#{email})
        <!-- AFTER：
        insert into employees(EMPLOYEE_ID,LAST_NAME,EMAIL)
        values(employees_seq.nextval,#{lastName},#{email}) -->
    </insert>


    <update id="updateEmployee">
        update mybatis.EMPLOYEE set last_name = #{lastName}, gender = #{gender} where id = #{id}
    </update>

    <delete id="deleteEmployee" parameterType="integer">
        delete from mybatis.EMPLOYEE where id = #{id}
    </delete>
</mapper>
```

#### 测试类书写
```java
public class MybatisTest03 {

    public SqlSessionFactory getSqlSessionFactory() throws IOException {
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        return new SqlSessionFactoryBuilder().build(inputStream);
    }

    @Test
    public void test() throws IOException {

        SqlSessionFactory sqlSessionFactory = getSqlSessionFactory();
        try (SqlSession sqlSession = sqlSessionFactory.openSession()) {
            EmployeeMapper03 mapper = sqlSession.getMapper(EmployeeMapper03.class);
            Employee employee = mapper.getEmployee(1);
            System.out.println(employee);
        }
    }

    /*
     * 测试增删改
     * 1、mybatis允许增删改直接定义以下类型返回值
     * 		Integer、Long、Boolean、void
     * 2、我们需要手动提交数据
     * 		sqlSessionFactory.openSession();===》手动提交
     * 		sqlSessionFactory.openSession(true);===》自动提交
     */

    @Test
    public void insertTest() throws IOException {
        SqlSessionFactory sqlSessionFactory = getSqlSessionFactory();
        try (SqlSession sqlSession = sqlSessionFactory.openSession()) {
            EmployeeMapper03 mapper = sqlSession.getMapper(EmployeeMapper03.class);
            Employee employee = new Employee(null, "NiNa", 1);
            mapper.insertEmployee(employee);
            System.out.println(employee.getId());
            sqlSession.commit();
        }
    }

    @Test
    public void updateTest() throws IOException {
        SqlSessionFactory sqlSessionFactory = getSqlSessionFactory();
        try (SqlSession sqlSession = sqlSessionFactory.openSession()) {
            EmployeeMapper03 mapper = sqlSession.getMapper(EmployeeMapper03.class);
            Employee employee = new Employee(1, "Jerry", 0);
            boolean success = mapper.updateEmployee(employee);
            System.out.println(success);
            sqlSession.commit();
        }
    }

    @Test
    public void deleteTest() throws IOException {
        SqlSessionFactory sqlSessionFactory = getSqlSessionFactory();
        try (SqlSession sqlSession = sqlSessionFactory.openSession()) {
            EmployeeMapper03 mapper = sqlSession.getMapper(EmployeeMapper03.class);
            mapper.deleteEmployee(3);
            sqlSession.commit();
        }
    }
}
```

#### 注意事项
1. <code>sqlSession</code> 默认不是自动提交的, 可以采用两种方式解决
```java
//1. 手动进行提交
sqlSession.commit()
//2. true 标识自动提交 
sqlSessionFactory.openSession(true);
```
2. <code>ID</code> 自增策略
   <code>Mysql</code> 支持 ID 自增, 
```xml
<!-- useGeneratedKeys="true": 使用自增主键获取主键值策略 
keyProperty: 指定对应的主键属性，即 <code>mybatis</code> 
获取到主键值以后, 将这个值封装给 <code>javaBean</code> 的哪个属性
-->
<insert id="insertEmployee" useGeneratedKeys="true" keyProperty="id" databaseId="mysql">
   ```
   <code>Oracle</code> 使用序列来模拟自增，每次插入的数据的主键是从序列中拿到的值，可以采用两种不同的策略进行取值
```xml
<selectKey keyProperty="id" order="BEFORE" resultType="Integer">
    <!-- 编写查询主键的sql语句 -->
    <!-- BEFORE-->
    select EMPLOYEES_SEQ.nextval from dual
    <!-- AFTER：
        select EMPLOYEES_SEQ.currval from dual -->
</selectKey>
   ```
   或者
```xml
<selectKey keyProperty="id" order="BEFORE" resultType="Integer">
    <!-- 编写查询主键的sql语句 -->
    <!-- AFTER-->
    select EMPLOYEES_SEQ.currval from dual 
</selectKey>
   ```
    BEFORE 运行顺序：
        先运行selectKey查询id的sql: 查出id值封装给javaBean的id属性
        在运行插入的sql: 就可以取出id属性对应的值
        使用nextval
    AFTER 运行顺序：
        先运行插入的sql（从序列中取出新值作为id）
        再运行selectKey查询id的sql
        使用currval