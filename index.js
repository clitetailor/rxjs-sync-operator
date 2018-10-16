import { ReplaySubject, Subject, Observable } from 'rxjs'

export function sync() {
  return source => {
    const proxy = new Subject()

    const sourceSubscription = source.subscribe(
      val => proxy.next(val),
      e => proxy.error(e),
      () => {
        sourceSubscription.unsubscribe()
        proxy.complete()
      }
    )

    return new Observable(observer => proxy.subscribe(observer))
  }
}

export function syncAndReplay(...args) {
  return source => {
    const proxy = new ReplaySubject(...args)

    const sourceSubscription = source.subscribe(
      val => proxy.next(val),
      e => proxy.error(e),
      () => {
        sourceSubscription.unsubscribe()
        proxy.complete()
      }
    )

    return new Observable(observer => proxy.subscribe(observer))
  }
}
