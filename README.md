# RxJS sync

## Motivation

Following this article: [Practical RxJS In The Wild 🦁— Requests with concatMap() vs mergeMap() vs forkJoin() 🥊](https://blog.angularindepth.com/practical-rxjs-in-the-wild-requests-with-concatmap-vs-mergemap-vs-forkjoin-11e5b2efe293)

RxJS Observable and concatMap operator are both lazy. `concatMap` only subscribe to new stream when the previous stream has been completed. Meanwhile, when making sequential HTTP requests, we usually want to execute HTTP requests in parallel but preserve the results order. `sync` and `syncReplay` were created to solve such problem like these. `syncReplay` evaluate Observable directly without any additional subscription; and then, stores the values for future subscriptions:

```jsx
from(ids)
  .pipe(
    map(id => ajax.get(`/news/${id}`)),
    map(syncReplay())
    concatMap(stream => stream)
  )
  .subscribe(article => {})
```

## Example

Given an Observable of Observables. The first stream delay 3s before emitting 3. The second stream delay 1s before emitting 1. And so on the last stream delay 5s before emitting 5.

```jsx
const input$ = of(3, 1, 5).pipe(map(val => delay(val * 1000)))
/**
 * Expected output:
 * - Timer: 3s; Output: 3, 1
 * - Timer: 5s; Output: 5
 */
```

The expected output is: All the three streams execute in parallel. The stream of 1 is emitted first due to the low latency, but still have to wait for the stream of 3 to emit first to preserve the results order.

Using `mergeMap`, streams are executed in parallel but the output order is not preserved:

```jsx
const origin = Date.now()

input$
  .pipe(
    mergeMap(stream => stream),
    map(value => ({
      time: Math.round((Date.now() - origin) / 1000),
      value
    })),
    reduce((acc, next) => acc.concat([next]), [])
  )
  .subscribe(val => console.log(val))

// [ { time: 1, value: 1 },
//   { time: 3, value: 3 },
//   { time: 5, value: 5 } ]
```

Using `concatMap`, the output order is preserved but a stream always have to wait until the previous stream to finish before it can be executed:

```jsx
input$
  .pipe(
    concatMap(stream => stream),
    map(value => ({
      time: Math.round((Date.now() - origin) / 1000),
      value
    })),
    reduce((acc, next) => acc.concat([next]), [])
  )
  .subscribe(val => console.log(val))
// [ { time: 3, value: 3 },
//   { time: 4, value: 1 },
//   { time: 9, value: 5 } ]
```

Using `concatMap` with `syncReplay`, inner Observables will be evaluated, sync with the source stream and run in parallel:

```jsx
input$
  .pipe(
    map(syncReplay()),
    concatMap(stream => stream),
    map(value => ({
      time: Math.round((Date.now() - origin) / 1000),
      value
    })),
    reduce((acc, next) => acc.concat([next]), [])
  )
  .subscribe(val => console.log(val))
// [ { time: 3, value: 3 },
//   { time: 3, value: 1 },
//   { time: 5, value: 5 } ]
```

## API Reference

### sync

`sync` evaluate all the previously emitted values in an Observable.

```jsx
of(1, 2, 3, 4)
  .pipe(
    concat(of(5).pipe(delay(1000))),
    sync()
  )
  .subscribe(val => console.log(val))
// Output: 5
```

### syncReplay

`syncReplay` works the same way with `sync` but a number of values are kept and replay on target stream.

```jsx
of(1, 2, 3, 4)
  .pipe(syncReplay(2))
  .subscribe(val => console.log(val))
// Output: 3, 4
```

## Different with `share` and `shareReplay`

`share` and `shareReplay` only evaluate on the first subscription. `sync` and `syncReplay` evaluate the Observable directly without waiting for the first subscription.

## Handling Error

Handling error for sequential HTTP requests:

```jsx
clicks.pipe(
  map(
    () =>
      ajax
        .get('api')
        .pipe(catchError(error => of(fallbackValue)))
    // Return an Observable that will be evaluated with `syncReplay`
  ),
  map(syncReplay()),
  concatMap(stream => stream)
)
```

## Pair source stream with result stream

Pair value by value:

```jsx
zip(source$, result$).pipe(
  map((source, result) => ({ source, result }))
)
```

Or in a safer way:

```jsx
clicks.pipe(
  map(
    source =>
      ajax.get('api').pipe(
        map(result => ({ source, result })),
        catchError(error => of(fallbackValue))
      ) // Return an Observable that will be evaluated with `syncReplay`
  ),
  map(syncReplay()),
  concatMap(stream => stream)
)
```
