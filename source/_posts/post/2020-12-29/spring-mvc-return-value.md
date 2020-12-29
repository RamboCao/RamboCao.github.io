---
title: Spring Boot Web 返回值处理
tags: Spring Boot
categories: Spring Boot
abbrlink: 51bf75dc
date: 2020-12-29 22:07:34
cover: https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18029.jpg
---

![18029](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18029.jpg)

### 数据响应与内容协商

响应数据
 - 响应页面
 - Json, Xml, xls, 图片视频, 自定义协商内容

 #### 响应json数据

 1. 如何使用
 使用 json.jar + @ResponseBody, 想导入相关依赖(其实已经导入), 然后在方法上添加 @ResponseBody 注解

 ```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-json</artifactId>
    <version>2.4.1</version>
    <scope>compile</scope>
</dependency>

<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.11.3</version>
    <scope>compile</scope>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.datatype</groupId>
    <artifactId>jackson-datatype-jdk8</artifactId>
    <version>2.11.3</version>
    <scope>compile</scope>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.datatype</groupId>
    <artifactId>jackson-datatype-jsr310</artifactId>
    <version>2.11.3</version>
    <scope>compile</scope>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.module</groupId>
    <artifactId>jackson-module-parameter-names</artifactId>
    <version>2.11.3</version>
    <scope>compile</scope>
</dependency>
 ```

 #### 响应 Json 数据原理
 1. 进入 DispatcherServlet.java 文件中的 doDispatch 方法
 2. 拿到 HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
 3. 真正的执行 mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
 4. handle 方法内部实现中 handleInternal() 继续进行处理
 5. 然后执行 invokeHandlerMethod() 执行 handler 方法
 6. 在 invokeHandlerMethod() 中既有参数解析器 argumentResolvers, 又有返回值解析器 returnValueHandlers

 ```java
if (this.argumentResolvers != null) {
    invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
}
if (this.returnValueHandlers != null) {
    invocableMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
}
 ```
 7. 返回值解析器用来处理返回值，也就是如何使得响应的数据变为 Json 数据
 8. HandlerMethodReturnValueHandler 有很多中不同的返回值解析器

 ![HandlerMethodReturnValueHandler](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/HandlerMethodReturnValueHandler.jpg)

 9. 然后执行 invocableMethod.invokeAndHandle(webRequest, mavContainer); 894行
 10. Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs); 用来获得参数的值，上一篇博客内容
 11. 取到参数值之后, 判断返回值是否为空，执行

 ```java
try {
    this.returnValueHandlers.handleReturnValue(
            returnValue, getReturnValueType(returnValue), mavContainer, webRequest);
}
// 先获取返回值类型, 然后处理返回值，
```

```java
// 1. 判断哪个处理值能够处理，2. 处理
@Override
public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
        ModelAndViewContainer mavContainer, NativeWebRequest webRequest) throws Exception {
    // 判断哪个处理器能够处理
    HandlerMethodReturnValueHandler handler = selectHandler(returnValue, returnType);
    if (handler == null) {
        throw new IllegalArgumentException("Unknown return value type: " + returnType.getParameterType().getName());
    }
    handler.handleReturnValue(returnValue, returnType, mavContainer, webRequest);
}
```

12. 返回值处理器 HandlerMethodReturnValueHandler 是一个接口，主要实现了两个方法：

![1609253807673](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/1609253807673.jpg)

13. 返回值处理器判断是否支持这种类型返回值 supportsReturnType()

```java
// 使用增强 for 循环进行判断，每一种返回值解析器根据不同的条件进行判断
@Nullable
private HandlerMethodReturnValueHandler selectHandler(@Nullable Object value, MethodParameter returnType) {
    boolean isAsyncValue = isAsyncReturnValue(value, returnType);
    for (HandlerMethodReturnValueHandler handler : this.returnValueHandlers) {
        if (isAsyncValue && !(handler instanceof AsyncHandlerMethodReturnValueHandler)) {
            continue;
        }
        if (handler.supportsReturnType(returnType)) {
            return handler;
        }
    }
    return null;
}
```

14. 返回值处理器调用处理方法 handleReturnValue, 不同的返回值调用不同的处理方法

15. 对于 @Responsebody 来说
返回值处理器支持的方法是:
```java
// 只要标注了 @ResponseBody 标注就可以返回
@Override
public boolean supportsReturnType(MethodParameter returnType) {
    return (AnnotatedElementUtils.hasAnnotation(returnType.getContainingClass(), ResponseBody.class) ||
            returnType.hasMethodAnnotation(ResponseBody.class));
}
```

返回值处理器调用的方法是：

```java
// RequestResponseBodyMethodProcessor 来进行处理
@Override
public void handleReturnValue(@Nullable Object returnValue, MethodParameter returnType,
        ModelAndViewContainer mavContainer, NativeWebRequest webRequest)
        throws IOException, HttpMediaTypeNotAcceptableException, HttpMessageNotWritableException {

    mavContainer.setRequestHandled(true);
    ServletServerHttpRequest inputMessage = createInputMessage(webRequest);
    ServletServerHttpResponse outputMessage = createOutputMessage(webRequest);

    // Try even with null return value. ResponseBodyAdvice could get involved.
    // 使用消息转换器进行写出操作
    writeWithMessageConverters(returnValue, returnType, inputMessage, outputMessage);
}
```

#### HTTPMessageConverter 原理
接上文
16. writeWithMessageConverters() 方法处理, 利用 MessageConverters 进行数据处理，将数据写成 Json
17. 内容协商见下
18. 内容协商之后的操作, 首先可以拿到 selectedMediaType, 选中的协商内容

```java
if (selectedMediaType != null) {
    selectedMediaType = selectedMediaType.removeQualityValue();
    for (HttpMessageConverter<?> converter : this.messageConverters) {
        GenericHttpMessageConverter genericConverter = (converter instanceof GenericHttpMessageConverter ?
                (GenericHttpMessageConverter<?>) converter : null);
        if (genericConverter != null ?
                ((GenericHttpMessageConverter) converter).canWrite(targetType, valueType, selectedMediaType) :
                converter.canWrite(valueType, selectedMediaType)) {
            body = getAdvice().beforeBodyWrite(body, returnType, selectedMediaType,
                    (Class<? extends HttpMessageConverter<?>>) converter.getClass(),
                    inputMessage, outputMessage);
            if (body != null) {
                Object theBody = body;
                LogFormatUtils.traceDebug(logger, traceOn ->
                        "Writing [" + LogFormatUtils.formatValue(theBody, !traceOn) + "]");
                addContentDispositionHeader(inputMessage, outputMessage);
                if (genericConverter != null) {
                    genericConverter.write(body, targetType, selectedMediaType, outputMessage);
                }
                else {
                    ((HttpMessageConverter) converter).write(body, selectedMediaType, outputMessage);
                }
            }
            else {
                if (logger.isDebugEnabled()) {
                    logger.debug("Nothing to write: null body");
                }
            }
            return;
        }
    }
}
```
19. Spring MVC 会按个遍历所有底层的 messageConverters, 看谁能处理这样的消息 


#### HttpMessageConverter
HttpMessageConverter 规范:

![HttpMessageConverter](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/HttpMessageConverter.jpg)

看是否支持将此 Class 类型的对象，转为 MediaType 类型的数据

例子： Person 转 Json(响应) 或者 Json 转 Person(请求)
例子：canRead() 能否将读入的 Person 转为 Json 数据

默认的 messageConverters:

![messageConverters](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/messageConverters.jpg)



#### 内容协商
浏览器默认会以请求头的方式告诉服务器它能接收什么样的内容类型

![浏览器请求头](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/1609255308496.jpg)

*/* 表示能接收所有的东西, q 表示权重, 优先接收权重大的内容

服务器最终根据自己自身的能力，决定服务器最终能生产出什么类型的数据

```java
MediaType selectedMediaType = null;
MediaType contentType = outputMessage.getHeaders().getContentType();
boolean isContentTypePreset = contentType != null && contentType.isConcrete();
if (isContentTypePreset) {
    if (logger.isDebugEnabled()) {
        logger.debug("Found 'Content-Type:" + contentType + "' in response");
    }
    // 取之前的选中的媒体类型
    selectedMediaType = contentType;
}
else {
    // 否则拿到原生请求
    HttpServletRequest request = inputMessage.getServletRequest();
    // 浏览器可以接受的类型
    List<MediaType> acceptableTypes = getAcceptableMediaTypes(request);
    // 服务器能响应的类型
    List<MediaType> producibleTypes = getProducibleMediaTypes(request, valueType, targetType);

    if (body != null && producibleTypes.isEmpty()) {
        throw new HttpMessageNotWritableException(
                "No converter found for return value of type: " + valueType);
    }
    List<MediaType> mediaTypesToUse = new ArrayList<>();
    // 服务器和浏览器进行协商
    for (MediaType requestedType : acceptableTypes) {
        for (MediaType producibleType : producibleTypes) {
            if (requestedType.isCompatibleWith(producibleType)) {
                mediaTypesToUse.add(getMostSpecificMediaType(requestedType, producibleType));
            }
        }
    }
```





