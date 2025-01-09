const MyPromise = require('./MyPromise')

const triggerAsyncBehavior = async () => {
    await new Promise(setImmediate);
};

describe('promises', () => {
    it('is initially pending', () => {
        const promise = new MyPromise((res, rej) => { });
        expect(promise.state).toEqual('pending');
    });

    it('can be resolved to a value', () => {
        const promise = new MyPromise((res, rej) => {
            res(10);
        });
        expect(promise.state).toEqual('fulfilled');
        expect(promise.value).toEqual(10);
    });

    it('can be rejected to a value', () => {
        const promise = new MyPromise((res, rej) => {
            rej(10);
        });
        expect(promise.state).toEqual('rejected');
        expect(promise.value).toEqual(10);
    });

    it('throwing an error in executor rejects the promise with thrown value', () => {
        const promise = new MyPromise((res, rej) => {
            throw 'my error';
        });
        expect(promise.state).toEqual('rejected');
        expect(promise.value).toEqual('my error');
    });

    it('then is called after resolving', async () => {
        let resolvedVal;
        const promise = new MyPromise((res, rej) => {
            res(10);
        }).then(val => {
            resolvedVal = val;
        });
        await triggerAsyncBehavior();
        expect(resolvedVal).toEqual(10);
    });

    it('then is called after rejecting', async () => {
        let resolvedVal;
        let rejectedVal;
        const promise = new MyPromise((res, rej) => {
            rej(10);
        }).then(
            val => {
                resolvedVal = val;
            },
            val => {
                rejectedVal = val;
            },
        );
        await triggerAsyncBehavior();
        expect(resolvedVal).toBeUndefined();
        expect(rejectedVal).toEqual(10);
    });

    it('then is called asynchronously', async () => {
        let resolvedVal;
        const promise = new MyPromise((res, rej) => {
            res(10);
        }).then(val => {
            resolvedVal = val;
        });
        expect(resolvedVal).toBeUndefined();
        await triggerAsyncBehavior();
        expect(resolvedVal).toEqual(10);
    });

    it('catch is called after rejecting', async () => {
        let resolvedVal;
        let rejectedVal;
        const promise = new MyPromise((res, rej) => {
            rej(10);
        })
            .then(val => {
                resolvedVal = val;
            })
            .catch(val => {
                rejectedVal = val;
            });
        await triggerAsyncBehavior();
        expect(resolvedVal).toBeUndefined();
        expect(rejectedVal).toEqual(10);
    });

    it('catch is called asynchronously', async () => {
        let rejectedVal;
        const promise = new MyPromise((res, rej) => {
            rej(10);
        }).catch(val => {
            rejectedVal = val;
        });
        expect(rejectedVal).toBeUndefined();
        await triggerAsyncBehavior();
        expect(rejectedVal).toEqual(10);
    });

    it('then can be chained', async () => {
        let resolvedVals = [];
        const promise = new MyPromise((res, rej) => {
            res(10);
        })
            .then(val => {
                resolvedVals.push(val);
                return 15;
            })
            .then(val => {
                resolvedVals.push(val);
                return 20;
            })
            .then(val => {
                resolvedVals.push(val);
            });

        await triggerAsyncBehavior();
        expect(resolvedVals).toEqual([10, 15, 20]);
    });

    it('then and catch can be chained together', async () => {
        let resolvedVals = [];
        let rejectedVals = [];
        const promise = new MyPromise((res, rej) => {
            res(10);
        })
            .then(val => {
                resolvedVals.push(val);
                return 15;
            })
            .then(val => {
                resolvedVals.push(val);
                throw 20;
            })
            .catch(val => {
                rejectedVals.push(val);
                return 25;
            })
            .then(
                val => {
                    resolvedVals.push(val);
                },
                val => {
                    rejectedVals.push(val);
                },
            );

        await triggerAsyncBehavior();
        expect(resolvedVals).toEqual([10, 15, 25]);
        expect(rejectedVals).toEqual([20]);
    });

    it('throwing an error in a then callback rejects the promise', async () => {
        let rejectedVal;
        const promise = new MyPromise((res, rej) => {
            res(10);
        })
            .then(val => {
                throw val * 2;
            })
            .catch(val => {
                rejectedVal = val;
            });

        await triggerAsyncBehavior();
        expect(rejectedVal).toEqual(20);
    });

    it('throwing an error in a catch callback rejects the promise', async () => {
        let rejectedVal;
        const promise = new MyPromise((res, rej) => {
            rej(10);
        })
            .catch(val => {
                throw val * 2;
            })
            .catch(val => {
                rejectedVal = val;
            });

        await triggerAsyncBehavior();
        expect(rejectedVal).toEqual(20);
    });

    it('then without callbacks can be passed through', async () => {
        let resolvedVal;
        const promise = new MyPromise((res, rej) => {
            res(10);
        })
            .then()
            .then(val => {
                resolvedVal = val;
            });

        await triggerAsyncBehavior();
        expect(resolvedVal).toEqual(10);
    });

    it('then can be called multiple times on the same promise', async () => {
        let resolvedVals = [];
        const promise = new MyPromise((res, rej) => {
            res(10);
        });

        promise.then(val => {
            resolvedVals.push(val);
        });
        promise.then(val => {
            resolvedVals.push(val * 2);
        });

        await triggerAsyncBehavior();
        expect(resolvedVals).toEqual([10, 20]);
    });

    it('catch without callbacks can be passed through', async () => {
        let rejectedVal;
        const promise = new MyPromise((res, rej) => {
            rej(10);
        })
            .catch()
            .catch(val => {
                rejectedVal = val;
            });

        await triggerAsyncBehavior();
        expect(rejectedVal).toEqual(10);
    });

    it('chained callbacks are not called until previous one returns', async () => {
        let resolve;
        let resolvedVal;
        const promise = new MyPromise((res, rej) => {
            resolve = res;
        }).then(val => {
            resolvedVal = val;
        });
        await triggerAsyncBehavior();
        expect(resolvedVal).toEqual(undefined);
        resolve(5);
        await triggerAsyncBehavior();
        expect(resolvedVal).toEqual(5);
    });

    it('does not use native Promise object', () => {
        function throwAttemptedToUsePromise() {
            throw new Error('Attempted to use native Promise');
        }

        Promise = throwAttemptedToUsePromise;
        Promise.resolve = throwAttemptedToUsePromise;
        Promise.reject = throwAttemptedToUsePromise;
        const promise = new MyPromise((res, rej) => {
            res(10);
        })
            .then(val => val * 2)
            .then(val => {
                throw val;
            })
            .catch(val => { });
    });
});