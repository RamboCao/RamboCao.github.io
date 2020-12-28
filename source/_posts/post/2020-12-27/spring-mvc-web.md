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
    保存了所有的 <code>@RequestMapping</code> 和 <code>handler</code> 的映射规则，<code>Spring Boot</code> 启动时, 会将所有的 <code>RequestMaping</code> 注解标注的全部扫描出来并保存在 <code>RequestMappingHandlerMapping</code> 中的 <code>mappingRegistry</code> 中
2. welcomePageHandlerMapping
    欢迎页处理
3. BeanNameUrlHandlerMapping
4. RouteFunctionMapping
5. SimpleUrlHandlerMapping

- <code>Spring Boot</code> 自动配置欢迎页的 <code>welcomePageHandlerMapping</code> / 能访问到 index.html
- <code>Spring Boot</code> 自动配置了默认的 <code>RequestMappingHandlerMapping</code>
- 所有的请求映射都在 <code>HalderMapping</code> 中，
    - 请求进来挨个尝试 <code>HandlerMapping</code> 看是否有请求信息，如果有，就找到这个请求对应的 <code>handler</code>, 如果没有就是下一个 <code>handlerMapping</code>
- 我们需要一些自定义的映射处理，我们可以自己给容器中放 <code>handlerMapping</code>，自定义 <code>handlerMapping</code>

#### 各种类型注解原理

如何解析出每一个参数：
从 DispatcherServlet 中的 disPatch() 方法进入
1. 从 Handlermapping 中找到能处理请求的 Handler (也就是 Controller 中的 method)
    ```java
    mappedHandler = getHandler(processedRequest);
    ```
2. 为当前的 Handler 找一个适配器 HandlerAdapter (Sping 底层设计的一个接口)

    ```java
    HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());

    // Handler 是一个接口, 主要实现了以下几个方法
    public interface HandlerAdapter {
        /*
        * Given a handler instance, return whether or not this {@code HandlerAdapter}
	    * can support it. Typical HandlerAdapters will base the decision on the handler
        */
        boolean supports(Object handler);
        /*
        * Use the given handler to handle this request.
        */
        ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception;
        ...
    }
    ```

    所有的 HandlerAdapter 共有四种 this.handlerAdapters:
    - RequestMappingHandlerAdapter
    - HandlerFunctionAdapter
    - HttpRequestHandlerAdapter
    - SimpleControllerHandlerAdapter

3. Controller 中 @Requesting 标注的方法方法会默认找到 RequestingMappingHandlerAdapter, 为当前请求先找到一个适配器, 然后将适配器返回。
4. 真正的执行 Handler

    ```java
    // Actually invoke the handler.
	mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
    ```
    - 先得到目标 handler
    - 然后进入 RequestMappingHandlerAdapter 执行 handleInternal 方法, 774行

    ```java
    @Override
	protected ModelAndView handleInternal(HttpServletRequest request,
			HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {

		ModelAndView mav;
		checkRequest(request);

		// Execute invokeHandlerMethod in synchronized block if required.
		if (this.synchronizeOnSession) {
			HttpSession session = request.getSession(false);
			if (session != null) {
				Object mutex = WebUtils.getSessionMutex(session);
				synchronized (mutex) {
					mav = invokeHandlerMethod(request, response, handlerMethod);
				}
			}
			else {
				// No HttpSession available -> no mutex necessary
				mav = invokeHandlerMethod(request, response, handlerMethod);
			}
		}
		else {
			// No synchronization on session demanded at all...
			mav = invokeHandlerMethod(request, response, handlerMethod);
		}

		if (!response.containsHeader(HEADER_CACHE_CONTROL)) {
			if (getSessionAttributesHandler(handlerMethod).hasSessionAttributes()) {
				applyCacheSeconds(response, this.cacheSecondsForSessionAttributeHandlers);
			}
			else {
				prepareResponse(response);
			}
		}

		return mav;
	}
    ```
    - invokeHandlerMethod 方法内部有 argumentResolvers 参数解析器, 所有的参数解析器(共26个): 861行

    ![参数解析器](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/argumentResolvers.jpg)

    用来确定将要执行的目标方法的每一个参数值是什么

    SpringMVC 能写多少中参数类型，取决于参数解析器的类型

    - 参数解析器接口分析

    ![HandlerMethodArgumentResolver](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/HandlerMethodArgumentResolver.jpg)

    1. 当前解析器是否支持解析这种参数
    2. 支持就调用 resolveArgument 方法来进行解析
    
    - 执行并处理
    ```java
    invocableMethod.invokeAndHandle(webRequest, mavContainer);

    # 进入方法 invokeAndHandle 分析, 真正执行目标方法, 执行完之后直接就到 Controller 层中
    Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs);

    # 继续进入执行方法 invokeForRequest, 获取方法参数值
    Object[] args = getMethodArgumentValues(request, mavContainer, providedArgs);

    # 进入方法 getMethodArgumentValues, 如何确定目标方法的每个值
    protected Object[] getMethodArgumentValues(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer,
			Object... providedArgs) throws Exception {
        
        // 获取方法的所有参数声明，注解，索引位置，类型，详细信息
		MethodParameter[] parameters = getMethodParameters();
		if (ObjectUtils.isEmpty(parameters)) {
			return EMPTY_ARGS;
		}
        // args 会返回, 确定好的值
		Object[] args = new Object[parameters.length];
		for (int i = 0; i < parameters.length; i++) {
            // 取第 i 个参数
			MethodParameter parameter = parameters[i];
			parameter.initParameterNameDiscovery(this.parameterNameDiscoverer);
			args[i] = findProvidedArgument(parameter, providedArgs);
			if (args[i] != null) {
				continue;
			}
            // 判断当前解析器是否支持解析这种类型的参数
            // 26个参数解析器
			if (!this.resolvers.supportsParameter(parameter)) {
				throw new IllegalStateException(formatArgumentError(parameter, "No suitable resolver"));
			}
			try {
                // 核心代码！！！！！
				args[i] = this.resolvers.resolveArgument(parameter, mavContainer, request, this.dataBinderFactory);
			}
			catch (Exception ex) {
				// Leave stack trace for later, exception may actually be resolved and handled...
				if (logger.isDebugEnabled()) {
					String exMsg = ex.getMessage();
					if (exMsg != null && !exMsg.contains(parameter.getExecutable().toGenericString())) {
						logger.debug(formatArgumentError(parameter, exMsg));
					}
				}
				throw ex;
			}
		}
		return args;
	}
    
    # 挨个判断那个支持解析该参数

    # 解析这个参数的值
    ```

#### 关键信息
1. HandlerAdapter
  - RequestMappingHandlerAdapter 支持方法上标注 @RequestMapping
  - HandlerFunctionAdapter 支持函数式编程

2. 执行目标方法
    ```java
    mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
    ```
3. 执行 hanlder 方法

    ```java
    mav = invokeHandlerMethod(request, response, handlerMethod);
    # invokeHandlerMethod 内部 argumentResolvers 参数解析器, 所有的参数解析器(共26个)
    # invokeHandlerMethod 内部 returnValueHandlers 返回值处理器，所有的返回值解析器共有16个
    # 将参数解析器和返回值处理器都放入到 ServletInvocableHandlerMethod 包装好的处理方法中。
    # 执行并处理
    invocableMethod.invokeAndHandle(webRequest, mavContainer);

    # 进入方法 invokeAndHandle 分析, 真正执行目标方法, 执行完之后直接就到 Controller 层中
    Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs);

    # 继续进入执行方法 invokeForRequest, 获取方法参数值
    Object[] args = getMethodArgumentValues(request, mavContainer, providedArgs);

    # getMethodArgumentValues 中判断当前解析器是否支持解析这种类型的参数
    private HandlerMethodArgumentResolver getArgumentResolver(MethodParameter parameter) {
		HandlerMethodArgumentResolver result = this.argumentResolverCache.get(parameter);
		if (result == null) {
			for (HandlerMethodArgumentResolver resolver : this.argumentResolvers) {
				if (resolver.supportsParameter(parameter)) {
					result = resolver;
					this.argumentResolverCache.put(parameter, result);
					break;
				}
			}
		}
		return result;
	}
    # 使用这种解析器进行解析解析
    @Override
	@Nullable
	public Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {
        // 拿到当前参数的解析器
		HandlerMethodArgumentResolver resolver = getArgumentResolver(parameter);
		if (resolver == null) {
			throw new IllegalArgumentException("Unsupported parameter type [" +
					parameter.getParameterType().getName() + "]. supportsParameter should be called first.");
		}
		return resolver.resolveArgument(parameter, mavContainer, webRequest, binderFactory);
	}
    
    # 假设参数为 @PathVariable
    @Override
	public boolean supportsParameter(MethodParameter parameter) {
		if (!parameter.hasParameterAnnotation(PathVariable.class)) {
			return false;
		}
		if (Map.class.isAssignableFrom(parameter.nestedIfOptional().getNestedParameterType())) {
			PathVariable pathVariable = parameter.getParameterAnnotation(PathVariable.class);
			return (pathVariable != null && StringUtils.hasText(pathVariable.value()));
		}
		return true;
	}

    # 解析这种类型参数
    @Override
	@Nullable
	public final Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception {

        // 参数的详细信息
		NamedValueInfo namedValueInfo = getNamedValueInfo(parameter);
		MethodParameter nestedParameter = parameter.nestedIfOptional();
        // 解析参数的名字！！！！
		Object resolvedName = resolveEmbeddedValuesAndExpressions(namedValueInfo.name);
		if (resolvedName == null) {
			throw new IllegalArgumentException(
					"Specified name must not resolve to null: [" + namedValueInfo.name + "]");
		}
        // 解析参数的值！！！！
		Object arg = resolveName(resolvedName.toString(), nestedParameter, webRequest);
		if (arg == null) {
			if (namedValueInfo.defaultValue != null) {
				arg = resolveEmbeddedValuesAndExpressions(namedValueInfo.defaultValue);
			}
			else if (namedValueInfo.required && !nestedParameter.isOptional()) {
				handleMissingValue(namedValueInfo.name, nestedParameter, webRequest);
			}
			arg = handleNullValue(namedValueInfo.name, arg, nestedParameter.getNestedParameterType());
		}
		else if ("".equals(arg) && namedValueInfo.defaultValue != null) {
			arg = resolveEmbeddedValuesAndExpressions(namedValueInfo.defaultValue);
		}

		if (binderFactory != null) {
			WebDataBinder binder = binderFactory.createBinder(webRequest, null, namedValueInfo.name);
			try {
				arg = binder.convertIfNecessary(arg, parameter.getParameterType(), parameter);
			}
			catch (ConversionNotSupportedException ex) {
				throw new MethodArgumentConversionNotSupportedException(arg, ex.getRequiredType(),
						namedValueInfo.name, parameter, ex.getCause());
			}
			catch (TypeMismatchException ex) {
				throw new MethodArgumentTypeMismatchException(arg, ex.getRequiredType(),
						namedValueInfo.name, parameter, ex.getCause());
			}
			// Check for null value after conversion of incoming argument value
			if (arg == null && namedValueInfo.defaultValue == null &&
					namedValueInfo.required && !nestedParameter.isOptional()) {
				handleMissingValue(namedValueInfo.name, nestedParameter, webRequest);
			}
		}

		handleResolvedValue(arg, namedValueInfo.name, parameter, mavContainer, webRequest);

		return arg;
	}

    #解析名字
    @Nullable
	private Object resolveEmbeddedValuesAndExpressions(String value) {
		if (this.configurableBeanFactory == null || this.expressionContext == null) {
			return value;
		}
		String placeholdersResolved = this.configurableBeanFactory.resolveEmbeddedValue(value);
		BeanExpressionResolver exprResolver = this.configurableBeanFactory.getBeanExpressionResolver();
		if (exprResolver == null) {
			return value;
		}
		return exprResolver.evaluate(placeholdersResolved, this.expressionContext);
	}

    # 解析值
    @Override
	@SuppressWarnings("unchecked")
	@Nullable
	protected Object resolveName(String name, MethodParameter parameter, NativeWebRequest request) throws Exception {
		Map<String, String> uriTemplateVars = (Map<String, String>) request.getAttribute(
				HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
		return (uriTemplateVars != null ? uriTemplateVars.get(name) : null);
	}
    ```
