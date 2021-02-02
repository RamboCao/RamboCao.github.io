---
title: HashMap 与 LinkedHashMap
tags: Java
categories: Java
abbrlink: ce0196ed
date: 2021-01-18 09:53:28
cover: https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18069.jpg
---

![18069](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/18069.jpg)

### HashMap
#### HashMap 构造方法

```java
/*构造方法1*/
public HashMap() {
    this.loadFactor = DEFAULT_LOAD_FACTOR; // all other fields defaulted
}
/*构造方法2*/
public HashMap(int initialCapacity, float loadFactor) {
    if (initialCapacity < 0)
        throw new IllegalArgumentException("Illegal initial capacity: " +
                                            initialCapacity);
    if (initialCapacity > MAXIMUM_CAPACITY)
        initialCapacity = MAXIMUM_CAPACITY;
    if (loadFactor <= 0 || Float.isNaN(loadFactor))
        throw new IllegalArgumentException("Illegal load factor: " +
                                            loadFactor);
    this.loadFactor = loadFactor;
    this.threshold = tableSizeFor(initialCapacity);
}
/*构造方法3*/
public HashMap(int initialCapacity) {
    this(initialCapacity, DEFAULT_LOAD_FACTOR);
}
/*构造方法4*/
public HashMap(Map<? extends K, ? extends V> m) {
    this.loadFactor = DEFAULT_LOAD_FACTOR;
    putMapEntries(m, false);
}
```

1. <code>HashMap</code> 构造方法共有四个，第一个构造方法是最常用的，无参构造器，初始化负载因子 <code>loadFactor</code> 为 0.75， 负载因子主要用来决定 HashMap 中**键值对数量**和**Hash表容量**之间的比例，如果负载因子太大，那么 <code>HashMap</code> 中的键值对越多，但是查找耗费时间会变长，<code>HashMap</code> 扩容可能性降低，反之 <code>HashMap</code> 占用的空间会变大，扩容可能性增大
2. 构造方法2，容量(initialCapacity)和负载因子(loadFactor)被初始化，initialCapacity 默认值16，最大值为 $2^{30}$，指定合适的初始化容量非常重要，避免一些不必要的扩容操作，导致效率降低
3. <code>threshold</code> 用来限制 <code>HashMap</code> 中能存放键值对的数量，当数量超过 <code>threshold</code> 时，需要进行扩容操作，<code>threshold = initialCapacity * loadFactor</code>, 构造方法2中通过 <code>tableSizeFor()</code> 方法对 <code>threshold</code> 进行赋值，因为此时 <code>table</code> 还没有进行初始化，当进行 <code>put</code> 操作时，<code>table</code> 才会被构建，同时 <code>threshold</code> 会在 <code>resize()</code> 方法中被重新赋值

```java
static final int tableSizeFor(int cap) {
    int n = -1 >>> Integer.numberOfLeadingZeros(cap - 1);
    return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}
```
以下是对 <code>tableSizeFor</code> 函数的分析, 分为两种不同的情况
1. 假设 <code>cap</code> 的值正好为 $2^n$, 假设其值为 8, 那么;

   ![tableForSize1](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/tableForSize1.png)

2. 假设 <code>cap</code> 的值不是 $2^n$, 假设其值为 13, 那么;
   
   ![tableForSize2](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/tableForSize2.png)


```java
/**
    * 这个方法用来返回参数二进制的前导零的个数
    * 参数在计算机中使用补码的方式保存
    * @param i 参数
    * @return 前导零的个数
    * 例: 参数 i = 0
    *    原码 0000 0000 0000 0000 0000 0000 0000 0000
    *    反码 1111 1111 1111 1111 1111 1111 1111 1111
    *    补码 0000 0000 0000 0000 0000 0000 0000 0000
    *    前导0个数: 32 个
    *
    *    参数 i= -1
    *    原码 1000 0000 0000 0000 0000 0000 0000 0001
    *    反码 1111 1111 1111 1111 1111 1111 1111 1110
    *    补码 1111 1111 1111 1111 1111 1111 1111 1111
    *    前导0个数: 0个
    *
    *    参数 i= 6
    *    原码 0000 0000 0000 0000 0000 0000 0000 0110
    *    反码 0000 0000 0000 0000 0000 0000 0000 0110
    *    补码 0000 0000 0000 0000 0000 0000 0000 0110
    *    前导0个数: 29
    *
    *    numberOfLeadingZeros方法
    *    1.采用轮询的方式，判断每一位
    *    2. 采用二分法进行计算
    *
    */
/**
    * 这种方法是通过轮询的方式，从最高位开始依次遍历，当 i 某一位存在 1
    * 那么就停止循环，将前导0的个数输出
    *
    * @param i 参数i
    * @return 参数 i 的前导0的个数
    */
public static int numberOfLeadingZerosByLoop(int i){
    if(i <=0 ){
        return i == 0 ? 32 : 0;
    }
    int n = 0;
    for(int k = 31; k >= 0; k--){
        if((i & (1 << k) ) != 0){
            break;
        }else {
            n++;
        }
    }
    return n;
}

public static int numberOfLeadingZeros(int i) {
    // HD, Count leading 0's
    if (i <= 0){
        return i == 0 ? 32 : 0;
    }
    int n = 31;
    // |________|________|________|________|
    // i >= 2^16, 那么 n= 31-16 = 15, i 无符号右移 16 位
    if (i >= 1 << 16) { n -= 16; i >>>= 16; } // 高 16 位, |________|________|
    // 剩余的 i >= 2^8, 那么 n = 15-8 = 7, i 无符号右移 8 位
    if (i >= 1 <<  8) { n -=  8; i >>>=  8; } // 高 8 位   |________|
    // 剩余的 i >= 2^4, 那么 n = 7-4 = 3, i 无符号右移 4 位
    if (i >= 1 <<  4) { n -=  4; i >>>=  4; } // 高四位    |____|
    // 剩余的 i >= 2^2, 那么 n = 3-2 = 1, i 无符号右移 2 位
    if (i >= 1 <<  2) { n -=  2; i >>>=  2; } // 高两位    |__|
    // 判断最后的 i = 1 或者 > 1, 如果 i > 1, i >>> 1 = 1, 否则 i = 0
    return n - (i >>> 1);
}

/**
    * i = 2^17
    * 0000 0000 0000 0010 0000 0000 0000 0000
    * 1 << 16
    * 0000 0000 0000 0001 0000 0000 0000 0000
    * i > 1 << 16
    * n = 31 -16 = 15
    * i >>> 16
    * 0000 0000 0000 0000 0000 0000 0000 0010
    * i = 2
    * i >>> 1 = 1
    * n = 15 - 1 = 14
    */
```

#### HashNode

![HashNode](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/20210121225137.png)

HashMap 中的 Node 静态类实现了 Map.Entry<K,V>
```java
// 通过下标存放或者取值
(n - 1) & hash

// 计算 hash 值
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}

// 计算 hashCode 值
public final int hashCode() {
    return Objects.hashCode(key) ^ Objects.hashCode(value);
}
```
1. 为什么使用 <code>h = key.hashCode() ^ (h >>> 16)</code>, 而不是直接使用 <code>hashCode</code>?
   当从桶数组中进行取值时，需要通过 <code>(n-1)&hash</code> 去定位元素/节点的位置, 而 <code>n</code> 的值一般都小于 $2^{16}$, <code>n</code> 为表长度, 直接采用 <code>(n-1)</code> 与 <code>hashCode</code> 进行操作时, <code>hashCode</code> 仅末尾**16**位数字参与运算, 如果 <code>hashCode</code> 同样参与运算, 那么最终结果将更加散列, Hash 表的冲突也就会越小
2. 问题1中为什么使用 ^ 符号?
   因为 & 和 | 操作更加偏向于 0 和 1, 导致分布不均匀
3. 为什么使用 <code>(n-1) & hash</code>, 而不使用 <code>hash % n</code>?
   二者计算结果相同, 但 & 效率高于 %


```java
/**
* Implements Map.put and related methods.
*
* @param hash hash for key
* @param key the key
* @param value the value to put
* @param onlyIfAbsent if true, don't change existing value
* @param evict if false, the table is in creation mode.
* @return previous value, or null if none
*/
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                boolean evict) {
    Node<K,V>[] tab; Node<K,V> p; int n, i;
    // 运行时赋值, table -> tab; table.length -> 0, tab 为空或者长度为0, table 未进行初始化
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;
    // tab[i = (n - 1) & hash] ? 如何判断这个桶中 通过节点 hash 定位节点所在的桶位置，并检测桶中是否包含节点引用
    // table 已经初始化, 且通过 hash 算法找到下标所在的位置数据为空,直接将数据存放到指定位置
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);
    // table 已经初始化, 且通过hash算法找到下标所在的位置数据不为空，发生hash冲突（碰撞）
    else {
        Node<K,V> e; K k;
        // 判断插入的 key 如果等于当前位置的 key 的话，将 e 指向该键值对
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
            e = p;
        // 如果桶中的数据类型为 TreeNode, 使用红黑树插入
        else if (p instanceof TreeNode)
            e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
        // 如果是链表，则进行循环判断
        else {
            for (int binCount = 0; ; ++binCount) {
                // 链表中不包含插入节点, 将该节点插入到链表末尾
                if ((e = p.next) == null) {
                    p.next = newNode(hash, key, value, null);
                    // 如果链表的长度大于阈值, 
                        // table 容量超过最小树化容量, 将链表进行树化
                        // 否则进行扩容处理（优先进行扩容处理）
                    if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                        treeifyBin(tab, hash);
                    break;
                }
                // 链表中包含插入节点, 则跳出循环
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    break;
                // 链表循环指针移动
                p = e;
            }
        }
        //  //经过上面的循环后，如果e不为空，则说明上面插入的值已经存在于当前的hashMap中，那么更新指定位置的键值对
        if (e != null) { // existing mapping for key
            V oldValue = e.value;
            if (!onlyIfAbsent || oldValue == null)
                e.value = value;
            // 回调处理, 对于 LinkedHashMap 来说, 用来处理指针链接
            afterNodeAccess(e); 
            return oldValue;
        }
    }
    ++modCount;
    if (++size > threshold)
        resize();
    // 回调处理
    afterNodeInsertion(evict);
    return null;
}
```

```java
/**
* Initializes or doubles table size.  If null, allocates in
* accord with initial capacity target held in field threshold.
* Otherwise, because we are using power-of-two expansion, the
* elements from each bin must either stay at same index, or move
* with a power of two offset in the new table.
*
* @return the table
*/
final Node<K,V>[] resize() {
    Node<K,V>[] oldTab = table;
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    int oldThr = threshold;
    int newCap, newThr = 0;
    // table 已经进行初始化, 并且容量 > 0
    if (oldCap > 0) {
        // 如果 table 的容量已经达到最大容量 MAXIMUM_CAPACITY = 1 << 30, 则不进行扩容, 直接将阈值设置为最大值 Integer.MAX_VALUE
        if (oldCap >= MAXIMUM_CAPACITY) {
            threshold = Integer.MAX_VALUE;
            return oldTab;
        }
        // 如果 table 容量大于等于默认的初始化容量, 而且扩容两倍之后的容量小于最大容量, 那么将容量调整为原来的两倍
        else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                    oldCap >= DEFAULT_INITIAL_CAPACITY)
            newThr = oldThr << 1; // double threshold
    }
    // 阈值 threshold 大于 0, 使用 threshold 变量暂时保存 initialCapacity 参数的值, 这种情况出现于 new HashMap(2, 0.75) / new HashMap(2)
    else if (oldThr > 0) // initial capacity was placed in threshold
        newCap = oldThr;
    // 如果阈值和容量都没有进行过初始化, 初始化 HashMap 的时候
    else {               // zero initial threshold signifies using defaults
        // 使用默认值分别初始化容量 16 和阈值 12
        newCap = DEFAULT_INITIAL_CAPACITY;
        newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
    }
    // 如果 newThr 为 0, 重新计算, new HashMap(2, 0.75) / new HashMap(2) 情况下该分支启用
    if (newThr == 0) {
        float ft = (float)newCap * loadFactor;
        newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                    (int)ft : Integer.MAX_VALUE);
    }
    // 更新阈值
    threshold = newThr;
    // 更新数组桶
    @SuppressWarnings({"rawtypes","unchecked"})
    Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
    table = newTab;
    // 如果原来的桶中存在数据, 由于 table 容量发生变化，hash 值也会发生变化，需要重新计算下标
    if (oldTab != null) {
        for (int j = 0; j < oldCap; ++j) {
            Node<K,V> e;
            // 指定下标中存在数据
            if ((e = oldTab[j]) != null) {
                oldTab[j] = null;
                // 指定下标只有一个节点
                if (e.next == null)
                    // 重新计算 hash 值并放入到新的下标中
                    newTab[e.hash & (newCap - 1)] = e;
                // 如果节点是 TreeNode
                else if (e instanceof TreeNode)
                    // 使用 split 方法进行拆分
                    ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                else { // preserve order
                    // 如果为链表, 通过 hash 计算新的下标，然后重新分组进行放置
                    Node<K,V> loHead = null, loTail = null;
                    Node<K,V> hiHead = null, hiTail = null;
                    Node<K,V> next;
                    do {
                        next = e.next;
                        // 计算 e.hash & oldCap, 与 0 进行对比然后判断是否对链表进行拆分, 使得键值对分布更加均匀，一半放在低位，一半放在高位
                        if ((e.hash & oldCap) == 0) {
                            if (loTail == null)
                                loHead = e;
                            else
                                loTail.next = e;
                            loTail = e;
                        }
                        else {
                            if (hiTail == null)
                                hiHead = e;
                            else
                                hiTail.next = e;
                            hiTail = e;
                        }
                    } while ((e = next) != null);
                    //  将分组后的链表映射到新桶中
                    if (loTail != null) {
                        loTail.next = null;
                        newTab[j] = loHead;
                    }
                    if (hiTail != null) {
                        hiTail.next = null;
                        newTab[j + oldCap] = hiHead;
                    }
                }
            }
        }
    }
    return newTab;
}
```

### 红黑树


![red_black_tree](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/red_black_tree.jpg)

![red_black_tree_1](https://cdn.jsdelivr.net/gh/RamboCao/PicGo/images/red_black_tree_1.png)