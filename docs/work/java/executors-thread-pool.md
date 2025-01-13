# 简单概述Executors提供的几种线程池

## 介绍

Executors 是一个工厂类，提供了一些创建线程池的方法，这里详细梳理一下大家最常使用的4个方法。

- **newSingleThreadExecutor()**：只有一个线程的线程池，任务是顺序执行，适用于一个一个任务执行的场景
- **newFixedThreadPool()**：拥有固定线程数的线程池，如果没有任务执行，那么线程会一直等待，适用执行长期的任务。
- **newCachedThreadPool()**：线程池里有很多线程需要同时执行，60s内复用，适用执行很多短期异步的小程序或者负载较轻的服务。
- **newScheduledThreadPool()**：用来调度即将执行的任务的线程池

| 参数          | FixedThreadPool | CachedThreadPool  | ScheduledThreadPool | SingleThreadExecutor | SingleScheduledThreadPool |
| ------------- | :-------------: | :---------------: | :-----------------: | :------------------: | :-----------------------: |
| corePoolSize  |  构造函数传入   |         0         |    构造函数传入     |          1           |             1             |
| maxPoolSize   | 同corePoolSize  | Integer.MAX_VALUE |  Integer.MAX_VALUE  |          1           |     Integer.MAX_VALUE     |
| keepAliveTime |        0        |        60s        |          0          |          0           |             0             |

### newSingleThreadExecutor()

```java
    public static ExecutorService newSingleThreadExecutor() {
        return new FinalizableDelegatedExecutorService
            (new ThreadPoolExecutor(1, 1,
                                    0L, TimeUnit.MILLISECONDS,
                                    new LinkedBlockingQueue<Runnable>()));
    }
```

只有一个线程的线程池，通过ThreadExecutor构造函数，控制了核心线程数和最大线程数均为1，同时空闲等待时候是0，队列采用`new LinkedBlockingQueue<Runnable>()`无界队列。这里使用`FinalizableDelegatedExecutorService` 做了一层包装，使返回的`ExecutorService` 无法强转为ThreadPoolExecutor，也就无法使用ThreadPoolExecutor 的方法去修改核心线程数和最大线程数了。确保了线程池中只有一个线程。

#### 用途

当需要确保任务**按照提交的顺序执行**，任务量稳定可预测，耗时不久的任务，并且不想处理线程管理的复杂性时，可以使用 `newSingleThreadExecutor`。因为是无界队列，要注意避免提交任务比执行任务速度快，导致队列中任务积压从而内存溢出的问题。

### newFixedThreadPool()

```java
public static ExecutorService newFixedThreadPool(int nThreads) {
    return new ThreadPoolExecutor(nThreads, nThreads,
                                  0L, TimeUnit.MILLISECONDS,
                                  new LinkedBlockingQueue<Runnable>());
}
```

提供一个入参，可以设置**固定线程数的线程池**来使用，核心线程数和最大线程数相等，队列使用`new LinkedBlockingQueue<Runnable>()`无界队列。

#### 用途

因为线程数固定，且不会销毁，所以适合执行长期任务，任务量稳定可预测，耗时不久的任务，根据系统的资源，合理设置固定的线程数，帮助控制CPU资源的使用率。要注意不要发生队列中任务积压从而内存溢出的问题。

### newCachedThreadPool()

```java
    public static ExecutorService newCachedThreadPool() {
        return new ThreadPoolExecutor(0, Integer.MAX_VALUE,
                                      60L, TimeUnit.SECONDS,
                                      new SynchronousQueue<Runnable>());
    }
```

叫作缓存的线程池，核心线程数为0，最大线程数是`Integer.MAX_VALUE` ,非核心线程数空闲等待时候为60s，线程池队列采用没有容量的同步队列`new SynchronousQueue<Runnable>`。

#### 用途

适合用于短期的异步任务，在60s之内线程可以复用。任务量要可控，不能阻塞，否则后续继续有任务提交，会导致创建大量线程，浪费系统资源。由于使用了`SynchronousQueue` 同步队列，队列接收到一个任务就必须有一个线程去执行，直接去传递任务给线程。

### newScheduledThreadPool

```java
    public static ScheduledExecutorService newScheduledThreadPool(int corePoolSize) {
        return new ScheduledThreadPoolExecutor(corePoolSize);
    }
    
    // ScheduledThreadPoolExecutor 类
        public ScheduledThreadPoolExecutor(int corePoolSize) {
        super(corePoolSize, Integer.MAX_VALUE, 0, NANOSECONDS,
              new DelayedWorkQueue());
    }
```

定期或延迟执行任务的线程池，通过构造函数设置核心线程数，最大线程数数是`Integer.max` ，非核心线程的空闲等待时间是0纳秒，使用`DelayedWorkQueue` 无界阻塞队列作为线程池队列。

#### 用途

可以用来延迟执行任务，可以定时执行任务，阻塞队列中的人物根据延迟执行的时间排序，先执行的先出队列。