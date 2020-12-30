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
 - <code>Json</code>, <code>Xml</code>, xls, 图片视频, 自定义协商内容

#### 响应json数据

1. 如何使用
使用 <code>json.jar + @ResponseBody</code>, 想导入相关依赖(其实已经导入), 然后在方法上添加 @ResponseBody 注解

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
1. 进入 <code>DispatcherServlet.java</code> 文件中的 <code>doDispatch</code> 方法
2. 拿到 <code>HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler())<c/ode>;
3. 真正的执行 <code>mv = ha.handle(processedRequest, response, mappedHandler.getHandler())</code>;
4. <code>handle</code> 方法内部实现中 <code>handleInternal()</code> 继续进行处理
5. 然后执行 <code>invokeHandlerMethod()</code> 执行 handler 方法
6. 在 <code>invokeHandlerMethod()</code> 中既有参数解析器 <code>argumentResolvers</code>, 又有返回值解析器 <code>returnValueHandlers/<code>

 ```java
if (this.argumentResolvers != null) {
    invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
}
if (this.returnValueHandlers != null) {
    invocableMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
}
 ```
 7. 返回值解析器用来处理返回值，也就是如何使得响应的数据变为 <code>Json</code> 数据
 8. <code>HandlerMethodReturnValueHandler</code> 有很多中不同的返回值解析器
 ![HandlerMethodReturnValueHandler](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/HandlerMethodReturnValueHandler.jpg)
 9. 然后执行 i<code>nvocableMethod.invokeAndHandle(webRequest, mavContainer)</code>; 894行
 10. <code>Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs)</code>; 用来获得参数的值，上一篇博客内容
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
12. 返回值处理器 <code>HandlerMethodReturnValueHandler</code> 是一个接口，主要实现了两个方法：
![1609253807673](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/1609253807673.jpg)
13. 返回值处理器判断是否支持这种类型返回值 <code>supportsReturnType()</code>
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
14. 返回值处理器调用处理方法 <code>handleReturnValue</code>, 不同的返回值调用不同的处理方法
15. 对于 <code>@Responsebody</code> 来说
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
16. <code>writeWithMessageConverters()</code> 方法处理, 利用 <code>MessageConverters</code> 进行数据处理，将数据写成 <code>Json</code>
17. 内容协商见下
18. 内容协商之后的操作, 首先可以拿到 </code>selectedMediaType</code>, 选中的协商内容

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
19. <code>Spring MVC</code> 会按个遍历所有底层的 <code>messageConverters</code>, 看谁能处理这样的消息 


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

根据客户端接收能力不同，返回不同媒体类型的数据

1. 首先导入支持 xml 的依赖
2. 只要改变请求头中 Accept 字段，Http 协议中规定的，告诉服务器本客户端可以接收的数据类型
    - appliction/json
    - application/xml

#### 开启浏览器参数方式内容协商功能
为了方便内容协商，开启基于请求参数的内容协商功能
1. 开启基于请求参数的内容协商，spring 配置
```java
spring.mvc.contentnegotiation.favor-parameter=true
```
2. 请求连接书写时携带 <code>format=xml/json</code>
3. 内容协商管理器多了一条基于参数的内容协商策略 ParameterContentNegotiationStrategy
```java
// ParameterContentNegotiationStrategy
public class ParameterContentNegotiationStrategy extends AbstractMappingContentNegotiationStrategy {}
private String parameterName = "format";
// 而请求参数重有一个参数叫做 format
@Override
@Nullable
protected String getMediaTypeKey(NativeWebRequest request) {
    return request.getParameter(getParameterName());
}
```
4. ParameterContentNegotiationStrategy 策略优先确定是要返回 json 数据(请求头中的format值)


#### 内容协商原理
1. 判断当前响应头中是否有确定的媒体类型， MediaType
2. 获取客户端(浏览器，PostMan)支持的内容类型， 获取客户端 Accept 请求头字段 application/xml, AbstractMessageConverterMethodProcessor 216行
```java
List<MediaType> acceptableTypes = getAcceptableMediaTypes(request);
// 使用内容协商管理器 contentNegotiationManager， 默认使用基于请求头的策略确定客户端可以接收的内容类型
public class HeaderContentNegotiationStrategy implements ContentNegotiationStrategy {
	@Override
	public List<MediaType> resolveMediaTypes(NativeWebRequest request)
			throws HttpMediaTypeNotAcceptableException {

		String[] headerValueArray = request.getHeaderValues(HttpHeaders.ACCEPT);
		if (headerValueArray == null) {
			return MEDIA_TYPE_ALL_LIST;
		}

		List<String> headerValues = Arrays.asList(headerValueArray);
		try {
			List<MediaType> mediaTypes = MediaType.parseMediaTypes(headerValues);
			MediaType.sortBySpecificityAndQuality(mediaTypes);
			return !CollectionUtils.isEmpty(mediaTypes) ? mediaTypes : MEDIA_TYPE_ALL_LIST;
		}
		catch (InvalidMediaTypeException ex) {
			throw new HttpMediaTypeNotAcceptableException(
					"Could not parse 'Accept' header " + headerValues + ": " + ex.getMessage());
		}
	}
}
```
3. 遍历循环所有当前系统的 GenericHttpMessageConverter, 看谁支持操作这个对象 Person
```java
List<MediaType> producibleTypes = getProducibleMediaTypes(request, valueType, targetType);
```
4. 找到支持操作 Person 的 converter, 然后把 converter 支持的媒体类型统计出来
![GenericHttpMessageConverter](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/GenericHttpMessageConverter.jpg)
5. 客户端需要 [application/xml], 服务端的能力 [10] 种。
6. 进行内容协商的最佳匹配，拿到浏览器想要的的和当前系统支持的类型
```java
List<MediaType> mediaTypesToUse = new ArrayList<>();
for (MediaType requestedType : acceptableTypes) {
    for (MediaType producibleType : producibleTypes) {
        if (requestedType.isCompatibleWith(producibleType)) {
            mediaTypesToUse.add(getMostSpecificMediaType(requestedType, producibleType));
        }
    }
}
```
7. 用支持将对象转为最佳匹配媒体类型的 convert 调用它转换为 xml
8. 为什么浏览器响应 xml 数据，是因为 xml 最佳匹配的优先级最高

#### 自定义 MessageConverter
实现多协议数据兼容：
1. @ResponseBody 响应数据，调用 RequestResponseBodyMethodProcessor 处理
2. Processor 处理方法返回值，通过 MessageConverter 处理
3. 所有的 MessageConverter 合起来可以支持各种媒体类型数据的操作(读, 写)
4. 内容协商找到最佳的 messageConverter

修改 Spring Mvc 功能，给容器中添加一个 WebMvcConfiger()
```java
@Bean
public WebMvcConfigurer webMvcConfigurer(){
    return new WebMvcConfigurer() {
        @Override
        public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
            converters.add(new AppConverter());
        }
    };
}

package converter;

import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.ui.Model;

import javax.print.attribute.standard.Media;
import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

/**
 * 自定义 MessageConverter
 * @author caolp
 */
public class AppConverter implements HttpMessageConverter<Class<?>> {
    /**
     * 把 clazz 数据读成 mediaType
     */
    @Override
    public boolean canRead(Class<?> clazz, MediaType mediaType) {
        return false;
    }

    /**
     *
     * @param clazz
     * @param mediaType
     * @return
     */
    @Override
    public boolean canWrite(Class<?> clazz, MediaType mediaType) {
        return false;
    }

    /**
     * 获取所有支持的媒体类型，服务器要统计所有MessageConverter 都能写出哪些内容类型
     * application/app
     * @return
     */
    @Override
    public List<MediaType> getSupportedMediaTypes() {
        return MediaType.parseMediaTypes("application/app");
    }

    @Override
    public Class<?> read(Class<? extends Class<?>> clazz, HttpInputMessage inputMessage) throws IOException, HttpMessageNotReadableException {
        return clazz.isAssignableFrom(clazz);
    }

    /**
     * 自定义数数据写出
     * @param aClass
     * @param contentType
     * @param outputMessage
     * @throws IOException
     * @throws HttpMessageNotWritableException
     */
    @Override
    public void write(Class<?> aClass, MediaType contentType, HttpOutputMessage outputMessage) throws IOException, HttpMessageNotWritableException {
        String data = aClass.toString() + ";" + aClass.getName();
        OutputStream body = outputMessage.getBody();
        body.write(data.getBytes());
    }
}

```

请求的场景：
1. 浏览器发起请求直接返回 xml   [application/xml]  jacksonXmlConverter
2. 如果是 ajax 请求，返回 json   [application/json]  jacksonJsonConverter
3. 如果是 app 发起请求，返回自定义协议数据  [application/x-app]  xxxConverter
    规定为：属性值1;属性值2

步骤；
1. 添加一个自定义的 messageconverter 进入系统底层
2. 系统底层就会统计出所有的 messageconverter能操作哪些类型
3. 客户端内容协商 [app ---> app]
