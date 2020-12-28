---
title: Spring  Boot Web 开发
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

### 请求参数处理

1. xxxMapping
2. Rest风格，使用HTTP请求方式的动词来表示对资源的操作，但是表单只能提交 GET 和 POST请求
3. 核心 <code>Filter</code>: <code>HiddentHttpMethodFilter</code>
    - 用法：表单 <code>method-post</code>(必须), 隐藏域 <code>_method = put/delete</code>
    ```java
    @Bean
    // 容器中没有 HiddenHttpMethodFilter.class, 使用下边 new OrderedHiddenHttpMethodFilter(), 条件成立
	@ConditionalOnMissingBean(HiddenHttpMethodFilter.class)
    // 配置文件中 spring.mvc.hiddenmethod.filter.enable 默认为 false，需要手动开启
	@ConditionalOnProperty(prefix = "spring.mvc.hiddenmethod.filter", name = "enabled", matchIfMissing = false)
	public OrderedHiddenHttpMethodFilter hiddenHttpMethodFilter() {
		return new OrderedHiddenHttpMethodFilter();
	}
    ```

    ```yaml
    spring.mvc.hiddenmethod.filter.enable = true #开启页面表单的 Request 
    ```

#### REST 原理
表单提交使用 <code>REST</code> 的时候
1. 表单提交 = <code>PUT/DELETE</code>
2. 请求过来被 <code>HiddenHttpMethodFilter</code> 拦截
    - 请求是否正常，并且为 <code>POST</code>
    - 获取 <code>_method</code> 的值，是 <code>GET/POST/PUT/DELETE</code>，可以大写，也可以小写
    - 兼容以下请求 <code>GET/POST/PUT/DELETE</code>
    - 原生 <code>request(post)</code>, 使用包装模式 <code>requestWarpper</code> 重写了 <code>getMethod()</cpde> 方法。放回的是传入的值
    - 过滤器放行的是用 <code>warpper</code>，以后的方法调用 <code>getmethod</code> 是调用 <code>requestWarpper</code> 的

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

    HttpServletRequest requestToUse = request;

    if ("POST".equals(request.getMethod()) && request.getAttribute(WebUtils.ERROR_EXCEPTION_ATTRIBUTE) == null) {
        String paramValue = request.getParameter(this.methodParam);
        if (StringUtils.hasLength(paramValue)) {
            // 隐藏域 _method = put/delete
            String method = paramValue.toUpperCase(Locale.ENGLISH);
            if (ALLOWED_METHODS.contains(method)) {
                requestToUse = new HttpMethodRequestWrapper(request, method);
            }
        }
    }
    filterChain.doFilter(requestToUse, response);
}
```

<code>Rest</code>请求，使用客户端工具
PostMan:
    不使用上述方式，可以直接发送 PUT/DELETE

<code>RequestMapping == GetMapping/PutMapping/DeleteMapping/PostMapping</code>

#### 修改 _method

写一个 <cpde>HiddenHttpMethodFilter</code>， 然后设置 <code>setMethodParam</code>

```java
/**
 * @author caolp
 */
public class WebConfig {
    public HiddenHttpMethodFilter hiddenHttpMethodFilter(){
        HiddenHttpMethodFilter methodFilter = new HiddenHttpMethodFilter();
        methodFilter.setMethodParam("_m");
        return methodFilter;
    }
}
```

#### 请求映射原理

![请求映射原理结构图](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/1609078890555.jpg)

<code>Spring MVC</code> 功能分析：每个请求都会从 <code>org.springframework.web.servlet.DispatcherServlet -> doDispatch()</code> 方法请求。

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
		// 包装
        HttpServletRequest processedRequest = request;
		HandlerExecutionChain mappedHandler = null;
		boolean multipartRequestParsed = false;
        // 是否乙部
		WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);

		try {
			ModelAndView mv = null;
			Exception dispatchException = null;

			try {
                // 处理文件上传请求
				processedRequest = checkMultipart(request);
				multipartRequestParsed = (processedRequest != request);

				// Determine handler for the current request.
                //决定当前请求使用哪一个 handler(Contorller的方法)
				mappedHandler = getHandler(processedRequest);


                @Nullable
                protected HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {
                    // 获取所有的 handlerMappings，处理器映射
                    if (this.handlerMappings != null) {
                        for (HandlerMapping mapping : this.handlerMappings) {
                            HandlerExecutionChain handler = mapping.getHandler(request);
                            if (handler != null) {
                                return handler;
                            }
                        }
                    }
                    return null;
                }
```

<code>handlerMappings</code> 有5个,分别是：
1. RequestMappingHandlerMapping
    保存了所有的 @RequestMapping 和 handler 的映射规则，Spring 启动时, 会将所有的 RequestMaping 注解标注的全部扫描出来并保存在 RequestMappingHandlerMapping 中的 mappingRegistry 中
2. welcomePageHandlerMapping
    欢迎页处理
3. BeanNameUrlHandlerMapping
4. RouteFunctionMapping
5. SimpleUrlHandlerMapping

- Spring Boot 自动配置欢迎页的 welcomePageHandlerMapping / 能访问到 index.html
- Spring Boot 自动配置了默认的 RequestMappingHandlerMapping
- 所有的请求映射都在 halderMapping 中，
    - 请求进来挨个尝试 HandlerMapping 看是否有请求信息，如果有，就找到这个请求对应的 handler, 如果没有就是下一个 handlerMapping
- 我们需要一些自定义的映射处理，我们可以自己给容器中放 handlerMapping，自定义 handlerMapping