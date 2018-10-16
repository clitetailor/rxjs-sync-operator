import { of } from 'rxjs'
import {
  delay,
  map,
  reduce,
  concat,
  concatMap
} from 'rxjs/operators'

import { syncReplay, sync } from '../index'

const reduceAll = () =>
  reduce((acc, next) => acc.concat([next]), [])

const reportError = e => expect(e).not.toBeDefined()

test('should evaluate all the previous emitted values', done => {
  of(1, 2, 3, 4, 5)
    .pipe(
      sync(),
      reduceAll()
    )
    .subscribe(
      values => expect(values).toEqual([]),
      reportError,
      done
    )
})

test('should keep lazy emitted value', done => {
  of(1, 2, 3, 4)
    .pipe(
      concat(of(5, 6).pipe(delay(100))),
      sync(),
      reduceAll()
    )
    .subscribe(
      values => expect(values).toEqual([5, 6]),
      reportError,
      done
    )
})

test('should replay last two values only', done => {
  of(1, 2, 3, 4)
    .pipe(
      syncReplay(2),
      reduceAll()
    )
    .subscribe(
      values => expect(values).toEqual([3, 4]),
      reportError,
      done
    )
})

test('should execute inner Observables in parallel', done => {
  const origin = Date.now()

  of(3, 1, 5)
    .pipe(
      map(val => of(val).pipe(delay(val * 100))),
      map(syncReplay()),
      concatMap(stream => stream),
      map(value => ({
        time: Math.round((Date.now() - origin) / 100),
        value
      })),
      reduceAll()
    )
    .subscribe(
      values => {
        expect(values).toEqual([
          { time: 3, value: 3 },
          { time: 3, value: 1 },
          { time: 5, value: 5 }
        ])
      },
      reportError,
      done
    )
})
