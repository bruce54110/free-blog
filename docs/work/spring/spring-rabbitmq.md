# SpringBoot 整合 RabbitMQ 修改序列化方式

#### 1. 添加maven依赖

我们可以搭建一个springboot的maven聚合工程，其中两个module，一个作为mq的生产者，一个作为mq的消费者。

除了其他基本依赖歪还需要以下 spring-boot-starter-amq依赖。

```xnl
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
```

#### 2. 在项目中添加RabbitMQ相关配置

application.yml文件中添加如下配置

```yaml
spring:
    application:
        # 应用名称
        name: xxx
    rabbitmq:
        # rabbitmq 基本配置
        addresses: xx.xx.xx.xx:xxxx
        username: xxxx
        password: xxxx
        virtual-host: /
        connection-timeout: 15000
        # rabbitmq 消费者监听配置
        listener:
            simple:
                concurrency: 5 # 消费端的监听个数(即@RabbitListener开启几个线程去处理数据。)
                max-concurrency: 10 #最大并发
                acknowledge-mode: manual # 签收模式
                prefetch: 1 # 消费端限流 ，每个线程最多取一个数据
```

我发现，springboot 集成RabbitMQ 的时候使用的默认的序列化方式 `org.springframework.amqp.support.converter.SimpleMessageConverter` 这个转换器在序列化和反序列化时，严格要求对象属性，类型，包路径严格一致，才能反序列化成功。

假设我们这里使用RabbitMQ发送消息，发送一个实体类对象。那么我们在两个maven工程中都编写一个类名，属性相同的实体类传递消息时，会导致RabbitMQ消费消息失败。

要想解决这个情况想到有两种办法：

1. 可以将实体类定义到公共的工程中形成一个maven jar，生产者和消费者共同引入该 jar。
2. 我们通过修改springboot项目中 RabbitMQ 的序列化方式，改为`Jackson2JsonMessageConverter()` 的方式。

我们这里使用第二个方案进行配置。

首先是生产者使用`RabbitTemplate` 发送消息，所以添加配置类如下：

```java

@Configuration
public class RabbitMqConfig {

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(new Jackson2JsonMessageConverter());
        return rabbitTemplate;
    }
}
```

消费者也需要使用相同的序列化方式，通过实现` RabbitListenerConfigurer` 接口实现 `configureRabbitListeners(RabbitListenerEndpointRegistrar rabbitListenerEndpointRegistrar) `方式 ,设置`MappingJackson2MessageConverter()` 。

```java
import org.springframework.amqp.rabbit.annotation.RabbitListenerConfigurer;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.listener.RabbitListenerEndpointRegistrar;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.handler.annotation.support.DefaultMessageHandlerMethodFactory;

@Configuration
public class MyRabbitListenerConfigurer implements RabbitListenerConfigurer{

    //以下配置RabbitMQ消息服务
    @Autowired
    public ConnectionFactory connectionFactory;


    @Bean
    public DefaultMessageHandlerMethodFactory myHandlerMethodFactory() {
        DefaultMessageHandlerMethodFactory factory = new DefaultMessageHandlerMethodFactory();
        // 这里的转换器设置实现了 通过 @Payload 注解 自动反序列化message body
        factory.setMessageConverter(new MappingJackson2MessageConverter());
        return factory;
    }

    @Override
    public void configureRabbitListeners(RabbitListenerEndpointRegistrar rabbitListenerEndpointRegistrar) {
        rabbitListenerEndpointRegistrar.setMessageHandlerMethodFactory(myHandlerMethodFactory());
    }

}

```

#### 生产者发送消息

```java
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendOrder(TOrder order) throws Exception {
        CorrelationData correlationData = new CorrelationData();
        correlationData.setId(order.getMessageId());
        MessageConverter messageConverter = rabbitTemplate.getMessageConverter();
        System.out.println(messageConverter);
        rabbitTemplate.convertAndSend(
                "order-exchange",
                "order.abcd",
                order,
                correlationData);  // 消息唯一id
    }
```

#### 消费者消费消息

```java
 @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "order-queue", durable = "true"),
            exchange = @Exchange(name = "order-exchange" ,durable = "true", type = "topic"),
            key = "order.*"
    ))
    @RabbitHandler
    public void onOrderMessage(@Payload TOrder order, @Headers Map<String, Object> headers, Channel channel) throws IOException {
        // 消费者操作
        System.out.println("----------收到消息，开始消费-----------");
        System.out.println("订单ID: " + order.getId());
        // 确认签收
        Long deliveryTag = (Long)headers.get(AmqpHeaders.DELIVERY_TAG);
        // 手动签收模式下，需要发送确认
        // deliveryTag  该消息的index
        // false : 是否批量,将一次性ack所有小于deliveryTag的消息。
        channel.basicAck(deliveryTag, false);
        System.out.println("----------ack，finished-----------");

    }
```