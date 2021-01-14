---
title: Mybatis 初识与配置
tags: Mybatis
categories: Mybatis
abbrlink: 15832afd
cover: https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18128.jpg
date: 2021-01-13 10:51:22
---

![Mybatis 初识与配置](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18128.jpg)

### Mybatis
#### 书写步骤
1. 根据全局配置文件 **mybatis-config.xml** 创建一个 <code>SqlSessionFactory</code> 对象, 配置文件中包含一些运行环境 
   ```java
    public SqlSessionFactory getSqlSessionFactory() throws IOException {
        // mybatis-config.xml 是 mybatis 全局配置文件，可以放在 resources 目录下
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        return new SqlSessionFactoryBuilder().build(inputStream);
    }
    // 用完之后将其关闭
    SqlSession sqlSession = sqlSessionFactory.openSession()
    sqlSession.close()
   ```
2. <code>sql</code> 映射文件, 配置了每一个 <code>sql</code> 映射文件, 以及每一个 <code>sql</code> 的封装规则
3. 将 <code>SqlSessionFactory</code> 映射文件注册在全局配置文件之中
4. 进行增删改查操作
   - 根据全局配置文件得到 <code>SqlSessionFactory</code>
   - 获取 <code>sqlSession</code> 对象来执行增删改查, 一个 <code>sqlSession</code> 代表和数据库的一次会话，用完关闭
   - 使用 <code>sql</code> 的唯一标志来告诉 <code>MyBatis</code> 执行哪个 <code>sql</code>, <code>sql</code> 都保存在 <code>sql</code> 映射文件中
```java
public void test() throws IOException {

    SqlSessionFactory sqlSessionFactory = getSqlSessionFactory();
    try (SqlSession sqlSession = sqlSessionFactory.openSession()) {
        EmployeeMapper mapper = sqlSession.getMapper(EmployeeMapper.class);
        Employee employee = mapper.getEmployee(1);
        System.out.println(employee);
    }
}
```

#### 注意事项
1. 接口式编程
    - 原生: Dao->DaoImpl , 一个接口方法对应一个实现方法
    - Mybatis: Dao->**xxxxMapperXml**, 一个接口对应一个 <code>xml</code> 文件, 通过名称空间 <code>namespace</code> 进行匹配, 接口中的方法对应 <code>xml</code> 中的一个 <code>id</code> 方法。
1. <code>SqlSession</code> 代表和数据库的一次会话, 通过 <code>SqlSessionFactory</code> 获取, 每次用完之后必须关掉
2. <code>SqlSession</code> 和 <code>connection</code> 都是非线程安全的， 不能使用 <code>private Sqlsession sqlsession</code> 获取, 每次都应该取获取新的对象
3. <code>mapper</code> 接口没有实现类，但是 <code>mybatis</code> 会为这个接口生成一个代理对象(将接口与xml进行绑定),
   ```java
    EmployeeMapper empMapper = sqlSession.getMapper(EmployeeMapper.class);
   ```
4. 两个重要的配置文件
   - <code>mybatis</code> 全局配置文件 **mybatis-config.xml**, 包含数据库连接池信息，事务管理器信息以及系统运行环境信息
   - <code>sql</code> 映射文件，保存了每一个 <code>sql</code> 语句的映射信息, 可以将 <code>sql</code> 抽取出来

### Mybatis 配置
#### properties
```xml
<!--
    1、mybatis可以使用 properties来引入外部 properties 配置文件的内容；
    resource：引入类路径下的资源
    url：引入网络路径或者磁盘路径下的资源
    -->
<properties resource="dbconfig.properties"></properties>
```
{% note info modern %}
如果一个属性在不只一个地方进行了配置，那么，MyBatis 将按照下面的顺序来加载：
1. 首先读取在 properties 元素体内指定的属性。
2. 然后根据 properties 元素中的 resource 属性读取类路径下属性文件，或根据 url 属性指定的路径读取属性文件，并覆盖之前读取过的同名属性。
3. 最后读取作为方法参数传递的属性，并覆盖之前读取过的同名属性。
{% endnote %}

```xml
为占位符指定一个默认值
<properties resource="org/mybatis/example/config.properties">
  <!-- ... -->
  <property name="org.apache.ibatis.parsing.PropertyParser.enable-default-value" value="true"/> <!-- 启用默认值特性 -->
</properties>

<dataSource type="POOLED">
  <!-- ... -->
  <property name="username" value="${username:ut_user}"/> <!-- 如果属性 'username' 没有被配置，'username' 属性的值将为 'ut_user' -->
</dataSource>

<properties resource="org/mybatis/example/config.properties">
  <!-- ... -->
  <property name="org.apache.ibatis.parsing.PropertyParser.default-value-separator" value="?:"/> <!-- 修改默认值的分隔符 -->
</properties>

<dataSource type="POOLED">
  <!-- ... -->
  <property name="username" value="${db:username?:ut_user}"/>
</dataSource>
```
#### settings
```xml
<!-- 
    2、settings包含很多重要的设置项
        setting:用来设置每一个设置项
            name：设置项名
            value：设置项取值
-->
<settings>
    <setting name="mapUnderscoreToCamelCase" value="true"/>
</settings>
```

#### typeAliases
别名处理器：可以为我们的java类型起别名, 别名不区分大小写, 用在 **xxxxMapper.xml** 中的 <code>ResultType</code> 中
```xml
	<typeAliases>
		<!-- 1、typeAlias:为某个java类型起别名
				type:指定要起别名的类型全类名;默认别名就是类名小写；employee
				alias:指定新的别名
		 -->
		<!-- <typeAlias type="com.mybatis.bean.Employee" alias="emp"/> -->
		<!-- 2、package:为某个包下的所有类批量起别名 
				name：指定包名（为当前包以及下面所有的后代包的每一个类都起一个默认别名（类名小写），）
		-->
		<package name="com.mybatis.bean"/>
		<!-- 3、批量起别名的情况下，使用@Alias注解为某个类型指定新的别名
        @Alias("emp")
        public class Employee {
            ...
        }
        -->
	</typeAliases>
```
#### environments
用来配置 <code>Mybatis</code> 环境
```xml
<!-- 
    4、environments：环境们，mybatis可以配置多种环境 ,default指定使用某种环境。可以达到快速切换环境目的。
        environment：配置一个具体的环境信息；必须有两个标签；id代表当前环境的唯一标识
            transactionManager：事务管理器；
                type：事务管理器的类型; JDBC(JdbcTransactionFactory)|MANAGED(ManagedTransactionFactory)
                    自定义事务管理器：实现 TransactionFactory 接口.type指定为全类名
            
            dataSource：数据源;
                type:数据源类型; UNPOOLED(UnpooledDataSourceFactory)
                               | POOLED(PooledDataSourceFactory)
                               | JNDI(JndiDataSourceFactory)
                自定义数据源：实现 DataSourceFactory 接口, type是全类名
        -->
<environments default="dev_mysql">
    <environment id="dev_mysql">
        <transactionManager type="JDBC"></transactionManager>
        <dataSource type="POOLED">
            <property name="driver" value="${jdbc.driver}" />
            <property name="url" value="${jdbc.url}" />
            <property name="username" value="${jdbc.username}" />
            <property name="password" value="${jdbc.password}" />
        </dataSource>
    </environment>

    <environment id="dev_oracle">
        <transactionManager type="JDBC" />
        <dataSource type="POOLED">
            <property name="driver" value="${orcl.driver}" />
            <property name="url" value="${orcl.url}" />
            <property name="username" value="${orcl.username}" />
            <property name="password" value="${orcl.password}" />
        </dataSource>
    </environment>
</environments>
```

#### databaseIdProvider
<code>Mybatis</code> 用来支持多数据库厂商的, 可以在 <code>Configuration</code> 类中找到
```xml
<!-- 5、databaseIdProvider：支持多数据库厂商的；
        type="DB_VENDOR"：VendorDatabaseIdProvider
        作用就是得到数据库厂商的标识(驱动 getDatabaseProductName())，mybatis 就能根据数据库厂商标识来执行不同的 sql;
        MySQ, Oracl, SQL Server, xxxx
    -->
<databaseIdProvider type="DB_VENDOR">
    <!-- 为不同的数据库厂商起别名 -->
    <property name="MySQL" value="mysql"/>
    <property name="Oracle" value="oracle"/>
    <property name="SQL Server" value="sqlserver"/>
</databaseIdProvider>
```
需要在 **xxxxMapper.xml** 中指定数据库类型 <code>databaseId</code>, 和 <code>databaseIdProvider</code> 中的进行对应，第一个是默认值
```xml
<select id="getEmpById" resultType="com.mybatis.bean.Employee">
    select * from tbl_employee where id = #{id}
</select>

<select id="getEmpById" resultType="com.mybatis.bean.Employee"
    databaseId="mysql">
    select * from tbl_employee where id = #{id}
</select>

<select id="getEmpById" resultType="com.mybatis.bean.Employee"
    databaseId="oracle">
    select EMPLOYEE_ID id,LAST_NAME	lastName,EMAIL email 
    from employees where EMPLOYEE_ID=#{id}
</select>
```
#### mappers
用来将写好的 <code>sql</code> 映射文件注册到全局配置中
```xml
<mappers>
    <!-- 
        mapper:注册一个sql映射 
            注册配置文件
            resource：引用类路径下的sql映射文件
                mybatis/mapper/EmployeeMapper.xml
            url：引用网路路径或者磁盘路径下的sql映射文件
                file:///var/mappers/AuthorMapper.xml
                
            注册接口
            class：引用（注册）接口，
                1、有sql映射文件，映射文件名必须和接口同名，并且放在与接口同一目录下；
                2、没有sql映射文件，所有的sql都是利用注解写在接口上;
                推荐：
                    比较重要的，复杂的Dao接口我们来写sql映射文件
                    不重要，简单的Dao接口为了开发快速可以使用注解；
    -->
    <!-- <mapper resource="mybatis/mapper/EmployeeMapper.xml"/> -->
    <!-- <mapper class="com.atguigu.mybatis.dao.EmployeeMapperAnnotation"/> -->
    
    <!-- 批量注册： -->
    <package name="com.mybatis.dao"/>
</mappers>
```
在进行批量注册的时候, 要确保接口路径和 **xxxxmapper.xml** 路径保持一致，否则将无法拿到接口对应的 <code>xml</code> 文件, 放在相同路径下可以找到是因为 <code>java</code> 在编译的时候，会将同一个包名下的文件都放在一起, 目录结构如下图所示
![目录结构](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/20210114114354.png)