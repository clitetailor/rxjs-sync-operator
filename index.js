import { ReplaySubject, Subject, Observable } from 'rxjs'

export function sync() {
  return source => {
    const proxy = new Subject()

    source.subscribe(proxy)

    return new Observable(observer => proxy.subscribe(observer))
  }
}

export function syncReplay(...args) {
  return source => {
    const proxy = new ReplaySubject(...args)

    source.subscribe(proxy)

    return new Observable(observer => proxy.subscribe(observer))
  }
}
