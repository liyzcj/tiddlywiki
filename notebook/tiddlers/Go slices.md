
# Go Slices

> From Go blog: [Go Slices: usage and internals](https://blog.golang.org/go-slices-usage-and-internals)

## Introduction

Go Slice 类型在处理特定类型的序列数据时非常方便和高效。Slices 和其他语言中的 arrays 是非常类似的（analogous） ，但是也有一些不寻常的属性。这篇文章回带你深入了解 slices。

## Arrays

Go Slice 类型是对 Go array 类型的一个抽象，所以我们要了解 Go slice 就得先了解 Go arrays。

Array 类型由一个 lenght 以及 element type 定义。例如，`[4]int` 代表长度为4的 int array。Array 的size 是 fixed。长度是类型的一部分，所以 `[4]int` 以及 `[5]int` 代表了两个 Array type。

Array 内的 element 可以通过 index 访问，从 0 开始。

```go
var a [4]int
a[0] = 1
i := a[0]
// i == 1
```

Array 不需要显示的初始化；例如 int array 的默认值都为 0.

在内存中 `[4]int` 的仅仅是四个连续的 int 块：

![go-slices-usage-and-internals_slice-array](https://blog.golang.org/go-slices-usage-and-internals_slice-array.png)

Go 的 array 是值，一个 Array 变量代表了整个 array，而不是像 c 一样，一个 array 变量只是只想第一个元素的指针。这意味着当你赋值或者在函数之间传递 array 时，这个 array 会被 copy 一份。（如果想要避免 copy，你可以传递一个指向 array 的指针）。一种想象 Go array 的方式是将它想象成一个一种特殊的使用索引的数据结构，它使用索引来作为 field 并且每一个元素的大小相同。

一个字符串 array 可以这样指定：

```go
b := [2]string{"Penn", "Teller"}
```

或者你可以让编译器帮你计算出元素的个数：

```go
b := [...]string{"Penn", "Teller"}
```

上面这两种写法编译出来是一样的，都是 `[2]string` 类型。

## Slices

Array 有自己的用途，但是它们太不灵活了，所以你不会经常在 Go 的代码中看到 array type。但是你可以经常在代码中看到 Slice type。Slice 是在 array 的基础上构建的，它更加强大和方便。

通常描述一个 slice 的方式是 `[]T`， T指的 element type。不像 Array，它不需要指定长度。

一个字符串的 slice 和 array 类似，只需要将长度去掉：

```go
letters := []string{"a", "b", "c", "d"}
```

Slice 还可以由函数 `make()` 创建，这个函数的 signature 是：

```go
func make([]T, len, cap) []T
```

T 代表着 element type。`make()` 函数需要三个参数，类型，长度以及可选参数 capacity。调用时，make 在内存中分配一个 array 并且返回一个引用这个 array 的 slice。

```go
var s []byte
s = make([]byte, 5, 5)
// s == []byte{0, 0, 0, 0, 0}
```

当 capacity 参数忽略时，默认为指定的长度。与上面代码效果相同的简洁（succinct）版本是：

```go
s := make([]byte, 5)
```

可以使用内置的函数`len()` 和`cap()`来查看一个 slice 的长度与 capacity：

```go
len(s) == 5
cap(s) == 5
```

> capacity 指的是实际分配的内存大小，长度指已经使用的内存。

下面两节讨论了长度与 capacity 的关系。

slice 的 zero value 是 `nil` 。对于一个 `nil` slice，`len()` 和 `cap()` 都会返回 0。

slice 也可以通过 ”slicing“ 现有的切片来得到。切片操作可以指定一个半开的范围来进行获取，由冒号隔开。例如 `b[1:4]` 创建一个新的 slice 包含 `b` 的 1 到 3 的index。

slicing 中的 index 是可以省略的，省略代表开头或结尾：

```go
// b[:2] == []byte{'g', 'o'}
// b[2:] == []byte{'l', 'a', 'n', 'g'}
// b[:] == b
```

同样也可以从现有的 array 中 slicing 一个 slice 出来：

```go
x := [3]string{"Лайка", "Белка", "Стрелка"}
s := x[:] // a slice referencing the storage of x
```

## Slice internals

Slice 是对一个 array 的描述。他包含一个指向 array 的指针，array 的 length 以及 capacity。

![go-slices-usage-and-internals_slice-struct](https://blog.golang.org/go-slices-usage-and-internals_slice-struct.png)

我们之前定义的变量 s `make([]byte, 5)` 在内存中是这样的：

![go-slices-usage-and-internals_slice-1](https://blog.golang.org/go-slices-usage-and-internals_slice-1.png)

长度 Length 代表 slice 引用的 elements 的个数。Capacity 是所引用的 array 中的 elements 数量。

下面我们会明确长度和容量 capacity 的区别。

当我们 slicing 变量 s 的时候，我们可以看到内存中 slice 的变化以及 slice 和 array 关系的变化：

```go
s = s[2:4]
```

![go-slices-usage-and-internals_slice-2](https://blog.golang.org/go-slices-usage-and-internals_slice-2.png)

Slicing 并没有复制数据。它仅仅是创建一个新的 slice 并且指向了之前 slice 引用的 array。正是由于这个原因让 slice 变得非常高效。因此，修改一个 slice的值的时候会导致 源 slice 值也会改变：

```go
d := []byte{'r', 'o', 'a', 'd'}
e := d[2:] 
// e == []byte{'a', 'd'}
e[1] = 'm'
// e == []byte{'a', 'm'}
// d == []byte{'r', 'o', 'a', 'm'}
```

之前我们将变量 s 切成了比容量capacity 短的长度，我们可以通过再次切片来再次扩大他的容量：

```go
s = s[:cap(s)]
```

![go-slices-usage-and-internals_slice-3](https://blog.golang.org/go-slices-usage-and-internals_slice-3.png)

一个 Slice 不能变的比容量 Capacity 还大。如果尝试在 slicing 的时候使用超过 Capacity 的index，会导致一个 runtime panic。而且，slice 也不能通过负的 index 来访问 slicing 之前的 element。

## Growing slices 

如果需要增加一个 slice 的 capacity，需要创建一个新的 slice 并且将之前的值拷贝到新的 slice。这种方法也是其他语言中的动态数组的实现。下面这个例子展示了这个过程：

```go
t := make([]byte, len(s), (cap(s)+1)*2) // +1 in case cap(s) == 0
for i := range s {
        t[i] = s[i]
}
s = t
```

内置的 `copy()` 函数会让这个过程变得简单。`copy()` 函数会将数据从源 slice 复制到 目标 slice并且返回复制的 element size：

```go
func copy(dst, src []T) int
```

`copy()` 支持在不同 size 的 slize 之间复制，以最小的 slice 为准。并且它还会识别源 slice 以及目标 slice 重叠的部分以提高性能：

```go
t := make([]byte, len(s), (cap(s)+1)*2)
copy(t, s)
s = t
```

还有一个常用的操作是在 slice 的最后添加一个新的值。`append()` 函数用来实现这个功能。这个函数会添加 element 到一个 slice，并且会根据需要增大 slice 的 capacity，并且返回新的 slice：

```go
func AppendByte(slice []byte, data ...byte) []byte {
    m := len(slice)
    n := m + len(data)
    if n > cap(slice) { // if necessary, reallocate
        // allocate double what's needed, for future growth.
        newSlice := make([]byte, (n+1)*2)
        copy(newSlice, slice)
        slice = newSlice
    }
    slice = slice[0:n]
    copy(slice[m:n], data)
    return slice
}
```

使用时：

```go
p := []byte{2, 3, 5}
p = AppendByte(p, 7, 11, 13)
// p == []byte{2, 3, 5, 7, 11, 13}
```

类似于 `AppendByte` 这样的函数非常有用，因为它们可以控制 slice 增长的方式。提高程序的定制性。有时候你可能想要分配跟小或者更大的块或者对新分配的内存设置上限。

但是大多数程序并不需要这样的控制，所以 Go 提供了内置的 `append()` 函数：

```go
func append(s []T, x ...T) []T
```

它将 element x 添加到 slice 的最后并且在需要时增加 capacity。

```go
a := make([]int, 1)
// a == []int{0}
a = append(a, 1, 2, 3)
// a == []int{0, 1, 2, 3}
```

要将一个 slice append 到另一个 slice 中，使用 `...`来扩展：

```go
a := []string{"John", "Paul"}
b := []string{"George", "Ringo", "Pete"}
a = append(a, b...) // equivalent to "append(a, b[0], b[1], b[2])"
// a == []string{"John", "Paul", "George", "Ringo", "Pete"}
```

zero value of slice is  `nil`， 所以你可以首先创建一个 nil slice，并 append element 到这个 slice 中。 

```go
// Filter returns a new slice holding only
// the elements of s that satisfy fn()
func Filter(s []int, fn func(int) bool) []int {
    var p []int // == nil
    for _, v := range s {
        if fn(v) {
            p = append(p, v)
        }
    }
    return p
}
```

## A possible "gotcha" (陷阱)

之前提到过，slicing 操作并不会复制出一个新的 array。之前的 array 仍然保存在内存中虽然有些 element 已经不再被引用了。这可能导致程序仅仅需要 slicing 出来的一小部分数据时，原来的数据还占用着内存。

例如 `FindDigits` 函数将一个文件加载到内存并且查找第一组连续的数字，并且使用一个 slice 返回它们。

```go
var digitRegexp = regexp.MustCompile("[0-9]+")

func FindDigits(filename string) []byte {
    b, _ := ioutil.ReadFile(filename)
    return digitRegexp.Find(b)
}
```

代码运行并没有问题，但是返回的 `[]byte` 指向了一个包含整个文件的 array。这样的话垃圾回收机制也无法回收整个 array，要解决这种问题可以 复制出一个新的 slice：

```go
func CopyDigits(filename string) []byte {
    b, _ := ioutil.ReadFile(filename)
    b = digitRegexp.Find(b)
    c := make([]byte, len(b))
    copy(c, b)
    return c
}
```

你也可以使用 append来构建一个更简洁的版本。

## More 

[Effective Go](https://golang.org/doc/effective_go.html) 描述了对 array 和 slice 深入理解。 Go [language specification](https://golang.org/doc/go_spec.html) defines [slices](https://golang.org/doc/go_spec.html#Slice_types) and their [associated](https://golang.org/doc/go_spec.html#Length_and_capacity) [helper](https://golang.org/doc/go_spec.html#Making_slices_maps_and_channels) [functions](https://golang.org/doc/go_spec.html#Appending_and_copying_slices).






