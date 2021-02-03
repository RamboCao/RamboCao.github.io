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

