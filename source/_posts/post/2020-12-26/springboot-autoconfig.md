---
title: Spring Boot 自动配置原理
tags: Spring Boot
cover: 'https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18003.jpg'
abbrlink: 591b5c47
date: 2020-12-26 22:17:40
categories: Spring Boot
---

---

### Spring Boot 自动配置原理

每一个 </code>Spring Boot</code> 主程序应用上都有一个注解 <code>@SpringBootApplication</code>, 这个注解是由三个不同的注解组合而成，分别是:
```java
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(excludeFilters = { @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
		@Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class) })
public @interface SpringBootApplication {}
```

#### @SpringBootConfiguration
<code>@SpringBootConfiguration</code> 有一个注解是 <code>@Configuration,</code> 代表当前是一个配置类
<code>@Configuration</code> 组件介绍

1. 给一个类上进行标注，表明这是一个配置类，配置类里使用 <code>@Bean</code> 标注在方法上给容器中添加组件，默认是单实例。
2. 配置类本身也是组件
3. <code>Spinrg Boot 2.0</code> 以后引入 <code>proxyBeanMethods</code>, 表示代理 Bean 的方法，从容器中拿还是调用方法
4. Full 模式，<code>proxyBeanMethods = true</code>: 外部无对配置类中的这个组件注册方法调用多少次获取的都是之前注册容器中的单实例对象，<code>EnhancerBySpringCGLIB</code> 被增强的 Spring 的代理对象，代理对象调用发法，Spring Boot 总会检查这个组件是否在组件中有，如果有则直接使用，保证组件单实例。
5. Lite 模式，<code>proxyBeanMethods = false</code>: 多次调用获得不同的方法。
6. 用来解决组件依赖问题，Lite 优点，不会检查容器中是不是有这个组件，只是单单给组件注册组件，使用 Lite 模式, 否则使用 <code>Full</code> 模式。

#### @ComponentScan
<code>@ComponentScan</code> 是一个包扫描，指定我们扫描哪些包里边的内容。
todo: @ComponentScan 注解

#### @EnableAutoConfiguration
<code>@EnableAutoConfiguration</code> 也是一个合成注解，分别是:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage
@Import(AutoConfigurationImportSelector.class)
public @interface EnableAutoConfiguration {}
```
1-4注解都是语言注解，另外两个是自动配置的关键注解

- @AutoConfigurationPackage
	自动配置包，源码分析，指定默认包规则，

	```java
	@Target(ElementType.TYPE)
	@Retention(RetentionPolicy.RUNTIME)
	@Documented
	@Inherited
	//通过 <code>Register()</code> 来进行批量注册，将指定的一个包下的所有组件都导入进来？ MainApplication所在的包
	@Import(AutoConfigurationPackages.Registrar.class)
	public @interface AutoConfigurationPackage {}
	```
	其中 <code>@Import()</code> 利用 Registrar 给容器中批量导入组件，涉及到 <code>@Import()</code> 组件的高级用法， 导入组件源码为：

	```java
		static class Registrar implements ImportBeanDefinitionRegistrar, DeterminableImports {

			@Override
			public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
				//  metadata 注解的源信息
				register(registry, new PackageImport(metadata).getPackageName());
			}

			@Override
			public Set<Object> determineImports(AnnotationMetadata metadata) {
				return Collections.singleton(new PackageImport(metadata));
			}

		}
	```

- @Import(AutoConfigurationImportSelector.class)

	```java
	AutoConfigurationImportSelector()
	// 利用 getAutoConfigurationEntry() 方法给容器中批量导入一些组件，获取所有配置的集合
	AutoConfigurationEntry autoConfigurationEntry = getAutoConfigurationEntry(autoConfigurationMetadata, annotationMetadata);
	// 获取所需要导入到容器中大的配置类
	List<String> configurations = getCandidateConfigurations(annotationMetadata, attributes);
	// 使用 SpringFactoriesLoader 工厂加载器加载, 最终获得一个Map
	List<String> configurations = SpringFactoriesLoader.loadFactoryNames(getSpringFactoriesLoaderFactoryClass(),
					getBeanClassLoader());
	List<String> loadFactoryNames(Class<?> factoryType, @Nullable ClassLoader classLoader){}
	Map<String, List<String>> loadSpringFactories(@Nullable ClassLoader classLoader)
	// 从 "META-INF/spring.factories" 加载一个文件，默认扫描当前系统这个位置的所有文件，某些 jar 包下边的这个文件
	// 核心是：spring-boot-autoconfigure-2.2.1.RELEASE.jar 里边的 META-INF/spring.factories
	classLoader.getResources(FACTORIES_RESOURCE_LOCATION)
	```

	</code>META-INF/spring.factories</code> 里边的 <code>Auto Configure</code> 共127个, 配置文件写死， <code>Spring Boss</code> 一启动，就要给容器中加载的配置类，

	```java
	# Auto Configure
	org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
	org.springframework.boot.autoconfigure.admin.SpringApplicationAdminJmxAutoConfiguration,\
	org.springframework.boot.autoconfigure.aop.AopAutoConfiguration,\
	org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration,\
	org.springframework.boot.autoconfigure.batch.BatchAutoConfiguration,\
	org.springframework.boot.autoconfigure.cache.CacheAutoConfiguration,\
	org.springframework.boot.autoconfigure.cassandra.CassandraAutoConfiguration,\
	org.springframework.boot.autoconfigure.cloud.CloudServiceConnectorsAutoConfiguration,\
	org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration,\
	org.springframework.boot.autoconfigure.context.MessageSourceAutoConfiguration,\
	org.springframework.boot.autoconfigure.context.PropertyPlaceholderAutoConfiguration,\
	org.springframework.boot.autoconfigure.couchbase.CouchbaseAutoConfiguration,\
	org.springframework.boot.autoconfigure.dao.PersistenceExceptionTranslationAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.cassandra.CassandraDataAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.cassandra.CassandraReactiveDataAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.cassandra.CassandraReactiveRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.cassandra.CassandraRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.couchbase.CouchbaseDataAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.couchbase.CouchbaseReactiveDataAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.couchbase.CouchbaseReactiveRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.couchbase.CouchbaseRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.elasticsearch.ElasticsearchAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.elasticsearch.ElasticsearchDataAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.elasticsearch.ElasticsearchRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.elasticsearch.ReactiveElasticsearchRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.elasticsearch.ReactiveRestClientAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.jdbc.JdbcRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.jpa.JpaRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.ldap.LdapRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.mongo.MongoReactiveDataAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.mongo.MongoReactiveRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.neo4j.Neo4jDataAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.neo4j.Neo4jRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.solr.SolrRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.redis.RedisReactiveAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.rest.RepositoryRestMvcAutoConfiguration,\
	org.springframework.boot.autoconfigure.data.web.SpringDataWebAutoConfiguration,\
	org.springframework.boot.autoconfigure.elasticsearch.jest.JestAutoConfiguration,\
	org.springframework.boot.autoconfigure.elasticsearch.rest.RestClientAutoConfiguration,\
	org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration,\
	org.springframework.boot.autoconfigure.freemarker.FreeMarkerAutoConfiguration,\
	org.springframework.boot.autoconfigure.gson.GsonAutoConfiguration,\
	org.springframework.boot.autoconfigure.h2.H2ConsoleAutoConfiguration,\
	org.springframework.boot.autoconfigure.hateoas.HypermediaAutoConfiguration,\
	org.springframework.boot.autoconfigure.hazelcast.HazelcastAutoConfiguration,\
	org.springframework.boot.autoconfigure.hazelcast.HazelcastJpaDependencyAutoConfiguration,\
	org.springframework.boot.autoconfigure.http.HttpMessageConvertersAutoConfiguration,\
	org.springframework.boot.autoconfigure.http.codec.CodecsAutoConfiguration,\
	org.springframework.boot.autoconfigure.influx.InfluxDbAutoConfiguration,\
	org.springframework.boot.autoconfigure.info.ProjectInfoAutoConfiguration,\
	org.springframework.boot.autoconfigure.integration.IntegrationAutoConfiguration,\
	org.springframework.boot.autoconfigure.jackson.JacksonAutoConfiguration,\
	org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,\
	org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration,\
	org.springframework.boot.autoconfigure.jdbc.JndiDataSourceAutoConfiguration,\
	org.springframework.boot.autoconfigure.jdbc.XADataSourceAutoConfiguration,\
	org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration,\
	org.springframework.boot.autoconfigure.jms.JmsAutoConfiguration,\
	org.springframework.boot.autoconfigure.jmx.JmxAutoConfiguration,\
	org.springframework.boot.autoconfigure.jms.JndiConnectionFactoryAutoConfiguration,\
	org.springframework.boot.autoconfigure.jms.activemq.ActiveMQAutoConfiguration,\
	org.springframework.boot.autoconfigure.jms.artemis.ArtemisAutoConfiguration,\
	org.springframework.boot.autoconfigure.groovy.template.GroovyTemplateAutoConfiguration,\
	org.springframework.boot.autoconfigure.jersey.JerseyAutoConfiguration,\
	org.springframework.boot.autoconfigure.jooq.JooqAutoConfiguration,\
	org.springframework.boot.autoconfigure.jsonb.JsonbAutoConfiguration,\
	org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration,\
	org.springframework.boot.autoconfigure.ldap.embedded.EmbeddedLdapAutoConfiguration,\
	org.springframework.boot.autoconfigure.ldap.LdapAutoConfiguration,\
	org.springframework.boot.autoconfigure.liquibase.LiquibaseAutoConfiguration,\
	org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration,\
	org.springframework.boot.autoconfigure.mail.MailSenderValidatorAutoConfiguration,\
	org.springframework.boot.autoconfigure.mongo.embedded.EmbeddedMongoAutoConfiguration,\
	org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration,\
	org.springframework.boot.autoconfigure.mongo.MongoReactiveAutoConfiguration,\
	org.springframework.boot.autoconfigure.mustache.MustacheAutoConfiguration,\
	org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,\
	org.springframework.boot.autoconfigure.quartz.QuartzAutoConfiguration,\
	org.springframework.boot.autoconfigure.rsocket.RSocketMessagingAutoConfiguration,\
	org.springframework.boot.autoconfigure.rsocket.RSocketRequesterAutoConfiguration,\
	org.springframework.boot.autoconfigure.rsocket.RSocketServerAutoConfiguration,\
	org.springframework.boot.autoconfigure.rsocket.RSocketStrategiesAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.reactive.ReactiveSecurityAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.reactive.ReactiveUserDetailsServiceAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.rsocket.RSocketSecurityAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.saml2.Saml2RelyingPartyAutoConfiguration,\
	org.springframework.boot.autoconfigure.sendgrid.SendGridAutoConfiguration,\
	org.springframework.boot.autoconfigure.session.SessionAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.oauth2.client.reactive.ReactiveOAuth2ClientAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration,\
	org.springframework.boot.autoconfigure.security.oauth2.resource.reactive.ReactiveOAuth2ResourceServerAutoConfiguration,\
	org.springframework.boot.autoconfigure.solr.SolrAutoConfiguration,\
	org.springframework.boot.autoconfigure.task.TaskExecutionAutoConfiguration,\
	org.springframework.boot.autoconfigure.task.TaskSchedulingAutoConfiguration,\
	org.springframework.boot.autoconfigure.thymeleaf.ThymeleafAutoConfiguration,\
	org.springframework.boot.autoconfigure.transaction.TransactionAutoConfiguration,\
	org.springframework.boot.autoconfigure.transaction.jta.JtaAutoConfiguration,\
	org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.client.RestTemplateAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.embedded.EmbeddedWebServerFactoryCustomizerAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.reactive.HttpHandlerAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.reactive.ReactiveWebServerFactoryAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.reactive.WebFluxAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.reactive.error.ErrorWebFluxAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.reactive.function.client.ClientHttpConnectorAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.reactive.function.client.WebClientAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.servlet.DispatcherServletAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.servlet.error.ErrorMvcAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.servlet.HttpEncodingAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.servlet.MultipartAutoConfiguration,\
	org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration,\
	org.springframework.boot.autoconfigure.websocket.reactive.WebSocketReactiveAutoConfiguration,\
	org.springframework.boot.autoconfigure.websocket.servlet.WebSocketServletAutoConfiguration,\
	org.springframework.boot.autoconfigure.websocket.servlet.WebSocketMessagingAutoConfiguration,\
	org.springframework.boot.autoconfigure.webservices.WebServicesAutoConfiguration,\
	org.springframework.boot.autoconfigure.webservices.client.WebServiceTemplateAutoConfiguration

	```


#### 按需配置
虽然127个场景的自动配置启动时候默认全部加载，但是 Spring Boot 会按需加载

需要将需要加载的类加载进来，所以并不是所有的自动配置都能生效

按照条件装配规则 <code>(@Conditional)</code>，最终会按需配置

只有条件生效时，自动配置才会生效。

#### 具体分析

#### Aop 自动配置
- Aop 自动配置已被导入	

	首先看主类是否生效，然后再看小类是否生效。

#### Web 模块自动配置
- DispatcherServletAutoConfiguration
	选择 <code>DispatcherServletAutoConfiguration</code> 来进行自动配置分析

	```java
	//  标识自动配置的顺序
	@AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE)
	@Configuration(proxyBeanMethods = false)
	// 配置生效的条件是必须是一个 WebApplication
	@ConditionalOnWebApplication(type = Type.SERVLET)
	// 容器中必须包含 DispatcherServlet.class 这个类
	@ConditionalOnClass(DispatcherServlet.class)
	// 自动配置必须要在 ServletWebServerFactoryAutoConfiguration.class 加载之后
	@AutoConfigureAfter(ServletWebServerFactoryAutoConfiguration.class)
	//以上条件全部满足之后 DispatcherServletAutoConfiguration 这个自动配置类才会生效
	public class DispatcherServletAutoConfiguration {
		// 总类成功才看下边的小类
		@Configuration(proxyBeanMethods = false)
		// 满足 DefaultDispatcherServletCondition 条件类，这个条件在源代码的下方，自己编写的条件类。
		@Conditional(DefaultDispatcherServletCondition.class)
		// 系统中有 ServletRegistration 类型的组件
		@ConditionalOnClass(ServletRegistration.class)
		// 开启配置属性绑定 WebMvcProperties
		@EnableConfigurationProperties({ HttpProperties.class, WebMvcProperties.class })
		protected static class DispatcherServletConfiguration {
			// @Bean 标识给容器中添加 DispatcherServlet 组件   
			@Bean(name = DEFAULT_DISPATCHER_SERVLET_REGISTRATION_BEAN_NAME)
			public DispatcherServlet dispatcherServlet(HttpProperties httpProperties, WebMvcProperties webMvcProperties) {
				// 新建一个 DispatcherServlet
				DispatcherServlet dispatcherServlet = new DispatcherServlet();
				// 设置相关的属性
				dispatcherServlet.setDispatchOptionsRequest(webMvcProperties.isDispatchOptionsRequest());
				dispatcherServlet.setDispatchTraceRequest(webMvcProperties.isDispatchTraceRequest());
				dispatcherServlet.setThrowExceptionIfNoHandlerFound(webMvcProperties.isThrowExceptionIfNoHandlerFound());
				dispatcherServlet.setPublishEvents(webMvcProperties.isPublishRequestHandledEvents());
				dispatcherServlet.setEnableLoggingRequestDetails(httpProperties.isLogRequestDetails());
				// 返回 dispatcherServlet
				return dispatcherServlet;
			}

			// 文件上传解析器
			@Bean
			// 容器中有 MultipartResolver 类型的组件， 容器中应该没有
			@ConditionalOnBean(MultipartResolver.class)
			// 容器中没有名字是 multipartResolver 的组件
			// 容器中有 MultipartResolver, 当名字并不是 multipartResolver。
			@ConditionalOnMissingBean(name = DispatcherServlet.MULTIPART_RESOLVER_BEAN_NAME)
			public MultipartResolver multipartResolver(MultipartResolver resolver) {
				// 给 @Bean 标注的方法传入了对象参数，这个参数会从容器中找
				// 从容器中找一个 MultipartResolver 然后给 resolver 赋值，返回
				// 即使配置了一个文件解析器，但是名字不是 multipartResolver。
				// Detect if the user has created a MultipartResolver but named it incorrectly
				return resolver;
			}

		}

	}
	```
	<code>@EnableConfigurationProperties(WebMvcProperties.class)</code> 详细解释：

	```java
	@EnableConfigurationProperties(WebMvcProperties.class)
	1. 开启 WebMvcProperties.classs 和配置文件的绑定功能，和配置文件中 spring.mvc 中的配置一一绑定
	2. 把 WebMvcProperties.class 加入到组件中
	```

	容器中加入了文件上传解析器， 分析见源代码。

	即使用户配置了一个文件解析器，但是名字不是 <code>multipartResolver</code>，<code>Spring Boot</code> 会返回一个 <code>multipartResolver</code>， 防止用户配置的文件上传解析器不规范。

- HttpEncodingAutoConfiguration

	```java
	@Configuration(proxyBeanMethods = false)
	@EnableConfigurationProperties(HttpProperties.class)
	// 是不是原生的 SERVLET 应用程序
	@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
	// 判断容器中是否有 CharacterEncodingFilter
	@ConditionalOnClass(CharacterEncodingFilter.class)
	// 判断文件中是否有 spring.http.encodin 这个属性，如果没有也认为是配置了
	@ConditionalOnProperty(prefix = "spring.http.encoding", value = "enabled", matchIfMissing = true)

	然后容器中放置：
		// 解决请求编码
		@Bean
		// 容器中没有 CharacterEncodingFilter 这个配置
		@ConditionalOnMissingBean
		public CharacterEncodingFilter characterEncodingFilter() {
			CharacterEncodingFilter filter = new OrderedCharacterEncodingFilter();
			filter.setEncoding(this.properties.getCharset().name());
			filter.setForceRequestEncoding(this.properties.shouldForce(Type.REQUEST));
			filter.setForceResponseEncoding(this.properties.shouldForce(Type.RESPONSE));
			return filter;
		}

	```

	Spring boot默认会在底层配置好所有的组件，但是如果用户配置了，那么以用户配置的优先。

	```java
	@ConditionalOnMissingBean

	// 用户配置事例
	@Bean
	public CharacterEncondingFilter filter(){
		return null;
	}

	创建一个 CharacterEncondingFilter， 然后给这个方法加入到容器中。
	```


#### 总结
1. <code>Spring Boot</code> 首先加载所有的自动配置类，<code>xxxAutoconfiguration</code>
2. 每个自动配置类按照条件进行生效，默认都会绑定配置文件指定的值，<code>xxxProperties</code>，和配置文件绑定
3. 生效的配置类就会给容器中装配很多的组件
4. 只要容器中有这些组件，相当于这些功能就有了
5. 只要用户有自己配置的，就以用户的配置优先
6. 定制化配置
    - 用户自己 @Bean 替换底层的组件
    - 修改配置文件，查看配置文件什么值

xxxAutoConfiguration 导入组件 --> xxxProperties 取值 --> applicaition.poperties 取值。

```java
// 设置字符编码
// 从 properties 中获取字符编码，
filter.setEncoding(this.properties.getCharset().name());
// properties 的来源 HttpProperties
public HttpEncodingAutoConfiguration(HttpProperties properties) {this.properties = properties.getEncoding();}
// HttpProperties 绑定了配置文件
@EnableConfigurationProperties(HttpProperties.class)
```

![18003](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18003.jpg)