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

### Mybatis 参数处理
<code>Mybatis</code> 参数处理

1. 单个参数, Mybatis 不会进行特殊处理, 直接使用 #{参数名/任意名}, 取出参数进行处理
2. 多个参数, Mybatis 进行特殊处理, 多个参数会被封装成一个 map
   a. key: param1...paramN/arg0...argN; 或者使用参数的索引
   b. value: 传入的参数值
   c. #{} map 中获取指定 key 的值
3. 多个参数的命名参数
   a. 明确指定封装参数时 map 的 key 值; @Param("id")
   b. key: 使用@Param注解指定的值
   c. value: 参数值
   d. #{指定的key}取出对应的参数值
4. 使用 POJO 传入参数, 当多个参数正好是业务逻辑的数据模型
   a. #{属性名称}: 取出传入的 POJO 属性值
5. 使用 Map 传入参数, 当没有对应的 POJO 时
   a. #{key} 取出 map 中 key 对应的值
6. 使用 TO 传入参数(Transfer Object), 添加一些分页信息

如果多个参数直接传入 Mapper 然后交给 Mapper.xml 处理会抛出异常:
```java
Employee getEmployeeByIdAndName(Integer id, String lastName);
```
对应的 xml
```xml
<select id="getEmployeeByIdAndName" resultType="com.mybatis.bean.Employee">
    select * from mybatis.EMPLOYEE e where e.id = #{id} and e.last_name = #{lastName}
</select>
```
会抛出异常, 异常中表明 xml 识别的参数名称为 [arg1, arg0, param1, param2]
```log
org.apache.ibatis.exceptions.PersistenceException: 
### Error querying database.  Cause: org.apache.ibatis.binding.BindingException: Parameter 'id' not found. Available parameters are [arg1, arg0, param1, param2]
### Cause: org.apache.ibatis.binding.BindingException: Parameter 'id' not found. Available parameters are [arg1, arg0, param1, param2]
``` 
所以可以将 xml 中的方法修改为
```xml
<select id="getEmployeeByIdAndName" resultType="com.mybatis.bean.Employee">
    select * from mybatis.EMPLOYEE e where e.id = #{param1/arg0} and e.last_name = #{param2/arg1}
</select>
```
或者在 Mapper 接口中添加 @Param() 注解, 用来标识参数的名称, 明确指定封装参数时 map 的 key 值
```java
1. 方法3
Employee getEmployeeByIdAndName(@Param("id") Integer id, @Param("lastName") String lastName);
2. 方法4
Employee getEmployeeByIdAndName(Employee employee);
5. 方法5
Employee getEmployeeByIdAndName(Map<String, Object> params);
```

#### 注意事项
1. 以下两种方式也可以取出参数值
```java
Employee getEmp(@Param("id")Integer id, String lastName);
	xml 取值：id==>#{id/param1}   lastName==>#{param2}

Employee getEmp(Integer id, @Param("e")Employee emp);
	xml 取值：id==>#{param1}    lastName===>#{param2.lastName/e.lastName}
```
2. 如果是Collection（List、Set）类型或者是数组, 也是把传入的list或者数组封装在map中
	key：Collection（collection）,如果是List还可以使用这个key(list), 数组(array)
```java
public Employee getEmpById(List<Integer> ids);
	取值：取出第一个id的值：   #{list[0]}
// xml:
//select * from mybatis.EMPLOYEE e where e.id = #{list[0]}
// 不能使用 param1 或者 arg0
```
3. 推荐使用 Map/TO 进行参数传递

#### 参数解析
```java
public Object convertArgsToSqlCommandParam(Object[] args) {
    return paramNameResolver.getNamedParams(args);
}

private final SortedMap<Integer, String> names;

public Object getNamedParams(Object[] args) {
    final int paramCount = names.size();
    //3. 如果参数个数为0, 直接返回
    if (args == null || paramCount == 0) {
        return null;
    //2. 如果参数有 @Param 注解, 并且参数个数为1, 直接返回 arg[0]
    } else if (!hasParamAnnotation && paramCount == 1) {
        return args[names.firstKey()];
    //3、多个元素或者有Param标注
    } else {
        final Map<String, Object> param = new ParamMap<Object>();
        int i = 0;
        //4. 遍历 names 集合, {0=id, 1=lastName,2=2}
        for (Map.Entry<Integer, String> entry : names.entrySet()) {
            //names 集合的 valu 作为 key;  names 集合的 key 又作为取值的参考args[0]:args[1，"Tom"]:
            //eg:{id=args[0]:1, lastName=args[1]:Tom, 2=args[2]}
            param.put(entry.getValue(), args[entry.getKey()]);
            // add generic param names (param1, param2, ...)
            //额外的将每一个参数也保存到 map 中，使用新的 key：param1...paramN
            //效果：有 Param 注解可以#{指定的key}，或者#{param1}
            final String genericParamName = GENERIC_NAME_PREFIX + String.valueOf(i + 1);
        // ensure not to overwrite parameter named with @Param
        if (!names.containsValue(genericParamName)) {
            param.put(genericParamName, args[entry.getKey()]);
        }
        i++;
        }
        return param;
    }
}
```

#### 参数值的获取
1. #{}：可以获取map中的值或者pojo对象属性的值
2. ${}：可以获取map中的值或者pojo对象属性的值

```sql
select * from tbl_employee where id=${id} and last_name=#{lastName}
Preparing: select * from tbl_employee where id=2 and last_name=?
```
    区别：
        #{}:是以预编译的形式，将参数设置到sql语句中；PreparedStatement；防止sql注入
        ${}:取出的值直接拼装在sql语句中；会有安全问题；
        大多情况下，我们去参数的值都应该去使用#{}；
        
        原生jdbc不支持占位符的地方我们就可以使用${}进行取值
        比如分表、排序...、按照年份分表拆分
            select * from ${year}_salary where xxx;
            select * from tbl_employee order by ${f_name} ${order}

3. #{}:更丰富的用法：
	规定参数的一些规则：
	javaType、 jdbcType、 mode（存储过程）、 numericScale、
	resultMap、 typeHandler、 jdbcTypeName、 expression（未来准备支持的功能）；

	jdbcType通常需要在某种特定的条件下被设置：
		在我们数据为null的时候，有些数据库可能不能识别mybatis对null的默认处理。比如Oracle（报错）；
		
		JdbcType OTHER：无效的类型；因为mybatis对所有的null都映射的是原生Jdbc的OTHER类型，oracle不能正确处理;
		
		由于全局配置中：jdbcTypeForNull=OTHER；oracle不支持；两种办法
		1、#{email,jdbcType=OTHER};
		2、jdbcTypeForNull=NULL
			<setting name="jdbcTypeForNull" value="NULL"/>