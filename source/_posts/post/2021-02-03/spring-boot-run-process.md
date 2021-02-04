---
title: Spring Boot 启动原理
tags: Spring Boot
categories: Spring Boot
cover: 'https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/202002031315.jpg'
abbrlink: 79b75253
date: 2021-02-03 13:12:55
---

![202002031315](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/202002031315.jpg)

### Spring Boot 启动流程
Spring Boot 启动分为两个步骤，首先创建 SpringBootApplication，并且进行初始化操作，然后执行 run 方法，启动 SpringBootApplication 应用

#### 创建 SpringBootApplication
1. 将 xxxApplication.class 作为参数 primarySources 传入

```java
// 调用 SpringApplication 的构造方法
public SpringApplication(Class<?>... primarySources) {
    this(null, primarySources);
}
```

2. 调用构造方法，创建一个新的 SpringApplication 实例， 该应用将从指定 primarySources 中加载 beans, 该应用在调用之前被定制化处理

    - 加载 resourceLoader， 初始化时，resourceLoader 为空
    - 将参数放在一个 LinkedHashSet 中
    - 判断 webApplication 类型是否为 Web 类型应用
    - 设置初始化器 initializers，通过 getSpringFactoriesInstances() 方法从 META-INF/spring.factories 路径下获取所有 ApplicationContextInitializer.class 类型的类全类名
    - 设置监听器 listeners， 通过 getSpringFactoriesInstances() 方法从 META-INF/spring.factories 路径下获取所有 ApplicationListener.class 类型的类的全类名
    - 创建 main 方法 mainApplicationClass 对象；创建一个运行时异常，然后获得堆栈数组，遍历堆栈数组，然后判断是否为 main 方法，如果是，则通过 Class.forName() 方法创建 Class 对象

```java
@SuppressWarnings({ "unchecked", "rawtypes" })
public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
    // 初始化时，resourceLoader 为空
    this.resourceLoader = resourceLoader;
    Assert.notNull(primarySources, "PrimarySources must not be null");
    this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
    this.webApplicationType = WebApplicationType.deduceFromClasspath();
    setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
    setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
    this.mainApplicationClass = deduceMainApplicationClass();
}
```

![Initializers 和 Listners 的位置](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/20210203160920.png)
这幅图展示的只有 spring boot 包下的所有 Initializers 和 Listners，但是在 SpringApplication 启动时会扫描所有导入包类路径下的 spring.factories 文件中是否有 Initializers 和 Listners，如下图所示
![所有的Initializers 和 listners 的位置](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/20210203161525.png)

### 运行 SpringBootApplication

#### 前置准备工作

1. `StopWatch` 用来对服务启动进行时间监控 `stopWatch.start()`
2. 创建一个可配置的 `ConfigurableApplicationContext` 
3. 创建 `SpringBootExceptionReporter` 用来搜集启动失败异常信心并向用户报告
4. 设置程序为自力更生模式 `configureHeadlessProperty()`; 需要程序运行在 Headless 模式下 
5. 获取 `SpringApplicationRunListeners`，新建一个 `SpringApplicationRunListeners(listners)` 用来存放从 <code><font color =  red>spring.factories</font></code>中所有 `SpringApplicationRunListener` 类型的类
```java
private SpringApplicationRunListeners getRunListeners(String[] args) {
    Class<?>[] types = new Class<?>[] { SpringApplication.class, String[].class };
    return new SpringApplicationRunListeners(logger,
            getSpringFactoriesInstances(SpringApplicationRunListener.class, types, this, args));
}
# Run Listeners, 找到的 RunListeners
org.springframework.boot.SpringApplicationRunListener=\
org.springframework.boot.context.event.EventPublishingRunListener
```
6. 遍历所有的 `listners` 并调用 `starting()` 方法启动，构造 `ApplicationStartingEvent` 事件，`source` 为 `application` 并广播事件，通知各个监听器
7. 对传入的参数 `args` 包装成 `ApplicationArguments`

#### Enviroment 环境准备

接上文
1. 环境准备 `prepareEnvironment()`, 获得或者创建 environment, 并且对参数 `applicationArguments` 进行处理
```java
private ConfigurableEnvironment prepareEnvironment(SpringApplicationRunListeners listeners,
        ApplicationArguments applicationArguments) {
    // Create and configure the environment
    // 如果原本存在 environment，那么使用原来的即可，如果不存在
    // 那么根据类型创建，由于环境是 SERVLET， 所以创建一个 StandardServletEnvironment()
    ConfigurableEnvironment environment = getOrCreateEnvironment();
    // 对 environment 进行配置，
    // 1. 为 enviroment 添加一些转换起服务
    // 2. enviroment 配置
    configureEnvironment(environment, applicationArguments.getSourceArgs());
    //  environment 中 PropertySource 处理
    ConfigurationPropertySources.attach(environment);
    // 遍历所有的监听器，执行 environmentPrepared() 方法
    listeners.environmentPrepared(environment);
    // 将 environment 绑定到 spring.main 方法上
    bindToSpringApplication(environment);
    // 后置处理
    if (!this.isCustomEnvironment) {
        environment = new EnvironmentConverter(getClassLoader()).convertEnvironmentIfNecessary(environment,
                deduceEnvironmentClass());
    }
    ConfigurationPropertySources.attach(environment);
    return environment;
}
```
    * environment 配置   
       - 为 environment 设置一些转换器服务 addConversionService(), 主要是一些不同类型值的转换
       - 为 environment 配置一些 PropertySource, 用来存放从命令行中拿到的参数数据，也将其放入到 environment 中
       - 为 environment 配置一些 Profiles, 用来存在一些激活的配置文件，并将其放入到 enviroment 中, 至此环境配置完成
    
    * environment 中 PropertySource 处理
      - 将 PropertySource 封装成 ConfigurationPropertySource, 方便 environment 管理, 并且允许 PropertySourcesPropertyResolver 通过 ConfigurationPropertyName 进行解析
  
    * 遍历所有的监听器，执行 environmentPrepared() 方法, 构造 ApplicationEnvironmentPreparedEvent 事件， source 为 application 并广播事件，通知各个监听器

    * 将 environment 绑定到 spring.main 方法上， 先对 spring.main 方法进行实例化，然后调用 bind() 方法进行绑定

    * 一些后置处理，对自定义环境进行处理
    
2. 配置需要忽略的 `Bean` 信息
3. 打印 `Banner` 信息
    
#### IOC 容器工作流程
接上文
1.  首先创建一个 `IOC` 容器(`ApplicationContext`)
    * 判断类型，根据类型对类进行实例化操作并返回。如果是 `SERVLET` 类型，那么创建的类型为 `AnnotationConfigServletWebServerApplicationContext`
    * 从 
