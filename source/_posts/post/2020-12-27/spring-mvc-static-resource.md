---
title: Spring Boot Web 静态资源处理
abbrlink: daaed3e6
date: 2020-12-27 16:00:54
tags: Spring Boot
categories: Spring Boot
cover: https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/202012271710.jpg
---

![202012271710](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/202012271710.jpg)

### 静态资源

#### 静态资源目录
需要将静态资源放在类路径下：
1. <code> /static </code>
2. <code> /public </code>
3. <code> /resources </code>
4. <code> META-INF/resources </code>
路径：当前项目根路径 + /静态资源名

原理： 静态映射 “/**”，拦截所有的请求，当请求进入时，先去看 <code>Controller</code> 能不能处理，不能处理的所有请求交给静态资源处理器，都不能处理返回404页面。

#### 静态资源访问前缀
一个 webMvc 应用，有很多的动态请求，<code>/**</code> 是将所有的请求都拦截，包括静态资源请求，所以需要将静态请求的前缀改掉，让静态资源请求放行。
```yaml
spring:  
    # Path pattern used for static resources.
    mvc:
      static-path-pattern: /res/**
    # 改变默认的静态资源存放路径
    resources:
      static-locations: classpath:/resources_change
```
访问路径：当前项目 + static-path-pattern + 静态资源名字

静态资源路径： 将静态资源放在 </code> classpath:/resources_change </code> 下

#### webjars 访问
1. 引入相应的 webjars
2. 访问路径： localhost:8080/webjars/**/...，按照依赖的包路径访问

### 静态资源配置原理
1. Spring Boot 自动默认加载 xxxAutoConfiguration 类（自动配置类）
2. 与 SpringMVC 相关的自动配置类是 WebMvcAutoConfiguration, 看该自动配置类是否生效。
    ```java
    @Configuration(proxyBeanMethods = false)
    @ConditionalOnWebApplication(type = Type.SERVLET)
    @ConditionalOnClass({ Servlet.class, DispatcherServlet.class, WebMvcConfigurer.class })
    // todo: 容器中没有 WebMvcConfigurationSupport.class
    @ConditionalOnMissingBean(WebMvcConfigurationSupport.class)
    @AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE + 10)
    @AutoConfigureAfter({ DispatcherServletAutoConfiguration.class, TaskExecutionAutoConfiguration.class,
            ValidationAutoConfiguration.class })
    public class WebMvcAutoConfiguration {}
    ```
3. 给容器中配置了什么。
    ```java
    @Configuration(proxyBeanMethods = false)
	@Import(EnableWebMvcConfiguration.class)
	@EnableConfigurationProperties({ WebMvcProperties.class, ResourceProperties.class })
	@Order(0)
	public static class WebMvcAutoConfigurationAdapter implements WebMvcConfigurer {}
    ```
4. 配置文件的相关属性与什么进行了绑定
    - WebMvcProperties (spring.mvc)
    - ResourceProperties (spring.resources)

5. 资源处理的默认规则：
    ```java
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (!this.resourceProperties.isAddMappings()) {
            logger.debug("Default resource handling disabled");
            return;
        }
        // webjars 规则
        Duration cachePeriod = this.resourceProperties.getCache().getPeriod();
        CacheControl cacheControl = this.resourceProperties.getCache().getCachecontrol().toHttpCacheControl();
        if (!registry.hasMappingForPattern("/webjars/**")) {
            customizeResourceHandlerRegistration(registry.addResourceHandler("/webjars/**")
                    .addResourceLocations("classpath:/META-INF/resources/webjars/")
                    .setCachePeriod(getSeconds(cachePeriod)).setCacheControl(cacheControl));
        }
        // 静态资源配置
        String staticPathPattern = this.mvcProperties.getStaticPathPattern();
        if (!registry.hasMappingForPattern(staticPathPattern)) {
            customizeResourceHandlerRegistration(registry.addResourceHandler(staticPathPattern)
                    .addResourceLocations(getResourceLocations(this.resourceProperties.getStaticLocations()))
                    .setCachePeriod(getSeconds(cachePeriod)).setCacheControl(cacheControl));
        }
    }
    ```
    信息点：
    ```yaml
    spring:
        resources:
            add-mappings: fasle #禁用所有的静态资源规则
            cache:
                period: 11000 #配置缓存
    ```
    静态资源默认位置：
    ```java
    private static final String[] CLASSPATH_RESOURCE_LOCATIONS = { "classpath:/META-INF/resources/",
			"classpath:/resources/", "classpath:/static/", "classpath:/public/" };
    ```
6. 欢迎页的配置

    ```java
    //HandlerMapping, 处理器映射，保存了每一个 Handler 能处理哪些请求，每一个请求过来，利用反射调用该方法处理。
    @Bean
    public WelcomePageHandlerMapping welcomePageHandlerMapping(ApplicationContext applicationContext,
            FormattingConversionService mvcConversionService, ResourceUrlProvider mvcResourceUrlProvider) {
        WelcomePageHandlerMapping welcomePageHandlerMapping = new WelcomePageHandlerMapping(
                new TemplateAvailabilityProviders(applicationContext), applicationContext, getWelcomePage(),
                this.mvcProperties.getStaticPathPattern());
        welcomePageHandlerMapping.setInterceptors(getInterceptors(mvcConversionService, mvcResourceUrlProvider));
        return welcomePageHandlerMapping;
    }

    WelcomePageHandlerMapping(TemplateAvailabilityProviders templateAvailabilityProviders,
        ApplicationContext applicationContext, Optional<Resource> welcomePage, String staticPathPattern) {
    // 要使用欢迎页，只能使用 /**
    if (welcomePage.isPresent() && "/**".equals(staticPathPattern)) {
        logger.info("Adding welcome page: " + welcomePage.get());
        setRootViewName("forward:index.html");
    }
    else if (welcomeTemplateExists(templateAvailabilityProviders, applicationContext)) {
        // 调用 Controller /index 处理
        logger.info("Adding welcome page template: index");
        setRootViewName("index");
    }
	}

   ```
{% note info modern %}
info 一个配置类只有一个有参构造器，有参构造器所有参数的值都会从容器中确定
{% endnote %}

```java
//1. ResourceProperties resourceProperties 获取和 spring.resources 绑定的所有值的对象
//2. WebMvcProperties mvcProperties 获取和 spring.mvc 绑定的所有值的对象
//3. ListableBeanFactory beanFactory 找到容器工厂beanFactory
//4. HttpMessageConverters 找到所有的 HttpMessageConverters， todo:
//5. ResourceHandlerRegistrationCustomizer 找到资源处理器的自定义器
public WebMvcAutoConfigurationAdapter(ResourceProperties resourceProperties, WebMvcProperties mvcProperties,
    ListableBeanFactory beanFactory, ObjectProvider<HttpMessageConverters> messageConvertersProvider,
    ObjectProvider<ResourceHandlerRegistrationCustomizer> resourceHandlerRegistrationCustomizerProvider) {
this.resourceProperties = resourceProperties;
this.mvcProperties = mvcProperties;
this.beanFactory = beanFactory;
this.messageConvertersProvider = messageConvertersProvider;
this.resourceHandlerRegistrationCustomizer = resourceHandlerRegistrationCustomizerProvider.getIfAvailable();
}
```