import { FluxPack, IEnvironment } from '@youwol/flux-core'
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AUTO_GENERATED } from '../auto_generated'


export var pmp

export function install(environment: IEnvironment){

    let resource = `${AUTO_GENERATED.name}#${AUTO_GENERATED.version}~assets/pmp.js`
    return environment.fetchJavascriptAddOn([
        resource
    ]).pipe( 
        tap( (assets) => {
            environment.workerPool.import({
                sources: [{
                    id: resource,
                    src: assets[0].src,
                    import: (workerScope, src) => {
                        var PmpModule
                        eval(src)
                        workerScope.PmpModule = PmpModule
                    },
                    sideEffects: (workerScope) => {
                        return new Promise<void>( (resolve, reject) => { 
                            workerScope.PmpModule.onRuntimeInitialized = () => {
                                resolve()
                            }
                        })
                    }
                }],
                functions: [],
                variables: []
            })
        }),
        mergeMap( () => {
            return new Observable(subscriber => {
                window["PmpModule"]['onRuntimeInitialized'] = () => { subscriber.next(true); subscriber.complete(); }
              });
        }),
        tap( () => pmp = window["PmpModule"] )
    )
}

export let pack = new FluxPack({
    ...AUTO_GENERATED,
    ...{
        install
    }
})

